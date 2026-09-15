'use client';

import React from 'react';
import { Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

interface FormLoginAdminProps {
  adminCoordenador: 'ELIAS_VELOSO' | 'HERBERT_SA';
  setAdminCoordenador: (val: 'ELIAS_VELOSO' | 'HERBERT_SA') => void;
  adminSenha: string;
  setAdminSenha: (val: string) => void;
  mostrarSenhaAdmin: boolean;
  setMostrarSenhaAdmin: (val: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function FormLoginAdmin({
  adminCoordenador,
  setAdminCoordenador,
  adminSenha,
  setAdminSenha,
  mostrarSenhaAdmin,
  setMostrarSenhaAdmin,
  onSubmit
}: FormLoginAdminProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      <div>
        <label className="block text-[11px] sm:text-xs font-bold text-[#17221D] uppercase tracking-wider mb-1">
          Coordenador Responsável
        </label>
        <select
          value={adminCoordenador}
          onChange={(e) => setAdminCoordenador(e.target.value as any)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
        >
          <option value="ELIAS_VELOSO">Elias Veloso (SEMED)</option>
          <option value="HERBERT_SA">Herbert de Sá (SEMED)</option>
        </select>
      </div>

      <div>
        <label className="block text-[11px] sm:text-xs font-bold text-[#17221D] uppercase tracking-wider mb-1">
          Senha da Coordenação
        </label>
        <div className="relative">
          <input
            type={mostrarSenhaAdmin ? 'text' : 'password'}
            required
            maxLength={30}
            value={adminSenha}
            onChange={(e) => setAdminSenha(e.target.value.toLowerCase())}
            placeholder="Digite a senha institucional"
            className="w-full px-3.5 py-2.5 pl-9 pr-9 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
          />
          <Lock className="w-3.5 h-3.5 text-[#4B5563] absolute left-3 top-3" />
          <button
            type="button"
            onClick={() => setMostrarSenhaAdmin(!mostrarSenhaAdmin)}
            className="absolute right-3 top-3 text-[#4B5563] hover:text-[#17221D]"
          >
            {mostrarSenhaAdmin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-[10px] text-[#4B5563] mt-1 font-medium">
          Acesso restrito à Coordenação Geral SEMED
        </p>
      </div>

      <button
        type="submit"
        className="w-full py-3 px-5 rounded-xl bg-[#087A5B] hover:bg-[#00A878] text-white font-black text-xs sm:text-sm shadow-md shadow-[#087A5B]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 mt-3"
      >
        <span>Acessar Painel da Coordenação</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
