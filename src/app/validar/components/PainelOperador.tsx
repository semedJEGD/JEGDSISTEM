'use client';

import React from 'react';
import { ShieldCheck, LogIn, Lock } from 'lucide-react';
import { PapelUsuario } from '@/types/jegd';

interface PainelOperadorProps {
  operadorNome: string;
  setOperadorNome: (nome: string) => void;
  operadorPapel: PapelUsuario;
  setOperadorPapel: (papel: PapelUsuario) => void;
  isOperadorAtivo: boolean;
  onSalvarOperador: () => void;
}

export function PainelOperador({
  operadorNome,
  setOperadorNome,
  operadorPapel,
  setOperadorPapel,
  isOperadorAtivo,
  onSalvarOperador
}: PainelOperadorProps) {
  return (
    <div className="bg-white border border-[#E2EAE5] rounded-2xl p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#E8F7F1] text-[#00A878] shadow-2xs shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-[#17221D]">
                Operador de Validação & Logística
              </h3>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                isOperadorAtivo ? 'bg-[#E8F7F1] text-[#087A5B]' : 'bg-amber-100 text-amber-800'
              }`}>
                {isOperadorAtivo ? 'Ativo' : 'Identificação Pendente'}
              </span>
            </div>
            <p className="text-xs text-[#4B5563]">
              Os registros de entrega de água, lanche e elegibilidade serão gravados com seu nome e papel.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={operadorNome}
            onChange={(e) => setOperadorNome(e.target.value)}
            placeholder="Seu nome (ex: Prof. Marcos)"
            className="px-3 py-1.5 text-xs bg-[#F7F9F8] border border-[#E2EAE5] rounded-lg text-[#17221D] font-bold outline-none focus:border-[#00A878] w-44"
          />
          <select
            value={operadorPapel}
            onChange={(e) => setOperadorPapel(e.target.value as PapelUsuario)}
            className="px-2.5 py-1.5 text-xs bg-[#F7F9F8] border border-[#E2EAE5] rounded-lg text-[#17221D] font-bold outline-none focus:border-[#00A878]"
          >
            <option value="COORDENADOR">Coordenação SEMED</option>
            <option value="MESARIO">Mesário / Fiscal</option>
            <option value="ARBITRO">Árbitro de Quadra</option>
            <option value="APOIO">Equipe de Apoio / Logística</option>
            <option value="PROFESSOR">Professor / Escola</option>
          </select>
          <button
            onClick={onSalvarOperador}
            className="px-3 py-1.5 rounded-lg bg-[#17221D] hover:bg-[#2A3B33] text-white text-xs font-bold transition-all shrink-0"
          >
            {isOperadorAtivo ? 'Atualizar Operador' : 'Identificar-se'}
          </button>
        </div>
      </div>
    </div>
  );
}
