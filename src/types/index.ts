export type RoomStatus = 'active' | 'maintenance' | 'locked';

export interface Unit {
  id: string; // e.g. 'belem', 'brasilia', 'goiania'
  name: string; // e.g. 'Belém', 'Brasília', 'Goiânia'
  city: string;
  state?: string; // e.g. 'PA', 'DF', 'GO'
  adminPin: string; // 6-digit PIN for unit administration
  description?: string;
  createdAt?: string;
  active: boolean;
}

export interface Room {
  id: string;
  unitId?: string; // unit this room belongs to (defaults to 'belem')
  name: string;
  capacity: number;
  resources: string[];
  status: RoomStatus;
  department?: string;
  maintenanceReason?: string;
  description?: string;
  createdAt?: string;
}

export interface Booking {
  id: string;
  unitId?: string; // unit this booking belongs to (defaults to 'belem')
  roomId: string;
  userName: string;
  userPhone: string;
  userDepartment: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  createdAt: string; // ISO string
  isBlock: boolean;
  blockReason?: string;
}

export interface Department {
  id: string;
  name: string;
  unitId?: string;
}

export type ActiveTab = 'rooms' | 'admin';

export type AdminRole = 'none' | 'unit_admin' | 'developer';

export interface AdminSession {
  role: AdminRole;
  unitId: string | null; // specific unitId for unit_admin, or null for developer
  unitName?: string;
}

export interface AnomalyAlert {
  id: string;
  type: 'long_booking' | 'consecutive' | 'underutilized' | 'conflict';
  title: string;
  description: string;
  severity: 'warning' | 'info' | 'danger';
  bookingId?: string;
  roomId?: string;
}
