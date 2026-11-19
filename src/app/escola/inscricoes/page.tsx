'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Trophy,
  ArrowLeft,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Printer,
  Shield,
  Clock,
  Download,
  Calendar,
  AlertTriangle,
  Flame,
  Zap,
  Crown,
  Medal,
  Award,
  Star,
  ShieldCheck,
  UserPlus,
  X,
  Sparkles
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { JegdPdfGenerator } from '@/lib/pdf-generator';
import {
  Escola,
  Atleta,
  ModalidadeConfig,
  InscricaoEquipe,
  CategoriaIdade,
  Genero,
  ModalidadeCodigo,
  TipoDocumento
} from '@/types/jegd';
import {
  JegdsRulesService,
  PROVAS_ATLETISMO_POR_CATEGORIA,
  MODALIDADES_JEGDS
} from '@/services/jegds-rules';
import { ModalCadastroAtleta } from '../atletas/components/ModalCadastroAtleta';

const FAIXA_ETARIA_INFO: Record<CategoriaIdade, { faixaAnos: string; anosNascimento: string }> = {
  MIRIM: { faixaAnos: '9 a 11 anos', anosNascimento: 'Nascidos em 2015 a 2017' },
  INFANTIL: { faixaAnos: '12 a 14 anos', anosNascimento: 'Nascidos em 2012 a 2014' },
  INFANTO: { faixaAnos: '15 a 17 anos', anosNascimento: 'Nascidos em 2009 a 2011' },
  JUNIOR: { faixaAnos: '18 a 20 anos', anosNascimento: 'Nascidos em 2006 a 2008' }
};

const LOGOS_PREDEFINIDOS = [
  { id: 'shield', label: 'Escudo Clássico', iconName: 'shield', Icon: Shield, color: 'text-emerald-600' },
  { id: 'zap', label: 'Trovão Veloz', iconName: 'zap', Icon: Zap, color: 'text-amber-500' },
  { id: 'flame', label: 'Chama Olímpica', iconName: 'flame', Icon: Flame, color: 'text-orange-500' },
  { id: 'crown', label: 'Soberanos', iconName: 'crown', Icon: Crown, color: 'text-yellow-600' },
  { id: 'trophy', label: 'Campeões', iconName: 'trophy', Icon: Trophy, color: 'text-amber-600' },
  { id: 'medal', label: 'Medalha de Honra', iconName: 'medal', Icon: Medal, color: 'text-teal-600' },
  { id: 'award', label: 'Destaque Esportivo', iconName: 'award', Icon: Award, color: 'text-blue-600' },
  { id: 'star', label: 'Estrelas GD', iconName: 'star', Icon: Star, color: 'text-amber-500' }
];

function renderEmblemaEquipe(logo?: string) {
  const map: Record<string, React.ReactNode> = {
    shield: <Shield className="w-5 h-5 text-emerald-600" aria-hidden="true" />,
    'escudo-ouro': <Shield className="w-5 h-5 text-emerald-600" aria-hidden="true" />,
    '🛡️': <Shield className="w-5 h-5 text-emerald-600" aria-hidden="true" />,
    zap: <Zap className="w-5 h-5 text-amber-500" aria-hidden="true" />,
    trovao: <Zap className="w-5 h-5 text-amber-500" aria-hidden="true" />,
    '⚡': <Zap className="w-5 h-5 text-amber-500" aria-hidden="true" />,
    flame: <Flame className="w-5 h-5 text-orange-500" aria-hidden="true" />,
    fogo: <Flame className="w-5 h-5 text-orange-500" aria-hidden="true" />,
    '🔥': <Flame className="w-5 h-5 text-orange-500" aria-hidden="true" />,
    crown: <Crown className="w-5 h-5 text-yellow-600" aria-hidden="true" />,
    coroa: <Crown className="w-5 h-5 text-yellow-600" aria-hidden="true" />,
    '👑': <Crown className="w-5 h-5 text-yellow-600" aria-hidden="true" />,
    trophy: <Trophy className="w-5 h-5 text-amber-600" aria-hidden="true" />,
    trofeu: <Trophy className="w-5 h-5 text-amber-600" aria-hidden="true" />,
    '🏆': <Trophy className="w-5 h-5 text-amber-600" aria-hidden="true" />,
    medal: <Medal className="w-5 h-5 text-teal-600" aria-hidden="true" />,
    award: <Award className="w-5 h-5 text-blue-600" aria-hidden="true" />,
    star: <Star className="w-5 h-5 text-amber-500" aria-hidden="true" />,
    estrela: <Star className="w-5 h-5 text-amber-500" aria-hidden="true" />,
    '⭐': <Star className="w-5 h-5 text-amber-500" aria-hidden="true" />
  };

  return map[logo || 'shield'] || <Shield className="w-5 h-5 text-emerald-600" aria-hidden="true" />;
}

export default function EscolaInscricoesPage() {
  const router = useRouter();
  const [escola, setEscola] = useState<Escola | null>(null);
  const [todasEscolas, setTodasEscolas] = useState<Escola[]>([]);
  const [isCoordenador, setIsCoordenador] = useState(false);
  const [nomeOperador, setNomeOperador] = useState('');
  const [modalidades, setModalidades] = useState<ModalidadeConfig[]>([]);
  const [todosAtletas, setTodosAtletas] = useState<Atleta[]>([]);
  const [inscricoes, setInscricoes] = useState<InscricaoEquipe[]>([]);

  // Wizard State
  const [modalidadeSelCodigo, setModalidadeSelCodigo] = useState<ModalidadeCodigo>('futsal');
  const [categoriaSel, setCategoriaSel] = useState<CategoriaIdade>('INFANTIL');
  const [sexoSel, setSexoSel] = useState<Genero>('MASCULINO');
  const [numeroEquipeSel, setNumeroEquipeSel] = useState<number>(1);
  const [nomeEquipeSel, setNomeEquipeSel] = useState<string>('');
  const [logoEquipeSel, setLogoEquipeSel] = useState<string>('shield');
  const [atletasSelecionadosIds, setAtletasSelecionadosIds] = useState<string[]>([]);
  const [provasPorAtleta, setProvasPorAtleta] = useState<Record<string, string[]>>({});
  const [gerandoPdfId, setGerandoPdfId] = useState<string | null>(null);
  const [equipeEmEdicaoId, setEquipeEmEdicaoId] = useState<string | null>(null);
  const [filtroEtapaForm, setFiltroEtapaForm] = useState<number | 'TODAS'>('TODAS');
  const [filtroEtapaLista, setFiltroEtapaLista] = useState<CategoriaIdade | 'TODAS'>('TODAS');

  // Estados do Modal Oficial de Cadastro de Atleta (Padrão SEMED Unificado)
  const [modalCadastroAtletaAberto, setModalCadastroAtletaAberto] = useState(false);
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [dataNascimento, setDataNascimento] = useState('2013-05-10');
  const [sexo, setSexo] = useState<Genero>('MASCULINO');
  const [semDocumento, setSemDocumento] = useState(false);
  const [documentoTipo, setDocumentoTipo] = useState<TipoDocumento>('RG');
  const [documentoNumero, setDocumentoNumero] = useState('');
  const [matricula, setMatricula] = useState('');
  const [serieTurma, setSerieTurma] = useState('7º Ano A');
  const [fotoBase64, setFotoBase64] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [modalidadesEscolhidas, setModalidadesEscolhidas] = useState<ModalidadeCodigo[]>([]);
  const [provasAtletismo, setProvasAtletismo] = useState<string[]>([]);

  // Helper oficial das Etapas
  const getEtapaInfo = (modCodigo: string) => {
    switch (modCodigo) {
      case 'queimada':
      case 'tenis_mesa':
        return {
          etapa: 1,
          etapaNome: '1ª ETAPA OFICIAL',
          data: '28/11/2026',
          prazo: '21/11/2026',
          corFundo: 'bg-emerald-50 border-emerald-300 text-emerald-900',
          badge: 'bg-emerald-600 text-white'
        };
      case 'atletismo':
      case 'beach_soccer':
        return {
          etapa: 2,
          etapaNome: '2ª ETAPA OFICIAL',
          data: '05/12/2026',
          prazo: '28/11/2026',
          corFundo: 'bg-cyan-50 border-cyan-300 text-cyan-900',
          badge: 'bg-cyan-600 text-white'
        };
      case 'futsal':
      case 'xadrez':
      case 'futebol_campo':
      case 'voleibol':
      default:
        return {
          etapa: 3,
          etapaNome: '3ª ETAPA OFICIAL',
          data: '12/12/2026',
          prazo: '05/12/2026',
          corFundo: 'bg-amber-50 border-amber-300 text-amber-900',
          badge: 'bg-amber-600 text-white'
        };
    }
  };

  useEffect(() => {
    JegdStorage.init();
    const coordLogado = JegdStorage.isAdminAuth();
    if (coordLogado) {
      router.replace('/admin/dashboard');
      return;
    }

    const escolaLogada = JegdStorage.getCurrentEscola();
    if (escolaLogada) {
      router.replace('/escola/dashboard');
      return;
    }

    router.replace('/escola/login');
  }, [router]);

  const modalidadeAtual = modalidades.find(m => m.codigo === modalidadeSelCodigo);
  const maxEquipesPermitidas = modalidadeAtual
    ? JegdsRulesService.getMaxEquipesPorModalidade(modalidadeAtual.codigo as any)
    : 1;

  // Equipes que excedem o teto da modalidade (legadas ou importadas)
  const equipesComExcesso = React.useMemo(() => {
    return inscricoes.filter(insc => {
      const modConfig = modalidades.find(m => m.codigo === insc.modalidadeCodigo);
      const limiteMax = modConfig?.maxAtletas || 10;
      return (insc.atletaIds?.length || 0) > limiteMax;
    });
  }, [inscricoes, modalidades]);

  // Contagem de nomes de equipes para alertar sobre duplicatas
  const contagemNomesEquipes = React.useMemo(() => {
    const counts: Record<string, number> = {};
    inscricoes.forEach(i => {
      const nomeLimpo = (i.nomeEquipe || i.modalidadeNome || '').trim().toLowerCase();
      if (nomeLimpo) {
        counts[nomeLimpo] = (counts[nomeLimpo] || 0) + 1;
      }
    });
    return counts;
  }, [inscricoes]);

  // Equipes já cadastradas para esta mesma modalidade, categoria e sexo
  const equipesMesmaModalidadeCat = React.useMemo(() => {
    return inscricoes.filter(
      i =>
        i.modalidadeCodigo === modalidadeSelCodigo &&
        i.categoria === categoriaSel &&
        i.sexo === sexoSel
    );
  }, [inscricoes, modalidadeSelCodigo, categoriaSel, sexoSel]);

  const equipe1Existente = equipesMesmaModalidadeCat.find(i => (i.numeroEquipe === 1 || !i.numeroEquipe));
  const equipe2Existente = equipesMesmaModalidadeCat.find(i => i.numeroEquipe === 2);

  // Verificação de Limite de Equipes da Escola para a Modalidade + Categoria + Sexo atuais
  const validacaoLimiteEquipes = React.useMemo(() => {
    if (!modalidadeAtual) return { permitido: true, maxPermitidas: 1, totalExistentes: 0 };
    return JegdsRulesService.validarLimiteEquipesEscola(
      modalidadeAtual.codigo as any,
      categoriaSel,
      sexoSel,
      inscricoes,
      equipeEmEdicaoId
    );
  }, [modalidadeAtual, categoriaSel, sexoSel, inscricoes, equipeEmEdicaoId]);

  // Agrupamento Hierárquico das Equipes: Etapa (Categoria) -> Modalidade -> Naipe/Grupo
  const equipesAgrupadasPorEtapa = React.useMemo(() => {
    const etapasOrder: CategoriaIdade[] = ['MIRIM', 'INFANTIL', 'INFANTO', 'JUNIOR'];

    const inscricoesFiltradas = filtroEtapaLista === 'TODAS'
      ? inscricoes
      : inscricoes.filter(i => i.categoria === filtroEtapaLista);

    const porEtapa: Record<string, InscricaoEquipe[]> = {};
    inscricoesFiltradas.forEach(i => {
      const cat = i.categoria || 'INFANTIL';
      if (!porEtapa[cat]) porEtapa[cat] = [];
      porEtapa[cat].push(i);
    });

    return etapasOrder
      .filter(etapa => porEtapa[etapa] && porEtapa[etapa].length > 0)
      .map(etapa => {
        const equipesDaEtapa = porEtapa[etapa];

        const porModalidade: Record<string, InscricaoEquipe[]> = {};
        equipesDaEtapa.forEach(eq => {
          const mod = eq.modalidadeNome || eq.modalidadeCodigo;
          if (!porModalidade[mod]) porModalidade[mod] = [];
          porModalidade[mod].push(eq);
        });

        const modalidadesLista = Object.entries(porModalidade)
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([modalidadeNome, equipes]) => ({ modalidadeNome, equipes }));

        return {
          etapa,
          totalEquipes: equipesDaEtapa.length,
          modalidades: modalidadesLista
        };
      });
  }, [inscricoes, filtroEtapaLista]);

  // Validação da Matriz
  const validacaoMatriz = JegdsRulesService.validarMatriz(modalidadeSelCodigo, categoriaSel, sexoSel);

  // Prazo e status
  const prazoExpirado = modalidadeAtual ? JegdsRulesService.isPrazoExpirado(modalidadeAtual.prazoInscricao) : false;

  // Atletas elegíveis estritamente para a Categoria (Etapa) e Sexo selecionados (Blindagem Atômica)
  const atletasElegiveis = React.useMemo(() => {
    return todosAtletas.filter(atleta => {
      const infoCat = JegdsRulesService.calcularCategoria(atleta.dataNascimento);
      const bateCat = infoCat.categoria === categoriaSel;
      const bateGen = atleta.sexo === sexoSel;
      return bateCat && bateGen;
    });
  }, [todosAtletas, categoriaSel, sexoSel]);

  // Detector de Atletas Irregulares convocados no elenco (ex: fora da idade ou outro sexo)
  const atletasIrregularesNoElenco = React.useMemo(() => {
    return (atletasSelecionadosIds || [])
      .map(id => todosAtletas.find(a => a.id === id))
      .filter((a): a is Atleta => {
        if (!a) return false;
        const info = JegdsRulesService.calcularCategoria(a.dataNascimento);
        return info.categoria !== categoriaSel || a.sexo !== sexoSel;
      });
  }, [atletasSelecionadosIds, todosAtletas, categoriaSel, sexoSel]);

  // Helper para sanitizar elenco removendo atletas irregulares com 1 clique
  const handleRemoverIrregulares = () => {
    const idsIrregulares = new Set(atletasIrregularesNoElenco.map(a => a.id));
    setAtletasSelecionadosIds(prev => prev.filter(id => !idsIrregulares.has(id)));
    const novasProvas = { ...provasPorAtleta };
    idsIrregulares.forEach(id => delete novasProvas[id]);
    setProvasPorAtleta(novasProvas);
  };

  // Funções de apoio ao Modal Oficial de Cadastro de Atleta
  const catCalc = JegdsRulesService.calcularCategoria(dataNascimento);

  const modalidadesDisponiveis = React.useMemo(() => {
    return modalidades.filter(mod => {
      if (!catCalc.categoria) return false;
      const res = JegdsRulesService.validarMatriz(mod.codigo, catCalc.categoria as CategoriaIdade, sexo);
      return res.valido;
    });
  }, [modalidades, catCalc.categoria, sexo]);

  const diagnosticoDuplicidade = React.useMemo(() => {
    if (!escola) return { duplicado: false };
    if (!nomeCompleto.trim() && !documentoNumero.trim()) return { duplicado: false };
    return JegdStorage.verificarDuplicidadeAtleta({
      nomeCompleto,
      dataNascimento,
      documentoNumero: semDocumento ? 'SEM DOCUMENTO' : documentoNumero,
      matricula,
      semDocumento,
      escolaIdAtual: escola.id
    });
  }, [nomeCompleto, dataNascimento, documentoNumero, matricula, semDocumento, escola]);

  const toggleModalidadeCadastro = (modCodigo: ModalidadeCodigo) => {
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

  const toggleProvaModalidade = (prova: string) => {
    if (provasAtletismo.includes(prova)) {
      setProvasAtletismo(provasAtletismo.filter(p => p !== prova));
    } else {
      if (provasAtletismo.length >= 2) {
        alert('No Atletismo cada atleta pode disputar no máximo 2 provas.');
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
    }
  };

  const toggleAtleta = (id: string) => {
    if (!modalidadeAtual) return;
    if (atletasSelecionadosIds.includes(id)) {
      setAtletasSelecionadosIds(atletasSelecionadosIds.filter(i => i !== id));
      const newProvas = { ...provasPorAtleta };
      delete newProvas[id];
      setProvasPorAtleta(newProvas);
    } else {
      if (atletasSelecionadosIds.length >= modalidadeAtual.maxAtletas) {
        alert(`Limite máximo de ${modalidadeAtual.maxAtletas} atletas para ${modalidadeAtual.nome} atingido.`);
        return;
      }
      const atletaObj = todosAtletas.find(a => a.id === id);
      if (atletaObj) {
        const modsAtuais = (atletaObj.modalidadesInscritas || []).map(m => m.modalidadeCodigo);
        const validacaoArt13 = JegdsRulesService.validarLimiteModalidadesAtleta([...modsAtuais, modalidadeAtual.codigo] as any);
        if (!validacaoArt13.valido) {
          alert(`${atletaObj.nomeCompleto}: ${validacaoArt13.erro}`);
          return;
        }
      }
      setAtletasSelecionadosIds([...atletasSelecionadosIds, id]);
    }
  };

  const toggleProvaAtleta = (atletaId: string, prova: string) => {
    const provasAtuais = provasPorAtleta[atletaId] || [];
    if (provasAtuais.includes(prova)) {
      setProvasPorAtleta({
        ...provasPorAtleta,
        [atletaId]: provasAtuais.filter(p => p !== prova)
      });
    } else {
      if (provasAtuais.length >= 2) {
        alert('No Atletismo cada atleta pode disputar no máximo 2 provas.');
        return;
      }
      setProvasPorAtleta({
        ...provasPorAtleta,
        [atletaId]: [...provasAtuais, prova]
      });
    }
  };

  const handleSubmeterInscricao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!escola || !modalidadeAtual) return;

    if (!validacaoMatriz.valido) {
      alert(`Erro: ${validacaoMatriz.erro}`);
      return;
    }

    if (prazoExpirado) {
      alert('O prazo de inscrição para esta modalidade já foi encerrado.');
      return;
    }

    if (atletasSelecionadosIds.length < modalidadeAtual.minAtletas) {
      alert(`A modalidade ${modalidadeAtual.nome} exige no mínimo ${modalidadeAtual.minAtletas} atleta(s) convocados.`);
      return;
    }

    if (atletasSelecionadosIds.length > modalidadeAtual.maxAtletas) {
      alert(`⚠️ Limite Máximo Excedido!\n\nA modalidade ${modalidadeAtual.nome} permite no máximo ${modalidadeAtual.maxAtletas} atletas.\nVocê selecionou ${atletasSelecionadosIds.length} atletas.\n\nPor favor, desmarque ${atletasSelecionadosIds.length - modalidadeAtual.maxAtletas} atleta(s) antes de confirmar.`);
      return;
    }

    // Regra de Blindagem de Etapa: Bloquear atletas fora da etapa no elenco
    if (atletasIrregularesNoElenco.length > 0) {
      alert(
        `⚠️ Atenção: Incompatibilidade de Etapa detectada!\n\n` +
        `Existem ${atletasIrregularesNoElenco.length} atleta(s) convocados no elenco cuja data de nascimento ou sexo não pertencem à Etapa ${categoriaSel} (${sexoSel}).\n\n` +
        `Por favor, desmarque-os ou clique no botão de sanitização antes de confirmar.`
      );
      return;
    }

    // Regra do Regulamento Oficial: Limite de equipes por escola para esta modalidade/categoria/sexo
    if (!validacaoLimiteEquipes.permitido && !equipeEmEdicaoId) {
      alert(`⚠️ ${validacaoLimiteEquipes.erro}`);
      return;
    }

    // Se for Atletismo, validar se cada atleta selecionou entre 1 e 2 provas válidas
    if (modalidadeSelCodigo === 'atletismo') {
      for (const atlId of atletasSelecionadosIds) {
        const atletaObj = todosAtletas.find(a => a.id === atlId);
        const provasAtl = provasPorAtleta[atlId] || [];
        const valProvas = JegdsRulesService.validarProvasAtletismo(categoriaSel, provasAtl);
        if (!valProvas.valido) {
          alert(`Atleta ${atletaObj?.nomeCompleto}: ${valProvas.erro}`);
          return;
        }
      }
    }

    // Verificar se já existe inscrição da mesma modalidade + categoria + sexo + numeroEquipe ou se estamos editando
    const existente = (equipeEmEdicaoId ? inscricoes.find(i => i.id === equipeEmEdicaoId) : null) || inscricoes.find(
      i =>
        i.modalidadeCodigo === modalidadeAtual.codigo &&
        i.categoria === categoriaSel &&
        i.sexo === sexoSel &&
        (i.numeroEquipe === numeroEquipeSel || (!i.numeroEquipe && numeroEquipeSel === 1))
    );

    const nomePadrao = `${escola.sigla || escola.nome} - ${modalidadeAtual.nome} ${categoriaSel} (${sexoSel.slice(0, 4)}) ${maxEquipesPermitidas > 1 ? `• Equipe ${numeroEquipeSel}` : ''}`.trim();
    const nomeFinal = nomeEquipeSel.trim() || nomePadrao;

    // Regra: Não permitir nomes de equipes duplicados na mesma escola
    const nomeJaExiste = inscricoes.find(
      i => i.id !== (existente?.id) && (i.nomeEquipe?.trim().toLowerCase() === nomeFinal.toLowerCase())
    );
    if (nomeJaExiste) {
      alert(`⚠️ Nome de Equipe já existente!\n\nJá existe uma equipe registrada nesta escola com o nome "${nomeFinal}".\n\nPor favor, insira um nome diferente (por exemplo: "${nomeFinal} B" ou "${nomeFinal} - Time 2") para evitar confusões nas súmulas e no chaveamento.`);
      return;
    }

    const novaInscricao: InscricaoEquipe = {
      id: existente ? existente.id : `insc-${Date.now()}-${modalidadeAtual.codigo}-eq${numeroEquipeSel}`,
      escolaId: escola.id,
      modalidadeCodigo: modalidadeAtual.codigo,
      modalidadeNome: modalidadeAtual.nome,
      categoria: categoriaSel,
      sexo: sexoSel,
      numeroEquipe: numeroEquipeSel,
      nomeEquipe: nomeFinal,
      logoUrl: logoEquipeSel,
      atletaIds: atletasSelecionadosIds,
      provasPorAtleta: modalidadeSelCodigo === 'atletismo' ? provasPorAtleta : undefined,
      comissaoIds: [],
      status: 'PENDENTE',
      dataInscricao: new Date().toLocaleString('pt-BR'),
      createdAt: existente ? existente.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    JegdStorage.saveInscricao(novaInscricao);
    setInscricoes(JegdStorage.getInscricoes(escola.id));

    try {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } catch {}

    alert(`Inscrição de ${nomeFinal} (${modalidadeAtual.nome} - ${categoriaSel} ${sexoSel}) salva com sucesso!`);
    setAtletasSelecionadosIds([]);
    setProvasPorAtleta({});
    setNomeEquipeSel('');
    setEquipeEmEdicaoId(null);
  };

  const handleExcluirAtleta = async (id: string, nome: string) => {
    if (confirm(`Deseja realmente remover o aluno "${nome}"? Ele será excluído da delegação da escola e sairá de quaisquer equipes.`)) {
      await JegdStorage.deleteAtleta(id);
      if (escola) {
        setTodosAtletas(JegdStorage.getAtletas(escola.id));
        setInscricoes(JegdStorage.getInscricoes(escola.id));
        setAtletasSelecionadosIds(prev => prev.filter(aId => aId !== id));
      }
    }
  };

  const handleGerarPdf = async (insc: InscricaoEquipe) => {
    if (!escola) return;
    setGerandoPdfId(insc.id);
    try {
      const atletasEquipe = insc.atletaIds
        .map(id => JegdStorage.getAtletaById(id))
        .filter((a): a is Atleta => a !== undefined);

      await JegdPdfGenerator.gerarFichaInscricao(escola, insc, atletasEquipe, []);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar ficha PDF.');
    } finally {
      setGerandoPdfId(null);
    }
  };

  const handleGerarCrachasPdf = async (insc: InscricaoEquipe) => {
    if (!escola) return;
    setGerandoPdfId(insc.id);
    try {
      const atletasEquipe = insc.atletaIds
        .map(id => JegdStorage.getAtletaById(id))
        .filter((a): a is Atleta => a !== undefined);

      await JegdPdfGenerator.gerarCrachasEmLote(
        escola,
        atletasEquipe,
        insc.nomeEquipe || insc.modalidadeNome,
        `${insc.categoria} (${insc.sexo})`
      );
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar crachás em PDF.');
    } finally {
      setGerandoPdfId(null);
    }
  };

  const handleExcluirInscricao = (id: string, nome: string) => {
    if (confirm(`Deseja remover a inscrição de ${nome}?`)) {
      JegdStorage.deleteInscricao(id);
      if (escola) setInscricoes(JegdStorage.getInscricoes(escola.id));
    }
  };

  const handleToggleValidarEquipe = (insc: InscricaoEquipe) => {
    if (!escola) return;
    const modConfig = modalidades.find(m => m.codigo === insc.modalidadeCodigo);
    const limiteMax = modConfig?.maxAtletas || 10;
    const limiteMin = modConfig?.minAtletas || 1;

    // Se estiver tentando validar (mudar para VALIDADA), aplicar regras estritas
    if (insc.status !== 'VALIDADA') {
      if (insc.atletaIds.length > limiteMax) {
        alert(
          `⚠️ Atenção: Não é possível validar a equipe "${insc.nomeEquipe || insc.modalidadeNome}"!\n\n` +
          `O regulamento oficial de ${insc.modalidadeNome} permite no máximo ${limiteMax} atletas por equipe, mas atualmente existem ${insc.atletaIds.length} atletas convocados.\n\n` +
          `Por favor, clique no botão "Ajustar Elenco" no card da equipe e desmarque ${insc.atletaIds.length - limiteMax} atleta(s) excedente(s) antes de validar.`
        );
        return;
      }
      if (insc.atletaIds.length < limiteMin) {
        alert(
          `⚠️ Atenção: Equipe incompleta!\n\n` +
          `A equipe "${insc.nomeEquipe || insc.modalidadeNome}" possui apenas ${insc.atletaIds.length} atleta(s), mas o mínimo exigido pelo regulamento de ${insc.modalidadeNome} é de ${limiteMin} atletas.\n\n` +
          `Por favor, clique em "Ajustar Elenco" e convoque pelo menos ${limiteMin} atletas antes de validar.`
        );
        return;
      }
    }

    const novoStatus = insc.status === 'VALIDADA' ? 'PENDENTE' : 'VALIDADA';
    const autor = nomeOperador || escola.responsavelNome || 'Professor / Diretor da Escola';

    const atualizada: InscricaoEquipe = {
      ...insc,
      status: novoStatus,
      updatedAt: new Date().toISOString()
    };

    JegdStorage.saveInscricao(atualizada);
    setInscricoes(JegdStorage.getInscricoes(escola.id));

    if (novoStatus === 'VALIDADA') {
      try {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
      } catch {}
      alert(`✅ Equipe "${insc.nomeEquipe || insc.modalidadeNome}" validada com sucesso por ${autor}!`);
    } else {
      alert(`Equipe "${insc.nomeEquipe || insc.modalidadeNome}" reaberta para edições.`);
    }
  };

  const handleCarregarEquipeParaEdicao = (insc: InscricaoEquipe) => {
    setEquipeEmEdicaoId(insc.id);
    setModalidadeSelCodigo(insc.modalidadeCodigo);
    setCategoriaSel(insc.categoria);
    setSexoSel(insc.sexo);
    setNumeroEquipeSel(insc.numeroEquipe || 1);
    setNomeEquipeSel(insc.nomeEquipe || '');
    setLogoEquipeSel(insc.logoUrl || 'shield');
    setAtletasSelecionadosIds(insc.atletaIds || []);
    setProvasPorAtleta(insc.provasPorAtleta || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAbrirModalNovoAtleta = () => {
    setNomeCompleto('');
    if (categoriaSel === 'MIRIM') setDataNascimento('2015-05-10');
    else if (categoriaSel === 'INFANTIL') setDataNascimento('2013-05-10');
    else if (categoriaSel === 'INFANTO') setDataNascimento('2010-05-10');
    else setDataNascimento('2007-05-10');

    setSexo(sexoSel);
    setDocumentoTipo('RG');
    setDocumentoNumero('');
    setSemDocumento(false);
    setMatricula(JegdStorage.gerarProximoCodigoInscricao(escola?.municipioId || 'M99'));
    setSerieTurma('7º Ano A');
    setFotoBase64('');
    if (modalidadeAtual) {
      setModalidadesEscolhidas([modalidadeAtual.codigo as ModalidadeCodigo]);
    } else {
      setModalidadesEscolhidas([]);
    }
    setProvasAtletismo([]);
    setModalCadastroAtletaAberto(true);
  };

  const handleSalvarAtletaModal = () => {
    if (!escola) return;
    if (!nomeCompleto.trim() || !dataNascimento || (!semDocumento && !documentoNumero.trim())) {
      alert('Preencha os campos obrigatórios (Nome Completo, Data de Nascimento e Documento ou marque Sem Documento).');
      return;
    }

    if (!catCalc.categoria) {
      alert('Data de nascimento fora da faixa etária oficial do JEGDS 2026.');
      return;
    }

    if (diagnosticoDuplicidade.duplicado && diagnosticoDuplicidade.tipoConflito === 'OUTRA_ESCOLA') {
      alert(diagnosticoDuplicidade.mensagemUsuario || 'Estudante bloqueado por duplicidade em outra escola.');
      return;
    }

    const atletaId = `atl-${Date.now()}`;
    const codMatricula = matricula || JegdStorage.gerarProximoCodigoInscricao(escola.municipioId);

    const novoAtleta: Atleta = {
      id: atletaId,
      escolaId: escola.id,
      municipioId: escola.municipioId,
      nomeCompleto: nomeCompleto.trim().toUpperCase(),
      dataNascimento,
      sexo,
      semDocumento,
      documentoTipo: semDocumento ? 'SEM_DOCUMENTO' : documentoTipo,
      documentoNumero: semDocumento ? 'SEM DOCUMENTO' : documentoNumero.trim(),
      matricula: codMatricula,
      crachaToken: codMatricula,
      serieTurma,
      telefoneContato: escola.responsavelTelefone || '(99) 98801-0000',
      tipoSanguineo: 'O+',
      consentimentoResponsavel: true,
      cadastradoPor: nomeOperador || escola.responsavelNome || 'Professor da Escola',
      categoriaCalculada: catCalc.categoria,
      modalidadesInscritas: modalidadesEscolhidas.map(codigo => {
        const mod = modalidades.find(m => m.codigo === codigo);
        return {
          modalidadeCodigo: codigo,
          modalidadeNome: mod?.nome || codigo,
          provas: codigo === 'atletismo' ? provasAtletismo : undefined
        };
      }),
      conferidoPeloCoordenador: false,
      documentos: {
        foto3x4: fotoBase64 || undefined
      },
      ativo: true,
      createdAt: new Date().toISOString()
    };

    JegdStorage.saveAtleta(novoAtleta);

    const listaAtualizada = JegdStorage.getAtletas(escola.id);
    setTodosAtletas(listaAtualizada);

    // Se o atleta cadastrado pertencer exatamente à categoria e sexo atuais e a modalidade atual estiver entre as escolhidas, adiciona no elenco
    if (novoAtleta.categoriaCalculada === categoriaSel && novoAtleta.sexo === sexoSel) {
      if (modalidadeAtual && modalidadesEscolhidas.includes(modalidadeAtual.codigo as ModalidadeCodigo)) {
        if (atletasSelecionadosIds.length < modalidadeAtual.maxAtletas) {
          setAtletasSelecionadosIds(prev => [...prev, atletaId]);
          if (modalidadeSelCodigo === 'atletismo' && provasAtletismo.length > 0) {
            setProvasPorAtleta(prev => ({ ...prev, [atletaId]: provasAtletismo }));
          }
        }
      }
    }

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch {}

    setModalCadastroAtletaAberto(false);
  };

  if (!escola) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-700">Redirecionando para o painel oficial...</p>
      </div>
    );
  }

  const provasPermitidasAtletismo = PROVAS_ATLETISMO_POR_CATEGORIA[categoriaSel] || [];

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
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
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Inscrição de Equipes & Atletas</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 truncate">
              Escola: <strong className="text-slate-700 font-semibold">{escola.nome}</strong> ({escola.sigla})
            </p>
          </div>
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
                Você tem permissão para inscrever atletas e homologar equipes para qualquer escola do município.
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
                  setTodosAtletas(JegdStorage.getAtletas(esc.id));
                  setInscricoes(JegdStorage.getInscricoes(esc.id));
                  setAtletasSelecionadosIds([]);
                  setProvasPorAtleta({});
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Formulário / Wizard */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-6 shadow-2xs">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-600" />
              <span>Montar Inscrição de Equipe</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-4">
              Selecione a modalidade, categoria, nomeie a equipe e convoque os atletas conforme as regras do JEGDS 2026.
            </p>

            {/* Banner de Modo de Edição / Ajuste */}
            {equipeEmEdicaoId && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-amber-950">
                      Modo de Ajuste de Elenco Ativado
                    </h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      Você está editando a equipe selecionada. Desmarque atletas para respeitar o limite máximo ou renomeie a equipe e clique em <strong>Confirmar e Enviar</strong> para atualizar.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEquipeEmEdicaoId(null);
                    setAtletasSelecionadosIds([]);
                    setNomeEquipeSel('');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-medium shrink-0 transition-colors cursor-pointer"
                >
                  Cancelar Edição
                </button>
              </div>
            )}

            {/* Banner Oficial da Etapa do Calendário */}
            {modalidadeAtual && (() => {
              const etapaInfo = getEtapaInfo(modalidadeAtual.codigo);
              return (
                <div className={`p-3.5 rounded-xl border mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs ${etapaInfo.corFundo}`}>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider shrink-0 ${etapaInfo.badge}`}>
                      {etapaInfo.etapaNome}
                    </span>
                    <div>
                      <h3 className="text-xs sm:text-sm font-semibold">
                        Data dos Jogos: {etapaInfo.data}
                      </h3>
                      <p className="text-xs opacity-90">
                        Modalidade: <strong>{modalidadeAtual.nome}</strong> • Limite oficial: <strong>{modalidadeAtual.maxAtletas} atletas</strong>
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/80 border border-current/20 shrink-0">
                    Prazo final: {etapaInfo.prazo}
                  </span>
                </div>
              );
            })()}

            <form onSubmit={handleSubmeterInscricao} className="space-y-5">
              
              {/* Seleção de Modalidade com Filtro de Etapa Oficial */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    1. Selecione a Modalidade Esportiva
                  </label>
                  <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setFiltroEtapaForm('TODAS')}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors whitespace-nowrap ${
                        filtroEtapaForm === 'TODAS'
                          ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Todas
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFiltroEtapaForm(1);
                        setModalidadeSelCodigo('queimada');
                      }}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors whitespace-nowrap ${
                        filtroEtapaForm === 1
                          ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      1ª Etapa (28/11)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFiltroEtapaForm(2);
                        setModalidadeSelCodigo('beach_soccer');
                      }}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors whitespace-nowrap ${
                        filtroEtapaForm === 2
                          ? 'bg-cyan-600 text-white shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      2ª Etapa (05/12)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFiltroEtapaForm(3);
                        setModalidadeSelCodigo('futsal');
                      }}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-medium transition-colors whitespace-nowrap ${
                        filtroEtapaForm === 3
                          ? 'bg-amber-600 text-white shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      3ª Etapa (12/12)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {modalidades
                    .filter(mod => {
                      if (filtroEtapaForm === 'TODAS') return true;
                      const info = getEtapaInfo(mod.codigo);
                      return info.etapa === filtroEtapaForm;
                    })
                    .map((mod) => {
                      const sel = modalidadeSelCodigo === mod.codigo;
                      const maxEq = JegdsRulesService.getMaxEquipesPorModalidade(mod.codigo as any);
                      const etapaInfo = getEtapaInfo(mod.codigo);
                      return (
                        <button
                          type="button"
                          key={mod.id}
                          onClick={() => {
                            setModalidadeSelCodigo(mod.codigo);
                            setNumeroEquipeSel(1);
                            setAtletasSelecionadosIds([]);
                            setProvasPorAtleta({});

                            if (mod.categoriasPermitidas && !mod.categoriasPermitidas.includes(categoriaSel)) {
                              setCategoriaSel(mod.categoriasPermitidas[0] as CategoriaIdade);
                            }
                            if (mod.sexosPermitidos && !mod.sexosPermitidos.includes(sexoSel)) {
                              setSexoSel(mod.sexosPermitidos[0] as Genero);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-left transition-colors relative cursor-pointer ${
                            sel
                              ? 'bg-emerald-50/70 border-emerald-600 text-emerald-950 font-semibold shadow-2xs ring-1 ring-emerald-500/20'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                              etapaInfo.etapa === 1 ? 'bg-emerald-100 text-emerald-800' : etapaInfo.etapa === 2 ? 'bg-cyan-100 text-cyan-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {etapaInfo.etapa}ª Etapa
                            </span>
                            {maxEq > 1 && (
                              <span className="text-[9px] font-medium text-slate-500">
                                Até 2 times
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm font-semibold truncate text-slate-900">{mod.nome}</p>
                          <p className="text-[10px] text-emerald-700 font-medium mt-0.5">
                            {mod.minAtletas}-{mod.maxAtletas} atletas
                          </p>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Seletor de Equipe 1 / Equipe 2 (Para Futebol e Futsal) com Travas */}
              {maxEquipesPermitidas > 1 && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-800 uppercase flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-emerald-600" />
                      <span>Selecione qual equipe você está montando</span>
                    </label>
                    <span className="text-[10px] font-medium text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      Permitido até 2 equipes
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setNumeroEquipeSel(1)}
                      className={`py-2.5 px-3 rounded-lg font-medium text-xs sm:text-sm flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                        numeroEquipeSel === 1
                          ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span>Equipe 1 (Principal)</span>
                      {equipe1Existente ? (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          numeroEquipeSel === 1 ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          ✓ Já Cadastrada ({equipe1Existente.atletaIds.length} atl)
                        </span>
                      ) : (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          numeroEquipeSel === 1 ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          Disponível
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setNumeroEquipeSel(2)}
                      className={`py-2.5 px-3 rounded-lg font-medium text-xs sm:text-sm flex flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                        numeroEquipeSel === 2
                          ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                          : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span>Equipe 2 (Secundária)</span>
                      {equipe2Existente ? (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          numeroEquipeSel === 2 ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          ✓ Já Cadastrada ({equipe2Existente.atletaIds.length} atl)
                        </span>
                      ) : (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          numeroEquipeSel === 2 ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          Disponível
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Alerta de Equipe Única Já Cadastrada (Para modalidades com limite estrito de 1 equipe) */}
              {maxEquipesPermitidas === 1 && equipe1Existente && equipeEmEdicaoId !== equipe1Existente.id && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-amber-950">
                      Equipe já cadastrada: {modalidadeAtual?.nome} {categoriaSel} ({sexoSel})
                    </p>
                    <p className="text-amber-800 leading-snug">
                      O regulamento oficial ({modalidadeAtual?.codigo ? getEtapaInfo(modalidadeAtual.codigo).etapaNome : 'Regulamento Oficial'}) permite <strong>no máximo 1 equipe por categoria e sexo</strong> nesta modalidade. Para alterar os atletas convocados ou renomear esta equipe, clique no botão <strong>"Ajustar Elenco"</strong> no card à direita.
                    </p>
                  </div>
                </div>
              )}

              {/* Customização: Nome da Equipe e Logo/Escudo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nome da Equipe (Para Identificação)
                  </label>
                  <input
                    type="text"
                    value={nomeEquipeSel}
                    onChange={(e) => setNomeEquipeSel(e.target.value)}
                    placeholder={`Ex: ${escola.sigla} ${maxEquipesPermitidas > 1 ? `- Time ${numeroEquipeSel}` : 'A'}`}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm font-normal focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Escudo / Logo da Equipe
                  </label>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {LOGOS_PREDEFINIDOS.map((badge) => {
                      const BadgeIcon = badge.Icon;
                      return (
                        <button
                          type="button"
                          key={badge.id}
                          onClick={() => setLogoEquipeSel(badge.id)}
                          title={badge.label}
                          aria-label={badge.label}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center border transition-colors cursor-pointer ${
                            logoEquipeSel === badge.id
                              ? 'bg-emerald-50 border-emerald-600 ring-1 ring-emerald-500/20 shadow-2xs'
                              : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'
                          }`}
                        >
                          <BadgeIcon className={`w-4 h-4 ${badge.color}`} aria-hidden="true" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Informação do Prazo e Limites da Modalidade */}
              {modalidadeAtual && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
                  <div>
                    <span className="text-slate-500">Elenco Exigido:</span>{' '}
                    <strong className="text-slate-800 font-semibold">
                      Mínimo {modalidadeAtual.minAtletas} e Máximo {modalidadeAtual.maxAtletas} alunos
                    </strong>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-800 font-medium bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Prazo: {new Date(modalidadeAtual.prazoInscricao).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              )}

              {/* Seleção de Categoria e Sexo com Faixa Etária Oficial */}
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      2. Categoria Etária (Ref: 31/12/2026)
                    </label>
                    <select
                      value={categoriaSel}
                      onChange={(e) => {
                        setCategoriaSel(e.target.value as CategoriaIdade);
                        setAtletasSelecionadosIds([]);
                        setProvasPorAtleta({});
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors cursor-pointer"
                    >
                      <option value="MIRIM">Mirim (9 a 11 anos: 2015-2017)</option>
                      <option value="INFANTIL">Infantil (12 a 14 anos: 2012-2014)</option>
                      <option value="INFANTO">Infanto (15 a 17 anos: 2009-2011)</option>
                      <option value="JUNIOR">Junior (18 a 20 anos: 2006-2008)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                      3. Gênero / Naipe
                    </label>
                    <select
                      value={sexoSel}
                      onChange={(e) => {
                        setSexoSel(e.target.value as Genero);
                        setAtletasSelecionadosIds([]);
                        setProvasPorAtleta({});
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600 focus:bg-white transition-colors cursor-pointer"
                    >
                      <option value="MASCULINO">Masculino</option>
                      <option value="FEMININO">Feminino</option>
                    </select>
                  </div>
                </div>

                {/* Banner de Identificação da Etapa e Limite Estrito */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50/70 border border-emerald-200/70 text-xs text-emerald-950">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                    <span className="font-bold">Etapa Oficial: {categoriaSel} ({sexoSel})</span>
                    <span className="text-emerald-700 font-medium hidden sm:inline">• {FAIXA_ETARIA_INFO[categoriaSel].faixaAnos} ({FAIXA_ETARIA_INFO[categoriaSel].anosNascimento})</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200 shrink-0">
                    {atletasElegiveis.length} elegíveis
                  </span>
                </div>
              </div>

              {/* Alerta de Atletas Irregulares no Elenco (Blindagem de Etapa) */}
              {atletasIrregularesNoElenco.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 text-rose-950 text-xs rounded-xl p-3.5 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 flex-1">
                      <p className="font-bold text-rose-950">
                        {atletasIrregularesNoElenco.length} atleta(s) incompatíveis no elenco desta equipe!
                      </p>
                      <p className="text-rose-800 leading-relaxed text-[11px]">
                        Atletas de outras idades ou sexo não podem ser misturados em equipes de outra categoria.
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {atletasIrregularesNoElenco.map(a => (
                          <span key={a.id} className="bg-rose-100 text-rose-900 border border-rose-300 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                            {a.nomeCompleto} ({a.categoriaCalculada || 'Fora Faixa'} • {a.sexo === 'FEMININO' ? 'Fem' : 'Masc'})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoverIrregulares}
                    className="w-full py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remover Atletas Incompatíveis Automaticamente</span>
                  </button>
                </div>
              )}

              {/* Alerta de Validação da Matriz */}
              {!validacaoMatriz.valido && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3.5 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                  <div>
                    <strong className="font-semibold text-rose-950">Combinação Bloqueada pelo Regulamento:</strong>
                    <p className="mt-0.5 leading-relaxed text-rose-800">{validacaoMatriz.erro}</p>
                  </div>
                </div>
              )}

              {/* Lista de Atletas Elegíveis */}
              {validacaoMatriz.valido && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        4. Seleção de Alunos-Atletas
                      </label>
                      {modalidadeAtual && (
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                          atletasSelecionadosIds.length >= modalidadeAtual.minAtletas &&
                          atletasSelecionadosIds.length <= modalidadeAtual.maxAtletas
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60 font-semibold'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {atletasSelecionadosIds.length}/{modalidadeAtual.maxAtletas} (Mín: {modalidadeAtual.minAtletas})
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleAbrirModalNovoAtleta}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Cadastrar Aluno</span>
                    </button>
                  </div>

                  {atletasElegiveis.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center space-y-2.5">
                      <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto" />
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-slate-800">
                          Nenhum aluno cadastrado na escola para a categoria {categoriaSel} ({sexoSel}).
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Cadastre os alunos agora no formulário oficial da SEMED para convocar para a equipe!
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAbrirModalNovoAtleta}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Cadastrar Aluno Agora</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {atletasElegiveis.map((atleta) => {
                        const selecionado = atletasSelecionadosIds.includes(atleta.id);
                        const provasDoAtleta = provasPorAtleta[atleta.id] || [];

                        return (
                          <div
                            key={atleta.id}
                            className={`p-3 rounded-xl border transition-colors ${
                              selecionado
                                ? 'bg-emerald-50/70 border-emerald-600 shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div
                                onClick={() => toggleAtleta(atleta.id)}
                                className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                              >
                                <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                                  selecionado ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                                }`}>
                                  {selecionado && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">{atleta.nomeCompleto}</p>
                                  <p className="text-[11px] text-slate-500 mt-0.5 truncate flex items-center gap-1.5 flex-wrap">
                                    {atleta.semDocumento || atleta.documentoTipo === 'SEM_DOCUMENTO' ? (
                                      <span className="font-semibold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/80 text-[10px]">
                                        ⚠️ Sem Documento
                                      </span>
                                    ) : (
                                      <span>Doc: {atleta.documentoTipo} {atleta.documentoNumero}</span>
                                    )}
                                    <span>• Nasc: {new Date(atleta.dataNascimento).toLocaleDateString('pt-BR')}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                                  {atleta.matricula}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExcluirAtleta(atleta.id, atleta.nomeCompleto);
                                  }}
                                  className="p-1 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                                  title="Excluir este aluno do cadastro da escola"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Seletor de Provas para Atletismo */}
                            {selecionado && modalidadeSelCodigo === 'atletismo' && (
                              <div className="mt-2.5 pt-2.5 border-t border-emerald-200/60 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-medium text-emerald-900">
                                    Selecione até 2 provas de Atletismo:
                                  </span>
                                  <span className="text-xs text-slate-500">
                                    {provasDoAtleta.length}/2 selecionadas
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {provasPermitidasAtletismo.map((prova) => {
                                    const provaAtiva = provasDoAtleta.includes(prova);
                                    return (
                                      <button
                                        type="button"
                                        key={prova}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleProvaAtleta(atleta.id, prova);
                                        }}
                                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                                          provaAtiva
                                            ? 'bg-emerald-600 text-white shadow-2xs'
                                            : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                                        }`}
                                      >
                                        {prova}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Botão de Envio */}
              <button
                type="submit"
                disabled={
                  !validacaoMatriz.valido ||
                  prazoExpirado ||
                  !modalidadeAtual ||
                  atletasSelecionadosIds.length < (modalidadeAtual?.minAtletas || 1) ||
                  atletasSelecionadosIds.length > (modalidadeAtual?.maxAtletas || 99)
                }
                className="w-full py-3 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm shadow-2xs flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                <span>Confirmar e Enviar Inscrição da Equipe</span>
              </button>

            </form>
          </div>
        </div>

        {/* Resumo das Inscrições Efetuadas */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900">Equipes Submetidas ({inscricoes.length})</h3>
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setFiltroEtapaLista('TODAS')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors whitespace-nowrap ${
                    filtroEtapaLista === 'TODAS'
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todas ({inscricoes.length})
                </button>
                {(['MIRIM', 'INFANTIL', 'INFANTO', 'JUNIOR'] as CategoriaIdade[]).map((cat) => {
                  const total = inscricoes.filter(i => (i.categoria || 'INFANTIL') === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFiltroEtapaLista(cat)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors whitespace-nowrap ${
                        filtroEtapaLista === cat
                          ? 'bg-emerald-600 text-white shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {cat} ({total})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Card Informativo sobre Equipes com Elenco Excedente */}
            {equipesComExcesso.length > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1.5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-semibold text-amber-950">
                      Atenção: Equipe(s) com elenco excedendo o limite oficial
                    </h4>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      Identificamos que <strong>{equipesComExcesso.length} equipe(s)</strong> possuem mais atletas do que o teto da modalidade permite.
                    </p>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      👉 Clique em <span className="bg-slate-900 text-white px-1.5 py-0.5 rounded font-medium text-[10px]">Ajustar Elenco</span> para remover os excedentes.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {equipesAgrupadasPorEtapa.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                {filtroEtapaLista === 'TODAS'
                  ? 'Nenhuma equipe submetida ainda.'
                  : `Nenhuma equipe submetida para a categoria ${filtroEtapaLista}.`}
              </p>
            ) : (
              <div className="space-y-6">
                {equipesAgrupadasPorEtapa.map(({ etapa, modalidades: modsDaEtapa, totalEquipes }) => (
                  <div key={etapa} className="space-y-3.5">
                    {/* CABEÇALHO DA ETAPA / CATEGORIA */}
                    <div className="flex items-center justify-between px-3 py-2 bg-slate-100/80 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                        <span className="text-xs font-bold text-slate-900 tracking-wide uppercase">
                          ETAPA {etapa}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          ({FAIXA_ETARIA_INFO[etapa].faixaAnos} • {FAIXA_ETARIA_INFO[etapa].anosNascimento})
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {totalEquipes} {totalEquipes === 1 ? 'equipe' : 'equipes'}
                      </span>
                    </div>

                    {/* MODALIDADES DESTA ETAPA */}
                    <div className="space-y-3 pl-1 sm:pl-2">
                      {modsDaEtapa.map(({ modalidadeNome, equipes }) => (
                        <div key={modalidadeNome} className="space-y-2">
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 pl-1">
                            <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{modalidadeNome}</span>
                            <span className="text-[10px] font-normal text-slate-400">
                              ({equipes.length} {equipes.length === 1 ? 'time' : 'times'})
                            </span>
                          </div>

                          <div className="space-y-2.5">
                            {equipes.map((insc) => {
                              const numEq = insc.numeroEquipe || 1;
                              const modConfig = modalidades.find(m => m.codigo === insc.modalidadeCodigo);
                              const limiteMax = modConfig?.maxAtletas || 10;
                              const limiteMin = modConfig?.minAtletas || 1;
                              const excedeLimite = insc.atletaIds.length > limiteMax;
                              const abaixoMinimo = insc.atletaIds.length < limiteMin;
                              const nomeLimpo = (insc.nomeEquipe || insc.modalidadeNome || '').trim().toLowerCase();
                              const nomeDuplicado = (contagemNomesEquipes[nomeLimpo] || 0) > 1;

                              // Detecção de atletas com idade ou sexo incompatível com a equipe
                              const atletasIrregularesEquipe = (insc.atletaIds || [])
                                .map(id => todosAtletas.find(a => a.id === id))
                                .filter(a => {
                                  if (!a) return false;
                                  const info = JegdsRulesService.calcularCategoria(a.dataNascimento);
                                  return info.categoria !== insc.categoria || a.sexo !== insc.sexo;
                                });

                              const temIrregulares = atletasIrregularesEquipe.length > 0;

                              const nomeExibicao = (insc.nomeEquipe && insc.nomeEquipe.trim().toLowerCase() !== insc.modalidadeNome.toLowerCase())
                                ? insc.nomeEquipe
                                : `${insc.modalidadeNome} • ${insc.categoria} (${insc.sexo === 'FEMININO' ? 'Fem' : 'Masc'}) ${numEq > 1 ? `- Time ${numEq}` : ''}`;

                              return (
                                <div
                                  key={insc.id}
                                  className={`border rounded-xl p-3.5 space-y-2.5 transition-colors shadow-2xs ${
                                    temIrregulares || excedeLimite
                                      ? 'bg-rose-50/40 border-rose-200'
                                      : 'bg-white border-slate-200/90 hover:border-slate-300'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                                        {renderEmblemaEquipe(insc.logoUrl)}
                                      </span>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <h4 className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                                            {nomeExibicao}
                                          </h4>
                                          <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${
                                            numEq === 1 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-blue-50 text-blue-800 border-blue-200'
                                          }`}>
                                            {numEq === 1 ? 'Equipe 1' : `Equipe ${numEq}`}
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                          {insc.modalidadeNome} • {insc.categoria} • {insc.sexo}
                                        </p>
                                      </div>
                                    </div>
                                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 ${
                                      insc.status === 'VALIDADA'
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200/60'
                                        : insc.status === 'REJEITADA'
                                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                                        : 'bg-amber-50 text-amber-800 border-amber-200/80'
                                    }`}>
                                      {insc.status}
                                    </span>
                                  </div>

                                  <div className="text-xs text-[#4B5563] space-y-1">
                                    <div className="flex items-center justify-between flex-wrap gap-1">
                                      <span>
                                        <strong className={excedeLimite ? 'text-rose-600 font-black' : 'text-[#17221D] font-bold'}>
                                          {insc.atletaIds.length}/{limiteMax}
                                        </strong> Atletas convocados
                                      </span>
                                      {temIrregulares && (
                                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300">
                                          ⚠️ {atletasIrregularesEquipe.length} atleta(s) fora da etapa
                                        </span>
                                      )}
                                      {excedeLimite && (
                                        <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300">
                                          ⚠️ Excede teto de {limiteMax}
                                        </span>
                                      )}
                                      {abaixoMinimo && (
                                        <span className="text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                                          Mínimo: {limiteMin}
                                        </span>
                                      )}
                                    </div>

                                    {temIrregulares && (
                                      <div className="p-2 rounded-lg bg-rose-100/70 border border-rose-300 text-rose-900 text-[11px] space-y-0.5 mt-1">
                                        <p className="font-bold">Incompatibilidade de Idade/Naipe detectada:</p>
                                        <p className="text-[10px]">
                                          Atletas de outras idades estão convocados. Clique em <strong>Ajustar Elenco</strong> para regularizar.
                                        </p>
                                      </div>
                                    )}

                                    {excedeLimite && (
                                      <div className="p-2.5 rounded-xl bg-rose-100/70 border border-rose-300 text-rose-900 text-xs space-y-1 mt-1">
                                        <div className="flex items-center gap-1.5 font-black text-rose-950">
                                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                                          <span>Elenco Excedendo Limite ({insc.atletaIds.length}/{limiteMax} atletas)</span>
                                        </div>
                                        <p className="text-[11px] text-rose-800 leading-snug">
                                          Esta equipe possui <strong>{insc.atletaIds.length - limiteMax} aluno(s) a mais</strong> que o regulamento permite.
                                        </p>
                                      </div>
                                    )}

                                    {nomeDuplicado && (
                                      <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5 mt-1">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                        <span>Nome repetido nesta escola. Recomendamos clicar em <strong>Ajustar Elenco</strong> para diferenciar.</span>
                                      </div>
                                    )}

                                    {insc.motivoRejeicao && (
                                      <p className="text-red-600 text-xs font-medium">
                                        Motivo Rejeição: {insc.motivoRejeicao}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleValidarEquipe(insc)}
                                      className={`py-1 px-2.5 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-2xs ${
                                        insc.status === 'VALIDADA'
                                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                          : (excedeLimite || abaixoMinimo || temIrregulares)
                                          ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
                                          : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                                      }`}
                                      title={
                                        insc.status === 'VALIDADA'
                                          ? 'Equipe já validada pela escola. Clique para reabrir.'
                                          : (excedeLimite || temIrregulares)
                                          ? 'Equipe irregular. Clique para instruções.'
                                          : 'Validar e homologar esta equipe'
                                      }
                                    >
                                      <ShieldCheck className="w-3.5 h-3.5" />
                                      <span>{insc.status === 'VALIDADA' ? 'Validada' : (excedeLimite || abaixoMinimo || temIrregulares) ? 'Regularizar' : 'Validar'}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleCarregarEquipeParaEdicao(insc)}
                                      className="py-1 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-2xs"
                                      title="Carregar esta equipe no formulário à esquerda para ajustar elenco"
                                    >
                                      <span>Ajustar Elenco</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleGerarPdf(insc)}
                                      disabled={gerandoPdfId === insc.id}
                                      className="py-1 px-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center justify-center gap-1 transition-colors disabled:opacity-50 shadow-2xs"
                                    >
                                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                                      <span>Ficha</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleGerarCrachasPdf(insc)}
                                      disabled={gerandoPdfId === insc.id}
                                      className="py-1 px-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-medium flex items-center justify-center gap-1 transition-colors disabled:opacity-50 shadow-2xs"
                                    >
                                      <Download className="w-3.5 h-3.5 text-slate-500" />
                                      <span>Crachás</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleExcluirInscricao(insc.id, insc.nomeEquipe || `${insc.modalidadeNome} - Equipe ${numEq}`)}
                                      className="p-1 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors shadow-2xs"
                                      title="Remover equipe"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal Oficial Unificado de Cadastro de Atleta (Padrão SEMED) */}
      {modalCadastroAtletaAberto && (
        <ModalCadastroAtleta
          isOpen={modalCadastroAtletaAberto}
          onClose={() => setModalCadastroAtletaAberto(false)}
          atletaEditando={null}
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
          toggleModalidade={toggleModalidadeCadastro}
          provasPermitidas={provasPermitidasAtletismo}
          provasAtletismo={provasAtletismo}
          toggleProva={toggleProvaModalidade}
          handleSalvarAtleta={handleSalvarAtletaModal}
          escolaId={escola.id}
          diagnosticoDuplicidade={diagnosticoDuplicidade}
        />
      )}

    </div>
  );
}
