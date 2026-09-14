'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Trophy, School, ShieldCheck, QrCode, FileText, LogOut, UserCheck } from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { Escola } from '@/types/jegd';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [escolaAtual, setEscolaAtual] = useState<Escola | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    JegdStorage.init();
    setEscolaAtual(JegdStorage.getCurrentEscola());
    setIsAdmin(JegdStorage.isAdminAuth());

    const handleStorageChange = () => {
      setEscolaAtual(JegdStorage.getCurrentEscola());
      setIsAdmin(JegdStorage.isAdminAuth());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [pathname]);

  const handleLogoutEscola = () => {
    JegdStorage.setCurrentEscola(null);
    setEscolaAtual(null);
    router.push('/escola/login');
  };

  const handleLogoutAdmin = () => {
    JegdStorage.setAdminAuth(false);
    setIsAdmin(false);
    router.push('/admin/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo e Título */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-amber-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
              <Trophy className="w-7 h-7 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-200 to-amber-300">
                  JEGD
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  2026
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">
                Jogos Escolares • SEMED
              </p>
            </div>
          </Link>

          {/* Navegação Central */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === '/'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Início
            </Link>
            <Link
              href="/modalidades"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname.startsWith('/modalidades')
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Modalidades
            </Link>
            <Link
              href="/regulamento"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname.startsWith('/regulamento')
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              Regulamento
            </Link>
            <Link
              href="/validar"
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-all ${
                pathname.startsWith('/validar')
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <QrCode className="w-4 h-4 text-teal-400" />
              Validar Crachá
            </Link>
          </nav>

          {/* Área de Autenticação / Portais */}
          <div className="flex items-center gap-3">
            {escolaAtual ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/escola/dashboard"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium text-emerald-300 transition-colors"
                >
                  <School className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline font-semibold">{escolaAtual.sigla}</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">
                    Painel
                  </span>
                </Link>
                <button
                  onClick={handleLogoutEscola}
                  title="Sair da Escola"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/escola/login"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02]"
              >
                <School className="w-4 h-4" />
                <span>Portal da Escola</span>
              </Link>
            )}

            {isAdmin ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-semibold hover:bg-amber-500/30 transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">SEMED Admin</span>
                </Link>
                <button
                  onClick={handleLogoutAdmin}
                  title="Sair do Painel SEMED"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/admin/login"
                title="Acesso da Comissão Organizadora SEMED"
                className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-amber-300 transition-colors"
              >
                <ShieldCheck className="w-5 h-5" />
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
