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
  ArrowRight
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
      case 'Futsal': return <Activity className="w-6 h-6 text-emerald-400" />;
      case 'Voleibol': return <Layers className="w-6 h-6 text-teal-400" />;
      case 'Handebol': return <Shield className="w-6 h-6 text-cyan-400" />;
      case 'Basquetebol': return <Flame className="w-6 h-6 text-amber-400" />;
      case 'Atletismo': return <Zap className="w-6 h-6 text-yellow-400" />;
      case 'Xadrez': return <Grid className="w-6 h-6 text-indigo-400" />;
      case 'Tênis de Mesa': return <CircleDot className="w-6 h-6 text-emerald-400" />;
      case 'Badminton': return <Wind className="w-6 h-6 text-sky-400" />;
      case 'Natação': return <Waves className="w-6 h-6 text-blue-400" />;
      case 'Judô': return <Award className="w-6 h-6 text-amber-400" />;
      case 'Queimada Escolar': return <Target className="w-6 h-6 text-rose-400" />;
      default: return <Trophy className="w-6 h-6 text-emerald-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          Modalidades JEGD 2026
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Esportes, Categorias & Regulamento
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Consulte o número mínimo e máximo de estudantes-atletas por equipe, limites de comissão técnica e locais de prova.
        </p>
      </div>

      {/* Filtros */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setFiltroTipo('TODOS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filtroTipo === 'TODOS'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Todas as Modalidades ({modalidades.length})
        </button>
        <button
          onClick={() => setFiltroTipo('COLETIVA')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filtroTipo === 'COLETIVA'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Esportes Coletivos
        </button>
        <button
          onClick={() => setFiltroTipo('INDIVIDUAL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filtroTipo === 'INDIVIDUAL'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          Esportes Individuais
        </button>
      </div>

      {/* Grid de Modalidades */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modalidadesFiltradas.map((mod) => (
          <div
            key={mod.id}
            className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-6 shadow-xl space-y-4 flex flex-col justify-between transition-all group"
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                  {getIcon(mod.nome)}
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                  {mod.tipo}
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                  {mod.nome}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {mod.descricao}
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-800/80 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Atletas por equipe:</span>
                  <strong className="text-emerald-400 font-bold">{mod.minAtletas} a {mod.maxAtletas}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Comissão técnica:</span>
                  <strong className="text-slate-200">Até {mod.maxComissao} membro(s)</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Categorias:</span>
                  <div className="flex gap-1">
                    {mod.categorias.map(c => (
                      <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Gênero:</span>
                  <span className="text-slate-200 font-medium">
                    {mod.generos.join(' / ')}
                  </span>
                </div>
                {mod.localPadrao && (
                  <div className="flex items-start gap-1.5 pt-1 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] truncate">{mod.localPadrao}</span>
                  </div>
                )}
              </div>
            </div>

            <Link
              href="/escola/inscricoes"
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 text-xs font-bold border border-slate-700 flex items-center justify-center gap-1.5 transition-all mt-4"
            >
              <span>Inscrever Equipe</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ))}
      </div>

    </div>
  );
}
