'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
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
  QrCode
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
  ModalidadeConfig
} from '@/types/jegd';
import { JegdsRulesService } from '@/services/jegds-rules';
import { ModalAnaliseInscricao } from './components/ModalAnaliseInscricao';
import { ModalNovoAviso } from './components/ModalNovoAviso';
import { ModalObsAtleta } from './components/ModalObsAtleta';
import { AbaEscolasLote } from './components/AbaEscolasLote';
import { AbaHomologacao } from './components/AbaHomologacao';
import { AbaAlertas } from './components/AbaAlertas';
import { AbaSumulas } from './components/AbaSumulas';
import { AbaComunicados } from './components/AbaComunicados';
import { AbaCrachaLogistica } from './components/AbaCrachaLogistica';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [municipioAtual, setMunicipioAtual] = useState<Municipio | null>(null);
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [inscricoes, setInscricoes] = useState<InscricaoEquipe[]>([]);
  const [modalidades, setModalidades] = useState<ModalidadeConfig[]>([]);
  const [comunicados, setComunicados] = useState<ComunicadoAviso[]>([]);
  
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

  useEffect(() => {
    JegdStorage.init();
    if (!JegdStorage.isAdminAuth()) {
      router.push('/admin/login');
      return;
    }
    const munList = JegdStorage.getMunicipios();
    setMunicipios(munList);

    const currentUser = JegdStorage.getCurrentUser();
    let curMun = JegdStorage.getCurrentMunicipio();

    // Se for coordenador local, força o município atribuído ao seu usuário
    if (currentUser && currentUser.papel === 'COORDENADOR' && currentUser.municipioId) {
      const userMun = munList.find(m => m.id === currentUser.municipioId);
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
      setEscolaSelecionadaId(escList[0].id);
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

  const extrairCategoriasData = (mod: ModalidadeConfig) => {
    const sexos = ['MASCULINO', 'FEMININO'];
    const categoriasData: { categoria: string; sexo: string; atletasComEscola: { atleta: Atleta; escola: Escola; provas?: string[] }[] }[] = [];

    mod.categoriasPermitidas.forEach(cat => {
      sexos.forEach(sexo => {
        const inscricoesCat = inscricoes.filter(
          i => i.modalidadeCodigo === mod.codigo && i.categoria === cat && i.sexo === sexo
        );
        const atletasComEscola: { atleta: Atleta; escola: Escola; provas?: string[] }[] = [];
        inscricoesCat.forEach(insc => {
          const escolaObj = escolas.find(e => e.id === insc.escolaId);
          if (escolaObj) {
            insc.atletaIds.forEach(atlId => {
              const atlObj = atletas.find(a => a.id === atlId);
              if (atlObj) {
                atletasComEscola.push({
                  atleta: atlObj,
                  escola: escolaObj,
                  provas: insc.provasPorAtleta?.[atlId]
                });
              }
            });
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

  const handleGerarListaChamada = async (mod: ModalidadeConfig, categoria: string, sexo: string) => {
    const inscricoesModalidade = inscricoes.filter(
      i => i.modalidadeCodigo === mod.codigo && i.categoria === categoria && i.sexo === sexo
    );

    const atletasComEscola: { atleta: Atleta; escola: Escola; provas?: string[] }[] = [];
    
    inscricoesModalidade.forEach(insc => {
      const escolaObj = escolas.find(e => e.id === insc.escolaId);
      if (escolaObj) {
        insc.atletaIds.forEach(atlId => {
          const atlObj = atletas.find(a => a.id === atlId);
          if (atlObj) {
            atletasComEscola.push({
              atleta: atlObj,
              escola: escolaObj,
              provas: insc.provasPorAtleta?.[atlId]
            });
          }
        });
      }
    });

    if (atletasComEscola.length === 0) {
      alert('Nenhum atleta inscrito nesta categoria para gerar a lista de chamada.');
      return;
    }

    await JegdPdfGenerator.gerarListaChamadaOficial(
      mod.nome,
      categoria,
      sexo,
      new Date(mod.dataEvento).toLocaleDateString('pt-BR'),
      atletasComEscola
    );
  };

  const handleGerarCadernoModalidade = async (mod: ModalidadeConfig) => {
    const categoriasData = extrairCategoriasData(mod);
    await JegdPdfGenerator.gerarCadernoModalidadeCompleto(mod, categoriasData);
  };

  const handleGerarCadernoGeralArbitragem = async () => {
    const modalidadesCompletas = modalidades.map(mod => ({
      modalidade: mod,
      categoriasData: extrairCategoriasData(mod)
    }));
    await JegdPdfGenerator.gerarCadernoGeralArbitragem(modalidadesCompletas);
  };

  const progressoEscolas = JegdStorage.getProgressoEscolas();
  const escolaSelecionada = escolas.find(e => e.id === escolaSelecionadaId);
  const atletasDaEscolaSelecionada = atletas.filter(a => a.escolaId === escolaSelecionadaId);
  const inscricoesDaEscolaSelecionada = inscricoes.filter(i => i.escolaId === escolaSelecionadaId);

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 w-full max-w-full">
      
      {/* Header Coordenadores SEMED com Contexto Municipal */}
      <div className="bg-white border border-[#E2EAE5] rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00A878]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        {/* Seletor Rápido de Município no Painel */}
        <div className="mb-4 bg-emerald-50/90 border border-emerald-200/80 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-black text-emerald-950 flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span>MUNICÍPIO ATIVO:</span>
            <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-300 text-emerald-900 font-black">
              {municipioAtual ? `${municipioAtual.nome} - ${municipioAtual.uf} (${municipioAtual.siglaEvento})` : 'Carregando...'}
            </span>
            <button
              type="button"
              onClick={handleForcarSincronizacao}
              disabled={sincronizandoOnline}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition-all disabled:opacity-60"
              title="Sincronizar instantaneamente com o banco central"
            >
              <span className={sincronizandoOnline ? 'animate-spin inline-block' : 'inline-block'}>🔄</span>
              <span>{sincronizandoOnline ? 'Sincronizando...' : `Online • Sinc: ${ultimaSincronizacao}`}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {JegdStorage.isSuperAdminAuth() && !JegdStorage.isDomainLocked() && (
              <select
                value={municipioAtual?.id || ''}
                onChange={(e) => handleMudarMunicipio(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-900 text-xs font-black focus:outline-none focus:ring-2 focus:ring-emerald-500 text-ellipsis"
              >
                {municipios.map((m) => (
                  <option key={m.id} value={m.id}>
                    Alternar p/ {m.nome} ({m.siglaEvento})
                  </option>
                ))}
              </select>
            )}
            {JegdStorage.isSuperAdminAuth() && (
              <Link
                href="/admin/super"
                className="px-3 py-1.5 rounded-xl bg-[#087A5B] hover:bg-[#00A878] text-white text-xs font-black shrink-0 transition-colors shadow-xs"
              >
                Central SuperAdmin
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 sm:gap-6 relative z-10">
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#E8F7F1] border border-[#00A878]/30 flex items-center justify-center text-[#087A5B] shadow-2xs shrink-0">
              <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-3xl font-black text-[#17221D] break-words">
                  Painel da Coordenação SEMED
                </h1>
                <span className="text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full bg-[#E8F7F1] text-[#087A5B] border border-[#00A878]/30 font-black shrink-0">
                  {municipioAtual ? municipioAtual.nomeEvento : 'Jogos Escolares'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#4B5563] mt-1 font-medium break-words">
                Conferência de lotes de {municipioAtual?.nome || 'Gonçalves Dias'}, emissão de crachás, súmulas e controle de vagas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setModalNovaEscolaAberto(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] hover:bg-white text-xs sm:text-sm font-bold shadow-2xs flex items-center justify-center gap-2 transition-all shrink-0"
            >
              <PlusCircle className="w-4 h-4 text-[#00A878]" />
              <span>Cadastrar Escola</span>
            </button>
            <button
              onClick={() => setModalAvisoAberto(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#00A878]/20 flex items-center justify-center gap-2 transition-all shrink-0"
            >
              <Bell className="w-4 h-4" />
              <span>Publicar Aviso</span>
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas Gerais do Município Ativo */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white border border-[#E2EAE5] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#4B5563]">Escolas</span>
          <p className="text-2xl sm:text-4xl font-black text-[#17221D] mt-1">{escolas.length}</p>
          <p className="text-[11px] sm:text-xs text-[#4B5563] mt-0.5 font-medium truncate">{municipioAtual?.nome || 'Município'}</p>
        </div>

        <div className="bg-white border border-[#E2EAE5] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#4B5563]">Alunos</span>
          <p className="text-2xl sm:text-4xl font-black text-[#17221D] mt-1">{atletas.length}</p>
          <p className="text-[11px] sm:text-xs text-[#4B5563] mt-0.5 font-medium truncate">Cadastrados</p>
        </div>

        <div className="bg-white border border-[#E2EAE5] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#4B5563]">Inscrições</span>
          <p className="text-2xl sm:text-4xl font-black text-[#17221D] mt-1">{inscricoes.length}</p>
          <p className="text-[11px] sm:text-xs text-[#4B5563] mt-0.5 font-medium truncate">Equipes enviadas</p>
        </div>

        <div className="bg-white border border-[#E2EAE5] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#087A5B]">Conferidos</span>
          <p className="text-2xl sm:text-4xl font-black text-[#00A878] mt-1">
            {atletas.filter(a => a.conferidoPeloCoordenador).length}
          </p>
          <p className="text-[11px] sm:text-xs text-[#4B5563] mt-0.5 font-medium truncate">Homologados</p>
        </div>

        <div className="bg-white border border-[#E2EAE5] rounded-2xl sm:rounded-3xl p-4 sm:p-6 col-span-2 lg:col-span-1 shadow-xs">
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-red-600">Alertas</span>
          <p className="text-2xl sm:text-4xl font-black text-red-600 mt-1">{alertasInconsistencia.length}</p>
          <p className="text-[11px] sm:text-xs text-[#4B5563] mt-0.5 font-medium truncate">Inconsistências</p>
        </div>
      </div>

      {/* Navegação por Abas */}
      <div className="flex items-center gap-2 border-b border-[#E2EAE5] pb-2 overflow-x-auto no-scrollbar w-full">
        <button
          onClick={() => setAbaAtiva('ESCOLAS_LOTE')}
          className={`px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
            abaAtiva === 'ESCOLAS_LOTE'
              ? 'bg-[#00A878] text-white shadow-xs'
              : 'text-[#4B5563] hover:text-[#17221D] hover:bg-white'
          }`}
        >
          Lotes por Escola & Conferência
        </button>

        <button
          onClick={() => setAbaAtiva('HOMOLOGACAO')}
          className={`px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
            abaAtiva === 'HOMOLOGACAO'
              ? 'bg-[#00A878] text-white shadow-xs'
              : 'text-[#4B5563] hover:text-[#17221D] hover:bg-white'
          }`}
        >
          Homologação ({inscricoes.length})
        </button>

        <button
          onClick={() => setAbaAtiva('ALERTAS')}
          className={`px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
            abaAtiva === 'ALERTAS'
              ? 'bg-[#00A878] text-white shadow-xs'
              : 'text-[#4B5563] hover:text-[#17221D] hover:bg-white'
          }`}
        >
          Alertas ({alertasInconsistencia.length})
        </button>

        <button
          onClick={() => setAbaAtiva('LISTAS_CHAMADA')}
          className={`px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
            abaAtiva === 'LISTAS_CHAMADA'
              ? 'bg-[#00A878] text-white shadow-xs'
              : 'text-[#4B5563] hover:text-[#17221D] hover:bg-white'
          }`}
        >
          Súmulas & Listas
        </button>

        <button
          onClick={() => setAbaAtiva('CRACHA_LOGISTICA')}
          className={`px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
            abaAtiva === 'CRACHA_LOGISTICA'
              ? 'bg-[#00A878] text-white shadow-xs'
              : 'text-[#4B5563] hover:text-[#17221D] hover:bg-white'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Crachá & Validação</span>
        </button>

        <button
          onClick={() => setAbaAtiva('AVISOS')}
          className={`px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
            abaAtiva === 'AVISOS'
              ? 'bg-[#00A878] text-white shadow-xs'
              : 'text-[#4B5563] hover:text-[#17221D] hover:bg-white'
          }`}
        >
          Comunicados ({comunicados.length})
        </button>
      </div>

      {/* ABA: LOTES POR ESCOLA & CONFERÊNCIA */}
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
          toggleConferenciaAtleta={toggleConferenciaAtleta}
          abrirModalObsAtleta={abrirModalObsAtleta}
        />
      )}

      {/* ABA: HOMOLOGAÇÃO DE INSCRIÇÕES */}
      {abaAtiva === 'HOMOLOGACAO' && (
        <AbaHomologacao
          busca={busca}
          setBusca={setBusca}
          filtroStatus={filtroStatus}
          setFiltroStatus={setFiltroStatus}
          inscricoes={inscricoes}
          escolas={escolas}
          atletas={atletas}
          abrirModalAnalise={abrirModalAnalise}
        />
      )}

      {/* ABA: ALERTAS DE INCONSISTÊNCIA */}
      {abaAtiva === 'ALERTAS' && (
        <AbaAlertas alertas={alertasInconsistencia} />
      )}

      {/* ABA: LISTAS DE CHAMADA & SÚMULAS */}
      {abaAtiva === 'LISTAS_CHAMADA' && (
        <AbaSumulas
          modalidades={modalidades}
          handleGerarListaChamada={handleGerarListaChamada}
          handleGerarCadernoModalidade={handleGerarCadernoModalidade}
          handleGerarCadernoGeralArbitragem={handleGerarCadernoGeralArbitragem}
        />
      )}

      {/* ABA: VALIDAÇÃO DE CRACHÁS & LOGÍSTICA */}
      {abaAtiva === 'CRACHA_LOGISTICA' && (
        <AbaCrachaLogistica />
      )}

      {/* ABA: AVISOS */}
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

    </div>
  );
}
