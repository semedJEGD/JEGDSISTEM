'use client';

import React from 'react';
import { Printer, Download, BookOpen, Layers } from 'lucide-react';
import { ModalidadeConfig } from '@/types/jegd';

interface AbaSumulasProps {
  modalidades: ModalidadeConfig[];
  handleGerarListaChamada: (modalidade: ModalidadeConfig, categoria: string, sexo: string) => void;
  handleGerarCadernoModalidade: (modalidade: ModalidadeConfig) => void;
  handleGerarCadernoGeralArbitragem: () => void;
}

export function AbaSumulas({
  modalidades,
  handleGerarListaChamada,
  handleGerarCadernoModalidade,
  handleGerarCadernoGeralArbitragem
}: AbaSumulasProps) {
  return (
    <div className="space-y-6">
      {/* CARD DE CABEÇALHO COM SUPER BOTÃO GERAL DA SEMED */}
      <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <h3 className="text-base sm:text-lg font-black text-[#17221D] flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#00A878]" />
            <span>Gerador de Súmulas & Listas de Chamada Oficial</span>
          </h3>
          <p className="text-xs text-[#68756E] leading-relaxed">
            Exporte as súmulas organizadas em cadernos consolidados para a mesa de arbitragem e controle de Check-in (30 min antes) e tolerância de WxO (15 min).
          </p>
        </div>

        <button
          onClick={handleGerarCadernoGeralArbitragem}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#00A878] to-[#087A5B] hover:from-[#087A5B] hover:to-[#00A878] text-white font-black text-xs sm:text-sm shadow-md shadow-[#00A878]/25 flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-95 shrink-0"
        >
          <BookOpen className="w-4 h-4 text-white" />
          <span>Baixar Livro Geral de Arbitragem (Todas Modalidades)</span>
        </button>
      </div>

      {/* GRID DE MODALIDADES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {modalidades.map((mod) => (
          <div
            key={mod.id}
            className="bg-white border border-[#E2EAE5] rounded-2xl p-5 space-y-3.5 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-black text-[#17221D]">{mod.nome}</h4>
                <span className="text-[10px] font-bold text-[#087A5B] bg-[#E8F7F1] px-2 py-0.5 rounded-full border border-[#00A878]/20">
                  {new Date(mod.dataEvento).toLocaleDateString('pt-BR')}
                </span>
              </div>

              <p className="text-[11px] text-[#68756E] font-medium">
                Categorias: {mod.categoriasPermitidas.join(', ')}
              </p>
            </div>

            {/* BOTÃO PRINCIPAL: CADERNO COMPLETO DA MODALIDADE EM 1 SÓ PDF */}
            <button
              onClick={() => handleGerarCadernoModalidade(mod)}
              className="w-full py-2.5 px-3 rounded-xl bg-[#E8F7F1] hover:bg-[#00A878] text-[#087A5B] hover:text-white border border-[#00A878]/30 text-xs font-black flex items-center justify-center gap-2 transition-all shadow-xs group"
              title={`Baixar todas as categorias de ${mod.nome} em um único arquivo PDF`}
            >
              <Layers className="w-3.5 h-3.5 text-[#00A878] group-hover:text-white transition-colors" />
              <span>Baixar Caderno Completo (1 PDF)</span>
            </button>

            {/* SEPARADOR E BOTÕES INDIVIDUAIS DE SEGUNDA VIA */}
            <div className="space-y-1.5 pt-2.5 border-t border-[#E2EAE5]">
              <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#94A3B8] block">
                Segunda via individual por categoria:
              </span>
              {mod.categoriasPermitidas.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleGerarListaChamada(mod, cat, 'MASCULINO')}
                  className="w-full py-1.5 px-2.5 rounded-lg bg-[#F7F9F8] hover:bg-slate-100 text-[#475569] hover:text-[#17221D] border border-[#E2EAE5] text-[10.5px] font-semibold flex items-center justify-between transition-colors"
                >
                  <span>Súmula {cat} (Masc)</span>
                  <Download className="w-3 h-3 text-[#94A3B8]" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
