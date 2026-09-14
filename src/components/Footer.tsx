import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Phone, MapPin, Shield, ExternalLink, Trophy } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#E2EAE5] text-[#374151] text-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Coluna 1 - Identidade */}
          <div className="md:col-span-1 space-y-4">
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
              Sistema Oficial de Gestão e Inscrições dos Jogos Escolares de Gonçalves Dias - MA. Fomentando o esporte, a educação e a cidadania.
            </p>
          </div>

          {/* Coluna 2 - Acesso Rápido */}
          <div>
            <h4 className="font-black mb-4 text-xs uppercase tracking-wider text-[#087A5B]">
              Acesso Rápido
            </h4>
            <ul className="space-y-2.5 text-sm">
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
                  Consulta & Validador de Crachá
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3 - Categorias */}
          <div>
            <h4 className="font-black mb-4 text-xs uppercase tracking-wider text-[#087A5B]">
              Faixas Etárias
            </h4>
            <ul className="space-y-2.5 text-sm text-[#4B5563]">
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00A878]"></span>
                <span><strong>Mirim:</strong> 9 a 11 anos</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#087A5B]"></span>
                <span><strong>Infantil:</strong> 12 a 14 anos</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
                <span><strong>Infanto:</strong> 15 a 17 anos</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                <span><strong>Junior:</strong> 18 a 20 anos</span>
              </li>
            </ul>
          </div>

          {/* Coluna 4 - Contato e Suporte SEMED */}
          <div>
            <h4 className="font-black mb-4 text-xs uppercase tracking-wider text-[#087A5B]">
              Coordenação SEMED
            </h4>
            <div className="space-y-2.5 text-sm text-[#4B5563]">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#00A878] shrink-0 mt-0.5" />
                <span>SEMED — Secretaria Municipal de Educação / Gonçalves Dias - MA</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#00A878] shrink-0" />
                <span>jogosescolares@semed.gov.br</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#00A878] shrink-0" />
                <span>(99) 3662-1000 • Atendimento Oficial</span>
              </p>
            </div>
          </div>

        </div>

        {/* Linha Final */}
        <div className="pt-8 border-t border-[#E2EAE5] flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#4B5563]">
          <p>© 2026 JEGD - Jogos Escolares de Gonçalves Dias. SEMED / Prefeitura Municipal.</p>
          <div className="flex items-center gap-4">
            <Link href="/admin/login" className="hover:text-[#087A5B] flex items-center gap-1.5 transition-colors font-bold text-xs text-[#087A5B] bg-[#E8F7F1] px-3 py-1.5 rounded-xl border border-[#00A878]/20">
              <Shield className="w-3.5 h-3.5 text-[#00A878]" /> Acesso SEMED Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

