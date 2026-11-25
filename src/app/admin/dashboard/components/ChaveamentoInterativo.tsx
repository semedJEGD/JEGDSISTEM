'use client';

import React, { useMemo, useState } from 'react';
import {
  Trophy,
  CheckCircle2,
  RotateCcw,
  RefreshCw,
  ArrowRight,
  Edit3,
  Check,
  X,
  Award,
  Target,
  Flag,
  Calendar,
  Clock,
  MapPin,
  Filter,
  GitBranch,
  ListOrdered,
  Swords,
  Radio,
  ExternalLink,
  Printer,
} from 'lucide-react';
import { gerarPdfChaveamentoVisual } from '@/lib/pdf/tabela-jogos';
import { Escola } from '@/types/jegd';
import {
  ArtilhariaEventoItem,
  ChaveamentoEventoItem,
  PartidaEventoItem,
} from '@/types/eventos';
import {
  EventosApi,
  FASES_LABEL,
  calcularClassificacaoPorChave,
  formatarDataBR,
} from '@/lib/eventos-service';
import {
  FinalizacaoCampeonato,
  calcularAtualizacoesAvancoMataMata,
  formatarDetalhesPenaltis,
  formatarPlacarComPenaltis,
  normalizarCodigoModalidade,
  obterConfigColunasModalidade,
  parsePenaltis,
} from '@/lib/chaveamento-service';

interface ChaveamentoInterativoProps {
  municipioId?: string;
  chaveamento: ChaveamentoEventoItem;
  partidas: PartidaEventoItem[];
  escolas: Escola[];
  artilharia?: ArtilhariaEventoItem[];
  onAtualizado: () => Promise<void>;
}

type AbaCompeticao = 'JOGOS' | 'CLASSIFICACAO' | 'CHAVEAMENTO';

const ORDEM_FASES_ELIMINATORIAS = ['OITAVAS', 'QUARTAS', 'SEMIFINAL', 'FINAL'];

const STATUS_META: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  AGENDADO: {
    label: 'Agendada',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
  },
  AO_VIVO: {
    label: 'Em andamento',
    bg: 'bg-emerald-50',
    text: 'text-[#087A5B]',
    dot: 'bg-[#00A878] animate-pulse',
  },
  ENCERRADO: {
    label: 'Encerrada',
    bg: 'bg-[#0F2540]/8',
    text: 'text-[#0F2540]',
    dot: 'bg-[#0F2540]',
  },
  ADIADO: {
    label: 'Adiada',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  CANCELADO: {
    label: 'Cancelada',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
  },
  WO: {
    label: 'W.O.',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    dot: 'bg-amber-600',
  },
};

function isTbd(id?: string | null): boolean {
  return !id || id.startsWith('TBD_');
}

function iniciaisEquipe(sigla?: string | null): string {
  if (!sigla) return '?';
  const clean = sigla.replace(/[^A-Za-zÀ-ÿ0-9\s]/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase() || '?';
}

function extrairRodadaLabel(p: PartidaEventoItem): string {
  if (p.fase !== 'GRUPOS') return FASES_LABEL[p.fase] || p.fase;
  const m = (p.observacao || '').match(/(\d+ª\s*Rodada)/i);
  if (m) return m[1];
  return 'Fase de Grupos';
}

export function ChaveamentoInterativo({
  municipioId,
  chaveamento,
  partidas,
  escolas,
  artilharia = [],
  onAtualizado,
}: ChaveamentoInterativoProps) {
  const isPontosCorridos = chaveamento.formato === 'BERGER_UNICO';
  const temGrupos = partidas.some((p) => p.fase === 'GRUPOS');
  const temMataMata = partidas.some((p) => p.fase !== 'GRUPOS');

  const [abaAtiva, setAbaAtiva] = useState<AbaCompeticao>(() => {
    if (isPontosCorridos) return 'CLASSIFICACAO';
    if (!temGrupos && temMataMata) return 'CHAVEAMENTO';
    return 'JOGOS';
  });

  // Filtros da Tabela de Jogos
  const [filtroRodada, setFiltroRodada] = useState('TODAS');
  const [filtroGrupo, setFiltroGrupo] = useState('TODOS');
  const [filtroEquipe, setFiltroEquipe] = useState('TODAS');
  const [filtroData, setFiltroData] = useState('TODAS');
  const [filtroStatus, setFiltroStatus] = useState('TODOS');
  const [filtroQuadra, setFiltroQuadra] = useState('TODAS');

  const [ocupadoId, setOcupadoId] = useState<string | null>(null);
  const [editandoSlot, setEditandoSlot] = useState<{ partidaId: string; lado: 'A' | 'B' } | null>(null);
  const [escolaSelecionadaId, setEscolaSelecionadaId] = useState('');
  const [avisoAvanco, setAvisoAvanco] = useState<string | null>(null);
  const [penaltisInput, setPenaltisInput] = useState<Record<string, { a: string; b: string }>>({});
  const [parciaisInput, setParciaisInput] = useState<Record<string, string>>({});
  const [mdTenisMesa, setMdTenisMesa] = useState<3 | 5>(3);

  // Edição inline de horário/data/local de uma partida
  const [editandoHorarioId, setEditandoHorarioId] = useState<string | null>(null);
  const [editDataEvento, setEditDataEvento] = useState('');
  const [editHorario, setEditHorario] = useState('');
  const [editLocal, setEditLocal] = useState('');

  // Reagendamento em lote de todas as partidas do chaveamento
  const [abrirReagendarLote, setAbrirReagendarLote] = useState(false);
  const [loteData, setLoteData] = useState(() => partidas[0]?.dataEvento || '2026-11-28');
  const [loteHoraInicio, setLoteHoraInicio] = useState(() => partidas[0]?.horario || '08:00');
  const [loteIntervalo, setLoteIntervalo] = useState('20');
  const [loteLocal, setLoteLocal] = useState(() => partidas[0]?.local || '');
  const [publicadoFeedback, setPublicadoFeedback] = useState(false);

  const modNorm = useMemo(
    () => normalizarCodigoModalidade(chaveamento.modalidadeCodigo),
    [chaveamento.modalidadeCodigo]
  );
  const isQueimada = modNorm === 'queimada';
  const isTenisMesa = modNorm === 'tenis_mesa';
  const isVolei = modNorm.includes('volei');
  const usaSets = isTenisMesa || isVolei;
  const placaresRapidosSets: Array<[number, number]> = useMemo(() => {
    if (isVolei || (isTenisMesa && mdTenisMesa === 3)) {
      return [
        [2, 0],
        [2, 1],
        [1, 2],
        [0, 2],
      ];
    }
    return [
      [3, 0],
      [3, 1],
      [3, 2],
      [2, 3],
      [1, 3],
      [0, 3],
    ];
  }, [isVolei, isTenisMesa, mdTenisMesa]);

  // Finalização do campeonato
  const [abrirFinalizar, setAbrirFinalizar] = useState(false);
  const [finCampeaoId, setFinCampeaoId] = useState('');
  const [finViceId, setFinViceId] = useState('');
  const [finTerceiroId, setFinTerceiroId] = useState('');
  const [finArtilheiroNome, setFinArtilheiroNome] = useState('');
  const [finArtilheiroGols, setFinArtilheiroGols] = useState('');
  const [lancarMedalhasAuto, setLancarMedalhasAuto] = useState(true);

  const configModalidade = useMemo(
    () => obterConfigColunasModalidade(chaveamento.modalidadeCodigo),
    [chaveamento.modalidadeCodigo]
  );

  const estruturaObj = useMemo(() => {
    try {
      return chaveamento.estruturaJson ? JSON.parse(chaveamento.estruturaJson) : {};
    } catch {
      return {};
    }
  }, [chaveamento.estruturaJson]);

  const finalizacaoSalva: FinalizacaoCampeonato | null = estruturaObj?.finalizacao || null;

  const partidasOrdenadas = useMemo(
    () => [...partidas].sort((a, b) => (a.numeroJogo || 0) - (b.numeroJogo || 0)),
    [partidas]
  );

  const partidasGrupos = useMemo(
    () => partidasOrdenadas.filter((p) => p.fase === 'GRUPOS'),
    [partidasOrdenadas]
  );

  const classificacoes = useMemo(
    () => calcularClassificacaoPorChave(partidasGrupos),
    [partidasGrupos]
  );

  const gruposNomes = useMemo(() => {
    const set = new Set<string>();
    partidasGrupos.forEach((p) => set.add(p.grupo?.trim() || 'Tabela Geral'));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [partidasGrupos]);

  const fasesMataMata = useMemo(() => {
    return ORDEM_FASES_ELIMINATORIAS.map((fase) => ({
      fase,
      label: FASES_LABEL[fase] || fase,
      jogos: partidasOrdenadas.filter((p) => p.fase === fase),
    })).filter((col) => col.jogos.length > 0);
  }, [partidasOrdenadas]);

  const jogoTerceiroLugar = useMemo(
    () => partidasOrdenadas.find((p) => p.fase === 'TERCEIRO_LUGAR') || null,
    [partidasOrdenadas]
  );

  const jogoFinal = useMemo(
    () => partidasOrdenadas.find((p) => p.fase === 'FINAL') || null,
    [partidasOrdenadas]
  );

  // KPIs do cabeçalho da competição
  const resumoCompeticao = useMemo(() => {
    const equipesSet = new Set<string>();
    partidasOrdenadas.forEach((p) => {
      if (!isTbd(p.escolaAId)) equipesSet.add(p.escolaAId);
      if (!isTbd(p.escolaBId)) equipesSet.add(p.escolaBId);
    });
    const total = partidasOrdenadas.length;
    const concluidas = partidasOrdenadas.filter((p) => p.status === 'ENCERRADO' || p.status === 'WO').length;
    const pendentes = total - concluidas;

    let faseAtual = 'Fase de Grupos';
    if (chaveamento.status === 'FINALIZADO' || finalizacaoSalva) {
      faseAtual = 'Encerrada';
    } else if (isPontosCorridos) {
      faseAtual = 'Pontos Corridos';
    } else {
      const proximaPendente = partidasOrdenadas.find(
        (p) => p.status !== 'ENCERRADO' && p.status !== 'WO' && p.status !== 'CANCELADO'
      );
      if (proximaPendente) {
        faseAtual = FASES_LABEL[proximaPendente.fase] || proximaPendente.fase;
      } else if (jogoFinal) {
        faseAtual = 'Grande Final';
      }
    }

    return {
      totalEquipes: equipesSet.size,
      totalPartidas: total,
      concluidas,
      pendentes,
      faseAtual,
    };
  }, [partidasOrdenadas, chaveamento.status, finalizacaoSalva, isPontosCorridos, jogoFinal]);

  // Forma real (últimos 5 jogos confirmados) por equipe — sem dados fictícios
  const formaPorEquipe = useMemo(() => {
    const mapa = new Map<string, ('V' | 'E' | 'D')[]>();
    const encerradas = partidasGrupos.filter((p) => p.status === 'ENCERRADO' || p.status === 'WO');
    for (const p of encerradas) {
      if (!mapa.has(p.escolaAId)) mapa.set(p.escolaAId, []);
      if (!mapa.has(p.escolaBId)) mapa.set(p.escolaBId, []);
      if (p.placarA > p.placarB) {
        mapa.get(p.escolaAId)!.push('V');
        mapa.get(p.escolaBId)!.push('D');
      } else if (p.placarB > p.placarA) {
        mapa.get(p.escolaAId)!.push('D');
        mapa.get(p.escolaBId)!.push('V');
      } else {
        mapa.get(p.escolaAId)!.push('E');
        mapa.get(p.escolaBId)!.push('E');
      }
    }
    for (const [k, arr] of mapa.entries()) {
      mapa.set(k, arr.slice(-5));
    }
    return mapa;
  }, [partidasGrupos]);

  // Opções únicas para os filtros da Tabela de Jogos
  const opcoesFiltros = useMemo(() => {
    const rodadas = Array.from(new Set(partidasOrdenadas.map(extrairRodadaLabel)));
    const datas = Array.from(new Set(partidasOrdenadas.map((p) => p.dataEvento).filter(Boolean))).sort();
    const quadras = Array.from(new Set(partidasOrdenadas.map((p) => p.local || '').filter(Boolean))).sort();
    const equipesMap = new Map<string, string>();
    partidasOrdenadas.forEach((p) => {
      if (!isTbd(p.escolaAId)) equipesMap.set(p.escolaAId, p.escolaASigla || p.escolaANome);
      if (!isTbd(p.escolaBId)) equipesMap.set(p.escolaBId, p.escolaBSigla || p.escolaBNome);
    });
    const equipes = Array.from(equipesMap.entries()).sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));
    return { rodadas, datas, quadras, equipes };
  }, [partidasOrdenadas]);

  const partidasFiltradas = useMemo(() => {
    return partidasOrdenadas.filter((p) => {
      if (filtroRodada !== 'TODAS' && extrairRodadaLabel(p) !== filtroRodada) return false;
      if (filtroGrupo !== 'TODOS' && (p.grupo?.trim() || 'Tabela Geral') !== filtroGrupo) return false;
      if (filtroEquipe !== 'TODAS' && p.escolaAId !== filtroEquipe && p.escolaBId !== filtroEquipe) return false;
      if (filtroData !== 'TODAS' && p.dataEvento !== filtroData) return false;
      if (filtroStatus !== 'TODOS' && p.status !== filtroStatus) return false;
      if (filtroQuadra !== 'TODAS' && (p.local || '') !== filtroQuadra) return false;
      return true;
    });
  }, [partidasOrdenadas, filtroRodada, filtroGrupo, filtroEquipe, filtroData, filtroStatus, filtroQuadra]);

  const partidasAgrupadasPorBloco = useMemo(() => {
    const blocos = new Map<string, PartidaEventoItem[]>();
    for (const p of partidasFiltradas) {
      const rod = extrairRodadaLabel(p);
      const chave = p.fase === 'GRUPOS' && p.grupo ? `${rod} · ${p.grupo}` : rod;
      if (!blocos.has(chave)) blocos.set(chave, []);
      blocos.get(chave)!.push(p);
    }
    return Array.from(blocos.entries());
  }, [partidasFiltradas]);

  const temFiltroAtivo =
    filtroRodada !== 'TODAS' ||
    filtroGrupo !== 'TODOS' ||
    filtroEquipe !== 'TODAS' ||
    filtroData !== 'TODAS' ||
    filtroStatus !== 'TODOS' ||
    filtroQuadra !== 'TODAS';

  const limparFiltros = () => {
    setFiltroRodada('TODAS');
    setFiltroGrupo('TODOS');
    setFiltroEquipe('TODAS');
    setFiltroData('TODAS');
    setFiltroStatus('TODOS');
    setFiltroQuadra('TODAS');
  };

  const escolasOrdenadas = useMemo(
    () => [...escolas].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [escolas]
  );

  const artilheiroSugerido = useMemo(() => {
    const modNorm = normalizarCodigoModalidade(chaveamento.modalidadeCodigo);
    return (
      artilharia
        .filter(
          (a) =>
            normalizarCodigoModalidade(a.modalidadeCodigo) === modNorm &&
            a.categoria === chaveamento.categoria &&
            a.sexo === chaveamento.sexo
        )
        .sort((a, b) => b.gols - a.gols)[0] || null
    );
  }, [artilharia, chaveamento]);

  // Handlers
  const handleAbrirFinalizar = () => {
    let campId = '';
    let viceId = '';
    let tercId = '';

    if (jogoFinal && (jogoFinal.status === 'ENCERRADO' || jogoFinal.status === 'WO')) {
      const venceuA =
        jogoFinal.vencedorEscolaId === jogoFinal.escolaAId ||
        (!jogoFinal.vencedorEscolaId && jogoFinal.placarA > jogoFinal.placarB);
      campId = venceuA ? jogoFinal.escolaAId : jogoFinal.escolaBId;
      viceId = venceuA ? jogoFinal.escolaBId : jogoFinal.escolaAId;
      if (jogoTerceiroLugar && (jogoTerceiroLugar.status === 'ENCERRADO' || jogoTerceiroLugar.status === 'WO')) {
        const venceu3A =
          jogoTerceiroLugar.vencedorEscolaId === jogoTerceiroLugar.escolaAId ||
          (!jogoTerceiroLugar.vencedorEscolaId && jogoTerceiroLugar.placarA > jogoTerceiroLugar.placarB);
        tercId = venceu3A ? jogoTerceiroLugar.escolaAId : jogoTerceiroLugar.escolaBId;
      }
    } else if (classificacoes.length > 0 && classificacoes[0].linhas.length > 0) {
      const linhas = classificacoes[0].linhas;
      campId = linhas[0]?.escolaId || '';
      viceId = linhas[1]?.escolaId || '';
      tercId = linhas[2]?.escolaId || '';
    }

    setFinCampeaoId(finalizacaoSalva?.campeao?.escolaId || campId);
    setFinViceId(finalizacaoSalva?.vice?.escolaId || viceId);
    setFinTerceiroId(finalizacaoSalva?.terceiro?.escolaId || tercId);
    setFinArtilheiroNome(
      finalizacaoSalva?.artilheiro?.nome ||
        (artilheiroSugerido
          ? `${artilheiroSugerido.atletaNome} (${artilheiroSugerido.escolaSigla || artilheiroSugerido.escolaNome})`
          : '')
    );
    setFinArtilheiroGols(
      finalizacaoSalva?.artilheiro?.gols
        ? String(finalizacaoSalva.artilheiro.gols)
        : artilheiroSugerido
        ? String(artilheiroSugerido.gols)
        : ''
    );
    setAbrirFinalizar(true);
  };

  const handleConfirmarFinalizacao = async () => {
    if (!finCampeaoId) {
      alert('Selecione a equipe Campeã para finalizar o campeonato.');
      return;
    }

    const buscarEquipe = (id: string) => {
      if (!id) return null;
      const esc = escolas.find((e) => e.id === id);
      if (esc) return { escolaId: esc.id, nome: esc.nome, sigla: esc.sigla || esc.nome };
      const pMatch = partidasOrdenadas.find((p) => p.escolaAId === id || p.escolaBId === id);
      if (pMatch) {
        return pMatch.escolaAId === id
          ? { escolaId: pMatch.escolaAId, nome: pMatch.escolaANome, sigla: pMatch.escolaASigla || pMatch.escolaANome }
          : { escolaId: pMatch.escolaBId, nome: pMatch.escolaBNome, sigla: pMatch.escolaBSigla || pMatch.escolaBNome };
      }
      return null;
    };

    const campeao = buscarEquipe(finCampeaoId);
    const vice = buscarEquipe(finViceId);
    const terceiro = buscarEquipe(finTerceiroId);

    const finalizacao: FinalizacaoCampeonato = {
      campeao,
      vice,
      terceiro,
      artilheiro: finArtilheiroNome.trim()
        ? {
            nome: finArtilheiroNome.trim(),
            gols: finArtilheiroGols ? Number(finArtilheiroGols) : undefined,
          }
        : null,
      finalizadoEm: new Date().toISOString(),
    };

    try {
      setOcupadoId('FINALIZAR');
      await EventosApi.atualizar('chaveamento', chaveamento.id, {
        status: 'FINALIZADO',
        estruturaJson: JSON.stringify({ ...estruturaObj, finalizacao }),
      });

      if (lancarMedalhasAuto) {
        const podio: { eq: { escolaId: string; nome: string; sigla: string } | null; tipo: 'OURO' | 'PRATA' | 'BRONZE' }[] = [
          { eq: campeao, tipo: 'OURO' },
          { eq: vice, tipo: 'PRATA' },
          { eq: terceiro, tipo: 'BRONZE' },
        ];
        for (const item of podio) {
          if (!item.eq) continue;
          await EventosApi.criar('medalha', {
            municipioId: municipioId || chaveamento.municipioId,
            escolaId: item.eq.escolaId,
            escolaNome: item.eq.nome,
            escolaSigla: item.eq.sigla,
            modalidadeCodigo: chaveamento.modalidadeCodigo,
            modalidadeNome: chaveamento.modalidadeNome,
            categoria: chaveamento.categoria,
            sexo: chaveamento.sexo,
            tipo: item.tipo,
          });
        }
      }

      setAbrirFinalizar(false);
      setAvisoAvanco(`Campeonato finalizado! Campeão: ${campeao?.sigla || campeao?.nome}.`);
      setTimeout(() => setAvisoAvanco(null), 5000);
      await onAtualizado();
    } catch (err: any) {
      alert(err.message || 'Erro ao finalizar campeonato');
    } finally {
      setOcupadoId(null);
    }
  };

  const aplicarAvancoAutomatico = async (partidasAtualizadas: PartidaEventoItem[]) => {
    const updates = calcularAtualizacoesAvancoMataMata(partidasAtualizadas);
    if (updates.length > 0) {
      await EventosApi.atualizar('partidas_atualizar_lote', chaveamento.id, { itens: updates });
      setAvisoAvanco(`${updates.length} confronto(s) da próxima fase atualizado(s) automaticamente.`);
      setTimeout(() => setAvisoAvanco(null), 4000);
    }
  };

  const handlePlacar = async (partida: PartidaEventoItem, deltaA: number, deltaB: number) => {
    const novoA = Math.max(0, partida.placarA + deltaA);
    const novoB = Math.max(0, partida.placarB + deltaB);
    try {
      setOcupadoId(partida.id);
      await EventosApi.atualizar('partida', partida.id, {
        placarA: novoA,
        placarB: novoB,
        status: partida.status === 'AGENDADO' ? 'AO_VIVO' : partida.status,
      });
      await onAtualizado();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar placar');
    } finally {
      setOcupadoId(null);
    }
  };

  const handleMudarStatus = async (partida: PartidaEventoItem, novoStatus: string) => {
    if (novoStatus === 'ENCERRADO') {
      await handleEncerrar(partida);
      return;
    }
    try {
      setOcupadoId(partida.id);
      await EventosApi.atualizar('partida', partida.id, {
        status: novoStatus,
        ...(novoStatus !== 'WO' ? { vencedorEscolaId: null, woEscolaId: null } : {}),
      });
      await onAtualizado();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar situação da partida');
    } finally {
      setOcupadoId(null);
    }
  };

  const handleEncerrar = async (
    partida: PartidaEventoItem,
    opts?: {
      vencedorForcado?: 'A' | 'B';
      woLado?: 'A' | 'B';
      penaltis?: { penA: number; penB: number };
      placarFinal?: { placarA: number; placarB: number };
      detalhesPlacar?: string | null;
    }
  ) => {
    try {
      setOcupadoId(partida.id);
      let dados: Record<string, any>;

      if (opts?.woLado) {
        dados = {
          status: 'WO',
          placarA: opts.woLado === 'A' ? 0 : 1,
          placarB: opts.woLado === 'B' ? 0 : 1,
          detalhesPlacar: null,
          woEscolaId: opts.woLado === 'A' ? partida.escolaAId : partida.escolaBId,
          vencedorEscolaId: opts.woLado === 'A' ? partida.escolaBId : partida.escolaAId,
        };
      } else if (opts?.penaltis) {
        const { penA, penB } = opts.penaltis;
        if (penA === penB) {
          alert('Nos pênaltis precisa haver um vencedor.');
          return;
        }
        dados = {
          status: 'ENCERRADO',
          detalhesPlacar: formatarDetalhesPenaltis(penA, penB),
          vencedorEscolaId: penA > penB ? partida.escolaAId : partida.escolaBId,
        };
      } else if (opts?.placarFinal) {
        const { placarA, placarB } = opts.placarFinal;
        const vencedorId =
          placarA > placarB ? partida.escolaAId : placarB > placarA ? partida.escolaBId : null;
        const detalhesTrim = (opts.detalhesPlacar ?? parciaisInput[partida.id] ?? '').trim();
        dados = {
          status: 'ENCERRADO',
          placarA,
          placarB,
          detalhesPlacar: detalhesTrim || null,
          vencedorEscolaId: vencedorId,
        };
      } else if (opts?.vencedorForcado) {
        const vencedorId = opts.vencedorForcado === 'A' ? partida.escolaAId : partida.escolaBId;
        const placarJaReflete =
          (opts.vencedorForcado === 'A' && partida.placarA > partida.placarB) ||
          (opts.vencedorForcado === 'B' && partida.placarB > partida.placarA);
        const detalhesTrim = (opts.detalhesPlacar ?? parciaisInput[partida.id] ?? '').trim();
        dados = {
          status: 'ENCERRADO',
          ...(placarJaReflete
            ? {}
            : {
                placarA: opts.vencedorForcado === 'A' ? 1 : 0,
                placarB: opts.vencedorForcado === 'B' ? 1 : 0,
              }),
          detalhesPlacar: detalhesTrim || null,
          vencedorEscolaId: vencedorId,
        };
      } else {
        const vencedorId =
          partida.placarA > partida.placarB
            ? partida.escolaAId
            : partida.placarB > partida.placarA
            ? partida.escolaBId
            : null;
        const detalhesTrim = (opts?.detalhesPlacar ?? parciaisInput[partida.id] ?? '').trim();

        dados = {
          status: 'ENCERRADO',
          detalhesPlacar: detalhesTrim || null,
          vencedorEscolaId: vencedorId,
        };
      }

      await EventosApi.atualizar('partida', partida.id, dados);

      const listaAtualizada = partidasOrdenadas.map((p) =>
        p.id === partida.id ? { ...p, ...dados } : p
      );
      await aplicarAvancoAutomatico(listaAtualizada);
      await onAtualizado();
    } catch (err: any) {
      alert(err.message || 'Erro ao encerrar partida');
    } finally {
      setOcupadoId(null);
    }
  };

  const handleReabrir = async (partida: PartidaEventoItem) => {
    try {
      setOcupadoId(partida.id);
      await EventosApi.atualizar('partida', partida.id, {
        status: 'AO_VIVO',
        vencedorEscolaId: null,
        woEscolaId: null,
        detalhesPlacar: null,
      });
      await onAtualizado();
    } catch (err: any) {
      alert(err.message || 'Erro ao reabrir partida');
    } finally {
      setOcupadoId(null);
    }
  };

  const handleRecalcularAvanco = async () => {
    try {
      setOcupadoId('RECALC');
      const updates = calcularAtualizacoesAvancoMataMata(partidasOrdenadas);
      if (updates.length === 0) {
        setAvisoAvanco('Todos os confrontos eliminatórios já estão atualizados.');
        setTimeout(() => setAvisoAvanco(null), 3000);
        return;
      }
      await EventosApi.atualizar('partidas_atualizar_lote', chaveamento.id, { itens: updates });
      setAvisoAvanco(`${updates.length} confronto(s) atualizado(s) pela classificação.`);
      setTimeout(() => setAvisoAvanco(null), 4000);
      await onAtualizado();
    } catch (err: any) {
      alert(err.message || 'Erro ao recalcular classificados');
    } finally {
      setOcupadoId(null);
    }
  };

  const handleAbrirEditarHorario = (p: PartidaEventoItem) => {
    setEditandoHorarioId(p.id);
    setEditDataEvento(p.dataEvento || '2026-11-28');
    setEditHorario(p.horario || '08:00');
    setEditLocal(p.local || '');
  };

  const handleSalvarHorarioPartida = async (partidaId: string) => {
    if (!editDataEvento || !editHorario) {
      alert('Informe a data e o horário da partida.');
      return;
    }
    try {
      setOcupadoId(partidaId);
      await EventosApi.atualizar('partida', partidaId, {
        dataEvento: editDataEvento,
        horario: editHorario,
        local: editLocal.trim() || null,
      });
      setEditandoHorarioId(null);
      setAvisoAvanco('Horário da partida atualizado no chaveamento, no Portal de Eventos e no Telão.');
      setTimeout(() => setAvisoAvanco(null), 4000);
      await onAtualizado();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar horário da partida');
    } finally {
      setOcupadoId(null);
    }
  };

  const handleAplicarHorariosLote = async () => {
    if (!loteData || !loteHoraInicio) {
      alert('Informe a data e o horário inicial.');
      return;
    }
    const [hh, mm] = loteHoraInicio.split(':').map((n) => parseInt(n, 10) || 0);
    const intervalo = Math.max(5, parseInt(loteIntervalo, 10) || 20);
    const baseMin = hh * 60 + mm;

    const itens = partidasOrdenadas.map((p, idx) => {
      const totalMin = baseMin + idx * intervalo;
      const h = String(Math.floor(totalMin / 60) % 24).padStart(2, '0');
      const m = String(totalMin % 60).padStart(2, '0');
      return {
        id: p.id,
        dados: {
          dataEvento: loteData,
          horario: `${h}:${m}`,
          ...(loteLocal.trim() ? { local: loteLocal.trim() } : {}),
        },
      };
    });

    try {
      setOcupadoId('REAGENDAR_LOTE');
      await EventosApi.atualizar('partidas_atualizar_lote', chaveamento.id, { itens });
      setAbrirReagendarLote(false);
      setAvisoAvanco(
        `${itens.length} partida(s) reagendada(s) para ${formatarDataBR(loteData)} a partir das ${loteHoraInicio} (a cada ${intervalo} min).`
      );
      setTimeout(() => setAvisoAvanco(null), 5000);
      await onAtualizado();
    } catch (err: any) {
      alert(err.message || 'Erro ao reagendar partidas em lote');
    } finally {
      setOcupadoId(null);
    }
  };

  const handlePublicarEventosETelao = async () => {
    if (partidasOrdenadas.length === 0) {
      alert('Não há partidas neste chaveamento para publicar.');
      return;
    }
    const primeira = partidasOrdenadas[0];
    const ultima = partidasOrdenadas[partidasOrdenadas.length - 1];
    const dataRef = primeira.dataEvento || '2026-11-28';
    const horaInicioRef = primeira.horario || '08:00';
    const horaFimRef = ultima.horario || '';
    const localRef = primeira.local || 'Quadra Oficial JEGDS';
    const sexoLabel = chaveamento.sexo === 'MASCULINO' ? 'Masculino' : 'Feminino';
    const etapaLabel =
      modNorm === 'queimada' || modNorm === 'tenis_mesa' || modNorm === 'xadrez'
        ? '1ª Etapa'
        : modNorm === 'atletismo' || modNorm === 'beach_soccer'
        ? '2ª Etapa'
        : '3ª Etapa';

    try {
      setOcupadoId('PUBLICAR');
      if (chaveamento.status === 'RASCUNHO') {
        await EventosApi.atualizar('chaveamento', chaveamento.id, { status: 'CONGELADO' });
      }
      await EventosApi.criar('cronograma', {
        municipioId: municipioId || chaveamento.municipioId,
        titulo: `${chaveamento.modalidadeNome} — ${chaveamento.categoria} ${sexoLabel}`,
        descricao: `${partidasOrdenadas.length} partida(s) oficiais do chaveamento (${resumoCompeticao.totalEquipes} equipes).`,
        etapa: etapaLabel,
        modalidadeNome: chaveamento.modalidadeNome,
        categoria: `${chaveamento.categoria} ${sexoLabel}`,
        local: localRef,
        dataEvento: dataRef,
        horarioInicio: horaInicioRef,
        horarioFim: horaFimRef || null,
        status: 'PREVISTO',
      });
      await EventosApi.criar('aviso', {
        municipioId: municipioId || chaveamento.municipioId,
        titulo: `Tabela Oficial: ${chaveamento.modalidadeNome} (${chaveamento.categoria} ${sexoLabel})`,
        mensagem: `${partidasOrdenadas.length} jogos confirmados em ${formatarDataBR(dataRef)} a partir das ${horaInicioRef} — ${localRef}.`,
        tipo: 'CHAMADA',
        ativo: true,
      });

      setPublicadoFeedback(true);
      setAvisoAvanco(
        `Publicado no Portal de Eventos (/eventos) e no Telão (/eventos/telao)! Todas as ${partidasOrdenadas.length} partidas e o cronograma já estão ao vivo.`
      );
      await onAtualizado();
    } catch (err: any) {
      alert(err.message || 'Erro ao publicar nos Eventos e Telão');
    } finally {
      setOcupadoId(null);
    }
  };

  const handleSalvarSlotManual = async (partida: PartidaEventoItem, lado: 'A' | 'B') => {
    const esc = escolas.find((e) => e.id === escolaSelecionadaId);
    if (!esc) return;
    try {
      setOcupadoId(partida.id);
      const dados =
        lado === 'A'
          ? { escolaAId: esc.id, escolaANome: esc.nome, escolaASigla: esc.sigla || esc.nome }
          : { escolaBId: esc.id, escolaBNome: esc.nome, escolaBSigla: esc.sigla || esc.nome };
      await EventosApi.atualizar('partida', partida.id, dados);
      setEditandoSlot(null);
      setEscolaSelecionadaId('');
      await onAtualizado();
    } catch (err: any) {
      alert(err.message || 'Erro ao definir equipe');
    } finally {
      setOcupadoId(null);
    }
  };

  // Escudo circular esportivo (com X vermelho sobreposto quando eliminado)
  const renderEscudo = (
    sigla: string | null | undefined,
    status: 'vencedor' | 'eliminado' | 'neutro' = 'neutro',
    tamanho: 'sm' | 'md' = 'md'
  ) => {
    const dim = tamanho === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-[10px]';
    return (
      <div className={`relative shrink-0 ${dim}`}>
        <div
          className={`${dim} rounded-full flex items-center justify-center font-black tracking-tight transition-all ${
            status === 'vencedor'
              ? 'bg-[#00A878] text-white shadow-xs'
              : status === 'eliminado'
              ? 'bg-slate-100 text-slate-400 opacity-55'
              : 'bg-[#0F2540]/8 text-[#0F2540]'
          }`}
        >
          {iniciaisEquipe(sigla)}
        </div>
        {status === 'eliminado' && (
          <span
            className="absolute inset-0 flex items-center justify-center rounded-full bg-rose-500/15"
            title="Eliminada"
          >
            <X className="w-5 h-5 text-rose-600 stroke-[3]" />
          </span>
        )}
      </div>
    );
  };

  // Card de confronto do Chaveamento (Aba 3)
  const renderCardChaveamento = (p: PartidaEventoItem, isFinal = false) => {
    const encerrado = p.status === 'ENCERRADO' || p.status === 'WO';
    const busy = ocupadoId === p.id;
    const tbdA = isTbd(p.escolaAId);
    const tbdB = isTbd(p.escolaBId);
    const ambosDefinidos = !tbdA && !tbdB;
    const pen = parsePenaltis(p.detalhesPlacar);

    const venceuA =
      encerrado &&
      (p.vencedorEscolaId === p.escolaAId || (!p.vencedorEscolaId && p.placarA > p.placarB));
    const venceuB =
      encerrado &&
      (p.vencedorEscolaId === p.escolaBId || (!p.vencedorEscolaId && p.placarB > p.placarA));

    const editA = editandoSlot?.partidaId === p.id && editandoSlot.lado === 'A';
    const editB = editandoSlot?.partidaId === p.id && editandoSlot.lado === 'B';
    const penVals = penaltisInput[p.id] || { a: '', b: '' };

    return (
      <div
        key={p.id}
        className={`rounded-xl bg-white border p-3.5 space-y-2.5 shadow-[0_1px_3px_rgba(15,37,64,0.06)] transition-all ${
          isFinal ? 'border-amber-300 ring-1 ring-amber-200/70' : 'border-slate-200/80'
        }`}
      >
        {editandoHorarioId === p.id ? (
          <div className="p-2 rounded-lg bg-[#F4F6F8] border border-slate-200 space-y-1.5">
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="date"
                value={editDataEvento}
                onChange={(e) => setEditDataEvento(e.target.value)}
                className="px-2 py-1 rounded border border-slate-300 bg-white text-[11px] font-medium text-[#0F2540]"
              />
              <input
                type="time"
                value={editHorario}
                onChange={(e) => setEditHorario(e.target.value)}
                className="px-2 py-1 rounded border border-slate-300 bg-white text-[11px] font-medium text-[#0F2540]"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={editLocal}
                onChange={(e) => setEditLocal(e.target.value)}
                placeholder="Quadra / Local"
                className="flex-1 px-2 py-1 rounded border border-slate-300 bg-white text-[11px] text-[#0F2540]"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => handleSalvarHorarioPartida(p.id)}
                className="px-2 py-1 rounded bg-[#00A878] hover:bg-[#087A5B] text-white text-[11px] font-bold cursor-pointer"
                title="Salvar horário"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setEditandoHorarioId(null)}
                className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-600 text-[11px] cursor-pointer"
                title="Cancelar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-slate-400 gap-2">
            <button
              type="button"
              onClick={() => handleAbrirEditarHorario(p)}
              className="font-mono font-medium hover:text-[#0F2540] flex items-center gap-1 transition-colors cursor-pointer"
              title="Clique para editar data, horário e quadra"
            >
              <span>
                J{p.numeroJogo || '-'} · {formatarDataBR(p.dataEvento).slice(0, 5)} {p.horario}
              </span>
              <Clock className="w-3 h-3 text-slate-400 hover:text-[#00A878]" />
            </button>
            {encerrado ? (
              <span className="font-mono font-bold text-[#0F2540]">
                {p.status === 'WO' ? 'W.O.' : formatarPlacarComPenaltis(p.placarA, p.placarB, p.detalhesPlacar)}
              </span>
            ) : (
              <span className={`text-[10px] font-semibold ${(STATUS_META[p.status] || STATUS_META.AGENDADO).text}`}>
                {(STATUS_META[p.status] || STATUS_META.AGENDADO).label}
              </span>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          {/* Equipe A */}
          <div
            className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border-l-[3px] transition-all ${
              venceuA
                ? 'bg-emerald-50/70 border-l-[#00A878] text-[#0F2540]'
                : venceuB
                ? 'bg-slate-50/70 border-l-rose-400 text-slate-400'
                : tbdA
                ? 'bg-slate-50/50 border-l-slate-200 text-slate-400'
                : 'bg-[#F8FAFC] border-l-slate-200 text-[#0F2540]'
            }`}
          >
            {editA ? (
              <div className="flex items-center gap-1 flex-1">
                <select
                  value={escolaSelecionadaId}
                  onChange={(e) => setEscolaSelecionadaId(e.target.value)}
                  className="flex-1 text-xs px-2 py-1 rounded border border-slate-300 bg-white text-slate-800"
                >
                  <option value="">Escolher equipe...</option>
                  {escolasOrdenadas.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.sigla || e.nome}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => handleSalvarSlotManual(p, 'A')} className="p-1 rounded bg-[#00A878] text-white">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => setEditandoSlot(null)} className="p-1 rounded bg-slate-200 text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {!tbdA && renderEscudo(p.escolaASigla || p.escolaANome, venceuA ? 'vencedor' : venceuB ? 'eliminado' : 'neutro', 'sm')}
                  <div className="min-w-0 flex-1">
                    <span className={`text-xs block truncate ${venceuA ? 'font-bold text-[#0F2540]' : venceuB ? 'line-through text-slate-400' : 'font-semibold'}`}>
                      {p.escolaASigla || p.escolaANome}
                    </span>
                    {venceuA && (
                      <span className="text-[10px] font-bold text-[#00A878]">
                        {isFinal ? 'Campeão' : 'Classificada'}
                      </span>
                    )}
                  </div>
                  {!encerrado && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditandoSlot({ partidaId: p.id, lado: 'A' });
                        setEscolaSelecionadaId(tbdA ? '' : p.escolaAId);
                      }}
                      className="text-slate-300 hover:text-slate-600 p-0.5 shrink-0"
                      title="Alterar equipe"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!encerrado && ambosDefinidos && (
                    <button type="button" disabled={busy} onClick={() => handlePlacar(p, -1, 0)} className="w-5 h-5 rounded bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 text-xs font-bold">
                      -
                    </button>
                  )}
                  <span className="min-w-6 text-center text-sm font-black tabular-nums text-[#0F2540]">
                    {p.placarA}
                    {pen && <span className="text-[11px] font-bold text-[#00A878] ml-0.5">({pen.penA})</span>}
                  </span>
                  {!encerrado && ambosDefinidos && (
                    <button type="button" disabled={busy} onClick={() => handlePlacar(p, 1, 0)} className="w-5 h-5 rounded bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 text-xs font-bold">
                      +
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Equipe B */}
          <div
            className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border-l-[3px] transition-all ${
              venceuB
                ? 'bg-emerald-50/70 border-l-[#00A878] text-[#0F2540]'
                : venceuA
                ? 'bg-slate-50/70 border-l-rose-400 text-slate-400'
                : tbdB
                ? 'bg-slate-50/50 border-l-slate-200 text-slate-400'
                : 'bg-[#F8FAFC] border-l-slate-200 text-[#0F2540]'
            }`}
          >
            {editB ? (
              <div className="flex items-center gap-1 flex-1">
                <select
                  value={escolaSelecionadaId}
                  onChange={(e) => setEscolaSelecionadaId(e.target.value)}
                  className="flex-1 text-xs px-2 py-1 rounded border border-slate-300 bg-white text-slate-800"
                >
                  <option value="">Escolher equipe...</option>
                  {escolasOrdenadas.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.sigla || e.nome}
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => handleSalvarSlotManual(p, 'B')} className="p-1 rounded bg-[#00A878] text-white">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => setEditandoSlot(null)} className="p-1 rounded bg-slate-200 text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {!tbdB && renderEscudo(p.escolaBSigla || p.escolaBNome, venceuB ? 'vencedor' : venceuA ? 'eliminado' : 'neutro', 'sm')}
                  <div className="min-w-0 flex-1">
                    <span className={`text-xs block truncate ${venceuB ? 'font-bold text-[#0F2540]' : venceuA ? 'line-through text-slate-400' : 'font-semibold'}`}>
                      {p.escolaBSigla || p.escolaBNome}
                    </span>
                    {venceuB && (
                      <span className="text-[10px] font-bold text-[#00A878]">
                        {isFinal ? 'Campeão' : 'Classificada'}
                      </span>
                    )}
                  </div>
                  {!encerrado && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditandoSlot({ partidaId: p.id, lado: 'B' });
                        setEscolaSelecionadaId(tbdB ? '' : p.escolaBId);
                      }}
                      className="text-slate-300 hover:text-slate-600 p-0.5 shrink-0"
                      title="Alterar equipe"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!encerrado && ambosDefinidos && (
                    <button type="button" disabled={busy} onClick={() => handlePlacar(p, 0, -1)} className="w-5 h-5 rounded bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 text-xs font-bold">
                      -
                    </button>
                  )}
                  <span className="min-w-6 text-center text-sm font-black tabular-nums text-[#0F2540]">
                    {p.placarB}
                    {pen && <span className="text-[11px] font-bold text-[#00A878] ml-0.5">({pen.penB})</span>}
                  </span>
                  {!encerrado && ambosDefinidos && (
                    <button type="button" disabled={busy} onClick={() => handlePlacar(p, 0, 1)} className="w-5 h-5 rounded bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 text-xs font-bold">
                      +
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Parciais registradas (Tênis de Mesa / Voleibol) */}
        {encerrado && p.detalhesPlacar && !pen && (
          <div className="px-2 py-1 rounded-md bg-slate-50 border border-slate-100 text-[10px] font-medium text-slate-500 text-center">
            Parciais: <span className="font-semibold text-[#0F2540]">{p.detalhesPlacar}</span>
          </div>
        )}

        {/* Encerrar / Ações específicas da modalidade */}
        {!encerrado && ambosDefinidos && (
          <div className="pt-1 space-y-2">
            {isQueimada ? (
              p.placarA !== p.placarB ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleEncerrar(p)}
                  className="w-full py-1.5 rounded-lg bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <span>
                    {isFinal
                      ? `Confirmar Campeão (${p.placarA > p.placarB ? p.escolaASigla : p.escolaBSigla})`
                      : `Avançar ${p.placarA > p.placarB ? p.escolaASigla : p.escolaBSigla}`}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleEncerrar(p, { vencedorForcado: 'A' })}
                    className="py-1.5 px-2 rounded-lg bg-[#00A878] hover:bg-[#087A5B] text-white text-[11px] font-bold truncate transition-colors disabled:opacity-50 cursor-pointer"
                    title={`Declarar vitória de ${p.escolaASigla || p.escolaANome}`}
                  >
                    Venceu {p.escolaASigla || p.escolaANome}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleEncerrar(p, { vencedorForcado: 'B' })}
                    className="py-1.5 px-2 rounded-lg bg-[#0F2540] hover:bg-[#17355A] text-white text-[11px] font-bold truncate transition-colors disabled:opacity-50 cursor-pointer"
                    title={`Declarar vitória de ${p.escolaBSigla || p.escolaBNome}`}
                  >
                    Venceu {p.escolaBSigla || p.escolaBNome}
                  </button>
                </div>
              )
            ) : usaSets ? (
              <div className="p-2 rounded-lg bg-[#F4F6F8] border border-slate-200/80 space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Sets ({isVolei ? 'Md3' : `Md${mdTenisMesa}`})
                  </span>
                  {isTenisMesa && (
                    <div className="inline-flex rounded-md bg-white border border-slate-200 p-0.5 text-[10px] font-bold">
                      <button
                        type="button"
                        onClick={() => setMdTenisMesa(3)}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${
                          mdTenisMesa === 3 ? 'bg-[#0F2540] text-white' : 'text-slate-500'
                        }`}
                      >
                        Md3
                      </button>
                      <button
                        type="button"
                        onClick={() => setMdTenisMesa(5)}
                        className={`px-1.5 py-0.5 rounded cursor-pointer ${
                          mdTenisMesa === 5 ? 'bg-[#0F2540] text-white' : 'text-slate-500'
                        }`}
                      >
                        Md5
                      </button>
                    </div>
                  )}
                </div>
                <input
                  type="text"
                  value={parciaisInput[p.id] ?? p.detalhesPlacar ?? ''}
                  onChange={(e) => setParciaisInput((prev) => ({ ...prev, [p.id]: e.target.value }))}
                  placeholder={isVolei ? 'Parciais opcional (ex: 25×18, 25×20)' : 'Parciais opcional (ex: 11×7, 11×9)'}
                  className="w-full px-2 py-1 rounded-md border border-slate-200 bg-white text-[11px] text-[#0F2540] placeholder:text-slate-400"
                />
                <div className={`grid gap-1 ${placaresRapidosSets.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
                  {placaresRapidosSets.map(([sa, sb]) => (
                    <button
                      key={`${sa}x${sb}`}
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        handleEncerrar(p, {
                          placarFinal: { placarA: sa, placarB: sb },
                          detalhesPlacar: (parciaisInput[p.id] ?? p.detalhesPlacar ?? '').trim() || null,
                        })
                      }
                      className={`py-1 rounded-md text-[11px] font-black tabular-nums transition-colors disabled:opacity-40 cursor-pointer ${
                        sa > sb
                          ? 'bg-[#00A878] hover:bg-[#087A5B] text-white'
                          : 'bg-[#0F2540] hover:bg-[#17355A] text-white'
                      }`}
                      title={`${p.escolaASigla || p.escolaANome} ${sa} × ${sb} ${p.escolaBSigla || p.escolaBNome}`}
                    >
                      {sa}×{sb}
                    </button>
                  ))}
                </div>
                {p.placarA !== p.placarB && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleEncerrar(p)}
                    className="w-full py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#087A5B] text-[11px] font-bold cursor-pointer"
                  >
                    Confirmar {p.placarA}×{p.placarB} →
                  </button>
                )}
              </div>
            ) : p.placarA !== p.placarB ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => handleEncerrar(p)}
                className="w-full py-1.5 rounded-lg bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <span>
                  {isFinal
                    ? `Confirmar Campeão (${p.placarA > p.placarB ? p.escolaASigla : p.escolaBSigla})`
                    : `Avançar ${p.placarA > p.placarB ? p.escolaASigla : p.escolaBSigla}`}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <div className="p-2.5 rounded-lg bg-[#F4F6F8] border border-slate-200/80 space-y-2">
                <p className="text-[11px] font-semibold text-[#0F2540] text-center">
                  Empate — placar dos pênaltis
                </p>
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={30}
                    placeholder="0"
                    value={penVals.a}
                    onChange={(e) =>
                      setPenaltisInput((prev) => ({ ...prev, [p.id]: { ...penVals, a: e.target.value } }))
                    }
                    className="w-14 py-1 rounded-md border border-slate-300 bg-white text-center text-xs font-bold tabular-nums text-[#0F2540]"
                  />
                  <span className="text-xs text-slate-400">×</span>
                  <input
                    type="number"
                    min={0}
                    max={30}
                    placeholder="0"
                    value={penVals.b}
                    onChange={(e) =>
                      setPenaltisInput((prev) => ({ ...prev, [p.id]: { ...penVals, b: e.target.value } }))
                    }
                    className="w-14 py-1 rounded-md border border-slate-300 bg-white text-center text-xs font-bold tabular-nums text-[#0F2540]"
                  />
                </div>
                <button
                  type="button"
                  disabled={busy || penVals.a === '' || penVals.b === ''}
                  onClick={() =>
                    handleEncerrar(p, {
                      penaltis: { penA: Number(penVals.a), penB: Number(penVals.b) },
                    })
                  }
                  className="w-full py-1.5 rounded-lg bg-[#0F2540] hover:bg-[#17355A] text-white text-[11px] font-bold disabled:opacity-40 cursor-pointer"
                >
                  Confirmar {p.placarA} ({penVals.a || '0'}) × {p.placarB} ({penVals.b || '0'}) →
                </button>
              </div>
            )}
          </div>
        )}

        {encerrado && (
          <div className="flex items-center justify-end">
            <button
              type="button"
              disabled={busy}
              onClick={() => handleReabrir(p)}
              className="text-[11px] text-slate-400 hover:text-[#0F2540] font-medium flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reabrir</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="border-t border-slate-100 pt-5 space-y-5">
      {/* ================================================================ */}
      {/* 1. CABEÇALHO ESPORTIVO DA COMPETIÇÃO                             */}
      {/* ================================================================ */}
      <div className="rounded-xl bg-[#F4F6F8] border border-slate-200/70 px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#00A878]">
              {resumoCompeticao.faseAtual}
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-500">
              {chaveamento.categoria} · {chaveamento.sexo === 'MASCULINO' ? 'Masculino' : 'Feminino'}
            </span>
          </div>
          <h4 className="text-lg font-black text-[#0F2540] tracking-tight leading-tight">
            {chaveamento.modalidadeNome}
          </h4>
        </div>

        {/* Métricas limpas */}
        <div className="flex flex-wrap items-center gap-5 sm:gap-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Equipes</p>
            <p className="text-base font-black text-[#0F2540] tabular-nums">{resumoCompeticao.totalEquipes}</p>
          </div>
          <div className="h-7 w-px bg-slate-200" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Partidas</p>
            <p className="text-base font-black text-[#0F2540] tabular-nums">{resumoCompeticao.totalPartidas}</p>
          </div>
          <div className="h-7 w-px bg-slate-200" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Concluídas</p>
            <p className="text-base font-black text-[#00A878] tabular-nums">{resumoCompeticao.concluidas}</p>
          </div>
          <div className="h-7 w-px bg-slate-200" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pendentes</p>
            <p className="text-base font-black text-slate-600 tabular-nums">{resumoCompeticao.pendentes}</p>
          </div>

          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <button
              type="button"
              onClick={() => gerarPdfChaveamentoVisual(chaveamento, partidasOrdenadas)}
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-emerald-50 border border-emerald-200 text-[#087A5B] text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Baixar PDF no modelo Chaveamento Visual (Paisagem)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF Chave</span>
            </button>
            <button
              type="button"
              onClick={() => setAbrirReagendarLote((v) => !v)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                abrirReagendarLote
                  ? 'bg-[#0F2540] text-white border-[#0F2540]'
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-[#0F2540]'
              }`}
              title="Reagendar data, horário e quadra de todas as partidas deste chaveamento"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Horários</span>
            </button>
            <button
              type="button"
              disabled={ocupadoId === 'PUBLICAR'}
              onClick={handlePublicarEventosETelao}
              className="px-3 py-1.5 rounded-lg bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
              title="Publicar tabela, cronograma e chamada no Portal /eventos e no Telão"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>{ocupadoId === 'PUBLICAR' ? 'Publicando...' : 'Publicar Eventos & Telão'}</span>
            </button>
            {temMataMata && temGrupos && (
              <button
                type="button"
                disabled={ocupadoId === 'RECALC'}
                onClick={handleRecalcularAvanco}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-[#0F2540] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                title="Sincronizar classificados dos grupos para o mata-mata"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${ocupadoId === 'RECALC' ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sincronizar</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleAbrirFinalizar}
              className="px-3.5 py-1.5 rounded-lg bg-[#0F2540] hover:bg-[#17355A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Flag className="w-3.5 h-3.5 text-amber-400" />
              <span>{finalizacaoSalva ? 'Premiação' : 'Finalizar'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Barra expansível: Reagendar Horários em Lote */}
      {abrirReagendarLote && (
        <div className="rounded-xl bg-white border border-slate-200 p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black text-[#0F2540]">Reagendar Horários em Lote</p>
              <p className="text-[11px] text-slate-500">
                Atualiza todas as {partidasOrdenadas.length} partidas deste chaveamento de uma vez (você também pode clicar no horário de qualquer jogo individual).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAbrirReagendarLote(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 items-end">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Data dos Jogos</label>
              <input
                type="date"
                value={loteData}
                onChange={(e) => setLoteData(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-[#0F2540]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">1º Jogo às</label>
              <input
                type="time"
                value={loteHoraInicio}
                onChange={(e) => setLoteHoraInicio(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-[#0F2540]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Intervalo (min)</label>
              <input
                type="number"
                min={5}
                max={120}
                value={loteIntervalo}
                onChange={(e) => setLoteIntervalo(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-[#0F2540]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Quadra / Local (opcional)</label>
              <input
                type="text"
                value={loteLocal}
                onChange={(e) => setLoteLocal(e.target.value)}
                placeholder="Ex: Quadra 1"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-[#0F2540]"
              />
            </div>
            <button
              type="button"
              disabled={ocupadoId === 'REAGENDAR_LOTE'}
              onClick={handleAplicarHorariosLote}
              className="px-3.5 py-2 rounded-lg bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {ocupadoId === 'REAGENDAR_LOTE' ? 'Salvando...' : 'Aplicar em todas'}
            </button>
          </div>
        </div>
      )}

      {/* Feedback de avanço / publicação */}
      {avisoAvanco && (
        <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-semibold flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00A878] shrink-0" />
            <span>{avisoAvanco}</span>
          </div>
          {publicadoFeedback && (
            <div className="flex items-center gap-2">
              <a
                href="/eventos"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-md bg-white border border-emerald-200 text-[#087A5B] hover:bg-emerald-100 text-[11px] font-bold inline-flex items-center gap-1"
              >
                <span>Abrir Portal /eventos</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href="/eventos/telao"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-md bg-[#0F2540] text-white hover:bg-[#17355A] text-[11px] font-bold inline-flex items-center gap-1"
              >
                <span>Abrir Telão</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Banner de Campeonato Finalizado */}
      {finalizacaoSalva && (
        <div className="rounded-xl bg-gradient-to-r from-[#0F2540] to-[#16365C] text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                Competição Finalizada
              </p>
              <p className="text-sm font-black">
                Campeão: {finalizacaoSalva.campeao?.sigla || '-'}
                {finalizacaoSalva.vice ? ` · Vice: ${finalizacaoSalva.vice.sigla}` : ''}
                {finalizacaoSalva.terceiro ? ` · 3º: ${finalizacaoSalva.terceiro.sigla}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            {finalizacaoSalva.artilheiro && (
              <span className="px-3 py-1 rounded-full bg-white/10 font-semibold flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-300" />
                {finalizacaoSalva.artilheiro.nome}
                {finalizacaoSalva.artilheiro.gols ? ` (${finalizacaoSalva.artilheiro.gols})` : ''}
              </span>
            )}
            <button
              type="button"
              onClick={handleAbrirFinalizar}
              className="text-xs font-semibold text-white/80 hover:text-white underline cursor-pointer"
            >
              Editar
            </button>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 2. NAVEGAÇÃO EM 3 ABAS PRINCIPAIS                                */}
      {/* ================================================================ */}
      <div className="border-b border-slate-200 flex items-center gap-6 overflow-x-auto">
        {(
          [
            { id: 'JOGOS', label: 'Jogos e Resultados', count: partidasOrdenadas.length, icon: Swords },
            { id: 'CLASSIFICACAO', label: 'Classificação', count: classificacoes.length, icon: ListOrdered },
            { id: 'CHAVEAMENTO', label: 'Chaveamento', count: fasesMataMata.reduce((acc, f) => acc + f.jogos.length, 0), icon: GitBranch },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const ativa = abaAtiva === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAbaAtiva(tab.id)}
              className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                ativa
                  ? 'border-[#00A878] text-[#0F2540]'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${ativa ? 'text-[#00A878]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums ${
                    ativa ? 'bg-emerald-50 text-[#087A5B]' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ================================================================ */}
      {/* ABA 1: JOGOS E RESULTADOS                                        */}
      {/* ================================================================ */}
      {abaAtiva === 'JOGOS' && (
        <div className="space-y-4">
          {/* Barra de filtros limpos */}
          <div className="flex flex-wrap items-center gap-2 bg-[#F4F6F8] p-3 rounded-xl border border-slate-200/70">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1 shrink-0" />

            <select
              value={filtroRodada}
              onChange={(e) => setFiltroRodada(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-[#0F2540]"
            >
              <option value="TODAS">Todas as rodadas/fases</option>
              {opcoesFiltros.rodadas.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>

            {gruposNomes.length > 1 && (
              <select
                value={filtroGrupo}
                onChange={(e) => setFiltroGrupo(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-[#0F2540]"
              >
                <option value="TODOS">Todos os grupos</option>
                {gruposNomes.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            )}

            <select
              value={filtroEquipe}
              onChange={(e) => setFiltroEquipe(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-[#0F2540]"
            >
              <option value="TODAS">Todas as equipes</option>
              {opcoesFiltros.equipes.map(([id, nome]) => (
                <option key={id} value={id}>{nome}</option>
              ))}
            </select>

            {opcoesFiltros.datas.length > 1 && (
              <select
                value={filtroData}
                onChange={(e) => setFiltroData(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-[#0F2540]"
              >
                <option value="TODAS">Todas as datas</option>
                {opcoesFiltros.datas.map((d) => (
                  <option key={d} value={d}>{formatarDataBR(d)}</option>
                ))}
              </select>
            )}

            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-[#0F2540]"
            >
              <option value="TODOS">Todas as situações</option>
              <option value="AGENDADO">Agendada</option>
              <option value="AO_VIVO">Em andamento</option>
              <option value="ENCERRADO">Encerrada</option>
              <option value="ADIADO">Adiada</option>
              <option value="CANCELADO">Cancelada</option>
              <option value="WO">W.O.</option>
            </select>

            {opcoesFiltros.quadras.length > 1 && (
              <select
                value={filtroQuadra}
                onChange={(e) => setFiltroQuadra(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-[#0F2540]"
              >
                <option value="TODAS">Todas as quadras</option>
                {opcoesFiltros.quadras.map((q) => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            )}

            {temFiltroAtivo && (
              <button
                type="button"
                onClick={limparFiltros}
                className="ml-auto px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 cursor-pointer"
              >
                Limpar filtros
              </button>
            )}
          </div>

          {/* Lista de confrontos em linhas flutuantes sobre superfície cinza clara */}
          {partidasAgrupadasPorBloco.length === 0 ? (
            <div className="rounded-xl bg-[#F4F6F8] py-10 text-center text-xs text-slate-500">
              Nenhuma partida encontrada com os filtros selecionados.
            </div>
          ) : (
            <div className="space-y-5">
              {partidasAgrupadasPorBloco.map(([tituloBloco, jogos]) => (
                <div key={tituloBloco} className="rounded-xl bg-[#F4F6F8] p-3.5 sm:p-4 space-y-2">
                  <div className="flex items-center justify-between px-1 pb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0F2540]">
                      {tituloBloco}
                    </span>
                    <span className="text-[11px] text-slate-400">{jogos.length} jogo(s)</span>
                  </div>

                  <div className="space-y-2">
                    {jogos.map((p) => {
                      const encerrado = p.status === 'ENCERRADO' || p.status === 'WO';
                      const cancelado = p.status === 'CANCELADO';
                      const busy = ocupadoId === p.id;
                      const st = STATUS_META[p.status] || STATUS_META.AGENDADO;
                      const pen = parsePenaltis(p.detalhesPlacar);
                      const ambosDefinidos = !isTbd(p.escolaAId) && !isTbd(p.escolaBId);
                      const venceuA = encerrado && (p.vencedorEscolaId === p.escolaAId || (!p.vencedorEscolaId && p.placarA > p.placarB));
                      const venceuB = encerrado && (p.vencedorEscolaId === p.escolaBId || (!p.vencedorEscolaId && p.placarB > p.placarA));

                      return (
                        <div
                          key={p.id}
                          className={`bg-white rounded-lg px-4 py-3 shadow-[0_1px_2px_rgba(15,37,64,0.05)] border border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                            cancelado ? 'opacity-60' : ''
                          }`}
                        >
                          {/* Meta: Jogo, Data, Hora, Quadra (editável em 1 clique) */}
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 lg:w-64 shrink-0">
                            <span className="font-mono font-bold text-[#0F2540]/70 w-7 shrink-0">J{p.numeroJogo || '-'}</span>
                            {editandoHorarioId === p.id ? (
                              <div className="flex items-center gap-1 flex-wrap">
                                <input
                                  type="date"
                                  value={editDataEvento}
                                  onChange={(e) => setEditDataEvento(e.target.value)}
                                  className="px-1.5 py-0.5 rounded border border-slate-300 bg-white text-[11px] text-[#0F2540]"
                                />
                                <input
                                  type="time"
                                  value={editHorario}
                                  onChange={(e) => setEditHorario(e.target.value)}
                                  className="px-1.5 py-0.5 rounded border border-slate-300 bg-white text-[11px] text-[#0F2540]"
                                />
                                <input
                                  type="text"
                                  value={editLocal}
                                  onChange={(e) => setEditLocal(e.target.value)}
                                  placeholder="Quadra"
                                  className="w-20 px-1.5 py-0.5 rounded border border-slate-300 bg-white text-[11px] text-[#0F2540]"
                                />
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleSalvarHorarioPartida(p.id)}
                                  className="p-1 rounded bg-[#00A878] text-white cursor-pointer"
                                  title="Salvar horário"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditandoHorarioId(null)}
                                  className="p-1 rounded bg-slate-200 text-slate-600 cursor-pointer"
                                  title="Cancelar"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleAbrirEditarHorario(p)}
                                className="flex items-center gap-2 hover:text-[#0F2540] transition-colors cursor-pointer text-left min-w-0"
                                title="Clique para editar data, horário e quadra"
                              >
                                <span className="flex items-center gap-1 shrink-0">
                                  <Calendar className="w-3 h-3" />
                                  {formatarDataBR(p.dataEvento).slice(0, 5)} · {p.horario}
                                </span>
                                {p.local && (
                                  <span className="hidden sm:flex items-center gap-1 truncate max-w-[100px]" title={p.local}>
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{p.local}</span>
                                  </span>
                                )}
                                <Edit3 className="w-3 h-3 text-slate-300 hover:text-[#00A878] shrink-0" />
                              </button>
                            )}
                          </div>

                          {/* Confronto centralizado com placar em destaque */}
                          <div className="flex items-center justify-center gap-3 flex-1 min-w-0">
                            <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
                              <span className={`text-xs truncate text-right ${venceuA ? 'font-black text-[#0F2540]' : 'font-semibold text-slate-700'}`}>
                                {p.escolaASigla || p.escolaANome}
                              </span>
                              {!isTbd(p.escolaAId) &&
                                renderEscudo(p.escolaASigla || p.escolaANome, venceuA ? 'vencedor' : venceuB && p.fase !== 'GRUPOS' ? 'eliminado' : 'neutro', 'sm')}
                            </div>

                            {/* Placar */}
                            <div className="flex items-center gap-1.5 bg-[#F4F6F8] px-2.5 py-1 rounded-lg border border-slate-200/80 shrink-0">
                              {!encerrado && !cancelado && ambosDefinidos && (
                                <button type="button" disabled={busy} onClick={() => handlePlacar(p, -1, 0)} className="w-5 h-5 rounded hover:bg-white text-slate-500 font-bold text-xs">
                                  -
                                </button>
                              )}
                              <span className="min-w-6 text-center text-sm font-black tabular-nums text-[#0F2540]">
                                {p.placarA}
                                {pen && <span className="text-[11px] text-[#00A878] ml-0.5">({pen.penA})</span>}
                              </span>
                              {!encerrado && !cancelado && ambosDefinidos && (
                                <button type="button" disabled={busy} onClick={() => handlePlacar(p, 1, 0)} className="w-5 h-5 rounded hover:bg-white text-slate-500 font-bold text-xs">
                                  +
                                </button>
                              )}
                              <span className="text-slate-300 font-normal px-0.5">×</span>
                              {!encerrado && !cancelado && ambosDefinidos && (
                                <button type="button" disabled={busy} onClick={() => handlePlacar(p, 0, -1)} className="w-5 h-5 rounded hover:bg-white text-slate-500 font-bold text-xs">
                                  -
                                </button>
                              )}
                              <span className="min-w-6 text-center text-sm font-black tabular-nums text-[#0F2540]">
                                {p.placarB}
                                {pen && <span className="text-[11px] text-[#00A878] ml-0.5">({pen.penB})</span>}
                              </span>
                              {!encerrado && !cancelado && ambosDefinidos && (
                                <button type="button" disabled={busy} onClick={() => handlePlacar(p, 0, 1)} className="w-5 h-5 rounded hover:bg-white text-slate-500 font-bold text-xs">
                                  +
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {!isTbd(p.escolaBId) &&
                                renderEscudo(p.escolaBSigla || p.escolaBNome, venceuB ? 'vencedor' : venceuA && p.fase !== 'GRUPOS' ? 'eliminado' : 'neutro', 'sm')}
                              <span className={`text-xs truncate ${venceuB ? 'font-black text-[#0F2540]' : 'font-semibold text-slate-700'}`}>
                                {p.escolaBSigla || p.escolaBNome}
                              </span>
                            </div>
                          </div>

                          {/* Situação & Ação */}
                          <div className="flex items-center justify-end gap-2 lg:w-auto shrink-0 flex-wrap">
                            {encerrado && p.detalhesPlacar && !pen && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-600">
                                {p.detalhesPlacar}
                              </span>
                            )}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 ${st.bg} ${st.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                              {st.label}
                            </span>

                            {!encerrado ? (
                              <div className="flex items-center gap-1 flex-wrap justify-end">
                                {ambosDefinidos && !cancelado && isQueimada && p.placarA === p.placarB ? (
                                  <>
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() => handleEncerrar(p, { vencedorForcado: 'A' })}
                                      className="px-2 py-1 rounded-md bg-[#00A878] hover:bg-[#087A5B] text-white text-[11px] font-bold cursor-pointer max-w-[110px] truncate"
                                      title={`Vitória de ${p.escolaASigla || p.escolaANome}`}
                                    >
                                      Venceu {p.escolaASigla || p.escolaANome}
                                    </button>
                                    <button
                                      type="button"
                                      disabled={busy}
                                      onClick={() => handleEncerrar(p, { vencedorForcado: 'B' })}
                                      className="px-2 py-1 rounded-md bg-[#0F2540] hover:bg-[#17355A] text-white text-[11px] font-bold cursor-pointer max-w-[110px] truncate"
                                      title={`Vitória de ${p.escolaBSigla || p.escolaBNome}`}
                                    >
                                      Venceu {p.escolaBSigla || p.escolaBNome}
                                    </button>
                                  </>
                                ) : ambosDefinidos && !cancelado && usaSets ? (
                                  <>
                                    <input
                                      type="text"
                                      value={parciaisInput[p.id] ?? p.detalhesPlacar ?? ''}
                                      onChange={(e) => setParciaisInput((prev) => ({ ...prev, [p.id]: e.target.value }))}
                                      placeholder={isVolei ? '25×18, 25×20' : '11×7, 11×9'}
                                      className="w-24 px-1.5 py-1 rounded-md border border-slate-200 bg-white text-[10px] text-[#0F2540] placeholder:text-slate-400"
                                      title="Parciais dos sets (opcional)"
                                    />
                                    {placaresRapidosSets.slice(0, 4).map(([sa, sb]) => (
                                      <button
                                        key={`${sa}x${sb}`}
                                        type="button"
                                        disabled={busy}
                                        onClick={() =>
                                          handleEncerrar(p, {
                                            placarFinal: { placarA: sa, placarB: sb },
                                            detalhesPlacar: (parciaisInput[p.id] ?? p.detalhesPlacar ?? '').trim() || null,
                                          })
                                        }
                                        className={`px-1.5 py-1 rounded-md text-[10px] font-black tabular-nums text-white cursor-pointer ${
                                          sa > sb ? 'bg-[#00A878] hover:bg-[#087A5B]' : 'bg-[#0F2540] hover:bg-[#17355A]'
                                        }`}
                                      >
                                        {sa}×{sb}
                                      </button>
                                    ))}
                                  </>
                                ) : ambosDefinidos && !cancelado ? (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    onClick={() => handleEncerrar(p)}
                                    className="px-2.5 py-1 rounded-md bg-[#00A878] hover:bg-[#087A5B] text-white text-[11px] font-bold cursor-pointer"
                                  >
                                    Encerrar
                                  </button>
                                ) : null}
                                <select
                                  value={p.status}
                                  disabled={busy}
                                  onChange={(e) => handleMudarStatus(p, e.target.value)}
                                  className="px-1.5 py-1 rounded-md border border-slate-200 bg-white text-[11px] text-slate-600 cursor-pointer"
                                  title="Alterar situação da partida"
                                >
                                  <option value="AGENDADO">Agendada</option>
                                  <option value="AO_VIVO">Em andamento</option>
                                  <option value="ADIADO">Adiada</option>
                                  <option value="CANCELADO">Cancelada</option>
                                </select>
                              </div>
                            ) : (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleReabrir(p)}
                                className="p-1.5 rounded-md text-slate-400 hover:text-[#0F2540] hover:bg-slate-100 cursor-pointer"
                                title="Reabrir partida"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* ABA 2: CLASSIFICAÇÃO (ESTILO PREMIER LEAGUE / LIGA PROFISSIONAL) */}
      {/* ================================================================ */}
      {abaAtiva === 'CLASSIFICACAO' && (
        <div className="space-y-6">
          {classificacoes.length === 0 ? (
            <div className="rounded-xl bg-[#F4F6F8] py-12 text-center space-y-2">
              <p className="text-sm font-bold text-[#0F2540]">Competição em formato eliminatório direto</p>
              <p className="text-xs text-slate-500">
                Esta modalidade não possui fase de pontos corridos ou grupos. Acompanhe o avanço na aba{' '}
                <button
                  type="button"
                  onClick={() => setAbaAtiva('CHAVEAMENTO')}
                  className="font-bold text-[#00A878] underline cursor-pointer"
                >
                  Chaveamento
                </button>
                .
              </p>
            </div>
          ) : (
            classificacoes.map((grupo) => {
              const jogosDoGrupo = partidasGrupos.filter(
                (p) => (p.grupo?.trim() || 'Tabela Geral') === grupo.grupo
              );
              const grupoEncerrado =
                jogosDoGrupo.length > 0 &&
                jogosDoGrupo.every((p) => p.status === 'ENCERRADO' || p.status === 'WO' || p.status === 'CANCELADO');
              const corteClassificacao = isPontosCorridos ? 1 : classificacoes.length === 2 ? 2 : 1;

              return (
                <div key={grupo.chave} className="rounded-2xl bg-[#F4F6F8] p-4 sm:p-5 space-y-3">
                  {/* Título do Grupo / Tabela */}
                  <div className="flex items-center justify-between flex-wrap gap-2 px-1">
                    <div className="flex items-center gap-2.5">
                      <h5 className="text-sm font-black text-[#0F2540] tracking-tight">{grupo.grupo}</h5>
                      <span className="text-[11px] font-medium text-slate-400">
                        {configModalidade.notaPontuacao}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-[#00A878]" />
                        {isPontosCorridos ? 'Líder / Campeão' : 'Classificação'}
                      </span>
                      {grupoEncerrado && (
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          Eliminados
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tabela Premier League style com cabeçalho agrupado e linhas brancas flutuantes */}
                  <div className="overflow-x-auto">
                    <div className="min-w-[680px] space-y-2">
                      {/* Cabeçalho de grupos de colunas */}
                      <div className="grid grid-cols-12 items-end px-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <div className="col-span-1">POS</div>
                        <div className="col-span-4">EQUIPE</div>
                        <div className="col-span-3 text-center">
                          <div className="border-b border-slate-200/90 pb-1 mb-1 text-[9px] text-slate-400">Jogos</div>
                          <div className={`grid ${configModalidade.permiteEmpate ? 'grid-cols-4' : 'grid-cols-3'}`}>
                            <span>J</span>
                            <span>V</span>
                            {configModalidade.permiteEmpate && <span>E</span>}
                            <span>D</span>
                          </div>
                        </div>
                        <div className="col-span-2 text-center">
                          <div className="border-b border-slate-200/90 pb-1 mb-1 text-[9px] text-slate-400">
                            {configModalidade.grupoEstatisticas}
                          </div>
                          <div className="grid grid-cols-3">
                            <span>{configModalidade.labelPro}</span>
                            <span>{configModalidade.labelContra}</span>
                            <span>{configModalidade.labelSaldo}</span>
                          </div>
                        </div>
                        <div className="col-span-1 text-center text-[#0F2540]">PTS</div>
                        <div className="col-span-1 text-center">FORMA</div>
                      </div>

                      {/* Linhas flutuantes */}
                      {grupo.linhas.map((l, idx) => {
                        const pos = idx + 1;
                        const isLider = pos === 1;
                        const naZona = pos <= corteClassificacao;
                        const eliminado = grupoEncerrado && !naZona;
                        const forma = formaPorEquipe.get(l.escolaId) || [];

                        const barraCor = isLider
                          ? 'border-l-[#00A878]'
                          : naZona
                          ? 'border-l-emerald-400'
                          : eliminado
                          ? 'border-l-rose-500'
                          : 'border-l-slate-200';

                        return (
                          <React.Fragment key={l.escolaId}>
                            <div
                              className={`grid grid-cols-12 items-center bg-white rounded-md px-4 py-3 shadow-[0_1px_3px_rgba(15,37,64,0.05)] border-l-[3.5px] ${barraCor} transition-all hover:shadow-[0_2px_6px_rgba(15,37,64,0.08)]`}
                            >
                              {/* Posição */}
                              <div className="col-span-1 flex items-center gap-1.5 font-black text-xs text-[#0F2540] tabular-nums">
                                <span>{pos}</span>
                                {isLider && <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                              </div>

                              {/* Equipe */}
                              <div className="col-span-4 flex items-center gap-2.5 min-w-0 pr-2">
                                {renderEscudo(l.escolaSigla, isLider ? 'vencedor' : eliminado ? 'eliminado' : 'neutro', 'sm')}
                                <span className="text-xs font-bold text-[#0F2540] truncate">
                                  {l.escolaSigla}
                                </span>
                              </div>

                              {/* Jogos (J, V, [E], D) */}
                              <div className={`col-span-3 grid ${configModalidade.permiteEmpate ? 'grid-cols-4' : 'grid-cols-3'} text-center text-xs text-slate-600 font-medium tabular-nums`}>
                                <span>{l.jogos}</span>
                                <span>{l.vitorias}</span>
                                {configModalidade.permiteEmpate && <span>{l.empates}</span>}
                                <span>{l.derrotas}</span>
                              </div>

                              {/* Gols / Sets / Pontos */}
                              <div className="col-span-2 grid grid-cols-3 text-center text-xs text-slate-600 font-medium tabular-nums">
                                <span>{l.pro}</span>
                                <span>{l.contra}</span>
                                <span className={l.saldo > 0 ? 'text-[#00A878] font-bold' : l.saldo < 0 ? 'text-rose-600' : ''}>
                                  {l.saldo > 0 ? `+${l.saldo}` : l.saldo}
                                </span>
                              </div>

                              {/* Pontos */}
                              <div className="col-span-1 text-center text-sm font-black text-[#0F2540] tabular-nums">
                                {l.pontos}
                              </div>

                              {/* Últimos jogos (forma real) */}
                              <div className="col-span-1 flex items-center justify-center gap-1">
                                {forma.length === 0 ? (
                                  <span className="text-[10px] text-slate-300">—</span>
                                ) : (
                                  forma.map((f, fIdx) => (
                                    <span
                                      key={fIdx}
                                      title={f === 'V' ? 'Vitória' : f === 'E' ? 'Empate' : 'Derrota'}
                                      className={`w-2 h-2 rounded-full ${
                                        f === 'V'
                                          ? 'bg-[#00A878]'
                                          : f === 'E'
                                          ? 'bg-slate-300'
                                          : 'bg-rose-500'
                                      }`}
                                    />
                                  ))
                                )}
                              </div>
                            </div>

                            {/* Divisória limpa de Zona de Classificação (inspirada na referência) */}
                            {!isPontosCorridos && pos === corteClassificacao && grupo.linhas.length > corteClassificacao && (
                              <div className="py-1 flex items-center justify-center gap-3">
                                <span className="h-px flex-1 bg-slate-200" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                  Zona de Classificação
                                </span>
                                <span className="h-px flex-1 bg-slate-200" />
                              </div>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>

                  {/* Jogos do grupo/tabela inline logo abaixo para lançar placar sem trocar de aba */}
                  {jogosDoGrupo.length > 0 && (
                    <div className="pt-3 border-t border-slate-200/80 space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                        Jogos ({jogosDoGrupo.filter((j) => j.status === 'ENCERRADO' || j.status === 'WO').length}/{jogosDoGrupo.length} concluídos)
                      </p>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                        {jogosDoGrupo.map((p) => {
                          const encerrado = p.status === 'ENCERRADO' || p.status === 'WO';
                          const busy = ocupadoId === p.id;
                          return (
                            <div
                              key={p.id}
                              className="bg-white rounded-lg px-3 py-2 shadow-[0_1px_2px_rgba(15,37,64,0.04)] border border-slate-100 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="text-[10px] font-mono text-slate-400">J{p.numeroJogo || '-'}</span>
                                <span className="font-semibold text-[#0F2540] truncate flex-1 text-right">
                                  {p.escolaASigla || p.escolaANome}
                                </span>
                                <div className="flex items-center gap-1 bg-[#F4F6F8] px-1.5 py-0.5 rounded-md border border-slate-200/80 shrink-0">
                                  {!encerrado && (
                                    <button type="button" disabled={busy} onClick={() => handlePlacar(p, -1, 0)} className="w-4 h-4 rounded hover:bg-white text-slate-500 font-bold">
                                      -
                                    </button>
                                  )}
                                  <span className="w-4 text-center font-black tabular-nums text-[#0F2540]">{p.placarA}</span>
                                  {!encerrado && (
                                    <button type="button" disabled={busy} onClick={() => handlePlacar(p, 1, 0)} className="w-4 h-4 rounded hover:bg-white text-slate-500 font-bold">
                                      +
                                    </button>
                                  )}
                                  <span className="text-slate-300">×</span>
                                  {!encerrado && (
                                    <button type="button" disabled={busy} onClick={() => handlePlacar(p, 0, -1)} className="w-4 h-4 rounded hover:bg-white text-slate-500 font-bold">
                                      -
                                    </button>
                                  )}
                                  <span className="w-4 text-center font-black tabular-nums text-[#0F2540]">{p.placarB}</span>
                                  {!encerrado && (
                                    <button type="button" disabled={busy} onClick={() => handlePlacar(p, 0, 1)} className="w-4 h-4 rounded hover:bg-white text-slate-500 font-bold">
                                      +
                                    </button>
                                  )}
                                </div>
                                <span className="font-semibold text-[#0F2540] truncate flex-1">
                                  {p.escolaBSigla || p.escolaBNome}
                                </span>
                              </div>
                              {!encerrado ? (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleEncerrar(p)}
                                  className="px-2 py-1 rounded-md bg-[#00A878] hover:bg-[#087A5B] text-white text-[10px] font-bold shrink-0 cursor-pointer"
                                >
                                  OK
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleReabrir(p)}
                                  className="p-1 rounded-md text-slate-400 hover:text-[#0F2540] shrink-0 cursor-pointer"
                                  title="Reabrir"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* ABA 3: CHAVEAMENTO E FASES FINAIS (COM CONECTORES VISUAIS)       */}
      {/* ================================================================ */}
      {abaAtiva === 'CHAVEAMENTO' && (
        <div>
          {fasesMataMata.length === 0 ? (
            <div className="rounded-xl bg-[#F4F6F8] py-12 text-center space-y-2">
              <p className="text-sm font-bold text-[#0F2540]">Competição em Pontos Corridos</p>
              <p className="text-xs text-slate-500">
                Nesta tabela o 1º colocado ao final das rodadas é o campeão. Acompanhe na aba{' '}
                <button
                  type="button"
                  onClick={() => setAbaAtiva('CLASSIFICACAO')}
                  className="font-bold text-[#00A878] underline cursor-pointer"
                >
                  Classificação
                </button>
                .
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#F4F6F8] p-4 sm:p-6 overflow-x-auto">
              <div className="flex items-stretch min-w-max">
                {fasesMataMata.map((col, colIdx) => {
                  const temProxima = colIdx < fasesMataMata.length - 1;
                  return (
                    <React.Fragment key={col.fase}>
                      <div className="w-76 shrink-0 flex flex-col gap-3">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[11px] font-black uppercase tracking-wider text-[#0F2540]">
                            {col.label}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400">
                            {col.jogos.length} jogo(s)
                          </span>
                        </div>
                        <div className="flex-1 flex flex-col justify-around gap-4">
                          {col.jogos.map((p) => renderCardChaveamento(p, col.fase === 'FINAL'))}
                          {col.fase === 'FINAL' && jogoTerceiroLugar && (
                            <div className="pt-4 border-t border-dashed border-slate-300 space-y-2">
                              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 px-1 block">
                                Disputa de 3º Lugar
                              </span>
                              {renderCardChaveamento(jogoTerceiroLugar, false)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Conectores gráficos entre fases */}
                      {temProxima && (
                        <div className="w-10 shrink-0 flex flex-col justify-around py-10">
                          {Array.from({ length: Math.max(1, Math.ceil(col.jogos.length / 2)) }).map((_, cIdx) => (
                            <div key={cIdx} className="flex-1 flex items-center">
                              <div className="w-5 h-1/2 border-r-2 border-t-2 border-b-2 border-slate-300 rounded-r-lg" />
                              <div className="w-5 border-t-2 border-slate-300" />
                            </div>
                          ))}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* PAINEL INLINE: FINALIZAR CAMPEONATO                              */}
      {/* ================================================================ */}
      {abrirFinalizar && (
        <div className="rounded-2xl border border-[#0F2540]/20 bg-white shadow-md p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-black text-[#0F2540] flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Finalizar Campeonato & Premiação Oficial</span>
            </h4>
            <button
              type="button"
              onClick={() => setAbrirFinalizar(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">1º Campeão</label>
              <select
                value={finCampeaoId}
                onChange={(e) => setFinCampeaoId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs font-bold text-[#0F2540]"
              >
                <option value="">Selecione...</option>
                {escolasOrdenadas.map((e) => (
                  <option key={e.id} value={e.id}>{e.sigla || e.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">2º Vice-Campeão</label>
              <select
                value={finViceId}
                onChange={(e) => setFinViceId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-[#0F2540]"
              >
                <option value="">Opcional...</option>
                {escolasOrdenadas.map((e) => (
                  <option key={e.id} value={e.id}>{e.sigla || e.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">3º Lugar</label>
              <select
                value={finTerceiroId}
                onChange={(e) => setFinTerceiroId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-[#0F2540]"
              >
                <option value="">Opcional...</option>
                {escolasOrdenadas.map((e) => (
                  <option key={e.id} value={e.id}>{e.sigla || e.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Artilheiro / Destaque (opcional)
              </label>
              <input
                type="text"
                value={finArtilheiroNome}
                onChange={(e) => setFinArtilheiroNome(e.target.value)}
                placeholder="Nome do atleta e escola"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Gols / Pontos</label>
              <input
                type="number"
                min={0}
                value={finArtilheiroGols}
                onChange={(e) => setFinArtilheiroGols(e.target.value)}
                placeholder="Ex: 7"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={lancarMedalhasAuto}
                onChange={(e) => setLancarMedalhasAuto(e.target.checked)}
                className="accent-[#00A878]"
              />
              <span>Lançar Ouro, Prata e Bronze automaticamente no Quadro de Medalhas</span>
            </label>

            <button
              type="button"
              disabled={ocupadoId === 'FINALIZAR'}
              onClick={handleConfirmarFinalizacao}
              className="px-4 py-2 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>{ocupadoId === 'FINALIZAR' ? 'Finalizando...' : 'Confirmar & Finalizar'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
