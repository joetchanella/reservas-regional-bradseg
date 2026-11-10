import React, { useState, useMemo } from 'react';
import { FileText, LayoutGrid, Calendar as CalendarIcon, Printer, X } from 'lucide-react';
import { Booking, Room } from '../types';
import { formatFriendlyDate, formatPhoneNumber } from '../utils/dateUtils';

interface MonthlyConferenceBannerProps {
  rooms: Room[];
  bookings: Booking[];
  currentMonthStr: string;
  onChangeMonth: (month: string) => void;
  onOpenGridView?: () => void;
  unitName?: string;
}

export const MonthlyConferenceBanner: React.FC<MonthlyConferenceBannerProps> = ({
  rooms,
  bookings,
  currentMonthStr,
  onChangeMonth,
  onOpenGridView,
  unitName,
}) => {
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showScreenSummary, setShowScreenSummary] = useState(false);

  // Month bookings sorted chronologically by date and start time
  const monthBookings = useMemo(() => {
    return bookings
      .filter((b) => b.date.startsWith(currentMonthStr))
      .sort((a, b) => {
        const dateCmp = a.date.localeCompare(b.date);
        if (dateCmp !== 0) return dateCmp;
        return a.startTime.localeCompare(b.startTime);
      });
  }, [bookings, currentMonthStr]);

  const roomMap = useMemo(() => {
    const map = new Map<string, Room>();
    rooms.forEach((r) => map.set(r.id, r));
    return map;
  }, [rooms]);

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <>
      <div className="w-full rounded-[24px] sm:rounded-[36px] neu-flat p-4 sm:p-6 md:p-8 border border-[var(--border-subtle)] transition-all">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6">
          {/* Left Text */}
          <div className="max-w-xl">
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-[var(--text-primary)] tracking-tight">
              CONFERÊNCIA MENSAL
            </h2>
            <p className="text-[11px] sm:text-xs md:text-sm font-semibold tracking-wide text-[var(--text-secondary)] mt-1 uppercase leading-relaxed">
              GERE UM PDF DETALHADO COM O RESUMO E LISTA DE AGENDAMENTOS PARA CONFERÊNCIA.
            </p>
          </div>

          {/* Right Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 sm:gap-4 w-full lg:w-auto">
            {/* Mês de Referência Selector */}
            <div className="flex-1 sm:flex-initial min-w-[200px]">
              <label className="block text-[10px] font-bold tracking-wider uppercase text-[var(--text-secondary)] mb-1.5">
                MÊS DE REFERÊNCIA
              </label>
              <div className="relative">
                <input
                  type="month"
                  value={currentMonthStr}
                  onChange={(e) => onChangeMonth(e.target.value)}
                  className="w-full py-2.5 px-4 rounded-2xl neu-pressed-sm text-xs sm:text-sm font-bold text-[var(--text-primary)] cursor-pointer outline-none border border-[var(--border-subtle)] focus:border-[#E60026]"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5">
              {/* Resumo Tela */}
              <button
                onClick={() => setShowScreenSummary(true)}
                className="w-full sm:w-auto py-2.5 px-4 rounded-2xl neu-btn text-xs font-black tracking-wider uppercase text-[#E60026] dark:text-[#FF2B4D] hover:text-[#C70020] dark:hover:text-[#FF526D] flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <LayoutGrid className="w-4 h-4 text-[#E60026] dark:text-[#FF2B4D]" />
                <span>RESUMO TELA</span>
              </button>

              {/* Gerar Relatório PDF */}
              <button
                onClick={() => setShowPdfModal(true)}
                className="w-full sm:w-auto py-2.5 px-4 rounded-2xl neu-btn text-xs font-black tracking-wider uppercase text-[#E60026] dark:text-[#FF2B4D] hover:text-[#C70020] dark:hover:text-[#FF526D] flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <FileText className="w-4 h-4 text-[#E60026] dark:text-[#FF2B4D]" />
                <span>GERAR RELATÓRIO PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Screen Summary Modal (RESUMO TELA) */}
      {showScreenSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl rounded-[32px] neu-flat-lg p-6 sm:p-8 bg-[var(--card-surface)] border border-[var(--border-subtle)] max-h-[90vh] flex flex-col text-[var(--text-primary)]">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
              <div>
                <span className="text-[10px] font-black text-[#E60026] dark:text-[#FF2B4D] tracking-widest uppercase">
                  BRADESCO SEGUROS • CONFERÊNCIA
                </span>
                <h3 className="text-xl font-black">
                  Resumo de Agendamentos ({currentMonthStr})
                </h3>
              </div>
              <button
                onClick={() => setShowScreenSummary(false)}
                className="p-2 rounded-xl neu-btn text-[var(--text-secondary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick KPIs */}
            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="p-3 rounded-2xl neu-pressed-sm text-center">
                <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block">
                  Total Reservas
                </span>
                <span className="text-xl font-black text-[#E60026] dark:text-[#FF2B4D]">
                  {monthBookings.length}
                </span>
              </div>
              <div className="p-3 rounded-2xl neu-pressed-sm text-center">
                <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block">
                  Salas Ativas
                </span>
                <span className="text-xl font-black text-[var(--text-primary)]">
                  {rooms.length}
                </span>
              </div>
              <div className="p-3 rounded-2xl neu-pressed-sm text-center">
                <span className="text-[10px] uppercase font-bold text-[var(--text-secondary)] block">
                  Bloqueios ADM
                </span>
                <span className="text-xl font-black text-amber-800 dark:text-amber-300">
                  {monthBookings.filter((b) => b.isBlock).length}
                </span>
              </div>
            </div>

            {/* Table of bookings */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {monthBookings.length === 0 ? (
                <div className="p-8 text-center neu-pressed-sm rounded-2xl text-xs text-[var(--text-secondary)]">
                  Nenhuma reserva registrada para o mês selecionado ({currentMonthStr}).
                </div>
              ) : (
                monthBookings.map((b) => {
                  const room = roomMap.get(b.roomId);
                  return (
                    <div
                      key={b.id}
                      className="p-3 rounded-2xl neu-pressed-sm text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-[var(--text-primary)]">
                            {room?.name || 'Sala'}
                          </span>
                          <span className="font-mono text-blue-950 dark:text-blue-300 font-black">
                            {b.date} • {b.startTime} - {b.endTime}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                          {b.isBlock ? `BLOQUEIO: ${b.blockReason}` : `${b.userName} (${b.userDepartment})`}
                        </p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          b.isBlock
                            ? 'bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {b.isBlock ? 'Bloqueio' : 'Ativa'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-end">
              <button
                onClick={() => setShowScreenSummary(false)}
                className="px-5 py-2.5 rounded-2xl neu-btn text-xs font-bold text-[#E60026] dark:text-[#FF2B4D] hover:text-[#C70020] dark:hover:text-[#FF526D]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Modal / Printable View */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-4xl rounded-[32px] neu-flat-lg p-6 sm:p-8 bg-white text-slate-900 border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-[#E60026]" />
                <div>
                  <h3 className="font-black text-lg text-slate-900">
                    Visualização de Impressão / PDF Oficial
                  </h3>
                  <p className="text-xs text-slate-500">
                    Relatório Mensal de Gestão de Salas - Unidade {unitName || 'Belém'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintPDF}
                  className="px-4 py-2 rounded-xl bg-[#E60026] text-white text-xs font-bold hover:bg-[#C70020] flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir / Salvar PDF
                </button>
                <button
                  onClick={() => setShowPdfModal(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50 rounded-2xl my-3 text-xs border border-slate-200">
              {/* Official Header */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-[#E60026]">
                <div>
                  <span className="text-xs font-black text-[#E60026] tracking-widest uppercase">
                    BRADESCO SEGUROS
                  </span>
                  <h2 className="text-xl font-black text-slate-900 uppercase">
                    RESERVAS • {unitName || 'BELÉM'}
                  </h2>
                  <p className="text-xs text-slate-600">
                    Mês de Referência: <strong>{currentMonthStr}</strong> • Emissão: {new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div className="text-right text-[11px] text-slate-500">
                  <p>Unidade {unitName || 'Belém'}</p>
                  <p>Gestão Predial & Infraestrutura</p>
                </div>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Reservas</span>
                  <span className="text-lg font-black text-[#E60026]">{monthBookings.length}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Salas Cadastradas</span>
                  <span className="text-lg font-black text-slate-800">{rooms.length}</span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Agendamentos Válidos</span>
                  <span className="text-lg font-black text-emerald-600">
                    {monthBookings.filter((b) => !b.isBlock).length}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white border border-slate-200">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Bloqueios Prediais</span>
                  <span className="text-lg font-black text-amber-600">
                    {monthBookings.filter((b) => b.isBlock).length}
                  </span>
                </div>
              </div>

              {/* Table */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-300 text-[11px] font-bold text-slate-700 uppercase bg-slate-200/50">
                    <th className="py-2 px-3">Data</th>
                    <th className="py-2 px-3">Sala</th>
                    <th className="py-2 px-3">Horário</th>
                    <th className="py-2 px-3">Solicitante</th>
                    <th className="py-2 px-3">Setor</th>
                    <th className="py-2 px-3">WhatsApp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {monthBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-500 italic">
                        Nenhum agendamento registrado para este mês.
                      </td>
                    </tr>
                  ) : (
                    monthBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-white/80">
                        <td className="py-2 px-3 font-semibold text-slate-800">{b.date}</td>
                        <td className="py-2 px-3 font-bold text-[#E60026]">{roomMap.get(b.roomId)?.name || b.roomId}</td>
                        <td className="py-2 px-3 font-mono">{b.startTime} - {b.endTime}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800">
                          {b.isBlock ? `BLOQUEIO ADM (${b.blockReason})` : b.userName}
                        </td>
                        <td className="py-2 px-3 text-slate-600">{b.userDepartment || '-'}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{b.userPhone || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowPdfModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
