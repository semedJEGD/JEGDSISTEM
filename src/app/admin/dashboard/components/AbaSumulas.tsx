'use client';

import React, { useState, useMemo } from 'react';
import {
  Download,
  BookOpen,
  Layers,
  School,
  FileEdit,
  Users,
  Search,
  FileText,
  FileSpreadsheet,
  ClipboardList,
  BarChart3,
  Wand2,
} from 'lucide-react';
import { ModalidadeConfig, Escola, Atleta, InscricaoEquipe } from '@/types/jegd';
import { JegdsRulesService } from '@/services/jegds-rules';
import { JegdPdfGenerator } from '@/lib/pdf-generator';
import { RelatorioDelegacaoService } from '@/lib/pdf/relatorio-delegacao';
import { JegdStorage } from '@/lib/storage';
import { RelatorioEscolaDetalhado } from '@/components/relatorios/RelatorioEscolaDetalhado';

interface AbaSumulasProps {
  modalidades: ModalidadeConfig[];
  escolas?: Escola[];
  atletas?: Atleta[];
  inscricoes?: InscricaoEquipe[];
  handleGerarListaChamada: (modalidade: ModalidadeConfig, categoria: string, sexo: string, escolaId?: string) => Promise<void> | void;
  handleGerarCadernoModalidade: (modalidade: ModalidadeConfig, escolaId?: string) => Promise<void> | void;
  handleGerarCadernoGeralArbitragem: () => Promise<void> | void;
  handleGerarCadernoEscola?: (escola: Escola) => Promise<void> | void;
  handleGerarModeloManual?: (modalidade?: ModalidadeConfig, categoria?: string, sexo?: string) => Promise<void> | void;
}

type SecaoCentral = 'RELATORIO_ESCOLA' | 'RELATORIO_GERAL' | 'SUMULAS' | 'MANUAL';

export function AbaSumulas({
  modalidades,
  escolas = [],
  atletas = [],
  inscricoes = [],
  handleGerarListaChamada,
  handleGerarCadernoModalidade,
  handleGerarCadernoGeralArbitragem,
  handleGerarCadernoEscola,
  handleGerarModeloManual,
}: AbaSumulasProps) {
  const [secao, setSecao] = useState<SecaoCentral>('RELATORIO_ESCOLA');
  const [escopoSumula, setEscopoSumula] = useState<'ESCOLA' | 'GERAL'>('ESCOLA');
  const [escolaSelecionadaId, setEscolaSelecionadaId] = useState<string>(escolas[0]?.id || '');
  const [buscaEscola, setBuscaEscola] = useState<string>('');
  const [gerandoId, setGerandoId] = useState<string | null>(null);
  const [reorganizando, setReorganizando] = useState(false);
  const [avisoReorg, setAvisoReorg] = useState<string | null>(null);

  const handleReorganizarEquipesAB = async () => {
    try {
      setReorganizando(true);
      setAvisoReorg(null);
      const curMun = JegdStorage.getCurrentMunicipio();
      const res = await fetch('/api/inscricoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ municipioId: curMun?.id || 'ALL' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Falha ao reorganizar equipes');
      await JegdStorage.sincronizarComNuvem(true);
      setAvisoReorg(
        `Equipes reorganizadas! ${json.data.equipesA} Equipe(s) A e ${json.data.equipesB} Equipe(s) B padronizadas conforme o regulamento.`
      );
      setTimeout(() => setAvisoReorg(null), 6000);
    } catch (err: any) {
      alert(err?.message || 'Erro ao reorganizar equipes');
    } finally {
      setReorganizando(false);
    }
  };

  const escolasOrdenadas = useMemo(
    () => [...escolas].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [escolas]
  );

  const escolaAtiva = useMemo(
    () => escolasOrdenadas.find((e) => e.id === escolaSelecionadaId) || escolasOrdenadas[0],
    [escolasOrdenadas, escolaSelecionadaId]
  );

  const escolasFiltradas = useMemo(() => {
    if (!buscaEscola.trim()) return escolasOrdenadas;
    const termo = buscaEscola.toLowerCase();
    return escolasOrdenadas.filter(
      (e) =>
        e.nome.toLowerCase().includes(termo) ||
        (e.sigla && e.sigla.toLowerCase().includes(termo))
    );
  }, [escolasOrdenadas, buscaEscola]);

  const contagemAtletasPorEscola = useMemo(() => {
    const mapa: Record<string, number> = {};
    atletas.forEach((a) => {
      if (a.escolaId) mapa[a.escolaId] = (mapa[a.escolaId] || 0) + 1;
    });
    return mapa;
  }, [atletas]);

  const obterAtletasSet = useMemo(() => {
    return (modCodigo: string, categoria?: string, sexo?: string, escolaId?: string) => {
      const idsSet = new Set<string>();
      inscricoes.forEach((insc) => {
        const modMatch =
          insc.modalidadeCodigo?.toLowerCase() === modCodigo.toLowerCase() ||
          insc.modalidadeNome?.toLowerCase().includes(modCodigo.toLowerCase());
        if (!modMatch) return;
        if (escolaId && insc.escolaId !== escolaId) return;
        if (categoria && insc.categoria !== categoria) return;
        if (sexo && insc.sexo !== sexo) return;
        insc.atletaIds?.forEach((id) => idsSet.add(id));
      });
      if (idsSet.size === 0) {
        atletas.forEach((atl) => {
          if (escolaId && atl.escolaId !== escolaId) return;
          if (categoria && atl.categoriaCalculada !== categoria) return;
          if (sexo && atl.sexo !== sexo) return;
          const temMod = atl.modalidadesInscritas?.some(
            (m) =>
              m.modalidadeCodigo?.toLowerCase() === modCodigo.toLowerCase() ||
              m.modalidadeNome?.toLowerCase().includes(modCodigo.toLowerCase())
          );
          if (temMod) idsSet.add(atl.id);
        });
      }
      return idsSet;
    };
  }, [atletas, inscricoes]);

  const resumoPorEscola = useMemo(() => {
    return escolasOrdenadas.map((esc) => {
      const atls = atletas.filter((a) => a.escolaId === esc.id);
      const inscs = inscricoes.filter((i) => i.escolaId === esc.id);
      const masc = atls.filter((a) => a.sexo === 'MASCULINO').length;
      const fem = atls.filter((a) => a.sexo === 'FEMININO').length;
      const conferidos = atls.filter((a) => a.conferidoPeloCoordenador).length;
      const semDoc = atls.filter(
        (a) => a.semDocumento || a.documentoTipo === 'SEM_DOCUMENTO' || a.documentoNumero === 'SEM DOCUMENTO'
      ).length;
      return { esc, total: atls.length, masc, fem, conferidos, semDoc, equipes: inscs.length };
    });
  }, [escolasOrdenadas, atletas, inscricoes]);

  const executarGeracao = async (id: string, acao: () => Promise<void> | void) => {
    try {
      setGerandoId(id);
      await acao();
    } catch (err: any) {
      console.error('Erro ao gerar documento:', err);
      alert('Ocorreu um erro ao gerar o arquivo.');
    } finally {
      setGerandoId(null);
    }
  };

  const handleExportarGeralCsv = () => {
    const cab = ['Escola', 'Sigla', 'Total Alunos', 'Masc', 'Fem', 'Equipes', 'Conferidos', 'Sem Documento'];
    const linhas = resumoPorEscola.map((r) =>
      [r.esc.nome, r.esc.sigla || '', r.total, r.masc, r.fem, r.equipes, r.conferidos, r.semDoc]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(';')
    );
    const csv = '\uFEFF' + [cab.join(';'), ...linhas].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Relatorio_Geral_Escolas_JEGDS_2026.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* MENU CENTRAL UNIFICADO: RELATÓRIOS & SÚMULAS */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-[#0F2540] tracking-tight">
              Central de Relatórios & Súmulas
            </h2>
            <p className="text-xs text-slate-500">
              Todos os relatórios por escola, consolidado do município e súmulas de arbitragem em um só lugar.
            </p>
          </div>
          <button
            type="button"
            disabled={reorganizando}
            onClick={handleReorganizarEquipesAB}
            className="px-3.5 py-2 rounded-xl bg-[#0F2540] hover:bg-[#17355A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            title="Separa automaticamente as equipes bagunçadas em Equipe A e Equipe B conforme os limites oficiais (Futsal até 10/equipe, Futebol até 20/equipe)"
          >
            <Wand2 className={`w-3.5 h-3.5 text-emerald-300 ${reorganizando ? 'animate-spin' : ''}`} />
            <span>{reorganizando ? 'Organizando Equipes...' : 'Organizar Equipes (A / B)'}</span>
          </button>
        </div>

        {avisoReorg && (
          <div className="px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
            {avisoReorg}
          </div>
        )}

        {/* 4 Abas limpas de navegação */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-200 -mx-1 px-1">
          {(
            [
              { id: 'RELATORIO_ESCOLA', label: 'Relatório por Escola', icon: School },
              { id: 'RELATORIO_GERAL', label: 'Consolidado Geral', icon: BarChart3 },
              { id: 'SUMULAS', label: 'Súmulas de Chamada', icon: ClipboardList },
              { id: 'MANUAL', label: 'Súmulas em Branco', icon: FileEdit },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const ativa = secao === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSecao(tab.id)}
                className={`pb-3 px-2 text-xs font-bold flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
                  ativa
                    ? 'border-[#00A878] text-[#0F2540]'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${ativa ? 'text-[#00A878]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SEÇÃO 1: RELATÓRIO DETALHADO POR ESCOLA                      */}
      {/* ============================================================ */}
      {secao === 'RELATORIO_ESCOLA' && (
        <div className="space-y-4">
          {/* Seletor de Escola limpo */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#0F2540]">Selecione a Escola:</span>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={buscaEscola}
                  onChange={(e) => setBuscaEscola(e.target.value)}
                  placeholder="Filtrar escola..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:border-[#00A878]"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {escolasFiltradas.map((esc) => {
                const total = contagemAtletasPorEscola[esc.id] || 0;
                const ativa = esc.id === escolaAtiva?.id;
                return (
                  <button
                    key={esc.id}
                    type="button"
                    onClick={() => setEscolaSelecionadaId(esc.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                      ativa
                        ? 'bg-[#0F2540] text-white'
                        : 'bg-[#F4F6F8] hover:bg-slate-200/70 text-slate-700'
                    }`}
                  >
                    <span>{esc.sigla || esc.nome}</span>
                    <span className={`text-[10px] px-1.5 rounded-full ${ativa ? 'bg-white/20' : 'bg-white text-[#087A5B]'}`}>
                      {total}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {escolaAtiva && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs">
              <RelatorioEscolaDetalhado
                escola={escolaAtiva}
                atletas={atletas}
                inscricoes={inscricoes}
                modalidades={modalidades}
                onGerarCadernoEscola={handleGerarCadernoEscola}
              />
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SEÇÃO 2: CONSOLIDADO GERAL DO MUNICÍPIO                      */}
      {/* ============================================================ */}
      {secao === 'RELATORIO_GERAL' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-[#0F2540]">Relatório Geral Consolidado</h3>
              <p className="text-xs text-slate-500">
                Visão comparativa de todas as {escolas.length} escola(s) e {atletas.length} aluno(s) inscritos.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={gerandoId === 'rel-geral-pdf'}
                onClick={() =>
                  executarGeracao('rel-geral-pdf', () =>
                    RelatorioDelegacaoService.gerarRelatorioGeralAtletas(escolas, atletas)
                  )
                }
                className="px-4 py-2 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{gerandoId === 'rel-geral-pdf' ? 'Gerando...' : 'PDF Geral de Alunos'}</span>
              </button>
              <button
                type="button"
                onClick={handleExportarGeralCsv}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-[#0F2540] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#00A878]" />
                <span>Planilha por Escola (CSV)</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl bg-[#F4F6F8] p-4 overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[680px]">
              <thead className="text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-3 py-2">Escola</th>
                  <th className="px-3 py-2 text-center">Alunos</th>
                  <th className="px-3 py-2 text-center">Masc / Fem</th>
                  <th className="px-3 py-2 text-center">Equipes</th>
                  <th className="px-3 py-2 text-center">Conferidos</th>
                  <th className="px-3 py-2 text-center">Sem Doc.</th>
                  <th className="px-3 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 tabular-nums">
                {resumoPorEscola.map((r) => (
                  <tr key={r.esc.id} className="bg-white hover:bg-slate-50/70">
                    <td className="px-3 py-2.5">
                      <span className="font-bold text-[#0F2540]">{r.esc.sigla || r.esc.nome}</span>
                      <span className="block text-[10px] text-slate-400 truncate max-w-[240px]">{r.esc.nome}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center font-black text-[#0F2540]">{r.total}</td>
                    <td className="px-3 py-2.5 text-center text-slate-500">
                      {r.masc} / {r.fem}
                    </td>
                    <td className="px-3 py-2.5 text-center text-slate-600">{r.equipes}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-[#00A878]">{r.conferidos}</td>
                    <td className={`px-3 py-2.5 text-center font-bold ${r.semDoc > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {r.semDoc}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEscolaSelecionadaId(r.esc.id);
                            setSecao('RELATORIO_ESCOLA');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-[#00A878] text-[#087A5B] hover:text-white text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          Ver Detalhes
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            executarGeracao(`pdf-esc-${r.esc.id}`, () =>
                              JegdPdfGenerator.gerarLoteCompletoEscola(
                                r.esc,
                                atletas.filter((a) => a.escolaId === r.esc.id),
                                inscricoes.filter((i) => i.escolaId === r.esc.id)
                              )
                            )
                          }
                          className="px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 text-[11px] font-semibold cursor-pointer"
                        >
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SEÇÃO 3: SÚMULAS DE CHAMADA (POR ESCOLA OU GERAL)            */}
      {/* ============================================================ */}
      {secao === 'SUMULAS' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEscopoSumula('ESCOLA')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    escopoSumula === 'ESCOLA'
                      ? 'bg-[#0F2540] text-white'
                      : 'bg-[#F4F6F8] text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  Por Escola
                </button>
                <button
                  type="button"
                  onClick={() => setEscopoSumula('GERAL')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    escopoSumula === 'GERAL'
                      ? 'bg-[#0F2540] text-white'
                      : 'bg-[#F4F6F8] text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  Geral (Todas as Escolas)
                </button>
              </div>

              {escopoSumula === 'GERAL' ? (
                <button
                  type="button"
                  disabled={gerandoId === 'geral-arbitragem'}
                  onClick={() => executarGeracao('geral-arbitragem', handleGerarCadernoGeralArbitragem)}
                  className="px-4 py-2 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{gerandoId === 'geral-arbitragem' ? 'Gerando...' : 'Livro Geral de Arbitragem (1 PDF)'}</span>
                </button>
              ) : (
                escolaAtiva &&
                handleGerarCadernoEscola && (
                  <button
                    type="button"
                    disabled={gerandoId === `cad-${escolaAtiva.id}`}
                    onClick={() => executarGeracao(`cad-${escolaAtiva.id}`, () => handleGerarCadernoEscola(escolaAtiva))}
                    className="px-4 py-2 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Caderno Completo ({escolaAtiva.sigla || escolaAtiva.nome})</span>
                  </button>
                )
              )}
            </div>

            {escopoSumula === 'ESCOLA' && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                {escolasOrdenadas.map((esc) => {
                  const ativa = esc.id === escolaAtiva?.id;
                  return (
                    <button
                      key={esc.id}
                      type="button"
                      onClick={() => setEscolaSelecionadaId(esc.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                        ativa
                          ? 'bg-[#00A878] text-white'
                          : 'bg-[#F4F6F8] text-slate-700 hover:bg-slate-200/70'
                      }`}
                    >
                      {esc.sigla || esc.nome} ({contagemAtletasPorEscola[esc.id] || 0})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {modalidades.map((mod) => {
              const targetEscolaId = escopoSumula === 'ESCOLA' ? escolaAtiva?.id : undefined;
              const totalMod = obterAtletasSet(mod.codigo, undefined, undefined, targetEscolaId).size;

              return (
                <div
                  key={mod.id}
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-black text-[#0F2540]">{mod.nome}</h4>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          totalMod > 0 ? 'bg-emerald-50 text-[#087A5B]' : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {totalMod} atleta(s)
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={gerandoId === `cad-${mod.codigo}-${targetEscolaId || 'all'}`}
                      onClick={() =>
                        executarGeracao(`cad-${mod.codigo}-${targetEscolaId || 'all'}`, () =>
                          handleGerarCadernoModalidade(mod, targetEscolaId)
                        )
                      }
                      className="w-full py-2 px-3 rounded-xl bg-[#F4F6F8] hover:bg-[#00A878] text-[#0F2540] hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Caderno {mod.nome}</span>
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    {mod.categoriasPermitidas.map((cat) => {
                      const temMasc = JegdsRulesService.validarMatriz(mod.codigo, cat as any, 'MASCULINO').valido;
                      const temFem = JegdsRulesService.validarMatriz(mod.codigo, cat as any, 'FEMININO').valido;
                      const qM = obterAtletasSet(mod.codigo, cat, 'MASCULINO', targetEscolaId).size;
                      const qF = obterAtletasSet(mod.codigo, cat, 'FEMININO', targetEscolaId).size;

                      return (
                        <div key={cat} className="grid grid-cols-2 gap-1.5">
                          {temMasc && (
                            <button
                              type="button"
                              onClick={() =>
                                executarGeracao(`sum-${mod.codigo}-${cat}-M`, () =>
                                  handleGerarListaChamada(mod, cat, 'MASCULINO', targetEscolaId)
                                )
                              }
                              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-between cursor-pointer transition-colors ${
                                qM > 0
                                  ? 'bg-emerald-50 hover:bg-[#00A878] text-[#087A5B] hover:text-white'
                                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                              }`}
                            >
                              <span>{cat} (M)</span>
                              <span className="flex items-center gap-1">
                                {qM} <Download className="w-2.5 h-2.5" />
                              </span>
                            </button>
                          )}
                          {temFem && (
                            <button
                              type="button"
                              onClick={() =>
                                executarGeracao(`sum-${mod.codigo}-${cat}-F`, () =>
                                  handleGerarListaChamada(mod, cat, 'FEMININO', targetEscolaId)
                                )
                              }
                              className={`px-2 py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-between cursor-pointer transition-colors ${
                                qF > 0
                                  ? 'bg-pink-50 hover:bg-pink-600 text-pink-700 hover:text-white'
                                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                              }`}
                            >
                              <span>{cat} (F)</span>
                              <span className="flex items-center gap-1">
                                {qF} <Download className="w-2.5 h-2.5" />
                              </span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SEÇÃO 4: SÚMULAS EM BRANCO (MODELO MANUAL)                   */}
      {/* ============================================================ */}
      {secao === 'MANUAL' && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-[#0F2540]">Súmulas Manuais (Em Branco)</h3>
              <p className="text-xs text-slate-500">
                Modelos pautados oficiais prontos para preenchimento à caneta na mesa de arbitragem.
              </p>
            </div>
            {handleGerarModeloManual && (
              <button
                type="button"
                disabled={gerandoId === 'manual-geral'}
                onClick={() => executarGeracao('manual-geral', () => handleGerarModeloManual())}
                className="px-4 py-2 rounded-xl bg-[#0F2540] hover:bg-[#17355A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <FileEdit className="w-3.5 h-3.5 text-emerald-300" />
                <span>Baixar Modelo Genérico (PDF)</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {modalidades.map((mod) => (
              <div key={mod.id} className="rounded-xl bg-[#F4F6F8] p-3.5 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-[#0F2540]">{mod.nome}</span>
                {handleGerarModeloManual && (
                  <button
                    type="button"
                    onClick={() => executarGeracao(`manual-${mod.codigo}`, () => handleGerarModeloManual(mod))}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#00A878] text-[#0F2540] hover:text-white border border-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>PDF</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
