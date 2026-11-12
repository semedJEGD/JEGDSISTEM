'use client';

import React, { useState, useMemo } from 'react';
import {
  School,
  Trophy,
  Users,
  Printer,
  Download,
  QrCode,
  CheckSquare,
  Square,
  MessageSquare,
  LayoutGrid,
  List,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  FileText,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { Escola, Atleta, ModalidadeConfig } from '@/types/jegd';
import { JegdPdfGenerator } from '@/lib/pdf-generator';

interface AbaEscolasLoteProps {
  progressoEscolas: {
    escola: Escola;
    totalAtletas: number;
    totalInscricoes: number;
    totalConferidos: number;
    status: 'PREENCHIDO' | 'EM_ANDAMENTO' | 'SEM_INSCRICAO';
  }[];
  escolaSelecionadaId: string;
  setEscolaSelecionadaId: (id: string) => void;
  escolaSelecionada: Escola | undefined;
  atletasDaEscolaSelecionada: Atleta[];
  modalidades: ModalidadeConfig[];
  filtroModalidadeLote: string;
  setFiltroModalidadeLote: (val: string) => void;
  filtroCategoriaLote: string;
  setFiltroCategoriaLote: (val: string) => void;
  filtroSexoLote: string;
  setFiltroSexoLote: (val: string) => void;
  modoVisualizacaoLote: 'CARDS' | 'TABELA';
  setModoVisualizacaoLote: (val: 'CARDS' | 'TABELA') => void;
  gerandoPdf: boolean;
  handleGerarCrachasEscola: (esc: Escola) => void;
  handleImprimirLoteEscola: (esc: Escola, filtroMod?: string, filtroCat?: string, filtroSex?: string) => void;
  handleGerarCrachaIndividual: (atleta: Atleta, esc?: Escola) => void;
  handleGerarCadernoEscola?: (esc: Escola) => void;
  toggleConferenciaAtleta: (atleta: Atleta) => void;
  abrirModalObsAtleta: (atleta: Atleta) => void;
  onNovoAtleta?: (esc: Escola) => void;
  onEditarAtleta?: (atleta: Atleta, esc: Escola) => void;
  onExcluirAtleta?: (atleta: Atleta, esc: Escola) => void;
  onAcessarInscricoesEscola?: (esc: Escola) => void;
  onAprovarEquipeModalidade?: (escola: Escola, modalidade: ModalidadeConfig, atletasDaEquipe: Atleta[]) => void;
}

export function AbaEscolasLote({
  progressoEscolas,
  escolaSelecionadaId,
  setEscolaSelecionadaId,
  escolaSelecionada,
  atletasDaEscolaSelecionada,
  modalidades,
  filtroModalidadeLote,
  setFiltroModalidadeLote,
  filtroCategoriaLote,
  setFiltroCategoriaLote,
  filtroSexoLote,
  setFiltroSexoLote,
  modoVisualizacaoLote,
  setModoVisualizacaoLote,
  gerandoPdf,
  handleGerarCrachasEscola,
  handleImprimirLoteEscola,
  handleGerarCrachaIndividual,
  handleGerarCadernoEscola,
  toggleConferenciaAtleta,
  abrirModalObsAtleta,
  onNovoAtleta,
  onEditarAtleta,
  onExcluirAtleta,
  onAcessarInscricoesEscola,
  onAprovarEquipeModalidade
}: AbaEscolasLoteProps) {
  const [buscaEscola, setBuscaEscola] = useState('');
  const [buscaAluno, setBuscaAluno] = useState('');
  const [filtroStatusEscola, setFiltroStatusEscola] = useState<'TODAS' | 'COM_ALUNOS' | 'SEM_ALUNOS'>('TODAS');
  const [menuImprimirAberto, setMenuImprimirAberto] = useState(false);

  // Escolas filtradas na barra lateral
  const escolasFiltradas = useMemo(() => {
    return progressoEscolas.filter(item => {
      const matchBusca =
        !buscaEscola ||
        item.escola.nome.toLowerCase().includes(buscaEscola.toLowerCase()) ||
        item.escola.sigla.toLowerCase().includes(buscaEscola.toLowerCase());

      if (!matchBusca) return false;

      if (filtroStatusEscola === 'COM_ALUNOS') return item.totalAtletas > 0;
      if (filtroStatusEscola === 'SEM_ALUNOS') return item.totalAtletas === 0;
      return true;
    });
  }, [progressoEscolas, buscaEscola, filtroStatusEscola]);

  // Alunos filtrados por modalidade, categoria, sexo e busca de texto
  const atletasFiltrados = useMemo(() => {
    return atletasDaEscolaSelecionada.filter(a => {
      if (buscaAluno) {
        const termo = buscaAluno.toLowerCase();
        const matchNome = a.nomeCompleto.toLowerCase().includes(termo);
        const matchDoc = a.documentoNumero?.toLowerCase().includes(termo);
        const matchMat = a.matricula?.toLowerCase().includes(termo);
        if (!matchNome && !matchDoc && !matchMat) return false;
      }
      if (filtroCategoriaLote !== 'TODAS' && a.categoriaCalculada !== filtroCategoriaLote) return false;
      if (filtroSexoLote !== 'TODOS' && a.sexo !== filtroSexoLote) return false;
      if (filtroModalidadeLote !== 'TODAS') {
        const temMod = a.modalidadesInscritas?.some(
          m => m.modalidadeCodigo === filtroModalidadeLote || m.modalidadeNome.toLowerCase().includes(filtroModalidadeLote.toLowerCase())
        );
        if (!temMod) return false;
      }
      return true;
    });
  }, [atletasDaEscolaSelecionada, buscaAluno, filtroModalidadeLote, filtroCategoriaLote, filtroSexoLote]);

  const progressoAtual = progressoEscolas.find(p => p.escola.id === escolaSelecionadaId);

  return (
    <div className="space-y-4">
      {/* LAYOUT MASTER-DETAIL: BARRA LATERAL DE ESCOLAS + ESPAÇO DE TRABALHO DA ESCOLA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* ==================== COLUNA ESQUERDA: LISTA COMPACTA DE ESCOLAS ==================== */}
        <div className="lg:col-span-4 xl:col-span-3 bg-white border border-[#E2EAE5] rounded-2xl shadow-xs overflow-hidden flex flex-col">
          
          {/* Topo da lista de escolas */}
          <div className="p-3.5 border-b border-[#E2EAE5] bg-[#F7F9F8] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-[#17221D] flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-[#00A878]" />
                <span>Escolas ({escolasFiltradas.length})</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#E2EAE5] text-[#4B5563]">
                Total: {progressoEscolas.reduce((acc, e) => acc + e.totalAtletas, 0)} alunos
              </span>
            </div>

            {/* Busca Rápida de Escola */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#4B5563] absolute left-3 top-2.5" />
              <input
                type="text"
                value={buscaEscola}
                onChange={(e) => setBuscaEscola(e.target.value)}
                placeholder="Buscar escola ou sigla..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#E2EAE5] text-xs font-medium text-[#17221D] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A878]"
              />
            </div>

            {/* Filtros de Status da Escola */}
            <div className="flex items-center gap-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setFiltroStatusEscola('TODAS')}
                className={`flex-1 py-1 px-1.5 rounded-lg text-center transition-all ${
                  filtroStatusEscola === 'TODAS'
                    ? 'bg-white text-[#087A5B] shadow-2xs font-black border border-[#E2EAE5]'
                    : 'text-[#64748B] hover:text-[#17221D]'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setFiltroStatusEscola('COM_ALUNOS')}
                className={`flex-1 py-1 px-1.5 rounded-lg text-center transition-all ${
                  filtroStatusEscola === 'COM_ALUNOS'
                    ? 'bg-emerald-50 text-emerald-800 shadow-2xs font-black border border-emerald-200'
                    : 'text-[#64748B] hover:text-emerald-700'
                }`}
              >
                Com Alunos
              </button>
              <button
                type="button"
                onClick={() => setFiltroStatusEscola('SEM_ALUNOS')}
                className={`flex-1 py-1 px-1.5 rounded-lg text-center transition-all ${
                  filtroStatusEscola === 'SEM_ALUNOS'
                    ? 'bg-gray-100 text-gray-800 shadow-2xs font-black border border-gray-300'
                    : 'text-[#64748B] hover:text-gray-700'
                }`}
              >
                Sem Inscrição
              </button>
            </div>
          </div>

          {/* Lista com Rolagem Otimizada */}
          <div className="divide-y divide-[#E2EAE5] max-h-[520px] overflow-y-auto">
            {escolasFiltradas.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#94A3B8]">
                Nenhuma escola encontrada.
              </div>
            ) : (
              escolasFiltradas.map((item) => {
                const isSelected = escolaSelecionadaId === item.escola.id;
                const temAlunos = item.totalAtletas > 0;

                return (
                  <button
                    key={item.escola.id}
                    type="button"
                    onClick={() => setEscolaSelecionadaId(item.escola.id)}
                    className={`w-full text-left p-3 transition-all flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-[#E8F7F1] border-l-4 border-l-[#00A878]'
                        : 'hover:bg-[#F7F9F8] border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          temAlunos ? 'bg-emerald-500' : 'bg-gray-300'
                        }`} />
                        <span className={`text-xs font-black truncate ${
                          isSelected ? 'text-[#087A5B]' : 'text-[#17221D]'
                        }`}>
                          {item.escola.sigla || item.escola.nome}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#64748B] truncate mt-0.5 pl-3.5">
                        {item.escola.nome}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                        temAlunos
                          ? 'bg-emerald-100/70 text-emerald-900 border border-emerald-200'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.totalAtletas} {item.totalAtletas === 1 ? 'aluno' : 'alunos'}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ==================== COLUNA DIREITA: ESPAÇO DE TRABALHO DA ESCOLA ==================== */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          {escolaSelecionada ? (
            <div className="bg-white border border-[#E2EAE5] rounded-2xl shadow-xs overflow-hidden">
              
              {/* CABEÇALHO DA ESCOLA SELECIONADA */}
              <div className="p-4 sm:p-5 border-b border-[#E2EAE5] bg-gradient-to-r from-emerald-50/50 via-white to-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 font-black text-xs border border-emerald-300 shrink-0">
                      {escolaSelecionada.sigla}
                    </span>
                    <h2 className="text-base sm:text-lg font-black text-[#17221D] truncate">
                      {escolaSelecionada.nome}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 text-xs text-[#64748B] mt-1 flex-wrap">
                    <span>INEP: <strong className="text-[#17221D]">{escolaSelecionada.inep || '—'}</strong></span>
                    <span>•</span>
                    <span>Contato: <strong className="text-[#17221D]">{escolaSelecionada.responsavelTelefone || escolaSelecionada.loginEmail}</strong></span>
                    {progressoAtual && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">
                          {progressoAtual.totalConferidos}/{progressoAtual.totalAtletas} conferidos
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* BOTÕES DE AÇÃO PRINCIPAL DA ESCOLA */}
                <div className="flex items-center gap-2 flex-wrap shrink-0 w-full sm:w-auto">
                  
                  {/* BOTÃO PRIMÁRIO: INSCREVER ALUNO */}
                  {onNovoAtleta && (
                    <button
                      type="button"
                      onClick={() => onNovoAtleta(escolaSelecionada)}
                      className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                      title="Inscrever e cadastrar novo aluno nesta escola pela Coordenação SEMED"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Inscrever Aluno</span>
                    </button>
                  )}

                  {/* BOTÃO SECUNDÁRIO: MONTAR EQUIPES */}
                  {onAcessarInscricoesEscola && (
                    <button
                      type="button"
                      onClick={() => onAcessarInscricoesEscola(escolaSelecionada)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-2xs flex items-center gap-1.5 transition-all"
                      title="Montar inscrições de equipes por modalidade e emitir fichas"
                    >
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden sm:inline">Montar Equipes</span>
                      <span className="sm:hidden">Equipes</span>
                    </button>
                  )}

                  {/* MENU DROPDOWN DE IMPRESSÃO / EXPORTAÇÃO */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setMenuImprimirAberto(!menuImprimirAberto)}
                      disabled={gerandoPdf || atletasDaEscolaSelecionada.length === 0}
                      className="px-3 py-2 rounded-xl bg-[#F7F9F8] hover:bg-[#E8F7F1] border border-[#00A878]/30 text-[#087A5B] font-black text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir / PDF</span>
                      <ChevronDown className="w-3 h-3 ml-0.5" />
                    </button>

                    {menuImprimirAberto && (
                      <div
                        className="absolute right-0 mt-1.5 w-60 bg-white border border-[#E2EAE5] rounded-xl shadow-lg p-1.5 z-30 space-y-1"
                        onMouseLeave={() => setMenuImprimirAberto(false)}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setMenuImprimirAberto(false);
                            handleImprimirLoteEscola(escolaSelecionada);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-[#17221D] hover:bg-[#E8F7F1] hover:text-[#087A5B] flex items-center gap-2 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#00A878]" />
                          <span>Delegação Geral (Ficha Completa)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMenuImprimirAberto(false);
                            handleGerarCrachasEscola(escolaSelecionada);
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-[#17221D] hover:bg-[#E8F7F1] hover:text-[#087A5B] flex items-center gap-2 transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5 text-[#00A878]" />
                          <span>Todos os Crachás da Escola (PDF)</span>
                        </button>
                        {handleGerarCadernoEscola && (
                          <button
                            type="button"
                            onClick={() => {
                              setMenuImprimirAberto(false);
                              handleGerarCadernoEscola(escolaSelecionada);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-[#17221D] hover:bg-[#E8F7F1] hover:text-[#087A5B] flex items-center gap-2 transition-colors"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-[#00A878]" />
                            <span>Caderno de Súmulas da Escola (PDF)</span>
                          </button>
                        )}
                        {(filtroModalidadeLote !== 'TODAS' || filtroCategoriaLote !== 'TODAS' || filtroSexoLote !== 'TODOS') && (
                          <button
                            type="button"
                            onClick={() => {
                              setMenuImprimirAberto(false);
                              handleImprimirLoteEscola(escolaSelecionada, filtroModalidadeLote, filtroCategoriaLote, filtroSexoLote);
                            }}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 flex items-center gap-2 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5 text-amber-700" />
                            <span>Imprimir Apenas Filtro Atual</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* BARRA DE FILTROS COMPACTA DO LOTE */}
              <div className="p-3 bg-[#F7F9F8] border-b border-[#E2EAE5] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                
                {/* Busca de Alunos dentro da Escola */}
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={buscaAluno}
                    onChange={(e) => setBuscaAluno(e.target.value)}
                    placeholder="Buscar aluno por nome ou documento..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#E2EAE5] text-xs font-medium text-[#17221D] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A878]"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Filtro de Modalidade */}
                  <select
                    value={filtroModalidadeLote}
                    onChange={(e) => setFiltroModalidadeLote(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-[#E2EAE5] text-xs font-bold text-[#17221D] focus:outline-none focus:border-[#00A878]"
                  >
                    <option value="TODAS">Todas Modalidades</option>
                    {modalidades.map(m => (
                      <option key={m.id} value={m.codigo}>{m.nome}</option>
                    ))}
                  </select>

                  {/* Filtro de Categoria */}
                  <select
                    value={filtroCategoriaLote}
                    onChange={(e) => setFiltroCategoriaLote(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-[#E2EAE5] text-xs font-bold text-[#17221D] focus:outline-none focus:border-[#00A878]"
                  >
                    <option value="TODAS">Todas Categorias</option>
                    <option value="MIRIM">Mirim (9-11)</option>
                    <option value="INFANTIL">Infantil (12-14)</option>
                    <option value="INFANTO">Infanto (15-17)</option>
                    <option value="JUNIOR">Junior (18-20)</option>
                  </select>

                  {/* Alternador de Modo de Visualização */}
                  <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-[#E2EAE5]">
                    <button
                      type="button"
                      onClick={() => setModoVisualizacaoLote('CARDS')}
                      className={`p-1.5 rounded-lg transition-all ${
                        modoVisualizacaoLote === 'CARDS'
                          ? 'bg-[#00A878] text-white'
                          : 'text-[#64748B] hover:text-[#17221D]'
                      }`}
                      title="Visualização em Cards por Modalidade"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setModoVisualizacaoLote('TABELA')}
                      className={`p-1.5 rounded-lg transition-all ${
                        modoVisualizacaoLote === 'TABELA'
                          ? 'bg-[#00A878] text-white'
                          : 'text-[#64748B] hover:text-[#17221D]'
                      }`}
                      title="Visualização em Tabela Geral"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* LISTAGEM DE ATLETAS DA ESCOLA */}
              <div className="p-4 sm:p-5">
                {atletasDaEscolaSelecionada.length === 0 ? (
                  <div className="py-12 text-center text-[#64748B] bg-[#F7F9F8] rounded-xl border border-dashed border-[#E2EAE5]">
                    <School className="w-8 h-8 text-[#94A3B8] mx-auto mb-2 opacity-60" />
                    <p className="font-bold text-sm text-[#17221D]">Nenhum aluno cadastrado nesta escola ainda.</p>
                    <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                      A coordenação pode inscrever alunos imediatamente clicando no botão <strong>+ Inscrever Aluno</strong> acima.
                    </p>
                    {onNovoAtleta && (
                      <button
                        type="button"
                        onClick={() => onNovoAtleta(escolaSelecionada)}
                        className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Cadastrar Primeiro Aluno</span>
                      </button>
                    )}
                  </div>
                ) : atletasFiltrados.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#64748B] bg-[#F7F9F8] rounded-xl border border-[#E2EAE5]">
                    Nenhum aluno corresponde aos filtros selecionados.
                  </div>
                ) : modoVisualizacaoLote === 'CARDS' ? (
                  
                  /* VISUALIZAÇÃO EM CARDS AGRUPADOS POR MODALIDADE */
                  <div className="space-y-4">
                    {modalidades
                      .filter(m => filtroModalidadeLote === 'TODAS' || m.codigo === filtroModalidadeLote)
                      .map((modalidade) => {
                        const atletasNestaMod = atletasFiltrados.filter(a =>
                          a.modalidadesInscritas?.some(
                            mod => mod.modalidadeCodigo === modalidade.codigo || mod.modalidadeNome.toLowerCase().includes(modalidade.nome.toLowerCase())
                          )
                        );

                        if (atletasNestaMod.length === 0) return null;

                        const todosAprovados = atletasNestaMod.every(a => a.conferidoPeloCoordenador);
                        const totalAprovados = atletasNestaMod.filter(a => a.conferidoPeloCoordenador).length;

                        return (
                          <div
                            key={modalidade.id}
                            className="bg-white border border-[#E2EAE5] rounded-xl p-4 space-y-3 shadow-2xs hover:border-[#00A878]/40 transition-colors"
                          >
                            <div className="flex items-center justify-between pb-2 border-b border-gray-100 flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xs">
                                  <Trophy className="w-3.5 h-3.5" />
                                </span>
                                <div>
                                  <span className="text-sm font-black text-[#17221D]">{modalidade.nome}</span>
                                  <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    {atletasNestaMod.length} {atletasNestaMod.length === 1 ? 'atleta' : 'atletas'}
                                  </span>
                                  <span className={`ml-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    todosAprovados
                                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }`}>
                                    {totalAprovados}/{atletasNestaMod.length} aprovados
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 flex-wrap">
                                {onAprovarEquipeModalidade && (
                                  <button
                                    type="button"
                                    onClick={() => onAprovarEquipeModalidade(escolaSelecionada, modalidade, atletasNestaMod)}
                                    disabled={todosAprovados}
                                    className={`text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                                      todosAprovados
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                                        : 'bg-[#00A878] hover:bg-[#087A5B] text-white shadow-2xs cursor-pointer'
                                    }`}
                                    title={todosAprovados ? 'Todos os alunos desta modalidade já estão aprovados' : 'Aprovar todos os alunos e homologar equipe nesta modalidade'}
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                    <span>{todosAprovados ? 'Equipe Aprovada' : 'Aprovar Equipe'}</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => JegdPdfGenerator.gerarCrachasEmLote(escolaSelecionada, atletasNestaMod, modalidade.nome)}
                                  className="text-xs font-bold text-[#087A5B] hover:bg-[#E8F7F1] px-2.5 py-1 rounded-lg border border-[#00A878]/30 flex items-center gap-1 transition-all"
                                  title="Baixar crachás deste esporte"
                                >
                                  <QrCode className="w-3 h-3" />
                                  <span>Crachás</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleImprimirLoteEscola(escolaSelecionada, modalidade.codigo)}
                                  className="text-xs font-bold text-[#4B5563] hover:text-[#17221D] hover:bg-gray-100 px-2.5 py-1 rounded-lg border border-[#E2EAE5] flex items-center gap-1 transition-all"
                                  title="Imprimir ficha deste esporte"
                                >
                                  <Printer className="w-3 h-3" />
                                  <span>Ficha</span>
                                </button>
                              </div>
                            </div>

                            {/* Grid Compacto dos Atletas */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
                              {atletasNestaMod.map((atleta) => (
                                <div
                                  key={atleta.id}
                                  className="p-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] flex items-center justify-between gap-2 hover:bg-white transition-all shadow-2xs"
                                >
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <p className="text-xs font-black text-[#17221D] truncate" title={atleta.nomeCompleto}>
                                        {atleta.nomeCompleto}
                                      </p>
                                      {atleta.conferidoPeloCoordenador && (
                                        <span title="Homologado">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[10px] text-[#64748B] mt-0.5 truncate">
                                      {atleta.categoriaCalculada} • {atleta.sexo === 'MASCULINO' ? 'Masc' : 'Fem'} • DOC: {atleta.documentoNumero}
                                    </p>
                                    {modalidade.codigo === 'atletismo' && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {atleta.modalidadesInscritas?.find(m => m.modalidadeCodigo === 'atletismo')?.provas?.map(p => (
                                          <span key={p} className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-200">
                                            {p}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    {onEditarAtleta && (
                                      <button
                                        type="button"
                                        onClick={() => onEditarAtleta(atleta, escolaSelecionada)}
                                        className="p-1 rounded-lg hover:bg-amber-100 text-amber-700 transition-colors"
                                        title="Editar atleta"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {onExcluirAtleta && (
                                      <button
                                        type="button"
                                        onClick={() => onExcluirAtleta(atleta, escolaSelecionada)}
                                        className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors"
                                        title="Excluir atleta"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleGerarCrachaIndividual(atleta, escolaSelecionada)}
                                      className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-700 transition-colors"
                                      title="Crachá Individual"
                                    >
                                      <QrCode className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => toggleConferenciaAtleta(atleta)}
                                      className={`p-1 rounded-lg transition-colors ${
                                        atleta.conferidoPeloCoordenador
                                          ? 'text-emerald-600 hover:bg-emerald-100'
                                          : 'text-gray-400 hover:text-gray-600'
                                      }`}
                                      title={atleta.conferidoPeloCoordenador ? 'Homologado' : 'Validar'}
                                    >
                                      {atleta.conferidoPeloCoordenador ? (
                                        <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                                      ) : (
                                        <Square className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  
                  /* VISUALIZAÇÃO EM TABELA GERAL OTIMIZADA */
                  <div className="overflow-x-auto border border-[#E2EAE5] rounded-xl">
                    <table className="w-full text-left text-xs text-[#17221D]">
                      <thead className="bg-[#F7F9F8] text-[#64748B] uppercase text-[10px] font-black border-b border-[#E2EAE5]">
                        <tr>
                          <th className="p-3 w-10">OK</th>
                          <th className="p-3">Aluno</th>
                          <th className="p-3">Categoria / Sexo</th>
                          <th className="p-3">Documento</th>
                          <th className="p-3">Modalidades Inscritas</th>
                          <th className="p-3 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2EAE5]">
                        {atletasFiltrados.map((atleta) => (
                          <tr key={atleta.id} className="hover:bg-[#F7F9F8]/70 transition-colors">
                            <td className="p-3">
                              <button
                                type="button"
                                onClick={() => toggleConferenciaAtleta(atleta)}
                                className="text-gray-400 hover:text-emerald-600"
                                title={atleta.conferidoPeloCoordenador ? 'Homologado' : 'Validar'}
                              >
                                {atleta.conferidoPeloCoordenador ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            </td>

                            <td className="p-3">
                              <p className="font-black text-[#17221D]">{atleta.nomeCompleto}</p>
                              <p className="text-[10px] text-[#64748B]">Nasc: {new Date(atleta.dataNascimento).toLocaleDateString('pt-BR')}</p>
                            </td>

                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-gray-100 font-bold text-[10px]">
                                {atleta.categoriaCalculada} • {atleta.sexo === 'MASCULINO' ? 'Masc' : 'Fem'}
                              </span>
                            </td>

                            <td className="p-3 text-[#17221D]">
                              <strong>{atleta.documentoTipo}:</strong> {atleta.documentoNumero}
                            </td>

                            <td className="p-3">
                              {atleta.modalidadesInscritas && atleta.modalidadesInscritas.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {atleta.modalidadesInscritas.map((m, idx) => (
                                    <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 text-[10px] border border-emerald-200 font-medium">
                                      {m.modalidadeNome} {m.provas && m.provas.length > 0 ? `(${m.provas.join(', ')})` : ''}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[#94A3B8] italic text-[10px]">Nenhuma</span>
                              )}
                            </td>

                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {onEditarAtleta && (
                                  <button
                                    type="button"
                                    onClick={() => onEditarAtleta(atleta, escolaSelecionada)}
                                    className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-700 transition-colors"
                                    title="Editar atleta"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {onExcluirAtleta && (
                                  <button
                                    type="button"
                                    onClick={() => onExcluirAtleta(atleta, escolaSelecionada)}
                                    className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                                    title="Excluir atleta"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleGerarCrachaIndividual(atleta, escolaSelecionada)}
                                  className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 transition-colors"
                                  title="Crachá Individual"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => abrirModalObsAtleta(atleta)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    atleta.observacaoCoordenador
                                      ? 'text-amber-700 bg-amber-50'
                                      : 'text-[#64748B] hover:text-[#17221D]'
                                  }`}
                                  title="Anotação da comissão"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-12 text-center text-xs text-[#64748B]">
              Selecione uma escola na lista ao lado para inspecionar e gerenciar suas inscrições.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
