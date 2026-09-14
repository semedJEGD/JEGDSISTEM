'use client';

import React from 'react';
import { InscricaoEquipe, StatusInscricao } from '@/types/jegd';

interface ModalAnaliseInscricaoProps {
  isOpen: boolean;
  inscricao: InscricaoEquipe | null;
  novoStatus: StatusInscricao;
  setNovoStatus: (status: StatusInscricao) => void;
  motivoRejeicao: string;
  setMotivoRejeicao: (motivo: string) => void;
  parecerTexto: string;
  setParecerTexto: (parecer: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ModalAnaliseInscricao({
  isOpen,
  inscricao,
  novoStatus,
  setNovoStatus,
  motivoRejeicao,
  setMotivoRejeicao,
  parecerTexto,
  setParecerTexto,
  onClose,
  onSubmit
}: ModalAnaliseInscricaoProps) {
  if (!isOpen || !inscricao) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#E2EAE5] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
        <h3 className="text-lg font-bold text-[#17221D] mb-1">
          Homologação de Inscrição • JEGDS 2026
        </h3>
        <p className="text-xs text-[#68756E] mb-6">
          {inscricao.modalidadeNome} ({inscricao.categoria} - {inscricao.sexo})
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#17221D] mb-1">
              Decisão do Comitê Organizador
            </label>
            <select
              value={novoStatus}
              onChange={(e) => setNovoStatus(e.target.value as StatusInscricao)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs font-bold focus:outline-none focus:border-[#00A878] focus:bg-white"
            >
              <option value="VALIDADA">VALIDADA (Homologada)</option>
              <option value="REJEITADA">REJEITADA (Indeferida com Motivo)</option>
              <option value="PENDENTE">PENDENTE (Aguardando Documentação)</option>
            </select>
          </div>

          {novoStatus === 'REJEITADA' && (
            <div>
              <label className="block text-xs font-bold text-red-600 mb-1">
                Motivo da Rejeição * (Exibido para a Escola)
              </label>
              <textarea
                rows={3}
                required
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                placeholder="Ex: Documento de identidade ilegível ou atleta fora da faixa etária permitida."
                className="w-full px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-300 text-red-900 text-xs focus:outline-none focus:border-red-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#17221D] mb-1">
              Parecer do Comitê
            </label>
            <textarea
              rows={3}
              value={parecerTexto}
              onChange={(e) => setParecerTexto(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:outline-none focus:border-[#00A878] focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2EAE5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#F7F9F8] hover:bg-[#E2EAE5] text-xs font-bold text-[#68756E]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold shadow-md shadow-[#00A878]/20 transition-all"
            >
              Salvar Parecer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
