'use client';

import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Escola } from '@/types/jegd';

interface ModalConfirmacaoEscolaProps {
  aberto: boolean;
  escola: Escola | undefined;
  profNome: string;
  profCpf: string;
  onConfirmar: () => void;
  onFechar: () => void;
}

export function ModalConfirmacaoEscola({
  aberto,
  escola,
  profNome,
  profCpf,
  onConfirmar,
  onFechar
}: ModalConfirmacaoEscolaProps) {
  if (!aberto || !escola) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-[#00A878] transform scale-100 transition-all">
        
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h3 className="text-lg font-black text-[#17221D] text-center mb-1">
          Confirmação de Escola
        </h3>
        
        <p className="text-xs text-[#4B5563] text-center mb-4">
          Para evitar erros e cruzamento de dados, confirme com atenção:
        </p>

        <div className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl p-4 mb-5 text-center">
          <span className="text-[10px] font-black tracking-wider text-[#087A5B] uppercase block mb-1">
            Você está se vinculando a:
          </span>
          <p className="text-base font-black text-[#17221D]">
            {escola.nome}
          </p>
          <p className="text-xs text-[#68756E] font-semibold mt-0.5">
            {escola.sigla} • Rede {escola.rede}
          </p>

          <div className="mt-3 pt-3 border-t border-[#E2EAE5] text-left text-[11px] text-[#4B5563] space-y-1">
            <p>👤 <strong>Professor:</strong> {profNome}</p>
            <p>🪪 <strong>CPF:</strong> {profCpf}</p>
          </div>
        </div>

        <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mb-5 font-medium leading-relaxed">
          ⚠️ <strong>Importante:</strong> Todos os alunos, matrículas e equipes que você cadastrar ficarão salvos <strong>exclusivamente</strong> dentro desta escola.
        </p>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={onFechar}
            className="w-full py-2.5 px-4 rounded-xl border border-[#E2EAE5] text-[#4B5563] hover:bg-[#F7F9F8] text-xs font-bold transition-colors order-2 sm:order-1"
          >
            Trocar Escola
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className="w-full py-2.5 px-4 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-black shadow-md shadow-[#00A878]/20 flex items-center justify-center gap-1.5 transition-all order-1 sm:order-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Sim, Sou Desta Escola</span>
          </button>
        </div>

      </div>
    </div>
  );
}
