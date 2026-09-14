'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  School,
  Users,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  FileCheck,
  QrCode,
  Medal,
  ChevronRight,
  Flame,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { Escola, ModalidadeConfig, ComunicadoAviso } from '@/types/jegd';

export default function HomePage() {
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [modalidades, setModalidades] = useState<ModalidadeConfig[]>([]);
  const [comunicados, setComunicados] = useState<ComunicadoAviso[]>([]);
  const [totalAtletas, setTotalAtletas] = useState(0);
  const [totalInscricoes, setTotalInscricoes] = useState(0);

  useEffect(() => {
    JegdStorage.init();
    setEscolas(JegdStorage.getEscolas());
    setModalidades(JegdStorage.getModalidades());
    setComunicados(JegdStorage.getComunicados());
    setTotalAtletas(JegdStorage.getAtletas().length);
    setTotalInscricoes(JegdStorage.getInscricoes().length);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Banner de Aviso Urgente / Destaque */}
      {comunicados.length > 0 && comunicados[0].urgente && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-slate-950 font-medium py-2 px-4 text-xs sm:text-sm text-center shadow-inner flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 stroke-[2.5]" />
          <span>
            <strong>AVISO OFICIAL:</strong> {comunicados[0].titulo} —{' '}
            <Link href="/regulamento" className="underline font-bold hover:text-white transition-colors">
              Leia o Comunicado
            </Link>
          </span>
        </div>
      )}

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32">
        {/* Glow Effects de Fundo */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>
        <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Badge Oficial */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold mb-8 shadow-lg shadow-emerald-500/10 animate-pulse">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>SEMED • Jogos Escolares 2026</span>
          </div>

          {/* Título Principal */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Portal Oficial de Inscrições <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-200 to-amber-300">
              JEGD 2026
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="max-w-3xl mx-auto text-base sm:text-lg lg:text-xl text-slate-300 font-normal mb-10 leading-relaxed">
            Plataforma unificada para gestores escolares e professores de Educação Física realizarem o cadastro de atletas, validação de documentos, inscrição por modalidades e emissão de credenciais oficiais com QR Code.
          </p>

          {/* Ações Hero */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto sm:max-w-none">
            <Link
              href="/escola/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-base shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <School className="w-5 h-5 text-slate-950 stroke-[2.5]" />
              <span>Acessar Portal da Escola</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </Link>

            <Link
              href="/modalidades"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-white font-semibold text-base border border-slate-700/80 hover:border-slate-600 flex items-center justify-center gap-2 transition-all duration-200 shadow-lg"
            >
              <span>Ver Modalidades & Regras</span>
            </Link>
          </div>

          {/* Indicadores / Estatísticas Rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-16 text-left">
            
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-emerald-400 mb-2">
                <School className="w-5 h-5" />
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Escolas</span>
              </div>
              <p className="text-3xl font-extrabold text-white">{escolas.length}</p>
              <p className="text-[11px] text-slate-400 mt-1">Cadastradas no sistema</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-teal-400 mb-2">
                <Users className="w-5 h-5" />
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Atletas</span>
              </div>
              <p className="text-3xl font-extrabold text-white">{totalAtletas}</p>
              <p className="text-[11px] text-slate-400 mt-1">Estudantes inscritos</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-amber-400 mb-2">
                <Trophy className="w-5 h-5" />
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Modalidades</span>
              </div>
              <p className="text-3xl font-extrabold text-white">{modalidades.length}</p>
              <p className="text-[11px] text-slate-400 mt-1">Coletivas e individuais</p>
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 backdrop-blur-sm">
              <div className="flex items-center gap-3 text-cyan-400 mb-2">
                <FileCheck className="w-5 h-5" />
                <span className="text-xs uppercase font-bold tracking-wider text-slate-400">Inscrições</span>
              </div>
              <p className="text-3xl font-extrabold text-white">{totalInscricoes}</p>
              <p className="text-[11px] text-slate-400 mt-1">Equipes submetidas</p>
            </div>

          </div>

        </div>
      </section>

      {/* COMO FUNCIONA O FLUXO DE INSCRIÇÃO */}
      <section className="py-16 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">
              Passo a Passo Simplificado
            </h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-white">
              Como funciona a inscrição da sua escola no JEGD 2026
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative">
              <span className="text-5xl font-black text-slate-800 absolute top-4 right-4 select-none">01</span>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <School className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Acesso da Escola</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Selecione sua escola na lista oficial ou realize o login com as credenciais fornecidas pela SEMED.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative">
              <span className="text-5xl font-black text-slate-800 absolute top-4 right-4 select-none">02</span>
              <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Cadastro de Atletas</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Insira os dados dos alunos, anexe foto 3x4 e documentos com verificação de elegibilidade automática.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative">
              <span className="text-5xl font-black text-slate-800 absolute top-4 right-4 select-none">03</span>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Montagem de Equipes</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inscreva suas equipes nas modalidades Infantil (12-14) e Infanto (15-17), no naipe masculino e feminino.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative">
              <span className="text-5xl font-black text-slate-800 absolute top-4 right-4 select-none">04</span>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Fichas & Crachás QR</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Gere a Ficha Oficial assinada em PDF e imprima os crachás com QR Code para validação na entrada dos jogos.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* MODALIDADES EM DESTAQUE */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">
                Esportes Oficiais JEGD 2026
              </h2>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">
                Modalidades Coletivas e Individuais
              </p>
            </div>
            <Link
              href="/modalidades"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <span>Ver todas as modalidades</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {modalidades.slice(0, 6).map((mod) => (
              <div
                key={mod.id}
                className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {mod.tipo}
                  </span>
                  <span className="text-xs text-emerald-400 font-medium">
                    {mod.minAtletas} a {mod.maxAtletas} atletas
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors mb-2">
                  {mod.nome}
                </h3>
                <p className="text-xs text-slate-400 mb-4 line-clamp-2">
                  {mod.descricao}
                </p>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Infantil</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">Infanto</span>
                  </div>
                  <span className="text-emerald-400/90 font-medium">Masc / Fem</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA PARA AS ESCOLAS */}
      <section className="py-16 bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-slate-900 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-amber-400 text-slate-950 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
            <Medal className="w-8 h-8 stroke-[2.5]" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Sua escola está pronta para disputar os Jogos Escolares?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
            Acesse o sistema agora mesmo, registre os seus alunos-atletas e assegure a vaga da sua delegação no maior evento esportivo da nossa cidade!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/escola/login"
              className="px-8 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
            >
              Entrar no Painel da Escola
            </Link>
            <Link
              href="/regulamento"
              className="px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all"
            >
              Consultar Regulamento Geral
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
