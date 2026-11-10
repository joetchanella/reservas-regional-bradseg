import { Room, Booking, AnomalyAlert } from '../types';
import { timeToMinutes, getWorkingDaysList, checkIntervalOverlap } from './dateUtils';

export function detectAnomalies(rooms: Room[], bookings: Booking[]): AnomalyAlert[] {
  const alerts: AnomalyAlert[] = [];

  // 1. Conflict detection (Overlapping slots)
  for (let i = 0; i < bookings.length; i++) {
    for (let j = i + 1; j < bookings.length; j++) {
      const b1 = bookings[i];
      const b2 = bookings[j];
      if (b1.roomId === b2.roomId && b1.date === b2.date) {
        if (checkIntervalOverlap(b1.startTime, b1.endTime, b2.startTime, b2.endTime)) {
          const room = rooms.find((r) => r.id === b1.roomId);
          alerts.push({
            id: `conflict-${b1.id}-${b2.id}`,
            type: 'conflict',
            title: `Conflito de Agenda Detectado na ${room?.name || 'Sala'}`,
            description: `Sobreposição entre ${b1.userName} (${b1.startTime}-${b1.endTime}) e ${b2.userName} (${b2.startTime}-${b2.endTime}) na data ${b1.date}.`,
            severity: 'danger',
            roomId: b1.roomId,
            bookingId: b1.id,
          });
        }
      }
    }
  }

  // 2. Long bookings (> 8 hours = 480 mins)
  bookings.forEach((b) => {
    if (b.isBlock) return; // Administrative blocks can be full day
    const durationMins = timeToMinutes(b.endTime) - timeToMinutes(b.startTime);
    if (durationMins > 480) {
      const hours = (durationMins / 60).toFixed(1);
      const room = rooms.find((r) => r.id === b.roomId);
      alerts.push({
        id: `long-${b.id}`,
        type: 'long_booking',
        title: `Reserva Excessivamente Longa (${hours}h)`,
        description: `${b.userName} reservou a ${room?.name || 'sala'} por ${hours} horas consecutivas (${b.startTime} às ${b.endTime}) em ${b.date}.`,
        severity: 'warning',
        bookingId: b.id,
        roomId: b.roomId,
      });
    }
  });

  // 3. Consecutive back-to-back bookings by the same user or phone on the same date
  const bookingsByUserDate: { [key: string]: Booking[] } = {};
  bookings.forEach((b) => {
    if (b.isBlock) return;
    const cleanUser = (b.userName || '').trim().toLowerCase();
    const cleanPhone = (b.userPhone || '').replace(/\D/g, '');
    const userKey = cleanPhone || cleanUser;
    if (!userKey) return;

    const groupKey = `${userKey}_${b.date}`;
    if (!bookingsByUserDate[groupKey]) {
      bookingsByUserDate[groupKey] = [];
    }
    bookingsByUserDate[groupKey].push(b);
  });

  Object.entries(bookingsByUserDate).forEach(([key, userBookings]) => {
    if (userBookings.length > 1) {
      // Sort by start time
      userBookings.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
      for (let i = 0; i < userBookings.length - 1; i++) {
        const cur = userBookings[i];
        const next = userBookings[i + 1];
        // If end of cur is equal to or within 15 min of start of next
        const diff = timeToMinutes(next.startTime) - timeToMinutes(cur.endTime);
        if (diff >= 0 && diff <= 15) {
          const room1 = rooms.find((r) => r.id === cur.roomId);
          const room2 = rooms.find((r) => r.id === next.roomId);
          alerts.push({
            id: `consecutive-${cur.id}-${next.id}`,
            type: 'consecutive',
            title: 'Reservas Consecutivas Detectadas',
            description: `${cur.userName} agendou slots consecutivos no dia ${cur.date} (${cur.startTime}-${cur.endTime} na ${room1?.name || 'sala'} e ${next.startTime}-${next.endTime} na ${room2?.name || 'sala'}).`,
            severity: 'warning',
            bookingId: cur.id,
          });
        }
      }
    }
  });

  // 4. Underutilized rooms (0 bookings across the working days window)
  const workingDays = getWorkingDaysList(new Date(), 5); // current week
  rooms.forEach((room) => {
    if (room.status !== 'active') return;
    const hasBookingsInWindow = bookings.some(
      (b) => b.roomId === room.id && workingDays.includes(b.date)
    );
    if (!hasBookingsInWindow) {
      alerts.push({
        id: `underutilized-${room.id}`,
        type: 'underutilized',
        title: `Sala com Baixa Utilização: ${room.name}`,
        description: `A ${room.name} (Capacidade: ${room.capacity}) não possui nenhum agendamento registrado para os próximos dias úteis.`,
        severity: 'info',
        roomId: room.id,
      });
    }
  });

  return alerts;
}
