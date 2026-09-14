import React from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#E2EAE5] text-[#374151] text-sm w-full max-w-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {/* 3 Colunas Principais: Identidade, Acesso Rápido e Faixas Etárias */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 mb-8 sm:mb-10">
          
          {/* Coluna 1 - Identidade */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#E2EAE5] bg-white flex items-center justify-center shrink-0">
                <img 
                  src="/logo-jegd.png" 
                  alt="Logo JEGD" 
                  className="w-full h-full object-contain p-0.5" 
                />
              </div>
              <span className="font-black text-xl text-[#17221D] tracking-tight">
                JEGD <span className="text-[#00A878]">2026</span>
              </span>
            </div>
            <p className="text-sm text-[#4B5563] leading-relaxed font-normal">
              Sistema Oficial de Inscrições, Credenciamento e Gestão Esportiva Escolar do JEGDS 2026. SEMED • Secretaria Municipal de Educação de Gonçalves Dias - MA.
            </p>
          </div>

          {/* Coluna 2 - Acesso Rápido */}
          <div>
            <h4 className="font-black mb-3.5 text-xs uppercase tracking-wider text-[#087A5B]">
              Acesso Rápido
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-[#00A878] font-medium transition-colors">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/escola/login" className="hover:text-[#00A878] font-medium transition-colors">
                  Portal da Escola (Inscrições)
                </Link>
              </li>
              <li>
                <Link href="/modalidades" className="hover:text-[#00A878] font-medium transition-colors">
                  Modalidades & Categorias
                </Link>
              </li>
              <li>
                <Link href="/regulamento" className="hover:text-[#00A878] font-medium transition-colors">
                  Regulamento Geral 2026
                </Link>
              </li>
              <li>
                <Link href="/validar" className="hover:text-[#00A878] font-medium transition-colors">
                  Validador de Crachá / QR Code
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3 - Faixas Etárias */}
          <div>
            <h4 className="font-black mb-3.5 text-xs uppercase tracking-wider text-[#087A5B]">
              Faixas Etárias Oficiais
            </h4>
            <ul className="space-y-2.5 text-sm text-[#4B5563]">
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00A878] shrink-0"></span>
                <span><strong>Mirim:</strong> 9 a 11 anos (2015-2017)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#087A5B] shrink-0"></span>
                <span><strong>Infantil:</strong> 12 a 14 anos (2012-2014)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600 shrink-0"></span>
                <span><strong>Infanto:</strong> 15 a 17 anos (2009-2011)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0"></span>
                <span><strong>Junior:</strong> 18 a 20 anos (2006-2008)</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Linha Final com Copyright e Acesso SEMED Admin */}
        <div className="pt-6 border-t border-[#E2EAE5] flex flex-col sm:flex-row items-center justify-between gap-3.5 text-xs sm:text-sm text-[#4B5563] text-center sm:text-left">
          <p>© 2026 JEGD - Jogos Escolares de Gonçalves Dias. SEMED / Prefeitura Municipal.</p>
          <div className="flex items-center gap-3">
            <Link 
              href="/admin/login" 
              className="hover:text-[#087A5B] flex items-center gap-1.5 transition-colors font-bold text-xs text-[#087A5B] bg-[#E8F7F1] px-3 py-1.5 rounded-xl border border-[#00A878]/20"
            >
              <Shield className="w-3.5 h-3.5 text-[#00A878]" /> 
              <span>Acesso SEMED Admin</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

