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
  subAbaHomologacao?: 'EQUIPES' | 'ALERTAS';
  setSubAbaHomologacao?: (val: 'EQUIPES' | 'ALERTAS') => void;
  abrirModalAnalise: (insc: InscricaoEquipe) => void;
  onAprovarEquipeDireto?: (insc: InscricaoEquipe) => void;
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
  subAbaHomologacao,
  setSubAbaHomologacao,
  abrirModalAnalise,
  onAprovarEquipeDireto
}: AbaHomologacaoProps) {
  const [internalSubAba, setInternalSubAba] = useState<'EQUIPES' | 'ALERTAS'>('EQUIPES');
  const subAba = subAbaHomologacao !== undefined ? subAbaHomologacao : internalSubAba;
  const setSubAba = setSubAbaHomologacao || setInternalSubAba;

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
      <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setSubAba('EQUIPES')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
            subAba === 'EQUIPES'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Equipes & Inscrições ({inscricoes.length})</span>
          {totalPendentes > 0 && (
            <span className="bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-md text-[10px] font-semibold border border-amber-200">
              {totalPendentes} pendentes
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSubAba('ALERTAS')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
            subAba === 'ALERTAS'
              ? 'bg-slate-900 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Auditoria de Documentos ({alertas.length})</span>
          {alertas.length > 0 && (
            <span className="bg-rose-500 text-white px-1.5 py-0.2 rounded-md text-[10px] font-semibold">
              {alertas.length}
            </span>
          )}
        </button>
      </div>

      {subAba === 'EQUIPES' ? (
        <>
          {/* BARRA DE FILTROS DAS INSCRIÇÕES */}
          <div className="bg-white border border-slate-200/90 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 shadow-2xs">
            <div className="sm:col-span-2 relative">
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Filtrar por escola ou modalidade..."
                className="w-full px-3 py-1.5 pl-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-emerald-600 focus:bg-white font-normal"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>

            <div>
              <select
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium focus:outline-none focus:border-emerald-600 focus:bg-white cursor-pointer"
              >
                <option value="TODOS">Todos os Status</option>
                <option value="PENDENTE">Pendente de Homologação</option>
                <option value="VALIDADA">Validada (Homologada)</option>
                <option value="REJEITADA">Rejeitada</option>
              </select>
            </div>
          </div>

          {/* LISTA DE EQUIPES */}
          <div className="space-y-2.5">
            {inscricoesFiltradas.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-500">
                Nenhuma inscrição encontrada com os filtros selecionados.
              </div>
            ) : (
              inscricoesFiltradas.map((insc) => {
                const escolaObj = escolas.find(e => e.id === insc.escolaId);

                return (
                  <div
                    key={insc.id}
                    className="bg-white border border-slate-200/90 hover:border-slate-300 rounded-xl p-3.5 sm:p-4 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3.5 transition-colors"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {escolaObj?.nome} ({escolaObj?.sigla})
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-medium border border-emerald-200/60">
                          {insc.modalidadeNome}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200">
                          {insc.categoria} • {insc.sexo}
                        </span>

                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold border ${
                          insc.status === 'VALIDADA'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                            : insc.status === 'REJEITADA'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200/80'
                        }`}>
                          {insc.status === 'VALIDADA' ? 'HOMOLOGADA' : insc.status === 'REJEITADA' ? 'REJEITADA' : 'PENDENTE'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2.5">
                        <span><strong className="text-slate-800 font-medium">{insc.atletaIds.length}</strong> Atletas convocados</span>
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
                    <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto justify-end shrink-0">
                      {onAprovarEquipeDireto && insc.status !== 'VALIDADA' && (
                        <button
                          type="button"
                          onClick={() => onAprovarEquipeDireto(insc)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium shadow-2xs flex items-center gap-1.5 transition-colors"
                          title="Aprovar todos os alunos e homologar esta equipe imediatamente"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aprovar Equipe</span>
                        </button>
                      )}

                      <button
                        onClick={() => abrirModalAnalise(insc)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shadow-2xs flex items-center gap-1.5 transition-colors"
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
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 flex items-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-500" />
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
        <div className="space-y-2.5">
          {alertas.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-emerald-800 font-medium shadow-2xs flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Nenhuma inconsistência encontrada. Todos os atletas cadastrados possuem documentação completa.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {alertas.map((alerta, idx) => (
                <div key={idx} className="bg-white border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 shadow-2xs">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-900">{alerta.atletaNome}</span>
                      <span className="text-slate-500 text-[11px]">({alerta.escolaNome})</span>
                    </div>
                    <p className="text-rose-700 text-[11px] font-normal">{alerta.mensagem}</p>
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
