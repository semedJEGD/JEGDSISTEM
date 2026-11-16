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
  ModalidadeCodigo
} from '@/types/jegd';
import {
  JegdsRulesService,
  PROVAS_ATLETISMO_POR_CATEGORIA,
  MODALIDADES_JEGDS
} from '@/services/jegds-rules';

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
  const [filtroEtapaLista, setFiltroEtapaLista] = useState<number | 'TODAS'>('TODAS');

  // Estado do Cadastro Rápido de Aluno direto no Painel da Modalidade
  const [modalRapidoAberto, setModalRapidoAberto] = useState(false);
  const [rapidoNome, setRapidoNome] = useState('');
  const [rapidoDataNasc, setRapidoDataNasc] = useState('2013-05-10');
  const [rapidoDocTipo, setRapidoDocTipo] = useState<'RG' | 'CERTIDAO'>('RG');
  const [rapidoDocNum, setRapidoDocNum] = useState('');
  const [rapidoSerie, setRapidoSerie] = useState('7º Ano A');

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
    setTodosAtletas(JegdStorage.getAtletas(atual.id));
    setInscricoes(JegdStorage.getInscricoes(atual.id));
    const mods = JegdStorage.getModalidades();
    setModalidades(mods);

    // Leitura inteligente de parâmetros da URL (quando acessado via menu Modalidades)
    const urlParams = new URLSearchParams(window.location.search);
    const modParam = urlParams.get('modalidade') as ModalidadeCodigo | null;
    const etapaParam = urlParams.get('etapa');
    if (etapaParam && ['1', '2', '3'].includes(etapaParam)) {
      const numEtapa = Number(etapaParam);
      setFiltroEtapaForm(numEtapa);
      setFiltroEtapaLista(numEtapa);
    }

    if (modParam && mods.some(m => m.codigo === modParam)) {
      setModalidadeSelCodigo(modParam);
      const modObj = mods.find(m => m.codigo === modParam);
      if (modObj) {
        if (modObj.categoriasPermitidas && !modObj.categoriasPermitidas.includes(categoriaSel)) {
          setCategoriaSel(modObj.categoriasPermitidas[0] as CategoriaIdade);
        }
        if (modObj.sexosPermitidos && !modObj.sexosPermitidos.includes(sexoSel)) {
          setSexoSel(modObj.sexosPermitidos[0] as Genero);
        }
      }
    } else if (mods.length > 0) {
      setModalidadeSelCodigo(mods[0].codigo);
    }

    const handleSync = () => {
      const targetEsc = JegdStorage.getCurrentEscola();
      if (targetEsc) {
        setTodosAtletas(JegdStorage.getAtletas(targetEsc.id));
        setInscricoes(JegdStorage.getInscricoes(targetEsc.id));
      }
      setModalidades(JegdStorage.getModalidades());
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

  // Equipes submetidas filtradas por Etapa
  const inscricoesFiltradas = React.useMemo(() => {
    if (filtroEtapaLista === 'TODAS') return inscricoes;
    return inscricoes.filter(insc => {
      const info = getEtapaInfo(insc.modalidadeCodigo);
      return info.etapa === filtroEtapaLista;
    });
  }, [inscricoes, filtroEtapaLista]);

  // Validação da Matriz
  const validacaoMatriz = JegdsRulesService.validarMatriz(modalidadeSelCodigo, categoriaSel, sexoSel);

  // Prazo e status
  const prazoExpirado = modalidadeAtual ? JegdsRulesService.isPrazoExpirado(modalidadeAtual.prazoInscricao) : false;

  // Atletas elegíveis para a categoria e sexo selecionados
  const atletasElegiveis = todosAtletas.filter(atleta => {
    const infoCat = JegdsRulesService.calcularCategoria(atleta.dataNascimento);
    const bateCat = infoCat.categoria === categoriaSel;
    const bateGen = atleta.sexo === sexoSel;
    return bateCat && bateGen;
  });

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

  const handleAbrirModalRapido = () => {
    setRapidoNome('');
    if (categoriaSel === 'MIRIM') setRapidoDataNasc('2015-05-10');
    else if (categoriaSel === 'INFANTIL') setRapidoDataNasc('2013-05-10');
    else if (categoriaSel === 'INFANTO') setRapidoDataNasc('2010-05-10');
    else setRapidoDataNasc('2007-05-10');

    setRapidoDocTipo('RG');
    setRapidoDocNum('');
    setRapidoSerie('7º Ano A');
    setModalRapidoAberto(true);
  };

  const handleSalvarAlunoRapido = (adicionarMais: boolean = false) => {
    if (!escola || !modalidadeAtual) return;
    if (!rapidoNome.trim() || !rapidoDataNasc || !rapidoDocNum.trim()) {
      alert('Preencha o Nome Completo, Data de Nascimento e Documento do estudante.');
      return;
    }

    const infoCat = JegdsRulesService.calcularCategoria(rapidoDataNasc);
    if (!infoCat.categoria) {
      alert('Data de nascimento fora da faixa etária oficial do JEGDS 2026.');
      return;
    }

    // Valida matriz da modalidade
    const valMatriz = JegdsRulesService.validarMatriz(modalidadeAtual.codigo, infoCat.categoria, sexoSel);
    if (!valMatriz.valido) {
      alert(`Não é possível cadastrar: ${valMatriz.erro}`);
      return;
    }

    // Verifica limite de elenco da equipe
    if (atletasSelecionadosIds.length >= modalidadeAtual.maxAtletas) {
      alert(`Limite máximo de ${modalidadeAtual.maxAtletas} atletas para ${modalidadeAtual.nome} atingido.`);
      return;
    }

    const atletaId = `atl-${Date.now()}`;
    const codigoFinal = JegdStorage.gerarProximoCodigoInscricao(escola.municipioId);

    const novoAtleta: Atleta = {
      id: atletaId,
      escolaId: escola.id,
      municipioId: escola.municipioId,
      nomeCompleto: rapidoNome.trim().toUpperCase(),
      dataNascimento: rapidoDataNasc,
      sexo: sexoSel,
      documentoTipo: rapidoDocTipo,
      documentoNumero: rapidoDocNum.trim(),
      matricula: codigoFinal,
      crachaToken: codigoFinal,
      serieTurma: rapidoSerie,
      telefoneContato: escola.responsavelTelefone || '(99) 98801-0000',
      tipoSanguineo: 'O+',
      consentimentoResponsavel: true,
      cadastradoPor: nomeOperador || escola.responsavelNome || 'Professor da Escola',
      categoriaCalculada: infoCat.categoria,
      modalidadesInscritas: [
        {
          modalidadeCodigo: modalidadeAtual.codigo,
          modalidadeNome: modalidadeAtual.nome,
          provas: modalidadeSelCodigo === 'atletismo' ? ['75m'] : undefined
        }
      ],
      conferidoPeloCoordenador: false,
      documentos: {},
      ativo: true,
      createdAt: new Date().toISOString()
    };

    JegdStorage.saveAtleta(novoAtleta);

    // Atualiza a lista geral e já seleciona o novo atleta para a equipe!
    const listaAtualizada = JegdStorage.getAtletas(escola.id);
    setTodosAtletas(listaAtualizada);
    setAtletasSelecionadosIds(prev => [...prev, atletaId]);
    if (modalidadeSelCodigo === 'atletismo') {
      setProvasPorAtleta(prev => ({ ...prev, [atletaId]: ['75m'] }));
    }

    try {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
    } catch {}

    if (adicionarMais) {
      setRapidoNome('');
      setRapidoDocNum('');
    } else {
      setModalRapidoAberto(false);
    }
  };

  if (!escola) return null;

  const provasPermitidasAtletismo = PROVAS_ATLETISMO_POR_CATEGORIA[categoriaSel] || [];

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href={isCoordenador ? "/admin/dashboard" : "/escola/dashboard"}
            className="p-3 rounded-2xl bg-white border border-[#E2EAE5] text-[#4B5563] hover:text-[#087A5B] hover:border-[#00A878] shadow-xs transition-all shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-black text-[#17221D] break-words">Inscrição de Equipes & Atletas</h1>
            <p className="text-xs sm:text-sm text-[#4B5563] mt-0.5 font-medium truncate">
              Escola: <strong className="text-[#17221D]">{escola.nome}</strong> ({escola.sigla})
            </p>
          </div>
        </div>
      </div>

      {/* Banner de Operação Especial para a Coordenação SEMED */}
      {isCoordenador && (
        <div className="bg-[#0b291e] border-2 border-emerald-500/40 text-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 flex items-center justify-center font-bold text-lg shrink-0">
              👑
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-wider mb-0.5">
                <span>Modo Coordenação SEMED Ativo</span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white">
                Operador: {nomeOperador || 'Elias Veloso / Herbert (SEMED)'}
              </h3>
              <p className="text-xs text-emerald-100/80">
                Você tem permissão para inscrever atletas e homologar equipes para qualquer escola do município.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <span className="text-xs font-bold text-emerald-200 shrink-0">Alternar Escola:</span>
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
              className="px-3.5 py-2 rounded-xl bg-emerald-950 border border-emerald-500/60 text-white text-xs font-bold focus:outline-none focus:border-emerald-300 cursor-pointer w-full md:w-auto"
            >
              {todasEscolas.map(e => (
                <option key={e.id} value={e.id}>
                  {e.nome} ({e.sigla})
                </option>
              ))}
            </select>

            <Link
              href="/admin/dashboard"
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all shrink-0 whitespace-nowrap text-center"
            >
              Painel SEMED
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Formulário / Wizard */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#E2EAE5] rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xs">
            <h2 className="text-lg sm:text-xl font-black text-[#17221D] mb-1 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#00A878]" />
              <span>Montar Inscrição de Equipe</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] mb-4 font-medium">
              Selecione a modalidade, categoria, nomeie a equipe e convoque os atletas conforme as regras do JEGDS 2026.
            </p>

            {/* Banner de Modo de Edição / Ajuste */}
            {equipeEmEdicaoId && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-black">
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
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-black shrink-0 transition-colors cursor-pointer"
                >
                  Cancelar Edição
                </button>
              </div>
            )}

            {/* Banner Oficial da Etapa do Calendário */}
            {modalidadeAtual && (() => {
              const etapaInfo = getEtapaInfo(modalidadeAtual.codigo);
              return (
                <div className={`p-4 rounded-2xl border mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs ${etapaInfo.corFundo}`}>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shrink-0 ${etapaInfo.badge}`}>
                      {etapaInfo.etapaNome}
                    </span>
                    <div>
                      <h3 className="text-sm sm:text-base font-black">
                        Data dos Jogos: {etapaInfo.data}
                      </h3>
                      <p className="text-xs opacity-90 font-medium">
                        Modalidade: <strong>{modalidadeAtual.nome}</strong> • Limite oficial: <strong>{modalidadeAtual.maxAtletas} atletas</strong>
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/80 border border-current/20 shrink-0">
                    Prazo final: {etapaInfo.prazo}
                  </span>
                </div>
              );
            })()}

            <form onSubmit={handleSubmeterInscricao} className="space-y-5 sm:space-y-6">
              
              {/* Seleção de Modalidade com Filtro de Etapa Oficial */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <label className="block text-xs sm:text-sm font-black text-[#17221D] uppercase tracking-wider">
                    1. Selecione a Modalidade Esportiva
                  </label>
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setFiltroEtapaForm('TODAS')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-colors whitespace-nowrap ${
                        filtroEtapaForm === 'TODAS'
                          ? 'bg-white text-slate-900 shadow-2xs'
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
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-colors whitespace-nowrap ${
                        filtroEtapaForm === 1
                          ? 'bg-emerald-600 text-white shadow-2xs'
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
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-colors whitespace-nowrap ${
                        filtroEtapaForm === 2
                          ? 'bg-cyan-600 text-white shadow-2xs'
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
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-colors whitespace-nowrap ${
                        filtroEtapaForm === 3
                          ? 'bg-amber-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      3ª Etapa (12/12)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
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
                          className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border text-left transition-all relative ${
                            sel
                              ? 'bg-[#E8F7F1] border-[#00A878] text-[#087A5B] font-bold shadow-sm ring-2 ring-[#00A878]/30'
                              : 'bg-[#F7F9F8] border-[#E2EAE5] text-[#4B5563] hover:bg-white hover:border-[#00A878]/50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                              etapaInfo.etapa === 1 ? 'bg-emerald-100 text-emerald-800' : etapaInfo.etapa === 2 ? 'bg-cyan-100 text-cyan-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {etapaInfo.etapa}ª Etapa
                            </span>
                            {maxEq > 1 && (
                              <span className="text-[9px] font-black text-slate-500">
                                Até 2 times
                              </span>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm font-black truncate text-[#17221D]">{mod.nome}</p>
                          <p className="text-[10px] text-[#00A878] font-bold mt-0.5">
                            {mod.minAtletas}-{mod.maxAtletas} atletas
                          </p>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Seletor de Equipe 1 / Equipe 2 (Para Futebol e Futsal) com Travas */}
              {maxEquipesPermitidas > 1 && (
                <div className="bg-[#E8F7F1]/60 border border-[#00A878]/30 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-black text-[#087A5B] uppercase flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-[#00A878]" />
                      <span>Selecione qual equipe você está montando</span>
                    </label>
                    <span className="text-[11px] font-bold text-[#087A5B] bg-white px-2 py-0.5 rounded-md border border-[#00A878]/25">
                      Permitido até 2 equipes
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNumeroEquipeSel(1)}
                      className={`py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-1 transition-all ${
                        numeroEquipeSel === 1
                          ? 'bg-[#00A878] text-white shadow-sm'
                          : 'bg-white text-[#17221D] border border-[#E2EAE5] hover:border-[#00A878]'
                      }`}
                    >
                      <span>Equipe 1 (Principal)</span>
                      {equipe1Existente ? (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          numeroEquipeSel === 1 ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          ✓ Já Cadastrada ({equipe1Existente.atletaIds.length} atl)
                        </span>
                      ) : (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          numeroEquipeSel === 1 ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          Disponível
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setNumeroEquipeSel(2)}
                      className={`py-3 px-4 rounded-xl font-black text-xs sm:text-sm flex flex-col items-center justify-center gap-1 transition-all ${
                        numeroEquipeSel === 2
                          ? 'bg-[#00A878] text-white shadow-sm'
                          : 'bg-white text-[#17221D] border border-[#E2EAE5] hover:border-[#00A878]'
                      }`}
                    >
                      <span>Equipe 2 (Secundária)</span>
                      {equipe2Existente ? (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          numeroEquipeSel === 2 ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          ✓ Já Cadastrada ({equipe2Existente.atletaIds.length} atl)
                        </span>
                      ) : (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          numeroEquipeSel === 2 ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
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
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-black text-amber-950">
                      Equipe já cadastrada: {modalidadeAtual?.nome} {categoriaSel} ({sexoSel})
                    </p>
                    <p className="text-amber-800 leading-snug">
                      O regulamento oficial ({modalidadeAtual?.codigo ? getEtapaInfo(modalidadeAtual.codigo).etapaNome : 'Regulamento Oficial'}) permite <strong>no máximo 1 equipe por categoria e sexo</strong> nesta modalidade. Para alterar os atletas convocados ou renomear esta equipe, clique no botão <strong>"Ajustar Elenco"</strong> no card à direita.
                    </p>
                  </div>
                </div>
              )}

              {/* Customização: Nome da Equipe e Logo/Escudo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-black text-[#17221D] uppercase tracking-wider mb-2">
                    Nome da Equipe (Para Identificação)
                  </label>
                  <input
                    type="text"
                    value={nomeEquipeSel}
                    onChange={(e) => setNomeEquipeSel(e.target.value)}
                    placeholder={`Ex: ${escola.sigla} ${maxEquipesPermitidas > 1 ? `- Time ${numeroEquipeSel}` : 'A'}`}
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-black text-[#17221D] uppercase tracking-wider mb-2">
                    Escudo / Logo da Equipe
                  </label>
                  <div className="flex flex-wrap gap-2 items-center">
                    {LOGOS_PREDEFINIDOS.map((badge) => {
                      const BadgeIcon = badge.Icon;
                      return (
                        <button
                          type="button"
                          key={badge.id}
                          onClick={() => setLogoEquipeSel(badge.id)}
                          title={badge.label}
                          aria-label={badge.label}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                            logoEquipeSel === badge.id
                              ? 'bg-[#E8F7F1] border-[#00A878] ring-2 ring-[#00A878]/30 scale-105 shadow-xs'
                              : 'bg-[#F7F9F8] border-[#E2EAE5] hover:bg-white'
                          }`}
                        >
                          <BadgeIcon className={`w-5 h-5 ${badge.color}`} aria-hidden="true" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Informação do Prazo e Limites da Modalidade */}
              {modalidadeAtual && (
                <div className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm">
                  <div>
                    <span className="text-[#4B5563]">Elenco Exigido:</span>{' '}
                    <strong className="text-[#17221D]">
                      Mínimo {modalidadeAtual.minAtletas} e Máximo {modalidadeAtual.maxAtletas} alunos
                    </strong>
                  </div>
                  <div className="flex items-center gap-1.5 text-amber-800 font-bold bg-amber-50 px-3 py-1 rounded-xl border border-amber-200 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Prazo: {new Date(modalidadeAtual.prazoInscricao).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              )}

              {/* Seleção de Categoria e Sexo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-black text-[#17221D] uppercase tracking-wider mb-2">
                    2. Categoria Etária (Ref: 31/12/2026)
                  </label>
                  <select
                    value={categoriaSel}
                    onChange={(e) => {
                      setCategoriaSel(e.target.value as CategoriaIdade);
                      setAtletasSelecionadosIds([]);
                      setProvasPorAtleta({});
                    }}
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
                  >
                    <option value="MIRIM">Mirim (9 a 11 anos: 2015-2017)</option>
                    <option value="INFANTIL">Infantil (12 a 14 anos: 2012-2014)</option>
                    <option value="INFANTO">Infanto (15 a 17 anos: 2009-2011)</option>
                    <option value="JUNIOR">Junior (18 a 20 anos: 2006-2008)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-black text-[#17221D] uppercase tracking-wider mb-2">
                    3. Gênero / Naipe
                  </label>
                  <select
                    value={sexoSel}
                    onChange={(e) => {
                      setSexoSel(e.target.value as Genero);
                      setAtletasSelecionadosIds([]);
                      setProvasPorAtleta({});
                    }}
                    className="w-full px-4 py-3.5 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
                  >
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMININO">Feminino</option>
                  </select>
                </div>
              </div>

              {/* Alerta de Validação da Matriz */}
              {!validacaoMatriz.valido && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
                  <div>
                    <strong className="font-black">Combinação Bloqueada pelo Regulamento:</strong>
                    <p className="mt-0.5 leading-relaxed font-medium">{validacaoMatriz.erro}</p>
                  </div>
                </div>
              )}

              {/* Lista de Atletas Elegíveis */}
              {validacaoMatriz.valido && (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <label className="block text-xs sm:text-sm font-black text-[#17221D] uppercase tracking-wider">
                        4. Seleção de Alunos-Atletas
                      </label>
                      {modalidadeAtual && (
                        <span className={`text-xs font-black px-3 py-0.5 rounded-full border ${
                          atletasSelecionadosIds.length >= modalidadeAtual.minAtletas &&
                          atletasSelecionadosIds.length <= modalidadeAtual.maxAtletas
                            ? 'bg-[#E8F7F1] text-[#087A5B] border-[#00A878]/30'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {atletasSelecionadosIds.length}/{modalidadeAtual.maxAtletas} (Mín: {modalidadeAtual.minAtletas})
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleAbrirModalRapido}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-all hover:scale-[1.02] cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Cadastrar Aluno Rápido</span>
                    </button>
                  </div>

                  {atletasElegiveis.length === 0 ? (
                    <div className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-3xl p-6 text-center space-y-3">
                      <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                      <div>
                        <p className="text-sm font-bold text-[#17221D]">
                          Nenhum aluno cadastrado na escola para a categoria {categoriaSel} ({sexoSel}).
                        </p>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          Cadastre os alunos agora mesmo sem burocracia para convocar para a equipe!
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleAbrirModalRapido}
                        className="px-5 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Cadastrar Aluno Rápido Agora</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                      {atletasElegiveis.map((atleta) => {
                        const selecionado = atletasSelecionadosIds.includes(atleta.id);
                        const provasDoAtleta = provasPorAtleta[atleta.id] || [];

                        return (
                          <div
                            key={atleta.id}
                            className={`p-4 rounded-2xl border transition-all ${
                              selecionado
                                ? 'bg-[#E8F7F1] border-[#00A878] shadow-sm'
                                : 'bg-[#F7F9F8] border-[#E2EAE5] text-[#17221D] hover:bg-white hover:border-[#00A878]/40'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div
                                onClick={() => toggleAtleta(atleta.id)}
                                className="flex items-center gap-3.5 cursor-pointer flex-1 min-w-0"
                              >
                                <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                                  selecionado ? 'bg-[#00A878] border-[#00A878] text-white' : 'border-[#CBD5E1] bg-white'
                                }`}>
                                  {selecionado && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-bold text-[#17221D] truncate">{atleta.nomeCompleto}</p>
                                  <p className="text-xs text-[#4B5563] mt-0.5 truncate">
                                    Doc: {atleta.documentoTipo} {atleta.documentoNumero} • Nasc: {new Date(atleta.dataNascimento).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-xs font-bold text-[#087A5B] bg-white px-2 py-0.5 rounded-lg border border-[#E2EAE5]">
                                  {atleta.matricula}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleExcluirAtleta(atleta.id, atleta.nomeCompleto);
                                  }}
                                  className="p-1.5 rounded-lg hover:bg-rose-100 text-[#64748B] hover:text-rose-600 transition-colors"
                                  title="Excluir este aluno do cadastro da escola"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Seletor de Provas para Atletismo */}
                            {selecionado && modalidadeSelCodigo === 'atletismo' && (
                              <div className="mt-3.5 pt-3 border-t border-[#00A878]/20 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-[#087A5B]">
                                    Selecione até 2 provas de Atletismo:
                                  </span>
                                  <span className="text-xs font-bold text-[#4B5563]">
                                    {provasDoAtleta.length}/2 selecionadas
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
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
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                          provaAtiva
                                            ? 'bg-[#00A878] text-white shadow-sm'
                                            : 'bg-white text-[#4B5563] border border-[#E2EAE5] hover:border-[#00A878]'
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
                className="w-full py-4 px-6 rounded-2xl bg-[#00A878] hover:bg-[#087A5B] text-white font-black text-sm sm:text-base shadow-md shadow-[#00A878]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                <span>Confirmar e Enviar Inscrição da Equipe</span>
              </button>

            </form>
          </div>
        </div>

        {/* Resumo das Inscrições Efetuadas */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-lg font-black text-[#17221D]">Equipes Submetidas ({inscricoes.length})</h3>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setFiltroEtapaLista('TODAS')}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-colors whitespace-nowrap ${
                    filtroEtapaLista === 'TODAS'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todas ({inscricoes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroEtapaLista(1)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-colors whitespace-nowrap ${
                    filtroEtapaLista === 1
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  1ª Etapa
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroEtapaLista(2)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-colors whitespace-nowrap ${
                    filtroEtapaLista === 2
                      ? 'bg-cyan-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  2ª Etapa
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroEtapaLista(3)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition-colors whitespace-nowrap ${
                    filtroEtapaLista === 3
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  3ª Etapa
                </button>
              </div>
            </div>

            {/* Card Informativo sobre Equipes com Elenco Excedente */}
            {equipesComExcesso.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-amber-950">
                      Atenção: Equipe(s) com elenco excedendo o limite oficial
                    </h4>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                      Identificamos que <strong>{equipesComExcesso.length} equipe(s)</strong> possuem mais atletas do que o teto da modalidade permite (ex: equipe com 14 alunos quando o limite é 10).
                    </p>
                    <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                      👉 <strong>Para regularizar:</strong> Clique no botão <span className="bg-slate-800 text-white px-1.5 py-0.5 rounded font-bold text-[10px]">Ajustar Elenco</span> no card da equipe, desmarque os atletas excedentes e salve para liberar a validação oficial.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {inscricoesFiltradas.length === 0 ? (
              <p className="text-sm text-[#4B5563] text-center py-8">
                {filtroEtapaLista === 'TODAS'
                  ? 'Nenhuma equipe submetida ainda.'
                  : `Nenhuma equipe submetida para a ${filtroEtapaLista}ª Etapa.`}
              </p>
            ) : (
              <div className="space-y-3.5">
                {inscricoesFiltradas.map((insc) => {
                  const numEq = insc.numeroEquipe || 1;
                  const modConfig = modalidades.find(m => m.codigo === insc.modalidadeCodigo);
                  const limiteMax = modConfig?.maxAtletas || 10;
                  const limiteMin = modConfig?.minAtletas || 1;
                  const excedeLimite = insc.atletaIds.length > limiteMax;
                  const abaixoMinimo = insc.atletaIds.length < limiteMin;
                  const nomeLimpo = (insc.nomeEquipe || insc.modalidadeNome || '').trim().toLowerCase();
                  const nomeDuplicado = (contagemNomesEquipes[nomeLimpo] || 0) > 1;

                  // Se o nome da equipe for apenas o nome da modalidade, gera um identificador claro
                  const nomeExibicao = (insc.nomeEquipe && insc.nomeEquipe.trim().toLowerCase() !== insc.modalidadeNome.toLowerCase())
                    ? insc.nomeEquipe
                    : `${insc.modalidadeNome} • ${insc.categoria} (${insc.sexo === 'FEMININO' ? 'Fem' : 'Masc'}) ${numEq > 1 ? `- Time ${numEq}` : ''}`;

                  return (
                    <div
                      key={insc.id}
                      className={`border rounded-2xl p-4 sm:p-5 space-y-3 transition-all ${
                        excedeLimite
                          ? 'bg-rose-50/40 border-rose-300'
                          : 'bg-[#F7F9F8] border-[#E2EAE5]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-9 h-9 rounded-xl bg-white border border-[#E2EAE5] flex items-center justify-center shrink-0 shadow-2xs">
                            {renderEmblemaEquipe(insc.logoUrl)}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-sm sm:text-base font-black text-[#17221D] truncate">
                                {nomeExibicao}
                              </h4>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                                numEq === 1 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-blue-50 text-blue-800 border-blue-300'
                              }`}>
                                {numEq === 1 ? 'Equipe 1' : `Equipe ${numEq}`}
                              </span>
                            </div>
                            <p className="text-xs text-[#4B5563] mt-0.5 font-medium truncate">
                              {insc.modalidadeNome} • {insc.categoria} • {insc.sexo}
                            </p>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border shrink-0 ${
                          insc.status === 'VALIDADA'
                            ? 'bg-[#E8F7F1] text-[#087A5B] border-[#00A878]/30'
                            : insc.status === 'REJEITADA'
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {insc.status}
                        </span>
                      </div>

                      <div className="text-xs text-[#4B5563] space-y-1">
                        <div className="flex items-center justify-between">
                          <span>
                            <strong className={excedeLimite ? 'text-rose-600 font-black' : 'text-[#17221D] font-bold'}>
                              {insc.atletaIds.length}/{limiteMax}
                            </strong> Atletas convocados
                          </span>
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

                        {/* Avisos Visuais no Card da Equipe */}
                        {excedeLimite && (
                          <div className="p-2.5 rounded-xl bg-rose-100/70 border border-rose-300 text-rose-900 text-xs space-y-1 mt-1">
                            <div className="flex items-center gap-1.5 font-black text-rose-950">
                              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                              <span>Elenco Excedendo Limite ({insc.atletaIds.length}/{limiteMax} atletas)</span>
                            </div>
                            <p className="text-[11px] text-rose-800 leading-snug">
                              Esta equipe possui <strong>{insc.atletaIds.length - limiteMax} aluno(s) a mais</strong> que o regulamento oficial permite. Clique no botão <strong>Ajustar Elenco</strong> abaixo e desmarque os excedentes para poder validar a equipe.
                            </p>
                          </div>
                        )}

                        {nomeDuplicado && (
                          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-1.5 mt-1">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Nome repetido nesta escola. Recomendamos clicar em <strong>Ajustar Elenco</strong> para renomear e diferenciar as equipes.</span>
                          </div>
                        )}

                        {insc.motivoRejeicao && (
                          <p className="text-red-600 text-xs font-medium">
                            Motivo Rejeição: {insc.motivoRejeicao}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-[#E2EAE5] flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleToggleValidarEquipe(insc)}
                          className={`py-1.5 px-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition-colors shadow-2xs ${
                            insc.status === 'VALIDADA'
                              ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300'
                              : (excedeLimite || abaixoMinimo)
                              ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                          }`}
                          title={
                            insc.status === 'VALIDADA'
                              ? 'Equipe já validada pela escola. Clique para reabrir.'
                              : excedeLimite
                              ? 'Equipe irregular (excede limite). Clique para instruções.'
                              : 'Validar e homologar esta equipe'
                          }
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{insc.status === 'VALIDADA' ? 'Validada' : (excedeLimite || abaixoMinimo) ? 'Regularizar' : 'Validar'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCarregarEquipeParaEdicao(insc)}
                          className="py-1.5 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all shadow-2xs"
                          title="Carregar esta equipe no formulário à esquerda para ajustar elenco"
                        >
                          <span>Ajustar Elenco</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleGerarPdf(insc)}
                          disabled={gerandoPdfId === insc.id}
                          className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-[#E8F7F1] text-[#17221D] hover:text-[#087A5B] border border-[#E2EAE5] text-xs font-bold flex items-center justify-center gap-1 transition-colors disabled:opacity-50 shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#00A878]" />
                          <span>Ficha</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleGerarCrachasPdf(insc)}
                          disabled={gerandoPdfId === insc.id}
                          className="py-1.5 px-2.5 rounded-xl bg-white hover:bg-[#E8F7F1] text-[#17221D] hover:text-[#087A5B] border border-[#E2EAE5] text-xs font-bold flex items-center justify-center gap-1 transition-colors disabled:opacity-50 shadow-2xs"
                        >
                          <Download className="w-3.5 h-3.5 text-[#00A878]" />
                          <span>Crachás</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExcluirInscricao(insc.id, insc.nomeEquipe || `${insc.modalidadeNome} - Equipe ${numEq}`)}
                          className="p-1.5 rounded-xl bg-white hover:bg-red-50 text-[#4B5563] hover:text-red-600 border border-[#E2EAE5] hover:border-red-200 transition-colors shadow-2xs"
                          title="Remover equipe"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal de Cadastro Rápido de Aluno */}
      {modalRapidoAberto && modalidadeAtual && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2EAE5] rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl relative my-auto">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E2EAE5] mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-black mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Cadastro Ágil & Direto</span>
                </div>
                <h3 className="text-lg font-black text-[#17221D]">
                  Novo Aluno na Equipe
                </h3>
                <p className="text-xs text-[#64748B]">
                  {modalidadeAtual.nome} • {categoriaSel} ({sexoSel})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalRapidoAberto(false)}
                className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-[#17221D] uppercase mb-1">
                  Nome Completo do Aluno *
                </label>
                <input
                  type="text"
                  value={rapidoNome}
                  onChange={(e) => setRapidoNome(e.target.value)}
                  placeholder="Ex: LUCAS HENRIQUE SILVA"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] text-sm font-bold text-[#17221D] focus:border-[#00A878] focus:outline-none uppercase"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-[#17221D] uppercase mb-1">
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    value={rapidoDataNasc}
                    onChange={(e) => setRapidoDataNasc(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#17221D] focus:border-[#00A878] focus:outline-none"
                  />
                  <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block">
                    {JegdsRulesService.calcularCategoria(rapidoDataNasc).mensagem}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-black text-[#17221D] uppercase mb-1">
                    Série / Turma
                  </label>
                  <input
                    type="text"
                    value={rapidoSerie}
                    onChange={(e) => setRapidoSerie(e.target.value)}
                    placeholder="Ex: 7º Ano B"
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#17221D] focus:border-[#00A878] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-black text-[#17221D] uppercase mb-1">
                    Documento
                  </label>
                  <select
                    value={rapidoDocTipo}
                    onChange={(e) => setRapidoDocTipo(e.target.value as 'RG' | 'CERTIDAO')}
                    className="w-full px-2.5 py-2 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#17221D] focus:border-[#00A878] focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="RG">RG</option>
                    <option value="CERTIDAO">Certidão</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-black text-[#17221D] uppercase mb-1">
                    Número do Documento *
                  </label>
                  <input
                    type="text"
                    value={rapidoDocNum}
                    onChange={(e) => setRapidoDocNum(e.target.value)}
                    placeholder="Ex: 05489721202"
                    className="w-full px-3 py-2 rounded-xl border border-[#CBD5E1] text-xs font-bold text-[#17221D] focus:border-[#00A878] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2EAE5] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSalvarAlunoRapido(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition-all cursor-pointer"
                >
                  Salvar e + Adicionar Outro
                </button>
                <button
                  type="button"
                  onClick={() => handleSalvarAlunoRapido(false)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cadastrar e Conectar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
