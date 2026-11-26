'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  School, 
  Shield, 
  QrCode, 
  LogOut, 
  BookOpen, 
  Medal, 
  Menu, 
  X, 
  Home, 
  LogIn,
  MapPin,
  Trophy
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

  // Oculta a barra geral no portal i6 Systems e no Modo Telão Fullscreen
  if (pathname === '/portal' || pathname.startsWith('/portal') || pathname.startsWith('/eventos/telao')) {
    return null;
  }

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
  const munSlug = municipioAtual?.slug || 'goncalves-dias';

  const homeHref = munSlug === 'senador-alexandre-costa'
    ? '/jesac'
    : munSlug === 'santo-antonio-dos-lopes'
    ? '/jesal'
    : munSlug === 'goncalves-dias'
    ? '/jegd'
    : `/?m=${munSlug}`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-4">
          
          {/* COMPOSIÇÃO DA MARCA: LOGO OFICIAL + IDENTIDADE */}
          <Link href={homeHref} className="flex items-center gap-3 group shrink-0 select-none">
            {/* Logo Oficial */}
            <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-slate-200 bg-white flex items-center justify-center shrink-0 shadow-2xs group-hover:border-slate-300 transition-colors p-0.5">
              <img 
                src={municipioAtual?.brasaoUrl || municipioAtual?.logoUrl || "/logo-jegd.png"} 
                alt={`Logo Oficial ${siglaEvento}`} 
                className="w-full h-full object-contain"
              />
            </div>

            {/* Identidade Textual */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 leading-none">
                  {siglaTexto}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 leading-none">
                  {anoTexto}
                </span>
              </div>
              <p className="hidden sm:block text-[11px] font-medium text-slate-500 mt-0.5 max-w-[220px] truncate">
                {nomeEvento}
              </p>
            </div>
          </Link>

          {/* NAVEGAÇÃO CENTRAL DESKTOP (CLEAN & SUBTLE) */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Navegação Principal">
            <Link
              href={homeHref}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors ${
                pathname === homeHref || pathname === '/'
                  ? 'bg-[#0B4F35] text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Home className={`w-3.5 h-3.5 ${pathname === homeHref || pathname === '/' ? 'text-[#A7F3D0]' : 'text-slate-400'}`} aria-hidden="true" />
              <span>Início</span>
            </Link>

            <Link
              href={`/eventos?m=${munSlug}`}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors ${
                pathname.startsWith('/eventos')
                  ? 'bg-[#0B4F35] text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Trophy className={`w-3.5 h-3.5 ${pathname.startsWith('/eventos') ? 'text-[#A7F3D0]' : 'text-slate-400'}`} aria-hidden="true" />
              <span>Eventos do Dia</span>
            </Link>

            <Link
              href={`/modalidades?m=${munSlug}`}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors ${
                pathname.startsWith('/modalidades')
                  ? 'bg-[#0B4F35] text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Medal className={`w-3.5 h-3.5 ${pathname.startsWith('/modalidades') ? 'text-[#A7F3D0]' : 'text-slate-400'}`} aria-hidden="true" />
              <span>Modalidades</span>
            </Link>

            <Link
              href={`/regulamento?m=${munSlug}`}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors ${
                pathname.startsWith('/regulamento')
                  ? 'bg-[#0B4F35] text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <BookOpen className={`w-3.5 h-3.5 ${pathname.startsWith('/regulamento') ? 'text-[#A7F3D0]' : 'text-slate-400'}`} aria-hidden="true" />
              <span>Regulamento</span>
            </Link>

            <Link
              href={`/validar?m=${munSlug}`}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors ${
                pathname.startsWith('/validar')
                  ? 'bg-[#0B4F35] text-white font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <QrCode className={`w-3.5 h-3.5 ${pathname.startsWith('/validar') ? 'text-[#A7F3D0]' : 'text-slate-400'}`} aria-hidden="true" />
              <span>Crachá</span>
            </Link>

            <Link
              href="/portal"
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors ${
                pathname.startsWith('/portal')
                  ? 'bg-blue-50 text-blue-800 font-semibold border border-blue-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
              }`}
            >
              <MapPin className={`w-3.5 h-3.5 ${pathname.startsWith('/portal') ? 'text-blue-600' : 'text-slate-400'}`} aria-hidden="true" />
              <span>Municípios</span>
            </Link>
          </nav>

          {/* BOTÃO DE LOGIN / ÁREA AUTENTICADA & MENU MOBILE */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {escolaAtual ? (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/escola/dashboard"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 text-xs sm:text-sm font-semibold text-emerald-900 transition-colors"
                >
                  <School className="w-4 h-4 text-emerald-700" aria-hidden="true" />
                  <span className="max-w-[120px] sm:max-w-none truncate">{escolaAtual.sigla || escolaAtual.nome}</span>
                </Link>
                <button
                  onClick={handleLogoutEscola}
                  title="Sair da Escola"
                  aria-label="Sair da Escola"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ) : isAdmin ? (
              <div className="flex items-center gap-1.5">
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-950 text-xs sm:text-sm font-semibold transition-colors"
                >
                  <Shield className="w-4 h-4 text-amber-700" aria-hidden="true" />
                  <span>Painel SEMED</span>
                </Link>
                <button
                  onClick={handleLogoutAdmin}
                  title="Sair do Painel SEMED"
                  aria-label="Sair do Painel SEMED"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <Link
                href={`/escola/login?m=${munSlug}`}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Entrar</span>
              </Link>
            )}

            {/* Botão Hamburger Mobile */}
            <button
              onClick={() => setMenuMobileAberto(!menuMobileAberto)}
              className="md:hidden p-2 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
              aria-label={menuMobileAberto ? 'Fechar Menu de Navegação' : 'Abrir Menu de Navegação'}
            >
              {menuMobileAberto ? <X className="w-5 h-5 text-slate-700" aria-hidden="true" /> : <Menu className="w-5 h-5 text-slate-700" aria-hidden="true" />}
            </button>
          </div>

        </div>
      </div>

      {/* MENU MOBILE DROPDOWN DRAWER */}
      {menuMobileAberto && (
        <div className="md:hidden border-t border-slate-200/80 bg-white px-4 py-3 shadow-lg">
          <nav className="flex flex-col space-y-1" aria-label="Navegação Mobile">
            <Link
              href={homeHref}
              onClick={() => setMenuMobileAberto(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === homeHref || pathname === '/'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Home className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span>Início</span>
            </Link>

            <Link
              href={`/eventos?m=${munSlug}`}
              onClick={() => setMenuMobileAberto(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith('/eventos')
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Trophy className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span>Eventos do Dia & Ranking</span>
            </Link>

            <Link
              href={`/modalidades?m=${munSlug}`}
              onClick={() => setMenuMobileAberto(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith('/modalidades')
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Medal className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span>Modalidades & Regras</span>
            </Link>

            <Link
              href={`/regulamento?m=${munSlug}`}
              onClick={() => setMenuMobileAberto(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith('/regulamento')
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span>Regulamento Geral</span>
            </Link>

            <Link
              href={`/validar?m=${munSlug}`}
              onClick={() => setMenuMobileAberto(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith('/validar')
                  ? 'bg-emerald-50 text-emerald-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <QrCode className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span>Crachá Oficial & Guia</span>
            </Link>

            <Link
              href="/portal"
              onClick={() => setMenuMobileAberto(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith('/portal')
                  ? 'bg-blue-50 text-blue-800 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-4 h-4 text-blue-600" aria-hidden="true" />
              <span>Portal de Municípios</span>
            </Link>
          </nav>

          <div className="pt-2.5 mt-2 border-t border-slate-100 space-y-2">
            {!escolaAtual && !isAdmin && (
              <Link
                href={`/escola/login?m=${munSlug}`}
                onClick={() => setMenuMobileAberto(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-semibold shadow-xs"
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span>Entrar no Sistema</span>
              </Link>
            )}

            {(escolaAtual || isAdmin) && (
              <button
                onClick={escolaAtual ? handleLogoutEscola : handleLogoutAdmin}
                aria-label="Sair da Sessão"
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600 text-xs font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>Sair da Sessão</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
