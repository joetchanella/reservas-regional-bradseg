import { Booking, Room } from '../types';

export function exportBookingsToCSV(
  bookings: Booking[],
  rooms: Room[],
  fileName = 'relatorio_reservas_belem.csv'
): void {
  const roomMap = new Map<string, string>();
  rooms.forEach((r) => roomMap.set(r.id, r.name));

  // CSV Headers
  const headers = [
    'ID',
    'Data',
    'Sala',
    'Horário Início',
    'Horário Término',
    'Tipo',
    'Solicitante / Responsável',
    'Telefone / WhatsApp',
    'Departamento / Setor',
    'Motivo / Justificativa',
    'Criado em',
  ];

  const escapeCSV = (val: string | number | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const stringVal = String(val).replace(/"/g, '""');
    return `"${stringVal}"`;
  };

  const rows = bookings.map((b) => [
    escapeCSV(b.id),
    escapeCSV(b.date),
    escapeCSV(roomMap.get(b.roomId) || b.roomId),
    escapeCSV(b.startTime),
    escapeCSV(b.endTime),
    escapeCSV(b.isBlock ? 'Bloqueio Administrativo' : 'Reserva Corporativa'),
    escapeCSV(b.userName),
    escapeCSV(b.userPhone),
    escapeCSV(b.userDepartment),
    escapeCSV(b.blockReason || ''),
    escapeCSV(b.createdAt ? new Date(b.createdAt).toLocaleString('pt-BR') : ''),
  ]);

  // UTF-8 BOM (\uFEFF) ensures Excel opens special characters (acentos) correctly
  const csvContent =
    '\uFEFF' +
    [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
