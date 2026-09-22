'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  School, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle, 
  LogIn, 
  UserPlus, 
  MapPin, 
  Settings, 
  Sparkles 
} from 'lucide-react';
import Link from 'next/link';
import { JegdStorage } from '@/lib/storage';
import { Escola, Usuario, Municipio } from '@/types/jegd';
import { FormLoginCpf } from './components/FormLoginCpf';
import { FormCadastroProfessor } from './components/FormCadastroProfessor';
import { FormLoginAdmin } from './components/FormLoginAdmin';
import { ModalConfirmacaoEscola } from './components/ModalConfirmacaoEscola';
import { gerarSugestaoSenhaEscola } from '@/lib/auth-helpers';

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
  
  // Estado Multi-Tenant
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [municipioSelecionadoId, setMunicipioSelecionadoId] = useState<string>('');
  const [isDominioTravado, setIsDominioTravado] = useState(false);
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [coordenadores, setCoordenadores] = useState<Usuario[]>([]);
  const [coordenadorSelecionadoId, setCoordenadorSelecionadoId] = useState<string>('');
  
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
  const [adminSenha, setAdminSenha] = useState('');
  const [mostrarSenhaAdmin, setMostrarSenhaAdmin] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Inicialização e Carga dos Municípios
  useEffect(() => {
    JegdStorage.init();
    const munList = JegdStorage.getMunicipios();
    setMunicipios(munList);

    const domainRes = JegdStorage.getDomainResolution();
    setIsDominioTravado(domainRes.isDomainLocked);

    let targetMun = domainRes.isDomainLocked && domainRes.municipio ? domainRes.municipio : null;

    if (!targetMun) {
      const mParam = searchParams.get('m') || searchParams.get('municipio');
      if (mParam) {
        const found = munList.find(m => m.slug === mParam || m.id === mParam);
        if (found) targetMun = found;
      }
    }

    if (!targetMun) {
      targetMun = JegdStorage.getCurrentMunicipio() || munList[0];
    }

    if (targetMun) {
      setMunicipioSelecionadoId(targetMun.id);
      JegdStorage.setCurrentMunicipio(targetMun);
      carregarDadosMunicipio(targetMun.id);
    }
  }, [searchParams]);

  const carregarDadosMunicipio = (munId: string) => {
    const list = JegdStorage.getEscolas(munId);
    setEscolas(list);
    if (list.length > 0) {
      setCadEscolaId(list[0].id);
      setCadSenha(gerarSugestaoSenhaEscola(list[0]));
    } else {
      setCadEscolaId('');
      setCadSenha('');
    }

    const coords = JegdStorage.getUsuarios(munId).filter(u => u.papel === 'COORDENADOR' || u.papel === 'SUPERADMIN');
    setCoordenadores(coords);
    if (coords.length > 0) {
      setCoordenadorSelecionadoId(coords[0].id);
    }
  };

  const handleMudarMunicipio = (munId: string) => {
    if (isDominioTravado) return;
    setMunicipioSelecionadoId(munId);
    const munObj = municipios.find(m => m.id === munId);
    if (munObj) {
      JegdStorage.setCurrentMunicipio(munObj);
    }
    carregarDadosMunicipio(munId);
    setErro('');
    setSucesso('');
  };

  const handleSelecionarEscola = (escolaId: string) => {
    setCadEscolaId(escolaId);
    setEscolaConfirmada(false);
    
    const esc = escolas.find(e => e.id === escolaId);
    if (esc) {
      setCadSenha(gerarSugestaoSenhaEscola(esc));
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

    // Busca primeiro se o CPF existe em QUALQUER município
    const usuarioGlobal = JegdStorage.findUsuarioInAnyMunicipio(cpfLimpo);

    if (!usuarioGlobal) {
      setErro(`CPF não encontrado no sistema. Se este é o seu primeiro acesso em ${municipioAtual?.nome || 'nossa cidade'}, clique na aba "Primeiro Acesso / Cadastrar" abaixo.`);
      return;
    }

    // BLOQUEIO ESTRITO DE CROSS-TENANT / CROSS-DOMAIN:
    if (usuarioGlobal.municipioId && usuarioGlobal.municipioId !== municipioSelecionadoId) {
      const munOrigem = municipios.find(m => m.id === usuarioGlobal.municipioId);
      setErro(`⛔ Acesso Bloqueado: Este CPF está cadastrado no município de ${munOrigem?.nome || 'outro município'} (${munOrigem?.siglaEvento || ''}). Você está tentando acessar o portal oficial de ${municipioAtual?.nome || 'outro município'}. O acesso cruzado entre municípios é expressamente proibido.`);
      return;
    }

    const escola = JegdStorage.getEscolaById(usuarioGlobal.escolaId || '');
    if (!escola) {
      setErro('Escola vinculada a este professor não foi encontrada. Entre em contato com a SEMED.');
      return;
    }

    // Validação se a escola pertence ao município selecionado
    if (escola.municipioId && escola.municipioId !== municipioSelecionadoId) {
      const munEscola = municipios.find(m => m.id === escola.municipioId);
      setErro(`⛔ Acesso Bloqueado: A escola deste professor pertence ao município de ${munEscola?.nome || 'outro município'}. O login neste domínio não é permitido.`);
      return;
    }

    const senhaUsuario = usuarioGlobal.senhaHash?.toLowerCase();
    const senhaEscola = escola.senhaHash?.toLowerCase();
    const siglaSenha = `${escola.sigla?.toLowerCase().replace(/[^a-z0-9]/g, '')}2026`;
    const sugestaoPadrao = gerarSugestaoSenhaEscola(escola);

    const senhaValida = 
      senhaTratada === 'semed2026' ||
      senhaTratada === senhaUsuario ||
      senhaTratada === senhaEscola ||
      senhaTratada === siglaSenha ||
      senhaTratada === sugestaoPadrao;

    if (!senhaValida) {
      setErro('Senha incorreta para este CPF. Caso tenha esquecido, use a senha da sua escola ou contate a SEMED.');
      return;
    }

    const setEscolaOk = JegdStorage.setCurrentEscola(escola);
    if (!setEscolaOk) {
      setErro('Falha de segurança: Tentativa de login fora do domínio autorizado.');
      return;
    }
    JegdStorage.setCurrentUser(usuarioGlobal);
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

    // Verifica se o CPF já está cadastrado em outro município
    const usuarioExistente = JegdStorage.findUsuarioInAnyMunicipio(cpfLimpo);
    if (usuarioExistente) {
      if (usuarioExistente.municipioId === municipioSelecionadoId) {
        setErro('Este CPF já está cadastrado neste município. Acesse a aba "Entrar com CPF".');
      } else {
        const munOutro = municipios.find(m => m.id === usuarioExistente.municipioId);
        setErro(`⛔ Este CPF já possui cadastro no município de ${munOutro?.nome || 'outro município'}. Caso deseje transferir, contate a SEMED.`);
      }
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
      municipioId: municipioSelecionadoId,
      nome: cadNome.trim(),
      cpf: cadCpf,
      email: `${escola.sigla.toLowerCase().replace(/[^a-z0-9]/g, '')}@semed.gov.br`,
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
    const coordSelecionado = coordenadores.find(c => c.id === coordenadorSelecionadoId);

    // Se for o SuperAdmin
    if (coordSelecionado?.papel === 'SUPERADMIN' || senhaTratada === 'superadmin2026') {
      if (senhaTratada === 'superadmin2026' || senhaTratada === 'semed2026') {
        JegdStorage.setSuperAdminAuth(true);
        JegdStorage.setComiteAuth(true);
        router.push('/admin/super');
        return;
      }
    }

    if (coordSelecionado && coordSelecionado.municipioId && coordSelecionado.municipioId !== municipioSelecionadoId) {
      setErro('Este coordenador não pertence ao município selecionado.');
      return;
    }

    if (senhaTratada === 'semed2026' || (coordSelecionado?.senhaHash && senhaTratada === coordSelecionado.senhaHash.toLowerCase())) {
      const coordUser: Usuario = coordSelecionado || {
        id: `coord-${municipioSelecionadoId}`,
        municipioId: municipioSelecionadoId,
        nome: `Coordenação SEMED (${municipioAtual?.nome || 'Municipal'})`,
        email: `semed@${municipioAtual?.slug || 'municipal'}.gov.br`,
        telefone: '(99) 98801-1000',
        papel: 'COORDENADOR',
        createdAt: new Date().toISOString()
      };

      const setAdminOk = JegdStorage.setComiteAuth(true, coordUser);
      if (!setAdminOk) {
        setErro('Acesso não autorizado para o domínio atual.');
        return;
      }
      router.push('/admin/dashboard');
    } else {
      setErro('Senha incorreta da Coordenação SEMED. Digite a senha institucional autorizada.');
    }
  };

  const municipioAtual = municipios.find(m => m.id === municipioSelecionadoId) || municipios[0];
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
      <div className="relative z-10 max-w-[500px] w-full mx-auto my-auto">
        <div className="bg-white/98 backdrop-blur-md border border-white/70 sm:border-[#E2EAE5] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden transition-all duration-300">
          
          {/* SELETOR DE MUNICÍPIO NO TOPO (OU DOMÍNIO OFICIAL TRAVADO) */}
          {isDominioTravado ? (
            <div className="mb-4 bg-emerald-50/90 border border-emerald-300 rounded-xl p-3 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Domínio Oficial Travado:</span>
              </div>
              <div className="px-3 py-1 rounded-lg bg-emerald-700 text-white text-xs font-black tracking-wide flex items-center gap-1.5 shadow-2xs truncate max-w-[240px]">
                <span className="truncate">{municipioAtual?.nome} ({municipioAtual?.siglaEvento})</span>
              </div>
            </div>
          ) : (
            <div className="mb-4 bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Município:</span>
              </div>
              <select
                value={municipioSelecionadoId}
                onChange={(e) => handleMudarMunicipio(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-900 text-xs font-black focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-[230px] truncate"
              >
                {municipios.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome} - {m.uf} ({m.siglaEvento})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Logo & Título Institucional */}
          <div className="text-center mb-4 sm:mb-5">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border border-[#E2EAE5] bg-white flex items-center justify-center mx-auto mb-2 shadow-xs shrink-0">
              <img 
                src="/logo-jegd.png" 
                alt="Logo dos Jogos" 
                className="w-full h-full object-contain p-0.5" 
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#17221D] tracking-tight">
              {municipioAtual ? municipioAtual.nomeEvento : 'Acesso ao Sistema'}
            </h1>
            <p className="text-[11px] sm:text-xs text-[#4B5563] mt-0.5 font-medium">
              {municipioAtual ? `${municipioAtual.siglaEvento} • ${municipioAtual.nome} - ${municipioAtual.uf}` : 'Jogos Escolares'}
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
                  sugestaoSenha={gerarSugestaoSenhaEscola(escolaSelecionadaObj)}
                  onSubmit={handleIniciarCadastro}
                />
              )}
            </div>
          )}

          {/* FORMULÁRIO COORDENAÇÃO SEMED */}
          {tipoAcesso === 'ADMIN' && (
            <FormLoginAdmin
              coordenadores={coordenadores}
              coordenadorSelecionadoId={coordenadorSelecionadoId}
              setCoordenadorSelecionadoId={setCoordenadorSelecionadoId}
              adminSenha={adminSenha}
              setAdminSenha={setAdminSenha}
              mostrarSenhaAdmin={mostrarSenhaAdmin}
              setMostrarSenhaAdmin={setMostrarSenhaAdmin}
              onSubmit={handleLoginAdmin}
              nomeMunicipio={municipioAtual?.nome}
            />
          )}

          {/* Rodapé Institucional com Link SuperAdmin */}
          <div className="mt-5 pt-3 border-t border-[#E2EAE5] flex items-center justify-between text-[11px] text-[#68756E]">
            <span>Portal Multi-Municípios v2.0</span>
            <Link 
              href="/admin/super" 
              className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>SuperAdmin Master</span>
            </Link>
          </div>

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
