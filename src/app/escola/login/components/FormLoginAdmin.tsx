'use client';

import React from 'react';
import { Lock, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react';
import { Usuario } from '@/types/jegd';

interface FormLoginAdminProps {
  coordenadores: Usuario[];
  coordenadorSelecionadoId: string;
  setCoordenadorSelecionadoId: (val: string) => void;
  adminSenha: string;
  setAdminSenha: (val: string) => void;
  mostrarSenhaAdmin: boolean;
  setMostrarSenhaAdmin: (val: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  nomeMunicipio?: string;
}

export function FormLoginAdmin({
  coordenadores,
  coordenadorSelecionadoId,
  setCoordenadorSelecionadoId,
  adminSenha,
  setAdminSenha,
  mostrarSenhaAdmin,
  setMostrarSenhaAdmin,
  onSubmit,
  nomeMunicipio
}: FormLoginAdminProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-3.5">
      <div>
        <label className="block text-[11px] sm:text-xs font-bold text-[#17221D] uppercase tracking-wider mb-1">
          Coordenador Responsável ({nomeMunicipio || 'SEMED'})
        </label>
        <select
          value={coordenadorSelecionadoId}
          onChange={(e) => setCoordenadorSelecionadoId(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
        >
          {coordenadores.map((coord) => (
            <option key={coord.id} value={coord.id}>
              {coord.nome} {coord.papel === 'SUPERADMIN' ? '⭐ (SuperAdmin)' : ''}
            </option>
          ))}
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
          Acesso restrito à Coordenação SEMED de {nomeMunicipio || 'Município'}
        </p>
      </div>

      <button
        type="submit"
        className="w-full py-3 px-5 rounded-xl bg-[#087A5B] hover:bg-[#00A878] text-white font-black text-xs sm:text-sm shadow-md shadow-[#087A5B]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 mt-3"
      >
        <Shield className="w-4 h-4" />
        <span>Acessar Painel da Coordenação</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
