'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  School,
  Users,
  Trophy,
  GraduationCap,
  FileText,
  UserPlus,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck2,
  Printer,
  ShieldAlert,
  Download,
  LogOut,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  QrCode,
  LayoutGrid,
  List,
  Shield,
  Phone,
  Mail,
  PlusCircle,
  X,
  BookOpen,
  ClipboardList
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { JegdPdfGenerator } from '@/lib/pdf-generator';
import {
  Escola,
  Atleta,
  MembroComissao,
  InscricaoEquipe,
  PerfilAtivoEscola,
  HomologacaoDirecao,
  Genero,
  TipoDocumento,
  ModalidadeConfig,
  ModalidadeCodigo,
  CategoriaIdade
} from '@/types/jegd';
import { JegdsRulesService, PROVAS_ATLETISMO_POR_CATEGORIA } from '@/services/jegds-rules';
import { ModalSeletorPerfil } from '../components/ModalSeletorPerfil';
import { ModalCadastroAtleta } from '../atletas/components/ModalCadastroAtleta';

export default function EscolaDashboardPage() {
  const router = useRouter();
  const [escola, setEscola] = useState<Escola | null>(null);
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [comissao, setComissao] = useState<MembroComissao[]>([]);
  const [inscricoes, setInscricoes] = useState<InscricaoEquipe[]>([]);
  const [modalidades, setModalidades] = useState<ModalidadeConfig[]>([]);
  const [gerandoPdfId, setGerandoPdfId] = useState<string | null>(null);
  const [gerandoCrachasLote, setGerandoCrachasLote] = useState(false);
  const [gerandoPdfLote, setGerandoPdfLote] = useState(false);

  // Navegação por Abas Unificadas
  const [abaAtiva, setAbaAtiva] = useState<'ALUNOS' | 'EQUIPES' | 'HOMOLOGACAO' | 'COMISSAO'>('ALUNOS');

  // Perfil Ativo
  const [perfilAtivo, setPerfilAtivo] = useState<PerfilAtivoEscola | null>(null);
  const [modalPerfilAberto, setModalPerfilAberto] = useState(false);
  const [homologacao, setHomologacao] = useState<HomologacaoDirecao>({ homologado: false });

  // Sincronização Online
  const [sincronizandoOnline, setSincronizandoOnline] = useState(false);
  const [ultimaSincronizacao, setUltimaSincronizacao] = useState<string>('Agora');

  // Filtros de Alunos
  const [buscaAluno, setBuscaAluno] = useState('');
  const [filtroModalidade, setFiltroModalidade] = useState('TODAS');
  const [filtroCategoria, setFiltroCategoria] = useState('TODAS');
  const [filtroSexo, setFiltroSexo] = useState('TODOS');
  const [modoVisualizacao, setModoVisualizacao] = useState<'CARDS' | 'TABELA'>('CARDS');

  // Modal Cadastro/Edição de Aluno
  const [modalAtletaAberto, setModalAtletaAberto] = useState(false);
  const [atletaEditando, setAtletaEditando] = useState<Atleta | null>(null);
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [dataNascimento, setDataNascimento] = useState('2013-05-10');
  const [sexo, setSexo] = useState<Genero>('MASCULINO');
  const [documentoTipo, setDocumentoTipo] = useState<TipoDocumento>('RG');
  const [documentoNumero, setDocumentoNumero] = useState('');
  const [matricula, setMatricula] = useState('');
  const [serieTurma, setSerieTurma] = useState('7º Ano A');
  const [fotoBase64, setFotoBase64] = useState<string | undefined>(undefined);
  const [modalidadesEscolhidas, setModalidadesEscolhidas] = useState<ModalidadeCodigo[]>([]);
  const [provasAtletismo, setProvasAtletismo] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal Comissão Técnica
  const [modalComissaoAberto, setModalComissaoAberto] = useState(false);
  const [membroEditando, setMembroEditando] = useState<MembroComissao | null>(null);
  const [comissaoNome, setComissaoNome] = useState('');
  const [comissaoFuncao, setComissaoFuncao] = useState<'TECNICO' | 'AUXILIAR' | 'DELEGADO' | 'MASSAGISTA_FISIO'>('TECNICO');
  const [comissaoRegistro, setComissaoRegistro] = useState('');
  const [comissaoCpf, setComissaoCpf] = useState('');
  const [comissaoTelefone, setComissaoTelefone] = useState('');
  const [comissaoEmail, setComissaoEmail] = useState('');

  useEffect(() => {
    JegdStorage.init();
    const atual = JegdStorage.getCurrentEscola();
    if (!atual) {
      router.push('/escola/login');
      return;
    }
    setEscola(atual);
    carregarDados(atual.id);

    const perfilSalvo = JegdStorage.getCurrentPerfilEscola();
    if (perfilSalvo) {
      setPerfilAtivo(perfilSalvo);
    } else {
      setModalPerfilAberto(true);
    }
    setHomologacao(JegdStorage.getHomologacaoDirecao(atual.id));

    const handleSync = () => {
      carregarDados(atual.id);
      setUltimaSincronizacao(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };
    window.addEventListener('jegd-data-synced', handleSync);

    const interval = setInterval(() => {
      JegdStorage.sincronizarComNuvem().catch(() => {});
    }, 60000);

    return () => {
      window.removeEventListener('jegd-data-synced', handleSync);
      clearInterval(interval);
    };
  }, []);

  const carregarDados = (escolaId: string) => {
    setAtletas(JegdStorage.getAtletas(escolaId));
    setComissao(JegdStorage.getComissao(escolaId));
    setInscricoes(JegdStorage.getInscricoes(escolaId));
    setModalidades(JegdStorage.getModalidades());
  };

  const handleForcarSincronizacao = async () => {
    if (!escola) return;
    setSincronizandoOnline(true);
    await JegdStorage.sincronizarComNuvem();
    carregarDados(escola.id);
    setUltimaSincronizacao(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    setTimeout(() => setSincronizandoOnline(false), 500);
  };

  // Regras de Idade e Categoria
  const catCalc = JegdsRulesService.calcularCategoria(dataNascimento);

  const modalidadesDisponiveis = useMemo(() => {
    if (!catCalc.categoria) return [];
    return modalidades.filter(mod => {
      const res = JegdsRulesService.validarMatriz(mod.codigo, catCalc.categoria as CategoriaIdade, sexo);
      return res.valido;
    });
  }, [modalidades, catCalc, sexo]);

  const provasPermitidas = catCalc.categoria ? (PROVAS_ATLETISMO_POR_CATEGORIA[catCalc.categoria] || []) : [];

  const toggleModalidade = (modCodigo: ModalidadeCodigo) => {
    if (modalidadesEscolhidas.includes(modCodigo)) {
      setModalidadesEscolhidas(modalidadesEscolhidas.filter(c => c !== modCodigo));
      if (modCodigo === 'atletismo') setProvasAtletismo([]);
    } else {
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
    } else {
      setFotoBase64(undefined);
    }
  };

  const diagnosticoDuplicidade = useMemo(() => {
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

  const handleAbrirModalNovoAtleta = () => {
    setAtletaEditando(null);
    setNomeCompleto('');
    setDataNascimento('2013-05-10');
    setSexo('MASCULINO');
    setDocumentoTipo('RG');
    setDocumentoNumero('');
    const proximoCodigo = JegdStorage.gerarProximoCodigoInscricao(escola?.municipioId);
    setMatricula(proximoCodigo);
    setSerieTurma('7º Ano A');
    setFotoBase64(undefined);
    setModalidadesEscolhidas([]);
    setProvasAtletismo([]);
    setModalAtletaAberto(true);
  };

  const handleAbrirModalEditarAtleta = (atleta: Atleta) => {
    setAtletaEditando(atleta);
    setNomeCompleto(atleta.nomeCompleto);
    setDataNascimento(atleta.dataNascimento);
    setSexo(atleta.sexo);
    setDocumentoTipo(atleta.documentoTipo || 'RG');
    setDocumentoNumero(atleta.documentoNumero || '');
    setMatricula(atleta.matricula);
    setSerieTurma(atleta.serieTurma);
    setFotoBase64(atleta.documentos?.foto3x4);
    const modsInsc = atleta.modalidadesInscritas?.map(m => m.modalidadeCodigo) || [];
    setModalidadesEscolhidas(modsInsc);
    const atletismoInsc = atleta.modalidadesInscritas?.find(m => m.modalidadeCodigo === 'atletismo');
    setProvasAtletismo(atletismoInsc?.provas || []);
    setModalAtletaAberto(true);
  };

  const handleSalvarAtleta = (continuar: boolean = false) => {
    if (!escola) return;

    if (!nomeCompleto.trim() || !dataNascimento || !documentoNumero.trim()) {
      alert('Por favor, preencha o Nome Completo, Data de Nascimento e Documento do estudante.');
      return;
    }

    if (!catCalc.categoria) {
      alert('A data de nascimento informada está fora da faixa etária oficial do JEGDS (9 a 20 anos).');
      return;
    }

    if (modalidadesEscolhidas.length === 0) {
      alert('Selecione ao menos 1 modalidade para o aluno participar dos jogos.');
      return;
    }

    if (modalidadesEscolhidas.includes('atletismo') && provasAtletismo.length === 0) {
      alert('Selecione ao menos 1 prova de Atletismo para este atleta.');
      return;
    }

    const autor = perfilAtivo?.nome ? perfilAtivo.nome : escola.responsavelNome;
    const atletaId = atletaEditando ? atletaEditando.id : `atl-${Date.now()}`;
    const codigoFinal = matricula && matricula.trim() !== '' && !matricula.startsWith('MAT-')
      ? matricula
      : (atletaEditando?.matricula || JegdStorage.gerarProximoCodigoInscricao(escola.municipioId));

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
      municipioId: escola.municipioId,
      nomeCompleto: nomeCompleto.toUpperCase(),
      dataNascimento,
      sexo,
      documentoTipo,
      documentoNumero,
      matricula: codigoFinal,
      crachaToken: atletaEditando?.crachaToken || codigoFinal,
      serieTurma: serieTurma || '7º Ano A',
      telefoneContato: escola.responsavelTelefone || '(99) 98801-0000',
      tipoSanguineo: 'O+',
      consentimentoResponsavel: true,
      cadastradoPor: atletaEditando?.cadastradoPor || autor,
      categoriaCalculada: catCalc.categoria as CategoriaIdade,
      modalidadesInscritas: modalidadesMapeadas,
      conferidoPeloCoordenador: false,
      documentos: {
        ...(atletaEditando?.documentos || {}),
        foto3x4: fotoBase64
      },
      ativo: true,
      createdAt: atletaEditando ? atletaEditando.createdAt : new Date().toISOString()
    };

    // 1. Salva o Atleta
    JegdStorage.saveAtleta(atleta);

    // 2. Sincroniza e forma as equipes automaticamente
    JegdStorage.syncAtletaComEquipes(escola.id, atleta);

    // 3. Atualiza dados na tela
    carregarDados(escola.id);

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    } catch {}

    if (continuar) {
      handleAbrirModalNovoAtleta();
    } else {
      setModalAtletaAberto(false);
    }
  };

  const handleExcluirAtleta = async (atleta: Atleta) => {
    if (!escola) return;
    if (confirm(`Deseja realmente remover o aluno "${atleta.nomeCompleto}"? Ele também sairá das equipes desta escola.`)) {
      await JegdStorage.deleteAtleta(atleta.id);
      carregarDados(escola.id);
    }
  };

  const handleGerarCrachasEscola = async () => {
    if (!escola || atletas.length === 0) {
      alert('Nenhum aluno cadastrado nesta escola para gerar crachás.');
      return;
    }
    setGerandoCrachasLote(true);
    try {
      await JegdPdfGenerator.gerarCrachasEmLote(escola, atletas);
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar crachás da escola em PDF.');
    } finally {
      setGerandoCrachasLote(false);
    }
  };

  const handleGerarCrachaIndividual = async (atleta: Atleta) => {
    if (!escola) return;
    try {
      await JegdPdfGenerator.gerarCrachaIndividual(atleta, escola);
    } catch {
      alert('Erro ao gerar crachá individual em PDF.');
    }
  };

  const handleGerarFichaPdf = async (inscricao: InscricaoEquipe) => {
    if (!escola) return;
    setGerandoPdfId(inscricao.id);
    try {
      const atletasEquipe = inscricao.atletaIds
        .map(id => JegdStorage.getAtletaById(id))
        .filter((a): a is Atleta => a !== undefined);

      const comissaoEquipe = inscricao.comissaoIds
        .map(id => JegdStorage.getComissao().find(c => c.id === id))
        .filter((c): c is MembroComissao => c !== undefined);

      await JegdPdfGenerator.gerarFichaInscricao(escola, inscricao, atletasEquipe, comissaoEquipe);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar ficha em PDF.');
    } finally {
      setGerandoPdfId(null);
    }
  };

  const handleGerarCrachasEquipePdf = async (inscricao: InscricaoEquipe) => {
    if (!escola) return;
    setGerandoPdfId(inscricao.id);
    try {
      const atletasEquipe = inscricao.atletaIds
        .map(id => JegdStorage.getAtletaById(id))
        .filter((a): a is Atleta => a !== undefined);

      await JegdPdfGenerator.gerarCrachasEmLote(
        escola,
        atletasEquipe,
        inscricao.modalidadeNome,
        `${inscricao.categoria} (${inscricao.sexo})`
      );
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar crachás em PDF.');
    } finally {
      setGerandoPdfId(null);
    }
  };

  const handleGerarSumulaEquipePdf = async (inscricao: InscricaoEquipe) => {
    if (!escola) return;
    setGerandoPdfId(inscricao.id);
    try {
      const atletasEquipe = inscricao.atletaIds
        .map(id => JegdStorage.getAtletaById(id))
        .filter((a): a is Atleta => a !== undefined);

      const atletasComEscola = atletasEquipe.map(atl => ({
        atleta: atl,
        escola: escola,
        provas: inscricao.provasPorAtleta?.[atl.id]
      }));

      await JegdPdfGenerator.gerarSumulaEscolaIndividual(
        inscricao.modalidadeNome,
        inscricao.categoria,
        inscricao.sexo,
        '2026',
        atletasComEscola,
        escola
      );
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar súmula da equipe em PDF.');
    } finally {
      setGerandoPdfId(null);
    }
  };

  const handleGerarCadernoSumulasMinhaEscola = async () => {
    if (!escola) return;
    setGerandoPdfLote(true);
    try {
      const modalidades = JegdStorage.getModalidades();
      const inscricoesEscola = inscricoes.filter(i => i.escolaId === escola.id);

      const modalidadesCompletas = modalidades.map(mod => {
        const inscsMod = inscricoesEscola.filter(
          i => i.modalidadeCodigo?.toLowerCase() === mod.codigo.toLowerCase() ||
               i.modalidadeNome?.toLowerCase().includes(mod.nome.toLowerCase())
        );

        const categoriasData = inscsMod.map(insc => {
          const atletasEquipe = insc.atletaIds
            .map(id => JegdStorage.getAtletaById(id))
            .filter((a): a is Atleta => a !== undefined);

          return {
            categoria: insc.categoria,
            sexo: insc.sexo,
            atletasComEscola: atletasEquipe.map(atl => ({
              atleta: atl,
              escola: escola,
              provas: insc.provasPorAtleta?.[atl.id]
            }))
          };
        });

        return {
          modalidade: mod,
          categoriasData
        };
      }).filter(item => item.categoriasData.some(c => c.atletasComEscola.length > 0));

      await JegdPdfGenerator.gerarCadernoSumulasEscola(escola, modalidadesCompletas);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar caderno de súmulas da escola.');
    } finally {
      setGerandoPdfLote(false);
    }
  };

  const handleSelecionarPerfil = (perfil: PerfilAtivoEscola) => {
    setPerfilAtivo(perfil);
    setModalPerfilAberto(false);
  };

  const handleHomologarDirecao = () => {
    if (!escola) return;
    if (confirm(`Confirmar Homologação Oficial da Escola ${escola.nome}?\n\nA Direção atesta a matrícula e frequência regular de todos os ${atletas.length} atletas inscritos perante a SEMED.`)) {
      JegdStorage.setHomologacaoDirecao(escola.id, true, perfilAtivo?.nome || escola.responsavelNome);
      setHomologacao(JegdStorage.getHomologacaoDirecao(escola.id));
      alert('✅ Delegação Escolar homologada com sucesso! As inscrições foram validadas para a SEMED.');
    }
  };

  const handleRevogarHomologacao = () => {
    if (!escola) return;
    if (confirm('Deseja reabrir a delegação da escola para edições dos professores?')) {
      JegdStorage.setHomologacaoDirecao(escola.id, false);
      setHomologacao(JegdStorage.getHomologacaoDirecao(escola.id));
    }
  };

  // Funções de Comissão Técnica
  const handleAbrirModalNovaComissao = () => {
    setMembroEditando(null);
    setComissaoNome('');
    setComissaoFuncao('TECNICO');
    setComissaoRegistro('CREF 000000-G/MA');
    setComissaoCpf('');
    setComissaoTelefone('(99) 98800-0000');
    setComissaoEmail(escola?.loginEmail || '');
    setModalComissaoAberto(true);
  };

  const handleAbrirModalEditarComissao = (m: MembroComissao) => {
    setMembroEditando(m);
    setComissaoNome(m.nomeCompleto);
    setComissaoFuncao(m.funcao);
    setComissaoRegistro(m.registroProfissional || '');
    setComissaoCpf(m.cpf);
    setComissaoTelefone(m.telefone);
    setComissaoEmail(m.email);
    setModalComissaoAberto(true);
  };

  const handleSalvarComissao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!escola) return;
    if (!comissaoNome.trim() || !comissaoCpf.trim()) {
      alert('Preencha o nome completo e CPF do profissional.');
      return;
    }
    const membro: MembroComissao = {
      id: membroEditando ? membroEditando.id : `com-${Date.now()}`,
      escolaId: escola.id,
      nomeCompleto: comissaoNome.trim().toUpperCase(),
      funcao: comissaoFuncao,
      registroProfissional: comissaoRegistro.trim(),
      cpf: comissaoCpf.trim(),
      telefone: comissaoTelefone.trim(),
      email: comissaoEmail.trim()
    };
    JegdStorage.saveComissao(membro);
    setComissao(JegdStorage.getComissao(escola.id));
    setModalComissaoAberto(false);
  };

  const handleExcluirComissao = (m: MembroComissao) => {
    if (!escola) return;
    if (confirm(`Remover o membro "${m.nomeCompleto}" da comissão técnica?`)) {
      JegdStorage.deleteComissao(m.id);
      setComissao(JegdStorage.getComissao(escola.id));
    }
  };

  // Alunos Filtrados
  const atletasFiltrados = useMemo(() => {
    return atletas.filter(a => {
      if (buscaAluno) {
        const termo = buscaAluno.toLowerCase();
        const matchNome = a.nomeCompleto.toLowerCase().includes(termo);
        const matchDoc = a.documentoNumero?.toLowerCase().includes(termo);
        const matchMat = a.matricula?.toLowerCase().includes(termo);
        if (!matchNome && !matchDoc && !matchMat) return false;
      }
      if (filtroCategoria !== 'TODAS' && a.categoriaCalculada !== filtroCategoria) return false;
      if (filtroSexo !== 'TODOS' && a.sexo !== filtroSexo) return false;
      if (filtroModalidade !== 'TODAS') {
        const temMod = a.modalidadesInscritas?.some(
          m => m.modalidadeCodigo === filtroModalidade || m.modalidadeNome.toLowerCase().includes(filtroModalidade.toLowerCase())
        );
        if (!temMod) return false;
      }
      return true;
    });
  }, [atletas, buscaAluno, filtroModalidade, filtroCategoria, filtroSexo]);

  if (!escola) return null;

  const totalValidadas = inscricoes.filter(i => i.status === 'VALIDADA').length;
  const totalPendentes = inscricoes.filter(i => i.status === 'PENDENTE').length;

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 w-full">
      
      {/* ================= TOP BAR COMPACTO E MODERNO ================= */}
      <div className="bg-white border border-[#E2EAE5] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Identificação da Escola e Perfil Ativo */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-800 font-black text-sm shadow-2xs shrink-0">
              {escola.sigla.slice(0, 3)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-[#17221D] truncate">
                  {escola.nome}
                </h1>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 shrink-0">
                  {escola.sigla}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
                  INEP: {escola.inep}
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5 truncate flex items-center gap-2">
                <span>Perfil:</span>
                <strong className="text-[#17221D]">{perfilAtivo?.nome || 'Direção Escolar'}</strong>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                  {perfilAtivo?.tipo === 'DIRECAO' ? 'Direção' : 'Professor(a)'}
                </span>
              </p>
            </div>
          </div>

          {/* Status Online e Ações Rápidas do Topo */}
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
            
            {/* Trocar Perfil */}
            <button
              type="button"
              onClick={() => setModalPerfilAberto(true)}
              className="px-3 py-1.5 rounded-xl bg-[#F7F9F8] hover:bg-gray-100 border border-[#E2EAE5] text-[#17221D] text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all"
              title="Trocar entre Direção e Professores"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              <span>Trocar Perfil</span>
            </button>

            {/* Sincronização Online */}
            <button
              type="button"
              onClick={handleForcarSincronizacao}
              disabled={sincronizandoOnline}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-60"
              title="Sincronizar instantaneamente com o servidor central"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${sincronizandoOnline ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{sincronizandoOnline ? 'Sincronizando...' : `Online • ${ultimaSincronizacao}`}</span>
              <span className="sm:hidden">{sincronizandoOnline ? '...' : ultimaSincronizacao}</span>
            </button>

            {/* Cadastrar Aluno (Botão Primário) */}
            <button
              type="button"
              onClick={handleAbrirModalNovoAtleta}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all hover:scale-[1.01] active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Cadastrar Aluno</span>
            </button>

            {/* Sair */}
            <button
              type="button"
              onClick={() => {
                JegdStorage.logoutEscola();
                window.location.href = '/escola/login';
              }}
              className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all"
              title="Sair da escola"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= FAIXA COMPACTA DE MÉTRICAS (1 LINHA) ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        
        <div
          onClick={() => setAbaAtiva('ALUNOS')}
          className={`bg-white border rounded-xl p-3 shadow-2xs flex items-center justify-between cursor-pointer transition-all ${
            abaAtiva === 'ALUNOS' ? 'border-[#00A878] bg-emerald-50/20' : 'border-[#E2EAE5] hover:border-emerald-300'
          }`}
        >
          <div>
            <span className="text-[10px] font-black uppercase text-[#64748B]">Alunos</span>
            <p className="text-xl font-black text-[#17221D] mt-0.5">{atletas.length}</p>
          </div>
          <Users className="w-6 h-6 text-[#94A3B8] opacity-50" />
        </div>

        <div
          onClick={() => setAbaAtiva('EQUIPES')}
          className={`bg-white border rounded-xl p-3 shadow-2xs flex items-center justify-between cursor-pointer transition-all ${
            abaAtiva === 'EQUIPES' ? 'border-[#00A878] bg-emerald-50/20' : 'border-[#E2EAE5] hover:border-emerald-300'
          }`}
        >
          <div>
            <span className="text-[10px] font-black uppercase text-[#64748B]">Equipes</span>
            <p className="text-xl font-black text-[#17221D] mt-0.5">{inscricoes.length}</p>
          </div>
          <Trophy className="w-6 h-6 text-[#94A3B8] opacity-50" />
        </div>

        <div
          onClick={() => setAbaAtiva('COMISSAO')}
          className={`bg-white border rounded-xl p-3 shadow-2xs flex items-center justify-between cursor-pointer transition-all ${
            abaAtiva === 'COMISSAO' ? 'border-[#00A878] bg-emerald-50/20' : 'border-[#E2EAE5] hover:border-emerald-300'
          }`}
        >
          <div>
            <span className="text-[10px] font-black uppercase text-[#64748B]">Comissão</span>
            <p className="text-xl font-black text-[#17221D] mt-0.5">{comissao.length}</p>
          </div>
          <GraduationCap className="w-6 h-6 text-[#94A3B8] opacity-50" />
        </div>

        <div
          onClick={() => setAbaAtiva('EQUIPES')}
          className="bg-white border border-[#E2EAE5] rounded-xl p-3 shadow-2xs flex items-center justify-between cursor-pointer hover:border-emerald-300 transition-all"
        >
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-700">Homologados SEMED</span>
            <p className="text-xl font-black text-emerald-700 mt-0.5">{totalValidadas}</p>
          </div>
          <CheckCircle2 className="w-6 h-6 text-emerald-500 opacity-60" />
        </div>

        <div
          onClick={() => setAbaAtiva('HOMOLOGACAO')}
          className={`bg-white border rounded-xl p-3 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1 cursor-pointer transition-all ${
            homologacao.homologado ? 'border-emerald-300 bg-emerald-50/30' : 'border-amber-300 bg-amber-50/30'
          }`}
          title="Status de homologação da direção da escola"
        >
          <div>
            <span className={`text-[10px] font-black uppercase ${homologacao.homologado ? 'text-emerald-800' : 'text-amber-800'}`}>
              Status Direção
            </span>
            <p className={`text-xs font-black mt-0.5 ${homologacao.homologado ? 'text-emerald-700' : 'text-amber-700'}`}>
              {homologacao.homologado ? 'Aprovado Direção' : 'Pendente Direção'}
            </p>
          </div>
          {homologacao.homologado ? (
            <ShieldCheck className="w-6 h-6 text-emerald-600 opacity-80" />
          ) : (
            <Clock className="w-6 h-6 text-amber-600 opacity-80" />
          )}
        </div>
      </div>

      {/* ================= NAVEGAÇÃO POR ABAS FOCADAS ================= */}
      <div className="flex items-center gap-1.5 border-b border-[#E2EAE5] pb-2 overflow-x-auto no-scrollbar w-full">
        <button
          onClick={() => setAbaAtiva('ALUNOS')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
            abaAtiva === 'ALUNOS'
              ? 'bg-[#00A878] text-white shadow-2xs font-black'
              : 'text-[#4B5563] hover:text-[#17221D] hover:bg-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Alunos & Inscrições ({atletas.length})</span>
        </button>

        <button
          onClick={() => setAbaAtiva('EQUIPES')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
            abaAtiva === 'EQUIPES'
              ? 'bg-[#00A878] text-white shadow-2xs font-black'
              : 'text-[#4B5563] hover:text-[#17221D] hover:bg-white'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Equipes em Disputa ({inscricoes.length})</span>
        </button>

        <button
          onClick={() => setAbaAtiva('HOMOLOGACAO')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
            abaAtiva === 'HOMOLOGACAO'
              ? 'bg-[#00A878] text-white shadow-2xs font-black'
              : 'text-[#4B5563] hover:text-[#17221D] hover:bg-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Homologação da Direção</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
            homologacao.homologado ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-400 text-slate-950'
          }`}>
            {homologacao.homologado ? 'OK' : 'Pendente'}
          </span>
        </button>

        <button
          onClick={() => setAbaAtiva('COMISSAO')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
            abaAtiva === 'COMISSAO'
              ? 'bg-[#00A878] text-white shadow-2xs font-black'
              : 'text-[#4B5563] hover:text-[#17221D] hover:bg-white'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Comissão Técnica ({comissao.length})</span>
        </button>
      </div>

      {/* ================= ABA 1: ALUNOS & INSCRIÇÕES ================= */}
      {abaAtiva === 'ALUNOS' && (
        <div className="bg-white border border-[#E2EAE5] rounded-2xl shadow-xs overflow-hidden space-y-4">
          
          {/* Barra de Filtros e Ações de Alunos */}
          <div className="p-4 border-b border-[#E2EAE5] bg-[#F7F9F8] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            
            {/* Campo de Busca */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-3" />
              <input
                type="text"
                value={buscaAluno}
                onChange={(e) => setBuscaAluno(e.target.value)}
                placeholder="Buscar aluno por nome ou documento..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-[#E2EAE5] text-xs font-medium text-[#17221D] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A878]"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtro Modalidade */}
              <select
                value={filtroModalidade}
                onChange={(e) => setFiltroModalidade(e.target.value)}
                className="px-2.5 py-2 rounded-xl bg-white border border-[#E2EAE5] text-xs font-bold text-[#17221D] focus:outline-none focus:border-[#00A878]"
              >
                <option value="TODAS">Todas Modalidades</option>
                {modalidades.map(m => (
                  <option key={m.id} value={m.codigo}>{m.nome}</option>
                ))}
              </select>

              {/* Filtro Categoria */}
              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="px-2.5 py-2 rounded-xl bg-white border border-[#E2EAE5] text-xs font-bold text-[#17221D] focus:outline-none focus:border-[#00A878]"
              >
                <option value="TODAS">Todas Categorias</option>
                <option value="MIRIM">Mirim (9-11)</option>
                <option value="INFANTIL">Infantil (12-14)</option>
                <option value="INFANTO">Infanto (15-17)</option>
                <option value="JUNIOR">Junior (18-20)</option>
              </select>

              {/* Filtro Sexo */}
              <select
                value={filtroSexo}
                onChange={(e) => setFiltroSexo(e.target.value)}
                className="px-2.5 py-2 rounded-xl bg-white border border-[#E2EAE5] text-xs font-bold text-[#17221D] focus:outline-none focus:border-[#00A878]"
              >
                <option value="TODOS">Todos os Naipes</option>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMININO">Feminino</option>
              </select>

              {/* Botão Todos os Crachás */}
              <button
                type="button"
                onClick={handleGerarCrachasEscola}
                disabled={gerandoCrachasLote || atletas.length === 0}
                className="px-3 py-2 rounded-xl bg-white hover:bg-[#E8F7F1] border border-[#00A878]/30 text-[#087A5B] font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                title="Baixar todos os crachás desta escola em PDF"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Crachás (PDF)</span>
              </button>

              {/* Botão Súmulas da Escola */}
              <button
                type="button"
                onClick={handleGerarCadernoSumulasMinhaEscola}
                disabled={gerandoPdfLote || atletas.length === 0}
                className="px-3 py-2 rounded-xl bg-white hover:bg-[#E8F7F1] border border-[#00A878]/30 text-[#087A5B] font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                title="Baixar caderno de súmulas da minha escola em PDF"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Súmulas (PDF)</span>
              </button>

              {/* Alternador de Modo de Visualização */}
              <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-[#E2EAE5]">
                <button
                  type="button"
                  onClick={() => setModoVisualizacao('CARDS')}
                  className={`p-1.5 rounded-lg transition-all ${
                    modoVisualizacao === 'CARDS' ? 'bg-[#00A878] text-white' : 'text-[#64748B] hover:text-[#17221D]'
                  }`}
                  title="Visualização em Cards"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setModoVisualizacao('TABELA')}
                  className={`p-1.5 rounded-lg transition-all ${
                    modoVisualizacao === 'TABELA' ? 'bg-[#00A878] text-white' : 'text-[#64748B] hover:text-[#17221D]'
                  }`}
                  title="Visualização em Tabela"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Alunos */}
          <div className="p-4 sm:p-5 pt-0">
            {atletas.length === 0 ? (
              <div className="py-12 text-center text-[#64748B] bg-[#F7F9F8] rounded-2xl border border-dashed border-[#E2EAE5]">
                <School className="w-10 h-10 text-[#94A3B8] mx-auto mb-2 opacity-60" />
                <p className="font-black text-sm text-[#17221D]">Nenhum aluno cadastrado nesta escola ainda.</p>
                <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                  Cadastre seus atletas nas modalidades desejadas. As equipes serão formadas automaticamente em tempo real!
                </p>
                <button
                  type="button"
                  onClick={handleAbrirModalNovoAtleta}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs inline-flex items-center gap-2 shadow-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Cadastrar Primeiro Aluno</span>
                </button>
              </div>
            ) : atletasFiltrados.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#64748B] bg-[#F7F9F8] rounded-xl border border-[#E2EAE5]">
                Nenhum aluno corresponde aos filtros selecionados.
              </div>
            ) : modoVisualizacao === 'CARDS' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {atletasFiltrados.map((atleta) => (
                  <div
                    key={atleta.id}
                    className="p-3.5 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] hover:bg-white hover:border-[#00A878]/40 transition-all shadow-2xs flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-black text-[#17221D] truncate" title={atleta.nomeCompleto}>
                          {atleta.nomeCompleto}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white border border-[#E2EAE5] text-[#17221D] shrink-0">
                          {atleta.categoriaCalculada} • {atleta.sexo === 'MASCULINO' ? 'Masc' : 'Fem'}
                        </span>
                      </div>

                      <p className="text-[11px] text-[#64748B]">
                        Nasc: {new Date(atleta.dataNascimento).toLocaleDateString('pt-BR')} • {atleta.documentoTipo}: {atleta.documentoNumero}
                      </p>

                      <div className="mt-2 flex flex-wrap gap-1">
                        {atleta.modalidadesInscritas && atleta.modalidadesInscritas.length > 0 ? (
                          atleta.modalidadesInscritas.map((m, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-bold border border-emerald-300">
                              {m.modalidadeNome} {m.provas && m.provas.length > 0 ? `(${m.provas.join(', ')})` : ''}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">Sem modalidades</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#E2EAE5] text-xs">
                      <span className="text-[10px] text-[#64748B]">
                        Cadastrado por: <strong className="text-[#17221D]">{atleta.cadastradoPor || 'Escola'}</strong>
                      </span>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAbrirModalEditarAtleta(atleta)}
                          className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-700 transition-colors"
                          title="Editar aluno"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExcluirAtleta(atleta)}
                          className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors"
                          title="Excluir aluno"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleGerarCrachaIndividual(atleta)}
                          className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-700 transition-colors"
                          title="Crachá Individual"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto border border-[#E2EAE5] rounded-xl">
                <table className="w-full text-left text-xs text-[#17221D]">
                  <thead className="bg-[#F7F9F8] text-[#64748B] uppercase text-[10px] font-black border-b border-[#E2EAE5]">
                    <tr>
                      <th className="p-3">Aluno</th>
                      <th className="p-3">Nascimento</th>
                      <th className="p-3">Categoria/Sexo</th>
                      <th className="p-3">Documento</th>
                      <th className="p-3">Modalidades</th>
                      <th className="p-3">Cadastrado Por</th>
                      <th className="p-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2EAE5]">
                    {atletasFiltrados.map((atleta) => (
                      <tr key={atleta.id} className="hover:bg-[#F7F9F8]/60 transition-colors">
                        <td className="p-3 font-black text-[#17221D]">{atleta.nomeCompleto}</td>
                        <td className="p-3 text-[#64748B]">{new Date(atleta.dataNascimento).toLocaleDateString('pt-BR')}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-gray-100 font-bold text-[10px]">
                            {atleta.categoriaCalculada} • {atleta.sexo === 'MASCULINO' ? 'Masc' : 'Fem'}
                          </span>
                        </td>
                        <td className="p-3"><strong>{atleta.documentoTipo}:</strong> {atleta.documentoNumero}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {atleta.modalidadesInscritas?.map((m, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 text-[10px] border border-emerald-200 font-medium">
                                {m.modalidadeNome}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-[#64748B]">{atleta.cadastradoPor || 'Escola'}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleAbrirModalEditarAtleta(atleta)}
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-700 transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExcluirAtleta(atleta)}
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleGerarCrachaIndividual(atleta)}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 transition-colors"
                              title="Crachá"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= ABA 2: EQUIPES FORMADAS ================= */}
      {abaAtiva === 'EQUIPES' && (
        <div className="bg-white border border-[#E2EAE5] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#E2EAE5]">
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#17221D]">Equipes em Disputa Formadas Automaticamente</h2>
              <p className="text-xs text-[#64748B]">
                À medida que os atletas são cadastrados nas modalidades, suas equipes são montadas aqui.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAbrirModalNovoAtleta}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Adicionar Aluno à Equipe</span>
            </button>
          </div>

          {inscricoes.length === 0 ? (
            <div className="text-center py-10 bg-[#F7F9F8] rounded-xl border border-dashed border-[#E2EAE5]">
              <Trophy className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-black text-[#17221D]">Nenhuma equipe formada ainda.</p>
              <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                Inscreva seus alunos na aba "Alunos & Inscrições" para que as equipes apareçam aqui organizadas.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {inscricoes.map((insc) => {
                const atletasEquipe = insc.atletaIds
                  .map(id => atletas.find(a => a.id === id))
                  .filter((a): a is Atleta => a !== undefined);

                return (
                  <div
                    key={insc.id}
                    className="p-4 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] hover:border-[#00A878]/50 hover:bg-white transition-all shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm sm:text-base font-black text-[#17221D]">{insc.modalidadeNome}</span>
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white border border-[#E2EAE5] text-[#17221D] font-bold">
                          {insc.categoria} • {insc.sexo}
                        </span>

                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black border ${
                          insc.status === 'VALIDADA'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : insc.status === 'REJEITADA'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-300'
                        }`}>
                          {insc.status === 'VALIDADA' ? 'HOMOLOGADA' : insc.status === 'REJEITADA' ? 'REJEITADA' : 'EM ANÁLISE'}
                        </span>
                      </div>

                      <div className="text-xs text-[#64748B] flex flex-wrap items-center gap-3">
                        <span><strong className="text-[#17221D]">{atletasEquipe.length}</strong> Atletas convocados</span>
                        <span>•</span>
                        <span>Data: {insc.dataInscricao || 'Automática'}</span>
                        {insc.motivoRejeicao && (
                          <span className="text-rose-700 font-medium">Motivo: {insc.motivoRejeicao}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full lg:w-auto justify-end flex-wrap shrink-0">
                      <button
                        onClick={() => handleGerarFichaPdf(insc)}
                        disabled={gerandoPdfId === insc.id}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#E8F7F1] text-[#17221D] hover:text-[#087A5B] text-xs font-bold border border-[#E2EAE5] flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-50"
                        title="Baixar ficha oficial de inscrição em PDF"
                      >
                        <Printer className="w-3.5 h-3.5 text-[#00A878]" />
                        <span>Ficha PDF</span>
                      </button>

                      <button
                        onClick={() => handleGerarCrachasEquipePdf(insc)}
                        disabled={gerandoPdfId === insc.id}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#E8F7F1] text-[#17221D] hover:text-[#087A5B] text-xs font-bold border border-[#E2EAE5] flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-50"
                        title="Baixar crachás oficiais desta equipe em PDF"
                      >
                        <QrCode className="w-3.5 h-3.5 text-[#00A878]" />
                        <span>Crachás QR</span>
                      </button>

                      <button
                        onClick={() => handleGerarSumulaEquipePdf(insc)}
                        disabled={gerandoPdfId === insc.id}
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#E8F7F1] text-[#17221D] hover:text-[#087A5B] text-xs font-bold border border-[#E2EAE5] flex items-center gap-1.5 shadow-2xs transition-all disabled:opacity-50"
                        title="Baixar súmula oficial desta equipe em PDF"
                      >
                        <FileCheck2 className="w-3.5 h-3.5 text-[#00A878]" />
                        <span>Súmula PDF</span>
                      </button>

                      <Link
                        href="/escola/inscricoes"
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-2xs"
                      >
                        Gerenciar Elenco
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= ABA 3: HOMOLOGAÇÃO DA DIREÇÃO ================= */}
      {abaAtiva === 'HOMOLOGACAO' && (
        <div className="bg-white border border-[#E2EAE5] rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-start gap-3.5 pb-4 border-b border-[#E2EAE5]">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              homologacao.homologado ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              {homologacao.homologado ? <ShieldCheck className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                  homologacao.homologado ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}>
                  {homologacao.homologado ? 'Homologação Concluída' : 'Aguardando Homologação da Direção'}
                </span>
                <span className="text-xs text-[#64748B] font-bold">
                  {atletas.length} atletas inscritos • {inscricoes.length} equipes montadas
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-[#17221D] mt-1">
                Atestado Oficial de Matrícula e Frequência Regular para a SEMED
              </h3>
              <p className="text-xs sm:text-sm text-[#4B5563] mt-1 max-w-3xl leading-relaxed">
                Em conformidade com o Regulamento Geral dos Jogos Escolares, a Direção da Unidade Escolar atesta formalmente perante o Comitê Organizador da SEMED que todos os estudantes atletas cadastrados encontram-se regularmente matriculados e com frequência escolar assídua no ano letivo.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-[#17221D]">
                {homologacao.homologado
                  ? `Delegação homologada por ${homologacao.responsavelNome || 'Direção'} em ${new Date(homologacao.dataHomologacao!).toLocaleString('pt-BR')}`
                  : 'A Direção Escolar deve validar os atletas cadastrados para liberar a emissão final das súmulas.'}
              </p>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {perfilAtivo?.tipo === 'DIRECAO'
                  ? 'Você está conectado como Direção Escolar e possui autorização legal para assinar.'
                  : 'Você está navegando como Professor. Apenas a Direção Escolar pode clicar em Homologar.'}
              </p>
            </div>

            {perfilAtivo?.tipo === 'DIRECAO' ? (
              homologacao.homologado ? (
                <button
                  type="button"
                  onClick={handleRevogarHomologacao}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-all shadow-2xs shrink-0"
                >
                  Reabrir Delegação para Ajustes
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleHomologarDirecao}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all shrink-0 hover:scale-[1.01]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Homologar e Assinar Delegação</span>
                </button>
              )
            ) : (
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 shrink-0">
                Aguardando assinatura da Direção
              </span>
            )}
          </div>
        </div>
      )}

      {/* ================= ABA 4: COMISSÃO TÉCNICA ================= */}
      {abaAtiva === 'COMISSAO' && (
        <div className="bg-white border border-[#E2EAE5] rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-[#E2EAE5]">
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#17221D]">Comissão Técnica & Professores</h2>
              <p className="text-xs text-[#64748B]">
                Profissionais de Educação Física e técnicos autorizados a acompanhar os estudantes nas partidas.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAbrirModalNovaComissao}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Adicionar Profissional</span>
            </button>
          </div>

          {comissao.length === 0 ? (
            <div className="text-center py-10 bg-[#F7F9F8] rounded-xl border border-dashed border-[#E2EAE5]">
              <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-black text-[#17221D]">Nenhum membro cadastrado na comissão.</p>
              <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
                Cadastre os técnicos e professores para que constem nas súmulas oficiais das partidas.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {comissao.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] hover:bg-white hover:border-[#00A878]/40 transition-all shadow-2xs flex flex-col justify-between gap-2.5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-[#17221D] truncate">{m.nomeCompleto}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 shrink-0">
                        {m.funcao}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-1">
                      CPF: <strong>{m.cpf}</strong> • Registro: <strong>{m.registroProfissional || 'CREF Não informado'}</strong>
                    </p>
                    <p className="text-[11px] text-[#64748B]">
                      Contato: {m.telefone || m.email}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-1 pt-2 border-t border-[#E2EAE5]">
                    <button
                      type="button"
                      onClick={() => handleAbrirModalEditarComissao(m)}
                      className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-700 transition-colors"
                      title="Editar profissional"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExcluirComissao(m)}
                      className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors"
                      title="Excluir profissional"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAIS ================= */}

      {/* Modal Cadastro/Edição de Aluno */}
      <ModalCadastroAtleta
        isOpen={modalAtletaAberto}
        onClose={() => setModalAtletaAberto(false)}
        atletaEditando={atletaEditando}
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
        handleSalvarAtleta={handleSalvarAtleta}
        escolaId={escola.id}
        diagnosticoDuplicidade={diagnosticoDuplicidade}
      />

      {/* Modal Seletor de Perfil (Direção / Professores) */}
      <ModalSeletorPerfil
        isOpen={modalPerfilAberto}
        escola={escola}
        onSelecionarPerfil={handleSelecionarPerfil}
        permitirFechar={!!perfilAtivo}
        onClose={() => setModalPerfilAberto(false)}
      />

      {/* Modal Cadastro de Membro da Comissão Técnica */}
      {modalComissaoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-[#E2EAE5] rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2EAE5]">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-[#17221D]">
                  {membroEditando ? 'Editar Profissional da Comissão' : 'Novo Membro da Comissão Técnica'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalComissaoAberto(false)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSalvarComissao} className="space-y-3">
              <div>
                <label className="block text-[10px] font-black uppercase text-[#4B5563] mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={comissaoNome}
                  onChange={(e) => setComissaoNome(e.target.value)}
                  placeholder="Nome do professor ou técnico..."
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-bold text-[#17221D] focus:outline-none focus:border-[#00A878]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-black uppercase text-[#4B5563] mb-1">Função</label>
                  <select
                    value={comissaoFuncao}
                    onChange={(e: any) => setComissaoFuncao(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-bold text-[#17221D] focus:outline-none focus:border-[#00A878]"
                  >
                    <option value="TECNICO">Técnico Principal</option>
                    <option value="AUXILIAR">Auxiliar Técnico</option>
                    <option value="DELEGADO">Delegado da Escola</option>
                    <option value="MASSAGISTA_FISIO">Fisioterapeuta / Apoio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-[#4B5563] mb-1">CPF *</label>
                  <input
                    type="text"
                    required
                    value={comissaoCpf}
                    onChange={(e) => setComissaoCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-bold text-[#17221D] focus:outline-none focus:border-[#00A878]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-black uppercase text-[#4B5563] mb-1">Registro CREF</label>
                  <input
                    type="text"
                    value={comissaoRegistro}
                    onChange={(e) => setComissaoRegistro(e.target.value)}
                    placeholder="CREF 000000-G/MA"
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-bold text-[#17221D] focus:outline-none focus:border-[#00A878]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase text-[#4B5563] mb-1">Telefone WhatsApp</label>
                  <input
                    type="text"
                    value={comissaoTelefone}
                    onChange={(e) => setComissaoTelefone(e.target.value)}
                    placeholder="(99) 98800-0000"
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-bold text-[#17221D] focus:outline-none focus:border-[#00A878]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-[#4B5563] mb-1">E-mail Institucional</label>
                <input
                  type="email"
                  value={comissaoEmail}
                  onChange={(e) => setComissaoEmail(e.target.value)}
                  placeholder="professor@semed.gd.gov.br"
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-bold text-[#17221D] focus:outline-none focus:border-[#00A878]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2EAE5]">
                <button
                  type="button"
                  onClick={() => setModalComissaoAberto(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
                >
                  Salvar Profissional
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
