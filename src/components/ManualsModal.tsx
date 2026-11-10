import React, { useState } from 'react';
import {
  BookOpen,
  Download,
  Printer,
  X,
  MapPin,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  Lock,
  Unlock,
  Building2,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  FileText,
} from 'lucide-react';
import { generateUserManualPDF, generateAdminManualPDF } from '../services/manualPdfGenerator';

interface ManualsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'user' | 'admin';
  allowAdminManual?: boolean;
}

export const ManualsModal: React.FC<ManualsModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'user',
  allowAdminManual = false,
}) => {
  // If admin manual is not allowed, strictly enforce 'user' tab
  const [activeTab, setActiveTab] = useState<'user' | 'admin'>(
    allowAdminManual ? defaultTab : 'user'
  );

  // Sync if props change
  React.useEffect(() => {
    if (!allowAdminManual) {
      setActiveTab('user');
    } else {
      setActiveTab(defaultTab);
    }
  }, [allowAdminManual, defaultTab, isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-fade-in print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="w-full max-w-4xl rounded-[32px] neu-flat-lg bg-[var(--card-surface)] border border-[var(--border-subtle)] max-h-[92vh] flex flex-col overflow-hidden text-[var(--text-primary)] shadow-2xl print:max-h-none print:shadow-none print:border-none print:rounded-none print:bg-white print:text-black">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3 bg-[var(--card-surface)] print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E60026]/15 dark:bg-[#FF2B4D]/15 text-[#E60026] dark:text-[#FF2B4D] flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black text-[#E60026] dark:text-[#FF2B4D] tracking-widest uppercase">
                BRADESCO SEGUROS • CENTRAL DE AJUDA
              </span>
              <h2 className="text-lg sm:text-xl font-black">
                {allowAdminManual && activeTab === 'admin'
                  ? 'Manual do Administrador (Área Restrita)'
                  : 'Manual do Usuário • Como Agendar Salas'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl neu-btn text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95"
            title="Fechar Manual"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher & Action Bar */}
        <div className="p-3 sm:px-6 py-3 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3 bg-[var(--card-surface)] print:hidden">
          {/* Tabs - Only show switcher if admin manual is allowed */}
          {allowAdminManual ? (
            <div className="flex items-center gap-2 p-1 rounded-2xl neu-pressed-sm w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('user')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'user'
                    ? 'bg-[#E60026] text-white shadow-md'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Manual do Usuário</span>
              </button>

              <button
                onClick={() => setActiveTab('admin')}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'admin'
                    ? 'bg-[#E60026] text-white shadow-md'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Manual do Administrador</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-black text-[var(--text-primary)]">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span>Guia do Colaborador • Agendamento Passo a Passo</span>
            </div>
          )}

          {/* Action Buttons: PDF Download & Print */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => {
                if (activeTab === 'admin' && allowAdminManual) {
                  generateAdminManualPDF();
                } else {
                  generateUserManualPDF();
                }
              }}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#E60026] hover:bg-[#C70020] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
              title="Baixar arquivo PDF formatado para seu celular ou computador"
            >
              <Download className="w-4 h-4" />
              <span>Baixar em PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl neu-btn text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 active:scale-95 transition-all"
              title="Imprimir ou Salvar como PDF pelo navegador"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-7 space-y-6 bg-[var(--card-surface)] print:p-0 print:space-y-4 print:bg-white print:text-black">
          {/* ======================================================== */}
          {/* TAB 1: MANUAL DO USUÁRIO                                 */}
          {/* ======================================================== */}
          {activeTab === 'user' && (
            <div className="space-y-6">
              {/* Banner do Manual */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#E60026]/10 to-transparent border border-[#E60026]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#E60026] text-white tracking-wider">
                      GUIA SUPER FÁCIL
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] font-bold">
                      • Leitura rápida (3 minutos)
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black mt-1 text-[var(--text-primary)]">
                    Como Reservar Sua Sala em 5 Passos
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Até uma criança de 8 anos consegue agendar sem errar! Siga o passo a passo abaixo.
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl neu-flat flex items-center justify-center text-[#E60026] dark:text-[#FF2B4D] flex-shrink-0 self-end sm:self-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
              </div>

              {/* O que é o app? */}
              <div className="p-4 rounded-2xl neu-pressed-sm border border-[var(--border-subtle)] space-y-2 text-xs">
                <h4 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-[#E60026] dark:text-[#FF2B4D]" />
                  O que é este aplicativo?
                </h4>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  Pense neste aplicativo como um <strong>quadro mágico de salas</strong> da Bradesco Seguros. Ele serve para você escolher uma sala limpa, com ar-condicionado, TV e cadeiras para fazer sua reunião com seus colegas, sem correr o risco de duas pessoas entrarem na mesma sala no mesmo horário!
                </p>
              </div>

              {/* PASSO 1 */}
              <div className="p-5 rounded-3xl neu-flat border border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#E60026] text-white font-black text-base flex items-center justify-center shadow-md">
                    1
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#E60026] dark:text-[#FF2B4D]">
                      PRIMEIRO DE TUDO
                    </span>
                    <h4 className="font-black text-base text-[var(--text-primary)]">
                      Confira se você está na sua cidade (Filial)
                    </h4>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Olhe lá no topo da tela, bem no início. Está escrito o nome da sua cidade? (Ex: <strong>RESERVAS • BELÉM</strong>, <strong>BRASÍLIA</strong> ou <strong>GOIÂNIA</strong>).
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-1">
                    <span className="font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Se a cidade estiver certa:
                    </span>
                    <p className="text-[var(--text-secondary)] text-[11px]">
                      Você já pode ir direto para o Passo 2 e escolher o dia da reunião.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                    <span className="font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" /> Se estiver na cidade errada:
                    </span>
                    <p className="text-[var(--text-secondary)] text-[11px]">
                      Clique no botão do <strong>Alfinete 📍</strong> no topo. Escolha sua filial na lista e aperte <strong>"Confirmar e Entrar"</strong>!
                    </p>
                  </div>
                </div>
              </div>

              {/* PASSO 2 */}
              <div className="p-5 rounded-3xl neu-flat border border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#E60026] text-white font-black text-base flex items-center justify-center shadow-md">
                    2
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#E60026] dark:text-[#FF2B4D]">
                      DATA DA REUNIÃO
                    </span>
                    <h4 className="font-black text-base text-[var(--text-primary)]">
                      Escolha o Dia no Carrossel
                    </h4>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Logo abaixo você verá uma fileira com os dias úteis (Segunda a Sexta-feira):
                </p>

                <div className="p-3 rounded-2xl neu-pressed-sm border border-[var(--border-subtle)] flex items-center gap-3 text-xs">
                  <Calendar className="w-5 h-5 text-[#E60026] dark:text-[#FF2B4D] flex-shrink-0" />
                  <div className="text-[11px] leading-relaxed text-[var(--text-secondary)]">
                    O dia de <strong>hoje</strong> fica destacado com uma luzinha viva. Para agendar para amanhã ou depois, basta <strong>clicar no cartão daquele dia</strong>!
                    <br />
                    <em>Nota: Sábado e domingo o prédio fica descansando, por isso não aparecem para agendamento.</em>
                  </div>
                </div>
              </div>

              {/* PASSO 3 */}
              <div className="p-5 rounded-3xl neu-flat border border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#E60026] text-white font-black text-base flex items-center justify-center shadow-md">
                    3
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#E60026] dark:text-[#FF2B4D]">
                      SEM CONFUSÃO
                    </span>
                    <h4 className="font-black text-base text-[var(--text-primary)]">
                      Escolha a Sala Olhando a Cor do Crachá
                    </h4>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Cada sala tem um cartão grande com o nome dela (ex: <strong>Sala 1</strong>, <strong>Sala 2</strong>) e quantas cadeiras ela tem. Olhe bem para o crachá no canto superior direito:
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white font-black text-[11px] flex-shrink-0">
                      LIVRE
                    </span>
                    <span className="text-[var(--text-primary)] font-medium">
                      <strong>Verde = Que maravilha!</strong> A sala está disponível e tem horários livres esperando por você!
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full bg-[#E60026] text-white font-black text-[11px] flex-shrink-0">
                      LOTADA HOJE
                    </span>
                    <span className="text-[var(--text-primary)] font-medium">
                      <strong>Vermelho = Já está cheia.</strong> Todos os horários do dia já foram reservados por outros colegas.
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full bg-amber-600 text-white font-black text-[11px] flex-shrink-0">
                      BLOQUEADA
                    </span>
                    <span className="text-[var(--text-primary)] font-medium">
                      <strong>Interditada:</strong> A sala está em conserto de ar-condicionado ou manutenção predial. Ninguém pode agendar nela no momento.
                    </span>
                  </div>
                </div>
              </div>

              {/* PASSO 4 */}
              <div className="p-5 rounded-3xl neu-flat border border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#E60026] text-white font-black text-base flex items-center justify-center shadow-md">
                    4
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#E60026] dark:text-[#FF2B4D]">
                      HORÁRIOS DE 1 HORA
                    </span>
                    <h4 className="font-black text-base text-[var(--text-primary)]">
                      Clique no Horário que Você Deseja
                    </h4>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  No cartão da sala livre, olhe para os botõezinhos com números de horários:
                </p>

                <div className="flex flex-wrap gap-2 p-3 rounded-2xl neu-pressed-sm border border-[var(--border-subtle)] items-center">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] mr-2">Exemplo:</span>
                  <span className="px-2.5 py-1.5 rounded-xl neu-btn text-xs font-mono font-bold text-[#E60026] dark:text-[#FF2B4D]">09:00</span>
                  <span className="px-2.5 py-1.5 rounded-xl neu-btn text-xs font-mono font-bold text-[#E60026] dark:text-[#FF2B4D]">10:00</span>
                  <span className="px-2.5 py-1.5 rounded-xl neu-btn text-xs font-mono font-bold text-[#E60026] dark:text-[#FF2B4D]">14:00</span>
                  <span className="px-2.5 py-1.5 rounded-xl neu-btn text-xs font-mono font-bold text-[#E60026] dark:text-[#FF2B4D]">16:00</span>
                  <span className="text-[11px] text-[var(--text-secondary)] ml-auto">
                    👉 Basta dar um clique no horário desejado!
                  </span>
                </div>
              </div>

              {/* PASSO 5 */}
              <div className="p-5 rounded-3xl neu-flat border border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#E60026] text-white font-black text-base flex items-center justify-center shadow-md">
                    5
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#E60026] dark:text-[#FF2B4D]">
                      ÚLTIMO PASSO
                    </span>
                    <h4 className="font-black text-base text-[var(--text-primary)]">
                      Digite Seu Nome e Aperte Confirmar!
                    </h4>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Vai abrir uma janela na tela pedindo apenas 3 coisinhas bem simples:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-2xl neu-pressed-sm border border-[var(--border-subtle)]">
                    <span className="text-[10px] font-black text-[#E60026] dark:text-[#FF2B4D] uppercase block">
                      1. SEU NOME
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)]">
                      Digite seu nome completo para todos saberem quem está na reunião.
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl neu-pressed-sm border border-[var(--border-subtle)]">
                    <span className="text-[10px] font-black text-[#E60026] dark:text-[#FF2B4D] uppercase block">
                      2. DEPARTAMENTO
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)]">
                      Escolha sua área na listinha (ex: Sinistro, Comercial, RH, TI).
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl neu-pressed-sm border border-[var(--border-subtle)]">
                    <span className="text-[10px] font-black text-[#E60026] dark:text-[#FF2B4D] uppercase block">
                      3. WHATSAPP
                    </span>
                    <span className="text-[11px] text-[var(--text-secondary)]">
                      Com DDD, para podermos avisar caso precise de algum recado.
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#E60026] to-[#C70020] text-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
                  <div>
                    <h5 className="font-black text-sm">Aperte o botão [ Confirmar Reserva ]!</h5>
                    <p className="text-xs text-white/90">
                      Na mesma hora haverá uma chuva de confetes e a sala estará garantida para você.
                    </p>
                  </div>
                  <CheckCircle2 className="w-8 h-8 text-white flex-shrink-0 animate-bounce" />
                </div>
              </div>

              {/* DICA DE OURO: CANCELAMENTO OU EDIÇÃO VIA ADMINISTRADOR */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                <h5 className="font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  ★ Como Cancelar ou Editar uma Reserva?
                </h5>
                <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                  Para garantir a segurança e a organização das agendas, a edição e o cancelamento de agendamentos são restritos à <strong>administração do sistema</strong>.
                </p>
                <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                  Se a sua reunião foi desmarcada ou você precisa alterar o horário, <strong>entre em contato com o administrador do app da sua unidade</strong>. Ele fará o cancelamento ou ajuste no sistema, liberando o horário imediatamente para os demais colegas!
                </p>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: MANUAL DO ADMINISTRADOR (RESTRITO AO ADMIN)      */}
          {/* ======================================================== */}
          {activeTab === 'admin' && allowAdminManual && (
            <div className="space-y-6">
              {/* Banner do Manual Admin */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-[#E60026]/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-600 text-white tracking-wider">
                      ÁREA RESTRITA
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] font-bold">
                      • Guia Oficial do Guardião das Salas
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black mt-1 text-[var(--text-primary)]">
                    Manual de Gestão do Administrador
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Como gerenciar salas, interditar espaços para conserto, ver agendamentos e cadastrar filiais.
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl neu-flat flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0 self-end sm:self-auto">
                  <ShieldCheck className="w-6 h-6" />
                </div>
              </div>

              {/* O que faz o Admin? */}
              <div className="p-4 rounded-2xl neu-pressed-sm border border-[var(--border-subtle)] space-y-2 text-xs">
                <h4 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  Qual é a missão do Administrador?
                </h4>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  O Administrador é o responsável por cuidar das salas físicas da sua filial. Ele garante que as salas quebradas fiquem bloqueadas, que agendamentos indevidos possam ser cancelados e que novos espaços ou departamentos sejam adicionados no sistema com segurança.
                </p>
              </div>

              {/* PASSO 1: O CADEADO */}
              <div className="p-5 rounded-3xl neu-flat border border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-600 text-white font-black text-base flex items-center justify-center shadow-md">
                    1
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">
                      ACESSO SEGURO
                    </span>
                    <h4 className="font-black text-base text-[var(--text-primary)]">
                      Como Entrar no Painel (O Cadeado 🔒)
                    </h4>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  No canto superior direito da tela principal, clique no botão do <strong>Cadeado 🔒</strong>:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl neu-pressed-sm border border-[var(--border-subtle)] space-y-1.5">
                    <span className="font-black text-[var(--text-primary)] flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-[#E60026]" /> Digite o PIN de 4 Dígitos
                    </span>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Um teclado numérico pedirá a senha de administrador. Cada filial possui seu próprio PIN, e a gerência geral possui o PIN de Super Admin.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl neu-pressed-sm border border-[var(--border-subtle)] space-y-1.5">
                    <span className="font-black text-[var(--text-primary)] flex items-center gap-1.5">
                      <Unlock className="w-4 h-4 text-emerald-600" /> Cadeado Verde Desbloqueado
                    </span>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      Ao acertar o PIN, o cadeado fica verde 🔓 e você é direcionado automaticamente para o Painel Administrativo.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-xs text-[var(--text-secondary)]">
                  <strong className="text-sky-900 dark:text-sky-300 block mb-0.5">Segurança Inteligente dos Perfis:</strong>
                  • <strong>Admin da Unidade:</strong> Enxerga e gerencia exclusivamente a sua própria cidade (ex: Belém só vê Belém).
                  <br />
                  • <strong>Super Admin:</strong> Pode visualizar todas as filiais juntas, filtrar qualquer unidade e cadastrar novas filiais.
                </div>
              </div>

              {/* PASSO 2: ABA AGENDAMENTOS */}
              <div className="p-5 rounded-3xl neu-flat border border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-600 text-white font-black text-base flex items-center justify-center shadow-md">
                    2
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">
                      SUPERVISÃO DIÁRIA
                    </span>
                    <h4 className="font-black text-base text-[var(--text-primary)]">
                      Aba "Agendamentos" (O Raio-X das Reuniões)
                    </h4>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Na primeira aba do painel, você tem a lista completa de todas as reuniões marcadas na sua unidade:
                </p>

                <ul className="text-xs text-[var(--text-secondary)] space-y-2 list-disc pl-5 leading-relaxed">
                  <li><strong>Barra de Busca:</strong> Digite o nome de qualquer colaborador ou departamento para achar a reunião em 1 segundo.</li>
                  <li><strong>Cancelar Reservas Indevidas:</strong> Se alguém reservou por engano ou reservou duas salas no mesmo horário, basta clicar na reserva e apertar o botão vermelho de exclusão.</li>
                  <li><strong>Filtro por Data:</strong> Alterne entre os dias da semana para conferir quem estará em cada sala.</li>
                </ul>
              </div>

              {/* PASSO 3: BLOQUEAR SALA */}
              <div className="p-5 rounded-3xl neu-flat border border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#E60026] text-white font-black text-base flex items-center justify-center shadow-md">
                    3
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#E60026] dark:text-[#FF2B4D]">
                      INTERDIÇÃO E MANUTENÇÃO
                    </span>
                    <h4 className="font-black text-base text-[var(--text-primary)]">
                      Como Bloquear uma Sala Inteira para Manutenção
                    </h4>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  O ar-condicionado quebrou? A sala vai ser pintada? Ninguém deve agendar nela enquanto não estiver pronta! Siga estes 4 passos:
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-2xl neu-pressed-sm border border-[var(--border-subtle)] flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#E60026] text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                    <span>No painel de Admin, clique na aba <strong>"Salas"</strong>.</span>
                  </div>

                  <div className="p-3 rounded-2xl neu-pressed-sm border border-[var(--border-subtle)] flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#E60026] text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                    <span>Localize a sala desejada e clique no botão de <strong>Editar</strong> (ícone de lápis).</span>
                  </div>

                  <div className="p-3 rounded-2xl neu-pressed-sm border border-[var(--border-subtle)] flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#E60026] text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                    <span>Mude o status de <strong>"Ativa"</strong> para <strong>"Bloqueada"</strong> ou <strong>"Manutenção Predial"</strong>.</span>
                  </div>

                  <div className="p-3 rounded-2xl neu-pressed-sm border border-[var(--border-subtle)] flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[#E60026] text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                    <span>Escreva o motivo (ex: <em>"Manutenção do ar-condicionado"</em>) e clique em <strong>Salvar</strong>!</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-[var(--text-secondary)]">
                  <strong className="text-rose-900 dark:text-rose-300 block mb-0.5">Resultado Imediato:</strong>
                  A sala fica imediatamente com o crachá vermelho de <strong>BLOQUEADA</strong> na tela de todos os colaboradores e o sistema impede novos agendamentos até que você volte e reative a sala.
                </div>
              </div>

              {/* PASSO 4: CRIAR SALA */}
              <div className="p-5 rounded-3xl neu-flat border border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-600 text-white font-black text-base flex items-center justify-center shadow-md">
                    4
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-600">
                      EXPANSÃO DO PRÉDIO
                    </span>
                    <h4 className="font-black text-base text-[var(--text-primary)]">
                      Como Criar ou Renomear Salas
                    </h4>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Para adicionar um novo espaço físico à sua unidade:
                </p>

                <div className="p-4 rounded-2xl neu-pressed-sm border border-[var(--border-subtle)] text-xs space-y-2">
                  <p>1. Na aba <strong>"Salas"</strong>, aperte o botão vermelho <strong>"+ Nova Sala"</strong>.</p>
                  <p>2. Preencha o <strong>Nome</strong> (Ex: <em>Sala 3 - Videoconferência</em>).</p>
                  <p>3. Digite a <strong>Capacidade de Pessoas</strong> (Ex: <em>12</em>).</p>
                  <p>4. Aperte <strong>"Cadastrar Sala"</strong>. Ela já estará disponível para todos os colaboradores em tempo real!</p>
                </div>
              </div>

              {/* PASSO 5: TRANQUE O CADEADO */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                <h5 className="font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-700" />
                  Segurança: Sempre Tranque o Cadeado ao Terminar!
                </h5>
                <p className="text-[var(--text-secondary)] text-[11px] leading-relaxed">
                  Quando terminar de fazer suas alterações, clique no botão <strong>"Trancar / Sair"</strong> no topo do painel. Se por acaso você esquecer a janela aberta e mudar de aba no celular ou computador, o aplicativo tranca o cadeado sozinho automaticamente para proteger os dados da Bradesco Seguros.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--card-surface)] text-xs text-[var(--text-secondary)] print:hidden">
          <span>Sistema Corporativo de Gestão de Salas Multi-Unidades • Bradesco Seguros</span>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl neu-btn font-black text-[#E60026] dark:text-[#FF2B4D] active:scale-95 transition-all"
          >
            Entendi, Fechar Manual
          </button>
        </div>
      </div>
    </div>
  );
};
