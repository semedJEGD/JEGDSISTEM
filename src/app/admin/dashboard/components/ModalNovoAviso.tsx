'use client';

import React from 'react';

interface ModalNovoAvisoProps {
  isOpen: boolean;
  titulo: string;
  setTitulo: (val: string) => void;
  conteudo: string;
  setConteudo: (val: string) => void;
  categoria: 'REGULAMENTO' | 'CRONOGRAMA' | 'ALERTA' | 'RESULTADOS';
  setCategoria: (val: 'REGULAMENTO' | 'CRONOGRAMA' | 'ALERTA' | 'RESULTADOS') => void;
  urgente: boolean;
  setUrgente: (val: boolean) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ModalNovoAviso({
  isOpen,
  titulo,
  setTitulo,
  conteudo,
  setConteudo,
  categoria,
  setCategoria,
  urgente,
  setUrgente,
  onClose,
  onSubmit
}: ModalNovoAvisoProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-[#E2EAE5] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
        <h3 className="text-lg font-bold text-[#17221D] mb-1">
          Publicar Comunicado Oficial do JEGDS 2026
        </h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#17221D] mb-1">Título *</label>
            <input
              type="text"
              required
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Tabela de Jogos de Futsal Publicada"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:outline-none focus:border-[#00A878] focus:bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#17221D] mb-1">Conteúdo *</label>
            <textarea
              rows={4}
              required
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:outline-none focus:border-[#00A878] focus:bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#17221D] mb-1">Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:outline-none focus:border-[#00A878] focus:bg-white"
              >
                <option value="CRONOGRAMA">Cronograma</option>
                <option value="ALERTA">Alerta</option>
                <option value="REGULAMENTO">Regulamento</option>
                <option value="RESULTADOS">Resultados</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="avisoUrgente"
                checked={urgente}
                onChange={(e) => setUrgente(e.target.checked)}
                className="rounded border-[#E2EAE5] text-[#00A878] focus:ring-[#00A878]"
              />
              <label htmlFor="avisoUrgente" className="text-xs font-bold text-[#17221D]">
                Marcar como Urgente
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[#E2EAE5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#F7F9F8] text-[#68756E] text-xs font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-bold text-xs shadow-md shadow-[#00A878]/20 transition-all"
            >
              Publicar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
