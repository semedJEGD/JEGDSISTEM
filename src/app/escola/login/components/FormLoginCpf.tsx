'use client';

import React from 'react';
import { CreditCard, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

interface FormLoginCpfProps {
  loginCpf: string;
  setLoginCpf: (val: string) => void;
  loginSenha: string;
  setLoginSenha: (val: string) => void;
  mostrarSenhaLogin: boolean;
  setMostrarSenhaLogin: (val: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onAlternarModoCadastro: () => void;
}

export function FormLoginCpf({
  loginCpf,
  setLoginCpf,
  loginSenha,
  setLoginSenha,
  mostrarSenhaLogin,
  setMostrarSenhaLogin,
  onSubmit,
  onAlternarModoCadastro
}: FormLoginCpfProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-3 sm:space-y-3.5">
      <div>
        <label className="block text-[11px] sm:text-xs font-bold text-[#17221D] uppercase tracking-wider mb-1">
          CPF do Professor
        </label>
        <div className="relative">
          <input
            type="text"
            required
            maxLength={14}
            value={loginCpf}
            onChange={(e) => setLoginCpf(e.target.value)}
            placeholder="000.000.000-00"
            className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors tracking-wider"
          />
          <CreditCard className="w-3.5 h-3.5 text-[#4B5563] absolute left-3 top-3" />
        </div>
        <p className="text-[10px] text-[#4B5563] mt-1 font-medium">
          O sistema identifica automaticamente sua escola através do CPF.
        </p>
      </div>

      <div>
        <label className="block text-[11px] sm:text-xs font-bold text-[#17221D] uppercase tracking-wider mb-1">
          Senha de Acesso
        </label>
        <div className="relative">
          <input
            type={mostrarSenhaLogin ? 'text' : 'password'}
            required
            maxLength={30}
            value={loginSenha}
            onChange={(e) => setLoginSenha(e.target.value)}
            placeholder="Digite sua senha"
            className="w-full px-3.5 py-2.5 pl-9 pr-9 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
          />
          <Lock className="w-3.5 h-3.5 text-[#4B5563] absolute left-3 top-3" />
          <button
            type="button"
            onClick={() => setMostrarSenhaLogin(!mostrarSenhaLogin)}
            className="absolute right-3 top-3 text-[#4B5563] hover:text-[#17221D]"
          >
            {mostrarSenhaLogin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3 px-5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-black text-xs sm:text-sm shadow-md shadow-[#00A878]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 mt-4"
      >
        <span>Entrar no Painel da Escola</span>
        <ArrowRight className="w-4 h-4" />
      </button>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onAlternarModoCadastro}
          className="text-xs text-[#00A878] font-bold hover:underline"
        >
          Ainda não tem cadastro? Clique aqui para o primeiro acesso
        </button>
      </div>
    </form>
  );
}
