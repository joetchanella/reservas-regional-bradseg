import { jsPDF } from 'jspdf';

/**
 * Utilitário de Geração de Manuais em PDF - Bradesco Seguros (Reservas Regional)
 * Escritos em linguagem simples, pedagógica e visual para que qualquer pessoa compreenda perfeitamente.
 */

interface PDFHelper {
  doc: jsPDF;
  y: number;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
}

function createPDFHelper(title: string, subtitle: string): PDFHelper {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Header Banner
  doc.setFillColor(230, 0, 38); // Bradesco Red #E60026
  doc.rect(0, 0, pageWidth, 28, 'F');

  // Top Brand Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('BRADESCO SEGUROS • GESTÃO DE SALAS REGIONAL', margin, 10);

  // Main Title
  doc.setFontSize(15);
  doc.text(title, margin, 18);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(255, 220, 225);
  doc.text(subtitle, margin, 24);

  return {
    doc,
    y: 36,
    pageWidth,
    pageHeight,
    margin,
    contentWidth,
  };
}

function checkAddPage(h: PDFHelper, neededHeight: number) {
  if (h.y + neededHeight > h.pageHeight - 18) {
    h.doc.addPage();
    // Mini header on subsequent pages
    h.doc.setFillColor(230, 0, 38);
    h.doc.rect(0, 0, h.pageWidth, 12, 'F');
    h.doc.setFont('helvetica', 'bold');
    h.doc.setFontSize(8);
    h.doc.setTextColor(255, 255, 255);
    h.doc.text('BRADESCO SEGUROS • MANUAL DE INSTRUÇÕES', h.margin, 8);
    h.y = 20;
  }
}

function addSectionTitle(h: PDFHelper, title: string, badgeNumber?: string) {
  checkAddPage(h, 14);

  if (badgeNumber) {
    // Badge circle
    h.doc.setFillColor(230, 0, 38);
    h.doc.roundedRect(h.margin, h.y, 7, 7, 1.5, 1.5, 'F');
    h.doc.setFont('helvetica', 'bold');
    h.doc.setFontSize(10);
    h.doc.setTextColor(255, 255, 255);
    h.doc.text(badgeNumber, h.margin + 2.2, h.y + 5);

    h.doc.setFont('helvetica', 'bold');
    h.doc.setFontSize(12);
    h.doc.setTextColor(24, 31, 44);
    h.doc.text(title, h.margin + 10, h.y + 5.2);
    h.y += 10;
  } else {
    h.doc.setFont('helvetica', 'bold');
    h.doc.setFontSize(13);
    h.doc.setTextColor(230, 0, 38);
    h.doc.text(title, h.margin, h.y + 4);
    h.y += 8;
  }
}

function addParagraph(h: PDFHelper, text: string, indent = 0) {
  h.doc.setFont('helvetica', 'normal');
  h.doc.setFontSize(9.5);
  h.doc.setTextColor(50, 60, 75);

  const lines = h.doc.splitTextToSize(text, h.contentWidth - indent);
  checkAddPage(h, lines.length * 4.5 + 3);
  h.doc.text(lines, h.margin + indent, h.y);
  h.y += lines.length * 4.5 + 3;
}

function addHighlightBox(h: PDFHelper, title: string, text: string, color: 'green' | 'amber' | 'blue' | 'red') {
  const boxX = h.margin;
  const boxW = h.contentWidth;
  const textLines = h.doc.splitTextToSize(text, boxW - 8);
  const boxH = 10 + textLines.length * 4.2;

  checkAddPage(h, boxH + 4);

  // Background and border colors
  let fillR = 245, fillG = 247, fillB = 250;
  let strokeR = 200, strokeG = 210, strokeB = 220;
  let titleR = 24, titleG = 31, titleB = 44;

  if (color === 'green') {
    fillR = 240; fillG = 253; fillB = 244;
    strokeR = 134; strokeG = 239; strokeB = 172;
    titleR = 22; titleG = 101; titleB = 52;
  } else if (color === 'amber') {
    fillR = 254; fillG = 252; fillB = 232;
    strokeR = 253; strokeG = 224; strokeB = 71;
    titleR = 133; titleG = 77; titleB = 14;
  } else if (color === 'blue') {
    fillR = 239; fillG = 246; fillB = 255;
    strokeR = 147; strokeG = 197; strokeB = 253;
    titleR = 30; titleG = 64; titleB = 175;
  } else if (color === 'red') {
    fillR = 254; fillG = 242; fillB = 242;
    strokeR = 254; strokeG = 202; strokeB = 202;
    titleR = 185; titleG = 28; titleB = 28;
  }

  h.doc.setFillColor(fillR, fillG, fillB);
  h.doc.setDrawColor(strokeR, strokeG, strokeB);
  h.doc.setLineWidth(0.4);
  h.doc.roundedRect(boxX, h.y, boxW, boxH, 2, 2, 'FD');

  // Title
  h.doc.setFont('helvetica', 'bold');
  h.doc.setFontSize(9.5);
  h.doc.setTextColor(titleR, titleG, titleB);
  h.doc.text(title, boxX + 4, h.y + 6);

  // Text
  h.doc.setFont('helvetica', 'normal');
  h.doc.setFontSize(8.5);
  h.doc.setTextColor(50, 60, 75);
  h.doc.text(textLines, boxX + 4, h.y + 11);

  h.y += boxH + 4;
}

function addFooterAndPageNumbers(doc: jsPDF) {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setDrawColor(220, 226, 235);
    doc.setLineWidth(0.3);
    doc.line(16, pageHeight - 12, pageWidth - 16, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(130, 140, 155);
    doc.text('Bradesco Seguros • Sistema Reservas Regional', 16, pageHeight - 7);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - 16, pageHeight - 7, { align: 'right' });
  }
}

/**
 * MANUAL 1: MANUAL DO USUÁRIO COMUM
 * Explica o agendamento em passos simples com metáforas visuais.
 */
export function generateUserManualPDF(): void {
  const h = createPDFHelper(
    'MANUAL DO USUÁRIO: COMO AGENDAR UMA SALA',
    'Passo a Passo Super Fácil • Reservas em menos de 1 minuto'
  );

  // Introdução
  addSectionTitle(h, 'O que é este aplicativo?');
  addParagraph(
    h,
    'Este aplicativo funciona como uma agenda mágica da Bradesco Seguros. Ele serve para você escolher uma sala confortável (com ar-condicionado, TV e cadeiras) para fazer sua reunião com seus colegas de trabalho sem correr o risco de duas pessoas usarem a mesma sala na mesma hora!'
  );

  addHighlightBox(
    h,
    'Missão do Usuário:',
    'Aprender em 5 passos fáceis como escolher sua cidade, o dia, a sala, o horário e confirmar seu agendamento rapidinho.',
    'green'
  );

  // Passo 1
  addSectionTitle(h, 'Passo 1: Olhe onde você está (Sua Unidade / Cidade)', '1');
  addParagraph(
    h,
    'No topo da tela, olhe para o nome da cidade. Está escrito a sua cidade? (Exemplo: "RESERVAS • BELÉM", "BRASÍLIA" ou "GOIÂNIA").'
  );
  addParagraph(
    h,
    '• Se a cidade estiver certa: Você já pode escolher sua sala!\n• Se você precisa de outra cidade: Dê um clique no botão com o ícone de Alfinete (📍) no topo. Uma janela vai se abrir, você escolhe a cidade certa e aperta o botão vermelho "Confirmar e Entrar".'
  );

  // Passo 2
  addSectionTitle(h, 'Passo 2: Escolha o Dia da Reunião', '2');
  addParagraph(
    h,
    'Logo abaixo você verá uma barra com os dias da semana (Segunda, Terça, Quarta, Quinta e Sexta).'
  );
  addParagraph(
    h,
    '• O dia de hoje tem um ponto brilhante e fica em destaque.\n• Para agendar outro dia (por exemplo, amanhã ou na próxima quinta), basta clicar no quadradinho daquele dia.'
  );
  addHighlightBox(
    h,
    'Dica importante:',
    'O aplicativo só funciona em dias de trabalho (Segunda a Sexta), das 08:00 às 18:00. No sábado e domingo o prédio fica descansando!',
    'blue'
  );

  // Passo 3
  addSectionTitle(h, 'Passo 3: Escolha a Sala Olhando a Cor do Crachá', '3');
  addParagraph(
    h,
    'Cada sala aparece em um cartão grande com o nome dela (ex: Sala 1, Sala 2) e quantas cadeiras ela tem. Olhe bem para a cor da etiqueta no cantinho:'
  );
  addParagraph(
    h,
    '• VERDE (LIVRE): A sala tem horários vagos esperando por você! Pode clicar!\n• VERMELHO (LOTADA HOJE ou ENCERRADA): Todos os horários já foram reservados por outros colegas ou o expediente já terminou.\n• VERMELHO (BLOQUEADA ou MANUTENÇÃO): A sala está em reforma, pintura ou conserto do ar-condicionado. Ninguém pode agendar nela no momento.'
  );

  // Passo 4
  addSectionTitle(h, 'Passo 4: Escolha o Horário Desejado', '4');
  addParagraph(
    h,
    'Dentro do cartão da sala livre, você verá botõezinhos com números de horários (exemplo: [ 09:00 ], [ 10:00 ], [ 14:00 ], [ 16:00 ]).'
  );
  addParagraph(
    h,
    '• Cada botão representa 1 hora de reunião.\n• Basta dar um clique em cima do horário que você deseja agendar ou clicar no botão inferior "+ Agendar Horário".'
  );

  // Passo 5
  addSectionTitle(h, 'Passo 5: Preencha Seus Dados e Confirme!', '5');
  addParagraph(
    h,
    'Uma janelinha vai abrir pedindo apenas 3 informações super simples:'
  );
  addParagraph(
    h,
    '1. Seu Nome Completo: Para seus colegas saberem quem está na reunião.\n2. Seu Departamento: Escolha sua área na lista (Ex: Sinistro, Comercial, RH, TI, etc.).\n3. Seu WhatsApp com DDD: Para podermos falar com você caso alguém precise trocar de horário ou avisar sobre a sala.'
  );
  addParagraph(
    h,
    'Agora dê um clique no botão vermelho grandão: [ CONFIRMAR RESERVA ]!'
  );

  addHighlightBox(
    h,
    'Sucesso Imediato!',
    'Aparecerá uma chuva de confetes coloridos na sua tela e um aviso verde de confirmação! Seu nome aparecerá no horário marcado e a sala está garantida para você.',
    'green'
  );

  // Cancelamento e Edição via Administrador
  addSectionTitle(h, 'Como Cancelar ou Editar uma Reserva?', '★');
  addParagraph(
    h,
    'Para garantir a segurança e a organização das salas, o cancelamento e a edição de agendamentos são restritos à administração do sistema.'
  );
  addParagraph(
    h,
    'Caso você precise cancelar ou alterar sua reunião:\n• Entre em contato diretamente com o administrador do aplicativo da sua unidade;\n• O administrador fará a exclusão ou ajuste no sistema, liberando a sala imediatamente para os demais colegas de trabalho.'
  );

  addFooterAndPageNumbers(h.doc);
  h.doc.save('Manual_do_Usuario_Reservas_Bradesco.pdf');
}

/**
 * MANUAL 2: MANUAL DO ADMINISTRADOR
 * Explica a gestão de salas, PIN, bloqueios e unidades com clareza total.
 */
export function generateAdminManualPDF(): void {
  const h = createPDFHelper(
    'MANUAL DO ADMINISTRADOR: GUARDIÃO DAS SALAS',
    'Gestão Predial, PIN de Acesso, Bloqueios e Agendamentos'
  );

  // Introdução
  addSectionTitle(h, 'O que faz o Administrador?');
  addParagraph(
    h,
    'O Administrador é o guardião responsável por manter a ordem das salas da sua filial. Ele pode trancar salas para manutenção, ver quem agendou o quê, cancelar reservas indevidas, cadastrar novas salas e garantir que as reuniões aconteçam com total tranquilidade.'
  );

  addHighlightBox(
    h,
    'Missão do Administrador:',
    'Aprender a acessar a área restrita com a senha PIN, gerenciar a lista de agendamentos, interditar salas para conserto e cadastrar novos espaços sem complicação.',
    'amber'
  );

  // Passo 1
  addSectionTitle(h, 'Passo 1: Como Entrar na Área de Admin (O Cadeado)', '1');
  addParagraph(
    h,
    'No canto superior direito da tela, você verá o ícone de um Cadeado Fechado (🔒).'
  );
  addParagraph(
    h,
    '1. Clique no Cadeado.\n2. Vai abrir o teclado numérico pedindo uma Senha de 4 Números (PIN corporativo).\n3. Digite o PIN da sua unidade ou o PIN de Super Admin.\n4. O cadeado vai abrir ficando verde (🔓) e o Painel Administrativo aparecerá na tela!'
  );

  addHighlightBox(
    h,
    'Diferença importante de Perfis:',
    '• Admin da Unidade: Visualiza e cuida APENAS das salas e agendamentos da sua cidade (ex: Belém cuida de Belém).\n• Super Admin: Tem acesso total, enxerga todas as cidades juntas, pode filtrar qualquer filial e cadastrar novas unidades no sistema.',
    'blue'
  );

  // Passo 2
  addSectionTitle(h, 'Passo 2: A Aba de Agendamentos (O Raio-X das Reuniões)', '2');
  addParagraph(
    h,
    'Na primeira aba ("Agendamentos"), você vê a lista de todas as reuniões que os funcionários marcaram na sua filial:'
  );
  addParagraph(
    h,
    '• Você pode filtrar pelo dia da semana no topo.\n• Pode pesquisar pelo nome da pessoa ou departamento na caixinha de busca.\n• Se alguém marcou uma sala por engano ou duplicada, você pode clicar no agendamento e clicar em "Excluir / Cancelar Reserva".'
  );

  // Passo 3
  addSectionTitle(h, 'Passo 3: Como Bloquear uma Sala para Manutenção', '3');
  addParagraph(
    h,
    'O ar-condicionado quebrou? A sala vai ser pintada? Ninguém pode agendar nela enquanto estiver estragada! Veja como é fácil bloquear:'
  );
  addParagraph(
    h,
    '1. Clique na aba "Salas" no menu do Admin.\n2. Encontre a sala desejada e clique no botão de edição (lápis).\n3. No campo "Status da Sala", mude de "Ativa" para "Bloqueada" ou "Manutenção Predial".\n4. Escreva o motivo (Ex: "Conserto do ar-condicionado - volta na sexta").\n5. Clique em "Salvar Alterações".'
  );
  addHighlightBox(
    h,
    'O que acontece na hora:',
    'A sala fica com a etiqueta vermelha de "BLOQUEADA" na tela de todos os usuários. O sistema não deixa ninguém agendar até você voltar lá e mudar o status para "Ativa" novamente!',
    'red'
  );

  // Passo 4
  addSectionTitle(h, 'Passo 4: Como Bloquear Apenas 1 ou 2 Horas de uma Sala', '4');
  addParagraph(
    h,
    'E se a sala só precisar ser limpa das 14:00 às 15:00, mas o resto do dia pode funcionar normal?'
  );
  addParagraph(
    h,
    '• Na tela inicial de agendamento (com o Admin desbloqueado), clique no horário que você quer bloquear.\n• Marque a caixinha "Bloqueio Administrativo".\n• Escreva o motivo (Ex: "Limpeza Geral").\n• Salve. Aquele horário ficará gravado como bloqueio administrativo e ninguém poderá reservar por cima!'
  );

  // Passo 5
  addSectionTitle(h, 'Passo 5: Como Criar uma Nova Sala', '5');
  addParagraph(
    h,
    'Se a sua filial ganhou uma nova sala de reunião:'
  );
  addParagraph(
    h,
    '1. Vá na aba "Salas" e clique no botão vermelho "+ Nova Sala".\n2. Digite o Nome da Sala (Exemplo: "Sala de Videoconferência").\n3. Digite a Capacidade de Pessoas (Exemplo: "10").\n4. Clique em "Cadastrar Sala". Ela aparecerá instantaneamente para todos os colaboradores!'
  );

  // Passo 6
  addSectionTitle(h, 'Passo 6: Como Gerar o Relatório Mensal em PDF', '6');
  addParagraph(
    h,
    'No início da tela inicial existe o bloco "CONFERÊNCIA MENSAL":'
  );
  addParagraph(
    h,
    '1. Escolha o mês desejado no campo "MÊS DE REFERÊNCIA".\n2. Clique em "GERAR RELATÓRIO PDF".\n3. O sistema abre uma folha oficial pronta com o resumo de todas as reuniões do mês para você imprimir ou salvar em arquivo para prestação de contas da gerência.'
  );

  // Passo 7
  addSectionTitle(h, 'Passo 7: Trancar o Cadeado ao Sair!', '7');
  addParagraph(
    h,
    'Segurança é fundamental na Bradesco Seguros!'
  );
  addParagraph(
    h,
    '• Quando terminar o seu trabalho no painel, clique no botão "Trancar / Sair" (ou no cadeado aberto 🔓 no topo).\n• Se você esquecer a tela aberta e fechar o navegador, não se preocupe: o sistema tranca automaticamente por segurança.'
  );

  addFooterAndPageNumbers(h.doc);
  h.doc.save('Manual_do_Administrador_Reservas_Bradesco.pdf');
}
