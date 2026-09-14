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
  AlertCircle
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
  const [abaAtiva, setAbaAtiva] = useState<'INSCRICOES' | 'LISTAS_CHAMADA' | 'ESCOLAS' | 'AVISOS'>('INSCRICOES');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [busca, setBusca] = useState('');
  const [gerandoPdfId, setGerandoPdfId] = useState<string | null>(null);

  // Modal de Julgamento / Parecer
  const [modalParecerAberto, setModalParecerAberto] = useState(false);
  const [inscricaoEmAnalise, setInscricaoEmAnalise] = useState<InscricaoEquipe | null>(null);
  const [novoStatus, setNovoStatus] = useState<StatusInscricao>('VALIDADA');
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [parecerTexto, setParecerTexto] = useState('');

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
    setEscolas(JegdStorage.getEscolas());
    setAtletas(JegdStorage.getAtletas());
    setInscricoes(JegdStorage.getInscricoes());
    setModalidades(JegdStorage.getModalidades());
    setComunicados(JegdStorage.getComunicados());
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
    // Buscar todas as inscrições validadas dessa modalidade/categoria/sexo
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

  const totalValidadas = inscricoes.filter(i => i.status === 'VALIDADA').length;
  const totalPendentes = inscricoes.filter(i => i.status === 'PENDENTE').length;
  const totalRejeitadas = inscricoes.filter(i => i.status === 'REJEITADA').length;

  const inscricoesFiltradas = inscricoes.filter(i => {
    const escola = escolas.find(e => e.id === i.escolaId);
    const bateTexto = (escola?.nome.toLowerCase().includes(busca.toLowerCase()) || '') ||
                      i.modalidadeNome.toLowerCase().includes(busca.toLowerCase());
    const bateStatus = filtroStatus === 'TODOS' || i.status === filtroStatus;
    return bateTexto && bateStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Comitê */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">Painel do Comitê Organizador</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  JEGDS 2026
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Jogos Escolares de Gonçalves Dias • Homologação, Súmulas de Check-in e Controle de WxO.
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
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Escolas</span>
          <p className="text-3xl font-black text-white mt-1">{escolas.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Gonçalves Dias - MA</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Atletas</span>
          <p className="text-3xl font-black text-white mt-1">{atletas.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Cadastrados</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Inscrições</span>
          <p className="text-3xl font-black text-white mt-1">{inscricoes.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Equipes enviadas</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Validadas</span>
          <p className="text-3xl font-black text-emerald-400 mt-1">{totalValidadas}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Homologadas</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 col-span-2 lg:col-span-1">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Pendentes</span>
          <p className="text-3xl font-black text-amber-400 mt-1">{totalPendentes}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Em análise</p>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setAbaAtiva('INSCRICOES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            abaAtiva === 'INSCRICOES'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Homologação de Inscrições ({inscricoes.length})
        </button>

        <button
          onClick={() => setAbaAtiva('LISTAS_CHAMADA')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            abaAtiva === 'LISTAS_CHAMADA'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Listas de Chamada & Súmulas WxO
        </button>

        <button
          onClick={() => setAbaAtiva('ESCOLAS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            abaAtiva === 'ESCOLAS'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Unidades Escolares ({escolas.length})
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

      {/* ABA: HOMOLOGAÇÃO DE INSCRIÇÕES */}
      {abaAtiva === 'INSCRICOES' && (
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

          {inscricoesFiltradas.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
              <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-3" />
              <p className="text-base font-bold text-white">Nenhuma inscrição encontrada.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {inscricoesFiltradas.map((insc) => {
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

      {/* ABA: ESCOLAS */}
      {abaAtiva === 'ESCOLAS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {escolas.map((esc) => (
            <div key={esc.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                Rede {esc.rede}
              </span>
              <h3 className="text-base font-bold text-white">{esc.nome}</h3>
              <p className="text-xs text-slate-400">INEP: {esc.inep} • Resp: {esc.responsavelNome}</p>
              <p className="text-xs text-slate-400">Tel: {esc.responsavelTelefone}</p>
            </div>
          ))}
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
