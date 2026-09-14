'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  ArrowLeft,
  Camera,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  Search,
  Upload,
  FileText,
  IdCard,
  Phone,
  Calendar,
  X
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { Escola, Atleta, Genero } from '@/types/jegd';

export default function EscolaAtletasPage() {
  const router = useRouter();
  const [escola, setEscola] = useState<Escola | null>(null);
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroGenero, setFiltroGenero] = useState<string>('TODOS');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODOS');

  // Modal de Cadastro / Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [atletaEditando, setAtletaEditando] = useState<Atleta | null>(null);

  // Form State
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [matricula, setMatricula] = useState('');
  const [serieTurma, setSerieTurma] = useState('');
  const [genero, setGenero] = useState<Genero>('MASCULINO');
  const [nomeMae, setNomeMae] = useState('');
  const [telefoneContato, setTelefoneContato] = useState('');
  const [tipoSanguineo, setTipoSanguineo] = useState('O+');
  const [alergiasCuidados, setAlergiasCuidados] = useState('');
  const [fotoBase64, setFotoBase64] = useState<string | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    JegdStorage.init();
    const atual = JegdStorage.getCurrentEscola();
    if (!atual) {
      router.push('/escola/login');
      return;
    }
    setEscola(atual);
    setAtletas(JegdStorage.getAtletas(atual.id));
  }, []);

  const handleAbrirModalNovo = () => {
    setAtletaEditando(null);
    setNomeCompleto('');
    setDataNascimento('2012-05-10');
    setCpf('');
    setRg('');
    setMatricula('');
    setSerieTurma('7º Ano A');
    setGenero('MASCULINO');
    setNomeMae('');
    setTelefoneContato('(98) 98888-0000');
    setTipoSanguineo('O+');
    setAlergiasCuidados('');
    setFotoBase64(undefined);
    setModalAberto(true);
  };

  const handleAbrirModalEditar = (atleta: Atleta) => {
    setAtletaEditando(atleta);
    setNomeCompleto(atleta.nomeCompleto);
    setDataNascimento(atleta.dataNascimento);
    setCpf(atleta.cpf);
    setRg(atleta.rg);
    setMatricula(atleta.matricula);
    setSerieTurma(atleta.serieTurma);
    setGenero(atleta.genero);
    setNomeMae(atleta.nomeMae);
    setTelefoneContato(atleta.telefoneContato);
    setTipoSanguineo(atleta.tipoSanguineo || 'O+');
    setAlergiasCuidados(atleta.alergiasCuidados || '');
    setFotoBase64(atleta.documentos?.foto3x4);
    setModalAberto(true);
  };

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('A foto deve ter no máximo 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSalvarAtleta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!escola) return;

    if (!nomeCompleto || !dataNascimento || !matricula) {
      alert('Por favor, preencha os campos obrigatórios.');
      return;
    }

    const { categoria } = JegdStorage.calcularCategoria(dataNascimento);
    if (!categoria) {
      if (!confirm('Atenção: A data de nascimento deste aluno não se enquadra nas categorias oficiais (Infantil 12-14 anos ou Infanto 15-17 anos). Deseja salvar mesmo assim?')) {
        return;
      }
    }

    const atleta: Atleta = {
      id: atletaEditando ? atletaEditando.id : `atl-${Date.now()}`,
      escolaId: escola.id,
      nomeCompleto,
      dataNascimento,
      cpf,
      rg,
      matricula,
      serieTurma,
      genero,
      nomeMae,
      telefoneContato,
      tipoSanguineo,
      alergiasCuidados,
      documentos: {
        ...(atletaEditando?.documentos || {}),
        foto3x4: fotoBase64
      },
      ativo: true,
      createdAt: atletaEditando ? atletaEditando.createdAt : new Date().toISOString()
    };

    JegdStorage.saveAtleta(atleta);
    setAtletas(JegdStorage.getAtletas(escola.id));
    setModalAberto(false);
  };

  const handleExcluirAtleta = (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir o cadastro do aluno "${nome}"?`)) {
      JegdStorage.deleteAtleta(id);
      if (escola) {
        setAtletas(JegdStorage.getAtletas(escola.id));
      }
    }
  };

  if (!escola) return null;

  // Filtros
  const atletasFiltrados = atletas.filter(a => {
    const bateBusca = a.nomeCompleto.toLowerCase().includes(busca.toLowerCase()) ||
                      a.matricula.includes(busca) ||
                      a.cpf.includes(busca);
    const bateGenero = filtroGenero === 'TODOS' || a.genero === filtroGenero;
    
    const infoCat = JegdStorage.calcularCategoria(a.dataNascimento);
    const bateCategoria = filtroCategoria === 'TODOS' || infoCat.categoria === filtroCategoria;

    return bateBusca && bateGenero && bateCategoria;
  });

  const catCalc = JegdStorage.calcularCategoria(dataNascimento);

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
            <h1 className="text-2xl font-black text-white">Banco de Estudantes-Atletas</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Unidade Escolar: <strong>{escola.nome}</strong> ({escola.sigla})
            </p>
          </div>
        </div>

        <button
          onClick={handleAbrirModalNovo}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all hover:scale-105"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Novo Atleta</span>
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2 relative">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, matrícula ou CPF..."
            className="w-full px-4 py-2.5 pl-10 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>

        <div>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
          >
            <option value="TODOS">Todas as Categorias</option>
            <option value="INFANTIL">Infantil (12 a 14 anos)</option>
            <option value="INFANTO">Infanto (15 a 17 anos)</option>
          </select>
        </div>

        <div>
          <select
            value={filtroGenero}
            onChange={(e) => setFiltroGenero(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
          >
            <option value="TODOS">Todos os Gêneros</option>
            <option value="MASCULINO">Masculino</option>
            <option value="FEMININO">Feminino</option>
          </select>
        </div>
      </div>

      {/* Grid de Atletas */}
      {atletasFiltrados.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center">
          <Users className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-base font-bold text-white">Nenhum atleta encontrado.</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            Adicione os alunos de sua escola para poder inscrevê-los nas modalidades dos Jogos Escolares.
          </p>
          <button
            onClick={handleAbrirModalNovo}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Primeiro Atleta</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {atletasFiltrados.map((atleta) => {
            const catInfo = JegdStorage.calcularCategoria(atleta.dataNascimento);

            return (
              <div
                key={atleta.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg relative group transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  {/* Foto ou Avatar */}
                  <div className="w-16 h-20 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden relative shadow-inner">
                    {atleta.documentos?.foto3x4 ? (
                      <img
                        src={atleta.documentos.foto3x4}
                        alt={atleta.nomeCompleto}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-1">
                        <Users className="w-6 h-6 text-slate-600 mx-auto mb-0.5" />
                        <span className="text-[9px] text-slate-500 font-semibold uppercase">Sem foto</span>
                      </div>
                    )}
                  </div>

                  {/* Informações Principais */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-400">
                        {atleta.genero}
                      </span>
                      {catInfo.categoria ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {catInfo.categoria} ({catInfo.idade} anos)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                          Não Elegível
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-white truncate mt-1" title={atleta.nomeCompleto}>
                      {atleta.nomeCompleto}
                    </h3>
                    
                    <p className="text-xs text-slate-400 mt-1">
                      Matrícula: <strong className="text-slate-200">{atleta.matricula}</strong>
                    </p>
                    <p className="text-xs text-slate-400">
                      Turma: <strong className="text-slate-200">{atleta.serieTurma}</strong>
                    </p>
                  </div>
                </div>

                {/* Detalhes Adicionais */}
                <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
                  <p className="flex items-center justify-between">
                    <span>Nascimento:</span>
                    <strong className="text-slate-200">{new Date(atleta.dataNascimento).toLocaleDateString('pt-BR')}</strong>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>CPF / RG:</span>
                    <strong className="text-slate-200">{atleta.cpf || atleta.rg || 'Não informado'}</strong>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Tipo Sanguíneo:</span>
                    <strong className="text-emerald-400 font-semibold">{atleta.tipoSanguineo || 'O+'}</strong>
                  </p>
                </div>

                {/* Ações */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleAbrirModalEditar(atleta)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Editar Cadastro"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleExcluirAtleta(atleta.id, atleta.nomeCompleto)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    title="Excluir Atleta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro / Edição do Aluno */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {atletaEditando ? 'Editar Cadastro do Atleta' : 'Novo Aluno-Atleta'}
                </h3>
                <p className="text-xs text-slate-400">
                  Preencha os dados oficiais do estudante conforme a certidão / RG e matrícula escolar.
                </p>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarAtleta} className="space-y-4">
              
              {/* Foto 3x4 Upload Box */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                <div className="w-24 h-32 rounded-xl bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden shrink-0 relative group">
                  {fotoBase64 ? (
                    <img src={fotoBase64} alt="Preview Foto" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2">
                      <Camera className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400">Foto 3x4</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Foto 3x4 para Crachá Oficial
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Anexe uma foto nítida do rosto do aluno. Essa foto será impressa na Ficha Oficial e no Crachá com QR Code.
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold hover:bg-emerald-500/30 transition-colors inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Carregar Foto</span>
                  </button>
                  {fotoBase64 && (
                    <button
                      type="button"
                      onClick={() => setFotoBase64(undefined)}
                      className="ml-2 text-xs text-red-400 hover:underline"
                    >
                      Remover foto
                    </button>
                  )}
                </div>
              </div>

              {/* Dados Pessoais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome Completo do Aluno *
                  </label>
                  <input
                    type="text"
                    required
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    placeholder="Nome completo sem abreviações"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                  />
                  {dataNascimento && (
                    <p className="text-[11px] mt-1 font-semibold text-emerald-400">
                      {catCalc.statusText}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Gênero / Naipe *
                  </label>
                  <select
                    value={genero}
                    onChange={(e) => setGenero(e.target.value as Genero)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                  >
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMININO">Feminino</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    CPF
                  </label>
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    RG / Certidão de Nascimento
                  </label>
                  <input
                    type="text"
                    value={rg}
                    onChange={(e) => setRg(e.target.value)}
                    placeholder="Número do documento"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Matrícula Escolar *
                  </label>
                  <input
                    type="text"
                    required
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    placeholder="Ex: 20261045"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Série / Turma *
                  </label>
                  <input
                    type="text"
                    required
                    value={serieTurma}
                    onChange={(e) => setSerieTurma(e.target.value)}
                    placeholder="Ex: 8º Ano C"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome da Mãe ou Responsável Legal
                  </label>
                  <input
                    type="text"
                    value={nomeMae}
                    onChange={(e) => setNomeMae(e.target.value)}
                    placeholder="Nome completo do responsável"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Telefone de Contato (WhatsApp)
                  </label>
                  <input
                    type="text"
                    value={telefoneContato}
                    onChange={(e) => setTelefoneContato(e.target.value)}
                    placeholder="(98) 98888-0000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Botões do Rodapé */}
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
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
                >
                  {atletaEditando ? 'Salvar Alterações' : 'Concluir Cadastro'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
