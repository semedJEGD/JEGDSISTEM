'use client';

import React from 'react';
import { Atleta } from '@/types/jegd';

interface ModalObsAtletaProps {
  isOpen: boolean;
  atleta: Atleta | null;
  obsTexto: string;
  setObsTexto: (val: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ModalObsAtleta({
  isOpen,
  atleta,
  obsTexto,
  setObsTexto,
  onClose,
  onSubmit
}: ModalObsAtletaProps) {
  if (!isOpen || !atleta) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-[#E2EAE5] rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
        <h3 className="text-base font-bold text-[#17221D] mb-1">
          Observação da Mesa: {atleta.nomeCompleto}
        </h3>
        <p className="text-xs text-[#68756E] mb-4">
          Anotação interna para controle da arbitragem e checagem de documentos.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <textarea
            rows={3}
            value={obsTexto}
            onChange={(e) => setObsTexto(e.target.value)}
            placeholder="Ex: Documento apresentado fisicamente na mesa com sucesso."
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:outline-none focus:border-[#00A878] focus:bg-white"
          />

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#F7F9F8] text-xs font-bold text-[#68756E]"
            >
              Fechar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-bold text-xs shadow-sm transition-all"
            >
              Salvar Anotação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
