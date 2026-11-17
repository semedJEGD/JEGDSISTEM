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
  const isSemDoc = atleta.semDocumento || atleta.documentoTipo === 'SEM_DOCUMENTO';

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
              {atleta.documentos?.foto3x4 ? (
                <img src={atleta.documentos.foto3x4} alt={atleta.nomeCompleto} className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-emerald-700">
                  {atleta.nomeCompleto.substring(0, 2)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug truncate" title={atleta.nomeCompleto}>
                {atleta.nomeCompleto}
              </h3>
              <div className="mt-0.5">
                {isSemDoc ? (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">
                    ⚠️ Sem Documento
                  </span>
                ) : (
                  <p className="text-xs text-slate-500 font-normal">
                    {atleta.documentoTipo}: <strong className="text-slate-700 font-medium">{atleta.documentoNumero}</strong>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-slate-600 py-2.5 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Categoria:</span>
            <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 text-[11px]">
              {atleta.categoriaCalculada || 'N/A'} ({atleta.sexo === 'MASCULINO' ? 'Masc' : 'Fem'})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Nascimento:</span>
            <span className="font-medium text-slate-800">
              {new Date(atleta.dataNascimento).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Turma / Série:</span>
            <span className="font-medium text-slate-800">{atleta.serieTurma}</span>
          </div>
          {atleta.cadastradoPor && (
            <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-100 text-[11px]">
              <span className="text-slate-400">Cadastrado por:</span>
              <span className="font-medium text-slate-600 truncate max-w-[160px]" title={atleta.cadastradoPor}>
                {atleta.cadastradoPor}
              </span>
            </div>
          )}
        </div>

        {/* Modalidades Inscritas & Equipes Formadas */}
        <div className="pt-2.5 border-t border-slate-100 text-xs space-y-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Modalidades:</span>
          {atleta.modalidadesInscritas && atleta.modalidadesInscritas.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {atleta.modalidadesInscritas.map((m, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] border border-emerald-200/60 font-medium"
                >
                  {m.modalidadeNome} {m.provas && m.provas.length > 0 ? `(${m.provas.join(', ')})` : ''}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-amber-700 italic">Nenhuma modalidade vinculada</p>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="font-mono text-[11px]">
          ID: <strong className="text-slate-800 font-semibold">{atleta.matricula}</strong>
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onGerarCracha(atleta)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200 transition-colors"
            title="Gerar Crachá Oficial Individual (PDF)"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEditar(atleta)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            title="Editar Aluno e Modalidades"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onExcluir(atleta.id, atleta.nomeCompleto)}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors"
            title="Excluir Aluno"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
