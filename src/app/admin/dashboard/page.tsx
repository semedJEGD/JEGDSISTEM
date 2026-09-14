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
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { JegdPdfGenerator } from '@/lib/pdf-generator';
import {
  Escola,
  Atleta,
  InscricaoEquipe,
  MembroComissao,
  ComunicadoAviso,
  StatusInscricao
} from '@/types/jegd';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [inscricoes, setInscricoes] = useState<InscricaoEquipe[]>([]);
  const [comunicados, setComunicados] = useState<ComunicadoAviso[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<'INSCRICOES' | 'ESCOLAS' | 'AVISOS'>('INSCRICOES');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [busca, setBusca] = useState('');
  const [gerandoPdfId, setGerandoPdfId] = useState<string | null>(null);

  // Modal de Parecer / Análise
  const [modalParecerAberto, setModalParecerAberto] = useState(false);
  const [inscricaoEmAnalise, setInscricaoEmAnalise] = useState<InscricaoEquipe | null>(null);
  const [novoStatus, setNovoStatus] = useState<StatusInscricao>('DEFERIDA');
  const [parecerTexto, setParecerTexto] = useState('');

  // Modal Novo Comunicado
  const [modalAvisoAberto, setModalAvisoAberto] = useState(false);
  const [novoAvisoTitulo, setNovoAvisoTitulo] = useState('');
  const [novoAvisoConteudo, setNovoAvisoConteudo] = useState('');
  const [novoAvisoCategoria, setNovoAvisoCategoria] = useState<'CRONOGRAMA' | 'REGULAMENTO' | 'ALERTA'>('CRONOGRAMA');
  const [novoAvisoUrgente, setNovoAvisoUrgente] = useState(false);

  useEffect(() => {
    JegdStorage.init();
    if (!JegdStorage.isAdminAuth()) {
      router.push('/admin/login');
      return;
    }
    carregarTodosDados();
  }, []);

  const carregarTodosDados = () => {
    setEscolas(JegdStorage.getEscolas());
    setAtletas(JegdStorage.getAtletas());
    setInscricoes(JegdStorage.getInscricoes());
    setComunicados(JegdStorage.getComunicados());
  };

  const abrirModalAnalise = (insc: InscricaoEquipe) => {
    setInscricaoEmAnalise(insc);
    setNovoStatus(insc.status === 'RASCUNHO' || insc.status === 'ENVIADA' ? 'DEFERIDA' : insc.status);
    setParecerTexto(insc.parecerSemed || 'Inscrição analisada e validada conforme o regulamento oficial.');
    setModalParecerAberto(true);
  };

  const salvarAnalise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inscricaoEmAnalise) return;

    const atualizada: InscricaoEquipe = {
      ...inscricaoEmAnalise,
      status: novoStatus,
      parecerSemed: parecerTexto,
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
      autor: 'Coordenação Geral JEGD / SEMED'
    };

    JegdStorage.saveComunicado(aviso);
    carregarTodosDados();
    setModalAvisoAberto(false);
    setNovoAvisoTitulo('');
    setNovoAvisoConteudo('');
  };

  const handleExcluirAviso = (id: string) => {
    if (confirm('Deseja excluir este comunicado?')) {
      JegdStorage.deleteComunicado(id);
      carregarTodosDados();
    }
  };

  const handleGerarCrachas = async (insc: InscricaoEquipe) => {
    const escola = escolas.find(e => e.id === insc.escolaId);
    if (!escola) return;

    setGerandoPdfId(insc.id);
    try {
      const atletasEquipe = insc.atletaIds
        .map(id => JegdStorage.getAtletaById(id))
        .filter((a): a is Atleta => a !== undefined);

      await JegdPdfGenerator.gerarCrachasEmLote(
        escola,
        atletasEquipe,
        insc.modalidadeNome,
        `${insc.categoria} (${insc.genero})`
      );
    } catch (err) {
      console.error(err);
      alert('Erro ao emitir crachás.');
    } finally {
      setGerandoPdfId(null);
    }
  };

  const handleGerarFicha = async (insc: InscricaoEquipe) => {
    const escola = escolas.find(e => e.id === insc.escolaId);
    if (!escola) return;

    setGerandoPdfId(insc.id);
    try {
      const atletasEquipe = insc.atletaIds
        .map(id => JegdStorage.getAtletaById(id))
        .filter((a): a is Atleta => a !== undefined);

      const comissaoEquipe = insc.comissaoIds
        .map(id => JegdStorage.getComissao().find(c => c.id === id))
        .filter((c): c is MembroComissao => c !== undefined);

      await JegdPdfGenerator.gerarFichaInscricao(escola, insc, atletasEquipe, comissaoEquipe);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar ficha oficial.');
    } finally {
      setGerandoPdfId(null);
    }
  };

  const totalDeferidas = inscricoes.filter(i => i.status === 'DEFERIDA').length;
  const totalPendentes = inscricoes.filter(i => i.status === 'ENVIADA' || i.status === 'RASCUNHO').length;
  const totalAjuste = inscricoes.filter(i => i.status === 'PENDENTE_AJUSTE').length;

  const inscricoesFiltradas = inscricoes.filter(i => {
    const escola = escolas.find(e => e.id === i.escolaId);
    const bateTexto = (escola?.nome.toLowerCase().includes(busca.toLowerCase()) || '') ||
                      i.modalidadeNome.toLowerCase().includes(busca.toLowerCase());
    const bateStatus = filtroStatus === 'TODOS' || i.status === filtroStatus;
    return bateTexto && bateStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header SEMED */}
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
                  JEGD 2026 Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Homologação de inscrições, emissão oficial de credenciais com QR Code e comunicados aos gestores.
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

      {/* Estatísticas Gerais Consolidadas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Escolas</span>
          <p className="text-3xl font-black text-white mt-1">{escolas.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Cadastradas no JEGD</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Atletas</span>
          <p className="text-3xl font-black text-white mt-1">{atletas.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Estudantes no banco</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Inscrições</span>
          <p className="text-3xl font-black text-white mt-1">{inscricoes.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Equipes enviadas</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Deferidas</span>
          <p className="text-3xl font-black text-emerald-400 mt-1">{totalDeferidas}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Homologadas</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 col-span-2 lg:col-span-1">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Pendentes</span>
          <p className="text-3xl font-black text-amber-400 mt-1">{totalPendentes + totalAjuste}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Aguardando análise</p>
        </div>

      </div>

      {/* Navegação por Abas */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setAbaAtiva('INSCRICOES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            abaAtiva === 'INSCRICOES'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Homologação de Inscrições ({inscricoes.length})
        </button>

        <button
          onClick={() => setAbaAtiva('ESCOLAS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            abaAtiva === 'ESCOLAS'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Unidades Escolares ({escolas.length})
        </button>

        <button
          onClick={() => setAbaAtiva('AVISOS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            abaAtiva === 'AVISOS'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Comunicados Oficiais ({comunicados.length})
        </button>
      </div>

      {/* ABA: HOMOLOGAÇÃO DE INSCRIÇÕES */}
      {abaAtiva === 'INSCRICOES' && (
        <div className="space-y-4">
          
          {/* Barra de Filtros */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Filtrar por nome da escola ou modalidade..."
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
                <option value="ENVIADA">Enviada (Aguardando Parecer)</option>
                <option value="DEFERIDA">Deferida</option>
                <option value="PENDENTE_AJUSTE">Pendente de Ajuste</option>
                <option value="INDEFERIDA">Indeferida</option>
              </select>
            </div>
          </div>

          {/* Tabela / Lista de Inscrições */}
          {inscricoesFiltradas.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
              <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-base font-bold text-white">Nenhuma inscrição encontrada.</p>
              <p className="text-xs text-slate-400 mt-1">As escolas ainda não submeteram equipes com esses filtros.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {inscricoesFiltradas.map((insc) => {
                const escola = escolas.find(e => e.id === insc.escolaId);

                return (
                  <div
                    key={insc.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-black text-white">
                          {escola?.nome} ({escola?.sigla})
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-bold border border-emerald-500/20">
                          {insc.modalidadeNome}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                          {insc.categoria} • {insc.genero}
                        </span>

                        {insc.status === 'DEFERIDA' && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            DEFERIDA
                          </span>
                        )}
                        {insc.status === 'ENVIADA' && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                            AGUARDANDO ANÁLISE
                          </span>
                        )}
                        {insc.status === 'PENDENTE_AJUSTE' && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold">
                            AJUSTE SOLICITADO
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 flex flex-wrap items-center gap-4">
                        <span><strong>{insc.atletaIds.length}</strong> Atletas convocados</span>
                        <span>•</span>
                        <span>Enviado em: {insc.dataEnvio || 'Rascunho'}</span>
                        {insc.parecerSemed && (
                          <span className="text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded">
                            Parecer: {insc.parecerSemed}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ações da SEMED */}
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                      <button
                        onClick={() => abrirModalAnalise(insc)}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/10 flex items-center gap-1.5 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Julgar Inscrição</span>
                      </button>

                      <button
                        onClick={() => handleGerarCrachas(insc)}
                        disabled={gerandoPdfId === insc.id}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        title="Emitir Crachás com Foto e QR Code"
                      >
                        <Download className="w-4 h-4 text-emerald-400" />
                        <span>Crachás QR</span>
                      </button>

                      <button
                        onClick={() => handleGerarFicha(insc)}
                        disabled={gerandoPdfId === insc.id}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        title="Emitir Ficha de Inscrição Oficial"
                      >
                        <Printer className="w-4 h-4 text-slate-400" />
                        <span>Ficha PDF</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ABA: UNIDADES ESCOLARES */}
      {abaAtiva === 'ESCOLAS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {escolas.map((esc) => {
            const atletasEscola = atletas.filter(a => a.escolaId === esc.id);
            const inscricoesEscola = inscricoes.filter(i => i.escolaId === esc.id);

            return (
              <div
                key={esc.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                      Rede {esc.rede}
                    </span>
                    <h3 className="text-base font-bold text-white mt-2">{esc.nome}</h3>
                    <p className="text-xs text-slate-400">Sigla: {esc.sigla} • INEP: {esc.inep}</p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
                  <p>Diretor(a): <strong className="text-slate-200">{esc.diretorNome}</strong></p>
                  <p>Prof. Ed. Física: <strong className="text-slate-200">{esc.professorRespNome}</strong></p>
                  <p>Telefone: <strong className="text-slate-200">{esc.telefone}</strong></p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold">
                  <span className="text-emerald-400">{atletasEscola.length} Atletas</span>
                  <span className="text-amber-400">{inscricoesEscola.length} Equipes</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ABA: COMUNICADOS E AVISOS */}
      {abaAtiva === 'AVISOS' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setModalAvisoAberto(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Novo Comunicado</span>
            </button>
          </div>

          <div className="space-y-3">
            {comunicados.map((aviso) => (
              <div
                key={aviso.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {aviso.categoria}
                    </span>
                    {aviso.urgente && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                        URGENTE
                      </span>
                    )}
                    <span className="text-xs text-slate-500">{aviso.dataPublicacao}</span>
                  </div>
                  <h4 className="text-base font-bold text-white">{aviso.titulo}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">{aviso.conteudo}</p>
                  <p className="text-[11px] text-slate-500 pt-1">Publicado por: {aviso.autor}</p>
                </div>

                <button
                  onClick={() => handleExcluirAviso(aviso.id)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                  title="Excluir comunicado"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Julgamento / Parecer da SEMED */}
      {modalParecerAberto && inscricaoEmAnalise && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <h3 className="text-lg font-bold text-white mb-1">
              Homologação da Inscrição
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              {inscricaoEmAnalise.modalidadeNome} ({inscricaoEmAnalise.categoria} - {inscricaoEmAnalise.genero})
            </p>

            <form onSubmit={salvarAnalise} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Decisão da Comissão Organizadora
                </label>
                <select
                  value={novoStatus}
                  onChange={(e) => setNovoStatus(e.target.value as StatusInscricao)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-bold focus:border-amber-500"
                >
                  <option value="DEFERIDA">DEFERIDA (Aprovada e Homologada)</option>
                  <option value="PENDENTE_AJUSTE">PENDENTE DE AJUSTE (Solicitar Correção)</option>
                  <option value="INDEFERIDA">INDEFERIDA (Recusada)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Parecer Técnico / Justificativa
                </label>
                <textarea
                  rows={4}
                  required
                  value={parecerTexto}
                  onChange={(e) => setParecerTexto(e.target.value)}
                  placeholder="Descreva o parecer ou os ajustes necessários..."
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

      {/* Modal de Publicação de Comunicado */}
      {modalAvisoAberto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <h3 className="text-lg font-bold text-white mb-1">
              Publicar Comunicado Oficial
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Este comunicado será exibido na página inicial e no mural de avisos para todas as escolas.
            </p>

            <form onSubmit={handleSalvarAviso} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Título do Comunicado *
                </label>
                <input
                  type="text"
                  required
                  value={novoAvisoTitulo}
                  onChange={(e) => setNovoAvisoTitulo(e.target.value)}
                  placeholder="Ex: Prorrogação do Prazo de Inscrições"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Categoria</label>
                  <select
                    value={novoAvisoCategoria}
                    onChange={(e) => setNovoAvisoCategoria(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-amber-500"
                  >
                    <option value="CRONOGRAMA">Cronograma</option>
                    <option value="REGULAMENTO">Regulamento</option>
                    <option value="ALERTA">Alerta</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                    <input
                      type="checkbox"
                      checked={novoAvisoUrgente}
                      onChange={(e) => setNovoAvisoUrgente(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700"
                    />
                    <span>Destaque Urgente</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Conteúdo do Comunicado *
                </label>
                <textarea
                  rows={4}
                  required
                  value={novoAvisoConteudo}
                  onChange={(e) => setNovoAvisoConteudo(e.target.value)}
                  placeholder="Escreva a mensagem oficial..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAvisoAberto(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg"
                >
                  Publicar Agora
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
