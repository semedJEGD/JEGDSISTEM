'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  School, 
  ShieldCheck, 
  QrCode, 
  LogOut, 
  BookOpen, 
  Trophy, 
  Menu, 
  X, 
  Home, 
  Users, 
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { Escola, Municipio } from '@/types/jegd';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [escolaAtual, setEscolaAtual] = useState<Escola | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);
  const [municipioAtual, setMunicipioAtual] = useState<Municipio | null>(null);

  useEffect(() => {
    JegdStorage.init();
    setEscolaAtual(JegdStorage.getCurrentEscola());
    setIsAdmin(JegdStorage.isAdminAuth());
    setMunicipioAtual(JegdStorage.getCurrentMunicipio());

    const handleStorageChange = () => {
      setEscolaAtual(JegdStorage.getCurrentEscola());
      setIsAdmin(JegdStorage.isAdminAuth());
      setMunicipioAtual(JegdStorage.getCurrentMunicipio());
    };

    const handleMunicipioChange = (e: any) => {
      setMunicipioAtual(e.detail || JegdStorage.getCurrentMunicipio());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('jegd-municipio-changed', handleMunicipioChange);
    window.addEventListener('jegd-auth-changed', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('jegd-municipio-changed', handleMunicipioChange);
      window.removeEventListener('jegd-auth-changed', handleStorageChange);
    };
  }, [pathname]);

  // Fecha o menu mobile quando a rota mudar
  useEffect(() => {
    setMenuMobileAberto(false);
  }, [pathname]);

  const handleLogoutEscola = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    JegdStorage.logoutEscola();
    setEscolaAtual(null);
    setMenuMobileAberto(false);
    window.location.href = '/escola/login';
  };

  const handleLogoutAdmin = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    JegdStorage.logoutAdmin();
    setIsAdmin(false);
    setMenuMobileAberto(false);
    window.location.href = '/admin/login';
  };

  const siglaEvento = municipioAtual?.siglaEvento || 'JEGD 2026';
  const siglaPartes = siglaEvento.split(' ');
  const siglaTexto = siglaPartes[0] || 'JEGD';
  const anoTexto = siglaPartes[1] || '2026';
  const nomeEvento = municipioAtual?.nomeEvento || `Jogos Escolares de ${municipioAtual?.nome || 'Gonçalves Dias'}`;

  return (
    <header className="sticky top-0 z-50 w-full pt-2.5 sm:pt-3 px-3 sm:px-6 lg:px-8 pb-1.5 transition-all">
      <div className="max-w-7xl mx-auto">
        {/* CONTAINER DO HEADER EM PAINEL FLUTUANTE PREMIUM */}
        <div className="bg-white/98 backdrop-blur-md border border-[#E2EAE5] rounded-2xl sm:rounded-full px-3.5 sm:px-6 py-2 sm:py-2.5 shadow-[0_4px_25px_rgba(0,0,0,0.04)] flex items-center justify-between gap-3">
          
          {/* COMPOSIÇÃO DA MARCA: LOGO OFICIAL + SIGLA | ANO + SUBTÍTULO */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3.5 group shrink-0 select-none">
            {/* Logo Oficial */}
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-[#E2EAE5] bg-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-300">
              <img 
                src={municipioAtual?.logoUrl || municipioAtual?.brasaoUrl || "/logo-jegd.png"} 
                alt={`Logo Oficial ${siglaEvento}`} 
                className="w-full h-full object-contain p-0.5"
              />
            </div>

            {/* Identidade Textual */}
            <div className="flex flex-col justify-center">
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="font-black text-xl sm:text-2xl tracking-tighter text-[#0B4B88] leading-none">
                  {siglaTexto}
                </span>
                
                {/* Divisória Vertical Elegante */}
                <span className="text-slate-300 font-light text-xl sm:text-2xl leading-none select-none">
                  |
                </span>

                {/* Ano */}
                <span className="font-black text-2xl sm:text-[28px] italic tracking-tight text-[#00A878] leading-none">
                  {anoTexto}
                </span>
              </div>

              {/* Subtítulo Discreto e Institucional */}
              <p className="hidden sm:block text-[8px] sm:text-[9.5px] font-bold tracking-widest text-[#6B7280] uppercase mt-0.5 max-w-[240px] truncate">
                {nomeEvento}
              </p>
            </div>
          </Link>

          {/* NAVEGAÇÃO CENTRAL DESKTOP (CLEAN & OUTLINE) */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            <Link
              href="/"
              className={`px-3.5 py-2 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
                pathname === '/'
                  ? 'bg-[#E8F7F1] text-[#087A5B] shadow-2xs font-black'
                  : 'text-[#4B5563] hover:text-[#17221D] hover:bg-[#F7F9F8]'
              }`}
            >
              <Home className={`w-4 h-4 ${pathname === '/' ? 'text-[#00A878]' : 'text-[#6B7280]'}`} />
              <span>Início</span>
            </Link>

            <Link
              href="/modalidades"
              className={`px-3.5 py-2 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
                pathname.startsWith('/modalidades')
                  ? 'bg-[#E8F7F1] text-[#087A5B] shadow-2xs font-black'
                  : 'text-[#4B5563] hover:text-[#17221D] hover:bg-[#F7F9F8]'
              }`}
            >
              <Trophy className={`w-4 h-4 ${pathname.startsWith('/modalidades') ? 'text-[#00A878]' : 'text-[#6B7280]'}`} />
              <span>Modalidades</span>
            </Link>

            <Link
              href="/regulamento"
              className={`px-3.5 py-2 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
                pathname.startsWith('/regulamento')
                  ? 'bg-[#E8F7F1] text-[#087A5B] shadow-2xs font-black'
                  : 'text-[#4B5563] hover:text-[#17221D] hover:bg-[#F7F9F8]'
              }`}
            >
              <BookOpen className={`w-4 h-4 ${pathname.startsWith('/regulamento') ? 'text-[#00A878]' : 'text-[#6B7280]'}`} />
              <span>Regulamento</span>
            </Link>

            <Link
              href="/validar"
              className={`px-3.5 py-2 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
                pathname.startsWith('/validar')
                  ? 'bg-[#E8F7F1] text-[#087A5B] shadow-2xs font-black'
                  : 'text-[#4B5563] hover:text-[#17221D] hover:bg-[#F7F9F8]'
              }`}
            >
              <QrCode className={`w-4 h-4 ${pathname.startsWith('/validar') ? 'text-[#00A878]' : 'text-[#6B7280]'}`} />
              <span>Crachá Oficial</span>
            </Link>
          </nav>

          {/* BOTÃO DE LOGIN / ÁREA AUTENTICADA & MENU MOBILE */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {escolaAtual ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/escola/dashboard"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#E8F7F1] hover:bg-[#d8f1e7] border border-[#00A878]/30 text-xs sm:text-sm font-black text-[#087A5B] transition-all shadow-2xs"
                >
                  <School className="w-4 h-4 text-[#00A878]" />
                  <span className="max-w-[100px] sm:max-w-none truncate">{escolaAtual.sigla || 'Painel'}</span>
                </Link>
                <button
                  onClick={handleLogoutEscola}
                  title="Sair da Escola"
                  className="p-2 rounded-full bg-white hover:bg-rose-50 hover:text-rose-600 border border-[#E2EAE5] text-[#4B5563] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : isAdmin ? (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs sm:text-sm font-black shadow-xs hover:shadow-md transition-all"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Painel SEMED</span>
                </Link>
                <button
                  onClick={handleLogoutAdmin}
                  title="Sair do Painel SEMED"
                  className="p-2 rounded-full bg-white hover:bg-rose-50 hover:text-rose-600 border border-[#E2EAE5] text-[#4B5563] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/escola/login"
                className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#00A878] hover:bg-[#087A5B] text-white text-xs sm:text-[13px] font-black tracking-wide shadow-[0_2px_12px_rgba(0,168,120,0.25)] hover:shadow-[0_4px_16px_rgba(0,168,120,0.35)] transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap group/login"
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                <span>LOGIN PROFESSORES / SEMED</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/login:translate-x-0.5 transition-transform" />
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

      {/* MENU MOBILE DROPDOWN DRAWER */}
      {menuMobileAberto && (
        <div className="md:hidden max-w-7xl mx-auto mt-2">
          <div className="bg-white/98 backdrop-blur-md border border-[#E2EAE5] rounded-2xl p-4 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-1.5">
              <Link
                href="/"
                onClick={() => setMenuMobileAberto(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  pathname === '/'
                    ? 'bg-[#E8F7F1] text-[#087A5B] font-black'
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
                    ? 'bg-[#E8F7F1] text-[#087A5B] font-black'
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
                    ? 'bg-[#E8F7F1] text-[#087A5B] font-black'
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
                    ? 'bg-[#E8F7F1] text-[#087A5B] font-black'
                    : 'text-[#4B5563] hover:bg-[#F7F9F8]'
                }`}
              >
                <QrCode className="w-4 h-4 text-[#00A878]" />
                <span>Crachá Oficial & Guia</span>
              </Link>
            </nav>

            <div className="pt-3 border-t border-[#E2EAE5] space-y-2">
              {!escolaAtual && !isAdmin && (
                <Link
                  href="/escola/login"
                  onClick={() => setMenuMobileAberto(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00A878] text-white text-sm font-black shadow-xs"
                >
                  <Users className="w-4 h-4" />
                  <span>LOGIN PROFESSORES / SEMED</span>
                </Link>
              )}

              {(escolaAtual || isAdmin) && (
                <button
                  onClick={escolaAtual ? handleLogoutEscola : handleLogoutAdmin}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair da Sessão</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
