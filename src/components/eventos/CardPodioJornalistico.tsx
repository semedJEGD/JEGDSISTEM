'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Sparkles, Medal } from 'lucide-react';

export interface DegrauPodio {
  escolaId?: string;
  escolaNome: string;
  escolaSigla: string;
  atletaNome?: string;
  fotoUrl?: string | null;
  marca?: string;
}

export interface DadosPodioJornalistico {
  selo: string; // Ex: "É OURO!", "CAMPEÃO!", "PÓDIO OFICIAL"
  modalidadeNome: string;
  categoria: string;
  sexo?: string;
  prova?: string;
  manchete: string;
  resumo: string;
  ouro: DegrauPodio;
  prata?: DegrauPodio | null;
  bronze?: DegrauPodio | null;
}

const PODIO_PREFIX = 'PODIO_JSON:';

export function serializarPodioConteudo(dados: DadosPodioJornalistico): string {
  return `${PODIO_PREFIX}${JSON.stringify(dados)}`;
}

export function parsePodioConteudo(conteudo?: string | null): DadosPodioJornalistico | null {
  if (!conteudo || !conteudo.startsWith(PODIO_PREFIX)) return null;
  try {
    const parsed = JSON.parse(conteudo.slice(PODIO_PREFIX.length));
    if (parsed && parsed.ouro && parsed.manchete) {
      return parsed as DadosPodioJornalistico;
    }
    return null;
  } catch {
    return null;
  }
}

function iniciais(texto?: string): string {
  if (!texto) return '?';
  const clean = texto.replace(/[^A-Za-zÀ-ÿ0-9\s]/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase() || '?';
}

interface CardPodioJornalisticoProps {
  dados: DadosPodioJornalistico;
  modo?: 'PREVIEW' | 'PORTAL' | 'TELAO';
  temaEscuro?: boolean;
  onClick?: () => void;
}

export function CardPodioJornalistico({
  dados,
  modo = 'PORTAL',
  temaEscuro = false,
  onClick,
}: CardPodioJornalisticoProps) {
  const [animado, setAnimado] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimado(true), 60);
    return () => clearTimeout(t);
  }, [dados.manchete, dados.ouro?.escolaSigla]);

  const isTelao = modo === 'TELAO';
  const isPreview = modo === 'PREVIEW';

  const renderDegrau = (
    item: DegrauPodio | null | undefined,
    pos: 1 | 2 | 3,
    delayMs: number
  ) => {
    if (!item) return null;

    const alturaBase = isTelao
      ? pos === 1
        ? 'h-36'
        : pos === 2
        ? 'h-24'
        : 'h-16'
      : isPreview
      ? pos === 1
        ? 'h-20'
        : pos === 2
        ? 'h-14'
        : 'h-10'
      : pos === 1
      ? 'h-24'
      : pos === 2
      ? 'h-16'
      : 'h-12';

    const corDegrau =
      pos === 1
        ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 text-amber-950 shadow-lg shadow-amber-500/25'
        : pos === 2
        ? 'bg-gradient-to-b from-slate-200 via-slate-300 to-slate-400 text-slate-900'
        : 'bg-gradient-to-b from-orange-300 via-orange-400 to-orange-500 text-orange-950';

    const corAnel =
      pos === 1
        ? 'ring-4 ring-amber-400/70 bg-amber-100 text-amber-900'
        : pos === 2
        ? 'ring-2 ring-slate-300 bg-slate-100 text-slate-700'
        : 'ring-2 ring-orange-300 bg-orange-100 text-orange-800';

    const avatarDim = isTelao
      ? pos === 1
        ? 'w-20 h-20 text-xl'
        : 'w-14 h-14 text-base'
      : pos === 1
      ? 'w-12 h-12 text-xs'
      : 'w-10 h-10 text-[11px]';

    return (
      <div
        style={{ transitionDelay: `${delayMs}ms` }}
        className={`flex-1 flex flex-col items-center justify-end min-w-0 transition-all duration-700 ease-out ${
          animado ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        {/* Avatar / Foto + Nome */}
        <div className="flex flex-col items-center text-center mb-2 px-1 w-full">
          <div className="relative mb-1.5">
            {item.fotoUrl ? (
              <img
                src={item.fotoUrl}
                alt={item.atletaNome || item.escolaSigla}
                className={`${avatarDim} rounded-full object-cover ${corAnel}`}
              />
            ) : (
              <div
                className={`${avatarDim} rounded-full flex items-center justify-center font-black ${corAnel}`}
              >
                {iniciais(item.atletaNome || item.escolaSigla)}
              </div>
            )}
            {pos === 1 && (
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-sm">
                <Trophy className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          <p
            className={`font-black leading-tight truncate max-w-full ${
              isTelao
                ? pos === 1
                  ? 'text-lg sm:text-xl'
                  : 'text-sm sm:text-base'
                : pos === 1
                ? 'text-xs sm:text-sm'
                : 'text-[11px]'
            } ${temaEscuro || isTelao ? 'text-white' : 'text-[#0F2540]'}`}
            title={item.atletaNome || item.escolaSigla}
          >
            {item.atletaNome || item.escolaSigla}
          </p>

          {item.atletaNome && (
            <p
              className={`truncate max-w-full font-semibold ${
                isTelao ? 'text-xs text-emerald-300' : 'text-[10px] text-slate-400'
              }`}
            >
              {item.escolaSigla}
            </p>
          )}

          {item.marca && (
            <span
              className={`mt-1 px-2 py-0.5 rounded-full font-mono font-bold ${
                isTelao
                  ? 'text-xs bg-white/15 text-amber-300'
                  : 'text-[10px] bg-emerald-50 text-[#087A5B]'
              }`}
            >
              {item.marca}
            </span>
          )}
        </div>

        {/* Bloco do degrau */}
        <div
          className={`w-full ${alturaBase} ${corDegrau} rounded-t-xl flex flex-col items-center justify-center font-black`}
        >
          <span className={isTelao ? 'text-3xl' : 'text-lg'}>{pos}º</span>
          <span className="text-[9px] uppercase tracking-widest opacity-80">
            {pos === 1 ? 'Ouro' : pos === 2 ? 'Prata' : 'Bronze'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <article
      onClick={onClick}
      className={`rounded-2xl overflow-hidden border transition-all ${
        onClick ? 'cursor-pointer hover:shadow-lg' : ''
      } ${
        isTelao
          ? 'w-full max-w-6xl h-full bg-gradient-to-br from-[#0B1C30] via-[#0F2540] to-[#0B2D24] border-amber-400/30 text-white p-6 sm:p-10 flex flex-col justify-between shadow-2xl'
          : 'bg-gradient-to-br from-[#0F2540] via-[#132F4F] to-[#0D3529] border-[#0F2540] text-white p-5 sm:p-6 shadow-md'
      }`}
    >
      {/* Topo Jornalístico */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 text-[10px] sm:text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{dados.selo || 'É OURO!'}</span>
            </span>
            <span className="px-2.5 py-1 rounded-full bg-white/10 text-emerald-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              {dados.modalidadeNome} · {dados.categoria}
              {dados.sexo ? ` (${dados.sexo === 'FEMININO' ? 'F' : 'M'})` : ''}
              {dados.prova ? ` · ${dados.prova}` : ''}
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50 flex items-center gap-1">
            <Medal className="w-3.5 h-3.5 text-amber-400" />
            Pódio Oficial
          </span>
        </div>

        <h2
          className={`font-black leading-tight tracking-tight text-white ${
            isTelao
              ? 'text-2xl sm:text-4xl xl:text-5xl'
              : isPreview
              ? 'text-base sm:text-lg'
              : 'text-xl sm:text-2xl'
          }`}
        >
          {dados.manchete}
        </h2>

        {dados.resumo && (
          <p
            className={`text-white/80 leading-relaxed ${
              isTelao ? 'text-base sm:text-xl max-w-4xl' : 'text-xs sm:text-sm'
            }`}
          >
            {dados.resumo}
          </p>
        )}
      </div>

      {/* Pódio Visual Animado (2º · 1º · 3º) */}
      <div
        className={`mt-6 pt-4 border-t border-white/10 flex items-end justify-center gap-3 sm:gap-5 ${
          isTelao ? 'max-w-4xl w-full mx-auto' : 'max-w-xl w-full mx-auto'
        }`}
      >
        {renderDegrau(dados.prata, 2, 220)}
        {renderDegrau(dados.ouro, 1, 420)}
        {renderDegrau(dados.bronze, 3, 60)}
      </div>
    </article>
  );
}
