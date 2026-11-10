import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Calendar,
  Users,
  DoorOpen,
  Building2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ArrowUpRight,
  Filter,
  Sparkles,
  Layers,
  Activity,
  CalendarDays,
  Search,
  ExternalLink,
  ChevronRight,
  History,
} from 'lucide-react';
import { Room, Booking, Department } from '../types';
import {
  formatDateToISO,
  formatFriendlyDate,
  timeToMinutes,
  formatDisplayName,
  TIME_SLOTS,
  formatRegistrationDateTime,
} from '../utils/dateUtils';

interface AdminDashboardProps {
  rooms: Room[];
  bookings: Booking[];
  departments: Department[];
  selectedDate: string;
  onBookingClick: (booking: Booking, room: Room) => void;
  onNavigateTab: (tab: 'rooms' | 'bookings' | 'blocks' | 'anomalies' | 'backup' | 'departments') => void;
  unitName?: string;
}

type PeriodFilter = 'today' | 'week' | 'month' | 'all';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  rooms,
  bookings,
  departments,
  selectedDate,
  onBookingClick,
  onNavigateTab,
  unitName,
}) => {
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const todayISO = useMemo(() => formatDateToISO(new Date()), []);

  // Compute date ranges
  const currentMonthISO = useMemo(() => todayISO.substring(0, 7), [todayISO]); // YYYY-MM

  // Helper to check if a booking is in current week
  const isInCurrentWeek = (dateStr: string): boolean => {
    const today = new Date();
    const curr = new Date(today);
    const day = curr.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    curr.setDate(curr.getDate() + diffToMonday);
    curr.setHours(0, 0, 0, 0);

    const endWeek = new Date(curr);
    endWeek.setDate(endWeek.getDate() + 4); // Friday
    endWeek.setHours(23, 59, 59, 999);

    const [y, m, d] = dateStr.split('-').map(Number);
    const targetDate = new Date(y, m - 1, d);

    return targetDate >= curr && targetDate <= endWeek;
  };

  // Filtered bookings based on period and room
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Period filter
      let matchesPeriod = true;
      if (period === 'today') {
        matchesPeriod = b.date === (selectedDate || todayISO);
      } else if (period === 'week') {
        matchesPeriod = isInCurrentWeek(b.date);
      } else if (period === 'month') {
        matchesPeriod = b.date.startsWith(currentMonthISO);
      } // 'all' matches all

      if (!matchesPeriod) return false;

      // Room filter
      if (selectedRoomFilter !== 'all' && b.roomId !== selectedRoomFilter) {
        return false;
      }

      return true;
    });
  }, [bookings, period, selectedDate, todayISO, currentMonthISO, selectedRoomFilter]);

  // Overall calculations
  const totalBookings = filteredBookings.length;

  const totalMinutes = useMemo(() => {
    return filteredBookings.reduce((sum, b) => {
      const start = timeToMinutes(b.startTime);
      const end = timeToMinutes(b.endTime);
      return sum + Math.max(0, end - start);
    }, 0);
  }, [filteredBookings]);

  const totalHours = totalMinutes / 60;
  const hoursFormatted = `${Math.floor(totalHours)}h ${Math.round((totalHours % 1) * 60)}m`;

  const normalBookings = useMemo(() => filteredBookings.filter((b) => !b.isBlock), [filteredBookings]);
  const blockBookings = useMemo(() => filteredBookings.filter((b) => b.isBlock), [filteredBookings]);

  // Unique users & departments
  const uniqueUsers = useMemo(() => {
    const set = new Set(filteredBookings.map((b) => b.userName.trim().toUpperCase()));
    set.delete('');
    return set.size;
  }, [filteredBookings]);

  // Rooms status counts
  const activeRooms = rooms.filter((r) => r.status === 'active');
  const maintenanceRooms = rooms.filter((r) => r.status === 'maintenance');
  const lockedRooms = rooms.filter((r) => r.status === 'locked');

  // Approximate occupancy rate calculation (Operating 10 hours/day: 08:00 to 18:00)
  const occupancyRate = useMemo(() => {
    const activeCount = Math.max(1, activeRooms.length);
    let daysCount = 22; // working days in a month default
    if (period === 'today') daysCount = 1;
    else if (period === 'week') daysCount = 5;
    else if (period === 'all') daysCount = Math.max(1, Math.ceil(bookings.length / 5));

    const totalPotentialHours = activeCount * 10 * daysCount;
    if (totalPotentialHours === 0) return 0;
    const rate = Math.round((totalHours / totalPotentialHours) * 100);
    return Math.min(100, Math.max(0, rate));
  }, [activeRooms.length, period, bookings.length, totalHours]);

  // Room usage breakdown
  const roomStats = useMemo(() => {
    return rooms.map((room) => {
      const roomBookings = filteredBookings.filter((b) => b.roomId === room.id);
      const mins = roomBookings.reduce((acc, b) => {
        return acc + Math.max(0, timeToMinutes(b.endTime) - timeToMinutes(b.startTime));
      }, 0);
      const hrs = mins / 60;
      return {
        room,
        count: roomBookings.length,
        hours: hrs,
        hoursFormatted: `${Math.floor(hrs)}h ${Math.round((hrs % 1) * 60)}m`,
      };
    }).sort((a, b) => b.hours - a.hours);
  }, [rooms, filteredBookings]);

  // Department usage breakdown
  const departmentStats = useMemo(() => {
    const map = new Map<string, { count: number; hours: number }>();

    filteredBookings.forEach((b) => {
      const dept = b.userDepartment || 'Geral / Outros';
      const duration = (timeToMinutes(b.endTime) - timeToMinutes(b.startTime)) / 60;
      const current = map.get(dept) || { count: 0, hours: 0 };
      map.set(dept, {
        count: current.count + 1,
        hours: current.hours + duration,
      });
    });

    const list = Array.from(map.entries()).map(([dept, data]) => ({
      name: dept,
      count: data.count,
      hours: data.hours,
      hoursFormatted: `${Math.floor(data.hours)}h ${Math.round((data.hours % 1) * 60)}m`,
      percentage: totalBookings > 0 ? Math.round((data.count / totalBookings) * 100) : 0,
    }));

    return list.sort((a, b) => b.count - a.count);
  }, [filteredBookings, totalBookings]);

  // Peak hours analysis (from 08:00 to 18:00)
  const hourlyDemand = useMemo(() => {
    const slots = [
      '08:00', '09:00', '10:00', '11:00', '12:00',
      '13:00', '14:00', '15:00', '16:00', '17:00'
    ];

    return slots.map((slot) => {
      const slotStart = timeToMinutes(slot);
      const slotEnd = slotStart + 60;

      const count = filteredBookings.filter((b) => {
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        return Math.max(bStart, slotStart) < Math.min(bEnd, slotEnd);
      }).length;

      return {
        slot,
        label: `${slot} - ${String(Number(slot.split(':')[0]) + 1).padStart(2, '0')}:00`,
        count,
      };
    });
  }, [filteredBookings]);

  const maxHourlyCount = useMemo(() => {
    return Math.max(1, ...hourlyDemand.map((h) => h.count));
  }, [hourlyDemand]);

  const peakHour = useMemo(() => {
    let max = hourlyDemand[0];
    for (const h of hourlyDemand) {
      if (h.count > (max?.count || 0)) {
        max = h;
      }
    }
    return max;
  }, [hourlyDemand]);

  // Real-time Room Status for today
  const liveRoomStatuses = useMemo(() => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const todayBookings = bookings.filter((b) => b.date === todayISO);

    return rooms.map((room) => {
      if (room.status === 'maintenance') {
        return {
          room,
          status: 'maintenance' as const,
          label: 'Em Manutenção',
          detail: room.maintenanceReason || 'Manutenção programada',
        };
      }
      if (room.status === 'locked') {
        return {
          room,
          status: 'locked' as const,
          label: 'Interditada',
          detail: room.maintenanceReason || 'Interditada pela administração',
        };
      }

      // Check current booking
      const currentBooking = todayBookings.find((b) => {
        if (b.roomId !== room.id) return false;
        const s = timeToMinutes(b.startTime);
        const e = timeToMinutes(b.endTime);
        return currentMins >= s && currentMins < e;
      });

      if (currentBooking) {
        return {
          room,
          status: 'occupied' as const,
          label: 'Ocupada Agora',
          booking: currentBooking,
          detail: `${formatDisplayName(currentBooking.userName)} (${currentBooking.userDepartment || 'Setor'}) • até ${currentBooking.endTime}`,
        };
      }

      // Look for next upcoming booking today
      const upcoming = todayBookings
        .filter((b) => b.roomId === room.id && timeToMinutes(b.startTime) > currentMins)
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))[0];

      if (upcoming) {
        return {
          room,
          status: 'available' as const,
          label: 'Disponível Agora',
          detail: `Próxima reserva às ${upcoming.startTime} (${formatDisplayName(upcoming.userName)})`,
        };
      }

      return {
        room,
        status: 'available' as const,
        label: 'Disponível Agora',
        detail: 'Livre pelo restante do dia',
      };
    });
  }, [rooms, bookings, todayISO]);

  // Recent / Upcoming bookings list with search
  const displayBookings = useMemo(() => {
    return filteredBookings
      .filter((b) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const room = rooms.find((r) => r.id === b.roomId);
        return (
          b.userName.toLowerCase().includes(q) ||
          (b.userDepartment && b.userDepartment.toLowerCase().includes(q)) ||
          (room && room.name.toLowerCase().includes(q)) ||
          b.date.includes(q)
        );
      })
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.startTime.localeCompare(a.startTime);
      })
      .slice(0, 10);
  }, [filteredBookings, searchQuery, rooms]);

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="p-4 sm:p-5 rounded-3xl neu-flat border border-[var(--border-subtle)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-[var(--text-primary)] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#E60026] dark:text-[#FF2B4D]" />
              Painel de Indicadores & Métricas
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E60026]/10 text-[#E60026] dark:text-[#FF2B4D] border border-[#E60026]/20 dark:border-[#FF2B4D]/20">
              Tempo Real
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Visão gerencial consolidada das salas e ocupação na Unidade {unitName || 'Belém'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period Pills */}
          <div className="flex items-center p-1 rounded-2xl neu-pressed-sm border border-[var(--border-subtle)]">
            {[
              { id: 'today' as PeriodFilter, label: 'Hoje' },
              { id: 'week' as PeriodFilter, label: 'Esta Semana' },
              { id: 'month' as PeriodFilter, label: 'Este Mês' },
              { id: 'all' as PeriodFilter, label: 'Geral' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  period === p.id
                    ? 'bg-[#E60026] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Room Filter Dropdown */}
          <select
            value={selectedRoomFilter}
            onChange={(e) => setSelectedRoomFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold neu-flat-sm text-[var(--text-primary)] border border-[var(--border-subtle)] outline-none cursor-pointer focus:border-[#E60026]"
          >
            <option value="all">Todas as Salas ({rooms.length})</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 6 Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* KPI 1: Total Bookings */}
        <div className="p-4 rounded-3xl neu-flat border border-[var(--border-subtle)] flex flex-col justify-between hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)]">Agendamentos</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-300 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[var(--text-primary)]">{totalBookings}</div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 flex items-center gap-1">
              <span className="text-emerald-800 dark:text-emerald-300 font-bold">{normalBookings.length} normais</span>
              <span>•</span>
              <span className="text-amber-800 dark:text-amber-300 font-bold">{blockBookings.length} bloq.</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Hours */}
        <div className="p-4 rounded-3xl neu-flat border border-[var(--border-subtle)] flex flex-col justify-between hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)]">Horas em Uso</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[var(--text-primary)]">{hoursFormatted}</div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              {totalBookings > 0
                ? `Média de ${(totalHours / totalBookings).toFixed(1)}h/reserva`
                : 'Sem uso no período'}
            </div>
          </div>
        </div>

        {/* KPI 3: Occupancy Rate */}
        <div className="p-4 rounded-3xl neu-flat border border-[var(--border-subtle)] flex flex-col justify-between hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)]">Taxa Ocupação</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-800 dark:text-emerald-300">{occupancyRate}%</div>
            <div className="w-full bg-[var(--border-subtle)] h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-emerald-600 dark:bg-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 4: Active Rooms */}
        <div className="p-4 rounded-3xl neu-flat border border-[var(--border-subtle)] flex flex-col justify-between hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)]">Salas Ativas</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-800 dark:text-sky-300 flex items-center justify-center">
              <DoorOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[var(--text-primary)]">
              {activeRooms.length}
              <span className="text-xs font-semibold text-[var(--text-secondary)]">
                /{rooms.length}
              </span>
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              {maintenanceRooms.length > 0 ? (
                <span className="text-amber-800 dark:text-amber-300 font-bold">{maintenanceRooms.length} manutenção</span>
              ) : (
                <span className="text-emerald-800 dark:text-emerald-300 font-bold">100% operacionais</span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 5: Solicitantes */}
        <div className="p-4 rounded-3xl neu-flat border border-[var(--border-subtle)] flex flex-col justify-between hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)]">Solicitantes</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-800 dark:text-purple-300 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[var(--text-primary)]">{uniqueUsers}</div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Colaboradores distintos
            </div>
          </div>
        </div>

        {/* KPI 6: Departamentos */}
        <div className="p-4 rounded-3xl neu-flat border border-[var(--border-subtle)] flex flex-col justify-between hover:scale-[1.02] transition-transform">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-secondary)]">Departamentos</span>
            <div className="w-8 h-8 rounded-xl bg-[#E60026]/15 text-[#E60026] dark:text-[#FF2B4D] flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[var(--text-primary)]">
              {departmentStats.length}
            </div>
            <div className="text-[11px] text-[var(--text-secondary)] mt-0.5 truncate">
              {departmentStats[0]?.name
                ? `Líder: ${departmentStats[0].name}`
                : 'Cadastrados'}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Status of All Rooms Today */}
      <div className="p-5 rounded-3xl neu-flat border border-[var(--border-subtle)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Status em Tempo Real das Salas (Hoje)
            </h4>
            <p className="text-xs text-[var(--text-secondary)]">
              Situação operacional instantânea de cada espaço da Unidade {unitName || 'Belém'}
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('rooms')}
            className="text-xs font-bold text-[#E60026] dark:text-[#FF2B4D] hover:underline flex items-center gap-1"
          >
            <span>Gerenciar Salas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {liveRoomStatuses.map((item) => {
            const isAvailable = item.status === 'available';
            const isOccupied = item.status === 'occupied';
            const isMaint = item.status === 'maintenance' || item.status === 'locked';

            return (
              <div
                key={item.room.id}
                className={`p-4 rounded-2xl neu-flat-sm border transition-all flex flex-col justify-between ${
                  isOccupied
                    ? 'border-rose-500/30 bg-rose-500/5'
                    : isAvailable
                    ? 'border-emerald-500/25 bg-emerald-500/5'
                    : 'border-amber-500/30 bg-amber-500/5'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="font-bold text-sm text-[var(--text-primary)]">
                        {item.room.name}
                      </h5>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        Capacidade: {item.room.capacity} pessoas
                      </p>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${
                        isOccupied
                          ? 'bg-rose-600 text-white border-rose-700 animate-pulse'
                          : isAvailable
                          ? 'bg-emerald-700 text-white border-emerald-800'
                          : 'bg-amber-700 text-white border-amber-800'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                      {item.label}
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] mt-2 font-medium">
                    {item.detail}
                  </p>
                </div>

                {isOccupied && item.booking && (
                  <button
                    onClick={() => onBookingClick(item.booking!, item.room)}
                    className="mt-3 w-full py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-800 dark:text-rose-300 text-[11px] font-bold transition-all text-center"
                  >
                    Ver Agendamento Atual
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Analytics Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Ocupação Comparativa por Sala */}
        <div className="p-5 rounded-3xl neu-flat border border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                Demanda por Sala ({period === 'today' ? 'Hoje' : period === 'week' ? 'Semana' : period === 'month' ? 'Mês' : 'Geral'})
              </h4>
              <p className="text-xs text-[var(--text-secondary)]">
                Horas acumuladas e volume de agendamentos por espaço
              </p>
            </div>
            {roomStats[0] && roomStats[0].count > 0 && (
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-600/30 dark:border-amber-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-700 dark:text-amber-400" />
                Líder: {roomStats[0].room.name}
              </span>
            )}
          </div>

          <div className="space-y-3 pt-1">
            {roomStats.map((stat, idx) => {
              const maxHours = Math.max(1, ...roomStats.map((s) => s.hours));
              const barPercent = Math.round((stat.hours / maxHours) * 100);

              return (
                <div key={stat.room.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <span className="w-4 text-[var(--text-secondary)] font-mono text-[11px]">
                        #{idx + 1}
                      </span>
                      {stat.room.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-[var(--text-primary)] font-mono">
                        {stat.hoursFormatted}
                      </span>
                      <span className="text-[11px] text-[var(--text-secondary)]">
                        ({stat.count} {stat.count === 1 ? 'reserva' : 'reservas'})
                      </span>
                    </div>
                  </div>

                  {/* Visual Bar */}
                  <div className="w-full h-2.5 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        idx === 0
                          ? 'bg-gradient-to-r from-[#E60026] to-[#FF2B4D]'
                          : idx === 1
                          ? 'bg-gradient-to-r from-sky-600 to-blue-500'
                          : 'bg-gradient-to-r from-slate-400 to-slate-300 dark:from-slate-600 dark:to-slate-500'
                      }`}
                      style={{ width: `${Math.max(4, barPercent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Distribuição por Departamento / Setor */}
        <div className="p-5 rounded-3xl neu-flat border border-[var(--border-subtle)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#E60026] dark:text-[#FF2B4D]" />
                Utilização por Departamento
              </h4>
              <p className="text-xs text-[var(--text-secondary)]">
                Participação de cada área da Unidade {unitName || 'Belém'}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('departments')}
              className="text-xs font-bold text-[#E60026] dark:text-[#FF2B4D] hover:underline flex items-center gap-1"
            >
              <span>Departamentos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {departmentStats.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-secondary)]">
                Nenhum agendamento encontrado para o período selecionado.
              </div>
            ) : (
              departmentStats.slice(0, 5).map((dept) => (
                <div key={dept.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--text-primary)] truncate max-w-[200px]">
                      {dept.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-[#E60026] dark:text-[#FF2B4D]">{dept.percentage}%</span>
                      <span className="text-[11px] text-[var(--text-secondary)]">
                        ({dept.count} agendamentos • {dept.hoursFormatted})
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all duration-700"
                      style={{ width: `${Math.max(4, dept.percentage)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Hourly Peak Demand Histogram */}
      <div className="p-5 rounded-3xl neu-flat border border-[var(--border-subtle)] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              Curva de Demanda por Horário (08:00 às 18:00)
            </h4>
            <p className="text-xs text-[var(--text-secondary)]">
              Concentração de reuniões ao longo do dia na Unidade {unitName || 'Belém'}
            </p>
          </div>
          {peakHour && peakHour.count > 0 && (
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-600/30 dark:border-amber-400/30">
              Pico: {peakHour.label} ({peakHour.count} agendamentos)
            </span>
          )}
        </div>

        {/* Vertical Bars Chart */}
        <div className="pt-4 grid grid-cols-5 sm:grid-cols-10 gap-2 items-end h-44 border-b border-[var(--border-subtle)] pb-2">
          {hourlyDemand.map((hour) => {
            const heightPercent = maxHourlyCount > 0 ? Math.round((hour.count / maxHourlyCount) * 100) : 0;
            const isPeak = hour.slot === peakHour?.slot && hour.count > 0;

            return (
              <div key={hour.slot} className="flex flex-col items-center h-full justify-end group">
                <span className="text-[10px] font-bold text-[var(--text-secondary)] mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {hour.count}
                </span>
                <div className="w-full max-w-[36px] bg-[var(--border-subtle)] rounded-t-xl overflow-hidden flex flex-col justify-end h-28">
                  <div
                    className={`w-full rounded-t-xl transition-all duration-500 ${
                      isPeak
                        ? 'bg-gradient-to-t from-[#E60026] to-[#FF2B4D] shadow-md'
                        : hour.count > 0
                        ? 'bg-gradient-to-t from-sky-600 to-sky-400'
                        : 'bg-transparent'
                    }`}
                    style={{ height: `${Math.max(hour.count > 0 ? 15 : 0, heightPercent)}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono font-bold text-[var(--text-primary)] mt-2">
                  {hour.slot}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent & Upcoming Bookings Table with Quick Filter */}
      <div className="p-5 rounded-3xl neu-flat border border-[var(--border-subtle)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              Agendamentos no Período Selecionado
            </h4>
            <p className="text-xs text-[var(--text-secondary)]">
              Lista dos {displayBookings.length} agendamentos mais recentes ou prioritários
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar solicitante ou sala..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl neu-pressed-sm text-xs text-[var(--text-primary)] border border-[var(--border-subtle)] outline-none w-48 sm:w-60 focus:border-[#E60026]"
              />
            </div>
            <button
              onClick={() => onNavigateTab('bookings')}
              className="px-3 py-1.5 rounded-xl neu-btn text-xs font-bold text-[#E60026] dark:text-[#FF2B4D] hover:text-[#C70020] dark:hover:text-[#FF526D]"
            >
              Ver Todos ({bookings.length})
            </button>
          </div>
        </div>

        {displayBookings.length === 0 ? (
          <div className="py-12 text-center text-xs text-[var(--text-secondary)]">
            Nenhum agendamento encontrado para os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  <th className="pb-2.5 font-bold">Data</th>
                  <th className="pb-2.5 font-bold">Horário</th>
                  <th className="pb-2.5 font-bold">Espaço / Sala</th>
                  <th className="pb-2.5 font-bold">Solicitante</th>
                  <th className="pb-2.5 font-bold">Departamento</th>
                  <th className="pb-2.5 font-bold text-sky-800 dark:text-sky-300">Cadastrado em</th>
                  <th className="pb-2.5 font-bold">Tipo</th>
                  <th className="pb-2.5 font-bold text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {displayBookings.map((b) => {
                  const room = rooms.find((r) => r.id === b.roomId);
                  const isToday = b.date === todayISO;

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-[var(--card-surface-subtle)] transition-colors group cursor-pointer"
                      onClick={() => room && onBookingClick(b, room)}
                    >
                      <td className="py-2.5 font-mono font-bold text-[var(--text-primary)]">
                        {b.date}
                        {isToday && (
                          <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold">
                            Hoje
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 font-mono font-bold text-[var(--text-primary)]">
                        {b.startTime} - {b.endTime}
                      </td>
                      <td className="py-2.5 font-bold text-[var(--text-primary)]">
                        {room?.name || 'Sala'}
                      </td>
                      <td className="py-2.5 font-bold text-[var(--text-primary)]">
                        {formatDisplayName(b.userName)}
                      </td>
                      <td className="py-2.5 text-[var(--text-secondary)]">
                        {b.userDepartment || '-'}
                      </td>
                      <td className="py-2.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-sky-800 dark:text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/20">
                          <History className="w-3 h-3 text-sky-700 dark:text-sky-300" />
                          <span>{formatRegistrationDateTime(b.createdAt)}</span>
                        </span>
                      </td>
                      <td className="py-2.5">
                        {b.isBlock ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-600/30 dark:border-amber-400/30">
                            Bloqueio
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-600/30 dark:border-emerald-500/30">
                            Reunião
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="px-2.5 py-1 rounded-xl neu-btn text-[11px] font-bold text-[#E60026] dark:text-[#FF2B4D] opacity-0 group-hover:opacity-100 transition-opacity">
                          Detalhes
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Administrative Action Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => onNavigateTab('rooms')}
          className="p-4 rounded-2xl neu-flat border border-[var(--border-subtle)] text-left hover:scale-[1.02] active:scale-95 transition-all group"
        >
          <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-800 dark:text-sky-300 flex items-center justify-center mb-2 group-hover:bg-sky-600 group-hover:text-white transition-colors">
            <DoorOpen className="w-4 h-4" />
          </div>
          <div className="text-xs font-black text-[var(--text-primary)]">Adicionar Sala</div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            Cadastrar ou editar salas
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('blocks')}
          className="p-4 rounded-2xl neu-flat border border-[var(--border-subtle)] text-left hover:scale-[1.02] active:scale-95 transition-all group"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-800 dark:text-amber-300 flex items-center justify-center mb-2 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="text-xs font-black text-[var(--text-primary)]">Bloqueio Rápido</div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            Interditar turnos ou dias
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('backup')}
          className="p-4 rounded-2xl neu-flat border border-[var(--border-subtle)] text-left hover:scale-[1.02] active:scale-95 transition-all group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mb-2 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div className="text-xs font-black text-[var(--text-primary)]">Exportar Relatórios</div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            Exportar planilha em CSV
          </p>
        </button>

        <button
          onClick={() => onNavigateTab('anomalies')}
          className="p-4 rounded-2xl neu-flat border border-[var(--border-subtle)] text-left hover:scale-[1.02] active:scale-95 transition-all group"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-800 dark:text-purple-300 flex items-center justify-center mb-2 group-hover:bg-purple-600 group-hover:text-white transition-colors">
            <Activity className="w-4 h-4" />
          </div>
          <div className="text-xs font-black text-[var(--text-primary)]">Monitor de Anomalias</div>
          <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
            Auditoria de uso do sistema
          </p>
        </button>
      </div>
    </div>
  );
};
