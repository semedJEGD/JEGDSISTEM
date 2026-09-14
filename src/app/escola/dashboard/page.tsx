'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  School,
  Users,
  Trophy,
  FileText,
  UserPlus,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck2,
  Printer,
  ShieldAlert,
  Download
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { JegdPdfGenerator } from '@/lib/pdf-generator';
import { Escola, Atleta, MembroComissao, InscricaoEquipe } from '@/types/jegd';

export default function EscolaDashboardPage() {
  const router = useRouter();
  const [escola, setEscola] = useState<Escola | null>(null);
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [comissao, setComissao] = useState<MembroComissao[]>([]);
  const [inscricoes, setInscricoes] = useState<InscricaoEquipe[]>([]);
  const [gerandoPdfId, setGerandoPdfId] = useState<string | null>(null);

  useEffect(() => {
    JegdStorage.init();
    const atual = JegdStorage.getCurrentEscola();
    if (!atual) {
      router.push('/escola/login');
      return;
    }
    setEscola(atual);
    carregarDados(atual.id);
  }, []);

  const carregarDados = (escolaId: string) => {
    setAtletas(JegdStorage.getAtletas(escolaId));
    setComissao(JegdStorage.getComissao(escolaId));
    setInscricoes(JegdStorage.getInscricoes(escolaId));
  };

  const handleGerarFichaPdf = async (inscricao: InscricaoEquipe) => {
    if (!escola) return;
    setGerandoPdfId(inscricao.id);
    try {
      const atletasEquipe = inscricao.atletaIds
        .map(id => JegdStorage.getAtletaById(id))
        .filter((a): a is Atleta => a !== undefined);

      const comissaoEquipe = inscricao.comissaoIds
        .map(id => JegdStorage.getComissao().find(c => c.id === id))
        .filter((c): c is MembroComissao => c !== undefined);

      await JegdPdfGenerator.gerarFichaInscricao(escola, inscricao, atletasEquipe, comissaoEquipe);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar ficha em PDF.');
    } finally {
      setGerandoPdfId(null);
    }
  };

  const handleGerarCrachasPdf = async (inscricao: InscricaoEquipe) => {
    if (!escola) return;
    setGerandoPdfId(inscricao.id);
    try {
      const atletasEquipe = inscricao.atletaIds
        .map(id => JegdStorage.getAtletaById(id))
        .filter((a): a is Atleta => a !== undefined);

      await JegdPdfGenerator.gerarCrachasEmLote(
        escola,
        atletasEquipe,
        inscricao.modalidadeNome,
        `${inscricao.categoria} (${inscricao.sexo})`
      );
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar crachás em PDF.');
    } finally {
      setGerandoPdfId(null);
    }
  };

  if (!escola) return null;

  const totalValidadas = inscricoes.filter(i => i.status === 'VALIDADA').length;
  const totalPendentes = inscricoes.filter(i => i.status === 'PENDENTE').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Cabeçalho de Boas-Vindas da Escola */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-emerald-500/20">
              {escola.sigla.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{escola.nome}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-emerald-400 font-bold">
                  Rede {escola.rede}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                INEP: <strong>{escola.inep}</strong> • Bairro: <strong>{escola.bairro}</strong> • Responsável: <strong>{escola.responsavelNome}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/escola/atletas"
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all hover:scale-105"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar Aluno-Atleta</span>
            </Link>

            <Link
              href="/escola/inscricoes"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center gap-2 transition-all"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Inscrever Modalidades</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Link
          href="/escola/atletas"
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-5 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Atletas Registrados</span>
            <Users className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-white">{atletas.length}</p>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            Gerenciar cadastro <ArrowUpRight className="w-3 h-3" />
          </p>
        </Link>

        <Link
          href="/escola/comissao"
          className="bg-slate-900 border border-slate-800 hover:border-teal-500/50 rounded-2xl p-5 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Comissão Técnica</span>
            <School className="w-5 h-5 text-teal-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-white">{comissao.length}</p>
          <p className="text-[11px] text-teal-400 mt-1 flex items-center gap-1">
            Técnicos & Professores <ArrowUpRight className="w-3 h-3" />
          </p>
        </Link>

        <Link
          href="/escola/inscricoes"
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-5 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Equipes Submetidas</span>
            <Trophy className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-white">{inscricoes.length}</p>
          <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
            Ver modalidades <ArrowUpRight className="w-3 h-3" />
          </p>
        </Link>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Homologações</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400">{totalValidadas}</span>
            <span className="text-xs text-slate-400">validadas</span>
            {totalPendentes > 0 && (
              <span className="text-xs text-amber-400 ml-auto bg-amber-500/10 px-2 py-0.5 rounded">
                {totalPendentes} em análise
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Status pelo Comitê JEGDS</p>
        </div>

      </div>

      {/* Lista de Inscrições Realizadas pela Escola */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white">Equipes & Modalidades Inscritas</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Acompanhe a análise do Comitê, baixe a Ficha Oficial assinada e imprima os Crachás Oficiais.
            </p>
          </div>
          <Link
            href="/escola/inscricoes"
            className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold hover:bg-emerald-500/25 transition-colors"
          >
            + Nova Inscrição de Equipe
          </Link>
        </div>

        {inscricoes.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl">
            <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-300">Nenhuma modalidade inscrita ainda.</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              Comece cadastrando seus alunos-atletas e em seguida monte as equipes para disputar o JEGDS 2026.
            </p>
            <Link
              href="/escola/inscricoes"
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              <span>Inscrever Primeira Equipe</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {inscricoes.map((insc) => {
              const atletasEquipe = insc.atletaIds
                .map(id => atletas.find(a => a.id === id))
                .filter((a): a is Atleta => a !== undefined);

              return (
                <div
                  key={insc.id}
                  className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-5 hover:border-slate-600 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-black text-white">{insc.modalidadeNome}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-200 font-semibold">
                        {insc.categoria}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-700 text-slate-200 font-semibold">
                        {insc.sexo}
                      </span>
                      
                      {/* Status Badge */}
                      {insc.status === 'VALIDADA' && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Validada (Homologada)
                        </span>
                      )}
                      {insc.status === 'PENDENTE' && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Em Análise pelo Comitê
                        </span>
                      )}
                      {insc.status === 'REJEITADA' && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Rejeitada
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 flex flex-wrap items-center gap-4">
                      <span><strong>{atletasEquipe.length}</strong> Atletas convocados</span>
                      <span>•</span>
                      <span>Data: {insc.dataInscricao || 'Rascunho'}</span>
                      {insc.motivoRejeicao && (
                        <span className="text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                          Motivo: {insc.motivoRejeicao}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ações de Impressão e Gestão */}
                  <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                    <button
                      onClick={() => handleGerarFichaPdf(insc)}
                      disabled={gerandoPdfId === insc.id}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      title="Baixar Ficha Oficial de Inscrição em PDF"
                    >
                      <Printer className="w-4 h-4 text-emerald-400" />
                      <span>{gerandoPdfId === insc.id ? 'Gerando...' : 'Ficha Oficial PDF'}</span>
                    </button>

                    <button
                      onClick={() => handleGerarCrachasPdf(insc)}
                      disabled={gerandoPdfId === insc.id}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      title="Baixar Crachás Oficiais com Foto e QR Code em PDF"
                    >
                      <Download className="w-4 h-4 text-teal-400" />
                      <span>Crachás com QR</span>
                    </button>

                    <Link
                      href={`/escola/inscricoes`}
                      className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-bold transition-colors"
                    >
                      Editar Equipe
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
