import React from 'react';
import {
  Users,
  Lock,
  Wrench,
  AlertTriangle,
  Plus,
  Clock,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { Room, Booking } from '../types';
import { RoomArchIcon } from './BradescoIcon';
import {
  TIME_SLOTS,
  timeToMinutes,
  checkIntervalOverlap,
  formatDateToISO,
} from '../utils/dateUtils';

interface ScheduleGridProps {
  rooms: Room[];
  bookings: Booking[];
  selectedDate: string;
  onSlotClick: (room: Room, startTime: string) => void;
  onBookingClick: (booking: Booking, room: Room) => void;
  onQuickBlock: (room: Room) => void;
  unitName?: string;
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  rooms,
  bookings,
  selectedDate,
  onSlotClick,
  onBookingClick,
  onQuickBlock,
  unitName,
}) => {
  const isToday = formatDateToISO(new Date()) === selectedDate;
  const currentMinutes = isToday
    ? new Date().getHours() * 60 + new Date().getMinutes()
    : null;

  // Filter bookings for selected date
  const dateBookings = bookings.filter((b) => b.date === selectedDate);

  const slotIntervals = TIME_SLOTS.slice(0, -1).map((start, idx) => ({
    startTime: start,
    endTime: TIME_SLOTS[idx + 1],
  }));

  if (rooms.length === 0) {
    return (
      <div className="p-8 text-center rounded-[32px] neu-flat">
        <Sparkles className="w-8 h-8 text-[#E60026] dark:text-[#FF2B4D] mx-auto mb-2 animate-bounce" />
        <h3 className="text-base font-bold text-[var(--text-primary)]">
          Carregando salas da Unidade {unitName || 'Belém'}...
        </h3>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Sincronizando com o Firebase Firestore em tempo real.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* Mobile Swipe Hint */}
      <div className="sm:hidden flex items-center justify-center gap-1.5 py-1 px-3 rounded-xl neu-pressed-sm text-[10px] font-bold text-[var(--text-secondary)] select-none">
        <span>↔ Deslize para visualizar todas as salas</span>
      </div>

      {/* Grid Container */}
      <div className="rounded-[28px] sm:rounded-[32px] neu-flat p-2.5 sm:p-5 border border-[var(--border-subtle)] overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <div className="min-w-[640px]">
            {/* Header: Room Columns */}
            <div
              className="grid gap-2 sm:gap-3 pb-3 border-b border-[var(--border-subtle)]"
              style={{
                gridTemplateColumns: `80px repeat(${rooms.length}, minmax(190px, 1fr))`,
              }}
            >
              {/* Corner: Time column header */}
              <div className="flex flex-col items-center justify-center py-2 px-1 rounded-2xl neu-pressed-sm text-center">
                <Clock className="w-4 h-4 text-[#E60026] dark:text-[#FF2B4D] mb-0.5" />
                <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase">
                  Horário
                </span>
              </div>

              {/* Rooms Headers */}
              {rooms.map((room) => {
                const isMaintenance = room.status === 'maintenance';
                const isLocked = room.status === 'locked';
                const isAvailable = room.status === 'active';

                return (
                  <div
                    key={room.id}
                    className={`p-3 rounded-2xl transition-all relative ${
                      isAvailable
                        ? 'neu-flat-sm border-l-4 border-[#E60026]'
                        : isMaintenance
                        ? 'neu-pressed-sm border-l-4 border-amber-500 bg-amber-500/5'
                        : 'neu-pressed-sm border-l-4 border-rose-500 bg-rose-500/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)] leading-tight">
                          {room.name}
                        </h3>
                        <p className="text-[11px] text-[var(--text-secondary)] font-semibold uppercase mt-0.5">
                          {room.capacity} LUGARES
                        </p>
                      </div>

                      {/* Status Badge */}
                      {isAvailable ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-600/30 dark:border-emerald-500/30">
                          Livre
                        </span>
                      ) : isMaintenance ? (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-600/30 dark:border-amber-400/30 flex items-center gap-1">
                          <Wrench className="w-2.5 h-2.5" /> Manutenção
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E60026] text-white flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Interditada
                        </span>
                      )}
                    </div>

                    {!isAvailable && (
                      <div className="mt-2 text-[10px] text-amber-900 dark:text-amber-300 font-medium p-1.5 rounded-xl bg-amber-500/15 border border-amber-600/30 dark:border-amber-400/30 flex items-start gap-1">
                        <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
                        <span>{room.maintenanceReason || 'Bloqueio operacional'}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Matrix Rows: 30-min intervals */}
            <div className="divide-y divide-[var(--border-subtle)] pt-2 relative">
              {slotIntervals.map((interval) => {
                return (
                  <div
                    key={interval.startTime}
                    className="grid gap-2 sm:gap-3 py-1.5 items-center relative"
                    style={{
                      gridTemplateColumns: `80px repeat(${rooms.length}, minmax(190px, 1fr))`,
                    }}
                  >
                    {/* Time Label */}
                    <div className="flex flex-col items-center justify-center py-1">
                      <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                        {interval.startTime}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                        {interval.endTime}
                      </span>
                    </div>

                    {/* Room Slot Cells */}
                    {rooms.map((room) => {
                      const isRoomDisabled = room.status !== 'active';

                      const booking = dateBookings.find(
                        (b) =>
                          b.roomId === room.id &&
                          checkIntervalOverlap(
                            interval.startTime,
                            interval.endTime,
                            b.startTime,
                            b.endTime
                          )
                      );

                      if (isRoomDisabled) {
                        return (
                          <div
                            key={room.id}
                            className="h-11 rounded-xl neu-pressed-sm flex items-center justify-center opacity-40 cursor-not-allowed bg-black/5 dark:bg-white/5"
                            title={`Sala ${room.name} não disponível: ${room.maintenanceReason || 'Em manutenção'}`}
                          >
                            <Lock className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                          </div>
                        );
                      }

                      if (booking) {
                        const isBlock = booking.isBlock;

                        return (
                          <div
                            key={room.id}
                            className={`h-11 px-2.5 py-1 rounded-xl transition-all flex items-center justify-between gap-1 overflow-hidden select-none cursor-not-allowed opacity-90 ${
                              isBlock
                                ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-800 dark:text-amber-300 neu-flat-sm'
                                : 'bg-[#E60026]/15 border border-[#E60026]/30 text-[#E60026] dark:text-[#FF2B4D] neu-flat-sm'
                            }`}
                            title={`Horário já agendado: ${isBlock ? `BLOQUEIO (${booking.blockReason || 'Administrativo'})` : booking.userName}`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              {isBlock ? (
                                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-amber-700 dark:text-amber-400" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-[#E60026] dark:bg-[#FF2B4D] flex-shrink-0" />
                              )}
                              <div className="truncate">
                                <p className="text-xs font-bold truncate text-[var(--text-primary)]">
                                  {isBlock
                                    ? `BLOQUEIO: ${booking.blockReason || 'Administrativo'}`
                                    : booking.userName}
                                </p>
                                <p className="text-[10px] text-[var(--text-secondary)] truncate">
                                  {booking.userDepartment || 'Geral'} • {booking.startTime} - {booking.endTime}
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E60026] text-white flex-shrink-0">
                              Ocupado
                            </span>
                          </div>
                        );
                      }

                      // Check if slot has already passed today or on a past date
                      const now = new Date();
                      const currentMinutes = now.getHours() * 60 + now.getMinutes();
                      const todayISO = formatDateToISO(now);
                      const isToday = selectedDate === todayISO;
                      const isPastDate = selectedDate < todayISO;
                      const isSlotPast = isPastDate || (isToday && timeToMinutes(interval.startTime) <= currentMinutes);

                      if (isSlotPast) {
                        return (
                          <div
                            key={room.id}
                            className="h-11 rounded-xl neu-pressed-sm flex items-center justify-center opacity-40 cursor-not-allowed bg-black/5 dark:bg-white/5 select-none"
                            title="Horário já encerrado (não disponível para reserva)"
                          >
                            <span className="text-[11px] font-mono text-[var(--text-secondary)] font-semibold">
                              Encerrado
                            </span>
                          </div>
                        );
                      }

                      // Free and future slot
                      return (
                        <button
                          key={room.id}
                          onClick={() => onSlotClick(room, interval.startTime)}
                          className="h-11 rounded-xl neu-btn border border-transparent hover:border-[#E60026]/30 dark:hover:border-[#FF2B4D]/30 flex items-center justify-center gap-1 text-[var(--text-secondary)] hover:text-[#E60026] dark:hover:text-[#FF2B4D] transition-all group active:scale-98 cursor-pointer"
                          title={`Reservar ${room.name} às ${interval.startTime}`}
                        >
                          <Plus className="w-3.5 h-3.5 group-hover:scale-125 transition-transform text-[#E60026] dark:text-[#FF2B4D]" />
                          <span className="text-xs font-bold group-hover:text-[#E60026] dark:group-hover:text-[#FF2B4D]">
                            Disponível
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
