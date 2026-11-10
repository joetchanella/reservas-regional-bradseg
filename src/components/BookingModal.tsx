import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Building2,
  DoorOpen,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  ArrowLeft,
  MapPin,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Room, Booking, Department } from '../types';
import {
  formatPhoneNumber,
  isWeekend,
  timeToMinutes,
  checkIntervalOverlap,
  formatDateToISO,
  getAvailableSlotsForRoom,
  getAvailableEndTimesForSlot,
  formatFriendlyDate,
  formatDisplayName,
} from '../utils/dateUtils';
import { createBooking, updateBooking } from '../services/firestoreService';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  departments: Department[];
  allBookings: Booking[];
  preSelectedRoom?: Room;
  preSelectedDate?: string;
  preSelectedStartTime?: string;
  bookingToEdit?: Booking | null;
  onSuccess: (bookingId: string) => void;
  unitName?: string;
  unitState?: string;
  onOpenUnitSelect?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  rooms,
  departments,
  allBookings,
  preSelectedRoom,
  preSelectedDate,
  preSelectedStartTime,
  bookingToEdit,
  onSuccess,
  unitName,
  unitState,
  onOpenUnitSelect,
}) => {
  const todayISO = formatDateToISO(new Date());

  const [roomId, setRoomId] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [userDepartment, setUserDepartment] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize form state on open
  useEffect(() => {
    if (!isOpen) {
      setShowConfirmation(false);
      return;
    }

    setErrorMessage(null);
    setShowConfirmation(false);

    if (bookingToEdit) {
      setRoomId(bookingToEdit.roomId);
      setUserName(bookingToEdit.userName);
      setUserPhone(formatPhoneNumber(bookingToEdit.userPhone));
      setUserDepartment(bookingToEdit.userDepartment);
      setDate(bookingToEdit.date);
      setStartTime(bookingToEdit.startTime);
      setEndTime(bookingToEdit.endTime);
    } else {
      setRoomId(preSelectedRoom?.id || (rooms.length > 0 ? rooms[0].id : ''));
      // Leave all fields blank for the user to fill in, leaving only the selected time filled in
      setUserName('');
      setUserPhone('');
      setUserDepartment('');
      setDate(preSelectedDate || todayISO);

      // When opening a new booking: set start to preSelectedStartTime and leave end blank
      setStartTime(preSelectedStartTime || '');
      setEndTime('');
    }
  }, [isOpen, bookingToEdit, preSelectedRoom, preSelectedDate, preSelectedStartTime, rooms, todayISO]);

  // Selected room object (locked based on user selection from home screen)
  const selectedRoom = useMemo(() => {
    return rooms.find((r) => r.id === roomId) || preSelectedRoom || (rooms.length > 0 ? rooms[0] : null);
  }, [rooms, roomId, preSelectedRoom]);

  // Compute ONLY available starting slots for the selected room and date
  const availableStartTimes = useMemo(() => {
    if (!roomId || !date) return [];
    const slots = getAvailableSlotsForRoom(roomId, date, allBookings, bookingToEdit?.id);

    // If preSelectedStartTime was passed and is not conflicting, ensure it's in the list
    if (preSelectedStartTime && !slots.includes(preSelectedStartTime)) {
      const hasConflict = allBookings.some((b) => {
        if (bookingToEdit && b.id === bookingToEdit.id) return false;
        return (
          b.roomId === roomId &&
          b.date === date &&
          checkIntervalOverlap(preSelectedStartTime, '18:00', b.startTime, b.endTime)
        );
      });
      if (!hasConflict) {
        return [...slots, preSelectedStartTime].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
      }
    }

    // If editing existing booking, include its current start time
    if (bookingToEdit && !slots.includes(bookingToEdit.startTime)) {
      return [...slots, bookingToEdit.startTime].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
    }

    return slots;
  }, [roomId, date, allBookings, bookingToEdit, preSelectedStartTime]);

  // Compute available contiguous end slots strictly greater than selected startTime
  const availableEndTimes = useMemo(() => {
    if (!startTime || !roomId || !date) return [];
    const ends = getAvailableEndTimesForSlot(startTime, roomId, date, allBookings, bookingToEdit?.id);

    // If editing, make sure booking's own endTime is available
    if (bookingToEdit && !ends.includes(bookingToEdit.endTime) && timeToMinutes(bookingToEdit.endTime) > timeToMinutes(startTime)) {
      return [...ends, bookingToEdit.endTime].sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
    }

    return ends;
  }, [startTime, roomId, date, allBookings, bookingToEdit]);

  // Auto-synchronize startTime when availableStartTimes changes
  useEffect(() => {
    if (!isOpen) return;
    if (preSelectedStartTime && availableStartTimes.includes(preSelectedStartTime)) {
      setStartTime(preSelectedStartTime);
    } else if (availableStartTimes.length > 0) {
      if (!startTime || !availableStartTimes.includes(startTime)) {
        setStartTime(availableStartTimes[0]);
      }
    } else {
      setStartTime('');
    }
  }, [availableStartTimes, isOpen, preSelectedStartTime]);

  // When availableEndTimes changes, reset endTime if it's no longer valid
  useEffect(() => {
    if (!isOpen) return;
    if (endTime && !availableEndTimes.includes(endTime)) {
      setEndTime('');
    }
  }, [availableEndTimes, isOpen, endTime]);

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserPhone(formatPhoneNumber(e.target.value));
  };

  // Step 1: Pre-submit validation and trigger confirmation screen
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!userName.trim()) {
      setErrorMessage('Por favor, informe o nome completo do solicitante.');
      return;
    }

    // Phone is optional; only validate format if provided
    if (userPhone.trim() && userPhone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Se informado, o telefone/WhatsApp deve ter pelo menos 10 dígitos (DDD + número).');
      return;
    }

    if (!userDepartment) {
      setErrorMessage('Por favor, selecione o departamento ou setor.');
      return;
    }

    if (!roomId) {
      setErrorMessage('Sala não identificada. Por favor, feche e selecione a sala novamente.');
      return;
    }

    if (!date) {
      setErrorMessage('Data não definida. Por favor, feche e selecione o dia na tela inicial.');
      return;
    }

    if (isWeekend(date)) {
      setErrorMessage('Agendamentos não são permitidos nos finais de semana (Segunda a Sexta apenas).');
      return;
    }

    if (!startTime) {
      setErrorMessage('Por favor, selecione o horário de início desejado.');
      return;
    }

    if (!endTime) {
      setErrorMessage('Por favor, selecione o horário de término do agendamento para evitar marcações incorretas.');
      return;
    }

    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setErrorMessage('O horário de término deve ser posterior ao horário de início.');
      return;
    }

    const targetRoom = rooms.find((r) => r.id === roomId);
    if (targetRoom && targetRoom.status !== 'active') {
      setErrorMessage(`A sala "${targetRoom.name}" está ${targetRoom.status === 'maintenance' ? 'em manutenção' : 'interditada'}: ${targetRoom.maintenanceReason || 'Aguarde liberação predial.'}`);
      return;
    }

    // Verify collisions
    const conflict = allBookings.find((b) => {
      if (bookingToEdit && b.id === bookingToEdit.id) return false;
      return (
        b.roomId === roomId &&
        b.date === date &&
        checkIntervalOverlap(startTime, endTime, b.startTime, b.endTime)
      );
    });

    if (conflict) {
      setErrorMessage(
        `Horário indisponível! A sala já possui agendamento das ${conflict.startTime} às ${conflict.endTime} (${conflict.isBlock ? 'Bloqueio' : conflict.userName}).`
      );
      return;
    }

    // Validations passed! Show confirmation screen with booking summary
    setShowConfirmation(true);
  };

  // Step 2: Final confirmation after user clicks "Sim, Confirmar Agendamento"
  const handleFinalConfirm = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const selectedRoom = rooms.find((r) => r.id === roomId);
      const targetUnitId = selectedRoom?.unitId || (rooms.length > 0 ? rooms[0].unitId : undefined) || 'belem';

      if (bookingToEdit) {
        await updateBooking(
          bookingToEdit.id,
          {
            unitId: targetUnitId,
            roomId,
            userName: userName.trim(),
            userPhone: userPhone.trim(),
            userDepartment,
            date,
            startTime,
            endTime,
          },
          allBookings
        );
        onSuccess(bookingToEdit.id);
      } else {
        const newId = await createBooking(
          {
            unitId: targetUnitId,
            roomId,
            userName: userName.trim(),
            userPhone: userPhone.trim(),
            userDepartment,
            date,
            startTime,
            endTime,
            isBlock: false,
          },
          allBookings
        );

        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch (_) {}

        onSuccess(newId);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar reserva no Firebase Firestore.');
      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  const hasAvailableSlots = availableStartTimes.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-[32px] neu-flat-lg bg-[var(--card-surface)] border border-[var(--border-subtle)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#E60026]/15 text-[#E60026] dark:text-[#FF2B4D] flex items-center justify-center">
              {showConfirmation ? <HelpCircle className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] font-black text-[#E60026] dark:text-[#FF2B4D] tracking-widest uppercase">
                BRADESCO SEGUROS • {(unitName || 'Belém').toUpperCase()}
              </span>
              <h3 className="font-black text-base sm:text-lg text-[var(--text-primary)]">
                {showConfirmation
                  ? 'Confirmar Agendamento?'
                  : bookingToEdit
                  ? 'Editar Agendamento'
                  : 'Nova Reserva de Sala'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl neu-btn text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {showConfirmation ? (
          /* Confirmation & Summary Screen */
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-700 dark:text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Prompt Question */}
            <div className="p-4 rounded-2xl bg-[#E60026]/10 border border-[#E60026]/20 text-[var(--text-primary)] flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#E60026] dark:text-[#FF2B4D] flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-black text-sm text-[var(--text-primary)]">
                  Tem certeza que deseja confirmar esta reserva na Unidade {unitName || 'Belém'}?
                </strong>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                  Confira atentamente os dados do agendamento abaixo antes de prosseguir.
                </p>
              </div>
            </div>

            {/* Structured Summary Card */}
            <div className="p-4 rounded-2xl neu-pressed-sm border border-[var(--border-subtle)] space-y-3">
              <div className="text-[11px] font-black tracking-wider uppercase text-[#E60026] dark:text-[#FF2B4D] border-b border-[var(--border-subtle)] pb-2 flex items-center justify-between">
                <span>Resumo da Reserva</span>
                <span>Unidade {unitName || 'Belém'} {unitState ? `(${unitState})` : ''}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block">
                    Sala / Espaço
                  </span>
                  <span className="font-black text-[var(--text-primary)] text-sm">
                    {selectedRoom?.name || 'Sala'}
                  </span>
                  <span className="block text-[10px] text-[var(--text-secondary)]">
                    Capacidade: {selectedRoom?.capacity || '-'} lugares
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block">
                    Data Agendada
                  </span>
                  <span className="font-black text-[var(--text-primary)] text-sm">
                    {formatFriendlyDate(date)}
                  </span>
                  <span className="block text-[10px] text-[var(--text-secondary)] font-mono">
                    {date}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block">
                    Horário da Reserva
                  </span>
                  <span className="font-mono font-black text-[#E60026] dark:text-[#FF2B4D] text-sm">
                    {startTime} às {endTime}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block">
                    Setor / Departamento
                  </span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {userDepartment}
                  </span>
                </div>

                <div className="sm:col-span-2 pt-2 border-t border-[var(--border-subtle)]">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block">
                    Nome do Solicitante (Padronizado na Tela)
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-black text-[var(--text-primary)] text-sm">
                      {userName.trim().toUpperCase()}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E60026]/10 text-[#E60026] dark:text-[#FF2B4D] border border-[#E60026]/20 dark:border-[#FF2B4D]/20">
                      Exibição: {formatDisplayName(userName)}
                    </span>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block">
                    WhatsApp / Telefone
                  </span>
                  <span className="font-bold text-[var(--text-primary)]">
                    {userPhone.trim() ? formatPhoneNumber(userPhone) : 'Não informado (Opcional)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Confirmation Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
                className="px-4 py-2.5 rounded-2xl neu-btn text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar e Alterar</span>
              </button>

              <button
                type="button"
                onClick={handleFinalConfirm}
                disabled={loading}
                className="px-6 py-2.5 rounded-2xl text-white text-xs font-black tracking-wider uppercase shadow-md active:scale-95 transition-all flex items-center gap-2 bg-[#E60026] hover:bg-[#C70020]"
              >
                {loading ? (
                  <span>Confirmando...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sim, Confirmar Agendamento</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Main Booking Form */
          <form onSubmit={handlePreSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-700 dark:text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Unit Reassurance Banner (Prevents wrong city booking) */}
            <div className="p-3 px-3.5 rounded-2xl bg-[#E60026]/10 border border-[#E60026]/25 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-[#E60026] dark:text-[#FF2B4D] flex-shrink-0 animate-pulse" />
                <span className="text-xs text-[var(--text-primary)] truncate">
                  Unidade: <strong className="font-black text-[#E60026] dark:text-[#FF2B4D]">{unitName || 'Belém'}</strong> {unitState ? `(${unitState})` : ''}
                </span>
              </div>
              {onOpenUnitSelect && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenUnitSelect();
                  }}
                  className="text-[11px] font-black text-[#E60026] dark:text-[#FF2B4D] hover:underline flex-shrink-0"
                >
                  Trocar unidade
                </button>
              )}
            </div>

            {/* Context Card: Room and Date selected on home screen (Read-only, no dropdown/input) */}
            <div className="p-3.5 rounded-2xl neu-pressed-sm border border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E60026]/15 text-[#E60026] dark:text-[#FF2B4D] flex items-center justify-center font-bold">
                    <DoorOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)] block leading-none">
                      Espaço Selecionado
                    </span>
                    <strong className="text-sm font-black text-[var(--text-primary)]">
                      {selectedRoom?.name || 'Sala'}
                    </strong>
                  </div>
                </div>

                {selectedRoom && (
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#E60026]/10 text-[#E60026] dark:text-[#FF2B4D] border border-[#E60026]/20 dark:border-[#FF2B4D]/20">
                    {selectedRoom.capacity} LUGARES
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-secondary)]">
                <Calendar className="w-3.5 h-3.5 text-[#E60026] dark:text-[#FF2B4D] flex-shrink-0" />
                <span>
                  Data selecionada na tela inicial: <strong className="text-[var(--text-primary)] font-bold">{formatFriendlyDate(date)}</strong>
                </span>
              </div>
            </div>

            {/* Solicitante Name */}
            <div>
              <label className="block font-bold text-[var(--text-primary)] mb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#E60026] dark:text-[#FF2B4D]" />
                <span>Nome do Solicitante *</span>
              </label>
              <input
                type="text"
                required
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Ex: Carlos Eduardo Silva"
                className="w-full px-3.5 py-2.5 rounded-2xl neu-input text-base sm:text-sm text-[var(--text-primary)]"
              />
              {userName.trim() && (
                <span className="block text-[10px] text-[var(--text-secondary)] mt-1">
                  Exibição padronizada na tela inicial: <strong className="text-[#E60026] dark:text-[#FF2B4D] uppercase">{formatDisplayName(userName)}</strong>
                </span>
              )}
            </div>

            {/* Phone / WhatsApp (OPCIONAL) */}
            <div>
              <label className="block font-bold text-[var(--text-primary)] mb-1.5 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-[#E60026] dark:text-[#FF2B4D]" />
                <span>WhatsApp / Celular com DDD <span className="text-[10px] font-normal text-[var(--text-secondary)]">(Opcional)</span></span>
              </label>
              <input
                type="tel"
                value={userPhone}
                onChange={handlePhoneChange}
                placeholder="Ex: (91) 98123-4567 (opcional)"
                className="w-full px-3.5 py-2.5 rounded-2xl neu-input text-base sm:text-sm text-[var(--text-primary)]"
              />
            </div>

            {/* Department */}
            <div>
              <label className="block font-bold text-[var(--text-primary)] mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#E60026] dark:text-[#FF2B4D]" />
                <span>Departamento / Setor *</span>
              </label>
              <select
                required
                value={userDepartment}
                onChange={(e) => setUserDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl neu-input text-base sm:text-sm text-[var(--text-primary)] cursor-pointer"
              >
                <option value="">Selecione o Departamento...</option>
                {departments.map((dept) => (
                  <option key={dept.id || dept.name} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Alert if no slots available */}
            {!hasAvailableSlots && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-600/30 dark:border-amber-400/30 text-amber-900 dark:text-amber-300 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
                <div>
                  <strong className="block font-bold">Nenhum horário vago nesta data!</strong>
                  <span>
                    Todos os horários desta sala já foram reservados ou já passaram da hora atual. Selecione outra data ou outra sala na tela inicial.
                  </span>
                </div>
              </div>
            )}

            {/* Start and End Time Slots - ONLY DISPLAYING VACANT AND FUTURE SLOTS */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-[var(--text-primary)] mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#E60026] dark:text-[#FF2B4D]" />
                  <span>Horário Início *</span>
                </label>
                <select
                  required
                  disabled={!hasAvailableSlots}
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setEndTime('');
                  }}
                  className={`w-full px-3 py-2.5 rounded-2xl neu-input text-[var(--text-primary)] ${
                    !hasAvailableSlots ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                >
                  {!hasAvailableSlots ? (
                    <option value="">Nenhum horário vago</option>
                  ) : (
                    <>
                      {!startTime && <option value="">-- Selecione o início --</option>}
                      {availableStartTimes.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block font-bold text-[var(--text-primary)] mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#E60026] dark:text-[#FF2B4D]" />
                  <span>Horário Término *</span>
                </label>
                <select
                  required
                  disabled={!hasAvailableSlots || availableEndTimes.length === 0}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className={`w-full px-3 py-2.5 rounded-2xl neu-input text-[var(--text-primary)] ${
                    !hasAvailableSlots || availableEndTimes.length === 0
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                >
                  <option value="">
                    {availableEndTimes.length === 0 ? '-' : '-- Selecione o término --'}
                  </option>
                  {availableEndTimes.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-2xl neu-btn text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !hasAvailableSlots}
                className={`px-6 py-2.5 rounded-2xl text-white text-xs font-black tracking-wider uppercase shadow-md active:scale-95 transition-all flex items-center gap-2 ${
                  !hasAvailableSlots
                    ? 'bg-gray-400 opacity-50 cursor-not-allowed'
                    : 'bg-[#E60026] hover:bg-[#C70020]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{bookingToEdit ? 'Revisar e Atualizar' : 'Confirmar Reserva'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
