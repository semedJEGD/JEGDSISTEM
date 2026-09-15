'use client';

import React from 'react';
import { User, CreditCard, Phone, KeyRound, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Escola } from '@/types/jegd';

interface FormCadastroProfessorProps {
  cadNome: string;
  setCadNome: (val: string) => void;
  cadCpf: string;
  setCadCpf: (val: string) => void;
  cadTelefone: string;
  setCadTelefone: (val: string) => void;
  cadEscolaId: string;
  onSelecionarEscola: (id: string) => void;
  escolas: Escola[];
  cadSenha: string;
  setCadSenha: (val: string) => void;
  mostrarSenhaCad: boolean;
  setMostrarSenhaCad: (val: boolean) => void;
  sugestaoSenha?: string;
  onSubmit: (e: React.FormEvent) => void;
}

export function FormCadastroProfessor({
  cadNome,
  setCadNome,
  cadCpf,
  setCadCpf,
  cadTelefone,
  setCadTelefone,
  cadEscolaId,
  onSelecionarEscola,
  escolas,
  cadSenha,
  setCadSenha,
  mostrarSenhaCad,
  setMostrarSenhaCad,
  sugestaoSenha,
  onSubmit
}: FormCadastroProfessorProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-[11px] sm:text-xs font-bold text-[#17221D] uppercase tracking-wider mb-1">
          1. Nome Completo do Professor
        </label>
        <div className="relative">
          <input
            type="text"
            required
            value={cadNome}
            onChange={(e) => setCadNome(e.target.value)}
            placeholder="Ex: Prof. Marcos Silva"
            className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
          />
          <User className="w-3.5 h-3.5 text-[#4B5563] absolute left-3 top-3" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[11px] sm:text-xs font-bold text-[#17221D] uppercase tracking-wider mb-1">
            2. CPF (Login Único)
          </label>
          <div className="relative">
            <input
              type="text"
              required
              maxLength={14}
              value={cadCpf}
              onChange={(e) => setCadCpf(e.target.value)}
              placeholder="000.000.000-00"
              className="w-full px-3 py-2.5 pl-8 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
            />
            <CreditCard className="w-3.5 h-3.5 text-[#4B5563] absolute left-2.5 top-3" />
          </div>
        </div>

        <div>
          <label className="block text-[11px] sm:text-xs font-bold text-[#17221D] uppercase tracking-wider mb-1">
            3. WhatsApp
          </label>
          <div className="relative">
            <input
              type="text"
              value={cadTelefone}
              onChange={(e) => setCadTelefone(e.target.value)}
              placeholder="(99) 98888-0000"
              className="w-full px-3 py-2.5 pl-8 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
            />
            <Phone className="w-3.5 h-3.5 text-[#4B5563] absolute left-2.5 top-3" />
          </div>
        </div>
      </div>

      {/* SELEÇÃO DA ESCOLA COM DESTAQUE */}
      <div>
        <label className="block text-[11px] sm:text-xs font-bold text-[#17221D] uppercase tracking-wider mb-1">
          4. Selecione a sua Escola
        </label>
        <select
          value={cadEscolaId}
          onChange={(e) => onSelecionarEscola(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors cursor-pointer"
        >
          {escolas.map((esc) => (
            <option key={esc.id} value={esc.id}>
              {esc.nome} — Rede {esc.rede === 'ESTADUAL' ? 'Estadual' : 'Municipal'}
            </option>
          ))}
        </select>
      </div>

      {/* SENHA DE ACESSO */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[11px] sm:text-xs font-bold text-[#17221D] uppercase tracking-wider">
            5. Senha de Acesso
          </label>
          {sugestaoSenha && (
            <span className="text-[10px] font-bold text-[#087A5B] bg-[#E8F7F1] px-2 py-0.5 rounded-md border border-[#00A878]/20">
              Padrão: {sugestaoSenha}
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type={mostrarSenhaCad ? 'text' : 'password'}
            required
            maxLength={30}
            value={cadSenha}
            onChange={(e) => setCadSenha(e.target.value.toLowerCase())}
            placeholder={`Ex: ${sugestaoSenha || 'escola2026'}`}
            className="w-full px-3.5 py-2.5 pl-9 pr-9 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
          />
          <KeyRound className="w-3.5 h-3.5 text-[#4B5563] absolute left-3 top-3" />
          <button
            type="button"
            onClick={() => setMostrarSenhaCad(!mostrarSenhaCad)}
            className="absolute right-3 top-3 text-[#4B5563] hover:text-[#17221D]"
          >
            {mostrarSenhaCad ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        <p className="text-[10px] text-[#4B5563] mt-1 font-medium">
          A senha foi pré-definida com o nome da sua escola + 2026. Você pode mantê-la ou alterá-la.
        </p>
      </div>

      {/* BOTÃO QUE ABRE A CONFIRMAÇÃO OBRIGATÓRIA DA ESCOLA */}
      <button
        type="submit"
        className="w-full py-3 px-5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-black text-xs sm:text-sm shadow-md shadow-[#00A878]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 mt-3"
      >
        <span>Confirmar e Criar Acesso</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
