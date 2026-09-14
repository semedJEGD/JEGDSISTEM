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
            className="p-2.5 rounded-xl bg-white border border-[#E2EAE5] text-[#68756E] hover:text-[#17221D] transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-[#17221D]">Comissão Técnica & Professores</h1>
            <p className="text-xs text-[#68756E] mt-0.5">
              Profissionais responsáveis pela delegação da escola: <strong className="text-[#17221D]">{escola.nome}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={handleAbrirModalNovo}
          className="px-5 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-bold text-xs shadow-xs hover:shadow-md flex items-center gap-2 transition-all active:scale-98"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Membro da Comissão</span>
        </button>
      </div>

      {/* Grid de Membros */}
      {comissao.length === 0 ? (
        <div className="bg-white border border-[#E2EAE5] rounded-3xl p-12 text-center shadow-xs">
          <School className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
          <p className="text-base font-bold text-[#17221D]">Nenhum membro técnico cadastrado.</p>
          <p className="text-xs text-[#68756E] max-w-sm mx-auto mt-1 mb-6">
            Cadastre os professores de Educação Física e técnicos que irão acompanhar os alunos nos jogos.
          </p>
          <button
            onClick={handleAbrirModalNovo}
            className="px-5 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs"
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
              className="bg-white border border-[#E2EAE5] hover:border-[#00A878]/50 rounded-2xl p-5 shadow-xs hover:shadow-md relative group transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#EDF7F2] text-[#087A5B] border border-[#00A878]/20">
                  {membro.funcao === 'TECNICO' ? 'TÉCNICO RESPONSÁVEL' : membro.funcao}
                </span>
                <span className="text-xs text-[#68756E] font-medium">CREF / Registro</span>
              </div>

              <h3 className="text-base font-bold text-[#17221D] mb-2">
                {membro.nomeCompleto}
              </h3>

              <div className="space-y-1.5 text-xs text-[#68756E]">
                <p className="flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-[#17221D] font-semibold">{membro.registroProfissional || 'Sem CREF informado'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-[#00A878] shrink-0" />
                  <span>{membro.telefone}</span>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#68756E] shrink-0" />
                  <span className="truncate">{membro.email}</span>
                </p>
                <p className="text-[11px] text-[#94A3B8] pt-1">
                  CPF: {membro.cpf}
                </p>
              </div>

              {/* Ações */}
              <div className="mt-4 pt-3 border-t border-[#E2EAE5] flex items-center justify-end gap-2">
                <button
                  onClick={() => handleAbrirModalEditar(membro)}
                  className="p-2 rounded-lg bg-[#F7F9F8] hover:bg-[#E8F7F1] text-[#68756E] hover:text-[#087A5B] transition-colors border border-[#E2EAE5]"
                  title="Editar Membro"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleExcluirMembro(membro.id, membro.nomeCompleto)}
                  className="p-2 rounded-lg bg-[#F7F9F8] hover:bg-rose-50 text-[#68756E] hover:text-rose-600 transition-colors border border-[#E2EAE5]"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2EAE5] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-xl relative my-8">
            
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E2EAE5]">
              <div>
                <h3 className="text-lg font-black text-[#17221D]">
                  {membroEditando ? 'Editar Membro da Comissão' : 'Cadastrar Membro Técnico'}
                </h3>
                <p className="text-xs text-[#68756E]">
                  Cadastre o professor de Ed. Física ou dirigente oficial da delegação.
                </p>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="p-2 rounded-xl bg-[#F7F9F8] hover:bg-slate-100 text-[#68756E] hover:text-[#17221D] border border-[#E2EAE5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarMembro} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#17221D] mb-1">
                  Nome Completo do Profissional *
                </label>
                <input
                  type="text"
                  required
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  placeholder="Ex: Prof. Carlos Eduardo Silveira"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:border-[#00A878] focus:bg-white outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17221D] mb-1">
                    Função na Delegação
                  </label>
                  <select
                    value={funcao}
                    onChange={(e) => setFuncao(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:border-[#00A878] outline-none font-medium"
                  >
                    <option value="TECNICO">Técnico Principal</option>
                    <option value="AUXILIAR">Auxiliar Técnico</option>
                    <option value="DELEGADO">Delegado da Escola</option>
                    <option value="MASSAGISTA_FISIO">Massagista / Fisioterapeuta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17221D] mb-1">
                    CREF / Registro Profissional
                  </label>
                  <input
                    type="text"
                    value={registroProfissional}
                    onChange={(e) => setRegistroProfissional(e.target.value)}
                    placeholder="Ex: CREF 012498-G/MA"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:border-[#00A878] focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17221D] mb-1">
                    CPF *
                  </label>
                  <input
                    type="text"
                    required
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:border-[#00A878] focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17221D] mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(98) 98888-0000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:border-[#00A878] focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17221D] mb-1">
                  E-mail de Contato
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="professor@escola.edu.br"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:border-[#00A878] focus:bg-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#E2EAE5]">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#F7F9F8] hover:bg-slate-100 text-xs font-semibold text-[#17221D] border border-[#E2EAE5]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold shadow-xs hover:shadow-md"
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

