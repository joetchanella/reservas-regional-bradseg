import React, { useState, useEffect } from 'react';
import { MapPin, Check, Building2, Search, X, Sparkles, Navigation } from 'lucide-react';
import { Unit, Room } from '../types';

interface UnitSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: Unit[];
  selectedUnitId: string;
  onSelectUnit: (unitId: string) => void;
  rooms: Room[];
  isInitialPrompt?: boolean;
  rememberPreference?: boolean;
  onToggleRememberPreference?: (val: boolean) => void;
}

export const UnitSelectModal: React.FC<UnitSelectModalProps> = ({
  isOpen,
  onClose,
  units,
  selectedUnitId,
  onSelectUnit,
  rooms,
  isInitialPrompt = false,
  rememberPreference = true,
  onToggleRememberPreference,
}) => {
  const [search, setSearch] = useState('');
  const [unitPendingConfirmation, setUnitPendingConfirmation] = useState<Unit | null>(null);

  // Always ensure 'remember preference' is checked/selected whenever this pop-up appears
  useEffect(() => {
    if (isOpen) {
      onToggleRememberPreference?.(true);
      setUnitPendingConfirmation(null);
    }
  }, [isOpen, onToggleRememberPreference]);

  if (!isOpen) return null;

  const filteredUnits = units.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.city.toLowerCase().includes(q) ||
      (u.state && u.state.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl rounded-[32px] neu-flat-lg bg-[var(--card-surface)] border border-[var(--border-subtle)] overflow-hidden flex flex-col max-h-[92vh] text-[var(--text-primary)] shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#E60026]/15 dark:bg-[#FF2B4D]/15 flex items-center justify-center text-[#E60026] dark:text-[#FF2B4D] flex-shrink-0">
              <MapPin className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black text-[#E60026] dark:text-[#FF2B4D] tracking-widest uppercase">
                BRADESCO SEGUROS • {isInitialPrompt ? 'BOAS-VINDAS' : 'NAVEGAÇÃO'}
              </span>
              <h3 className="font-black text-base sm:text-lg leading-tight">
                {isInitialPrompt
                  ? 'Em qual unidade você deseja agendar?'
                  : 'Selecione sua Unidade / Cidade'}
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

        {/* Anti-Error Welcome Guidance */}
        <div className="p-4 pb-2 border-b border-[var(--border-subtle)] space-y-2.5 bg-[#E60026]/5 dark:bg-rose-950/10">
          <div className="flex items-start gap-2.5 text-xs text-[var(--text-secondary)]">
            <Sparkles className="w-4 h-4 text-[#E60026] dark:text-[#FF2B4D] flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Cada filial possui sua própria agenda e conjunto de salas. Selecione sua cidade para evitar reservas na filial errada. Você poderá trocar a qualquer momento no topo da tela.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative pt-1">
            <Search className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar unidade por cidade ou estado (ex: Belém, Brasília, GO, MA)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl neu-pressed-sm text-xs sm:text-sm text-[var(--text-primary)] border border-[var(--border-subtle)] outline-none focus:border-[#E60026]"
            />
          </div>
        </div>

        {/* Units Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1">
          {filteredUnits.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-secondary)]">
              Nenhuma unidade encontrada para "{search}".
            </div>
          ) : (
            filteredUnits.map((u) => {
              const isSelected = u.id === selectedUnitId;
              const unitRooms = rooms.filter((r) => (r.unitId || 'belem') === u.id);

              return (
                <div
                  key={u.id}
                  onClick={() => setUnitPendingConfirmation(u)}
                  className={`p-4 rounded-2xl transition-all cursor-pointer flex items-center justify-between gap-3 border ${
                    isSelected
                      ? 'neu-pressed border-[#E60026]/40 dark:border-[#FF2B4D]/40 shadow-inner bg-[#E60026]/5 dark:bg-rose-950/20'
                      : 'neu-flat hover:border-[#E60026]/30 dark:hover:border-[#FF2B4D]/30 active:scale-[0.99]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[#E60026] text-white shadow-md'
                          : 'neu-pressed-sm text-[#E60026] dark:text-[#FF2B4D]'
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm sm:text-base text-[var(--text-primary)] truncate">
                          {u.name}
                        </h4>
                        {u.state && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-[#E60026]/10 text-[#E60026] dark:text-[#FF2B4D] border border-[#E60026]/20 uppercase">
                            {u.state}
                          </span>
                        )}
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Selecionada</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                          {unitRooms.length} {unitRooms.length === 1 ? 'sala cadastrada' : 'salas cadastradas'}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)]">•</span>
                        <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                          {unitRooms.filter((r) => r.status === 'active').length} ativas
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 flex-shrink-0 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-[#E60026] text-white hover:bg-[#C70020] shadow-sm active:scale-95'
                    }`}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Entrar</span>
                      </>
                    ) : (
                      <span>Selecionar</span>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with Preference Toggle & Count */}
        <div className="p-4 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-secondary)]">
          {onToggleRememberPreference ? (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberPreference}
                onChange={(e) => onToggleRememberPreference(e.target.checked)}
                className="w-4 h-4 rounded text-[#E60026] accent-[#E60026] cursor-pointer"
              />
              <span className="text-xs text-[var(--text-primary)] font-medium">
                Lembrar minha unidade neste dispositivo
              </span>
            </label>
          ) : (
            <span>{units.length} unidades registradas no sistema</span>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl neu-btn font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Pop-up de Confirmação da Unidade Selecionada (Tamanho Razoável) */}
      {unitPendingConfirmation && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-[32px] neu-flat-lg bg-[var(--card-surface)] border-2 border-[#E60026]/40 p-5 sm:p-6 text-[var(--text-primary)] shadow-2xl space-y-4 animate-scale-up">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E60026]/15 dark:bg-[#FF2B4D]/15 text-[#E60026] dark:text-[#FF2B4D] flex items-center justify-center flex-shrink-0 shadow-inner">
                <MapPin className="w-6 h-6 animate-pulse" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black tracking-widest text-[#E60026] dark:text-[#FF2B4D] uppercase block truncate">
                  CONFIRMAR UNIDADE
                </span>
                <h3 className="text-lg font-black text-[var(--text-primary)] truncate">
                  Acessar {unitPendingConfirmation.name}?
                </h3>
              </div>
            </div>

            {/* Informative Details Box */}
            <div className="p-4 rounded-2xl neu-pressed-sm border border-[var(--border-subtle)] space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                <span className="text-[var(--text-secondary)] font-medium">Regional escolhida:</span>
                <span className="text-sm font-black text-[#E60026] dark:text-[#FF2B4D]">
                  {unitPendingConfirmation.name} {unitPendingConfirmation.state && `(${unitPendingConfirmation.state})`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] font-medium">Cidade:</span>
                <span className="font-bold text-[var(--text-primary)]">{unitPendingConfirmation.city}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] font-medium">Salas para agendamento:</span>
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  {rooms.filter((r) => (r.unitId || 'belem') === unitPendingConfirmation.id).length} salas disponíveis
                </span>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Você entrará no ambiente exclusivo da <strong>Unidade {unitPendingConfirmation.name}</strong>. Todas as salas visualizadas e reservas agendadas pertencerão a esta regional.
            </p>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const confirmedId = unitPendingConfirmation.id;
                  setUnitPendingConfirmation(null);
                  onSelectUnit(confirmedId);
                  onClose();
                }}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#E60026] hover:bg-[#C70020] text-white font-black text-xs sm:text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar e Entrar em {unitPendingConfirmation.name}</span>
              </button>

              <button
                type="button"
                onClick={() => setUnitPendingConfirmation(null)}
                className="w-full py-2.5 px-4 rounded-xl neu-btn text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
              >
                Voltar e escolher outra unidade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

