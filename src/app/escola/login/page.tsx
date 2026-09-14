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
  const [adminCoordenador, setAdminCoordenador] = useState<'ELIAS_VELOSO' | 'HERBERT_SA'>('ELIAS_VELOSO');
  const [adminSenha, setAdminSenha] = useState('');
  const [mostrarSenhaAdmin, setMostrarSenhaAdmin] = useState(false);
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

    const senhaTratada = profSenha.trim().toLowerCase();
    if (!senhaTratada) {
      setErro('Por favor, digite a sua senha de acesso.');
      return;
    }

    // Regra de segurança: Mínimo 4 caracteres, somente letras e números
    const senhaValidaRegex = /^[a-z0-9]{4,30}$/;
    if (!senhaValidaRegex.test(senhaTratada)) {
      setErro('A senha deve conter no mínimo 4 caracteres, composta exclusivamente por letras minúsculas (a-z) e números (0-9).');
      return;
    }

    // Se informou a senha master institucional semed2026, acesso é autorizado imediatamente
    if (senhaTratada === 'semed2026') {
      // Senha master sempre autorizada
    } else if (escola.senhaHash && escola.senhaHash !== '123456' && escola.senhaHash !== 'semed2026') {
      // Verificação da senha personalizada já cadastrada pela escola
      if (senhaTratada !== escola.senhaHash) {
        setErro('Senha incorreta para esta unidade escolar. Verifique os dados ou utilize a chave de acesso institucional.');
        return;
      }
    } else {
      // Primeira definição de senha da escola: salva a senha escolhida no cadastro
      escola.senhaHash = senhaTratada;
      JegdStorage.saveEscola(escola);
    }

    const nomeFinal = profNome.trim() || escola.responsavelNome || 'Professor Responsável';
    const telefoneFinal = profTelefone.trim() || escola.responsavelTelefone || '(99) 98888-0000';

    const usuarioProf: Usuario = {
      id: `prof-${Date.now()}`,
      nome: nomeFinal,
      email: `${escola.sigla.toLowerCase().replace(/[^a-z0-9]/g, '')}@semed.gd.gov.br`,
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

    const senhaTratada = adminSenha.trim().toLowerCase();

    // Segurança institucional da Coordenação SEMED
    if (senhaTratada === 'semed2026') {
      JegdStorage.setComiteAuth(true);
      const coordNome = adminCoordenador === 'ELIAS_VELOSO' ? 'Elias Veloso (SEMED)' : 'Herbert de Sá (SEMED)';
      const coordEmail = adminCoordenador === 'ELIAS_VELOSO' ? 'elias.veloso@semed.gd.gov.br' : 'herbert.sa@semed.gd.gov.br';
      
      const adminUser: Usuario = {
        id: `coord-${adminCoordenador.toLowerCase()}`,
        nome: coordNome,
        email: coordEmail,
        telefone: '(99) 98801-1000',
        papel: 'COORDENADOR',
        createdAt: new Date().toISOString()
      };
      
      JegdStorage.setCurrentUser(adminUser);
      router.push('/admin/dashboard');
    } else {
      setErro('Senha incorreta da Coordenação SEMED. Digite a senha institucional autorizada.');
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-70px)] flex items-center justify-center px-3 py-4 sm:py-8 overflow-hidden w-full">
      
      {/* VÍDEO DE BACKGROUND EM LOOP */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/banner-jegd.png"
          className="w-full h-full object-cover object-center scale-105"
        >
          <source src="/login-bg.mp4" type="video/mp4" />
        </video>
        
        {/* Camada de Sobreposição (Overlay) Institucional */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b291e]/80 via-[#0d3326]/75 to-[#071d15]/90 backdrop-blur-[1px]" />
      </div>

      {/* CARD DE LOGIN FLUTUANTE COMPACTO */}
      <div className="relative z-10 max-w-[450px] w-full mx-auto my-auto">
        <div className="bg-white/98 backdrop-blur-md border border-white/70 sm:border-[#E2EAE5] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden transition-all duration-300">
          
          {/* Logo & Título Institucional */}
          <div className="text-center mb-4 sm:mb-5">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border border-[#E2EAE5] bg-white flex items-center justify-center mx-auto mb-2 shadow-xs shrink-0">
              <img 
                src="/logo-jegd.png" 
                alt="Logo JEGD" 
                className="w-full h-full object-contain p-0.5" 
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#17221D] tracking-tight">Acesso ao Sistema</h1>
            <p className="text-[11px] sm:text-xs text-[#4B5563] mt-0.5 font-medium">
              JEGDS 2026 • Jogos Escolares de Gonçalves Dias
            </p>
          </div>

          {/* Abas Unificadas: Professor / Escola vs Coordenação SEMED */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#F7F9F8] rounded-xl mb-4 sm:mb-5 border border-[#E2EAE5]">
            <button
              type="button"
              onClick={() => { setTipoAcesso('ESCOLA'); setErro(''); }}
              className={`py-2 px-2 text-xs font-black rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                tipoAcesso === 'ESCOLA'
                  ? 'bg-[#00A878] text-white shadow-xs'
                  : 'text-[#4B5563] hover:text-[#17221D] hover:bg-white'
              }`}
            >
              <School className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Escola / Professor</span>
            </button>
            <button
              type="button"
              onClick={() => { setTipoAcesso('ADMIN'); setErro(''); }}
              className={`py-2 px-2 text-xs font-black rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                tipoAcesso === 'ADMIN'
                  ? 'bg-[#087A5B] text-white shadow-xs'
                  : 'text-[#4B5563] hover:text-[#17221D] hover:bg-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Coordenação SEMED</span>
            </button>
          </div>

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl p-3 mb-4 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span className="break-words">{erro}</span>
            </div>
          )}

          {/* FORMULÁRIO 1: PROFESSOR / ESCOLA */}
          {tipoAcesso === 'ESCOLA' && (
            <form onSubmit={handleLoginEscola} className="space-y-3 sm:space-y-3.5">
              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-[#17221D] uppercase tracking-wider mb-1">
                  1. Selecione a sua Escola
                </label>
                <select
                  value={escolaSelecionadaId}
                  onChange={(e) => setEscolaSelecionadaId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
                >
                  {escolas.map((esc) => (
                    <option key={esc.id} value={esc.id}>
                      {esc.nome} ({esc.sigla} • Rede {esc.rede})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-bold text-[#17221D] uppercase tracking-wider mb-1">
                  2. Nome do Professor / Responsável
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={profNome}
                    onChange={(e) => setProfNome(e.target.value)}
                    placeholder="Ex: Prof. Marcos Silva"
                    className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
                  />
                  <User className="w-3.5 h-3.5 text-[#4B5563] absolute left-3 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-[#17221D] uppercase tracking-wider mb-1">
                    3. WhatsApp
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profTelefone}
                      onChange={(e) => setProfTelefone(e.target.value)}
                      placeholder="(99) 98888-0000"
                      className="w-full px-3 py-2.5 pl-8 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
                    />
                    <Phone className="w-3.5 h-3.5 text-[#4B5563] absolute left-2.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] sm:text-xs font-bold text-[#17221D] uppercase tracking-wider mb-1">
                    4. Senha de Acesso
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarSenha ? 'text' : 'password'}
                      value={profSenha}
                      maxLength={30}
                      onChange={(e) => setProfSenha(e.target.value.toLowerCase())}
                      placeholder="Sua senha de acesso"
                      className="w-full px-3 py-2.5 pl-8 pr-8 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
                    />
                    <Lock className="w-3.5 h-3.5 text-[#4B5563] absolute left-2.5 top-3" />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-2.5 top-3 text-[#4B5563] hover:text-[#17221D]"
                    >
                      {mostrarSenha ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-[#4B5563] mt-1 font-medium">
                    Letras e números (mínimo 4 caracteres)
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-black text-xs sm:text-sm shadow-md shadow-[#00A878]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 mt-3"
              >
                <span>Entrar no Painel da Escola</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* FORMULÁRIO 2: COORDENAÇÃO SEMED */}
          {tipoAcesso === 'ADMIN' && (
            <form onSubmit={handleLoginAdmin} className="space-y-3.5">
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
