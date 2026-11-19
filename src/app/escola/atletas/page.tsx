'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
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
import { Escola, Atleta, Genero, TipoDocumento, ModalidadeConfig, ModalidadeCodigo, CategoriaIdade, PerfilAtivoEscola } from '@/types/jegd';
import { JegdsRulesService, PROVAS_ATLETISMO_POR_CATEGORIA } from '@/services/jegds-rules';
import { AtletaCard } from './components/AtletaCard';
import { ModalCadastroAtleta } from './components/ModalCadastroAtleta';
import { ModalSeletorPerfil } from '../components/ModalSeletorPerfil';

export default function EscolaAtletasPage() {
  const router = useRouter();
  const [escola, setEscola] = useState<Escola | null>(null);
  const [todasEscolas, setTodasEscolas] = useState<Escola[]>([]);
  const [isCoordenador, setIsCoordenador] = useState(false);
  const [nomeOperador, setNomeOperador] = useState('');
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [modalidades, setModalidades] = useState<ModalidadeConfig[]>([]);
  const [perfilAtivo, setPerfilAtivo] = useState<PerfilAtivoEscola | null>(null);
  const [modalPerfilAberto, setModalPerfilAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [filtroSexo, setFiltroSexo] = useState<string>('TODOS');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODOS');
  const [filtroProfessor, setFiltroProfessor] = useState<string>('TODOS');

  // Modal de Cadastro Rápido e Fluido
  const [modalAberto, setModalAberto] = useState(false);
  const [atletaEditando, setAtletaEditando] = useState<Atleta | null>(null);

  // Form State - Etapa 1 (Dados do Aluno)
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [dataNascimento, setDataNascimento] = useState('2013-05-10');
  const [sexo, setSexo] = useState<Genero>('MASCULINO');
  const [documentoTipo, setDocumentoTipo] = useState<TipoDocumento>('RG');
  const [documentoNumero, setDocumentoNumero] = useState('');
  const [semDocumento, setSemDocumento] = useState<boolean>(false);
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
      documentoNumero: semDocumento ? 'SEM DOCUMENTO' : documentoNumero,
      matricula,
      semDocumento,
      escolaIdAtual: escola.id
    });
  }, [atletaEditando, escola, nomeCompleto, dataNascimento, documentoNumero, matricula, semDocumento]);

  const listaProfessoresCadastrantes = React.useMemo(() => {
    const setProfs = new Set<string>();
    atletas.forEach(a => {
      if (a.cadastradoPor) setProfs.add(a.cadastradoPor);
    });
    return Array.from(setProfs);
  }, [atletas]);

  useEffect(() => {
    JegdStorage.init();
    let atual = JegdStorage.getCurrentEscola();
    const coordLogado = JegdStorage.isAdminAuth();
    setIsCoordenador(coordLogado);

    const curMun = JegdStorage.getCurrentMunicipio();
    const escList = JegdStorage.getEscolas(curMun.id);
    setTodasEscolas(escList);

    const currentUser = JegdStorage.getCurrentUser();
    if (currentUser) {
      setNomeOperador(currentUser.nome);
    }

    if (!atual) {
      if (coordLogado && escList.length > 0) {
        atual = escList[0];
        JegdStorage.setCurrentEscola(atual);
      } else {
        router.push('/escola/login');
        return;
      }
    }
    setEscola(atual);
    setAtletas(JegdStorage.getAtletas(atual.id));
    setModalidades(JegdStorage.getModalidades());

    const perfilSalvo = JegdStorage.getCurrentPerfilEscola();
    if (perfilSalvo) {
      setPerfilAtivo(perfilSalvo);
    } else if (coordLogado) {
      setPerfilAtivo({
        tipo: 'DIRECAO',
        nome: currentUser?.nome ? `${currentUser.nome} (SEMED)` : 'Coordenação SEMED',
        id: currentUser?.id || 'coord-semed'
      });
    } else {
      setModalPerfilAberto(true);
    }

    const handleSync = () => {
      const targetEsc = JegdStorage.getCurrentEscola();
      if (targetEsc) {
        setAtletas(JegdStorage.getAtletas(targetEsc.id));
      }
      setModalidades(JegdStorage.getModalidades());
    };
    window.addEventListener('jegd-data-synced', handleSync);

    const interval = setInterval(() => {
      JegdStorage.sincronizarComNuvem().catch(() => { });
    }, 60000);

    return () => {
      window.removeEventListener('jegd-data-synced', handleSync);
      clearInterval(interval);
    };
  }, []);

  const handleAbrirModalNovo = () => {
    setAtletaEditando(null);
    setNomeCompleto('');
    setDataNascimento('2013-05-10');
    setSexo('MASCULINO');
    setSemDocumento(false);
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
    setNomeCompleto(atleta.nomeCompleto);
    setDataNascimento(atleta.dataNascimento);
    setSexo(atleta.sexo);
    const atletaSemDoc = Boolean(atleta.semDocumento || atleta.documentoTipo === 'SEM_DOCUMENTO' || atleta.documentoNumero === 'SEM DOCUMENTO');
    setSemDocumento(atletaSemDoc);
    setDocumentoTipo(atleta.documentoTipo || (atletaSemDoc ? 'SEM_DOCUMENTO' : 'RG'));
    setDocumentoNumero(atletaSemDoc ? 'SEM DOCUMENTO' : (atleta.documentoNumero || ''));
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
  const listaModalidadesBase = modalidades.length > 0
    ? modalidades
    : (typeof window !== 'undefined' ? JegdStorage.getModalidades() : []);

  const modalidadesDisponiveis = listaModalidadesBase.filter(mod => {
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
      // 1. Verificação de travas de vagas da escola para a modalidade/categoria/sexo
      if (escola?.id && catCalc.categoria) {
        const vagasInfo = JegdStorage.getVagasModalidadeInfo(
          escola.id,
          modCodigo,
          catCalc.categoria,
          sexo,
          atletaEditando?.id
        );
        if (vagasInfo.esgotado) {
          alert(`⚠️ Vagas Esgotadas: A escola já preencheu todas as ${vagasInfo.limiteMaximo} vagas permitidas pelo regulamento oficial do JEGDS 2026 para esta modalidade (${catCalc.categoria} - ${sexo}).`);
          return;
        }
      }

      // 2. Validação individual do estudante (Art. 13 - máx 1 coletiva e 2 individuais)
      const proximas = [...modalidadesEscolhidas, modCodigo];
      const validacaoArt13 = JegdsRulesService.validarLimiteModalidadesAtleta(proximas as any);
      if (!validacaoArt13.valido) {
        alert(validacaoArt13.erro);
        return;
      }
      setModalidadesEscolhidas(proximas);
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

  const handleSalvarAtleta = (cadastrarProximo: boolean = false) => {
    if (!escola) return;

    if (!nomeCompleto.trim() || !dataNascimento || (!semDocumento && !documentoNumero.trim())) {
      alert('Por favor, preencha o Nome Completo, Data de Nascimento e Documento do estudante (ou marque a opção "Aluno sem documentos").');
      return;
    }

    if (!catCalc.categoria) {
      alert('A data de nascimento informada está fora da faixa etária oficial do JEGDS 2026 (9 a 20 anos: nascidos entre 2006 e 2017).');
      return;
    }

    if (modalidadesEscolhidas.length === 0) {
      alert('Selecione ao menos 1 modalidade para inscrever o estudante.');
      return;
    }

    if (modalidadesEscolhidas.includes('atletismo') && provasAtletismo.length === 0) {
      alert('Selecione ao menos 1 prova de Atletismo para este atleta.');
      return;
    }

    if (!atletaEditando && diagnosticoDuplicidade.duplicado && diagnosticoDuplicidade.tipoConflito === 'OUTRA_ESCOLA') {
      alert(diagnosticoDuplicidade.mensagemUsuario || 'Estudante bloqueado por duplicidade em outra escola.');
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

    const autorCadastro = perfilAtivo?.tipo === 'PROFESSOR'
      ? (perfilAtivo.nome.startsWith('Prof') ? perfilAtivo.nome : `Prof. ${perfilAtivo.nome}`)
      : (perfilAtivo?.nome || currentUser?.nome || escola.responsavelNome || 'Direção');

    const atleta: Atleta = {
      id: atletaId,
      escolaId: escola.id,
      municipioId: escola.municipioId,
      nomeCompleto: nomeCompleto.toUpperCase(),
      dataNascimento,
      sexo,
      semDocumento,
      documentoTipo: semDocumento ? 'SEM_DOCUMENTO' : documentoTipo,
      documentoNumero: semDocumento ? 'SEM DOCUMENTO' : documentoNumero.trim(),
      matricula: codigoFinal,
      crachaToken: atletaEditando?.crachaToken || codigoFinal,
      serieTurma: serieTurma || '7º Ano (Fundamental)',
      nomeMae,
      telefoneContato,
      tipoSanguineo,
      consentimentoResponsavel,
      cadastradoPor: atletaEditando?.cadastradoPor || autorCadastro,
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
    } catch { }

    if (cadastrarProximo) {
      handleAbrirModalNovo();
    } else {
      setModalAberto(false);
    }
  };

  const handleExcluirAtleta = async (id: string, nome: string) => {
    if (confirm(`Deseja realmente remover o aluno "${nome}"? Ele também será removido das equipes vinculadas.`)) {
      await JegdStorage.deleteAtleta(id);
      if (escola) setAtletas(JegdStorage.getAtletas(escola.id));
    }
  };

  if (!escola) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-3 border-[#00A878] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold text-[#64748B]">Carregando delegação da escola...</p>
      </div>
    );
  }

  // Filtragem e Ordenação por Categoria, Naipe e Nome
  const atletasFiltrados = atletas.filter(atleta => {
    const termo = busca.toLowerCase();
    const bateBusca =
      atleta.nomeCompleto.toLowerCase().includes(termo) ||
      (atleta.documentoNumero && atleta.documentoNumero.toLowerCase().includes(termo)) ||
      (Boolean(atleta.semDocumento) && (termo.includes('sem') || termo.includes('doc'))) ||
      atleta.matricula.toLowerCase().includes(termo);
    const bateSexo = filtroSexo === 'TODOS' || atleta.sexo === filtroSexo;
    const bateCat = filtroCategoria === 'TODOS' || atleta.categoriaCalculada === filtroCategoria;
    const bateProfessor = filtroProfessor === 'TODOS' || atleta.cadastradoPor === filtroProfessor;
    return bateBusca && bateSexo && bateCat && bateProfessor;
  });

  const gruposEscolaAtletas = useMemo(() => {
    const ordemCat = ['MIRIM', 'INFANTIL', 'INFANTO', 'JUNIOR'];
    const naipes = ['FEMININO', 'MASCULINO'];
    const result: {
      categoria: string;
      sexo: string;
      faixa: string;
      atletas: Atleta[];
    }[] = [];

    ordemCat.forEach(cat => {
      naipes.forEach(sexo => {
        const doGrupo = atletasFiltrados
          .filter(a => a.categoriaCalculada === cat && a.sexo === sexo)
          .sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto));
        if (doGrupo.length > 0) {
          const faixa = cat === 'MIRIM' ? '9 a 11 anos' : cat === 'INFANTIL' ? '12 a 14 anos' : cat === 'INFANTO' ? '15 a 17 anos' : '18 a 20 anos';
          result.push({ categoria: cat, sexo, faixa, atletas: doGrupo });
        }
      });
    });

    const outros = atletasFiltrados
      .filter(a => !ordemCat.includes(a.categoriaCalculada || ''))
      .sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto));
    if (outros.length > 0) {
      result.push({ categoria: 'DIVERSOS', sexo: 'MISTO', faixa: '', atletas: outros });
    }

    return result;
  }, [atletasFiltrados]);

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">

      {/* 1. BARRA DE PERFIL ATIVO (DIRETOR / PROFESSOR) */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-3.5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
            perfilAtivo?.tipo === 'DIRECAO'
              ? 'bg-emerald-600 text-white'
              : 'bg-indigo-600 text-white'
          }`}>
            {perfilAtivo?.tipo === 'DIRECAO' ? 'DIR' : 'PROF'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 font-medium">Operador ativo:</span>
              <span className={`text-[10px] font-semibold uppercase px-2 py-0.2 rounded-md ${
                perfilAtivo?.tipo === 'DIRECAO' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/50' : 'bg-indigo-50 text-indigo-700 border border-indigo-200/50'
              }`}>
                {perfilAtivo?.tipo === 'DIRECAO' ? 'Direção / Coordenação' : 'Professor'}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5">
              {perfilAtivo ? perfilAtivo.nome : 'Perfil não selecionado'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setModalPerfilAberto(true)}
          className="w-full sm:w-auto px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors flex items-center justify-center gap-1.5"
        >
          <span>Trocar Perfil</span>
        </button>
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={isCoordenador ? "/admin/dashboard" : "/escola/dashboard"}
            className="p-2.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 shadow-2xs transition-colors shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Cadastro Rápido & Inscrições</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
              Escola: <strong className="text-slate-700 font-semibold">{escola.nome}</strong> ({escola.sigla})
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {atletas.length > 0 && (
            <button
              onClick={handleGerarCrachasEscola}
              className="w-full sm:w-auto px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs sm:text-sm shadow-2xs flex items-center justify-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>Crachás da Escola (PDF)</span>
            </button>
          )}

          <button
            onClick={handleAbrirModalNovo}
            className="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Aluno & Inscrever</span>
          </button>
        </div>
      </div>

      {/* Banner de Operação Especial para a Coordenação SEMED */}
      {isCoordenador && (
        <div className="bg-white border border-[#E2EAE5] border-l-4 border-l-[#00A878] text-[#17221D] p-4 rounded-xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#E8F7F1] border border-[#00A878]/20 text-[#087A5B] flex items-center justify-center font-bold text-sm shrink-0">
              👑
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#E8F7F1] text-[#087A5B] text-[10px] font-bold uppercase tracking-wider mb-0.5">
                <span>Modo Coordenação SEMED Ativo</span>
              </div>
              <h3 className="text-sm font-bold text-[#17221D]">
                Operador: {nomeOperador || 'Elias Veloso / Herbert (SEMED)'}
              </h3>
              <p className="text-xs text-[#68756E]">
                Você pode cadastrar e matricular alunos em qualquer escola e modalidade dos jogos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <span className="text-xs font-semibold text-[#4B5563] shrink-0">Alternar Escola:</span>
            <select
              value={escola.id}
              onChange={(e) => {
                const esc = todasEscolas.find(x => x.id === e.target.value);
                if (esc) {
                  JegdStorage.setCurrentEscola(esc);
                  setEscola(esc);
                  setAtletas(JegdStorage.getAtletas(esc.id));
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs font-medium focus:outline-none focus:border-[#00A878] cursor-pointer w-full md:w-auto"
            >
              {todasEscolas.map(e => (
                <option key={e.id} value={e.id}>
                  {e.nome} ({e.sigla})
                </option>
              ))}
            </select>

            <Link
              href="/admin/dashboard"
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors shrink-0 whitespace-nowrap text-center"
            >
              Painel SEMED
            </Link>
          </div>
        </div>
      )}

      {/* Barra de Busca & Filtros */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 shadow-2xs">
        <div className="sm:col-span-2 relative">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome do aluno, RG ou matrícula..."
            className="w-full px-3.5 py-2 pl-9 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm focus:outline-none focus:border-emerald-600 focus:bg-white font-normal"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

        <div>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600 focus:bg-white cursor-pointer"
          >
            <option value="TODOS">Todas Categorias</option>
            <option value="MIRIM">Mirim (9 a 11)</option>
            <option value="INFANTIL">Infantil (12 a 14)</option>
            <option value="INFANTO">Infanto (15 a 17)</option>
            <option value="JUNIOR">Junior (18 a 20)</option>
          </select>
        </div>

        <div>
          <select
            value={filtroSexo}
            onChange={(e) => setFiltroSexo(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600 focus:bg-white cursor-pointer"
          >
            <option value="TODOS">Todos Gêneros</option>
            <option value="MASCULINO">Masculino</option>
            <option value="FEMININO">Feminino</option>
          </select>
        </div>

        <div>
          <select
            value={filtroProfessor}
            onChange={(e) => setFiltroProfessor(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600 focus:bg-white cursor-pointer"
          >
            <option value="TODOS">Cadastrado por: Todos</option>
            {listaProfessoresCadastrantes.map(prof => (
              <option key={prof} value={prof}>{prof}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Alunos Cadastrados */}
      {atletasFiltrados.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Nenhum aluno encontrado</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Cadastre os alunos-atletas da sua escola. Na 2ª etapa você já escolhe a modalidade e forma a equipe automaticamente!
          </p>
          <button
            onClick={handleAbrirModalNovo}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Primeiro Aluno</span>
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {gruposEscolaAtletas.map((grupo) => (
            <div key={`${grupo.categoria}-${grupo.sexo}`} className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${grupo.sexo === 'FEMININO' ? 'bg-pink-500' : 'bg-blue-600'}`} />
                  <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
                    {grupo.categoria} • {grupo.sexo === 'FEMININO' ? 'FEMININO' : 'MASCULINO'}
                  </h3>
                  {grupo.faixa && (
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {grupo.faixa}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  {grupo.atletas.length} {grupo.atletas.length === 1 ? 'aluno' : 'alunos'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {grupo.atletas.map((atleta) => (
                  <AtletaCard
                    key={atleta.id}
                    atleta={atleta}
                    onGerarCracha={handleGerarCrachaIndividual}
                    onEditar={handleAbrirModalEditar}
                    onExcluir={handleExcluirAtleta}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL RÁPIDO EM 2 ETAPAS: DADOS DO ALUNO -> ESCOLHA DA MODALIDADE */}
      <ModalCadastroAtleta
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        atletaEditando={atletaEditando}
        nomeCompleto={nomeCompleto}
        setNomeCompleto={setNomeCompleto}
        dataNascimento={dataNascimento}
        setDataNascimento={setDataNascimento}
        sexo={sexo}
        setSexo={setSexo}
        semDocumento={semDocumento}
        setSemDocumento={setSemDocumento}
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
        handleSalvarAtleta={handleSalvarAtleta}
        escolaId={escola?.id || ''}
        diagnosticoDuplicidade={diagnosticoDuplicidade}
        onCarregarAtletaDuplicado={(atl) => {
          handleAbrirModalEditar(atl);
        }}
      />

      {/* Modal Seletor de Perfil Escolar estilo Netflix */}
      <ModalSeletorPerfil
        isOpen={modalPerfilAberto}
        escola={escola}
        onSelecionarPerfil={(p) => {
          setPerfilAtivo(p);
          setModalPerfilAberto(false);
        }}
        onClose={() => setModalPerfilAberto(false)}
        permitirFechar={!!perfilAtivo}
      />

    </div>
  );
}
