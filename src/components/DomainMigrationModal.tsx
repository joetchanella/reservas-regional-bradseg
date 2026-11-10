import React, { useState, useEffect } from 'react';
import { ExternalLink, Copy, Check, AlertOctagon, ShieldAlert, Share2, ArrowRight } from 'lucide-react';

export const OFFICIAL_SITE_URL = 'https://joetchanella.github.io/reservas-regional-bradseg/';

export const DomainMigrationModal: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(6);
  const [isOldHost, setIsOldHost] = useState(false);
  const [isAIStudioDevIframe, setIsAIStudioDevIframe] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const host = window.location.hostname.toLowerCase();
    const isOfficial = host === 'joetchanella.github.io';
    const isDevIframe = (host === 'localhost' || host === '127.0.0.1' || host.includes('ais-dev-')) && (window.self !== window.top);

    setIsAIStudioDevIframe(isDevIframe);

    // If not the official domain, this is the old/deprecated host
    if (!isOfficial) {
      setIsOldHost(true);
    }
  }, []);

  // Countdown timer for automatic redirect on the old host (only for real visitors, not inside dev editor iframe)
  useEffect(() => {
    if (!isOldHost || isAIStudioDevIframe) return;

    if (countdown <= 0) {
      window.location.replace(OFFICIAL_SITE_URL);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOldHost, isAIStudioDevIframe, countdown]);

  const handleGoToNewSite = () => {
    window.location.replace(OFFICIAL_SITE_URL);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(OFFICIAL_SITE_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (_) {
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
          text: 'Novo endereço oficial do Sistema de Reservas de Salas (liberado na rede):',
          url: OFFICIAL_SITE_URL,
        });
      } catch (_) {}
    } else {
      handleCopyLink();
    }
  };

  // If we are on the official GitHub Pages domain, do not render anything
  if (!isOldHost) return null;

  // If inside the AI Studio development preview iframe, show only a discreet developer banner
  if (isAIStudioDevIframe) {
    return (
      <div className="bg-amber-600 text-white text-[11px] font-bold py-1 px-3 text-center flex items-center justify-center gap-2 shadow z-50">
        <span>[Ambiente de Edição AI Studio] No endereço público antigo, o acesso é 100% bloqueado e redirecionado para o novo link.</span>
      </div>
    );
  }

  // 100% BLOCKING FULL-SCREEN MODAL — NO DISMISS, NO BYPASS, NO BOOKINGS ALLOWED
  return (
    <div className="fixed inset-0 z-[99999] bg-[#0A0E1A]/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto select-none">
      <div className="w-full max-w-lg rounded-[32px] bg-[#1E2538] border-2 border-[#E60026] p-6 sm:p-8 text-white shadow-2xl shadow-red-950/80 space-y-6 animate-scale-up text-center">
        {/* Animated Warning Icon */}
        <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-[#E60026] to-[#990018] flex items-center justify-center shadow-2xl shadow-[#E60026]/40 animate-pulse">
          <ShieldAlert className="w-10 h-10 text-white" />
        </div>

        {/* Header Titles */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E60026]/20 border border-[#E60026]/50 text-[#FF4D6A] text-xs font-black tracking-widest uppercase">
            <AlertOctagon className="w-3.5 h-3.5" />
            ENDEREÇO DESATIVADO PARA AGENDAMENTOS
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            O Sistema Mudou de Endereço!
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            Para <strong>evitar agendamentos duplicados ou incorretos</strong> e garantir o acesso desbloqueado na rede da Bradesco Seguros, o sistema foi transferido para um novo endereço definitivo.
          </p>
        </div>

        {/* Blocking Notice Box */}
        <div className="p-4 rounded-2xl bg-black/40 border border-[#E60026]/40 text-left space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#FF4D6A] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#E60026] animate-ping" />
              Novo Endereço Oficial Liberado:
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-500/30">
              100% Operacional
            </span>
          </div>

          <div className="font-mono text-xs sm:text-sm font-bold text-white bg-slate-900/90 border border-slate-700 p-3 rounded-xl break-all select-all text-center">
            {OFFICIAL_SITE_URL}
          </div>

          <p className="text-[11px] text-slate-400 leading-snug">
            ⚠️ O acesso a este link anterior foi bloqueado para novas reservas. Todas as salas e agendamentos existentes continuam salvos e acessíveis pelo novo link acima.
          </p>
        </div>

        {/* Auto Redirect Countdown */}
        <div className="space-y-1.5">
          <div className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5">
            <span>Redirecionando você automaticamente em</span>
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-200 font-black text-sm">
              {countdown}
            </span>
            <span>segundos...</span>
          </div>

          {/* Visual progress bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-400 to-[#E60026] h-full transition-all duration-1000 ease-linear"
              style={{ width: `${Math.max(0, (countdown / 6) * 100)}%` }}
            />
          </div>
        </div>

        {/* Main Actions */}
        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={handleGoToNewSite}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#E60026] via-[#D10022] to-[#B3001D] hover:brightness-110 active:scale-[0.98] text-white font-black text-sm sm:text-base tracking-wide shadow-xl shadow-[#E60026]/40 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            <span>Acessar Novo Endereço Agora</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Link Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#FF4D6A]" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition-all"
            >
              <Share2 className="w-3.5 h-3.5 text-[#FF4D6A]" />
              <span>Compartilhar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
