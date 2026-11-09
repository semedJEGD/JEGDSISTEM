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
  ChevronRight,
  ShieldAlert,
  Calendar,
  Sparkles
} from 'lucide-react';
import { ModalidadeConfig, Escola, Atleta, InscricaoEquipe } from '@/types/jegd';
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
  const [tipoSumula, setTipoSumula] = useState<'GERAL' | 'ESCOLA' | 'MANUAL'>('GERAL');
  
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

  // Contagem de atletas por escola
  const contagemAtletasPorEscola = useMemo(() => {
    const mapa: Record<string, number> = {};
    atletas.forEach(a => {
      if (a.escolaId) {
        mapa[a.escolaId] = (mapa[a.escolaId] || 0) + 1;
      }
    });
    return mapa;
  }, [atletas]);

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
              Todas as escolas e atletas agrupados por modalidade. Ideal para a mesa de arbitragem central.
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
              Filtre por escola para emitir as súmulas com os atletas de cada instituição separados individualmente.
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
              Súmulas oficiais pautadas em branco prontas para impressão e preenchimento à caneta na quadra.
            </p>
          </button>
        </div>
      </div>

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

          {/* GRID DE MODALIDADES (GERAL) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {modalidades.map((mod) => (
              <div
                key={mod.id}
                className="bg-white border border-[#E2EAE5] rounded-2xl p-5 space-y-3.5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-black text-[#17221D]">{mod.nome}</h4>
                    <span className="text-[10px] font-bold text-[#087A5B] bg-[#E8F7F1] px-2 py-0.5 rounded-full border border-[#00A878]/20">
                      {new Date(mod.dataEvento).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#68756E] font-medium">
                    Categorias: {mod.categoriasPermitidas.join(', ')}
                  </p>
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
                  <span>{gerandoId === `mod-geral-${mod.codigo}` ? 'Gerando...' : 'Caderno Completo (1 PDF)'}</span>
                </button>

                {/* SEPARADOR E BOTÕES INDIVIDUAIS POR CATEGORIA (MASC E FEM) */}
                <div className="space-y-1.5 pt-2.5 border-t border-[#E2EAE5]">
                  <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#94A3B8] block">
                    Súmula individual por categoria:
                  </span>
                  {mod.categoriasPermitidas.map((cat) => {
                    const temMasc = JegdsRulesService.validarMatriz(mod.codigo, cat as any, 'MASCULINO').valido;
                    const temFem = JegdsRulesService.validarMatriz(mod.codigo, cat as any, 'FEMININO').valido;

                    return (
                      <div key={cat} className="grid grid-cols-2 gap-1.5">
                        {temMasc && (
                          <button
                            type="button"
                            onClick={() => executarGeracao(`mod-geral-${mod.codigo}-${cat}-M`, () => handleGerarListaChamada(mod, cat, 'MASCULINO'))}
                            disabled={gerandoId === `mod-geral-${mod.codigo}-${cat}-M`}
                            className="py-1.5 px-2 rounded-lg bg-[#F7F9F8] hover:bg-slate-100 text-[#475569] hover:text-[#17221D] border border-[#E2EAE5] text-[10px] font-semibold flex items-center justify-between transition-colors disabled:opacity-50"
                            title={`Súmula ${cat} Masculino`}
                          >
                            <span>{cat} (M)</span>
                            <Download className="w-2.5 h-2.5 text-[#94A3B8]" />
                          </button>
                        )}
                        {temFem && (
                          <button
                            type="button"
                            onClick={() => executarGeracao(`mod-geral-${mod.codigo}-${cat}-F`, () => handleGerarListaChamada(mod, cat, 'FEMININO'))}
                            disabled={gerandoId === `mod-geral-${mod.codigo}-${cat}-F`}
                            className="py-1.5 px-2 rounded-lg bg-[#FDF2F8] hover:bg-pink-100/70 text-pink-700 hover:text-pink-900 border border-pink-200 text-[10px] font-semibold flex items-center justify-between transition-colors disabled:opacity-50"
                            title={`Súmula ${cat} Feminino`}
                          >
                            <span>{cat} (F)</span>
                            <Download className="w-2.5 h-2.5 text-pink-400" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* OPÇÃO 2: SÚMULA POR ESCOLA (FILTRADA)                          */}
      {/* ============================================================== */}
      {tipoSumula === 'ESCOLA' && (
        <div className="space-y-6">
          {/* SELETOR E CARD DA ESCOLA ATIVA */}
          <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#E2EAE5]">
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-[#17221D] flex items-center gap-2">
                  <School className="w-5 h-5 text-[#00A878]" />
                  <span>Súmulas por Escola (Isoladas)</span>
                </h3>
                <p className="text-xs text-[#68756E]">
                  Selecione a unidade escolar para baixar as súmulas exclusivas com os estudantes-atletas daquela instituição.
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
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 bg-[#F7F9F8] rounded-2xl border border-[#E2EAE5]">
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
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-[#087A5B]'
                      }`}>
                        {totalAtl}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CARD RESUMO DA ESCOLA ATIVA */}
            {escolaAtiva && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-[#E8F7F1]/60 to-[#F7F9F8] border border-[#00A878]/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#087A5B] bg-[#E8F7F1] px-2 py-0.5 rounded-md border border-[#00A878]/30">
                      {escolaAtiva.sigla || 'ESCOLA'}
                    </span>
                    <h4 className="text-sm font-black text-[#17221D]">{escolaAtiva.nome}</h4>
                  </div>
                  <p className="text-[11px] text-[#68756E]">
                    INEP: <span className="font-semibold text-[#17221D]">{escolaAtiva.inep || 'Não informado'}</span> • 
                    Total de Atletas: <span className="font-semibold text-[#00A878]">{contagemAtletasPorEscola[escolaAtiva.id] || 0} inscritos</span>
                  </p>
                </div>

                <span className="text-[11px] font-bold text-[#087A5B] flex items-center gap-1.5 bg-white px-3 py-1 rounded-xl border border-[#00A878]/20 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00A878]" />
                  <span>Pronto para emitir súmulas individuais</span>
                </span>
              </div>
            )}
          </div>

          {/* GRID DE MODALIDADES FILTRADAS PARA A ESCOLA SELECIONADA */}
          {escolaAtiva && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {modalidades.map((mod) => (
                <div
                  key={mod.id}
                  className="bg-white border border-[#E2EAE5] rounded-2xl p-5 space-y-3.5 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-black text-[#17221D]">{mod.nome}</h4>
                      <span className="text-[10px] font-bold text-[#087A5B] bg-[#E8F7F1] px-2 py-0.5 rounded-full border border-[#00A878]/20">
                        {escolaAtiva.sigla || 'ESCOLA'}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#68756E] font-medium">
                      Categorias: {mod.categoriasPermitidas.join(', ')}
                    </p>
                  </div>

                  {/* BOTÃO PRINCIPAL: CADERNO DA MODALIDADE DESTA ESCOLA */}
                  <button
                    type="button"
                    onClick={() => executarGeracao(`mod-esc-${mod.codigo}-${escolaAtiva.id}`, () => handleGerarCadernoModalidade(mod, escolaAtiva.id))}
                    disabled={gerandoId === `mod-esc-${mod.codigo}-${escolaAtiva.id}`}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#E8F7F1] hover:bg-[#00A878] text-[#087A5B] hover:text-white border border-[#00A878]/30 text-xs font-black flex items-center justify-center gap-2 transition-all shadow-xs group disabled:opacity-50"
                    title={`Baixar todas as categorias de ${mod.nome} desta escola`}
                  >
                    <Layers className="w-3.5 h-3.5 text-[#00A878] group-hover:text-white transition-colors" />
                    <span>{gerandoId === `mod-esc-${mod.codigo}-${escolaAtiva.id}` ? 'Gerando...' : `Caderno ${mod.nome} (${escolaAtiva.sigla || 'Escola'})`}</span>
                  </button>

                  {/* BOTÕES INDIVIDUAIS POR CATEGORIA DESTA ESCOLA */}
                  <div className="space-y-1.5 pt-2.5 border-t border-[#E2EAE5]">
                    <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#94A3B8] block">
                      Súmula individual da escola:
                    </span>
                    {mod.categoriasPermitidas.map((cat) => {
                      const temMasc = JegdsRulesService.validarMatriz(mod.codigo, cat as any, 'MASCULINO').valido;
                      const temFem = JegdsRulesService.validarMatriz(mod.codigo, cat as any, 'FEMININO').valido;

                      return (
                        <div key={cat} className="grid grid-cols-2 gap-1.5">
                          {temMasc && (
                            <button
                              type="button"
                              onClick={() => executarGeracao(`mod-esc-${mod.codigo}-${cat}-M-${escolaAtiva.id}`, () => handleGerarListaChamada(mod, cat, 'MASCULINO', escolaAtiva.id))}
                              disabled={gerandoId === `mod-esc-${mod.codigo}-${cat}-M-${escolaAtiva.id}`}
                              className="py-1.5 px-2 rounded-lg bg-[#F7F9F8] hover:bg-slate-100 text-[#475569] hover:text-[#17221D] border border-[#E2EAE5] text-[10px] font-semibold flex items-center justify-between transition-colors disabled:opacity-50"
                              title={`Súmula ${cat} Masculino para ${escolaAtiva.sigla}`}
                            >
                              <span>{cat} (M)</span>
                              <Download className="w-2.5 h-2.5 text-[#94A3B8]" />
                            </button>
                          )}
                          {temFem && (
                            <button
                              type="button"
                              onClick={() => executarGeracao(`mod-esc-${mod.codigo}-${cat}-F-${escolaAtiva.id}`, () => handleGerarListaChamada(mod, cat, 'FEMININO', escolaAtiva.id))}
                              disabled={gerandoId === `mod-esc-${mod.codigo}-${cat}-F-${escolaAtiva.id}`}
                              className="py-1.5 px-2 rounded-lg bg-[#FDF2F8] hover:bg-pink-100/70 text-pink-700 hover:text-pink-900 border border-pink-200 text-[10px] font-semibold flex items-center justify-between transition-colors disabled:opacity-50"
                              title={`Súmula ${cat} Feminino para ${escolaAtiva.sigla}`}
                            >
                              <span>{cat} (F)</span>
                              <Download className="w-2.5 h-2.5 text-pink-400" />
                            </button>
                          )}
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
            {modalidades.map((mod) => (
              <div
                key={mod.id}
                className="bg-white border border-[#E2EAE5] rounded-2xl p-5 space-y-3.5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-black text-[#17221D]">{mod.nome}</h4>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Manual em Branco
                    </span>
                  </div>

                  <p className="text-[11px] text-[#68756E] font-medium">
                    Cabeçalho oficial de {mod.nome} com linhas vazias para caneta.
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
