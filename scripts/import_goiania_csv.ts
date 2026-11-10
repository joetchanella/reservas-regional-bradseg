import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch, getDocs, setDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function runImport() {
  console.log('--- Iniciando Importação de Reservas de Goiânia ---');

  const csvPath = path.resolve('public/assets/aistudio/Relatorio_Reservas_Goi_nia_2026-10-20_9eeafd2f.csv');
  if (!fs.existsSync(csvPath)) {
    throw new Error(`Arquivo não encontrado em: ${csvPath}`);
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  console.log(`Linhas totais no CSV: ${lines.length} (cabeçalho + ${lines.length - 1} registros)`);

  // Verify rooms for Goiania in Firestore
  const roomsSnap = await getDocs(collection(db, 'rooms'));
  const goianiaRooms = roomsSnap.docs.filter((d) => d.data().unitId === 'goiania');
  console.log(`Salas da unidade Goiânia encontradas no Firestore: ${goianiaRooms.length}`);
  goianiaRooms.forEach((r) => console.log(` - ID: ${r.id} | Nome: "${r.data().name}"`));

  const roomNameToId: Record<string, string> = {};
  goianiaRooms.forEach((r) => {
    roomNameToId[r.data().name.trim()] = r.id;
  });

  // Fallback defaults if needed
  if (!roomNameToId['Sala 1']) roomNameToId['Sala 1'] = 'room-goiania-2';
  if (!roomNameToId['Sala 2']) roomNameToId['Sala 2'] = 'room-goiania-1';
  if (!roomNameToId['Auditório']) roomNameToId['Auditório'] = 'room-goiania-3';

  // Ensure departments exist
  const deptsSnap = await getDocs(collection(db, 'departments'));
  const existingDeptNames = new Set(deptsSnap.docs.map((d) => d.data().name?.trim().toLowerCase()));

  const newDepts = ['BARE', 'Operacional', 'Saúde', 'Bradescor', 'BVP', 'Banco', 'Investimentos', 'Supex Rede', 'Dental', 'Gestão de Rede', 'Capitalização'];
  for (const deptName of newDepts) {
    if (!existingDeptNames.has(deptName.toLowerCase())) {
      const deptId = `dept-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await setDoc(doc(db, 'departments', deptId), {
        id: deptId,
        name: deptName,
      });
      existingDeptNames.add(deptName.toLowerCase());
      console.log(`Setor adicionado ao Firestore: ${deptName} (${deptId})`);
    }
  }

  let totalImported = 0;
  let pastCount = 0;
  let todayCount = 0;
  let futureCount = 0;
  const roomCount: Record<string, number> = {};
  const todayStr = '2026-10-20'; // Current date

  const bookingsToSave: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const parts = rawLine.split(';').map((p) => p.replace(/^"|"$/g, '').trim());
    const [salaName, usuario, whatsapp, setor, data, inicio, fim, cadastro] = parts;

    const roomId = roomNameToId[salaName];
    if (!roomId) {
      console.warn(`[AVISO] Linha ${i + 1}: Sala desconhecida "${salaName}". Pulando...`);
      continue;
    }

    // Parse createdAt timestamp DD/MM/YYYY HH:mm or DD/MM/YYYY, HH:mm
    let createdAt = new Date().toISOString();
    if (cadastro) {
      const match = cadastro.match(/(\d{2})\/(\d{2})\/(\d{4})[,\s]+(\d{2}):(\d{2})/);
      if (match) {
        const [, day, month, year, hour, min] = match;
        createdAt = new Date(
          Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(min))
        ).toISOString();
      }
    }

    const phone = !whatsapp || whatsapp === '-' ? '' : whatsapp;
    const userSlug = usuario.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
    const roomShort = roomId.replace('room-goiania-', 'r');
    const startNum = inicio.replace(':', '');
    const endNum = fim.replace(':', '');

    // Deterministic, collision-free ID for idempotence
    const bookingId = `b-goi-${data}-${roomShort}-${startNum}-${endNum}-${userSlug}`;

    const bookingDoc = {
      id: bookingId,
      unitId: 'goiania',
      roomId,
      userName: usuario,
      userPhone: phone,
      userDepartment: setor || 'Geral',
      date: data,
      startTime: inicio,
      endTime: fim,
      createdAt,
      isBlock: false,
    };

    bookingsToSave.push(bookingDoc);

    if (data < todayStr) {
      pastCount++;
    } else if (data === todayStr) {
      todayCount++;
    } else {
      futureCount++;
    }

    roomCount[salaName] = (roomCount[salaName] || 0) + 1;
  }

  console.log(`Total de agendamentos preparados para inserção: ${bookingsToSave.length}`);

  // Commit in chunks of 200 (Firestore max batch is 500)
  const chunkSize = 200;
  for (let c = 0; c < bookingsToSave.length; c += chunkSize) {
    const chunk = bookingsToSave.slice(c, c + chunkSize);
    const batch = writeBatch(db);

    for (const b of chunk) {
      batch.set(doc(db, 'bookings', b.id), b);
    }

    await batch.commit();
    totalImported += chunk.length;
    console.log(`Progresso: ${totalImported} / ${bookingsToSave.length} reservas gravadas no Firestore...`);
  }

  console.log('--- IMPORTAÇÃO DE GOIÂNIA CONCLUÍDA COM SUCESSO! ---');
  console.log(`Total de Reservas Gravadas: ${totalImported}`);
  console.log(` - Datas Passadas (< ${todayStr}): ${pastCount} reservas (alimentam estatísticas, anomalias e histórico)`);
  console.log(` - Data de Hoje (${todayStr}): ${todayCount} reservas`);
  console.log(` - Datas Futuras (> ${todayStr}): ${futureCount} reservas (agendadas na sala)`);
  console.log('Distribuição por Sala:');
  for (const [r, cnt] of Object.entries(roomCount)) {
    console.log(`   * ${r}: ${cnt} reservas`);
  }
}

runImport()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Erro na importação de Goiânia:', err);
    process.exit(1);
  });
