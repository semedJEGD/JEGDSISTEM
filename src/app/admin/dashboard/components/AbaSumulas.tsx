'use client';

import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  Download, 
  BookOpen, 
  Layers, 
  School, 
  FileEdit, 
  CheckCircle2, 
  Filter, 
  Users, 
  Search, 
  Calendar,
  Sparkles,
  Award
} from 'lucide-react';
import { ModalidadeConfig, Escola, Atleta, InscricaoEquipe, CategoriaIdade } from '@/types/jegd';
import { JegdsRulesService } from '@/services/jegds-rules';

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

export function AbaSumulas({
  modalidades,
  escolas = [],
  atletas = [],
  inscricoes = [],
  handleGerarListaChamada,
  handleGerarCadernoModalidade,
  handleGerarCadernoGeralArbitragem,
  handleGerarCadernoEscola,
  handleGerarModeloManual
}: AbaSumulasProps) {
  // Controle de Abas das 3 Opções de Súmulas
  const [tipoSumula, setTipoSumula] = useState<'GERAL' | 'ESCOLA' | 'MANUAL'>('ESCOLA');
  
  // Estado para filtro de Escola
  const [escolaSelecionadaId, setEscolaSelecionadaId] = useState<string>(escolas[0]?.id || '');
  const [buscaEscola, setBuscaEscola] = useState<string>('');
  const [gerandoId, setGerandoId] = useState<string | null>(null);

  // Escola ativa selecionada
  const escolaAtiva = useMemo(() => {
    return escolas.find(e => e.id === escolaSelecionadaId) || escolas[0];
  }, [escolas, escolaSelecionadaId]);

  // Lista de escolas filtradas pela busca
  const escolasFiltradas = useMemo(() => {
    if (!buscaEscola.trim()) return escolas;
    const termo = buscaEscola.toLowerCase();
    return escolas.filter(e => 
      e.nome.toLowerCase().includes(termo) || 
      (e.sigla && e.sigla.toLowerCase().includes(termo))
    );
  }, [escolas, buscaEscola]);

  // Informações da Etapa do Calendário por Modalidade
  const getEtapaCalendario = (modCodigo: string) => {
    switch (modCodigo) {
      case 'queimada':
      case 'tenis_mesa':
        return { etapa: '1ª Etapa', data: '28/11/2026', cor: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'atletismo':
      case 'beach_soccer':
        return { etapa: '2ª Etapa', data: '05/12/2026', cor: 'bg-cyan-50 text-cyan-800 border-cyan-200' };
      case 'futsal':
      case 'xadrez':
      case 'futebol_campo':
      case 'voleibol':
      default:
        return { etapa: '3ª Etapa', data: '12/12/2026', cor: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
  };

  // Helper centralizado para buscar e contar atletas únicos por modalidade, categoria, sexo e escola
  const obterAtletasSet = useMemo(() => {
    return (modCodigo: string, categoria?: string, sexo?: string, escolaId?: string) => {
      const idsSet = new Set<string>();

      // 1. Busca por Inscrições homologadas / cadastradas
      inscricoes.forEach(insc => {
        const modMatch = 
          insc.modalidadeCodigo?.toLowerCase() === modCodigo.toLowerCase() ||
          insc.modalidadeNome?.toLowerCase().includes(modCodigo.toLowerCase());

        if (!modMatch) return;
        if (escolaId && insc.escolaId !== escolaId) return;
        if (categoria && insc.categoria !== categoria) return;
        if (sexo && insc.sexo !== sexo) return;

        insc.atletaIds?.forEach(id => idsSet.add(id));
      });

      // 2. Busca direta no cadastro de Atletas
      atletas.forEach(atl => {
        if (escolaId && atl.escolaId !== escolaId) return;
        if (categoria && atl.categoriaCalculada !== categoria) return;
        if (sexo && atl.sexo !== sexo) return;

        const temMod = atl.modalidadesInscritas?.some(m => 
          m.modalidadeCodigo?.toLowerCase() === modCodigo.toLowerCase() || 
          m.modalidadeNome?.toLowerCase().includes(modCodigo.toLowerCase())
        );

        if (temMod) {
          idsSet.add(atl.id);
        }
      });

      return idsSet;
    };
  }, [atletas, inscricoes]);

  // Contagem geral de atletas por escola
  const contagemAtletasPorEscola = useMemo(() => {
    const mapa: Record<string, number> = {};
    atletas.forEach(a => {
      if (a.escolaId) {
        mapa[a.escolaId] = (mapa[a.escolaId] || 0) + 1;
      }
    });
    return mapa;
  }, [atletas]);

  // Estatísticas da escola ativa por Etapa do Calendário e por Faixa Etária
  const estatisticasEscolaAtiva = useMemo(() => {
    if (!escolaAtiva) return null;

    const contagemPorEtapaCalendario = {
      etapa1: new Set<string>(), // Queimada, Tênis de Mesa
      etapa2: new Set<string>(), // Atletismo, Beach Soccer
      etapa3: new Set<string>()  // Futsal, Xadrez, Futebol, Vôlei
    };

    const contagemPorCategoria: Record<CategoriaIdade, number> = {
      MIRIM: 0,
      INFANTIL: 0,
      INFANTO: 0,
      JUNIOR: 0
    };

    modalidades.forEach(mod => {
      const info = getEtapaCalendario(mod.codigo);
      const atletasMod = obterAtletasSet(mod.codigo, undefined, undefined, escolaAtiva.id);
      
      atletasMod.forEach(id => {
        if (info.etapa.startsWith('1')) contagemPorEtapaCalendario.etapa1.add(id);
        else if (info.etapa.startsWith('2')) contagemPorEtapaCalendario.etapa2.add(id);
        else contagemPorEtapaCalendario.etapa3.add(id);
      });
    });

    atletas.filter(a => a.escolaId === escolaAtiva.id).forEach(a => {
      if (a.categoriaCalculada && contagemPorCategoria[a.categoriaCalculada] !== undefined) {
        contagemPorCategoria[a.categoriaCalculada]++;
      }
    });

    return {
      etapa1: contagemPorEtapaCalendario.etapa1.size,
      etapa2: contagemPorEtapaCalendario.etapa2.size,
      etapa3: contagemPorEtapaCalendario.etapa3.size,
      categorias: contagemPorCategoria
    };
  }, [escolaAtiva, modalidades, atletas, obterAtletasSet]);

  // Função para executar com feedback visual
  const executarGeracao = async (id: string, acao: () => Promise<void> | void) => {
    try {
      setGerandoId(id);
      await acao();
    } catch (err: any) {
      console.error('Erro ao gerar súmula:', err);
      alert('Ocorreu um erro ao gerar o arquivo PDF.');
    } finally {
      setGerandoId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* SELETOR PRINCIPAL DAS 3 OPÇÕES DE SÚMULA */}
      <div className="bg-white border border-[#E2EAE5] rounded-3xl p-3 sm:p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* Opção 1: Geral Consolidada */}
          <button
            type="button"
            onClick={() => setTipoSumula('GERAL')}
            className={`p-4 rounded-2xl text-left transition-all border ${
              tipoSumula === 'GERAL'
                ? 'bg-gradient-to-br from-[#E8F7F1] to-white border-[#00A878] shadow-sm'
                : 'bg-[#F7F9F8] border-transparent hover:bg-slate-100/70 text-[#68756E]'
            }`}
          >
            <div className="flex items-center gap-3 mb-1.5">
              <div className={`p-2 rounded-xl ${tipoSumula === 'GERAL' ? 'bg-[#00A878] text-white' : 'bg-slate-200 text-[#68756E]'}`}>
                <Users className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#00A878] block">Opção 1</span>
                <h4 className="text-sm font-black text-[#17221D]">Súmula Geral (Consolidada)</h4>
              </div>
            </div>
            <p className="text-[11px] text-[#68756E] leading-snug">
              Todas as escolas e atletas agrupados por modalidade e etapa.
            </p>
          </button>

          {/* Opção 2: Por Escola */}
          <button
            type="button"
            onClick={() => setTipoSumula('ESCOLA')}
            className={`p-4 rounded-2xl text-left transition-all border ${
              tipoSumula === 'ESCOLA'
                ? 'bg-gradient-to-br from-[#E8F7F1] to-white border-[#00A878] shadow-sm'
                : 'bg-[#F7F9F8] border-transparent hover:bg-slate-100/70 text-[#68756E]'
            }`}
          >
            <div className="flex items-center gap-3 mb-1.5">
              <div className={`p-2 rounded-xl ${tipoSumula === 'ESCOLA' ? 'bg-[#00A878] text-white' : 'bg-slate-200 text-[#68756E]'}`}>
                <School className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#00A878] block">Opção 2</span>
                <h4 className="text-sm font-black text-[#17221D]">Súmula por Escola (Filtrada)</h4>
              </div>
            </div>
            <p className="text-[11px] text-[#68756E] leading-snug">
              Exibe a quantidade exata de alunos em cada modalidade e etapa da escola.
            </p>
          </button>

          {/* Opção 3: Modelo Manual em Branco */}
          <button
            type="button"
            onClick={() => setTipoSumula('MANUAL')}
            className={`p-4 rounded-2xl text-left transition-all border ${
              tipoSumula === 'MANUAL'
                ? 'bg-gradient-to-br from-[#E8F7F1] to-white border-[#00A878] shadow-sm'
                : 'bg-[#F7F9F8] border-transparent hover:bg-slate-100/70 text-[#68756E]'
            }`}
          >
            <div className="flex items-center gap-3 mb-1.5">
              <div className={`p-2 rounded-xl ${tipoSumula === 'MANUAL' ? 'bg-[#00A878] text-white' : 'bg-slate-200 text-[#68756E]'}`}>
                <FileEdit className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-[#00A878] block">Opção 3</span>
                <h4 className="text-sm font-black text-[#17221D]">Modelo Manual (Em Branco)</h4>
              </div>
            </div>
            <p className="text-[11px] text-[#68756E] leading-snug">
              Súmulas oficiais pautadas em branco para anotação à caneta na quadra.
            </p>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* OPÇÃO 2: SÚMULA POR ESCOLA (FILTRADA COM QUANTIDADE DE ALUNOS) */}
      {/* ============================================================== */}
      {tipoSumula === 'ESCOLA' && (
        <div className="space-y-6">
          {/* SELETOR E CARD DA ESCOLA ATIVA */}
          <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#E2EAE5]">
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-[#17221D] flex items-center gap-2">
                  <School className="w-5 h-5 text-[#00A878]" />
                  <span>Súmulas por Escola & Alunos Inscritos por Etapa</span>
                </h3>
                <p className="text-xs text-[#68756E]">
                  Selecione a unidade escolar para visualizar a quantidade de estudantes-atletas em cada modalidade e etapa.
                </p>
              </div>

              {/* Botão Master do Caderno da Escola Selecionada */}
              {escolaAtiva && handleGerarCadernoEscola && (
                <button
                  type="button"
                  onClick={() => executarGeracao(`caderno-escola-${escolaAtiva.id}`, () => handleGerarCadernoEscola(escolaAtiva))}
                  disabled={gerandoId === `caderno-escola-${escolaAtiva.id}`}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#00A878] to-[#087A5B] hover:from-[#087A5B] hover:to-[#00A878] text-white font-black text-xs sm:text-sm shadow-md shadow-[#00A878]/25 flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95 shrink-0 disabled:opacity-50"
                >
                  <BookOpen className="w-4 h-4 text-white" />
                  <span>
                    {gerandoId === `caderno-escola-${escolaAtiva.id}` 
                      ? 'Gerando Caderno...' 
                      : `Baixar Caderno Completo (${escolaAtiva.sigla || escolaAtiva.nome})`}
                  </span>
                </button>
              )}
            </div>

            {/* SELETOR RÁPIDO DE ESCOLA */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <label className="text-xs font-black uppercase tracking-wider text-[#17221D] flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#00A878]" />
                  <span>Escolha a Escola:</span>
                </label>

                {/* Campo de Busca de Escola */}
                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    value={buscaEscola}
                    onChange={(e) => setBuscaEscola(e.target.value)}
                    placeholder="Filtrar escola por nome..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-[#E2EAE5] bg-[#F7F9F8] text-xs font-semibold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Botões rápidos em pílulas */}
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1.5 bg-[#F7F9F8] rounded-2xl border border-[#E2EAE5]">
                {escolasFiltradas.map((esc) => {
                  const totalAtl = contagemAtletasPorEscola[esc.id] || 0;
                  const isSelected = esc.id === escolaAtiva?.id;

                  return (
                    <button
                      key={esc.id}
                      type="button"
                      onClick={() => setEscolaSelecionadaId(esc.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                        isSelected
                          ? 'bg-[#00A878] text-white border-[#00A878] shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-[#475569] border-[#E2EAE5]'
                      }`}
                    >
                      <span>{esc.sigla || esc.nome}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        isSelected ? 'bg-white/25 text-white' : 'bg-[#E8F7F1] text-[#087A5B]'
                      }`}>
                        {totalAtl}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CARD RESUMO DETALHADO DA ESCOLA COM ETAPAS E CATEGORIAS */}
            {escolaAtiva && estatisticasEscolaAtiva && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#E8F7F1]/80 via-white to-[#F7F9F8] border border-[#00A878]/30 space-y-3.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#087A5B] bg-[#E8F7F1] px-2.5 py-0.5 rounded-lg border border-[#00A878]/30">
                        {escolaAtiva.sigla || 'ESCOLA'}
                      </span>
                      <h4 className="text-sm sm:text-base font-black text-[#17221D]">{escolaAtiva.nome}</h4>
                    </div>
                    <p className="text-[11px] text-[#68756E]">
                      INEP: <span className="font-semibold text-[#17221D]">{escolaAtiva.inep || 'Não informado'}</span> • 
                      Total Geral: <span className="font-black text-[#00A878]">{contagemAtletasPorEscola[escolaAtiva.id] || 0} alunos inscritos</span>
                    </p>
                  </div>

                  <span className="text-[11px] font-bold text-[#087A5B] flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-[#00A878]/25 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00A878]" />
                    <span>Contagem atualizada em tempo real</span>
                  </span>
                </div>

                {/* PAINEL DE ETAPAS DO CALENDÁRIO & FAIXAS ETÁRIAS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[#E2EAE5]">
                  {/* Etapas do Calendário */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#68756E] flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-[#00A878]" />
                      <span>Alunos Inscritos por Etapa do Calendário:</span>
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2 rounded-xl bg-white border border-emerald-200 text-center shadow-2xs">
                        <span className="text-[9px] font-bold text-emerald-800 uppercase block">1ª Etapa (28/11)</span>
                        <span className="text-xs font-black text-emerald-950 block">{estatisticasEscolaAtiva.etapa1} alunos</span>
                        <span className="text-[8.5px] text-emerald-700 font-medium">Queimada / Tênis</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-cyan-200 text-center shadow-2xs">
                        <span className="text-[9px] font-bold text-cyan-800 uppercase block">2ª Etapa (05/12)</span>
                        <span className="text-xs font-black text-cyan-950 block">{estatisticasEscolaAtiva.etapa2} alunos</span>
                        <span className="text-[8.5px] text-cyan-700 font-medium">Atletismo / Beach</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-amber-200 text-center shadow-2xs">
                        <span className="text-[9px] font-bold text-amber-800 uppercase block">3ª Etapa (12/12)</span>
                        <span className="text-xs font-black text-amber-950 block">{estatisticasEscolaAtiva.etapa3} alunos</span>
                        <span className="text-[8.5px] text-amber-700 font-medium">Futsal/Xadrez/Fut/Vôlei</span>
                      </div>
                    </div>
                  </div>

                  {/* Etapas por Faixa Etária (Categorias) */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#68756E] flex items-center gap-1.5">
                      <Award className="w-3 h-3 text-[#00A878]" />
                      <span>Alunos Inscritos por Categoria / Faixa Etária:</span>
                    </span>
                    <div className="grid grid-cols-4 gap-1.5">
                      <div className="p-2 rounded-xl bg-white border border-[#E2EAE5] text-center shadow-2xs">
                        <span className="text-[9px] font-bold text-[#68756E] block">MIRIM</span>
                        <span className="text-xs font-black text-[#17221D] block">{estatisticasEscolaAtiva.categorias.MIRIM}</span>
                        <span className="text-[8px] text-[#94A3B8]">9 a 11 anos</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-[#E2EAE5] text-center shadow-2xs">
                        <span className="text-[9px] font-bold text-[#68756E] block">INFANTIL</span>
                        <span className="text-xs font-black text-[#17221D] block">{estatisticasEscolaAtiva.categorias.INFANTIL}</span>
                        <span className="text-[8px] text-[#94A3B8]">12 a 14 anos</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-[#E2EAE5] text-center shadow-2xs">
                        <span className="text-[9px] font-bold text-[#68756E] block">INFANTO</span>
                        <span className="text-xs font-black text-[#17221D] block">{estatisticasEscolaAtiva.categorias.INFANTO}</span>
                        <span className="text-[8px] text-[#94A3B8]">15 a 17 anos</span>
                      </div>
                      <div className="p-2 rounded-xl bg-white border border-[#E2EAE5] text-center shadow-2xs">
                        <span className="text-[9px] font-bold text-[#68756E] block">JUNIOR</span>
                        <span className="text-xs font-black text-[#17221D] block">{estatisticasEscolaAtiva.categorias.JUNIOR}</span>
                        <span className="text-[8px] text-[#94A3B8]">18 a 20 anos</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* GRID DE MODALIDADES COM QUANTIDADES POR MODALIDADE E ETAPA */}
          {escolaAtiva && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {modalidades.map((mod) => {
                const etapaInfo = getEtapaCalendario(mod.codigo);
                const totalAlunosModEscola = obterAtletasSet(mod.codigo, undefined, undefined, escolaAtiva.id).size;

                return (
                  <div
                    key={mod.id}
                    className="bg-white border border-[#E2EAE5] rounded-2xl p-5 space-y-3.5 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      {/* TÍTULO E BADGES DE ETAPA E ESCOLA */}
                      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                        <h4 className="text-sm font-black text-[#17221D]">{mod.nome}</h4>
                        <div className="flex items-center gap-1">
                          <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${etapaInfo.cor}`}>
                            {etapaInfo.etapa} • {etapaInfo.data.slice(0, 5)}
                          </span>
                          <span className="text-[9.5px] font-bold text-[#087A5B] bg-[#E8F7F1] px-2 py-0.5 rounded-full border border-[#00A878]/20">
                            {escolaAtiva.sigla || 'ESCOLA'}
                          </span>
                        </div>
                      </div>

                      <p className="text-[10.5px] text-[#68756E] font-medium mb-2">
                        Categorias: {mod.categoriasPermitidas.join(', ')}
                      </p>

                      {/* QUADRO DE QUANTIDADE TOTAL DE ALUNOS NA MODALIDADE */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5]">
                        <span className="text-[11px] font-bold text-[#17221D] flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#00A878]" />
                          <span>Alunos nesta modalidade:</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg font-black text-xs ${
                          totalAlunosModEscola > 0 
                            ? 'bg-[#00A878] text-white shadow-2xs' 
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          {totalAlunosModEscola} {totalAlunosModEscola === 1 ? 'aluno' : 'alunos'}
                        </span>
                      </div>
                    </div>

                    {/* BOTÃO PRINCIPAL: CADERNO DA MODALIDADE DESTA ESCOLA */}
                    <button
                      type="button"
                      onClick={() => executarGeracao(`mod-esc-${mod.codigo}-${escolaAtiva.id}`, () => handleGerarCadernoModalidade(mod, escolaAtiva.id))}
                      disabled={gerandoId === `mod-esc-${mod.codigo}-${escolaAtiva.id}`}
                      className={`w-full py-2.5 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-2 transition-all shadow-xs group disabled:opacity-50 ${
                        totalAlunosModEscola > 0
                          ? 'bg-[#E8F7F1] hover:bg-[#00A878] text-[#087A5B] hover:text-white border-[#00A878]/30'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                      }`}
                      title={`Baixar todas as categorias de ${mod.nome} desta escola (${totalAlunosModEscola} alunos inscritos)`}
                    >
                      <Layers className="w-3.5 h-3.5 text-[#00A878] group-hover:text-white transition-colors" />
                      <span>
                        {gerandoId === `mod-esc-${mod.codigo}-${escolaAtiva.id}` 
                          ? 'Gerando...' 
                          : `Caderno ${mod.nome} (${totalAlunosModEscola} alunos)`}
                      </span>
                    </button>

                    {/* BOTÕES INDIVIDUAIS POR CATEGORIA COM CONTAGEM DE ALUNOS */}
                    <div className="space-y-1.5 pt-2.5 border-t border-[#E2EAE5]">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#94A3B8]">
                          Súmula por etapa / categoria:
                        </span>
                        <span className="text-[9px] text-[#68756E] font-semibold">Qtd. Alunos</span>
                      </div>

                      {mod.categoriasPermitidas.map((cat) => {
                        const temMasc = JegdsRulesService.validarMatriz(mod.codigo, cat as any, 'MASCULINO').valido;
                        const temFem = JegdsRulesService.validarMatriz(mod.codigo, cat as any, 'FEMININO').valido;

                        const totalMasc = obterAtletasSet(mod.codigo, cat, 'MASCULINO', escolaAtiva.id).size;
                        const totalFem = obterAtletasSet(mod.codigo, cat, 'FEMININO', escolaAtiva.id).size;

                        return (
                          <div key={cat} className="grid grid-cols-2 gap-1.5">
                            {temMasc && (
                              <button
                                type="button"
                                onClick={() => executarGeracao(`mod-esc-${mod.codigo}-${cat}-M-${escolaAtiva.id}`, () => handleGerarListaChamada(mod, cat, 'MASCULINO', escolaAtiva.id))}
                                disabled={gerandoId === `mod-esc-${mod.codigo}-${cat}-M-${escolaAtiva.id}`}
                                className={`py-1.5 px-2 rounded-xl border text-[10px] font-semibold flex items-center justify-between transition-all disabled:opacity-50 ${
                                  totalMasc > 0
                                    ? 'bg-[#E8F7F1]/80 hover:bg-[#00A878] text-[#087A5B] hover:text-white border-[#00A878]/30 shadow-2xs group'
                                    : 'bg-[#F7F9F8] hover:bg-slate-100 text-[#64748B] border-[#E2EAE5]'
                                }`}
                                title={`Súmula ${cat} Masculino para ${escolaAtiva.sigla}: ${totalMasc} aluno(s) inscrito(s)`}
                              >
                                <span className="font-bold">{cat} (M)</span>
                                <div className="flex items-center gap-1">
                                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black transition-colors ${
                                    totalMasc > 0
                                      ? 'bg-[#00A878] text-white group-hover:bg-white group-hover:text-[#087A5B]'
                                      : 'bg-slate-200 text-slate-500'
                                  }`}>
                                    {totalMasc}
                                  </span>
                                  <Download className={`w-2.5 h-2.5 transition-colors ${
                                    totalMasc > 0 ? 'text-[#00A878] group-hover:text-white' : 'text-[#94A3B8]'
                                  }`} />
                                </div>
                              </button>
                            )}

                            {temFem && (
                              <button
                                type="button"
                                onClick={() => executarGeracao(`mod-esc-${mod.codigo}-${cat}-F-${escolaAtiva.id}`, () => handleGerarListaChamada(mod, cat, 'FEMININO', escolaAtiva.id))}
                                disabled={gerandoId === `mod-esc-${mod.codigo}-${cat}-F-${escolaAtiva.id}`}
                                className={`py-1.5 px-2 rounded-xl border text-[10px] font-semibold flex items-center justify-between transition-all disabled:opacity-50 ${
                                  totalFem > 0
                                    ? 'bg-[#FDF2F8] hover:bg-pink-600 text-pink-700 hover:text-white border-pink-300 shadow-2xs group'
                                    : 'bg-[#F7F9F8] hover:bg-slate-100 text-[#64748B] border-[#E2EAE5]'
                                }`}
                                title={`Súmula ${cat} Feminino para ${escolaAtiva.sigla}: ${totalFem} aluna(s) inscrita(s)`}
                              >
                                <span className="font-bold">{cat} (F)</span>
                                <div className="flex items-center gap-1">
                                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black transition-colors ${
                                    totalFem > 0
                                      ? 'bg-pink-600 text-white group-hover:bg-white group-hover:text-pink-700'
                                      : 'bg-slate-200 text-slate-500'
                                  }`}>
                                    {totalFem}
                                  </span>
                                  <Download className={`w-2.5 h-2.5 transition-colors ${
                                    totalFem > 0 ? 'text-pink-500 group-hover:text-white' : 'text-[#94A3B8]'
                                  }`} />
                                </div>
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
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* OPÇÃO 1: SÚMULA GERAL (CONSOLIDADA)                            */}
      {/* ============================================================== */}
      {tipoSumula === 'GERAL' && (
        <div className="space-y-6">
          {/* HEADER GERAL COM BOTÃO MASTER */}
          <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <h3 className="text-base sm:text-lg font-black text-[#17221D] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#00A878]" />
                <span>Súmula Geral de Arbitragem (Todas as Escolas)</span>
              </h3>
              <p className="text-xs text-[#68756E] leading-relaxed">
                Reúne os atletas de todas as escolas inscritas nas respectivas modalidades e categorias. Ideal para o controle geral de Check-in (30 min antes) e WxO (15 min de tolerância).
              </p>
            </div>

            <button
              type="button"
              onClick={() => executarGeracao('geral-arbitragem', handleGerarCadernoGeralArbitragem)}
              disabled={gerandoId === 'geral-arbitragem'}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#00A878] to-[#087A5B] hover:from-[#087A5B] hover:to-[#00A878] text-white font-black text-xs sm:text-sm shadow-md shadow-[#00A878]/25 flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95 shrink-0 disabled:opacity-50"
            >
              <BookOpen className="w-4 h-4 text-white" />
              <span>{gerandoId === 'geral-arbitragem' ? 'Gerando Livro Geral...' : 'Baixar Livro Geral de Arbitragem (1 PDF)'}</span>
            </button>
          </div>

          {/* GRID DE MODALIDADES (GERAL COM CONTAGEM) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {modalidades.map((mod) => {
              const etapaInfo = getEtapaCalendario(mod.codigo);
              const totalAlunosGeralMod = obterAtletasSet(mod.codigo).size;

              return (
                <div
                  key={mod.id}
                  className="bg-white border border-[#E2EAE5] rounded-2xl p-5 space-y-3.5 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                      <h4 className="text-sm font-black text-[#17221D]">{mod.nome}</h4>
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${etapaInfo.cor}`}>
                        {etapaInfo.etapa} • {etapaInfo.data.slice(0, 5)}
                      </span>
                    </div>

                    <p className="text-[10.5px] text-[#68756E] font-medium mb-2">
                      Categorias: {mod.categoriasPermitidas.join(', ')}
                    </p>

                    {/* QUADRO DE QUANTIDADE TOTAL GERAL */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5]">
                      <span className="text-[11px] font-bold text-[#17221D] flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#00A878]" />
                        <span>Total geral de atletas:</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-lg font-black text-xs bg-[#00A878] text-white shadow-2xs">
                        {totalAlunosGeralMod} {totalAlunosGeralMod === 1 ? 'atleta' : 'atletas'}
                      </span>
                    </div>
                  </div>

                  {/* BOTÃO PRINCIPAL: CADERNO COMPLETO DA MODALIDADE */}
                  <button
                    type="button"
                    onClick={() => executarGeracao(`mod-geral-${mod.codigo}`, () => handleGerarCadernoModalidade(mod))}
                    disabled={gerandoId === `mod-geral-${mod.codigo}`}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#E8F7F1] hover:bg-[#00A878] text-[#087A5B] hover:text-white border border-[#00A878]/30 text-xs font-black flex items-center justify-center gap-2 transition-all shadow-xs group disabled:opacity-50"
                    title={`Baixar todas as categorias de ${mod.nome} em um único arquivo PDF`}
                  >
                    <Layers className="w-3.5 h-3.5 text-[#00A878] group-hover:text-white transition-colors" />
                    <span>{gerandoId === `mod-geral-${mod.codigo}` ? 'Gerando...' : `Caderno Completo (${totalAlunosGeralMod} atletas)`}</span>
                  </button>

                  {/* SEPARADOR E BOTÕES INDIVIDUAIS POR CATEGORIA COM CONTAGEM GERAL */}
                  <div className="space-y-1.5 pt-2.5 border-t border-[#E2EAE5]">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#94A3B8]">
                        Súmula por etapa / categoria:
                      </span>
                      <span className="text-[9px] text-[#68756E] font-semibold">Total Geral</span>
                    </div>

                    {mod.categoriasPermitidas.map((cat) => {
                      const temMasc = JegdsRulesService.validarMatriz(mod.codigo, cat as any, 'MASCULINO').valido;
                      const temFem = JegdsRulesService.validarMatriz(mod.codigo, cat as any, 'FEMININO').valido;

                      const totalMasc = obterAtletasSet(mod.codigo, cat, 'MASCULINO').size;
                      const totalFem = obterAtletasSet(mod.codigo, cat, 'FEMININO').size;

                      return (
                        <div key={cat} className="grid grid-cols-2 gap-1.5">
                          {temMasc && (
                            <button
                              type="button"
                              onClick={() => executarGeracao(`mod-geral-${mod.codigo}-${cat}-M`, () => handleGerarListaChamada(mod, cat, 'MASCULINO'))}
                              disabled={gerandoId === `mod-geral-${mod.codigo}-${cat}-M`}
                              className={`py-1.5 px-2 rounded-xl border text-[10px] font-semibold flex items-center justify-between transition-all disabled:opacity-50 ${
                                totalMasc > 0
                                  ? 'bg-[#E8F7F1]/80 hover:bg-[#00A878] text-[#087A5B] hover:text-white border-[#00A878]/30 shadow-2xs group'
                                  : 'bg-[#F7F9F8] hover:bg-slate-100 text-[#64748B] border-[#E2EAE5]'
                              }`}
                              title={`Súmula Geral ${cat} Masculino: ${totalMasc} atletas`}
                            >
                              <span className="font-bold">{cat} (M)</span>
                              <div className="flex items-center gap-1">
                                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black transition-colors ${
                                  totalMasc > 0
                                    ? 'bg-[#00A878] text-white group-hover:bg-white group-hover:text-[#087A5B]'
                                    : 'bg-slate-200 text-slate-500'
                                }`}>
                                  {totalMasc}
                                </span>
                                <Download className={`w-2.5 h-2.5 transition-colors ${
                                  totalMasc > 0 ? 'text-[#00A878] group-hover:text-white' : 'text-[#94A3B8]'
                                }`} />
                              </div>
                            </button>
                          )}

                          {temFem && (
                            <button
                              type="button"
                              onClick={() => executarGeracao(`mod-geral-${mod.codigo}-${cat}-F`, () => handleGerarListaChamada(mod, cat, 'FEMININO'))}
                              disabled={gerandoId === `mod-geral-${mod.codigo}-${cat}-F`}
                              className={`py-1.5 px-2 rounded-xl border text-[10px] font-semibold flex items-center justify-between transition-all disabled:opacity-50 ${
                                totalFem > 0
                                  ? 'bg-[#FDF2F8] hover:bg-pink-600 text-pink-700 hover:text-white border-pink-300 shadow-2xs group'
                                  : 'bg-[#F7F9F8] hover:bg-slate-100 text-[#64748B] border-[#E2EAE5]'
                              }`}
                              title={`Súmula Geral ${cat} Feminino: ${totalFem} atletas`}
                            >
                              <span className="font-bold">{cat} (F)</span>
                              <div className="flex items-center gap-1">
                                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black transition-colors ${
                                  totalFem > 0
                                    ? 'bg-pink-600 text-white group-hover:bg-white group-hover:text-pink-700'
                                    : 'bg-slate-200 text-slate-500'
                                }`}>
                                  {totalFem}
                                </span>
                                <Download className={`w-2.5 h-2.5 transition-colors ${
                                  totalFem > 0 ? 'text-pink-500 group-hover:text-white' : 'text-[#94A3B8]'
                                }`} />
                              </div>
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

      {/* ============================================================== */}
      {/* OPÇÃO 3: SÚMULA MODELO MANUAL (EM BRANCO)                      */}
      {/* ============================================================== */}
      {tipoSumula === 'MANUAL' && (
        <div className="space-y-6">
          {/* HEADER MODELO MANUAL COM BOTÃO MASTER UNIVERSAL */}
          <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <h3 className="text-base sm:text-lg font-black text-[#17221D] flex items-center gap-2">
                <FileEdit className="w-5 h-5 text-[#00A878]" />
                <span>Modelo Oficial de Súmula para Registro Manual</span>
              </h3>
              <p className="text-xs text-[#68756E] leading-relaxed">
                Formulário oficial padronizado com linhas pautadas em branco, caixas de pontuação, faltas (1 a 5), cartões e espaço para 4 assinaturas de arbitragem. Pronto para impressão e preenchimento à mão em campo ou quadra em casos de contingência.
              </p>
            </div>

            {handleGerarModeloManual && (
              <button
                type="button"
                onClick={() => executarGeracao('manual-universal', () => handleGerarModeloManual())}
                disabled={gerandoId === 'manual-universal'}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#00A878] to-[#087A5B] hover:from-[#087A5B] hover:to-[#00A878] text-white font-black text-xs sm:text-sm shadow-md shadow-[#00A878]/25 flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95 shrink-0 disabled:opacity-50"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>{gerandoId === 'manual-universal' ? 'Gerando Modelo...' : 'Baixar Modelo Universal em Branco (1 Clique)'}</span>
              </button>
            )}
          </div>

          {/* GRID DE MODELOS MANUAIS POR MODALIDADE */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {modalidades.map((mod) => {
              const etapaInfo = getEtapaCalendario(mod.codigo);

              return (
                <div
                  key={mod.id}
                  className="bg-white border border-[#E2EAE5] rounded-2xl p-5 space-y-3.5 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                      <h4 className="text-sm font-black text-[#17221D]">{mod.nome}</h4>
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${etapaInfo.cor}`}>
                        {etapaInfo.etapa} • {etapaInfo.data.slice(0, 5)}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#68756E] font-medium">
                      Cabeçalho oficial de {mod.nome} com linhas pautadas para caneta.
                    </p>
                  </div>

                  {/* BOTÃO PRINCIPAL: MODELO MANUAL DA MODALIDADE */}
                  {handleGerarModeloManual && (
                    <button
                      type="button"
                      onClick={() => executarGeracao(`manual-mod-${mod.codigo}`, () => handleGerarModeloManual(mod))}
                      disabled={gerandoId === `manual-mod-${mod.codigo}`}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-600 text-amber-800 hover:text-white border border-amber-300 text-xs font-black flex items-center justify-center gap-2 transition-all shadow-xs group disabled:opacity-50"
                      title={`Baixar súmula manual em branco de ${mod.nome}`}
                    >
                      <Download className="w-3.5 h-3.5 text-amber-700 group-hover:text-white transition-colors" />
                      <span>{gerandoId === `manual-mod-${mod.codigo}` ? 'Gerando...' : `Modelo ${mod.nome} (A4)`}</span>
                    </button>
                  )}

                  {/* BOTÕES DE MODELO MANUAL POR CATEGORIA */}
                  <div className="space-y-1.5 pt-2.5 border-t border-[#E2EAE5]">
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#94A3B8] block">
                      Modelo manual com categoria preenchida:
                    </span>
                    {mod.categoriasPermitidas.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleGerarModeloManual && executarGeracao(`manual-mod-${mod.codigo}-${cat}`, () => handleGerarModeloManual(mod, cat, 'MASC / FEM'))}
                        disabled={gerandoId === `manual-mod-${mod.codigo}-${cat}`}
                        className="w-full py-1.5 px-2.5 rounded-lg bg-[#F7F9F8] hover:bg-slate-100 text-[#475569] hover:text-[#17221D] border border-[#E2EAE5] text-[10.5px] font-semibold flex items-center justify-between transition-colors disabled:opacity-50"
                      >
                        <span>Modelo Manual {cat}</span>
                        <Download className="w-3 h-3 text-[#94A3B8]" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
