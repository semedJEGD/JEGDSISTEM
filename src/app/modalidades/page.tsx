'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Users,
  MapPin,
  Calendar,
  Layers,
  Activity,
  Flame,
  Zap,
  Grid,
  CircleDot,
  Wind,
  Waves,
  Award,
  Target,
  Shield,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { ModalidadeConfig } from '@/types/jegd';

export default function ModalidadesPage() {
  const [modalidades, setModalidades] = useState<ModalidadeConfig[]>([]);
  const [filtroTipo, setFiltroTipo] = useState<'TODOS' | 'COLETIVA' | 'INDIVIDUAL'>('TODOS');

  useEffect(() => {
    JegdStorage.init();
    setModalidades(JegdStorage.getModalidades());
  }, []);

  const modalidadesFiltradas = modalidades.filter(m => {
    if (filtroTipo === 'TODOS') return true;
    return m.tipo === filtroTipo;
  });

  const getIcon = (nome: string) => {
    switch (nome) {
      case 'Futsal': return <Activity className="w-6 h-6 text-[#00A878]" />;
      case 'Voleibol': return <Layers className="w-6 h-6 text-[#00A878]" />;
      case 'Handebol': return <Shield className="w-6 h-6 text-[#00A878]" />;
      case 'Basquetebol': return <Flame className="w-6 h-6 text-[#00A878]" />;
      case 'Atletismo': return <Zap className="w-6 h-6 text-[#00A878]" />;
      case 'Xadrez': return <Grid className="w-6 h-6 text-[#00A878]" />;
      case 'Tênis de Mesa': return <CircleDot className="w-6 h-6 text-[#00A878]" />;
      case 'Badminton': return <Wind className="w-6 h-6 text-[#00A878]" />;
      case 'Natação': return <Waves className="w-6 h-6 text-[#00A878]" />;
      case 'Judô': return <Award className="w-6 h-6 text-[#00A878]" />;
      case 'Queimada Escolar':
      case 'Queimada': return <Target className="w-6 h-6 text-[#00A878]" />;
      default: return <Trophy className="w-6 h-6 text-[#00A878]" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Título da página */}
      <div className="text-center max-w-3xl mx-auto space-y-3.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E8F7F1] border border-[#00A878]/25 text-[#087A5B] text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-[#00A878]" />
          <span>JEGD 2026 • GUIA OFICIAL</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-[#17221D] tracking-tight">
          Modalidades Esportivas
        </h1>
        <p className="text-base sm:text-lg text-[#68756E] leading-relaxed font-normal">
          Consulte categorias, limites de atletas e informações para inscrição.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center justify-center gap-2.5">
        <button
          onClick={() => setFiltroTipo('TODOS')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
            filtroTipo === 'TODOS'
              ? 'bg-[#00A878] text-white border-[#00A878] shadow-xs'
              : 'bg-white border-[#E2EAE5] text-[#68756E] hover:text-[#17221D] hover:bg-[#F7F9F8]'
          }`}
        >
          Todas as modalidades ({modalidades.length})
        </button>
        <button
          onClick={() => setFiltroTipo('COLETIVA')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
            filtroTipo === 'COLETIVA'
              ? 'bg-[#00A878] text-white border-[#00A878] shadow-xs'
              : 'bg-white border-[#E2EAE5] text-[#68756E] hover:text-[#17221D] hover:bg-[#F7F9F8]'
          }`}
        >
          Coletivos
        </button>
        <button
          onClick={() => setFiltroTipo('INDIVIDUAL')}
          className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
            filtroTipo === 'INDIVIDUAL'
              ? 'bg-[#00A878] text-white border-[#00A878] shadow-xs'
              : 'bg-white border-[#E2EAE5] text-[#68756E] hover:text-[#17221D] hover:bg-[#F7F9F8]'
          }`}
        >
          Individuais
        </button>
      </div>

      {/* Grid de Cards das Modalidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modalidadesFiltradas.map((mod) => (
          <div
            key={mod.id}
            className="bg-white border border-[#E2EAE5] hover:border-[#00A878]/50 rounded-2xl p-6 shadow-xs hover:shadow-md space-y-5 flex flex-col justify-between transition-all group"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-xl bg-[#E8F7F1] border border-[#00A878]/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {getIcon(mod.nome)}
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#EDF7F2] text-[#087A5B] border border-[#00A878]/20 uppercase tracking-wider">
                  {mod.tipo}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#17221D] group-hover:text-[#087A5B] transition-colors">
                  {mod.nome}
                </h3>
                <p className="text-xs text-[#68756E] mt-1.5 leading-relaxed line-clamp-2">
                  {mod.descricao}
                </p>
              </div>

              <div className="space-y-2.5 pt-3.5 border-t border-[#E2EAE5] text-xs text-[#17221D]">
                <div className="flex items-center justify-between">
                  <span className="text-[#68756E]">Atletas por equipe:</span>
                  <strong className="text-[#00A878] font-bold text-sm">
                    {mod.minAtletas} a {mod.maxAtletas}
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#68756E]">Data do evento:</span>
                  <strong className="text-[#17221D] font-medium">
                    {new Date(mod.dataEvento).toLocaleDateString('pt-BR')}
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#68756E]">Prazo de inscrição:</span>
                  <strong className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold">
                    {new Date(mod.prazoInscricao).toLocaleDateString('pt-BR')}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#68756E] shrink-0">Categorias:</span>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {mod.categoriasPermitidas?.map(c => (
                      <span key={c} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EDF7F2] text-[#087A5B] border border-[#00A878]/15">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#68756E]">Gênero:</span>
                  <span className="text-[#17221D] font-semibold text-xs">
                    {mod.sexosPermitidos?.join(' e ')}
                  </span>
                </div>

                {mod.localPadrao && (
                  <div className="flex items-start gap-1.5 pt-2 text-[#68756E]">
                    <MapPin className="w-4 h-4 text-[#00A878] shrink-0 mt-0.5" />
                    <span className="text-xs truncate font-medium text-[#17221D]">{mod.localPadrao}</span>
                  </div>
                )}
              </div>
            </div>

            <Link
              href="/escola/inscricoes"
              className="w-full py-3 rounded-xl bg-[#E8F7F1] hover:bg-[#00A878] text-[#087A5B] hover:text-white text-xs font-bold border border-[#00A878]/30 hover:border-[#00A878] flex items-center justify-center gap-2 transition-all shadow-2xs group/btn"
            >
              <span>Inscrever equipe</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        ))}
      </div>

    </div>
  );
}

