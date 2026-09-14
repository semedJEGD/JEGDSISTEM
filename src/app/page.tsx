'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  AlertCircle,
  FileText
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
    <div className="min-h-screen bg-[#F7F9F8] text-[#17221D] flex flex-col">
      
      {/* Banner de Aviso Oficial */}
      {comunicados.length > 0 && comunicados[0].urgente && (
        <div className="bg-amber-500 text-slate-950 font-semibold py-2.5 px-4 text-xs sm:text-sm text-center shadow-xs flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 stroke-[2.5]" />
          <span>
            <strong>AVISO OFICIAL:</strong> {comunicados[0].titulo} —{' '}
            <Link href="/regulamento" className="underline font-bold hover:text-white transition-colors">
              Leia o Comunicado
            </Link>
          </span>
        </div>
      )}

      {/* BANNER OFICIAL HERO */}
      <section className="relative bg-white border-b border-[#E2EAE5] pt-6 pb-12 overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          
          {/* Hero Video Institucional Oficial JEGD 2026 */}
          <div className="w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-[#E2EAE5] mb-8 bg-[#17221D] relative">
            <video
              autoPlay
              loop
              muted
              playsInline
              poster="/banner-jegd.png"
              className="w-full h-auto max-h-[380px] object-cover object-center block"
            >
              <source src="/video-jegd.mp4" type="video/mp4" />
              <img
                src="/banner-jegd.png"
                alt="Banner Oficial JEGD 2026 - Mais que jogos, grandes valores para a vida"
                className="w-full h-auto max-h-[380px] object-cover object-center block"
              />
            </video>
          </div>

          {/* Conteúdo Central Hero */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8F7F1] border border-[#00A878]/30 text-[#087A5B] text-xs sm:text-sm font-bold shadow-2xs">
              <Sparkles className="w-4 h-4 text-[#00A878]" />
              <span>SEMED • PREFEITURA DE GONÇALVES DIAS - MA</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[#17221D] leading-tight">
              Sistema de Inscrições & Gestão Esportiva Escolar
            </h1>

            <p className="text-base sm:text-lg text-[#374151] leading-relaxed font-normal max-w-2xl mx-auto">
              Plataforma oficial para diretores e professores cadastrarem atletas, gerenciarem equipes e emitirem crachás com QR Code para os Jogos Escolares 2026.
            </p>

            {/* Ações Hero */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-3">
              <Link
                href="/escola/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-bold text-base shadow-sm hover:shadow-md flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-98"
              >
                <School className="w-5 h-5 stroke-[2.5]" />
                <span>Acessar Portal da Escola</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/modalidades"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#F7F9F8] hover:bg-white text-[#17221D] font-bold text-base border border-[#E2EAE5] hover:border-[#00A878] flex items-center justify-center gap-2 transition-all duration-200 shadow-2xs"
              >
                <span>Ver Modalidades & Regras</span>
              </Link>
            </div>
          </div>

          {/* Métricas Rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-10 text-left">
            <div className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 text-[#087A5B] mb-1">
                <School className="w-4 h-4 text-[#00A878]" />
                <span className="text-xs uppercase font-bold tracking-wider text-[#4B5563]">Escolas</span>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-[#17221D]">{escolas.length}</p>
              <p className="text-xs text-[#68756E] mt-0.5">Cadastradas no JEGD</p>
            </div>

            <div className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 text-[#087A5B] mb-1">
                <Users className="w-4 h-4 text-[#00A878]" />
                <span className="text-xs uppercase font-bold tracking-wider text-[#4B5563]">Atletas</span>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-[#17221D]">{totalAtletas}</p>
              <p className="text-xs text-[#68756E] mt-0.5">Alunos inscritos</p>
            </div>

            <div className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 text-[#087A5B] mb-1">
                <Trophy className="w-4 h-4 text-[#00A878]" />
                <span className="text-xs uppercase font-bold tracking-wider text-[#4B5563]">Modalidades</span>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-[#17221D]">{modalidades.length}</p>
              <p className="text-xs text-[#68756E] mt-0.5">Categorias oficiais</p>
            </div>

            <div className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 text-[#087A5B] mb-1">
                <FileCheck className="w-4 h-4 text-[#00A878]" />
                <span className="text-xs uppercase font-bold tracking-wider text-[#4B5563]">Inscrições</span>
              </div>
              <p className="text-3xl sm:text-4xl font-black text-[#17221D]">{totalInscricoes}</p>
              <p className="text-xs text-[#68756E] mt-0.5">Equipes submetidas</p>
            </div>
          </div>

        </div>
      </section>

      {/* PASSO A PASSO DA INSCRIÇÃO */}
      <section className="py-14 bg-[#F7F9F8]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-[#087A5B] bg-[#E8F7F1] px-4 py-1.5 rounded-full border border-[#00A878]/25">
              Passo a Passo
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#17221D]">
              Como funciona a inscrição no JEGD 2026
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            
            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-6 relative shadow-xs hover:shadow-md transition-shadow">
              <span className="text-3xl font-black text-[#E2EAE5] absolute top-4 right-4 select-none">01</span>
              <div className="w-12 h-12 rounded-xl bg-[#E8F7F1] border border-[#00A878]/20 text-[#00A878] flex items-center justify-center mb-4">
                <School className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#17221D] mb-1.5">1. Seleção da Escola</h3>
              <p className="text-sm text-[#4B5563] leading-relaxed">
                Selecione a sua escola na lista oficial e confirme seus dados de professor responsável.
              </p>
            </div>

            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-6 relative shadow-xs hover:shadow-md transition-shadow">
              <span className="text-3xl font-black text-[#E2EAE5] absolute top-4 right-4 select-none">02</span>
              <div className="w-12 h-12 rounded-xl bg-[#E8F7F1] border border-[#00A878]/20 text-[#00A878] flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#17221D] mb-1.5">2. Cadastro de Alunos</h3>
              <p className="text-sm text-[#4B5563] leading-relaxed">
                Cadastre os estudantes com verificação automática de idade e faixa etária para as provas.
              </p>
            </div>

            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-6 relative shadow-xs hover:shadow-md transition-shadow">
              <span className="text-3xl font-black text-[#E2EAE5] absolute top-4 right-4 select-none">03</span>
              <div className="w-12 h-12 rounded-xl bg-[#E8F7F1] border border-[#00A878]/20 text-[#00A878] flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#17221D] mb-1.5">3. Montagem das Equipes</h3>
              <p className="text-sm text-[#4B5563] leading-relaxed">
                Inscreva seus atletas nas modalidades coletivas e individuais com formação automática.
              </p>
            </div>

            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-6 relative shadow-xs hover:shadow-md transition-shadow">
              <span className="text-3xl font-black text-[#E2EAE5] absolute top-4 right-4 select-none">04</span>
              <div className="w-12 h-12 rounded-xl bg-[#E8F7F1] border border-[#00A878]/20 text-[#00A878] flex items-center justify-center mb-4">
                <QrCode className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#17221D] mb-1.5">4. Fichas e Crachás</h3>
              <p className="text-sm text-[#4B5563] leading-relaxed">
                Exporte em PDF as fichas homologadas e os crachás com foto e QR Code para a arbitragem.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* MODALIDADES EM DESTAQUE */}
      <section className="py-14 sm:py-16 bg-white border-t border-[#E2EAE5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#087A5B] bg-[#E8F7F1] px-3.5 py-1 rounded-full border border-[#00A878]/20">
                Esportes JEGD 2026
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#17221D] mt-2">
                Modalidades Coletivas & Individuais
              </h2>
            </div>
            <Link
              href="/modalidades"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#00A878] hover:text-[#087A5B] transition-colors"
            >
              <span>Ver todas as modalidades</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {modalidades.slice(0, 6).map((mod) => (
              <div
                key={mod.id}
                className="bg-white border border-[#E2EAE5] hover:border-[#00A878]/40 rounded-2xl p-6 transition-all duration-200 shadow-xs hover:shadow-md group"
              >
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EDF7F2] text-[#087A5B] border border-[#00A878]/20 uppercase">
                    {mod.tipo}
                  </span>
                  <span className="text-xs text-[#00A878] font-bold">
                    {mod.minAtletas} a {mod.maxAtletas} atletas
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#17221D] group-hover:text-[#087A5B] transition-colors mb-1.5">
                  {mod.nome}
                </h3>
                <p className="text-sm text-[#4B5563] mb-4 line-clamp-2 leading-relaxed">
                  {mod.descricao}
                </p>

                <div className="pt-3.5 border-t border-[#E2EAE5] flex items-center justify-between text-xs text-[#4B5563]">
                  <div className="flex items-center gap-1">
                    <span className="px-2.5 py-0.5 rounded bg-[#F7F9F8] text-[#17221D] font-bold border border-[#E2EAE5]">
                      {mod.categoriasPermitidas?.[0] || 'Infantil'}
                    </span>
                  </div>
                  <span className="text-[#087A5B] font-bold">
                    {mod.sexosPermitidos?.join(' / ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA PARA AS ESCOLAS */}
      <section className="py-14 sm:py-16 bg-[#E8F7F1] border-t border-[#00A878]/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#00A878] text-white flex items-center justify-center mx-auto mb-5 shadow-sm">
            <Medal className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#17221D] mb-3">
            Sua escola está pronta para disputar os Jogos Escolares?
          </h2>
          <p className="text-[#374151] text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed font-medium">
            Acesse o sistema agora mesmo, registre os seus alunos-atletas e assegure a vaga da sua delegação no maior evento esportivo da nossa cidade!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full">
            <Link
              href="/escola/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-bold text-sm shadow-xs hover:shadow-md transition-all active:scale-98 text-center"
            >
              Entrar no Painel da Escola
            </Link>
            <Link
              href="/regulamento"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-[#F7F9F8] text-[#17221D] font-bold text-sm border border-[#E2EAE5] transition-all text-center"
            >
              Consultar Regulamento Geral
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

