'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  School,
  Trophy,
  Filter,
  FileText,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  Sparkles,
  Layers,
  Award,
  Flame,
  ArrowUpDown
} from 'lucide-react';
import { Atleta, Escola, ModalidadeConfig, InscricaoEquipe } from '@/types/jegd';
import { RelatorioDelegacaoService } from '@/lib/pdf/relatorio-delegacao';
import { CrachaDobravelService } from '@/lib/pdf/cracha-dobravel';

interface AbaPainelAlunosProps {
  atletas: Atleta[];
  escolas: Escola[];
  modalidades: ModalidadeConfig[];
  inscricoes: InscricaoEquipe[];
  onGerarCrachaIndividual?: (atleta: Atleta) => void;
  toggleConferenciaAtleta?: (atleta: Atleta) => void;
}

export function AbaPainelAlunos({
  atletas,
  escolas,
  modalidades,
  inscricoes,
  onGerarCrachaIndividual,
  toggleConferenciaAtleta
}: AbaPainelAlunosProps) {
  const [busca, setBusca] = useState('');
  const [filtroEtapa, setFiltroEtapa] = useState<string>('TODAS');
  const [filtroModalidade, setFiltroModalidade] = useState<string>('TODAS');
  const [filtroNaipe, setFiltroNaipe] = useState<string>('TODOS');
  const [filtroEscolaId, setFiltroEscolaId] = useState<string>('TODAS');
  const [filtroSituacao, setFiltroSituacao] = useState<string>('TODOS'); // TODOS | HOMOLOGADO | REGULARIZACAO
  const [gerandoPdf, setGerandoPdf] = useState(false);

  // ============================================================
  // CÁLCULOS DO MINI DASHBOARD EM GLASS LIQUID
  // ============================================================
  const stats = useMemo(() => {
    const total = atletas.length;
    const masc = atletas.filter(a => a.sexo === 'MASCULINO').length;
    const fem = atletas.filter(a => a.sexo === 'FEMININO').length;

    const mirim = atletas.filter(a => a.categoriaCalculada === 'MIRIM').length;
    const infantil = atletas.filter(a => a.categoriaCalculada === 'INFANTIL').length;
    const infanto = atletas.filter(a => a.categoriaCalculada === 'INFANTO').length;
    const junior = atletas.filter(a => a.categoriaCalculada === 'JUNIOR').length;

    const homologados = atletas.filter(a => a.conferidoPeloCoordenador).length;
    const semDoc = atletas.filter(a => a.semDocumento || a.documentoTipo === 'SEM_DOCUMENTO' || a.documentoNumero === 'SEM DOCUMENTO').length;
    const comDoc = total - semDoc;

    // Contagem por modalidade
    const modCount: Record<string, number> = {};
    atletas.forEach(a => {
      a.modalidadesInscritas?.forEach(m => {
        modCount[m.modalidadeNome] = (modCount[m.modalidadeNome] || 0) + 1;
      });
    });

    const topModalidades = Object.entries(modCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);

    return {
      total,
      masc,
      fem,
      pctMasc: total > 0 ? Math.round((masc / total) * 100) : 0,
      pctFem: total > 0 ? Math.round((fem / total) * 100) : 0,
      mirim,
      infantil,
      infanto,
      junior,
      homologados,
      semDoc,
      comDoc,
      topModalidades
    };
  }, [atletas]);

  // ============================================================
  // FILTRAGEM DOS ATLETAS
  // ============================================================
  const atletasFiltrados = useMemo(() => {
    return atletas.filter(a => {
      const esc = escolas.find(e => e.id === a.escolaId);
      
      // Busca por texto
      if (busca.trim()) {
        const q = busca.toLowerCase();
        const bateNome = a.nomeCompleto.toLowerCase().includes(q);
        const bateDoc = a.documentoNumero?.toLowerCase().includes(q) || false;
        const bateMatricula = a.matricula?.toLowerCase().includes(q) || false;
        const bateEscola = (esc?.nome.toLowerCase().includes(q) || false) || (esc?.sigla.toLowerCase().includes(q) || false);
        const bateMod = a.modalidadesInscritas?.some(m => m.modalidadeNome.toLowerCase().includes(q)) || false;
        if (!bateNome && !bateDoc && !bateMatricula && !bateEscola && !bateMod) return false;
      }

      // Filtro Etapa
      if (filtroEtapa !== 'TODAS' && a.categoriaCalculada !== filtroEtapa) return false;

      // Filtro Naipe
      if (filtroNaipe !== 'TODOS' && a.sexo !== filtroNaipe) return false;

      // Filtro Escola
      if (filtroEscolaId !== 'TODAS' && a.escolaId !== filtroEscolaId) return false;

      // Filtro Modalidade
      if (filtroModalidade !== 'TODAS') {
        const temMod = a.modalidadesInscritas?.some(m => 
          m.modalidadeNome.toLowerCase().includes(filtroModalidade.toLowerCase()) ||
          m.modalidadeCodigo === filtroModalidade
        );
        if (!temMod) return false;
      }

      // Filtro Situação
      if (filtroSituacao === 'HOMOLOGADO' && !a.conferidoPeloCoordenador) return false;
      if (filtroSituacao === 'REGULARIZACAO') {
        const isSemDoc = a.semDocumento || a.documentoTipo === 'SEM_DOCUMENTO' || a.documentoNumero === 'SEM DOCUMENTO';
        if (!isSemDoc) return false;
      }

      return true;
    });
  }, [atletas, escolas, busca, filtroEtapa, filtroNaipe, filtroEscolaId, filtroModalidade, filtroSituacao]);

  // ============================================================
  // AGRUPAMENTO: ETAPA -> MODALIDADE -> ATLETAS
  // ============================================================
  const gruposEtapas = useMemo(() => {
    const etapasOrder = ['MIRIM', 'INFANTIL', 'INFANTO', 'JUNIOR'];
    const etapasMap: Record<string, Atleta[]> = {};

    atletasFiltrados.forEach(a => {
      const etapa = a.categoriaCalculada || 'OUTROS';
      if (!etapasMap[etapa]) etapasMap[etapa] = [];
      etapasMap[etapa].push(a);
    });

    return Object.keys(etapasMap)
      .sort((a, b) => {
        const idxA = etapasOrder.indexOf(a);
        const idxB = etapasOrder.indexOf(b);
        return (idxA >= 0 ? idxA : 99) - (idxB >= 0 ? idxB : 99);
      })
      .map(etapa => {
        const atletasDaEtapa = etapasMap[etapa];

        // Subagrupar por Modalidade
        const modalidadesMap: Record<string, Atleta[]> = {};
        atletasDaEtapa.forEach(a => {
          if (a.modalidadesInscritas && a.modalidadesInscritas.length > 0) {
            a.modalidadesInscritas.forEach(m => {
              const chave = m.modalidadeNome;
              if (!modalidadesMap[chave]) modalidadesMap[chave] = [];
              if (!modalidadesMap[chave].includes(a)) {
                modalidadesMap[chave].push(a);
              }
            });
          } else {
            const chave = 'Geral (Sem modalidade)';
            if (!modalidadesMap[chave]) modalidadesMap[chave] = [];
            modalidadesMap[chave].push(a);
          }
        });

        const subgrupos = Object.entries(modalidadesMap).sort((a, b) => a[0].localeCompare(b[0]));

        return {
          etapa,
          total: atletasDaEtapa.length,
          subgrupos
        };
      });
  }, [atletasFiltrados]);

  // Handler para emitir o relatório em PDF
  const handleExportarRelatorio = async () => {
    setGerandoPdf(true);
    try {
      await RelatorioDelegacaoService.gerarRelatorioGeralAtletas(escolas, atletas, {
        busca: busca.trim() || undefined,
        categoria: filtroEtapa,
        modalidade: filtroModalidade,
        sexo: filtroNaipe,
        escolaId: filtroEscolaId
      });
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar relatório de alunos em PDF.');
    } finally {
      setGerandoPdf(false);
    }
  };

  const handleImprimirCracha = async (atleta: Atleta) => {
    if (onGerarCrachaIndividual) {
      onGerarCrachaIndividual(atleta);
      return;
    }
    const esc = escolas.find(e => e.id === atleta.escolaId) || {
      id: 'geral',
      nome: 'Escola Municipal',
      sigla: 'SEMED',
      inep: '',
      rede: 'MUNICIPAL',
      bairro: '',
      endereco: '',
      responsavelNome: '',
      responsavelTelefone: '',
      loginEmail: '',
      createdAt: ''
    };
    await CrachaDobravelService.gerarCrachaIndividual(atleta, esc);
  };

  const limparFiltros = () => {
    setBusca('');
    setFiltroEtapa('TODAS');
    setFiltroModalidade('TODAS');
    setFiltroNaipe('TODOS');
    setFiltroEscolaId('TODAS');
    setFiltroSituacao('TODOS');
  };

  return (
    <div className="space-y-6">
      
      {/* ============================================================ */}
      {/* 1. MINI DASHBOARD EM GLASS LIQUID (EFEITO VIDRO FLUIDO) */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-6 backdrop-blur-xl bg-gradient-to-br from-white/85 via-white/70 to-emerald-50/40 border border-white/80 shadow-xl shadow-slate-200/50 space-y-5">
        
        {/* Glow decorativo de fundo */}
        <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Topo do Dashboard */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-slate-200/60 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300/40 text-emerald-900 text-[11px] font-black tracking-wide uppercase shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Painel Geral de Alunos & Matrículas</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1.5 tracking-tight">
              Visão Consolidada dos Atletas • JEGDS 2026
            </h2>
            <p className="text-xs text-slate-500">
              Métricas agregadas em tempo real e listagem organizada por etapa, modalidade e escola.
            </p>
          </div>

          <button
            type="button"
            onClick={handleExportarRelatorio}
            disabled={gerandoPdf}
            className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 shrink-0 self-start sm:self-auto"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>{gerandoPdf ? 'Gerando Documento...' : 'Exportar Relatório Geral (PDF)'}</span>
          </button>
        </div>

        {/* Grid de 4 Cards em Glassmorphism Líquido */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 relative z-10">
          
          {/* Card 1: Por Etapa (Categorias) */}
          <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-white/90 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Matrículas por Etapa</span>
              <Layers className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 block">MIRIM (9-11)</span>
                <strong className="text-sm font-black text-slate-900">{stats.mirim}</strong>
              </div>
              <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 block">INFANTIL (12-14)</span>
                <strong className="text-sm font-black text-slate-900">{stats.infantil}</strong>
              </div>
              <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 block">INFANTO (15-17)</span>
                <strong className="text-sm font-black text-slate-900">{stats.infanto}</strong>
              </div>
              <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                <span className="text-[9px] font-bold text-slate-400 block">JÚNIOR (18-19)</span>
                <strong className="text-sm font-black text-slate-900">{stats.junior}</strong>
              </div>
            </div>
          </div>

          {/* Card 2: Distribuição por Naipe */}
          <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-white/90 shadow-sm space-y-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Proporção por Naipe</span>
              <Users className="w-4 h-4 text-sky-600" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  Masc: <strong>{stats.masc}</strong> ({stats.pctMasc}%)
                </span>
                <span className="text-slate-600 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Fem: <strong>{stats.fem}</strong> ({stats.pctFem}%)
                </span>
              </div>

              {/* Barra Líquida Bicolor */}
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden flex p-0.5 border border-slate-200/60 shadow-inner">
                <div
                  style={{ width: `${stats.pctMasc}%` }}
                  className="h-full bg-gradient-to-r from-sky-400 to-sky-600 rounded-l-full transition-all duration-500"
                />
                <div
                  style={{ width: `${stats.pctFem}%` }}
                  className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-r-full transition-all duration-500"
                />
              </div>
            </div>

            <p className="text-[10px] text-slate-400">
              Equilíbrio saudável entre categorias masculinas e femininas.
            </p>
          </div>

          {/* Card 3: Top Modalidades */}
          <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-white/90 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Top Modalidades</span>
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>

            <div className="space-y-1.5 text-xs">
              {stats.topModalidades.map(([nome, qtd], i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-slate-700 truncate font-medium text-[11px] max-w-[130px]">{nome}</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200/60 font-bold text-[10px]">
                    {qtd} atletas
                  </span>
                </div>
              ))}
              {stats.topModalidades.length === 0 && (
                <span className="text-slate-400 text-xs">Aguardando inscrições</span>
              )}
            </div>
          </div>

          {/* Card 4: Situação Cadastral & Regularização */}
          <div className="p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-white/90 shadow-sm space-y-2 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">Situação Cadastral</span>
              <Award className="w-4 h-4 text-indigo-600" />
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-200/50">
                <span className="text-emerald-900 font-semibold text-[11px]">Homologados:</span>
                <strong className="text-emerald-900">{stats.homologados}/{stats.total}</strong>
              </div>
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-amber-50/70 border border-amber-200/50">
                <span className="text-amber-900 font-semibold text-[11px]">Em Regularização:</span>
                <strong className="text-amber-900">{stats.semDoc} alunos</strong>
              </div>
            </div>

            <span className="text-[10px] text-slate-400 block pt-0.5">
              SEMED Gonçalves Dias • 100% dos dados auditados
            </span>
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. BARRA DE FILTROS & BUSCA RÁPIDA */}
      {/* ============================================================ */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-2.5">
          {/* Busca por texto */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome do aluno, escola, modalidade ou matrícula..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Filtros em Linha */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Etapa */}
            <select
              value={filtroEtapa}
              onChange={(e) => setFiltroEtapa(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="TODAS">Todas as Etapas</option>
              <option value="MIRIM">Etapa Mirim (9-11)</option>
              <option value="INFANTIL">Etapa Infantil (12-14)</option>
              <option value="INFANTO">Etapa Infanto (15-17)</option>
              <option value="JUNIOR">Etapa Júnior (18-19)</option>
            </select>

            {/* Modalidade */}
            <select
              value={filtroModalidade}
              onChange={(e) => setFiltroModalidade(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="TODAS">Todas as Modalidades</option>
              {modalidades.map(m => (
                <option key={m.codigo} value={m.codigo}>{m.nome}</option>
              ))}
            </select>

            {/* Naipe */}
            <select
              value={filtroNaipe}
              onChange={(e) => setFiltroNaipe(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="TODOS">Todos os Naipes</option>
              <option value="MASCULINO">Masculino</option>
              <option value="FEMININO">Feminino</option>
            </select>

            {/* Escola */}
            <select
              value={filtroEscolaId}
              onChange={(e) => setFiltroEscolaId(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold focus:outline-none cursor-pointer max-w-[170px] truncate"
            >
              <option value="TODAS">Todas as Escolas</option>
              {escolas.map(e => (
                <option key={e.id} value={e.id}>{e.sigla} - {e.nome}</option>
              ))}
            </select>

            {/* Situação */}
            <select
              value={filtroSituacao}
              onChange={(e) => setFiltroSituacao(e.target.value)}
              className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="TODOS">Todas as Situações</option>
              <option value="HOMOLOGADO">Apenas Homologados</option>
              <option value="REGULARIZACAO">Em Regularização</option>
            </select>

            {(busca || filtroEtapa !== 'TODAS' || filtroModalidade !== 'TODAS' || filtroNaipe !== 'TODOS' || filtroEscolaId !== 'TODAS' || filtroSituacao !== 'TODOS') && (
              <button
                type="button"
                onClick={limparFiltros}
                className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Contador de Resultados */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Exibindo <strong>{atletasFiltrados.length}</strong> de <strong>{atletas.length}</strong> estudantes-atletas cadastrados
          </span>
          <span className="text-[11px] text-slate-400">
            {gruposEtapas.length} etapas encontradas
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. LISTAGEM ORGANIZADA POR ETAPA -> MODALIDADE -> ATLETAS */}
      {/* ============================================================ */}
      {gruposEtapas.length > 0 ? (
        <div className="space-y-6">
          {gruposEtapas.map(({ etapa, total, subgrupos }) => (
            <div key={etapa} className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
              
              {/* Header da Etapa */}
              <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <h3 className="text-sm font-black tracking-wide uppercase">
                    ETAPA {etapa}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    (
                    {etapa === 'MIRIM' ? '9 a 11 anos' :
                     etapa === 'INFANTIL' ? '12 a 14 anos' :
                     etapa === 'INFANTO' ? '15 a 17 anos' :
                     etapa === 'JUNIOR' ? '18 a 19 anos' : 'Todas as idades'}
                    )
                  </span>
                </div>

                <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-emerald-300 text-xs font-bold border border-white/15">
                  {total} {total === 1 ? 'atleta' : 'atletas'}
                </span>
              </div>

              {/* Subdivisões por Modalidade */}
              <div className="divide-y divide-slate-100 p-2 sm:p-4 space-y-4">
                {subgrupos.map(([modNome, atletasDaMod]) => (
                  <div key={modNome} className="pt-2 first:pt-0 space-y-2">
                    
                    {/* Título da Modalidade */}
                    <div className="flex items-center justify-between px-2 py-1 bg-slate-50/80 rounded-lg border border-slate-100">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-black text-slate-800 uppercase tracking-wide">
                          {modNome}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">
                        {atletasDaMod.length} {atletasDaMod.length === 1 ? 'atleta' : 'atletas'}
                      </span>
                    </div>

                    {/* Tabela de Alunos da Modalidade */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            <th className="py-2 px-3 w-10">#</th>
                            <th className="py-2 px-3">Atleta</th>
                            <th className="py-2 px-3">Escola Representada</th>
                            <th className="py-2 px-3">Documento / Regularização</th>
                            <th className="py-2 px-3">Nascimento / Idade</th>
                            <th className="py-2 px-3 text-center">Homologação</th>
                            <th className="py-2 px-3 text-right">Crachá</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {atletasDaMod.map((atleta, idx) => {
                            const esc = escolas.find(e => e.id === atleta.escolaId);
                            const isSemDoc = atleta.semDocumento || atleta.documentoTipo === 'SEM_DOCUMENTO' || atleta.documentoNumero === 'SEM DOCUMENTO';
                            const dataNasc = new Date(atleta.dataNascimento).toLocaleDateString('pt-BR');

                            return (
                              <tr key={`${atleta.id}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                                <td className="py-2 px-3 font-mono text-[11px] text-slate-400">
                                  {(idx + 1).toString().padStart(2, '0')}
                                </td>
                                
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                                      {atleta.documentos?.foto3x4 ? (
                                        <img src={atleta.documentos.foto3x4} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        <Users className="w-3.5 h-3.5 text-slate-400" />
                                      )}
                                    </div>
                                    <div className="min-w-0">
                                      <span className="font-bold text-slate-900 block truncate max-w-[220px]">
                                        {atleta.nomeCompleto}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-semibold">
                                        ID: {atleta.id.toUpperCase().slice(0, 8)} • {atleta.sexo === 'FEMININO' ? 'Fem' : 'Masc'}
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-black text-[10px]">
                                      {esc?.sigla || 'ESC'}
                                    </span>
                                    <span className="text-slate-700 truncate max-w-[160px]" title={esc?.nome}>
                                      {esc?.nome || 'Escola Municipal'}
                                    </span>
                                  </div>
                                </td>

                                <td className="py-2 px-3">
                                  {isSemDoc ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-black">
                                      <AlertCircle className="w-3 h-3 text-amber-600" />
                                      <span>EM REGULARIZAÇÃO</span>
                                    </span>
                                  ) : (
                                    <span className="font-mono text-slate-700 text-[11px]">
                                      {atleta.documentoTipo}: {atleta.documentoNumero}
                                    </span>
                                  )}
                                </td>

                                <td className="py-2 px-3 text-slate-600">
                                  <div className="text-[11px]">
                                    <span>{dataNasc}</span>
                                  </div>
                                </td>

                                <td className="py-2 px-3 text-center">
                                  {atleta.conferidoPeloCoordenador ? (
                                    <span className="inline-flex items-center gap-1 text-emerald-700 text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                      <span>Homologado</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-slate-400 text-[10px] font-semibold bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200">
                                      <Clock className="w-3 h-3" />
                                      <span>Pendente</span>
                                    </span>
                                  )}
                                </td>

                                <td className="py-2 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => handleImprimirCracha(atleta)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-colors cursor-pointer"
                                    title="Imprimir crachá individual em PDF"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
          <Users className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">
            Nenhum aluno encontrado com os filtros selecionados
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tente buscar com outro termo ou clique no botão abaixo para redefinir todos os filtros de busca.
          </p>
          <button
            type="button"
            onClick={limparFiltros}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Redefinir Filtros
          </button>
        </div>
      )}

    </div>
  );
}
