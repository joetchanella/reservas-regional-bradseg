import React, { useState, useEffect } from 'react';
import { ExternalLink, Copy, Check, AlertTriangle, ShieldCheck, Share2, X, ArrowRight } from 'lucide-react';

export const OFFICIAL_SITE_URL = 'https://joetchanella.github.io/reservas-regional-bradseg/';

export const DomainMigrationModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isOldHost, setIsOldHost] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect if current host is NOT the official GitHub Pages deployment
    const currentHost = window.location.hostname.toLowerCase();
    const isOfficial = currentHost === 'joetchanella.github.io';

    if (!isOfficial) {
      setIsOldHost(true);
      // Check if user temporarily dismissed during this session
      const dismissed = sessionStorage.getItem('bradesco_migration_modal_dismissed') === 'true';
      if (!dismissed) {
        setIsOpen(true);
      }
    }
  }, []);

  const handleGoToNewSite = () => {
    window.location.href = OFFICIAL_SITE_URL;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(OFFICIAL_SITE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (_) {
      // Fallback
      const input = document.createElement('input');
      input.value = OFFICIAL_SITE_URL;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Sistema de Reservas de Salas - Regional Bradesco',
          text: 'Acesse o novo endereço oficial do Sistema de Reservas de Salas:',
          url: OFFICIAL_SITE_URL,
        });
      } catch (_) {}
    } else {
      handleCopyLink();
    }
  };

  const handleDismissModal = () => {
    try {
      sessionStorage.setItem('bradesco_migration_modal_dismissed', 'true');
    } catch (_) {}
    setIsOpen(false);
  };

  // If we are on the official GitHub Pages domain, render nothing
  if (!isOldHost) return null;

  return (
    <>
      {/* Persistent Top Warning Banner if on the old host and modal is closed */}
      {!isOpen && (
        <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-[#E60026] text-white py-2.5 px-3 sm:px-6 shadow-lg sticky top-0 z-40 flex flex-wrap items-center justify-between gap-2 text-xs animate-fade-in">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <AlertTriangle className="w-4 h-4 text-amber-200 flex-shrink-0 animate-bounce" />
            <span className="font-bold truncate">
              Você está no endereço anterior. O novo endereço oficial está liberado para computadores da empresa:
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleGoToNewSite}
              className="py-1 px-3 bg-white text-[#E60026] font-black rounded-lg text-xs hover:bg-white/90 active:scale-95 transition-all shadow flex items-center gap-1.5"
            >
              <span>Ir para o Novo Endereço</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsOpen(true)}
              className="py-1 px-2 text-white/90 hover:text-white underline text-[11px]"
              title="Ver detalhes"
            >
              Ver detalhes
            </button>
          </div>
        </div>
      )}

      {/* Main Migration Pop-up Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-[28px] sm:rounded-[32px] neu-flat-lg bg-[var(--card-surface)] border-2 border-[#E60026] p-5 sm:p-7 text-[var(--text-primary)] shadow-2xl space-y-5 animate-scale-up relative">
            {/* Top Close Button for dev/testing */}
            <button
              type="button"
              onClick={handleDismissModal}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              title="Fechar aviso por enquanto"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Badge & Icon */}
            <div className="flex items-start gap-3.5 pr-8">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#E60026] to-[#C70020] text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#E60026]/30">
                <ExternalLink className="w-7 h-7 animate-pulse" />
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-[#E60026]/10 text-[#E60026] dark:text-[#FF2B4D] mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  MUDANÇA DE ENDEREÇO OFICIAL
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] leading-tight">
                  Novo Link de Acesso ao Sistema!
                </h2>
              </div>
            </div>

            {/* Explanation */}
            <div className="space-y-3 text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              <p>
                Para garantir que <strong>todos os computadores corporativos da Bradesco Seguros</strong> consigam acessar o sistema sem bloqueios de firewall da rede interna, o sistema foi transferido para um novo endereço definitivo:
              </p>

              {/* URL Display Card */}
              <div className="p-3.5 sm:p-4 rounded-2xl neu-pressed-sm border border-[#E60026]/30 bg-[#E60026]/5 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                  <span className="font-bold text-[#E60026] dark:text-[#FF2B4D] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Endereço Oficial Liberado:
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                    Acesso 100% Liberado
                  </span>
                </div>
                <div className="font-mono text-xs sm:text-sm font-black text-[var(--text-primary)] break-all select-all py-1 px-2 rounded-lg bg-white/70 dark:bg-black/30 border border-[var(--border-subtle)]">
                  {OFFICIAL_SITE_URL}
                </div>
              </div>

              <div className="flex items-start gap-2 text-[11px] sm:text-xs text-[var(--text-secondary)] bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Atenção:</strong> Seus dados, reservas e salas continuam os mesmos e sincronizados em tempo real! Atualize seus favoritos com o novo link.
                </span>
              </div>
            </div>

            {/* Primary Action Button */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleGoToNewSite}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#E60026] via-[#D10022] to-[#B3001D] hover:brightness-110 active:scale-[0.98] text-white font-black text-sm sm:text-base tracking-wide shadow-xl shadow-[#E60026]/30 flex items-center justify-center gap-2.5 transition-all group cursor-pointer"
              >
                <span>Acessar Novo Endereço Agora</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="py-2.5 px-3 rounded-xl neu-btn text-xs font-bold text-[var(--text-primary)] hover:text-[#E60026] flex items-center justify-center gap-1.5 transition-all"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-800 dark:text-emerald-300" />
                      <span className="text-emerald-800 dark:text-emerald-300 font-black">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#E60026]" />
                      <span>Copiar Novo Link</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="py-2.5 px-3 rounded-xl neu-btn text-xs font-bold text-[var(--text-primary)] hover:text-[#E60026] flex items-center justify-center gap-1.5 transition-all"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#E60026]" />
                  <span>Compartilhar</span>
                </button>
              </div>

              {/* Dismiss button */}
              <button
                type="button"
                onClick={handleDismissModal}
                className="w-full py-2 text-center text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Continuar neste link temporariamente
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
