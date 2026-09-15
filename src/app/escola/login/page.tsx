'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  School, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle,
  LogIn,
  UserPlus
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { Escola, Usuario } from '@/types/jegd';
import { FormLoginCpf } from './components/FormLoginCpf';
import { FormCadastroProfessor } from './components/FormCadastroProfessor';
import { FormLoginAdmin } from './components/FormLoginAdmin';
import { ModalConfirmacaoEscola } from './components/ModalConfirmacaoEscola';

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

  // Dados da Coordenação SEMED
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

  const handleSelecionarEscola = (escolaId: string) => {
    setCadEscolaId(escolaId);
    setEscolaConfirmada(false);
    
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

    JegdStorage.setCurrentUser(usuarioEncontrado);
    JegdStorage.setCurrentEscola(escola);
    router.push('/escola/dashboard');
  };

  // PRÉ-SUBMIT DE CADASTRO
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

    if (!escolaConfirmada) {
      setModalConfirmacaoEscola(true);
      return;
    }

    concluirCadastro();
  };

  // FINALIZAÇÃO DO CADASTRO
  const concluirCadastro = () => {
    const escola = escolas.find(e => e.id === cadEscolaId);
    if (!escola) {
      setErro('Escola não encontrada.');
      return;
    }

    const cpfLimpo = cadCpf.replace(/\D/g, '');
    const senhaTratada = cadSenha.trim().toLowerCase();

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
      
      {/* VÍDEO DE BACKGROUND EM LOOP COM CACHE BUSTER */}
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

          {/* ÁREA DO PROFESSOR */}
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

              {modoEscola === 'LOGIN' && (
                <FormLoginCpf
                  loginCpf={loginCpf}
                  setLoginCpf={(v) => setLoginCpf(formatCPF(v))}
                  loginSenha={loginSenha}
                  setLoginSenha={setLoginSenha}
                  mostrarSenhaLogin={mostrarSenhaLogin}
                  setMostrarSenhaLogin={setMostrarSenhaLogin}
                  onSubmit={handleLoginCpf}
                  onAlternarModoCadastro={() => { setModoEscola('CADASTRO'); setErro(''); }}
                />
              )}

              {modoEscola === 'CADASTRO' && (
                <FormCadastroProfessor
                  cadNome={cadNome}
                  setCadNome={setCadNome}
                  cadCpf={cadCpf}
                  setCadCpf={(v) => setCadCpf(formatCPF(v))}
                  cadTelefone={cadTelefone}
                  setCadTelefone={(v) => setCadTelefone(formatPhone(v))}
                  cadEscolaId={cadEscolaId}
                  onSelecionarEscola={handleSelecionarEscola}
                  escolas={escolas}
                  cadSenha={cadSenha}
                  setCadSenha={setCadSenha}
                  mostrarSenhaCad={mostrarSenhaCad}
                  setMostrarSenhaCad={setMostrarSenhaCad}
                  onSubmit={handleIniciarCadastro}
                />
              )}
            </div>
          )}

          {/* FORMULÁRIO COORDENAÇÃO SEMED */}
          {tipoAcesso === 'ADMIN' && (
            <FormLoginAdmin
              adminCoordenador={adminCoordenador}
              setAdminCoordenador={setAdminCoordenador}
              adminSenha={adminSenha}
              setAdminSenha={setAdminSenha}
              mostrarSenhaAdmin={mostrarSenhaAdmin}
              setMostrarSenhaAdmin={setMostrarSenhaAdmin}
              onSubmit={handleLoginAdmin}
            />
          )}

        </div>
      </div>

      {/* MODAL DE TRAVA DE SEGURANÇA */}
      <ModalConfirmacaoEscola
        aberto={modalConfirmacaoEscola}
        escola={escolaSelecionadaObj}
        profNome={cadNome}
        profCpf={cadCpf}
        onConfirmar={() => {
          setEscolaConfirmada(true);
          concluirCadastro();
        }}
        onFechar={() => setModalConfirmacaoEscola(false)}
      />

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
