import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { DateCarousel } from './components/DateCarousel';
import { MonthlyConferenceBanner } from './components/MonthlyConferenceBanner';
import { RoomsView } from './components/RoomsView';
import { AdminPanel } from './components/AdminPanel';
import { BookingModal } from './components/BookingModal';
import { BookingDetailModal } from './components/BookingDetailModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { PWAInstallModal } from './components/PWAInstallModal';
import { UnitSelectModal } from './components/UnitSelectModal';
import { Room, Booking, Department, ActiveTab, Unit, AdminSession } from './types';
import {
  subscribeRooms,
  subscribeBookings,
  subscribeDepartments,
  subscribeUnits,
  seedInitialDataIfNeeded,
  deleteBooking,
} from './services/firestoreService';
import { testConnection } from './firebase';
import { formatDateToISO, isWeekend, getWorkingDaysList } from './utils/dateUtils';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { usePWAInstall } from './hooks/usePWAInstall';
import { WifiOff, CheckCircle2, MapPin, ArrowLeftRight, Check, Sparkles } from 'lucide-react';

export function AppContent() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Set default view to 'rooms' ("Espaços") matching the reference image!
  const [activeTab, setActiveTab] = useState<ActiveTab>('rooms');

  // Reference Month string: "2026-10"
  const [currentMonthStr, setCurrentMonthStr] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  // Selected date for day view
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const todayISO = formatDateToISO(today);
    if (isWeekend(todayISO)) {
      const working = getWorkingDaysList(today, 1);
      return working[0] || todayISO;
    }
    return todayISO;
  });

  // Live real-time clock string (e.g. "21:40")
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('21:40');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Firestore Collections State
  const [units, setUnits] = useState<Unit[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Selected Unit State (persisted in localStorage)
  const [activeUnitId, setActiveUnitId] = useState<string>(() => {
    try {
      return localStorage.getItem('bradesco_active_unit') || 'belem';
    } catch (_) {
      return 'belem';
    }
  });

  // Remember unit preference across visits (always true by default whenever modal appears)
  const [rememberUnit, setRememberUnit] = useState<boolean>(true);

  // Track if unit selection was already confirmed in this session
  const [sessionUnitConfirmed, setSessionUnitConfirmed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('bradesco_session_unit_confirmed') === 'true';
    } catch (_) {
      return false;
    }
  });

  const [isUnitSelectModalOpen, setIsUnitSelectModalOpen] = useState(false);
  const [showUnitWelcomeModal, setShowUnitWelcomeModal] = useState<boolean>(false);

  const handleOpenUnitSelect = useCallback(() => {
    setRememberUnit(true);
    setIsUnitSelectModalOpen(true);
  }, []);

  useEffect(() => {
    const savedActiveUnit = localStorage.getItem('bradesco_active_unit');
    const hasExplicitSaved = localStorage.getItem('bradesco_remember_unit') === 'true' && savedActiveUnit;
    if (units.length > 0 && !sessionUnitConfirmed && !hasExplicitSaved) {
      setRememberUnit(true);
      setIsUnitSelectModalOpen(true);
    }
  }, [units.length, sessionUnitConfirmed]);

  // Informative welcome pop-up when launching app to ensure user knows active branch
  useEffect(() => {
    if (units.length > 0 && !isUnitSelectModalOpen) {
      try {
        const acknowledged = sessionStorage.getItem('bradesco_welcome_acknowledged');
        if (acknowledged !== 'true') {
          setShowUnitWelcomeModal(true);
        }
      } catch (_) {}
    }
  }, [units.length, isUnitSelectModalOpen]);

  const handleAcknowledgeUnitWelcome = useCallback(() => {
    try {
      sessionStorage.setItem('bradesco_welcome_acknowledged', 'true');
    } catch (_) {}
    setShowUnitWelcomeModal(false);
  }, []);

  const handleChangeUnitFromWelcome = useCallback(() => {
    try {
      sessionStorage.setItem('bradesco_welcome_acknowledged', 'true');
    } catch (_) {}
    setShowUnitWelcomeModal(false);
    handleOpenUnitSelect();
  }, [handleOpenUnitSelect]);

  // Ensure activeUnitId points to a valid unit when units are modified/deleted
  useEffect(() => {
    if (units.length > 0) {
      const exists = units.some((u) => u.id === activeUnitId);
      if (!exists && units[0]) {
        setActiveUnitId(units[0].id);
        try {
          localStorage.setItem('bradesco_active_unit', units[0].id);
        } catch (_) {}
      }
    }
  }, [units, activeUnitId]);

  // Admin PIN unlocked state and session details
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminSession, setAdminSession] = useState<AdminSession>({
    role: 'none',
    unitId: null,
  });

  const handleSelectUnit = useCallback((unitId: string) => {
    setActiveUnitId(unitId);
    setSessionUnitConfirmed(true);
    try {
      if (rememberUnit) {
        localStorage.setItem('bradesco_active_unit', unitId);
        localStorage.setItem('bradesco_remember_unit', 'true');
      } else {
        localStorage.removeItem('bradesco_active_unit');
        localStorage.setItem('bradesco_remember_unit', 'false');
      }
      sessionStorage.setItem('bradesco_session_unit_confirmed', 'true');
      sessionStorage.setItem('bradesco_welcome_acknowledged', 'true');
    } catch (_) {}
  }, [rememberUnit]);

  const handleToggleRememberUnit = useCallback((remember: boolean) => {
    setRememberUnit(remember);
    try {
      localStorage.setItem('bradesco_remember_unit', String(remember));
    } catch (_) {}
  }, []);

  const handleUnlockWithSession = useCallback(
    (session: AdminSession) => {
      setAdminSession(session);
      setIsAdminUnlocked(true);
      if (session.role === 'unit_admin' && session.unitId) {
        handleSelectUnit(session.unitId);
      }
    },
    [handleSelectUnit]
  );

  const handleLockAdmin = useCallback(() => {
    setIsAdminUnlocked(false);
    setAdminSession({ role: 'none', unitId: null });
  }, []);

  // Modals state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSlotRoom, setSelectedSlotRoom] = useState<Room | undefined>(undefined);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string | undefined>(undefined);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const isOnline = useOnlineStatus();

  // Test Firestore Connection and Seed on Boot
  useEffect(() => {
    let isMounted = true;

    async function init() {
      await testConnection();
      await seedInitialDataIfNeeded();
    }

    init();

    const unsubUnits = subscribeUnits(
      (data) => {
        if (!isMounted) return;
        setUnits(data);
      },
      (err) => console.error('Units subscription error:', err)
    );

    const unsubRooms = subscribeRooms(
      (data) => {
        if (!isMounted) return;
        setRooms(data);
      },
      (err) => console.error('Rooms subscription error:', err)
    );

    const unsubBookings = subscribeBookings(
      (data) => {
        if (!isMounted) return;
        setBookings(data);
      },
      (err) => console.error('Bookings subscription error:', err)
    );

    const unsubDepts = subscribeDepartments(
      (data) => {
        if (!isMounted) return;
        setDepartments(data);
      },
      (err) => console.error('Departments subscription error:', err)
    );

    return () => {
      isMounted = false;
      unsubUnits();
      unsubRooms();
      unsubBookings();
      unsubDepts();
    };
  }, []);

  // Current active unit object
  const currentUnit = useMemo(() => {
    return (
      units.find((u) => u.id === activeUnitId) ||
      units.find((u) => u.id === 'belem') ||
      units[0] ||
      null
    );
  }, [units, activeUnitId]);

  // Scoped rooms and bookings for the currently active unit (User view isolation)
  const activeRooms = useMemo(() => {
    return rooms.filter((r) => (r.unitId || 'belem') === activeUnitId);
  }, [rooms, activeUnitId]);

  const activeBookings = useMemo(() => {
    return bookings.filter((b) => (b.unitId || 'belem') === activeUnitId);
  }, [bookings, activeUnitId]);

  // Auto-lock Admin on tab blur or visibilitychange
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleLockAdmin();
      }
    };
    const handleWindowBlur = () => {
      handleLockAdmin();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [handleLockAdmin]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSlotClick = (room: Room, startTime: string) => {
    setSelectedSlotRoom(room);
    setSelectedSlotTime(startTime);
    setBookingToEdit(null);
    setIsBookingModalOpen(true);
  };

  const handleBookingClick = (booking: Booking, room: Room) => {
    setSelectedBooking(booking);
    setSelectedSlotRoom(room);
    setIsDetailModalOpen(true);
  };

  const handleBookRoom = (room: Room, startTime?: string) => {
    setSelectedSlotRoom(room);
    setSelectedSlotTime(startTime || undefined);
    setBookingToEdit(null);
    setIsBookingModalOpen(true);
  };

  const handleEditBooking = (booking: Booking) => {
    const room = rooms.find((r) => r.id === booking.roomId);
    setSelectedSlotRoom(room);
    setBookingToEdit(booking);
    setIsBookingModalOpen(true);
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await deleteBooking(bookingId);
      showToast('Reserva cancelada com sucesso!');
    } catch (err: any) {
      alert(`Erro ao cancelar: ${err.message}`);
    }
  };

  const currentDetailRoom = useMemo(() => {
    if (!selectedBooking) return null;
    return rooms.find((r) => r.id === selectedBooking.roomId) || null;
  }, [rooms, selectedBooking]);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Offline Toast */}
      {!isOnline && (
        <div className="sticky top-0 z-50 bg-[#E60026] text-white text-xs font-bold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-md">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>Modo Offline: Verifique sua conexão com a internet.</span>
        </div>
      )}

      {/* Header with Unit Indicator, Switcher, Padlock for Admin and Brand Home */}
      <Header
        isAdminUnlocked={isAdminUnlocked}
        currentUnit={currentUnit}
        onOpenUnitSelect={handleOpenUnitSelect}
        onOpenAdmin={() => {
          if (activeTab === 'admin') {
            handleLockAdmin();
            setActiveTab('rooms');
          } else {
            setActiveTab('admin');
          }
        }}
        onGoHome={() => {
          handleLockAdmin();
          setActiveTab('rooms');
        }}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-5 pb-24 sm:pb-16 space-y-6">
        {/* Views */}
        {activeTab === 'rooms' && (
          <div className="space-y-6">
            {/* Monthly Conference Banner */}
            <MonthlyConferenceBanner
              rooms={activeRooms}
              bookings={activeBookings}
              currentMonthStr={currentMonthStr}
              onChangeMonth={(m) => setCurrentMonthStr(m)}
              unitName={currentUnit?.name}
            />

            {/* Business Days Carousel */}
            <DateCarousel
              selectedDate={selectedDate}
              onSelectDate={(d) => setSelectedDate(d)}
            />

            {/* Espaços Grid scoped to selected unit */}
            <RoomsView
              rooms={activeRooms}
              bookings={activeBookings}
              selectedDate={selectedDate}
              currentTimeStr={currentTimeStr}
              onBookRoom={handleBookRoom}
              onBookingClick={handleBookingClick}
            />
          </div>
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            rooms={rooms}
            bookings={bookings}
            departments={departments}
            units={units}
            activeUnitId={activeUnitId}
            onSelectUnit={handleSelectUnit}
            isUnlocked={isAdminUnlocked}
            adminSession={adminSession}
            onUnlockWithSession={handleUnlockWithSession}
            onLock={handleLockAdmin}
            onBookingClick={handleBookingClick}
            onEditBooking={handleEditBooking}
            selectedDate={selectedDate}
            onBackToRooms={() => {
              handleLockAdmin();
              setActiveTab('rooms');
            }}
          />
        )}
      </main>

      {/* Booking Modals */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setBookingToEdit(null);
        }}
        rooms={activeRooms}
        departments={departments}
        allBookings={bookings}
        preSelectedRoom={selectedSlotRoom}
        preSelectedDate={selectedDate}
        preSelectedStartTime={selectedSlotTime}
        bookingToEdit={bookingToEdit}
        unitName={currentUnit?.name || 'Belém'}
        unitState={currentUnit?.state}
        onOpenUnitSelect={() => {
          setIsBookingModalOpen(false);
          handleOpenUnitSelect();
        }}
        onSuccess={() => {
          showToast(bookingToEdit ? 'Reserva atualizada com sucesso!' : 'Reserva confirmada com sucesso!');
        }}
      />

      <BookingDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        booking={selectedBooking}
        room={currentDetailRoom}
        isAdmin={isAdminUnlocked}
        unitName={currentUnit?.name || 'Belém'}
        onEdit={handleEditBooking}
        onDelete={handleCancelBooking}
      />

      {/* Unit Selection Modal (Easy, non-confusing picker with search and details) */}
      <UnitSelectModal
        isOpen={isUnitSelectModalOpen}
        onClose={() => setIsUnitSelectModalOpen(false)}
        units={units}
        selectedUnitId={activeUnitId}
        onSelectUnit={handleSelectUnit}
        rooms={rooms}
        isInitialPrompt={!sessionUnitConfirmed && !rememberUnit}
        rememberPreference={rememberUnit}
        onToggleRememberPreference={handleToggleRememberUnit}
      />

      {/* Pop-up Informativo de Boas-Vindas ao Abrir o App */}
      {showUnitWelcomeModal && currentUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-[32px] neu-flat-lg bg-[var(--card-surface)] border-2 border-[#E60026]/40 p-5 sm:p-6 text-[var(--text-primary)] shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#E60026]/15 dark:bg-[#FF2B4D]/15 text-[#E60026] dark:text-[#FF2B4D] flex items-center justify-center flex-shrink-0 shadow-inner">
                <MapPin className="w-6 h-6 animate-pulse" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black tracking-widest text-[#E60026] dark:text-[#FF2B4D] uppercase block truncate">
                  BRADESCO SEGUROS • AMBIENTE ATIVO
                </span>
                <h3 className="text-lg font-black text-[var(--text-primary)] truncate">
                  Unidade {currentUnit.name}
                </h3>
              </div>
            </div>

            <div className="p-4 rounded-2xl neu-pressed-sm border border-[var(--border-subtle)] space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
                <span className="text-[var(--text-secondary)] font-medium">Regional atual:</span>
                <span className="text-sm font-black text-[#E60026] dark:text-[#FF2B4D]">
                  {currentUnit.name} {currentUnit.state && `(${currentUnit.state})`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] font-medium">Cidade:</span>
                <span className="font-bold text-[var(--text-primary)]">{currentUnit.city}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[var(--text-secondary)] font-medium">Salas disponíveis:</span>
                <span className="font-bold text-emerald-800 dark:text-emerald-300">
                  {activeRooms.length} {activeRooms.length === 1 ? 'sala ativa' : 'salas ativas'}
                </span>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Você está navegando no ambiente da <strong>Unidade {currentUnit.name}</strong>. Todas as consultas de disponibilidade e novos agendamentos serão realizados para as salas desta filial.
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleAcknowledgeUnitWelcome}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#E60026] hover:bg-[#C70020] text-white font-black text-xs sm:text-sm tracking-wide shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Continuar na Unidade {currentUnit.name}</span>
              </button>

              <button
                type="button"
                onClick={handleChangeUnitFromWelcome}
                className="w-full py-2.5 px-4 rounded-xl neu-btn text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center gap-1.5 transition-all"
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-[#E60026] dark:text-[#FF2B4D]" />
                <span>Não é esta unidade? Trocar de Unidade</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating PWA Install Prompt Banner */}
      <PWAInstallBanner onOpenModal={() => setIsInstallModalOpen(true)} />

      {/* PWA Installation Guide Modal */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        onInstallDirect={install}
        isInstallable={isInstallable}
        isIOS={isIOS}
        isInstalled={isInstalled}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#E60026] text-white text-xs sm:text-sm font-black tracking-wide py-3 px-6 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
