'use client';

import React, { useMemo, useState } from 'react';
import {
  Trophy,
  GitBranch,
  BarChart3,
  ListOrdered,
  Calendar,
  MapPin,
  Filter,
  Swords,
  Layers,
} from 'lucide-react';
import {
  ChaveamentoEventoItem,
  PartidaEventoItem,
  LinhaClassificacao,
} from '@/types/eventos';
import {
  FASES_LABEL,
  formatarDataBR,
} from '@/lib/eventos-service';
import {
  EstruturaXadrez,
  ProvaAtletismoBalizamento,
  calcularClassificacaoXadrez,
  formatarPlacarComPenaltis,
  normalizarCodigoModalidade,
  obterConfigColunasModalidade,
} from '@/lib/chaveamento-service';

interface ClassificacaoGrupo {
  chave: string;
  modalidadeNome: string;
  modalidadeCodigo: string;
  categoria: string;
  sexo: string;
  grupo: string;
  linhas: LinhaClassificacao[];
}

interface PainelTabelasChaveamentoPublicoProps {
  partidas: PartidaEventoItem[];
  classificacoes: ClassificacaoGrupo[];
  chaveamentos: ChaveamentoEventoItem[];
}

const ORDEM_FASES = ['OITAVAS', 'QUARTAS', 'SEMIFINAL', 'FINAL'];
const ORDEM_CATS: Record<string, number> = {
  MIRIM: 1,
  INFANTIL: 2,
  INFANTO: 3,
  JUNIOR: 4,
};

function isTbd(id?: string | null): boolean {
  return !id || id.startsWith('TBD_');
}

function iniciais(sigla?: string | null): string {
  if (!sigla) return '?';
  const clean = sigla.replace(/[^A-Za-zÀ-ÿ0-9\s]/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase() || '?';
}

interface CompeticaoAgrupada {
  chave: string;
  modalidadeCodigo: string;
  modalidadeNome: string;
  categoria: string;
  sexo: string;
  partidas: PartidaEventoItem[];
  mataMata: PartidaEventoItem[];
  gruposPartidas: PartidaEventoItem[];
  tabelas: ClassificacaoGrupo[];
  chaveamento?: ChaveamentoEventoItem;
}

export function PainelTabelasChaveamentoPublico({
  partidas,
  classificacoes,
  chaveamentos,
}: PainelTabelasChaveamentoPublicoProps) {
  const [filtroMod, setFiltroMod] = useState<string>('TODAS');
  const [filtroCat, setFiltroCat] = useState<string>('TODAS');
  const [filtroSexo, setFiltroSexo] = useState<string>('TODOS');
  const [subAbaPorComp, setSubAbaPorComp] = useState<Record<string, 'CHAVEAMENTO' | 'RESULTADOS' | 'CLASSIFICACAO'>>({});

  // Agrupa competições reais (partidas coletivas/tênis de mesa + classificações)
  const competicoes = useMemo<CompeticaoAgrupada[]>(() => {
    const mapa = new Map<string, CompeticaoAgrupada>();

    const garantir = (cod: string, nome: string, cat: string, sexo: string) => {
      const codNorm = normalizarCodigoModalidade(cod);
      const chave = `${codNorm}|${cat}|${sexo}`;
      if (!mapa.has(chave)) {
        mapa.set(chave, {
          chave,
          modalidadeCodigo: codNorm,
          modalidadeNome: nome,
          categoria: cat,
          sexo,
          partidas: [],
          mataMata: [],
          gruposPartidas: [],
          tabelas: [],
        });
      }
      return mapa.get(chave)!;
    };

    partidas.forEach((p) => {
      const comp = garantir(p.modalidadeCodigo, p.modalidadeNome, p.categoria, p.sexo);
      comp.partidas.push(p);
      if (p.fase === 'GRUPOS') comp.gruposPartidas.push(p);
      else comp.mataMata.push(p);
    });

    classificacoes.forEach((t) => {
      const comp = garantir(t.modalidadeCodigo, t.modalidadeNome, t.categoria, t.sexo);
      comp.tabelas.push(t);
    });

    chaveamentos.forEach((ch) => {
      if (ch.formato === 'BALIZAMENTO_ATLETISMO' || ch.formato === 'SUICO_XADREZ') return;
      const comp = garantir(ch.modalidadeCodigo, ch.modalidadeNome, ch.categoria, ch.sexo);
      comp.chaveamento = ch;
    });

    return Array.from(mapa.values())
      .map((c) => ({
        ...c,
        partidas: [...c.partidas].sort((a, b) => (a.numeroJogo || 0) - (b.numeroJogo || 0)),
        mataMata: [...c.mataMata].sort((a, b) => (a.numeroJogo || 0) - (b.numeroJogo || 0)),
        gruposPartidas: [...c.gruposPartidas].sort((a, b) => (a.numeroJogo || 0) - (b.numeroJogo || 0)),
      }))
      .sort((a, b) => {
        const cmpMod = a.modalidadeNome.localeCompare(b.modalidadeNome, 'pt-BR');
        if (cmpMod !== 0) return cmpMod;
        const cmpCat = (ORDEM_CATS[a.categoria] || 9) - (ORDEM_CATS[b.categoria] || 9);
        if (cmpCat !== 0) return cmpCat;
        return a.sexo.localeCompare(b.sexo);
      });
  }, [partidas, classificacoes, chaveamentos]);

  const chaveamentosIndividuais = useMemo(
    () =>
      chaveamentos.filter(
        (c) => c.formato === 'BALIZAMENTO_ATLETISMO' || c.formato === 'SUICO_XADREZ'
      ),
    [chaveamentos]
  );

  // Lista real de modalidades disponíveis para a barra lateral
  const modalidadesSidebar = useMemo(() => {
    const map = new Map<string, { codigo: string; nome: string; count: number }>();
    competicoes.forEach((c) => {
      const cur = map.get(c.modalidadeCodigo);
      if (cur) cur.count += 1;
      else map.set(c.modalidadeCodigo, { codigo: c.modalidadeCodigo, nome: c.modalidadeNome, count: 1 });
    });
    chaveamentosIndividuais.forEach((ch) => {
      const cod = normalizarCodigoModalidade(ch.modalidadeCodigo);
      const cur = map.get(cod);
      if (cur) cur.count += 1;
      else map.set(cod, { codigo: cod, nome: ch.modalidadeNome, count: 1 });
    });
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [competicoes, chaveamentosIndividuais]);

  const competicoesFiltradas = useMemo(() => {
    return competicoes.filter((c) => {
      if (filtroMod !== 'TODAS' && c.modalidadeCodigo !== filtroMod) return false;
      if (filtroCat !== 'TODAS' && c.categoria !== filtroCat) return false;
      if (filtroSexo !== 'TODOS' && c.sexo !== filtroSexo) return false;
      return true;
    });
  }, [competicoes, filtroMod, filtroCat, filtroSexo]);

  const individuaisFiltrados = useMemo(() => {
    return chaveamentosIndividuais.filter((ch) => {
      const cod = normalizarCodigoModalidade(ch.modalidadeCodigo);
      if (filtroMod !== 'TODAS' && cod !== filtroMod) return false;
      if (filtroCat !== 'TODAS' && ch.categoria !== filtroCat) return false;
      if (filtroSexo !== 'TODOS' && ch.sexo !== filtroSexo) return false;
      return true;
    });
  }, [chaveamentosIndividuais, filtroMod, filtroCat, filtroSexo]);

  const semDados = competicoes.length === 0 && chaveamentosIndividuais.length === 0;

  if (semDados) {
    return (
      <div className="bg-white border border-[#E2EAE5] rounded-2xl p-12 text-center space-y-2 shadow-2xs">
        <Trophy className="w-8 h-8 text-[#00A878]/50 mx-auto" />
        <p className="text-sm font-semibold text-[#17221D]">
          Nenhum chaveamento ou tabela publicado ainda.
        </p>
        <p className="text-xs text-slate-500">
          As tabelas de classificação e chaveamentos aparecem automaticamente conforme os jogos são cadastrados pela SEMED.
        </p>
      </div>
    );
  }

  const renderCardBracketFifa = (p: PartidaEventoItem, isFinal = false) => {
    const encerrado = p.status === 'ENCERRADO' || p.status === 'WO';
    const aoVivo = p.status === 'AO_VIVO';
    const tbdA = isTbd(p.escolaAId);
    const tbdB = isTbd(p.escolaBId);
    const venceuA =
      encerrado && (p.vencedorEscolaId === p.escolaAId || (!p.vencedorEscolaId && p.placarA > p.placarB));
    const venceuB =
      encerrado && (p.vencedorEscolaId === p.escolaBId || (!p.vencedorEscolaId && p.placarB > p.placarA));

    return (
      <div
        key={p.id}
        className={`bg-white rounded-xl border overflow-hidden transition-all shadow-[0_1px_3px_rgba(11,79,53,0.06)] ${
          isFinal
            ? 'border-[#0B4F35]/40 ring-2 ring-[#00A878]/15'
            : aoVivo
            ? 'border-rose-300 ring-1 ring-rose-200'
            : 'border-[#DCE5DF]'
        }`}
      >
        {/* Linha meta sutil */}
        <div className="px-3 py-1.5 bg-[#F7F9F8] border-b border-[#E8EFEA] flex items-center justify-between text-[10px] text-slate-500">
          <span className="font-mono font-semibold text-slate-500">
            J{p.numeroJogo || '-'} · {formatarDataBR(p.dataEvento).slice(0, 5)} {p.horario}
          </span>
          <span
            className={`font-bold uppercase ${
              aoVivo ? 'text-rose-600' : encerrado ? 'text-[#0B4F35]' : 'text-slate-400'
            }`}
          >
            {aoVivo ? '● Ao vivo' : p.status === 'WO' ? 'W.O.' : encerrado ? 'Encerrado' : 'Agendado'}
          </span>
        </div>

        {/* Equipe A */}
        <div
          className={`flex items-stretch justify-between border-b border-[#EDF2EE] ${
            venceuA ? 'bg-[#F2FBF6]' : 'bg-white'
          }`}
        >
          <div className="flex items-center gap-2.5 px-3 py-2.5 min-w-0 flex-1">
            {!tbdA && (
              <span
                className={`w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                  venceuA ? 'bg-[#0B4F35] text-white' : 'bg-[#EEF3F0] text-[#17221D]'
                }`}
              >
                {iniciais(p.escolaASigla || p.escolaANome)}
              </span>
            )}
            <span
              className={`text-xs truncate ${
                venceuA
                  ? 'font-black text-[#0B4F35]'
                  : venceuB
                  ? 'font-medium text-slate-400'
                  : tbdA
                  ? 'font-medium text-slate-400 italic'
                  : 'font-bold text-[#17221D]'
              }`}
            >
              {p.escolaASigla || p.escolaANome}
            </span>
          </div>
          <div
            className={`w-10 flex items-center justify-center text-sm font-black tabular-nums border-l border-[#EDF2EE] shrink-0 ${
              venceuA
                ? 'bg-[#D7F3E5] text-[#0B4F35]'
                : 'bg-[#F8FAF9] text-[#17221D]'
            }`}
          >
            {p.status === 'AGENDADO' ? '–' : p.placarA}
          </div>
        </div>

        {/* Equipe B */}
        <div
          className={`flex items-stretch justify-between ${
            venceuB ? 'bg-[#F2FBF6]' : 'bg-white'
          }`}
        >
          <div className="flex items-center gap-2.5 px-3 py-2.5 min-w-0 flex-1">
            {!tbdB && (
              <span
                className={`w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                  venceuB ? 'bg-[#0B4F35] text-white' : 'bg-[#EEF3F0] text-[#17221D]'
                }`}
              >
                {iniciais(p.escolaBSigla || p.escolaBNome)}
              </span>
            )}
            <span
              className={`text-xs truncate ${
                venceuB
                  ? 'font-black text-[#0B4F35]'
                  : venceuA
                  ? 'font-medium text-slate-400'
                  : tbdB
                  ? 'font-medium text-slate-400 italic'
                  : 'font-bold text-[#17221D]'
              }`}
            >
              {p.escolaBSigla || p.escolaBNome}
            </span>
          </div>
          <div
            className={`w-10 flex items-center justify-center text-sm font-black tabular-nums border-l border-[#EDF2EE] shrink-0 ${
              venceuB
                ? 'bg-[#D7F3E5] text-[#0B4F35]'
                : 'bg-[#F8FAF9] text-[#17221D]'
            }`}
          >
            {p.status === 'AGENDADO' ? '–' : p.placarB}
          </div>
        </div>

        {encerrado && p.detalhesPlacar && (
          <div className="px-3 py-1 bg-[#F7F9F8] border-t border-[#EDF2EE] text-[10px] text-center font-semibold text-slate-500">
            {p.detalhesPlacar}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* ============================================================ */}
      {/* BARRA LATERAL ESQUERDA: MODALIDADES + CATEGORIAS             */}
      {/* ============================================================ */}
      <aside className="w-full lg:w-60 shrink-0 space-y-4">
        {/* Card Modalidades */}
        <div className="bg-white border border-[#DCE5DF] rounded-2xl overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-[#0B4F35] text-white flex items-center justify-between">
            <span className="text-sm font-bold tracking-tight">Modalidades</span>
            <span className="text-[11px] font-semibold bg-white/15 px-2 py-0.5 rounded-full tabular-nums">
              {modalidadesSidebar.length}
            </span>
          </div>
          <div className="p-1.5 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible">
            <button
              type="button"
              onClick={() => setFiltroMod('TODAS')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                filtroMod === 'TODAS'
                  ? 'bg-[#E8F7F1] text-[#0B4F35] font-bold border-l-4 border-l-[#0B4F35]'
                  : 'text-slate-600 hover:bg-[#F7F9F8] hover:text-[#17221D]'
              }`}
            >
              <span className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>Todas</span>
              </span>
              <span className="text-[10px] tabular-nums opacity-70">
                {competicoes.length + chaveamentosIndividuais.length}
              </span>
            </button>

            {modalidadesSidebar.map((m) => {
              const ativa = filtroMod === m.codigo;
              return (
                <button
                  key={m.codigo}
                  type="button"
                  onClick={() => setFiltroMod(m.codigo)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                    ativa
                      ? 'bg-[#E8F7F1] text-[#0B4F35] font-bold border-l-4 border-l-[#0B4F35]'
                      : 'text-slate-600 hover:bg-[#F7F9F8] hover:text-[#17221D]'
                  }`}
                >
                  <span className="truncate">{m.nome}</span>
                  <span className="text-[10px] tabular-nums opacity-70">{m.count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card Categorias & Naipe */}
        <div className="bg-white border border-[#DCE5DF] rounded-2xl overflow-hidden shadow-2xs">
          <div className="px-4 py-3 bg-[#0B4F35] text-white flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 opacity-90" />
            <span className="text-sm font-bold tracking-tight">Categorias</span>
          </div>
          <div className="p-3 space-y-2.5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Faixa Etária
              </label>
              <select
                value={filtroCat}
                onChange={(e) => setFiltroCat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F7F9F8] border border-[#DCE5DF] text-xs font-semibold text-[#17221D] focus:outline-none focus:border-[#0B4F35]"
              >
                <option value="TODAS">Todas as Categorias</option>
                <option value="MIRIM">Mirim (9–11 anos)</option>
                <option value="INFANTIL">Infantil (12–14 anos)</option>
                <option value="INFANTO">Infanto (15–17 anos)</option>
                <option value="JUNIOR">Júnior (18–20 anos)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Naipe
              </label>
              <select
                value={filtroSexo}
                onChange={(e) => setFiltroSexo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F7F9F8] border border-[#DCE5DF] text-xs font-semibold text-[#17221D] focus:outline-none focus:border-[#0B4F35]"
              >
                <option value="TODOS">Todos os Naipes</option>
                <option value="FEMININO">Feminino</option>
                <option value="MASCULINO">Masculino</option>
              </select>
            </div>
            {(filtroMod !== 'TODAS' || filtroCat !== 'TODAS' || filtroSexo !== 'TODOS') && (
              <button
                type="button"
                onClick={() => {
                  setFiltroMod('TODAS');
                  setFiltroCat('TODAS');
                  setFiltroSexo('TODOS');
                }}
                className="w-full py-1.5 rounded-lg text-[11px] font-bold text-[#0B4F35] bg-[#E8F7F1] hover:bg-[#D7F3E5] transition-colors cursor-pointer"
              >
                Limpar filtros
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ============================================================ */}
      {/* ÁREA PRINCIPAL: CHAVEAMENTOS FIFA/NCAA + CLASSIFICAÇÕES      */}
      {/* ============================================================ */}
      <div className="flex-1 min-w-0 space-y-6 w-full">
        {competicoesFiltradas.length === 0 && individuaisFiltrados.length === 0 ? (
          <div className="bg-white border border-[#DCE5DF] rounded-2xl p-10 text-center text-sm text-slate-500">
            Nenhuma competição encontrada para o filtro selecionado.
          </div>
        ) : (
          <>
            {competicoesFiltradas.map((comp) => {
              const temMataMata = comp.mataMata.length > 0;
              const temTabelas = comp.tabelas.length > 0;
              const defaultSub = temMataMata ? 'CHAVEAMENTO' : temTabelas ? 'CLASSIFICACAO' : 'RESULTADOS';
              const subAtiva = subAbaPorComp[comp.chave] || defaultSub;
              const sexoLabel = comp.sexo === 'FEMININO' ? 'Feminino' : 'Masculino';
              const configCol = obterConfigColunasModalidade(comp.modalidadeCodigo);

              const fasesCols = ORDEM_FASES.map((fase) => ({
                fase,
                label: fase === 'FINAL' ? 'Final' : FASES_LABEL[fase] || fase,
                jogos: comp.mataMata.filter((p) => p.fase === fase),
              })).filter((col) => col.jogos.length > 0);
              const jogoTerceiro = comp.mataMata.find((p) => p.fase === 'TERCEIRO_LUGAR') || null;

              const faseBadge = temMataMata && temTabelas
                ? 'Grupos + Eliminatória'
                : temMataMata
                ? 'Fase: Eliminatória'
                : 'Fase de Grupos';

              return (
                <div key={comp.chave} className="space-y-5">
                  {/* CARD PRINCIPAL DA COMPETIÇÃO */}
                  <div className="bg-white border border-[#DCE5DF] rounded-2xl overflow-hidden shadow-2xs">
                    {/* Cabeçalho Institucional Verde */}
                    <div className="px-5 py-3.5 bg-[#0B4F35] text-white flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Trophy className="w-4 h-4 text-[#A7F3D0] shrink-0" />
                        <h3 className="text-sm sm:text-base font-bold tracking-tight truncate">
                          {comp.modalidadeNome} – {comp.categoria.charAt(0) + comp.categoria.slice(1).toLowerCase()} {sexoLabel}
                        </h3>
                      </div>
                      <span className="text-[11px] font-semibold bg-white/15 px-3 py-1 rounded-full whitespace-nowrap">
                        {faseBadge}
                      </span>
                    </div>

                    {/* Sub-abas da Competição */}
                    <div className="px-5 border-b border-[#E8EFEA] bg-white flex items-center gap-5 overflow-x-auto">
                      {temMataMata && (
                        <button
                          type="button"
                          onClick={() => setSubAbaPorComp((prev) => ({ ...prev, [comp.chave]: 'CHAVEAMENTO' }))}
                          className={`py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                            subAtiva === 'CHAVEAMENTO'
                              ? 'border-[#0B4F35] text-[#0B4F35]'
                              : 'border-transparent text-slate-500 hover:text-[#17221D]'
                          }`}
                        >
                          <GitBranch className="w-3.5 h-3.5" />
                          <span>Chaveamento</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSubAbaPorComp((prev) => ({ ...prev, [comp.chave]: 'RESULTADOS' }))}
                        className={`py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                          subAtiva === 'RESULTADOS'
                            ? 'border-[#0B4F35] text-[#0B4F35]'
                            : 'border-transparent text-slate-500 hover:text-[#17221D]'
                        }`}
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>Resultados ({comp.partidas.length})</span>
                      </button>
                      {temTabelas && (
                        <button
                          type="button"
                          onClick={() => setSubAbaPorComp((prev) => ({ ...prev, [comp.chave]: 'CLASSIFICACAO' }))}
                          className={`py-3 text-xs font-bold flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                            subAtiva === 'CLASSIFICACAO'
                              ? 'border-[#0B4F35] text-[#0B4F35]'
                              : 'border-transparent text-slate-500 hover:text-[#17221D]'
                          }`}
                        >
                          <ListOrdered className="w-3.5 h-3.5" />
                          <span>Classificação</span>
                        </button>
                      )}
                    </div>

                    {/* CONTEÚDO: CHAVEAMENTO VISUAL FIFA/NCAA */}
                    {subAtiva === 'CHAVEAMENTO' && temMataMata && (
                      <div className="p-4 sm:p-6 bg-[#F7F9F8] overflow-x-auto">
                        <div className="flex items-stretch gap-6 min-w-max">
                          {fasesCols.map((col, colIdx) => {
                            const isFinalCol = col.fase === 'FINAL';
                            return (
                              <div key={col.fase} className="w-[245px] flex flex-col">
                                {/* Pill de Fase */}
                                <div className="mb-4 px-3 py-1.5 rounded-lg bg-[#E9EFEA] text-center">
                                  <span className="text-xs font-bold text-[#17221D]">
                                    {col.label}
                                  </span>
                                </div>

                                {/* Cards centralizados com conectores */}
                                <div className="flex-1 flex flex-col justify-around gap-5">
                                  {col.jogos.map((jogo) => (
                                    <div key={jogo.id} className="relative">
                                      {isFinalCol && (
                                        <div className="flex justify-center mb-2">
                                          <Trophy className="w-5 h-5 text-[#0B4F35]" />
                                        </div>
                                      )}
                                      {renderCardBracketFifa(jogo, isFinalCol)}
                                      {/* Conector horizontal à direita */}
                                      {colIdx < fasesCols.length - 1 && (
                                        <span
                                          aria-hidden="true"
                                          className="hidden sm:block absolute top-1/2 -right-6 w-6 h-px bg-[#C5D3CA]"
                                        />
                                      )}
                                      {/* Conector horizontal à esquerda */}
                                      {colIdx > 0 && (
                                        <span
                                          aria-hidden="true"
                                          className="hidden sm:block absolute top-1/2 -left-3 w-3 h-px bg-[#C5D3CA]"
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {/* Disputa de 3º lugar abaixo da Final */}
                                {isFinalCol && jogoTerceiro && (
                                  <div className="mt-6 pt-4 border-t border-dashed border-[#C5D3CA] space-y-2.5">
                                    <div className="px-3 py-1 rounded-lg bg-[#E9EFEA] text-center">
                                      <span className="text-[11px] font-bold text-slate-600 uppercase">
                                        Disputa de 3º Lugar
                                      </span>
                                    </div>
                                    {renderCardBracketFifa(jogoTerceiro, false)}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* CONTEÚDO: RESULTADOS / LISTA DE PARTIDAS */}
                    {subAtiva === 'RESULTADOS' && (
                      <div className="p-4 sm:p-5 bg-[#F7F9F8] space-y-2.5">
                        {comp.partidas.map((p) => {
                          const encerrado = p.status === 'ENCERRADO' || p.status === 'WO';
                          const aoVivo = p.status === 'AO_VIVO';
                          const venceuA = encerrado && (p.vencedorEscolaId === p.escolaAId || (!p.vencedorEscolaId && p.placarA > p.placarB));
                          const venceuB = encerrado && (p.vencedorEscolaId === p.escolaBId || (!p.vencedorEscolaId && p.placarB > p.placarA));
                          return (
                            <div
                              key={p.id}
                              className="bg-white border border-[#E2EAE5] rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-2.5 text-[11px] text-slate-500 sm:w-48 shrink-0">
                                <span className="font-mono font-bold text-[#0B4F35]">J{p.numeroJogo || '-'}</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatarDataBR(p.dataEvento).slice(0, 5)} · {p.horario}
                                </span>
                                {p.local && (
                                  <span className="hidden md:flex items-center gap-1 truncate">
                                    <MapPin className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{p.local}</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center justify-center gap-3 flex-1 min-w-0">
                                <span className={`text-xs sm:text-sm truncate text-right flex-1 ${venceuA ? 'font-black text-[#0B4F35]' : 'font-semibold text-[#17221D]'}`}>
                                  {p.escolaASigla || p.escolaANome}
                                </span>
                                <span className="px-3 py-1 rounded-lg bg-[#F4F7F5] border border-[#DCE5DF] text-sm font-black tabular-nums text-[#17221D] shrink-0">
                                  {p.status === 'AGENDADO' ? '×' : formatarPlacarComPenaltis(p.placarA, p.placarB, p.detalhesPlacar)}
                                </span>
                                <span className={`text-xs sm:text-sm truncate text-left flex-1 ${venceuB ? 'font-black text-[#0B4F35]' : 'font-semibold text-[#17221D]'}`}>
                                  {p.escolaBSigla || p.escolaBNome}
                                </span>
                              </div>

                              <div className="flex items-center justify-end gap-2 sm:w-36 shrink-0">
                                <span className="text-[10px] font-semibold text-slate-400 truncate">
                                  {p.grupo || FASES_LABEL[p.fase] || p.fase}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    aoVivo
                                      ? 'bg-rose-600 text-white'
                                      : encerrado
                                      ? 'bg-[#E8F7F1] text-[#0B4F35]'
                                      : 'bg-slate-100 text-slate-500'
                                  }`}
                                >
                                  {aoVivo ? 'Ao Vivo' : p.status === 'WO' ? 'W.O.' : encerrado ? 'Fim' : 'Agend.'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* CONTEÚDO: CLASSIFICAÇÃO (QUANDO SELECIONADA NA SUB-ABA) */}
                    {subAtiva === 'CLASSIFICACAO' && temTabelas && (
                      <div className="p-4 sm:p-5 space-y-4">
                        {comp.tabelas.map((tab) => (
                          <div key={tab.chave} className="border border-[#E2EAE5] rounded-xl overflow-hidden">
                            <div className="px-4 py-2.5 bg-[#F7F9F8] border-b border-[#E2EAE5] flex items-center justify-between">
                              <span className="text-xs font-bold text-[#17221D]">{tab.grupo}</span>
                              <span className="text-[11px] text-slate-500">{configCol.notaPontuacao}</span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs sm:text-sm text-left">
                                <thead className="bg-[#F9FBFA] text-slate-500 text-[11px] font-bold border-b border-[#E2EAE5]">
                                  <tr>
                                    <th className="py-2.5 px-3.5 w-10">#</th>
                                    <th className="py-2.5 px-3.5">Equipe</th>
                                    <th className="py-2.5 px-2.5 text-center">J</th>
                                    <th className="py-2.5 px-2.5 text-center">V</th>
                                    {configCol.permiteEmpate && <th className="py-2.5 px-2.5 text-center">E</th>}
                                    <th className="py-2.5 px-2.5 text-center">D</th>
                                    <th className="py-2.5 px-2.5 text-center">{configCol.labelPro}</th>
                                    <th className="py-2.5 px-2.5 text-center">{configCol.labelContra}</th>
                                    <th className="py-2.5 px-2.5 text-center">{configCol.labelSaldo}</th>
                                    <th className="py-2.5 px-3.5 text-center text-[#0B4F35]">Pts</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#EDF2EE] tabular-nums">
                                  {tab.linhas.map((l, i) => (
                                    <tr key={l.escolaId} className={i < 2 ? 'bg-[#F2FBF6]/70' : 'bg-white'}>
                                      <td className="py-3 px-3.5 font-bold text-slate-500">{i + 1}</td>
                                      <td className="py-3 px-3.5 font-bold text-[#17221D]">{l.escolaSigla}</td>
                                      <td className="py-3 px-2.5 text-center text-slate-600">{l.jogos}</td>
                                      <td className="py-3 px-2.5 text-center font-semibold text-[#0B4F35]">{l.vitorias}</td>
                                      {configCol.permiteEmpate && <td className="py-3 px-2.5 text-center text-slate-600">{l.empates}</td>}
                                      <td className="py-3 px-2.5 text-center text-slate-600">{l.derrotas}</td>
                                      <td className="py-3 px-2.5 text-center text-slate-600">{l.pro}</td>
                                      <td className="py-3 px-2.5 text-center text-slate-600">{l.contra}</td>
                                      <td className="py-3 px-2.5 text-center font-semibold text-slate-700">{l.saldo}</td>
                                      <td className="py-3 px-3.5 text-center font-black text-[#0B4F35]">{l.pontos}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* CARD DE CLASSIFICAÇÕES LOGO ABAIXO DO CHAVEAMENTO (COMO NA REFERÊNCIA) */}
                  {subAtiva === 'CHAVEAMENTO' && temTabelas && (
                    <div className="bg-white border border-[#DCE5DF] rounded-2xl overflow-hidden shadow-2xs">
                      <div className="px-5 py-3 bg-[#0B4F35] text-white flex items-center justify-between gap-2">
                        <span className="text-sm font-bold flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-[#A7F3D0]" />
                          <span>Classificações — {comp.modalidadeNome} ({comp.categoria})</span>
                        </span>
                        <span className="text-[11px] opacity-85">{comp.tabelas.length} grupo(s)</span>
                      </div>
                      <div className="divide-y divide-[#E8EFEA]">
                        {comp.tabelas.map((tab) => (
                          <div key={tab.chave} className="overflow-x-auto">
                            {comp.tabelas.length > 1 && (
                              <div className="px-4 py-2 bg-[#F7F9F8] text-xs font-bold text-[#0B4F35]">
                                {tab.grupo}
                              </div>
                            )}
                            <table className="w-full text-xs sm:text-sm text-left">
                              <thead className="bg-[#F9FBFA] text-slate-500 text-[11px] font-bold border-b border-[#E2EAE5]">
                                <tr>
                                  <th className="py-2.5 px-4 w-10">#</th>
                                  <th className="py-2.5 px-4">Equipe</th>
                                  <th className="py-2.5 px-2.5 text-center">J</th>
                                  <th className="py-2.5 px-2.5 text-center">V</th>
                                  {configCol.permiteEmpate && <th className="py-2.5 px-2.5 text-center">E</th>}
                                  <th className="py-2.5 px-2.5 text-center">D</th>
                                  <th className="py-2.5 px-2.5 text-center">{configCol.labelPro}</th>
                                  <th className="py-2.5 px-2.5 text-center">{configCol.labelContra}</th>
                                  <th className="py-2.5 px-2.5 text-center">{configCol.labelSaldo}</th>
                                  <th className="py-2.5 px-4 text-center text-[#0B4F35]">Pts</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#EDF2EE] tabular-nums">
                                {tab.linhas.map((l, i) => (
                                  <tr key={l.escolaId} className={i < 2 ? 'bg-[#F2FBF6]/70' : 'bg-white'}>
                                    <td className="py-3 px-4 font-bold text-slate-500">{i + 1}</td>
                                    <td className="py-3 px-4 font-bold text-[#17221D]">{l.escolaSigla}</td>
                                    <td className="py-3 px-2.5 text-center text-slate-600">{l.jogos}</td>
                                    <td className="py-3 px-2.5 text-center font-semibold text-[#0B4F35]">{l.vitorias}</td>
                                    {configCol.permiteEmpate && <td className="py-3 px-2.5 text-center text-slate-600">{l.empates}</td>}
                                    <td className="py-3 px-2.5 text-center text-slate-600">{l.derrotas}</td>
                                    <td className="py-3 px-2.5 text-center text-slate-600">{l.pro}</td>
                                    <td className="py-3 px-2.5 text-center text-slate-600">{l.contra}</td>
                                    <td className="py-3 px-2.5 text-center font-semibold text-slate-700">{l.saldo}</td>
                                    <td className="py-3 px-4 text-center font-black text-[#0B4F35]">{l.pontos}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* MODALIDADES INDIVIDUAIS: ATLETISMO E XADREZ */}
            {individuaisFiltrados.map((ch) => {
              let est: any = null;
              try {
                est = ch.estruturaJson ? JSON.parse(ch.estruturaJson) : null;
              } catch {
                est = null;
              }
              if (!est) return null;

              const sexoLabel = ch.sexo === 'FEMININO' ? 'Feminino' : 'Masculino';

              if (ch.formato === 'BALIZAMENTO_ATLETISMO' && Array.isArray(est.provas)) {
                return (
                  <div key={ch.id} className="bg-white border border-[#DCE5DF] rounded-2xl overflow-hidden shadow-2xs">
                    <div className="px-5 py-3.5 bg-[#0B4F35] text-white flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                        <Swords className="w-4 h-4 text-[#A7F3D0]" />
                        <span>{ch.modalidadeNome} – {ch.categoria} {sexoLabel}</span>
                      </h3>
                      <span className="text-[11px] font-semibold bg-white/15 px-3 py-1 rounded-full">
                        Balizamento Oficial
                      </span>
                    </div>
                    <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F7F9F8]">
                      {(est.provas as ProvaAtletismoBalizamento[]).map((pr) => (
                        <div key={pr.prova} className="bg-white border border-[#DCE5DF] rounded-xl overflow-hidden">
                          <div className="px-4 py-2.5 bg-[#E8F7F1] border-b border-[#DCE5DF] font-bold text-xs text-[#0B4F35] uppercase">
                            Prova: {pr.prova}
                          </div>
                          <div className="p-3 space-y-2.5">
                            {pr.series.map((s) => (
                              <div key={s.numero} className="space-y-1">
                                <p className="text-[11px] font-bold text-slate-500">{s.nome}</p>
                                {s.raias.map((r) => (
                                  <div key={r.raia} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-100 last:border-0">
                                    <span>
                                      <strong className="text-[#0B4F35] mr-2">R{r.raia}</strong>
                                      <span className="font-semibold text-[#17221D]">{r.atletaNome}</span>{' '}
                                      <span className="text-slate-400">({r.escolaSigla})</span>
                                    </span>
                                    <span className="font-mono font-bold text-[#0B4F35]">
                                      {r.posicao ? `${r.posicao}º ` : ''}
                                      {r.marca || '–'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (ch.formato === 'SUICO_XADREZ' && est.rodadas) {
                const classifXadrez = calcularClassificacaoXadrez(est as EstruturaXadrez);
                return (
                  <div key={ch.id} className="bg-white border border-[#DCE5DF] rounded-2xl overflow-hidden shadow-2xs">
                    <div className="px-5 py-3.5 bg-[#0B4F35] text-white flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-bold flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-[#A7F3D0]" />
                        <span>Xadrez – {ch.categoria} {sexoLabel}</span>
                      </h3>
                      <span className="text-[11px] font-semibold bg-white/15 px-3 py-1 rounded-full">
                        {est.sistema} · {est.rodadas.length}/{est.totalRodadasPrevistas} rodadas
                      </span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm text-left">
                        <thead className="bg-[#F9FBFA] text-slate-500 text-[11px] font-bold border-b border-[#E2EAE5]">
                          <tr>
                            <th className="py-2.5 px-4 w-12">#</th>
                            <th className="py-2.5 px-4">Enxadrista</th>
                            <th className="py-2.5 px-4">Escola</th>
                            <th className="py-2.5 px-3 text-center">J</th>
                            <th className="py-2.5 px-3 text-center text-[#0B4F35]">Pts</th>
                            <th className="py-2.5 px-4 text-center">Buchholz</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EDF2EE] tabular-nums">
                          {classifXadrez.map((c, idx) => (
                            <tr key={c.id} className={idx < 3 ? 'bg-[#F2FBF6]/70' : 'bg-white'}>
                              <td className="py-3 px-4 font-bold text-slate-500">{idx + 1}º</td>
                              <td className="py-3 px-4 font-bold text-[#17221D]">{c.nome}</td>
                              <td className="py-3 px-4 text-slate-600">{c.sigla}</td>
                              <td className="py-3 px-3 text-center text-slate-600">{c.jogos}</td>
                              <td className="py-3 px-3 text-center font-black text-[#0B4F35]">{c.pontos.toFixed(1)}</td>
                              <td className="py-3 px-4 text-center font-mono text-slate-600">{c.buchholz.toFixed(1)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </>
        )}
      </div>
    </div>
  );
}
