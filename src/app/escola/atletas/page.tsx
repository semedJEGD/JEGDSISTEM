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
  ChevronRight,
  Printer,
  QrCode
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { JegdPdfGenerator } from '@/lib/pdf-generator';
import { Escola, Atleta, Genero, TipoDocumento, ModalidadeConfig, ModalidadeCodigo, CategoriaIdade } from '@/types/jegd';
import { JegdsRulesService, PROVAS_ATLETISMO_POR_CATEGORIA } from '@/services/jegds-rules';
import { AtletaCard } from './components/AtletaCard';
import { ModalCadastroAtleta } from './components/ModalCadastroAtleta';

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

  const diagnosticoDuplicidade = React.useMemo(() => {
    if (atletaEditando || !escola) return { duplicado: false };
    if (!nomeCompleto.trim() && !documentoNumero.trim()) return { duplicado: false };
    return JegdStorage.verificarDuplicidadeAtleta({
      nomeCompleto,
      dataNascimento,
      documentoNumero,
      matricula,
      escolaIdAtual: escola.id
    });
  }, [atletaEditando, escola, nomeCompleto, dataNascimento, documentoNumero, matricula]);

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

    const handleSync = () => {
      setAtletas(JegdStorage.getAtletas(atual.id));
      setModalidades(JegdStorage.getModalidades());
    };
    window.addEventListener('jegd-data-synced', handleSync);

    const interval = setInterval(() => {
      JegdStorage.sincronizarComNuvem().catch(() => {});
    }, 4000);

    return () => {
      window.removeEventListener('jegd-data-synced', handleSync);
      clearInterval(interval);
    };
  }, []);

  const handleAbrirModalNovo = () => {
    setAtletaEditando(null);
    setEtapaAtual(1);
    setNomeCompleto('');
    setDataNascimento('2013-05-10');
    setSexo('MASCULINO');
    setDocumentoTipo('RG');
    setDocumentoNumero('');
    const proximoCodigo = JegdStorage.gerarProximoCodigoInscricao(escola?.municipioId);
    setMatricula(proximoCodigo);
    setSerieTurma('7º Ano (Fundamental)');
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

    // Se estiver cadastrando novo (não editando), verifica duplicidade
    if (!atletaEditando && escola) {
      const diag = JegdStorage.verificarDuplicidadeAtleta({
        nomeCompleto,
        dataNascimento,
        documentoNumero,
        matricula,
        escolaIdAtual: escola.id
      });

      if (diag.duplicado) {
        if (diag.tipoConflito === 'OUTRA_ESCOLA') {
          alert(diag.mensagemUsuario || 'Este estudante já se encontra cadastrado por outra escola.');
          return;
        } else if (diag.tipoConflito === 'MESMA_ESCOLA' && diag.atletaExistente) {
          // Carrega os dados existentes e avança para a etapa de modalidades
          handleAbrirModalEditar(diag.atletaExistente);
          setEtapaAtual(2);
          return;
        }
      }
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

    const codigoFinal = matricula && matricula.trim() !== '' && !matricula.startsWith('MAT-')
      ? matricula
      : (atletaEditando?.matricula || JegdStorage.gerarProximoCodigoInscricao(escola.municipioId));

    const atleta: Atleta = {
      id: atletaId,
      escolaId: escola.id,
      municipioId: escola.municipioId,
      nomeCompleto: nomeCompleto.toUpperCase(),
      dataNascimento,
      sexo,
      documentoTipo,
      documentoNumero,
      matricula: codigoFinal,
      crachaToken: atletaEditando?.crachaToken || codigoFinal,
      serieTurma: serieTurma || '7º Ano (Fundamental)',
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

  // Geração de Crachás
  const handleGerarCrachaIndividual = async (atleta: Atleta) => {
    if (!escola) return;
    try {
      await JegdPdfGenerator.gerarCrachaIndividual(atleta, escola);
    } catch {
      alert('Erro ao gerar crachá individual em PDF.');
    }
  };

  const handleGerarCrachasEscola = async () => {
    if (!escola || atletas.length === 0) {
      alert('Nenhum atleta cadastrado para gerar crachás.');
      return;
    }
    try {
      await JegdPdfGenerator.gerarCrachasEmLote(escola, atletas);
    } catch {
      alert('Erro ao gerar lote de crachás em PDF.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/escola/dashboard"
            className="p-3 rounded-2xl bg-white border border-[#E2EAE5] text-[#4B5563] hover:text-[#087A5B] hover:border-[#00A878] shadow-xs transition-all shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-black text-[#17221D] break-words">Cadastro Rápido & Inscrições</h1>
            <p className="text-xs sm:text-sm text-[#4B5563] mt-0.5 font-medium truncate">
              Escola: <strong className="text-[#17221D]">{escola.nome}</strong> ({escola.sigla})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {atletas.length > 0 && (
            <button
              onClick={handleGerarCrachasEscola}
              className="w-full sm:w-auto px-4 sm:px-5 py-3 rounded-xl sm:rounded-2xl bg-[#F7F9F8] hover:bg-[#E8F7F1] border border-[#00A878]/30 text-[#087A5B] font-black text-xs sm:text-sm shadow-2xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Crachás Desta Escola (PDF)</span>
            </button>
          )}

          <button
            onClick={handleAbrirModalNovo}
            className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#00A878] hover:bg-[#087A5B] text-white font-black text-xs sm:text-sm shadow-md shadow-[#00A878]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>+ Cadastrar Aluno & Inscrever</span>
          </button>
        </div>
      </div>

      {/* Barra de Busca & Filtros */}
      <div className="bg-white border border-[#E2EAE5] rounded-3xl p-5 grid grid-cols-1 sm:grid-cols-4 gap-4 shadow-xs">
        <div className="sm:col-span-2 relative">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome do aluno, RG ou matrícula..."
            className="w-full px-4 py-3 pl-11 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-sm focus:outline-none focus:border-[#00A878] focus:bg-white font-medium"
          />
          <Search className="w-4 h-4 text-[#4B5563] absolute left-4 top-3.5" />
        </div>

        <div>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white"
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
            className="w-full px-4 py-3 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white"
          >
            <option value="TODOS">Todos os Gêneros</option>
            <option value="MASCULINO">Masculino</option>
            <option value="FEMININO">Feminino</option>
          </select>
        </div>
      </div>

      {/* Grid de Alunos Cadastrados */}
      {atletasFiltrados.length === 0 ? (
        <div className="bg-white border border-[#E2EAE5] rounded-3xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#E8F7F1] text-[#00A878] flex items-center justify-center mx-auto shadow-2xs">
            <Users className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#17221D]">Nenhum aluno encontrado</h3>
          <p className="text-sm text-[#4B5563] max-w-md mx-auto">
            Cadastre os alunos-atletas da sua escola. Na 2ª etapa você já escolhe a modalidade e forma a equipe automaticamente!
          </p>
          <button
            onClick={handleAbrirModalNovo}
            className="px-6 py-3 rounded-2xl bg-[#00A878] hover:bg-[#087A5B] text-white font-bold text-sm inline-flex items-center gap-2 shadow-xs transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeiro Aluno</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {atletasFiltrados.map((atleta) => (
            <AtletaCard
              key={atleta.id}
              atleta={atleta}
              onGerarCracha={handleGerarCrachaIndividual}
              onEditar={handleAbrirModalEditar}
              onExcluir={handleExcluirAtleta}
            />
          ))}
        </div>
      )}

      {/* MODAL RÁPIDO EM 2 ETAPAS: DADOS DO ALUNO -> ESCOLHA DA MODALIDADE */}
      <ModalCadastroAtleta
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        atletaEditando={atletaEditando}
        etapaAtual={etapaAtual}
        setEtapaAtual={setEtapaAtual}
        nomeCompleto={nomeCompleto}
        setNomeCompleto={setNomeCompleto}
        dataNascimento={dataNascimento}
        setDataNascimento={setDataNascimento}
        sexo={sexo}
        setSexo={setSexo}
        documentoTipo={documentoTipo}
        setDocumentoTipo={setDocumentoTipo}
        documentoNumero={documentoNumero}
        setDocumentoNumero={setDocumentoNumero}
        matricula={matricula}
        setMatricula={setMatricula}
        serieTurma={serieTurma}
        setSerieTurma={setSerieTurma}
        fotoBase64={fotoBase64}
        handleFotoUpload={handleFotoUpload}
        fileInputRef={fileInputRef}
        catCalc={catCalc}
        modalidadesDisponiveis={modalidadesDisponiveis}
        modalidadesEscolhidas={modalidadesEscolhidas}
        toggleModalidade={toggleModalidade}
        provasPermitidas={provasPermitidas}
        provasAtletismo={provasAtletismo}
        toggleProva={toggleProva}
        handleAvancarParaEtapa2={handleAvancarParaEtapa2}
        handleSalvarAtleta={handleSalvarAtleta}
        escolaId={escola?.id || ''}
        diagnosticoDuplicidade={diagnosticoDuplicidade}
        onCarregarAtletaDuplicado={(atl) => {
          handleAbrirModalEditar(atl);
          setEtapaAtual(2);
        }}
      />

    </div>
  );
}
