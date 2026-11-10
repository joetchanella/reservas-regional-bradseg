import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { HeaderHomeIcon } from './BradescoIcon';

interface PWAInstallBannerProps {
  onOpenModal: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onOpenModal }) => {
  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if dismissed previously in this session
    const isDismissed = sessionStorage.getItem('pwa_banner_dismissed') === 'true';
    if (isDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('pwa_banner_dismissed', 'true');
  };

  const handleInstall = async () => {
    if (isInstallable) {
      setInstalling(true);
      try {
        const res = await install();
        if (res === 'installed') {
          handleDismiss();
          return;
        }
      } finally {
        setInstalling(false);
      }
    }
    // If not direct or iOS, open the step-by-step modal guide
    onOpenModal();
  };

  // If already installed as PWA or user dismissed this session, don't show
  if (isInstalled || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-3 sm:bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-slide-up">
      <div className="p-3.5 sm:p-4 rounded-3xl neu-flat-lg bg-[var(--card-surface)] border-2 border-[#E60026]/30 shadow-2xl flex items-center justify-between gap-3 text-[var(--text-primary)]">
        {/* Left: App Icon & Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl neu-flat flex items-center justify-center text-[#E60026] dark:text-[#FF2B4D] flex-shrink-0">
            <HeaderHomeIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-[#E60026] dark:text-[#FF2B4D] tracking-widest uppercase">
                APP PWA
              </span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25">
                Instalável
              </span>
            </div>
            <h4 className="font-extrabold text-xs sm:text-sm text-[var(--text-primary)] truncate leading-tight">
              Instalar Reservas Regional
            </h4>
            <p className="text-[10px] text-[var(--text-secondary)] truncate">
              {isIOS ? 'Adicione à tela de início no Safari' : 'Acesse rápido direto da sua tela inicial'}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstall}
            disabled={installing}
            className="py-2 px-3 sm:px-3.5 rounded-xl bg-[#E60026] hover:bg-[#C70020] text-white text-xs font-black shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{installing ? '...' : 'Instalar'}</span>
          </button>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-xl neu-btn text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            title="Fechar"
            aria-label="Dispensar aviso de instalação"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
