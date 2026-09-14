'use client';

import React from 'react';
import {
  Users,
  UserCheck,
  Droplets,
  Utensils,
  Bus,
  ShieldCheck,
  FileSpreadsheet,
  Filter
} from 'lucide-react';
import { Escola } from '@/types/jegd';
import { JegdStorage } from '@/lib/storage';

interface RelatorioLogisticoAgregadoProps {
  relatorio: ReturnType<typeof JegdStorage.getRelatorioLogistico>;
  filtroEscolaRelatorio: string;
  setFiltroEscolaRelatorio: (val: string) => void;
}

export function RelatorioLogisticoAgregado({
  relatorio,
  filtroEscolaRelatorio,
  setFiltroEscolaRelatorio
}: RelatorioLogisticoAgregadoProps) {
  return (
    <div className="space-y-6">
      {/* CARDS DE TOTALIZADORES GLOBAIS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-[#E2EAE5] rounded-2xl p-4 shadow-2xs text-center space-y-1">
          <Users className="w-5 h-5 text-slate-700 mx-auto" />
          <p className="text-[11px] font-black uppercase text-slate-500">Total Atletas</p>
          <p className="text-xl font-black text-[#17221D]">{relatorio.totaisGerais.totalAtletas}</p>
        </div>

        <div className="bg-white border border-[#E2EAE5] rounded-2xl p-4 shadow-2xs text-center space-y-1">
          <UserCheck className="w-5 h-5 text-teal-600 mx-auto" />
          <p className="text-[11px] font-black uppercase text-teal-600">Credenciados</p>
          <p className="text-xl font-black text-[#17221D]">{relatorio.totaisGerais.credenciados}</p>
        </div>

        <div className="bg-white border border-[#E2EAE5] rounded-2xl p-4 shadow-2xs text-center space-y-1">
          <Droplets className="w-5 h-5 text-sky-600 mx-auto" />
          <p className="text-[11px] font-black uppercase text-sky-600">Água Entregue</p>
          <p className="text-xl font-black text-sky-700">{relatorio.totaisGerais.agua}</p>
        </div>

        <div className="bg-white border border-[#E2EAE5] rounded-2xl p-4 shadow-2xs text-center space-y-1">
          <Utensils className="w-5 h-5 text-amber-600 mx-auto" />
          <p className="text-[11px] font-black uppercase text-amber-600">Lanches</p>
          <p className="text-xl font-black text-amber-700">{relatorio.totaisGerais.lanche}</p>
        </div>

        <div className="bg-white border border-[#E2EAE5] rounded-2xl p-4 shadow-2xs text-center space-y-1">
          <Bus className="w-5 h-5 text-indigo-600 mx-auto" />
          <p className="text-[11px] font-black uppercase text-indigo-600">Transp. Ida</p>
          <p className="text-xl font-black text-indigo-700">{relatorio.totaisGerais.transporteIda}</p>
        </div>

        <div className="bg-white border border-[#E2EAE5] rounded-2xl p-4 shadow-2xs text-center space-y-1">
          <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto" />
          <p className="text-[11px] font-black uppercase text-emerald-600">Em Quadra</p>
          <p className="text-xl font-black text-emerald-700">{relatorio.totaisGerais.elegibilidadeQuadra}</p>
        </div>
      </div>

      {/* TABELA POR ESCOLA */}
      <div className="bg-white border border-[#E2EAE5] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2EAE5] pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#17221D] flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#00A878]" />
              <span>Controle Logístico Consolidado por Unidade Escolar</span>
            </h3>
            <p className="text-xs text-[#4B5563]">
              Acompanhe em tempo real as entregas de água, lanche e transporte de cada delegação.
            </p>
          </div>

          {/* Filtro por Escola */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#4B5563]" />
            <select
              value={filtroEscolaRelatorio}
              onChange={(e) => setFiltroEscolaRelatorio(e.target.value)}
              className="px-3 py-1.5 text-xs bg-[#F7F9F8] border border-[#E2EAE5] rounded-xl text-[#17221D] font-bold outline-none focus:border-[#00A878]"
            >
              <option value="TODAS">Todas as 12 Escolas</option>
              {relatorio.porEscola.map((p) => (
                <option key={p.escola.id} value={p.escola.id}>
                  {p.escola.sigla} ({p.escola.nome})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Listagem em Cards Responsivos */}
        <div className="space-y-3">
          {relatorio.porEscola
            .filter((p) => filtroEscolaRelatorio === 'TODAS' || p.escola.id === filtroEscolaRelatorio)
            .map((item) => {
              const percAgua = item.totalAtletas > 0 ? Math.round((item.agua / item.totalAtletas) * 100) : 0;
              const percLanche = item.totalAtletas > 0 ? Math.round((item.lanche / item.totalAtletas) * 100) : 0;

              return (
                <div
                  key={item.escola.id}
                  className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl p-4 sm:p-5 space-y-4 hover:border-[#00A878]/50 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2EAE5] pb-3">
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-[#17221D]">
                        {item.escola.nome} ({item.escola.sigla})
                      </h4>
                      <p className="text-xs text-[#4B5563]">
                        Rede {item.escola.rede} • Total de Atletas na Base: <strong>{item.totalAtletas}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
                        Credenciados: {item.credenciados}/{item.totalAtletas}
                      </span>
                    </div>
                  </div>

                  {/* Barras de Progresso e Métricas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    {/* Água */}
                    <div className="bg-white p-3 rounded-xl border border-[#E2EAE5] space-y-1.5">
                      <div className="flex justify-between font-bold">
                        <span className="text-sky-700 flex items-center gap-1">
                          <Droplets className="w-3.5 h-3.5" /> Água Entregue
                        </span>
                        <span className="text-slate-800">{item.agua}/{item.totalAtletas} ({percAgua}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-sky-500 h-full rounded-full transition-all" style={{ width: `${percAgua}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-500 text-right">
                        {item.pendenteAgua > 0 ? `Faltam ${item.pendenteAgua} atletas` : '✅ Todos atendidos'}
                      </p>
                    </div>

                    {/* Lanche */}
                    <div className="bg-white p-3 rounded-xl border border-[#E2EAE5] space-y-1.5">
                      <div className="flex justify-between font-bold">
                        <span className="text-amber-700 flex items-center gap-1">
                          <Utensils className="w-3.5 h-3.5" /> Lanches Entregues
                        </span>
                        <span className="text-slate-800">{item.lanche}/{item.totalAtletas} ({percLanche}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${percLanche}%` }} />
                      </div>
                      <p className="text-[10px] text-slate-500 text-right">
                        {item.pendenteLanche > 0 ? `Faltam ${item.pendenteLanche} atletas` : '✅ Todos atendidos'}
                      </p>
                    </div>

                    {/* Transporte Ida e Volta */}
                    <div className="bg-white p-3 rounded-xl border border-[#E2EAE5] space-y-1">
                      <span className="text-indigo-700 font-bold flex items-center gap-1">
                        <Bus className="w-3.5 h-3.5" /> Transporte (Embarque)
                      </span>
                      <div className="flex justify-between text-xs pt-1 text-[#17221D]">
                        <span>Ida: <strong>{item.transporteIda}</strong></span>
                        <span>Volta: <strong>{item.transporteVolta}</strong></span>
                      </div>
                    </div>

                    {/* Jogos / Quadra */}
                    <div className="bg-white p-3 rounded-xl border border-[#E2EAE5] space-y-1">
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Validação em Quadra
                      </span>
                      <p className="text-xs pt-1 text-[#17221D]">
                        Atletas com Check-in: <strong>{item.elegibilidadeQuadra}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
