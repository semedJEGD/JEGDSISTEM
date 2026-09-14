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
  ShieldCheck,
  X
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { Escola, Atleta, Genero, TipoDocumento } from '@/types/jegd';
import { JegdsRulesService } from '@/services/jegds-rules';

export default function EscolaAtletasPage() {
  const router = useRouter();
  const [escola, setEscola] = useState<Escola | null>(null);
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroSexo, setFiltroSexo] = useState<string>('TODOS');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODOS');

  // Modal de Cadastro / Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [atletaEditando, setAtletaEditando] = useState<Atleta | null>(null);

  // Form State
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [dataNascimento, setDataNascimento] = useState('2013-05-10');
  const [sexo, setSexo] = useState<Genero>('MASCULINO');
  const [documentoTipo, setDocumentoTipo] = useState<TipoDocumento>('RG');
  const [documentoNumero, setDocumentoNumero] = useState('');
  const [matricula, setMatricula] = useState('');
  const [serieTurma, setSerieTurma] = useState('');
  const [nomeMae, setNomeMae] = useState('');
  const [telefoneContato, setTelefoneContato] = useState('');
  const [tipoSanguineo, setTipoSanguineo] = useState('O+');
  const [consentimentoResponsavel, setConsentimentoResponsavel] = useState(true);
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
    setDataNascimento('2013-05-10');
    setSexo('MASCULINO');
    setDocumentoTipo('RG');
    setDocumentoNumero('');
    setMatricula('');
    setSerieTurma('7º Ano A');
    setNomeMae('');
    setTelefoneContato('(99) 98888-0000');
    setTipoSanguineo('O+');
    setConsentimentoResponsavel(true);
    setFotoBase64(undefined);
    setModalAberto(true);
  };

  const handleAbrirModalEditar = (atleta: Atleta) => {
    setAtletaEditando(atleta);
    setNomeCompleto(atleta.nomeCompleto);
    setDataNascimento(atleta.dataNascimento);
    setSexo(atleta.sexo);
    setDocumentoTipo(atleta.documentoTipo || 'RG');
    setDocumentoNumero(atleta.documentoNumero || '');
    setMatricula(atleta.matricula);
    setSerieTurma(atleta.serieTurma);
    setNomeMae(atleta.nomeMae || '');
    setTelefoneContato(atleta.telefoneContato);
    setTipoSanguineo(atleta.tipoSanguineo || 'O+');
    setConsentimentoResponsavel(atleta.consentimentoResponsavel);
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

    if (!nomeCompleto || !dataNascimento || !documentoNumero) {
      alert('Por favor, preencha todos os campos obrigatórios (Nome, Nascimento e Documento).');
      return;
    }

    const valDoc = JegdsRulesService.validarDocumento(documentoTipo, documentoNumero);
    if (!valDoc.valido) {
      alert(valDoc.erro);
      return;
    }

    const { categoria } = JegdsRulesService.calcularCategoria(dataNascimento);
    if (!categoria) {
      if (!confirm('Atenção: A data de nascimento deste aluno não se enquadra nas categorias oficiais do JEGDS 2026 (Mirim 9-11, Infantil 12-14, Infanto 15-17 ou Junior 18-20). Deseja salvar mesmo assim?')) {
        return;
      }
    }

    if (!consentimentoResponsavel) {
      alert('É obrigatório confirmar o consentimento do responsável para cadastrar o atleta menor de idade (LGPD).');
      return;
    }

    const atleta: Atleta = {
      id: atletaEditando ? atletaEditando.id : `atl-${Date.now()}`,
      escolaId: escola.id,
      nomeCompleto,
      dataNascimento,
      sexo,
      documentoTipo,
      documentoNumero,
      matricula,
      serieTurma,
      nomeMae,
      telefoneContato,
      tipoSanguineo,
      consentimentoResponsavel,
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
      if (escola) setAtletas(JegdStorage.getAtletas(escola.id));
    }
  };

  if (!escola) return null;

  // Filtros
  const atletasFiltrados = atletas.filter(a => {
    const bateBusca = a.nomeCompleto.toLowerCase().includes(busca.toLowerCase()) ||
                      a.matricula.includes(busca) ||
                      a.documentoNumero.includes(busca);
    const bateSexo = filtroSexo === 'TODOS' || a.sexo === filtroSexo;
    
    const infoCat = JegdsRulesService.calcularCategoria(a.dataNascimento);
    const bateCategoria = filtroCategoria === 'TODOS' || infoCat.categoria === filtroCategoria;

    return bateBusca && bateSexo && bateCategoria;
  });

  const catCalc = JegdsRulesService.calcularCategoria(dataNascimento);

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
              Escola: <strong>{escola.nome}</strong> ({escola.sigla}) • Gonçalves Dias - MA
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

      {/* Barra de Filtros */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="sm:col-span-2 relative">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, matrícula ou documento..."
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
            <option value="MIRIM">Mirim (9 a 11 anos)</option>
            <option value="INFANTIL">Infantil (12 a 14 anos)</option>
            <option value="INFANTO">Infanto (15 a 17 anos)</option>
            <option value="JUNIOR">Junior (18 a 20 anos)</option>
          </select>
        </div>

        <div>
          <select
            value={filtroSexo}
            onChange={(e) => setFiltroSexo(e.target.value)}
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
          <button
            onClick={handleAbrirModalNovo}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2 mt-4"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Primeiro Atleta</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {atletasFiltrados.map((atleta) => {
            const catInfo = JegdsRulesService.calcularCategoria(atleta.dataNascimento);

            return (
              <div
                key={atleta.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg relative group transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  {/* Foto */}
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
                        <span className="text-[8px] text-slate-500 font-semibold uppercase">Sem foto</span>
                      </div>
                    )}
                  </div>

                  {/* Informações */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-400">
                        {atleta.sexo}
                      </span>
                      {catInfo.categoria ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {catInfo.categoria} ({catInfo.idade} anos)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">
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

                <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-400 space-y-1">
                  <p className="flex items-center justify-between">
                    <span>Nascimento:</span>
                    <strong className="text-slate-200">{new Date(atleta.dataNascimento).toLocaleDateString('pt-BR')}</strong>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Documento ({atleta.documentoTipo}):</span>
                    <strong className="text-slate-200">{atleta.documentoNumero}</strong>
                  </p>
                  <p className="flex items-center justify-between">
                    <span>Consentimento Pais:</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Autorizado
                    </span>
                  </p>
                </div>

                {/* Ações */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleAbrirModalEditar(atleta)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleExcluirAtleta(atleta.id, atleta.nomeCompleto)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro / Edição */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {atletaEditando ? 'Editar Cadastro do Atleta' : 'Novo Aluno-Atleta JEGDS 2026'}
                </h3>
                <p className="text-xs text-slate-400">
                  Dados oficiais para credenciamento e validação pelo Comitê Organizador.
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
              
              {/* Foto Upload Box */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                <div className="w-24 h-32 rounded-xl bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center overflow-hidden shrink-0">
                  {fotoBase64 ? (
                    <img src={fotoBase64} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2">
                      <Camera className="w-6 h-6 text-slate-500 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400">Foto 3x4</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Foto 3x4 do Estudante
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Será impressa no Crachá Oficial com QR Code.
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
                </div>
              </div>

              {/* Dados */}
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
                    placeholder="Nome completo do estudante"
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
                      {catCalc.mensagem}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Gênero / Sexo *
                  </label>
                  <select
                    value={sexo}
                    onChange={(e) => setSexo(e.target.value as Genero)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                  >
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMININO">Feminino</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tipo de Documento *
                  </label>
                  <select
                    value={documentoTipo}
                    onChange={(e) => setDocumentoTipo(e.target.value as TipoDocumento)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                  >
                    <option value="RG">RG (Carteira de Identidade)</option>
                    <option value="CERTIDAO">Certidão de Nascimento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Número do Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={documentoNumero}
                    onChange={(e) => setDocumentoNumero(e.target.value)}
                    placeholder="Número obrigatório do documento"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Matrícula Escolar
                  </label>
                  <input
                    type="text"
                    value={matricula}
                    onChange={(e) => setMatricula(e.target.value)}
                    placeholder="Ex: 2026-GD-100"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Série / Turma
                  </label>
                  <input
                    type="text"
                    value={serieTurma}
                    onChange={(e) => setSerieTurma(e.target.value)}
                    placeholder="Ex: 8º Ano B"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Telefone WhatsApp
                  </label>
                  <input
                    type="text"
                    value={telefoneContato}
                    onChange={(e) => setTelefoneContato(e.target.value)}
                    placeholder="(99) 98888-0000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tipo Sanguíneo
                  </label>
                  <select
                    value={tipoSanguineo}
                    onChange={(e) => setTipoSanguineo(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:border-emerald-500"
                  >
                    <option value="O+">O+</option>
                    <option value="A+">A+</option>
                    <option value="B+">B+</option>
                    <option value="AB+">AB+</option>
                    <option value="O-">O-</option>
                    <option value="A-">A-</option>
                    <option value="B-">B-</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              {/* Consentimento LGPD */}
              <div className="p-3.5 rounded-xl bg-slate-800 border border-slate-700 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="consentimentoLgpd"
                  checked={consentimentoResponsavel}
                  onChange={(e) => setConsentimentoResponsavel(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-600 mt-0.5"
                />
                <label htmlFor="consentimentoLgpd" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
                  <strong>Consentimento LGPD:</strong> Confirmo que o pai/mãe ou responsável legal do estudante-atleta menor de idade está ciente e formalmente autorizou sua participação nos Jogos Escolares de Gonçalves Dias (JEGDS 2026).
                </label>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg"
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
