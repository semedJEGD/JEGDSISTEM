'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import {
  Shield,
  ShieldCheck,
  Building2,
  CheckCheck,
  ClipboardList,
  IdCard,
  Megaphone,
  RefreshCw,
  School,
  Users,
  Trophy,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Printer,
  Download,
  PlusCircle,
  Trash2,
  FileText,
  Search,
  Bell,
  Clock,
  Calendar,
  AlertCircle,
  CheckSquare,
  Square,
  Eye,
  MessageSquare,
  QrCode,
  LogOut,
  UserPlus
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { JegdPdfGenerator } from '@/lib/pdf-generator';
import {
  Municipio,
  Escola,
  Atleta,
  InscricaoEquipe,
  ComunicadoAviso,
  StatusInscricao,
  ModalidadeConfig,
  Genero,
  TipoDocumento,
  ModalidadeCodigo,
  CategoriaIdade
} from '@/types/jegd';
import { JegdsRulesService, PROVAS_ATLETISMO_POR_CATEGORIA } from '@/services/jegds-rules';
import { ModalAnaliseInscricao } from './components/ModalAnaliseInscricao';
import { ModalNovoAviso } from './components/ModalNovoAviso';
import { ModalObsAtleta } from './components/ModalObsAtleta';
import { AbaEscolasLote } from './components/AbaEscolasLote';
import { AbaHomologacao } from './components/AbaHomologacao';
import { AbaAlertas } from './components/AbaAlertas';
import { AbaSumulas } from './components/AbaSumulas';
import { AbaComunicados } from './components/AbaComunicados';
import { AbaCrachaLogistica } from './components/AbaCrachaLogistica';
import { ModalCadastroAtleta } from '@/app/escola/atletas/components/ModalCadastroAtleta';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [municipioAtual, setMunicipioAtual] = useState<Municipio | null>(null);
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [inscricoes, setInscricoes] = useState<InscricaoEquipe[]>([]);
  const [modalidades, setModalidades] = useState<ModalidadeConfig[]>([]);
  const [comunicados, setComunicados] = useState<ComunicadoAviso[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [abaAtiva, setAbaAtiva] = useState<'ESCOLAS_LOTE' | 'HOMOLOGACAO' | 'ALERTAS' | 'LISTAS_CHAMADA' | 'CRACHA_LOGISTICA' | 'AVISOS'>('ESCOLAS_LOTE');
  const [escolaSelecionadaId, setEscolaSelecionadaId] = useState<string>('');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [busca, setBusca] = useState('');
  const [gerandoPdf, setGerandoPdf] = useState(false);

  // Modal Nova Escola no Município
  const [modalNovaEscolaAberto, setModalNovaEscolaAberto] = useState(false);
  const [novaEscolaNome, setNovaEscolaNome] = useState('');
  const [novaEscolaSigla, setNovaEscolaSigla] = useState('');
  const [novaEscolaInep, setNovaEscolaInep] = useState('');
  const [novaEscolaRede, setNovaEscolaRede] = useState<'MUNICIPAL' | 'ESTADUAL' | 'PARTICULAR' | 'FEDERAL'>('MUNICIPAL');
  const [novaEscolaEmail, setNovaEscolaEmail] = useState('');

  // Filtros Avançados do Lote da Escola
  const [filtroModalidadeLote, setFiltroModalidadeLote] = useState<string>('TODAS');
  const [filtroCategoriaLote, setFiltroCategoriaLote] = useState<string>('TODAS');
  const [filtroSexoLote, setFiltroSexoLote] = useState<string>('TODOS');
  const [modoVisualizacaoLote, setModoVisualizacaoLote] = useState<'CARDS' | 'TABELA'>('CARDS');

  // Modal de Julgamento / Parecer de Inscrição
  const [modalParecerAberto, setModalParecerAberto] = useState(false);
  const [inscricaoEmAnalise, setInscricaoEmAnalise] = useState<InscricaoEquipe | null>(null);
  const [novoStatus, setNovoStatus] = useState<StatusInscricao>('VALIDADA');
  const [motivoRejeicao, setMotivoRejeicao] = useState('');
  const [parecerTexto, setParecerTexto] = useState('');

  // Modal de Observação de Conferência de Atleta
  const [modalObsAtletaAberto, setModalObsAtletaAberto] = useState(false);
  const [atletaObs, setAtletaObs] = useState<Atleta | null>(null);
  const [obsTexto, setObsTexto] = useState('');

  // Modal Novo Comunicado
  const [modalAvisoAberto, setModalAvisoAberto] = useState(false);
  const [novoAvisoTitulo, setNovoAvisoTitulo] = useState('');
  const [novoAvisoConteudo, setNovoAvisoConteudo] = useState('');
  const [novoAvisoCategoria, setNovoAvisoCategoria] = useState<'CRONOGRAMA' | 'REGULAMENTO' | 'ALERTA' | 'RESULTADOS'>('CRONOGRAMA');
  const [novoAvisoUrgente, setNovoAvisoUrgente] = useState(false);

  const [sincronizandoOnline, setSincronizandoOnline] = useState(false);
  const [ultimaSincronizacao, setUltimaSincronizacao] = useState<string>('Agora');

  // Modal de Inscrição / Cadastro de Aluno pela Coordenação
  const [modalCadastroAtletaAberto, setModalCadastroAtletaAberto] = useState(false);
  const [atletaEditando, setAtletaEditando] = useState<Atleta | null>(null);
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [dataNascimento, setDataNascimento] = useState('2013-05-10');
  const [sexo, setSexo] = useState<Genero>('MASCULINO');
  const [documentoTipo, setDocumentoTipo] = useState<TipoDocumento>('RG');
  const [documentoNumero, setDocumentoNumero] = useState('');
  const [matricula, setMatricula] = useState('');
  const [serieTurma, setSerieTurma] = useState('7º Ano (Fundamental)');
  const [fotoBase64, setFotoBase64] = useState<string | undefined>(undefined);
  const [modalidadesEscolhidas, setModalidadesEscolhidas] = useState<ModalidadeCodigo[]>([]);
  const [provasAtletismo, setProvasAtletismo] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    JegdStorage.init();
    if (!JegdStorage.isAdminAuth()) {
      router.push('/admin/login');
      return;
    }
    const munList = JegdStorage.getMunicipios();
    setMunicipios(munList);

    const user = JegdStorage.getCurrentUser();
    setCurrentUser(user);
    let curMun = JegdStorage.getCurrentMunicipio();

    // Se for coordenador local, força o município atribuído ao seu usuário
    if (user && user.papel === 'COORDENADOR' && user.municipioId) {
      const userMun = munList.find(m => m.id === user.municipioId);
      if (userMun) {
        curMun = userMun;
        JegdStorage.setCurrentMunicipio(userMun);
      }
    }

    setMunicipioAtual(curMun);
    carregarTodosDados(curMun?.id);

    // Event listener para atualizações instantâneas de sincronização
    const handleDataSynced = () => {
      const targetMun = JegdStorage.getCurrentMunicipio();
      carregarTodosDados(targetMun?.id);
      setUltimaSincronizacao(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };

    window.addEventListener('jegd-data-synced', handleDataSynced);

    // Polling ativo a cada 3.5 segundos com o banco de dados online
    const interval = setInterval(() => {
      JegdStorage.sincronizarComNuvem().catch(() => {});
    }, 3500);

    return () => {
      window.removeEventListener('jegd-data-synced', handleDataSynced);
      clearInterval(interval);
    };
  }, []);

  const handleForcarSincronizacao = async () => {
    setSincronizandoOnline(true);
    await JegdStorage.sincronizarComNuvem();
    const curMun = JegdStorage.getCurrentMunicipio();
    carregarTodosDados(curMun?.id);
    setUltimaSincronizacao(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    setTimeout(() => setSincronizandoOnline(false), 600);
  };

  const carregarTodosDados = (targetMunId?: string) => {
    const curMun = targetMunId ? JegdStorage.getMunicipioById(targetMunId) : JegdStorage.getCurrentMunicipio();
    const munId = curMun?.id;
    if (curMun) setMunicipioAtual(curMun);

    const escList = JegdStorage.getEscolas(munId);
    setEscolas(escList);
    setAtletas(JegdStorage.getAtletas(undefined, munId));
    setInscricoes(JegdStorage.getInscricoes(undefined, munId));
    setModalidades(JegdStorage.getModalidades(munId));
    setComunicados(JegdStorage.getComunicados(munId));
    if (escList.length > 0) {
      setEscolaSelecionadaId(prev => {
        if (prev && escList.some(e => e.id === prev)) {
          return prev;
        }
        return escList[0].id;
      });
    } else {
      setEscolaSelecionadaId('');
    }
  };

  const handleMudarMunicipio = (munId: string) => {
    if (JegdStorage.isDomainLocked()) return;
    const currentUser = JegdStorage.getCurrentUser();
    if (currentUser?.papel === 'COORDENADOR' && !JegdStorage.isSuperAdminAuth()) return;

    const munObj = municipios.find(m => m.id === munId);
    if (munObj) {
      JegdStorage.setCurrentMunicipio(munObj);
      setMunicipioAtual(munObj);
      carregarTodosDados(munId);
    }
  };

  const handleCriarEscola = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaEscolaNome.trim()) return;

    const curMun = municipioAtual || JegdStorage.getCurrentMunicipio();
    const cleanSigla = (novaEscolaSigla || novaEscolaNome).toLowerCase().replace(/[^a-z0-9]/g, '');
    const id = `esc-${cleanSigla}-${Date.now()}`;
    const email = novaEscolaEmail.trim() || `${cleanSigla}@semed.${curMun.slug || 'municipal'}.gov.br`;

    const novaEsc: Escola = {
      id,
      municipioId: curMun.id,
      nome: novaEscolaNome.trim(),
      sigla: (novaEscolaSigla || novaEscolaNome).toUpperCase().trim(),
      inep: novaEscolaInep.trim() || '21000000',
      rede: novaEscolaRede,
      bairro: 'Centro',
      endereco: `${curMun.nome} - ${curMun.uf}`,
      responsavelNome: 'Direção / Coordenação',
      responsavelTelefone: '(99) 98800-0000',
      loginEmail: email,
      senhaHash: '123456',
      createdAt: new Date().toISOString()
    };

    JegdStorage.saveEscola(novaEsc);
    carregarTodosDados(curMun.id);
    setModalNovaEscolaAberto(false);
    setNovaEscolaNome('');
    setNovaEscolaSigla('');
    setNovaEscolaInep('');
    setNovaEscolaEmail('');
  };

  const toggleConferenciaAtleta = (atleta: Atleta) => {
    const novoStatus = !atleta.conferidoPeloCoordenador;
    JegdStorage.updateAtletaConferencia(atleta.id, novoStatus);
    carregarTodosDados();
  };

  const aprovarInscricoesEAtletas = (inscricoesAlvo: InscricaoEquipe[], atletaIds: string[]) => {
    atletaIds.forEach((atletaId) => {
      JegdStorage.updateAtletaConferencia(atletaId, true);
    });

    const dataHomologacao = new Date().toLocaleString('pt-BR');
    inscricoesAlvo.forEach((insc) => {
      JegdStorage.saveInscricao({
        ...insc,
        status: 'VALIDADA',
        motivoRejeicao: undefined,
        parecerComite: insc.parecerComite || 'Equipe aprovada e homologada pelo Comitê Organizador do JEGDS 2026.',
        dataHomologacao
      });
    });

    carregarTodosDados();
  };

  const handleAprovarEquipeModalidade = (escola: Escola, modalidade: ModalidadeConfig, atletasDaEquipe: Atleta[]) => {
    const atletaIds = atletasDaEquipe.map((a) => a.id);
    const atletaIdSet = new Set(atletaIds);
    const inscricoesRelacionadas = inscricoes.filter(
      (i) =>
        i.escolaId === escola.id &&
        (i.modalidadeCodigo?.toLowerCase() === modalidade.codigo.toLowerCase() ||
          i.modalidadeNome?.toLowerCase().includes(modalidade.nome.toLowerCase())) &&
        i.atletaIds.some((id) => atletaIdSet.has(id))
    );

    aprovarInscricoesEAtletas(inscricoesRelacionadas, atletaIds);
  };

  const handleAprovarEquipeDireto = (insc: InscricaoEquipe) => {
    aprovarInscricoesEAtletas([insc], insc.atletaIds);
  };

  const abrirModalObsAtleta = (atleta: Atleta) => {
    setAtletaObs(atleta);
    setObsTexto(atleta.observacaoCoordenador || '');
    setModalObsAtletaAberto(true);
  };

  const salvarObsAtleta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!atletaObs) return;
    JegdStorage.updateAtletaConferencia(atletaObs.id, atletaObs.conferidoPeloCoordenador || false, obsTexto);
    carregarTodosDados();
    setModalObsAtletaAberto(false);
  };

  const handleImprimirLoteEscola = async (
    esc: Escola,
    filtroMod?: string,
    filtroCat?: string,
    filtroSex?: string
  ) => {
    setGerandoPdf(true);
    try {
      const atletasEscola = atletas.filter(a => a.escolaId === esc.id);
      const inscricoesEscola = inscricoes.filter(i => i.escolaId === esc.id);
      await JegdPdfGenerator.gerarLoteCompletoEscola(
        esc,
        atletasEscola,
        inscricoesEscola,
        filtroMod,
        filtroCat,
        filtroSex
      );
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar relatório do lote da escola.');
    } finally {
      setGerandoPdf(false);
    }
  };

  const handleGerarCrachasEscola = async (esc: Escola) => {
    try {
      setGerandoPdf(true);
      const atletasEscola = atletas.filter(a => a.escolaId === esc.id);
      if (atletasEscola.length === 0) {
        alert('Esta escola não possui nenhum atleta cadastrado para gerar crachás.');
        return;
      }
      await JegdPdfGenerator.gerarCrachasEmLote(esc, atletasEscola);
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar crachás da escola em PDF.');
    } finally {
      setGerandoPdf(false);
    }
  };

  const handleGerarTodosCrachas = async () => {
    try {
      setGerandoPdf(true);
      if (atletas.length === 0) {
        alert('Nenhum atleta cadastrado no sistema.');
        return;
      }
      await JegdPdfGenerator.gerarTodosCrachasGeral(escolas, atletas);
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar todos os crachás.');
    } finally {
      setGerandoPdf(false);
    }
  };

  const handleGerarCrachaIndividual = async (atleta: Atleta, esc?: Escola) => {
    try {
      const escolaObj = esc || escolas.find(e => e.id === atleta.escolaId) || {
        id: atleta.escolaId,
        nome: 'Escola Municipal',
        sigla: 'SEMED',
        inep: '',
        rede: 'MUNICIPAL',
        bairro: '',
        endereco: '',
        responsavelNome: '',
        responsavelTelefone: '',
        loginEmail: '',
        createdAt: ''
      };
      await JegdPdfGenerator.gerarCrachaIndividual(atleta, escolaObj);
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar crachá individual em PDF.');
    }
  };

  const abrirModalAnalise = (insc: InscricaoEquipe) => {
    setInscricaoEmAnalise(insc);
    setNovoStatus(insc.status === 'PENDENTE' ? 'VALIDADA' : insc.status);
    setMotivoRejeicao(insc.motivoRejeicao || '');
    setParecerTexto(insc.parecerComite || 'Inscrição analisada e homologada pelo Comitê Organizador do JEGDS 2026.');
    setModalParecerAberto(true);
  };

  const salvarAnalise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inscricaoEmAnalise) return;

    const atualizada: InscricaoEquipe = {
      ...inscricaoEmAnalise,
      status: novoStatus,
      motivoRejeicao: novoStatus === 'REJEITADA' ? motivoRejeicao : undefined,
      parecerComite: parecerTexto,
      dataHomologacao: new Date().toLocaleString('pt-BR')
    };

    JegdStorage.saveInscricao(atualizada);
    carregarTodosDados();
    setModalParecerAberto(false);
  };

  const handleSalvarAviso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoAvisoTitulo || !novoAvisoConteudo) {
      alert('Preencha o título e conteúdo do comunicado.');
      return;
    }

    const aviso: ComunicadoAviso = {
      id: `aviso-${Date.now()}`,
      titulo: novoAvisoTitulo,
      conteudo: novoAvisoConteudo,
      categoria: novoAvisoCategoria,
      dataPublicacao: new Date().toLocaleDateString('pt-BR'),
      urgente: novoAvisoUrgente,
      autor: 'Comitê Organizador JEGDS 2026'
    };

    JegdStorage.saveComunicado(aviso);
    carregarTodosDados();
    setModalAvisoAberto(false);
    setNovoAvisoTitulo('');
    setNovoAvisoConteudo('');
  };

  const extrairCategoriasData = (mod: ModalidadeConfig, escolaIdFiltro?: string) => {
    const sexos = ['MASCULINO', 'FEMININO'];
    const categoriasData: { categoria: string; sexo: string; atletasComEscola: { atleta: Atleta; escola: Escola; provas?: string[] }[] }[] = [];

    mod.categoriasPermitidas.forEach(cat => {
      sexos.forEach(sexo => {
        // Validação da matriz da modalidade
        const validacao = JegdsRulesService.validarMatriz(mod.codigo, cat as any, sexo as any);
        if (!validacao.valido) return;

        const inscricoesCat = inscricoes.filter(
          i => (i.modalidadeCodigo?.toLowerCase() === mod.codigo.toLowerCase() || 
                i.modalidadeNome?.toLowerCase().includes(mod.nome.toLowerCase())) && 
               i.categoria === cat && 
               i.sexo === sexo &&
               (!escolaIdFiltro || i.escolaId === escolaIdFiltro)
        );
        const atletasComEscola: { atleta: Atleta; escola: Escola; provas?: string[] }[] = [];
        
        inscricoesCat.forEach(insc => {
          const escolaObj = escolas.find(e => e.id === insc.escolaId);
          if (escolaObj) {
            insc.atletaIds.forEach(atlId => {
              const atlObj = atletas.find(a => a.id === atlId);
              if (atlObj && (!escolaIdFiltro || atlObj.escolaId === escolaIdFiltro) && !atletasComEscola.some(x => x.atleta.id === atlObj.id)) {
                atletasComEscola.push({
                  atleta: atlObj,
                  escola: escolaObj,
                  provas: insc.provasPorAtleta?.[atlId]
                });
              }
            });
          }
        });

        // Também inclui atletas que possuem esta modalidade inscrita diretamente no cadastro
        atletas.forEach(atl => {
          if (escolaIdFiltro && atl.escolaId !== escolaIdFiltro) return;
          const catAtl = atl.categoriaCalculada;
          if (catAtl === cat && atl.sexo === sexo) {
            const temMod = atl.modalidadesInscritas?.some(m => 
              m.modalidadeCodigo?.toLowerCase() === mod.codigo.toLowerCase() || 
              m.modalidadeNome?.toLowerCase().includes(mod.nome.toLowerCase())
            );
            if (temMod && !atletasComEscola.some(x => x.atleta.id === atl.id)) {
              const escolaObj = escolas.find(e => e.id === atl.escolaId);
              if (escolaObj) {
                atletasComEscola.push({
                  atleta: atl,
                  escola: escolaObj
                });
              }
            }
          }
        });

        categoriasData.push({
          categoria: cat,
          sexo,
          atletasComEscola
        });
      });
    });

    return categoriasData;
  };

  const handleGerarListaChamada = async (mod: ModalidadeConfig, categoria: string, sexo: string, escolaId?: string) => {
    const categoriasData = extrairCategoriasData(mod, escolaId);
    const catEncontrada = categoriasData.find(c => c.categoria === categoria && c.sexo === sexo);
    const atletasComEscola = catEncontrada?.atletasComEscola || [];
    const escolaObj = escolaId ? escolas.find(e => e.id === escolaId) : undefined;

    if (atletasComEscola.length === 0 && !escolaObj) {
      alert(`Nenhum atleta inscrito ou cadastrado nesta categoria (${categoria} - ${sexo}) para gerar a súmula.`);
      return;
    }

    if (escolaObj) {
      await JegdPdfGenerator.gerarSumulaEscolaIndividual(
        mod.nome,
        categoria,
        sexo,
        new Date(mod.dataEvento).toLocaleDateString('pt-BR'),
        atletasComEscola,
        escolaObj
      );
    } else {
      await JegdPdfGenerator.gerarListaChamadaOficial(
        mod.nome,
        categoria,
        sexo,
        new Date(mod.dataEvento).toLocaleDateString('pt-BR'),
        atletasComEscola
      );
    }
  };

  const handleGerarCadernoModalidade = async (mod: ModalidadeConfig, escolaId?: string) => {
    const categoriasData = extrairCategoriasData(mod, escolaId);
    const escolaObj = escolaId ? escolas.find(e => e.id === escolaId) : undefined;
    if (escolaObj) {
      await JegdPdfGenerator.gerarCadernoModalidadeCompleto(mod, categoriasData, { escolaFiltro: escolaObj });
    } else {
      await JegdPdfGenerator.gerarCadernoModalidadeCompleto(mod, categoriasData);
    }
  };

  const handleGerarCadernoGeralArbitragem = async () => {
    const modalidadesCompletas = modalidades.map(mod => ({
      modalidade: mod,
      categoriasData: extrairCategoriasData(mod)
    }));
    await JegdPdfGenerator.gerarCadernoGeralArbitragem(modalidadesCompletas);
  };

  const handleGerarCadernoEscola = async (escola: Escola) => {
    const modalidadesCompletas = modalidades.map(mod => ({
      modalidade: mod,
      categoriasData: extrairCategoriasData(mod, escola.id)
    })).filter(item => item.categoriasData.some(c => c.atletasComEscola.length > 0));

    if (modalidadesCompletas.length === 0) {
      alert(`A escola ${escola.sigla || escola.nome} não possui atletas inscritos em modalidades no momento.`);
      return;
    }

    await JegdPdfGenerator.gerarCadernoSumulasEscola(escola, modalidadesCompletas);
  };

  const handleGerarModeloManual = async (mod?: ModalidadeConfig, categoria?: string, sexo?: string) => {
    if (mod) {
      await JegdPdfGenerator.gerarModeloManualModalidade(
        mod.nome,
        categoria || 'LIVRE',
        sexo || 'MASC / FEM',
        new Date(mod.dataEvento).toLocaleDateString('pt-BR')
      );
    } else {
      await JegdPdfGenerator.gerarModeloManualUniversal();
    }
  };

  const progressoEscolas = JegdStorage.getProgressoEscolas();
  const escolaSelecionada = escolas.find(e => e.id === escolaSelecionadaId);
  const atletasDaEscolaSelecionada = atletas.filter(a => a.escolaId === escolaSelecionadaId);
  const inscricoesDaEscolaSelecionada = inscricoes.filter(i => i.escolaId === escolaSelecionadaId);

  const catCalc = JegdsRulesService.calcularCategoria(dataNascimento);

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

  const diagnosticoDuplicidade = React.useMemo(() => {
    if (atletaEditando || !escolaSelecionada) return { duplicado: false };
    if (!nomeCompleto.trim() && !documentoNumero.trim()) return { duplicado: false };
    return JegdStorage.verificarDuplicidadeAtleta({
      nomeCompleto,
      dataNascimento,
      documentoNumero,
      matricula,
      escolaIdAtual: escolaSelecionada.id
    });
  }, [atletaEditando, escolaSelecionada, nomeCompleto, dataNascimento, documentoNumero, matricula]);

  const handleAbrirModalNovoAtleta = (esc?: Escola) => {
    const targetEsc = esc || escolaSelecionada;
    if (targetEsc) setEscolaSelecionadaId(targetEsc.id);
    setAtletaEditando(null);
    setNomeCompleto('');
    setDataNascimento('2013-05-10');
    setSexo('MASCULINO');
    setDocumentoTipo('RG');
    setDocumentoNumero('');
    const proximoCodigo = JegdStorage.gerarProximoCodigoInscricao(targetEsc?.municipioId || municipioAtual?.id);
    setMatricula(proximoCodigo);
    setSerieTurma('7º Ano (Fundamental)');
    setFotoBase64(undefined);
    setModalidadesEscolhidas([]);
    setProvasAtletismo([]);
    setModalCadastroAtletaAberto(true);
  };

  const handleAbrirModalEditarAtleta = (atleta: Atleta, esc?: Escola) => {
    const targetEsc = esc || escolaSelecionada;
    if (targetEsc) setEscolaSelecionadaId(targetEsc.id);
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
    setModalCadastroAtletaAberto(true);
  };

  const handleSalvarAtletaCoord = (continuar: boolean = false) => {
    const targetEsc = escolaSelecionada;
    if (!targetEsc) {
      alert('Selecione uma escola para vincular o estudante.');
      return;
    }

    if (!nomeCompleto.trim() || !dataNascimento || !documentoNumero.trim()) {
      alert('Por favor, preencha o Nome Completo, Data de Nascimento e Documento do estudante.');
      return;
    }

    if (!catCalc.categoria) {
      alert('A data de nascimento informada está fora da faixa etária oficial do JEGDS 2026 (9 a 20 anos).');
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

    const currentUser = JegdStorage.getCurrentUser();
    const atletaId = atletaEditando ? atletaEditando.id : `atl-${Date.now()}`;
    const codigoFinal = matricula && matricula.trim() !== '' && !matricula.startsWith('MAT-')
      ? matricula
      : (atletaEditando?.matricula || JegdStorage.gerarProximoCodigoInscricao(targetEsc.municipioId));

    const modalidadesMapeadas = modalidadesEscolhidas.map(mCod => {
      const modObj = modalidades.find(m => m.codigo === mCod);
      return {
        modalidadeCodigo: mCod,
        modalidadeNome: modObj?.nome || mCod,
        provas: mCod === 'atletismo' ? provasAtletismo : undefined
      };
    });

    const autorCoord = currentUser?.nome
      ? (currentUser.nome.includes('SEMED') ? currentUser.nome : `${currentUser.nome} (SEMED)`)
      : 'Coordenação SEMED';

    const atleta: Atleta = {
      id: atletaId,
      escolaId: targetEsc.id,
      municipioId: targetEsc.municipioId || municipioAtual?.id,
      nomeCompleto: nomeCompleto.toUpperCase(),
      dataNascimento,
      sexo,
      documentoTipo,
      documentoNumero,
      matricula: codigoFinal,
      crachaToken: atletaEditando?.crachaToken || codigoFinal,
      serieTurma: serieTurma || '7º Ano (Fundamental)',
      telefoneContato: targetEsc.responsavelTelefone || '(99) 98801-0000',
      tipoSanguineo: 'O+',
      consentimentoResponsavel: true,
      cadastradoPor: atletaEditando?.cadastradoPor || autorCoord,
      categoriaCalculada: catCalc.categoria as CategoriaIdade,
      modalidadesInscritas: modalidadesMapeadas,
      conferidoPeloCoordenador: true,
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
    JegdStorage.syncAtletaComEquipes(targetEsc.id, atleta);

    // 3. Atualiza dados na tela
    carregarTodosDados(municipioAtual?.id);

    try {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.7 } });
    } catch {}

    if (continuar) {
      handleAbrirModalNovoAtleta(targetEsc);
    } else {
      setModalCadastroAtletaAberto(false);
    }
  };

  const handleExcluirAtletaCoord = async (atleta: Atleta) => {
    if (confirm(`Deseja realmente remover o aluno "${atleta.nomeCompleto}"? Ele também será removido das equipes desta escola.`)) {
      await JegdStorage.deleteAtleta(atleta.id);
      carregarTodosDados(municipioAtual?.id);
    }
  };

  const handleAcessarInscricoesEscola = (esc: Escola) => {
    JegdStorage.setCurrentEscola(esc);
    router.push('/escola/inscricoes');
  };

  // Alertas de inconsistência
  const alertasInconsistencia: { tipo: string; mensagem: string; escolaNome: string; atletaNome?: string }[] = [];
  atletas.forEach(a => {
    const esc = escolas.find(e => e.id === a.escolaId);
    if (!a.documentoNumero || a.documentoNumero.trim().length < 3) {
      alertasInconsistencia.push({
        tipo: 'DOCUMENTO_PENDENTE',
        mensagem: 'Número de RG ou Certidão não informado ou incompleto.',
        escolaNome: esc?.nome || 'Escola',
        atletaNome: a.nomeCompleto
      });
    }
    if (!a.consentimentoResponsavel) {
      alertasInconsistencia.push({
        tipo: 'LGPD_PENDENTE',
        mensagem: 'Falta confirmação de autorização expressa dos pais/responsáveis.',
        escolaNome: esc?.nome || 'Escola',
        atletaNome: a.nomeCompleto
      });
    }
  });

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 w-full">
      
      {/* ================= TOP BAR COMPACTO E MODERNO ================= */}
      <div className="bg-white border border-[#E2EAE5] rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          
          {/* Identificação do Coordenador e Município */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-center text-emerald-800 shadow-2xs shrink-0">
              <ShieldCheck className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-black text-[#17221D] truncate">
                  Coordenação SEMED
                </h1>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 shrink-0">
                  {municipioAtual ? municipioAtual.siglaEvento : 'JEGDS 2026'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
                  {municipioAtual?.nome || 'Gonçalves Dias'} - {municipioAtual?.uf || 'MA'}
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5 truncate">
                Operador: <strong className="text-[#17221D]">{currentUser?.nome || 'Elias Veloso / Herbert de Sá'}</strong> (Comitê Oficial)
              </p>
            </div>
          </div>

          {/* Status Online e Ações Rápidas do Topo */}
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
            
            {/* Alternar Município (SuperAdmin) */}
            {JegdStorage.isSuperAdminAuth() && !JegdStorage.isDomainLocked() && (
              <select
                value={municipioAtual?.id || ''}
                onChange={(e) => handleMudarMunicipio(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-[#F7F9F8] border border-emerald-300 text-emerald-900 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {municipios.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nome} ({m.siglaEvento})
                  </option>
                ))}
              </select>
            )}

            {/* Sincronização Online */}
            <button
              type="button"
              onClick={handleForcarSincronizacao}
              disabled={sincronizandoOnline}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-60"
              title="Sincronizar instantaneamente com o banco central Neon"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${sincronizandoOnline ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{sincronizandoOnline ? 'Sincronizando...' : `Online • ${ultimaSincronizacao}`}</span>
              <span className="sm:hidden">{sincronizandoOnline ? '...' : ultimaSincronizacao}</span>
            </button>

            {/* Todos os Crachás Oficiais */}
            <button
              type="button"
              onClick={handleGerarTodosCrachas}
              disabled={gerandoPdf || atletas.length === 0}
              className="px-3 py-1.5 rounded-xl bg-[#F7F9F8] hover:bg-[#E8F7F1] border border-[#00A878]/30 text-[#087A5B] text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Baixar todos os crachás de todos os atletas do município em PDF"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Todos os Crachás ({atletas.length})</span>
            </button>

            {/* Cadastrar Nova Escola */}
            <button
              type="button"
              onClick={() => setModalNovaEscolaAberto(true)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 border border-[#E2EAE5] text-[#17221D] text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#00A878]" />
              <span className="hidden sm:inline">Nova Escola</span>
            </button>

            {/* Publicar Comunicado */}
            <button
              type="button"
              onClick={() => setModalAvisoAberto(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Avisos ({comunicados.length})</span>
            </button>

            {/* Sair */}
            <button
              type="button"
              onClick={() => {
                JegdStorage.logoutAdmin();
                window.location.href = '/admin/login';
              }}
              className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all"
              title="Desconectar do painel"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= FAIXA COMPACTA DE MÉTRICAS (1 LINHA) ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div className="bg-white border border-[#E2EAE5] rounded-xl p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-[#64748B]">Escolas</span>
            <p className="text-xl font-black text-[#17221D] mt-0.5">{escolas.length}</p>
          </div>
          <School className="w-6 h-6 text-[#94A3B8] opacity-50" />
        </div>

        <div className="bg-white border border-[#E2EAE5] rounded-xl p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-[#64748B]">Alunos</span>
            <p className="text-xl font-black text-[#17221D] mt-0.5">{atletas.length}</p>
          </div>
          <Users className="w-6 h-6 text-[#94A3B8] opacity-50" />
        </div>

        <div className="bg-white border border-[#E2EAE5] rounded-xl p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-[#64748B]">Inscrições</span>
            <p className="text-xl font-black text-[#17221D] mt-0.5">{inscricoes.length}</p>
          </div>
          <Trophy className="w-6 h-6 text-[#94A3B8] opacity-50" />
        </div>

        <div className="bg-white border border-[#E2EAE5] rounded-xl p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-700">Homologados</span>
            <p className="text-xl font-black text-emerald-700 mt-0.5">
              {atletas.filter(a => a.conferidoPeloCoordenador).length}
            </p>
          </div>
          <CheckCheck className="w-6 h-6 text-emerald-500 opacity-60" />
        </div>

        <div
          onClick={() => setAbaAtiva('HOMOLOGACAO')}
          className="bg-white border border-[#E2EAE5] hover:border-rose-300 cursor-pointer rounded-xl p-3 shadow-2xs flex items-center justify-between col-span-2 sm:col-span-1 transition-all"
          title="Ver alertas e documentos pendentes na aba de homologação"
        >
          <div>
            <span className="text-[10px] font-black uppercase text-rose-600">Pendências</span>
            <p className="text-xl font-black text-rose-600 mt-0.5">{alertasInconsistencia.length}</p>
          </div>
          <AlertTriangle className="w-6 h-6 text-rose-500 opacity-60" />
        </div>
      </div>

      {/* ================= NAVEGAÇÃO REORGANIZADA POR 4 ABAS FOCADAS ================= */}
      <div className="flex items-center gap-1.5 border-b border-[#E2EAE5] pb-2 overflow-x-auto no-scrollbar w-full">
        <button
          onClick={() => setAbaAtiva('ESCOLAS_LOTE')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
            abaAtiva === 'ESCOLAS_LOTE'
              ? 'bg-[#00A878] text-white shadow-2xs font-black'
              : 'text-[#4B5563] hover:text-[#17221D] hover:bg-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Escolas & Alunos ({escolas.length})</span>
        </button>

        <button
          onClick={() => setAbaAtiva('HOMOLOGACAO')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
            abaAtiva === 'HOMOLOGACAO'
              ? 'bg-[#00A878] text-white shadow-2xs font-black'
              : 'text-[#4B5563] hover:text-[#17221D] hover:bg-white'
          }`}
        >
          <CheckCheck className="w-4 h-4" />
          <span>Homologação & Pendências</span>
          {alertasInconsistencia.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              abaAtiva === 'HOMOLOGACAO' ? 'bg-white text-rose-700' : 'bg-rose-500 text-white'
            }`}>
              {alertasInconsistencia.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setAbaAtiva('LISTAS_CHAMADA')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
            abaAtiva === 'LISTAS_CHAMADA'
              ? 'bg-[#00A878] text-white shadow-2xs font-black'
              : 'text-[#4B5563] hover:text-[#17221D] hover:bg-white'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Súmulas & Competição</span>
        </button>

        <button
          onClick={() => setAbaAtiva('CRACHA_LOGISTICA')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
            abaAtiva === 'CRACHA_LOGISTICA'
              ? 'bg-[#00A878] text-white shadow-2xs font-black'
              : 'text-[#4B5563] hover:text-[#17221D] hover:bg-white'
          }`}
        >
          <IdCard className="w-4 h-4" />
          <span>Logística & Crachás QR</span>
        </button>

        <button
          onClick={() => setAbaAtiva('AVISOS')}
          className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-2 ${
            abaAtiva === 'AVISOS'
              ? 'bg-[#00A878] text-white shadow-2xs font-black'
              : 'text-[#4B5563] hover:text-[#17221D] hover:bg-white'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Comunicados ({comunicados.length})</span>
        </button>
      </div>

      {/* ABA 1: HUB ESCOLAS & ALUNOS */}
      {abaAtiva === 'ESCOLAS_LOTE' && (
        <AbaEscolasLote
          progressoEscolas={progressoEscolas}
          escolaSelecionadaId={escolaSelecionadaId}
          setEscolaSelecionadaId={setEscolaSelecionadaId}
          escolaSelecionada={escolaSelecionada}
          atletasDaEscolaSelecionada={atletasDaEscolaSelecionada}
          modalidades={modalidades}
          filtroModalidadeLote={filtroModalidadeLote}
          setFiltroModalidadeLote={setFiltroModalidadeLote}
          filtroCategoriaLote={filtroCategoriaLote}
          setFiltroCategoriaLote={setFiltroCategoriaLote}
          filtroSexoLote={filtroSexoLote}
          setFiltroSexoLote={setFiltroSexoLote}
          modoVisualizacaoLote={modoVisualizacaoLote}
          setModoVisualizacaoLote={setModoVisualizacaoLote}
          gerandoPdf={gerandoPdf}
          handleGerarCrachasEscola={handleGerarCrachasEscola}
          handleImprimirLoteEscola={handleImprimirLoteEscola}
          handleGerarCrachaIndividual={handleGerarCrachaIndividual}
          handleGerarCadernoEscola={handleGerarCadernoEscola}
          toggleConferenciaAtleta={toggleConferenciaAtleta}
          abrirModalObsAtleta={abrirModalObsAtleta}
          onNovoAtleta={handleAbrirModalNovoAtleta}
          onEditarAtleta={handleAbrirModalEditarAtleta}
          onExcluirAtleta={handleExcluirAtletaCoord}
          onAcessarInscricoesEscola={handleAcessarInscricoesEscola}
          onAprovarEquipeModalidade={handleAprovarEquipeModalidade}
        />
      )}

      {/* ABA 2: HOMOLOGAÇÃO DE INSCRIÇÕES & PENDÊNCIAS */}
      {abaAtiva === 'HOMOLOGACAO' && (
        <AbaHomologacao
          busca={busca}
          setBusca={setBusca}
          filtroStatus={filtroStatus}
          setFiltroStatus={setFiltroStatus}
          inscricoes={inscricoes}
          escolas={escolas}
          atletas={atletas}
          alertas={alertasInconsistencia}
          abrirModalAnalise={abrirModalAnalise}
          onAprovarEquipeDireto={handleAprovarEquipeDireto}
        />
      )}

      {/* ABA 3: SÚMULAS & LISTAS OFICIAIS */}
      {abaAtiva === 'LISTAS_CHAMADA' && (
        <AbaSumulas
          modalidades={modalidades}
          escolas={escolas}
          atletas={atletas}
          inscricoes={inscricoes}
          handleGerarListaChamada={handleGerarListaChamada}
          handleGerarCadernoModalidade={handleGerarCadernoModalidade}
          handleGerarCadernoGeralArbitragem={handleGerarCadernoGeralArbitragem}
          handleGerarCadernoEscola={handleGerarCadernoEscola}
          handleGerarModeloManual={handleGerarModeloManual}
        />
      )}

      {/* ABA 4: LOGÍSTICA & VALIDAÇÃO DE CRACHÁS */}
      {abaAtiva === 'CRACHA_LOGISTICA' && (
        <AbaCrachaLogistica />
      )}

      {/* ABA 5: COMUNICADOS E AVISOS */}
      {abaAtiva === 'AVISOS' && (
        <AbaComunicados comunicados={comunicados} />
      )}

      {/* Modal de Homologação / Parecer */}
      <ModalAnaliseInscricao
        isOpen={modalParecerAberto}
        inscricao={inscricaoEmAnalise}
        novoStatus={novoStatus}
        setNovoStatus={setNovoStatus}
        motivoRejeicao={motivoRejeicao}
        setMotivoRejeicao={setMotivoRejeicao}
        parecerTexto={parecerTexto}
        setParecerTexto={setParecerTexto}
        onClose={() => setModalParecerAberto(false)}
        onSubmit={salvarAnalise}
      />

      {/* Modal de Observação de Atleta */}
      <ModalObsAtleta
        isOpen={modalObsAtletaAberto}
        atleta={atletaObs}
        obsTexto={obsTexto}
        setObsTexto={setObsTexto}
        onClose={() => setModalObsAtletaAberto(false)}
        onSubmit={salvarObsAtleta}
      />

      {/* Modal de Publicação de Comunicado */}
      <ModalNovoAviso
        isOpen={modalAvisoAberto}
        titulo={novoAvisoTitulo}
        setTitulo={setNovoAvisoTitulo}
        conteudo={novoAvisoConteudo}
        setConteudo={setNovoAvisoConteudo}
        categoria={novoAvisoCategoria}
        setCategoria={setNovoAvisoCategoria}
        urgente={novoAvisoUrgente}
        setUrgente={setNovoAvisoUrgente}
        onClose={() => setModalAvisoAberto(false)}
        onSubmit={handleSalvarAviso}
      />

      {/* Modal de Cadastro de Nova Escola no Município */}
      {modalNovaEscolaAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-[#E2EAE5] shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2EAE5] pb-3">
              <div>
                <h3 className="text-lg font-black text-[#17221D]">Cadastrar Nova Escola</h3>
                <p className="text-xs text-[#68756E]">
                  Adicionar ao município de <strong>{municipioAtual?.nome}</strong>
                </p>
              </div>
              <button
                onClick={() => setModalNovaEscolaAberto(false)}
                className="text-gray-400 hover:text-gray-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCriarEscola} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-[#17221D] mb-1">
                  Nome da Escola *
                </label>
                <input
                  type="text"
                  required
                  value={novaEscolaNome}
                  onChange={(e) => setNovaEscolaNome(e.target.value)}
                  placeholder="Ex: Escola Municipal Novo Horizonte"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-bold focus:outline-none focus:border-[#00A878]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17221D] mb-1">
                    Sigla / Nome Curto
                  </label>
                  <input
                    type="text"
                    value={novaEscolaSigla}
                    onChange={(e) => setNovaEscolaSigla(e.target.value)}
                    placeholder="Ex: NOVO HORIZONTE"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-bold focus:outline-none focus:border-[#00A878]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17221D] mb-1">
                    Código INEP
                  </label>
                  <input
                    type="text"
                    value={novaEscolaInep}
                    onChange={(e) => setNovaEscolaInep(e.target.value)}
                    placeholder="Ex: 21004599"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-bold focus:outline-none focus:border-[#00A878]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17221D] mb-1">
                    Rede de Ensino
                  </label>
                  <select
                    value={novaEscolaRede}
                    onChange={(e) => setNovaEscolaRede(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-bold focus:outline-none focus:border-[#00A878]"
                  >
                    <option value="MUNICIPAL">Municipal</option>
                    <option value="ESTADUAL">Estadual</option>
                    <option value="PARTICULAR">Particular</option>
                    <option value="FEDERAL">Federal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17221D] mb-1">
                    E-mail Institucional (Login)
                  </label>
                  <input
                    type="email"
                    value={novaEscolaEmail}
                    onChange={(e) => setNovaEscolaEmail(e.target.value)}
                    placeholder="escola@semed.gov.br"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-bold focus:outline-none focus:border-[#00A878]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2EAE5]">
                <button
                  type="button"
                  onClick={() => setModalNovaEscolaAberto(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-[#17221D] font-bold text-xs hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-black text-xs shadow-sm"
                >
                  Cadastrar Escola
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Inscrição / Cadastro de Aluno pela Coordenação SEMED */}
      {escolaSelecionada && (
        <ModalCadastroAtleta
          isOpen={modalCadastroAtletaAberto}
          onClose={() => setModalCadastroAtletaAberto(false)}
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
          handleSalvarAtleta={handleSalvarAtletaCoord}
          escolaId={escolaSelecionada.id}
          diagnosticoDuplicidade={diagnosticoDuplicidade}
          onCarregarAtletaDuplicado={(atl) => handleAbrirModalEditarAtleta(atl, escolaSelecionada)}
        />
      )}

    </div>
  );
}
