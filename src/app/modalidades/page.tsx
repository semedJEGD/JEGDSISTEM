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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Título da página */}
      <div className="text-center max-w-3xl mx-auto space-y-3.5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8F7F1] border border-[#00A878]/25 text-[#087A5B] text-xs font-black tracking-wide">
          <Sparkles className="w-4 h-4 text-[#00A878]" />
          <span>JEGD 2026 • GUIA OFICIAL</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-[#17221D] tracking-tight">
          Modalidades Esportivas
        </h1>
        <p className="text-base sm:text-lg text-[#374151] leading-relaxed font-normal">
          Consulte categorias, limites de atletas e informações para inscrição no JEGDS 2026.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => setFiltroTipo('TODOS')}
          className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all border ${
            filtroTipo === 'TODOS'
              ? 'bg-[#00A878] text-white border-[#00A878] shadow-sm'
              : 'bg-white border-[#E2EAE5] text-[#4B5563] hover:text-[#17221D] hover:bg-[#F7F9F8]'
          }`}
        >
          Todas as modalidades ({modalidades.length})
        </button>
        <button
          onClick={() => setFiltroTipo('COLETIVA')}
          className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all border ${
            filtroTipo === 'COLETIVA'
              ? 'bg-[#00A878] text-white border-[#00A878] shadow-sm'
              : 'bg-white border-[#E2EAE5] text-[#4B5563] hover:text-[#17221D] hover:bg-[#F7F9F8]'
          }`}
        >
          Coletivos
        </button>
        <button
          onClick={() => setFiltroTipo('INDIVIDUAL')}
          className={`px-6 py-3 rounded-2xl text-sm font-bold transition-all border ${
            filtroTipo === 'INDIVIDUAL'
              ? 'bg-[#00A878] text-white border-[#00A878] shadow-sm'
              : 'bg-white border-[#E2EAE5] text-[#4B5563] hover:text-[#17221D] hover:bg-[#F7F9F8]'
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
            className="bg-white border border-[#E2EAE5] hover:border-[#00A878]/50 rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md space-y-6 flex flex-col justify-between transition-all group"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-[#E8F7F1] border border-[#00A878]/20 flex items-center justify-center group-hover:scale-105 transition-transform shadow-2xs">
                  {getIcon(mod.nome)}
                </div>
                <span className="text-xs font-black px-3.5 py-1 rounded-full bg-[#EDF7F2] text-[#087A5B] border border-[#00A878]/20 uppercase tracking-wider">
                  {mod.tipo}
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-[#17221D] group-hover:text-[#087A5B] transition-colors">
                  {mod.nome}
                </h3>
                <p className="text-sm text-[#374151] mt-2 leading-relaxed line-clamp-3">
                  {mod.descricao}
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-[#E2EAE5] text-sm text-[#17221D]">
                <div className="flex items-center justify-between">
                  <span className="text-[#4B5563]">Atletas por equipe:</span>
                  <strong className="text-[#00A878] font-black text-base">
                    {mod.minAtletas} a {mod.maxAtletas}
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#4B5563]">Data do evento:</span>
                  <strong className="text-[#17221D] font-bold">
                    {new Date(mod.dataEvento).toLocaleDateString('pt-BR')}
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#4B5563]">Prazo de inscrição:</span>
                  <strong className="text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md text-xs font-bold border border-amber-200">
                    {new Date(mod.prazoInscricao).toLocaleDateString('pt-BR')}
                  </strong>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#4B5563] shrink-0">Categorias:</span>
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {mod.categoriasPermitidas?.map(c => (
                      <span key={c} className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-[#EDF7F2] text-[#087A5B] border border-[#00A878]/15">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#4B5563]">Gênero:</span>
                  <span className="text-[#17221D] font-bold text-sm">
                    {mod.sexosPermitidos?.join(' e ')}
                  </span>
                </div>

                {mod.localPadrao && (
                  <div className="flex items-start gap-2 pt-2 text-[#4B5563]">
                    <MapPin className="w-4 h-4 text-[#00A878] shrink-0 mt-0.5" />
                    <span className="text-sm truncate font-medium text-[#17221D]">{mod.localPadrao}</span>
                  </div>
                )}
              </div>
            </div>

            <Link
              href="/escola/inscricoes"
              className="w-full py-3.5 rounded-2xl bg-[#E8F7F1] hover:bg-[#00A878] text-[#087A5B] hover:text-white text-sm font-bold border border-[#00A878]/30 hover:border-[#00A878] flex items-center justify-center gap-2 transition-all shadow-2xs group/btn"
            >
              <span>Inscrever equipe</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Link>
          </div>
        ))}
      </div>

    </div>
  );
}

