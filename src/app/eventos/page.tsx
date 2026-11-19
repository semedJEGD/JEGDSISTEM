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
  CheckCircle2,
  RefreshCw,
  User,
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

type AbaPublica = 'COBERTURA' | 'JOGOS' | 'TABELAS' | 'ARTILHARIA' | 'MEDALHAS';

export default function EventosDoDiaPage() {
  const [aba, setAba] = useState<AbaPublica>('COBERTURA');
  const [filtroMod, setFiltroMod] = useState<string>('TODAS');
  const [municipioId, setMunicipioId] = useState<string | undefined>(undefined);
  const [siglaEvento, setSiglaEvento] = useState('JEGDS 2026');
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
    const mun = JegdStorage.getCurrentMunicipio();
    if (mun) {
      setMunicipioId(mun.id);
      setSiglaEvento(mun.siglaEvento || 'JEGDS 2026');
    }
  }, []);

  const carregar = useCallback(async (silencioso = false) => {
    try {
      if (!silencioso) setCarregando(true);
      const data = await EventosApi.carregar(municipioId);
      setBundle(data);
    } catch (err) {
      console.error('Erro ao buscar eventos:', err);
    } finally {
      if (!silencioso) setCarregando(false);
    }
  }, [municipioId]);

  useEffect(() => {
    carregar(false);
    const interval = setInterval(() => carregar(true), 15000);
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
  const avisosAtivos = useMemo(() => bundle.avisos.filter((a) => a.ativo), [bundle.avisos]);

  const modalidadesComJogos = useMemo(() => {
    const map = new Map<string, string>();
    bundle.partidas.forEach((p) => map.set(p.modalidadeCodigo, p.modalidadeNome));
    return Array.from(map.entries());
  }, [bundle.partidas]);

  const manchetePrincipal = bundle.noticias[0] || null;
  const demaisNoticias = bundle.noticias.slice(1);

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6 w-full">
      {/* CABEÇALHO DO PORTAL DE EVENTOS DO DIA */}
      <div className="bg-white border border-[#E2EAE5] rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-black uppercase tracking-wider">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Cobertura em Tempo Real</span>
            </span>
            <span className="text-xs font-semibold text-slate-400">• Atualização automática a cada 15s</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-[#17221D] tracking-tight">
            Eventos do Dia • {siglaEvento}
          </h1>
          <p className="text-xs sm:text-sm text-[#4B5563] max-w-2xl">
            Acompanhe notícias da competição, cronograma oficial, placares ao vivo, tabelas de classificação, artilharia por modalidade e o quadro olímpico de medalhas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
          <button
            type="button"
            onClick={() => carregar(false)}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-[#E2EAE5] text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
            <span>Atualizar</span>
          </button>

          <Link
            href="/eventos/telao"
            target="_blank"
            className="flex-1 md:flex-none px-5 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Tv className="w-4 h-4" />
            <span>Modo Telão (Apresentação)</span>
          </Link>
        </div>
      </div>

      {/* FAIXA DE AVISOS / CHAMADA DE QUADRA */}
      {avisosAtivos.length > 0 && (
        <div className="bg-[#FFFBEB] border border-amber-300/80 border-l-4 border-l-amber-500 rounded-xl px-4 py-3 flex items-start sm:items-center gap-3 shadow-2xs">
          <Megaphone className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
          <div className="text-xs sm:text-sm text-amber-950 space-y-0.5">
            {avisosAtivos.slice(0, 2).map((av) => (
              <p key={av.id}>
                <strong className="uppercase font-black">{av.titulo}:</strong> {av.mensagem}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* DESTAQUE IMEDIATO: JOGOS AO VIVO */}
      {partidasAoVivo.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
            <h2 className="text-sm font-black uppercase tracking-wider text-rose-700">
              Acontecendo Agora em Quadra ({partidasAoVivo.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partidasAoVivo.map((p) => (
              <div key={p.id} className="bg-white border-2 border-rose-400 rounded-2xl p-4 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-black text-[#8B1D2C] uppercase">{p.modalidadeNome} • {p.categoria}</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">● AO VIVO</span>
                </div>
                <div className="grid grid-cols-7 items-center text-center bg-[#F7F9F8] rounded-xl py-3 px-2 border border-[#E2EAE5]">
                  <div className="col-span-3 font-black text-xs sm:text-sm text-[#17221D] truncate px-1">{p.escolaASigla || p.escolaANome}</div>
                  <div className="col-span-1 text-2xl font-black text-[#8B1D2C]">{p.placarA}×{p.placarB}</div>
                  <div className="col-span-3 font-black text-xs sm:text-sm text-[#17221D] truncate px-1">{p.escolaBSigla || p.escolaBNome}</div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{p.grupo || FASES_LABEL[p.fase] || p.fase}</span>
                  <span>{p.local || 'Quadra Oficial'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NAVEGAÇÃO POR ABAS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#E2EAE5]">
        {(
          [
            { id: 'COBERTURA', label: 'Notícias & Cronograma', icon: Newspaper },
            { id: 'JOGOS', label: `Jogos & Placares (${bundle.partidas.length})`, icon: Trophy },
            { id: 'TABELAS', label: 'Tabelas & Chaveamento', icon: CalendarClock },
            { id: 'ARTILHARIA', label: `Artilharia / Gols (${bundle.artilharia.length})`, icon: Target },
            { id: 'MEDALHAS', label: `Quadro de Medalhas (${bundle.medalhas.length})`, icon: Medal },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const ativo = aba === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setAba(tab.id)}
              className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                ativo
                  ? 'border-[#00A878] text-[#087A5B] bg-[#E8F7F1]/60'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* ABA 1: PORTAL DE NOTÍCIAS & LINHA DO TEMPO DO CRONOGRAMA */}
      {/* ============================================================ */}
      {aba === 'COBERTURA' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda (2/3): Portal de Notícias / Boletins do Dia */}
          <div className="lg:col-span-2 space-y-5">
            <h2 className="text-lg font-black text-[#17221D] flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-[#00A878]" />
              <span>Boletim & Destaques da Competição</span>
            </h2>

            {manchetePrincipal ? (
              <article className="bg-white border border-[#E2EAE5] rounded-2xl overflow-hidden shadow-xs">
                {manchetePrincipal.imagemUrl && (
                  <div className="w-full h-64 sm:h-80 bg-slate-100 overflow-hidden">
                    <img src={manchetePrincipal.imagemUrl} alt={manchetePrincipal.titulo} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#8B1D2C] text-white text-[11px] font-black uppercase">
                      {manchetePrincipal.modalidadeNome || 'Destaque do Dia'}
                    </span>
                    {manchetePrincipal.categoria && (
                      <span className="px-2.5 py-0.5 rounded-md bg-[#E8F7F1] text-[#087A5B] text-[11px] font-bold">
                        {manchetePrincipal.categoria}
                      </span>
                    )}
                    {manchetePrincipal.horarioOcorrencia && (
                      <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {manchetePrincipal.horarioOcorrencia}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#17221D] leading-tight">
                    {manchetePrincipal.titulo}
                  </h3>
                  <p className="text-sm text-[#4B5563] leading-relaxed whitespace-pre-line">
                    {manchetePrincipal.resumo}
                  </p>
                  {manchetePrincipal.local && (
                    <p className="text-xs font-semibold text-slate-500 flex items-center gap-1 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-[#00A878]" /> {manchetePrincipal.local}
                    </p>
                  )}
                </div>
              </article>
            ) : (
              <div className="bg-white border border-[#E2EAE5] rounded-2xl p-8 text-center space-y-2">
                <Newspaper className="w-10 h-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-black text-[#17221D]">Cobertura Oficial Pronta para Começar</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Assim que a Coordenação SEMED publicar os boletins das provas e jogos do dia, as notícias com fotos e resultados aparecerão automaticamente aqui e no Telão.
                </p>
              </div>
            )}

            {demaisNoticias.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {demaisNoticias.map((n) => (
                  <article key={n.id} className="bg-white border border-[#E2EAE5] rounded-2xl overflow-hidden shadow-2xs flex flex-col">
                    {n.imagemUrl && (
                      <img src={n.imagemUrl} alt={n.titulo} className="w-full h-40 object-cover" />
                    )}
                    <div className="p-4 space-y-2 flex-1">
                      <span className="text-[10px] font-black uppercase text-[#087A5B] bg-[#E8F7F1] px-2 py-0.5 rounded-md">
                        {n.modalidadeNome || 'JEGDS'} {n.horarioOcorrencia ? `• ${n.horarioOcorrencia}` : ''}
                      </span>
                      <h4 className="text-sm font-black text-[#17221D] leading-snug">{n.titulo}</h4>
                      <p className="text-xs text-slate-600 leading-relaxed">{n.resumo}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          {/* Coluna Direita (1/3): Linha do Tempo do Cronograma (Ocorreu / Agora / Previsto) */}
          <div className="space-y-4">
            <h2 className="text-lg font-black text-[#17221D] flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-[#00A878]" />
              <span>Cronograma Oficial</span>
            </h2>
            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-4 shadow-2xs space-y-3">
              {cronogramaExibicao.map((item: any) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border-l-4 border ${
                    item.status === 'EM_ANDAMENTO'
                      ? 'bg-rose-50/60 border-rose-200 border-l-rose-600'
                      : item.status === 'CONCLUIDO'
                      ? 'bg-emerald-50/40 border-emerald-200/70 border-l-[#00A878]'
                      : 'bg-[#F7F9F8] border-[#E2EAE5] border-l-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-[10px] font-black uppercase">
                    <span className="text-slate-600">
                      {formatarDataBR(item.dataEvento)} • {item.horarioInicio}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        item.status === 'EM_ANDAMENTO'
                          ? 'bg-rose-600 text-white'
                          : item.status === 'CONCLUIDO'
                          ? 'bg-[#00A878] text-white'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {item.status === 'EM_ANDAMENTO' ? 'Agora' : item.status === 'CONCLUIDO' ? 'Ocorreu' : 'Previsto'}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-black text-[#17221D] mt-1">{item.titulo}</h4>
                  {item.local && (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {item.local}
                    </p>
                  )}
                  {(item.resumoResultado || item.descricao) && (
                    <p className="text-xs text-slate-600 mt-1.5 leading-snug">
                      {item.resumoResultado || item.descricao}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ABA 2: JOGOS & PLACARES */}
      {/* ============================================================ */}
      {aba === 'JOGOS' && (
        <div className="space-y-5">
          {modalidadesComJogos.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFiltroMod('TODAS')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                  filtroMod === 'TODAS' ? 'bg-[#17221D] text-white border-[#17221D]' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                Todas as Modalidades
              </button>
              {modalidadesComJogos.map(([cod, nome]) => (
                <button
                  key={cod}
                  type="button"
                  onClick={() => setFiltroMod(cod)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                    filtroMod === cod ? 'bg-[#00A878] text-white border-[#00A878]' : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  {nome}
                </button>
              ))}
            </div>
          )}

          {partidasFiltradas.length === 0 ? (
            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-10 text-center text-sm text-slate-500">
              Nenhuma partida cadastrada para este filtro ainda.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {partidasFiltradas.map((p) => (
                <div key={p.id} className="bg-white border border-[#E2EAE5] rounded-2xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-black text-[#087A5B] uppercase">
                      {p.modalidadeNome} • {p.categoria} ({p.sexo === 'FEMININO' ? 'F' : 'M'})
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        p.status === 'AO_VIVO'
                          ? 'bg-rose-600 text-white'
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

                  <div className="grid grid-cols-7 items-center text-center bg-[#F7F9F8] rounded-xl py-3 px-2 border border-[#E2EAE5]">
                    <div className={`col-span-3 text-xs font-black truncate px-1 ${p.vencedorEscolaId === p.escolaAId ? 'text-[#087A5B]' : 'text-[#17221D]'}`}>
                      {p.escolaASigla || p.escolaANome}
                    </div>
                    <div className="col-span-1 text-xl font-black text-[#17221D]">
                      {p.status === 'AGENDADO' ? '×' : `${p.placarA}×${p.placarB}`}
                    </div>
                    <div className={`col-span-3 text-xs font-black truncate px-1 ${p.vencedorEscolaId === p.escolaBId ? 'text-[#087A5B]' : 'text-[#17221D]'}`}>
                      {p.escolaBSigla || p.escolaBNome}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
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
      {/* ABA 3: TABELAS DE GRUPOS & CHAVEAMENTO MATA-MATA */}
      {/* ============================================================ */}
      {aba === 'TABELAS' && (
        <div className="space-y-8">
          {classificacoes.length === 0 && mataMata.length === 0 ? (
            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-10 text-center text-sm text-slate-500">
              As tabelas de classificação e chaveamentos aparecem automaticamente assim que as partidas forem cadastradas pela SEMED.
            </div>
          ) : (
            <>
              {classificacoes.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {classificacoes.map((tab) => (
                    <div key={tab.chave} className="bg-white border border-[#E2EAE5] rounded-2xl overflow-hidden shadow-2xs">
                      <div className="px-5 py-3.5 bg-[#F7F9F8] border-b border-[#E2EAE5] flex items-center justify-between">
                        <h3 className="text-sm font-black text-[#17221D]">
                          {tab.modalidadeNome} • {tab.categoria} ({tab.sexo === 'FEMININO' ? 'F' : 'M'})
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-md bg-[#E8F7F1] text-[#087A5B] text-xs font-bold">
                          {tab.grupo}
                        </span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black border-b border-slate-200">
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
                                <td className="py-2.5 px-3 font-black text-slate-500">{i + 1}º</td>
                                <td className="py-2.5 px-3 font-bold text-[#17221D]">{l.escolaSigla}</td>
                                <td className="py-2.5 px-2 text-center">{l.jogos}</td>
                                <td className="py-2.5 px-2 text-center font-semibold text-emerald-700">{l.vitorias}</td>
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
                  <h3 className="text-lg font-black text-[#17221D]">Chaveamento — Fases Eliminatórias</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mataMata.map((p) => (
                      <div key={p.id} className="bg-white border-2 border-[#00A878]/30 rounded-2xl p-4 space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-black text-[#8B1D2C] uppercase">{FASES_LABEL[p.fase] || p.fase}</span>
                          <span className="font-bold text-slate-500">{p.modalidadeNome} • {p.categoria}</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${p.vencedorEscolaId === p.escolaAId ? 'bg-[#E8F7F1] border-[#00A878]/40 font-black' : 'bg-[#F7F9F8] border-[#E2EAE5] font-bold'}`}>
                            <span className="text-xs truncate">{p.escolaASigla || p.escolaANome}</span>
                            <span className="text-sm font-black">{p.status === 'AGENDADO' ? '-' : p.placarA}</span>
                          </div>
                          <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${p.vencedorEscolaId === p.escolaBId ? 'bg-[#E8F7F1] border-[#00A878]/40 font-black' : 'bg-[#F7F9F8] border-[#E2EAE5] font-bold'}`}>
                            <span className="text-xs truncate">{p.escolaBSigla || p.escolaBNome}</span>
                            <span className="text-sm font-black">{p.status === 'AGENDADO' ? '-' : p.placarB}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* ABA 4: RANKING DE ARTILHARIA / GOLS POR MODALIDADE */}
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
                    <h3 className="text-sm font-black text-[#17221D] flex items-center gap-2">
                      <Target className="w-4 h-4 text-[#00A878]" />
                      <span>Artilharia • {grupo.modalidadeNome}</span>
                    </h3>
                    <span className="text-xs font-bold text-[#087A5B]">Top Goleadores</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {grupo.ranking.map((art, i) => (
                      <div key={art.id} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${i === 0 ? 'bg-amber-400 text-amber-950' : i === 1 ? 'bg-slate-200 text-slate-800' : i === 2 ? 'bg-amber-700/20 text-amber-900' : 'bg-slate-100 text-slate-500'}`}>
                            {i + 1}º
                          </span>
                          {art.fotoUrl ? (
                            <img src={art.fotoUrl} alt={art.atletaNome} className="w-10 h-10 rounded-full object-cover border-2 border-[#00A878] shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                              <User className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-black text-[#17221D] truncate">{art.atletaNome}</p>
                            <p className="text-xs font-semibold text-slate-500 truncate">{art.escolaSigla || art.escolaNome} • {art.categoria}</p>
                          </div>
                        </div>
                        <div className="px-3 py-1 rounded-xl bg-[#E8F7F1] border border-[#00A878]/20 text-[#087A5B] font-black text-sm shrink-0">
                          {art.gols} {art.gols === 1 ? 'gol' : 'gols'}
                        </div>
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
      {/* ABA 5: QUADRO OLÍMPICO DE MEDALHAS */}
      {/* ============================================================ */}
      {aba === 'MEDALHAS' && (
        <div className="space-y-6">
          {quadroMedalhas.length === 0 ? (
            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-10 text-center text-sm text-slate-500">
              O Quadro Geral de Medalhas será atualizado em tempo real conforme as premiações das etapas.
            </div>
          ) : (
            <div className="bg-white border border-[#E2EAE5] rounded-2xl overflow-hidden shadow-2xs">
              <div className="px-6 py-4 bg-[#F7F9F8] border-b border-[#E2EAE5] flex items-center justify-between">
                <h3 className="text-base font-black text-[#17221D] flex items-center gap-2">
                  <Medal className="w-5 h-5 text-amber-500" />
                  <span>Quadro Geral de Medalhas (Critério Olímpico)</span>
                </h3>
                <span className="text-xs font-bold text-slate-500">Ouro → Prata → Bronze</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-black border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Pos.</th>
                      <th className="py-3 px-4">Escola / Delegação</th>
                      <th className="py-3 px-3 text-center">🥇 Ouro</th>
                      <th className="py-3 px-3 text-center">🥈 Prata</th>
                      <th className="py-3 px-3 text-center">🥉 Bronze</th>
                      <th className="py-3 px-4 text-center">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {quadroMedalhas.map((row, idx) => (
                      <tr key={row.escolaId} className={idx === 0 ? 'bg-amber-50/40' : ''}>
                        <td className="py-3.5 px-4 font-black text-[#17221D]">{idx + 1}º</td>
                        <td className="py-3.5 px-4 font-black text-[#17221D]">{row.escolaNome}</td>
                        <td className="py-3.5 px-3 text-center font-black text-amber-600">{row.ouro}</td>
                        <td className="py-3.5 px-3 text-center font-black text-slate-500">{row.prata}</td>
                        <td className="py-3.5 px-3 text-center font-black text-amber-800">{row.bronze}</td>
                        <td className="py-3.5 px-4 text-center font-black text-[#087A5B]">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
