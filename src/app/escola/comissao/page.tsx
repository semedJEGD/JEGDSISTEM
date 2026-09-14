'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  School,
  UserPlus,
  ArrowLeft,
  Trash2,
  Edit2,
  Shield,
  Phone,
  Mail,
  Award,
  X
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { Escola, MembroComissao } from '@/types/jegd';

export default function EscolaComissaoPage() {
  const router = useRouter();
  const [escola, setEscola] = useState<Escola | null>(null);
  const [comissao, setComissao] = useState<MembroComissao[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [membroEditando, setMembroEditando] = useState<MembroComissao | null>(null);

  // Form State
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [funcao, setFuncao] = useState<'TECNICO' | 'AUXILIAR' | 'DELEGADO' | 'MASSAGISTA_FISIO'>('TECNICO');
  const [registroProfissional, setRegistroProfissional] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    JegdStorage.init();
    const atual = JegdStorage.getCurrentEscola();
    if (!atual) {
      router.push('/escola/login');
      return;
    }
    setEscola(atual);
    setComissao(JegdStorage.getComissao(atual.id));
  }, []);

  const handleAbrirModalNovo = () => {
    setMembroEditando(null);
    setNomeCompleto('');
    setFuncao('TECNICO');
    setRegistroProfissional('CREF 000000-G/MA');
    setCpf('');
    setTelefone('(99) 98888-0000');
    setEmail(escola ? (escola.loginEmail || '') : '');
    setModalAberto(true);
  };

  const handleAbrirModalEditar = (membro: MembroComissao) => {
    setMembroEditando(membro);
    setNomeCompleto(membro.nomeCompleto);
    setFuncao(membro.funcao);
    setRegistroProfissional(membro.registroProfissional || '');
    setCpf(membro.cpf);
    setTelefone(membro.telefone);
    setEmail(membro.email);
    setModalAberto(true);
  };

  const handleSalvarMembro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!escola) return;

    if (!nomeCompleto || !cpf) {
      alert('Por favor, preencha o nome e CPF do membro da comissão.');
      return;
    }

    const membro: MembroComissao = {
      id: membroEditando ? membroEditando.id : `com-${Date.now()}`,
      escolaId: escola.id,
      nomeCompleto,
      funcao,
      registroProfissional,
      cpf,
      telefone,
      email
    };

    JegdStorage.saveComissao(membro);
    setComissao(JegdStorage.getComissao(escola.id));
    setModalAberto(false);
  };

  const handleExcluirMembro = (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir o cadastro do profissional "${nome}"?`)) {
      JegdStorage.deleteComissao(id);
      if (escola) {
        setComissao(JegdStorage.getComissao(escola.id));
      }
    }
  };

  if (!escola) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/escola/dashboard"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white">Comissão Técnica & Professores</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Profissionais responsáveis pela delegação da escola: <strong>{escola.nome}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={handleAbrirModalNovo}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 flex items-center gap-2 transition-all hover:scale-105"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Membro da Comissão</span>
        </button>
      </div>

      {/* Grid de Membros */}
      {comissao.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
          <School className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-base font-bold text-white">Nenhum membro técnico cadastrado.</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            Cadastre os professores de Educação Física e técnicos que irão acompanhar os alunos nos jogos.
          </p>
          <button
            onClick={handleAbrirModalNovo}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Primeiro Professor</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {comissao.map((membro) => (
            <div
              key={membro.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg relative group transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20">
                  {membro.funcao === 'TECNICO' ? 'TÉCNICO RESPONSÁVEL' : membro.funcao}
                </span>
                <span className="text-xs text-slate-400 font-medium">CREF / Registro</span>
              </div>

              <h3 className="text-base font-bold text-white mb-2">
                {membro.nomeCompleto}
              </h3>

              <div className="space-y-1.5 text-xs text-slate-400">
                <p className="flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-slate-300 font-semibold">{membro.registroProfissional || 'Sem CREF informado'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>{membro.telefone}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{membro.email}</span>
                </p>
                <p className="text-[11px] text-slate-500 pt-1">
                  CPF: {membro.cpf}
                </p>
              </div>

              {/* Ações */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleAbrirModalEditar(membro)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Editar Membro"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleExcluirMembro(membro.id, membro.nomeCompleto)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                  title="Excluir Membro"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Cadastro / Edição */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
            
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {membroEditando ? 'Editar Membro da Comissão' : 'Cadastrar Membro Técnico'}
                </h3>
                <p className="text-xs text-slate-400">
                  Cadastre o professor de Ed. Física ou dirigente oficial da delegação.
                </p>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarMembro} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nome Completo do Profissional *
                </label>
                <input
                  type="text"
                  required
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  placeholder="Ex: Prof. Carlos Eduardo Silveira"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Função na Delegação
                  </label>
                  <select
                    value={funcao}
                    onChange={(e) => setFuncao(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-teal-500"
                  >
                    <option value="TECNICO">Técnico Principal</option>
                    <option value="AUXILIAR">Auxiliar Técnico</option>
                    <option value="DELEGADO">Delegado da Escola</option>
                    <option value="MASSAGISTA_FISIO">Massagista / Fisioterapeuta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    CREF / Registro Profissional
                  </label>
                  <input
                    type="text"
                    value={registroProfissional}
                    onChange={(e) => setRegistroProfissional(e.target.value)}
                    placeholder="Ex: CREF 012498-G/MA"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    CPF *
                  </label>
                  <input
                    type="text"
                    required
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(98) 98888-0000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  E-mail de Contato
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="professor@escola.edu.br"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-teal-500/20 transition-all hover:scale-105"
                >
                  {membroEditando ? 'Salvar Alterações' : 'Concluir Cadastro'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
