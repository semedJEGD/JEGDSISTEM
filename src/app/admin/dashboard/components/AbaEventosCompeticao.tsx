'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Tv,
  Newspaper,
  CalendarClock,
  Trophy,
  Target,
  Medal,
  Megaphone,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Upload,
  Sparkles,
  Users,
  Clock,
  MapPin,
  GitBranch,
} from 'lucide-react';
import { Atleta, Escola, InscricaoEquipe, ModalidadeConfig } from '@/types/jegd';
import { PainelChaveamentoOficial } from './PainelChaveamentoOficial';
import { LancadorPodioJornalistico } from './LancadorPodioJornalistico';
import {
  EventosBundle,
  PartidaEventoItem,
  StatusCronograma,
} from '@/types/eventos';
import {
  EventosApi,
  MODALIDADES_EVENTOS_OPCOES,
  CATEGORIAS_EVENTOS,
  FASES_LABEL,
  CRONOGRAMA_PADRAO_JEGDS,
  calcularQuadroMedalhas,
  agruparArtilhariaPorModalidade,
  formatarDataBR,
} from '@/lib/eventos-service';
import {
  calcularAtualizacoesAvancoMataMata,
  normalizarCodigoModalidade,
} from '@/lib/chaveamento-service';

interface AbaEventosCompeticaoProps {
  municipioId?: string;
  escolas: Escola[];
  atletas: Atleta[];
  inscricoes?: InscricaoEquipe[];
  modalidades?: ModalidadeConfig[];
}

type SubAba = 'CHAVEAMENTO' | 'JOGOS' | 'NOTICIAS' | 'CRONOGRAMA' | 'ARTILHARIA' | 'MEDALHAS';

export function AbaEventosCompeticao({
  municipioId,
  escolas,
  atletas,
  inscricoes = [],
  modalidades = [],
}: AbaEventosCompeticaoProps) {
  const [subAba, setSubAba] = useState<SubAba>('CHAVEAMENTO');
  const [bundle, setBundle] = useState<EventosBundle>({
    noticias: [],
    cronograma: [],
    partidas: [],
    artilharia: [],
    medalhas: [],
    avisos: [],
    chaveamentos: [],
    updatedAt: '',
  });
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const hojeIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // ---- Estado Form: Notícia ----
  const [notTitulo, setNotTitulo] = useState('');
  const [notResumo, setNotResumo] = useState('');
  const [notModalidade, setNotModalidade] = useState('Atletismo');
  const [notCategoria, setNotCategoria] = useState('INFANTIL');
  const [notHorario, setNotHorario] = useState('08:30 • Manhã');
  const [notLocal, setNotLocal] = useState('');
  const [notImagem, setNotImagem] = useState('');
  const [notDestaqueTelao, setNotDestaqueTelao] = useState(true);

  // ---- Estado Form: Cronograma ----
  const [cronTitulo, setCronTitulo] = useState('');
  const [cronDescricao, setCronDescricao] = useState('');
  const [cronEtapa, setCronEtapa] = useState('1ª Etapa');
  const [cronModalidade, setCronModalidade] = useState('Queimada');
  const [cronCategoria, setCronCategoria] = useState('MIRIM');
  const [cronLocal, setCronLocal] = useState('Quadra 01');
  const [cronData, setCronData] = useState(hojeIso);
  const [cronHoraIni, setCronHoraIni] = useState('08:30');
  const [cronHoraFim, setCronHoraFim] = useState('10:00');
  const [cronStatus, setCronStatus] = useState<StatusCronograma>('PREVISTO');
  const [cronResumoRes, setCronResumoRes] = useState('');

  // ---- Estado Form: Partida ----
  const [jogoModCodigo, setJogoModCodigo] = useState('futsal');
  const [jogoCat, setJogoCat] = useState('INFANTIL');
  const [jogoSexo, setJogoSexo] = useState('MASCULINO');
  const [jogoFase, setJogoFase] = useState('GRUPOS');
  const [jogoGrupo, setJogoGrupo] = useState('Grupo A');
  const [jogoData, setJogoData] = useState(hojeIso);
  const [jogoHora, setJogoHora] = useState('09:00');
  const [jogoLocal, setJogoLocal] = useState('Quadra Principal');
  const [jogoEscolaAId, setJogoEscolaAId] = useState('');
  const [jogoEscolaBId, setJogoEscolaBId] = useState('');

  // ---- Estado Form: Artilharia ----
  const [artModCodigo, setArtModCodigo] = useState('futsal');
  const [artCat, setArtCat] = useState('INFANTIL');
  const [artSexo, setArtSexo] = useState('MASCULINO');
  const [artEscolaId, setArtEscolaId] = useState('');
  const [artAtletaId, setArtAtletaId] = useState('');
  const [artAtletaNomeLivre, setArtAtletaNomeLivre] = useState('');
  const [artGols, setArtGols] = useState(1);

  // ---- Estado Form: Medalha & Aviso ----
  const [medEscolaId, setMedEscolaId] = useState('');
  const [medModCodigo, setMedModCodigo] = useState('atletismo');
  const [medCat, setMedCat] = useState('INFANTIL');
  const [medSexo, setMedSexo] = useState('MASCULINO');
  const [medProva, setMedProva] = useState('');
  const [medTipo, setMedTipo] = useState<'OURO' | 'PRATA' | 'BRONZE'>('OURO');
  const [medAtletaNome, setMedAtletaNome] = useState('');

  const [avisoTitulo, setAvisoTitulo] = useState('');
  const [avisoMensagem, setAvisoMensagem] = useState('');
  const [avisoTipo, setAvisoTipo] = useState<'CHAMADA' | 'INFORMATIVO' | 'URGENTE' | 'VIDEO'>('CHAMADA');

  const carregarDados = useCallback(async (silencioso?: boolean | unknown) => {
    const isSilencioso = silencioso === true;
    try {
      if (!isSilencioso) setCarregando(true);
      const data = await EventosApi.carregar(municipioId, { incluirAtletas: false, nocache: true });
      setBundle(data);
    } catch (err) {
      console.error('Erro ao carregar eventos:', err);
    } finally {
      if (!isSilencioso) setCarregando(false);
    }
  }, [municipioId]);

  useEffect(() => {
    carregarDados(false);

    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (salvando) return;
      carregarDados(true);
    }, 20000);

    const handleFocus = () => {
      if (!salvando) carregarDados(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [carregarDados, salvando]);

  const escolasOrdenadas = useMemo(
    () => [...escolas].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [escolas]
  );

  const atletasDaEscolaArtilharia = useMemo(() => {
    if (!artEscolaId) return [];
    return atletas
      .filter((a) => a.escolaId === artEscolaId)
      .sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto, 'pt-BR'));
  }, [atletas, artEscolaId]);

  const quadroMedalhas = useMemo(() => calcularQuadroMedalhas(bundle.medalhas), [bundle.medalhas]);
  const artilhariaAgrupada = useMemo(() => agruparArtilhariaPorModalidade(bundle.artilharia), [bundle.artilharia]);

  // Upload e compressão rápida de foto de notícia para base64 leve
  const handleUploadFotoNoticia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 960;
        const scale = img.width > maxW ? maxW / img.width : 1;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        setNotImagem(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = String(ev.target?.result || '');
    };
    reader.readAsDataURL(file);
  };

  // ---- Handlers: Notícias ----
  const handleCriarNoticia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notTitulo.trim() || !notResumo.trim()) return;
    try {
      setSalvando(true);
      await EventosApi.criar('noticia', {
        municipioId,
        titulo: notTitulo.trim(),
        resumo: notResumo.trim(),
        modalidadeNome: notModalidade,
        categoria: notCategoria,
        horarioOcorrencia: notHorario.trim() || null,
        local: notLocal.trim() || null,
        imagemUrl: notImagem || null,
        destaqueTelao: notDestaqueTelao,
        publicado: true,
      });
      setNotTitulo('');
      setNotResumo('');
      setNotLocal('');
      setNotImagem('');
      await carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao publicar destaque');
    } finally {
      setSalvando(false);
    }
  };

  // ---- Handlers: Cronograma ----
  const handleCarregarCronogramaPadrao = async () => {
    try {
      setSalvando(true);
      await EventosApi.criar('cronograma_lote', {
        municipioId,
        itens: CRONOGRAMA_PADRAO_JEGDS,
      });
      await carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao carregar cronograma padrão');
    } finally {
      setSalvando(false);
    }
  };

  const handleCriarCronograma = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cronTitulo.trim()) return;
    try {
      setSalvando(true);
      await EventosApi.criar('cronograma', {
        municipioId,
        titulo: cronTitulo.trim(),
        descricao: cronDescricao.trim() || null,
        etapa: cronEtapa,
        modalidadeNome: cronModalidade,
        categoria: cronCategoria,
        local: cronLocal.trim() || null,
        dataEvento: cronData,
        horarioInicio: cronHoraIni,
        horarioFim: cronHoraFim || null,
        status: cronStatus,
        resumoResultado: cronResumoRes.trim() || null,
        ordem: bundle.cronograma.length + 1,
      });
      setCronTitulo('');
      setCronDescricao('');
      setCronResumoRes('');
      await carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar item do cronograma');
    } finally {
      setSalvando(false);
    }
  };

  const handleMudarStatusCronograma = async (id: string, novoStatus: StatusCronograma) => {
    try {
      let resumoResultado: string | undefined;
      if (novoStatus === 'CONCLUIDO') {
        const resp = prompt('Resumo rápido do que ocorreu (opcional — aparece no portal e no telão):');
        if (resp !== null && resp.trim()) resumoResultado = resp.trim();
      }
      await EventosApi.atualizar('cronograma', id, {
        status: novoStatus,
        ...(resumoResultado ? { resumoResultado } : {}),
      });
      await carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar status');
    }
  };

  // ---- Handlers: Partidas ----
  const handleCriarPartida = async (e: React.FormEvent) => {
    e.preventDefault();
    const escA = escolas.find((x) => x.id === jogoEscolaAId);
    const escB = escolas.find((x) => x.id === jogoEscolaBId);
    if (!escA || !escB) {
      alert('Selecione as duas escolas do confronto.');
      return;
    }
    if (escA.id === escB.id) {
      alert('Selecione duas escolas diferentes.');
      return;
    }
    const modObj = MODALIDADES_EVENTOS_OPCOES.find((m) => m.codigo === jogoModCodigo) || {
      codigo: jogoModCodigo,
      nome: jogoModCodigo,
    };

    try {
      setSalvando(true);
      await EventosApi.criar('partida', {
        municipioId,
        numeroJogo: bundle.partidas.length + 1,
        modalidadeCodigo: normalizarCodigoModalidade(modObj.codigo),
        modalidadeNome: modObj.nome,
        categoria: jogoCat,
        sexo: jogoSexo,
        fase: jogoFase,
        grupo: jogoFase === 'GRUPOS' ? jogoGrupo : null,
        dataEvento: jogoData,
        horario: jogoHora,
        local: jogoLocal.trim() || null,
        escolaAId: escA.id,
        escolaANome: escA.nome,
        escolaASigla: escA.sigla || escA.nome,
        escolaBId: escB.id,
        escolaBNome: escB.nome,
        escolaBSigla: escB.sigla || escB.nome,
      });
      setJogoEscolaAId('');
      setJogoEscolaBId('');
      await carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar partida');
    } finally {
      setSalvando(false);
    }
  };

  const handleAtualizarPlacar = async (partida: PartidaEventoItem, deltaA: number, deltaB: number) => {
    const novoA = Math.max(0, partida.placarA + deltaA);
    const novoB = Math.max(0, partida.placarB + deltaB);
    try {
      await EventosApi.atualizar('partida', partida.id, {
        placarA: novoA,
        placarB: novoB,
        status: partida.status === 'AGENDADO' ? 'AO_VIVO' : partida.status,
      });
      await carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar placar');
    }
  };

  const handleMudarStatusPartida = async (partida: PartidaEventoItem, status: string, woLado?: 'A' | 'B') => {
    try {
      let dados: Record<string, any> = { status };
      if (status === 'ENCERRADO') {
        dados.vencedorEscolaId =
          partida.placarA > partida.placarB
            ? partida.escolaAId
            : partida.placarB > partida.placarA
            ? partida.escolaBId
            : null;
      } else if (status === 'WO' && woLado) {
        dados = {
          status: 'WO',
          placarA: woLado === 'A' ? 0 : 1,
          placarB: woLado === 'B' ? 0 : 1,
          woEscolaId: woLado === 'A' ? partida.escolaAId : partida.escolaBId,
          vencedorEscolaId: woLado === 'A' ? partida.escolaBId : partida.escolaAId,
        };
      }
      await EventosApi.atualizar('partida', partida.id, dados);

      // Avança automaticamente classificados/vencedores no mata-mata desta categoria
      if (status === 'ENCERRADO' || status === 'WO') {
        const modNorm = normalizarCodigoModalidade(partida.modalidadeCodigo);
        const partidasCat = bundle.partidas
          .filter(
            (p) =>
              normalizarCodigoModalidade(p.modalidadeCodigo) === modNorm &&
              p.categoria === partida.categoria &&
              p.sexo === partida.sexo
          )
          .map((p) => (p.id === partida.id ? { ...p, ...dados } : p));
        const updates = calcularAtualizacoesAvancoMataMata(partidasCat);
        if (updates.length > 0) {
          await EventosApi.atualizar('partidas_atualizar_lote', partida.id, { itens: updates });
        }
      }

      await carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar status da partida');
    }
  };

  // ---- Handlers: Artilharia ----
  const handleAdicionarArtilheiro = async (e: React.FormEvent) => {
    e.preventDefault();
    const esc = escolas.find((x) => x.id === artEscolaId);
    const atl = atletas.find((x) => x.id === artAtletaId);
    const nomeFinal = atl ? atl.nomeCompleto : artAtletaNomeLivre.trim();
    if (!esc || !nomeFinal) {
      alert('Selecione a escola e o atleta.');
      return;
    }
    const modObj = MODALIDADES_EVENTOS_OPCOES.find((m) => m.codigo === artModCodigo) || {
      codigo: artModCodigo,
      nome: artModCodigo,
    };
    try {
      setSalvando(true);
      await EventosApi.criar('artilharia', {
        municipioId,
        atletaId: atl?.id || null,
        atletaNome: nomeFinal,
        fotoUrl: atl?.documentos?.foto3x4 || null,
        escolaId: esc.id,
        escolaNome: esc.nome,
        escolaSigla: esc.sigla || esc.nome,
        modalidadeCodigo: modObj.codigo,
        modalidadeNome: modObj.nome,
        categoria: atl?.categoriaCalculada || artCat,
        sexo: atl?.sexo || artSexo,
        gols: Number(artGols || 1),
      });
      setArtAtletaId('');
      setArtAtletaNomeLivre('');
      setArtGols(1);
      await carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar artilheiro');
    } finally {
      setSalvando(false);
    }
  };

  // ---- Handlers: Medalhas & Avisos ----
  const handleLancarMedalha = async (e: React.FormEvent) => {
    e.preventDefault();
    const esc = escolas.find((x) => x.id === medEscolaId);
    if (!esc) {
      alert('Selecione a escola premiada.');
      return;
    }
    const modObj = MODALIDADES_EVENTOS_OPCOES.find((m) => m.codigo === medModCodigo) || {
      codigo: medModCodigo,
      nome: medModCodigo,
    };
    try {
      setSalvando(true);
      await EventosApi.criar('medalha', {
        municipioId,
        escolaId: esc.id,
        escolaNome: esc.nome,
        escolaSigla: esc.sigla || esc.nome,
        modalidadeCodigo: modObj.codigo,
        modalidadeNome: modObj.nome,
        categoria: medCat,
        sexo: medSexo,
        prova: medProva.trim() || null,
        tipo: medTipo,
        atletaNome: medAtletaNome.trim() || null,
      });
      setMedProva('');
      setMedAtletaNome('');
      await carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao lançar medalha');
    } finally {
      setSalvando(false);
    }
  };

  const handleCriarAvisoTelao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avisoTitulo.trim() || !avisoMensagem.trim()) return;
    try {
      setSalvando(true);
      await EventosApi.criar('aviso', {
        municipioId,
        titulo: avisoTitulo.trim(),
        mensagem: avisoMensagem.trim(),
        tipo: avisoTipo,
        ativo: true,
      });
      setAvisoTitulo('');
      setAvisoMensagem('');
      await carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar chamada de telão');
    } finally {
      setSalvando(false);
    }
  };

  const handleExcluir = async (entidade: string, id: string) => {
    if (!confirm('Deseja realmente remover este item?')) return;
    try {
      await EventosApi.excluir(entidade, id);
      await carregarDados();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir');
    }
  };

  return (
    <div className="space-y-4">
      {/* BARRA ÚNICA: SUB-ABAS + ATALHOS PORTAL & TELÃO */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white border border-slate-200/80 rounded-2xl px-3 py-2 shadow-2xs">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'CHAVEAMENTO', label: 'Chaveamento', count: bundle.chaveamentos?.length || 0, icon: GitBranch },
              { id: 'JOGOS', label: 'Jogos', count: bundle.partidas.length, icon: Trophy },
              { id: 'NOTICIAS', label: 'Notícias', count: bundle.noticias.length, icon: Newspaper },
              { id: 'CRONOGRAMA', label: 'Cronograma', count: bundle.cronograma.length, icon: CalendarClock },
              { id: 'ARTILHARIA', label: 'Artilharia', count: bundle.artilharia.length, icon: Target },
              { id: 'MEDALHAS', label: 'Medalhas', count: bundle.medalhas.length, icon: Medal },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const ativo = subAba === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubAba(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                  ativo
                    ? 'bg-[#0F2540] text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-[#0F2540]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-[10px] px-1.5 rounded-full ${ativo ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={carregarDados}
            disabled={carregando}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
          </button>

          <a
            href="/eventos"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#0F2540] text-xs font-semibold flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3 text-[#00A878]" />
            <span>Portal</span>
          </a>

          <a
            href="/eventos/telao"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-lg bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Telão</span>
          </a>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SUB-ABA 0: AUDITORIA & CHAVEAMENTO OFICIAL (CBDE/JEBs/CBAt/FIDE) */}
      {/* ============================================================ */}
      {subAba === 'CHAVEAMENTO' && (
        <PainelChaveamentoOficial
          municipioId={municipioId}
          escolas={escolas}
          atletas={atletas}
          inscricoes={inscricoes}
          modalidades={modalidades}
          partidas={bundle.partidas}
          chaveamentos={bundle.chaveamentos || []}
          artilharia={bundle.artilharia}
          onAtualizado={carregarDados}
        />
      )}

      {/* ============================================================ */}
      {/* SUB-ABA 1: JOGOS, PLACARES AO VIVO & CHAVEAMENTO */}
      {/* ============================================================ */}
      {subAba === 'JOGOS' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E2EAE5] rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-[#17221D]">
                Cadastrar Jogo Avulso / Confronto Manual
              </h3>
              <button
                type="button"
                onClick={() => setSubAba('CHAVEAMENTO')}
                className="px-3 py-1.5 rounded-lg bg-[#E8F7F1] hover:bg-[#00A878] text-[#087A5B] hover:text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Montar Grupos / Chaveamento →</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Modalidade</label>
                <select
                  value={jogoModCodigo}
                  onChange={(e) => setJogoModCodigo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                >
                  {MODALIDADES_EVENTOS_OPCOES.map((m) => (
                    <option key={m.codigo} value={m.codigo}>{m.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Categoria</label>
                <select
                  value={jogoCat}
                  onChange={(e) => setJogoCat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                >
                  {CATEGORIAS_EVENTOS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Naipe</label>
                <select
                  value={jogoSexo}
                  onChange={(e) => setJogoSexo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                >
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMININO">Feminino</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Fase</label>
                <select
                  value={jogoFase}
                  onChange={(e) => setJogoFase(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                >
                  {Object.entries(FASES_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Grupo</label>
                <input
                  type="text"
                  value={jogoGrupo}
                  onChange={(e) => setJogoGrupo(e.target.value)}
                  placeholder="Grupo A"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Data</label>
                <input
                  type="date"
                  value={jogoData}
                  onChange={(e) => setJogoData(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Horário</label>
                <input
                  type="time"
                  value={jogoHora}
                  onChange={(e) => setJogoHora(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Quadra / Local</label>
                <input
                  type="text"
                  value={jogoLocal}
                  onChange={(e) => setJogoLocal(e.target.value)}
                  placeholder="Quadra 01"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
            </div>

            <form onSubmit={handleCriarPartida} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 items-end">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Equipe A (Escola)</label>
                <select
                  value={jogoEscolaAId}
                  onChange={(e) => setJogoEscolaAId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                >
                  <option value="">Selecione a Escola A...</option>
                  {escolasOrdenadas.map((e) => (
                    <option key={e.id} value={e.id}>{e.nome} ({e.sigla})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Equipe B (Escola)</label>
                <select
                  value={jogoEscolaBId}
                  onChange={(e) => setJogoEscolaBId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                >
                  <option value="">Selecione a Escola B...</option>
                  {escolasOrdenadas.map((e) => (
                    <option key={e.id} value={e.id}>{e.nome} ({e.sigla})</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                disabled={salvando}
                className="px-4 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{salvando ? 'Salvando...' : 'Adicionar Partida'}</span>
              </button>
            </form>
          </div>

          {/* LISTA DE PARTIDAS COM CONTROLE DE PLACAR AO VIVO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {bundle.partidas.length === 0 ? (
              <div className="col-span-full bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center text-xs text-slate-500">
                Nenhuma partida cadastrada ainda. Crie a primeira acima ou use o gerador de grupos!
              </div>
            ) : (
              bundle.partidas.map((p) => (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl p-4 border shadow-2xs space-y-3 ${
                    p.status === 'AO_VIVO' ? 'border-rose-400 ring-2 ring-rose-500/15' : 'border-[#E2EAE5]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-black uppercase">
                        {p.modalidadeNome}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#E8F7F1] text-[#087A5B] font-bold">
                        {p.categoria} • {p.sexo === 'FEMININO' ? 'FEM' : 'MASC'}
                      </span>
                      <span className="text-slate-500 font-semibold">
                        {p.grupo || FASES_LABEL[p.fase] || p.fase}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        p.status === 'AO_VIVO'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : p.status === 'ENCERRADO'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'WO'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {p.status === 'AO_VIVO' ? '● AO VIVO' : p.status}
                    </span>
                  </div>

                  {/* Placar com botões +1 / -1 */}
                  <div className="grid grid-cols-7 items-center gap-2 bg-[#F7F9F8] rounded-xl p-3 border border-[#E2EAE5]">
                    <div className="col-span-3 text-right">
                      <p className="text-xs font-black text-[#17221D] truncate">{p.escolaASigla || p.escolaANome}</p>
                      <div className="flex items-center justify-end gap-1 mt-1.5">
                        <button
                          type="button"
                          onClick={() => handleAtualizarPlacar(p, -1, 0)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-black text-xs hover:bg-slate-100 cursor-pointer"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAtualizarPlacar(p, 1, 0)}
                          className="w-7 h-7 rounded-lg bg-[#00A878] text-white font-black text-xs hover:bg-[#087A5B] cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="col-span-1 text-center">
                      <span className="text-xl font-black text-[#17221D]">
                        {p.placarA}×{p.placarB}
                      </span>
                    </div>

                    <div className="col-span-3 text-left">
                      <p className="text-xs font-black text-[#17221D] truncate">{p.escolaBSigla || p.escolaBNome}</p>
                      <div className="flex items-center justify-start gap-1 mt-1.5">
                        <button
                          type="button"
                          onClick={() => handleAtualizarPlacar(p, 0, 1)}
                          className="w-7 h-7 rounded-lg bg-[#00A878] text-white font-black text-xs hover:bg-[#087A5B] cursor-pointer"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAtualizarPlacar(p, 0, -1)}
                          className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-slate-700 font-black text-xs hover:bg-slate-100 cursor-pointer"
                        >
                          -
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Ações de Status + Data/Local */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> {formatarDataBR(p.dataEvento)} às {p.horario}
                      {p.local && (
                        <>
                          <span>•</span>
                          <MapPin className="w-3 h-3" /> {p.local}
                        </>
                      )}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {p.status !== 'AO_VIVO' && (
                        <button
                          type="button"
                          onClick={() => handleMudarStatusPartida(p, 'AO_VIVO')}
                          className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white font-bold cursor-pointer flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" /> Ao Vivo
                        </button>
                      )}
                      {p.status !== 'ENCERRADO' && (
                        <button
                          type="button"
                          onClick={() => handleMudarStatusPartida(p, 'ENCERRADO')}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Encerrar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleExcluir('partida', p.id)}
                        className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                        title="Excluir partida"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-ABA 2: PORTAL DE NOTÍCIAS & DESTAQUES DO DIA */}
      {/* ============================================================ */}
      {subAba === 'NOTICIAS' && (
        <div className="space-y-6">
          <form onSubmit={handleCriarNoticia} className="bg-white border border-[#E2EAE5] rounded-2xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-black text-[#17221D]">Publicar Boletim / Notícia de Cobertura do Dia</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Manchete / Título *</label>
                <input
                  type="text"
                  required
                  value={notTitulo}
                  onChange={(e) => setNotTitulo(e.target.value)}
                  placeholder="Ex.: Manhã de recordes no Atletismo Infantil na pista da U.E. Aldenora Araújo"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Detalhes do que aconteceu *</label>
                <textarea
                  required
                  rows={3}
                  value={notResumo}
                  onChange={(e) => setNotResumo(e.target.value)}
                  placeholder="Conte os destaques, vencedores das baterias, placares marcantes e clima da torcida..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Modalidade / Assunto</label>
                <input
                  type="text"
                  value={notModalidade}
                  onChange={(e) => setNotModalidade(e.target.value)}
                  placeholder="Atletismo, Abertura, Futsal..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Categoria</label>
                <input
                  type="text"
                  value={notCategoria}
                  onChange={(e) => setNotCategoria(e.target.value)}
                  placeholder="INFANTIL, TODAS..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Horário em que ocorreu</label>
                <input
                  type="text"
                  value={notHorario}
                  onChange={(e) => setNotHorario(e.target.value)}
                  placeholder="08:30 • Manhã"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Local</label>
                <input
                  type="text"
                  value={notLocal}
                  onChange={(e) => setNotLocal(e.target.value)}
                  placeholder="Quadra Principal / Pista Municipal"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
              <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-1">
                <label className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[#00A878]" />
                  <span>{notImagem ? 'Foto carregada ✓ (Trocar)' : 'Anexar Foto da Cobertura (Opcional)'}</span>
                  <input type="file" accept="image/*" onChange={handleUploadFotoNoticia} className="hidden" />
                </label>

                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notDestaqueTelao}
                    onChange={(e) => setNotDestaqueTelao(e.target.checked)}
                    className="rounded accent-[#00A878]"
                  />
                  <span>Exibir em destaque no Telão</span>
                </label>

                <button
                  type="submit"
                  disabled={salvando}
                  className="px-5 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-black cursor-pointer disabled:opacity-50"
                >
                  {salvando ? 'Publicando...' : 'Publicar Notícia'}
                </button>
              </div>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bundle.noticias.map((n) => (
              <div key={n.id} className="bg-white border border-[#E2EAE5] rounded-2xl p-4 shadow-2xs flex gap-3">
                {n.imagemUrl && (
                  <img src={n.imagemUrl} alt={n.titulo} className="w-24 h-24 rounded-xl object-cover shrink-0 border border-slate-200" />
                )}
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase text-[#087A5B] bg-[#E8F7F1] px-2 py-0.5 rounded-md">
                      {n.modalidadeNome || 'JEGDS'} {n.horarioOcorrencia ? `• ${n.horarioOcorrencia}` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleExcluir('noticia', n.id)}
                      className="text-rose-500 hover:bg-rose-50 p-1 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="text-sm font-black text-[#17221D] leading-snug">{n.titulo}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{n.resumo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-ABA 3: CRONOGRAMA VIVO (JÁ OCORREU / AGORA / PRÓXIMOS) */}
      {/* ============================================================ */}
      {subAba === 'CRONOGRAMA' && (
        <div className="space-y-6">
          <form onSubmit={handleCriarCronograma} className="bg-white border border-[#E2EAE5] rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-black text-[#17221D]">Adicionar Evento ao Cronograma do Dia</h3>
              {bundle.cronograma.length === 0 && (
                <button
                  type="button"
                  onClick={handleCarregarCronogramaPadrao}
                  disabled={salvando}
                  className="px-3 py-1.5 rounded-lg bg-[#E8F7F1] hover:bg-[#00A878] text-[#087A5B] hover:text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Carregar Etapas Oficiais JEGDs 2026</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Título do Evento *</label>
                <input
                  type="text"
                  required
                  value={cronTitulo}
                  onChange={(e) => setCronTitulo(e.target.value)}
                  placeholder="Ex.: Atletismo Infantil — Baterias 75m e 100m"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Data</label>
                <input type="date" value={cronData} onChange={(e) => setCronData(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Início</label>
                  <input type="time" value={cronHoraIni} onChange={(e) => setCronHoraIni(e.target.value)} className="w-full px-2 py-2 rounded-xl border border-slate-200 text-xs font-semibold" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Fim</label>
                  <input type="time" value={cronHoraFim} onChange={(e) => setCronHoraFim(e.target.value)} className="w-full px-2 py-2 rounded-xl border border-slate-200 text-xs font-semibold" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Etapa</label>
                <input type="text" value={cronEtapa} onChange={(e) => setCronEtapa(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Modalidade</label>
                <input type="text" value={cronModalidade} onChange={(e) => setCronModalidade(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Local / Quadra</label>
                <input type="text" value={cronLocal} onChange={(e) => setCronLocal(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Status</label>
                <select value={cronStatus} onChange={(e) => setCronStatus(e.target.value as StatusCronograma)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white">
                  <option value="PREVISTO">Previsto (Ainda vai acontecer)</option>
                  <option value="EM_ANDAMENTO">Acontecendo Agora</option>
                  <option value="CONCLUIDO">Já Ocorreu (Concluído)</option>
                </select>
              </div>
              <div className="sm:col-span-3">
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Descrição / Resumo do que aconteceu</label>
                <input
                  type="text"
                  value={cronDescricao}
                  onChange={(e) => setCronDescricao(e.target.value)}
                  placeholder="Detalhes do evento ou resumo do resultado..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                />
              </div>
              <button type="submit" disabled={salvando} className="px-4 py-2 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-black cursor-pointer self-end h-[38px]">
                + Adicionar ao Cronograma
              </button>
            </div>
          </form>

          <div className="space-y-2.5">
            {bundle.cronograma.map((c) => (
              <div key={c.id} className="bg-white border border-[#E2EAE5] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-[#087A5B] bg-[#E8F7F1] px-2 py-0.5 rounded-md">
                      {formatarDataBR(c.dataEvento)} • {c.horarioInicio}{c.horarioFim ? `–${c.horarioFim}` : ''}
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">{c.etapa} {c.local ? `• ${c.local}` : ''}</span>
                  </div>
                  <h4 className="text-sm font-black text-[#17221D]">{c.titulo}</h4>
                  {(c.resumoResultado || c.descricao) && (
                    <p className="text-xs text-slate-600">{c.resumoResultado || c.descricao}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  {(['PREVISTO', 'EM_ANDAMENTO', 'CONCLUIDO'] as StatusCronograma[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleMudarStatusCronograma(c.id, st)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer border ${
                        c.status === st
                          ? st === 'EM_ANDAMENTO'
                            ? 'bg-rose-600 text-white border-rose-600'
                            : st === 'CONCLUIDO'
                            ? 'bg-[#00A878] text-white border-[#00A878]'
                            : 'bg-[#17221D] text-white border-[#17221D]'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {st === 'EM_ANDAMENTO' ? 'Agora' : st === 'CONCLUIDO' ? 'Ocorreu' : 'Previsto'}
                    </button>
                  ))}
                  <button type="button" onClick={() => handleExcluir('cronograma', c.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-ABA 4: ARTILHARIA / RANKING DE GOLS POR MODALIDADE */}
      {/* ============================================================ */}
      {subAba === 'ARTILHARIA' && (
        <div className="space-y-6">
          <form onSubmit={handleAdicionarArtilheiro} className="bg-white border border-[#E2EAE5] rounded-2xl p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-black text-[#17221D]">Registrar Artilheiro / Gols por Modalidade</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Modalidade</label>
                <select value={artModCodigo} onChange={(e) => setArtModCodigo(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white">
                  {MODALIDADES_EVENTOS_OPCOES.map((m) => (
                    <option key={m.codigo} value={m.codigo}>{m.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Escola *</label>
                <select
                  value={artEscolaId}
                  onChange={(e) => {
                    setArtEscolaId(e.target.value);
                    setArtAtletaId('');
                  }}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                >
                  <option value="">Selecione a escola...</option>
                  {escolasOrdenadas.map((e) => (
                    <option key={e.id} value={e.id}>{e.nome} ({e.sigla})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Atleta Cadastrado (puxa foto 3×4!)</label>
                <select
                  value={artAtletaId}
                  onChange={(e) => setArtAtletaId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
                >
                  <option value="">Selecionar atleta ou digitar ao lado...</option>
                  {atletasDaEscolaArtilharia.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nomeCompleto} ({a.categoriaCalculada})
                    </option>
                  ))}
                </select>
              </div>
              {!artAtletaId && (
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Ou digite o nome do atleta</label>
                  <input
                    type="text"
                    value={artAtletaNomeLivre}
                    onChange={(e) => setArtAtletaNomeLivre(e.target.value)}
                    placeholder="Nome do estudante-atleta"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                </div>
              )}
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Gols / Pontos iniciais</label>
                <input
                  type="number"
                  min={1}
                  value={artGols}
                  onChange={(e) => setArtGols(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
              <button type="submit" disabled={salvando} className="px-4 py-2 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-black cursor-pointer self-end h-[38px]">
                + Adicionar à Artilharia
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {artilhariaAgrupada.map((grupo) => (
              <div key={grupo.modalidadeCodigo} className="bg-white border border-[#E2EAE5] rounded-2xl p-4 shadow-2xs space-y-3">
                <h4 className="text-sm font-black text-[#17221D] border-b border-slate-100 pb-2">
                  Artilharia • {grupo.modalidadeNome}
                </h4>
                <div className="space-y-2">
                  {grupo.ranking.map((art, idx) => (
                    <div key={art.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-[#17221D] text-white text-[11px] font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        {art.fotoUrl && (
                          <img src={art.fotoUrl} alt={art.atletaNome} className="w-8 h-8 rounded-full object-cover border border-[#00A878] shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-black text-[#17221D] truncate">{art.atletaNome}</p>
                          <p className="text-[10px] font-bold text-slate-500 truncate">{art.escolaSigla || art.escolaNome} • {art.categoria}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => EventosApi.atualizar('artilharia', art.id, { gols: Math.max(0, art.gols - 1) }).then(carregarDados)}
                          className="w-6 h-6 rounded-md bg-white border border-slate-200 text-xs font-black cursor-pointer"
                        >
                          -
                        </button>
                        <span className="px-2 py-0.5 rounded-md bg-[#E8F7F1] text-[#087A5B] text-xs font-black">
                          {art.gols}
                        </span>
                        <button
                          type="button"
                          onClick={() => EventosApi.atualizar('artilharia', art.id, { gols: art.gols + 1 }).then(carregarDados)}
                          className="w-6 h-6 rounded-md bg-[#00A878] text-white text-xs font-black cursor-pointer"
                        >
                          +
                        </button>
                        <button type="button" onClick={() => handleExcluir('artilharia', art.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded-md cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUB-ABA 5: PÓDIO JORNALÍSTICO, MEDALHAS & CHAMADAS DO TELÃO  */}
      {/* ============================================================ */}
      {subAba === 'MEDALHAS' && (
        <div className="space-y-6">
          {/* Lançador de Pódio Completo + Manchete Jornalística + Prévia Animada */}
          <LancadorPodioJornalistico
            municipioId={municipioId}
            escolas={escolas}
            atletas={atletas}
            onPublicado={carregarDados}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lançamento Avulso + Quadro Atual */}
            <div className="space-y-4">
              {quadroMedalhas.length > 0 && (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-2.5">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#0F2540]">
                    Quadro Geral de Medalhas
                  </h4>
                  {quadroMedalhas.map((q, i) => (
                    <div key={q.escolaId} className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-0">
                      <span className="font-bold text-[#0F2540]">{i + 1}º {q.escolaSigla}</span>
                      <span className="font-black space-x-2 tabular-nums">
                        <span>🥇 {q.ouro}</span>
                        <span>🥈 {q.prata}</span>
                        <span>🥉 {q.bronze}</span>
                        <span className="text-[#00A878]">({q.total})</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleLancarMedalha} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Lançamento Avulso (1 Medalha Isolada)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Escola Premiada *</label>
                    <select value={medEscolaId} onChange={(e) => setMedEscolaId(e.target.value)} required className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white">
                      <option value="">Selecione a escola...</option>
                      {escolasOrdenadas.map((e) => (
                        <option key={e.id} value={e.id}>{e.nome} ({e.sigla})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Medalha</label>
                    <select value={medTipo} onChange={(e) => setMedTipo(e.target.value as any)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white">
                      <option value="OURO">🥇 Ouro (1º Lugar)</option>
                      <option value="PRATA">🥈 Prata (2º Lugar)</option>
                      <option value="BRONZE">🥉 Bronze (3º Lugar)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Modalidade</label>
                    <select value={medModCodigo} onChange={(e) => setMedModCodigo(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white">
                      {MODALIDADES_EVENTOS_OPCOES.map((m) => (
                        <option key={m.codigo} value={m.codigo}>{m.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Categoria</label>
                    <select value={medCat} onChange={(e) => setMedCat(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white">
                      {CATEGORIAS_EVENTOS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Prova / Atleta (Opcional)</label>
                    <input type="text" value={medProva} onChange={(e) => setMedProva(e.target.value)} placeholder="Ex.: 100m Rasos" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold" />
                  </div>
                </div>
                <button type="submit" disabled={salvando} className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer">
                  + Registrar Medalha Avulsa
                </button>
              </form>
            </div>

          {/* Chamadas Rápidas para o Telão */}
          <div className="space-y-4">
            <form onSubmit={handleCriarAvisoTelao} className="bg-white border border-[#E2EAE5] rounded-2xl p-5 shadow-2xs space-y-3">
              <h3 className="text-sm font-black text-[#17221D] flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#00A878]" />
                <span>Chamadas de Quadra & Vinhetas de Vídeo (Mascotes) no Telão</span>
              </h3>
              <input
                type="text"
                required
                value={avisoTitulo}
                onChange={(e) => setAvisoTitulo(e.target.value)}
                placeholder={avisoTipo === 'VIDEO' ? 'Ex.: Vinheta Mascotes JEGDS 2026' : 'Ex.: CHAMADA DE QUADRA 01'}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
              />
              {avisoTipo === 'VIDEO' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={avisoMensagem}
                    onChange={(e) => setAvisoMensagem(e.target.value)}
                    placeholder="Caminho do vídeo (ex.: /VIDEOJEGDS.mp4 ou /videos/mascote.mp4)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setAvisoTitulo('Vinheta Oficial JEGDS 2026');
                        setAvisoMensagem('/VIDEOJEGDS.mp4');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 cursor-pointer"
                    >
                      Usar /VIDEOJEGDS.mp4
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAvisoTitulo('Vinheta Banner JEGDS');
                        setAvisoMensagem('/SEGUNDOVIDEODOBANNER.mp4');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 cursor-pointer"
                    >
                      Usar /SEGUNDOVIDEODOBANNER.mp4
                    </button>
                  </div>
                </div>
              ) : (
                <textarea
                  required
                  rows={2}
                  value={avisoMensagem}
                  onChange={(e) => setAvisoMensagem(e.target.value)}
                  placeholder="Ex.: Queimada Mirim (F) — Aldenora Araújo × José GD comparecer em 10 minutos!"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium"
                />
              )}
              <div className="flex items-center justify-between gap-2">
                <select value={avisoTipo} onChange={(e) => setAvisoTipo(e.target.value as any)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white">
                  <option value="CHAMADA">Chamada de Quadra (Ticker)</option>
                  <option value="INFORMATIVO">Informativo (Ticker)</option>
                  <option value="URGENTE">Urgente (Ticker)</option>
                  <option value="VIDEO">🎬 Vídeo / Vinheta Mascote (Slide Telão)</option>
                </select>
                <button type="submit" disabled={salvando} className="px-4 py-2 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-black cursor-pointer">
                  {avisoTipo === 'VIDEO' ? 'Ativar Vídeo no Telão' : 'Disparar no Telão'}
                </button>
              </div>
            </form>

            <div className="space-y-2">
              {bundle.avisos.map((av) => (
                <div key={av.id} className="bg-white border border-[#E2EAE5] rounded-xl p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-black uppercase text-[#087A5B]">{av.tipo} • {av.titulo}</span>
                    <p className="text-xs text-slate-700">{av.mensagem}</p>
                  </div>
                  <button type="button" onClick={() => handleExcluir('aviso', av.id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
