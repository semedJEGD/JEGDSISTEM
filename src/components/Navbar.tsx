'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { School, ShieldCheck, QrCode, LogOut, BookOpen, Trophy } from 'lucide-react';
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2EAE5] text-[#17221D] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Oficial e Título */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#E2EAE5] shadow-xs group-hover:scale-105 transition-transform duration-300 bg-white flex items-center justify-center">
              <Image 
                src="/logo-jegd.png" 
                alt="Logo JEGD 2026" 
                width={48} 
                height={48} 
                className="object-contain"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-2xl tracking-tight text-[#087A5B]">
                  JEGD
                </span>
                <span className="bg-[#E8F7F1] text-[#087A5B] text-xs font-bold px-2 py-0.5 rounded-full border border-[#00A878]/20">
                  2026
                </span>
              </div>
              <p className="text-[11px] text-[#68756E] font-medium tracking-wide uppercase">
                Jogos Escolares de Gonçalves Dias
              </p>
            </div>
          </Link>

          {/* Navegação Central */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              href="/"
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                pathname === '/'
                  ? 'bg-[#E8F7F1] text-[#087A5B] font-bold shadow-2xs'
                  : 'text-[#68756E] hover:text-[#17221D] hover:bg-[#F7F9F8]'
              }`}
            >
              Início
            </Link>
            <Link
              href="/modalidades"
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                pathname.startsWith('/modalidades')
                  ? 'bg-[#E8F7F1] text-[#087A5B] font-bold shadow-2xs'
                  : 'text-[#68756E] hover:text-[#17221D] hover:bg-[#F7F9F8]'
              }`}
            >
              Modalidades
            </Link>
            <Link
              href="/regulamento"
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                pathname.startsWith('/regulamento')
                  ? 'bg-[#E8F7F1] text-[#087A5B] font-bold shadow-2xs'
                  : 'text-[#68756E] hover:text-[#17221D] hover:bg-[#F7F9F8]'
              }`}
            >
              Regulamento
            </Link>
            <Link
              href="/validar"
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all ${
                pathname.startsWith('/validar')
                  ? 'bg-[#E8F7F1] text-[#087A5B] font-bold shadow-2xs'
                  : 'text-[#68756E] hover:text-[#17221D] hover:bg-[#F7F9F8]'
              }`}
            >
              <QrCode className="w-4 h-4 text-[#00A878]" />
              Validar Crachá
            </Link>
          </nav>

          {/* Área de Autenticação / Portais */}
          <div className="flex items-center gap-3">
            {escolaAtual ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/escola/dashboard"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#E8F7F1] hover:bg-[#d8f1e7] border border-[#00A878]/30 text-sm font-bold text-[#087A5B] transition-all"
                >
                  <School className="w-4 h-4 text-[#00A878]" />
                  <span className="hidden sm:inline">{escolaAtual.sigla || escolaAtual.nome}</span>
                  <span className="text-xs bg-[#00A878] text-white px-2 py-0.5 rounded-full font-bold">
                    Painel
                  </span>
                </Link>
                <button
                  onClick={handleLogoutEscola}
                  title="Sair da Escola"
                  className="p-2.5 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-600 border border-[#E2EAE5] text-[#68756E] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/escola/login"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-sm font-bold shadow-xs hover:shadow-md transition-all duration-200 active:scale-98"
              >
                <School className="w-4 h-4 stroke-[2.5]" />
                <span>Portal da Escola</span>
              </Link>
            )}

            {isAdmin ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm font-bold hover:bg-amber-100 transition-all"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span className="hidden sm:inline">SEMED Admin</span>
                </Link>
                <button
                  onClick={handleLogoutAdmin}
                  title="Sair do Painel SEMED"
                  className="p-2.5 rounded-xl bg-white hover:bg-rose-50 hover:text-rose-600 border border-[#E2EAE5] text-[#68756E] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/admin/login"
                title="Acesso da Comissão Organizadora SEMED"
                className="p-2.5 rounded-xl bg-[#F7F9F8] hover:bg-[#E8F7F1] border border-[#E2EAE5] text-[#68756E] hover:text-[#087A5B] transition-colors"
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

