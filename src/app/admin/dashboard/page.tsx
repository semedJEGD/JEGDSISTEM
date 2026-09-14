'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  School,
  Users,
  Trophy,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Printer,
  Download,
  PlusCircle,
  Trash2,
  FileText,
  Search,
  Bell,
  Clock,
  Calendar,
  AlertCircle,
  CheckSquare,
  Square,
  Eye,
  MessageSquare
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { JegdPdfGenerator } from '@/lib/pdf-generator';
import {
  Escola,
  Atleta,
  InscricaoEquipe,
  ComunicadoAviso,
  StatusInscricao,
  ModalidadeConfig
} from '@/types/jegd';
import { JegdsRulesService } from '@/services/jegds-rules';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [inscricoes, setInscricoes] = useState<InscricaoEquipe[]>([]);
  const [modalidades, setModalidades] = useState<ModalidadeConfig[]>([]);
  const [comunicados, setComunicados] = useState<ComunicadoAviso[]>([]);
  
  const [abaAtiva, setAbaAtiva] = useState<'ESCOLAS_LOTE' | 'HOMOLOGACAO' | 'ALERTAS' | 'LISTAS_CHAMADA' | 'AVISOS'>('ESCOLAS_LOTE');
  const [escolaSelecionadaId, setEscolaSelecionadaId] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [busca, setBusca] = useState('');
  const [gerandoPdf, setGerandoPdf] = useState(false);

  // Modal de Julgamento / Parecer de Inscrição
  const [modalParecerAberto, setModalParecerAberto] = useState(false);
  const [inscricaoEmAnalise, setInscricaoEmAnalise] = useState<InscricaoEquipe | null>(null);
  const [novoStatus, setNovoStatus] = useState<StatusInscricao>('VALIDADA');
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [parecerTexto, setParecerTexto] = useState('');

  // Modal de Observação de Conferência de Atleta
  const [modalObsAtletaAberto, setModalObsAtletaAberto] = useState(false);
  const [atletaObs, setAtletaObs] = useState<Atleta | null>(null);
  const [obsTexto, setObsTexto] = useState('');

  // Modal Novo Comunicado
  const [modalAvisoAberto, setModalAvisoAberto] = useState(false);
  const [novoAvisoTitulo, setNovoAvisoTitulo] = useState('');
  const [novoAvisoConteudo, setNovoAvisoConteudo] = useState('');
  const [novoAvisoCategoria, setNovoAvisoCategoria] = useState<'CRONOGRAMA' | 'REGULAMENTO' | 'ALERTA'>('CRONOGRAMA');
  const [novoAvisoUrgente, setNovoAvisoUrgente] = useState(false);

  useEffect(() => {
    JegdStorage.init();
    if (!JegdStorage.isComiteAuth()) {
      router.push('/admin/login');
      return;
    }
    carregarTodosDados();
  }, []);

  const carregarTodosDados = () => {
    const escList = JegdStorage.getEscolas();
    setEscolas(escList);
    setAtletas(JegdStorage.getAtletas());
    setInscricoes(JegdStorage.getInscricoes());
    setModalidades(JegdStorage.getModalidades());
    setComunicados(JegdStorage.getComunicados());
    if (escList.length > 0 && !escolaSelecionadaId) {
      setEscolaSelecionadaId(escList[0].id);
    }
  };

  const toggleConferenciaAtleta = (atleta: Atleta) => {
    const novoStatus = !atleta.conferidoPeloCoordenador;
    JegdStorage.updateAtletaConferencia(atleta.id, novoStatus);
    carregarTodosDados();
  };

  const abrirModalObsAtleta = (atleta: Atleta) => {
    setAtletaObs(atleta);
    setObsTexto(atleta.observacaoCoordenador || '');
    setModalObsAtletaAberto(true);
  };

  const salvarObsAtleta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!atletaObs) return;
    JegdStorage.updateAtletaConferencia(atletaObs.id, atletaObs.conferidoPeloCoordenador || false, obsTexto);
    carregarTodosDados();
    setModalObsAtletaAberto(false);
  };

  const handleImprimirLoteEscola = async (esc: Escola) => {
    setGerandoPdf(true);
    try {
      const atletasEscola = atletas.filter(a => a.escolaId === esc.id);
      const inscricoesEscola = inscricoes.filter(i => i.escolaId === esc.id);
      await JegdPdfGenerator.gerarLoteCompletoEscola(esc, atletasEscola, inscricoesEscola);
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar relatório do lote da escola.');
    } finally {
      setGerandoPdf(false);
    }
  };

  const abrirModalAnalise = (insc: InscricaoEquipe) => {
    setInscricaoEmAnalise(insc);
    setNovoStatus(insc.status === 'PENDENTE' ? 'VALIDADA' : insc.status);
    setMotivoRejeicao(insc.motivoRejeicao || '');
    setParecerTexto(insc.parecerComite || 'Inscrição analisada e homologada pelo Comitê Organizador do JEGDS 2026.');
    setModalParecerAberto(true);
  };

  const salvarAnalise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inscricaoEmAnalise) return;

    const atualizada: InscricaoEquipe = {
      ...inscricaoEmAnalise,
      status: novoStatus,
      motivoRejeicao: novoStatus === 'REJEITADA' ? motivoRejeicao : undefined,
      parecerComite: parecerTexto,
      dataHomologacao: new Date().toLocaleString('pt-BR')
    };

    JegdStorage.saveInscricao(atualizada);
    carregarTodosDados();
    setModalParecerAberto(false);
  };

  const handleSalvarAviso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoAvisoTitulo || !novoAvisoConteudo) {
      alert('Preencha o título e conteúdo do comunicado.');
      return;
    }

    const aviso: ComunicadoAviso = {
      id: `aviso-${Date.now()}`,
      titulo: novoAvisoTitulo,
      conteudo: novoAvisoConteudo,
      categoria: novoAvisoCategoria,
      dataPublicacao: new Date().toLocaleDateString('pt-BR'),
      urgente: novoAvisoUrgente,
      autor: 'Comitê Organizador JEGDS 2026'
    };

    JegdStorage.saveComunicado(aviso);
    carregarTodosDados();
    setModalAvisoAberto(false);
    setNovoAvisoTitulo('');
    setNovoAvisoConteudo('');
  };

  const handleGerarListaChamada = async (mod: ModalidadeConfig, categoria: string, sexo: string) => {
    const inscricoesModalidade = inscricoes.filter(
      i => i.modalidadeCodigo === mod.codigo && i.categoria === categoria && i.sexo === sexo
    );

    const atletasComEscola: { atleta: Atleta; escola: Escola; provas?: string[] }[] = [];
    
    inscricoesModalidade.forEach(insc => {
      const escolaObj = escolas.find(e => e.id === insc.escolaId);
      if (escolaObj) {
        insc.atletaIds.forEach(atlId => {
          const atlObj = atletas.find(a => a.id === atlId);
          if (atlObj) {
            atletasComEscola.push({
              atleta: atlObj,
              escola: escolaObj,
              provas: insc.provasPorAtleta?.[atlId]
            });
          }
        });
      }
    });

    if (atletasComEscola.length === 0) {
      alert('Nenhum atleta inscrito nesta categoria para gerar a lista de chamada.');
      return;
    }

    await JegdPdfGenerator.gerarListaChamadaOficial(
      mod.nome,
      categoria,
      sexo,
      new Date(mod.dataEvento).toLocaleDateString('pt-BR'),
      atletasComEscola
    );
  };

  const progressoEscolas = JegdStorage.getProgressoEscolas();
  const escolaSelecionada = escolas.find(e => e.id === escolaSelecionadaId);
  const atletasDaEscolaSelecionada = atletas.filter(a => a.escolaId === escolaSelecionadaId);
  const inscricoesDaEscolaSelecionada = inscricoes.filter(i => i.escolaId === escolaSelecionadaId);

  // Alertas de inconsistência
  const alertasInconsistencia: { tipo: string; mensagem: string; escolaNome: string; atletaNome?: string }[] = [];
  atletas.forEach(a => {
    const esc = escolas.find(e => e.id === a.escolaId);
    if (!a.documentoNumero || a.documentoNumero.trim().length < 3) {
      alertasInconsistencia.push({
        tipo: 'DOCUMENTO_PENDENTE',
        mensagem: 'Número de RG ou Certidão não informado ou incompleto.',
        escolaNome: esc?.nome || 'Escola',
        atletaNome: a.nomeCompleto
      });
    }
    if (!a.consentimentoResponsavel) {
      alertasInconsistencia.push({
        tipo: 'LGPD_PENDENTE',
        mensagem: 'Falta confirmação de autorização expressa dos pais/responsáveis.',
        escolaNome: esc?.nome || 'Escola',
        atletaNome: a.nomeCompleto
      });
    }
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 w-full max-w-full">
      
      {/* Header Coordenadores SEMED */}
      <div className="bg-white border border-[#E2EAE5] rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00A878]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6 relative z-10">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#E8F7F1] border border-[#00A878]/30 flex items-center justify-center text-[#087A5B] shadow-2xs shrink-0">
              <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-3xl font-black text-[#17221D] break-words">Painel da Coordenação SEMED</h1>
                <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full bg-[#E8F7F1] text-[#087A5B] border border-[#00A878]/30 font-black shrink-0">
                  Elias Veloso & Herbert de Sá (SEMED)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#4B5563] mt-1 font-medium break-words">
                Conferência de lotes por escola, impressão oficial de delegações e monitoramento de inconsistências.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => setModalAvisoAberto(true)}
              className="w-full lg:w-auto px-5 py-3 rounded-xl sm:rounded-2xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#00A878]/20 flex items-center justify-center gap-2 transition-all shrink-0"
            >
              <Bell className="w-4 h-4" />
              <span>Publicar Comunicado</span>
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white border border-[#E2EAE5] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#4B5563]">Escolas</span>
          <p className="text-2xl sm:text-4xl font-black text-[#17221D] mt-1">{escolas.length}</p>
          <p className="text-[11px] sm:text-xs text-[#4B5563] mt-0.5 font-medium truncate">Gonçalves Dias</p>
        </div>

        <div className="bg-white border border-[#E2EAE5] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#4B5563]">Alunos</span>
          <p className="text-2xl sm:text-4xl font-black text-[#17221D] mt-1">{atletas.length}</p>
          <p className="text-[11px] sm:text-xs text-[#4B5563] mt-0.5 font-medium truncate">Cadastrados</p>
        </div>

        <div className="bg-white border border-[#E2EAE5] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#4B5563]">Inscrições</span>
          <p className="text-2xl sm:text-4xl font-black text-[#17221D] mt-1">{inscricoes.length}</p>
          <p className="text-[11px] sm:text-xs text-[#4B5563] mt-0.5 font-medium truncate">Equipes enviadas</p>
        </div>

        <div className="bg-white border border-[#E2EAE5] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#087A5B]">Conferidos</span>
          <p className="text-2xl sm:text-4xl font-black text-[#00A878] mt-1">
            {atletas.filter(a => a.conferidoPeloCoordenador).length}
          </p>
          <p className="text-[11px] sm:text-xs text-[#4B5563] mt-0.5 font-medium truncate">Homologados</p>
        </div>

        <div className="bg-white border border-[#E2EAE5] rounded-2xl sm:rounded-3xl p-4 sm:p-6 col-span-2 lg:col-span-1 shadow-xs">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-red-600">Alertas</span>
          <p className="text-2xl sm:text-4xl font-black text-red-600 mt-1">{alertasInconsistencia.length}</p>
          <p className="text-[11px] sm:text-xs text-[#4B5563] mt-0.5 font-medium truncate">Inconsistências</p>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex items-center gap-2 border-b border-[#E2EAE5] pb-2 overflow-x-auto no-scrollbar w-full">
        <button
          onClick={() => setAbaAtiva('ESCOLAS_LOTE')}
          className={`px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
            abaAtiva === 'ESCOLAS_LOTE'
              ? 'bg-[#00A878] text-white shadow-xs'
              : 'text-[#4B5563] hover:text-[#17221D] hover:bg-white'
          }`}
        >
          Lotes por Escola & Conferência
        </button>

        <button
          onClick={() => setAbaAtiva('HOMOLOGACAO')}
          className={`px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
            abaAtiva === 'HOMOLOGACAO'
              ? 'bg-[#00A878] text-white shadow-xs'
              : 'text-[#4B5563] hover:text-[#17221D] hover:bg-white'
          }`}
        >
          Homologação ({inscricoes.length})
        </button>

        <button
          onClick={() => setAbaAtiva('ALERTAS')}
          className={`px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
            abaAtiva === 'ALERTAS'
              ? 'bg-[#00A878] text-white shadow-xs'
              : 'text-[#4B5563] hover:text-[#17221D] hover:bg-white'
          }`}
        >
          Alertas ({alertasInconsistencia.length})
        </button>

        <button
          onClick={() => setAbaAtiva('LISTAS_CHAMADA')}
          className={`px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
            abaAtiva === 'LISTAS_CHAMADA'
              ? 'bg-[#00A878] text-white shadow-xs'
              : 'text-[#4B5563] hover:text-[#17221D] hover:bg-white'
          }`}
        >
          Súmulas & Listas
        </button>

        <button
          onClick={() => setAbaAtiva('AVISOS')}
          className={`px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
            abaAtiva === 'AVISOS'
              ? 'bg-[#00A878] text-white shadow-xs'
              : 'text-[#4B5563] hover:text-[#17221D] hover:bg-white'
          }`}
        >
          Comunicados ({comunicados.length})
        </button>
      </div>

      {/* ABA: LOTES POR ESCOLA & CONFERÊNCIA */}
      {abaAtiva === 'ESCOLAS_LOTE' && (
        <div className="space-y-6">
          
          {/* Painel Geral de Progresso por Escola */}
          <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <h3 className="text-lg font-black text-[#17221D] flex items-center gap-2">
              <School className="w-5 h-5 text-[#00A878]" />
              <span>Painel Geral de Progresso por Escola</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {progressoEscolas.map((item) => (
                <div
                  key={item.escola.id}
                  onClick={() => setEscolaSelecionadaId(item.escola.id)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    escolaSelecionadaId === item.escola.id
                      ? 'bg-[#E8F7F1] border-[#00A878] shadow-sm'
                      : 'bg-[#F7F9F8] border-[#E2EAE5] hover:bg-white hover:border-[#00A878]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black text-[#17221D] truncate">
                      {item.escola.sigla} • {item.escola.nome}
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                      item.status === 'PREENCHIDO'
                        ? 'bg-[#E8F7F1] text-[#087A5B] border border-[#00A878]/30'
                        : item.status === 'EM_ANDAMENTO'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {item.status === 'PREENCHIDO' ? 'PREENCHIDO' : item.status === 'EM_ANDAMENTO' ? 'EM ANDAMENTO' : 'SEM INSCRIÇÃO'}
                    </span>
                  </div>
                  <div className="text-xs text-[#4B5563] space-y-1">
                    <p>Alunos inscritos: <strong className="text-[#17221D]">{item.totalAtletas}</strong></p>
                    <p>Conferidos: <strong className="text-[#087A5B]">{item.totalConferidos}/{item.totalAtletas}</strong></p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inspeção e Conferência do Lote da Escola Selecionada */}
          {escolaSelecionada && (
            <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#E2EAE5]">
                <div>
                  <h3 className="text-xl font-black text-[#17221D] flex items-center gap-2">
                    <span>Lote de Inscrições: {escolaSelecionada.nome} ({escolaSelecionada.sigla})</span>
                  </h3>
                  <p className="text-sm text-[#4B5563] mt-1 font-medium">
                    Responsável: {escolaSelecionada.responsavelNome} • Contato: {escolaSelecionada.responsavelTelefone} • INEP: {escolaSelecionada.inep}
                  </p>
                </div>

                <button
                  onClick={() => handleImprimirLoteEscola(escolaSelecionada)}
                  disabled={gerandoPdf || atletasDaEscolaSelecionada.length === 0}
                  className="px-6 py-3 rounded-2xl bg-[#00A878] hover:bg-[#087A5B] text-white font-black text-sm shadow-md shadow-[#00A878]/20 flex items-center gap-2 transition-all disabled:opacity-50 shrink-0"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Lote Desta Escola (PDF)</span>
                </button>
              </div>

              {atletasDaEscolaSelecionada.length === 0 ? (
                <div className="py-12 text-center text-[#4B5563] text-sm">
                  Esta escola ainda não cadastrou nenhum aluno.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-[#17221D]">
                      <thead className="bg-[#F7F9F8] text-[#4B5563] uppercase text-xs font-bold border-b border-[#E2EAE5]">
                        <tr>
                          <th className="p-3.5">Conferência</th>
                          <th className="p-3.5">Aluno</th>
                          <th className="p-3.5">Data Nasc.</th>
                          <th className="p-3.5">Categoria/Sexo</th>
                          <th className="p-3.5">Documento</th>
                          <th className="p-3.5">Modalidades / Provas</th>
                          <th className="p-3.5">Cadastrado Por</th>
                          <th className="p-3.5 text-right">Observações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2EAE5]">
                        {atletasDaEscolaSelecionada.map((atleta) => (
                          <tr key={atleta.id} className="hover:bg-[#F7F9F8]">
                            <td className="p-3.5">
                              <button
                                onClick={() => toggleConferenciaAtleta(atleta)}
                                className={`p-2 rounded-xl flex items-center gap-1.5 font-bold text-xs transition-all ${
                                  atleta.conferidoPeloCoordenador
                                    ? 'bg-[#E8F7F1] text-[#087A5B] border border-[#00A878]/30'
                                    : 'bg-white text-[#4B5563] border border-[#E2EAE5]'
                                }`}
                              >
                                {atleta.conferidoPeloCoordenador ? (
                                  <>
                                    <CheckSquare className="w-4 h-4 text-[#00A878]" />
                                    <span>Correto</span>
                                  </>
                                ) : (
                                  <>
                                    <Square className="w-4 h-4" />
                                    <span>Pendente</span>
                                  </>
                                )}
                              </button>
                            </td>

                            <td className="p-3.5 font-bold text-[#17221D]">
                              {atleta.nomeCompleto}
                            </td>

                            <td className="p-3.5 text-[#4B5563]">
                              {new Date(atleta.dataNascimento).toLocaleDateString('pt-BR')}
                            </td>

                            <td className="p-3.5">
                              <span className="px-2.5 py-0.5 rounded-md bg-[#F7F9F8] border border-[#E2EAE5] font-bold text-xs text-[#17221D]">
                                {atleta.categoriaCalculada || 'N/A'} ({atleta.sexo === 'MASCULINO' ? 'Masc' : 'Fem'})
                              </span>
                            </td>

                            <td className="p-3.5 text-[#17221D]">
                              <strong>{atleta.documentoTipo}:</strong> {atleta.documentoNumero}
                            </td>

                            <td className="p-3.5">
                              {atleta.modalidadesInscritas && atleta.modalidadesInscritas.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {atleta.modalidadesInscritas.map((m, idx) => (
                                    <span key={idx} className="px-2.5 py-0.5 rounded-md bg-[#E8F7F1] text-[#087A5B] text-xs border border-[#00A878]/20 font-medium">
                                      {m.modalidadeNome} {m.provas && m.provas.length > 0 ? `(${m.provas.join(', ')})` : ''}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[#4B5563] italic text-xs">Nenhuma</span>
                              )}
                            </td>

                            <td className="p-3.5 text-[#4B5563] text-xs">
                              {atleta.cadastradoPor || escolaSelecionada.responsavelNome}
                            </td>

                            <td className="p-3.5 text-right">
                              <button
                                onClick={() => abrirModalObsAtleta(atleta)}
                                className={`p-2 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
                                  atleta.observacaoCoordenador
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : 'bg-white text-[#4B5563] border-[#E2EAE5] hover:border-[#00A878]'
                                }`}
                                title="Inserir observação"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>{atleta.observacaoCoordenador ? 'Ver Nota' : 'Anotar'}</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ABA: HOMOLOGAÇÃO DE INSCRIÇÕES */}
      {abaAtiva === 'HOMOLOGACAO' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E2EAE5] rounded-3xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-xs">
            <div className="sm:col-span-2 relative">
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Filtrar por escola ou modalidade..."
                className="w-full px-4 py-3 pl-11 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-sm focus:outline-none focus:border-[#00A878] focus:bg-white"
              />
              <Search className="w-4 h-4 text-[#4B5563] absolute left-4 top-3.5" />
            </div>

            <div>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="PENDENTE">Pendente de Homologação</option>
                <option value="VALIDADA">Validada (Homologada)</option>
                <option value="REJEITADA">Rejeitada</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            {inscricoes.map((insc) => {
              const escolaObj = escolas.find(e => e.id === insc.escolaId);

              return (
                <div
                  key={insc.id}
                  className="bg-white border border-[#E2EAE5] hover:border-[#00A878]/50 rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-lg font-black text-[#17221D]">
                        {escolaObj?.nome} ({escolaObj?.sigla})
                      </span>
                      <span className="text-xs px-3 py-1 rounded-full bg-[#E8F7F1] text-[#087A5B] font-bold border border-[#00A878]/20">
                        {insc.modalidadeNome}
                      </span>
                      <span className="text-xs px-3 py-1 rounded-full bg-[#F7F9F8] text-[#4B5563] font-bold border border-[#E2EAE5]">
                        {insc.categoria} • {insc.sexo}
                      </span>

                      <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
                        insc.status === 'VALIDADA'
                          ? 'bg-[#E8F7F1] text-[#087A5B] border-[#00A878]/30'
                          : insc.status === 'REJEITADA'
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {insc.status}
                      </span>
                    </div>

                    <div className="text-sm text-[#4B5563] flex flex-wrap items-center gap-4">
                      <span><strong className="text-[#17221D] font-bold">{insc.atletaIds.length}</strong> Atletas convocados</span>
                      <span>•</span>
                      <span>Data: {insc.dataInscricao}</span>
                      {insc.motivoRejeicao && (
                        <span className="text-red-600 font-medium">
                          Motivo: {insc.motivoRejeicao}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
                    <button
                      onClick={() => abrirModalAnalise(insc)}
                      className="px-4 py-2.5 rounded-2xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs sm:text-sm font-bold shadow-xs flex items-center gap-2 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Julgar / Homologar</span>
                    </button>

                    <button
                      onClick={async () => {
                        if (escolaObj) {
                          const atls = insc.atletaIds.map(id => atletas.find(a => a.id === id)).filter((a): a is Atleta => a !== undefined);
                          await JegdPdfGenerator.gerarCrachasEmLote(escolaObj, atls, insc.modalidadeNome, `${insc.categoria} (${insc.sexo})`);
                        }
                      }}
                      className="px-4 py-2.5 rounded-2xl bg-white hover:bg-[#E8F7F1] text-[#17221D] hover:text-[#087A5B] text-xs sm:text-sm font-bold border border-[#E2EAE5] flex items-center gap-2 shadow-2xs transition-colors"
                    >
                      <Download className="w-4 h-4 text-[#00A878]" />
                      <span>Crachás QR</span>
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA: ALERTAS DE INCONSISTÊNCIA */}
      {abaAtiva === 'ALERTAS' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 space-y-2 shadow-sm">
            <h3 className="text-base font-bold text-[#17221D] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>Auditoria e Alertas de Inconsistências</span>
            </h3>
            <p className="text-xs text-[#68756E]">
              O sistema verifica automaticamente documentos faltantes, termos pendentes e cadastros que requerem atenção da comissão.
            </p>
          </div>

          {alertasInconsistencia.length === 0 ? (
            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-8 text-center text-xs text-[#087A5B] font-bold shadow-sm">
              ✓ Nenhuma inconsistência encontrada no momento. Todos os atletas cadastrados possuem documentação completa.
            </div>
          ) : (
            <div className="space-y-3">
              {alertasInconsistencia.map((alerta, idx) => (
                <div key={idx} className="bg-white border border-red-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#17221D]">{alerta.atletaNome}</span>
                      <span className="text-[#68756E]">({alerta.escolaNome})</span>
                    </div>
                    <p className="text-red-700">{alerta.mensagem}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ABA: LISTAS DE CHAMADA & SÚMULAS */}
      {abaAtiva === 'LISTAS_CHAMADA' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 space-y-2 shadow-sm">
            <h3 className="text-base font-bold text-[#17221D] flex items-center gap-2">
              <Printer className="w-5 h-5 text-[#00A878]" />
              <span>Gerador de Súmulas & Listas de Chamada Oficial</span>
            </h3>
            <p className="text-xs text-[#68756E] leading-relaxed">
              Exporte a lista oficial de atletas para controle de Check-in (30 minutos de antecedência) e tolerância de WxO (15 minutos) na mesa de arbitragem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {modalidades.map((mod) => (
              <div
                key={mod.id}
                className="bg-white border border-[#E2EAE5] rounded-2xl p-5 space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#17221D]">{mod.nome}</h4>
                  <span className="text-[10px] text-[#68756E] bg-[#F7F9F8] px-2 py-0.5 rounded border border-[#E2EAE5]">
                    {new Date(mod.dataEvento).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <p className="text-xs text-[#68756E]">
                  Categorias: {mod.categoriasPermitidas.join(', ')}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-[#E2EAE5]">
                  {mod.categoriasPermitidas.map(cat => (
                    <button
                      key={cat}
                      onClick={() => handleGerarListaChamada(mod, cat, 'MASCULINO')}
                      className="w-full py-1.5 px-3 rounded-xl bg-[#F7F9F8] hover:bg-[#E8F7F1] text-[#17221D] hover:text-[#087A5B] border border-[#E2EAE5] text-[11px] font-bold flex items-center justify-between transition-colors shadow-sm"
                    >
                      <span>Súmula {cat} (Masc)</span>
                      <Download className="w-3 h-3 text-[#00A878]" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABA: AVISOS */}
      {abaAtiva === 'AVISOS' && (
        <div className="space-y-3">
          {comunicados.map((aviso) => (
            <div key={aviso.id} className="bg-white border border-[#E2EAE5] rounded-2xl p-5 space-y-2 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#E8F7F1] text-[#087A5B] border border-[#00A878]/20">
                  {aviso.categoria}
                </span>
                <span className="text-xs text-[#68756E]">{aviso.dataPublicacao}</span>
              </div>
              <h4 className="text-base font-bold text-[#17221D]">{aviso.titulo}</h4>
              <p className="text-xs text-[#68756E]">{aviso.conteudo}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Homologação / Parecer */}
      {modalParecerAberto && inscricaoEmAnalise && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2EAE5] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <h3 className="text-lg font-bold text-[#17221D] mb-1">
              Homologação de Inscrição • JEGDS 2026
            </h3>
            <p className="text-xs text-[#68756E] mb-6">
              {inscricaoEmAnalise.modalidadeNome} ({inscricaoEmAnalise.categoria} - {inscricaoEmAnalise.sexo})
            </p>

            <form onSubmit={salvarAnalise} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#17221D] mb-1">
                  Decisão do Comitê Organizador
                </label>
                <select
                  value={novoStatus}
                  onChange={(e) => setNovoStatus(e.target.value as StatusInscricao)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs font-bold focus:outline-none focus:border-[#00A878] focus:bg-white"
                >
                  <option value="VALIDADA">VALIDADA (Homologada)</option>
                  <option value="REJEITADA">REJEITADA (Indeferida com Motivo)</option>
                  <option value="PENDENTE">PENDENTE (Aguardando Documentação)</option>
                </select>
              </div>

              {novoStatus === 'REJEITADA' && (
                <div>
                  <label className="block text-xs font-bold text-red-600 mb-1">
                    Motivo da Rejeição * (Exibido para a Escola)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={motivoRejeicao}
                    onChange={(e) => setMotivoRejeicao(e.target.value)}
                    placeholder="Ex: Documento de identidade ilegível ou atleta fora da faixa etária permitida."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#17221D] mb-1">
                  Parecer do Comitê
                </label>
                <textarea
                  rows={3}
                  value={parecerTexto}
                  onChange={(e) => setParecerTexto(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:outline-none focus:border-[#00A878] focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2EAE5]">
                <button
                  type="button"
                  onClick={() => setModalParecerAberto(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#F7F9F8] hover:bg-[#E2EAE5] text-xs font-bold text-[#68756E]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold shadow-md shadow-[#00A878]/20 transition-all"
                >
                  Salvar Parecer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Observação de Atleta */}
      {modalObsAtletaAberto && atletaObs && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-[#E2EAE5] rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-[#17221D] mb-1">
              Observação da Mesa: {atletaObs.nomeCompleto}
            </h3>
            <p className="text-xs text-[#68756E] mb-4">
              Anotação interna para controle da arbitragem e checagem de documentos.
            </p>

            <form onSubmit={salvarObsAtleta} className="space-y-4">
              <textarea
                rows={3}
                value={obsTexto}
                onChange={(e) => setObsTexto(e.target.value)}
                placeholder="Ex: Documento apresentado fisicamente na mesa com sucesso."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:outline-none focus:border-[#00A878] focus:bg-white"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalObsAtletaAberto(false)}
                  className="px-4 py-2 rounded-xl bg-[#F7F9F8] text-xs font-bold text-[#68756E]"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-bold text-xs shadow-sm transition-all"
                >
                  Salvar Anotação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Publicação de Comunicado */}
      {modalAvisoAberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2EAE5] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <h3 className="text-lg font-bold text-[#17221D] mb-1">
              Publicar Comunicado Oficial do JEGDS 2026
            </h3>
            <form onSubmit={handleSalvarAviso} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#17221D] mb-1">Título *</label>
                <input
                  type="text"
                  required
                  value={novoAvisoTitulo}
                  onChange={(e) => setNovoAvisoTitulo(e.target.value)}
                  placeholder="Ex: Tabela de Jogos de Futsal Publicada"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:outline-none focus:border-[#00A878] focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#17221D] mb-1">Conteúdo *</label>
                <textarea
                  rows={4}
                  required
                  value={novoAvisoConteudo}
                  onChange={(e) => setNovoAvisoConteudo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:outline-none focus:border-[#00A878] focus:bg-white"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-[#E2EAE5]">
                <button
                  type="button"
                  onClick={() => setModalAvisoAberto(false)}
                  className="px-4 py-2 rounded-xl bg-[#F7F9F8] text-[#68756E] text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-bold text-xs shadow-md shadow-[#00A878]/20 transition-all"
                >
                  Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
