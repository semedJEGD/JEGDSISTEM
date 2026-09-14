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
  Download
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { JegdPdfGenerator } from '@/lib/pdf-generator';
import {
  Escola,
  Atleta,
  MembroComissao,
  ModalidadeConfig,
  InscricaoEquipe,
  CategoriaIdade,
  Genero
} from '@/types/jegd';

export default function EscolaInscricoesPage() {
  const router = useRouter();
  const [escola, setEscola] = useState<Escola | null>(null);
  const [modalidades, setModalidades] = useState<ModalidadeConfig[]>([]);
  const [todosAtletas, setTodosAtletas] = useState<Atleta[]>([]);
  const [comissao, setComissao] = useState<MembroComissao[]>([]);
  const [inscricoes, setInscricoes] = useState<InscricaoEquipe[]>([]);

  // Wizard State
  const [modalidadeSelId, setModalidadeSelId] = useState('');
  const [categoriaSel, setCategoriaSel] = useState<CategoriaIdade>('INFANTIL');
  const [generoSel, setGeneroSel] = useState<Genero>('MASCULINO');
  const [atletasSelecionadosIds, setAtletasSelecionadosIds] = useState<string[]>([]);
  const [comissaoSelecionadosIds, setComissaoSelecionadosIds] = useState<string[]>([]);
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
    setComissao(JegdStorage.getComissao(atual.id));
    setInscricoes(JegdStorage.getInscricoes(atual.id));
    const mods = JegdStorage.getModalidades();
    setModalidades(mods);
    if (mods.length > 0) {
      setModalidadeSelId(mods[0].id);
    }
  }, []);

  const modalidadeAtual = modalidades.find(m => m.id === modalidadeSelId);

  // Atletas elegíveis para a modalidade, categoria e gênero selecionados
  const atletasElegiveis = todosAtletas.filter(atleta => {
    const infoCat = JegdStorage.calcularCategoria(atleta.dataNascimento);
    const bateCat = infoCat.categoria === categoriaSel;
    const bateGen = generoSel === 'MISTO' ? true : atleta.genero === generoSel;
    return bateCat && bateGen;
  });

  const toggleAtleta = (id: string) => {
    if (!modalidadeAtual) return;
    if (atletasSelecionadosIds.includes(id)) {
      setAtletasSelecionadosIds(atletasSelecionadosIds.filter(i => i !== id));
    } else {
      if (atletasSelecionadosIds.length >= modalidadeAtual.maxAtletas) {
        alert(`Limite máximo de ${modalidadeAtual.maxAtletas} atletas para ${modalidadeAtual.nome} atingido.`);
        return;
      }
      setAtletasSelecionadosIds([...atletasSelecionadosIds, id]);
    }
  };

  const toggleComissao = (id: string) => {
    if (!modalidadeAtual) return;
    if (comissaoSelecionadosIds.includes(id)) {
      setComissaoSelecionadosIds(comissaoSelecionadosIds.filter(i => i !== id));
    } else {
      if (comissaoSelecionadosIds.length >= modalidadeAtual.maxComissao) {
        alert(`Limite máximo de ${modalidadeAtual.maxComissao} membros de comissão atingido.`);
        return;
      }
      setComissaoSelecionadosIds([...comissaoSelecionadosIds, id]);
    }
  };

  const handleSubmeterInscricao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!escola || !modalidadeAtual) return;

    if (atletasSelecionadosIds.length < modalidadeAtual.minAtletas) {
      alert(`Atenção: É necessário selecionar no mínimo ${modalidadeAtual.minAtletas} atleta(s) para ${modalidadeAtual.nome}.`);
      return;
    }

    // Verifica se já existe inscrição dessa modalidade + categoria + genero
    const existente = inscricoes.find(
      i => i.modalidadeId === modalidadeAtual.id && i.categoria === categoriaSel && i.genero === generoSel
    );

    const novaInscricao: InscricaoEquipe = {
      id: existente ? existente.id : `insc-${Date.now()}`,
      escolaId: escola.id,
      modalidadeId: modalidadeAtual.id,
      modalidadeNome: modalidadeAtual.nome,
      categoria: categoriaSel,
      genero: generoSel,
      atletaIds: atletasSelecionadosIds,
      comissaoIds: comissaoSelecionadosIds,
      status: 'ENVIADA',
      dataEnvio: new Date().toLocaleString('pt-BR'),
      createdAt: existente ? existente.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    JegdStorage.saveInscricao(novaInscricao);
    setInscricoes(JegdStorage.getInscricoes(escola.id));

    // Efeito de confetes
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}

    alert(`Inscrição de ${modalidadeAtual.nome} (${categoriaSel} - ${generoSel}) enviada com sucesso para a SEMED!`);
    // Limpar seleção
    setAtletasSelecionadosIds([]);
    setComissaoSelecionadosIds([]);
  };

  const handleGerarPdf = async (insc: InscricaoEquipe) => {
    if (!escola) return;
    setGerandoPdfId(insc.id);
    try {
      const atletasEquipe = insc.atletaIds
        .map(id => JegdStorage.getAtletaById(id))
        .filter((a): a is Atleta => a !== undefined);

      const comissaoEquipe = insc.comissaoIds
        .map(id => JegdStorage.getComissao().find(c => c.id === id))
        .filter((c): c is MembroComissao => c !== undefined);

      await JegdPdfGenerator.gerarFichaInscricao(escola, insc, atletasEquipe, comissaoEquipe);
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
        `${insc.categoria} (${insc.genero})`
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
      if (escola) {
        setInscricoes(JegdStorage.getInscricoes(escola.id));
      }
    }
  };

  if (!escola) return null;

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
            <h1 className="text-2xl font-black text-white">Inscrição de Equipes & Modalidades</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Delegação: <strong>{escola.nome}</strong> ({escola.sigla})
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Formulário / Wizard de Montagem de Equipe */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-400" />
              <span>Montar Nova Equipe / Inscrição</span>
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Selecione o esporte, faixa etária e convoque os atletas cadastrados aptos para a disputa.
            </p>

            <form onSubmit={handleSubmeterInscricao} className="space-y-6">
              
              {/* Seleção de Modalidade */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  1. Selecione a Modalidade Esportiva
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {modalidades.map((mod) => (
                    <button
                      type="button"
                      key={mod.id}
                      onClick={() => {
                        setModalidadeSelId(mod.id);
                        setAtletasSelecionadosIds([]);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        modalidadeSelId === mod.id
                          ? 'bg-emerald-500/20 border-emerald-500 text-white font-bold shadow-md shadow-emerald-500/10'
                          : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs">{mod.nome}</span>
                        <span className="text-[10px] text-slate-400">{mod.tipo.slice(0, 3)}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 block">
                        {mod.minAtletas} a {mod.maxAtletas} atletas
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Seleção de Categoria e Gênero */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    2. Categoria (Idade)
                  </label>
                  <select
                    value={categoriaSel}
                    onChange={(e) => {
                      setCategoriaSel(e.target.value as CategoriaIdade);
                      setAtletasSelecionadosIds([]);
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:border-emerald-500"
                  >
                    <option value="INFANTIL">Infantil (12 a 14 anos)</option>
                    <option value="INFANTO">Infanto (15 a 17 anos)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    3. Gênero / Naipe
                  </label>
                  <select
                    value={generoSel}
                    onChange={(e) => {
                      setGeneroSel(e.target.value as Genero);
                      setAtletasSelecionadosIds([]);
                    }}
                    className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:border-emerald-500"
                  >
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMININO">Feminino</option>
                    <option value="MISTO">Misto (quando aplicável)</option>
                  </select>
                </div>
              </div>

              {/* Lista de Atletas Elegíveis para Seleção */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    4. Convocação dos Alunos-Atletas
                  </label>
                  {modalidadeAtual && (
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {atletasSelecionadosIds.length} / {modalidadeAtual.maxAtletas} (Mín: {modalidadeAtual.minAtletas})
                    </span>
                  )}
                </div>

                {atletasElegiveis.length === 0 ? (
                  <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-6 text-center">
                    <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-200">
                      Nenhum atleta elegível para {categoriaSel} ({generoSel}).
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 mb-3">
                      Cadastre novos alunos dessa faixa etária no banco de atletas.
                    </p>
                    <Link
                      href="/escola/atletas"
                      className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Cadastrar Aluno Agora</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {atletasElegiveis.map((atleta) => {
                      const selecionado = atletasSelecionadosIds.includes(atleta.id);
                      return (
                        <div
                          key={atleta.id}
                          onClick={() => toggleAtleta(atleta.id)}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            selecionado
                              ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-sm'
                              : 'bg-slate-800/70 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                              selecionado
                                ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                : 'border-slate-600 bg-slate-900'
                            }`}>
                              {selecionado && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                            </div>
                            <div>
                              <p className="text-xs font-bold">{atleta.nomeCompleto}</p>
                              <p className="text-[10px] text-slate-400">
                                Matrícula: {atleta.matricula} • Turma: {atleta.serieTurma} • Nasc: {new Date(atleta.dataNascimento).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {atleta.cpf ? 'CPF OK' : 'RG'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Seleção de Comissão Técnica */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  5. Professor / Técnico Responsável pela Equipe
                </label>
                {comissao.length === 0 ? (
                  <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-400 flex items-center justify-between">
                    <span>Nenhum professor/técnico cadastrado na escola.</span>
                    <Link href="/escola/comissao" className="text-emerald-400 font-bold hover:underline">
                      Cadastrar Professor
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {comissao.map((membro) => {
                      const selecionado = comissaoSelecionadosIds.includes(membro.id);
                      return (
                        <div
                          key={membro.id}
                          onClick={() => toggleComissao(membro.id)}
                          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                            selecionado
                              ? 'bg-teal-500/20 border-teal-500 text-white'
                              : 'bg-slate-800/70 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                              selecionado
                                ? 'bg-teal-500 border-teal-400 text-slate-950'
                                : 'border-slate-600 bg-slate-900'
                            }`}>
                              {selecionado && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                            </div>
                            <div>
                              <p className="text-xs font-bold">{membro.nomeCompleto}</p>
                              <p className="text-[10px] text-slate-400">
                                {membro.funcao} • {membro.registroProfissional || 'CREF'} • Tel: {membro.telefone}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Botão de Envio */}
              <button
                type="submit"
                disabled={!modalidadeAtual || atletasSelecionadosIds.length < (modalidadeAtual?.minAtletas || 1)}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                <span>Confirmar e Enviar Inscrição para SEMED</span>
              </button>

            </form>
          </div>
        </div>

        {/* Resumo das Inscrições Já Efetuadas */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Equipes Submetidas ({inscricoes.length})</h3>
            </div>

            {inscricoes.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">
                Nenhuma inscrição registrada ainda.
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
                          {insc.categoria} • {insc.genero}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        insc.status === 'DEFERIDA'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                      }`}>
                        {insc.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400">
                      <span><strong>{insc.atletaIds.length}</strong> Atletas convocados</span>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60">
                      <button
                        type="button"
                        onClick={() => handleGerarPdf(insc)}
                        disabled={gerandoPdfId === insc.id}
                        className="flex-1 py-2 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                      >
                        <Printer className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{gerandoPdfId === insc.id ? 'Gerando...' : 'Ficha PDF'}</span>
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
                        title="Remover Inscrição"
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
