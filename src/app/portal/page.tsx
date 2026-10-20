'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MapPin,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Shield,
  Search
} from 'lucide-react';
import { JegdStorage, MUNICIPIOS_INICIAIS } from '@/lib/storage';
import { Municipio } from '@/types/jegd';

export default function PortalMunicipiosPage() {
  const router = useRouter();
  const [municipios, setMunicipios] = useState<Municipio[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        JegdStorage.init();
        return JegdStorage.getMunicipios();
      } catch {}
    }
    return MUNICIPIOS_INICIAIS;
  });
  const [busca, setBusca] = useState('');
  const [modalLoginDireto, setModalLoginDireto] = useState(false);

  useEffect(() => {
    JegdStorage.init();
    setMunicipios(JegdStorage.getMunicipios());
  }, []);

  /**
   * Mecanismo de Isolamento Estrito Multi-tenant:
   * 1. Limpa todas as sessões anteriores (escola, comissão, admin) para evitar qualquer contaminação entre cidades.
   * 2. Grava o município selecionado como tenant ativo no JegdStorage.
   * 3. Redireciona com o parâmetro explícito (?m=slug) travando o domínio.
   */
  const handleAcessarMunicipio = (mun: Municipio) => {
    JegdStorage.logoutAll();
    JegdStorage.setCurrentMunicipio(mun);
    if (mun.slug === 'goncalves-dias') {
      router.push('/jegd');
    } else if (mun.slug === 'senador-alexandre-costa') {
      router.push('/jesac');
    } else if (mun.slug === 'santo-antonio-dos-lopes') {
      router.push('/jesal');
    } else {
      router.push(`/cidade/${mun.slug}`);
    }
  };

  // Separa as duas partições prioritárias solicitadas: JEGDS e JESAC
  const munGoncalvesDias = municipios.find(m => m.slug === 'goncalves-dias' || m.id === 'goncalves-dias-ma') || MUNICIPIOS_INICIAIS[0];
  const munSenadorAlexandre = municipios.find(m => m.slug === 'senador-alexandre-costa' || m.id === 'senador-alexandre-costa-ma') || MUNICIPIOS_INICIAIS.find(m => m.slug === 'senador-alexandre-costa');
  const munSantoAntonio = municipios.find(m => m.slug === 'santo-antonio-dos-lopes' || m.id === 'santo-antonio-dos-lopes-ma');

  const municipiosFiltrados = busca.trim()
    ? municipios.filter(m =>
        m.nome.toLowerCase().includes(busca.toLowerCase()) ||
        m.uf.toLowerCase().includes(busca.toLowerCase()) ||
        (m.siglaEvento && m.siglaEvento.toLowerCase().includes(busca.toLowerCase())) ||
        (m.nomeEvento && m.nomeEvento.toLowerCase().includes(busca.toLowerCase()))
      )
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F0F6FF] via-[#F8FAFC] to-white text-slate-900 flex flex-col justify-between font-sans selection:bg-[#2563EB] selection:text-white relative">
      
      {/* Luzes Suaves de Fundo (Aura Celeste) */}
      <div className="absolute top-0 left-0 w-[500px] h-[350px] bg-blue-200/30 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-0 right-0 w-[500px] h-[350px] bg-indigo-100/40 blur-[140px] pointer-events-none rounded-full" />

      {/* ============================================================== */}
      {/* HEADER SUPERIOR IDÊNTICO À IDENTIDADE i6 SYSTEMS               */}
      {/* ============================================================== */}
      <header className="relative z-20 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        
        {/* Lado Esquerdo: Logo Circular i6 + Título SGJE + Tag i6 SYSTEMS */}
        <div className="flex items-center gap-3 sm:gap-3.5">
          {/* Logo Circular i6 Systems */}
          <div className="w-10 h-10 rounded-full border border-slate-200 bg-white flex items-center justify-center shadow-xs shrink-0 p-1">
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900" fill="currentColor">
              <circle cx="50" cy="50" r="46" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="2" />
              <text x="35" y="58" fontSize="28" fontWeight="900" fill="#0F172A" fontFamily="sans-serif">i</text>
              <text x="47" y="58" fontSize="28" fontWeight="900" fill="#2563EB" fontFamily="sans-serif">6</text>
              <text x="28" y="73" fontSize="8.5" fontWeight="800" letterSpacing="2" fill="#64748B" fontFamily="sans-serif">SYSTEMS</text>
            </svg>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                SGJE
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#2563EB] text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider shadow-xs">
                i6 SYSTEMS
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-tight mt-0.5">
              Plataforma de Gestão Integrada para Municípios
            </span>
          </div>
        </div>

        {/* Lado Direito: Botão Login Direto */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setModalLoginDireto(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold tracking-wide shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <span>Login Direto</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* CONTEÚDO CENTRAL: HERO & CARDS DAS CIDADES                     */}
      {/* ============================================================== */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 w-full flex-1 flex flex-col items-center">
        
        {/* TÍTULO HERO CENTRAL */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-14">
          <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-black text-[#0F172A] tracking-tight leading-[1.15] mb-4">
            Portal SGJE de Acesso aos{' '}
            <span className="text-[#2563EB] block sm:inline">
              Municípios
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-500 max-w-2xl mx-auto leading-relaxed font-normal">
            Selecione a sua cidade para acessar o ambiente institucional do SGJE, com dados completamente isolados, protocolos dedicados e segurança de ponta.
          </p>
        </div>

        {/* ============================================================== */}
        {/* GRADE DE CARDS (INSPIRAÇÃO IDENTICA À REFERÊNCIA DO AVAEE)    */}
        {/* ============================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7 w-full max-w-6xl mx-auto">
          
          {/* ------------------------------------------------------------ */}
          {/* CARD 1: GONÇALVES DIAS (JEGDS)                               */}
          {/* ------------------------------------------------------------ */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-blue-100 shadow-[0_10px_35px_rgba(37,99,235,0.05)] hover:shadow-[0_20px_45px_rgba(37,99,235,0.12)] hover:border-blue-300 transition-all duration-300 flex flex-col justify-between">
            <div>
              {/* Topo do Card: Logo Prefeitura + Badge Módulo */}
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="h-14 px-3.5 py-1.5 rounded-2xl border border-slate-100 bg-[#F8FAFC] flex items-center justify-center shadow-2xs">
                  <img
                    src="/logos/prefeitura-goncalves-dias.png"
                    alt="Prefeitura Municipal de Gonçalves Dias"
                    className="h-10 sm:h-11 w-auto max-w-[170px] object-contain"
                  />
                </div>

                <div className="px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] text-[10px] font-black uppercase tracking-wider shrink-0">
                  MÓDULO JEGDS
                </div>
              </div>

              {/* Título & Cidade */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Gonçalves Dias
                  </h2>
                  <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 font-bold text-[10px] uppercase">
                    MA
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                  <span>Secretaria de Educação (SEMED)</span>
                </div>
              </div>

              {/* Descrição Institucional */}
              <p className="text-xs text-slate-500 leading-relaxed mb-6 font-normal">
                Jogos Escolares de Gonçalves Dias (JEGDS 2026). Sistema oficial de credenciamento esportivo, inscrições das escolas, emissão de crachás com QR Code antifraude e controle logístico.
              </p>

              {/* Seção Fluxos & Especialidades */}
              <div className="mb-6">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2.5">
                  FLUXOS &amp; RECURSOS:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700">
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#F8FAFC] border border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                    <span className="truncate">Inscrição Escolar...</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#F8FAFC] border border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                    <span className="truncate">Coordenação C...</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#F8FAFC] border border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                    <span className="truncate">Crachá QR Code...</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#F8FAFC] border border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                    <span className="truncate">Equipe de Apoi...</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botão de Ação */}
            <button
              onClick={() => handleAcessarMunicipio(munGoncalvesDias)}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-black flex items-center justify-between shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition-all group active:scale-[0.98]"
            >
              <span>Acessar Módulo JEGDS</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* CARD 2: SENADOR ALEXANDRE COSTA (JESAC) - PARTIÇÃO DESTAQUE */}
          {/* ------------------------------------------------------------ */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-blue-100 shadow-[0_10px_35px_rgba(37,99,235,0.05)] hover:shadow-[0_20px_45px_rgba(37,99,235,0.12)] hover:border-blue-300 transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
            
            {/* Tag de Destaque Oficial */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/10 via-transparent to-transparent pointer-events-none rounded-tr-3xl" />

            <div>
              {/* Topo do Card: Logo Prefeitura + Badge Módulo */}
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="h-14 px-3.5 py-1.5 rounded-2xl border border-slate-100 bg-[#F8FAFC] flex items-center justify-center gap-2.5 shadow-2xs">
                  <img
                    src="/logos/brasao-senador-alexandre-costa.png"
                    alt="Brasão Oficial de Senador Alexandre Costa"
                    className="h-11 sm:h-12 w-auto object-contain shrink-0"
                  />
                  <div className="flex flex-col text-left leading-none pr-1">
                    <span className="text-[8px] font-black uppercase text-emerald-600 tracking-wider">PREFEITURA DE</span>
                    <span className="text-[10px] font-black uppercase text-slate-800 tracking-tight mt-0.5">SEN. ALEXANDRE COSTA</span>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] text-[10px] font-black uppercase tracking-wider shrink-0">
                  MÓDULO JESAC
                </div>
              </div>

              {/* Título & Cidade */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Senador Alexandre Costa
                  </h2>
                  <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 font-bold text-[10px] uppercase">
                    MA
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                  <span>Secretaria de Educação (SEMED)</span>
                </div>
              </div>

              {/* Descrição Institucional */}
              <p className="text-xs text-slate-500 leading-relaxed mb-6 font-normal">
                Jogos Escolares de Senador Alexandre Costa (JESAC 2026). Ambiente municipal isolado com cadastro de escolas públicas e estaduais, validação biométrica de atletas e gestão de modalidades.
              </p>

              {/* Seção Fluxos & Especialidades */}
              <div className="mb-6">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2.5">
                  FLUXOS &amp; RECURSOS:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700">
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#F8FAFC] border border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                    <span className="truncate">Inscrição Escolar...</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#F8FAFC] border border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                    <span className="truncate">Coordenação C...</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#F8FAFC] border border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                    <span className="truncate">Crachá QR Code...</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#F8FAFC] border border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
                    <span className="truncate">Equipe de Apoi...</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botão de Ação */}
            {munSenadorAlexandre && (
              <button
                onClick={() => handleAcessarMunicipio(munSenadorAlexandre)}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs sm:text-sm font-black flex items-center justify-between shadow-lg shadow-blue-500/20 hover:shadow-blue-500/35 transition-all group active:scale-[0.98]"
              >
                <span>Acessar Módulo JESAC</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            )}
          </div>

          {/* ------------------------------------------------------------ */}
          {/* CARD 3: SANTO ANTÔNIO DOS LOPES (JESAL)                      */}
          {/* ------------------------------------------------------------ */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-blue-100 shadow-[0_10px_35px_rgba(37,99,235,0.05)] hover:shadow-[0_20px_45px_rgba(37,99,235,0.12)] hover:border-blue-300 transition-all duration-300 flex flex-col justify-between">
            <div>
              {/* Topo do Card: Logo Prefeitura + Badge Módulo */}
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="h-14 px-3.5 py-1.5 rounded-2xl border border-slate-100 bg-[#F8FAFC] flex items-center justify-center shadow-2xs">
                  <img
                    src="/logos/prefeitura-santo-antonio-dos-lopes.png"
                    alt="Prefeitura Municipal de Santo Antônio dos Lopes"
                    className="h-10 sm:h-11 w-auto max-w-[180px] object-contain"
                  />
                </div>

                <div className="px-3 py-1 rounded-full bg-[#E0F2FE] border border-[#BAE6FD] text-[#0284C7] text-[10px] font-black uppercase tracking-wider shrink-0">
                  MÓDULO JESAL
                </div>
              </div>

              {/* Título & Cidade */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Santo Antônio dos Lopes
                  </h2>
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 font-bold text-[10px] uppercase">
                    MA
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                  <span>Secretaria de Educação (SEMED)</span>
                </div>
              </div>

              {/* Descrição Institucional */}
              <p className="text-xs text-slate-500 leading-relaxed mb-6 font-normal">
                Jogos Escolares de Santo Antônio dos Lopes (JESAL 2026). Linha de controle esportivo, registro de comissão técnica, crachá inteligente e súmulas de quadra.
              </p>

              {/* Seção Fluxos & Especialidades */}
              <div className="mb-6">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2.5">
                  FLUXOS &amp; RECURSOS:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-700">
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#F8FAFC] border border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                    <span className="truncate">Inscrição Escolar...</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#F8FAFC] border border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                    <span className="truncate">Coordenação C...</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#F8FAFC] border border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                    <span className="truncate">Crachá QR Code...</span>
                  </div>
                  <div className="flex items-center gap-1.5 p-2 rounded-xl bg-[#F8FAFC] border border-slate-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0284C7] shrink-0" />
                    <span className="truncate">Equipe de Apoi...</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botão de Ação */}
            {munSantoAntonio && (
              <button
                onClick={() => handleAcessarMunicipio(munSantoAntonio)}
                className="w-full py-3.5 px-5 rounded-2xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs sm:text-sm font-black flex items-center justify-between shadow-lg shadow-sky-500/20 hover:shadow-sky-500/35 transition-all group active:scale-[0.98]"
              >
                <span>Acessar Módulo JESAL</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            )}
          </div>

        </div>

        {/* ============================================================== */}
        {/* BUSCA & OUTROS MUNICÍPIOS PARCEIROS DA REDE                   */}
        {/* ============================================================== */}
        <div className="mt-14 w-full max-w-2xl mx-auto text-center">
          <div className="relative mb-6">
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="PESQUISAR OUTRO MUNICÍPIO..."
              className="w-full px-5 py-3.5 pl-11 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs sm:text-sm font-semibold tracking-wider placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB] focus:ring-4 focus:ring-blue-100 transition-all shadow-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-4" />
          </div>

          {/* Resultados de Busca */}
          {busca.trim() !== '' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-lg text-left space-y-2 mb-6 animate-in fade-in-50">
              {municipiosFiltrados.map((m) => (
                <div
                  key={m.id}
                  onClick={() => handleAcessarMunicipio(m)}
                  className="p-3 rounded-xl hover:bg-blue-50/80 border border-transparent hover:border-blue-200 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs shrink-0 overflow-hidden p-0.5">
                      {m.brasaoUrl ? (
                        <img src={m.brasaoUrl} alt={m.nome} className="w-full h-full object-contain" />
                      ) : (
                        m.sigla || 'MUN'
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{m.nome} - {m.uf}</div>
                      <div className="text-xs text-slate-500">{m.siglaEvento || m.nomeEvento}</div>
                    </div>
                  </div>
                  <span className="text-blue-600 font-bold text-xs flex items-center gap-1">
                    <span>Acessar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              ))}
              {municipiosFiltrados.length === 0 && (
                <div className="text-xs text-slate-400 text-center py-4">
                  Nenhum município localizado com o termo &quot;{busca}&quot;.
                </div>
              )}
            </div>
          )}

          {/* Destaque de Segurança Multi-tenant */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/80 border border-blue-200/60 text-blue-700 text-xs font-semibold">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Multi-tenant com isolamento físico de dados, credenciais dedicadas e segurança de ponta.</span>
          </div>
        </div>

      </main>

      {/* ============================================================== */}
      {/* MODAL DE LOGIN DIRETO                                          */}
      {/* ============================================================== */}
      {modalLoginDireto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-2xl relative">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              Acesso Direto ao Sistema
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Escolha para qual cidade deseja direcionar o seu acesso seguro:
            </p>

            <div className="space-y-2.5 mb-6">
              {municipios.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setModalLoginDireto(false); handleAcessarMunicipio(m); }}
                  className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/60 text-left flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 group-hover:border-blue-400 text-slate-700 flex items-center justify-center font-black text-xs transition-colors shrink-0 overflow-hidden p-1">
                      {m.brasaoUrl ? (
                        <img src={m.brasaoUrl} alt={m.nome} className="w-full h-full object-contain" />
                      ) : (
                        m.sigla || 'MUN'
                      )}
                    </div>
                    <div>
                      <div className="font-black text-xs sm:text-sm text-slate-900">{m.nome} - {m.uf}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{m.siglaEvento}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>

            <button
              onClick={() => setModalLoginDireto(false)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* RODAPÉ INFERIOR IDÊNTICO À REFERÊNCIA DO PRODUTO               */}
      {/* ============================================================== */}
      <footer className="relative z-10 w-full bg-white border-t border-slate-200/80 px-6 sm:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        
        {/* Lado Esquerdo: i6 Systems */}
        <div className="flex items-center gap-2 font-bold text-slate-700">
          <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-[10px] font-black text-blue-600">
            i6
          </div>
          <span>i6 SYSTEMS</span>
          <span className="text-slate-400 font-normal">• Soluções em Software</span>
        </div>

        {/* Lado Direito: Direitos & Produto */}
        <div className="text-center sm:text-right text-[11px] text-slate-400 font-medium">
          © 2026 SGJE • Sistema de Gestão de Jogos Escolares. Todos os direitos reservados.
        </div>
      </footer>

    </div>
  );
}
