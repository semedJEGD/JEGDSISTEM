'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { School, Lock, ArrowRight, ShieldCheck, User, Phone, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { Escola, Usuario } from '@/types/jegd';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'admin' ? 'ADMIN' : 'ESCOLA';

  const [tipoAcesso, setTipoAcesso] = useState<'ESCOLA' | 'ADMIN'>(initialTab);
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [escolaSelecionadaId, setEscolaSelecionadaId] = useState('');
  
  // Dados do Professor
  const [profNome, setProfNome] = useState('');
  const [profTelefone, setProfTelefone] = useState('');
  const [profSenha, setProfSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Dados da Coordenação
  const [adminCoordenador, setAdminCoordenador] = useState<'COORDENADOR_1' | 'COORDENADOR_2'>('COORDENADOR_1');
  const [adminSenha, setAdminSenha] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    JegdStorage.init();
    const list = JegdStorage.getEscolas();
    setEscolas(list);
    if (list.length > 0) {
      setEscolaSelecionadaId(list[0].id);
    }
  }, []);

  const handleLoginEscola = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!escolaSelecionadaId) {
      setErro('Por favor, selecione sua unidade escolar.');
      return;
    }

    const escola = escolas.find(e => e.id === escolaSelecionadaId);
    if (!escola) {
      setErro('Escola selecionada não encontrada.');
      return;
    }

    const nomeFinal = profNome.trim() || escola.responsavelNome || 'Professor Responsável';
    const telefoneFinal = profTelefone.trim() || escola.responsavelTelefone || '(99) 98888-0000';

    const usuarioProf: Usuario = {
      id: `prof-${Date.now()}`,
      nome: nomeFinal,
      email: `${escola.sigla.toLowerCase().replace(/\s+/g, '')}@semed.gd.gov.br`,
      telefone: telefoneFinal,
      papel: 'PROFESSOR',
      escolaId: escola.id,
      createdAt: new Date().toISOString()
    };

    JegdStorage.setCurrentUser(usuarioProf);
    JegdStorage.saveUsuario(usuarioProf);
    JegdStorage.setCurrentEscola(escola);

    router.push('/escola/dashboard');
  };

  const handleLoginAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    // Senha padrão semed2026 ou 123456
    if (adminSenha === 'semed2026' || adminSenha === '123456' || adminSenha === 'admin') {
      JegdStorage.setComiteAuth(true);
      const coordNome = adminCoordenador === 'COORDENADOR_1' ? 'Coordenador SEMED 1' : 'Coordenador SEMED 2';
      
      const adminUser: Usuario = {
        id: `coord-${Date.now()}`,
        nome: coordNome,
        email: 'coordenacao.jegds@semed.gd.gov.br',
        telefone: '(98) 3214-9000',
        papel: 'COORDENADOR',
        createdAt: new Date().toISOString()
      };
      
      JegdStorage.setCurrentUser(adminUser);
      router.push('/admin/dashboard');
    } else {
      setErro('Senha incorreta da Coordenação SEMED. Dica: semed2026');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#F7F9F8]">
      <div className="max-w-md w-full">
        
        <div className="bg-white border border-[#E2EAE5] rounded-3xl p-8 shadow-sm relative overflow-hidden">
          
          {/* Logo & Título Institucional */}
          <div className="text-center mb-6">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border border-[#E2EAE5] bg-white flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Image 
                src="/logo-jegd.png" 
                alt="Logo JEGD" 
                width={60} 
                height={60} 
                className="object-contain" 
              />
            </div>
            <h1 className="text-2xl font-black text-[#17221D]">Acesso ao Sistema</h1>
            <p className="text-xs text-[#68756E] mt-1">
              JEGDS 2026 • Jogos Escolares de Gonçalves Dias
            </p>
          </div>

          {/* Abas Unificadas: Professor / Escola vs Coordenação SEMED */}
          <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-[#F7F9F8] rounded-2xl mb-6 border border-[#E2EAE5]">
            <button
              type="button"
              onClick={() => { setTipoAcesso('ESCOLA'); setErro(''); }}
              className={`py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                tipoAcesso === 'ESCOLA'
                  ? 'bg-[#00A878] text-white shadow-sm'
                  : 'text-[#68756E] hover:text-[#17221D] hover:bg-white'
              }`}
            >
              <School className="w-4 h-4" />
              <span>Professor / Escola</span>
            </button>
            <button
              type="button"
              onClick={() => { setTipoAcesso('ADMIN'); setErro(''); }}
              className={`py-2.5 px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                tipoAcesso === 'ADMIN'
                  ? 'bg-[#087A5B] text-white shadow-sm'
                  : 'text-[#68756E] hover:text-[#17221D] hover:bg-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Coordenação SEMED</span>
            </button>
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3.5 mb-5 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{erro}</span>
            </div>
          )}

          {/* FORMULÁRIO 1: PROFESSOR / ESCOLA */}
          {tipoAcesso === 'ESCOLA' && (
            <form onSubmit={handleLoginEscola} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#17221D] uppercase tracking-wider mb-1.5">
                  1. Selecione a sua Escola
                </label>
                <select
                  value={escolaSelecionadaId}
                  onChange={(e) => setEscolaSelecionadaId(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs font-bold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
                >
                  {escolas.map((esc) => (
                    <option key={esc.id} value={esc.id}>
                      {esc.nome} ({esc.sigla} • Rede {esc.rede})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17221D] uppercase tracking-wider mb-1.5">
                  2. Nome do Professor / Responsável
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={profNome}
                    onChange={(e) => setProfNome(e.target.value)}
                    placeholder="Ex: Prof. Marcos Silva"
                    className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs font-semibold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
                  />
                  <User className="w-4 h-4 text-[#68756E] absolute left-3.5 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17221D] uppercase tracking-wider mb-1.5">
                    3. WhatsApp
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profTelefone}
                      onChange={(e) => setProfTelefone(e.target.value)}
                      placeholder="(99) 98888-0000"
                      className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs font-semibold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
                    />
                    <Phone className="w-3.5 h-3.5 text-[#68756E] absolute left-3 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17221D] uppercase tracking-wider mb-1.5">
                    4. Senha
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={profSenha}
                      onChange={(e) => setProfSenha(e.target.value)}
                      placeholder="Sua senha"
                      className="w-full px-3.5 py-2.5 pl-9 pr-9 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs font-semibold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
                    />
                    <Lock className="w-3.5 h-3.5 text-[#68756E] absolute left-3 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-3 top-3 text-[#68756E] hover:text-[#17221D]"
                    >
                      {mostrarSenha ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-bold text-sm shadow-md shadow-[#00A878]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 mt-2"
              >
                <span>Entrar no Painel da Escola</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* FORMULÁRIO 2: COORDENAÇÃO SEMED */}
          {tipoAcesso === 'ADMIN' && (
            <form onSubmit={handleLoginAdmin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#17221D] uppercase tracking-wider mb-1.5">
                  Coordenador Responsável
                </label>
                <select
                  value={adminCoordenador}
                  onChange={(e) => setAdminCoordenador(e.target.value as any)}
                  className="w-full px-3.5 py-3 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs font-bold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
                >
                  <option value="COORDENADOR_1">Coordenador Geral 1 (SEMED Desporto)</option>
                  <option value="COORDENADOR_2">Coordenador Geral 2 (SEMED Educação)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17221D] uppercase tracking-wider mb-1.5">
                  Senha da Coordenação
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={adminSenha}
                    onChange={(e) => setAdminSenha(e.target.value)}
                    placeholder="Digite a senha institucional"
                    className="w-full px-3.5 py-3 pl-10 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs font-bold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
                  />
                  <Lock className="w-4 h-4 text-[#68756E] absolute left-3.5 top-3.5" />
                </div>
                <p className="text-[11px] text-[#68756E] mt-1">
                  Senha padrão do comitê: <strong className="text-[#087A5B]">semed2026</strong>
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl bg-[#087A5B] hover:bg-[#00A878] text-white font-bold text-sm shadow-md shadow-[#087A5B]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 mt-2"
              >
                <span>Acessar Painel da Coordenação</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}

export default function EscolaLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[85vh] flex items-center justify-center text-xs text-[#68756E]">Carregando...</div>}>
      <LoginContent />
    </Suspense>
  );
}
