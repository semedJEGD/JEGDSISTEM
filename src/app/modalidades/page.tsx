'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  User,
  MapPin,
  Calendar,
  Layers,
  Activity,
  Flame,
  Zap,
  Grid,
  CircleDot,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { ModalidadeConfig } from '@/types/jegd';

/**
 * Mapeamento Centralizado de Assets e Acessibilidade das Modalidades
 * Permite substituir URLs ou imagens facilmente em um único ponto.
 */
const MODALIDADES_ASSETS: Record<string, { img: string; alt: string }> = {
  queimada: {
    img: '/assets/modalidades/queimada.jpg',
    alt: 'Estudantes jogando partida de queimada em ginásio esportivo'
  },
  tenis_mesa: {
    img: '/assets/modalidades/tenis-mesa.jpg',
    alt: 'Partida oficial de tênis de mesa com raquete, bola e mesa azul'
  },
  atletismo: {
    img: '/assets/modalidades/atletismo.jpg',
    alt: 'Atletas correndo em pista sintética de atletismo escolar'
  },
  beach_soccer: {
    img: '/assets/modalidades/beach-soccer.jpg',
    alt: 'Jogadores disputando partida de futebol de areia na praia'
  },
  futsal: {
    img: '/assets/modalidades/futsal.jpg',
    alt: 'Partida dinâmica de futsal com bola em direção ao gol'
  },
  xadrez: {
    img: '/assets/modalidades/xadrez.jpg',
    alt: 'Tabuleiro de xadrez com peças em madeira de alto acabamento'
  },
  futebol_campo: {
    img: '/assets/modalidades/futebol-campo.jpg',
    alt: 'Disputa de bola em partida de futebol de campo em estádio'
  },
  voleibol: {
    img: '/assets/modalidades/voleibol.jpg',
    alt: 'Atletas saltando no bloqueio em partida de voleibol'
  }
};

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8 sm:space-y-10">
      
      {/* Cabeçalho da Página */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8F7F1] border border-[#00A878]/25 text-[#087A5B] text-xs font-black tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-[#00A878]" />
          <span>JEGD 2026 • GUIA OFICIAL DE MODALIDADES</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-[#17221D] tracking-tight">
          Modalidades Esportivas
        </h1>
        <p className="text-sm sm:text-base text-[#4B5563] leading-relaxed font-normal max-w-2xl mx-auto">
          Consulte categorias, limites de atletas por equipe, faixas etárias e regras de participação do JEGDS 2026.
        </p>
      </div>

      {/* Filtros por Tipo de Modalidade */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 w-full max-w-md mx-auto">
        <button
          type="button"
          onClick={() => setFiltroTipo('TODOS')}
          className={`flex-1 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border text-center cursor-pointer ${
            filtroTipo === 'TODOS'
              ? 'bg-[#00A878] text-white border-[#00A878] shadow-xs'
              : 'bg-white border-[#E2EAE5] text-[#4B5563] hover:text-[#17221D] hover:bg-[#F7F9F8]'
          }`}
        >
          Todas ({modalidades.length})
        </button>
        <button
          type="button"
          onClick={() => setFiltroTipo('COLETIVA')}
          className={`flex-1 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border text-center cursor-pointer ${
            filtroTipo === 'COLETIVA'
              ? 'bg-[#00A878] text-white border-[#00A878] shadow-xs'
              : 'bg-white border-[#E2EAE5] text-[#4B5563] hover:text-[#17221D] hover:bg-[#F7F9F8]'
          }`}
        >
          Coletivas
        </button>
        <button
          type="button"
          onClick={() => setFiltroTipo('INDIVIDUAL')}
          className={`flex-1 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border text-center cursor-pointer ${
            filtroTipo === 'INDIVIDUAL'
              ? 'bg-[#00A878] text-white border-[#00A878] shadow-xs'
              : 'bg-white border-[#E2EAE5] text-[#4B5563] hover:text-[#17221D] hover:bg-[#F7F9F8]'
          }`}
        >
          Individuais
        </button>
      </div>

      {/* Grid de Cards das Modalidades (3 cols desktop, 2 cols tablet, 1 col mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {modalidadesFiltradas.map((mod) => {
          const asset = MODALIDADES_ASSETS[mod.codigo] || {
            img: '/banner-jegd.png',
            alt: `Modalidade esportiva ${mod.nome}`
          };

          const isColetiva = mod.tipo === 'COLETIVA';
          const generoTexto = mod.sexosPermitidos?.join(' / ') || 'MASCULINO / FEMININO';

          return (
            <div
              key={mod.id}
              className="group bg-white border border-[#E2EAE5] hover:border-[#00A878]/50 rounded-3xl p-5 sm:p-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_30px_rgba(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[220px] hover:-translate-y-1"
            >
              {/* FOTOGRAFIA INTEGRADA COM FUSÃO SUAVE NO TOPO / DIREITA (SEM CORTE RETANGULAR) */}
              <div className="absolute top-0 right-0 w-3/5 sm:w-2/3 h-32 sm:h-36 overflow-hidden pointer-events-none rounded-tr-3xl">
                <img
                  src={asset.img}
                  alt={asset.alt}
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                />
                {/* Gradientes de Fusão Suave: Esquerda e Base */}
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/50 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
              </div>

              {/* CONTEÚDO PRINCIPAL FLUTUANTE */}
              <div className="relative z-10 space-y-3.5">
                
                {/* 1. Badge Tipo de Modalidade (Top-Left) */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border shadow-2xs ${
                      isColetiva
                        ? 'bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]'
                        : 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                    }`}
                  >
                    {mod.tipo}
                  </span>
                </div>

                {/* 2. Nome da Modalidade + Quantidade de Atletas na Mesma Linha */}
                <div className="flex items-baseline justify-between gap-2 pt-1">
                  <h3 className="text-xl sm:text-2xl font-black text-[#17221D] group-hover:text-[#087A5B] transition-colors leading-tight">
                    {mod.nome}
                  </h3>

                  <div className="flex items-center gap-1.5 text-xs font-black text-[#00A878] shrink-0">
                    {isColetiva ? (
                      <Users className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <User className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>
                      {mod.minAtletas} a {mod.maxAtletas} atletas
                    </span>
                  </div>
                </div>

                {/* 3. Descrição das Regras */}
                <p className="text-xs sm:text-[13px] text-[#4B5563] leading-relaxed line-clamp-2 font-medium">
                  {mod.descricao}
                </p>
              </div>

              {/* 4. RODAPÉ INFERIOR: CATEGORIAS + GÊNERO + BOTÃO INSCREVER */}
              <div className="relative z-10 pt-4 mt-3 border-t border-[#E2EAE5]/80 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  {/* Categorias Permitidas (Pills Claras) */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {mod.categoriasPermitidas?.map((cat) => (
                      <span
                        key={cat}
                        className="text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-lg bg-[#E0F2FE] text-[#0369A1] border border-[#BAE6FD]/70 uppercase tracking-wider"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Sexo / Gênero Permitido */}
                  <span className="text-[11px] sm:text-xs font-black text-[#00A878] uppercase tracking-wider text-right shrink-0">
                    {generoTexto}
                  </span>
                </div>

                {/* Botão Oficial: Inscrever Equipe */}
                <Link
                  href="/escola/inscricoes"
                  className="w-full py-2.5 rounded-xl bg-[#F0FDF4] hover:bg-[#00A878] text-[#087A5B] hover:text-white text-xs sm:text-sm font-black border border-[#00A878]/25 hover:border-[#00A878] flex items-center justify-center gap-2 transition-all shadow-2xs group/btn mt-1"
                >
                  <span>Inscrever equipe</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
