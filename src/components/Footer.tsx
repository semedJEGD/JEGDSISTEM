import React from 'react';
import Link from 'next/link';
import { Trophy, Mail, Phone, MapPin, Shield, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          
          {/* Coluna 1 - Identidade */}
          <div className="md:col-span-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-amber-400 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-slate-950 font-bold" />
              </div>
              <span className="font-extrabold text-xl text-white tracking-wider">
                JEGD <span className="text-emerald-400">2026</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sistema Oficial de Gestão e Inscrições dos Jogos Escolares. Fomentando a cidadania, disciplina e talentos do esporte escolar.
            </p>
          </div>

          {/* Coluna 2 - Acesso Rápido */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-xs uppercase tracking-wider text-emerald-400">
              Acesso Rápido
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/escola/login" className="hover:text-white transition-colors">
                  Portal da Escola (Inscrições)
                </Link>
              </li>
              <li>
                <Link href="/modalidades" className="hover:text-white transition-colors">
                  Modalidades & Categorias
                </Link>
              </li>
              <li>
                <Link href="/regulamento" className="hover:text-white transition-colors">
                  Regulamento Geral 2026
                </Link>
              </li>
              <li>
                <Link href="/validar" className="hover:text-white transition-colors">
                  Consulta & Validador de Crachá
                </Link>
              </li>
            </ul>
          </div>

          {/* Coluna 3 - Categorias */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-xs uppercase tracking-wider text-emerald-400">
              Faixas Etárias
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span><strong>Infantil:</strong> 12 a 14 anos (2012 - 2014)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span><strong>Infanto:</strong> 15 a 17 anos (2009 - 2011)</span>
              </li>
              <li className="pt-2 text-[11px] text-slate-500">
                Redes: Municipal, Estadual, Particular e Federal.
              </li>
            </ul>
          </div>

          {/* Coluna 4 - Contato e Suporte SEMED */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-xs uppercase tracking-wider text-emerald-400">
              Coordenação Geral
            </h4>
            <div className="space-y-2 text-xs">
              <p className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>SEMED - Secretaria Municipal de Educação / Setor de Desporto</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>jogosescolares@semed.gov.br</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>(98) 3214-9000 • Ramal 204</span>
              </p>
            </div>
          </div>

        </div>

        {/* Linha Final */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 JEGD - Jogos Escolares. Todos os direitos reservados. SEMED.</p>
          <div className="flex items-center gap-4">
            <Link href="/admin/login" className="hover:text-amber-400 flex items-center gap-1 transition-colors">
              <Shield className="w-3.5 h-3.5" /> Acesso Administrativo
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
