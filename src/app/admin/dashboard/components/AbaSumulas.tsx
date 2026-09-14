'use client';

import React from 'react';
import { Printer, Download } from 'lucide-react';
import { ModalidadeConfig } from '@/types/jegd';

interface AbaSumulasProps {
  modalidades: ModalidadeConfig[];
  handleGerarListaChamada: (modalidade: ModalidadeConfig, categoria: string, sexo: string) => void;
}

export function AbaSumulas({ modalidades, handleGerarListaChamada }: AbaSumulasProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 space-y-2 shadow-sm">
        <h3 className="text-base font-bold text-[#17221D] flex items-center gap-2">
          <Printer className="w-5 h-5 text-[#00A878]" />
          <span>Gerador de Súmulas & Listas de Chamada Oficial</span>
        </h3>
        <p className="text-xs text-[#68756E] leading-relaxed">
          Exporte a lista oficial de atletas para controle de Check-in (30 minutos de antecedência) e tolerância de WxO (15 minutos) na mesa de arbitragem.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modalidades.map((mod) => (
          <div
            key={mod.id}
            className="bg-white border border-[#E2EAE5] rounded-2xl p-5 space-y-3 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#17221D]">{mod.nome}</h4>
              <span className="text-[10px] text-[#68756E] bg-[#F7F9F8] px-2 py-0.5 rounded border border-[#E2EAE5]">
                {new Date(mod.dataEvento).toLocaleDateString('pt-BR')}
              </span>
            </div>

            <p className="text-xs text-[#68756E]">
              Categorias: {mod.categoriasPermitidas.join(', ')}
            </p>

            <div className="space-y-1.5 pt-2 border-t border-[#E2EAE5]">
              {mod.categoriasPermitidas.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleGerarListaChamada(mod, cat, 'MASCULINO')}
                  className="w-full py-1.5 px-3 rounded-xl bg-[#F7F9F8] hover:bg-[#E8F7F1] text-[#17221D] hover:text-[#087A5B] border border-[#E2EAE5] text-[11px] font-bold flex items-center justify-between transition-colors shadow-sm"
                >
                  <span>Súmula {cat} (Masc)</span>
                  <Download className="w-3 h-3 text-[#00A878]" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
