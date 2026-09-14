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
  Download,
  Sparkles
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
      <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#E8F7F1] border border-[#00A878]/30 flex items-center justify-center text-[#087A5B] font-black text-2xl shadow-2xs">
              {escola.sigla.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-[#17221D]">{escola.nome}</h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#EDF7F2] border border-[#00A878]/20 text-[#087A5B] font-bold">
                  Rede {escola.rede}
                </span>
              </div>
              <p className="text-xs text-[#68756E] mt-1">
                INEP: <strong className="text-[#17221D]">{escola.inep}</strong> • Bairro: <strong className="text-[#17221D]">{escola.bairro}</strong> • Responsável: <strong className="text-[#17221D]">{escola.responsavelNome}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/escola/atletas"
              className="px-4 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold shadow-xs hover:shadow-md flex items-center gap-2 transition-all active:scale-98"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cadastrar Aluno-Atleta</span>
            </Link>

            <Link
              href="/escola/inscricoes"
              className="px-4 py-2.5 rounded-xl bg-[#F7F9F8] hover:bg-[#E8F7F1] text-[#17221D] hover:text-[#087A5B] text-xs font-bold border border-[#E2EAE5] flex items-center gap-2 transition-all"
            >
              <Trophy className="w-4 h-4 text-[#00A878]" />
              <span>Inscrever Modalidades</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Link
          href="/escola/atletas"
          className="bg-white border border-[#E2EAE5] hover:border-[#00A878]/50 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-[#68756E] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Atletas Registrados</span>
            <Users className="w-5 h-5 text-[#00A878] group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-[#17221D]">{atletas.length}</p>
          <p className="text-[11px] text-[#00A878] mt-1 flex items-center gap-1 font-semibold">
            Gerenciar cadastro <ArrowUpRight className="w-3 h-3" />
          </p>
        </Link>

        <Link
          href="/escola/comissao"
          className="bg-white border border-[#E2EAE5] hover:border-[#00A878]/50 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-[#68756E] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Comissão Técnica</span>
            <School className="w-5 h-5 text-[#00A878] group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-[#17221D]">{comissao.length}</p>
          <p className="text-[11px] text-[#00A878] mt-1 flex items-center gap-1 font-semibold">
            Técnicos & Professores <ArrowUpRight className="w-3 h-3" />
          </p>
        </Link>

        <Link
          href="/escola/inscricoes"
          className="bg-white border border-[#E2EAE5] hover:border-[#00A878]/50 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between text-[#68756E] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Equipes Submetidas</span>
            <Trophy className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-3xl font-black text-[#17221D]">{inscricoes.length}</p>
          <p className="text-[11px] text-[#087A5B] mt-1 flex items-center gap-1 font-semibold">
            Ver modalidades <ArrowUpRight className="w-3 h-3" />
          </p>
        </Link>

        <div className="bg-white border border-[#E2EAE5] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-[#68756E] mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Homologações</span>
            <CheckCircle2 className="w-5 h-5 text-[#00A878]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#00A878]">{totalValidadas}</span>
            <span className="text-xs text-[#68756E]">validadas</span>
            {totalPendentes > 0 && (
              <span className="text-xs text-amber-800 ml-auto bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                {totalPendentes} em análise
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#68756E] mt-1">Status pelo Comitê JEGD</p>
        </div>

      </div>

      {/* Lista de Inscrições Realizadas pela Escola */}
      <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-[#E2EAE5]">
          <div>
            <h2 className="text-xl font-black text-[#17221D]">Equipes & Modalidades Inscritas</h2>
            <p className="text-xs text-[#68756E] mt-0.5">
              Acompanhe a análise do Comitê, baixe a Ficha Oficial assinada e imprima os Crachás Oficiais.
            </p>
          </div>
          <Link
            href="/escola/inscricoes"
            className="px-4 py-2 rounded-xl bg-[#E8F7F1] border border-[#00A878]/30 text-[#087A5B] text-xs font-bold hover:bg-[#d5f0e5] transition-colors"
          >
            + Nova Inscrição de Equipe
          </Link>
        </div>

        {inscricoes.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-[#E2EAE5] rounded-2xl bg-[#F7F9F8]">
            <Trophy className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-sm font-bold text-[#17221D]">Nenhuma modalidade inscrita ainda.</p>
            <p className="text-xs text-[#68756E] max-w-sm mx-auto mt-1 mb-4">
              Comece cadastrando seus alunos-atletas e em seguida monte as equipes para disputar o JEGD 2026.
            </p>
            <Link
              href="/escola/inscricoes"
              className="px-5 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs"
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
                  className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl p-5 hover:border-[#00A878]/40 transition-all flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-lg font-black text-[#17221D]">{insc.modalidadeNome}</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-white border border-[#E2EAE5] text-[#17221D] font-semibold">
                        {insc.categoria}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-white border border-[#E2EAE5] text-[#17221D] font-semibold">
                        {insc.sexo}
                      </span>
                      
                      {/* Status Badge */}
                      {insc.status === 'VALIDADA' && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#E8F7F1] text-[#087A5B] border border-[#00A878]/30 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Validada (Homologada)
                        </span>
                      )}
                      {insc.status === 'PENDENTE' && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Em Análise pelo Comitê
                        </span>
                      )}
                      {insc.status === 'REJEITADA' && (
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Rejeitada
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[#68756E] flex flex-wrap items-center gap-4">
                      <span><strong className="text-[#17221D]">{atletasEquipe.length}</strong> Atletas convocados</span>
                      <span>•</span>
                      <span>Data: {insc.dataInscricao || 'Rascunho'}</span>
                      {insc.motivoRejeicao && (
                        <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
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
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#E8F7F1] text-[#17221D] hover:text-[#087A5B] text-xs font-bold border border-[#E2EAE5] flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      title="Baixar Ficha Oficial de Inscrição em PDF"
                    >
                      <Printer className="w-4 h-4 text-[#00A878]" />
                      <span>{gerandoPdfId === insc.id ? 'Gerando...' : 'Ficha Oficial PDF'}</span>
                    </button>

                    <button
                      onClick={() => handleGerarCrachasPdf(insc)}
                      disabled={gerandoPdfId === insc.id}
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-[#E8F7F1] text-[#17221D] hover:text-[#087A5B] text-xs font-bold border border-[#E2EAE5] flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      title="Baixar Crachás Oficiais com Foto e QR Code em PDF"
                    >
                      <Download className="w-4 h-4 text-[#00A878]" />
                      <span>Crachás com QR</span>
                    </button>

                    <Link
                      href={`/escola/inscricoes`}
                      className="px-3.5 py-2 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold transition-all shadow-2xs"
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

