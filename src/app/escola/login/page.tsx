'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  School, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  User, 
  Phone, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  CreditCard, 
  AlertTriangle,
  KeyRound,
  UserPlus,
  LogIn
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { Escola, Usuario } from '@/types/jegd';

function formatCPF(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'admin' ? 'ADMIN' : 'ESCOLA';

  const [tipoAcesso, setTipoAcesso] = useState<'ESCOLA' | 'ADMIN'>(initialTab);
  const [modoEscola, setModoEscola] = useState<'LOGIN' | 'CADASTRO'>('LOGIN');
  
  const [escolas, setEscolas] = useState<Escola[]>([]);
  
  // Login Direto do Professor (CPF + Senha)
  const [loginCpf, setLoginCpf] = useState('');
  const [loginSenha, setLoginSenha] = useState('');
  const [mostrarSenhaLogin, setMostrarSenhaLogin] = useState(false);

  // Cadastro do Professor (Primeiro Acesso)
  const [cadNome, setCadNome] = useState('');
  const [cadCpf, setCadCpf] = useState('');
  const [cadTelefone, setCadTelefone] = useState('');
  const [cadEscolaId, setCadEscolaId] = useState('');
  const [cadSenha, setCadSenha] = useState('');
  const [mostrarSenhaCad, setMostrarSenhaCad] = useState(false);
  const [escolaConfirmada, setEscolaConfirmada] = useState(false);
  const [modalConfirmacaoEscola, setModalConfirmacaoEscola] = useState(false);

  // Dados da Coordenação
  const [adminCoordenador, setAdminCoordenador] = useState<'ELIAS_VELOSO' | 'HERBERT_SA'>('ELIAS_VELOSO');
  const [adminSenha, setAdminSenha] = useState('');
  const [mostrarSenhaAdmin, setMostrarSenhaAdmin] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    JegdStorage.init();
    const list = JegdStorage.getEscolas();
    setEscolas(list);
    if (list.length > 0) {
      setCadEscolaId(list[0].id);
    }
  }, []);

  // Quando o professor muda a seleção de escola no cadastro, reseta a confirmação prévia
  const handleSelecionarEscola = (escolaId: string) => {
    setCadEscolaId(escolaId);
    setEscolaConfirmada(false);
    
    // Sugestão amigável de senha padrão baseada na escola
    const esc = escolas.find(e => e.id === escolaId);
    if (esc && !cadSenha) {
      const siglaLimpa = esc.sigla.toLowerCase().replace(/[^a-z0-9]/g, '');
      setCadSenha(`${siglaLimpa}2026`);
    }
  };

  // LOGIN DO PROFESSOR COM CPF
  const handleLoginCpf = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    const cpfLimpo = loginCpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      setErro('Por favor, informe um CPF válido com 11 dígitos.');
      return;
    }

    const senhaTratada = loginSenha.trim().toLowerCase();
    if (!senhaTratada) {
      setErro('Por favor, digite a sua senha de acesso.');
      return;
    }

    // Busca o professor pelo CPF
    const usuarioEncontrado = JegdStorage.getUsuarioByCpf(cpfLimpo);

    if (!usuarioEncontrado) {
      setErro('CPF não encontrado no sistema. Se este é o seu primeiro acesso, clique na aba "Primeiro Acesso / Cadastrar" abaixo.');
      return;
    }

    const escola = escolas.find(e => e.id === usuarioEncontrado.escolaId);
    if (!escola) {
      setErro('Escola vinculada a este professor não foi encontrada. Entre em contato com a SEMED.');
      return;
    }

    // Validação da Senha:
    // 1. Senha mestra semed2026 sempre autorizada
    // 2. Senha do usuário ou da escola
    const senhaUsuario = usuarioEncontrado.senhaHash?.toLowerCase();
    const senhaEscola = escola.senhaHash?.toLowerCase();
    const siglaSenha = `${escola.sigla.toLowerCase().replace(/[^a-z0-9]/g, '')}2026`;

    const senhaValida = 
      senhaTratada === 'semed2026' ||
      senhaTratada === senhaUsuario ||
      senhaTratada === senhaEscola ||
      senhaTratada === siglaSenha;

    if (!senhaValida) {
      setErro('Senha incorreta para este CPF. Caso tenha esquecido, use a senha da sua escola ou contate a SEMED.');
      return;
    }

    // Login com sucesso
    JegdStorage.setCurrentUser(usuarioEncontrado);
    JegdStorage.setCurrentEscola(escola);
    router.push('/escola/dashboard');
  };

  // PRÉ-SUBMIT DE CADASTRO: DISPARA O MODAL DE CONFIRMAÇÃO DA ESCOLA
  const handleIniciarCadastro = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    if (!cadNome.trim()) {
      setErro('Por favor, informe seu nome completo.');
      return;
    }

    const cpfLimpo = cadCpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      setErro('Por favor, digite um CPF válido com 11 dígitos.');
      return;
    }

    if (!cadEscolaId) {
      setErro('Por favor, selecione a unidade escolar.');
      return;
    }

    const senhaTratada = cadSenha.trim().toLowerCase();
    const senhaValidaRegex = /^[a-z0-9]{4,30}$/;
    if (!senhaValidaRegex.test(senhaTratada)) {
      setErro('A senha deve conter no mínimo 4 caracteres (apenas letras e números).');
      return;
    }

    // Se ainda não confirmou explicitamente a escola no modal/trava
    if (!escolaConfirmada) {
      setModalConfirmacaoEscola(true);
      return;
    }

    // Executa a finalização
    concluirCadastro();
  };

  // FINALIZAÇÃO DO CADASTRO APÓS CONFIRMAÇÃO DA ESCOLA
  const concluirCadastro = () => {
    const escola = escolas.find(e => e.id === cadEscolaId);
    if (!escola) {
      setErro('Escola não encontrada.');
      return;
    }

    const cpfLimpo = cadCpf.replace(/\D/g, '');
    const senhaTratada = cadSenha.trim().toLowerCase();

    // Cria o usuário do professor
    const novoUsuario: Usuario = {
      id: `prof-${cpfLimpo}`,
      nome: cadNome.trim(),
      cpf: cadCpf,
      email: `${escola.sigla.toLowerCase().replace(/[^a-z0-9]/g, '')}@semed.gd.gov.br`,
      telefone: cadTelefone.trim() || '(99) 98888-0000',
      senhaHash: senhaTratada,
      papel: 'PROFESSOR',
      escolaId: escola.id,
      createdAt: new Date().toISOString()
    };

    // Atualiza a senha da escola se necessário
    if (!escola.senhaHash || escola.senhaHash === '123456' || escola.senhaHash === 'semed2026') {
      escola.senhaHash = senhaTratada;
      JegdStorage.saveEscola(escola);
    }

    JegdStorage.saveUsuario(novoUsuario);
    JegdStorage.setCurrentUser(novoUsuario);
    JegdStorage.setCurrentEscola(escola);

    setModalConfirmacaoEscola(false);
    router.push('/escola/dashboard');
  };

  // LOGIN DA COORDENAÇÃO SEMED
  const handleLoginAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    const senhaTratada = adminSenha.trim().toLowerCase();

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

  const escolaSelecionadaObj = escolas.find(e => e.id === cadEscolaId);

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
          <source src="/atrasdologin.mp4?v=2026" type="video/mp4" />
          <source src="/login-bg.mp4?v=2026" type="video/mp4" />
        </video>
        
        {/* Camada de Sobreposição Institucional */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b291e]/85 via-[#0d3326]/80 to-[#071d15]/95 backdrop-blur-[2px]" />
      </div>

      {/* CARD DE LOGIN FLUTUANTE */}
      <div className="relative z-10 max-w-[480px] w-full mx-auto my-auto">
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

          {/* Abas Principais: Professor / Escola vs Coordenação SEMED */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#F7F9F8] rounded-xl mb-4 sm:mb-5 border border-[#E2EAE5]">
            <button
              type="button"
              onClick={() => { setTipoAcesso('ESCOLA'); setErro(''); setSucesso(''); }}
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
              onClick={() => { setTipoAcesso('ADMIN'); setErro(''); setSucesso(''); }}
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

          {sucesso && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl p-3 mb-4 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="break-words">{sucesso}</span>
            </div>
          )}

          {/* ÁREA DO PROFESSOR: SUB-ABAS (LOGIN COM CPF vs PRIMEIRO ACESSO) */}
          {tipoAcesso === 'ESCOLA' && (
            <div>
              <div className="flex border-b border-[#E2EAE5] mb-4">
                <button
                  type="button"
                  onClick={() => { setModoEscola('LOGIN'); setErro(''); }}
                  className={`flex-1 pb-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
                    modoEscola === 'LOGIN'
                      ? 'border-[#00A878] text-[#00A878]'
                      : 'border-transparent text-[#68756E] hover:text-[#17221D]'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Entrar com CPF</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setModoEscola('CADASTRO'); setErro(''); }}
                  className={`flex-1 pb-2.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
                    modoEscola === 'CADASTRO'
                      ? 'border-[#00A878] text-[#00A878]'
                      : 'border-transparent text-[#68756E] hover:text-[#17221D]'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Primeiro Acesso / Cadastrar</span>
                </button>
              </div>

              {/* MODO 1: LOGIN DIRETO DO PROFESSOR (CPF + SENHA) */}
              {modoEscola === 'LOGIN' && (
                <form onSubmit={handleLoginCpf} className="space-y-3 sm:space-y-3.5">
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
                        onChange={(e) => setLoginCpf(formatCPF(e.target.value))}
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
                      onClick={() => { setModoEscola('CADASTRO'); setErro(''); }}
                      className="text-xs text-[#00A878] font-bold hover:underline"
                    >
                      Ainda não tem cadastro? Clique aqui para o primeiro acesso
                    </button>
                  </div>
                </form>
              )}

              {/* MODO 2: CADASTRO COM TRAVA DE ESCOLA */}
              {modoEscola === 'CADASTRO' && (
                <form onSubmit={handleIniciarCadastro} className="space-y-3">
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
                          onChange={(e) => setCadCpf(formatCPF(e.target.value))}
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
                          onChange={(e) => setCadTelefone(formatPhone(e.target.value))}
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
                      onChange={(e) => handleSelecionarEscola(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
                    >
                      {escolas.map((esc) => (
                        <option key={esc.id} value={esc.id}>
                          {esc.nome} ({esc.sigla} • Rede {esc.rede})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* SENHA DE ACESSO */}
                  <div>
                    <label className="block text-[11px] sm:text-xs font-bold text-[#17221D] uppercase tracking-wider mb-1">
                      5. Senha de Acesso (para não esquecer)
                    </label>
                    <div className="relative">
                      <input
                        type={mostrarSenhaCad ? 'text' : 'password'}
                        required
                        maxLength={30}
                        value={cadSenha}
                        onChange={(e) => setCadSenha(e.target.value.toLowerCase())}
                        placeholder="Ex: anisio2026"
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
                      Mínimo 4 caracteres (letras e números). Sugestão: nome da escola + 2026.
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
              )}
            </div>
          )}

          {/* FORMULÁRIO: COORDENAÇÃO SEMED */}
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

      {/* MODAL DE TRAVA DE SEGURANÇA: CONFIRMAÇÃO EXPLÍCITA DA ESCOLA */}
      {modalConfirmacaoEscola && escolaSelecionadaObj && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-[#00A878] transform scale-100 transition-all">
            
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black text-[#17221D] text-center mb-1">
              Confirmação de Escola
            </h3>
            
            <p className="text-xs text-[#4B5563] text-center mb-4">
              Para evitar erros e cruzamento de dados, confirme com atenção:
            </p>

            <div className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl p-4 mb-5 text-center">
              <span className="text-[10px] font-black tracking-wider text-[#087A5B] uppercase block mb-1">
                Você está se vinculando a:
              </span>
              <p className="text-base font-black text-[#17221D]">
                {escolaSelecionadaObj.nome}
              </p>
              <p className="text-xs text-[#68756E] font-semibold mt-0.5">
                {escolaSelecionadaObj.sigla} • Rede {escolaSelecionadaObj.rede}
              </p>

              <div className="mt-3 pt-3 border-t border-[#E2EAE5] text-left text-[11px] text-[#4B5563] space-y-1">
                <p>👤 <strong>Professor:</strong> {cadNome}</p>
                <p>🪪 <strong>CPF:</strong> {cadCpf}</p>
              </div>
            </div>

            <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mb-5 font-medium leading-relaxed">
              ⚠️ <strong>Importante:</strong> Todos os alunos, matrículas e equipes que você cadastrar ficarão salvos <strong>exclusivamente</strong> dentro desta escola.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => setModalConfirmacaoEscola(false)}
                className="w-full py-2.5 px-4 rounded-xl border border-[#E2EAE5] text-[#4B5563] hover:bg-[#F7F9F8] text-xs font-bold transition-colors order-2 sm:order-1"
              >
                Trocar Escola
              </button>
              <button
                type="button"
                onClick={() => {
                  setEscolaConfirmada(true);
                  concluirCadastro();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-black shadow-md shadow-[#00A878]/20 flex items-center justify-center gap-1.5 transition-all order-1 sm:order-2"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Sim, Sou Desta Escola</span>
              </button>
            </div>

          </div>
        </div>
      )}

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
