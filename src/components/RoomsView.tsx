import React from 'react';
import {
  Calendar,
  AlertCircle,
  Plus,
  Building2,
} from 'lucide-react';
import { Room, Booking } from '../types';
import { RoomArchIcon } from './BradescoIcon';
import {
  formatFriendlyDate,
  getAvailableSlotsForRoom,
  formatDisplayName,
  formatDateToISO,
} from '../utils/dateUtils';

interface RoomsViewProps {
  rooms: Room[];
  bookings: Booking[];
  selectedDate: string;
  currentTimeStr: string;
  onBookRoom: (room: Room, startTime?: string) => void;
  onBookingClick: (booking: Booking, room: Room) => void;
}

export const RoomsView: React.FC<RoomsViewProps> = ({
  rooms,
  bookings,
  selectedDate,
  currentTimeStr,
  onBookRoom,
  onBookingClick,
}) => {
  // Check if room is currently busy right now or on selected date
  const getRoomOccupancy = (room: Room) => {
    if (room.status === 'locked' || room.status === 'maintenance') {
      return {
        isFree: false,
        label: room.status === 'maintenance' ? 'MANUTENÇÃO' : 'BLOQUEADA',
        type: 'blocked',
      };
    }

    const vacant = getAvailableSlotsForRoom(room.id, selectedDate, bookings);
    if (vacant.length === 0) {
      const now = new Date();
      const todayISO = formatDateToISO(now);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const isPastOrEnded = selectedDate < todayISO || (selectedDate === todayISO && currentMinutes >= 18 * 60);

      return {
        isFree: false,
        label: isPastOrEnded ? 'ENCERRADA' : 'LOTADA HOJE',
        type: isPastOrEnded ? 'ended' : 'full',
      };
    }

    return {
      isFree: true,
      label: 'LIVRE',
      type: 'free',
    };
  };

  return (
    <div className="w-full space-y-6">
      {/* Title Row with Live Status Indicator */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tight">
            Espaços
          </h2>
          <p className="text-[11px] sm:text-xs md:text-sm font-black tracking-widest text-[#E60026] dark:text-[#FF2B4D] uppercase mt-0.5">
            {currentTimeStr} • LIVE STATUS
          </p>
        </div>

        {/* Live Status Indicator Squircle */}
        <div
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl neu-pressed flex items-center justify-center transition-all"
          title="Status em Tempo Real (Firebase Firestore Conectado)"
        >
          <div className="w-4 h-4 rounded-full live-pulse-dot animate-pulse" />
        </div>
      </div>

      {/* Empty State when unit has 0 rooms */}
      {rooms.length === 0 ? (
        <div className="p-8 sm:p-12 rounded-[32px] neu-flat text-center border border-[var(--border-subtle)] space-y-4 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl neu-pressed mx-auto flex items-center justify-center text-[var(--text-secondary)]">
            <Building2 className="w-7 h-7 text-[#E60026] dark:text-[#FF2B4D]" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
              Nenhuma sala cadastrada nesta unidade
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Utilize o painel administrativo para cadastrar salas ou selecione outra filial.
            </p>
          </div>
        </div>
      ) : (
        /* Rooms Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => {
            const occupancy = getRoomOccupancy(room);
            const isFree = occupancy.isFree;

            // Today's bookings for this room
            const roomBookings = bookings
              .filter((b) => b.roomId === room.id && b.date === selectedDate)
              .sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <div
                key={room.id}
                className="rounded-[32px] neu-flat p-5 sm:p-6 border border-[var(--border-subtle)] relative flex flex-col justify-between transition-all hover:translate-y-[-2px]"
              >
                {/* Vertical accent stripe on left */}
                <div className="absolute left-2.5 top-6 bottom-6 w-1.5 rounded-full bg-[#E60026] dark:bg-[#FF2B4D]" />

                <div className="pl-3.5">
                  {/* Top Header: Arch Icon, Name, Capacity, and Status Badge */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      {/* Squircle Recessed Icon Box with Arch Icon */}
                      <div className="w-12 h-12 rounded-2xl neu-pressed-sm flex items-center justify-center text-[#E60026] dark:text-[#FF2B4D] flex-shrink-0">
                        <RoomArchIcon className="w-6 h-6" />
                      </div>

                      <div>
                        <h3 className="text-xl font-black text-[var(--text-primary)] tracking-tight leading-tight">
                          {room.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] font-black tracking-widest uppercase text-[var(--text-secondary)]">
                            {room.capacity} LUGARES
                          </span>
                          {room.department && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-500/25">
                              {room.department}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge Pill */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase flex-shrink-0 ${
                        isFree
                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-600/30 dark:border-emerald-500/30'
                          : occupancy.label === 'ENCERRADA'
                          ? 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30'
                          : 'bg-[#E60026] text-white shadow-sm'
                      }`}
                    >
                      {occupancy.label}
                    </span>
                  </div>

                  {/* Maintenance / Locked Notice */}
                  {room.status !== 'active' && (
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-600/30 dark:border-amber-400/30 text-xs text-amber-900 dark:text-amber-300 mb-3 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
                      <div>
                        <strong className="block font-bold">
                          {room.status === 'maintenance' ? 'Manutenção Predial' : 'Sala Interditada'}
                        </strong>
                        <span className="text-[11px] leading-tight">
                          {room.maintenanceReason && room.maintenanceReason.trim() !== '.'
                            ? room.maintenanceReason
                            : 'Bloqueio operacional temporário.'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Today's Agenda for this room */}
                  <div className="space-y-2 mb-4 pt-2 border-t border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[var(--text-secondary)]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#E60026] dark:text-[#FF2B4D]" />
                        Agenda de Hoje ({formatFriendlyDate(selectedDate)})
                      </span>
                      <span className="text-[#E60026] dark:text-[#FF2B4D] font-extrabold">
                        {roomBookings.length} {roomBookings.length === 1 ? 'reserva' : 'reservas'}
                      </span>
                    </div>

                    {roomBookings.length === 0 ? (
                      room.status !== 'active' ? (
                        <div className="p-3 rounded-2xl neu-pressed-sm text-center text-xs text-[#E60026] dark:text-[#FF2B4D] font-bold">
                          ✕ {room.status === 'maintenance' ? 'Sala em manutenção — indisponível hoje' : 'Sala bloqueada — indisponível hoje'}
                        </div>
                      ) : (
                        <div className="p-3 rounded-2xl neu-pressed-sm text-center text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                          ✓ Sala livre em todos os horários hoje!
                        </div>
                      )
                    ) : (
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {roomBookings.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => onBookingClick(b, room)}
                            className="p-2.5 rounded-2xl neu-pressed-sm text-xs select-none cursor-pointer flex items-center justify-between transition-all hover:scale-[1.01]"
                            title="Clique para ver detalhes do agendamento"
                          >
                            <div className="truncate pr-2">
                              <span className="font-bold text-[var(--text-primary)] block truncate">
                                {b.isBlock
                                  ? `BLOQUEIO: ${b.blockReason || 'ADMINISTRATIVO'}`
                                  : formatDisplayName(b.userName)}
                              </span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] text-[var(--text-secondary)] truncate">
                                  {b.userDepartment}
                                </span>
                              </div>
                            </div>
                            <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded-lg bg-[#E60026]/10 text-[#E60026] dark:text-[#FF2B4D] flex-shrink-0">
                              {b.startTime} - {b.endTime}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick 1-hour Slot Indicators - Only vacant and non-passed slots */}
                  <div className="mb-4">
                    <span className="block text-[10px] font-bold uppercase text-[var(--text-secondary)] tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Horários Vagos Disponíveis:</span>
                      <span className="text-[#E60026] dark:text-[#FF2B4D] font-black">
                        {room.status !== 'active'
                          ? 'Indisponível'
                          : (() => {
                              const vacant = getAvailableSlotsForRoom(room.id, selectedDate, bookings);
                              const now = new Date();
                              const todayISO = formatDateToISO(now);
                              const currentMinutes = now.getHours() * 60 + now.getMinutes();
                              const isPastOrEnded = selectedDate < todayISO || (selectedDate === todayISO && currentMinutes >= 18 * 60);
                              if (vacant.length === 0) {
                                return isPastOrEnded ? 'Encerrado' : '0 vagos';
                              }
                              return `${vacant.length} ${vacant.length === 1 ? 'vago' : 'vagos'}`;
                            })()}
                      </span>
                    </span>

                    {room.status !== 'active' ? (
                      <div className="p-2.5 rounded-2xl neu-pressed-sm text-center text-xs text-[var(--text-secondary)]">
                        Sala indisponível para reservas no momento.
                      </div>
                    ) : (() => {
                      const vacantSlots = getAvailableSlotsForRoom(room.id, selectedDate, bookings);
                      const now = new Date();
                      const todayISO = formatDateToISO(now);
                      const currentMinutes = now.getHours() * 60 + now.getMinutes();
                      const isPastOrEnded = selectedDate < todayISO || (selectedDate === todayISO && currentMinutes >= 18 * 60);

                      if (vacantSlots.length === 0) {
                        return (
                          <div className="p-2.5 rounded-2xl neu-pressed-sm text-center text-xs text-[var(--text-secondary)] font-bold">
                            {isPastOrEnded
                              ? 'Expediente encerrado para esta data (após 18:00).'
                              : 'Nenhum horário vago disponível para este dia.'}
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-wrap gap-1.5">
                          {vacantSlots.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => onBookRoom(room, slot)}
                              className="px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold neu-btn text-[var(--text-secondary)] hover:text-[#E60026] dark:hover:text-[#FF2B4D] hover:scale-105 active:scale-95 cursor-pointer transition-all border border-transparent hover:border-[#E60026]/30 dark:hover:border-[#FF2B4D]/30"
                              title={`Horário vago: Clique para agendar às ${slot}`}
                            >
                              {slot}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="pl-3.5 pt-2">
                  {(() => {
                    const vacant = getAvailableSlotsForRoom(room.id, selectedDate, bookings);
                    const isRoomActive = room.status === 'active';
                    const now = new Date();
                    const todayISO = formatDateToISO(now);
                    const currentMinutes = now.getHours() * 60 + now.getMinutes();
                    const isPastOrEnded = selectedDate < todayISO || (selectedDate === todayISO && currentMinutes >= 18 * 60);

                    return (
                      <button
                        type="button"
                        onClick={() => onBookRoom(room, vacant[0])}
                        disabled={!isRoomActive || vacant.length === 0}
                        className={`w-full py-3 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-black tracking-wider uppercase transition-all ${
                          isRoomActive && vacant.length > 0
                            ? 'neu-btn text-[#E60026] dark:text-[#FF2B4D] hover:text-[#C70020] dark:hover:text-[#FF526D] active:scale-95 cursor-pointer'
                            : 'neu-pressed-sm opacity-50 cursor-not-allowed text-[var(--text-secondary)]'
                        }`}
                      >
                        <Plus className="w-4 h-4 text-[#E60026] dark:text-[#FF2B4D]" />
                        <span>
                          {!isRoomActive
                            ? 'Indisponível'
                            : isPastOrEnded
                            ? 'Expediente Encerrado'
                            : vacant.length === 0
                            ? 'Sem Horários Vagos'
                            : 'Agendar Horário'}
                        </span>
                      </button>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
