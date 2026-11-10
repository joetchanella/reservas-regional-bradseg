// Utilities for Date and Time operations in Reservas Belém

export const OPERATING_START_HOUR = 8;
export const OPERATING_END_HOUR = 18;

// All 1-hour intervals from 08:00 to 18:00
export const TIME_SLOTS: string[] = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
];

export function isWeekend(dateString: string): boolean {
  // dateString is YYYY-MM-DD
  const parts = dateString.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

export function formatDateToISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(dateString: string): Date {
  const [y, m, d] = dateString.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Format date to Brazilian friendly format: "Segunda, 14 Out"
export function formatFriendlyDate(dateString: string): string {
  const date = parseISODate(dateString);
  const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  
  const dayOfWeek = daysOfWeek[date.getDay()];
  const dayNum = date.getDate();
  const monthName = months[date.getMonth()];

  return `${dayOfWeek}, ${dayNum} de ${monthName}`;
}

export function formatShortDay(dateString: string): { dayName: string; dayNumber: string; isToday: boolean } {
  const date = parseISODate(dateString);
  const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
  
  const today = new Date();
  const isToday = formatDateToISO(today) === dateString;

  return {
    dayName: days[date.getDay()],
    dayNumber: String(date.getDate()).padStart(2, '0'),
    isToday,
  };
}

// Generates working days (Monday-Friday) for a window of weeks around current date
export function getWorkingDaysList(centerDate: Date = new Date(), totalDays = 14): string[] {
  const list: string[] = [];
  const current = new Date(centerDate);
  // Start from Monday of the current week
  const day = current.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  current.setDate(current.getDate() + diffToMonday);

  let added = 0;
  while (added < totalDays) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      list.push(formatDateToISO(current));
      added++;
    }
    current.setDate(current.getDate() + 1);
  }

  return list;
}

// Convert "HH:mm" to minutes since midnight for calculations
export function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Check if two time intervals overlap
export function checkIntervalOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);

  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
}

// Formats Brazilian phone numbers: (91) 98765-4321 or (91) 3222-1234
export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

// Standardizes name for home screen display: ALWAYS UPPERCASE, first and second name only
export function formatDisplayName(fullName: string): string {
  if (!fullName) return '';
  const parts = fullName.trim().toUpperCase().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1]}`;
}

// Cleans phone to international WhatsApp link: https://wa.me/5591999999999
export function getWhatsAppUrl(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, '');
  const fullNumber = digits.startsWith('55') ? digits : `55${digits}`;
  const encodedText = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${fullNumber}${encodedText}`;
}

// Get all vacant starting times for a room on a given date (1-hour slots plus any booking boundaries like 15:30)
export function getAvailableSlotsForRoom(
  roomId: string,
  date: string,
  allBookings: { roomId: string; date: string; startTime: string; endTime: string; id?: string }[],
  bookingToEditId?: string,
  filterPast: boolean = true
): string[] {
  // Base 1-hour slots
  const baseSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  // Bookings for this room and date
  const roomBookings = allBookings.filter(
    (b) => b.roomId === roomId && b.date === date && (!bookingToEditId || b.id !== bookingToEditId)
  );

  // Collect candidate starting times: base slots PLUS any booking end times (e.g. 15:30)
  const candidateSet = new Set<string>(baseSlots);
  roomBookings.forEach((b) => {
    if (b.endTime > '08:00' && b.endTime < '18:00') {
      candidateSet.add(b.endTime);
    }
  });

  const sortedCandidates = Array.from(candidateSet).sort((a, b) => timeToMinutes(a) - timeToMinutes(b));

  const now = new Date();
  const todayISO = formatDateToISO(now);
  const isToday = date === todayISO;
  const isPastDate = date < todayISO;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  if (isPastDate) return [];

  // Filter candidates that are NOT inside any existing booking
  const vacantSlots = sortedCandidates.filter((slot) => {
    const slotMins = timeToMinutes(slot);

    // If filtering past on today's date:
    // Any slot that has already started or passed current time is blocked/unavailable
    if (filterPast && isToday) {
      if (slotMins <= currentMinutes) {
        return false;
      }
    }

    // Check if slot falls inside an existing booking:
    // slot is blocked if any booking has b.startTime <= slot and b.endTime > slot
    const isInsideBooking = roomBookings.some((b) => {
      const bStart = timeToMinutes(b.startTime);
      const bEnd = timeToMinutes(b.endTime);
      return slotMins >= bStart && slotMins < bEnd;
    });

    if (isInsideBooking) return false;

    // Check that there is room for at least some booking before 18:00 or next booking
    const nextCollisionMins =
      roomBookings
        .map((b) => timeToMinutes(b.startTime))
        .filter((m) => m > slotMins)
        .sort((a, b) => a - b)[0] ?? 18 * 60;

    return nextCollisionMins > slotMins;
  });

  return vacantSlots;
}

// Compute contiguous valid end times strictly greater than selected startTime
export function getAvailableEndTimesForSlot(
  startTime: string,
  roomId: string,
  date: string,
  allBookings: { roomId: string; date: string; startTime: string; endTime: string; id?: string }[],
  bookingToEditId?: string
): string[] {
  if (!startTime || !roomId || !date) return [];
  const startMins = timeToMinutes(startTime);

  const roomBookings = allBookings.filter(
    (b) => b.roomId === roomId && b.date === date && (!bookingToEditId || b.id !== bookingToEditId)
  );

  // Next booking start time or 18:00 (closing hour)
  const nextBookingMins =
    roomBookings
      .map((b) => timeToMinutes(b.startTime))
      .filter((m) => m > startMins)
      .sort((a, b) => a - b)[0] ?? 18 * 60;

  const validEnds: string[] = [];

  // Intervals in 1 hour increments
  let cur = startMins + 60;
  while (cur <= nextBookingMins) {
    const h = String(Math.floor(cur / 60)).padStart(2, '0');
    const m = String(cur % 60).padStart(2, '0');
    validEnds.push(`${h}:${m}`);
    cur += 60;
  }

  // Also include nextBookingMins boundary if not aligned (e.g. 18:00 when starting at 15:30)
  const maxEndH = String(Math.floor(nextBookingMins / 60)).padStart(2, '0');
  const maxEndM = String(nextBookingMins % 60).padStart(2, '0');
  const maxEndStr = `${maxEndH}:${maxEndM}`;
  if (!validEnds.includes(maxEndStr) && nextBookingMins > startMins) {
    validEnds.push(maxEndStr);
  }

  validEnds.sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
  return validEnds;
}

// Format registration creation date & time: "16/10/2026 às 10:04"
export function formatRegistrationDateTime(isoString?: string, includeSeconds: boolean = false): string {
  if (!isoString) return 'Não registrada';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    if (includeSeconds) {
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year} às ${hours}:${minutes}:${seconds}`;
    }

    return `${day}/${month}/${year} às ${hours}:${minutes}`;
  } catch {
    return isoString;
  }
}

