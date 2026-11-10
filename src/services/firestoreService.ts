import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Room, Booking, Department, Unit } from '../types';
import { checkIntervalOverlap } from '../utils/dateUtils';

// Super Admin / Developer Master Password
export const DEVELOPER_PIN = '310898';

// Initial Units configuration as specified by user
export const INITIAL_UNITS: Unit[] = [
  {
    id: 'belem',
    name: 'Belém',
    city: 'Belém',
    state: 'PA',
    adminPin: '140323',
    description: 'Unidade Regional Belém',
    active: true,
  },
  {
    id: 'brasilia',
    name: 'Brasília',
    city: 'Brasília',
    state: 'DF',
    adminPin: '020880',
    description: 'Unidade Regional Brasília',
    active: true,
  },
  {
    id: 'goiania',
    name: 'Goiânia',
    city: 'Goiânia',
    state: 'GO',
    adminPin: '120220',
    description: 'Unidade Regional Goiânia',
    active: true,
  },
];

// Seed initial rooms for Belém
export const INITIAL_ROOMS: Omit<Room, 'id'>[] = [
  {
    unitId: 'belem',
    name: 'Sala 1',
    capacity: 9,
    resources: ['Ar-condicionado', 'TV Smart 55"', 'Quadro Branco', 'Wi-Fi 5G'],
    status: 'active',
    description: 'Sala executiva com capacidade para 9 pessoas.',
  },
  {
    unitId: 'belem',
    name: 'Sala 2',
    capacity: 6,
    resources: ['Ar-condicionado', 'TV Smart 65"', 'Sistema de Videoconferência', 'Wi-Fi 5G'],
    status: 'active',
    description: 'Sala de reuniões para até 6 pessoas.',
  },
  {
    unitId: 'belem',
    name: 'Treinamento',
    capacity: 13,
    resources: ['Ar-condicionado', 'Projetor 4K', 'Sistema de Som Integrado', 'Mesas Modulares', 'Wi-Fi 5G'],
    status: 'active',
    description: 'Sala de treinamento e capacitação corporativa para até 13 pessoas.',
  },
];

// Initial rooms for other branches
export const BRANCH_INITIAL_ROOMS: Record<string, Omit<Room, 'id'>[]> = {
  brasilia: [
    {
      unitId: 'brasilia',
      name: 'Sala Alvorada',
      capacity: 10,
      resources: ['Ar-condicionado', 'TV Smart 65"', 'Sistema de Videoconferência', 'Wi-Fi 5G'],
      status: 'active',
      description: 'Sala de reuniões executiva.',
    },
    {
      unitId: 'brasilia',
      name: 'Sala Planalto',
      capacity: 6,
      resources: ['Ar-condicionado', 'TV Smart 55"', 'Quadro Branco', 'Wi-Fi 5G'],
      status: 'active',
      description: 'Sala rápida para alinhamentos.',
    },
    {
      unitId: 'brasilia',
      name: 'Treinamento DF',
      capacity: 16,
      resources: ['Ar-condicionado', 'Projetor 4K', 'Sistema de Som Integrado', 'Wi-Fi 5G'],
      status: 'active',
      description: 'Sala de treinamento corporativo.',
    },
  ],
  goiania: [
    {
      unitId: 'goiania',
      name: 'Sala Ipê',
      capacity: 8,
      resources: ['Ar-condicionado', 'TV Smart 55"', 'Videoconferência', 'Wi-Fi 5G'],
      status: 'active',
      description: 'Sala de reuniões principal.',
    },
    {
      unitId: 'goiania',
      name: 'Sala Cerrado',
      capacity: 6,
      resources: ['Ar-condicionado', 'TV Smart 55"', 'Quadro Branco', 'Wi-Fi 5G'],
      status: 'active',
      description: 'Sala de reuniões compacta.',
    },
    {
      unitId: 'goiania',
      name: 'Treinamento GO',
      capacity: 14,
      resources: ['Ar-condicionado', 'Projetor 4K', 'Wi-Fi 5G'],
      status: 'active',
      description: 'Auditório e sala de treinamento.',
    },
  ],
};

// Subscribe to Units with onSnapshot
export function subscribeUnits(
  onUpdate: (units: Unit[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'units');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const units: Unit[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        units.push({
          id: docSnap.id,
          name: data.name || '',
          city: data.city || data.name || '',
          state: data.state || '',
          adminPin: data.adminPin || '',
          description: data.description || '',
          createdAt: data.createdAt,
          active: data.active !== false,
        });
      });
      // Sort alphabetically
      units.sort((a, b) => a.name.localeCompare(b.name));
      onUpdate(units);
    },
    (err) => {
      onError?.(err);
      handleFirestoreError(err, OperationType.GET, 'units');
    }
  );
}

// Utility to recursively strip undefined properties so Firestore setDoc never throws
function stripUndefined<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

// Create new Unit (Developer only)
export async function createUnit(unitData: Omit<Unit, 'id' | 'createdAt'> & { id?: string }): Promise<string> {
  const unitId = unitData.id || unitData.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || `unit-${Date.now()}`;
  const fullUnit: Unit = {
    ...unitData,
    id: unitId,
    createdAt: new Date().toISOString(),
    active: true,
  };

  try {
    await setDoc(doc(db, 'units', unitId), stripUndefined(fullUnit));

    // Optionally create 2 default rooms for this new unit so it can be used immediately
    const defaultRooms: Omit<Room, 'id'>[] = [
      {
        unitId,
        name: 'Sala 1',
        capacity: 8,
        resources: ['Ar-condicionado', 'TV Smart 55"', 'Wi-Fi 5G'],
        status: 'active',
        description: `Sala de Reuniões principal da Unidade ${unitData.name}.`,
      },
      {
        unitId,
        name: 'Treinamento',
        capacity: 14,
        resources: ['Ar-condicionado', 'Projetor 4K', 'Wi-Fi 5G'],
        status: 'active',
        description: `Espaço de capacitação da Unidade ${unitData.name}.`,
      },
    ];

    for (let i = 0; i < defaultRooms.length; i++) {
      const roomId = `room-${unitId}-${i + 1}`;
      await setDoc(doc(db, 'rooms', roomId), {
        ...defaultRooms[i],
        id: roomId,
        createdAt: new Date().toISOString(),
      });
    }

    return unitId;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `units/${unitId}`);
  }
}

// Update Unit
export async function updateUnit(unitId: string, updatedData: Partial<Unit>): Promise<void> {
  try {
    await setDoc(doc(db, 'units', unitId), stripUndefined(updatedData), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `units/${unitId}`);
  }
}

// Delete Unit
export async function deleteUnit(unitId: string): Promise<void> {
  try {
    // 1. Delete unit document
    await deleteDoc(doc(db, 'units', unitId));

    // 2. Cascade delete all rooms associated with this unit
    const roomsSnap = await getDocs(collection(db, 'rooms'));
    const unitRooms = roomsSnap.docs.filter((d) => d.data().unitId === unitId);
    for (const rDoc of unitRooms) {
      await deleteDoc(doc(db, 'rooms', rDoc.id));
    }

    // 3. Cascade delete all bookings associated with this unit
    const bookingsSnap = await getDocs(collection(db, 'bookings'));
    const unitBookings = bookingsSnap.docs.filter((d) => (d.data().unitId || 'belem') === unitId);
    for (const bDoc of unitBookings) {
      await deleteDoc(doc(db, 'bookings', bDoc.id));
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `units/${unitId}`);
  }
}

export const INITIAL_DEPARTMENTS: string[] = [
  'Gestão de Rede',
  'BVP',
  'Dental',
  'Diretoria',
  'Financeiro',
  'Recursos Humanos',
  'Comercial & Vendas',
  'Tecnologia / TI',
  'Atendimento / SAC',
  'Operações',
];

// Subscribe to Rooms with onSnapshot
export function subscribeRooms(
  onUpdate: (rooms: Room[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'rooms');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const rooms: Room[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        rooms.push({
          id: docSnap.id,
          unitId: data.unitId || 'belem',
          name: data.name || '',
          capacity: data.capacity || 0,
          resources: data.resources || [],
          status: data.status || 'active',
          maintenanceReason: data.maintenanceReason,
          description: data.description,
          createdAt: data.createdAt,
        });
      });
      // Sort alphabetically by name
      rooms.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      onUpdate(rooms);
    },
    (err) => {
      onError?.(err);
      handleFirestoreError(err, OperationType.GET, 'rooms');
    }
  );
}

// Subscribe to Bookings with onSnapshot
export function subscribeBookings(
  onUpdate: (bookings: Booking[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'bookings');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const bookings: Booking[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        bookings.push({
          id: docSnap.id,
          unitId: data.unitId || 'belem',
          roomId: data.roomId,
          userName: data.userName || '',
          userPhone: data.userPhone || '',
          userDepartment: data.userDepartment || '',
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          createdAt: data.createdAt || new Date().toISOString(),
          isBlock: !!data.isBlock,
          blockReason: data.blockReason,
        });
      });
      onUpdate(bookings);
    },
    (err) => {
      onError?.(err);
      handleFirestoreError(err, OperationType.GET, 'bookings');
    }
  );
}

// Subscribe to Departments with onSnapshot
export function subscribeDepartments(
  onUpdate: (departments: Department[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'departments');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const depts: Department[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        depts.push({
          id: docSnap.id,
          name: data.name || '',
        });
      });
      depts.sort((a, b) => a.name.localeCompare(b.name));
      onUpdate(depts);
    },
    (err) => {
      onError?.(err);
      handleFirestoreError(err, OperationType.GET, 'departments');
    }
  );
}

// Seed Database ONLY if empty (does NOT restore deleted units or rooms)
export async function seedInitialDataIfNeeded(): Promise<void> {
  try {
    // 1. Seed Units ONLY if units collection is completely empty (first initialization)
    const unitsSnap = await getDocs(collection(db, 'units'));
    if (unitsSnap.empty) {
      console.log('Coleção de unidades vazia. Executando seed inicial de unidades...');
      for (const u of INITIAL_UNITS) {
        await setDoc(doc(db, 'units', u.id), {
          ...u,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // 2. Check and seed Rooms ONLY if rooms collection is completely empty
    const roomsSnap = await getDocs(collection(db, 'rooms'));
    if (roomsSnap.empty) {
      console.log('Coleção de salas vazia. Executando seed inicial de salas...');
      // Seed Belém
      for (let i = 0; i < INITIAL_ROOMS.length; i++) {
        const roomId = `room-belem-${i + 1}`;
        await setDoc(doc(db, 'rooms', roomId), {
          ...INITIAL_ROOMS[i],
          unitId: 'belem',
          id: roomId,
          createdAt: new Date().toISOString(),
        });
      }

      // Seed branch initial rooms for Brasília and Goiânia
      for (const [branchId, branchRooms] of Object.entries(BRANCH_INITIAL_ROOMS)) {
        for (let i = 0; i < branchRooms.length; i++) {
          const roomId = `room-${branchId}-${i + 1}`;
          await setDoc(doc(db, 'rooms', roomId), {
            ...branchRooms[i],
            unitId: branchId,
            id: roomId,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } else {
      // Migrate legacy rooms that had no unitId to 'belem'
      for (const docSnap of roomsSnap.docs) {
        const data = docSnap.data();
        if (!data.unitId) {
          await setDoc(doc(db, 'rooms', docSnap.id), { unitId: 'belem' }, { merge: true });
        }
      }
    }

    // 3. Departments ONLY if departments collection is completely empty
    const deptsSnap = await getDocs(collection(db, 'departments'));
    if (deptsSnap.empty) {
      console.log('Coleção de departamentos vazia. Executando seed inicial...');
      for (let i = 0; i < INITIAL_DEPARTMENTS.length; i++) {
        const deptId = `dept-${i + 1}`;
        await setDoc(doc(db, 'departments', deptId), {
          name: INITIAL_DEPARTMENTS[i],
        });
      }
    }
  } catch (error) {
    console.error('Error during automatic seed check:', error);
  }
}

function assertAllowedToMutate() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    const isOfficial = host === 'joetchanella.github.io';
    const isLocalOrDev = host === 'localhost' || host === '127.0.0.1' || host.includes('ais-dev-');
    if (!isOfficial && !isLocalOrDev) {
      throw new Error(
        'Agendamentos desativados neste endereço antigo para evitar erros. Acesse o novo link oficial: https://joetchanella.github.io/reservas-regional-bradseg/'
      );
    }
  }
}

// Create a booking with collision check
export async function createBooking(
  bookingData: Omit<Booking, 'id' | 'createdAt'>,
  existingBookings: Booking[]
): Promise<string> {
  assertAllowedToMutate();
  const targetUnitId = bookingData.unitId || 'belem';

  // Check for time overlap in existing bookings for same unit, same room and same date
  const conflict = existingBookings.find(
    (b) =>
      (b.unitId || 'belem') === targetUnitId &&
      b.roomId === bookingData.roomId &&
      b.date === bookingData.date &&
      checkIntervalOverlap(bookingData.startTime, bookingData.endTime, b.startTime, b.endTime)
  );

  if (conflict) {
    throw new Error(
      `Conflito de horário! A sala já possui agendamento das ${conflict.startTime} às ${conflict.endTime} (${conflict.isBlock ? 'Bloqueio' : conflict.userName}).`
    );
  }

  const bookingId = `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const fullBooking: Booking = {
    ...bookingData,
    unitId: targetUnitId,
    id: bookingId,
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'bookings', bookingId), stripUndefined(fullBooking));
    return bookingId;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `bookings/${bookingId}`);
  }
}

// Update booking
export async function updateBooking(
  bookingId: string,
  updatedData: Partial<Booking>,
  existingBookings: Booking[]
): Promise<void> {
  assertAllowedToMutate();
  const current = existingBookings.find((b) => b.id === bookingId);
  if (!current) throw new Error('Agendamento não encontrado');

  const targetUnitId = updatedData.unitId || current.unitId || 'belem';
  const targetRoomId = updatedData.roomId || current.roomId;
  const targetDate = updatedData.date || current.date;
  const targetStart = updatedData.startTime || current.startTime;
  const targetEnd = updatedData.endTime || current.endTime;

  // Collision check excluding self within same unit and room
  const conflict = existingBookings.find(
    (b) =>
      b.id !== bookingId &&
      (b.unitId || 'belem') === targetUnitId &&
      b.roomId === targetRoomId &&
      b.date === targetDate &&
      checkIntervalOverlap(targetStart, targetEnd, b.startTime, b.endTime)
  );

  if (conflict) {
    throw new Error(
      `Conflito de horário! A sala já possui agendamento das ${conflict.startTime} às ${conflict.endTime}.`
    );
  }

  try {
    await setDoc(
      doc(db, 'bookings', bookingId),
      stripUndefined({ ...current, ...updatedData, unitId: targetUnitId }),
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `bookings/${bookingId}`);
  }
}

// Delete booking
export async function deleteBooking(bookingId: string): Promise<void> {
  assertAllowedToMutate();
  try {
    await deleteDoc(doc(db, 'bookings', bookingId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `bookings/${bookingId}`);
  }
}

// Create or update room
export async function saveRoom(room: Room): Promise<void> {
  const unitId = room.unitId || 'belem';
  const roomId = room.id || `room-${unitId}-${Date.now()}`;
  try {
    await setDoc(doc(db, 'rooms', roomId), stripUndefined({ ...room, id: roomId, unitId }), { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `rooms/${roomId}`);
  }
}

// Delete room
export async function deleteRoom(roomId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'rooms', roomId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `rooms/${roomId}`);
  }
}

// Add department
export async function addDepartment(name: string): Promise<void> {
  const deptId = `dept-${Date.now()}`;
  try {
    await setDoc(doc(db, 'departments', deptId), { name });
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `departments/${deptId}`);
  }
}

// Delete department
export async function deleteDepartment(deptId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'departments', deptId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `departments/${deptId}`);
  }
}

// Backup all collections to JSON (including units)
export async function exportDatabaseBackup(): Promise<string> {
  const unitsSnap = await getDocs(collection(db, 'units'));
  const roomsSnap = await getDocs(collection(db, 'rooms'));
  const bookingsSnap = await getDocs(collection(db, 'bookings'));
  const deptsSnap = await getDocs(collection(db, 'departments'));

  const backupData = {
    exportedAt: new Date().toISOString(),
    system: 'Reservas Corporativas Bradesco Seguros',
    units: unitsSnap.docs.map((d) => d.data()),
    rooms: roomsSnap.docs.map((d) => d.data()),
    bookings: bookingsSnap.docs.map((d) => d.data()),
    departments: deptsSnap.docs.map((d) => d.data()),
  };

  return JSON.stringify(backupData, null, 2);
}

// Restore database from JSON (including units)
export async function restoreDatabaseFromJson(jsonString: string): Promise<{ unitsCount: number; roomsCount: number; bookingsCount: number }> {
  const data = JSON.parse(jsonString);
  const batch = writeBatch(db);

  let uCount = 0;
  let rCount = 0;
  let bCount = 0;

  if (Array.isArray(data.units)) {
    for (const u of data.units) {
      if (u.id) {
        batch.set(doc(db, 'units', u.id), u);
        uCount++;
      }
    }
  }

  if (Array.isArray(data.rooms)) {
    for (const r of data.rooms) {
      if (r.id) {
        batch.set(doc(db, 'rooms', r.id), r);
        rCount++;
      }
    }
  }

  if (Array.isArray(data.bookings)) {
    for (const b of data.bookings) {
      if (b.id) {
        batch.set(doc(db, 'bookings', b.id), b);
        bCount++;
      }
    }
  }

  if (Array.isArray(data.departments)) {
    for (const d of data.departments) {
      if (d.name) {
        const id = d.id || `dept-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        batch.set(doc(db, 'departments', id), d);
      }
    }
  }

  await batch.commit();
  return { unitsCount: uCount, roomsCount: rCount, bookingsCount: bCount };
}

// Import bookings from CSV text for a specific unit
export async function importBookingsFromCsvText(
  csvText: string,
  targetUnitId: string,
  availableRooms: Room[]
): Promise<{
  totalImported: number;
  pastCount: number;
  futureCount: number;
  skippedCount: number;
}> {
  // Strip BOM if present
  const cleanText = csvText.replace(/^\uFEFF/, '').trim();
  const rawLines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (rawLines.length < 2) {
    throw new Error('O arquivo CSV precisa conter ao menos um cabeçalho e uma linha de dados.');
  }

  // Detect delimiter
  const firstLine = rawLines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';

  // Parse header
  const parseRow = (line: string): string[] => {
    // Regex to split by delimiter while ignoring delimiters inside quotes
    const regex = new RegExp(`(?:^|\\${delimiter})(?:"([^"]*(?:""[^"]*)*)"|([^"\\${delimiter}]*))`, 'g');
    const row: string[] = [];
    let match;
    while ((match = regex.exec(line)) !== null) {
      if (match.index === regex.lastIndex) regex.lastIndex++;
      const val = match[1] !== undefined ? match[1].replace(/""/g, '"') : match[2];
      row.push((val || '').trim());
    }
    return row;
  };

  const headers = parseRow(firstLine).map((h) =>
    h
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
  );

  const getColIndex = (keywords: string[]): number => {
    return headers.findIndex((h) => keywords.some((k) => h.includes(k)));
  };

  const roomCol = getColIndex(['sala', 'room']);
  const userCol = getColIndex(['usuario', 'solicitante', 'responsavel', 'nome']);
  const phoneCol = getColIndex(['whatsapp', 'telefone', 'celular', 'fone']);
  const deptCol = getColIndex(['setor', 'departamento']);
  const dateCol = getColIndex(['data', 'date']);
  const startCol = getColIndex(['inicio', 'horarioinicio', 'start']);
  const endCol = getColIndex(['fim', 'horariotermino', 'termino', 'end']);
  const createdCol = getColIndex(['cadastro', 'criadoem', 'created']);

  if (roomCol === -1 || dateCol === -1 || startCol === -1 || endCol === -1) {
    throw new Error(
      'Cabeçalho CSV inválido. As colunas Sala, Data, Início e Fim são obrigatórias.'
    );
  }

  // Map rooms for targetUnitId
  const unitRooms = availableRooms.filter((r) => (r.unitId || 'belem') === targetUnitId);
  const roomMapByName = new Map<string, string>();
  for (const r of unitRooms) {
    roomMapByName.set(r.name.trim().toLowerCase(), r.id);
  }

  const todayStr = new Date().toISOString().substring(0, 10);
  const bookingsToSave: Booking[] = [];
  const deptsToAdd = new Set<string>();
  let skipped = 0;

  for (let i = 1; i < rawLines.length; i++) {
    const row = parseRow(rawLines[i]);
    if (row.length === 0 || row.every((c) => !c)) continue;

    const rawRoom = row[roomCol] || '';
    const rawUser = userCol !== -1 ? row[userCol] || 'Reservado' : 'Reservado';
    const rawPhone = phoneCol !== -1 ? row[phoneCol] || '' : '';
    const rawDept = deptCol !== -1 ? row[deptCol] || 'Geral' : 'Geral';
    const rawDate = row[dateCol] || '';
    const rawStart = row[startCol] || '';
    const rawEnd = row[endCol] || '';
    const rawCreated = createdCol !== -1 ? row[createdCol] || '' : '';

    // Find roomId
    let roomId = roomMapByName.get(rawRoom.trim().toLowerCase());
    if (!roomId) {
      // Partial match
      const matched = unitRooms.find(
        (r) =>
          r.name.toLowerCase().includes(rawRoom.toLowerCase()) ||
          rawRoom.toLowerCase().includes(r.name.toLowerCase())
      );
      if (matched) {
        roomId = matched.id;
      }
    }

    if (!roomId) {
      skipped++;
      continue;
    }

    // Standardize date to YYYY-MM-DD
    let formattedDate = rawDate;
    if (rawDate.includes('/')) {
      const dParts = rawDate.split('/');
      if (dParts.length === 3) {
        const d = dParts[0].padStart(2, '0');
        const m = dParts[1].padStart(2, '0');
        const y = dParts[2].length === 2 ? `20${dParts[2]}` : dParts[2];
        formattedDate = `${y}-${m}-${d}`;
      }
    }

    // Standardize times HH:mm
    const fixTime = (t: string) => {
      const clean = t.replace(/\D/g, '');
      if (clean.length === 4) return `${clean.substring(0, 2)}:${clean.substring(2, 4)}`;
      if (t.includes(':')) {
        const [h, m] = t.split(':');
        return `${h.padStart(2, '0')}:${(m || '00').padStart(2, '0')}`;
      }
      return t;
    };
    const startTime = fixTime(rawStart);
    const endTime = fixTime(rawEnd);

    // Parse created timestamp
    let createdAt = new Date().toISOString();
    if (rawCreated) {
      const match = rawCreated.match(/(\d{2})\/(\d{2})\/(\d{4}),?\s*(\d{2}):(\d{2})/);
      if (match) {
        const [, day, month, year, hour, min] = match;
        createdAt = new Date(
          Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(min))
        ).toISOString();
      } else if (!isNaN(Date.parse(rawCreated))) {
        createdAt = new Date(rawCreated).toISOString();
      }
    }

    const cleanPhone = rawPhone === '-' ? '' : rawPhone;
    const userSlug = rawUser.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
    const roomShort = roomId.replace(/[^a-z0-9]/g, '').substring(0, 8);
    const bookingId = `b-${targetUnitId}-${formattedDate}-${roomShort}-${startTime.replace(':', '')}-${endTime.replace(':', '')}-${userSlug}`;

    bookingsToSave.push({
      id: bookingId,
      unitId: targetUnitId,
      roomId,
      userName: rawUser,
      userPhone: cleanPhone,
      userDepartment: rawDept,
      date: formattedDate,
      startTime,
      endTime,
      createdAt,
      isBlock: false,
    });

    if (rawDept && rawDept !== 'Geral') {
      deptsToAdd.add(rawDept);
    }
  }

  // Ensure new departments are added
  if (deptsToAdd.size > 0) {
    const existingDeptsSnap = await getDocs(collection(db, 'departments'));
    const existingNames = new Set(existingDeptsSnap.docs.map((d) => d.data().name?.toLowerCase()));
    for (const dName of deptsToAdd) {
      if (!existingNames.has(dName.toLowerCase())) {
        const deptId = `dept-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, 'departments', deptId), {
          id: deptId,
          name: dName,
        });
        existingNames.add(dName.toLowerCase());
      }
    }
  }

  let pastCount = 0;
  let futureCount = 0;

  // Batch commit in chunks of 200
  const chunkSize = 200;
  for (let c = 0; c < bookingsToSave.length; c += chunkSize) {
    const chunk = bookingsToSave.slice(c, c + chunkSize);
    const batch = writeBatch(db);

    for (const b of chunk) {
      batch.set(doc(db, 'bookings', b.id), b);
      if (b.date < todayStr) {
        pastCount++;
      } else {
        futureCount++;
      }
    }

    await batch.commit();
  }

  return {
    totalImported: bookingsToSave.length,
    pastCount,
    futureCount,
    skippedCount: skipped,
  };
}

