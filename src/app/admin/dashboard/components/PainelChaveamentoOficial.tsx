'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Shuffle,
  Sparkles,
  Lock,
  Printer,
  Trash2,
  CheckCircle2,
  Plus,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Trophy,
  Table2,
  Users,
  X,
  Eye,
} from 'lucide-react';
import { Atleta, Escola, InscricaoEquipe, ModalidadeConfig } from '@/types/jegd';
import {
  ArtilhariaEventoItem,
  ChaveamentoEventoItem,
  PartidaEventoItem,
} from '@/types/eventos';
import { EventosApi, CATEGORIAS_EVENTOS, FASES_LABEL } from '@/lib/eventos-service';
import {
  auditarCategoriaParaChaveamento,
  gerarSeedAuditavel,
  gerarChaveamentoColetivoOuTenisMesa,
  gerarBalizamentoAtletismo,
  gerarTorneioXadrezInicial,
  gerarProximaRodadaSuica,
  calcularClassificacaoXadrez,
  normalizarCodigoModalidade,
  GrupoChaveamento,
  PartidaGeradaPayload,
  ParticipanteChaveamento,
  ProvaAtletismoBalizamento,
  EstruturaXadrez,
  FinalizacaoCampeonato,
} from '@/lib/chaveamento-service';
import { gerarPdfChaveamentoOficial } from '@/lib/pdf/tabela-jogos';
import { JegdStorage } from '@/lib/storage';
import { ChaveamentoInterativo } from './ChaveamentoInterativo';

const MODALIDADES_OFICIAIS = [
  { codigo: 'futsal', nome: 'Futsal' },
  { codigo: 'futebol_campo', nome: 'Futebol de Campo' },
  { codigo: 'queimada', nome: 'Queimada' },
  { codigo: 'beach_soccer', nome: 'Beach Soccer' },
  { codigo: 'voleibol', nome: 'Voleibol' },
  { codigo: 'tenis_mesa', nome: 'Tênis de Mesa' },
  { codigo: 'atletismo', nome: 'Atletismo' },
  { codigo: 'xadrez', nome: 'Xadrez' },
];

const MODALIDADES_PONTOS_CORRIDOS = ['futsal', 'futebol_campo'];

type TipoCriacao = 'CHAVEAMENTO' | 'TABELA';

interface PainelChaveamentoOficialProps {
  municipioId?: string;
  escolas: Escola[];
  atletas: Atleta[];
  inscricoes: InscricaoEquipe[];
  modalidades?: ModalidadeConfig[];
  partidas: PartidaEventoItem[];
  chaveamentos: ChaveamentoEventoItem[];
  artilharia?: ArtilhariaEventoItem[];
  onAtualizado: () => Promise<void>;
}

export function PainelChaveamentoOficial({
  municipioId,
  escolas,
  atletas,
  inscricoes,
  modalidades,
  partidas,
  chaveamentos,
  artilharia = [],
  onAtualizado,
}: PainelChaveamentoOficialProps) {
  const hojeIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [mostrarMontador, setMostrarMontador] = useState(chaveamentos.length === 0);
  const [tipoCriacao, setTipoCriacao] = useState<TipoCriacao>('CHAVEAMENTO');
  const [mostrarAvancado, setMostrarAvancado] = useState(false);

  const [modCodigo, setModCodigo] = useState('futsal');
  const [categoria, setCategoria] = useState('INFANTIL');
  const [sexo, setSexo] = useState('MASCULINO');

  const [modoChaveamento, setModoChaveamento] = useState<'MATA_MATA' | 'GRUPOS_MATA_MATA'>('MATA_MATA');
  const [incluirTerceiroLugar, setIncluirTerceiroLugar] = useState(true);
  const [seed, setSeed] = useState(() => gerarSeedAuditavel());
  const [dataEvento, setDataEvento] = useState(hojeIso);
  const [horaInicio, setHoraInicio] = useState('08:30');
  const [intervaloMinutos, setIntervaloMinutos] = useState(30);
  const [quadrasStr, setQuadrasStr] = useState('Quadra 01, Quadra 02');
  const [rodadasXadrez, setRodadasXadrez] = useState(5);
  const [excluidosIds, setExcluidosIds] = useState<string[]>([]);

  const [previa, setPrevia] = useState<{
    formato: string;
    grupos?: GrupoChaveamento[];
    partidas?: PartidaGeradaPayload[];
    provasAtletismo?: ProvaAtletismoBalizamento[];
    xadrez?: EstruturaXadrez;
  } | null>(null);

  const [salvando, setSalvando] = useState(false);
  const [confirmandoExclusaoId, setConfirmandoExclusaoId] = useState<string | null>(null);
  const [participanteInspecionado, setParticipanteInspecionado] = useState<ParticipanteChaveamento | null>(null);
  const [chaveamentoExpandidoId, setChaveamentoExpandidoId] = useState<string | null>(
    chaveamentos[0]?.id || null
  );

  const modalidadesDisponiveis = useMemo(
    () =>
      tipoCriacao === 'TABELA'
        ? MODALIDADES_OFICIAIS.filter((m) => MODALIDADES_PONTOS_CORRIDOS.includes(m.codigo))
        : MODALIDADES_OFICIAIS,
    [tipoCriacao]
  );

  const modObj = useMemo(
    () => modalidadesDisponiveis.find((m) => m.codigo === modCodigo) || modalidadesDisponiveis[0],
    [modalidadesDisponiveis, modCodigo]
  );

  const categoriasAtivas = useMemo(() => {
    const lista: {
      chave: string;
      modCodigo: string;
      modNome: string;
      categoria: string;
      sexo: string;
      total: number;
      chaveamento?: ChaveamentoEventoItem;
    }[] = [];

    for (const m of MODALIDADES_OFICIAIS) {
      for (const cat of CATEGORIAS_EVENTOS) {
        for (const sx of ['MASCULINO', 'FEMININO'] as const) {
          const aud = auditarCategoriaParaChaveamento({
            modalidadeCodigo: m.codigo,
            modalidadeNome: m.nome,
            categoria: cat,
            sexo: sx,
            escolas,
            atletas,
            inscricoes,
            modalidades,
          });
          const chExistente = chaveamentos.find(
            (c) =>
              normalizarCodigoModalidade(c.modalidadeCodigo) === normalizarCodigoModalidade(m.codigo) &&
              c.categoria === cat &&
              c.sexo === sx
          );
          if (aud.resumo.totalParticipantes > 0 || chExistente) {
            lista.push({
              chave: `${m.codigo}__${cat}__${sx}`,
              modCodigo: m.codigo,
              modNome: m.nome,
              categoria: cat,
              sexo: sx,
              total: aud.resumo.totalParticipantes,
              chaveamento: chExistente,
            });
          }
        }
      }
    }
    return lista;
  }, [escolas, atletas, inscricoes, modalidades, chaveamentos]);

  const auditoria = useMemo(() => {
    return auditarCategoriaParaChaveamento({
      modalidadeCodigo: modObj.codigo,
      modalidadeNome: modObj.nome,
      categoria,
      sexo,
      escolas,
      atletas,
      inscricoes,
      modalidades,
    });
  }, [modObj, categoria, sexo, escolas, atletas, inscricoes, modalidades]);

  const chaveamentoDuplicado = useMemo(
    () =>
      chaveamentos.find(
        (c) =>
          normalizarCodigoModalidade(c.modalidadeCodigo) === normalizarCodigoModalidade(modObj.codigo) &&
          c.categoria === categoria &&
          c.sexo === sexo
      ) || null,
    [chaveamentos, modObj.codigo, categoria, sexo]
  );

  const participantesAtivos = useMemo(
    () => auditoria.participantes.filter((p) => !excluidosIds.includes(p.id)),
    [auditoria.participantes, excluidosIds]
  );

  const abrirMontadorComTipo = (tipo: TipoCriacao) => {
    setTipoCriacao(tipo);
    if (tipo === 'TABELA' && !MODALIDADES_PONTOS_CORRIDOS.includes(modCodigo)) {
      setModCodigo('futsal');
    }
    setPrevia(null);
    setMostrarMontador(true);
  };

  const toggleParticipante = (id: string) => {
    setExcluidosIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setPrevia(null);
  };

  const montarPreviaComParametros = (seedUsada: string, gruposCustomizados?: GrupoChaveamento[]) => {
    const norm = normalizarCodigoModalidade(modObj.codigo);

    if (norm === 'atletismo') {
      if (participantesAtivos.length === 0) {
        alert('Nenhum atleta inscrito em Atletismo para esta categoria/naipe.');
        return;
      }
      const provas = gerarBalizamentoAtletismo({
        participantes: participantesAtivos,
        seed: seedUsada,
        maxRaiasPorSerie: 8,
      });
      setPrevia({ formato: 'BALIZAMENTO_ATLETISMO', provasAtletismo: provas });
      return;
    }

    if (participantesAtivos.length < 2) {
      alert('Selecione pelo menos 2 participantes para montar a competição.');
      return;
    }

    if (norm === 'xadrez') {
      const xadrez = gerarTorneioXadrezInicial({
        participantes: participantesAtivos,
        seed: seedUsada,
        totalRodadas: rodadasXadrez,
      });
      setPrevia({ formato: 'SUICO_XADREZ', xadrez });
      return;
    }

    const formatoFinal =
      tipoCriacao === 'TABELA'
        ? 'BERGER_UNICO'
        : norm === 'tenis_mesa'
        ? modoChaveamento === 'MATA_MATA'
          ? 'MATA_MATA'
          : 'GRUPOS_TENIS_MESA'
        : participantesAtivos.length === 2
        ? 'FINAL_DIRETA'
        : modoChaveamento === 'MATA_MATA'
        ? 'MATA_MATA'
        : participantesAtivos.length <= 5
        ? 'BERGER_UNICO'
        : 'GRUPOS_MATA_MATA';

    const maxNumExistente = partidas.reduce((max, p) => Math.max(max, p.numeroJogo || 0), 0);
    const { grupos, partidas: partidasGeradas } = gerarChaveamentoColetivoOuTenisMesa({
      participantes: participantesAtivos,
      gruposCustomizados,
      modalidadeCodigo: norm,
      modalidadeNome: modObj.nome,
      categoria,
      sexo,
      formato: formatoFinal,
      seed: seedUsada,
      dataEvento,
      horaInicio,
      intervaloMinutos: Number(intervaloMinutos) || 30,
      quadras: quadrasStr.split(','),
      numeroJogoInicial: maxNumExistente + 1,
      incluirTerceiroLugar,
    });

    setPrevia({ formato: formatoFinal, grupos, partidas: partidasGeradas });
  };

  const handleGerarPrevia = (novaSeed = false) => {
    const s = novaSeed ? gerarSeedAuditavel() : seed;
    if (novaSeed) setSeed(s);
    montarPreviaComParametros(s);
  };

  const handleMoverDeGrupo = (participanteId: string, grupoDestinoNome: string) => {
    if (!previa?.grupos) return;
    let movido: GrupoChaveamento['participantes'][0] | null = null;
    const semParticipante = previa.grupos.map((g) => {
      const encontrado = g.participantes.find((p) => p.id === participanteId);
      if (encontrado) movido = encontrado;
      return { ...g, participantes: g.participantes.filter((p) => p.id !== participanteId) };
    });
    if (!movido) return;
    const novosGrupos = semParticipante.map((g) =>
      g.nome === grupoDestinoNome ? { ...g, participantes: [...g.participantes, movido!] } : g
    );
    montarPreviaComParametros(seed, novosGrupos);
  };

  const handlePublicarChaveamento = async () => {
    if (!previa) return;
    const currentUser = JegdStorage.getCurrentUser();
    const operador = currentUser?.nome || 'Coordenação SEMED';

    const estruturaPayload =
      previa.formato === 'BALIZAMENTO_ATLETISMO'
        ? { provas: previa.provasAtletismo }
        : previa.formato === 'SUICO_XADREZ'
        ? previa.xadrez
        : { grupos: previa.grupos };

    try {
      setSalvando(true);
      const res = await EventosApi.criar('chaveamento', {
        municipioId,
        substituirExistenteId: chaveamentoDuplicado?.id || null,
        modalidadeCodigo: normalizarCodigoModalidade(modObj.codigo),
        modalidadeNome: modObj.nome,
        categoria,
        sexo,
        formato: previa.formato,
        seed,
        status: 'RASCUNHO',
        criadoPor: operador,
        auditoriaJson: JSON.stringify({
          semaforo: auditoria.semaforo,
          resumo: auditoria.resumo,
          alertas: auditoria.alertas,
          geradoEm: new Date().toISOString(),
        }),
        estruturaJson: JSON.stringify(estruturaPayload),
        partidas: previa.partidas || [],
      });
      setPrevia(null);
      setSeed(gerarSeedAuditavel());
      setMostrarMontador(false);
      await onAtualizado();
      if (res?.chaveamento?.id) {
        setChaveamentoExpandidoId(res.chaveamento.id);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar chaveamento');
    } finally {
      setSalvando(false);
    }
  };

  const handleCongelarChaveamento = async (ch: ChaveamentoEventoItem) => {
    try {
      setSalvando(true);
      await EventosApi.atualizar('chaveamento', ch.id, { status: 'CONGELADO' });
      await onAtualizado();
    } catch (err: any) {
      alert(err.message || 'Erro ao congelar chaveamento');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluirChaveamento = async (ch: ChaveamentoEventoItem) => {
    try {
      setSalvando(true);
      await EventosApi.excluir('chaveamento', ch.id, { excluirPartidas: '1' });
      setConfirmandoExclusaoId(null);
      if (chaveamentoExpandidoId === ch.id) setChaveamentoExpandidoId(null);
      await onAtualizado();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir chaveamento');
    } finally {
      setSalvando(false);
    }
  };

  // Xadrez inline
  const handleAtualizarMesaXadrez = async (
    ch: ChaveamentoEventoItem,
    rodadaNum: number,
    mesaNum: number,
    resultado: 'PENDENTE' | '1-0' | '0-1' | '0.5-0.5' | 'BYE'
  ) => {
    try {
      const est: EstruturaXadrez = JSON.parse(ch.estruturaJson || '{}');
      const novasRodadas = est.rodadas.map((r) =>
        r.numero === rodadaNum
          ? { ...r, mesas: r.mesas.map((m) => (m.mesa === mesaNum ? { ...m, resultado } : m)) }
          : r
      );
      await EventosApi.atualizar('chaveamento', ch.id, {
        estruturaJson: JSON.stringify({ ...est, rodadas: novasRodadas }),
      });
      await onAtualizado();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar mesa de Xadrez');
    }
  };

  const handleGerarProximaRodadaXadrez = async (ch: ChaveamentoEventoItem) => {
    try {
      const est: EstruturaXadrez = JSON.parse(ch.estruturaJson || '{}');
      setSalvando(true);
      const novaEst = gerarProximaRodadaSuica(est);
      await EventosApi.atualizar('chaveamento', ch.id, {
        estruturaJson: JSON.stringify(novaEst),
      });
      await onAtualizado();
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar próxima rodada Suíça');
    } finally {
      setSalvando(false);
    }
  };

  // Atletismo inline
  const handleAtualizarRaiaAtletismo = async (
    ch: ChaveamentoEventoItem,
    provaNome: string,
    serieNum: number,
    raiaNum: number,
    campo: 'marca' | 'posicao',
    valor: string
  ) => {
    try {
      const est: { provas: ProvaAtletismoBalizamento[] } = JSON.parse(ch.estruturaJson || '{"provas":[]}');
      const novasProvas = est.provas.map((pr) =>
        pr.prova === provaNome
          ? {
              ...pr,
              series: pr.series.map((s) =>
                s.numero === serieNum
                  ? {
                      ...s,
                      raias: s.raias.map((r) =>
                        r.raia === raiaNum
                          ? { ...r, [campo]: campo === 'posicao' ? (valor ? Number(valor) : null) : valor }
                          : r
                      ),
                    }
                  : s
              ),
            }
          : pr
      );
      await EventosApi.atualizar('chaveamento', ch.id, {
        estruturaJson: JSON.stringify({ provas: novasProvas }),
      });
      await onAtualizado();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar marca de Atletismo');
    }
  };

  return (
    <div className="space-y-6">
      {/* ================================================================ */}
      {/* CABEÇALHO LIMPO + 2 BOTÕES DIRETOS                               */}
      {/* ================================================================ */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Chaveamento & Tabelas
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Crie um chaveamento eliminatório ou uma tabela de pontos corridos e acompanhe os jogos ao vivo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                mostrarMontador && tipoCriacao === 'CHAVEAMENTO'
                  ? setMostrarMontador(false)
                  : abrirMontadorComTipo('CHAVEAMENTO')
              }
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                mostrarMontador && tipoCriacao === 'CHAVEAMENTO'
                  ? 'bg-slate-900 text-white'
                  : 'bg-[#00A878] hover:bg-[#087A5B] text-white shadow-xs'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Criar Chaveamento</span>
            </button>

            <button
              type="button"
              onClick={() =>
                mostrarMontador && tipoCriacao === 'TABELA'
                  ? setMostrarMontador(false)
                  : abrirMontadorComTipo('TABELA')
              }
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                mostrarMontador && tipoCriacao === 'TABELA'
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
              }`}
            >
              <Table2 className="w-3.5 h-3.5 text-[#00A878]" />
              <span>Criar Tabela</span>
            </button>
          </div>
        </div>

        {/* Barra minimalista de categorias com inscritos */}
        {categoriasAtivas.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-slate-100">
            <span className="text-[11px] font-medium text-slate-400 mr-1">Categorias:</span>
            {categoriasAtivas.map((item) => {
              const temChav = Boolean(item.chaveamento);
              const aberto = temChav && chaveamentoExpandidoId === item.chaveamento!.id;
              return (
                <button
                  key={item.chave}
                  type="button"
                  onClick={() => {
                    if (item.chaveamento) {
                      setChaveamentoExpandidoId(aberto ? null : item.chaveamento.id);
                      setMostrarMontador(false);
                    } else {
                      setTipoCriacao('CHAVEAMENTO');
                      setModCodigo(item.modCodigo);
                      setCategoria(item.categoria);
                      setSexo(item.sexo);
                      setExcluidosIds([]);
                      setPrevia(null);
                      setMostrarMontador(true);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    aberto
                      ? 'bg-slate-900 text-white'
                      : temChav
                      ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      aberto ? 'bg-emerald-400' : temChav ? 'bg-[#00A878]' : 'bg-slate-400'
                    }`}
                  />
                  <span>
                    {item.modNome} · {item.categoria} · {item.sexo === 'MASCULINO' ? 'M' : 'F'}
                  </span>
                  <span className="opacity-60">({item.total})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ================================================================ */}
      {/* MONTADOR CLEAN (3 ETAPAS VISUAIS)                                */}
      {/* ================================================================ */}
      {mostrarMontador && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-6">
          {/* Topo do montador */}
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {tipoCriacao === 'TABELA'
                  ? 'Nova Tabela de Pontos Corridos'
                  : 'Novo Chaveamento'}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {tipoCriacao === 'TABELA'
                  ? 'Estilo Brasileirão (Vitória +3 pts · Empate +1 pt) — Futsal e Futebol de Campo.'
                  : 'Escolha a categoria, ajuste as equipes participantes e gere a prévia.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMostrarMontador(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Etapa 1: Modalidade, Categoria e Naipe */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              1. Categoria da Competição
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Modalidade</label>
                <select
                  value={modObj.codigo}
                  onChange={(e) => {
                    setModCodigo(e.target.value);
                    setExcluidosIds([]);
                    setPrevia(null);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white"
                >
                  {modalidadesDisponiveis.map((m) => (
                    <option key={m.codigo} value={m.codigo}>
                      {m.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Categoria</label>
                <select
                  value={categoria}
                  onChange={(e) => {
                    setCategoria(e.target.value);
                    setExcluidosIds([]);
                    setPrevia(null);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white"
                >
                  {CATEGORIAS_EVENTOS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Naipe</label>
                <select
                  value={sexo}
                  onChange={(e) => {
                    setSexo(e.target.value);
                    setExcluidosIds([]);
                    setPrevia(null);
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white"
                >
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMININO">Feminino</option>
                </select>
              </div>
            </div>

            {/* Formato quando for Chaveamento */}
            {tipoCriacao === 'CHAVEAMENTO' && modObj.codigo !== 'atletismo' && modObj.codigo !== 'xadrez' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setModoChaveamento('MATA_MATA');
                    setPrevia(null);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    modoChaveamento === 'MATA_MATA'
                      ? 'bg-emerald-50/60 border-[#00A878] ring-1 ring-[#00A878]/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      modoChaveamento === 'MATA_MATA' ? 'bg-[#00A878] text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Modelo Copinha (Mata-Mata)</p>
                    <p className="text-[11px] text-slate-500">Eliminatória direta com pênaltis e avanço automático.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setModoChaveamento('GRUPOS_MATA_MATA');
                    setPrevia(null);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                    modoChaveamento === 'GRUPOS_MATA_MATA'
                      ? 'bg-emerald-50/60 border-[#00A878] ring-1 ring-[#00A878]/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      modoChaveamento === 'GRUPOS_MATA_MATA' ? 'bg-[#00A878] text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Grupos + Mata-Mata</p>
                    <p className="text-[11px] text-slate-500">Fase de grupos classificatória seguida de semifinais e final.</p>
                  </div>
                </button>
              </div>
            )}

            {chaveamentoDuplicado && (
              <div className="px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-center justify-between gap-2">
                <span>Já existe uma competição criada para esta categoria. Salvar irá substituí-la.</span>
                <button
                  type="button"
                  onClick={() => {
                    setChaveamentoExpandidoId(chaveamentoDuplicado.id);
                    setMostrarMontador(false);
                  }}
                  className="font-bold underline shrink-0 cursor-pointer"
                >
                  Abrir existente
                </button>
              </div>
            )}
          </div>

          {/* Etapa 2: Equipes no Sorteio */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                2. Participantes no Sorteio ({participantesAtivos.length}/{auditoria.participantes.length})
              </p>
              {auditoria.participantes.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setExcluidosIds([]);
                      setPrevia(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExcluidosIds(
                        auditoria.participantes
                          .filter((p) => p.alertas.some((al) => al.includes('Abaixo do mínimo')))
                          .map((p) => p.id)
                      );
                      setPrevia(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold cursor-pointer"
                    title="Remove automaticamente equipes abaixo do mínimo de atletas"
                  >
                    Tirar abaixo do mínimo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExcluidosIds(
                        auditoria.participantes
                          .filter((p) => p.statusHomologacao !== 'VALIDADA')
                          .map((p) => p.id)
                      );
                      setPrevia(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold cursor-pointer"
                  >
                    Só Validadas
                  </button>
                </div>
              )}
            </div>

            {auditoria.participantes.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-slate-400" />
                <span>Nenhum participante inscrito em {modObj.nome} · {categoria} · {sexo}.</span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                  {participantesAtivos.map((p) => (
                    <div
                      key={p.id}
                      className="px-3 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50/40 hover:bg-white hover:border-slate-300 flex items-start justify-between gap-2 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => setParticipanteInspecionado(p)}
                        className="min-w-0 flex-1 text-left cursor-pointer group"
                        title="Clique para ver os alunos inscritos"
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              p.statusHomologacao === 'VALIDADA' ? 'bg-[#00A878]' : 'bg-amber-400'
                            }`}
                            title={p.statusHomologacao}
                          />
                          <span className="text-xs font-semibold text-slate-800 group-hover:text-[#087A5B] truncate">
                            {p.sigla}
                          </span>
                        </div>
                        {p.totalAtletas !== undefined && (
                          <p className="text-[11px] text-slate-500 pl-3.5 flex items-center gap-1 mt-0.5">
                            <span>{p.totalAtletas} atleta(s)</span>
                            <span className="text-[#00A878] font-semibold inline-flex items-center gap-0.5 group-hover:underline">
                              · <Eye className="w-3 h-3" /> Ver alunos
                            </span>
                          </p>
                        )}
                        {p.alertas.some((al) => al.includes('Abaixo do mínimo')) && (
                          <p className="text-[10px] font-semibold text-rose-600 pl-3.5 mt-0.5">
                            {p.alertas.find((al) => al.includes('Abaixo do mínimo'))}
                          </p>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleParticipante(p.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 shrink-0 cursor-pointer transition-colors"
                        title={`Remover ${p.sigla} do sorteio`}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {excluidosIds.length > 0 && (
                  <div className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-medium text-slate-400 mr-1">Fora do sorteio:</span>
                    {auditoria.participantes
                      .filter((p) => excluidosIds.includes(p.id))
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleParticipante(p.id)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 text-[11px] font-semibold text-slate-500 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>{p.sigla}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Opções opcionais + Botões de ação */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setMostrarAvancado((v) => !v)}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>{mostrarAvancado ? 'Ocultar agenda e quadras' : 'Data, horário e quadras (opcional)'}</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleGerarPrevia(Boolean(previa))}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {previa ? <Shuffle className="w-3.5 h-3.5 text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                  <span>{previa ? 'Re-sortear' : 'Gerar Prévia'}</span>
                </button>

                {previa && (
                  <button
                    type="button"
                    disabled={salvando}
                    onClick={handlePublicarChaveamento}
                    className="px-5 py-2 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {salvando
                        ? 'Salvando...'
                        : chaveamentoDuplicado
                        ? 'Substituir & Abrir'
                        : 'Salvar & Abrir'}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {mostrarAvancado && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {modObj.codigo === 'xadrez' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Rodadas (Suíço)</label>
                    <input
                      type="number"
                      min={3}
                      max={7}
                      value={rodadasXadrez}
                      onChange={(e) => setRodadasXadrez(Number(e.target.value) || 5)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                    />
                  </div>
                )}

                {modObj.codigo !== 'atletismo' && modObj.codigo !== 'xadrez' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Data</label>
                      <input
                        type="date"
                        value={dataEvento}
                        onChange={(e) => setDataEvento(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Início / Intervalo</label>
                      <div className="flex gap-1.5">
                        <input
                          type="time"
                          value={horaInicio}
                          onChange={(e) => setHoraInicio(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                        <input
                          type="number"
                          min={10}
                          max={120}
                          value={intervaloMinutos}
                          onChange={(e) => setIntervaloMinutos(Number(e.target.value) || 30)}
                          className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">Quadras / Campos</label>
                      <input
                        type="text"
                        value={quadrasStr}
                        onChange={(e) => setQuadrasStr(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Seed</label>
                  <input
                    type="text"
                    value={seed}
                    onChange={(e) => {
                      setSeed(e.target.value);
                      setPrevia(null);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono"
                  />
                </div>

                {tipoCriacao === 'CHAVEAMENTO' && modObj.codigo !== 'atletismo' && modObj.codigo !== 'xadrez' && (
                  <label className="sm:col-span-2 flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={incluirTerceiroLugar}
                      onChange={(e) => setIncluirTerceiroLugar(e.target.checked)}
                      className="accent-[#00A878]"
                    />
                    <span>Incluir disputa de 3º Lugar</span>
                  </label>
                )}
              </div>
            )}

            {/* Etapa 3: Prévia limpa */}
            {previa && (
              <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/30 p-4 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-xs font-bold text-emerald-900">
                    Prévia · {previa.partidas?.length || 0} jogo(s) prontos
                  </p>
                  {previa.grupos && previa.grupos.length > 1 && (
                    <span className="text-[11px] text-emerald-700">
                      Troque equipes de grupo abaixo se desejar
                    </span>
                  )}
                </div>

                {previa.grupos && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {previa.grupos.map((g) => (
                      <div key={g.nome} className="bg-white rounded-xl border border-slate-200/80 p-3.5 space-y-2">
                        <p className="text-xs font-bold text-slate-800">{g.nome}</p>
                        {g.participantes.map((p, idx) => (
                          <div key={p.id} className="flex items-center justify-between gap-2 text-xs text-slate-600">
                            <span className="truncate">
                              <span className="text-slate-400 mr-1.5">{idx + 1}.</span>
                              <span className="font-semibold text-slate-800">{p.sigla}</span>
                            </span>
                            {previa.grupos!.length > 1 && (
                              <select
                                value={g.nome}
                                onChange={(e) => handleMoverDeGrupo(p.id, e.target.value)}
                                className="text-[11px] px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-600"
                              >
                                {previa.grupos!.map((dest) => (
                                  <option key={dest.nome} value={dest.nome}>
                                    {dest.nome}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {previa.partidas && previa.partidas.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200/80 overflow-x-auto max-h-56 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-[10px] uppercase text-slate-400 border-b border-slate-100 sticky top-0">
                        <tr>
                          <th className="px-3.5 py-2">Jogo</th>
                          <th className="px-3.5 py-2">Fase</th>
                          <th className="px-3.5 py-2">Confronto</th>
                          <th className="px-3.5 py-2">Horário</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previa.partidas.map((p) => (
                          <tr key={p.numeroJogo}>
                            <td className="px-3.5 py-2 font-mono text-slate-400">J{p.numeroJogo}</td>
                            <td className="px-3.5 py-2 font-medium text-emerald-700">
                              {p.fase === 'GRUPOS' ? p.grupo : FASES_LABEL[p.fase] || p.fase}
                            </td>
                            <td className="px-3.5 py-2 font-semibold text-slate-800">
                              {p.escolaASigla} <span className="text-slate-300 font-normal">×</span> {p.escolaBSigla}
                            </td>
                            <td className="px-3.5 py-2 text-slate-500">
                              {p.horario} · {p.local}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* LISTA DE COMPETIÇÕES PUBLICADAS                                  */}
      {/* ================================================================ */}
      <div className="space-y-3">
        {chaveamentos.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-10 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700">Nenhuma competição criada ainda</p>
            <p className="text-xs text-slate-400">
              Use os botões acima para criar um Chaveamento ou uma Tabela de Pontos Corridos.
            </p>
          </div>
        ) : (
          chaveamentos.map((ch) => {
            const partidasDoChav = partidas.filter(
              (p) =>
                normalizarCodigoModalidade(p.modalidadeCodigo) === normalizarCodigoModalidade(ch.modalidadeCodigo) &&
                p.categoria === ch.categoria &&
                p.sexo === ch.sexo
            );
            const encerrados = partidasDoChav.filter((p) => p.status === 'ENCERRADO' || p.status === 'WO').length;
            const progresso = partidasDoChav.length > 0 ? Math.round((encerrados / partidasDoChav.length) * 100) : 0;
            const expandido = chaveamentoExpandidoId === ch.id;
            let estrutura: any = null;
            try {
              estrutura = ch.estruturaJson ? JSON.parse(ch.estruturaJson) : null;
            } catch {
              estrutura = null;
            }
            const fin: FinalizacaoCampeonato | null = estrutura?.finalizacao || null;
            const isTabela = ch.formato === 'BERGER_UNICO';

            return (
              <div
                key={ch.id}
                className={`bg-white border rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-4 transition-all ${
                  ch.status === 'FINALIZADO'
                    ? 'border-amber-300/90 border-l-4 border-l-amber-400'
                    : expandido
                    ? 'border-[#00A878]/50'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setChaveamentoExpandidoId(expandido ? null : ch.id)}
                    className="text-left flex-1 min-w-0 cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-slate-900">
                        {ch.modalidadeNome} · {ch.categoria} · {ch.sexo === 'MASCULINO' ? 'Masculino' : 'Feminino'}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {isTabela
                          ? 'Pontos Corridos'
                          : ch.formato === 'MATA_MATA'
                          ? 'Copinha'
                          : ch.formato === 'BALIZAMENTO_ATLETISMO'
                          ? 'Atletismo'
                          : ch.formato === 'SUICO_XADREZ'
                          ? 'Xadrez'
                          : 'Grupos + Mata-Mata'}
                      </span>
                      {ch.status === 'FINALIZADO' && (
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
                          🏆 {fin?.campeao ? fin.campeao.sigla : 'Finalizado'}
                        </span>
                      )}
                      {ch.status === 'CONGELADO' && (
                        <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Congelado
                        </span>
                      )}
                    </div>

                    {partidasDoChav.length > 0 && (
                      <div className="flex items-center gap-2.5 max-w-xs">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#00A878] transition-all"
                            style={{ width: `${progresso}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-400 tabular-nums">
                          {encerrados}/{partidasDoChav.length} jogos
                        </span>
                      </div>
                    )}
                  </button>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setChaveamentoExpandidoId(expandido ? null : ch.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                        expandido
                          ? 'bg-slate-900 text-white'
                          : 'bg-emerald-50 hover:bg-[#00A878] text-emerald-800 hover:text-white'
                      }`}
                    >
                      {expandido ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>{expandido ? 'Fechar' : isTabela ? 'Abrir Tabela' : 'Abrir Chave'}</span>
                    </button>

                    {ch.status === 'RASCUNHO' && (
                      <button
                        type="button"
                        disabled={salvando}
                        onClick={() => handleCongelarChaveamento(ch)}
                        className="p-2 rounded-xl text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 cursor-pointer transition-colors"
                        title="Congelar chaveamento"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => gerarPdfChaveamentoOficial(ch, partidasDoChav)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>

                    {confirmandoExclusaoId === ch.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 border border-rose-200 rounded-xl px-2.5 py-1">
                        <span className="text-[11px] font-semibold text-rose-800">Excluir?</span>
                        <button
                          type="button"
                          disabled={salvando}
                          onClick={() => handleExcluirChaveamento(ch)}
                          className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer disabled:opacity-50"
                        >
                          {salvando ? '...' : 'Sim'}
                        </button>
                        <button
                          type="button"
                          disabled={salvando}
                          onClick={() => setConfirmandoExclusaoId(null)}
                          className="px-2 py-0.5 rounded-lg bg-white text-slate-600 border border-slate-200 text-[11px] font-semibold cursor-pointer"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={salvando}
                        onClick={() => setConfirmandoExclusaoId(ch.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                        title="Excluir competição"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* COLETIVAS & TÊNIS DE MESA */}
                {expandido &&
                  ch.formato !== 'BALIZAMENTO_ATLETISMO' &&
                  ch.formato !== 'SUICO_XADREZ' && (
                    <ChaveamentoInterativo
                      municipioId={municipioId}
                      chaveamento={ch}
                      partidas={partidasDoChav}
                      escolas={escolas}
                      artilharia={artilharia}
                      onAtualizado={onAtualizado}
                    />
                  )}

                {/* ATLETISMO */}
                {expandido && ch.formato === 'BALIZAMENTO_ATLETISMO' && Array.isArray(estrutura?.provas) && (
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    {(estrutura.provas as ProvaAtletismoBalizamento[]).map((pr) => (
                      <div key={pr.prova} className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/70 space-y-2.5">
                        <p className="text-xs font-bold text-slate-800 uppercase">{pr.prova}</p>
                        {pr.series.map((s) => (
                          <div key={s.numero} className="space-y-1.5">
                            <p className="text-[11px] font-semibold text-slate-500">{s.nome}</p>
                            {s.raias.map((r) => (
                              <div
                                key={r.raia}
                                className="grid grid-cols-12 gap-2 items-center bg-white px-3 py-2 rounded-xl border border-slate-200/70 text-xs"
                              >
                                <span className="col-span-1 font-bold text-[#00A878]">R{r.raia}</span>
                                <span className="col-span-5 font-semibold text-slate-800 truncate">{r.atletaNome}</span>
                                <span className="col-span-2 text-slate-400 truncate">{r.escolaSigla}</span>
                                <input
                                  type="text"
                                  defaultValue={r.marca}
                                  placeholder="Marca"
                                  onBlur={(e) =>
                                    handleAtualizarRaiaAtletismo(ch, pr.prova, s.numero, r.raia, 'marca', e.target.value)
                                  }
                                  className="col-span-2 px-2 py-1 rounded-lg border border-slate-200 text-xs"
                                />
                                <input
                                  type="number"
                                  min={1}
                                  max={20}
                                  defaultValue={r.posicao ?? ''}
                                  placeholder="Pos."
                                  onBlur={(e) =>
                                    handleAtualizarRaiaAtletismo(ch, pr.prova, s.numero, r.raia, 'posicao', e.target.value)
                                  }
                                  className="col-span-2 px-2 py-1 rounded-lg border border-slate-200 text-xs"
                                />
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* XADREZ */}
                {expandido && ch.formato === 'SUICO_XADREZ' && estrutura?.rodadas && (
                  <div className="border-t border-slate-100 pt-4 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-semibold text-slate-500">
                        Sistema {estrutura.sistema} · {estrutura.rodadas.length}/{estrutura.totalRodadasPrevistas} rodadas
                      </span>
                      {estrutura.sistema === 'SUICO' &&
                        estrutura.rodadas.length < estrutura.totalRodadasPrevistas && (
                          <button
                            type="button"
                            disabled={salvando}
                            onClick={() => handleGerarProximaRodadaXadrez(ch)}
                            className="px-3.5 py-1.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Gerar {estrutura.rodadas.length + 1}ª Rodada</span>
                          </button>
                        )}
                    </div>

                    {(estrutura as EstruturaXadrez).rodadas.map((rod) => (
                      <div key={rod.numero} className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/70 space-y-2">
                        <p className="text-xs font-bold text-slate-700">{rod.numero}ª Rodada</p>
                        {rod.mesas.map((m) => (
                          <div
                            key={m.mesa}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200/70 text-xs"
                          >
                            <div>
                              <span className="font-mono text-slate-400 mr-2">M{m.mesa}</span>
                              <span className="font-semibold text-slate-800">{m.brancasNome}</span>{' '}
                              <span className="text-slate-300">×</span>{' '}
                              {m.pretasId === 'BYE' ? (
                                <span className="text-[#00A878] font-bold">BYE</span>
                              ) : (
                                <span className="font-semibold text-slate-800">{m.pretasNome}</span>
                              )}
                            </div>
                            {m.pretasId !== 'BYE' && (
                              <select
                                value={m.resultado}
                                onChange={(e) =>
                                  handleAtualizarMesaXadrez(ch, rod.numero, m.mesa, e.target.value as any)
                                }
                                className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
                              >
                                <option value="PENDENTE">Pendente</option>
                                <option value="1-0">1 - 0 (Brancas)</option>
                                <option value="0.5-0.5">½ - ½ (Empate)</option>
                                <option value="0-1">0 - 1 (Pretas)</option>
                              </select>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}

                    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="text-[10px] uppercase text-slate-400 border-b border-slate-100">
                          <tr>
                            <th className="px-4 py-2">#</th>
                            <th className="px-3 py-2">Enxadrista</th>
                            <th className="px-3 py-2">Escola</th>
                            <th className="px-3 py-2 text-center">J</th>
                            <th className="px-3 py-2 text-center">Pts</th>
                            <th className="px-3 py-2 text-center">Buchholz</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 tabular-nums">
                          {calcularClassificacaoXadrez(estrutura as EstruturaXadrez).map((c, idx) => (
                            <tr key={c.id}>
                              <td className="px-4 py-2 font-bold text-slate-600">{idx + 1}º</td>
                              <td className="px-3 py-2 font-semibold text-slate-900">{c.nome}</td>
                              <td className="px-3 py-2 text-slate-500">{c.sigla}</td>
                              <td className="px-3 py-2 text-center text-slate-500">{c.jogos}</td>
                              <td className="px-3 py-2 text-center font-black text-emerald-700">{c.pontos.toFixed(1)}</td>
                              <td className="px-3 py-2 text-center font-mono text-slate-500">{c.buchholz.toFixed(1)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      {/* ================================================================ */}
      {/* MODAL DE CONFERÊNCIA DOS ALUNOS INSCRITOS NA EQUIPE              */}
      {/* ================================================================ */}
      {participanteInspecionado && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setParticipanteInspecionado(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900">{participanteInspecionado.nome}</h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      participanteInspecionado.statusHomologacao === 'VALIDADA'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {participanteInspecionado.statusHomologacao}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {modObj.nome} · {categoria} · {sexo === 'MASCULINO' ? 'Masculino' : 'Feminino'} ·{' '}
                  {participanteInspecionado.atletasDetalhes?.length || 0} aluno(s) inscrito(s)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setParticipanteInspecionado(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alertas da equipe (se houver) */}
            {participanteInspecionado.alertas.length > 0 && (
              <div className="px-5 py-2.5 bg-amber-50/70 border-b border-amber-100 text-xs text-amber-900 font-medium">
                {participanteInspecionado.alertas.join(' · ')}
              </div>
            )}

            {/* Lista de alunos */}
            <div className="p-5 overflow-y-auto flex-1 space-y-2">
              {!participanteInspecionado.atletasDetalhes ||
              participanteInspecionado.atletasDetalhes.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Nenhum aluno vinculado a esta inscrição.
                </div>
              ) : (
                participanteInspecionado.atletasDetalhes.map((al, idx) => {
                  const nascBr = al.dataNascimento
                    ? al.dataNascimento.split('-').reverse().join('/')
                    : '-';
                  return (
                    <div
                      key={al.id}
                      className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-slate-200/80 bg-slate-50/40 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {al.fotoUrl ? (
                          <img
                            src={al.fotoUrl}
                            alt={al.nomeCompleto}
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[11px] font-bold shrink-0">
                            {idx + 1}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{al.nomeCompleto}</p>
                          <p className="text-[11px] text-slate-500">
                            Nasc.: {nascBr} ·{' '}
                            {al.semDocumento ? (
                              <span className="text-rose-600 font-semibold">Sem documento</span>
                            ) : (
                              <span>
                                {al.documentoTipo} {al.documentoNumero}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          al.semDocumento
                            ? 'bg-rose-100 text-rose-700'
                            : al.conferido
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {al.semDocumento ? 'Pendente Doc.' : al.conferido ? 'Conferido' : 'OK'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Rodapé do modal */}
            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  toggleParticipante(participanteInspecionado.id);
                  setParticipanteInspecionado(null);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  excluidosIds.includes(participanteInspecionado.id)
                    ? 'bg-[#00A878] hover:bg-[#087A5B] text-white'
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                }`}
              >
                {excluidosIds.includes(participanteInspecionado.id)
                  ? '+ Recolocar no sorteio'
                  : 'Remover esta equipe do sorteio'}
              </button>
              <button
                type="button"
                onClick={() => setParticipanteInspecionado(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
