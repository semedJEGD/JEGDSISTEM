'use client';

import React, { useMemo, useState } from 'react';
import {
  Search,
  ShieldCheck,
  Download,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  CheckCheck,
  Building2,
  Trophy,
  ChevronDown,
  ChevronRight,
  CameraOff,
  FileWarning,
  Eye,
  Share2,
} from 'lucide-react';
import { Escola, Atleta, InscricaoEquipe } from '@/types/jegd';
import { JegdPdfGenerator } from '@/lib/pdf-generator';

export interface AlertaInconsistencia {
  tipo: string;
  mensagem: string;
  escolaNome: string;
  atletaNome?: string;
}

interface AbaHomologacaoProps {
  busca: string;
  setBusca: (val: string) => void;
  filtroStatus: string;
  setFiltroStatus: (val: string) => void;
  inscricoes: InscricaoEquipe[];
  escolas: Escola[];
  atletas: Atleta[];
  alertas?: AlertaInconsistencia[];
  subAbaHomologacao?: 'EQUIPES' | 'ALERTAS';
  setSubAbaHomologacao?: (val: 'EQUIPES' | 'ALERTAS') => void;
  abrirModalAnalise: (insc: InscricaoEquipe) => void;
  onAprovarEquipeDireto?: (insc: InscricaoEquipe) => void;
  onAprovarLoteEquipes?: (inscs: InscricaoEquipe[]) => void;
}

const ORDEM_CAT: Record<string, number> = {
  MIRIM: 1,
  INFANTIL: 2,
  INFANTO: 3,
  JUNIOR: 4,
};

const ETAPAS_FILTRO = [
  { id: 'TODAS', label: 'Todas as Etapas', codigos: [] as string[] },
  { id: 'ETAPA1', label: '1ª Etapa (Queimada & Tênis de Mesa)', codigos: ['queimada', 'tenis-mesa'] },
  { id: 'ETAPA2', label: '2ª Etapa (Atletismo & Beach Soccer)', codigos: ['atletismo', 'beach-soccer'] },
  { id: 'ETAPA3', label: '3ª Etapa (Futsal, Futebol, Vôlei & Xadrez)', codigos: ['futsal', 'futebol-campo', 'voleibol', 'xadrez'] },
] as const;

function formatarDataCurtaBR(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function temFotoAtleta(a?: Atleta): boolean {
  if (!a) return false;
  return Boolean(a.documentos?.foto3x4 || (a as any).fotoUrl);
}

function temDocAtleta(a?: Atleta): boolean {
  if (!a) return false;
  if (a.semDocumento) return false;
  const num = (a.documentoNumero || '').trim().toUpperCase();
  return Boolean(num && num !== 'SEM DOCUMENTO' && num !== 'N/A');
}

export function AbaHomologacao({
  busca,
  setBusca,
  filtroStatus,
  setFiltroStatus,
  inscricoes,
  escolas,
  atletas,
  alertas = [],
  subAbaHomologacao,
  setSubAbaHomologacao,
  abrirModalAnalise,
  onAprovarEquipeDireto,
  onAprovarLoteEquipes,
}: AbaHomologacaoProps) {
  const [internalSubAba, setInternalSubAba] = useState<'EQUIPES' | 'ALERTAS'>('EQUIPES');
  const [modoAgrupamento, setModoAgrupamento] = useState<'ESCOLA' | 'MODALIDADE'>('ESCOLA');
  const [filtroEtapa, setFiltroEtapa] = useState<string>('TODAS');
  const [gruposRecolhidos, setGruposRecolhidos] = useState<Record<string, boolean>>({});

  const subAba = subAbaHomologacao !== undefined ? subAbaHomologacao : internalSubAba;
  const setSubAba = setSubAbaHomologacao || setInternalSubAba;

  // Índices rápidos O(1)
  const escolaPorId = useMemo(() => new Map(escolas.map((e) => [e.id, e])), [escolas]);
  const atletaPorId = useMemo(() => new Map(atletas.map((a) => [a.id, a])), [atletas]);

  // Diagnóstico automático de pendências reais por equipe e por escola
  const diagPorEquipe = useMemo(() => {
    const map = new Map<string, { semFoto: number; semDoc: number; atletasLista: Atleta[] }>();
    inscricoes.forEach((insc) => {
      const lista = insc.atletaIds
        .map((id) => atletaPorId.get(id))
        .filter((a): a is Atleta => Boolean(a));
      const semFoto = lista.filter((a) => !temFotoAtleta(a)).length;
      const semDoc = lista.filter((a) => !temDocAtleta(a)).length;
      map.set(insc.id, { semFoto, semDoc, atletasLista: lista });
    });
    return map;
  }, [inscricoes, atletaPorId]);

  // Pendências consolidadas de atletas (sem foto ou sem doc) agrupadas por escola para a sub-aba Auditoria
  const auditoriaPorEscola = useMemo(() => {
    const porEscola = new Map<
      string,
      {
        escolaId: string;
        escolaNome: string;
        escolaSigla: string;
        telefone?: string;
        pendencias: Array<{ atletaId: string; atletaNome: string; faltaFoto: boolean; faltaDoc: boolean }>;
      }
    >();

    const atletasInscritosIds = new Set<string>();
    inscricoes.forEach((i) => i.atletaIds.forEach((id) => atletasInscritosIds.add(id)));

    atletas.forEach((a) => {
      if (atletasInscritosIds.size > 0 && !atletasInscritosIds.has(a.id)) return;
      const faltaFoto = !temFotoAtleta(a);
      const faltaDoc = !temDocAtleta(a);
      if (!faltaFoto && !faltaDoc) return;

      const esc = escolaPorId.get(a.escolaId);
      const escId = a.escolaId || 'sem-escola';
      if (!porEscola.has(escId)) {
        porEscola.set(escId, {
          escolaId: escId,
          escolaNome: esc?.nome || 'Escola não identificada',
          escolaSigla: esc?.sigla || esc?.nome || '—',
          telefone: esc?.responsavelTelefone,
          pendencias: [],
        });
      }
      porEscola.get(escId)!.pendencias.push({
        atletaId: a.id,
        atletaNome: a.nomeCompleto,
        faltaFoto,
        faltaDoc,
      });
    });

    return Array.from(porEscola.values())
      .map((g) => ({
        ...g,
        pendencias: g.pendencias.sort((a, b) => a.atletaNome.localeCompare(b.atletaNome, 'pt-BR')),
      }))
      .sort((a, b) => b.pendencias.length - a.pendencias.length);
  }, [atletas, inscricoes, escolaPorId]);

  const totalPendenciasDoc = useMemo(
    () => auditoriaPorEscola.reduce((acc, g) => acc + g.pendencias.length, 0) + alertas.length,
    [auditoriaPorEscola, alertas.length]
  );

  const totalPendentes = useMemo(() => inscricoes.filter((i) => i.status === 'PENDENTE').length, [inscricoes]);
  const totalHomologadas = useMemo(() => inscricoes.filter((i) => i.status === 'VALIDADA').length, [inscricoes]);
  const totalRejeitadas = useMemo(() => inscricoes.filter((i) => i.status === 'REJEITADA').length, [inscricoes]);

  // Filtragem principal
  const inscricoesFiltradas = useMemo(() => {
    const etapaObj = ETAPAS_FILTRO.find((e) => e.id === filtroEtapa) || ETAPAS_FILTRO[0];
    const termo = busca.trim().toLowerCase();

    return inscricoes
      .filter((insc) => {
        if (filtroStatus !== 'TODOS' && insc.status !== filtroStatus) return false;
        if (etapaObj.codigos.length > 0) {
          const cod = (insc.modalidadeCodigo || '').toLowerCase();
          if (!(etapaObj.codigos as readonly string[]).includes(cod)) return false;
        }
        if (termo) {
          const esc = escolaPorId.get(insc.escolaId);
          const bateEsc =
            esc && (esc.nome.toLowerCase().includes(termo) || esc.sigla.toLowerCase().includes(termo));
          const bateMod = insc.modalidadeNome.toLowerCase().includes(termo);
          const diag = diagPorEquipe.get(insc.id);
          const bateAtleta = diag?.atletasLista.some((a) => a.nomeCompleto.toLowerCase().includes(termo));
          if (!bateEsc && !bateMod && !bateAtleta) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Pendentes primeiro, depois modalidade, categoria e sexo
        const statusPeso = (s: string) => (s === 'PENDENTE' ? 0 : s === 'REJEITADA' ? 1 : 2);
        const cmpSt = statusPeso(a.status) - statusPeso(b.status);
        if (cmpSt !== 0) return cmpSt;
        const cmpMod = a.modalidadeNome.localeCompare(b.modalidadeNome, 'pt-BR');
        if (cmpMod !== 0) return cmpMod;
        const cmpCat = (ORDEM_CAT[a.categoria] || 9) - (ORDEM_CAT[b.categoria] || 9);
        if (cmpCat !== 0) return cmpCat;
        return a.sexo.localeCompare(b.sexo);
      });
  }, [inscricoes, filtroStatus, filtroEtapa, busca, escolaPorId, diagPorEquipe]);

  // Agrupamento (Por Escola ou Por Modalidade)
  const gruposExibicao = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        titulo: string;
        subtitulo: string;
        inscricoes: InscricaoEquipe[];
      }
    >();

    inscricoesFiltradas.forEach((insc) => {
      const esc = escolaPorId.get(insc.escolaId);
      const key = modoAgrupamento === 'ESCOLA' ? insc.escolaId : insc.modalidadeCodigo || insc.modalidadeNome;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          titulo:
            modoAgrupamento === 'ESCOLA'
              ? esc?.nome || 'Escola não identificada'
              : insc.modalidadeNome,
          subtitulo: modoAgrupamento === 'ESCOLA' ? esc?.sigla || '' : 'Modalidade Oficial',
          inscricoes: [],
        });
      }
      map.get(key)!.inscricoes.push(insc);
    });

    return Array.from(map.values()).sort((a, b) => {
      const pendA = a.inscricoes.filter((i) => i.status === 'PENDENTE').length;
      const pendB = b.inscricoes.filter((i) => i.status === 'PENDENTE').length;
      if (pendA > 0 && pendB === 0) return -1;
      if (pendB > 0 && pendA === 0) return 1;
      return a.titulo.localeCompare(b.titulo, 'pt-BR');
    });
  }, [inscricoesFiltradas, modoAgrupamento, escolaPorId]);

  const toggleGrupo = (id: string) => {
    setGruposRecolhidos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleHomologarLoteGrupo = (tituloGrupo: string, inscs: InscricaoEquipe[]) => {
    const pendentes = inscs.filter((i) => i.status !== 'VALIDADA');
    if (pendentes.length === 0) return;
    if (
      !window.confirm(
        `Homologar todas as ${pendentes.length} equipe(s) pendente(s) de "${tituloGrupo}" de uma só vez?`
      )
    ) {
      return;
    }
    if (onAprovarLoteEquipes) {
      onAprovarLoteEquipes(pendentes);
    } else if (onAprovarEquipeDireto) {
      pendentes.forEach((i) => onAprovarEquipeDireto(i));
    }
  };

  const handleCobrarWhatsApp = (grupo: (typeof auditoriaPorEscola)[number]) => {
    const linhas = grupo.pendencias.slice(0, 15).map((p) => {
      const itens: string[] = [];
      if (p.faltaFoto) itens.push('Foto 3x4');
      if (p.faltaDoc) itens.push('RG/CPF');
      return `• ${p.atletaNome} (falta: ${itens.join(' e ')})`;
    });
    const extra =
      grupo.pendencias.length > 15 ? `\n... e mais ${grupo.pendencias.length - 15} aluno(s).` : '';
    const msg = `🏆 *JEGDS 2026 — Coordenação SEMED*\nOlá! A escola *${grupo.escolaNome}* possui *${grupo.pendencias.length}* atleta(s) com pendência cadastral para homologação:\n\n${linhas.join('\n')}${extra}\n\nPor favor, regularize no portal da escola para liberação dos crachás.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-4">
      {/* RESUMO LIMPO E COERENTE (CLICÁVEL COMO FILTRO RÁPIDO) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <button
          type="button"
          onClick={() => {
            setSubAba('EQUIPES');
            setFiltroStatus('TODOS');
          }}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            subAba === 'EQUIPES' && filtroStatus === 'TODOS'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${subAba === 'EQUIPES' && filtroStatus === 'TODOS' ? 'text-slate-300' : 'text-slate-400'}`}>
            Total de Equipes
          </span>
          <span className="text-xl font-black block mt-0.5">{inscricoes.length}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSubAba('EQUIPES');
            setFiltroStatus('PENDENTE');
          }}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            subAba === 'EQUIPES' && filtroStatus === 'PENDENTE'
              ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
              : 'bg-amber-50/60 border-amber-200 hover:bg-amber-50 text-amber-950'
          }`}
        >
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${subAba === 'EQUIPES' && filtroStatus === 'PENDENTE' ? 'text-amber-100' : 'text-amber-700'}`}>
            Pendentes
          </span>
          <span className="text-xl font-black block mt-0.5">{totalPendentes}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSubAba('EQUIPES');
            setFiltroStatus('VALIDADA');
          }}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            subAba === 'EQUIPES' && filtroStatus === 'VALIDADA'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50 text-emerald-950'
          }`}
        >
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${subAba === 'EQUIPES' && filtroStatus === 'VALIDADA' ? 'text-emerald-100' : 'text-emerald-700'}`}>
            Homologadas
          </span>
          <span className="text-xl font-black block mt-0.5">
            {totalHomologadas}
            {inscricoes.length > 0 && (
              <span className="text-xs font-bold opacity-75 ml-1.5">
                ({Math.round((totalHomologadas / inscricoes.length) * 100)}%)
              </span>
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setSubAba('ALERTAS')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            subAba === 'ALERTAS'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : totalPendenciasDoc > 0
              ? 'bg-rose-50/60 border-rose-200 hover:bg-rose-50 text-rose-950'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <span className={`text-[11px] font-bold uppercase tracking-wider block ${subAba === 'ALERTAS' ? 'text-rose-100' : totalPendenciasDoc > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
            Sem Foto / Doc
          </span>
          <span className="text-xl font-black block mt-0.5">{totalPendenciasDoc}</span>
        </button>
      </div>

      {subAba === 'EQUIPES' ? (
        <>
          {/* BARRA DE FILTROS + ALTERNADOR POR ESCOLA / POR MODALIDADE */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-3 flex flex-col lg:flex-row gap-2.5 shadow-2xs">
            <div className="flex-1 relative">
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por escola, modalidade ou nome do aluno..."
                className="w-full px-3 py-1.5 pl-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <div className="grid grid-cols-2 sm:flex items-center gap-2">
              <select
                value={filtroEtapa}
                onChange={(e) => setFiltroEtapa(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                {ETAPAS_FILTRO.map((et) => (
                  <option key={et.id} value={et.id}>
                    {et.label}
                  </option>
                ))}
              </select>

              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium focus:outline-none focus:border-emerald-600 cursor-pointer"
              >
                <option value="TODOS">Todos Status</option>
                <option value="PENDENTE">Pendentes ({totalPendentes})</option>
                <option value="VALIDADA">Homologadas ({totalHomologadas})</option>
                <option value="REJEITADA">Devolvidas ({totalRejeitadas})</option>
              </select>

              {/* Toggle Agrupamento */}
              <div className="col-span-2 sm:col-span-1 flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setModoAgrupamento('ESCOLA')}
                  className={`flex-1 sm:flex-none px-2.5 py-1 rounded-md text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    modoAgrupamento === 'ESCOLA'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Por Escola</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModoAgrupamento('MODALIDADE')}
                  className={`flex-1 sm:flex-none px-2.5 py-1 rounded-md text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                    modoAgrupamento === 'MODALIDADE'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>Por Modalidade</span>
                </button>
              </div>
            </div>
          </div>

          {/* LISTA AGRUPADA (ESCOLA OU MODALIDADE) */}
          {gruposExibicao.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-xs text-slate-500">
              Nenhuma equipe encontrada para os filtros selecionados.
            </div>
          ) : (
            <div className="space-y-3">
              {gruposExibicao.map((grupo) => {
                const qtdTotal = grupo.inscricoes.length;
                const qtdOk = grupo.inscricoes.filter((i) => i.status === 'VALIDADA').length;
                const qtdPend = grupo.inscricoes.filter((i) => i.status !== 'VALIDADA').length;
                const pct = qtdTotal > 0 ? Math.round((qtdOk / qtdTotal) * 100) : 0;
                const recolhido =
                  gruposRecolhidos[grupo.id] !== undefined
                    ? gruposRecolhidos[grupo.id]
                    : qtdPend === 0 && filtroStatus === 'TODOS';

                return (
                  <div
                    key={grupo.id}
                    className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-2xs"
                  >
                    {/* Cabeçalho do Bloco (Escola ou Modalidade) */}
                    <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <button
                        type="button"
                        onClick={() => toggleGrupo(grupo.id)}
                        className="flex items-center gap-2.5 text-left min-w-0 cursor-pointer flex-1"
                      >
                        {recolhido ? (
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-black text-slate-900 truncate">{grupo.titulo}</h3>
                            {grupo.subtitulo && modoAgrupamento === 'ESCOLA' && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600">
                                {grupo.subtitulo}
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                qtdPend === 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {qtdOk}/{qtdTotal} homologadas
                            </span>
                          </div>
                          {/* Barra de progresso compacta */}
                          <div className="w-full max-w-xs h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                            <div
                              className="h-full bg-emerald-600 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </button>

                      {/* Ação em Lote do Grupo */}
                      {qtdPend > 0 && (onAprovarLoteEquipes || onAprovarEquipeDireto) && (
                        <button
                          type="button"
                          onClick={() => handleHomologarLoteGrupo(grupo.titulo, grupo.inscricoes)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Homologar todas ({qtdPend})</span>
                        </button>
                      )}
                    </div>

                    {/* Linhas das Equipes dentro do Grupo */}
                    {!recolhido && (
                      <div className="divide-y divide-slate-100">
                        {grupo.inscricoes.map((insc) => {
                          const escolaObj = escolaPorId.get(insc.escolaId);
                          const diag = diagPorEquipe.get(insc.id);
                          const semFoto = diag?.semFoto || 0;
                          const semDoc = diag?.semDoc || 0;

                          return (
                            <div
                              key={insc.id}
                              className="px-4 py-3 hover:bg-slate-50/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3 transition-colors"
                            >
                              <div className="space-y-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-xs sm:text-sm font-bold text-slate-900">
                                    {modoAgrupamento === 'ESCOLA'
                                      ? insc.modalidadeNome
                                      : `${escolaObj?.nome || 'Escola'} (${escolaObj?.sigla || '—'})`}
                                  </span>

                                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold border border-slate-200">
                                    {insc.categoria}
                                  </span>

                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                                      insc.sexo === 'FEMININO'
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200/70'
                                        : 'bg-sky-50 text-sky-700 border border-sky-200/70'
                                    }`}
                                  >
                                    {insc.sexo === 'FEMININO' ? 'FEM' : 'MASC'}
                                  </span>

                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
                                      insc.status === 'VALIDADA'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                        : insc.status === 'REJEITADA'
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : 'bg-amber-50 text-amber-800 border-amber-200'
                                    }`}
                                  >
                                    {insc.status === 'VALIDADA'
                                      ? 'HOMOLOGADA'
                                      : insc.status === 'REJEITADA'
                                      ? 'DEVOLVIDA'
                                      : 'PENDENTE'}
                                  </span>

                                  {/* Alertas visuais imediatos de pendência */}
                                  {semFoto > 0 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold inline-flex items-center gap-1">
                                      <CameraOff className="w-3 h-3" /> {semFoto} sem foto
                                    </span>
                                  )}
                                  {semDoc > 0 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold inline-flex items-center gap-1">
                                      <FileWarning className="w-3 h-3" /> {semDoc} sem doc
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2">
                                  <span>
                                    <strong className="text-slate-800">{insc.atletaIds.length}</strong>{' '}
                                    {insc.atletaIds.length === 1 ? 'atleta' : 'atletas'}
                                  </span>
                                  <span>•</span>
                                  <span>Enviada em {formatarDataCurtaBR(insc.dataInscricao)}</span>
                                  {insc.motivoRejeicao && (
                                    <>
                                      <span>•</span>
                                      <span className="text-rose-600 font-semibold">
                                        Motivo: {insc.motivoRejeicao}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Ações claras e sem duplicidade */}
                              <div className="flex flex-wrap items-center gap-1.5 justify-end shrink-0">
                                {onAprovarEquipeDireto && insc.status !== 'VALIDADA' && (
                                  <button
                                    type="button"
                                    onClick={() => onAprovarEquipeDireto(insc)}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                                    title="Homologar equipe imediatamente"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Homologar</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => abrirModalAnalise(insc)}
                                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                  title="Ver lista de atletas, conferir documentos ou devolver equipe"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-600" />
                                  <span>{insc.status === 'VALIDADA' ? 'Ver Equipe' : 'Conferir / Devolver'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (escolaObj) {
                                      const atls = diag?.atletasLista || [];
                                      await JegdPdfGenerator.gerarCrachasEmLote(
                                        escolaObj,
                                        atls,
                                        insc.modalidadeNome,
                                        `${insc.categoria} (${insc.sexo})`
                                      );
                                    }
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                                  title="Gerar crachás desta equipe em PDF"
                                >
                                  <Download className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Crachás</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* SUB-ABA: AUDITORIA REAL DE PENDÊNCIAS (SEM FOTO / SEM DOC) AGRUPADA POR ESCOLA */
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>
                Auditoria automática de atletas inscritos sem <strong>Foto 3×4</strong> ou sem{' '}
                <strong>RG/CPF</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSubAba('EQUIPES')}
              className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer shrink-0"
            >
              ← Voltar às Equipes
            </button>
          </div>

          {auditoriaPorEscola.length === 0 && alertas.length === 0 ? (
            <div className="bg-white border border-emerald-200 rounded-xl p-8 text-center text-xs text-emerald-800 font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Excelente! Todos os atletas inscritos possuem foto 3×4 e documento preenchidos.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {auditoriaPorEscola.map((grupo) => (
                <div
                  key={grupo.escolaId}
                  className="bg-white border border-rose-200/80 rounded-xl overflow-hidden shadow-2xs flex flex-col justify-between"
                >
                  <div>
                    <div className="px-4 py-3 bg-rose-50/60 border-b border-rose-200/70 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-black text-slate-900 truncate">{grupo.escolaNome}</h3>
                        <p className="text-[11px] font-semibold text-rose-700">
                          {grupo.pendencias.length} {grupo.pendencias.length === 1 ? 'atleta pendente' : 'atletas pendentes'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCobrarWhatsApp(grupo)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Cobrar WhatsApp</span>
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                      {grupo.pendencias.map((p) => (
                        <div key={p.atletaId} className="px-4 py-2 flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-slate-800 truncate">{p.atletaNome}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {p.faltaFoto && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                                Sem Foto
                              </span>
                            )}
                            {p.faltaDoc && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                                Sem Doc
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {alertas.map((alerta, idx) => (
                <div key={`al-${idx}`} className="bg-white border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900">{alerta.atletaNome}</span>
                      <span className="text-slate-500 text-[11px]">({alerta.escolaNome})</span>
                    </div>
                    <p className="text-rose-700 text-[11px]">{alerta.mensagem}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
