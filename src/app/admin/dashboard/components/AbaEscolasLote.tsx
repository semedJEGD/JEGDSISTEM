'use client';

import React from 'react';
import {
  School,
  Trophy,
  Printer,
  Download,
  QrCode,
  CheckSquare,
  Square,
  MessageSquare
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
  toggleConferenciaAtleta: (atleta: Atleta) => void;
  abrirModalObsAtleta: (atleta: Atleta) => void;
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
  toggleConferenciaAtleta,
  abrirModalObsAtleta
}: AbaEscolasLoteProps) {
  return (
    <div className="space-y-6">
      
      {/* Painel Geral de Progresso por Escola */}
      <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <h3 className="text-lg font-black text-[#17221D] flex items-center gap-2">
          <School className="w-5 h-5 text-[#00A878]" />
          <span>Painel Geral de Progresso por Escola</span>
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {progressoEscolas.map((item) => (
            <div
              key={item.escola.id}
              onClick={() => setEscolaSelecionadaId(item.escola.id)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                escolaSelecionadaId === item.escola.id
                  ? 'bg-[#E8F7F1] border-[#00A878] shadow-sm'
                  : 'bg-[#F7F9F8] border-[#E2EAE5] hover:bg-white hover:border-[#00A878]/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-black text-[#17221D] truncate">
                  {item.escola.sigla} • {item.escola.nome}
                </span>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                  item.status === 'PREENCHIDO'
                    ? 'bg-[#E8F7F1] text-[#087A5B] border border-[#00A878]/30'
                    : item.status === 'EM_ANDAMENTO'
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {item.status === 'PREENCHIDO' ? 'PREENCHIDO' : item.status === 'EM_ANDAMENTO' ? 'EM ANDAMENTO' : 'SEM INSCRIÇÃO'}
                </span>
              </div>
              <div className="text-xs text-[#4B5563] space-y-1">
                <p>Alunos inscritos: <strong className="text-[#17221D]">{item.totalAtletas}</strong></p>
                <p>Conferidos: <strong className="text-[#087A5B]">{item.totalConferidos}/{item.totalAtletas}</strong></p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inspeção e Conferência do Lote da Escola Selecionada */}
      {escolaSelecionada && (
        <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-[#E2EAE5]">
            <div>
              <h3 className="text-xl font-black text-[#17221D] flex items-center gap-2">
                <span>Lote de Inscrições: {escolaSelecionada.nome} ({escolaSelecionada.sigla})</span>
              </h3>
              <p className="text-xs sm:text-sm text-[#4B5563] mt-1 font-medium">
                Responsável: {escolaSelecionada.responsavelNome} • Contato: {escolaSelecionada.responsavelTelefone} • INEP: {escolaSelecionada.inep}
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={() => handleGerarCrachasEscola(escolaSelecionada)}
                disabled={gerandoPdf || atletasDaEscolaSelecionada.length === 0}
                className="px-4 py-2.5 rounded-xl bg-[#F7F9F8] hover:bg-[#E8F7F1] border border-[#00A878]/30 text-[#087A5B] font-black text-xs sm:text-sm shadow-2xs flex items-center gap-2 transition-all disabled:opacity-50 shrink-0"
                title="Gerar todos os crachás padrão CR80 desta escola em PDF"
              >
                <QrCode className="w-4 h-4" />
                <span>Gerar Crachás (PDF)</span>
              </button>

              <button
                onClick={() => handleImprimirLoteEscola(escolaSelecionada)}
                disabled={gerandoPdf || atletasDaEscolaSelecionada.length === 0}
                className="px-5 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-black text-xs sm:text-sm shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 shrink-0"
                title="Imprimir relatório completo de todos os alunos e modalidades da escola"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Delegação Geral (PDF)</span>
              </button>

              {(filtroModalidadeLote !== 'TODAS' || filtroCategoriaLote !== 'TODAS' || filtroSexoLote !== 'TODOS') && (
                <button
                  onClick={() => handleImprimirLoteEscola(escolaSelecionada, filtroModalidadeLote, filtroCategoriaLote, filtroSexoLote)}
                  disabled={gerandoPdf}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm shadow-sm flex items-center gap-2 transition-all shrink-0"
                  title="Imprimir apenas o subconjunto filtrado"
                >
                  <Download className="w-4 h-4" />
                  <span>Imprimir Filtro Selecionado</span>
                </button>
              )}
            </div>
          </div>

          {/* BARRA DE FILTROS E ORGANIZAÇÃO DO LOTE */}
          <div className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl p-4 space-y-3">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#087A5B]">
                <Trophy className="w-4 h-4 text-[#00A878]" />
                <span>FILTRAR E ORGANIZAR DELEGAÇÃO:</span>
              </div>

              {/* Alternador de Modo de Visualização */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E2EAE5] shrink-0 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setModoVisualizacaoLote('CARDS')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    modoVisualizacaoLote === 'CARDS'
                      ? 'bg-[#00A878] text-white shadow-xs'
                      : 'text-[#4B5563] hover:text-[#17221D]'
                  }`}
                >
                  🗂️ Cards por Modalidade
                </button>
                <button
                  type="button"
                  onClick={() => setModoVisualizacaoLote('TABELA')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    modoVisualizacaoLote === 'TABELA'
                      ? 'bg-[#00A878] text-white shadow-xs'
                      : 'text-[#4B5563] hover:text-[#17221D]'
                  }`}
                >
                  📋 Tabela Geral
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Filtro Modalidade */}
              <div>
                <label className="block text-[10px] font-black uppercase text-[#4B5563] mb-1">Modalidade</label>
                <select
                  value={filtroModalidadeLote}
                  onChange={(e) => setFiltroModalidadeLote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2EAE5] text-xs font-bold text-[#17221D] focus:outline-none focus:border-[#00A878]"
                >
                  <option value="TODAS">Todas as Modalidades</option>
                  {modalidades.map(m => (
                    <option key={m.id} value={m.codigo}>{m.nome} ({m.tipo})</option>
                  ))}
                </select>
              </div>

              {/* Filtro Categoria / Faixa Etária */}
              <div>
                <label className="block text-[10px] font-black uppercase text-[#4B5563] mb-1">Faixa Etária / Categoria</label>
                <select
                  value={filtroCategoriaLote}
                  onChange={(e) => setFiltroCategoriaLote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2EAE5] text-xs font-bold text-[#17221D] focus:outline-none focus:border-[#00A878]"
                >
                  <option value="TODAS">Todas as Categorias</option>
                  <option value="MIRIM">Mirim (9 a 11 anos)</option>
                  <option value="INFANTIL">Infantil (12 a 14 anos)</option>
                  <option value="INFANTO">Infanto (15 a 17 anos)</option>
                  <option value="JUNIOR">Junior (18 a 20 anos)</option>
                </select>
              </div>

              {/* Filtro Naipe / Sexo */}
              <div>
                <label className="block text-[10px] font-black uppercase text-[#4B5563] mb-1">Naipe / Sexo</label>
                <select
                  value={filtroSexoLote}
                  onChange={(e) => setFiltroSexoLote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2EAE5] text-xs font-bold text-[#17221D] focus:outline-none focus:border-[#00A878]"
                >
                  <option value="TODOS">Todos os Naipes</option>
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMININO">Feminino</option>
                </select>
              </div>
            </div>
          </div>

          {atletasDaEscolaSelecionada.length === 0 ? (
            <div className="py-12 text-center text-[#4B5563] text-sm bg-[#F7F9F8] rounded-2xl border border-dashed border-[#E2EAE5]">
              <School className="w-8 h-8 text-[#A0AEC0] mx-auto mb-2 opacity-60" />
              <p className="font-bold">Esta escola ainda não cadastrou nenhum atleta no sistema.</p>
              <p className="text-xs text-[#68756E] mt-1">Os atletas cadastrados pelos professores aparecerão organizados aqui por modalidade.</p>
            </div>
          ) : modoVisualizacaoLote === 'CARDS' ? (
            /* VISUALIZAÇÃO EM CARDS POR MODALIDADE */
            <div className="space-y-6">
              {modalidades
                .filter(m => filtroModalidadeLote === 'TODAS' || m.codigo === filtroModalidadeLote || m.id === filtroModalidadeLote)
                .map((modalidade) => {
                  const atletasNestaModalidade = atletasDaEscolaSelecionada.filter(a => 
                    a.modalidadesInscritas?.some(mod => mod.modalidadeCodigo === modalidade.codigo || mod.modalidadeNome.toLowerCase().includes(modalidade.nome.toLowerCase()))
                  ).filter(a => {
                    if (filtroCategoriaLote !== 'TODAS' && a.categoriaCalculada !== filtroCategoriaLote) return false;
                    if (filtroSexoLote !== 'TODOS' && a.sexo !== filtroSexoLote) return false;
                    return true;
                  });

                  if (atletasNestaModalidade.length === 0) return null;

                  const gruposMap: Record<string, Atleta[]> = {};
                  atletasNestaModalidade.forEach(a => {
                    const cat = a.categoriaCalculada || 'N/A';
                    const sex = a.sexo === 'MASCULINO' ? 'Masculino' : 'Feminino';
                    const chave = `${cat} • ${sex}`;
                    if (!gruposMap[chave]) gruposMap[chave] = [];
                    gruposMap[chave].push(a);
                  });

                  return (
                    <div
                      key={modalidade.id}
                      className="bg-white border-2 border-[#E2EAE5] hover:border-[#00A878]/50 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm transition-all"
                    >
                      {/* Topo do Card da Modalidade */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#E2EAE5]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#E8F7F1] border border-[#00A878]/30 text-[#00A878] flex items-center justify-center font-black">
                            <Trophy className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base sm:text-lg font-black text-[#17221D]">{modalidade.nome}</h4>
                              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#EDF7F2] text-[#087A5B] border border-[#00A878]/20 uppercase">
                                {modalidade.tipo}
                              </span>
                              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                {atletasNestaModalidade.length} {atletasNestaModalidade.length === 1 ? 'Atleta' : 'Atletas'}
                              </span>
                            </div>
                            <p className="text-xs text-[#4B5563] mt-0.5">{modalidade.descricao}</p>
                          </div>
                        </div>

                        {/* Botões Imprimir Modalidade e Crachás da Modalidade */}
                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                          <button
                            onClick={() => JegdPdfGenerator.gerarCrachasEmLote(escolaSelecionada, atletasNestaModalidade, modalidade.nome)}
                            className="px-3.5 py-2 rounded-xl bg-[#E8F7F1] hover:bg-[#00A878] text-[#087A5B] hover:text-white border border-[#00A878]/30 font-black text-xs flex items-center gap-1.5 transition-all shadow-2xs"
                            title={`Gerar crachás dobráveis de todos os atletas de ${modalidade.nome}`}
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Crachás {modalidade.nome} (PDF)</span>
                          </button>

                          <button
                            onClick={() => handleImprimirLoteEscola(escolaSelecionada, modalidade.codigo)}
                            className="px-3.5 py-2 rounded-xl bg-[#F7F9F8] hover:bg-[#E8F7F1] text-[#17221D] border border-[#E2EAE5] font-bold text-xs flex items-center gap-1.5 transition-all shadow-2xs"
                            title={`Imprimir ficha oficial e delegação de ${modalidade.nome}`}
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Ficha Geral {modalidade.nome}</span>
                          </button>
                        </div>
                      </div>

                      {/* Subgrupos por Categoria e Naipe */}
                      <div className="space-y-4 pt-1">
                        {Object.entries(gruposMap).map(([grupoNome, atletasDoGrupo]) => (
                          <div
                            key={grupoNome}
                            className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl p-4 space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#00A878]" />
                                <h5 className="text-xs sm:text-sm font-black text-[#17221D]">
                                  {grupoNome}
                                </h5>
                                <span className="text-[10px] font-bold text-[#4B5563] bg-white px-2 py-0.5 rounded border border-[#E2EAE5]">
                                  {atletasDoGrupo.length} {atletasDoGrupo.length === 1 ? 'estudante' : 'estudantes'}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  onClick={() => {
                                    const [catStr] = grupoNome.split(' • ');
                                    JegdPdfGenerator.gerarCrachasEmLote(escolaSelecionada, atletasDoGrupo, modalidade.nome, catStr);
                                  }}
                                  className="text-xs font-black text-[#087A5B] hover:text-white hover:bg-[#00A878] flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-[#00A878]/30 transition-all shadow-2xs"
                                  title={`Imprimir crachás dobráveis de ${grupoNome}`}
                                >
                                  <QrCode className="w-3 h-3" />
                                  <span>Crachás desta Categoria</span>
                                </button>

                                <button
                                  onClick={() => {
                                    const [catStr, sexStr] = grupoNome.split(' • ');
                                    const sexFormatado = sexStr === 'Masculino' ? 'MASCULINO' : 'FEMININO';
                                    handleImprimirLoteEscola(escolaSelecionada, modalidade.codigo, catStr, sexFormatado);
                                  }}
                                  className="text-xs font-bold text-[#4B5563] hover:text-[#17221D] flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-[#E2EAE5] hover:border-[#00A878]/30 transition-all shadow-2xs"
                                >
                                  <Printer className="w-3 h-3" />
                                  <span>Ficha desta Equipe</span>
                                </button>
                              </div>
                            </div>

                            {/* Grade de Atletas do Subgrupo */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                              {atletasDoGrupo.map((atleta) => (
                                <div
                                  key={atleta.id}
                                  className="bg-white border border-[#E2EAE5] rounded-xl p-3 flex items-start justify-between gap-2 shadow-2xs"
                                >
                                  <div className="min-w-0">
                                    <p className="text-xs font-black text-[#17221D] truncate" title={atleta.nomeCompleto}>
                                      {atleta.nomeCompleto}
                                    </p>
                                    <p className="text-[10px] text-[#4B5563] mt-0.5">
                                      Nasc: {new Date(atleta.dataNascimento).toLocaleDateString('pt-BR')} • {atleta.documentoTipo}: {atleta.documentoNumero}
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
                                    <button
                                      onClick={() => handleGerarCrachaIndividual(atleta, escolaSelecionada)}
                                      className="p-1.5 rounded-lg bg-[#F7F9F8] hover:bg-[#E8F7F1] text-[#087A5B] border border-[#00A878]/30 transition-all"
                                      title="Imprimir Crachá Individual deste atleta (PDF)"
                                    >
                                      <Printer className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                      onClick={() => toggleConferenciaAtleta(atleta)}
                                      className={`p-1.5 rounded-lg flex items-center gap-1 font-bold text-[10px] transition-all ${
                                        atleta.conferidoPeloCoordenador
                                          ? 'bg-[#E8F7F1] text-[#087A5B] border border-[#00A878]/30'
                                          : 'bg-[#F7F9F8] text-[#4B5563] border border-[#E2EAE5]'
                                      }`}
                                      title={atleta.conferidoPeloCoordenador ? 'Homologado pela SEMED' : 'Pendente de validação'}
                                    >
                                      {atleta.conferidoPeloCoordenador ? (
                                        <>
                                          <CheckSquare className="w-3.5 h-3.5 text-[#00A878]" />
                                          <span className="hidden sm:inline">OK</span>
                                        </>
                                      ) : (
                                        <>
                                          <Square className="w-3.5 h-3.5" />
                                          <span className="hidden sm:inline">Validar</span>
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            /* VISUALIZAÇÃO EM TABELA GERAL */
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-[#17221D]">
                  <thead className="bg-[#F7F9F8] text-[#4B5563] uppercase text-xs font-bold border-b border-[#E2EAE5]">
                    <tr>
                      <th className="p-3.5">Conferência</th>
                      <th className="p-3.5">Aluno</th>
                      <th className="p-3.5">Data Nasc.</th>
                      <th className="p-3.5">Categoria/Sexo</th>
                      <th className="p-3.5">Documento</th>
                      <th className="p-3.5">Modalidades / Provas</th>
                      <th className="p-3.5">Cadastrado Por</th>
                      <th className="p-3.5 text-right">Observações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2EAE5]">
                    {atletasDaEscolaSelecionada
                      .filter(a => {
                        if (filtroModalidadeLote !== 'TODAS' && !a.modalidadesInscritas?.some(m => m.modalidadeCodigo === filtroModalidadeLote || m.modalidadeNome.toLowerCase().includes(filtroModalidadeLote.toLowerCase()))) return false;
                        if (filtroCategoriaLote !== 'TODAS' && a.categoriaCalculada !== filtroCategoriaLote) return false;
                        if (filtroSexoLote !== 'TODOS' && a.sexo !== filtroSexoLote) return false;
                        return true;
                      })
                      .map((atleta) => (
                      <tr key={atleta.id} className="hover:bg-[#F7F9F8]">
                        <td className="p-3.5">
                          <button
                            onClick={() => toggleConferenciaAtleta(atleta)}
                            className={`p-2 rounded-xl flex items-center gap-1.5 font-bold text-xs transition-all ${
                              atleta.conferidoPeloCoordenador
                                ? 'bg-[#E8F7F1] text-[#087A5B] border border-[#00A878]/30'
                                : 'bg-white text-[#4B5563] border border-[#E2EAE5]'
                            }`}
                          >
                            {atleta.conferidoPeloCoordenador ? (
                              <>
                                <CheckSquare className="w-4 h-4 text-[#00A878]" />
                                <span>Correto</span>
                              </>
                            ) : (
                              <>
                                <Square className="w-4 h-4" />
                                <span>Pendente</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td className="p-3.5 font-bold text-[#17221D]">
                          {atleta.nomeCompleto}
                        </td>

                        <td className="p-3.5 text-[#4B5563]">
                          {new Date(atleta.dataNascimento).toLocaleDateString('pt-BR')}
                        </td>

                        <td className="p-3.5">
                          <span className="px-2.5 py-0.5 rounded-md bg-[#F7F9F8] border border-[#E2EAE5] font-bold text-xs text-[#17221D]">
                            {atleta.categoriaCalculada || 'N/A'} ({atleta.sexo === 'MASCULINO' ? 'Masc' : 'Fem'})
                          </span>
                        </td>

                        <td className="p-3.5 text-[#17221D]">
                          <strong>{atleta.documentoTipo}:</strong> {atleta.documentoNumero}
                        </td>

                        <td className="p-3.5">
                          {atleta.modalidadesInscritas && atleta.modalidadesInscritas.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {atleta.modalidadesInscritas.map((m, idx) => (
                                <span key={idx} className="px-2.5 py-0.5 rounded-md bg-[#E8F7F1] text-[#087A5B] text-xs border border-[#00A878]/20 font-medium">
                                  {m.modalidadeNome} {m.provas && m.provas.length > 0 ? `(${m.provas.join(', ')})` : ''}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[#4B5563] italic text-xs">Nenhuma</span>
                          )}
                        </td>

                        <td className="p-3.5 text-[#4B5563] text-xs">
                          {atleta.cadastradoPor || escolaSelecionada.responsavelNome}
                        </td>

                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => abrirModalObsAtleta(atleta)}
                            className={`p-2 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-all ${
                              atleta.observacaoCoordenador
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-white text-[#4B5563] border-[#E2EAE5] hover:border-[#00A878]'
                            }`}
                            title="Inserir observação"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>{atleta.observacaoCoordenador ? 'Ver Nota' : 'Anotar'}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
