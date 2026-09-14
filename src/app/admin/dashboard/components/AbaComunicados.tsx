'use client';

import React from 'react';
import { ComunicadoAviso } from '@/types/jegd';

interface AbaComunicadosProps {
  comunicados: ComunicadoAviso[];
}

export function AbaComunicados({ comunicados }: AbaComunicadosProps) {
  return (
    <div className="space-y-3">
      {comunicados.length === 0 ? (
        <div className="bg-white border border-[#E2EAE5] rounded-2xl p-8 text-center text-xs text-[#68756E]">
          Nenhum comunicado cadastrado até o momento.
        </div>
      ) : (
        comunicados.map((aviso) => (
          <div key={aviso.id} className="bg-white border border-[#E2EAE5] rounded-2xl p-5 space-y-2 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#E8F7F1] text-[#087A5B] border border-[#00A878]/20">
                {aviso.categoria}
              </span>
              <span className="text-xs text-[#68756E]">{aviso.dataPublicacao}</span>
            </div>
            <h4 className="text-base font-bold text-[#17221D]">{aviso.titulo}</h4>
            <p className="text-xs text-[#68756E]">{aviso.conteudo}</p>
          </div>
        ))
      )}
    </div>
  );
}
