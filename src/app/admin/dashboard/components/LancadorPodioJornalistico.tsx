'use client';

import React, { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, Megaphone, CheckCircle2 } from 'lucide-react';
import { Atleta, Escola } from '@/types/jegd';
import {
  EventosApi,
  MODALIDADES_EVENTOS_OPCOES,
  CATEGORIAS_EVENTOS,
} from '@/lib/eventos-service';
import {
  CardPodioJornalistico,
  DadosPodioJornalistico,
  serializarPodioConteudo,
} from '@/components/eventos/CardPodioJornalistico';

interface LancadorPodioJornalisticoProps {
  municipioId?: string;
  escolas: Escola[];
  atletas: Atleta[];
  onPublicado: () => Promise<void>;
}

const SELOS_ESTILO = [
  'É OURO!',
  'CAMPEÃO!',
  'PÓDIO OFICIAL',
  'DESTAQUE DO DIA',
] as const;

export function LancadorPodioJornalistico({
  municipioId,
  escolas,
  atletas,
  onPublicado,
}: LancadorPodioJornalisticoProps) {
  const [modCodigo, setModCodigo] = useState('atletismo');
  const [categoria, setCategoria] = useState('INFANTIL');
  const [sexo, setSexo] = useState<'MASCULINO' | 'FEMININO'>('MASCULINO');
  const [prova, setProva] = useState('');
  const [selo, setSelo] = useState<string>('É OURO!');

  // 1º Ouro
  const [ouroEscolaId, setOuroEscolaId] = useState('');
  const [ouroAtletaNome, setOuroAtletaNome] = useState('');
  const [ouroMarca, setOuroMarca] = useState('');

  // 2º Prata
  const [prataEscolaId, setPrataEscolaId] = useState('');
  const [prataAtletaNome, setPrataAtletaNome] = useState('');
  const [prataMarca, setPrataMarca] = useState('');

  // 3º Bronze
  const [bronzeEscolaId, setBronzeEscolaId] = useState('');
  const [bronzeAtletaNome, setBronzeAtletaNome] = useState('');
  const [bronzeMarca, setBronzeMarca] = useState('');

  // Texto jornalístico (editável)
  const [mancheteEditada, setMancheteEditada] = useState('');
  const [resumoEditado, setResumoEditado] = useState('');
  const [publicarNoticiaTelao, setPublicarNoticiaTelao] = useState(true);
  const [dispararUrgente, setDispararUrgente] = useState(false);

  const [publicando, setPublicando] = useState(false);
  const [sucessoMsg, setSucessoMsg] = useState<string | null>(null);

  const escolasOrdenadas = useMemo(
    () => [...escolas].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [escolas]
  );

  const modObj = useMemo(
    () =>
      MODALIDADES_EVENTOS_OPCOES.find((m) => m.codigo === modCodigo) || {
        codigo: modCodigo,
        nome: modCodigo,
      },
    [modCodigo]
  );

  const buscarEscola = (id: string) => escolas.find((e) => e.id === id);

  const buscarFotoAtleta = (escolaId: string, nome: string): string | null => {
    if (!escolaId || !nome.trim()) return null;
    const q = nome.trim().toLowerCase();
    const match = atletas.find(
      (a) => a.escolaId === escolaId && a.nomeCompleto.toLowerCase().includes(q)
    );
    return match?.documentos?.foto3x4 || null;
  };

  const escOuro = buscarEscola(ouroEscolaId);
  const escPrata = buscarEscola(prataEscolaId);
  const escBronze = buscarEscola(bronzeEscolaId);

  // Sugestão automática de manchete jornalística
  const mancheteSugerida = useMemo(() => {
    const campNome = ouroAtletaNome.trim()
      ? `${ouroAtletaNome.trim()} (${escOuro?.sigla || escOuro?.nome || 'Escola'})`
      : escOuro?.sigla || escOuro?.nome || 'Equipe Campeã';
    const provaTxt = prova.trim() ? ` — ${prova.trim()}` : '';
    return `${campNome} conquista o ouro em ${modObj.nome} ${categoria}${provaTxt}!`;
  }, [ouroAtletaNome, escOuro, modObj.nome, categoria, prova]);

  const resumoSugerido = useMemo(() => {
    const partes: string[] = [];
    if (escOuro) {
      partes.push(
        `🥇 1º ${ouroAtletaNome.trim() ? `${ouroAtletaNome.trim()} (${escOuro.sigla || escOuro.nome})` : escOuro.sigla || escOuro.nome}`
      );
    }
    if (escPrata) {
      partes.push(
        `🥈 2º ${prataAtletaNome.trim() ? `${prataAtletaNome.trim()} (${escPrata.sigla || escPrata.nome})` : escPrata.sigla || escPrata.nome}`
      );
    }
    if (escBronze) {
      partes.push(
        `🥉 3º ${bronzeAtletaNome.trim() ? `${bronzeAtletaNome.trim()} (${escBronze.sigla || escBronze.nome})` : escBronze.sigla || escBronze.nome}`
      );
    }
    return partes.length > 0
      ? `Pódio oficial: ${partes.join(' · ')}.`
      : 'Preencha as escolas premiadas para montar o pódio oficial.';
  }, [escOuro, escPrata, escBronze, ouroAtletaNome, prataAtletaNome, bronzeAtletaNome]);

  // Limpa edição manual quando muda escola do ouro se ainda não foi customizado
  useEffect(() => {
    if (!ouroEscolaId) {
      setMancheteEditada('');
      setResumoEditado('');
    }
  }, [ouroEscolaId]);

  const dadosPreview: DadosPodioJornalistico = {
    selo,
    modalidadeNome: modObj.nome,
    categoria,
    sexo,
    prova: prova.trim() || undefined,
    manchete: mancheteEditada.trim() || mancheteSugerida,
    resumo: resumoEditado.trim() || resumoSugerido,
    ouro: {
      escolaId: escOuro?.id,
      escolaNome: escOuro?.nome || '1º Colocado',
      escolaSigla: escOuro?.sigla || escOuro?.nome || 'OURO',
      atletaNome: ouroAtletaNome.trim() || undefined,
      fotoUrl: buscarFotoAtleta(ouroEscolaId, ouroAtletaNome),
      marca: ouroMarca.trim() || undefined,
    },
    prata: escPrata
      ? {
          escolaId: escPrata.id,
          escolaNome: escPrata.nome,
          escolaSigla: escPrata.sigla || escPrata.nome,
          atletaNome: prataAtletaNome.trim() || undefined,
          fotoUrl: buscarFotoAtleta(prataEscolaId, prataAtletaNome),
          marca: prataMarca.trim() || undefined,
        }
      : null,
    bronze: escBronze
      ? {
          escolaId: escBronze.id,
          escolaNome: escBronze.nome,
          escolaSigla: escBronze.sigla || escBronze.nome,
          atletaNome: bronzeAtletaNome.trim() || undefined,
          fotoUrl: buscarFotoAtleta(bronzeEscolaId, bronzeAtletaNome),
          marca: bronzeMarca.trim() || undefined,
        }
      : null,
  };

  const handlePublicarPodio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escOuro) {
      alert('Selecione pelo menos a escola campeã (🥇 Ouro).');
      return;
    }

    try {
      setPublicando(true);

      // 1. Lança as medalhas (Ouro, Prata, Bronze) no Quadro Olímpico
      const lancamentos = [
        { esc: escOuro, tipo: 'OURO', atleta: ouroAtletaNome.trim() },
        ...(escPrata ? [{ esc: escPrata, tipo: 'PRATA', atleta: prataAtletaNome.trim() }] : []),
        ...(escBronze ? [{ esc: escBronze, tipo: 'BRONZE', atleta: bronzeAtletaNome.trim() }] : []),
      ];

      for (const item of lancamentos) {
        await EventosApi.criar('medalha', {
          municipioId,
          escolaId: item.esc.id,
          escolaNome: item.esc.nome,
          escolaSigla: item.esc.sigla || item.esc.nome,
          modalidadeCodigo: modObj.codigo,
          modalidadeNome: modObj.nome,
          categoria,
          sexo,
          prova: prova.trim() || null,
          tipo: item.tipo,
          atletaNome: item.atleta || null,
        });
      }

      // 2. Publica a Matéria Jornalística com Pódio Animado no Portal e no Telão
      if (publicarNoticiaTelao) {
        await EventosApi.criar('noticia', {
          municipioId,
          titulo: dadosPreview.manchete,
          resumo: dadosPreview.resumo,
          conteudo: serializarPodioConteudo(dadosPreview),
          modalidadeNome: modObj.nome,
          categoria,
          horarioOcorrencia: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          imagemUrl: dadosPreview.ouro.fotoUrl || null,
          destaqueTelao: true,
          publicado: true,
        });
      }

      // 3. Opcional: dispara chamada urgente no ticker do Telão
      if (dispararUrgente) {
        await EventosApi.criar('aviso', {
          municipioId,
          titulo: `${selo} ${modObj.nome.toUpperCase()}`,
          mensagem: dadosPreview.manchete,
          tipo: 'URGENTE',
          ativo: true,
        });
      }

      // Celebração com confete!
      try {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.65 } });
      } catch {}

      // Limpa campos para o próximo pódio
      setOuroEscolaId('');
      setOuroAtletaNome('');
      setOuroMarca('');
      setPrataEscolaId('');
      setPrataAtletaNome('');
      setPrataMarca('');
      setBronzeEscolaId('');
      setBronzeAtletaNome('');
      setBronzeMarca('');
      setProva('');
      setMancheteEditada('');
      setResumoEditado('');

      setSucessoMsg('Pódio, medalhas e manchete publicados no Portal e no Telão!');
      setTimeout(() => setSucessoMsg(null), 5000);
      await onPublicado();
    } catch (err: any) {
      alert(err?.message || 'Erro ao publicar pódio');
    } finally {
      setPublicando(false);
    }
  };

  const atletasDaEscola = (escolaId: string) =>
    escolaId
      ? atletas
          .filter((a) => a.escolaId === escolaId)
          .sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto, 'pt-BR'))
      : [];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
      {/* FORMULÁRIO DO PÓDIO */}
      <form
        onSubmit={handlePublicarPodio}
        className="xl:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-[#0F2540] flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Lançar Pódio & Manchete Jornalística</span>
            </h3>
            <p className="text-xs text-slate-400">
              Registra Ouro, Prata e Bronze de uma vez e já publica no Portal e no Telão.
            </p>
          </div>
        </div>

        {sucessoMsg && (
          <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#00A878] shrink-0" />
            <span>{sucessoMsg}</span>
          </div>
        )}

        {/* Modalidade / Categoria / Naipe / Prova */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Modalidade</label>
            <select
              value={modCodigo}
              onChange={(e) => setModCodigo(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-[#0F2540] bg-white"
            >
              {MODALIDADES_EVENTOS_OPCOES.map((m) => (
                <option key={m.codigo} value={m.codigo}>{m.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Categoria</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-[#0F2540] bg-white"
            >
              {CATEGORIAS_EVENTOS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Naipe</label>
            <select
              value={sexo}
              onChange={(e) => setSexo(e.target.value as any)}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-[#0F2540] bg-white"
            >
              <option value="MASCULINO">Masculino</option>
              <option value="FEMININO">Feminino</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Prova / Fase</label>
            <input
              type="text"
              value={prova}
              onChange={(e) => setProva(e.target.value)}
              placeholder="Ex: 100m / Final"
              className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
            />
          </div>
        </div>

        {/* 3 Degraus do Pódio */}
        <div className="space-y-2.5">
          {/* 1º OURO */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
            <span className="text-[11px] font-black text-amber-900">🥇 1º Lugar — Ouro *</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                required
                value={ouroEscolaId}
                onChange={(e) => setOuroEscolaId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-white text-xs font-bold"
              >
                <option value="">Escola Campeã...</option>
                {escolasOrdenadas.map((e) => (
                  <option key={e.id} value={e.id}>{e.sigla || e.nome}</option>
                ))}
              </select>
              <input
                type="text"
                list="atletas-ouro-list"
                value={ouroAtletaNome}
                onChange={(e) => setOuroAtletaNome(e.target.value)}
                placeholder="Atleta / Destaque (opc.)"
                className="px-2.5 py-1.5 rounded-lg border border-amber-200 bg-white text-xs"
              />
              <datalist id="atletas-ouro-list">
                {atletasDaEscola(ouroEscolaId).map((a) => (
                  <option key={a.id} value={a.nomeCompleto} />
                ))}
              </datalist>
              <input
                type="text"
                value={ouroMarca}
                onChange={(e) => setOuroMarca(e.target.value)}
                placeholder="Marca/Placar (ex: 12.4s)"
                className="px-2.5 py-1.5 rounded-lg border border-amber-200 bg-white text-xs"
              />
            </div>
          </div>

          {/* 2º PRATA */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[11px] font-black text-slate-700">🥈 2º Lugar — Prata (opcional)</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={prataEscolaId}
                onChange={(e) => setPrataEscolaId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold"
              >
                <option value="">Escola Vice...</option>
                {escolasOrdenadas.map((e) => (
                  <option key={e.id} value={e.id}>{e.sigla || e.nome}</option>
                ))}
              </select>
              <input
                type="text"
                list="atletas-prata-list"
                value={prataAtletaNome}
                onChange={(e) => setPrataAtletaNome(e.target.value)}
                placeholder="Atleta (opcional)"
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
              />
              <datalist id="atletas-prata-list">
                {atletasDaEscola(prataEscolaId).map((a) => (
                  <option key={a.id} value={a.nomeCompleto} />
                ))}
              </datalist>
              <input
                type="text"
                value={prataMarca}
                onChange={(e) => setPrataMarca(e.target.value)}
                placeholder="Marca/Placar"
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs"
              />
            </div>
          </div>

          {/* 3º BRONZE */}
          <div className="p-3 rounded-xl bg-orange-50/50 border border-orange-200/80 space-y-2">
            <span className="text-[11px] font-black text-orange-900">🥉 3º Lugar — Bronze (opcional)</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={bronzeEscolaId}
                onChange={(e) => setBronzeEscolaId(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-orange-200 bg-white text-xs font-semibold"
              >
                <option value="">Escola 3º Lugar...</option>
                {escolasOrdenadas.map((e) => (
                  <option key={e.id} value={e.id}>{e.sigla || e.nome}</option>
                ))}
              </select>
              <input
                type="text"
                list="atletas-bronze-list"
                value={bronzeAtletaNome}
                onChange={(e) => setBronzeAtletaNome(e.target.value)}
                placeholder="Atleta (opcional)"
                className="px-2.5 py-1.5 rounded-lg border border-orange-200 bg-white text-xs"
              />
              <datalist id="atletas-bronze-list">
                {atletasDaEscola(bronzeEscolaId).map((a) => (
                  <option key={a.id} value={a.nomeCompleto} />
                ))}
              </datalist>
              <input
                type="text"
                value={bronzeMarca}
                onChange={(e) => setBronzeMarca(e.target.value)}
                placeholder="Marca/Placar"
                className="px-2.5 py-1.5 rounded-lg border border-orange-200 bg-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Texto Jornalístico Editável */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Selo:</span>
            {SELOS_ESTILO.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSelo(s)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer transition-colors ${
                  selo === s
                    ? 'bg-amber-400 text-amber-950'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={mancheteEditada}
            onChange={(e) => setMancheteEditada(e.target.value)}
            placeholder={mancheteSugerida}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-[#0F2540]"
          />
          <textarea
            rows={2}
            value={resumoEditado}
            onChange={(e) => setResumoEditado(e.target.value)}
            placeholder={resumoSugerido}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-600"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={publicarNoticiaTelao}
                onChange={(e) => setPublicarNoticiaTelao(e.target.checked)}
                className="accent-[#00A878]"
              />
              <span>Publicar Pódio Animado no Portal e no Telão</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={dispararUrgente}
                onChange={(e) => setDispararUrgente(e.target.checked)}
                className="accent-amber-500"
              />
              <span className="flex items-center gap-1">
                <Megaphone className="w-3 h-3 text-amber-500" /> Disparar faixa urgente no Telão
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={publicando || !escOuro}
            className="px-5 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-black flex items-center gap-2 shadow-sm disabled:opacity-45 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{publicando ? 'Publicando...' : 'Publicar Pódio & Manchete'}</span>
          </button>
        </div>
      </form>

      {/* PRÉVIA AO VIVO DO CARD JORNALÍSTICO + PÓDIO ANIMADO */}
      <div className="xl:col-span-6 space-y-2.5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
          Prévia ao vivo (como aparece no Portal & Telão)
        </p>
        <CardPodioJornalistico dados={dadosPreview} modo="PREVIEW" />
      </div>
    </div>
  );
}
