'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Shuffle,
  Lock,
  Printer,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Trophy,
  Table2,
  Users,
  X,
  Eye,
  Sparkles,
} from 'lucide-react';
import { Atleta, Escola, InscricaoEquipe, ModalidadeConfig } from '@/types/jegd';
import {
  ArtilhariaEventoItem,
  ChaveamentoEventoItem,
  PartidaEventoItem,
} from '@/types/eventos';
import { EventosApi, CATEGORIAS_EVENTOS } from '@/lib/eventos-service';
import {
  auditarCategoriaParaChaveamento,
  gerarSeedAuditavel,
  gerarChaveamentoColetivoOuTenisMesa,
  gerarBalizamentoAtletismo,
  gerarTorneioXadrezInicial,
  gerarProximaRodadaSuica,
  calcularClassificacaoXadrez,
  normalizarCodigoModalidade,
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

type ModeloEscolha = 'MATA_MATA' | 'BERGER_UNICO' | 'GRUPOS_MATA_MATA';

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

  // Filtro simples dos chaveamentos criados
  const [filtroModLista, setFiltroModLista] = useState<string>('TODAS');
  const [chaveamentoExpandidoId, setChaveamentoExpandidoId] = useState<string | null>(
    chaveamentos[0]?.id || null
  );

  // Modal compacto "+ Novo Chaveamento"
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [mostrarAgenda, setMostrarAgenda] = useState(false);

  const [modCodigo, setModCodigo] = useState('futsal');
  const [categoria, setCategoria] = useState('INFANTIL');
  const [sexo, setSexo] = useState('MASCULINO');
  const [modelo, setModelo] = useState<ModeloEscolha>('MATA_MATA');
  const [incluirTerceiroLugar, setIncluirTerceiroLugar] = useState(true);
  const [dataEvento, setDataEvento] = useState(hojeIso);
  const [horaInicio, setHoraInicio] = useState('08:30');
  const [intervaloMinutos, setIntervaloMinutos] = useState(30);
  const [quadrasStr, setQuadrasStr] = useState('Quadra 01, Quadra 02');
  const [rodadasXadrez, setRodadasXadrez] = useState(5);
  const [excluidosIds, setExcluidosIds] = useState<string[]>([]);

  const [salvando, setSalvando] = useState(false);
  const [confirmandoExclusaoId, setConfirmandoExclusaoId] = useState<string | null>(null);
  const [participanteInspecionado, setParticipanteInspecionado] = useState<ParticipanteChaveamento | null>(null);

  const modObj = useMemo(
    () => MODALIDADES_OFICIAIS.find((m) => m.codigo === modCodigo) || MODALIDADES_OFICIAIS[0],
    [modCodigo]
  );

  const permitePontosCorridos = MODALIDADES_PONTOS_CORRIDOS.includes(modObj.codigo);

  // Se trocar para modalidade que não usa pontos corridos, volta para Mata-Mata
  useEffect(() => {
    if (!permitePontosCorridos && modelo === 'BERGER_UNICO') {
      setModelo('MATA_MATA');
    }
  }, [permitePontosCorridos, modelo]);

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

  // Auto-desmarca equipes com 0 atletas ou abaixo do mínimo ao trocar categoria
  useEffect(() => {
    const irregulares = auditoria.participantes
      .filter(
        (p) =>
          (p.totalAtletas !== undefined && p.totalAtletas === 0) ||
          p.alertas.some((al) => al.includes('Abaixo do mínimo'))
      )
      .map((p) => p.id);
    setExcluidosIds(irregulares);
  }, [modObj.codigo, categoria, sexo, auditoria.participantes.length]);

  const participantesAtivos = useMemo(
    () => auditoria.participantes.filter((p) => !excluidosIds.includes(p.id)),
    [auditoria.participantes, excluidosIds]
  );

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

  const toggleParticipante = (id: string) => {
    setExcluidosIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Modalidades que possuem chaveamentos criados (para o filtro limpo)
  const modsNosChaveamentos = useMemo(() => {
    const set = new Set<string>();
    chaveamentos.forEach((c) => set.add(normalizarCodigoModalidade(c.modalidadeCodigo)));
    return MODALIDADES_OFICIAIS.filter((m) => set.has(m.codigo));
  }, [chaveamentos]);

  const chaveamentosFiltrados = useMemo(() => {
    if (filtroModLista === 'TODAS') return chaveamentos;
    return chaveamentos.filter(
      (c) => normalizarCodigoModalidade(c.modalidadeCodigo) === filtroModLista
    );
  }, [chaveamentos, filtroModLista]);

  // 1 CLIQUE: Sortear & Criar Agora!
  const handleSortearECriarAgora = async () => {
    const norm = normalizarCodigoModalidade(modObj.codigo);
    const novaSeed = gerarSeedAuditavel();
    const currentUser = JegdStorage.getCurrentUser();
    const operador = currentUser?.nome || 'Coordenação SEMED';

    let formatoFinal: string = modelo;
    let estruturaPayload: any = {};
    let partidasGeradas: any[] = [];

    if (norm === 'atletismo') {
      if (participantesAtivos.length === 0) {
        alert('Nenhum atleta inscrito em Atletismo para esta categoria/naipe.');
        return;
      }
      formatoFinal = 'BALIZAMENTO_ATLETISMO';
      estruturaPayload = {
        provas: gerarBalizamentoAtletismo({
          participantes: participantesAtivos,
          seed: novaSeed,
          maxRaiasPorSerie: 8,
        }),
      };
    } else if (norm === 'xadrez') {
      if (participantesAtivos.length < 2) {
        alert('Selecione pelo menos 2 enxadristas.');
        return;
      }
      formatoFinal = 'SUICO_XADREZ';
      estruturaPayload = gerarTorneioXadrezInicial({
        participantes: participantesAtivos,
        seed: novaSeed,
        totalRodadas: rodadasXadrez,
      });
    } else {
      if (participantesAtivos.length < 2) {
        alert('Selecione pelo menos 2 equipes/participantes.');
        return;
      }

      const formatoColetivo: 'GRUPOS_MATA_MATA' | 'MATA_MATA' | 'BERGER_UNICO' | 'FINAL_DIRETA' | 'GRUPOS_TENIS_MESA' =
        modelo === 'BERGER_UNICO'
          ? 'BERGER_UNICO'
          : norm === 'tenis_mesa'
          ? modelo === 'MATA_MATA'
            ? 'MATA_MATA'
            : 'GRUPOS_TENIS_MESA'
          : participantesAtivos.length === 2
          ? 'FINAL_DIRETA'
          : modelo === 'MATA_MATA'
          ? 'MATA_MATA'
          : participantesAtivos.length <= 5
          ? 'BERGER_UNICO'
          : 'GRUPOS_MATA_MATA';

      formatoFinal = formatoColetivo;
      const maxNumExistente = partidas.reduce((max, p) => Math.max(max, p.numeroJogo || 0), 0);
      const gerado = gerarChaveamentoColetivoOuTenisMesa({
        participantes: participantesAtivos,
        modalidadeCodigo: norm,
        modalidadeNome: modObj.nome,
        categoria,
        sexo,
        formato: formatoColetivo,
        seed: novaSeed,
        dataEvento,
        horaInicio,
        intervaloMinutos: Number(intervaloMinutos) || 30,
        quadras: quadrasStr.split(','),
        numeroJogoInicial: maxNumExistente + 1,
        incluirTerceiroLugar,
      });
      estruturaPayload = { grupos: gerado.grupos };
      partidasGeradas = gerado.partidas;
    }

    try {
      setSalvando(true);
      const res = await EventosApi.criar('chaveamento', {
        municipioId,
        substituirExistenteId: chaveamentoDuplicado?.id || null,
        modalidadeCodigo: norm,
        modalidadeNome: modObj.nome,
        categoria,
        sexo,
        formato: formatoFinal,
        seed: novaSeed,
        status: 'RASCUNHO',
        criadoPor: operador,
        auditoriaJson: JSON.stringify({
          semaforo: auditoria.semaforo,
          resumo: auditoria.resumo,
          geradoEm: new Date().toISOString(),
        }),
        estruturaJson: JSON.stringify(estruturaPayload),
        partidas: partidasGeradas,
      });
      setModalNovoAberto(false);
      await onAtualizado();
      if (res?.chaveamento?.id) {
        setChaveamentoExpandidoId(res.chaveamento.id);
      }
    } catch (err: any) {
      alert(err?.message || 'Erro ao criar chaveamento');
    } finally {
      setSalvando(false);
    }
  };

  // Re-sortear em 1 clique um chaveamento que ainda não teve jogos iniciados
  const handleResortearExistente = async (ch: ChaveamentoEventoItem) => {
    const norm = normalizarCodigoModalidade(ch.modalidadeCodigo);
    let estrutura: any = null;
    try {
      estrutura = ch.estruturaJson ? JSON.parse(ch.estruturaJson) : null;
    } catch {
      estrutura = null;
    }
    const participantesOriginais: ParticipanteChaveamento[] = Array.isArray(estrutura?.grupos)
      ? estrutura.grupos.flatMap((g: any) => g.participantes || [])
      : [];

    if (participantesOriginais.length < 2) {
      alert('Não foi possível identificar os participantes para re-sortear.');
      return;
    }

    const novaSeed = gerarSeedAuditavel();
    const maxNumExistente = partidas.reduce((max, p) => Math.max(max, p.numeroJogo || 0), 0);
    const gerado = gerarChaveamentoColetivoOuTenisMesa({
      participantes: participantesOriginais,
      modalidadeCodigo: norm,
      modalidadeNome: ch.modalidadeNome,
      categoria: ch.categoria,
      sexo: ch.sexo,
      formato: ch.formato as any,
      seed: novaSeed,
      dataEvento: hojeIso,
      horaInicio,
      intervaloMinutos: Number(intervaloMinutos) || 30,
      quadras: quadrasStr.split(','),
      numeroJogoInicial: maxNumExistente + 1,
      incluirTerceiroLugar,
    });

    try {
      setSalvando(true);
      const res = await EventosApi.criar('chaveamento', {
        municipioId: municipioId || ch.municipioId,
        substituirExistenteId: ch.id,
        modalidadeCodigo: norm,
        modalidadeNome: ch.modalidadeNome,
        categoria: ch.categoria,
        sexo: ch.sexo,
        formato: ch.formato,
        seed: novaSeed,
        status: 'RASCUNHO',
        criadoPor: ch.criadoPor,
        auditoriaJson: ch.auditoriaJson,
        estruturaJson: JSON.stringify({ grupos: gerado.grupos }),
        partidas: gerado.partidas,
      });
      await onAtualizado();
      if (res?.chaveamento?.id) {
        setChaveamentoExpandidoId(res.chaveamento.id);
      }
    } catch (err: any) {
      alert(err?.message || 'Erro ao re-sortear');
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
      alert(err.message || 'Erro ao congelar');
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
      alert(err.message || 'Erro ao excluir');
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
      alert(err.message || 'Erro ao atualizar mesa');
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
      alert(err.message || 'Erro ao gerar próxima rodada');
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
      alert(err.message || 'Erro ao salvar marca');
    }
  };

  return (
    <div className="space-y-5">
      {/* ================================================================ */}
      {/* BARRA ULTRA-LIMPA: TÍTULO + FILTRO SIMPLES + BOTÃO "+ NOVO"      */}
      {/* ================================================================ */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="text-base font-black text-[#0F2540] tracking-tight">
            Chaveamentos & Tabelas
          </h3>
          {modsNosChaveamentos.length > 1 && (
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => setFiltroModLista('TODAS')}
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                  filtroModLista === 'TODAS'
                    ? 'bg-[#0F2540] text-white'
                    : 'bg-[#F4F6F8] text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                Todas ({chaveamentos.length})
              </button>
              {modsNosChaveamentos.map((m) => (
                <button
                  key={m.codigo}
                  type="button"
                  onClick={() => setFiltroModLista(m.codigo)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                    filtroModLista === m.codigo
                      ? 'bg-[#0F2540] text-white'
                      : 'bg-[#F4F6F8] text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {m.nome}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setModalNovoAberto(true)}
          className="px-4 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Chaveamento</span>
        </button>
      </div>

      {/* ================================================================ */}
      {/* LISTA DE CHAVEAMENTOS CRIADOS                                    */}
      {/* ================================================================ */}
      <div className="space-y-3">
        {chaveamentosFiltrados.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center space-y-3">
            <p className="text-sm font-bold text-[#0F2540]">Nenhum chaveamento criado ainda</p>
            <p className="text-xs text-slate-400">
              Clique em &quot;Novo Chaveamento&quot; para sortear e começar em segundos.
            </p>
            <button
              type="button"
              onClick={() => setModalNovoAberto(true)}
              className="px-4 py-2 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Criar Primeiro Chaveamento</span>
            </button>
          </div>
        ) : (
          chaveamentosFiltrados.map((ch) => {
            const partidasDoChav = partidas.filter(
              (p) =>
                normalizarCodigoModalidade(p.modalidadeCodigo) === normalizarCodigoModalidade(ch.modalidadeCodigo) &&
                p.categoria === ch.categoria &&
                p.sexo === ch.sexo
            );
            const encerrados = partidasDoChav.filter((p) => p.status === 'ENCERRADO' || p.status === 'WO').length;
            const algumIniciado = partidasDoChav.some(
              (p) => p.status !== 'AGENDADO' || p.placarA > 0 || p.placarB > 0
            );
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
            const podeResortear =
              !algumIniciado &&
              ch.status === 'RASCUNHO' &&
              ch.formato !== 'BALIZAMENTO_ATLETISMO' &&
              ch.formato !== 'SUICO_XADREZ';

            return (
              <div
                key={ch.id}
                className={`bg-white border rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4 transition-all ${
                  ch.status === 'FINALIZADO'
                    ? 'border-amber-300 border-l-4 border-l-amber-400'
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
                      <span className="text-sm font-black text-[#0F2540]">
                        {ch.modalidadeNome} · {ch.categoria} · {ch.sexo === 'MASCULINO' ? 'Masculino' : 'Feminino'}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F4F6F8] text-slate-600">
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
                          ? 'bg-[#0F2540] text-white'
                          : 'bg-emerald-50 hover:bg-[#00A878] text-[#087A5B] hover:text-white'
                      }`}
                    >
                      {expandido ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>{expandido ? 'Fechar' : isTabela ? 'Abrir Tabela' : 'Abrir Chave'}</span>
                    </button>

                    {podeResortear && (
                      <button
                        type="button"
                        disabled={salvando}
                        onClick={() => handleResortearExistente(ch)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#F4F6F8] hover:bg-slate-200 text-[#0F2540] text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        title="Gerar um novo sorteio para estas mesmas equipes"
                      >
                        <Shuffle className="w-3.5 h-3.5 text-[#00A878]" />
                        <span>Re-sortear</span>
                      </button>
                    )}

                    {ch.status === 'RASCUNHO' && (
                      <button
                        type="button"
                        disabled={salvando}
                        onClick={() => handleCongelarChaveamento(ch)}
                        className="p-2 rounded-xl text-slate-400 hover:text-[#00A878] hover:bg-emerald-50 cursor-pointer"
                        title="Congelar chaveamento"
                      >
                        <Lock className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => gerarPdfChaveamentoOficial(ch, partidasDoChav)}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-semibold flex items-center gap-1 cursor-pointer"
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
                          className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[11px] font-bold cursor-pointer"
                        >
                          Sim
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
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
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
                      <div key={pr.prova} className="bg-[#F4F6F8] rounded-xl p-4 space-y-2">
                        <p className="text-xs font-black text-[#0F2540] uppercase">{pr.prova}</p>
                        {pr.series.map((s) => (
                          <div key={s.numero} className="space-y-1.5">
                            <p className="text-[11px] font-semibold text-slate-500">{s.nome}</p>
                            {s.raias.map((r) => (
                              <div key={r.raia} className="grid grid-cols-12 gap-2 items-center bg-white px-3 py-2 rounded-lg text-xs">
                                <span className="col-span-1 font-bold text-[#00A878]">R{r.raia}</span>
                                <span className="col-span-5 font-semibold text-[#0F2540] truncate">{r.atletaNome}</span>
                                <span className="col-span-2 text-slate-400 truncate">{r.escolaSigla}</span>
                                <input
                                  type="text"
                                  defaultValue={r.marca}
                                  placeholder="Marca"
                                  onBlur={(e) => handleAtualizarRaiaAtletismo(ch, pr.prova, s.numero, r.raia, 'marca', e.target.value)}
                                  className="col-span-2 px-2 py-1 rounded border border-slate-200 text-xs"
                                />
                                <input
                                  type="number"
                                  min={1}
                                  max={20}
                                  defaultValue={r.posicao ?? ''}
                                  placeholder="Pos."
                                  onBlur={(e) => handleAtualizarRaiaAtletismo(ch, pr.prova, s.numero, r.raia, 'posicao', e.target.value)}
                                  className="col-span-2 px-2 py-1 rounded border border-slate-200 text-xs"
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
                            className="px-3.5 py-1.5 rounded-xl bg-[#00A878] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Gerar {estrutura.rodadas.length + 1}ª Rodada</span>
                          </button>
                        )}
                    </div>

                    {(estrutura as EstruturaXadrez).rodadas.map((rod) => (
                      <div key={rod.numero} className="bg-[#F4F6F8] rounded-xl p-4 space-y-1.5">
                        <p className="text-xs font-bold text-[#0F2540]">{rod.numero}ª Rodada</p>
                        {rod.mesas.map((m) => (
                          <div key={m.mesa} className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-lg text-xs">
                            <span>
                              <span className="font-mono text-slate-400 mr-2">M{m.mesa}</span>
                              <strong>{m.brancasNome}</strong> ×{' '}
                              {m.pretasId === 'BYE' ? <strong className="text-[#00A878]">BYE</strong> : <strong>{m.pretasNome}</strong>}
                            </span>
                            {m.pretasId !== 'BYE' && (
                              <select
                                value={m.resultado}
                                onChange={(e) => handleAtualizarMesaXadrez(ch, rod.numero, m.mesa, e.target.value as any)}
                                className="px-2 py-1 rounded border border-slate-200 text-xs font-semibold bg-white"
                              >
                                <option value="PENDENTE">Pendente</option>
                                <option value="1-0">1 - 0</option>
                                <option value="0.5-0.5">½ - ½</option>
                                <option value="0-1">0 - 1</option>
                              </select>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}

                    <div className="bg-[#F4F6F8] rounded-xl p-3 overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="text-[10px] uppercase text-slate-400">
                          <tr>
                            <th className="px-3 py-1.5">#</th>
                            <th className="px-3 py-1.5">Enxadrista</th>
                            <th className="px-3 py-1.5">Escola</th>
                            <th className="px-3 py-1.5 text-center">J</th>
                            <th className="px-3 py-1.5 text-center">Pts</th>
                            <th className="px-3 py-1.5 text-center">Buchholz</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/70 tabular-nums">
                          {calcularClassificacaoXadrez(estrutura as EstruturaXadrez).map((c, idx) => (
                            <tr key={c.id} className="bg-white">
                              <td className="px-3 py-2 font-bold text-[#0F2540]">{idx + 1}º</td>
                              <td className="px-3 py-2 font-semibold text-[#0F2540]">{c.nome}</td>
                              <td className="px-3 py-2 text-slate-500">{c.sigla}</td>
                              <td className="px-3 py-2 text-center text-slate-500">{c.jogos}</td>
                              <td className="px-3 py-2 text-center font-black text-[#00A878]">{c.pontos.toFixed(1)}</td>
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
      {/* MODAL RÁPIDO: NOVO CHAVEAMENTO (2 CLIQUES)                       */}
      {/* ================================================================ */}
      {modalNovoAberto && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setModalNovoAberto(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-[#0F2540]">Novo Chaveamento</h4>
                <p className="text-xs text-slate-400">Escolha a categoria, o modelo e clique em Sortear & Abrir.</p>
              </div>
              <button
                type="button"
                onClick={() => setModalNovoAberto(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corpo enxuto */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Linha 1: Modalidade, Categoria e Naipe */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Modalidade</label>
                  <select
                    value={modCodigo}
                    onChange={(e) => setModCodigo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-[#0F2540] bg-white"
                  >
                    {MODALIDADES_OFICIAIS.map((m) => (
                      <option key={m.codigo} value={m.codigo}>{m.nome}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Categoria</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-[#0F2540] bg-white"
                  >
                    {CATEGORIAS_EVENTOS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Naipe</label>
                  <select
                    value={sexo}
                    onChange={(e) => setSexo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-[#0F2540] bg-white"
                  >
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMININO">Feminino</option>
                  </select>
                </div>
              </div>

              {/* Linha 2: Modelo (seletor direto) */}
              {modObj.codigo !== 'atletismo' && modObj.codigo !== 'xadrez' && (
                <div className={`grid grid-cols-1 ${permitePontosCorridos ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-2`}>
                  <button
                    type="button"
                    onClick={() => setModelo('MATA_MATA')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      modelo === 'MATA_MATA'
                        ? 'bg-emerald-50/70 border-[#00A878] text-[#0F2540]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Trophy className="w-4 h-4 text-[#00A878] shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Mata-Mata (Copinha)</p>
                      <p className="text-[10px] text-slate-400">Quem ganha avança</p>
                    </div>
                  </button>

                  {permitePontosCorridos && (
                    <button
                      type="button"
                      onClick={() => setModelo('BERGER_UNICO')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        modelo === 'BERGER_UNICO'
                          ? 'bg-emerald-50/70 border-[#00A878] text-[#0F2540]'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Table2 className="w-4 h-4 text-[#00A878] shrink-0" />
                      <div>
                        <p className="text-xs font-bold">Pontos Corridos</p>
                        <p className="text-[10px] text-slate-400">Vitória +3 pts · Brasileirão</p>
                      </div>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setModelo('GRUPOS_MATA_MATA')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      modelo === 'GRUPOS_MATA_MATA'
                        ? 'bg-emerald-50/70 border-[#00A878] text-[#0F2540]'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Users className="w-4 h-4 text-[#00A878] shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Grupos + Mata-Mata</p>
                      <p className="text-[10px] text-slate-400">Grupos e semifinais</p>
                    </div>
                  </button>
                </div>
              )}

              {chaveamentoDuplicado && (
                <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                  Já existe um chaveamento para esta categoria. Ao confirmar, o atual será substituído.
                </div>
              )}

              {/* Linha 3: Equipes (já filtrando automaticamente abaixo do mínimo) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#0F2540]">
                    Equipes no sorteio ({participantesAtivos.length}/{auditoria.participantes.length})
                  </span>
                  {auditoria.participantes.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setExcluidosIds([])}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold cursor-pointer"
                      >
                        Todas
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setExcluidosIds(
                            auditoria.participantes
                              .filter((p) => p.statusHomologacao !== 'VALIDADA')
                              .map((p) => p.id)
                          )
                        }
                        className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-[#087A5B] font-semibold cursor-pointer"
                      >
                        Só Validadas
                      </button>
                    </div>
                  )}
                </div>

                {auditoria.participantes.length === 0 ? (
                  <div className="p-4 rounded-xl bg-[#F4F6F8] text-slate-500 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Nenhum participante inscrito nesta categoria.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
                      {participantesAtivos.map((p) => (
                        <div
                          key={p.id}
                          className="px-3 py-2 rounded-xl border border-slate-200/80 bg-[#F8FAFC] flex items-center justify-between gap-2 text-xs"
                        >
                          <button
                            type="button"
                            onClick={() => setParticipanteInspecionado(p)}
                            className="min-w-0 flex-1 text-left cursor-pointer group"
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  p.statusHomologacao === 'VALIDADA' ? 'bg-[#00A878]' : 'bg-amber-400'
                                }`}
                              />
                              <span className="font-bold text-[#0F2540] group-hover:text-[#00A878] truncate">
                                {p.sigla}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 pl-3.5 inline-flex items-center gap-1">
                              {p.totalAtletas ?? 1} atleta(s) · <Eye className="w-2.5 h-2.5 text-[#00A878]" /> ver
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleParticipante(p.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Tirar do sorteio"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {excluidosIds.length > 0 && (
                      <div className="px-3 py-2 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Fora do sorteio:</span>
                        {auditoria.participantes
                          .filter((p) => excluidosIds.includes(p.id))
                          .map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => toggleParticipante(p.id)}
                              className="px-2 py-0.5 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 text-[11px] font-semibold text-slate-500 hover:text-[#087A5B] flex items-center gap-1 cursor-pointer"
                              title={p.alertas.join(' · ')}
                            >
                              <Plus className="w-3 h-3" />
                              <span>{p.sigla} ({p.totalAtletas ?? 0})</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Agenda opcional recolhida */}
              <div>
                <button
                  type="button"
                  onClick={() => setMostrarAgenda((v) => !v)}
                  className="text-[11px] font-semibold text-slate-400 hover:text-[#0F2540] flex items-center gap-1.5 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>{mostrarAgenda ? 'Ocultar data, horário e quadras' : 'Configurar data, horário e quadras (opcional)'}</span>
                </button>
                {mostrarAgenda && (
                  <div className="mt-2.5 p-3 rounded-xl bg-[#F4F6F8] grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    {modObj.codigo === 'xadrez' ? (
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Rodadas</label>
                        <input
                          type="number"
                          min={3}
                          max={7}
                          value={rodadasXadrez}
                          onChange={(e) => setRodadasXadrez(Number(e.target.value) || 5)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Data</label>
                          <input
                            type="date"
                            value={dataEvento}
                            onChange={(e) => setDataEvento(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Início / Min</label>
                          <div className="flex gap-1">
                            <input
                              type="time"
                              value={horaInicio}
                              onChange={(e) => setHoraInicio(e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                            />
                            <input
                              type="number"
                              min={10}
                              max={120}
                              value={intervaloMinutos}
                              onChange={(e) => setIntervaloMinutos(Number(e.target.value) || 30)}
                              className="w-14 px-2 py-1.5 rounded-lg border border-slate-200 bg-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Quadras</label>
                          <input
                            type="text"
                            value={quadrasStr}
                            onChange={(e) => setQuadrasStr(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                          />
                        </div>
                      </>
                    )}
                    {modelo !== 'BERGER_UNICO' && modObj.codigo !== 'atletismo' && modObj.codigo !== 'xadrez' && (
                      <label className="sm:col-span-3 flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
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
              </div>
            </div>

            {/* Rodapé: 1 único botão direto */}
            <div className="px-5 py-3.5 border-t border-slate-100 bg-[#F8FAFC] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalNovoAberto(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200/60 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={salvando || (modObj.codigo === 'atletismo' ? participantesAtivos.length === 0 : participantesAtivos.length < 2)}
                onClick={handleSortearECriarAgora}
                className="px-5 py-2 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-45 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {salvando
                    ? 'Criando...'
                    : chaveamentoDuplicado
                    ? 'Substituir & Abrir'
                    : 'Sortear & Abrir Agora'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* MODAL DE CONFERÊNCIA DOS ALUNOS DA EQUIPE                        */}
      {/* ================================================================ */}
      {participanteInspecionado && (
        <div
          className="fixed inset-0 z-[60] bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setParticipanteInspecionado(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[82vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-black text-[#0F2540]">{participanteInspecionado.nome}</h4>
                <p className="text-xs text-slate-400">
                  {participanteInspecionado.atletasDetalhes?.length || 0} aluno(s) inscrito(s) ·{' '}
                  {participanteInspecionado.statusHomologacao}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setParticipanteInspecionado(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-1.5">
              {!participanteInspecionado.atletasDetalhes ||
              participanteInspecionado.atletasDetalhes.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">Nenhum aluno vinculado.</p>
              ) : (
                participanteInspecionado.atletasDetalhes.map((al, idx) => (
                  <div
                    key={al.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#F8FAFC] text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-[#0F2540] truncate">
                        {idx + 1}. {al.nomeCompleto}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {al.semDocumento ? (
                          <span className="text-rose-600 font-semibold">Sem documento</span>
                        ) : (
                          `${al.documentoTipo} ${al.documentoNumero}`
                        )}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        al.semDocumento ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-[#087A5B]'
                      }`}
                    >
                      {al.semDocumento ? 'Pendente' : 'OK'}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  toggleParticipante(participanteInspecionado.id);
                  setParticipanteInspecionado(null);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold cursor-pointer"
              >
                {excluidosIds.includes(participanteInspecionado.id) ? '+ Incluir no sorteio' : 'Remover do sorteio'}
              </button>
              <button
                type="button"
                onClick={() => setParticipanteInspecionado(null)}
                className="px-4 py-1.5 rounded-xl bg-[#0F2540] text-white text-xs font-bold cursor-pointer"
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
