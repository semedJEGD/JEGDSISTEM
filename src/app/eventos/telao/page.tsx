'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import QRCode from 'qrcode';
import {
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Sun,
  Moon,
  ArrowLeft,
  Radio,
  Clock,
  MapPin,
  User,
  Filter,
  Film,
  Trophy,
  Medal,
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { EventosBundle, PartidaEventoItem, LinhaClassificacao } from '@/types/eventos';
import {
  EventosApi,
  CRONOGRAMA_PADRAO_JEGDS,
  FASES_LABEL,
  MODALIDADES_EVENTOS_OPCOES,
  calcularClassificacaoPorChave,
  calcularQuadroMedalhas,
  agruparArtilhariaPorModalidade,
  formatarDataBR,
} from '@/lib/eventos-service';

type SlideTipo =
  | 'AO_VIVO'
  | 'PROXIMOS'
  | 'NOTICIA'
  | 'CAPITULO_MODALIDADE'
  | 'ARTILHARIA'
  | 'VIDEO_VINHETA'
  | 'CRONOGRAMA'
  | 'MEDALHAS'
  | 'QRCODE';

type SlideDef = {
  id: string;
  tag: string;
  titulo: string;
  subtitulo?: string;
  tipo: SlideTipo;
  payload?: any;
};

export default function TelaoEventosPage() {
  const [municipioId, setMunicipioId] = useState<string | undefined>(undefined);
  const [siglaEvento, setSiglaEvento] = useState('JEGDS 2026');
  const [nomeEvento, setNomeEvento] = useState('Jogos Escolares de Gonçalves Dias');
  const [nomeCidade, setNomeCidade] = useState('GONÇALVES DIAS');
  const [logoUrl, setLogoUrl] = useState('/logo-jegd.png');

  const [bundle, setBundle] = useState<EventosBundle>({
    noticias: [],
    cronograma: [],
    partidas: [],
    artilharia: [],
    medalhas: [],
    avisos: [],
    updatedAt: '',
  });

  const [slideIdx, setSlideIdx] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [segundosPorSlide, setSegundosPorSlide] = useState(12);
  const [temaEscuro, setTemaEscuro] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mostrarControles, setMostrarControles] = useState(true);
  const [mostrarFiltroMods, setMostrarFiltroMods] = useState(false);
  const [modalidadesSelecionadas, setModalidadesSelecionadas] = useState<string[]>([]); // vazio = TODAS
  const [relogio, setRelogio] = useState('');
  const [qrPublicoUrl, setQrPublicoUrl] = useState('');
  const [autorizadoSemed, setAutorizadoSemed] = useState<boolean | null>(null);
  const [imagensQuebradas, setImagensQuebradas] = useState<Record<string, boolean>>({});

  // Transição WHOOSH com logo JEGDS
  const [whooshAtivo, setWhooshAtivo] = useState(false);
  const [progressoKey, setProgressoKey] = useState(0);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const whooshLockRef = useRef(false);

  useEffect(() => {
    JegdStorage.init();
    const isAuth = JegdStorage.isAdminAuth();
    setAutorizadoSemed(isAuth);
    if (!isAuth) return;
    const mun = JegdStorage.getCurrentMunicipio();
    if (mun) {
      setMunicipioId(mun.id);
      setSiglaEvento(mun.siglaEvento || 'JEGDS 2026');
      setNomeEvento(mun.nomeEvento || 'Jogos Escolares de Gonçalves Dias');
      if (mun.nome) setNomeCidade(mun.nome.toUpperCase());
      if (mun.logoUrl || mun.brasaoUrl) setLogoUrl(mun.logoUrl || mun.brasaoUrl || '/logo-jegd.png');
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://jegdsistem-delta.vercel.app';
    QRCode.toDataURL(`${origin}/eventos`, { margin: 1, width: 320, color: { dark: '#17221D', light: '#FFFFFF' } })
      .then(setQrPublicoUrl)
      .catch(() => { });
  }, []);

  useEffect(() => {
    const tick = () => {
      setRelogio(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const carregar = useCallback(async () => {
    try {
      const data = await EventosApi.carregar(municipioId, { incluirAtletas: false });
      setBundle(data);
    } catch (err) {
      console.error('Erro ao atualizar telão:', err);
    }
  }, [municipioId]);

  useEffect(() => {
    carregar();
    const id = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      carregar();
    }, 30000);
    return () => clearInterval(id);
  }, [carregar]);

  // =========================================================================
  // MOTOR EDITORIAL DO TELÃO (ZERO REPETIÇÃO + ROTEIRO EQUILIBRADO)
  // 1. Destaque Principal (1ª Notícia com cartaz/foto — sem duplicar título no header)
  // 2. Pulso de Quadra (Ao Vivo OU Próximos Confrontos em destaque)
  // 3. Capítulos por Modalidade (APENAS se tiver Tabela de Grupos ou jogos ainda não exibidos)
  // 4. Vídeos / Vinhetas dos Mascotes + Demais Notícias (máx 2 extras, sem repetir)
  // 5. Cronograma Completo do Dia (até 6 horários numa grade limpa)
  // 6. Pódio de Medalhas (quando houver)
  // 7. QR Code Portal Público
  // =========================================================================
  const slides = useMemo<SlideDef[]>(() => {
    const lista: SlideDef[] = [];
    const partidasJaExibidas = new Set<string>();

    const filtrarPorMod = (modCodigo?: string | null) => {
      if (modalidadesSelecionadas.length === 0) return true;
      if (!modCodigo) return true;
      return modalidadesSelecionadas.includes(modCodigo);
    };

    const partidasFiltradas = bundle.partidas.filter((p) => filtrarPorMod(p.modalidadeCodigo));
    const noticiasTelao = bundle.noticias.filter((n) => n.destaqueTelao !== false);
    const videosVinheta = bundle.avisos.filter((a) => a.ativo && a.tipo === 'VIDEO');

    // 1. DESTAQUE PRINCIPAL (Notícia #1 — ex: Cartaz da Abertura)
    if (noticiasTelao.length > 0) {
      const n0 = noticiasTelao[0];
      lista.push({
        id: `noticia-${n0.id}`,
        tag: 'DESTAQUE OFICIAL',
        titulo: n0.modalidadeNome ? `Boletim • ${n0.modalidadeNome}` : `Cobertura Oficial • ${siglaEvento}`,
        tipo: 'NOTICIA',
        payload: n0,
      });
    }

    // 2. PULSO DO MOMENTO: AO VIVO (máx 2 jogos grandes) ou PRÓXIMOS JOGOS (até 4)
    const aoVivo = partidasFiltradas.filter((p) => p.status === 'AO_VIVO');
    if (aoVivo.length > 0) {
      aoVivo.forEach((p) => partidasJaExibidas.add(p.id));
      for (let i = 0; i < aoVivo.length; i += 2) {
        lista.push({
          id: `ao-vivo-${i}`,
          tag: 'EM QUADRA AGORA • AO VIVO',
          titulo: 'Placares em Tempo Real',
          subtitulo: aoVivo.length > 2 ? `Bloco ${Math.floor(i / 2) + 1} de ${Math.ceil(aoVivo.length / 2)}` : undefined,
          tipo: 'AO_VIVO',
          payload: aoVivo.slice(i, i + 2),
        });
      }
    } else {
      const proximos = partidasFiltradas.filter((p) => p.status === 'AGENDADO').slice(0, 4);
      if (proximos.length > 0) {
        proximos.forEach((p) => partidasJaExibidas.add(p.id));
        lista.push({
          id: 'proximos-jogos',
          tag: proximos.length === 1 ? 'CONFRONTO EM DESTAQUE' : 'A SEGUIR EM QUADRA',
          titulo: proximos.length === 1 ? proximos[0].modalidadeNome || 'Próximo Jogo' : 'Próximos Confrontos do Dia',
          tipo: 'PROXIMOS',
          payload: proximos,
        });
      }
    }

    // 3. CAPÍTULOS POR MODALIDADE (SEM REPETIR PARTIDAS ISOLADAS JÁ MOSTRADAS ACIMA)
    const classificacoes = calcularClassificacaoPorChave(partidasFiltradas);
    const artilhariaAgrupada = agruparArtilhariaPorModalidade(
      bundle.artilharia.filter((a) => filtrarPorMod(a.modalidadeCodigo))
    );

    const modsAtivasMap = new Map<string, string>();
    partidasFiltradas.forEach((p) => modsAtivasMap.set(p.modalidadeCodigo, p.modalidadeNome));
    artilhariaAgrupada.forEach((a) => modsAtivasMap.set(a.modalidadeCodigo, a.modalidadeNome));

    let noticiaCursor = 1;
    let videoCursor = 0;

    Array.from(modsAtivasMap.entries()).forEach(([modCodigo, modNome]) => {
      const gruposDaMod = classificacoes.filter((c) => c.modalidadeCodigo === modCodigo);
      const partidasDaMod = partidasFiltradas.filter((p) => p.modalidadeCodigo === modCodigo);
      const ultimosMod = partidasDaMod
        .filter((p) => p.status === 'ENCERRADO' || p.status === 'WO' || p.status === 'AO_VIVO')
        .slice(-3)
        .reverse();
      const proximosModNovos = partidasDaMod
        .filter((p) => p.status === 'AGENDADO' && !partidasJaExibidas.has(p.id))
        .slice(0, 3);

      // Só cria capítulo se houver tabela de grupos OU placares encerrados OU jogos novos não exibidos
      if (gruposDaMod.length > 0) {
        for (let gIdx = 0; gIdx < gruposDaMod.length; gIdx += 2) {
          const fatiaGrupos = gruposDaMod.slice(gIdx, gIdx + 2);
          const parteTxt = gruposDaMod.length > 2 ? ` • Parte ${Math.floor(gIdx / 2) + 1}/${Math.ceil(gruposDaMod.length / 2)}` : '';
          lista.push({
            id: `cap-${modCodigo}-g-${gIdx}`,
            tag: `CLASSIFICAÇÃO • ${modNome.toUpperCase()}${parteTxt}`,
            titulo: `${modNome} — Grupos & Confrontos`,
            tipo: 'CAPITULO_MODALIDADE',
            payload: {
              modNome,
              grupos: fatiaGrupos,
              ultimos: ultimosMod,
              proximos: partidasDaMod.filter((p) => p.status === 'AGENDADO').slice(0, 3),
            },
          });
        }
      } else if (ultimosMod.length > 0 || proximosModNovos.length > 0) {
        lista.push({
          id: `cap-${modCodigo}-jogos`,
          tag: `RESULTADOS • ${modNome.toUpperCase()}`,
          titulo: `${modNome} — Placares & Agenda`,
          tipo: 'CAPITULO_MODALIDADE',
          payload: {
            modNome,
            grupos: [],
            ultimos: ultimosMod,
            proximos: proximosModNovos,
          },
        });
      }

      const artDaMod = artilhariaAgrupada.find((a) => a.modalidadeCodigo === modCodigo);
      if (artDaMod && artDaMod.ranking.length > 0) {
        lista.push({
          id: `art-${modCodigo}`,
          tag: `ARTILHARIA • ${modNome.toUpperCase()}`,
          titulo: `Destaques & Gols — ${modNome}`,
          tipo: 'ARTILHARIA',
          payload: artDaMod,
        });
      }

      if (videoCursor < videosVinheta.length) {
        const vid = videosVinheta[videoCursor++];
        lista.push({
          id: `video-${vid.id}`,
          tag: 'VINHETA OFICIAL JEGDS',
          titulo: vid.titulo,
          tipo: 'VIDEO_VINHETA',
          payload: vid,
        });
      }
    });

    // Vinhetas de vídeo restantes (se houver)
    while (videoCursor < videosVinheta.length && videoCursor < 2) {
      const vid = videosVinheta[videoCursor++];
      lista.push({
        id: `video-${vid.id}`,
        tag: 'VINHETA OFICIAL JEGDS',
        titulo: vid.titulo,
        tipo: 'VIDEO_VINHETA',
        payload: vid,
      });
    }

    // Demais notícias relevantes (máx 1 extra para manter o ciclo ágil e sem cansar)
    if (noticiaCursor < noticiasTelao.length) {
      const proxNot = noticiasTelao[noticiaCursor++];
      lista.push({
        id: `noticia-${proxNot.id}`,
        tag: 'BOLETIM DO DIA',
        titulo: proxNot.modalidadeNome ? `Boletim • ${proxNot.modalidadeNome}` : `Notícias • ${siglaEvento}`,
        tipo: 'NOTICIA',
        payload: proxNot,
      });
    }

    // 4. CRONOGRAMA OFICIAL (até 6 itens organizados numa grade limpa sem cortar!)
    const cron =
      bundle.cronograma.length > 0
        ? bundle.cronograma
        : CRONOGRAMA_PADRAO_JEGDS.map((c, i) => ({ ...c, id: `padrao-${i}` }));
    lista.push({
      id: 'cronograma',
      tag: 'CRONOGRAMA OFICIAL',
      titulo: 'Programação do Dia',
      tipo: 'CRONOGRAMA',
      payload: cron.slice(0, 6),
    });

    // 5. PÓDIO OLÍMPICO & MEDALHAS (só aparece quando já houver medalhas)
    const medalhas = calcularQuadroMedalhas(bundle.medalhas);
    if (medalhas.length > 0) {
      lista.push({
        id: 'medalhas',
        tag: 'RANKING OLÍMPICO OFICIAL',
        titulo: 'Quadro Geral de Medalhas',
        tipo: 'MEDALHAS',
        payload: medalhas,
      });
    }

    // 6. CONVITE DIGITAL (QR Code)
    lista.push({
      id: 'qrcode-portal',
      tag: 'ACOMPANHE NO CELULAR',
      titulo: `Portal Oficial • ${siglaEvento}`,
      tipo: 'QRCODE',
    });

    return lista;
  }, [bundle, siglaEvento, modalidadesSelecionadas]);

  // Transição WHOOSH com logo JEGDS entre slides
  const irParaSlideComWhoosh = useCallback(
    (destinoIdx: number) => {
      if (whooshLockRef.current || slides.length <= 1) return;
      whooshLockRef.current = true;
      setWhooshAtivo(true);

      setTimeout(() => {
        setSlideIdx(((destinoIdx % slides.length) + slides.length) % slides.length);
        setProgressoKey((k) => k + 1);
      }, 340);

      setTimeout(() => {
        setWhooshAtivo(false);
        whooshLockRef.current = false;
      }, 780);
    },
    [slides.length]
  );

  // Rotação automática (pausa o timer padrão se o slide atual for VIDEO_VINHETA, pois o onEnded do vídeo dispara o whoosh!)
  const slideAtual = slides[slideIdx % slides.length] || slides[0];

  useEffect(() => {
    if (pausado || slides.length <= 1) return;
    const tempo = slideAtual?.tipo === 'VIDEO_VINHETA' ? Math.max(segundosPorSlide, 20) : segundosPorSlide;
    const timer = setInterval(() => {
      irParaSlideComWhoosh(slideIdx + 1);
    }, tempo * 1000);
    return () => clearInterval(timer);
  }, [pausado, segundosPorSlide, slideIdx, slides.length, slideAtual?.tipo, irParaSlideComWhoosh]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setPausado((p) => !p);
      } else if (e.code === 'ArrowRight') {
        irParaSlideComWhoosh(slideIdx + 1);
      } else if (e.code === 'ArrowLeft') {
        irParaSlideComWhoosh(slideIdx - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slideIdx, irParaSlideComWhoosh]);

  const handleMouseMove = () => {
    setMostrarControles(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setMostrarControles(false);
      setMostrarFiltroMods(false);
    }, 4000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => { });
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => { });
    }
  };

  const itensTicker = useMemo(() => {
    const msgs: string[] = [];
    bundle.avisos
      .filter((a) => a.ativo && a.tipo !== 'VIDEO')
      .forEach((a) => msgs.push(`📢 ${a.titulo.toUpperCase()}: ${a.mensagem}`));
    bundle.partidas
      .filter((p) => p.status === 'AO_VIVO')
      .forEach((p) =>
        msgs.push(`🔴 AO VIVO • ${p.modalidadeNome} (${p.categoria}): ${p.escolaASigla || p.escolaANome} ${p.placarA} × ${p.placarB} ${p.escolaBSigla || p.escolaBNome}`)
      );
    bundle.partidas
      .filter((p) => p.status === 'AGENDADO')
      .slice(0, 5)
      .forEach((p) =>
        msgs.push(`🕒 ${p.horario} • ${p.modalidadeNome} (${p.categoria}): ${p.escolaASigla || p.escolaANome} × ${p.escolaBSigla || p.escolaBNome} ${p.local ? `— ${p.local}` : ''}`)
      );
    if (msgs.length === 0) {
      msgs.push(`🏆 ${siglaEvento} • ${nomeEvento} • Prefeitura Municipal & SEMED • Acompanhe em tempo real no portal oficial!`);
    }
    return msgs;
  }, [bundle, siglaEvento, nomeEvento]);

  if (autorizadoSemed === false) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#F5F8F6] flex items-center justify-center p-6">
        <div className="bg-white border border-[#E2EAE5] rounded-2xl p-8 max-w-md w-full text-center shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#E8F7F1] border border-[#00A878]/20 p-2 mx-auto">
            <img src={logoUrl} alt={siglaEvento} className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-black text-[#17221D]">Modo Telão Exclusivo SEMED</h1>
          <p className="text-sm text-[#4B5563]">
            A projeção em tela cheia é de uso exclusivo da Coordenação SEMED (Elias / Herbert). Para acompanhar todos os eventos ao vivo pelo celular, acesse o portal público:
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/eventos"
              className="w-full py-3 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-sm font-black transition-colors"
            >
              Ir para Eventos do Dia (Celular)
            </Link>
            <Link
              href="/admin/login"
              className="w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              Acesso Coordenação SEMED
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`fixed inset-0 z-[100] flex flex-col overflow-hidden select-none transition-colors duration-300 ${temaEscuro ? 'bg-[#0B1210] text-white' : 'bg-[#F5F8F6] text-[#17221D]'
        }`}
    >
      <style jsx global>{`
        @keyframes jegdsWhooshRibbon1 {
          0% { transform: translate3d(-135%, 0, 0) skewX(-18deg); }
          45% { transform: translate3d(0%, 0, 0) skewX(-18deg); }
          55% { transform: translate3d(0%, 0, 0) skewX(-18deg); }
          100% { transform: translate3d(135%, 0, 0) skewX(-18deg); }
        }
        @keyframes jegdsWhooshRibbon2 {
          0% { transform: translate3d(-145%, 0, 0) skewX(-18deg); }
          42% { transform: translate3d(0%, 0, 0) skewX(-18deg); }
          58% { transform: translate3d(0%, 0, 0) skewX(-18deg); }
          100% { transform: translate3d(145%, 0, 0) skewX(-18deg); }
        }
        @keyframes jegdsWhooshLogo {
          0% { opacity: 0; transform: scale(0.45) rotate(-8deg); }
          32% { opacity: 1; transform: scale(1.08) rotate(0deg); }
          64% { opacity: 1; transform: scale(1.0) rotate(0deg); }
          100% { opacity: 0; transform: scale(1.35) rotate(4deg); }
        }
        @keyframes jegdsSlideEnter {
          0% { opacity: 0; transform: translateY(14px) scale(0.99); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes jegdsProgressBar {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        @keyframes jegdsTicker {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .anim-whoosh-r1 { animation: jegdsWhooshRibbon1 760ms cubic-bezier(0.76, 0, 0.24, 1) forwards; }
        .anim-whoosh-r2 { animation: jegdsWhooshRibbon2 760ms cubic-bezier(0.76, 0, 0.24, 1) 45ms forwards; }
        .anim-whoosh-logo { animation: jegdsWhooshLogo 740ms cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .anim-slide-enter { animation: jegdsSlideEnter 480ms cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .anim-ticker { animation: jegdsTicker 34s linear infinite; }
      `}</style>

      {/* OVERLAY WHOOSH COM LOGO JEGDS */}
      {whooshAtivo && (
        <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden flex items-center justify-center">
          <div className="absolute inset-y-0 -left-[25%] w-[150%] bg-gradient-to-r from-[#8B1D2C] via-[#A62133] to-[#D97706] anim-whoosh-r1 shadow-2xl" />
          <div className="absolute inset-y-0 -left-[25%] w-[142%] bg-gradient-to-r from-[#065F46] via-[#00A878] to-[#087A5B] anim-whoosh-r2 shadow-2xl" />
          <div className="relative z-10 flex flex-col items-center gap-4 anim-whoosh-logo">
            <div className="w-40 h-40 sm:w-52 sm:h-52 rounded-full bg-white p-4 shadow-2xl ring-8 ring-amber-400/90 flex items-center justify-center">
              <img src={logoUrl} alt={siglaEvento} className="w-full h-full object-contain" />
            </div>
            <div className="px-6 py-2 rounded-full bg-[#17221D]/90 text-white font-black text-xl sm:text-2xl tracking-widest uppercase shadow-xl border border-amber-400/60">
              {siglaEvento}
            </div>
          </div>
        </div>
      )}

      {/* BARRA SUPERIOR BROADCAST ESPORTIVO (INSPIRADA NA IDENTIDADE JEGDS + SEMED) */}
      {(() => {
        const partesSigla = siglaEvento.trim().split(/\s+/);
        const siglaBase = partesSigla[0] || 'JEGDS';
        const siglaAno = partesSigla.slice(1).join(' ') || '2026';
        return (
          <header
            className={`relative overflow-hidden px-6 sm:px-10 py-2.5 flex items-center justify-between gap-4 shrink-0 ${
              temaEscuro
                ? 'bg-gradient-to-r from-[#0F1A16] via-[#13221D] to-[#0F1A16]'
                : 'bg-gradient-to-r from-white via-[#F9FBFA] to-[#F3F6F4]'
            }`}
          >
            {/* Faixas Aerodinâmicas Canto Superior Esquerdo (Verde + Carmim) */}
            <svg
              aria-hidden="true"
              viewBox="0 0 260 110"
              preserveAspectRatio="none"
              className="pointer-events-none absolute top-0 left-0 h-full w-44 sm:w-60 select-none"
            >
              <defs>
                <pattern id="jegdsDotsLeft" width="8" height="8" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.3" fill={temaEscuro ? 'rgba(255,255,255,0.08)' : 'rgba(11,107,58,0.12)'} />
                </pattern>
              </defs>
              <rect x="0" y="36" width="110" height="74" fill="url(#jegdsDotsLeft)" />
              <path d="M0,0 L165,0 C105,12 52,44 0,88 Z" fill="#0B6B3A" />
              <path d="M0,78 C54,36 112,10 182,0 L198,0 C122,14 60,46 0,98 Z" fill="#FFFFFF" opacity={temaEscuro ? '0.18' : '0.95'} />
              <path d="M0,88 C60,44 124,14 205,0 L224,0 C138,18 68,54 0,108 Z" fill="#C1121F" />
            </svg>

            {/* Faixas Aerodinâmicas Canto Inferior Direito (Verde + Carmim) */}
            <svg
              aria-hidden="true"
              viewBox="0 0 320 110"
              preserveAspectRatio="none"
              className="pointer-events-none absolute bottom-0 right-0 h-full w-56 sm:w-80 select-none"
            >
              <defs>
                <pattern id="jegdsDotsRight" width="8" height="8" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1.3" fill={temaEscuro ? 'rgba(255,255,255,0.08)' : 'rgba(11,107,58,0.12)'} />
                </pattern>
              </defs>
              <rect x="220" y="0" width="100" height="70" fill="url(#jegdsDotsRight)" />
              <path d="M320,40 C268,72 195,90 92,110 L170,110 C245,94 290,74 320,56 Z" fill="#0B6B3A" />
              <path d="M320,56 C284,78 232,96 155,110 L320,110 Z" fill="#C1121F" />
            </svg>

            {/* BLOCO ESQUERDO: LOGO JEGDS + TIPOGRAFIA ESPORTIVA + TAG DO SLIDE */}
            <div className="relative z-10 flex items-center gap-4 sm:gap-5 min-w-0 pl-8 sm:pl-14">
              {/* Marca Oficial JEGDS 2026 */}
              <div className="flex items-center gap-2.5 shrink-0">
                <img
                  src={logoUrl}
                  alt={siglaEvento}
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-xs shrink-0"
                />
                <div className="leading-none select-none">
                  <div
                    className={`text-2xl sm:text-3xl font-black italic tracking-tight leading-[0.9] ${
                      temaEscuro ? 'text-emerald-400' : 'text-[#0B6B3A]'
                    }`}
                  >
                    {siglaBase}
                  </div>
                  <div
                    className={`text-xl sm:text-2xl font-black italic tracking-tight leading-[0.95] ${
                      temaEscuro ? 'text-rose-400' : 'text-[#C1121F]'
                    }`}
                  >
                    {siglaAno}
                  </div>
                </div>
              </div>

              {/* Divisor Inclinado Esportivo */}
              <div
                className={`hidden sm:block w-[2px] h-10 -skew-x-12 shrink-0 ${
                  temaEscuro ? 'bg-emerald-400/50' : 'bg-[#0B6B3A]/70'
                }`}
              />

              {/* Contexto do Slide Atual (Pill Verde Inclinada + Subtítulo) */}
              <div className="min-w-0 flex flex-col justify-center gap-1">
                <div className="flex items-center gap-2">
                  <span className="inline-block -skew-x-12 px-3.5 py-0.5 rounded-sm bg-[#0B6B3A] shadow-xs">
                    <span className="inline-block skew-x-12 text-white text-[11px] sm:text-xs font-black italic uppercase tracking-wider whitespace-nowrap">
                      {slideAtual?.tag}
                    </span>
                  </span>
                </div>
                <h1
                  className={`text-sm sm:text-lg font-extrabold tracking-tight truncate leading-tight ${
                    temaEscuro ? 'text-emerald-100' : 'text-[#0D4A2C]'
                  }`}
                >
                  {slideAtual?.titulo || `${siglaEvento} • SEMED`}
                </h1>
              </div>
            </div>

            {/* BLOCO DIREITO: SEMED + DIVISOR + RELÓGIO + SLIDE */}
            <div className="relative z-10 flex items-center gap-4 sm:gap-5 shrink-0 pr-1 sm:pr-2">
              {/* Pontinhos Clicáveis de Navegação (discretos no desktop) */}
              <div className="hidden xl:flex items-center gap-1.5 mr-1">
                {slides.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    title={s.titulo}
                    onClick={() => irParaSlideComWhoosh(idx)}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === slideIdx % slides.length
                        ? 'w-7 bg-[#0B6B3A]'
                        : temaEscuro
                        ? 'w-2 bg-white/25 hover:bg-white/50'
                        : 'w-2 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>

              {/* Emblema Institucional SEMED */}
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <svg
                  viewBox="0 0 48 44"
                  className={`w-9 h-9 shrink-0 ${temaEscuro ? 'text-emerald-400' : 'text-[#0B6B3A]'}`}
                  fill="currentColor"
                  aria-hidden="true"
                >
                  {/* Capelo (Chapéu de Formatura) */}
                  <path d="M24 3L4 12.5L24 22L44 12.5L24 3Z" />
                  <path d="M12 18.2V25.5C12 28.2 17.4 30.5 24 30.5C30.6 30.5 36 28.2 36 25.5V18.2L24 24L12 18.2Z" opacity="0.85" />
                  {/* Livro Aberto */}
                  <path d="M5 24.5C9.5 24.5 16.5 26.5 22.5 31.5V40C16.5 35.2 9.5 33.4 5 33.4V24.5Z" />
                  <path d="M43 24.5C38.5 24.5 31.5 26.5 25.5 31.5V40C31.5 35.2 38.5 33.4 43 33.4V24.5Z" />
                </svg>
                <div className="leading-none">
                  <div
                    className={`text-lg sm:text-xl font-black tracking-tight border-b pb-0.5 ${
                      temaEscuro
                        ? 'text-emerald-400 border-emerald-400/40'
                        : 'text-[#0B6B3A] border-[#0B6B3A]/40'
                    }`}
                  >
                    SEMED
                  </div>
                  <div
                    className={`text-[9px] font-extrabold tracking-widest uppercase pt-0.5 ${
                      temaEscuro ? 'text-slate-300' : 'text-[#174D32]'
                    }`}
                  >
                    {nomeCidade}
                  </div>
                </div>
              </div>

              {/* Divisor Vertical Fino */}
              <div
                className={`hidden md:block w-px h-10 shrink-0 ${
                  temaEscuro ? 'bg-white/20' : 'bg-[#0B6B3A]/40'
                }`}
              />

              {/* Relógio Digital + Contador de Slide */}
              <div className="text-center min-w-[116px]">
                <div
                  className={`text-2xl sm:text-3xl font-black font-mono tabular-nums tracking-tight leading-none ${
                    temaEscuro ? 'text-emerald-400' : 'text-[#0B6B3A]'
                  }`}
                >
                  {relogio}
                </div>
                <span
                  className={`block text-[11px] font-extrabold uppercase tracking-wider mt-0.5 ${
                    temaEscuro ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  SLIDE {(slideIdx % slides.length) + 1} / {slides.length}
                </span>
              </div>
            </div>

            {/* LINHA INFERIOR BICOLOR (VERDE À ESQUERDA -> VERMELHO À DIREITA) + PROGRESSO */}
            <div className="absolute bottom-0 left-0 right-0 h-[3px] flex">
              <div className="w-2/5 h-full bg-[#0B6B3A]" />
              <div className="w-3/5 h-full bg-[#C1121F]" />
            </div>

            {!pausado && slides.length > 1 && slideAtual?.tipo !== 'VIDEO_VINHETA' && (
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-transparent overflow-hidden z-20">
                <div
                  key={progressoKey}
                  className="h-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                  style={{ animation: `jegdsProgressBar ${segundosPorSlide}s linear forwards` }}
                />
              </div>
            )}
          </header>
        );
      })()}

      {/* PALCO PRINCIPAL (100% CONTIDO — NUNCA CORTA TOPO OU BASE EM 720p/1080p) */}
      <main key={slideAtual?.id} className="flex-1 min-h-0 overflow-hidden px-6 sm:px-10 py-4 sm:py-5 flex items-center justify-center anim-slide-enter">
        {/* SLIDE: VÍDEO VINHETA / MASCOTES */}
        {slideAtual?.tipo === 'VIDEO_VINHETA' && (
          <div className="w-full max-w-6xl h-full max-h-full rounded-3xl overflow-hidden border-4 border-[#00A878]/50 shadow-2xl bg-black relative flex items-center justify-center">
            <video
              src={slideAtual.payload.mensagem}
              autoPlay
              muted
              playsInline
              onEnded={() => irParaSlideComWhoosh(slideIdx + 1)}
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-5 left-6 px-4 py-2 rounded-xl bg-black/65 backdrop-blur-md text-white flex items-center gap-2.5 border border-white/15">
              <Film className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-black tracking-wide uppercase">{slideAtual.payload.titulo}</span>
            </div>
          </div>
        )}

        {/* SLIDE: NOTÍCIA / BOLETIM DO DIA (CARTAZ INTEIRO COM object-contain + TEXTO SEM CORTE) */}
        {slideAtual?.tipo === 'NOTICIA' && (() => {
          const temImagemValida = Boolean(slideAtual.payload.imagemUrl && !imagensQuebradas[slideAtual.payload.id]);
          return (
            <div
              className={`w-full max-w-6xl h-full max-h-full rounded-3xl overflow-hidden border shadow-lg grid grid-cols-1 ${
                temImagemValida ? 'lg:grid-cols-12' : ''
              } ${temaEscuro ? 'bg-[#15221E] border-white/10' : 'bg-white border-[#E2EAE5]'}`}
            >
              {temImagemValida && (
                <div
                  className={`lg:col-span-5 h-full min-h-0 p-3 sm:p-4 flex items-center justify-center overflow-hidden ${
                    temaEscuro ? 'bg-black/30' : 'bg-[#F2F6F4]'
                  }`}
                >
                  <img
                    src={slideAtual.payload.imagemUrl}
                    alt={slideAtual.payload.titulo}
                    onError={() =>
                      setImagensQuebradas((prev) => ({ ...prev, [slideAtual.payload.id]: true }))
                    }
                    className="max-w-full max-h-full w-auto h-auto object-contain rounded-2xl shadow-md"
                  />
                </div>
              )}
              <div
                className={`${
                  temImagemValida ? 'lg:col-span-7' : 'max-w-4xl mx-auto'
                } h-full min-h-0 p-6 sm:p-8 xl:p-10 flex flex-col justify-center gap-3.5 overflow-hidden`}
              >
                <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                  <span className="px-3 py-1 rounded-full bg-[#00A878] text-white text-xs font-black uppercase">
                    {slideAtual.payload.modalidadeNome || 'Boletim Oficial'}
                  </span>
                  {slideAtual.payload.horarioOcorrencia && (
                    <span className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 ${temaEscuro ? 'text-amber-300' : 'text-[#8B1D2C]'}`}>
                      <Clock className="w-4 h-4" /> {slideAtual.payload.horarioOcorrencia}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl xl:text-4xl font-black leading-tight tracking-tight line-clamp-3 shrink-0">
                  {slideAtual.payload.titulo}
                </h2>
                <p className={`text-sm sm:text-base xl:text-xl leading-relaxed line-clamp-6 ${temaEscuro ? 'text-slate-200' : 'text-[#374151]'}`}>
                  {slideAtual.payload.resumo}
                </p>
                {slideAtual.payload.local && (
                  <p className={`text-xs sm:text-sm font-bold flex items-center gap-2 pt-1 shrink-0 ${temaEscuro ? 'text-emerald-300' : 'text-[#087A5B]'}`}>
                    <MapPin className="w-4 h-4 shrink-0" /> {slideAtual.payload.local}
                  </p>
                )}
              </div>
            </div>
          );
        })()}

        {/* SLIDE: JOGOS AO VIVO (MÁX 2 GIGANTES) */}
        {slideAtual?.tipo === 'AO_VIVO' && (
          <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8">
            {slideAtual.payload.map((p: PartidaEventoItem) => (
              <div key={p.id} className={`rounded-3xl p-8 border-2 border-rose-500 shadow-xl space-y-6 ${temaEscuro ? 'bg-[#15221E]' : 'bg-white'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-base font-black uppercase text-[#00A878]">
                    {p.modalidadeNome} • {p.categoria} ({p.sexo === 'FEMININO' ? 'F' : 'M'})
                  </span>
                  <span className="px-3.5 py-1 rounded-full bg-rose-600 text-white text-xs font-black animate-pulse flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5" /> AO VIVO
                  </span>
                </div>
                <div className="grid grid-cols-7 items-center text-center gap-2 py-4">
                  <div className="col-span-3 text-2xl sm:text-3xl font-black truncate">{p.escolaASigla || p.escolaANome}</div>
                  <div className="col-span-1 text-5xl sm:text-6xl font-black text-rose-600">{p.placarA}×{p.placarB}</div>
                  <div className="col-span-3 text-2xl sm:text-3xl font-black truncate">{p.escolaBSigla || p.escolaBNome}</div>
                </div>
                <div className={`flex items-center justify-between text-sm font-bold pt-2 border-t ${temaEscuro ? 'border-white/10 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
                  <span>{p.grupo || FASES_LABEL[p.fase] || p.fase}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-[#00A878]" /> {p.local || 'Quadra Oficial'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SLIDE: PRÓXIMOS JOGOS (HERO GRANDIOSO QUANDO FOR 1 CONFRONTO, OU LISTA LIMPA ATÉ 4) */}
        {slideAtual?.tipo === 'PROXIMOS' && (
          slideAtual.payload.length === 1 ? (() => {
            const p: PartidaEventoItem = slideAtual.payload[0];
            return (
              <div
                className={`w-full max-w-5xl rounded-3xl p-8 sm:p-12 border-t-8 border-t-[#00A878] border shadow-xl flex flex-col items-center text-center gap-6 ${
                  temaEscuro ? 'bg-[#15221E] border-white/10' : 'bg-white border-[#E2EAE5]'
                }`}
              >
                <div className="flex items-center gap-3 flex-wrap justify-center">
                  <span className="px-4 py-1.5 rounded-full bg-[#8B1D2C] text-white text-xs sm:text-sm font-black uppercase tracking-wider">
                    {p.modalidadeNome} • {p.grupo || FASES_LABEL[p.fase] || p.fase}
                  </span>
                  <span className="px-4 py-1.5 rounded-full bg-[#00A878] text-white text-sm sm:text-base font-black font-mono flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> {formatarDataBR(p.dataEvento)} às {p.horario}
                  </span>
                </div>

                <div className="w-full grid grid-cols-1 md:grid-cols-7 items-center gap-4 py-4">
                  <div className="md:col-span-3 space-y-1">
                    <p className="text-3xl sm:text-5xl font-black tracking-tight text-[#087A5B]">
                      {p.escolaASigla || p.escolaANome}
                    </p>
                    {p.escolaASigla && p.escolaANome !== p.escolaASigla && (
                      <p className={`text-xs sm:text-sm font-bold ${temaEscuro ? 'text-slate-300' : 'text-slate-500'}`}>
                        {p.escolaANome}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-1 flex items-center justify-center">
                    <span className="w-16 h-16 rounded-2xl bg-[#8B1D2C]/10 border-2 border-[#8B1D2C]/30 text-[#8B1D2C] text-3xl font-black flex items-center justify-center">
                      ×
                    </span>
                  </div>

                  <div className="md:col-span-3 space-y-1">
                    <p className="text-3xl sm:text-5xl font-black tracking-tight text-[#8B1D2C]">
                      {p.escolaBSigla || p.escolaBNome}
                    </p>
                    {p.escolaBSigla && p.escolaBNome !== p.escolaBSigla && (
                      <p className={`text-xs sm:text-sm font-bold ${temaEscuro ? 'text-slate-300' : 'text-slate-500'}`}>
                        {p.escolaBNome}
                      </p>
                    )}
                  </div>
                </div>

                <div className={`px-5 py-2.5 rounded-2xl text-sm sm:text-base font-bold flex items-center gap-2 ${temaEscuro ? 'bg-white/5 text-slate-200' : 'bg-[#F7F9F8] text-slate-600'}`}>
                  <MapPin className="w-5 h-5 text-[#00A878]" />
                  <span>{p.local || 'Quadra Oficial'}</span>
                </div>
              </div>
            );
          })() : (
            <div className="w-full max-w-5xl max-h-full space-y-3.5 overflow-hidden">
              {slideAtual.payload.map((p: PartidaEventoItem) => (
                <div key={p.id} className={`rounded-2xl px-6 py-4 border-l-8 border-l-[#00A878] border shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 ${temaEscuro ? 'bg-[#15221E] border-white/10' : 'bg-white border-[#E2EAE5]'}`}>
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="px-3.5 py-1.5 rounded-xl bg-[#00A878] text-white text-xl font-black font-mono shrink-0">
                      {p.horario}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-black uppercase text-[#8B1D2C] tracking-wider block truncate">
                        {p.modalidadeNome} • {p.categoria} ({p.sexo === 'FEMININO' ? 'Fem' : 'Masc'}) • {p.grupo || FASES_LABEL[p.fase] || p.fase}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black mt-0.5 truncate">
                        {p.escolaASigla || p.escolaANome} <span className="text-[#00A878] mx-2">×</span> {p.escolaBSigla || p.escolaBNome}
                      </h3>
                    </div>
                  </div>
                  <div className={`text-xs sm:text-sm font-bold flex items-center gap-1.5 shrink-0 ${temaEscuro ? 'text-slate-300' : 'text-slate-500'}`}>
                    <MapPin className="w-4 h-4 text-[#00A878]" /> {p.local || 'Quadra Oficial'}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* SLIDE: CAPÍTULO POR MODALIDADE (CARDS DE GRUPO À ESQUERDA + JOGOS DA MODALIDADE À DIREITA) */}
        {slideAtual?.tipo === 'CAPITULO_MODALIDADE' && (
          <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Coluna Esquerda: Cards dos Grupos (máx 2 grupos) */}
            {slideAtual.payload.grupos.length > 0 && (
              <div className="lg:col-span-7 flex flex-col gap-5 justify-center">
                {slideAtual.payload.grupos.map((g: { chave: string; grupo: string; categoria: string; sexo: string; linhas: LinhaClassificacao[] }) => (
                  <div key={g.chave} className={`rounded-2xl overflow-hidden border shadow-md ${temaEscuro ? 'bg-[#15221E] border-white/10' : 'bg-white border-[#E2EAE5]'}`}>
                    <div className="px-5 py-3 bg-[#8B1D2C] text-white flex items-center justify-between">
                      <span className="text-sm sm:text-base font-black uppercase tracking-wide">
                        {g.grupo} • {g.categoria} ({g.sexo === 'FEMININO' ? 'F' : 'M'})
                      </span>
                      <span className="text-xs font-bold text-amber-200 uppercase">Classificação</span>
                    </div>
                    <table className="w-full text-left">
                      <thead className={`text-xs uppercase font-black border-b ${temaEscuro ? 'bg-white/5 text-slate-300 border-white/10' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        <tr>
                          <th className="py-2.5 px-4">#</th>
                          <th className="py-2.5 px-3">Escola</th>
                          <th className="py-2.5 px-2 text-center">J</th>
                          <th className="py-2.5 px-2 text-center">V</th>
                          <th className="py-2.5 px-2 text-center">SG</th>
                          <th className="py-2.5 px-4 text-center text-[#00A878]">PTS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/20 text-base font-bold">
                        {g.linhas.slice(0, 5).map((l, i) => (
                          <tr key={l.escolaId} className={i < 2 ? (temaEscuro ? 'bg-emerald-950/30' : 'bg-emerald-50/40') : ''}>
                            <td className="py-2.5 px-4 font-black">{i + 1}º</td>
                            <td className="py-2.5 px-3 font-black truncate max-w-[220px]">{l.escolaSigla}</td>
                            <td className="py-2.5 px-2 text-center">{l.jogos}</td>
                            <td className="py-2.5 px-2 text-center text-[#00A878]">{l.vitorias}</td>
                            <td className="py-2.5 px-2 text-center">{l.saldo}</td>
                            <td className="py-2.5 px-4 text-center font-black text-lg text-[#00A878]">{l.pontos}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}

            {/* Coluna Direita: Últimos Placares & Próximos Jogos dessa Modalidade */}
            <div className={`${slideAtual.payload.grupos.length > 0 ? 'lg:col-span-5' : 'lg:col-span-12 max-w-4xl mx-auto w-full'} flex flex-col gap-4 justify-center`}>
              {slideAtual.payload.ultimos.length > 0 && (
                <div className={`rounded-2xl p-5 border shadow-sm space-y-3 ${temaEscuro ? 'bg-[#15221E] border-white/10' : 'bg-white border-[#E2EAE5]'}`}>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#00A878] flex items-center gap-2">
                    <Trophy className="w-4 h-4" /> Últimos Placares ({slideAtual.payload.modNome})
                  </h3>
                  <div className="space-y-2.5">
                    {slideAtual.payload.ultimos.map((p: PartidaEventoItem) => (
                      <div key={p.id} className={`rounded-xl p-3 border grid grid-cols-7 items-center text-center ${temaEscuro ? 'bg-white/5 border-white/10' : 'bg-[#F7F9F8] border-[#E2EAE5]'}`}>
                        <span className={`col-span-3 text-sm font-black truncate px-1 ${p.vencedorEscolaId === p.escolaAId ? 'text-[#00A878]' : ''}`}>{p.escolaASigla || p.escolaANome}</span>
                        <span className="col-span-1 text-xl font-black">{p.placarA}×{p.placarB}</span>
                        <span className={`col-span-3 text-sm font-black truncate px-1 ${p.vencedorEscolaId === p.escolaBId ? 'text-[#00A878]' : ''}`}>{p.escolaBSigla || p.escolaBNome}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {slideAtual.payload.proximos.length > 0 && (
                <div className={`rounded-2xl p-5 border shadow-sm space-y-3 ${temaEscuro ? 'bg-[#15221E] border-white/10' : 'bg-white border-[#E2EAE5]'}`}>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#8B1D2C] flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Próximos Jogos ({slideAtual.payload.modNome})
                  </h3>
                  <div className="space-y-2.5">
                    {slideAtual.payload.proximos.map((p: PartidaEventoItem) => (
                      <div key={p.id} className={`rounded-xl p-3 border flex items-center justify-between gap-2 ${temaEscuro ? 'bg-white/5 border-white/10' : 'bg-[#F7F9F8] border-[#E2EAE5]'}`}>
                        <span className="px-2.5 py-1 rounded-lg bg-[#00A878] text-white text-xs font-black font-mono shrink-0">{p.horario}</span>
                        <span className="text-sm font-black truncate flex-1 text-center">
                          {p.escolaASigla || p.escolaANome} × {p.escolaBSigla || p.escolaBNome}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SLIDE: ARTILHARIA (GOLS POR MODALIDADE + FOTO 3x4) */}
        {slideAtual?.tipo === 'ARTILHARIA' && (
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-5">
            {slideAtual.payload.ranking.slice(0, 6).map((art: any, idx: number) => (
              <div
                key={art.id}
                className={`rounded-2xl p-5 border flex items-center justify-between gap-4 shadow-sm ${idx === 0
                  ? temaEscuro
                    ? 'bg-amber-950/30 border-amber-400/60'
                    : 'bg-amber-50/70 border-amber-300'
                  : temaEscuro
                    ? 'bg-[#15221E] border-white/10'
                    : 'bg-white border-[#E2EAE5]'
                  }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl font-black shrink-0 ${idx === 0 ? 'bg-amber-400 text-amber-950' : 'bg-[#00A878] text-white'}`}>
                    {idx + 1}º
                  </span>
                  {art.fotoUrl ? (
                    <img src={art.fotoUrl} alt={art.atletaNome} className="w-16 h-16 rounded-2xl object-cover border-2 border-[#00A878] shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-slate-200/40 flex items-center justify-center shrink-0">
                      <User className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xl font-black truncate">{art.atletaNome}</p>
                    <p className={`text-sm font-bold truncate ${temaEscuro ? 'text-slate-300' : 'text-slate-500'}`}>
                      {art.escolaSigla || art.escolaNome} • {art.categoria}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-4xl font-black text-[#00A878]">{art.gols}</span>
                  <span className="block text-[11px] font-black uppercase text-slate-400">Gols</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SLIDE: CRONOGRAMA (ATÉ 6 CARDS COMPACTOS SEM CORTAR) */}
        {slideAtual?.tipo === 'CRONOGRAMA' && (
          <div
            className={`w-full max-w-6xl max-h-full grid grid-cols-1 md:grid-cols-2 ${
              slideAtual.payload.length > 4 ? 'lg:grid-cols-3 gap-4' : 'gap-5'
            }`}
          >
            {slideAtual.payload.map((item: any) => (
              <div
                key={item.id}
                className={`rounded-2xl p-4 sm:p-5 border-l-8 border shadow-sm space-y-2 flex flex-col justify-between ${item.status === 'EM_ANDAMENTO'
                  ? temaEscuro
                    ? 'bg-rose-950/40 border-rose-500/40 border-l-rose-500'
                    : 'bg-rose-50 border-rose-200 border-l-rose-600'
                  : item.status === 'CONCLUIDO'
                    ? temaEscuro
                      ? 'bg-emerald-950/40 border-emerald-500/30 border-l-[#00A878]'
                      : 'bg-white border-[#E2EAE5] border-l-[#00A878]'
                    : temaEscuro
                      ? 'bg-[#15221E] border-white/10 border-l-amber-400'
                      : 'bg-white border-[#E2EAE5] border-l-amber-500'
                  }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-black text-[#00A878] font-mono">
                      {item.horarioInicio} • {formatarDataBR(item.dataEvento)}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shrink-0 ${item.status === 'EM_ANDAMENTO'
                        ? 'bg-rose-600 text-white'
                        : item.status === 'CONCLUIDO'
                          ? 'bg-[#00A878] text-white'
                          : 'bg-amber-100 text-amber-900'
                        }`}
                    >
                      {item.status === 'EM_ANDAMENTO' ? 'Agora' : item.status === 'CONCLUIDO' ? 'Concluído' : 'Previsto'}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black leading-snug line-clamp-2">{item.titulo}</h3>
                  {(item.resumoResultado || item.descricao) && (
                    <p className={`text-xs sm:text-sm leading-relaxed line-clamp-2 ${temaEscuro ? 'text-slate-300' : 'text-slate-600'}`}>
                      {item.resumoResultado || item.descricao}
                    </p>
                  )}
                </div>
                {item.local && (
                  <p className={`text-xs font-bold flex items-center gap-1.5 pt-1 truncate ${temaEscuro ? 'text-slate-300' : 'text-slate-500'}`}>
                    <MapPin className="w-3.5 h-3.5 text-[#00A878] shrink-0" />
                    <span className="truncate">{item.local}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* SLIDE: QUADRO OLÍMPICO DE MEDALHAS COM PÓDIO TOP 3 VISUAL */}
        {slideAtual?.tipo === 'MEDALHAS' && (
          <div className="w-full max-w-6xl space-y-6">
            {/* Pódio Top 3 */}
            <div className="grid grid-cols-3 gap-4 items-end max-w-4xl mx-auto">
              {/* 2º Lugar (Prata) */}
              {slideAtual.payload[1] ? (
                <div className={`rounded-2xl p-5 border text-center space-y-1 shadow-sm ${temaEscuro ? 'bg-[#15221E] border-slate-500/40' : 'bg-white border-slate-300'}`}>
                  <span className="text-3xl">🥈</span>
                  <p className="text-xs font-black uppercase text-slate-400">2º Lugar</p>
                  <p className="text-lg font-black truncate">{slideAtual.payload[1].escolaSigla}</p>
                  <p className="text-sm font-bold text-[#00A878]">
                    🥇{slideAtual.payload[1].ouro} · 🥈{slideAtual.payload[1].prata} · 🥉{slideAtual.payload[1].bronze}
                  </p>
                </div>
              ) : <div />}

              {/* 1º Lugar (Ouro — mais alto!) */}
              {slideAtual.payload[0] && (
                <div className={`rounded-3xl p-6 border-2 border-amber-400 text-center space-y-1.5 shadow-xl -mb-1 ${temaEscuro ? 'bg-amber-950/30' : 'bg-amber-50/70'}`}>
                  <span className="text-5xl">🥇</span>
                  <p className="text-xs font-black uppercase text-amber-600 tracking-wider">1º Lugar Geral</p>
                  <p className="text-2xl font-black truncate">{slideAtual.payload[0].escolaSigla}</p>
                  <p className="text-base font-black text-[#087A5B]">
                    🥇{slideAtual.payload[0].ouro} · 🥈{slideAtual.payload[0].prata} · 🥉{slideAtual.payload[0].bronze}
                  </p>
                </div>
              )}

              {/* 3º Lugar (Bronze) */}
              {slideAtual.payload[2] ? (
                <div className={`rounded-2xl p-5 border text-center space-y-1 shadow-sm ${temaEscuro ? 'bg-[#15221E] border-amber-700/40' : 'bg-white border-amber-200'}`}>
                  <span className="text-3xl">🥉</span>
                  <p className="text-xs font-black uppercase text-amber-700">3º Lugar</p>
                  <p className="text-lg font-black truncate">{slideAtual.payload[2].escolaSigla}</p>
                  <p className="text-sm font-bold text-[#00A878]">
                    🥇{slideAtual.payload[2].ouro} · 🥈{slideAtual.payload[2].prata} · 🥉{slideAtual.payload[2].bronze}
                  </p>
                </div>
              ) : <div />}
            </div>

            {/* Demais escolas em tabela compacta */}
            {slideAtual.payload.length > 3 && (
              <div className={`rounded-2xl overflow-hidden border shadow-sm max-w-4xl mx-auto ${temaEscuro ? 'bg-[#15221E] border-white/10' : 'bg-white border-[#E2EAE5]'}`}>
                <table className="w-full text-left text-base font-bold">
                  <thead className="bg-[#8B1D2C] text-white text-xs uppercase font-black">
                    <tr>
                      <th className="py-2.5 px-5">Pos.</th>
                      <th className="py-2.5 px-5">Escola</th>
                      <th className="py-2.5 px-3 text-center">🥇</th>
                      <th className="py-2.5 px-3 text-center">🥈</th>
                      <th className="py-2.5 px-3 text-center">🥉</th>
                      <th className="py-2.5 px-5 text-center bg-[#00A878]">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/20">
                    {slideAtual.payload.slice(3, 8).map((row: any, i: number) => (
                      <tr key={row.escolaId}>
                        <td className="py-2.5 px-5 font-black">{i + 4}º</td>
                        <td className="py-2.5 px-5 font-black">{row.escolaNome}</td>
                        <td className="py-2.5 px-3 text-center">{row.ouro}</td>
                        <td className="py-2.5 px-3 text-center">{row.prata}</td>
                        <td className="py-2.5 px-3 text-center">{row.bronze}</td>
                        <td className="py-2.5 px-5 text-center font-black text-[#00A878]">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SLIDE: QR CODE PORTAL PÚBLICO */}
        {slideAtual?.tipo === 'QRCODE' && (
          <div className={`w-full max-w-5xl rounded-3xl p-8 sm:p-12 border shadow-lg flex flex-col md:flex-row items-center justify-between gap-10 ${temaEscuro ? 'bg-[#15221E] border-white/10' : 'bg-white border-[#E2EAE5]'}`}>
            <div className="space-y-4 max-w-xl text-center md:text-left">
              <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 p-2 mx-auto md:mx-0 shadow-xs">
                <img src={logoUrl} alt={siglaEvento} className="w-full h-full object-contain" />
              </div>
              <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                Acompanhe tudo ao vivo pelo seu celular!
              </h2>
              <p className={`text-lg sm:text-xl leading-relaxed ${temaEscuro ? 'text-slate-300' : 'text-[#4B5563]'}`}>
                Aponte a câmera para o QR Code ao lado para ver placares, notícias do dia, cronograma, artilharia e o quadro de medalhas dos <strong>{siglaEvento}</strong>.
              </p>
            </div>
            {qrPublicoUrl && (
              <div className="bg-white p-5 rounded-3xl border-4 border-[#00A878] shadow-xl shrink-0">
                <img src={qrPublicoUrl} alt="QR Code Eventos do Dia" className="w-56 h-56 sm:w-64 sm:h-64" />
              </div>
            )}
          </div>
        )}
      </main>

      {/* TICKER JORNALÍSTICO CONTÍNUO */}
      <footer className="bg-[#8B1D2C] text-white h-12 flex items-center overflow-hidden border-t-2 border-[#D97706] shrink-0">
        <div className="bg-[#00A878] h-full px-5 flex items-center gap-2 font-black text-xs sm:text-sm uppercase tracking-wider shrink-0 z-10 shadow-md">
          <Radio className="w-4 h-4 animate-pulse" />
          <span>{siglaEvento}</span>
        </div>
        <div className="flex-1 overflow-hidden whitespace-nowrap">
          <div className="inline-flex items-center gap-12 anim-ticker font-bold text-sm sm:text-base tracking-wide">
            {[...itensTicker, ...itensTicker].map((txt, idx) => (
              <span key={idx} className="inline-flex items-center gap-3">
                <span>{txt}</span>
                <span className="text-amber-300">•</span>
              </span>
            ))}
          </div>
        </div>
      </footer>

      {/* POPOVER DE FILTRO DE MODALIDADES DO DIA */}
      {mostrarFiltroMods && mostrarControles && (
        <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[160] bg-[#17221D]/95 text-white p-4 rounded-2xl border border-white/15 shadow-2xl max-w-xl w-[90vw] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-300">
              Filtrar Modalidades no Telão (Foco da Etapa)
            </span>
            {modalidadesSelecionadas.length > 0 && (
              <button
                type="button"
                onClick={() => setModalidadesSelecionadas([])}
                className="text-xs font-bold text-emerald-400 hover:underline cursor-pointer"
              >
                Mostrar Todas
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {MODALIDADES_EVENTOS_OPCOES.map((m) => {
              const ativo = modalidadesSelecionadas.includes(m.codigo);
              return (
                <button
                  key={m.codigo}
                  type="button"
                  onClick={() =>
                    setModalidadesSelecionadas((prev) =>
                      ativo ? prev.filter((x) => x !== m.codigo) : [...prev, m.codigo]
                    )
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer border ${ativo
                    ? 'bg-[#00A878] text-white border-[#00A878]'
                    : 'bg-white/10 text-slate-200 border-white/15 hover:bg-white/20'
                    }`}
                >
                  {m.nome}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* BARRA FLUTUANTE DE CONTROLES */}
      <div
        className={`fixed bottom-16 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#17221D]/92 text-white backdrop-blur-md shadow-2xl border border-white/15 transition-opacity duration-300 ${mostrarControles ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
      >
        <Link href="/eventos" className="p-2 rounded-xl hover:bg-white/10" title="Voltar ao Portal">
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <button type="button" onClick={() => irParaSlideComWhoosh(slideIdx - 1)} className="p-2 rounded-xl hover:bg-white/10 cursor-pointer" title="Slide Anterior">
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button type="button" onClick={() => setPausado((p) => !p)} className="px-3 py-1.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-xs font-black flex items-center gap-1.5 cursor-pointer">
          {pausado ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          <span>{pausado ? 'Retomar' : 'Pausar'}</span>
        </button>

        <button type="button" onClick={() => irParaSlideComWhoosh(slideIdx + 1)} className="p-2 rounded-xl hover:bg-white/10 cursor-pointer" title="Próximo Slide (Whoosh)">
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-white/20 mx-1" />

        <button
          type="button"
          onClick={() => setMostrarFiltroMods((v) => !v)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${modalidadesSelecionadas.length > 0 ? 'bg-amber-500 text-amber-950' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          title="Escolher quais modalidades passam no telão"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>{modalidadesSelecionadas.length > 0 ? `${modalidadesSelecionadas.length} Mod.` : 'Modalidades'}</span>
        </button>

        <select
          value={segundosPorSlide}
          onChange={(e) => setSegundosPorSlide(Number(e.target.value))}
          className="bg-white/10 text-white text-xs font-bold rounded-lg px-2 py-1.5 focus:outline-none cursor-pointer"
          title="Tempo por slide"
        >
          <option value={8} className="text-slate-900">8s</option>
          <option value={12} className="text-slate-900">12s</option>
          <option value={15} className="text-slate-900">15s</option>
          <option value={20} className="text-slate-900">20s</option>
        </select>

        <button
          type="button"
          onClick={() => setTemaEscuro((t) => !t)}
          className="p-2 rounded-xl hover:bg-white/10 cursor-pointer"
          title={temaEscuro ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro Esportivo'}
        >
          {temaEscuro ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4" />}
        </button>

        <button type="button" onClick={toggleFullscreen} className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold flex items-center gap-1.5 cursor-pointer">
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          <span>{isFullscreen ? 'Sair' : 'Tela Cheia'}</span>
        </button>
      </div>
    </div>
  );
}
