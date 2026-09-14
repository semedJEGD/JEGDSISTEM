'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { School, Lock, ArrowRight, ShieldCheck, PlusCircle, Check, User, Phone, Mail, AlertTriangle } from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { Escola, RedeEscolar, Usuario } from '@/types/jegd';

export default function EscolaLoginPage() {
  const router = useRouter();
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [escolaSelecionadaId, setEscolaSelecionadaId] = useState('');
  const [modo, setModo] = useState<'LOGIN' | 'CADASTRO'>('LOGIN');

  // Campos de Professor
  const [profNome, setProfNome] = useState('');
  const [profEmail, setProfEmail] = useState('');
  const [profSenha, setProfSenha] = useState('');
  const [profTelefone, setProfTelefone] = useState('');

  // Confirmação Explícita
  const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);
  const [escolaParaConfirmar, setEscolaParaConfirmar] = useState<Escola | null>(null);

  const [erro, setErro] = useState('');

  // Modal para cadastrar nova escola
  const [mostrarNovoModal, setMostrarNovoModal] = useState(false);
  const [novaEscola, setNovaEscola] = useState({
    nome: '',
    sigla: '',
    inep: '',
    rede: 'MUNICIPAL' as RedeEscolar,
    bairro: '',
    endereco: '',
    diretorNome: '',
    professorRespNome: '',
    telefone: '',
    email: '',
    senha: '123'
  });

  useEffect(() => {
    JegdStorage.init();
    const list = JegdStorage.getEscolas();
    setEscolas(list);
    if (list.length > 0) {
      setEscolaSelecionadaId(list[0].id);
    }
  }, []);

  const handleProsseguir = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (!escolaSelecionadaId) {
      setErro('Por favor, selecione sua unidade escolar.');
      return;
    }

    if (modo === 'CADASTRO') {
      if (!profNome || !profEmail || !profSenha || !profTelefone) {
        setErro('Preencha todos os dados cadastrais do professor responsável.');
        return;
      }
    }

    const escola = escolas.find(e => e.id === escolaSelecionadaId);
    if (!escola) {
      setErro('Escola selecionada não encontrada.');
      return;
    }

    // Abre a confirmação explícita obrigatória
    setEscolaParaConfirmar(escola);
    setModalConfirmacaoAberto(true);
  };

  const handleConfirmarEscola = () => {
    if (!escolaParaConfirmar) return;

    // Salva o professor e a escola na sessão
    const usuarioProf: Usuario = {
      id: `prof-${Date.now()}`,
      nome: profNome || escolaParaConfirmar.responsavelNome,
      email: profEmail || escolaParaConfirmar.loginEmail,
      telefone: profTelefone || escolaParaConfirmar.responsavelTelefone,
      papel: 'PROFESSOR',
      escolaId: escolaParaConfirmar.id,
      createdAt: new Date().toISOString()
    };

    JegdStorage.setCurrentUser(usuarioProf);
    JegdStorage.saveUsuario(usuarioProf);
    JegdStorage.setCurrentEscola(escolaParaConfirmar);

    setModalConfirmacaoAberto(false);
    router.push('/escola/dashboard');
  };

  const handleCadastrarNovaEscola = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaEscola.nome || !novaEscola.sigla || !novaEscola.inep) {
      alert('Por favor, preencha o Nome, Sigla e INEP da escola.');
      return;
    }

    const nova: Escola = {
      id: `esc-${Date.now()}`,
      nome: novaEscola.nome,
      sigla: novaEscola.sigla.toUpperCase(),
      inep: novaEscola.inep,
      rede: novaEscola.rede,
      bairro: novaEscola.bairro || 'Centro',
      endereco: novaEscola.endereco || 'Gonçalves Dias - MA',
      responsavelNome: novaEscola.diretorNome || novaEscola.professorRespNome || 'Responsável Escolar',
      responsavelTelefone: novaEscola.telefone || '(99) 98888-0000',
      loginEmail: novaEscola.email || `${novaEscola.sigla.toLowerCase()}@semed.gd.gov.br`,
      senhaHash: novaEscola.senha || '123456',
      createdAt: new Date().toISOString()
    };

    JegdStorage.saveEscola(nova);
    const atualizadas = JegdStorage.getEscolas();
    setEscolas(atualizadas);
    setEscolaSelecionadaId(nova.id);
    setMostrarNovoModal(false);

    // Abre confirmação para a recém cadastrada
    setEscolaParaConfirmar(nova);
    setModalConfirmacaoAberto(true);
  };


  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        
        {/* Card de Login / Cadastro */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400"></div>

          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/10">
              <School className="w-8 h-8 stroke-[2.2]" />
            </div>
            <h1 className="text-2xl font-black text-white">Portal do Professor</h1>
            <p className="text-xs text-slate-400 mt-1">
              Inscrições Oficiais • JEGDS 2026 (Gonçalves Dias - MA)
            </p>
          </div>

          {/* Abas: Login vs Cadastro */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-800/80 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setModo('LOGIN')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                modo === 'LOGIN'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1. Acessar Escola
            </button>
            <button
              type="button"
              onClick={() => setModo('CADASTRO')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                modo === 'CADASTRO'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2. Novo Professor
            </button>
          </div>

          {erro && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs rounded-xl p-3 mb-6">
              {erro}
            </div>
          )}

          <form onSubmit={handleProsseguir} className="space-y-4">
            {/* Campos se for Cadastro de Professor */}
            {modo === 'CADASTRO' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome Completo do Professor *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={profNome}
                      onChange={(e) => setProfNome(e.target.value)}
                      placeholder="Ex: Prof. Marcos Silva"
                      className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    E-mail do Professor *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={profEmail}
                      onChange={(e) => setProfEmail(e.target.value)}
                      placeholder="prof.marcos@escola.gov.br"
                      className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Telefone WhatsApp *
                    </label>
                    <input
                      type="text"
                      required
                      value={profTelefone}
                      onChange={(e) => setProfTelefone(e.target.value)}
                      placeholder="(99) 98888-0000"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Criar Senha *
                    </label>
                    <input
                      type="password"
                      required
                      value={profSenha}
                      onChange={(e) => setProfSenha(e.target.value)}
                      placeholder="******"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Selecione a Unidade de Ensino
              </label>
              <select
                value={escolaSelecionadaId}
                onChange={(e) => setEscolaSelecionadaId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {escolas.map((esc) => (
                  <option key={esc.id} value={esc.id}>
                    {esc.nome} ({esc.sigla} - Rede {esc.rede})
                  </option>
                ))}
              </select>
            </div>

            {modo === 'LOGIN' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <input
                    type="password"
                    defaultValue="123456"
                    placeholder="Senha de acesso"
                    className="w-full px-4 py-3 pl-11 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <span>{modo === 'CADASTRO' ? 'Salvar Conta e Prosseguir' : 'Prosseguir para Inscrições'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Divisor */}
          <div className="my-5 border-t border-slate-800 flex items-center justify-center">
            <span className="bg-slate-900 px-3 text-[11px] text-slate-500 -mt-2">OU</span>
          </div>

          {/* Botão para cadastrar nova escola */}
          <button
            type="button"
            onClick={() => setMostrarNovoModal(true)}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>Cadastrar Nova Escola no JEGDS</span>
          </button>

          <div className="mt-6 pt-4 border-t border-slate-800 text-center">
            <Link
              href="/admin/login"
              className="text-xs text-slate-400 hover:text-amber-400 inline-flex items-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Acesso da Coordenação SEMED</span>
            </Link>
          </div>

        </div>

      </div>

      {/* Modal de Confirmação Explícita Obrigatória */}
      {modalConfirmacaoAberto && escolaParaConfirmar && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 stroke-[2.2]" />
            </div>

            <h3 className="text-lg font-black text-white mb-2">
              Confirmação de Representação Escolar
            </h3>

            <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 my-4 text-left space-y-1.5">
              <p className="text-xs text-slate-300">
                Você está prestes a cadastrar alunos pela escola:
              </p>
              <p className="text-sm font-black text-emerald-400">
                {escolaParaConfirmar.nome} ({escolaParaConfirmar.sigla})
              </p>
              <p className="text-[11px] text-slate-400">
                Rede: {escolaParaConfirmar.rede} • INEP: {escolaParaConfirmar.inep}
              </p>
            </div>

            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Confirma que você é o professor/responsável oficial desta unidade de ensino no JEGDS 2026?
            </p>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setModalConfirmacaoAberto(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                Trocar Escola
              </button>
              <button
                type="button"
                onClick={handleConfirmarEscola}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
              >
                Sim, Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro de Nova Escola */}
      {mostrarNovoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-8">
            <h3 className="text-lg font-bold text-white mb-1">Cadastrar Nova Unidade Escolar</h3>
            <p className="text-xs text-slate-400 mb-6">
              Preencha os dados da escola para habilitar inscrições nos Jogos Escolares 2026.
            </p>

            <form onSubmit={handleCadastrarNovaEscola} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nome Completo da Escola *</label>
                  <input
                    type="text"
                    required
                    value={novaEscola.nome}
                    onChange={(e) => setNovaEscola({ ...novaEscola, nome: e.target.value })}
                    placeholder="Ex: E.M. Presidente Médici"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Sigla *</label>
                  <input
                    type="text"
                    required
                    value={novaEscola.sigla}
                    onChange={(e) => setNovaEscola({ ...novaEscola, sigla: e.target.value })}
                    placeholder="Ex: EMPM"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Código INEP / MEC *</label>
                  <input
                    type="text"
                    required
                    value={novaEscola.inep}
                    onChange={(e) => setNovaEscola({ ...novaEscola, inep: e.target.value })}
                    placeholder="8 dígitos"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Rede de Ensino</label>
                  <select
                    value={novaEscola.rede}
                    onChange={(e) => setNovaEscola({ ...novaEscola, rede: e.target.value as RedeEscolar })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                  >
                    <option value="MUNICIPAL">Municipal</option>
                    <option value="ESTADUAL">Estadual</option>
                    <option value="PARTICULAR">Particular</option>
                    <option value="FEDERAL">Federal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nome do Diretor(a)</label>
                  <input
                    type="text"
                    value={novaEscola.diretorNome}
                    onChange={(e) => setNovaEscola({ ...novaEscola, diretorNome: e.target.value })}
                    placeholder="Nome do Gestor"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Professor(a) de Ed. Física</label>
                  <input
                    type="text"
                    value={novaEscola.professorRespNome}
                    onChange={(e) => setNovaEscola({ ...novaEscola, professorRespNome: e.target.value })}
                    placeholder="Prof. Responsável"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Bairro</label>
                  <input
                    type="text"
                    value={novaEscola.bairro}
                    onChange={(e) => setNovaEscola({ ...novaEscola, bairro: e.target.value })}
                    placeholder="Ex: Centro"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Telefone / WhatsApp</label>
                  <input
                    type="text"
                    value={novaEscola.telefone}
                    onChange={(e) => setNovaEscola({ ...novaEscola, telefone: e.target.value })}
                    placeholder="(98) 98888-0000"
                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMostrarNovoModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-emerald-500/20"
                >
                  Confirmar e Entrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

