import React, { useState } from 'react';
import {
  Download,
  X,
  Smartphone,
  Apple,
  Monitor,
  Share2,
  PlusSquare,
  CheckCircle2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { HeaderHomeIcon } from './BradescoIcon';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallDirect: () => Promise<'prompted' | 'manual_needed' | 'installed'>;
  isInstallable: boolean;
  isIOS: boolean;
  isInstalled: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onInstallDirect,
  isInstallable,
  isIOS,
  isInstalled,
}) => {
  const [activeDeviceTab, setActiveDeviceTab] = useState<'ios' | 'android' | 'desktop'>(
    isIOS ? 'ios' : 'android'
  );
  const [installing, setInstalling] = useState(false);

  if (!isOpen) return null;

  const handleDirectClick = async () => {
    setInstalling(true);
    try {
      const res = await onInstallDirect();
      if (res === 'installed') {
        onClose();
      }
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-[32px] neu-flat-lg bg-[var(--card-surface)] border border-[var(--border-subtle)] overflow-hidden flex flex-col max-h-[92vh] text-[var(--text-primary)]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl neu-flat flex items-center justify-center text-[#E60026] dark:text-[#FF2B4D] flex-shrink-0">
              <HeaderHomeIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black text-[#E60026] dark:text-[#FF2B4D] tracking-widest uppercase">
                BRADESCO SEGUROS • REGIONAL
              </span>
              <h3 className="font-black text-base sm:text-lg">
                Instalar Aplicativo (PWA)
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

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {/* Main prompt benefit card */}
          <div className="p-4 rounded-2xl neu-pressed-sm flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-[#E60026] dark:text-[#FF2B4D] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[var(--text-primary)] text-xs sm:text-sm">
                Acesse como um aplicativo nativo no seu dispositivo
              </p>
              <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                Abra direto da sua tela de início sem barra de navegação, com carregamento ultrarrápido, suporte offline e notificações do sistema.
              </p>
            </div>
          </div>

          {/* Direct Install Button if supported by current browser session */}
          {isInstallable && (
            <button
              onClick={handleDirectClick}
              disabled={installing}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#E60026] hover:bg-[#C70020] text-white font-black text-xs sm:text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{installing ? 'Instalando...' : 'Instalar Agora no Dispositivo'}</span>
            </button>
          )}

          {/* Already installed banner */}
          {isInstalled && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>O aplicativo já está instalado neste dispositivo!</span>
            </div>
          )}

          {/* Device Tabs */}
          <div className="pt-2">
            <span className="block text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              Instruções por Dispositivo:
            </span>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setActiveDeviceTab('android')}
                className={`py-2 px-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeDeviceTab === 'android'
                    ? 'neu-pressed text-[#E60026] dark:text-[#FF2B4D] border border-[#E60026]/30 dark:border-[#FF2B4D]/30'
                    : 'neu-btn text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Android</span>
              </button>

              <button
                onClick={() => setActiveDeviceTab('ios')}
                className={`py-2 px-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeDeviceTab === 'ios'
                    ? 'neu-pressed text-[#E60026] dark:text-[#FF2B4D] border border-[#E60026]/30 dark:border-[#FF2B4D]/30'
                    : 'neu-btn text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Apple className="w-3.5 h-3.5" />
                <span>iPhone / iPad</span>
              </button>

              <button
                onClick={() => setActiveDeviceTab('desktop')}
                className={`py-2 px-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  activeDeviceTab === 'desktop'
                    ? 'neu-pressed text-[#E60026] dark:text-[#FF2B4D] border border-[#E60026]/30 dark:border-[#FF2B4D]/30'
                    : 'neu-btn text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Computador</span>
              </button>
            </div>
          </div>

          {/* Tab Content Instructions */}
          <div className="p-4 rounded-2xl neu-flat border border-[var(--border-subtle)] space-y-3">
            {activeDeviceTab === 'android' && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-xs text-[var(--text-primary)]">
                  <Smartphone className="w-4 h-4 text-[#E60026] dark:text-[#FF2B4D]" />
                  <span>Como instalar no Android (Google Chrome ou Edge):</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                  <li>
                    Toque nos <strong className="text-[var(--text-primary)]">três pontinhos (⋮)</strong> no canto superior direito do navegador.
                  </li>
                  <li>
                    Procure e toque na opção <strong className="text-[var(--text-primary)]">"Instalar aplicativo"</strong> ou <strong className="text-[var(--text-primary)]">"Adicionar à tela inicial"</strong>.
                  </li>
                  <li>
                    Confirme tocando em <strong className="text-[var(--text-primary)]">"Instalar"</strong>. O ícone de <strong>Reservas Regional</strong> ficará acessível como app.
                  </li>
                </ol>
              </div>
            )}

            {activeDeviceTab === 'ios' && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-xs text-[var(--text-primary)]">
                  <Apple className="w-4 h-4 text-[#E60026] dark:text-[#FF2B4D]" />
                  <span>Como instalar no iPhone ou iPad (Safari):</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                  <li>
                    No Safari, toque no ícone de <strong className="text-[var(--text-primary)]">Compartilhar</strong> (quadrado com seta para cima <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-sky-700 dark:text-sky-400" />) na barra inferior.
                  </li>
                  <li>
                    Role as opções e toque em <strong className="text-[var(--text-primary)]">"Adicionar à Tela de Início"</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-[#E60026] dark:text-[#FF2B4D]" />).
                  </li>
                  <li>
                    Toque em <strong className="text-[var(--text-primary)]">"Adicionar"</strong> no canto superior direito. Pronto! O app abrirá em tela cheia.
                  </li>
                </ol>
              </div>
            )}

            {activeDeviceTab === 'desktop' && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-xs text-[var(--text-primary)]">
                  <Monitor className="w-4 h-4 text-[#E60026] dark:text-[#FF2B4D]" />
                  <span>Como instalar no Computador (Windows / Mac / Linux):</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-xs text-[var(--text-secondary)] leading-relaxed">
                  <li>
                    No Google Chrome ou Microsoft Edge, clique no ícone de <strong className="text-[var(--text-primary)]">Instalar Aplicativo (⤓)</strong> localizado na barra de endereço (à direita, próximo à estrela de favoritos).
                  </li>
                  <li>
                    Ou abra o Menu <strong className="text-[var(--text-primary)]">(⋮)</strong> &gt; <strong className="text-[var(--text-primary)]">Instalar Reservas Regional...</strong>
                  </li>
                  <li>
                    O sistema criará um atalho dedicado na sua área de trabalho e na barra de tarefas.
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-subtle)] flex items-center justify-end">
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-2xl neu-btn text-xs font-bold text-[#E60026] dark:text-[#FF2B4D] hover:text-[#C70020] dark:hover:text-[#FF526D]"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
