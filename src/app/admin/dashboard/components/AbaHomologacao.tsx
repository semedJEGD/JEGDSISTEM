'use client';

import React from 'react';
import { Search, ShieldCheck, Download } from 'lucide-react';
import { Escola, Atleta, InscricaoEquipe } from '@/types/jegd';
import { JegdPdfGenerator } from '@/lib/pdf-generator';

interface AbaHomologacaoProps {
  busca: string;
  setBusca: (val: string) => void;
  filtroStatus: string;
  setFiltroStatus: (val: string) => void;
  inscricoes: InscricaoEquipe[];
  escolas: Escola[];
  atletas: Atleta[];
  abrirModalAnalise: (insc: InscricaoEquipe) => void;
}

export function AbaHomologacao({
  busca,
  setBusca,
  filtroStatus,
  setFiltroStatus,
  inscricoes,
  escolas,
  atletas,
  abrirModalAnalise
}: AbaHomologacaoProps) {
  const inscricoesFiltradas = inscricoes.filter((insc) => {
    const esc = escolas.find(e => e.id === insc.escolaId);
    const bateBusca =
      !busca ||
      insc.modalidadeNome.toLowerCase().includes(busca.toLowerCase()) ||
      (esc && esc.nome.toLowerCase().includes(busca.toLowerCase())) ||
      (esc && esc.sigla.toLowerCase().includes(busca.toLowerCase()));

    const bateStatus = filtroStatus === 'TODOS' || insc.status === filtroStatus;
    return bateBusca && bateStatus;
  });

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#E2EAE5] rounded-3xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-xs">
        <div className="sm:col-span-2 relative">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Filtrar por escola ou modalidade..."
            className="w-full px-4 py-3 pl-11 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-sm focus:outline-none focus:border-[#00A878] focus:bg-white"
          />
          <Search className="w-4 h-4 text-[#4B5563] absolute left-4 top-3.5" />
        </div>

        <div>
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="PENDENTE">Pendente de Homologação</option>
            <option value="VALIDADA">Validada (Homologada)</option>
            <option value="REJEITADA">Rejeitada</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {inscricoesFiltradas.length === 0 ? (
          <div className="bg-white border border-[#E2EAE5] rounded-2xl p-8 text-center text-xs text-[#68756E]">
            Nenhuma inscrição encontrada com os filtros selecionados.
          </div>
        ) : (
          inscricoesFiltradas.map((insc) => {
            const escolaObj = escolas.find(e => e.id === insc.escolaId);

            return (
              <div
                key={insc.id}
                className="bg-white border border-[#E2EAE5] hover:border-[#00A878]/50 rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-lg font-black text-[#17221D]">
                      {escolaObj?.nome} ({escolaObj?.sigla})
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-[#E8F7F1] text-[#087A5B] font-bold border border-[#00A878]/20">
                      {insc.modalidadeNome}
                    </span>
                    <span className="text-xs px-3 py-1 rounded-full bg-[#F7F9F8] text-[#4B5563] font-bold border border-[#E2EAE5]">
                      {insc.categoria} • {insc.sexo}
                    </span>

                    <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
                      insc.status === 'VALIDADA'
                        ? 'bg-[#E8F7F1] text-[#087A5B] border-[#00A878]/30'
                        : insc.status === 'REJEITADA'
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {insc.status}
                    </span>
                  </div>

                  <div className="text-sm text-[#4B5563] flex flex-wrap items-center gap-4">
                    <span><strong className="text-[#17221D] font-bold">{insc.atletaIds.length}</strong> Atletas convocados</span>
                    <span>•</span>
                    <span>Data: {insc.dataInscricao}</span>
                    {insc.motivoRejeicao && (
                      <span className="text-red-600 font-medium">
                        Motivo: {insc.motivoRejeicao}
                      </span>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
                  <button
                    onClick={() => abrirModalAnalise(insc)}
                    className="px-4 py-2.5 rounded-2xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs sm:text-sm font-bold shadow-xs flex items-center gap-2 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Julgar / Homologar</span>
                  </button>

                  <button
                    onClick={async () => {
                      if (escolaObj) {
                        const atls = insc.atletaIds.map(id => atletas.find(a => a.id === id)).filter((a): a is Atleta => a !== undefined);
                        await JegdPdfGenerator.gerarCrachasEmLote(escolaObj, atls, insc.modalidadeNome, `${insc.categoria} (${insc.sexo})`);
                      }
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-white hover:bg-[#E8F7F1] text-[#17221D] hover:text-[#087A5B] text-xs sm:text-sm font-bold border border-[#E2EAE5] flex items-center gap-2 shadow-2xs transition-colors"
                  >
                    <Download className="w-4 h-4 text-[#00A878]" />
                    <span>Crachás QR</span>
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
