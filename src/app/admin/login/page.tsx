'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-400"></div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/10">
              <ShieldCheck className="w-8 h-8 stroke-[2.2]" />
            </div>
            <h1 className="text-2xl font-black text-white">Painel da Coordenação</h1>
            <p className="text-xs text-slate-400 mt-1">
              SEMED • Coordenação Geral dos Jogos Escolares (JEGD)
            </p>
          </div>

          {erro && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl p-3 mb-6">
              {erro}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Usuário Administrativo
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="admin.semed"
                  className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Senha de Acesso
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                * Acesso padrão de demonstração pré-configurado.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <span>Acessar Painel da SEMED</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <Link
              href="/escola/login"
              className="text-xs text-slate-400 hover:text-emerald-400 inline-flex items-center gap-1.5 transition-colors"
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
