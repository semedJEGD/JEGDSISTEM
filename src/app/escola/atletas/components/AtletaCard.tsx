'use client';

import React from 'react';
import { Edit2, Trash2, Printer } from 'lucide-react';
import { Atleta } from '@/types/jegd';

interface AtletaCardProps {
  atleta: Atleta;
  onGerarCracha: (atleta: Atleta) => void;
  onEditar: (atleta: Atleta) => void;
  onExcluir: (id: string, nome: string) => void;
}

export function AtletaCard({
  atleta,
  onGerarCracha,
  onEditar,
  onExcluir
}: AtletaCardProps) {
  return (
    <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-5">
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
              {atleta.documentos?.foto3x4 ? (
                <img src={atleta.documentos.foto3x4} alt={atleta.nomeCompleto} className="w-full h-full object-cover" />
              ) : (
                <span className="text-base font-black text-[#087A5B]">
                  {atleta.nomeCompleto.substring(0, 2)}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base font-black text-[#17221D] leading-snug">
                {atleta.nomeCompleto}
              </h3>
              <p className="text-xs text-[#4B5563] mt-0.5 font-medium">
                {atleta.documentoTipo}: <strong className="text-[#17221D]">{atleta.documentoNumero}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 text-sm text-[#4B5563] py-3 border-t border-[#E2EAE5]">
          <div className="flex items-center justify-between">
            <span>Categoria:</span>
            <span className="font-bold text-[#087A5B] bg-[#E8F7F1] px-2.5 py-0.5 rounded-lg border border-[#00A878]/20 text-xs">
              {atleta.categoriaCalculada || 'N/A'} ({atleta.sexo === 'MASCULINO' ? 'Masc' : 'Fem'})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Nascimento:</span>
            <span className="font-semibold text-[#17221D]">
              {new Date(atleta.dataNascimento).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Turma / Série:</span>
            <span className="font-semibold text-[#17221D]">{atleta.serieTurma}</span>
          </div>
        </div>

        {/* Modalidades Inscritas & Equipes Formadas */}
        <div className="pt-3 border-t border-[#E2EAE5] text-sm text-[#4B5563] space-y-2">
          <span className="font-bold text-[#17221D] text-xs uppercase tracking-wider">Modalidades / Equipes:</span>
          {atleta.modalidadesInscritas && atleta.modalidadesInscritas.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {atleta.modalidadesInscritas.map((m, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl bg-[#E8F7F1] text-[#087A5B] text-xs border border-[#00A878]/20 font-bold"
                >
                  {m.modalidadeNome} {m.provas && m.provas.length > 0 ? `(${m.provas.join(', ')})` : ''}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-amber-700 italic">Nenhuma modalidade vinculada ainda</p>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="pt-3 border-t border-[#E2EAE5] flex items-center justify-between text-xs text-[#4B5563]">
        <span className="font-mono">
          Código: <strong className="text-emerald-800 font-black">{atleta.matricula}</strong>
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onGerarCracha(atleta)}
            className="p-2 rounded-xl bg-[#F7F9F8] hover:bg-[#E8F7F1] text-[#087A5B] border border-[#00A878]/30 transition-colors"
            title="Gerar Crachá Oficial Individual (PDF)"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEditar(atleta)}
            className="p-2 rounded-xl bg-[#F7F9F8] hover:bg-[#E8F7F1] text-[#4B5563] hover:text-[#087A5B] border border-[#E2EAE5] transition-colors"
            title="Editar Aluno e Modalidades"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onExcluir(atleta.id, atleta.nomeCompleto)}
            className="p-2 rounded-xl bg-[#F7F9F8] hover:bg-red-50 text-[#4B5563] hover:text-red-600 border border-[#E2EAE5] transition-colors"
            title="Excluir Aluno"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
