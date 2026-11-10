import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  DoorOpen,
  User,
  Phone,
  Building2,
  Edit3,
  Trash2,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Lock,
  History,
} from 'lucide-react';
import { Booking, Room } from '../types';
import {
  formatFriendlyDate,
  formatPhoneNumber,
  timeToMinutes,
  formatRegistrationDateTime,
} from '../utils/dateUtils';

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  room: Room | null;
  isAdmin: boolean;
  onEdit: (booking: Booking) => void;
  onDelete: (bookingId: string) => void;
  unitName?: string;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  isOpen,
  onClose,
  booking,
  room,
  isAdmin,
  onEdit,
  onDelete,
  unitName,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !booking) return null;

  const durationMins = timeToMinutes(booking.endTime) - timeToMinutes(booking.startTime);
  const isBlock = booking.isBlock;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(booking.id);
      setShowConfirmDelete(false);
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md rounded-[32px] neu-flat-lg bg-[var(--card-surface)] border border-[var(--border-subtle)] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isBlock
                  ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-600/30 dark:border-amber-400/30'
                  : 'bg-[#E60026]/15 text-[#E60026] dark:text-[#FF2B4D] border border-[#E60026]/20 dark:border-[#FF2B4D]/20'
              }`}
            >
              {isBlock ? <ShieldAlert className="w-5 h-5" /> : <DoorOpen className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[10px] font-black text-[#E60026] dark:text-[#FF2B4D] tracking-widest uppercase">
                BRADESCO SEGUROS • BELÉM
              </span>
              <h3 className="font-black text-base sm:text-lg text-[var(--text-primary)]">
                {isBlock ? 'Bloqueio Administrativo' : 'Detalhes do Agendamento'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl neu-btn text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs sm:text-sm">
          {/* Room & Time highlight banner */}
          <div className="p-4 rounded-2xl neu-pressed-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-base text-[var(--text-primary)]">
                {room?.name}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isBlock
                    ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-600/30 dark:border-amber-400/30'
                    : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-600/30 dark:border-emerald-500/30'
                }`}
              >
                {isBlock ? 'Bloqueio Predial' : 'Confirmada'}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-1 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[#E60026] dark:text-[#FF2B4D]" />
                {formatFriendlyDate(booking.date)}
              </span>
              <span className="flex items-center gap-1 font-mono font-bold text-[#E60026] dark:text-[#FF2B4D]">
                <Clock className="w-3.5 h-3.5" />
                {booking.startTime} - {booking.endTime} ({durationMins}m)
              </span>
            </div>
          </div>

          {/* Details list */}
          <div className="space-y-3">
            {isBlock ? (
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-600/30 dark:border-amber-400/30 text-amber-900 dark:text-amber-300">
                <p className="text-xs font-bold mb-1">Motivo do Bloqueio:</p>
                <p className="text-xs">{booking.blockReason || 'Bloqueio de infraestrutura'}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 rounded-2xl neu-flat-sm">
                  <div className="w-8 h-8 rounded-xl bg-[#E60026]/15 text-[#E60026] dark:text-[#FF2B4D] flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-secondary)] font-medium block">
                      Solicitante
                    </span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {booking.userName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-2xl neu-flat-sm">
                  <div className="w-8 h-8 rounded-xl bg-[#E60026]/15 text-[#E60026] dark:text-[#FF2B4D] flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-secondary)] font-medium block">
                      Departamento / Setor
                    </span>
                    <span className="font-bold text-[var(--text-primary)]">
                      {booking.userDepartment || 'Não informado'}
                    </span>
                  </div>
                </div>

                {booking.userPhone && (
                  <div className="flex items-center gap-3 p-3 rounded-2xl neu-flat-sm">
                    <div className="w-8 h-8 rounded-xl bg-[#E60026]/15 text-[#E60026] dark:text-[#FF2B4D] flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-secondary)] font-medium block">
                        Telefone de Contato
                      </span>
                      <span className="font-bold text-[var(--text-primary)]">
                        {formatPhoneNumber(booking.userPhone)}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Registration audit date & time */}
            <div className="flex items-center gap-3 p-3 rounded-2xl neu-flat-sm bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/20">
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 text-sky-700 dark:text-sky-300 flex items-center justify-center flex-shrink-0">
                <History className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-sky-800 dark:text-sky-300 font-semibold block">
                  Data e Hora do Cadastro no Sistema
                </span>
                <span className="font-mono font-bold text-xs text-[var(--text-primary)]">
                  {formatRegistrationDateTime(booking.createdAt, true)}
                </span>
              </div>
            </div>
          </div>

          {/* Delete Confirmation Box (Admin only) */}
          {isAdmin && showConfirmDelete && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 space-y-2.5 animate-shake">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-700 dark:text-rose-400" />
                <p className="text-xs font-medium">
                  Tem certeza que deseja cancelar esta reserva? Esta ação liberará o horário imediatamente na Unidade {unitName || 'Belém'}.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-xl neu-btn text-xs font-bold text-[var(--text-secondary)]"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1.5 rounded-xl bg-[#E60026] hover:bg-[#C70020] text-white text-xs font-bold"
                >
                  {isDeleting ? 'Cancelando...' : 'Sim, Cancelar Reserva'}
                </button>
              </div>
            </div>
          )}

          {/* Non-Admin Notice */}
          {!isAdmin && (
            <div className="p-3 rounded-2xl neu-pressed-sm flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <Lock className="w-4 h-4 text-[#E60026] dark:text-[#FF2B4D] flex-shrink-0" />
              <span>
                Edição e cancelamento de agendamentos são restritos à <strong>Área do Administrador</strong>.
              </span>
            </div>
          )}

          {/* Bottom Actions */}
          {!showConfirmDelete && (
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-[var(--border-subtle)]">
              {isAdmin ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(true)}
                    className="py-2.5 px-3.5 rounded-2xl neu-btn text-xs font-bold text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Cancelar Reserva</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {!isBlock && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onEdit(booking);
                        }}
                        className="py-2.5 px-3.5 rounded-2xl neu-btn text-xs font-bold text-[#E60026] dark:text-[#FF2B4D] hover:text-[#C70020] dark:hover:text-[#FF526D] flex items-center gap-1.5"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Editar</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="py-2.5 px-4 rounded-2xl neu-btn text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                      Fechar
                    </button>
                  </div>
                </>
              ) : (
                <div className="w-full flex items-center justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2.5 px-6 rounded-2xl neu-btn text-xs font-bold text-[#E60026] dark:text-[#FF2B4D] hover:text-[#C70020] dark:hover:text-[#FF526D]"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
