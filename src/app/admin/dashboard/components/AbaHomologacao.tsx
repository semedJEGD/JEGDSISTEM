'use client';

import React, { useState } from 'react';
import { Search, ShieldCheck, Download, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Escola, Atleta, InscricaoEquipe } from '@/types/jegd';
import { JegdPdfGenerator } from '@/lib/pdf-generator';

export interface AlertaInconsistencia {
  tipo: string;
  mensagem: string;
  escolaNome: string;
  atletaNome?: string;
}

interface AbaHomologacaoProps {
  busca: string;
  setBusca: (val: string) => void;
  filtroStatus: string;
  setFiltroStatus: (val: string) => void;
  inscricoes: InscricaoEquipe[];
  escolas: Escola[];
  atletas: Atleta[];
  alertas?: AlertaInconsistencia[];
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
  alertas = [],
  abrirModalAnalise
}: AbaHomologacaoProps) {
  const [subAba, setSubAba] = useState<'EQUIPES' | 'ALERTAS'>('EQUIPES');

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

  const totalPendentes = inscricoes.filter(i => i.status === 'PENDENTE').length;

  return (
    <div className="space-y-4">
      {/* SELETOR DE SUB-ABAS: EQUIPES VS ALERTAS */}
      <div className="flex items-center gap-2 border-b border-[#E2EAE5] pb-2">
        <button
          type="button"
          onClick={() => setSubAba('EQUIPES')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            subAba === 'EQUIPES'
              ? 'bg-[#00A878] text-white shadow-2xs'
              : 'bg-white border border-[#E2EAE5] text-[#4B5563] hover:text-[#17221D]'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Equipes & Inscrições ({inscricoes.length})</span>
          {totalPendentes > 0 && (
            <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
              {totalPendentes} pendentes
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSubAba('ALERTAS')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
            subAba === 'ALERTAS'
              ? 'bg-[#00A878] text-white shadow-2xs'
              : 'bg-white border border-[#E2EAE5] text-[#4B5563] hover:text-[#17221D]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Auditoria de Documentos ({alertas.length})</span>
          {alertas.length > 0 && (
            <span className="bg-rose-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-black">
              {alertas.length}
            </span>
          )}
        </button>
      </div>

      {subAba === 'EQUIPES' ? (
        <>
          {/* BARRA DE FILTROS DAS INSCRIÇÕES */}
          <div className="bg-white border border-[#E2EAE5] rounded-2xl p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-2xs">
            <div className="sm:col-span-2 relative">
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Filtrar por escola ou modalidade..."
                className="w-full px-3.5 py-2 pl-9 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:outline-none focus:border-[#00A878] focus:bg-white"
              />
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-3" />
            </div>

            <div>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs font-bold focus:outline-none focus:border-[#00A878] focus:bg-white"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="PENDENTE">Pendente de Homologação</option>
                <option value="VALIDADA">Validada (Homologada)</option>
                <option value="REJEITADA">Rejeitada</option>
              </select>
            </div>
          </div>

          {/* LISTA DE EQUIPES */}
          <div className="space-y-3">
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
                    className="bg-white border border-[#E2EAE5] hover:border-[#00A878]/50 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm sm:text-base font-black text-[#17221D]">
                          {escolaObj?.nome} ({escolaObj?.sigla})
                        </span>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#E8F7F1] text-[#087A5B] font-bold border border-[#00A878]/20">
                          {insc.modalidadeNome}
                        </span>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#F7F9F8] text-[#4B5563] font-bold border border-[#E2EAE5]">
                          {insc.categoria} • {insc.sexo}
                        </span>

                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black border ${
                          insc.status === 'VALIDADA'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : insc.status === 'REJEITADA'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}>
                          {insc.status === 'VALIDADA' ? 'HOMOLOGADA' : insc.status === 'REJEITADA' ? 'REJEITADA' : 'PENDENTE'}
                        </span>
                      </div>

                      <div className="text-xs text-[#64748B] flex flex-wrap items-center gap-3">
                        <span><strong className="text-[#17221D] font-bold">{insc.atletaIds.length}</strong> Atletas convocados</span>
                        <span>•</span>
                        <span>Data: {insc.dataInscricao}</span>
                        {insc.motivoRejeicao && (
                          <span className="text-rose-600 font-medium">
                            Motivo: {insc.motivoRejeicao}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end shrink-0">
                      <button
                        onClick={() => abrirModalAnalise(insc)}
                        className="px-3.5 py-2 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Julgar / Homologar</span>
                      </button>

                      <button
                        onClick={async () => {
                          if (escolaObj) {
                            const atls = insc.atletaIds.map(id => atletas.find(a => a.id === id)).filter((a): a is Atleta => a !== undefined);
                            await JegdPdfGenerator.gerarCrachasEmLote(escolaObj, atls, insc.modalidadeNome, `${insc.categoria} (${insc.sexo})`);
                          }
                        }}
                        className="px-3 py-2 rounded-xl bg-white hover:bg-[#E8F7F1] text-[#17221D] hover:text-[#087A5B] text-xs font-bold border border-[#E2EAE5] flex items-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-[#00A878]" />
                        <span>Crachás</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* ABA: AUDITORIA DE DOCUMENTOS E ALERTAS */
        <div className="space-y-3">
          {alertas.length === 0 ? (
            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-8 text-center text-xs text-[#087A5B] font-bold shadow-2xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Nenhuma inconsistência encontrada. Todos os atletas cadastrados possuem documentação completa.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {alertas.map((alerta, idx) => (
                <div key={idx} className="bg-white border border-rose-200 rounded-xl p-3.5 flex items-start gap-3 shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-[#17221D]">{alerta.atletaNome}</span>
                      <span className="text-[#64748B] text-[11px]">({alerta.escolaNome})</span>
                    </div>
                    <p className="text-rose-700 text-[11px] font-medium">{alerta.mensagem}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
