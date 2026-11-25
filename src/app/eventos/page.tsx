'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Newspaper,
  CalendarClock,
  Target,
  Medal,
  Tv,
  Clock,
  MapPin,
  Megaphone,
  Radio,
  RefreshCw,
  User,
  Users,
  Search,
  X,
  Share2,
  ArrowUpRight,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { EventosBundle, NoticiaEventoItem } from '@/types/eventos';
import {
  EventosApi,
  CRONOGRAMA_PADRAO_JEGDS,
  FASES_LABEL,
  calcularClassificacaoPorChave,
  calcularQuadroMedalhas,
  agruparArtilhariaPorModalidade,
  formatarDataBR,
} from '@/lib/eventos-service';
import {
  calcularClassificacaoXadrez,
  EstruturaXadrez,
  ProvaAtletismoBalizamento,
} from '@/lib/chaveamento-service';
import {
  CardPodioJornalistico,
  parsePodioConteudo,
} from '@/components/eventos/CardPodioJornalistico';

type AbaPublica = 'COBERTURA' | 'ATLETAS_DIA' | 'JOGOS' | 'TABELAS' | 'ARTILHARIA' | 'MEDALHAS';

interface EquipeModalInfo {
  escolaNome: string;
  escolaSigla: string;
  titulo: string;
  subtitulo: string;
  atletas: Array<{
    id: string;
    nomeCompleto: string;
    fotoUrl?: string | null;
    categoria: string;
    sexo: string;
    detalhe?: string;
  }>;
}

const ORDEM_CATEGORIAS: Record<string, number> = {
  MIRIM: 1,
  INFANTIL: 2,
  INFANTO: 3,
  JUNIOR: 4,
};

const ETAPAS_DIA_CONFIG = [
  { id: 'ETAPA1', label: '1ª Etapa (28/11)', sub: 'Queimada, Tênis de Mesa & Xadrez', codigos: ['queimada', 'tenis-mesa', 'xadrez'] },
  { id: 'ETAPA2', label: '2ª Etapa (05/12)', sub: 'Atletismo & Beach Soccer', codigos: ['atletismo', 'beach-soccer'] },
  { id: 'ETAPA3', label: '3ª Etapa (12/12)', sub: 'Futsal, Futebol & Vôlei', codigos: ['futsal', 'futebol-campo', 'voleibol'] },
  { id: 'TODAS', label: 'Todas as Etapas', sub: 'Todas as modalidades', codigos: [] as string[] },
] as const;

export default function EventosDoDiaPage() {
  const [aba, setAba] = useState<AbaPublica>('COBERTURA');
  const [filtroMod, setFiltroMod] = useState<string>('TODAS');
  const [filtroNoticiaTag, setFiltroNoticiaTag] = useState<string>('TODAS');
  const [etapaAtletas, setEtapaAtletas] = useState<string>('ETAPA1');
  const [buscaAtleta, setBuscaAtleta] = useState('');
  const [filtroEscolaAtleta, setFiltroEscolaAtleta] = useState('TODAS');
  const [filtroModAtleta, setFiltroModAtleta] = useState('TODAS');
  const [filtroCatAtleta, setFiltroCatAtleta] = useState('TODAS');
  const [noticiaAberta, setNoticiaAberta] = useState<NoticiaEventoItem | null>(null);
  const [equipeAberta, setEquipeAberta] = useState<EquipeModalInfo | null>(null);
  const [municipioId, setMunicipioId] = useState<string | undefined>(undefined);
  const [siglaEvento, setSiglaEvento] = useState('JEGDS 2026');
  const [isAdminSemed, setIsAdminSemed] = useState(false);
  const [bundle, setBundle] = useState<EventosBundle>({
    noticias: [],
    cronograma: [],
    partidas: [],
    artilharia: [],
    medalhas: [],
    avisos: [],
    updatedAt: '',
  });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    JegdStorage.init();
    setIsAdminSemed(JegdStorage.isAdminAuth());
    const mun = JegdStorage.getCurrentMunicipio();
    if (mun) {
      setMunicipioId(mun.id);
      setSiglaEvento(mun.siglaEvento || 'JEGDS 2026');
    }
  }, []);

  const carregar = useCallback(
    async (silencioso = false) => {
      try {
        if (!silencioso) setCarregando(true);
        const data = await EventosApi.carregar(municipioId);
        setBundle(data);
      } catch (err) {
        console.error('Erro ao buscar eventos:', err);
      } finally {
        if (!silencioso) setCarregando(false);
      }
    },
    [municipioId]
  );

  useEffect(() => {
    carregar(false);
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      carregar(true);
    }, 45000);
    return () => clearInterval(interval);
  }, [carregar]);

  const cronogramaExibicao = useMemo(() => {
    if (bundle.cronograma.length > 0) return bundle.cronograma;
    return CRONOGRAMA_PADRAO_JEGDS.map((c, idx) => ({ ...c, id: `padrao-${idx}` } as any));
  }, [bundle.cronograma]);

  const partidasAoVivo = useMemo(() => bundle.partidas.filter((p) => p.status === 'AO_VIVO'), [bundle.partidas]);
  const partidasFiltradas = useMemo(
    () =>
      filtroMod === 'TODAS'
        ? bundle.partidas
        : bundle.partidas.filter((p) => p.modalidadeCodigo === filtroMod || p.modalidadeNome === filtroMod),
    [bundle.partidas, filtroMod]
  );

  const classificacoes = useMemo(() => calcularClassificacaoPorChave(bundle.partidas), [bundle.partidas]);
  const mataMata = useMemo(() => bundle.partidas.filter((p) => p.fase !== 'GRUPOS'), [bundle.partidas]);
  const artilhariaAgrupada = useMemo(() => agruparArtilhariaPorModalidade(bundle.artilharia), [bundle.artilharia]);
  const quadroMedalhas = useMemo(() => calcularQuadroMedalhas(bundle.medalhas), [bundle.medalhas]);
  const avisosAtivos = useMemo(
    () => bundle.avisos.filter((a) => a.ativo && a.tipo !== 'VIDEO'),
    [bundle.avisos]
  );

  const modalidadesComJogos = useMemo(() => {
    const map = new Map<string, string>();
    bundle.partidas.forEach((p) => map.set(p.modalidadeCodigo, p.modalidadeNome));
    return Array.from(map.entries());
  }, [bundle.partidas]);

  const tagsNoticias = useMemo(() => {
    const set = new Set<string>();
    bundle.noticias.forEach((n) => {
      if (n.modalidadeNome?.trim()) set.add(n.modalidadeNome.trim());
    });
    return Array.from(set);
  }, [bundle.noticias]);

  const noticiasFiltradas = useMemo(() => {
    if (filtroNoticiaTag === 'TODAS') return bundle.noticias;
    return bundle.noticias.filter((n) => (n.modalidadeNome || '').trim() === filtroNoticiaTag);
  }, [bundle.noticias, filtroNoticiaTag]);

  const manchetePrincipal = noticiasFiltradas[0] || null;
  const demaisNoticias = noticiasFiltradas.slice(1);

  // Quadro de Atletas Participantes da Etapa / Dia
  const todosAtletasPublicos = bundle.atletasParticipantes || [];

  const etapaSelecionadaObj = useMemo(
    () => ETAPAS_DIA_CONFIG.find((e) => e.id === etapaAtletas) || ETAPAS_DIA_CONFIG[0],
    [etapaAtletas]
  );

  const escolasNoQuadro = useMemo(() => {
    const map = new Map<string, string>();
    todosAtletasPublicos.forEach((a) => map.set(a.escolaId, a.escolaSigla || a.escolaNome));
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));
  }, [todosAtletasPublicos]);

  const atletasDoDiaFiltrados = useMemo(() => {
    const codsEtapa = etapaSelecionadaObj.codigos;
    const termo = buscaAtleta.trim().toLowerCase();

    return todosAtletasPublicos
      .map((a) => {
        const modsNaEtapa =
          codsEtapa.length === 0
            ? a.modalidades
            : a.modalidades.filter((m) => (codsEtapa as readonly string[]).includes(m.codigo));
        return { ...a, modsNaEtapa };
      })
      .filter((a) => {
        if (a.modsNaEtapa.length === 0) return false;
        if (filtroEscolaAtleta !== 'TODAS' && a.escolaId !== filtroEscolaAtleta) return false;
        if (filtroCatAtleta !== 'TODAS' && a.categoria !== filtroCatAtleta) return false;
        if (filtroModAtleta !== 'TODAS' && !a.modsNaEtapa.some((m) => m.codigo === filtroModAtleta)) return false;
        if (termo) {
          const bateNome = a.nomeCompleto.toLowerCase().includes(termo);
          const bateEsc = a.escolaNome.toLowerCase().includes(termo) || a.escolaSigla.toLowerCase().includes(termo);
          const bateMod = a.modsNaEtapa.some((m) => m.nome.toLowerCase().includes(termo));
          if (!bateNome && !bateEsc && !bateMod) return false;
        }
        return true;
      });
  }, [todosAtletasPublicos, etapaSelecionadaObj, buscaAtleta, filtroEscolaAtleta, filtroModAtleta, filtroCatAtleta]);

  const escolasComEquipes = useMemo(() => {
    type AtletaEquipe = {
      id: string;
      nomeCompleto: string;
      fotoUrl?: string | null;
      categoria: string;
      sexo: string;
      provas: string[];
    };
    type EquipeGrupo = {
      chave: string;
      modalidadeCodigo: string;
      modalidadeNome: string;
      categoria: string;
      sexo: string;
      atletas: AtletaEquipe[];
    };
    type EscolaGrupo = {
      escolaId: string;
      escolaNome: string;
      escolaSigla: string;
      atletasUnicos: typeof atletasDoDiaFiltrados;
      equipesMap: Map<string, EquipeGrupo>;
    };

    const map = new Map<string, EscolaGrupo>();

    atletasDoDiaFiltrados.forEach((a) => {
      if (!map.has(a.escolaId)) {
        map.set(a.escolaId, {
          escolaId: a.escolaId,
          escolaNome: a.escolaNome,
          escolaSigla: a.escolaSigla,
          atletasUnicos: [],
          equipesMap: new Map(),
        });
      }
      const esc = map.get(a.escolaId)!;
      esc.atletasUnicos.push(a);

      a.modsNaEtapa.forEach((m) => {
        if (filtroModAtleta !== 'TODAS' && m.codigo !== filtroModAtleta) return;
        const chave = `${m.codigo}|${a.categoria}|${a.sexo}`;
        if (!esc.equipesMap.has(chave)) {
          esc.equipesMap.set(chave, {
            chave,
            modalidadeCodigo: m.codigo,
            modalidadeNome: m.nome,
            categoria: a.categoria,
            sexo: a.sexo,
            atletas: [],
          });
        }
        esc.equipesMap.get(chave)!.atletas.push({
          id: a.id,
          nomeCompleto: a.nomeCompleto,
          fotoUrl: a.fotoUrl,
          categoria: a.categoria,
          sexo: a.sexo,
          provas: m.provas,
        });
      });
    });

    return Array.from(map.values())
      .map((esc) => ({
        escolaId: esc.escolaId,
        escolaNome: esc.escolaNome,
        escolaSigla: esc.escolaSigla,
        atletasUnicos: esc.atletasUnicos.sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto, 'pt-BR')),
        equipes: Array.from(esc.equipesMap.values())
          .map((eq) => ({
            ...eq,
            atletas: eq.atletas.sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto, 'pt-BR')),
          }))
          .sort((a, b) => {
            const cmpMod = a.modalidadeNome.localeCompare(b.modalidadeNome, 'pt-BR');
            if (cmpMod !== 0) return cmpMod;
            const cmpCat = (ORDEM_CATEGORIAS[a.categoria] || 9) - (ORDEM_CATEGORIAS[b.categoria] || 9);
            if (cmpCat !== 0) return cmpCat;
            return a.sexo.localeCompare(b.sexo);
          }),
      }))
      .sort((a, b) => a.escolaNome.localeCompare(b.escolaNome, 'pt-BR'));
  }, [atletasDoDiaFiltrados, filtroModAtleta]);

  const totalEquipesNoQuadro = useMemo(
    () => escolasComEquipes.reduce((acc, esc) => acc + esc.equipes.length, 0),
    [escolasComEquipes]
  );

  const handleCompartilharWhatsApp = (n: NoticiaEventoItem) => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const texto = `🏆 *${n.titulo}*\n${n.resumo}\n\nAcompanhe os ${siglaEvento} ao vivo:\n${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 w-full">
      {/* ============================================================ */}
      {/* TOPO SLIM E DIRETO (SEM CARD PESADO EMPURRANDO O CONTEÚDO) */}
      {/* ============================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#087A5B]">
            <span className="inline-flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${partidasAoVivo.length > 0 ? 'bg-rose-600 animate-ping' : 'bg-[#00A878]'}`} />
              <span>{partidasAoVivo.length > 0 ? `${partidasAoVivo.length} jogo(s) ao vivo agora` : `Cobertura Oficial • ${siglaEvento}`}</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#17221D] tracking-tight">
            Eventos do Dia
          </h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => carregar(false)}
            className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 border border-[#E2EAE5] text-slate-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Atualizar dados agora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          {/* Exclusivo da Coordenação SEMED (Elias / Herbert) */}
          {isAdminSemed && (
            <Link
              href="/eventos/telao"
              target="_blank"
              className="px-4 py-2 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold flex items-center gap-2 shadow-2xs transition-colors"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Modo Telão</span>
            </Link>
          )}
        </div>
      </div>

      {/* AVISO URGENTE / CHAMADA DE QUADRA (SÓ QUANDO EXISTIR) */}
      {avisosAtivos.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-xl px-4 py-2.5 flex items-start sm:items-center gap-2.5 text-xs sm:text-sm text-amber-950">
          <Megaphone className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
          <div className="space-y-0.5">
            {avisosAtivos.slice(0, 2).map((av) => (
              <p key={av.id}>
                <strong className="font-bold uppercase">{av.titulo}:</strong> {av.mensagem}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* JOGOS AO VIVO (APARECE NO TOPO AUTOMATICAMENTE QUANDO HOUVER PARTIDA EM ANDAMENTO) */}
      {partidasAoVivo.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {partidasAoVivo.map((p) => (
            <div key={p.id} className="bg-white border border-rose-300 rounded-2xl p-4 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-600 uppercase">
                  {p.modalidadeNome} • {p.categoria}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                  <Radio className="w-3 h-3 animate-pulse" /> AO VIVO
                </span>
              </div>
              <div className="grid grid-cols-7 items-center text-center bg-[#F7F9F8] rounded-xl py-2.5 px-2">
                <div className="col-span-3 font-bold text-xs sm:text-sm text-[#17221D] truncate px-1">{p.escolaASigla || p.escolaANome}</div>
                <div className="col-span-1 text-xl font-black text-rose-600">{p.placarA}×{p.placarB}</div>
                <div className="col-span-3 font-bold text-xs sm:text-sm text-[#17221D] truncate px-1">{p.escolaBSigla || p.escolaBNome}</div>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>{p.grupo || FASES_LABEL[p.fase] || p.fase}</span>
                <span>{p.local || 'Quadra Oficial'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NAVEGAÇÃO LIMPA POR ABAS (SEM CONTADORES ZERO) */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-[#E2EAE5]">
        {(
          [
            { id: 'COBERTURA', label: 'Notícias & Cronograma', icon: Newspaper, count: 0 },
            { id: 'ATLETAS_DIA', label: 'Atletas de Hoje', icon: Users, count: atletasDoDiaFiltrados.length },
            { id: 'JOGOS', label: 'Jogos & Placares', icon: Trophy, count: bundle.partidas.length },
            { id: 'TABELAS', label: 'Tabelas & Chaveamento', icon: CalendarClock, count: 0 },
            { id: 'ARTILHARIA', label: 'Artilharia', icon: Target, count: bundle.artilharia.length },
            { id: 'MEDALHAS', label: 'Quadro de Medalhas', icon: Medal, count: bundle.medalhas.length },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const ativo = aba === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAba(tab.id)}
              className={`px-3.5 py-2.5 text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                ativo
                  ? 'border-[#00A878] text-[#087A5B]'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${ativo ? 'bg-[#E8F7F1] text-[#087A5B]' : 'bg-slate-100 text-slate-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* ABA 1: PORTAL DE NOTÍCIAS CLEAN (2/3) + LINHA DO TEMPO (1/3) */}
      {/* ============================================================ */}
      {aba === 'COBERTURA' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* COLUNA PRINCIPAL — NOTÍCIAS & DESTAQUES (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {/* Filtro rápido de assunto/modalidade (só aparece se houver 2+ assuntos) */}
            {tagsNoticias.length > 1 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFiltroNoticiaTag('TODAS')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    filtroNoticiaTag === 'TODAS'
                      ? 'bg-[#17221D] text-white'
                      : 'bg-white border border-[#E2EAE5] text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Todas
                </button>
                {tagsNoticias.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setFiltroNoticiaTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                      filtroNoticiaTag === tag
                        ? 'bg-[#00A878] text-white'
                        : 'bg-white border border-[#E2EAE5] text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}

            {/* MANCHETE PRINCIPAL EDITORIAL (OU PÓDIO JORNALÍSTICO ANIMADO) */}
            {manchetePrincipal ? (
              (() => {
                const podioManchete = parsePodioConteudo(manchetePrincipal.conteudo);
                if (podioManchete) {
                  return (
                    <CardPodioJornalistico
                      dados={podioManchete}
                      modo="PORTAL"
                      onClick={() => setNoticiaAberta(manchetePrincipal)}
                    />
                  );
                }
                return (
              <article
                onClick={() => setNoticiaAberta(manchetePrincipal)}
                className="group bg-white border border-[#E2EAE5] hover:border-[#00A878]/50 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer grid grid-cols-1 md:grid-cols-12"
              >
                {manchetePrincipal.imagemUrl && (
                  <div className="md:col-span-6 aspect-[16/10] md:aspect-auto md:min-h-[280px] bg-slate-100 overflow-hidden">
                    <img
                      src={manchetePrincipal.imagemUrl}
                      alt={manchetePrincipal.titulo}
                      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    />
                  </div>
                )}
                <div className={`${manchetePrincipal.imagemUrl ? 'md:col-span-6' : 'md:col-span-12'} p-6 flex flex-col justify-between gap-4`}>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-[#087A5B] uppercase tracking-wider">
                      <span>{manchetePrincipal.modalidadeNome || 'Destaque'}</span>
                      {manchetePrincipal.horarioOcorrencia && (
                        <>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 font-semibold normal-case">{manchetePrincipal.horarioOcorrencia}</span>
                        </>
                      )}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-[#17221D] leading-snug group-hover:text-[#087A5B] transition-colors">
                      {manchetePrincipal.titulo}
                    </h2>
                    <p className="text-sm text-[#4B5563] leading-relaxed line-clamp-3">
                      {manchetePrincipal.resumo}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                    <span className="text-slate-400 font-medium truncate">
                      {manchetePrincipal.local || siglaEvento}
                    </span>
                    <span className="font-bold text-[#087A5B] inline-flex items-center gap-1 shrink-0">
                      Ler matéria <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </article>
                );
              })()
            ) : (
              /* Estado Inicial Elegante (sem card duplicado nem placeholder vazio feio) */
              <div className="bg-white border border-[#E2EAE5] rounded-2xl p-6 sm:p-8 shadow-2xs space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#087A5B]">
                  <span className="w-2 h-2 rounded-full bg-[#00A878]" />
                  <span>Próximo Marco Oficial • {siglaEvento}</span>
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black text-[#17221D]">
                    {cronogramaExibicao[0]?.titulo || `Cobertura Oficial ${siglaEvento}`}
                  </h2>
                  <p className="text-sm text-[#4B5563] leading-relaxed max-w-2xl">
                    {cronogramaExibicao[0]?.descricao ||
                      'Acompanhe aqui os boletins com fotos, resultados das provas, jogos ao vivo e destaques de cada etapa dos Jogos Escolares.'}
                  </p>
                </div>
                {cronogramaExibicao[0] && (
                  <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-semibold text-slate-500 border-t border-slate-100">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#00A878]" />
                      {formatarDataBR(cronogramaExibicao[0].dataEvento)} às {cronogramaExibicao[0].horarioInicio}
                    </span>
                    {cronogramaExibicao[0].local && (
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#00A878]" />
                        {cronogramaExibicao[0].local}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* GRADE CLEAN DAS DEMAIS NOTÍCIAS */}
            {demaisNoticias.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {demaisNoticias.map((n) => (
                  <article
                    key={n.id}
                    onClick={() => setNoticiaAberta(n)}
                    className="group bg-white border border-[#E2EAE5] hover:border-[#00A878]/50 rounded-2xl overflow-hidden shadow-2xs hover:shadow-sm transition-all cursor-pointer flex flex-col"
                  >
                    {n.imagemUrl && (
                      <div className="aspect-[16/10] bg-slate-100 overflow-hidden">
                        <img
                          src={n.imagemUrl}
                          alt={n.titulo}
                          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                        />
                      </div>
                    )}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#087A5B] uppercase tracking-wide">
                          <span>{n.modalidadeNome || 'Boletim'}</span>
                          {n.horarioOcorrencia && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="text-slate-400 font-medium normal-case">{n.horarioOcorrencia}</span>
                            </>
                          )}
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-[#17221D] leading-snug line-clamp-2 group-hover:text-[#087A5B] transition-colors">
                          {n.titulo}
                        </h3>
                        <p className="text-xs text-[#68756E] leading-relaxed line-clamp-2">{n.resumo}</p>
                      </div>
                      <span className="text-[11px] font-bold text-[#087A5B] inline-flex items-center gap-1">
                        Ler mais <ArrowUpRight className="w-3 h-3" />
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* COLUNA LATERAL — LINHA DO TEMPO CLEAN (4 cols) */}
          <aside className="lg:col-span-4 space-y-5">
            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-[#17221D] uppercase tracking-wider flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-[#00A878]" />
                  <span>Cronograma</span>
                </h2>
                <span className="text-[11px] font-semibold text-slate-400">{siglaEvento}</span>
              </div>

              {/* Timeline vertical minimalista */}
              <ol className="relative border-l border-[#E2EAE5] ml-2 space-y-4">
                {cronogramaExibicao.map((item: any) => {
                  const isAgora = item.status === 'EM_ANDAMENTO';
                  const isFeito = item.status === 'CONCLUIDO';
                  return (
                    <li key={item.id} className="pl-5 relative">
                      <span
                        className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                          isAgora ? 'bg-rose-600 animate-pulse' : isFeito ? 'bg-[#00A878]' : 'bg-slate-300'
                        }`}
                      />
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-bold text-slate-500">
                          {formatarDataBR(item.dataEvento)} • {item.horarioInicio}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase ${
                            isAgora ? 'text-rose-600' : isFeito ? 'text-[#087A5B]' : 'text-slate-400'
                          }`}
                        >
                          {isAgora ? 'Agora' : isFeito ? 'Ocorreu' : 'Previsto'}
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-[#17221D] mt-0.5 leading-snug">
                        {item.titulo}
                      </h3>
                      {item.local && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.local}</p>
                      )}
                      {item.resumoResultado && (
                        <p className="text-xs text-[#087A5B] font-medium mt-1 leading-snug">
                          {item.resumoResultado}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Mini-card de Medalhas (só aparece quando já há medalhas lançadas) */}
            {quadroMedalhas.length > 0 && (
              <div className="bg-white border border-[#E2EAE5] rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#17221D] flex items-center gap-1.5">
                    <Medal className="w-4 h-4 text-amber-500" />
                    <span>Top Medalhas</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setAba('MEDALHAS')}
                    className="text-[11px] font-bold text-[#087A5B] hover:underline cursor-pointer"
                  >
                    Ver quadro →
                  </button>
                </div>
                <div className="space-y-2">
                  {quadroMedalhas.slice(0, 3).map((q, idx) => (
                    <div key={q.escolaId} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                      <span className="font-bold text-[#17221D] truncate pr-2">{idx + 1}º {q.escolaSigla}</span>
                      <span className="font-bold shrink-0 space-x-1.5">
                        <span>🥇{q.ouro}</span>
                        <span>🥈{q.prata}</span>
                        <span>🥉{q.bronze}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ============================================================ */}
      {/* ABA: QUADRO DE ATLETAS DE HOJE (QUEM VAI PARA QUAL EVENTO) */}
      {/* ============================================================ */}
      {aba === 'ATLETAS_DIA' && (
        <div className="space-y-5">
          {/* Seletor de Etapa do Calendário */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {ETAPAS_DIA_CONFIG.map((et) => {
              const ativa = etapaAtletas === et.id;
              return (
                <button
                  key={et.id}
                  type="button"
                  onClick={() => {
                    setEtapaAtletas(et.id);
                    setFiltroModAtleta('TODAS');
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    ativa
                      ? 'bg-[#E8F7F1] border-[#00A878] shadow-2xs'
                      : 'bg-white border-[#E2EAE5] hover:bg-slate-50'
                  }`}
                >
                  <span className={`text-xs font-black block ${ativa ? 'text-[#087A5B]' : 'text-[#17221D]'}`}>
                    {et.label}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5 truncate">{et.sub}</span>
                </button>
              );
            })}
          </div>

          {/* Barra de Busca e Filtros */}
          <div className="bg-white border border-[#E2EAE5] rounded-2xl p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 shadow-2xs">
            <div className="lg:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={buscaAtleta}
                onChange={(e) => setBuscaAtleta(e.target.value)}
                placeholder="Buscar por nome do aluno ou escola..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-medium text-[#17221D] focus:outline-none focus:border-[#00A878] focus:bg-white"
              />
            </div>

            <select
              value={filtroEscolaAtleta}
              onChange={(e) => setFiltroEscolaAtleta(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#00A878]"
            >
              <option value="TODAS">Todas as Escolas</option>
              {escolasNoQuadro.map(([id, sigla]) => (
                <option key={id} value={id}>{sigla}</option>
              ))}
            </select>

            <select
              value={filtroModAtleta}
              onChange={(e) => setFiltroModAtleta(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#00A878]"
            >
              <option value="TODAS">Todas Modalidades</option>
              {(etapaSelecionadaObj.codigos.length > 0
                ? etapaSelecionadaObj.codigos
                : ['queimada', 'tenis-mesa', 'xadrez', 'atletismo', 'beach-soccer', 'futsal', 'futebol-campo', 'voleibol']
              ).map((cod) => (
                <option key={cod} value={cod}>
                  {cod.replace('-', ' ').toUpperCase()}
                </option>
              ))}
            </select>

            <select
              value={filtroCatAtleta}
              onChange={(e) => setFiltroCatAtleta(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#00A878]"
            >
              <option value="TODAS">Todas Faixas Etárias</option>
              <option value="MIRIM">Mirim (9–11)</option>
              <option value="INFANTIL">Infantil (12–14)</option>
              <option value="INFANTO">Infanto (15–17)</option>
              <option value="JUNIOR">Júnior (18–20)</option>
            </select>
          </div>

          {/* Resumo Compacto */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 px-1">
            <span>
              <strong className="text-[#17221D]">{escolasComEquipes.length}</strong>{' '}
              {escolasComEquipes.length === 1 ? 'escola' : 'escolas'} •{' '}
              <strong className="text-[#17221D]">{totalEquipesNoQuadro}</strong>{' '}
              {totalEquipesNoQuadro === 1 ? 'equipe' : 'equipes'} •{' '}
              <strong className="text-[#087A5B]">{atletasDoDiaFiltrados.length}</strong>{' '}
              {atletasDoDiaFiltrados.length === 1 ? 'atleta' : 'atletas'}
            </span>
            <span className="text-[11px] text-slate-400">
              Clique em uma equipe para ver os atletas escalados
            </span>
          </div>

          {/* Grade de Cards de Equipes por Escola */}
          {escolasComEquipes.length === 0 ? (
            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-10 text-center text-sm text-slate-500">
              Nenhuma equipe ou atleta encontrado para os filtros selecionados nesta etapa.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {escolasComEquipes.map((escola) => {
                const buscando = buscaAtleta.trim().length > 0;
                return (
                  <div
                    key={escola.escolaId}
                    className="bg-white border border-[#E2EAE5] rounded-2xl overflow-hidden shadow-2xs flex flex-col justify-between hover:border-[#00A878]/50 transition-colors"
                  >
                    <div>
                      {/* Cabeçalho do Card da Escola */}
                      <div className="px-4 py-3.5 bg-[#F7F9F8] border-b border-[#E2EAE5] flex items-start justify-between gap-2">
                        <div className="min-w-0 flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-[#E8F7F1] border border-[#00A878]/20 flex items-center justify-center text-[#087A5B] shrink-0 mt-0.5">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-black text-[#17221D] leading-snug line-clamp-2">
                              {escola.escolaNome}
                            </h3>
                            <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                              {escola.equipes.length} {escola.equipes.length === 1 ? 'equipe' : 'equipes'} •{' '}
                              {escola.atletasUnicos.length} {escola.atletasUnicos.length === 1 ? 'atleta' : 'atletas'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Lista Compacta de Equipes da Escola */}
                      <div className="p-3 space-y-1.5">
                        {escola.equipes.map((eq) => (
                          <button
                            key={eq.chave}
                            type="button"
                            onClick={() =>
                              setEquipeAberta({
                                escolaNome: escola.escolaNome,
                                escolaSigla: escola.escolaSigla,
                                titulo: `${eq.modalidadeNome} • ${eq.categoria}`,
                                subtitulo: `${eq.sexo === 'FEMININO' ? 'Feminino' : 'Masculino'} • ${eq.atletas.length} ${
                                  eq.atletas.length === 1 ? 'atleta escalado' : 'atletas escalados'
                                }`,
                                atletas: eq.atletas.map((a) => ({
                                  id: a.id,
                                  nomeCompleto: a.nomeCompleto,
                                  fotoUrl: a.fotoUrl,
                                  categoria: a.categoria,
                                  sexo: a.sexo,
                                  detalhe: a.provas.length > 0 ? a.provas.join(', ') : undefined,
                                })),
                              })
                            }
                            className="w-full px-3 py-2 rounded-xl bg-[#F7F9F8] hover:bg-[#E8F7F1] border border-transparent hover:border-[#00A878]/30 flex items-center justify-between gap-2 text-left transition-all cursor-pointer group"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-[#17221D] group-hover:text-[#087A5B] truncate">
                                  {eq.modalidadeNome}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold text-slate-600">
                                  {eq.categoria}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                                    eq.sexo === 'FEMININO'
                                      ? 'bg-rose-50 text-rose-700'
                                      : 'bg-sky-50 text-sky-700'
                                  }`}
                                >
                                  {eq.sexo === 'FEMININO' ? 'F' : 'M'}
                                </span>
                              </div>
                            </div>

                            {/* Mini Avatares Empilhados + Contador */}
                            <div className="flex items-center gap-2 shrink-0">
                              <div className="hidden sm:flex -space-x-1.5">
                                {eq.atletas.slice(0, 3).map((atl) =>
                                  atl.fotoUrl ? (
                                    <img
                                      key={atl.id}
                                      src={atl.fotoUrl}
                                      alt=""
                                      className="w-5 h-5 rounded-full object-cover ring-2 ring-white"
                                    />
                                  ) : (
                                    <span
                                      key={atl.id}
                                      className="w-5 h-5 rounded-full bg-slate-200 ring-2 ring-white flex items-center justify-center text-[9px] font-bold text-slate-500"
                                    >
                                      {atl.nomeCompleto.charAt(0)}
                                    </span>
                                  )
                                )}
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-white border border-[#E2EAE5] text-[11px] font-black text-[#087A5B]">
                                {eq.atletas.length}
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#087A5B] group-hover:translate-x-0.5 transition-transform" />
                            </div>
                          </button>
                        ))}
                      </div>

                      {/* Quando o usuário pesquisa por nome, mostra o(s) atleta(s) encontrados direto no card */}
                      {buscando && (
                        <div className="mx-3 mb-3 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                          <p className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                            Encontrados na busca ({escola.atletasUnicos.length})
                          </p>
                          {escola.atletasUnicos.slice(0, 5).map((atl) => (
                            <div key={atl.id} className="flex items-center justify-between gap-2 text-xs">
                              <span className="font-bold text-[#17221D] truncate">{atl.nomeCompleto}</span>
                              <span className="text-[10px] font-semibold text-amber-900 shrink-0">
                                {atl.modsNaEtapa.map((m) => m.nome).join(', ')}
                              </span>
                            </div>
                          ))}
                          {escola.atletasUnicos.length > 5 && (
                            <p className="text-[10px] font-semibold text-amber-700">
                              + {escola.atletasUnicos.length - 5} atleta(s) — clique abaixo para ver todos
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Rodapé do Card — Ver Delegação Completa */}
                    <div className="px-3 py-2.5 border-t border-slate-100 bg-white">
                      <button
                        type="button"
                        onClick={() =>
                          setEquipeAberta({
                            escolaNome: escola.escolaNome,
                            escolaSigla: escola.escolaSigla,
                            titulo: 'Delegação Completa',
                            subtitulo: `${etapaSelecionadaObj.label} • ${escola.atletasUnicos.length} ${
                              escola.atletasUnicos.length === 1 ? 'atleta' : 'atletas'
                            }`,
                            atletas: escola.atletasUnicos.map((a) => ({
                              id: a.id,
                              nomeCompleto: a.nomeCompleto,
                              fotoUrl: a.fotoUrl,
                              categoria: a.categoria,
                              sexo: a.sexo,
                              detalhe: a.modsNaEtapa
                                .map((m) => (m.provas.length > 0 ? `${m.nome} (${m.provas.join(', ')})` : m.nome))
                                .join(' • '),
                            })),
                          })
                        }
                        className="w-full py-1.5 rounded-lg text-xs font-bold text-[#087A5B] hover:bg-[#E8F7F1] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Ver todos os {escola.atletasUnicos.length} atletas da escola</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* ABA 2: JOGOS & PLACARES */}
      {/* ============================================================ */}
      {aba === 'JOGOS' && (
        <div className="space-y-5">
          {modalidadesComJogos.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setFiltroMod('TODAS')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                  filtroMod === 'TODAS' ? 'bg-[#17221D] text-white border-[#17221D]' : 'bg-white text-slate-600 border-[#E2EAE5]'
                }`}
              >
                Todas
              </button>
              {modalidadesComJogos.map(([cod, nome]) => (
                <button
                  key={cod}
                  type="button"
                  onClick={() => setFiltroMod(cod)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                    filtroMod === cod ? 'bg-[#00A878] text-white border-[#00A878]' : 'bg-white text-slate-600 border-[#E2EAE5]'
                  }`}
                >
                  {nome}
                </button>
              ))}
            </div>
          )}

          {partidasFiltradas.length === 0 ? (
            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-10 text-center text-sm text-slate-500">
              Nenhuma partida cadastrada ainda.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partidasFiltradas.map((p) => (
                <div key={p.id} className="bg-white border border-[#E2EAE5] rounded-2xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[#087A5B] uppercase">
                      {p.modalidadeNome} • {p.categoria} ({p.sexo === 'FEMININO' ? 'F' : 'M'})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        p.status === 'AO_VIVO'
                          ? 'bg-rose-600 text-white'
                          : p.status === 'ENCERRADO'
                          ? 'bg-[#E8F7F1] text-[#087A5B]'
                          : p.status === 'WO'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {p.status === 'AO_VIVO' ? '● AO VIVO' : p.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-7 items-center text-center bg-[#F7F9F8] rounded-xl py-3 px-2">
                    <div className={`col-span-3 text-xs font-bold truncate px-1 ${p.vencedorEscolaId === p.escolaAId ? 'text-[#087A5B] font-black' : 'text-[#17221D]'}`}>
                      {p.escolaASigla || p.escolaANome}
                    </div>
                    <div className="col-span-1 text-lg font-black text-[#17221D]">
                      {p.status === 'AGENDADO' ? '×' : `${p.placarA}×${p.placarB}`}
                    </div>
                    <div className={`col-span-3 text-xs font-bold truncate px-1 ${p.vencedorEscolaId === p.escolaBId ? 'text-[#087A5B] font-black' : 'text-[#17221D]'}`}>
                      {p.escolaBSigla || p.escolaBNome}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{formatarDataBR(p.dataEvento)} às {p.horario}</span>
                    <span>{p.grupo || FASES_LABEL[p.fase] || p.fase}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* ABA 3: TABELAS DE GRUPOS & CHAVEAMENTO */}
      {/* ============================================================ */}
      {aba === 'TABELAS' && (
        <div className="space-y-8">
          {classificacoes.length === 0 && mataMata.length === 0 && (!bundle.chaveamentos || bundle.chaveamentos.length === 0) ? (
            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-10 text-center text-sm text-slate-500">
              As tabelas de classificação e chaveamentos aparecem automaticamente conforme os jogos são cadastrados.
            </div>
          ) : (
            <>
              {classificacoes.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {classificacoes.map((tab) => (
                    <div key={tab.chave} className="bg-white border border-[#E2EAE5] rounded-2xl overflow-hidden shadow-2xs">
                      <div className="px-5 py-3.5 bg-[#F7F9F8] border-b border-[#E2EAE5] flex items-center justify-between">
                        <h3 className="text-sm font-bold text-[#17221D]">
                          {tab.modalidadeNome} • {tab.categoria} ({tab.sexo === 'FEMININO' ? 'F' : 'M'})
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-md bg-[#E8F7F1] text-[#087A5B] text-xs font-bold">
                          {tab.grupo}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3">#</th>
                              <th className="py-2.5 px-3">Escola</th>
                              <th className="py-2.5 px-2 text-center">J</th>
                              <th className="py-2.5 px-2 text-center">V</th>
                              <th className="py-2.5 px-2 text-center">E</th>
                              <th className="py-2.5 px-2 text-center">D</th>
                              <th className="py-2.5 px-2 text-center">SG</th>
                              <th className="py-2.5 px-3 text-center text-[#087A5B]">PTS</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {tab.linhas.map((l, i) => (
                              <tr key={l.escolaId} className={i < 2 ? 'bg-emerald-50/30' : ''}>
                                <td className="py-2.5 px-3 font-bold text-slate-500">{i + 1}º</td>
                                <td className="py-2.5 px-3 font-bold text-[#17221D]">{l.escolaSigla}</td>
                                <td className="py-2.5 px-2 text-center">{l.jogos}</td>
                                <td className="py-2.5 px-2 text-center font-semibold text-[#087A5B]">{l.vitorias}</td>
                                <td className="py-2.5 px-2 text-center">{l.empates}</td>
                                <td className="py-2.5 px-2 text-center">{l.derrotas}</td>
                                <td className="py-2.5 px-2 text-center">{l.saldo}</td>
                                <td className="py-2.5 px-3 text-center font-black text-[#087A5B]">{l.pontos}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {mataMata.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-base font-black text-[#17221D]">Fases Eliminatórias</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mataMata.map((p) => (
                      <div key={p.id} className="bg-white border border-[#E2EAE5] rounded-2xl p-4 space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-[#8B1D2C] uppercase">{FASES_LABEL[p.fase] || p.fase}</span>
                          <span className="text-slate-400 font-semibold">{p.modalidadeNome} • {p.categoria}</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${p.vencedorEscolaId === p.escolaAId ? 'bg-[#E8F7F1] border-[#00A878]/30 font-black' : 'bg-[#F7F9F8] border-transparent font-semibold'}`}>
                            <span className="text-xs truncate">{p.escolaASigla || p.escolaANome}</span>
                            <span className="text-sm font-black">{p.status === 'AGENDADO' ? '-' : p.placarA}</span>
                          </div>
                          <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${p.vencedorEscolaId === p.escolaBId ? 'bg-[#E8F7F1] border-[#00A878]/30 font-black' : 'bg-[#F7F9F8] border-transparent font-semibold'}`}>
                            <span className="text-xs truncate">{p.escolaBSigla || p.escolaBNome}</span>
                            <span className="text-sm font-black">{p.status === 'AGENDADO' ? '-' : p.placarB}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Balizamento de Atletismo e Torneios de Xadrez publicados */}
              {(bundle.chaveamentos || [])
                .filter((c) => c.formato === 'BALIZAMENTO_ATLETISMO' || c.formato === 'SUICO_XADREZ')
                .map((ch) => {
                  let est: any = null;
                  try {
                    est = ch.estruturaJson ? JSON.parse(ch.estruturaJson) : null;
                  } catch {
                    est = null;
                  }
                  if (!est) return null;

                  if (ch.formato === 'BALIZAMENTO_ATLETISMO' && Array.isArray(est.provas)) {
                    return (
                      <div key={ch.id} className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <h3 className="text-base font-black text-[#17221D]">
                            Balizamento Oficial • {ch.modalidadeNome} ({ch.categoria} • {ch.sexo})
                          </h3>
                          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#E8F7F1] text-[#087A5B] font-bold">
                            {ch.status} • Seed {ch.seed}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {(est.provas as ProvaAtletismoBalizamento[]).map((pr) => (
                            <div key={pr.prova} className="bg-white border border-[#E2EAE5] rounded-2xl overflow-hidden shadow-2xs">
                              <div className="px-4 py-2.5 bg-[#F7F9F8] border-b border-[#E2EAE5] font-bold text-xs text-[#087A5B] uppercase">
                                {pr.prova}
                              </div>
                              <div className="p-3 space-y-2.5">
                                {pr.series.map((s) => (
                                  <div key={s.numero} className="space-y-1">
                                    <p className="text-[11px] font-bold text-slate-500">{s.nome}</p>
                                    {s.raias.map((r) => (
                                      <div key={r.raia} className="flex items-center justify-between text-xs py-1 border-b border-slate-100 last:border-0">
                                        <span>
                                          <strong className="text-[#087A5B] mr-1.5">R{r.raia}</strong>
                                          <span className="font-semibold text-[#17221D]">{r.atletaNome}</span>{' '}
                                          <span className="text-slate-400">({r.escolaSigla})</span>
                                        </span>
                                        <span className="font-mono font-bold text-slate-700">
                                          {r.posicao ? `${r.posicao}º ` : ''}
                                          {r.marca || '-'}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (ch.formato === 'SUICO_XADREZ' && est.rodadas) {
                    const classifXadrez = calcularClassificacaoXadrez(est as EstruturaXadrez);
                    return (
                      <div key={ch.id} className="bg-white border border-[#E2EAE5] rounded-2xl overflow-hidden shadow-2xs">
                        <div className="px-5 py-3.5 bg-[#F7F9F8] border-b border-[#E2EAE5] flex items-center justify-between flex-wrap gap-2">
                          <h3 className="text-sm font-bold text-[#17221D]">
                            Xadrez ({est.sistema}) • {ch.categoria} ({ch.sexo === 'FEMININO' ? 'F' : 'M'})
                          </h3>
                          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#E8F7F1] text-[#087A5B] font-bold">
                            {est.rodadas.length}/{est.totalRodadasPrevistas} rodadas • Critério Buchholz
                          </span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                              <tr>
                                <th className="py-2.5 px-3">#</th>
                                <th className="py-2.5 px-3">Enxadrista</th>
                                <th className="py-2.5 px-3">Escola</th>
                                <th className="py-2.5 px-2 text-center">J</th>
                                <th className="py-2.5 px-2 text-center text-[#087A5B]">PTS</th>
                                <th className="py-2.5 px-3 text-center">Buchholz</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {classifXadrez.map((c, idx) => (
                                <tr key={c.id} className={idx < 3 ? 'bg-emerald-50/30' : ''}>
                                  <td className="py-2 px-3 font-bold text-slate-500">{idx + 1}º</td>
                                  <td className="py-2 px-3 font-bold text-[#17221D]">{c.nome}</td>
                                  <td className="py-2 px-3 text-slate-600">{c.sigla}</td>
                                  <td className="py-2 px-2 text-center">{c.jogos}</td>
                                  <td className="py-2 px-2 text-center font-black text-[#087A5B]">{c.pontos.toFixed(1)}</td>
                                  <td className="py-2 px-3 text-center font-mono text-slate-600">{c.buchholz.toFixed(1)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
            </>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* ABA 4: ARTILHARIA */}
      {/* ============================================================ */}
      {aba === 'ARTILHARIA' && (
        <div>
          {artilhariaAgrupada.length === 0 ? (
            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-10 text-center text-sm text-slate-500">
              O ranking de artilheiros por modalidade será exibido assim que os primeiros gols forem registrados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {artilhariaAgrupada.map((grupo) => (
                <div key={grupo.modalidadeCodigo} className="bg-white border border-[#E2EAE5] rounded-2xl overflow-hidden shadow-2xs">
                  <div className="px-5 py-3.5 bg-[#F7F9F8] border-b border-[#E2EAE5] flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#17221D] flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#00A878]" />
                      <span>Artilharia • {grupo.modalidadeNome}</span>
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {grupo.ranking.map((art, i) => (
                      <div key={art.id} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${i === 0 ? 'bg-amber-400 text-amber-950' : 'bg-slate-100 text-slate-600'}`}>
                            {i + 1}º
                          </span>
                          {art.fotoUrl ? (
                            <img src={art.fotoUrl} alt={art.atletaNome} className="w-10 h-10 rounded-full object-cover border border-[#00A878] shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#17221D] truncate">{art.atletaNome}</p>
                            <p className="text-xs text-slate-500 truncate">{art.escolaSigla || art.escolaNome} • {art.categoria}</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-xl bg-[#E8F7F1] text-[#087A5B] font-black text-sm shrink-0">
                          {art.gols} {art.gols === 1 ? 'gol' : 'gols'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* ABA 5: QUADRO DE MEDALHAS */}
      {/* ============================================================ */}
      {aba === 'MEDALHAS' && (
        <div>
          {quadroMedalhas.length === 0 ? (
            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-10 text-center text-sm text-slate-500">
              O Quadro Geral de Medalhas será atualizado conforme as premiações das etapas.
            </div>
          ) : (
            <div className="bg-white border border-[#E2EAE5] rounded-2xl overflow-hidden shadow-2xs">
              <div className="px-5 py-3.5 bg-[#F7F9F8] border-b border-[#E2EAE5] flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#17221D] flex items-center gap-2">
                  <Medal className="w-4 h-4 text-amber-500" />
                  <span>Quadro Geral de Medalhas</span>
                </h3>
                <span className="text-xs text-slate-500">Ouro → Prata → Bronze</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Pos.</th>
                      <th className="py-3 px-4">Escola</th>
                      <th className="py-3 px-3 text-center">🥇 Ouro</th>
                      <th className="py-3 px-3 text-center">🥈 Prata</th>
                      <th className="py-3 px-3 text-center">🥉 Bronze</th>
                      <th className="py-3 px-4 text-center">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quadroMedalhas.map((row, idx) => (
                      <tr key={row.escolaId} className={idx === 0 ? 'bg-amber-50/40' : ''}>
                        <td className="py-3 px-4 font-bold text-slate-600">{idx + 1}º</td>
                        <td className="py-3 px-4 font-bold text-[#17221D]">{row.escolaNome}</td>
                        <td className="py-3 px-3 text-center font-black text-amber-600">{row.ouro}</td>
                        <td className="py-3 px-3 text-center font-bold text-slate-500">{row.prata}</td>
                        <td className="py-3 px-3 text-center font-bold text-amber-800">{row.bronze}</td>
                        <td className="py-3 px-4 text-center font-black text-[#087A5B]">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DE LEITURA LIMPA DA NOTÍCIA + COMPARTILHAR NO WHATSAPP */}
      {/* ============================================================ */}
      {noticiaAberta && (
        <div
          onClick={() => setNoticiaAberta(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#E2EAE5] my-auto"
          >
            {noticiaAberta.imagemUrl && (
              <div className="w-full max-h-80 bg-slate-100 overflow-hidden relative">
                <img src={noticiaAberta.imagemUrl} alt={noticiaAberta.titulo} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setNoticiaAberta(null)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-[#087A5B] uppercase tracking-wider">
                  <span>{noticiaAberta.modalidadeNome || 'Boletim Oficial'}</span>
                  {noticiaAberta.horarioOcorrencia && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500 normal-case font-semibold">{noticiaAberta.horarioOcorrencia}</span>
                    </>
                  )}
                </div>
                {!noticiaAberta.imagemUrl && (
                  <button
                    type="button"
                    onClick={() => setNoticiaAberta(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-[#17221D] leading-snug">
                {noticiaAberta.titulo}
              </h2>

              <p className="text-sm sm:text-base text-[#374151] leading-relaxed whitespace-pre-line">
                {noticiaAberta.resumo}
              </p>

              {noticiaAberta.local && (
                <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#00A878]" /> {noticiaAberta.local}
                </p>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400">Publicado por {noticiaAberta.autor || 'Coordenação SEMED'}</span>
                <button
                  type="button"
                  onClick={() => handleCompartilharWhatsApp(noticiaAberta)}
                  className="px-4 py-2 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Compartilhar no WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DE ESCALAÇÃO DA EQUIPE / DELEGAÇÃO DA ESCOLA */}
      {/* ============================================================ */}
      {equipeAberta && (
        <div
          onClick={() => setEquipeAberta(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-[#E2EAE5]"
          >
            {/* Topo fixo do modal */}
            <div className="px-5 py-4 bg-[#F7F9F8] border-b border-[#E2EAE5] flex items-start justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#087A5B] block truncate">
                  {equipeAberta.escolaNome}
                </span>
                <h2 className="text-lg font-black text-[#17221D] leading-snug mt-0.5">
                  {equipeAberta.titulo}
                </h2>
                <p className="text-xs text-slate-500 font-medium">{equipeAberta.subtitulo}</p>
              </div>
              <button
                type="button"
                onClick={() => setEquipeAberta(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lista rolável compacta de atletas */}
            <div className="overflow-y-auto divide-y divide-slate-100 px-2 py-1">
              {equipeAberta.atletas.map((atl, idx) => (
                <div key={`${atl.id}-${idx}`} className="px-3 py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-black text-slate-300 w-5 text-right shrink-0">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    {atl.fotoUrl ? (
                      <img
                        src={atl.fotoUrl}
                        alt={atl.nomeCompleto}
                        className="w-8 h-8 rounded-full object-cover border border-[#00A878]/30 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-[#17221D] truncate">{atl.nomeCompleto}</p>
                      <p className="text-[11px] text-slate-400 font-medium">
                        {atl.categoria} • {atl.sexo === 'FEMININO' ? 'Feminino' : 'Masculino'}
                      </p>
                    </div>
                  </div>
                  {atl.detalhe && (
                    <span className="px-2 py-0.5 rounded-md bg-[#E8F7F1] text-[#087A5B] text-[10px] font-bold shrink-0 max-w-[45%] truncate" title={atl.detalhe}>
                      {atl.detalhe}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Rodapé do modal */}
            <div className="px-5 py-3 border-t border-slate-100 bg-[#F7F9F8] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setEquipeAberta(null)}
                className="px-4 py-1.5 rounded-xl bg-[#17221D] hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
