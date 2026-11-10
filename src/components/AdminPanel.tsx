import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  DoorOpen,
  Plus,
  Trash2,
  Edit2,
  Lock,
  Unlock,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  FileSpreadsheet,
  Cpu,
  Building2,
  Calendar,
  Clock,
  Sparkles,
  RefreshCw,
  LogOut,
  AlertCircle,
  X,
  Search,
  Edit,
  LayoutDashboard,
  LayoutGrid,
  List,
  History,
  CalendarCheck,
  Eye,
  EyeOff,
  Check,
  KeyRound,
  Globe,
  BookOpen,
} from 'lucide-react';
import { AdminDashboard } from './AdminDashboard';
import { ManualsModal } from './ManualsModal';
import { Room, Booking, Department, AnomalyAlert, RoomStatus, Unit, AdminSession } from '../types';
import {
  saveRoom,
  deleteRoom,
  createBooking,
  deleteBooking,
  addDepartment,
  deleteDepartment,
  exportDatabaseBackup,
  restoreDatabaseFromJson,
  importBookingsFromCsvText,
  DEVELOPER_PIN,
  createUnit,
  updateUnit,
  deleteUnit,
} from '../services/firestoreService';
import { detectAnomalies } from '../utils/anomalyDetector';
import { exportBookingsToCSV } from '../utils/exportUtils';
import {
  TIME_SLOTS,
  formatDateToISO,
  isWeekend,
  formatFriendlyDate,
  formatPhoneNumber,
  formatRegistrationDateTime,
} from '../utils/dateUtils';

interface AdminPanelProps {
  rooms: Room[];
  bookings: Booking[];
  departments: Department[];
  units: Unit[];
  activeUnitId: string;
  onSelectUnit: (unitId: string) => void;
  isUnlocked: boolean;
  adminSession: AdminSession;
  onUnlockWithSession: (session: AdminSession) => void;
  onLock: () => void;
  onBookingClick: (booking: Booking, room: Room) => void;
  onEditBooking?: (booking: Booking) => void;
  selectedDate: string;
  onBackToRooms?: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  rooms,
  bookings,
  departments,
  units,
  activeUnitId,
  onSelectUnit,
  isUnlocked,
  adminSession,
  onUnlockWithSession,
  onLock,
  onBookingClick,
  onEditBooking,
  selectedDate,
  onBackToRooms,
}) => {
  // PIN Pad state
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Admin Sub-tabs (including developer-only 'units' tab)
  type AdminSubTab = 'dashboard' | 'rooms' | 'bookings' | 'blocks' | 'anomalies' | 'backup' | 'departments' | 'units';
  const [adminSubTab, setAdminSubTab] = useState<AdminSubTab>('dashboard');

  // Multi-unit management state (Developer only)
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitCity, setNewUnitCity] = useState('');
  const [newUnitState, setNewUnitState] = useState('');
  const [newUnitPin, setNewUnitPin] = useState('');
  const [newUnitDescription, setNewUnitDescription] = useState('');
  const [isCreatingUnit, setIsCreatingUnit] = useState(false);
  const [showUnitPins, setShowUnitPins] = useState<Record<string, boolean>>({});
  const [unitToDelete, setUnitToDelete] = useState<Unit | null>(null);
  const [isDeletingUnit, setIsDeletingUnit] = useState(false);
  const [unitSuccessMessage, setUnitSuccessMessage] = useState<string | null>(null);

  // Unit edit modal state
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [editUnitName, setEditUnitName] = useState('');
  const [editUnitCity, setEditUnitCity] = useState('');
  const [editUnitState, setEditUnitState] = useState('');
  const [editUnitPin, setEditUnitPin] = useState('');
  const [editUnitDescription, setEditUnitDescription] = useState('');
  const [isSavingEditUnit, setIsSavingEditUnit] = useState(false);
  const [showAdminManualModal, setShowAdminManualModal] = useState(false);

  // Effective Unit ID:
  // If unit_admin, strictly lock to adminSession.unitId
  // If developer, use activeUnitId (which developer can switch via dropdown)
  const effectiveUnitId =
    adminSession.role === 'unit_admin' && adminSession.unitId
      ? adminSession.unitId
      : activeUnitId;

  const currentUnit =
    units.find((u) => u.id === effectiveUnitId) ||
    units.find((u) => u.id === 'belem') ||
    units[0];

  // Filter rooms and bookings for the effective unit
  const effectiveRooms = rooms.filter((r) => (r.unitId || 'belem') === effectiveUnitId);
  const effectiveBookings = bookings.filter((b) => (b.unitId || 'belem') === effectiveUnitId);

  // Room modal state
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [roomCapacity, setRoomCapacity] = useState(6);
  const [roomResources, setRoomResources] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [roomStatus, setRoomStatus] = useState<RoomStatus>('active');
  const [roomMaintenanceReason, setRoomMaintenanceReason] = useState('');

  // Room delete modal state
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);

  // Booking delete modal state
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [isDeletingBooking, setIsDeletingBooking] = useState(false);
  const [searchBookingAdmin, setSearchBookingAdmin] = useState('');
  const [bookingsViewMode, setBookingsViewMode] = useState<'table' | 'cards'>('table');

  // Super Admin unit filter for the Bookings Tab ('all' or specific unitId)
  const [superAdminBookingsUnitFilter, setSuperAdminBookingsUnitFilter] = useState<string>('all');

  // Scoped bookings: strictly locked to unit admin's unit, or filterable by super admin
  const scopedBookings = React.useMemo(() => {
    if (adminSession.role === 'unit_admin') {
      return bookings.filter((b) => (b.unitId || 'belem') === effectiveUnitId);
    }
    // Super Admin / Developer role
    if (superAdminBookingsUnitFilter === 'all') {
      return bookings;
    }
    return bookings.filter((b) => (b.unitId || 'belem') === superAdminBookingsUnitFilter);
  }, [adminSession.role, effectiveUnitId, bookings, superAdminBookingsUnitFilter]);

  // Quick Block state
  const [blockRoomId, setBlockRoomId] = useState(effectiveRooms[0]?.id || rooms[0]?.id || '');
  const [blockDate, setBlockDate] = useState(selectedDate || formatDateToISO(new Date()));
  const [blockType, setBlockType] = useState<'morning' | 'afternoon' | 'fullday' | 'custom' | 'indefinite'>('morning');
  const [blockCustomStart, setBlockCustomStart] = useState('08:00');
  const [blockCustomEnd, setBlockCustomEnd] = useState('12:00');
  const [blockReason, setBlockReason] = useState('Treinamento Interno');
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);
  const [blockMessage, setBlockMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Department State
  const [newDeptName, setNewDeptName] = useState('');

  // Backup / Restore state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isImportingCsv, setIsImportingCsv] = useState(false);

  // CSV Filter state
  const [csvRoomFilter, setCsvRoomFilter] = useState('all');
  const [csvStartDate, setCsvStartDate] = useState('');
  const [csvEndDate, setCsvEndDate] = useState('');

  // Detect anomalies dynamically - scoped to unit admin's unit if unit_admin, or full system for developer
  const anomalies = React.useMemo(() => {
    return detectAnomalies(
      adminSession.role === 'unit_admin' ? effectiveRooms : rooms,
      adminSession.role === 'unit_admin' ? effectiveBookings : bookings
    );
  }, [adminSession.role, effectiveRooms, rooms, effectiveBookings, bookings]);

  // Keep a ref to onLock to ensure unmount cleanup never triggers on normal re-renders
  const onLockRef = useRef(onLock);
  useEffect(() => {
    onLockRef.current = onLock;
  }, [onLock]);

  // Auto-lock ONLY when AdminPanel truly unmounts (when user leaves admin panel)
  useEffect(() => {
    return () => {
      onLockRef.current();
    };
  }, []);

  // Reset PIN input when locked
  useEffect(() => {
    if (!isUnlocked) {
      setPinInput('');
      setPinError(false);
    }
  }, [isUnlocked]);

  // Auto-lock on inactivity (5 minutes) or when window/tab is hidden
  useEffect(() => {
    if (!isUnlocked) return;

    let inactivityTimer: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        onLockRef.current();
      }, 5 * 60 * 1000);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        onLockRef.current();
      }
    };

    resetTimer();

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isUnlocked]);

  // Validate PIN entry
  const checkPin = (code: string) => {
    // 1. Developer Master Password (310898)
    if (code === DEVELOPER_PIN) {
      setPinError(false);
      setPinInput('');
      onUnlockWithSession({
        role: 'developer',
        unitId: null,
        unitName: 'Desenvolvedor / Super Admin',
      });
      return;
    }

    // 2. Unit Admin Password (matching any unit's adminPin)
    const matchedUnit = units.find((u) => u.adminPin === code);
    if (matchedUnit) {
      setPinError(false);
      setPinInput('');
      onSelectUnit(matchedUnit.id);
      onUnlockWithSession({
        role: 'unit_admin',
        unitId: matchedUnit.id,
        unitName: matchedUnit.name,
      });
      return;
    }

    // 3. Fallback for hardcoded default Belém PIN (140323) if units not yet loaded
    if (code === '140323') {
      const belemUnit = units.find((u) => u.id === 'belem');
      setPinError(false);
      setPinInput('');
      onSelectUnit('belem');
      onUnlockWithSession({
        role: 'unit_admin',
        unitId: 'belem',
        unitName: belemUnit?.name || 'Belém',
      });
      return;
    }

    // 4. Invalid PIN
    setPinError(true);
    setTimeout(() => {
      setPinInput('');
      setPinError(false);
    }, 900);
  };

  // Handle PIN input
  const handleDigit = (digit: string) => {
    if (pinInput.length < 6) {
      const next = pinInput + digit;
      setPinInput(next);
      setPinError(false);
      if (next.length === 6) {
        checkPin(next);
      }
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const handleClear = () => {
    setPinInput('');
    setPinError(false);
  };

  // Physical keyboard support for PIN when locked
  useEffect(() => {
    if (isUnlocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName)) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUnlocked, pinInput]);

  // Open Room Modal
  const openNewRoomModal = () => {
    setEditingRoom(null);
    setRoomName('');
    setRoomCapacity(6);
    setRoomResources('Ar-condicionado, TV Smart 55", Wi-Fi 5G');
    setRoomDescription('');
    setRoomStatus('active');
    setRoomMaintenanceReason('');
    setIsRoomModalOpen(true);
  };

  const openEditRoomModal = (room: Room) => {
    setEditingRoom(room);
    setRoomName(room.name);
    setRoomCapacity(room.capacity);
    setRoomResources(room.resources?.join(', ') || '');
    setRoomDescription(room.description || '');
    setRoomStatus(room.status);
    setRoomMaintenanceReason(room.maintenanceReason || '');
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    if ((roomStatus === 'maintenance' || roomStatus === 'locked') && !roomMaintenanceReason.trim()) {
      alert('Para salas em manutenção ou interditadas, a justificativa é obrigatória!');
      return;
    }

    const resourcesArray = roomResources
      .split(',')
      .map((r) => r.trim())
      .filter(Boolean);

    const roomPayload: Room = {
      id: editingRoom ? editingRoom.id : `room-${effectiveUnitId}-${Date.now()}`,
      unitId: effectiveUnitId,
      name: roomName.trim(),
      capacity: Number(roomCapacity) || 1,
      resources: resourcesArray,
      status: roomStatus,
      maintenanceReason: roomStatus !== 'active' ? roomMaintenanceReason.trim() : '',
      description: roomDescription.trim(),
    };

    await saveRoom(roomPayload);
    setIsRoomModalOpen(false);
  };

  const handleConfirmDeleteRoom = async () => {
    if (!roomToDelete) return;
    setIsDeletingRoom(true);
    try {
      await deleteRoom(roomToDelete.id);
      setRoomToDelete(null);
    } catch (err: any) {
      alert(`Erro ao excluir sala: ${err.message}`);
    } finally {
      setIsDeletingRoom(false);
    }
  };

  const handleConfirmDeleteBooking = async () => {
    if (!bookingToDelete) return;
    setIsDeletingBooking(true);
    try {
      await deleteBooking(bookingToDelete.id);
      setBookingToDelete(null);
    } catch (err: any) {
      alert(`Erro ao cancelar agendamento: ${err.message}`);
    } finally {
      setIsDeletingBooking(false);
    }
  };

  // Quick Block Submit
  const handleQuickBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBlockMessage(null);

    const targetRoomId = blockRoomId || (effectiveRooms[0]?.id ?? '');
    const targetRoom = effectiveRooms.find((r) => r.id === targetRoomId) || rooms.find((r) => r.id === targetRoomId);

    if (!targetRoom) {
      setBlockMessage({
        text: 'Selecione uma sala válida para o bloqueio.',
        type: 'error',
      });
      return;
    }

    if (!blockReason.trim()) {
      setBlockMessage({
        text: 'Informe o motivo / justificativa do bloqueio.',
        type: 'error',
      });
      return;
    }

    // BLOQUEIO POR TEMPO INDETERMINADO
    if (blockType === 'indefinite') {
      setIsSubmittingBlock(true);
      try {
        await saveRoom({
          ...targetRoom,
          unitId: effectiveUnitId,
          status: 'locked',
          maintenanceReason: blockReason.trim(),
        });
        setBlockMessage({
          text: `A sala "${targetRoom.name}" foi BLOQUEADA POR TEMPO INDETERMINADO com sucesso! Ela ficará indisponível para reservas em todas as datas até que você ou outro administrador a desbloqueie.`,
          type: 'success',
        });
      } catch (err: any) {
        setBlockMessage({
          text: err.message || 'Erro ao aplicar bloqueio por tempo indeterminado.',
          type: 'error',
        });
      } finally {
        setIsSubmittingBlock(false);
      }
      return;
    }

    // BLOQUEIO POR TURNO ESPECÍFICO EM UMA DATA
    let start = '08:00';
    let end = '12:00';

    if (blockType === 'morning') {
      start = '08:00';
      end = '12:00';
    } else if (blockType === 'afternoon') {
      start = '13:00';
      end = '18:00';
    } else if (blockType === 'fullday') {
      start = '08:00';
      end = '18:00';
    } else {
      start = blockCustomStart;
      end = blockCustomEnd;
    }

    if (isWeekend(blockDate)) {
      setBlockMessage({
        text: 'Não é possível bloquear em finais de semana.',
        type: 'error',
      });
      return;
    }

    setIsSubmittingBlock(true);
    try {
      await createBooking(
        {
          unitId: effectiveUnitId,
          roomId: targetRoomId,
          userName: 'ADMINISTRAÇÃO / GESTÃO PREDIAL',
          userPhone: '-',
          userDepartment: 'Diretoria / Gestão Predial',
          date: blockDate,
          startTime: start,
          endTime: end,
          isBlock: true,
          blockReason: blockReason.trim(),
        },
        bookings
      );
      setBlockMessage({
        text: `Bloqueio administrativo realizado com sucesso para o dia ${blockDate} (${start} às ${end}) na sala "${targetRoom.name}"!`,
        type: 'success',
      });
    } catch (err: any) {
      setBlockMessage({
        text: err.message || 'Erro ao realizar bloqueio.',
        type: 'error',
      });
    } finally {
      setIsSubmittingBlock(false);
    }
  };

  // Desbloquear sala com 1 clique
  const handleUnblockRoom = async (room: Room) => {
    setIsSubmittingBlock(true);
    try {
      await saveRoom({
        ...room,
        status: 'active',
        maintenanceReason: '',
      });
      setBlockMessage({
        text: `A sala "${room.name}" foi DESBLOQUEADA com sucesso e voltou a ficar disponível para agendamentos!`,
        type: 'success',
      });
    } catch (err: any) {
      setBlockMessage({
        text: err.message || 'Erro ao desbloquear sala.',
        type: 'error',
      });
    } finally {
      setIsSubmittingBlock(false);
    }
  };

  // Multi-unit management handlers (Developer only)
  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim() || !newUnitPin.trim()) {
      alert('Nome da unidade e Senha de 6 dígitos são obrigatórios!');
      return;
    }

    if (newUnitPin.trim().length !== 6 || !/^\d{6}$/.test(newUnitPin.trim())) {
      alert('A senha da unidade deve conter exatamente 6 dígitos numéricos!');
      return;
    }

    if (newUnitPin.trim() === DEVELOPER_PIN) {
      alert('Esta senha coincide com a senha de desenvolvedor mestre. Escolha outra.');
      return;
    }

    if (units.some((u) => u.adminPin === newUnitPin.trim())) {
      alert('Esta senha já está associada a outra unidade! Digite uma senha exclusiva.');
      return;
    }

    setIsCreatingUnit(true);
    try {
      const generatedId = await createUnit({
        name: newUnitName.trim(),
        city: newUnitCity.trim() || newUnitName.trim(),
        state: newUnitState.trim().toUpperCase() || 'BR',
        adminPin: newUnitPin.trim(),
        description: newUnitDescription.trim() || '',
        active: true,
      });

      setUnitSuccessMessage(
        `Unidade "${newUnitName.trim()}" cadastrada com sucesso! Senha: ${newUnitPin.trim()}`
      );
      setTimeout(() => setUnitSuccessMessage(null), 6000);

      // Reset form
      setNewUnitName('');
      setNewUnitCity('');
      setNewUnitState('');
      setNewUnitPin('');
      setNewUnitDescription('');
    } catch (err: any) {
      alert(`Erro ao criar unidade: ${err.message}`);
    } finally {
      setIsCreatingUnit(false);
    }
  };

  const openEditUnitModal = (unit: Unit) => {
    setEditingUnit(unit);
    setEditUnitName(unit.name);
    setEditUnitCity(unit.city || unit.name);
    setEditUnitState(unit.state || '');
    setEditUnitPin(unit.adminPin);
    setEditUnitDescription(unit.description || '');
  };

  const handleSaveEditUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;

    if (!editUnitName.trim() || !editUnitPin.trim()) {
      alert('Nome da unidade e Senha de 6 dígitos são obrigatórios!');
      return;
    }

    if (editUnitPin.trim().length !== 6 || !/^\d{6}$/.test(editUnitPin.trim())) {
      alert('A senha da unidade deve conter exatamente 6 dígitos numéricos!');
      return;
    }

    if (editUnitPin.trim() === DEVELOPER_PIN) {
      alert('Esta senha coincide com a senha de desenvolvedor mestre. Escolha outra.');
      return;
    }

    if (units.some((u) => u.id !== editingUnit.id && u.adminPin === editUnitPin.trim())) {
      alert('Esta senha já está em uso por outra unidade!');
      return;
    }

    setIsSavingEditUnit(true);
    try {
      await updateUnit(editingUnit.id, {
        name: editUnitName.trim(),
        city: editUnitCity.trim() || editUnitName.trim(),
        state: editUnitState.trim().toUpperCase() || 'BR',
        adminPin: editUnitPin.trim(),
        description: editUnitDescription.trim() || '',
      });

      setUnitSuccessMessage(`Unidade "${editUnitName.trim()}" atualizada com sucesso!`);
      setTimeout(() => setUnitSuccessMessage(null), 5000);
      setEditingUnit(null);
    } catch (err: any) {
      alert(`Erro ao atualizar unidade: ${err.message}`);
    } finally {
      setIsSavingEditUnit(false);
    }
  };

  const handleConfirmDeleteUnit = async () => {
    if (!unitToDelete) return;
    setIsDeletingUnit(true);
    try {
      await deleteUnit(unitToDelete.id);
      setUnitSuccessMessage(`Unidade "${unitToDelete.name}" removida com sucesso.`);
      setTimeout(() => setUnitSuccessMessage(null), 5000);
      if (effectiveUnitId === unitToDelete.id) {
        const nextUnit = units.find((u) => u.id !== unitToDelete.id);
        if (nextUnit) {
          onSelectUnit(nextUnit.id);
        }
      }
      setUnitToDelete(null);
    } catch (err: any) {
      alert(`Erro ao remover unidade: ${err.message}`);
    } finally {
      setIsDeletingUnit(false);
    }
  };

  // Add Department
  const handleAddDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    await addDepartment(newDeptName.trim());
    setNewDeptName('');
  };

  // Export CSV
  const handleExportCSV = () => {
    let filtered = adminSession.role === 'unit_admin' ? [...effectiveBookings] : [...bookings];
    if (csvRoomFilter !== 'all') {
      filtered = filtered.filter((b) => b.roomId === csvRoomFilter);
    }
    if (csvStartDate) {
      filtered = filtered.filter((b) => b.date >= csvStartDate);
    }
    if (csvEndDate) {
      filtered = filtered.filter((b) => b.date <= csvEndDate);
    }
    const unitTag = adminSession.role === 'unit_admin' ? (currentUnit?.name || 'unidade').toLowerCase().replace(/\s+/g, '_') : 'todas';
    exportBookingsToCSV(
      filtered,
      adminSession.role === 'unit_admin' ? effectiveRooms : rooms,
      `reservas_${unitTag}_${new Date().toISOString().split('T')[0]}.csv`
    );
  };

  // Full Database JSON Backup
  const handleDownloadBackup = async () => {
    try {
      setBackupStatus('Gerando backup completo...');
      const jsonStr = await exportDatabaseBackup();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_reservas_belem_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      setBackupStatus('Backup JSON gerado com sucesso!');
      setTimeout(() => setBackupStatus(null), 4000);
    } catch (err: any) {
      setBackupStatus(`Erro: ${err.message}`);
    }
  };

  // Restore Database from JSON
  const handleFileRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('ATENÇÃO: A restauração irá importar as salas, agendamentos e setores do arquivo JSON para o Firebase Firestore. Deseja continuar?')) {
      e.target.value = '';
      return;
    }

    setIsRestoring(true);
    setBackupStatus('Restaurando banco de dados no Firestore...');

    try {
      const text = await file.text();
      const res = await restoreDatabaseFromJson(text);
      setBackupStatus(`Restauração concluída! Importadas ${res.roomsCount} salas e ${res.bookingsCount} reservas.`);
      setTimeout(() => setBackupStatus(null), 5000);
    } catch (err: any) {
      setBackupStatus(`Falha na restauração: ${err.message}`);
    } finally {
      setIsRestoring(false);
      e.target.value = '';
    }
  };

  // Import Bookings from CSV
  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const unitTarget = units.find((u) => u.id === activeUnitId)?.name || activeUnitId;
    if (
      !confirm(
        `Deseja importar as reservas do arquivo "${file.name}" para a unidade ${unitTarget}?\n\n- Datas anteriores alimentarão todo o histórico estatístico e gráficos.\n- Datas de hoje e futuras alimentarão a agenda de salas.`
      )
    ) {
      e.target.value = '';
      return;
    }

    setIsImportingCsv(true);
    setBackupStatus(`Processando e gravando reservas do CSV para a unidade ${unitTarget}...`);

    try {
      const text = await file.text();
      const res = await importBookingsFromCsvText(text, activeUnitId, rooms);
      setBackupStatus(
        `Importação concluída com sucesso! Total de ${res.totalImported} reservas gravadas para ${unitTarget} (${res.pastCount} datas passadas nas estatísticas, ${res.futureCount} datas futuras na agenda).`
      );
      setTimeout(() => setBackupStatus(null), 8000);
    } catch (err: any) {
      setBackupStatus(`Falha na importação CSV: ${err.message}`);
    } finally {
      setIsImportingCsv(false);
      e.target.value = '';
    }
  };

  // If not unlocked, display PIN Lock screen
  if (!isUnlocked) {
    return (
      <div className="w-full max-w-md mx-auto my-6 p-6 sm:p-7 rounded-3xl neu-flat border border-[var(--border-subtle)] text-center animate-fade-in">
        <div className="w-14 h-14 rounded-3xl bg-[#E60026]/15 text-[#E60026] dark:text-[#FF2B4D] flex items-center justify-center mx-auto mb-4 neu-pressed-sm">
          <KeyRound className="w-7 h-7" />
        </div>

        <h2 className="text-lg sm:text-xl font-black text-[var(--text-primary)]">
          Acesso Administrativo por Unidade
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-1.5 mb-6 leading-relaxed">
          Digite a senha de 6 dígitos da sua unidade ou de desenvolvedor master para acessar as configurações.
        </p>

        {/* PIN Indicators */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const hasDigit = pinInput.length > idx;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                  hasDigit
                    ? pinError
                      ? 'bg-rose-600 scale-125'
                      : 'bg-[#E60026] dark:bg-[#FF2B4D] scale-110 shadow-sm'
                    : 'neu-pressed-sm border border-[var(--border-subtle)]'
                }`}
              />
            );
          })}
        </div>

        {pinError && (
          <p className="text-xs text-rose-800 dark:text-rose-300 font-bold mb-3 animate-shake">
            Senha incorreta! Digite a senha da sua unidade ou do desenvolvedor.
          </p>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="h-13 rounded-2xl neu-btn font-mono text-lg font-bold text-[var(--text-primary)] active:scale-90"
            >
              {digit}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="h-13 rounded-2xl neu-btn text-xs font-bold text-[var(--text-secondary)] active:scale-90"
          >
            Limpar
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="h-13 rounded-2xl neu-btn font-mono text-lg font-bold text-[var(--text-primary)] active:scale-90"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-13 rounded-2xl neu-btn text-xs font-bold text-[var(--text-secondary)] active:scale-90"
          >
            ⌫
          </button>
        </div>

        <p className="text-[11px] text-[var(--text-secondary)] mt-5">
          Você também pode digitar diretamente pelo teclado numérico do seu aparelho.
        </p>

        {onBackToRooms && (
          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
            <button
              onClick={onBackToRooms}
              className="px-4 py-2 rounded-xl neu-btn text-xs font-bold text-[#E60026] dark:text-[#FF2B4D] hover:text-[#C70020] dark:hover:text-[#FF526D] flex items-center justify-center gap-1.5 mx-auto active:scale-95 transition-all"
            >
              <span>← Voltar aos Espaços e Salas</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Admin Dashboard (Unlocked)
  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Admin Header with Lock Action & Role Badge */}
      <div className="p-4 sm:p-5 rounded-3xl neu-flat border border-[var(--border-subtle)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              adminSession.role === 'developer'
                ? 'bg-purple-500/20 text-purple-800 dark:text-purple-300'
                : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            {adminSession.role === 'developer' ? <Cpu className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                {adminSession.role === 'developer'
                  ? 'Painel do Desenvolvedor (Super Admin)'
                  : `Painel Administrativo • ${currentUnit?.name || 'Unidade'}`}
              </h2>
              {adminSession.role === 'developer' ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  Acesso Desenvolvedor (Master)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-600/30 dark:border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Admin: {currentUnit?.name}
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {adminSession.role === 'developer'
                ? 'Gestão global de todas as unidades, criação de filiais e controle mestre.'
                : `Gerenciamento exclusivo da Unidade ${currentUnit?.name} (${currentUnit?.state || 'BR'}).`}
            </p>
          </div>
        </div>

        {/* Developer Unit Switcher or Unit Display */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
          {adminSession.role === 'developer' && (
            <div className="flex items-center gap-2 py-1.5 px-3 rounded-2xl neu-pressed-sm border border-purple-500/30">
              <Globe className="w-4 h-4 text-purple-700 dark:text-purple-300 flex-shrink-0" />
              <span className="text-[11px] font-bold text-[var(--text-secondary)]">Unidade:</span>
              <select
                value={effectiveUnitId}
                onChange={(e) => onSelectUnit(e.target.value)}
                className="bg-transparent text-xs font-black text-[var(--text-primary)] outline-none cursor-pointer"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id} className="bg-[var(--card-surface)] text-[var(--text-primary)]">
                    {u.name} ({u.state || 'BR'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Manual do Admin Button */}
          <button
            onClick={() => setShowAdminManualModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl neu-btn text-xs font-black text-[#E60026] dark:text-[#FF2B4D] hover:bg-[#E60026] hover:text-white active:scale-95 transition-all shadow-sm"
            title="Abrir ou Baixar o Manual do Administrador em PDF"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Manual do Admin (PDF)</span>
            <span className="sm:hidden">Manual PDF</span>
          </button>

          {onBackToRooms && (
            <button
              onClick={() => {
                onLock();
                onBackToRooms();
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl neu-btn text-xs font-bold text-[#E60026] dark:text-[#FF2B4D] hover:text-[#C70020] dark:hover:text-[#FF526D] active:scale-95 transition-all"
              title="Voltar para Espaços e Salas e Bloquear Painel"
            >
              <span>← Voltar aos Espaços</span>
            </button>
          )}

          <button
            onClick={onLock}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl neu-btn text-xs font-bold text-rose-800 dark:text-rose-300 hover:text-rose-900 dark:hover:text-rose-200 active:scale-95 transition-all"
            title="Bloquear Painel"
          >
            <LogOut className="w-4 h-4" />
            <span>Bloquear Painel</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'dashboard' as AdminSubTab, label: 'Dashboard', icon: LayoutDashboard },
          { id: 'rooms' as AdminSubTab, label: 'Gestão de Salas', icon: DoorOpen },
          {
            id: 'bookings' as AdminSubTab,
            label: 'Agendamentos',
            icon: Calendar,
            badge: scopedBookings.length > 0 ? scopedBookings.length : undefined,
          },
          {
            id: 'blocks' as AdminSubTab,
            label: 'Bloqueio de Salas',
            icon: ShieldAlert,
            badge:
              effectiveRooms.filter((r) => r.status !== 'active').length > 0
                ? effectiveRooms.filter((r) => r.status !== 'active').length
                : undefined,
          },
          {
            id: 'anomalies' as AdminSubTab,
            label: 'Monitor de Anomalias',
            icon: Cpu,
            badge: anomalies.length > 0 ? anomalies.length : undefined,
          },
          { id: 'backup' as AdminSubTab, label: 'Relatórios & Backup', icon: FileSpreadsheet },
          { id: 'departments' as AdminSubTab, label: 'Departamentos', icon: Building2 },
          ...(adminSession.role === 'developer'
            ? [
                {
                  id: 'units' as AdminSubTab,
                  label: '🏙️ Gestão de Unidades',
                  icon: Globe,
                },
              ]
            : []),
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = adminSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminSubTab(tab.id)}
              className={`flex-shrink-0 flex items-center gap-2 py-2 px-3.5 rounded-2xl text-xs font-bold transition-all ${
                isActive
                  ? 'neu-pressed text-[#E60026] dark:text-[#FF2B4D] border border-[#E60026]/40 dark:border-[#FF2B4D]/40'
                  : 'neu-btn text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-bold ml-1 animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 0: DASHBOARD */}
      {adminSubTab === 'dashboard' && (
        <AdminDashboard
          rooms={effectiveRooms}
          bookings={effectiveBookings}
          departments={departments}
          selectedDate={selectedDate}
          onBookingClick={onBookingClick}
          onNavigateTab={(tab) => setAdminSubTab(tab)}
          unitName={currentUnit?.name}
        />
      )}

      {/* TAB 1: GESTÃO DE SALAS */}
      {adminSubTab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Salas da Unidade {currentUnit?.name || 'Belém'} ({effectiveRooms.length})
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Edite o status (Ativa, Manutenção ou Interditada) ou adicione novas salas para esta unidade.
              </p>
            </div>
            <button
              onClick={openNewRoomModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 text-white text-xs font-bold shadow-md hover:from-sky-500 hover:to-blue-500 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Sala</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {effectiveRooms.map((room) => {
              const isAvailable = room.status === 'active';
              const isMaintenance = room.status === 'maintenance';
              const isLocked = room.status === 'locked';

              return (
                <div
                  key={room.id}
                  className="p-5 rounded-3xl neu-flat border border-[var(--border-subtle)] space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-black text-base text-[var(--text-primary)]">
                        {room.name}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Capacidade: {room.capacity} pessoas
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditRoomModal(room)}
                        className="p-2 rounded-xl neu-btn text-sky-700 dark:text-sky-300 hover:text-sky-800 dark:hover:text-sky-200"
                        title="Editar sala"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setRoomToDelete(room)}
                        className="p-2 rounded-xl neu-btn text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300"
                        title="Excluir sala"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                        isAvailable
                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-600/30 dark:border-emerald-500/30'
                          : isMaintenance
                          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-600/30 dark:border-amber-400/30'
                          : 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-600/30 dark:border-rose-400/30'
                      }`}
                    >
                      {isAvailable && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {isMaintenance && <Wrench className="w-3.5 h-3.5" />}
                      {isLocked && <Lock className="w-3.5 h-3.5" />}
                      {isAvailable
                        ? 'Ativa'
                        : isMaintenance
                        ? 'Em Manutenção'
                        : 'Interditada'}
                    </span>
                  </div>

                  {!isAvailable && (
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-600/30 dark:border-amber-400/30 text-xs text-amber-900 dark:text-amber-300 space-y-1">
                      <strong className="block font-bold">Justificativa de Bloqueio:</strong>
                      <p>{room.maintenanceReason || 'Sem justificativa informada.'}</p>
                    </div>
                  )}

                  <div className="text-xs text-[var(--text-secondary)]">
                    <p className="truncate">
                      <strong>Recursos:</strong> {room.resources?.join(', ') || 'Nenhum'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB: GESTÃO EXCLUSIVA DE AGENDAMENTOS */}
      {adminSubTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[var(--text-primary)]">
                  Gestão de Agendamentos ({scopedBookings.length})
                </h3>
                {adminSession.role === 'unit_admin' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25">
                    Unidade {currentUnit?.name || 'Local'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/25">
                    {superAdminBookingsUnitFilter === 'all'
                      ? 'Todas as Unidades'
                      : `Filtro: ${units.find((u) => u.id === superAdminBookingsUnitFilter)?.name || 'Unidade'}`}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {adminSession.role === 'unit_admin'
                  ? `Exclusivo da Unidade ${currentUnit?.name || 'Local'}: visualize, edite e gerencie as reservas locais.`
                  : 'Visão corporativa de Super Admin: visualize e filtre agendamentos de todas as unidades.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Super Admin Unit Filter (Developer only) */}
              {adminSession.role === 'developer' && (
                <div className="flex items-center gap-1.5 p-1 rounded-2xl neu-pressed-sm border border-[var(--border-subtle)]">
                  <Globe className="w-3.5 h-3.5 text-purple-700 dark:text-purple-400 ml-1.5" />
                  <select
                    value={superAdminBookingsUnitFilter}
                    onChange={(e) => setSuperAdminBookingsUnitFilter(e.target.value)}
                    className="bg-transparent text-xs font-bold text-[var(--text-primary)] outline-none py-1 pr-2 cursor-pointer"
                  >
                    <option value="all" className="bg-[var(--card-surface)] text-[var(--text-primary)]">
                      Todas as Unidades ({bookings.length})
                    </option>
                    {units.map((u) => {
                      const count = bookings.filter((b) => (b.unitId || 'belem') === u.id).length;
                      return (
                        <option
                          key={u.id}
                          value={u.id}
                          className="bg-[var(--card-surface)] text-[var(--text-primary)]"
                        >
                          {u.name} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}

              {/* View Mode Toggle */}
              <div className="flex items-center p-1 rounded-2xl neu-pressed-sm border border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setBookingsViewMode('table')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    bookingsViewMode === 'table'
                      ? 'bg-[#E60026] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  title="Visualização em Tabela Completa"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Tabela</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBookingsViewMode('cards')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    bookingsViewMode === 'cards'
                      ? 'bg-[#E60026] text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                  title="Visualização em Cards"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
              </div>

              {/* Search Input */}
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="text"
                  value={searchBookingAdmin}
                  onChange={(e) => setSearchBookingAdmin(e.target.value)}
                  placeholder="Buscar colaborador, sala, setor..."
                  className="w-full pl-9 pr-8 py-2 rounded-2xl neu-input text-xs text-[var(--text-primary)]"
                />
                {searchBookingAdmin && (
                  <button
                    onClick={() => setSearchBookingAdmin('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {scopedBookings.length === 0 ? (
            <div className="p-8 text-center rounded-3xl neu-flat text-xs text-[var(--text-secondary)]">
              Nenhum agendamento registrado {adminSession.role === 'unit_admin' ? `na Unidade ${currentUnit?.name || 'Local'}` : 'no sistema'}.
            </div>
          ) : (
            (() => {
              const filteredList = scopedBookings
                .filter((b) => {
                  if (!searchBookingAdmin.trim()) return true;
                  const term = searchBookingAdmin.toLowerCase();
                  const room = rooms.find((r) => r.id === b.roomId);
                  const bUnit = units.find((u) => u.id === (b.unitId || 'belem'));
                  return (
                    (b.userName || '').toLowerCase().includes(term) ||
                    (b.userDepartment || '').toLowerCase().includes(term) ||
                    (b.userPhone || '').includes(term) ||
                    (room?.name || '').toLowerCase().includes(term) ||
                    (bUnit?.name || '').toLowerCase().includes(term) ||
                    (b.blockReason || '').toLowerCase().includes(term) ||
                    b.date.includes(term) ||
                    (b.createdAt && b.createdAt.toLowerCase().includes(term))
                  );
                })
                .sort((a, b) => b.date.localeCompare(a.date) || a.startTime.localeCompare(b.startTime));

              if (filteredList.length === 0) {
                return (
                  <div className="p-8 text-center rounded-3xl neu-flat text-xs text-[var(--text-secondary)]">
                    Nenhum agendamento encontrado para o termo pesquisado.
                  </div>
                );
              }

              if (bookingsViewMode === 'table') {
                return (
                  <div className="p-4 sm:p-5 rounded-3xl neu-flat border border-[var(--border-subtle)] space-y-3 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs min-w-[760px]">
                        <thead>
                          <tr className="border-b border-[var(--border-subtle)] text-[var(--text-secondary)]">
                            {adminSession.role === 'developer' && (
                              <th className="pb-3 px-3 font-bold text-purple-700 dark:text-purple-300">
                                Unidade
                              </th>
                            )}
                            <th className="pb-3 px-3 font-bold">Data Agendada</th>
                            <th className="pb-3 px-3 font-bold">Horário</th>
                            <th className="pb-3 px-3 font-bold">Espaço / Sala</th>
                            <th className="pb-3 px-3 font-bold">Solicitante</th>
                            <th className="pb-3 px-3 font-bold">Departamento / Contato</th>
                            <th className="pb-3 px-3 font-bold text-sky-800 dark:text-sky-300">
                              <div className="flex items-center gap-1.5">
                                <History className="w-3.5 h-3.5" />
                                <span>Cadastrado no Sistema</span>
                              </div>
                            </th>
                            <th className="pb-3 px-3 font-bold">Tipo</th>
                            <th className="pb-3 px-3 font-bold text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                          {filteredList.map((b) => {
                            const room = rooms.find((r) => r.id === b.roomId);
                            const bUnit = units.find((u) => u.id === (b.unitId || 'belem'));
                            const todayISO = formatDateToISO(new Date());
                            const isToday = b.date === todayISO;

                            return (
                              <tr
                                key={b.id}
                                className="hover:bg-[var(--card-surface-subtle)] transition-colors"
                              >
                                {/* Unidade (Super Admin only) */}
                                {adminSession.role === 'developer' && (
                                  <td className="py-3 px-3 whitespace-nowrap">
                                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/25">
                                      {bUnit?.name || (b.unitId === 'belem' ? 'Belém' : b.unitId || 'Geral')}
                                    </span>
                                  </td>
                                )}

                                {/* Data da Reserva */}
                                <td className="py-3 px-3 font-mono font-bold text-[var(--text-primary)] whitespace-nowrap">
                                  <span>{b.date}</span>
                                  {isToday && (
                                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold">
                                      Hoje
                                    </span>
                                  )}
                                </td>

                                {/* Horário da Reserva */}
                                <td className="py-3 px-3 font-mono font-black text-[#E60026] dark:text-[#FF2B4D] whitespace-nowrap">
                                  {b.startTime} às {b.endTime}
                                </td>

                                {/* Sala */}
                                <td className="py-3 px-3 font-bold text-[var(--text-primary)]">
                                  {room?.name || 'Sala'}
                                </td>

                                {/* Solicitante */}
                                <td className="py-3 px-3 font-bold text-[var(--text-primary)]">
                                  {b.isBlock ? (
                                    <span className="text-amber-800 dark:text-amber-300">
                                      {b.blockReason || 'Bloqueio Administrativo'}
                                    </span>
                                  ) : (
                                    b.userName
                                  )}
                                </td>

                                {/* Departamento & Telefone */}
                                <td className="py-3 px-3 text-[var(--text-secondary)]">
                                  {b.isBlock ? (
                                    <span>Administração</span>
                                  ) : (
                                    <div>
                                      <span>{b.userDepartment || '-'}</span>
                                      {b.userPhone && (
                                        <span className="block text-[10px] text-[var(--text-secondary)] font-mono">
                                          {formatPhoneNumber(b.userPhone)}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* Data e Hora de Acesso / Cadastro */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-800 dark:text-sky-300 font-mono text-[11px] font-bold">
                                    <History className="w-3.5 h-3.5 text-sky-700 dark:text-sky-300" />
                                    <span>{formatRegistrationDateTime(b.createdAt)}</span>
                                  </div>
                                </td>

                                {/* Tipo */}
                                <td className="py-3 px-3 whitespace-nowrap">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      b.isBlock
                                        ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-600/30 dark:border-amber-400/30'
                                        : 'bg-[#E60026]/15 text-[#E60026] dark:text-[#FF2B4D] border border-[#E60026]/20 dark:border-[#FF2B4D]/20'
                                    }`}
                                  >
                                    {b.isBlock ? 'Bloqueio ADM' : 'Reserva'}
                                  </span>
                                </td>

                                {/* Ações */}
                                <td className="py-3 px-3 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {!b.isBlock && onEditBooking && (
                                      <button
                                        onClick={() => onEditBooking(b)}
                                        className="p-1.5 rounded-xl neu-btn text-xs font-bold text-[#E60026] dark:text-[#FF2B4D] hover:text-[#C70020] dark:hover:text-[#FF526D] active:scale-95"
                                        title="Editar Agendamento"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => setBookingToDelete(b)}
                                      className="p-1.5 rounded-xl neu-btn text-xs font-bold text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 active:scale-95"
                                      title="Excluir Agendamento"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              // Card View
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredList.map((b) => {
                    const room = rooms.find((r) => r.id === b.roomId);
                    const bUnit = units.find((u) => u.id === (b.unitId || 'belem'));
                    return (
                      <div
                        key={b.id}
                        className="p-4 rounded-3xl neu-flat border border-[var(--border-subtle)] space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm text-[var(--text-primary)]">
                                {room?.name || 'Sala'}
                              </span>
                              {adminSession.role === 'developer' && (
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/25">
                                  {bUnit?.name || (b.unitId === 'belem' ? 'Belém' : b.unitId || 'Geral')}
                                </span>
                              )}
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                b.isBlock
                                  ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-600/30 dark:border-amber-400/30'
                                  : 'bg-[#E60026]/15 text-[#E60026] dark:text-[#FF2B4D] border border-[#E60026]/20 dark:border-[#FF2B4D]/20'
                              }`}
                            >
                              {b.isBlock ? 'Bloqueio ADM' : 'Reserva'}
                            </span>
                          </div>

                          {/* Data e Horário Agendado */}
                          <div className="p-2.5 rounded-xl neu-pressed-sm text-xs font-mono font-black text-[#E60026] dark:text-[#FF2B4D] flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{b.date}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{b.startTime} às {b.endTime}</span>
                            </div>
                          </div>

                          {/* Solicitante */}
                          <p className="text-xs font-bold text-[var(--text-primary)]">
                            {b.isBlock ? `BLOQUEIO: ${b.blockReason || 'Administrativo'}` : b.userName}
                          </p>
                          {!b.isBlock && (
                            <p className="text-[11px] text-[var(--text-secondary)]">
                              {b.userDepartment} {b.userPhone ? `• ${formatPhoneNumber(b.userPhone)}` : ''}
                            </p>
                          )}

                          {/* Data e hora de quando acessou o sistema e cadastrou */}
                          <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2 text-xs">
                            <span className="text-[var(--text-secondary)] flex items-center gap-1.5 text-[11px]">
                              <History className="w-3.5 h-3.5 text-sky-700 dark:text-sky-300 flex-shrink-0" />
                              <span>Cadastrado no sistema em:</span>
                            </span>
                            <span className="font-mono font-bold text-[var(--text-primary)] bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-lg text-[11px] text-sky-800 dark:text-sky-300">
                              {formatRegistrationDateTime(b.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Admin Actions for Booking */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
                          {!b.isBlock && onEditBooking && (
                            <button
                              onClick={() => onEditBooking(b)}
                              className="px-3 py-1.5 rounded-xl neu-btn text-xs font-bold text-[#E60026] dark:text-[#FF2B4D] hover:text-[#C70020] dark:hover:text-[#FF526D] flex items-center gap-1 active:scale-95"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                          )}
                          <button
                            onClick={() => setBookingToDelete(b)}
                            className="px-3 py-1.5 rounded-xl neu-btn text-xs font-bold text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 flex items-center gap-1 active:scale-95"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* TAB 2: BLOQUEIO DE SALAS */}
      {adminSubTab === 'blocks' && (
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Main Block Form */}
          <div className="p-5 sm:p-6 rounded-3xl neu-flat border border-[var(--border-subtle)] space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#E60026] dark:text-[#FF2B4D]" />
                <h3 className="text-base font-black text-[var(--text-primary)]">
                  Bloqueio e Interdição de Salas
                </h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Bloqueie salas por turnos específicos ou por <strong>tempo indeterminado</strong> para manutenções, reformas, reuniões executivas ou interdições operacionais.
              </p>
            </div>

            {blockMessage && (
              <div
                className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
                  blockMessage.type === 'success'
                    ? 'bg-emerald-500/10 border border-emerald-600/30 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-500/10 border border-rose-600/30 dark:border-rose-400/30 text-rose-800 dark:text-rose-300'
                }`}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{blockMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleQuickBlockSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-[var(--text-primary)] mb-1">
                  Sala para Bloqueio *
                </label>
                <select
                  value={blockRoomId}
                  onChange={(e) => setBlockRoomId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl neu-input text-[var(--text-primary)] cursor-pointer"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.capacity} lugares) {r.status !== 'active' ? '• JÁ BLOQUEADA' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Modalidade / Tipo de Bloqueio */}
              <div>
                <label className="block font-bold text-[var(--text-primary)] mb-1.5 flex items-center justify-between">
                  <span>Modalidade do Bloqueio *</span>
                  {blockType === 'indefinite' && (
                    <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300">
                      Sem Data Limite
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'morning', label: 'Manhã (08h-12h)', desc: 'Turno' },
                    { id: 'afternoon', label: 'Tarde (13h-18h)', desc: 'Turno' },
                    { id: 'fullday', label: 'Dia Todo (08h-18h)', desc: 'Turno' },
                    { id: 'custom', label: 'Horário Personalizado', desc: 'Custom' },
                    { id: 'indefinite', label: 'Tempo Indeterminado', desc: 'Interdição Contínua', highlight: true },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setBlockType(t.id as any)}
                      className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 text-center ${
                        t.highlight ? 'col-span-2 sm:col-span-2' : ''
                      } ${
                        blockType === t.id
                          ? t.highlight
                            ? 'neu-pressed text-amber-800 dark:text-amber-300 border-2 border-amber-600/50 dark:border-amber-400/50 shadow-inner'
                            : 'neu-pressed text-sky-800 dark:text-sky-300 border border-sky-500/40 shadow-inner'
                          : t.highlight
                          ? 'neu-btn text-amber-800 dark:text-amber-300 border border-amber-600/30 dark:border-amber-400/30'
                          : 'neu-btn text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {t.highlight && <Lock className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />}
                        <span>{t.label}</span>
                      </div>
                      <span className="text-[10px] font-normal opacity-80">{t.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Se for Tempo Indeterminado: Informação de Destaque */}
              {blockType === 'indefinite' ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-600/30 dark:border-amber-400/30 text-xs text-amber-900 dark:text-amber-200 space-y-1.5 animate-fade-in">
                  <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300 text-xs">
                    <Lock className="w-4 h-4 flex-shrink-0 text-amber-700 dark:text-amber-400" />
                    <span>Bloqueio por Tempo Indeterminado (Interdição da Sala)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
                    A sala selecionada será interditada imediatamente no sistema para <strong>todas as datas presentes e futuras</strong>. Nenhum colaborador conseguirá agendá-la até que você ou outro administrador a desbloqueie nesta mesma tela.
                  </p>
                </div>
              ) : (
                /* Se for bloqueio por data específica: Seletor de Data */
                <>
                  <div>
                    <label className="block font-bold text-[var(--text-primary)] mb-1">
                      Data do Bloqueio *
                    </label>
                    <input
                      type="date"
                      required
                      value={blockDate}
                      onChange={(e) => setBlockDate(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-2xl neu-input text-[var(--text-primary)]"
                    />
                  </div>

                  {blockType === 'custom' && (
                    <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl neu-pressed-sm">
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                          Início
                        </label>
                        <select
                          value={blockCustomStart}
                          onChange={(e) => setBlockCustomStart(e.target.value)}
                          className="w-full p-2 rounded-xl neu-input"
                        >
                          {TIME_SLOTS.slice(0, -1).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-[var(--text-secondary)] mb-1">
                          Término
                        </label>
                        <select
                          value={blockCustomEnd}
                          onChange={(e) => setBlockCustomEnd(e.target.value)}
                          className="w-full p-2 rounded-xl neu-input"
                        >
                          {TIME_SLOTS.slice(1).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Motivo do Bloqueio */}
              <div>
                <label className="block font-bold text-[var(--text-primary)] mb-1">
                  Motivo / Justificativa *
                </label>
                <input
                  type="text"
                  required
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder={
                    blockType === 'indefinite'
                      ? 'Ex: Manutenção Estrutural / Reforma por Tempo Indeterminado'
                      : 'Ex: Reunião de Diretoria / Evento Interno'
                  }
                  className="w-full px-3 py-2.5 rounded-2xl neu-input text-[var(--text-primary)]"
                />
              </div>

              {/* Botão de Envio */}
              <button
                type="submit"
                disabled={isSubmittingBlock}
                className={`w-full py-3.5 rounded-2xl text-white font-black text-xs shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 ${
                  blockType === 'indefinite'
                    ? 'bg-gradient-to-r from-rose-600 via-amber-600 to-rose-700 hover:from-rose-500 hover:to-rose-600'
                    : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500'
                }`}
              >
                {blockType === 'indefinite' ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>
                      {isSubmittingBlock
                        ? 'Aplicando Bloqueio...'
                        : 'Bloquear Sala por Tempo Indeterminado'}
                    </span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>
                      {isSubmittingBlock
                        ? 'Processando...'
                        : 'Aplicar Bloqueio Administrativo'}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Seção de Salas Bloqueadas por Tempo Indeterminado */}
          <div className="p-5 sm:p-6 rounded-3xl neu-flat border border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                <h4 className="font-extrabold text-sm text-[var(--text-primary)]">
                  Salas com Bloqueio por Tempo Indeterminado
                </h4>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300">
                {rooms.filter((r) => r.status !== 'active').length} bloqueada(s)
              </span>
            </div>

            {rooms.filter((r) => r.status !== 'active').length === 0 ? (
              <div className="p-4 rounded-2xl neu-pressed-sm text-center text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                ✓ Nenhuma sala bloqueada por tempo indeterminado no momento. Todas as salas estão ativas e disponíveis!
              </div>
            ) : (
              <div className="space-y-2.5">
                {rooms
                  .filter((r) => r.status !== 'active')
                  .map((room) => (
                    <div
                      key={room.id}
                      className="p-3.5 rounded-2xl neu-pressed-sm border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-[var(--text-primary)]">
                            {room.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-600/30 dark:border-amber-400/30">
                            {room.status === 'maintenance'
                              ? 'Em Manutenção'
                              : 'Bloqueada Indeterminada'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)]">
                          Motivo: <strong className="text-[var(--text-primary)]">{room.maintenanceReason || 'Bloqueio administrativo por tempo indeterminado'}</strong>
                        </p>
                      </div>

                      <button
                        onClick={() => handleUnblockRoom(room)}
                        disabled={isSubmittingBlock}
                        className="w-full sm:w-auto py-2 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all flex-shrink-0"
                        title="Liberar e desbloquear esta sala para novos agendamentos"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Desbloquear Sala</span>
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MONITOR DE INTELIGÊNCIA E ANOMALIAS */}
      {adminSubTab === 'anomalies' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-[var(--text-primary)] flex items-center gap-2">
                <Cpu className="w-5 h-5 text-sky-800 dark:text-sky-300" />
                <span>Inteligência de Detecção de Anomalias</span>
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Monitor automático em tempo real que analisa padrões de reservas, conflitos e utilização de salas.
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-xl neu-pressed-sm text-sky-800 dark:text-sky-300">
              {anomalies.length} diagnósticos ativos
            </span>
          </div>

          {anomalies.length === 0 ? (
            <div className="p-8 text-center rounded-3xl neu-flat space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-700 dark:text-emerald-400 mx-auto" />
              <h4 className="font-bold text-sm text-[var(--text-primary)]">
                Nenhuma Anomalia Detectada
              </h4>
              <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                O histórico de agendamentos está limpo. Sem conflitos de horários, sem reservas abusivas e salas bem distribuídas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {anomalies.map((alert) => {
                const isDanger = alert.severity === 'danger';
                const isWarning = alert.severity === 'warning';

                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-3xl neu-flat border transition-all space-y-2.5 ${
                      isDanger
                        ? 'border-rose-500/40 bg-rose-500/5'
                        : isWarning
                        ? 'border-amber-500/40 bg-amber-500/5'
                        : 'border-sky-500/40 bg-sky-500/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isDanger ? (
                          <AlertTriangle className="w-5 h-5 text-rose-700 dark:text-rose-400 flex-shrink-0" />
                        ) : isWarning ? (
                          <Clock className="w-5 h-5 text-amber-700 dark:text-amber-400 flex-shrink-0" />
                        ) : (
                          <Sparkles className="w-5 h-5 text-sky-700 dark:text-sky-400 flex-shrink-0" />
                        )}
                        <h4 className="font-extrabold text-xs sm:text-sm text-[var(--text-primary)]">
                          {alert.title}
                        </h4>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isDanger
                            ? 'bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-600/30 dark:border-rose-400/30'
                            : isWarning
                            ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-600/30 dark:border-amber-400/30'
                            : 'bg-sky-500/20 text-sky-800 dark:text-sky-300 border border-sky-500/30'
                        }`}
                      >
                        {alert.type}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {alert.description}
                    </p>

                    {alert.bookingId && (
                      <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-end">
                        <button
                          onClick={() => {
                            const b = bookings.find((item) => item.id === alert.bookingId);
                            const r = rooms.find((item) => item.id === b?.roomId);
                            if (b && r) onBookingClick(b, r);
                          }}
                          className="px-3 py-1.5 rounded-xl neu-btn text-xs font-bold text-sky-800 dark:text-sky-300 hover:text-sky-900 dark:hover:text-sky-200"
                        >
                          Ver Agendamento
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RELATÓRIOS E BACKUP */}
      {adminSubTab === 'backup' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* CSV Export Card */}
          <div className="p-5 sm:p-6 rounded-3xl neu-flat border border-[var(--border-subtle)] space-y-4">
            <div className="flex items-center gap-2.5">
              <FileSpreadsheet className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-[var(--text-primary)]">
                  Exportar Relatório CSV (UTF-8 BOM)
                </h4>
                <p className="text-xs text-[var(--text-secondary)]">
                  Planilha compatível com Excel e Google Planilhas sem erros de acentuação.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[var(--text-primary)] mb-1">
                  Filtrar por Sala
                </label>
                <select
                  value={csvRoomFilter}
                  onChange={(e) => setCsvRoomFilter(e.target.value)}
                  className="w-full p-2.5 rounded-xl neu-input text-[var(--text-primary)]"
                >
                  <option value="all">Todas as Salas</option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-1">
                    A partir de:
                  </label>
                  <input
                    type="date"
                    value={csvStartDate}
                    onChange={(e) => setCsvStartDate(e.target.value)}
                    className="w-full p-2 rounded-xl neu-input text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-1">
                    Até:
                  </label>
                  <input
                    type="date"
                    value={csvEndDate}
                    onChange={(e) => setCsvEndDate(e.target.value)}
                    className="w-full p-2 rounded-xl neu-input text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <button
                onClick={handleExportCSV}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-extrabold text-xs shadow-md hover:from-emerald-500 hover:to-teal-500 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Baixar Planilha CSV</span>
              </button>
            </div>
          </div>

          {/* JSON Backup & Restore Card */}
          <div className="p-5 sm:p-6 rounded-3xl neu-flat border border-[var(--border-subtle)] space-y-4">
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-6 h-6 text-sky-700 dark:text-sky-400" />
              <div>
                <h4 className="font-extrabold text-sm sm:text-base text-[var(--text-primary)]">
                  Backup & Restauração Firestore
                </h4>
                <p className="text-xs text-[var(--text-secondary)]">
                  Download completo do banco de dados e restauração direta com 1 clique.
                </p>
              </div>
            </div>

            {backupStatus && (
              <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-800 dark:text-sky-300">
                {backupStatus}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                onClick={handleDownloadBackup}
                className="w-full py-3 rounded-2xl neu-btn text-xs font-bold text-sky-800 dark:text-sky-300 hover:text-sky-900 dark:hover:text-sky-200 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Backup Completo (JSON)</span>
              </button>

              <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileRestore}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRestoring}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 text-white text-xs font-bold shadow-md hover:from-sky-500 hover:to-blue-500 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isRestoring ? 'Restaurando...' : 'Restaurar de Arquivo JSON'}</span>
                </button>

                <input
                  type="file"
                  ref={csvFileInputRef}
                  accept=".csv"
                  onChange={handleCsvImport}
                  className="hidden"
                />
                <button
                  onClick={() => csvFileInputRef.current?.click()}
                  disabled={isImportingCsv}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-md hover:from-emerald-500 hover:to-teal-500 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>
                    {isImportingCsv ? 'Processando e Importando CSV...' : 'Importar Relatório de Reservas (.CSV)'}
                  </span>
                </button>
                <p className="text-[10px] text-[var(--text-secondary)] text-center leading-tight">
                  Importa relatórios no formato padrão CSV para a unidade ativa, distribuindo datas passadas nas estatísticas e futuras na agenda.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DEPARTAMENTOS */}
      {adminSubTab === 'departments' && (
        <div className="p-5 sm:p-6 rounded-3xl neu-flat border border-[var(--border-subtle)] max-w-xl mx-auto space-y-4">
          <div>
            <h3 className="text-base font-black text-[var(--text-primary)]">
              Departamentos e Setores da Unidade
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Gerencie a lista de setores corporativos exibida nos formulários de reserva.
            </p>
          </div>

          <form onSubmit={handleAddDept} className="flex gap-2">
            <input
              type="text"
              required
              value={newDeptName}
              onChange={(e) => setNewDeptName(e.target.value)}
              placeholder="Novo departamento (ex: Jurídico)"
              className="flex-1 px-3.5 py-2.5 rounded-2xl neu-input text-xs sm:text-sm text-[var(--text-primary)]"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-bold shadow-md active:scale-95"
            >
              Adicionar
            </button>
          </form>

          <div className="space-y-2 pt-2">
            {departments.map((dept) => (
              <div
                key={dept.id || dept.name}
                className="flex items-center justify-between p-2.5 px-3.5 rounded-2xl neu-pressed-sm text-xs"
              >
                <span className="font-semibold text-[var(--text-primary)]">
                  {dept.name}
                </span>
                {dept.id && (
                  <button
                    onClick={() => deleteDepartment(dept.id)}
                    className="text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 p-1"
                    title="Remover departamento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: GESTÃO DE UNIDADES / CIDADES (DEVELOPER ONLY) */}
      {adminSubTab === 'units' && (
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Header Banner */}
          <div className="p-5 sm:p-6 rounded-3xl neu-flat border border-purple-500/30 bg-purple-500/5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-800 dark:text-purple-300 flex items-center justify-center flex-shrink-0">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black text-purple-700 dark:text-purple-300 tracking-widest uppercase">
                  PAINEL DO DESENVOLVEDOR • CONTROLE MESTRE (PIN: {DEVELOPER_PIN})
                </span>
                <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                  Gestão de Unidades e Cidades
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Cadastre novas filiais, defina senhas exclusivas de administração por cidade e gerencie a separação de agendamentos.
                </p>
              </div>
            </div>

            {unitSuccessMessage && (
              <div className="mt-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{unitSuccessMessage}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form: Cadastrar Nova Unidade */}
            <div className="lg:col-span-5 p-5 sm:p-6 rounded-3xl neu-flat border border-[var(--border-subtle)] space-y-4">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#E60026] dark:text-[#FF2B4D]" />
                <h4 className="font-extrabold text-sm sm:text-base text-[var(--text-primary)]">
                  Cadastrar Nova Unidade
                </h4>
              </div>

              <form onSubmit={handleCreateUnit} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-1">
                    Nome da Unidade / Cidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={newUnitName}
                    onChange={(e) => {
                      setNewUnitName(e.target.value);
                      if (!newUnitCity) setNewUnitCity(e.target.value);
                    }}
                    placeholder="Ex: Curitiba, Fortaleza, Porto Alegre"
                    className="w-full px-3.5 py-2.5 rounded-2xl neu-input text-[var(--text-primary)]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block font-bold text-[var(--text-primary)] mb-1">
                      Cidade *
                    </label>
                    <input
                      type="text"
                      required
                      value={newUnitCity}
                      onChange={(e) => setNewUnitCity(e.target.value)}
                      placeholder="Ex: Curitiba"
                      className="w-full px-3.5 py-2.5 rounded-2xl neu-input text-[var(--text-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[var(--text-primary)] mb-1">
                      UF (Estado) *
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={2}
                      value={newUnitState}
                      onChange={(e) => setNewUnitState(e.target.value.toUpperCase())}
                      placeholder="PR"
                      className="w-full px-3.5 py-2.5 rounded-2xl neu-input text-[var(--text-primary)] uppercase text-center font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-1">
                    Senha de Acesso do Administrador (6 Dígitos) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={newUnitPin}
                    onChange={(e) => setNewUnitPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 150424"
                    className="w-full px-3.5 py-2.5 rounded-2xl neu-input text-[var(--text-primary)] font-mono tracking-widest text-sm"
                  />
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                    Quem digitar esta senha no painel administrativo terá acesso exclusivo a esta unidade.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-1">
                    Descrição / Observações (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={newUnitDescription}
                    onChange={(e) => setNewUnitDescription(e.target.value)}
                    placeholder="Ex: Unidade regional Sul da Bradesco Seguros."
                    className="w-full px-3.5 py-2.5 rounded-2xl neu-input text-[var(--text-primary)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isCreatingUnit}
                  className="w-full py-3 rounded-2xl bg-[#E60026] hover:bg-[#C70020] text-white font-black text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {isCreatingUnit ? (
                    <span>Cadastrando...</span>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Cadastrar Unidade</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* List: Unidades Existentes */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h4 className="font-extrabold text-sm sm:text-base text-[var(--text-primary)] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#E60026] dark:text-[#FF2B4D]" />
                  <span>Unidades Cadastradas ({units.length})</span>
                </h4>
                <span className="text-[11px] text-[var(--text-secondary)]">
                  Clique para alternar a visualização
                </span>
              </div>

              <div className="space-y-3">
                {units.map((unit) => {
                  const unitRooms = rooms.filter((r) => (r.unitId || 'belem') === unit.id);
                  const unitBookings = bookings.filter((b) => (b.unitId || 'belem') === unit.id);
                  const isViewingThis = effectiveUnitId === unit.id;
                  const isPinVisible = showUnitPins[unit.id];

                  return (
                    <div
                      key={unit.id}
                      className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                        isViewingThis
                          ? 'neu-pressed border-purple-500/40 bg-purple-500/5 shadow-inner'
                          : 'neu-flat border-[var(--border-subtle)]'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-black text-base text-[var(--text-primary)]">
                              {unit.name}
                            </h5>
                            {unit.state && (
                              <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-[#E60026]/15 text-[#E60026] dark:text-[#FF2B4D] border border-[#E60026]/30 uppercase">
                                {unit.state}
                              </span>
                            )}
                            {isViewingThis && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-500/30">
                                Unidade Selecionada no Painel
                              </span>
                            )}
                          </div>

                          {/* Stats and PIN info */}
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                            <span className="font-bold text-[var(--text-secondary)]">
                              {unitRooms.length} {unitRooms.length === 1 ? 'sala' : 'salas'}
                            </span>
                            <span className="text-[var(--text-secondary)]">•</span>
                            <span className="font-bold text-[var(--text-secondary)]">
                              {unitBookings.length} {unitBookings.length === 1 ? 'reserva' : 'reservas'}
                            </span>
                            <span className="text-[var(--text-secondary)]">•</span>

                            {/* PIN Display with Toggle */}
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg neu-pressed-sm border border-[var(--border-subtle)]">
                              <KeyRound className="w-3 h-3 text-[#E60026] dark:text-[#FF2B4D]" />
                              <span className="text-[10px] font-bold text-[var(--text-secondary)]">Senha:</span>
                              <span className="font-mono font-bold text-xs text-[var(--text-primary)]">
                                {isPinVisible ? unit.adminPin : '••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setShowUnitPins((prev) => ({
                                    ...prev,
                                    [unit.id]: !prev[unit.id],
                                  }))
                                }
                                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-0.5 ml-1"
                                title={isPinVisible ? 'Ocultar Senha' : 'Ver Senha'}
                              >
                                {isPinVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0 pt-2 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => onSelectUnit(unit.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              isViewingThis
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'neu-btn text-purple-700 dark:text-purple-300 hover:text-purple-800'
                            }`}
                          >
                            {isViewingThis ? 'Visualizando' : 'Acessar'}
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditUnitModal(unit)}
                            className="p-2 rounded-xl neu-btn text-sky-700 dark:text-sky-400 hover:text-sky-800"
                            title="Editar Unidade"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete unit (Protected for Belém) */}
                          {unit.id !== 'belem' ? (
                            <button
                              type="button"
                              onClick={() => setUnitToDelete(unit)}
                              className="p-2 rounded-xl neu-btn text-rose-700 dark:text-rose-400 hover:text-rose-800"
                              title="Excluir Unidade"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span
                              className="p-2 text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-50"
                              title="Unidade Matriz Belém não pode ser excluída"
                            >
                              <Lock className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Room Modal (Add / Edit) */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl neu-flat-lg bg-[var(--card-surface)] border border-[var(--border-subtle)] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <h3 className="font-extrabold text-base text-[var(--text-primary)]">
                {editingRoom ? 'Editar Sala' : 'Cadastrar Nova Sala'}
              </h3>
              <button
                onClick={() => setIsRoomModalOpen(false)}
                className="p-2 rounded-xl neu-btn text-[var(--text-secondary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="p-5 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-[var(--text-primary)] mb-1">
                  Nome da Sala *
                </label>
                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Ex: Sala 3 ou Sala Belém Executiva"
                  className="w-full px-3 py-2 rounded-xl neu-input text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-primary)] mb-1">
                  Capacidade (Número de pessoas) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={roomCapacity}
                  onChange={(e) => setRoomCapacity(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl neu-input text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-primary)] mb-1">
                  Status Operacional da Sala *
                </label>
                <select
                  value={roomStatus}
                  onChange={(e) => setRoomStatus(e.target.value as RoomStatus)}
                  className="w-full px-3 py-2 rounded-xl neu-input text-[var(--text-primary)]"
                >
                  <option value="active">Ativa (Disponível para reservas)</option>
                  <option value="maintenance">Em Manutenção</option>
                  <option value="locked">Interditada (Bloqueio Total)</option>
                </select>
              </div>

              {roomStatus !== 'active' && (
                <div>
                  <label className="block font-bold text-amber-800 dark:text-amber-300 mb-1">
                    Justificativa Obrigatória do Bloqueio *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={roomMaintenanceReason}
                    onChange={(e) => setRoomMaintenanceReason(e.target.value)}
                    placeholder="Ex: Manutenção no ar-condicionado pelo setor predial."
                    className="w-full px-3 py-2 rounded-xl neu-input text-[var(--text-primary)]"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-[var(--text-primary)] mb-1">
                  Recursos Disponíveis (separados por vírgula)
                </label>
                <input
                  type="text"
                  value={roomResources}
                  onChange={(e) => setRoomResources(e.target.value)}
                  placeholder="Ar-condicionado, TV Smart 55, Quadro Branco"
                  className="w-full px-3 py-2 rounded-xl neu-input text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-primary)] mb-1">
                  Descrição Adicional
                </label>
                <textarea
                  rows={2}
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                  placeholder="Informações sobre localização ou uso da sala."
                  className="w-full px-3 py-2 rounded-xl neu-input text-[var(--text-primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-4 py-2 rounded-xl neu-btn text-xs font-bold text-[var(--text-secondary)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E60026] hover:bg-[#C70020] text-white text-xs font-black uppercase tracking-wider shadow-md"
                >
                  Salvar Sala
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pop-up de Confirmação para Exclusão de Sala */}
      {roomToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-[32px] neu-flat-lg bg-[var(--card-surface)] border border-[var(--border-subtle)] overflow-hidden p-6 sm:p-7 text-[var(--text-primary)] space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#E60026]/15 text-[#E60026] dark:text-[#FF2B4D] flex items-center justify-center flex-shrink-0 neu-pressed-sm">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-black text-[#E60026] dark:text-[#FF2B4D] tracking-widest uppercase">
                  CONFIRMAÇÃO NECESSÁRIA
                </span>
                <h3 className="text-lg font-black leading-tight text-[var(--text-primary)]">
                  Excluir Sala?
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Tem certeza de que deseja excluir a sala <strong className="text-[var(--text-primary)]">"{roomToDelete.name}"</strong>? Esta ação removerá a sala da Unidade Belém e não poderá ser desfeita.
            </p>

            {/* Aviso se houver reservas associadas à sala */}
            {bookings.filter((b) => b.roomId === roomToDelete.id).length > 0 && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 font-medium text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
                <span>
                  Atenção: Esta sala possui <strong>{bookings.filter((b) => b.roomId === roomToDelete.id).length} agendamento(s)</strong> registrados no sistema.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setRoomToDelete(null)}
                disabled={isDeletingRoom}
                className="px-4 py-2.5 rounded-2xl neu-btn text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRoom}
                disabled={isDeletingRoom}
                className="px-5 py-2.5 rounded-2xl bg-[#E60026] hover:bg-[#C70020] text-white text-xs font-black tracking-wider uppercase shadow-md flex items-center gap-2 active:scale-95 transition-all"
              >
                {isDeletingRoom ? (
                  <span>Excluindo...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sim, Excluir Sala</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop-up de Confirmação para Cancelamento/Exclusão de Agendamento */}
      {bookingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-[32px] neu-flat-lg bg-[var(--card-surface)] border border-[var(--border-subtle)] overflow-hidden p-6 sm:p-7 text-[var(--text-primary)] space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#E60026]/15 text-[#E60026] dark:text-[#FF2B4D] flex items-center justify-center flex-shrink-0 neu-pressed-sm">
                <Trash2 className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-black text-[#E60026] dark:text-[#FF2B4D] tracking-widest uppercase">
                  CONFIRMAÇÃO DE CANCELAMENTO
                </span>
                <h3 className="text-lg font-black leading-tight text-[var(--text-primary)]">
                  Excluir Agendamento?
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Tem certeza de que deseja cancelar e excluir o agendamento de <strong className="text-[var(--text-primary)]">"{bookingToDelete.isBlock ? `BLOQUEIO (${bookingToDelete.blockReason})` : bookingToDelete.userName}"</strong> para o dia <strong>{bookingToDelete.date} ({bookingToDelete.startTime} às {bookingToDelete.endTime})</strong>?
            </p>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 font-medium text-xs">
              Esta ação liberará imediatamente o horário da sala para novas reservas na Unidade {currentUnit?.name || 'Belém'}.
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setBookingToDelete(null)}
                disabled={isDeletingBooking}
                className="px-4 py-2.5 rounded-2xl neu-btn text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBooking}
                disabled={isDeletingBooking}
                className="px-5 py-2.5 rounded-2xl bg-[#E60026] hover:bg-[#C70020] text-white text-xs font-black tracking-wider uppercase shadow-md flex items-center gap-2 active:scale-95 transition-all"
              >
                {isDeletingBooking ? (
                  <span>Excluindo...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sim, Excluir Agendamento</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Unidade (Developer Only) */}
      {editingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl neu-flat-lg bg-[var(--card-surface)] border border-[var(--border-subtle)] overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-700 dark:text-sky-400 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-[var(--text-primary)]">
                    Editar Unidade / Filial
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Código: <span className="font-mono">{editingUnit.id}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingUnit(null)}
                className="p-2 rounded-xl neu-btn text-[var(--text-secondary)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUnit} className="p-5 space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-[var(--text-primary)] mb-1">
                  Nome da Unidade *
                </label>
                <input
                  type="text"
                  required
                  value={editUnitName}
                  onChange={(e) => setEditUnitName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl neu-input text-[var(--text-primary)]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block font-bold text-[var(--text-primary)] mb-1">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={editUnitCity}
                    onChange={(e) => setEditUnitCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl neu-input text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[var(--text-primary)] mb-1">
                    UF *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={editUnitState}
                    onChange={(e) => setEditUnitState(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 rounded-xl neu-input text-[var(--text-primary)] uppercase text-center font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[var(--text-primary)] mb-1">
                  Senha de Acesso do Administrador (6 Dígitos) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={editUnitPin}
                  onChange={(e) => setEditUnitPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 rounded-xl neu-input text-[var(--text-primary)] font-mono tracking-widest text-sm"
                />
                <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                  Senha necessária para acessar a administração desta filial.
                </p>
              </div>

              <div>
                <label className="block font-bold text-[var(--text-primary)] mb-1">
                  Descrição
                </label>
                <textarea
                  rows={2}
                  value={editUnitDescription}
                  onChange={(e) => setEditUnitDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl neu-input text-[var(--text-primary)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setEditingUnit(null)}
                  className="px-4 py-2 rounded-xl neu-btn text-xs font-bold text-[var(--text-secondary)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingEditUnit}
                  className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black uppercase tracking-wider shadow-md"
                >
                  {isSavingEditUnit ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmação de Exclusão de Unidade */}
      {unitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-[32px] neu-flat-lg bg-[var(--card-surface)] border border-[var(--border-subtle)] overflow-hidden p-6 sm:p-7 text-[var(--text-primary)] space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-700 dark:text-rose-400 flex items-center justify-center flex-shrink-0 neu-pressed-sm">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-black text-rose-700 dark:text-rose-400 tracking-widest uppercase">
                  CONFIRMAÇÃO MESTRE
                </span>
                <h3 className="text-lg font-black leading-tight text-[var(--text-primary)]">
                  Excluir Unidade?
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
              Tem certeza de que deseja remover a unidade <strong className="text-[var(--text-primary)]">"{unitToDelete.name}"</strong>? Os administradores que usam a senha desta unidade não conseguirão mais acessá-la.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setUnitToDelete(null)}
                disabled={isDeletingUnit}
                className="px-4 py-2.5 rounded-2xl neu-btn text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUnit}
                disabled={isDeletingUnit}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black tracking-wider uppercase shadow-md flex items-center gap-2 active:scale-95 transition-all"
              >
                {isDeletingUnit ? (
                  <span>Excluindo...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Sim, Excluir Unidade</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manuals Modal with Admin guide (Restricted to authenticated Admin area) */}
      <ManualsModal
        isOpen={showAdminManualModal}
        onClose={() => setShowAdminManualModal(false)}
        allowAdminManual={true}
        defaultTab="admin"
      />
    </div>
  );
};

