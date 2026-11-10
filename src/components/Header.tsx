import React, { useState } from 'react';
import { Moon, Sun, Lock, Unlock, HelpCircle, X, Download, Smartphone, MapPin, ChevronDown, BookOpen, FileText } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { HeaderHomeIcon } from './BradescoIcon';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';
import { ManualsModal } from './ManualsModal';
import { Unit } from '../types';

interface HeaderProps {
  isAdminUnlocked: boolean;
  onOpenAdmin: () => void;
  onGoHome: () => void;
  currentUnit?: Unit | null;
  onOpenUnitSelect?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isAdminUnlocked,
  onOpenAdmin,
  onGoHome,
  currentUnit,
  onOpenUnitSelect,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showManualsModal, setShowManualsModal] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  const handleInstallClick = async () => {
    const result = await install();
    if (result === 'manual_needed' || isIOS) {
      setShowInstallModal(true);
    }
  };

  const unitDisplayName = currentUnit?.name || 'Belém';

  return (
    <>
      <header className="w-full pt-3 sm:pt-6 pb-2 px-3 sm:px-6 md:px-8 max-w-7xl mx-auto flex items-center justify-between gap-2">
        {/* Left: Brand & Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div
            className="flex items-center gap-2.5 sm:gap-3 md:gap-4 cursor-pointer select-none group min-w-0"
            onClick={onGoHome}
            role="button"
            tabIndex={0}
            title="Ir para a Tela Inicial"
          >
            {/* Neumorphic Home Squircle */}
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl neu-flat flex items-center justify-center text-[#E60026] dark:text-[#FF2B4D] group-hover:scale-105 group-active:scale-95 transition-all flex-shrink-0">
              <HeaderHomeIcon className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
            </div>

            <div className="min-w-0">
              <span className="block text-[9px] sm:text-[10px] md:text-xs font-black tracking-widest text-[#E60026] dark:text-[#FF2B4D] uppercase truncate">
                BRADESCO SEGUROS
              </span>
              <h1 className="text-base sm:text-xl md:text-2xl font-black tracking-tight text-[var(--text-primary)] leading-none mt-0.5 truncate uppercase">
                RESERVAS • {unitDisplayName}
              </h1>
            </div>
          </div>

          {/* Unit Selector Pill Button */}
          {onOpenUnitSelect && (
            <button
              onClick={onOpenUnitSelect}
              className="hidden sm:flex items-center gap-1.5 py-1.5 px-3 rounded-2xl neu-flat hover:border-[#E60026]/40 text-xs font-black text-[var(--text-primary)] hover:scale-105 active:scale-95 transition-all flex-shrink-0 ml-1"
              title="Trocar de Unidade / Cidade"
            >
              <MapPin className="w-3.5 h-3.5 text-[#E60026] dark:text-[#FF2B4D]" />
              <span>{unitDisplayName}</span>
              {currentUnit?.state && (
                <span className="text-[10px] opacity-75 font-mono">({currentUnit.state})</span>
              )}
              <ChevronDown className="w-3 h-3 text-[var(--text-secondary)] ml-0.5" />
            </button>
          )}
        </div>

        {/* Right Action Icons: Mobile Unit Switcher, Install, Help, Theme, Lock/Admin */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 flex-shrink-0">
          {/* Mobile Unit Switcher Button */}
          {onOpenUnitSelect && (
            <button
              onClick={onOpenUnitSelect}
              className="sm:hidden h-9 px-2.5 rounded-2xl neu-flat flex items-center justify-center gap-1 text-[var(--text-primary)] text-xs font-black active:scale-95"
              title="Trocar Unidade"
            >
              <MapPin className="w-3.5 h-3.5 text-[#E60026] dark:text-[#FF2B4D]" />
              <span className="max-w-[70px] truncate">{unitDisplayName}</span>
            </button>
          )}

          {/* Install PWA Button (Always available unless already in standalone mode) */}
          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              className="h-9 sm:h-10 md:h-11 px-2.5 sm:px-3 rounded-2xl neu-flat flex items-center justify-center gap-1.5 text-[#E60026] dark:text-[#FF2B4D] hover:scale-105 active:scale-95 transition-all text-xs font-bold"
              title="Instalar Aplicativo (PWA)"
              aria-label="Instalar Aplicativo"
            >
              <Download className="w-4 h-4 text-[#E60026] dark:text-[#FF2B4D]" />
              <span className="hidden md:inline">Instalar App</span>
            </button>
          )}

          {/* Manuals (PDF) & Help Button */}
          <button
            onClick={() => setShowManualsModal(true)}
            className="h-9 sm:h-10 md:h-11 px-2.5 sm:px-3 rounded-2xl neu-flat flex items-center justify-center gap-1.5 text-[var(--text-secondary)] hover:text-[#E60026] dark:hover:text-[#FF2B4D] hover:scale-105 active:scale-95 transition-all text-xs font-bold"
            title="Manuais de Instrução Passo a Passo (PDF) e Ajuda"
            aria-label="Manuais de Instrução e Ajuda"
          >
            <BookOpen className="w-4 h-4 text-[#E60026] dark:text-[#FF2B4D]" />
            <span className="hidden sm:inline">Manuais</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-2xl neu-flat flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:scale-105 active:scale-95 transition-all"
            title={theme === 'dark' ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            aria-label="Alternar Tema"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>

          {/* Admin Lock Button */}
          <button
            onClick={onOpenAdmin}
            className={`w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center transition-all ${
              isAdminUnlocked
                ? 'neu-pressed text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-500/30'
                : 'neu-flat text-[var(--text-secondary)] hover:text-[#E60026] dark:hover:text-[#FF2B4D] hover:scale-105 active:scale-95'
            }`}
            title="Painel Administrativo"
          >
            {isAdminUnlocked ? (
              <Unlock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-800 dark:text-emerald-300" />
            ) : (
              <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </div>
      </header>

      {/* PWA Install Guide Modal */}
      <PWAInstallModal
        isOpen={showInstallModal}
        onClose={() => setShowInstallModal(false)}
        onInstallDirect={install}
        isInstallable={isInstallable}
        isIOS={isIOS}
        isInstalled={isInstalled}
      />

      {/* Manuals Modal with User Guide (Exclusively for common users, admin manual is restricted to Admin area) */}
      <ManualsModal
        isOpen={showManualsModal}
        onClose={() => setShowManualsModal(false)}
        allowAdminManual={false}
        defaultTab="user"
      />
    </>
  );
};
