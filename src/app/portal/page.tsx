'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  MapPin,
  Search,
  ArrowRight,
  ShieldCheck,
  Building2,
  Sparkles,
  Lock
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { Municipio } from '@/types/jegd';

export default function PortalMunicipiosPage() {
  const router = useRouter();
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [busca, setBusca] = useState('');

  useEffect(() => {
    JegdStorage.init();
    setMunicipios(JegdStorage.getMunicipios());
  }, []);

  const handleAcessarMunicipio = (mun: Municipio) => {
    JegdStorage.setCurrentMunicipio(mun);
    // Redireciona com o parâmetro explícito do município para bloquear qualquer acesso cruzado
    router.push(`/escola/login?m=${mun.slug}`);
  };

  const municipiosFiltrados = municipios.filter((m) =>
    m.nome.toLowerCase().includes(busca.toLowerCase()) ||
    m.uf.toLowerCase().includes(busca.toLowerCase()) ||
    (m.nomeEvento && m.nomeEvento.toLowerCase().includes(busca.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#030B17] text-white flex flex-col justify-between font-sans selection:bg-[#3B82F6] selection:text-white relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-[#1E40AF]/20 via-[#3B82F6]/15 to-[#8B5CF6]/10 blur-[130px] pointer-events-none rounded-full" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#00A878]/10 blur-[140px] pointer-events-none rounded-full" />

      {/* TOP HEADER */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#60A5FA] flex items-center justify-center shadow-lg shadow-blue-500/25">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg sm:text-xl font-black tracking-tight text-white">
            IDEB na Prática
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-semibold backdrop-blur-md">
            Plataforma Unificada
          </span>
          <Link
            href="/admin/super"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-semibold transition-colors"
          >
            <Lock className="w-3 h-3" />
            <span>SuperAdmin</span>
          </Link>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 w-full flex-1 flex flex-col items-center justify-center text-center">
        
        {/* Título Principal */}
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-4">
          Portal de Acesso aos{' '}
          <span className="bg-gradient-to-r from-[#60A5FA] via-[#818CF8] to-[#C084FC] bg-clip-text text-transparent">
            Municípios
          </span>
        </h1>

        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Selecione a sua cidade para acessar o sistema de controle escolar, diário de classe e gestão administrativa.
        </p>

        {/* Barra de Busca */}
        <div className="w-full max-w-xl mb-12 relative">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="BUSCAR MUNICÍPIO..."
            className="w-full px-5 py-3.5 pl-11 rounded-2xl bg-white/[0.04] border border-white/10 text-white text-xs sm:text-sm font-semibold tracking-wider placeholder:text-white/30 focus:outline-none focus:border-[#3B82F6] focus:bg-white/[0.07] transition-all backdrop-blur-md"
          />
          <Search className="w-4 h-4 text-white/40 absolute left-4 top-4" />
        </div>

        {/* Grid de Municípios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 w-full text-left">
          {municipiosFiltrados.map((mun) => (
            <div
              key={mun.id}
              onClick={() => handleAcessarMunicipio(mun)}
              className="group bg-[#061224]/80 hover:bg-[#0A1B36] border border-white/10 hover:border-[#3B82F6]/50 rounded-2xl sm:rounded-3xl p-6 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-blue-900/20 cursor-pointer relative overflow-hidden backdrop-blur-md flex flex-col justify-between"
            >
              {/* Glow interno no hover */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#3B82F6]/0 group-hover:bg-[#3B82F6]/10 rounded-full blur-2xl transition-all duration-500 pointer-events-none" />

              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-inner">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-white group-hover:text-blue-300 transition-colors">
                      {mun.nome}
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-black uppercase tracking-wider">
                      {mun.uf}
                    </span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-400 font-medium mb-6 line-clamp-2">
                  {mun.nomeEvento || `Secretaria Municipal de Educação de ${mun.nome}`}
                </p>
              </div>

              {/* Botão Inferior do Card */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-slate-400 group-hover:text-slate-300 transition-colors font-medium">
                  Acessar Semed Digital
                </span>
                <span className="text-blue-400 group-hover:text-blue-300 font-black flex items-center gap-1.5 transition-all group-hover:translate-x-1">
                  <span>Ir para o Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {municipiosFiltrados.length === 0 && (
          <div className="py-12 text-slate-500 text-sm">
            Nenhum município encontrado com a busca &quot;{busca}&quot;.
          </div>
        )}

      </main>

      {/* RODAPÉ */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div>
          IDEB na Prática © 2026. Todos os direitos reservados.
        </div>
        <div className="flex items-center gap-6">
          <span className="hover:text-slate-400 cursor-pointer">Termos de Uso</span>
          <span className="hover:text-slate-400 cursor-pointer">Privacidade</span>
        </div>
      </footer>

    </div>
  );
}
