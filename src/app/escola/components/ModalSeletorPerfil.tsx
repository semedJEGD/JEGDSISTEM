'use client';

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  User, 
  UserPlus, 
  Sparkles, 
  CheckCircle2, 
  Trash2, 
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  X
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { Escola, ProfessorPerfil, PerfilAtivoEscola } from '@/types/jegd';

interface ModalSeletorPerfilProps {
  isOpen: boolean;
  escola: Escola;
  onSelecionarPerfil: (perfil: PerfilAtivoEscola) => void;
  onClose?: () => void;
  permitirFechar?: boolean;
}

export function ModalSeletorPerfil({
  isOpen,
  escola,
  onSelecionarPerfil,
  onClose,
  permitirFechar = false
}: ModalSeletorPerfilProps) {
  const [professores, setProfessores] = useState<ProfessorPerfil[]>([]);
  const [modoCriarProfessor, setModoCriarProfessor] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoTelefone, setNovoTelefone] = useState('');
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (isOpen && escola) {
      carregarProfessores();
    }
  }, [isOpen, escola]);

  const carregarProfessores = () => {
    const list = JegdStorage.getProfessoresEscola(escola.id);
    setProfessores(list);
  };

  if (!isOpen) return null;

  const handleEscolherDirecao = () => {
    const perfil: PerfilAtivoEscola = {
      tipo: 'DIRECAO',
      nome: escola.responsavelNome || 'Direção Escolar'
    };
    JegdStorage.setCurrentPerfilEscola(perfil);
    onSelecionarPerfil(perfil);
  };

  const handleEscolherProfessor = (prof: ProfessorPerfil) => {
    const perfil: PerfilAtivoEscola = {
      tipo: 'PROFESSOR',
      nome: prof.nome,
      id: prof.id
    };
    JegdStorage.setCurrentPerfilEscola(perfil);
    onSelecionarPerfil(perfil);
  };

  const handleSalvarNovoProfessor = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!novoNome.trim()) {
      setErro('Informe o nome completo do professor.');
      return;
    }

    const criado = JegdStorage.saveProfessorEscola(escola.id, novoNome, novoTelefone);
    setModoCriarProfessor(false);
    setNovoNome('');
    setNovoTelefone('');
    carregarProfessores();

    // Já entra diretamente no perfil recém-criado
    handleEscolherProfessor(criado);
  };

  const handleRemoverProfessor = (e: React.MouseEvent, profId: string) => {
    e.stopPropagation();
    if (confirm('Deseja remover este perfil de professor?')) {
      JegdStorage.deleteProfessorEscola(escola.id, profId);
      carregarProfessores();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-[#E2EAE5] rounded-3xl max-w-2xl w-full p-5 sm:p-8 shadow-2xl relative my-auto">
        
        {permitirFechar && onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header estilo 'Quem está assistindo?' */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8F7F1] border border-[#00A878]/30 text-[#087A5B] text-xs font-black mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Perfil de Acesso Escolar</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#17221D]">
            Quem está usando o sistema agora?
          </h2>
          <p className="text-xs sm:text-sm text-[#4B5563] mt-1 font-medium">
            Escola: <strong className="text-[#17221D]">{escola.nome}</strong> ({escola.sigla})
          </p>
          <p className="text-[11px] text-[#64748B] mt-0.5">
            Selecione seu perfil sem senha para identificar quem cadastrou os atletas e liberar as ações de Direção.
          </p>
        </div>

        {/* MODO NORMAL: LISTA DE PERFIS */}
        {!modoCriarProfessor ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              
              {/* CARD DA DIREÇÃO / COORDENAÇÃO */}
              <button
                type="button"
                onClick={handleEscolherDirecao}
                className="group relative p-4 sm:p-5 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/70 to-white hover:border-[#00A878] hover:shadow-lg transition-all text-left flex items-start gap-3.5"
              >
                <div className="w-12 h-12 rounded-2xl bg-[#00A878] text-white flex items-center justify-center shadow-md shadow-[#00A878]/25 group-hover:scale-105 transition-transform shrink-0">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-black text-[#17221D] group-hover:text-[#087A5B] transition-colors">
                      Direção / Secretaria
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Homologação
                    </span>
                  </div>
                  <p className="text-xs text-[#4B5563] mt-1 font-medium">
                    Homologa e aprova as delegações da escola para a SEMED.
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#087A5B] mt-2 group-hover:translate-x-1 transition-transform">
                    <span>Entrar como Direção</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </button>

              {/* LISTA DOS PROFESSORES JÁ REGISTRADOS */}
              {professores.map((prof) => (
                <div
                  key={prof.id}
                  onClick={() => handleEscolherProfessor(prof)}
                  className="group relative p-4 sm:p-5 rounded-2xl border border-[#E2EAE5] bg-white hover:border-[#00A878] hover:bg-[#F7F9F8] hover:shadow-md transition-all cursor-pointer flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-lg group-hover:scale-105 transition-transform shrink-0 border border-amber-300">
                      🏃
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-black text-[#17221D] group-hover:text-[#087A5B] transition-colors truncate">
                          {prof.nome}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                          Ed. Física
                        </span>
                      </div>
                      <p className="text-xs text-[#64748B] mt-1">
                        Cadastra estudantes e monta equipes esportivas.
                      </p>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#087A5B] mt-2 group-hover:translate-x-1 transition-transform">
                        <span>Acessar perfil</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleRemoverProfessor(e, prof.id)}
                    title="Excluir este perfil de professor"
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* CARD PARA ADICIONAR NOVO PROFESSOR */}
              <button
                type="button"
                onClick={() => setModoCriarProfessor(true)}
                className="p-4 sm:p-5 rounded-2xl border-2 border-dashed border-[#CBD5E1] hover:border-[#00A878] hover:bg-emerald-50/40 text-left flex items-center gap-3.5 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-gray-100 group-hover:bg-[#E8F7F1] text-gray-400 group-hover:text-[#00A878] flex items-center justify-center transition-colors shrink-0">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#17221D] group-hover:text-[#087A5B]">
                    + Adicionar Outro Professor
                  </h4>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Se sua escola tem outro professor de Ed. Física, clique aqui.
                  </p>
                </div>
              </button>

            </div>

            <div className="pt-3 border-t border-[#E2EAE5] flex items-center justify-between text-xs text-[#64748B]">
              <span>💡 Dica: Você pode alternar de perfil a qualquer momento no topo da página.</span>
            </div>
          </div>
        ) : (
          /* MODO CADASTRO RÁPIDO DE NOVO PROFESSOR (SEM SENHA) */
          <form onSubmit={handleSalvarNovoProfessor} className="space-y-4 animate-fadeIn">
            <div className="bg-[#E8F7F1] p-3.5 rounded-2xl border border-[#00A878]/30 text-xs text-[#087A5B]">
              <strong>Cadastro Rápido do Professor:</strong> Digite apenas o nome para criar o perfil. Não precisa de senha!
            </div>

            {erro && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                {erro}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#17221D] uppercase tracking-wider mb-1">
                Nome do Professor de Educação Física *
              </label>
              <input
                type="text"
                required
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                placeholder="Ex: Prof. Carlos Eduardo Souza"
                className="w-full px-4 py-3 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#17221D] uppercase tracking-wider mb-1">
                Telefone / WhatsApp (Opcional)
              </label>
              <input
                type="text"
                value={novoTelefone}
                onChange={(e) => setNovoTelefone(e.target.value)}
                placeholder="(99) 98888-0000"
                className="w-full px-4 py-3 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2EAE5]">
              <button
                type="button"
                onClick={() => setModoCriarProfessor(false)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-black shadow-md flex items-center gap-1.5"
              >
                <span>Criar Perfil e Entrar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
