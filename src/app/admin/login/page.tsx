'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck, Lock, ArrowRight, User, School } from 'lucide-react';
import { JegdStorage } from '@/lib/storage';

export default function AdminLoginPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState('admin.semed');
  const [senha, setSenha] = useState('semed2026');
  const [erro, setErro] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (senha.trim().length < 3) {
      setErro('Senha inválida.');
      return;
    }

    JegdStorage.setAdminAuth(true);
    router.push('/admin/dashboard');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#F7F9F8]">
      <div className="max-w-md w-full">
        
        <div className="bg-white border border-[#E2EAE5] rounded-3xl p-8 shadow-xs relative overflow-hidden">
          <div className="text-center mb-8">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-[#E2EAE5] bg-white flex items-center justify-center mx-auto mb-3 shadow-2xs">
              <Image 
                src="/logo-jegd.png" 
                alt="Logo JEGD" 
                width={60} 
                height={60} 
                className="object-contain" 
              />
            </div>
            <h1 className="text-2xl font-black text-[#17221D]">Painel da Coordenação</h1>
            <p className="text-xs text-[#68756E] mt-1">
              SEMED • Coordenação Geral dos Jogos Escolares (JEGD 2026)
            </p>
          </div>

          {erro && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3 mb-6">
              {erro}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#17221D] uppercase tracking-wider mb-2">
                Usuário Administrativo
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="admin.semed"
                  className="w-full px-4 py-3 pl-11 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-sm focus:outline-none focus:border-[#00A878] transition-colors"
                />
                <User className="w-4 h-4 text-[#68756E] absolute left-4 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17221D] uppercase tracking-wider mb-2">
                Senha de Acesso
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pl-11 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-sm focus:outline-none focus:border-[#00A878] transition-colors"
                />
                <Lock className="w-4 h-4 text-[#68756E] absolute left-4 top-3.5" />
              </div>
              <p className="text-[11px] text-[#68756E] mt-1.5">
                * Acesso de demonstração pré-configurado: <code>semed2026</code>
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-[#087A5B] hover:bg-[#00A878] text-white font-bold text-sm shadow-xs hover:shadow-md flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <span>Acessar Painel da SEMED</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#E2EAE5] text-center">
            <Link
              href="/escola/login"
              className="text-xs text-[#68756E] hover:text-[#00A878] inline-flex items-center gap-1.5 transition-colors font-medium"
            >
              <School className="w-3.5 h-3.5" />
              <span>Voltar para o Portal da Escola</span>
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}

