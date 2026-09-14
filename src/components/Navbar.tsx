'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { School, ShieldCheck, QrCode, LogOut, BookOpen, Trophy, Menu, X, Home } from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { Escola } from '@/types/jegd';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [escolaAtual, setEscolaAtual] = useState<Escola | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

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

  // Fecha o menu mobile quando a rota mudar
  useEffect(() => {
    setMenuMobileAberto(false);
  }, [pathname]);

  const handleLogoutEscola = () => {
    JegdStorage.setCurrentEscola(null);
    setEscolaAtual(null);
    setMenuMobileAberto(false);
    router.push('/escola/login');
  };

  const handleLogoutAdmin = () => {
    JegdStorage.setAdminAuth(false);
    setIsAdmin(false);
    setMenuMobileAberto(false);
    router.push('/admin/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2EAE5] text-[#17221D] shadow-xs w-full max-w-full">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          
          {/* Logo Oficial e Título */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3.5 group shrink-0 min-w-0">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-[#E2EAE5] shadow-xs group-hover:scale-105 transition-transform duration-300 bg-white flex items-center justify-center shrink-0">
              <img 
                src="/logo-jegd.png" 
                alt="Logo JEGD 2026" 
                className="w-full h-full object-contain p-0.5"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-xl sm:text-2xl tracking-tight text-[#087A5B]">
                  JEGD
                </span>
                <span className="bg-[#E8F7F1] text-[#087A5B] text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-full border border-[#00A878]/25">
                  2026
                </span>
              </div>
              <p className="hidden sm:block text-xs text-[#4B5563] font-semibold tracking-wide uppercase truncate">
                Jogos Escolares de Gonçalves Dias
              </p>
            </div>
          </Link>

          {/* Navegação Central Desktop */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              href="/"
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                pathname === '/'
                  ? 'bg-[#E8F7F1] text-[#087A5B] shadow-2xs'
                  : 'text-[#4B5563] hover:text-[#17221D] hover:bg-[#F7F9F8]'
              }`}
            >
              Início
            </Link>
            <Link
              href="/modalidades"
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                pathname.startsWith('/modalidades')
                  ? 'bg-[#E8F7F1] text-[#087A5B] shadow-2xs'
                  : 'text-[#4B5563] hover:text-[#17221D] hover:bg-[#F7F9F8]'
              }`}
            >
              Modalidades
            </Link>
            <Link
              href="/regulamento"
              className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                pathname.startsWith('/regulamento')
                  ? 'bg-[#E8F7F1] text-[#087A5B] shadow-2xs'
                  : 'text-[#4B5563] hover:text-[#17221D] hover:bg-[#F7F9F8]'
              }`}
            >
              Regulamento
            </Link>
            <Link
              href="/validar"
              className={`px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all ${
                pathname.startsWith('/validar')
                  ? 'bg-[#E8F7F1] text-[#087A5B] shadow-2xs'
                  : 'text-[#4B5563] hover:text-[#17221D] hover:bg-[#F7F9F8]'
              }`}
            >
              <QrCode className="w-4 h-4 text-[#00A878]" />
              Crachá & Controle
            </Link>
          </nav>

          {/* Área de Acesso Rápido / Portais & Hamburger Mobile */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {escolaAtual ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/escola/dashboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-[#E8F7F1] hover:bg-[#d8f1e7] border border-[#00A878]/30 text-xs sm:text-sm font-bold text-[#087A5B] transition-all"
                >
                  <School className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00A878]" />
                  <span className="max-w-[70px] sm:max-w-none truncate">{escolaAtual.sigla || 'Painel'}</span>
                </Link>
                <button
                  onClick={handleLogoutEscola}
                  title="Sair da Escola"
                  className="p-1.5 sm:p-2 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-600 border border-[#E2EAE5] text-[#4B5563] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            ) : isAdmin ? (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Painel SEMED</span>
                </Link>
                <button
                  onClick={handleLogoutAdmin}
                  title="Sair do Painel SEMED"
                  className="p-2 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-600 border border-[#E2EAE5] text-[#4B5563] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/escola/login"
                className="flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs sm:text-sm font-black tracking-wide shadow-xs hover:shadow-md transition-all active:scale-95 whitespace-nowrap"
              >
                <School className="w-4 h-4 stroke-[2.5]" />
                <span>LOGIN PROFESSORES / SEMED</span>
              </Link>
            )}

            {/* Botão Hamburger Mobile */}
            <button
              onClick={() => setMenuMobileAberto(!menuMobileAberto)}
              className="md:hidden p-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] hover:bg-[#E8F7F1] transition-colors flex items-center justify-center"
              aria-label="Abrir Menu de Navegação"
            >
              {menuMobileAberto ? <X className="w-5 h-5 text-[#087A5B]" /> : <Menu className="w-5 h-5 text-[#17221D]" />}
            </button>
          </div>

        </div>
      </div>

      {/* Menu Mobile Dropdown Drawer */}
      {menuMobileAberto && (
        <div className="md:hidden bg-white border-b border-[#E2EAE5] px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-1.5">
            <Link
              href="/"
              onClick={() => setMenuMobileAberto(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                pathname === '/'
                  ? 'bg-[#E8F7F1] text-[#087A5B]'
                  : 'text-[#4B5563] hover:bg-[#F7F9F8]'
              }`}
            >
              <Home className="w-4 h-4 text-[#00A878]" />
              <span>Início</span>
            </Link>

            <Link
              href="/modalidades"
              onClick={() => setMenuMobileAberto(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                pathname.startsWith('/modalidades')
                  ? 'bg-[#E8F7F1] text-[#087A5B]'
                  : 'text-[#4B5563] hover:bg-[#F7F9F8]'
              }`}
            >
              <Trophy className="w-4 h-4 text-[#00A878]" />
              <span>Modalidades & Regras</span>
            </Link>

            <Link
              href="/regulamento"
              onClick={() => setMenuMobileAberto(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                pathname.startsWith('/regulamento')
                  ? 'bg-[#E8F7F1] text-[#087A5B]'
                  : 'text-[#4B5563] hover:bg-[#F7F9F8]'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#00A878]" />
              <span>Regulamento Geral</span>
            </Link>

            <Link
              href="/validar"
              onClick={() => setMenuMobileAberto(false)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                pathname.startsWith('/validar')
                  ? 'bg-[#E8F7F1] text-[#087A5B]'
                  : 'text-[#4B5563] hover:bg-[#F7F9F8]'
              }`}
            >
              <QrCode className="w-4 h-4 text-[#00A878]" />
              <span>Crachá & Controle Logístico</span>
            </Link>
          </nav>

          <div className="pt-3 border-t border-[#E2EAE5] space-y-2">
            {!escolaAtual && !isAdmin && (
              <Link
                href="/escola/login"
                onClick={() => setMenuMobileAberto(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00A878] text-white text-sm font-black shadow-xs"
              >
                <School className="w-4 h-4" />
                <span>LOGIN PROFESSORES / SEMED</span>
              </Link>
            )}

            {isAdmin && (
              <div className="flex items-center justify-between p-2 rounded-xl bg-amber-50 border border-amber-200">
                <Link
                  href="/admin/dashboard"
                  onClick={() => setMenuMobileAberto(false)}
                  className="flex items-center gap-2 text-xs font-bold text-amber-900"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Painel Admin SEMED</span>
                </Link>
                <button
                  onClick={handleLogoutAdmin}
                  className="text-xs text-rose-600 font-bold px-2 py-1 bg-white rounded-lg border border-rose-200"
                >
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

