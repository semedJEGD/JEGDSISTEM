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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Coordenadores SEMED */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">Painel da Coordenação SEMED</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  2 Coordenadores Fixos
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Conferência de lotes por escola, impressão oficial de delegações e monitoramento de inconsistências.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalAvisoAberto(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all"
            >
              <Bell className="w-4 h-4" />
              <span>Publicar Comunicado</span>
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Escolas da Rede</span>
          <p className="text-3xl font-black text-white mt-1">{escolas.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Gonçalves Dias - MA</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total de Alunos</span>
          <p className="text-3xl font-black text-white mt-1">{atletas.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Cadastrados</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Inscrições</span>
          <p className="text-3xl font-black text-white mt-1">{inscricoes.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Equipes enviadas</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Conferidos</span>
          <p className="text-3xl font-black text-emerald-400 mt-1">
            {atletas.filter(a => a.conferidoPeloCoordenador).length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Alunos homologados</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 col-span-2 lg:col-span-1">
          <span className="text-xs font-bold uppercase tracking-wider text-red-400">Alertas</span>
          <p className="text-3xl font-black text-red-400 mt-1">{alertasInconsistencia.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Inconsistências</p>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setAbaAtiva('ESCOLAS_LOTE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            abaAtiva === 'ESCOLAS_LOTE'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Lotes por Escola & Conferência
        </button>

        <button
          onClick={() => setAbaAtiva('HOMOLOGACAO')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            abaAtiva === 'HOMOLOGACAO'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Homologação de Equipes ({inscricoes.length})
        </button>

        <button
          onClick={() => setAbaAtiva('ALERTAS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            abaAtiva === 'ALERTAS'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Alertas de Inconsistência ({alertasInconsistencia.length})
        </button>

        <button
          onClick={() => setAbaAtiva('LISTAS_CHAMADA')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            abaAtiva === 'LISTAS_CHAMADA'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Súmulas & Listas de Chamada WxO
        </button>

        <button
          onClick={() => setAbaAtiva('AVISOS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            abaAtiva === 'AVISOS'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Mural de Comunicados ({comunicados.length})
        </button>
      </div>

      {/* ABA: LOTES POR ESCOLA & CONFERÊNCIA */}
      {abaAtiva === 'ESCOLAS_LOTE' && (
        <div className="space-y-6">
          
          {/* Painel Geral de Progresso por Escola */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <School className="w-5 h-5 text-emerald-400" />
              <span>Painel Geral de Progresso por Escola</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {progressoEscolas.map((item) => (
                <div
                  key={item.escola.id}
                  onClick={() => setEscolaSelecionadaId(item.escola.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    escolaSelecionadaId === item.escola.id
                      ? 'bg-emerald-500/15 border-emerald-500 shadow-md'
                      : 'bg-slate-800/80 border-slate-700/80 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white truncate">
                      {item.escola.sigla} • {item.escola.nome}
                    </span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                      item.status === 'PREENCHIDO'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : item.status === 'EM_ANDAMENTO'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {item.status === 'PREENCHIDO' ? 'PREENCHIDO' : item.status === 'EM_ANDAMENTO' ? 'EM ANDAMENTO' : 'SEM INSCRIÇÃO'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-0.5">
                    <p>Alunos inscritos: <strong className="text-slate-200">{item.totalAtletas}</strong></p>
                    <p>Conferidos: <strong className="text-emerald-400">{item.totalConferidos}/{item.totalAtletas}</strong></p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Inspeção e Conferência do Lote da Escola Selecionada */}
          {escolaSelecionada && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span>Lote de Inscrições: {escolaSelecionada.nome} ({escolaSelecionada.sigla})</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Responsável: {escolaSelecionada.responsavelNome} • Contato: {escolaSelecionada.responsavelTelefone} • INEP: {escolaSelecionada.inep}
                  </p>
                </div>

                <button
                  onClick={() => handleImprimirLoteEscola(escolaSelecionada)}
                  disabled={gerandoPdf || atletasDaEscolaSelecionada.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Lote Desta Escola (PDF)</span>
                </button>
              </div>

              {atletasDaEscolaSelecionada.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Esta escola ainda não cadastrou nenhum aluno.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] font-bold">
                        <tr>
                          <th className="p-3">Conferência</th>
                          <th className="p-3">Aluno</th>
                          <th className="p-3">Data Nasc.</th>
                          <th className="p-3">Categoria/Sexo</th>
                          <th className="p-3">Documento</th>
                          <th className="p-3">Modalidades / Provas</th>
                          <th className="p-3">Cadastrado Por</th>
                          <th className="p-3 text-right">Observações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {atletasDaEscolaSelecionada.map((atleta) => (
                          <tr key={atleta.id} className="hover:bg-slate-800/40">
                            <td className="p-3">
                              <button
                                onClick={() => toggleConferenciaAtleta(atleta)}
                                className={`p-1.5 rounded-lg flex items-center gap-1.5 font-bold transition-all ${
                                  atleta.conferidoPeloCoordenador
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}
                              >
                                {atleta.conferidoPeloCoordenador ? (
                                  <>
                                    <CheckSquare className="w-4 h-4 text-emerald-400" />
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

                            <td className="p-3 font-bold text-white">
                              {atleta.nomeCompleto}
                            </td>

                            <td className="p-3">
                              {new Date(atleta.dataNascimento).toLocaleDateString('pt-BR')}
                            </td>

                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-slate-800 font-semibold text-slate-200">
                                {atleta.categoriaCalculada || 'N/A'} ({atleta.sexo === 'MASCULINO' ? 'Masc' : 'Fem'})
                              </span>
                            </td>

                            <td className="p-3">
                              <strong>{atleta.documentoTipo}:</strong> {atleta.documentoNumero}
                            </td>

                            <td className="p-3">
                              {atleta.modalidadesInscritas && atleta.modalidadesInscritas.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {atleta.modalidadesInscritas.map((m, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px] border border-emerald-500/20">
                                      {m.modalidadeNome} {m.provas && m.provas.length > 0 ? `(${m.provas.join(', ')})` : ''}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-500 italic">Nenhuma</span>
                              )}
                            </td>

                            <td className="p-3 text-slate-400">
                              {atleta.cadastradoPor || escolaSelecionada.responsavelNome}
                            </td>

                            <td className="p-3 text-right">
                              <button
                                onClick={() => abrirModalObsAtleta(atleta)}
                                className={`p-1.5 rounded-lg border text-xs inline-flex items-center gap-1 ${
                                  atleta.observacaoCoordenador
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Filtrar por escola ou modalidade..."
                className="w-full px-4 py-2.5 pl-10 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-amber-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>

            <div>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-amber-500"
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
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-black text-white">
                        {escolaObj?.nome} ({escolaObj?.sigla})
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20">
                        {insc.modalidadeNome}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                        {insc.categoria} • {insc.sexo}
                      </span>

                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                        insc.status === 'VALIDADA'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : insc.status === 'REJEITADA'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {insc.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 flex flex-wrap items-center gap-4">
                      <span><strong>{insc.atletaIds.length}</strong> Atletas convocados</span>
                      <span>•</span>
                      <span>Data: {insc.dataInscricao}</span>
                      {insc.motivoRejeicao && (
                        <span className="text-red-400 font-medium">
                          Motivo: {insc.motivoRejeicao}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                    <button
                      onClick={() => abrirModalAnalise(insc)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md flex items-center gap-1.5 transition-colors"
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
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <span>Auditoria e Alertas de Inconsistências</span>
            </h3>
            <p className="text-xs text-slate-400">
              O sistema verifica automaticamente documentos faltantes, termos pendentes e cadastros que requerem atenção da comissão.
            </p>
          </div>

          {alertasInconsistencia.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-xs text-emerald-400 font-bold">
              ✓ Nenhuma inconsistência encontrada no momento. Todos os atletas cadastrados possuem documentação completa.
            </div>
          ) : (
            <div className="space-y-3">
              {alertasInconsistencia.map((alerta, idx) => (
                <div key={idx} className="bg-slate-900 border border-red-500/30 rounded-2xl p-4 flex items-start gap-4">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{alerta.atletaNome}</span>
                      <span className="text-slate-400">({alerta.escolaNome})</span>
                    </div>
                    <p className="text-red-300">{alerta.mensagem}</p>
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Printer className="w-5 h-5 text-amber-400" />
              <span>Gerador de Súmulas & Listas de Chamada Oficial</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Exporte a lista oficial de atletas para controle de Check-in (30 minutos de antecedência) e tolerância de WxO (15 minutos) na mesa de arbitragem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {modalidades.map((mod) => (
              <div
                key={mod.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{mod.nome}</h4>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {new Date(mod.dataEvento).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <p className="text-xs text-slate-400">
                  Categorias: {mod.categoriasPermitidas.join(', ')}
                </p>

                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  {mod.categoriasPermitidas.map(cat => (
                    <button
                      key={cat}
                      onClick={() => handleGerarListaChamada(mod, cat, 'MASCULINO')}
                      className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center justify-between transition-colors"
                    >
                      <span>Súmula {cat} (Masc)</span>
                      <Download className="w-3 h-3 text-amber-400" />
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
            <div key={aviso.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300">
                  {aviso.categoria}
                </span>
                <span className="text-xs text-slate-500">{aviso.dataPublicacao}</span>
              </div>
              <h4 className="text-base font-bold text-white">{aviso.titulo}</h4>
              <p className="text-xs text-slate-300">{aviso.conteudo}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Homologação / Parecer */}
      {modalParecerAberto && inscricaoEmAnalise && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <h3 className="text-lg font-bold text-white mb-1">
              Homologação de Inscrição • JEGDS 2026
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              {inscricaoEmAnalise.modalidadeNome} ({inscricaoEmAnalise.categoria} - {inscricaoEmAnalise.sexo})
            </p>

            <form onSubmit={salvarAnalise} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Decisão do Comitê Organizador
                </label>
                <select
                  value={novoStatus}
                  onChange={(e) => setNovoStatus(e.target.value as StatusInscricao)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:border-amber-500"
                >
                  <option value="VALIDADA">VALIDADA (Homologada)</option>
                  <option value="REJEITADA">REJEITADA (Indeferida com Motivo)</option>
                  <option value="PENDENTE">PENDENTE (Aguardando Documentação)</option>
                </select>
              </div>

              {novoStatus === 'REJEITADA' && (
                <div>
                  <label className="block text-xs font-semibold text-red-400 mb-1">
                    Motivo da Rejeição * (Exibido para a Escola)
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={motivoRejeicao}
                    onChange={(e) => setMotivoRejeicao(e.target.value)}
                    placeholder="Ex: Documento de identidade ilegível ou atleta fora da faixa etária permitida."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-red-500 text-white text-xs focus:border-red-400"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Parecer do Comitê
                </label>
                <textarea
                  rows={3}
                  value={parecerTexto}
                  onChange={(e) => setParecerTexto(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalParecerAberto(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-white mb-1">
              Observação da Mesa: {atletaObs.nomeCompleto}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Anotação interna para controle da arbitragem e checagem de documentos.
            </p>

            <form onSubmit={salvarObsAtleta} className="space-y-4">
              <textarea
                rows={3}
                value={obsTexto}
                onChange={(e) => setObsTexto(e.target.value)}
                placeholder="Ex: Documento apresentado fisicamente na mesa com sucesso."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-amber-500"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalObsAtletaAberto(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300"
                >
                  Fechar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <h3 className="text-lg font-bold text-white mb-1">
              Publicar Comunicado Oficial do JEGDS 2026
            </h3>
            <form onSubmit={handleSalvarAviso} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Título *</label>
                <input
                  type="text"
                  required
                  value={novoAvisoTitulo}
                  onChange={(e) => setNovoAvisoTitulo(e.target.value)}
                  placeholder="Ex: Tabela de Jogos de Futsal Publicada"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Conteúdo *</label>
                <textarea
                  rows={4}
                  required
                  value={novoAvisoConteudo}
                  onChange={(e) => setNovoAvisoConteudo(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAvisoAberto(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
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
