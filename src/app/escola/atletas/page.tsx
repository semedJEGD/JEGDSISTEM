'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Users,
  UserPlus,
  ArrowLeft,
  ArrowRight,
  Camera,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  Search,
  Upload,
  Trophy,
  Sparkles,
  Check,
  X,
  Plus,
  Flame,
  ShieldCheck,
  Layers,
  ChevronRight
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { Escola, Atleta, Genero, TipoDocumento, ModalidadeConfig, ModalidadeCodigo, CategoriaIdade } from '@/types/jegd';
import { JegdsRulesService, PROVAS_ATLETISMO_POR_CATEGORIA } from '@/services/jegds-rules';

export default function EscolaAtletasPage() {
  const router = useRouter();
  const [escola, setEscola] = useState<Escola | null>(null);
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [modalidades, setModalidades] = useState<ModalidadeConfig[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroSexo, setFiltroSexo] = useState<string>('TODOS');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODOS');

  // Modal de Cadastro Rápido em 2 Etapas
  const [modalAberto, setModalAberto] = useState(false);
  const [etapaAtual, setEtapaAtual] = useState<1 | 2>(1);
  const [atletaEditando, setAtletaEditando] = useState<Atleta | null>(null);

  // Form State - Etapa 1 (Dados do Aluno)
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [dataNascimento, setDataNascimento] = useState('2013-05-10');
  const [sexo, setSexo] = useState<Genero>('MASCULINO');
  const [documentoTipo, setDocumentoTipo] = useState<TipoDocumento>('RG');
  const [documentoNumero, setDocumentoNumero] = useState('');
  const [matricula, setMatricula] = useState('');
  const [serieTurma, setSerieTurma] = useState('7º Ano A');
  const [nomeMae, setNomeMae] = useState('');
  const [telefoneContato, setTelefoneContato] = useState('(99) 98888-0000');
  const [tipoSanguineo, setTipoSanguineo] = useState('O+');
  const [consentimentoResponsavel, setConsentimentoResponsavel] = useState(true);
  const [fotoBase64, setFotoBase64] = useState<string | undefined>(undefined);

  // Form State - Etapa 2 (Modalidades & Provas)
  const [modalidadesEscolhidas, setModalidadesEscolhidas] = useState<ModalidadeCodigo[]>([]);
  const [provasAtletismo, setProvasAtletismo] = useState<string[]>([]);

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
    setModalidades(JegdStorage.getModalidades());
  }, []);

  const handleAbrirModalNovo = () => {
    setAtletaEditando(null);
    setEtapaAtual(1);
    setNomeCompleto('');
    setDataNascimento('2013-05-10');
    setSexo('MASCULINO');
    setDocumentoTipo('RG');
    setDocumentoNumero('');
    setMatricula(`MAT-${Math.floor(1000 + Math.random() * 9000)}`);
    setSerieTurma('7º Ano A');
    setNomeMae('');
    setTelefoneContato('(99) 98888-0000');
    setTipoSanguineo('O+');
    setConsentimentoResponsavel(true);
    setFotoBase64(undefined);
    setModalidadesEscolhidas([]);
    setProvasAtletismo([]);
    setModalAberto(true);
  };

  const handleAbrirModalEditar = (atleta: Atleta) => {
    setAtletaEditando(atleta);
    setEtapaAtual(1);
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
    
    const modsInsc = atleta.modalidadesInscritas?.map(m => m.modalidadeCodigo) || [];
    setModalidadesEscolhidas(modsInsc);
    const atletismoInsc = atleta.modalidadesInscritas?.find(m => m.modalidadeCodigo === 'atletismo');
    setProvasAtletismo(atletismoInsc?.provas || []);

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

  const catCalc = JegdsRulesService.calcularCategoria(dataNascimento);

  // Modalidades elegíveis para este aluno
  const modalidadesDisponiveis = modalidades.filter(mod => {
    if (!catCalc.categoria) return false;
    const res = JegdsRulesService.validarMatriz(mod.codigo, catCalc.categoria as CategoriaIdade, sexo);
    return res.valido;
  });

  const provasPermitidas = catCalc.categoria ? (PROVAS_ATLETISMO_POR_CATEGORIA[catCalc.categoria] || []) : [];

  const toggleModalidade = (modCodigo: ModalidadeCodigo) => {
    if (modalidadesEscolhidas.includes(modCodigo)) {
      setModalidadesEscolhidas(modalidadesEscolhidas.filter(c => c !== modCodigo));
      if (modCodigo === 'atletismo') setProvasAtletismo([]);
    } else {
      setModalidadesEscolhidas([...modalidadesEscolhidas, modCodigo]);
    }
  };

  const toggleProva = (prova: string) => {
    if (provasAtletismo.includes(prova)) {
      setProvasAtletismo(provasAtletismo.filter(p => p !== prova));
    } else {
      if (provasAtletismo.length >= 2) {
        alert('No Atletismo, cada atleta pode disputar no máximo 2 provas.');
        return;
      }
      setProvasAtletismo([...provasAtletismo, prova]);
    }
  };

  const handleAvancarParaEtapa2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCompleto.trim() || !dataNascimento || !documentoNumero.trim()) {
      alert('Por favor, preencha o Nome Completo, Data de Nascimento e Documento do estudante.');
      return;
    }

    if (!catCalc.categoria) {
      alert('A data de nascimento informada está fora da faixa etária oficial do JEGDS 2026 (9 a 20 anos).');
      return;
    }

    // Se for primeira vez e só tem uma modalidade, pode auto-selecionar ou avançar
    setEtapaAtual(2);
  };

  const handleSalvarAtleta = (cadastrarProximo: boolean = false) => {
    if (!escola) return;

    if (!nomeCompleto.trim() || !dataNascimento || !documentoNumero.trim()) {
      alert('Por favor, preencha os dados obrigatórios do aluno.');
      setEtapaAtual(1);
      return;
    }

    if (modalidadesEscolhidas.includes('atletismo') && provasAtletismo.length === 0) {
      alert('Selecione ao menos 1 prova de Atletismo para este atleta.');
      return;
    }

    const currentUser = JegdStorage.getCurrentUser();
    const atletaId = atletaEditando ? atletaEditando.id : `atl-${Date.now()}`;

    const modalidadesMapeadas = modalidadesEscolhidas.map(mCod => {
      const modObj = modalidades.find(m => m.codigo === mCod);
      return {
        modalidadeCodigo: mCod,
        modalidadeNome: modObj?.nome || mCod,
        provas: mCod === 'atletismo' ? provasAtletismo : undefined
      };
    });

    const atleta: Atleta = {
      id: atletaId,
      escolaId: escola.id,
      nomeCompleto: nomeCompleto.toUpperCase(),
      dataNascimento,
      sexo,
      documentoTipo,
      documentoNumero,
      matricula: matricula || `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
      serieTurma: serieTurma || 'Regular',
      nomeMae,
      telefoneContato,
      tipoSanguineo,
      consentimentoResponsavel,
      cadastradoPor: currentUser?.nome || escola.responsavelNome,
      categoriaCalculada: (catCalc.categoria as CategoriaIdade) || undefined,
      modalidadesInscritas: modalidadesMapeadas,
      conferidoPeloCoordenador: atletaEditando?.conferidoPeloCoordenador || false,
      observacaoCoordenador: atletaEditando?.observacaoCoordenador,
      documentos: {
        ...(atletaEditando?.documentos || {}),
        foto3x4: fotoBase64
      },
      ativo: true,
      createdAt: atletaEditando ? atletaEditando.createdAt : new Date().toISOString()
    };

    // 1. Salva o Atleta
    JegdStorage.saveAtleta(atleta);

    // 2. Sincroniza e monta automaticamente as equipes correspondentes da escola
    JegdStorage.syncAtletaComEquipes(escola.id, atleta);

    // 3. Atualiza estado
    setAtletas(JegdStorage.getAtletas(escola.id));

    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    } catch {}

    if (cadastrarProximo) {
      handleAbrirModalNovo();
    } else {
      setModalAberto(false);
    }
  };

  const handleExcluirAtleta = (id: string, nome: string) => {
    if (confirm(`Deseja realmente remover o aluno "${nome}"? Ele também será removido das equipes vinculadas.`)) {
      JegdStorage.deleteAtleta(id);
      if (escola) setAtletas(JegdStorage.getAtletas(escola.id));
    }
  };

  if (!escola) return null;

  // Filtragem
  const atletasFiltrados = atletas.filter(atleta => {
    const bateBusca =
      atleta.nomeCompleto.toLowerCase().includes(busca.toLowerCase()) ||
      atleta.documentoNumero.includes(busca) ||
      atleta.matricula.toLowerCase().includes(busca.toLowerCase());
    const bateSexo = filtroSexo === 'TODOS' || atleta.sexo === filtroSexo;
    const bateCat = filtroCategoria === 'TODOS' || atleta.categoriaCalculada === filtroCategoria;
    return bateBusca && bateSexo && bateCat;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/escola/dashboard"
            className="p-2.5 rounded-xl bg-white border border-[#E2EAE5] text-[#68756E] hover:text-[#087A5B] hover:border-[#00A878] shadow-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-[#17221D]">Cadastro Rápido de Alunos & Inscrição</h1>
            <p className="text-xs text-[#68756E] mt-0.5">
              Escola: <strong className="text-[#17221D]">{escola.nome}</strong> ({escola.sigla}) • Gonçalves Dias - MA
            </p>
          </div>
        </div>

        <button
          onClick={handleAbrirModalNovo}
          className="px-5 py-3 rounded-2xl bg-[#00A878] hover:bg-[#087A5B] text-white font-black text-xs shadow-md shadow-[#00A878]/20 flex items-center gap-2 transition-all hover:scale-[1.01] active:scale-95"
        >
          <Sparkles className="w-4 h-4" />
          <span>+ Cadastrar Aluno & Inscrever em Modalidade</span>
        </button>
      </div>

      {/* Barra de Busca & Filtros */}
      <div className="bg-white border border-[#E2EAE5] rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 shadow-sm">
        <div className="sm:col-span-2 relative">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome do aluno, RG ou matrícula..."
            className="w-full px-4 py-2.5 pl-10 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:outline-none focus:border-[#00A878] focus:bg-white"
          />
          <Search className="w-4 h-4 text-[#68756E] absolute left-3.5 top-3" />
        </div>

        <div>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs font-semibold focus:outline-none focus:border-[#00A878] focus:bg-white"
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
            className="w-full px-3 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs font-semibold focus:outline-none focus:border-[#00A878] focus:bg-white"
          >
            <option value="TODOS">Todos os Gêneros</option>
            <option value="MASCULINO">Masculino</option>
            <option value="FEMININO">Feminino</option>
          </select>
        </div>
      </div>

      {/* Grid de Alunos Cadastrados */}
      {atletasFiltrados.length === 0 ? (
        <div className="bg-white border border-[#E2EAE5] rounded-3xl p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-[#E8F7F1] text-[#00A878] flex items-center justify-center mx-auto">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-[#17221D]">Nenhum aluno encontrado</h3>
          <p className="text-xs text-[#68756E] max-w-sm mx-auto">
            Cadastre os alunos-atletas da sua escola. Na 2ª etapa você já escolhe a modalidade e forma a equipe automaticamente!
          </p>
          <button
            onClick={handleAbrirModalNovo}
            className="px-6 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeiro Aluno</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {atletasFiltrados.map((atleta) => {
            return (
              <div
                key={atleta.id}
                className="bg-white border border-[#E2EAE5] rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] flex items-center justify-center overflow-hidden shrink-0">
                        {atleta.documentos?.foto3x4 ? (
                          <img src={atleta.documentos.foto3x4} alt={atleta.nomeCompleto} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-black text-[#087A5B]">
                            {atleta.nomeCompleto.substring(0, 2)}
                          </span>
                        )}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-[#17221D] leading-tight">
                          {atleta.nomeCompleto}
                        </h3>
                        <p className="text-[11px] text-[#68756E] mt-0.5">
                          {atleta.documentoTipo}: <strong>{atleta.documentoNumero}</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#68756E] py-2 border-t border-[#E2EAE5]">
                    <div className="flex items-center justify-between">
                      <span>Categoria:</span>
                      <span className="font-bold text-[#087A5B] bg-[#E8F7F1] px-2 py-0.5 rounded-md border border-[#00A878]/20 text-[11px]">
                        {atleta.categoriaCalculada || 'N/A'} ({atleta.sexo === 'MASCULINO' ? 'Masc' : 'Fem'})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Nascimento:</span>
                      <span className="font-semibold text-[#17221D]">
                        {new Date(atleta.dataNascimento).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Turma / Série:</span>
                      <span className="font-semibold text-[#17221D]">{atleta.serieTurma}</span>
                    </div>
                  </div>

                  {/* Modalidades Inscritas & Equipes Formadas */}
                  <div className="pt-2 border-t border-[#E2EAE5] text-xs text-[#68756E] space-y-1.5">
                    <span className="font-bold text-[#17221D] text-[11px]">Modalidades / Equipes:</span>
                    {atleta.modalidadesInscritas && atleta.modalidadesInscritas.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {atleta.modalidadesInscritas.map((m, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-[#E8F7F1] text-[#087A5B] text-[10px] border border-[#00A878]/20 font-bold"
                          >
                            {m.modalidadeNome} {m.provas && m.provas.length > 0 ? `(${m.provas.join(', ')})` : ''}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-amber-600 italic">Nenhuma modalidade vinculada ainda</p>
                    )}
                  </div>
                </div>

                {/* Ações */}
                <div className="mt-4 pt-3 border-t border-[#E2EAE5] flex items-center justify-between">
                  <span className="text-[10px] text-[#68756E]">
                    Matrícula: <strong>{atleta.matricula}</strong>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAbrirModalEditar(atleta)}
                      className="p-1.5 rounded-lg bg-[#F7F9F8] hover:bg-[#E8F7F1] text-[#68756E] hover:text-[#087A5B] border border-[#E2EAE5] transition-colors"
                      title="Editar Aluno e Modalidades"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleExcluirAtleta(atleta.id, atleta.nomeCompleto)}
                      className="p-1.5 rounded-lg bg-[#F7F9F8] hover:bg-red-50 text-[#68756E] hover:text-red-600 border border-[#E2EAE5] transition-colors"
                      title="Excluir Aluno"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL RÁPIDO EM 2 ETAPAS: DADOS DO ALUNO -> ESCOLHA DA MODALIDADE */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2EAE5] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            
            {/* Header do Modal com Indicador de Etapas */}
            <div className="flex items-center justify-between pb-4 border-b border-[#E2EAE5] mb-6">
              <div>
                <h3 className="text-lg font-black text-[#17221D] flex items-center gap-2">
                  <span>{atletaEditando ? 'Editar Aluno & Inscrição' : 'Cadastro Rápido de Aluno-Atleta'}</span>
                </h3>
                <p className="text-xs text-[#68756E] mt-0.5">
                  {etapaAtual === 1 ? 'Etapa 1 de 2: Dados Pessoais do Aluno' : 'Etapa 2 de 2: Escolha de Modalidade & Formação da Equipe'}
                </p>
              </div>

              <button
                onClick={() => setModalAberto(false)}
                className="p-2 rounded-xl bg-[#F7F9F8] hover:bg-gray-100 text-[#68756E] hover:text-[#17221D] border border-[#E2EAE5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stepper Visual */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button
                type="button"
                onClick={() => setEtapaAtual(1)}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  etapaAtual === 1
                    ? 'bg-[#E8F7F1] border-[#00A878] text-[#087A5B]'
                    : 'bg-[#F7F9F8] border-[#E2EAE5] text-[#68756E]'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-[#00A878] text-white text-[10px] flex items-center justify-center font-black">1</span>
                <span>Dados do Aluno</span>
              </button>

              <button
                type="button"
                onClick={(e) => handleAvancarParaEtapa2(e)}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                  etapaAtual === 2
                    ? 'bg-[#E8F7F1] border-[#00A878] text-[#087A5B]'
                    : 'bg-[#F7F9F8] border-[#E2EAE5] text-[#68756E]'
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-[#087A5B] text-white text-[10px] flex items-center justify-center font-black">2</span>
                <span>Inscrever na Modalidade</span>
              </button>
            </div>

            {/* ETAPA 1: DADOS DO ALUNO */}
            {etapaAtual === 1 && (
              <form onSubmit={handleAvancarParaEtapa2} className="space-y-4">
                
                {/* Upload Foto (Opcional) */}
                <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5]">
                  <div className="w-16 h-20 rounded-xl bg-white border border-[#E2EAE5] flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {fotoBase64 ? (
                      <img src={fotoBase64} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-[#CBD5E1]" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#17221D]">Foto do Atleta (Opcional)</h4>
                    <p className="text-[11px] text-[#68756E] mb-2">Para o Crachá Oficial do JEGDS 2026.</p>
                    <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFotoUpload} className="hidden" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 rounded-lg bg-white border border-[#E2EAE5] text-[#17221D] hover:text-[#087A5B] text-xs font-bold shadow-2xs inline-flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#00A878]" />
                      <span>{fotoBase64 ? 'Trocar Foto' : 'Carregar Imagem'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-[#17221D] mb-1">
                      Nome Completo do Estudante *
                    </label>
                    <input
                      type="text"
                      required
                      value={nomeCompleto}
                      onChange={(e) => setNomeCompleto(e.target.value)}
                      placeholder="Ex: LUCAS GABRIEL OLIVEIRA"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs font-bold uppercase focus:outline-none focus:border-[#00A878] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17221D] mb-1">
                      Data de Nascimento *
                    </label>
                    <input
                      type="date"
                      required
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs font-bold focus:outline-none focus:border-[#00A878] focus:bg-white"
                    />
                    {dataNascimento && (
                      <p className="text-[11px] mt-1 font-bold text-[#087A5B]">
                        {catCalc.mensagem}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17221D] mb-1">
                      Gênero / Sexo *
                    </label>
                    <select
                      value={sexo}
                      onChange={(e) => setSexo(e.target.value as Genero)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs font-bold focus:outline-none focus:border-[#00A878] focus:bg-white"
                    >
                      <option value="MASCULINO">Masculino</option>
                      <option value="FEMININO">Feminino</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17221D] mb-1">
                      Tipo de Documento *
                    </label>
                    <select
                      value={documentoTipo}
                      onChange={(e) => setDocumentoTipo(e.target.value as TipoDocumento)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs font-semibold focus:outline-none focus:border-[#00A878] focus:bg-white"
                    >
                      <option value="RG">RG (Identidade)</option>
                      <option value="CERTIDAO">Certidão de Nascimento</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17221D] mb-1">
                      Número do Documento *
                    </label>
                    <input
                      type="text"
                      required
                      value={documentoNumero}
                      onChange={(e) => setDocumentoNumero(e.target.value)}
                      placeholder="Número obrigatório"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs font-bold focus:outline-none focus:border-[#00A878] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17221D] mb-1">
                      Série / Turma
                    </label>
                    <input
                      type="text"
                      value={serieTurma}
                      onChange={(e) => setSerieTurma(e.target.value)}
                      placeholder="Ex: 8º Ano B"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs font-semibold focus:outline-none focus:border-[#00A878] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#17221D] mb-1">
                      Matrícula Escolar
                    </label>
                    <input
                      type="text"
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value)}
                      placeholder="Ex: MAT-2026"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs font-semibold focus:outline-none focus:border-[#00A878] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E2EAE5]">
                  <button
                    type="button"
                    onClick={() => setModalAberto(false)}
                    className="px-4 py-2.5 rounded-xl bg-[#F7F9F8] hover:bg-gray-100 text-xs font-bold text-[#68756E]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-black shadow-md shadow-[#00A878]/20 flex items-center gap-1.5 transition-all hover:scale-[1.01]"
                  >
                    <span>Avançar para Escolha da Modalidade (Etapa 2)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* ETAPA 2: ESCOLHA DA MODALIDADE & FORMAÇÃO AUTOMÁTICA DA EQUIPE */}
            {etapaAtual === 2 && (
              <div className="space-y-4">
                
                {/* Resumo do Aluno */}
                <div className="bg-[#E8F7F1] border border-[#00A878]/30 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black text-[#087A5B]">
                      {nomeCompleto || 'Aluno Sem Nome'}
                    </h4>
                    <p className="text-[11px] text-[#17221D] mt-0.5">
                      Idade: <strong>{catCalc.idade} anos</strong> • Categoria: <strong className="text-[#087A5B]">{catCalc.categoria}</strong> • Naipe: <strong>{sexo}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEtapaAtual(1)}
                    className="text-xs font-bold text-[#087A5B] hover:underline"
                  >
                    Alterar dados
                  </button>
                </div>

                {/* Modalidades Elegíveis */}
                <div>
                  <label className="block text-xs font-bold text-[#17221D] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-[#00A878]" />
                    <span>Selecione a(s) Modalidade(s) para este Aluno:</span>
                  </label>

                  {modalidadesDisponiveis.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                      <p className="text-xs text-amber-800 font-bold">
                        Nenhuma modalidade oficial disponível para a categoria {catCalc.categoria} ({sexo}) no regulamento.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
                      {modalidadesDisponiveis.map((mod) => {
                        const sel = modalidadesEscolhidas.includes(mod.codigo);
                        
                        // Conta quantos alunos a escola já tem nessa modalidade/categoria/sexo
                        const equipeAtual = JegdStorage.getInscricoes(escola.id).find(
                          i => i.modalidadeCodigo === mod.codigo && i.categoria === catCalc.categoria && i.sexo === sexo
                        );
                        const contagemAtual = equipeAtual ? equipeAtual.atletaIds.length : 0;

                        return (
                          <div
                            key={mod.id}
                            onClick={() => toggleModalidade(mod.codigo)}
                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                              sel
                                ? 'bg-[#E8F7F1] border-[#00A878] shadow-sm'
                                : 'bg-[#F7F9F8] border-[#E2EAE5] text-[#17221D] hover:bg-white hover:border-[#00A878]/40'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-[#17221D]">{mod.nome}</span>
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                                sel ? 'bg-[#00A878] border-[#00A878] text-white' : 'border-[#CBD5E1] bg-white'
                              }`}>
                                {sel && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-[11px] text-[#68756E] mt-2">
                              <span>Tipo: <strong className="text-[#17221D]">{mod.tipo}</strong></span>
                              <span className="text-[#087A5B] font-bold">
                                Equipe: {contagemAtual}/{mod.maxAtletas} atletas
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Sub-seletor de Provas se marcou Atletismo */}
                {modalidadesEscolhidas.includes('atletismo') && (
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-950">
                        Provas de Atletismo ({catCalc.categoria}):
                      </span>
                      <span className="text-[11px] font-bold text-amber-800">
                        {provasAtletismo.length}/2 selecionadas
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {provasPermitidas.map((prova) => {
                        const ativa = provasAtletismo.includes(prova);
                        return (
                          <button
                            type="button"
                            key={prova}
                            onClick={() => toggleProva(prova)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              ativa
                                ? 'bg-amber-500 text-slate-950 shadow-sm'
                                : 'bg-white text-[#17221D] border border-amber-200 hover:border-amber-400'
                            }`}
                          >
                            {prova}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Botões de Ação na Etapa 2 */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t border-[#E2EAE5]">
                  <button
                    type="button"
                    onClick={() => setEtapaAtual(1)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#F7F9F8] hover:bg-gray-100 text-xs font-bold text-[#68756E]"
                  >
                    ← Voltar aos Dados
                  </button>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleSalvarAtleta(true)}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#E8F7F1] hover:bg-[#d8f1e7] text-[#087A5B] font-bold text-xs border border-[#00A878]/30 transition-all"
                    >
                      ⚡ Salvar e Próximo Aluno
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSalvarAtleta(false)}
                      className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-black text-xs shadow-md shadow-[#00A878]/20 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01]"
                    >
                      <Check className="w-4 h-4" />
                      <span>Concluir Inscrição</span>
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
