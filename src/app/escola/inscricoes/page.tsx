'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Trophy,
  ArrowLeft,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Printer,
  Shield,
  Clock,
  Sparkles,
  Download,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { JegdPdfGenerator } from '@/lib/pdf-generator';
import {
  Escola,
  Atleta,
  ModalidadeConfig,
  InscricaoEquipe,
  CategoriaIdade,
  Genero,
  ModalidadeCodigo
} from '@/types/jegd';
import {
  JegdsRulesService,
  PROVAS_ATLETISMO_POR_CATEGORIA,
  MODALIDADES_JEGDS
} from '@/services/jegds-rules';

export default function EscolaInscricoesPage() {
  const router = useRouter();
  const [escola, setEscola] = useState<Escola | null>(null);
  const [modalidades, setModalidades] = useState<ModalidadeConfig[]>([]);
  const [todosAtletas, setTodosAtletas] = useState<Atleta[]>([]);
  const [inscricoes, setInscricoes] = useState<InscricaoEquipe[]>([]);

  // Wizard State
  const [modalidadeSelCodigo, setModalidadeSelCodigo] = useState<ModalidadeCodigo>('futsal');
  const [categoriaSel, setCategoriaSel] = useState<CategoriaIdade>('INFANTIL');
  const [sexoSel, setSexoSel] = useState<Genero>('MASCULINO');
  const [atletasSelecionadosIds, setAtletasSelecionadosIds] = useState<string[]>([]);
  const [provasPorAtleta, setProvasPorAtleta] = useState<Record<string, string[]>>({});
  const [gerandoPdfId, setGerandoPdfId] = useState<string | null>(null);

  useEffect(() => {
    JegdStorage.init();
    const atual = JegdStorage.getCurrentEscola();
    if (!atual) {
      router.push('/escola/login');
      return;
    }
    setEscola(atual);
    setTodosAtletas(JegdStorage.getAtletas(atual.id));
    setInscricoes(JegdStorage.getInscricoes(atual.id));
    const mods = JegdStorage.getModalidades();
    setModalidades(mods);
    if (mods.length > 0) {
      setModalidadeSelCodigo(mods[0].codigo);
    }
  }, []);

  const modalidadeAtual = modalidades.find(m => m.codigo === modalidadeSelCodigo);

  // Validação da Matriz
  const validacaoMatriz = JegdsRulesService.validarMatriz(modalidadeSelCodigo, categoriaSel, sexoSel);

  // Prazo e status
  const prazoExpirado = modalidadeAtual ? JegdsRulesService.isPrazoExpirado(modalidadeAtual.prazoInscricao) : false;

  // Atletas elegíveis para a categoria e sexo selecionados
  const atletasElegiveis = todosAtletas.filter(atleta => {
    const infoCat = JegdsRulesService.calcularCategoria(atleta.dataNascimento);
    const bateCat = infoCat.categoria === categoriaSel;
    const bateGen = atleta.sexo === sexoSel;
    return bateCat && bateGen;
  });

  const toggleAtleta = (id: string) => {
    if (!modalidadeAtual) return;
    if (atletasSelecionadosIds.includes(id)) {
      setAtletasSelecionadosIds(atletasSelecionadosIds.filter(i => i !== id));
      const newProvas = { ...provasPorAtleta };
      delete newProvas[id];
      setProvasPorAtleta(newProvas);
    } else {
      if (atletasSelecionadosIds.length >= modalidadeAtual.maxAtletas) {
        alert(`Limite máximo de ${modalidadeAtual.maxAtletas} atletas para ${modalidadeAtual.nome} atingido.`);
        return;
      }
      setAtletasSelecionadosIds([...atletasSelecionadosIds, id]);
    }
  };

  const toggleProvaAtleta = (atletaId: string, prova: string) => {
    const provasAtuais = provasPorAtleta[atletaId] || [];
    if (provasAtuais.includes(prova)) {
      setProvasPorAtleta({
        ...provasPorAtleta,
        [atletaId]: provasAtuais.filter(p => p !== prova)
      });
    } else {
      if (provasAtuais.length >= 2) {
        alert('No Atletismo cada atleta pode disputar no máximo 2 provas.');
        return;
      }
      setProvasPorAtleta({
        ...provasPorAtleta,
        [atletaId]: [...provasAtuais, prova]
      });
    }
  };

  const handleSubmeterInscricao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!escola || !modalidadeAtual) return;

    if (!validacaoMatriz.valido) {
      alert(`Erro: ${validacaoMatriz.erro}`);
      return;
    }

    if (prazoExpirado) {
      alert('O prazo de inscrição para esta modalidade já foi encerrado.');
      return;
    }

    if (atletasSelecionadosIds.length < modalidadeAtual.minAtletas) {
      alert(`A modalidade ${modalidadeAtual.nome} exige no mínimo ${modalidadeAtual.minAtletas} atleta(s).`);
      return;
    }

    // Se for Atletismo, validar se cada atleta selecionou entre 1 e 2 provas válidas
    if (modalidadeSelCodigo === 'atletismo') {
      for (const atlId of atletasSelecionadosIds) {
        const atletaObj = todosAtletas.find(a => a.id === atlId);
        const provasAtl = provasPorAtleta[atlId] || [];
        const valProvas = JegdsRulesService.validarProvasAtletismo(categoriaSel, provasAtl);
        if (!valProvas.valido) {
          alert(`Atleta ${atletaObj?.nomeCompleto}: ${valProvas.erro}`);
          return;
        }
      }
    }

    // Verificar se já existe inscrição da mesma modalidade + categoria + sexo
    const existente = inscricoes.find(
      i => i.modalidadeCodigo === modalidadeAtual.codigo && i.categoria === categoriaSel && i.sexo === sexoSel
    );

    const novaInscricao: InscricaoEquipe = {
      id: existente ? existente.id : `insc-${Date.now()}`,
      escolaId: escola.id,
      modalidadeCodigo: modalidadeAtual.codigo,
      modalidadeNome: modalidadeAtual.nome,
      categoria: categoriaSel,
      sexo: sexoSel,
      atletaIds: atletasSelecionadosIds,
      provasPorAtleta: modalidadeSelCodigo === 'atletismo' ? provasPorAtleta : undefined,
      comissaoIds: [],
      status: 'PENDENTE',
      dataInscricao: new Date().toLocaleString('pt-BR'),
      createdAt: existente ? existente.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    JegdStorage.saveInscricao(novaInscricao);
    setInscricoes(JegdStorage.getInscricoes(escola.id));

    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch {}

    alert(`Inscrição de ${modalidadeAtual.nome} (${categoriaSel} - ${sexoSel}) submetida com sucesso ao Comitê do JEGDS 2026!`);
    setAtletasSelecionadosIds([]);
    setProvasPorAtleta({});
  };

  const handleGerarPdf = async (insc: InscricaoEquipe) => {
    if (!escola) return;
    setGerandoPdfId(insc.id);
    try {
      const atletasEquipe = insc.atletaIds
        .map(id => JegdStorage.getAtletaById(id))
        .filter((a): a is Atleta => a !== undefined);

      await JegdPdfGenerator.gerarFichaInscricao(escola, insc, atletasEquipe, []);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar ficha PDF.');
    } finally {
      setGerandoPdfId(null);
    }
  };

  const handleGerarCrachasPdf = async (insc: InscricaoEquipe) => {
    if (!escola) return;
    setGerandoPdfId(insc.id);
    try {
      const atletasEquipe = insc.atletaIds
        .map(id => JegdStorage.getAtletaById(id))
        .filter((a): a is Atleta => a !== undefined);

      await JegdPdfGenerator.gerarCrachasEmLote(
        escola,
        atletasEquipe,
        insc.modalidadeNome,
        `${insc.categoria} (${insc.sexo})`
      );
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar crachás em PDF.');
    } finally {
      setGerandoPdfId(null);
    }
  };

  const handleExcluirInscricao = (id: string, nome: string) => {
    if (confirm(`Deseja remover a inscrição de ${nome}?`)) {
      JegdStorage.deleteInscricao(id);
      if (escola) setInscricoes(JegdStorage.getInscricoes(escola.id));
    }
  };

  if (!escola) return null;

  const provasPermitidasAtletismo = PROVAS_ATLETISMO_POR_CATEGORIA[categoriaSel] || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/escola/dashboard"
            className="p-2.5 rounded-xl bg-white border border-[#E2EAE5] text-[#68756E] hover:text-[#087A5B] hover:border-[#00A878] shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-[#17221D]">Inscrição de Equipes & Atletas</h1>
            <p className="text-xs text-[#68756E] mt-0.5">
              Escola: <strong className="text-[#17221D]">{escola.nome}</strong> ({escola.sigla}) • Gonçalves Dias - MA
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Formulário / Wizard */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-[#17221D] mb-1 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#00A878]" />
              <span>Montar Nova Inscrição de Equipe</span>
            </h2>
            <p className="text-xs text-[#68756E] mb-6">
              Selecione a modalidade, categoria e convoque os atletas elegíveis conforme a Matriz Oficial do JEGDS 2026.
            </p>

            <form onSubmit={handleSubmeterInscricao} className="space-y-6">
              
              {/* Seleção de Modalidade */}
              <div>
                <label className="block text-xs font-bold text-[#17221D] uppercase tracking-wider mb-2">
                  1. Selecione a Modalidade Esportiva (8 Oficiais)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {modalidades.map((mod) => {
                    const sel = modalidadeSelCodigo === mod.codigo;
                    return (
                      <button
                        type="button"
                        key={mod.id}
                        onClick={() => {
                          setModalidadeSelCodigo(mod.codigo);
                          setAtletasSelecionadosIds([]);
                          setProvasPorAtleta({});
                        }}
                        className={`p-3 rounded-2xl border text-left transition-all ${
                          sel
                            ? 'bg-[#E8F7F1] border-[#00A878] text-[#087A5B] font-bold shadow-sm'
                            : 'bg-[#F7F9F8] border-[#E2EAE5] text-[#68756E] hover:bg-white hover:border-[#00A878]/50'
                        }`}
                      >
                        <p className="text-xs font-bold truncate">{mod.nome}</p>
                        <p className="text-[10px] text-[#00A878] font-semibold mt-0.5">
                          Máx: {mod.maxAtletas}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Informação do Prazo da Modalidade Selecionada */}
              {modalidadeAtual && (
                <div className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[#68756E]">Data do Evento:</span>{' '}
                    <strong className="text-[#17221D]">{new Date(modalidadeAtual.dataEvento).toLocaleDateString('pt-BR')}</strong>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-700 font-semibold bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Prazo de Inscrição: {new Date(modalidadeAtual.prazoInscricao).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              )}

              {/* Seleção de Categoria e Sexo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#17221D] uppercase tracking-wider mb-2">
                    2. Categoria Etária (Ref: 31/12/2026)
                  </label>
                  <select
                    value={categoriaSel}
                    onChange={(e) => {
                      setCategoriaSel(e.target.value as CategoriaIdade);
                      setAtletasSelecionadosIds([]);
                      setProvasPorAtleta({});
                    }}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs font-semibold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
                  >
                    <option value="MIRIM">Mirim (9 a 11 anos: 2015-2017)</option>
                    <option value="INFANTIL">Infantil (12 a 14 anos: 2012-2014)</option>
                    <option value="INFANTO">Infanto (15 a 17 anos: 2009-2011)</option>
                    <option value="JUNIOR">Junior (18 a 20 anos: 2006-2008)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17221D] uppercase tracking-wider mb-2">
                    3. Gênero / Naipe
                  </label>
                  <select
                    value={sexoSel}
                    onChange={(e) => {
                      setSexoSel(e.target.value as Genero);
                      setAtletasSelecionadosIds([]);
                      setProvasPorAtleta({});
                    }}
                    className="w-full px-4 py-3 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs font-semibold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
                  >
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMININO">Feminino</option>
                  </select>
                </div>
              </div>

              {/* Alerta de Validação da Matriz */}
              {!validacaoMatriz.valido && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                  <div>
                    <strong className="font-bold">Combinação Bloqueada pelo Regulamento:</strong>
                    <p className="mt-0.5 leading-relaxed">{validacaoMatriz.erro}</p>
                  </div>
                </div>
              )}

              {/* Lista de Atletas Elegíveis */}
              {validacaoMatriz.valido && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-bold text-[#17221D] uppercase tracking-wider">
                      4. Seleção de Alunos-Atletas
                    </label>
                    {modalidadeAtual && (
                      <span className="text-xs font-bold text-[#087A5B] bg-[#E8F7F1] px-2.5 py-0.5 rounded-full border border-[#00A878]/30">
                        {atletasSelecionadosIds.length}/{modalidadeAtual.maxAtletas} inscritos (Mín: {modalidadeAtual.minAtletas})
                      </span>
                    )}
                  </div>

                  {atletasElegiveis.length === 0 ? (
                    <div className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl p-6 text-center">
                      <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-[#17221D]">
                        Nenhum atleta cadastrado na escola para a categoria {categoriaSel} ({sexoSel}).
                      </p>
                      <Link
                        href="/escola/atletas"
                        className="px-4 py-2 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-bold text-xs inline-flex items-center gap-1.5 mt-3 shadow-sm transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Cadastrar Novo Atleta</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {atletasElegiveis.map((atleta) => {
                        const selecionado = atletasSelecionadosIds.includes(atleta.id);
                        const provasDoAtleta = provasPorAtleta[atleta.id] || [];

                        return (
                          <div
                            key={atleta.id}
                            className={`p-3.5 rounded-2xl border transition-all ${
                              selecionado
                                ? 'bg-[#E8F7F1] border-[#00A878] shadow-sm'
                                : 'bg-[#F7F9F8] border-[#E2EAE5] text-[#17221D] hover:bg-white hover:border-[#00A878]/40'
                            }`}
                          >
                            <div
                              onClick={() => toggleAtleta(atleta.id)}
                              className="flex items-center justify-between cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                                  selecionado ? 'bg-[#00A878] border-[#00A878] text-white' : 'border-[#CBD5E1] bg-white'
                                }`}>
                                  {selecionado && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-[#17221D]">{atleta.nomeCompleto}</p>
                                  <p className="text-[10px] text-[#68756E]">
                                    Doc: {atleta.documentoTipo} {atleta.documentoNumero} • Nasc: {new Date(atleta.dataNascimento).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-[#087A5B] bg-white px-2 py-0.5 rounded-lg border border-[#E2EAE5]">
                                {atleta.matricula}
                              </span>
                            </div>

                            {/* Seletor de Provas para Atletismo */}
                            {selecionado && modalidadeSelCodigo === 'atletismo' && (
                              <div className="mt-3 pt-3 border-t border-[#00A878]/20 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-[#087A5B]">
                                    Selecione até 2 provas de Atletismo:
                                  </span>
                                  <span className="text-[10px] text-[#68756E]">
                                    {provasDoAtleta.length}/2 selecionadas
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {provasPermitidasAtletismo.map((prova) => {
                                    const provaAtiva = provasDoAtleta.includes(prova);
                                    return (
                                      <button
                                        type="button"
                                        key={prova}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleProvaAtleta(atleta.id, prova);
                                        }}
                                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                          provaAtiva
                                            ? 'bg-[#00A878] text-white shadow-sm'
                                            : 'bg-white text-[#68756E] border border-[#E2EAE5] hover:border-[#00A878]'
                                        }`}
                                      >
                                        {prova}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Botão de Envio */}
              <button
                type="submit"
                disabled={
                  !validacaoMatriz.valido ||
                  prazoExpirado ||
                  !modalidadeAtual ||
                  atletasSelecionadosIds.length < (modalidadeAtual?.minAtletas || 1)
                }
                className="w-full py-3.5 px-6 rounded-2xl bg-[#00A878] hover:bg-[#087A5B] text-white font-black text-sm shadow-md shadow-[#00A878]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                <span>Confirmar e Enviar Inscrição para o Comitê JEGDS</span>
              </button>

            </form>
          </div>
        </div>

        {/* Resumo das Inscrições Efetuadas */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-[#17221D]">Inscrições Realizadas ({inscricoes.length})</h3>

            {inscricoes.length === 0 ? (
              <p className="text-xs text-[#68756E] text-center py-8">
                Nenhuma equipe submetida ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {inscricoes.map((insc) => (
                  <div
                    key={insc.id}
                    className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-black text-[#17221D]">{insc.modalidadeNome}</h4>
                        <p className="text-xs text-[#68756E] mt-0.5">
                          {insc.categoria} • {insc.sexo}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        insc.status === 'VALIDADA'
                          ? 'bg-[#E8F7F1] text-[#087A5B] border-[#00A878]/30'
                          : insc.status === 'REJEITADA'
                          ? 'bg-red-50 text-red-600 border-red-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {insc.status}
                      </span>
                    </div>

                    <div className="text-xs text-[#68756E]">
                      <span><strong className="text-[#17221D]">{insc.atletaIds.length}</strong> Atletas convocados</span>
                      {insc.motivoRejeicao && (
                        <p className="text-red-600 mt-1 text-[11px]">
                          Motivo Rejeição: {insc.motivoRejeicao}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-[#E2EAE5]">
                      <button
                        type="button"
                        onClick={() => handleGerarPdf(insc)}
                        disabled={gerandoPdfId === insc.id}
                        className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-[#E8F7F1] text-[#17221D] hover:text-[#087A5B] border border-[#E2EAE5] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#00A878]" />
                        <span>Ficha PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleGerarCrachasPdf(insc)}
                        disabled={gerandoPdfId === insc.id}
                        className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-[#E8F7F1] text-[#17221D] hover:text-[#087A5B] border border-[#E2EAE5] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
                      >
                        <Download className="w-3.5 h-3.5 text-[#00A878]" />
                        <span>Crachás QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExcluirInscricao(insc.id, insc.modalidadeNome)}
                        className="p-2 rounded-xl bg-white hover:bg-red-50 text-[#68756E] hover:text-red-600 border border-[#E2EAE5] hover:border-red-200 transition-colors shadow-sm"
                        title="Remover"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
