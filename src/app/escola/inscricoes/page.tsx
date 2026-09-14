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
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">Inscrição de Equipes & Atletas</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Escola: <strong>{escola.nome}</strong> ({escola.sigla}) • Gonçalves Dias - MA
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Formulário / Wizard */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-400" />
              <span>Montar Nova Inscrição de Equipe</span>
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Selecione a modalidade, categoria e convoque os atletas elegíveis conforme a Matriz Oficial do JEGDS 2026.
            </p>

            <form onSubmit={handleSubmeterInscricao} className="space-y-6">
              
              {/* Seleção de Modalidade */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
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
                        className={`p-3 rounded-xl border text-left transition-all ${
                          sel
                            ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold shadow-md'
                            : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <p className="text-xs font-bold truncate">{mod.nome}</p>
                        <p className="text-[10px] text-emerald-400 mt-0.5">
                          Máx: {mod.maxAtletas}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Informação do Prazo da Modalidade Selecionada */}
              {modalidadeAtual && (
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Data do Evento:</span>{' '}
                    <strong className="text-white">{new Date(modalidadeAtual.dataEvento).toLocaleDateString('pt-BR')}</strong>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-300 font-semibold bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/20">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Prazo de Inscrição: {new Date(modalidadeAtual.prazoInscricao).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              )}

              {/* Seleção de Categoria e Sexo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    2. Categoria Etária (Ref: 31/12/2026)
                  </label>
                  <select
                    value={categoriaSel}
                    onChange={(e) => {
                      setCategoriaSel(e.target.value as CategoriaIdade);
                      setAtletasSelecionadosIds([]);
                      setProvasPorAtleta({});
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:border-emerald-500"
                  >
                    <option value="MIRIM">Mirim (9 a 11 anos: 2015-2017)</option>
                    <option value="INFANTIL">Infantil (12 a 14 anos: 2012-2014)</option>
                    <option value="INFANTO">Infanto (15 a 17 anos: 2009-2011)</option>
                    <option value="JUNIOR">Junior (18 a 20 anos: 2006-2008)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    3. Gênero / Naipe
                  </label>
                  <select
                    value={sexoSel}
                    onChange={(e) => {
                      setSexoSel(e.target.value as Genero);
                      setAtletasSelecionadosIds([]);
                      setProvasPorAtleta({});
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:border-emerald-500"
                  >
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMININO">Feminino</option>
                  </select>
                </div>
              </div>

              {/* Alerta de Validação da Matriz */}
              {!validacaoMatriz.valido && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
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
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      4. Seleção de Alunos-Atletas
                    </label>
                    {modalidadeAtual && (
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        {atletasSelecionadosIds.length}/{modalidadeAtual.maxAtletas} inscritos (Mín: {modalidadeAtual.minAtletas})
                      </span>
                    )}
                  </div>

                  {atletasElegiveis.length === 0 ? (
                    <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 text-center">
                      <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-200">
                        Nenhum atleta cadastrado na escola para a categoria {categoriaSel} ({sexoSel}).
                      </p>
                      <Link
                        href="/escola/atletas"
                        className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 mt-3"
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
                            className={`p-3 rounded-2xl border transition-all ${
                              selecionado
                                ? 'bg-emerald-500/15 border-emerald-500 text-white'
                                : 'bg-slate-800/70 border-slate-700/80 text-slate-300'
                            }`}
                          >
                            <div
                              onClick={() => toggleAtleta(atleta.id)}
                              className="flex items-center justify-between cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                                  selecionado ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-600 bg-slate-900'
                                }`}>
                                  {selecionado && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                                </div>
                                <div>
                                  <p className="text-xs font-bold">{atleta.nomeCompleto}</p>
                                  <p className="text-[10px] text-slate-400">
                                    Doc: {atleta.documentoTipo} {atleta.documentoNumero} • Nasc: {new Date(atleta.dataNascimento).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] font-semibold text-emerald-400">
                                {atleta.matricula}
                              </span>
                            </div>

                            {/* Seletor de Provas para Atletismo */}
                            {selecionado && modalidadeSelCodigo === 'atletismo' && (
                              <div className="mt-3 pt-3 border-t border-slate-700/70 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-bold text-amber-300">
                                    Selecione até 2 provas de Atletismo:
                                  </span>
                                  <span className="text-[10px] text-slate-400">
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
                                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                                            : 'bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
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
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                <span>Confirmar e Enviar Inscrição para o Comitê JEGDS</span>
              </button>

            </form>
          </div>
        </div>

        {/* Resumo das Inscrições Efetuadas */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">Inscrições Realizadas ({inscricoes.length})</h3>

            {inscricoes.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">
                Nenhuma equipe submetida ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {inscricoes.map((insc) => (
                  <div
                    key={insc.id}
                    className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-black text-white">{insc.modalidadeNome}</h4>
                        <p className="text-xs text-slate-300 mt-0.5">
                          {insc.categoria} • {insc.sexo}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        insc.status === 'VALIDADA'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : insc.status === 'REJEITADA'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {insc.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400">
                      <span><strong>{insc.atletaIds.length}</strong> Atletas convocados</span>
                      {insc.motivoRejeicao && (
                        <p className="text-red-400 mt-1 text-[11px]">
                          Motivo Rejeição: {insc.motivoRejeicao}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => handleGerarPdf(insc)}
                        disabled={gerandoPdfId === insc.id}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Ficha PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleGerarCrachasPdf(insc)}
                        disabled={gerandoPdfId === insc.id}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5 text-teal-400" />
                        <span>Crachás QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleExcluirInscricao(insc.id, insc.modalidadeNome)}
                        className="p-2 rounded-xl bg-slate-700 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
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
