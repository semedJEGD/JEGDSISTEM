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
  Trophy,
  Newspaper,
  CalendarClock,
  Target,
  Medal,
  Radio,
  Clock,
  MapPin,
  User,
  Sparkles,
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { EventosBundle } from '@/types/eventos';
import {
  EventosApi,
  CRONOGRAMA_PADRAO_JEGDS,
  FASES_LABEL,
  calcularClassificacaoPorChave,
  calcularQuadroMedalhas,
  agruparArtilhariaPorModalidade,
  formatarDataBR,
} from '@/lib/eventos-service';

type SlideDef = {
  id: string;
  tag: string;
  titulo: string;
  tipo: 'NOTICIA' | 'AO_VIVO' | 'CRONOGRAMA' | 'RESULTADOS' | 'CLASSIFICACAO' | 'ARTILHARIA' | 'MEDALHAS' | 'QRCODE';
  payload?: any;
};

export default function TelaoEventosPage() {
  const [municipioId, setMunicipioId] = useState<string | undefined>(undefined);
  const [siglaEvento, setSiglaEvento] = useState('JEGDS 2026');
  const [nomeEvento, setNomeEvento] = useState('Jogos Escolares de Gonçalves Dias');
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
  const [relogio, setRelogio] = useState('');
  const [qrPublicoUrl, setQrPublicoUrl] = useState('');

  // Estado da transição cinematográfica WHOOSH com logo JEGDS
  const [whooshAtivo, setWhooshAtivo] = useState(false);
  const [progressoKey, setProgressoKey] = useState(0);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const whooshLockRef = useRef(false);

  useEffect(() => {
    JegdStorage.init();
    const mun = JegdStorage.getCurrentMunicipio();
    if (mun) {
      setMunicipioId(mun.id);
      setSiglaEvento(mun.siglaEvento || 'JEGDS 2026');
      setNomeEvento(mun.nomeEvento || 'Jogos Escolares de Gonçalves Dias');
      if (mun.logoUrl || mun.brasaoUrl) setLogoUrl(mun.logoUrl || mun.brasaoUrl || '/logo-jegd.png');
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://jegdsistem-nu.vercel.app';
    QRCode.toDataURL(`${origin}/eventos`, { margin: 1, width: 320, color: { dark: '#17221D', light: '#FFFFFF' } })
      .then(setQrPublicoUrl)
      .catch(() => {});
  }, []);

  // Relógio em tempo real
  useEffect(() => {
    const tick = () => {
      setRelogio(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-refresh silencioso de dados a cada 15 segundos
  const carregar = useCallback(async () => {
    try {
      const data = await EventosApi.carregar(municipioId);
      setBundle(data);
    } catch (err) {
      console.error('Erro ao atualizar telão:', err);
    }
  }, [municipioId]);

  useEffect(() => {
    carregar();
    const id = setInterval(carregar, 15000);
    return () => clearInterval(id);
  }, [carregar]);

  // Montar roteiro dinâmico de slides (pula slides vazios automaticamente!)
  const slides = useMemo<SlideDef[]>(() => {
    const lista: SlideDef[] = [];

    // 1. Notícias / Destaques marcados para o Telão
    const noticiasTelao = bundle.noticias.filter((n) => n.destaqueTelao !== false).slice(0, 4);
    noticiasTelao.forEach((n, idx) => {
      lista.push({
        id: `noticia-${n.id}`,
        tag: `DESTAQUE DO DIA ${noticiasTelao.length > 1 ? `${idx + 1}/${noticiasTelao.length}` : ''}`.trim(),
        titulo: n.titulo,
        tipo: 'NOTICIA',
        payload: n,
      });
    });

    // 2. Jogos AO VIVO agora
    const aoVivo = bundle.partidas.filter((p) => p.status === 'AO_VIVO');
    if (aoVivo.length > 0) {
      lista.push({
        id: 'ao-vivo',
        tag: 'EM QUADRA AGORA • AO VIVO',
        titulo: 'Placares em Tempo Real',
        tipo: 'AO_VIVO',
        payload: aoVivo,
      });
    }

    // 3. Cronograma do Dia (sempre presente — usa etapas oficiais se ainda vazio)
    const cron =
      bundle.cronograma.length > 0
        ? bundle.cronograma
        : CRONOGRAMA_PADRAO_JEGDS.map((c, i) => ({ ...c, id: `padrao-${i}` }));
    lista.push({
      id: 'cronograma',
      tag: 'CRONOGRAMA OFICIAL',
      titulo: 'O Que Já Ocorreu & Próximos Eventos',
      tipo: 'CRONOGRAMA',
      payload: cron,
    });

    // 4. Últimos Resultados Encerrados
    const encerrados = bundle.partidas.filter((p) => p.status === 'ENCERRADO' || p.status === 'WO').slice(-6).reverse();
    if (encerrados.length > 0) {
      lista.push({
        id: 'resultados',
        tag: 'ÚLTIMOS RESULTADOS',
        titulo: 'Placares Encerrados',
        tipo: 'RESULTADOS',
        payload: encerrados,
      });
    }

    // 5. Tabelas de Classificação por Grupo
    const classificacoes = calcularClassificacaoPorChave(bundle.partidas);
    classificacoes.slice(0, 4).forEach((tab) => {
      lista.push({
        id: `classif-${tab.chave}`,
        tag: `CLASSIFICAÇÃO • ${tab.grupo.toUpperCase()}`,
        titulo: `${tab.modalidadeNome} — ${tab.categoria} (${tab.sexo === 'FEMININO' ? 'Fem' : 'Masc'})`,
        tipo: 'CLASSIFICACAO',
        payload: tab,
      });
    });

    // 6. Ranking de Artilharia (Gols por Modalidade)
    const artilharia = agruparArtilhariaPorModalidade(bundle.artilharia);
    artilharia.forEach((grupo) => {
      lista.push({
        id: `art-${grupo.modalidadeCodigo}`,
        tag: 'RANKING DE ARTILHARIA',
        titulo: `Maiores Goleadores • ${grupo.modalidadeNome}`,
        tipo: 'ARTILHARIA',
        payload: grupo,
      });
    });

    // 7. Quadro Olímpico de Medalhas
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

    // 8. Slide Institucional + QR Code para acompanhar pelo celular
    lista.push({
      id: 'qrcode-portal',
      tag: 'ACOMPANHE NO CELULAR',
      titulo: `Portal Oficial de Cobertura • ${siglaEvento}`,
      tipo: 'QRCODE',
    });

    return lista;
  }, [bundle, siglaEvento]);

  // Transição WHOOSH com logo JEGDS entre slides!
  const irParaSlideComWhoosh = useCallback(
    (destinoIdx: number) => {
      if (whooshLockRef.current || slides.length <= 1) return;
      whooshLockRef.current = true;
      setWhooshAtivo(true);

      // Troca o slide exatamente no ápice da cortina diagonal (340ms)
      setTimeout(() => {
        setSlideIdx(((destinoIdx % slides.length) + slides.length) % slides.length);
        setProgressoKey((k) => k + 1);
      }, 340);

      // Finaliza a animação whoosh (780ms)
      setTimeout(() => {
        setWhooshAtivo(false);
        whooshLockRef.current = false;
      }, 780);
    },
    [slides.length]
  );

  // Rotação automática dos slides
  useEffect(() => {
    if (pausado || slides.length <= 1) return;
    const timer = setInterval(() => {
      irParaSlideComWhoosh(slideIdx + 1);
    }, segundosPorSlide * 1000);
    return () => clearInterval(timer);
  }, [pausado, segundosPorSlide, slideIdx, slides.length, irParaSlideComWhoosh]);

  // Atalhos de teclado (Espaço, Setas, F)
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

  // Auto-ocultar controles após 3s sem mexer o mouse
  const handleMouseMove = () => {
    setMostrarControles(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setMostrarControles(false), 3500);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Montar texto do Ticker inferior
  const itensTicker = useMemo(() => {
    const msgs: string[] = [];
    bundle.avisos
      .filter((a) => a.ativo)
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

  const slideAtual = slides[slideIdx % slides.length] || slides[0];

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`fixed inset-0 z-[100] flex flex-col overflow-hidden select-none transition-colors duration-300 ${
        temaEscuro ? 'bg-[#0B1210] text-white' : 'bg-[#F5F8F6] text-[#17221D]'
      }`}
    >
      {/* ESTILOS DE ANIMAÇÃO BROADCAST WHOOSH + MARQUEE + PROGRESSO */}
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

      {/* ============================================================ */}
      {/* OVERLAY DE TRANSIÇÃO WHOOSH COM LOGO OFICIAL DO JEGDS */}
      {/* ============================================================ */}
      {whooshAtivo && (
        <div className="fixed inset-0 z-[200] pointer-events-none overflow-hidden flex items-center justify-center">
          {/* Faixa 1: Carmim Oficial */}
          <div className="absolute inset-y-0 -left-[25%] w-[150%] bg-gradient-to-r from-[#8B1D2C] via-[#A62133] to-[#D97706] anim-whoosh-r1 shadow-2xl" />
          {/* Faixa 2: Verde Esmeralda Institucional */}
          <div className="absolute inset-y-0 -left-[25%] w-[142%] bg-gradient-to-r from-[#065F46] via-[#00A878] to-[#087A5B] anim-whoosh-r2 shadow-2xl" />
          {/* Emblema Central com Logo Oficial JEGDS */}
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

      {/* ============================================================ */}
      {/* BARRA SUPERIOR BROADCAST + PROGRESSO DO SLIDE */}
      {/* ============================================================ */}
      <header
        className={`relative px-6 sm:px-10 py-4 border-b flex items-center justify-between gap-4 shrink-0 ${
          temaEscuro ? 'bg-[#111B18] border-white/10' : 'bg-white border-[#E2EAE5]'
        }`}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 p-1 shadow-xs shrink-0">
            <img src={logoUrl} alt={siglaEvento} className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-0.5 rounded-md bg-[#8B1D2C] text-white text-xs font-black uppercase tracking-wider">
                {slideAtual?.tag}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#00A878]">
                {siglaEvento} • SEMED
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight truncate mt-0.5">
              {slideAtual?.titulo}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-5 shrink-0">
          <div className="hidden md:flex items-center gap-1.5">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => irParaSlideComWhoosh(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === slideIdx ? 'w-8 bg-[#00A878]' : temaEscuro ? 'w-2 bg-white/25' : 'w-2 bg-slate-300'
                }`}
              />
            ))}
          </div>

          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight leading-none text-[#00A878]">
              {relogio}
            </div>
            <span className={`text-[11px] font-bold uppercase tracking-wider ${temaEscuro ? 'text-slate-400' : 'text-slate-500'}`}>
              Slide {slideIdx + 1} / {slides.length}
            </span>
          </div>
        </div>

        {/* Barra de progresso animada */}
        {!pausado && slides.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-transparent overflow-hidden">
            <div
              key={progressoKey}
              className="h-full bg-gradient-to-r from-[#8B1D2C] via-[#D97706] to-[#00A878]"
              style={{ animation: `jegdsProgressBar ${segundosPorSlide}s linear forwards` }}
            />
          </div>
        )}
      </header>

      {/* ============================================================ */}
      {/* PALCO PRINCIPAL DO SLIDE (16:9 LIMPO E GIGANTE) */}
      {/* ============================================================ */}
      <main key={slideAtual?.id} className="flex-1 overflow-hidden px-6 sm:px-12 py-6 sm:py-8 flex items-center justify-center anim-slide-enter">
        {/* SLIDE: NOTÍCIA / DESTAQUE DO DIA */}
        {slideAtual?.tipo === 'NOTICIA' && (
          <div className={`w-full max-w-6xl rounded-3xl overflow-hidden border shadow-lg grid grid-cols-1 ${slideAtual.payload.imagemUrl ? 'lg:grid-cols-12' : ''} ${temaEscuro ? 'bg-[#15221E] border-white/10' : 'bg-white border-[#E2EAE5]'}`}>
            {slideAtual.payload.imagemUrl && (
              <div className="lg:col-span-6 h-72 lg:h-[480px] bg-slate-200 overflow-hidden">
                <img src={slideAtual.payload.imagemUrl} alt={slideAtual.payload.titulo} className="w-full h-full object-cover" />
              </div>
            )}
            <div className={`${slideAtual.payload.imagemUrl ? 'lg:col-span-6' : ''} p-8 sm:p-12 flex flex-col justify-center space-y-5`}>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3.5 py-1 rounded-full bg-[#00A878] text-white text-xs sm:text-sm font-black uppercase">
                  {slideAtual.payload.modalidadeNome || 'Boletim Oficial'}
                </span>
                {slideAtual.payload.horarioOcorrencia && (
                  <span className={`text-sm font-bold flex items-center gap-1.5 ${temaEscuro ? 'text-amber-300' : 'text-[#8B1D2C]'}`}>
                    <Clock className="w-4 h-4" /> {slideAtual.payload.horarioOcorrencia}
                  </span>
                )}
              </div>
              <h2 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight">
                {slideAtual.payload.titulo}
              </h2>
              <p className={`text-lg sm:text-2xl leading-relaxed ${temaEscuro ? 'text-slate-200' : 'text-[#374151]'}`}>
                {slideAtual.payload.resumo}
              </p>
              {slideAtual.payload.local && (
                <p className={`text-sm font-bold flex items-center gap-2 pt-2 ${temaEscuro ? 'text-emerald-300' : 'text-[#087A5B]'}`}>
                  <MapPin className="w-4 h-4" /> {slideAtual.payload.local}
                </p>
              )}
            </div>
          </div>
        )}

        {/* SLIDE: JOGOS AO VIVO */}
        {slideAtual?.tipo === 'AO_VIVO' && (
          <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6">
            {slideAtual.payload.slice(0, 4).map((p: any) => (
              <div key={p.id} className={`rounded-3xl p-6 sm:p-8 border-2 border-rose-500 shadow-lg space-y-5 ${temaEscuro ? 'bg-[#15221E]' : 'bg-white'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm sm:text-base font-black uppercase text-[#00A878]">
                    {p.modalidadeNome} • {p.categoria} ({p.sexo === 'FEMININO' ? 'F' : 'M'})
                  </span>
                  <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-black animate-pulse flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5" /> AO VIVO
                  </span>
                </div>
                <div className="grid grid-cols-7 items-center text-center gap-2">
                  <div className="col-span-3 text-xl sm:text-2xl font-black truncate">{p.escolaASigla || p.escolaANome}</div>
                  <div className="col-span-1 text-4xl sm:text-5xl font-black text-rose-600">{p.placarA}×{p.placarB}</div>
                  <div className="col-span-3 text-xl sm:text-2xl font-black truncate">{p.escolaBSigla || p.escolaBNome}</div>
                </div>
                <div className={`flex items-center justify-between text-sm font-bold ${temaEscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span>{p.grupo || FASES_LABEL[p.fase] || p.fase}</span>
                  <span>{p.local || 'Quadra Oficial'}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SLIDE: CRONOGRAMA DO DIA */}
        {slideAtual?.tipo === 'CRONOGRAMA' && (
          <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {slideAtual.payload.slice(0, 6).map((item: any) => (
              <div
                key={item.id}
                className={`rounded-2xl p-6 border-l-8 border shadow-sm space-y-2.5 ${
                  item.status === 'EM_ANDAMENTO'
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
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-black text-[#00A878]">
                    {formatarDataBR(item.dataEvento)} • {item.horarioInicio}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                      item.status === 'EM_ANDAMENTO'
                        ? 'bg-rose-600 text-white'
                        : item.status === 'CONCLUIDO'
                        ? 'bg-[#00A878] text-white'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {item.status === 'EM_ANDAMENTO' ? 'Agora' : item.status === 'CONCLUIDO' ? 'Já Ocorreu' : 'A Seguir'}
                  </span>
                </div>
                <h3 className="text-xl font-black leading-snug">{item.titulo}</h3>
                {item.local && (
                  <p className={`text-sm font-bold flex items-center gap-1.5 ${temaEscuro ? 'text-slate-300' : 'text-slate-500'}`}>
                    <MapPin className="w-4 h-4 text-[#00A878]" /> {item.local}
                  </p>
                )}
                {(item.resumoResultado || item.descricao) && (
                  <p className={`text-sm leading-relaxed line-clamp-3 ${temaEscuro ? 'text-slate-300' : 'text-slate-600'}`}>
                    {item.resumoResultado || item.descricao}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* SLIDE: ÚLTIMOS RESULTADOS */}
        {slideAtual?.tipo === 'RESULTADOS' && (
          <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {slideAtual.payload.map((p: any) => (
              <div key={p.id} className={`rounded-2xl p-6 border shadow-sm space-y-3 ${temaEscuro ? 'bg-[#15221E] border-white/10' : 'bg-white border-[#E2EAE5]'}`}>
                <div className="flex items-center justify-between text-xs font-black uppercase">
                  <span className="text-[#00A878]">{p.modalidadeNome} • {p.categoria}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">{p.status}</span>
                </div>
                <div className="grid grid-cols-7 items-center text-center py-2">
                  <div className={`col-span-3 text-lg font-black truncate ${p.vencedorEscolaId === p.escolaAId ? 'text-[#00A878]' : ''}`}>
                    {p.escolaASigla || p.escolaANome}
                  </div>
                  <div className="col-span-1 text-3xl font-black">{p.placarA}×{p.placarB}</div>
                  <div className={`col-span-3 text-lg font-black truncate ${p.vencedorEscolaId === p.escolaBId ? 'text-[#00A878]' : ''}`}>
                    {p.escolaBSigla || p.escolaBNome}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SLIDE: CLASSIFICAÇÃO DO GRUPO */}
        {slideAtual?.tipo === 'CLASSIFICACAO' && (
          <div className={`w-full max-w-5xl rounded-3xl overflow-hidden border shadow-lg ${temaEscuro ? 'bg-[#15221E] border-white/10' : 'bg-white border-[#E2EAE5]'}`}>
            <table className="w-full text-left">
              <thead className="bg-[#8B1D2C] text-white uppercase text-sm font-black">
                <tr>
                  <th className="py-4 px-6">Pos.</th>
                  <th className="py-4 px-6">Escola / Equipe</th>
                  <th className="py-4 px-4 text-center">J</th>
                  <th className="py-4 px-4 text-center">V</th>
                  <th className="py-4 px-4 text-center">E</th>
                  <th className="py-4 px-4 text-center">D</th>
                  <th className="py-4 px-4 text-center">SG</th>
                  <th className="py-4 px-6 text-center bg-[#00A878]">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/20 text-lg sm:text-xl font-bold">
                {slideAtual.payload.linhas.map((l: any, i: number) => (
                  <tr key={l.escolaId} className={i < 2 ? (temaEscuro ? 'bg-emerald-950/30' : 'bg-emerald-50/40') : ''}>
                    <td className="py-4 px-6 font-black">{i + 1}º</td>
                    <td className="py-4 px-6 font-black">{l.escolaNome}</td>
                    <td className="py-4 px-4 text-center">{l.jogos}</td>
                    <td className="py-4 px-4 text-center text-[#00A878]">{l.vitorias}</td>
                    <td className="py-4 px-4 text-center">{l.empates}</td>
                    <td className="py-4 px-4 text-center">{l.derrotas}</td>
                    <td className="py-4 px-4 text-center">{l.saldo}</td>
                    <td className="py-4 px-6 text-center font-black text-2xl text-[#00A878]">{l.pontos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SLIDE: ARTILHARIA (GOLS POR MODALIDADE + FOTO DO ATLETA!) */}
        {slideAtual?.tipo === 'ARTILHARIA' && (
          <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-5">
            {slideAtual.payload.ranking.slice(0, 6).map((art: any, idx: number) => (
              <div
                key={art.id}
                className={`rounded-2xl p-5 border flex items-center justify-between gap-4 shadow-sm ${
                  idx === 0
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

        {/* SLIDE: QUADRO OLÍMPICO DE MEDALHAS */}
        {slideAtual?.tipo === 'MEDALHAS' && (
          <div className={`w-full max-w-5xl rounded-3xl overflow-hidden border shadow-lg ${temaEscuro ? 'bg-[#15221E] border-white/10' : 'bg-white border-[#E2EAE5]'}`}>
            <table className="w-full text-left">
              <thead className="bg-[#8B1D2C] text-white uppercase text-sm font-black">
                <tr>
                  <th className="py-4 px-6">Pos.</th>
                  <th className="py-4 px-6">Escola / Delegação</th>
                  <th className="py-4 px-4 text-center">🥇 Ouro</th>
                  <th className="py-4 px-4 text-center">🥈 Prata</th>
                  <th className="py-4 px-4 text-center">🥉 Bronze</th>
                  <th className="py-4 px-6 text-center bg-[#00A878]">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/20 text-lg sm:text-xl font-bold">
                {slideAtual.payload.slice(0, 8).map((row: any, i: number) => (
                  <tr key={row.escolaId} className={i === 0 ? (temaEscuro ? 'bg-amber-950/30' : 'bg-amber-50/50') : ''}>
                    <td className="py-3.5 px-6 font-black">{i + 1}º</td>
                    <td className="py-3.5 px-6 font-black">{row.escolaNome}</td>
                    <td className="py-3.5 px-4 text-center text-amber-500 font-black text-2xl">{row.ouro}</td>
                    <td className="py-3.5 px-4 text-center text-slate-400 font-black text-2xl">{row.prata}</td>
                    <td className="py-3.5 px-4 text-center text-amber-700 font-black text-2xl">{row.bronze}</td>
                    <td className="py-3.5 px-6 text-center font-black text-2xl text-[#00A878]">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* ============================================================ */}
      {/* TICKER JORNALÍSTICO CONTÍNUO NO RODAPÉ */}
      {/* ============================================================ */}
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

      {/* ============================================================ */}
      {/* BARRA FLUTUANTE DE CONTROLES (APARECE AO MOVER O MOUSE) */}
      {/* ============================================================ */}
      <div
        className={`fixed bottom-16 left-1/2 -translate-x-1/2 z-[150] flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[#17221D]/92 text-white backdrop-blur-md shadow-2xl border border-white/15 transition-opacity duration-300 ${
          mostrarControles ? 'opacity-100' : 'opacity-0 pointer-events-none'
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
