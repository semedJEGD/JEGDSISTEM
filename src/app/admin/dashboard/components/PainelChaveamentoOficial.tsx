'use client';

import React, { useMemo, useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Shuffle,
  Sparkles,
  Lock,
  Printer,
  Trash2,
  GitBranch,
  CheckCircle2,
  RefreshCw,
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Plus,
} from 'lucide-react';
import { Atleta, Escola, InscricaoEquipe, ModalidadeConfig } from '@/types/jegd';
import { ChaveamentoEventoItem, PartidaEventoItem } from '@/types/eventos';
import { EventosApi, CATEGORIAS_EVENTOS, FASES_LABEL, formatarDataBR } from '@/lib/eventos-service';
import {
  auditarCategoriaParaChaveamento,
  gerarSeedAuditavel,
  gerarChaveamentoColetivoOuTenisMesa,
  gerarBalizamentoAtletismo,
  gerarTorneioXadrezInicial,
  gerarProximaRodadaSuica,
  calcularClassificacaoXadrez,
  calcularAtualizacoesAvancoMataMata,
  normalizarCodigoModalidade,
  GrupoChaveamento,
  PartidaGeradaPayload,
  ProvaAtletismoBalizamento,
  EstruturaXadrez,
} from '@/lib/chaveamento-service';
import { gerarPdfChaveamentoOficial } from '@/lib/pdf/tabela-jogos';
import { JegdStorage } from '@/lib/storage';

const MODALIDADES_OFICIAIS = [
  { codigo: 'futsal', nome: 'Futsal' },
  { codigo: 'queimada', nome: 'Queimada' },
  { codigo: 'futebol_campo', nome: 'Futebol de Campo' },
  { codigo: 'beach_soccer', nome: 'Beach Soccer' },
  { codigo: 'voleibol', nome: 'Voleibol' },
  { codigo: 'atletismo', nome: 'Atletismo' },
  { codigo: 'xadrez', nome: 'Xadrez' },
  { codigo: 'tenis_mesa', nome: 'Tênis de Mesa' },
];

interface PainelChaveamentoOficialProps {
  municipioId?: string;
  escolas: Escola[];
  atletas: Atleta[];
  inscricoes: InscricaoEquipe[];
  modalidades?: ModalidadeConfig[];
  partidas: PartidaEventoItem[];
  chaveamentos: ChaveamentoEventoItem[];
  onAtualizado: () => Promise<void>;
}

export function PainelChaveamentoOficial({
  municipioId,
  escolas,
  atletas,
  inscricoes,
  modalidades,
  partidas,
  chaveamentos,
  onAtualizado,
}: PainelChaveamentoOficialProps) {
  const hojeIso = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Seleção da categoria a auditar/chavear
  const [modCodigo, setModCodigo] = useState('futsal');
  const [categoria, setCategoria] = useState('INFANTIL');
  const [sexo, setSexo] = useState('MASCULINO');

  // Parâmetros do sorteio & agenda
  const [modoColetivo, setModoColetivo] = useState<'GRUPOS_MATA_MATA' | 'MATA_MATA'>('GRUPOS_MATA_MATA');
  const [incluirTerceiroLugar, setIncluirTerceiroLugar] = useState(true);
  const [seed, setSeed] = useState(() => gerarSeedAuditavel());
  const [dataEvento, setDataEvento] = useState(hojeIso);
  const [horaInicio, setHoraInicio] = useState('08:30');
  const [intervaloMinutos, setIntervaloMinutos] = useState(30);
  const [quadrasStr, setQuadrasStr] = useState('Quadra 01, Quadra 02');
  const [rodadasXadrez, setRodadasXadrez] = useState(5);
  const [excluidosIds, setExcluidosIds] = useState<string[]>([]);

  // Prévia gerada antes de publicar
  const [previa, setPrevia] = useState<{
    formato: string;
    grupos?: GrupoChaveamento[];
    partidas?: PartidaGeradaPayload[];
    provasAtletismo?: ProvaAtletismoBalizamento[];
    xadrez?: EstruturaXadrez;
  } | null>(null);

  const [salvando, setSalvando] = useState(false);
  const [chaveamentoExpandidoId, setChaveamentoExpandidoId] = useState<string | null>(null);

  const modObj = useMemo(
    () => MODALIDADES_OFICIAIS.find((m) => m.codigo === modCodigo) || MODALIDADES_OFICIAIS[0],
    [modCodigo]
  );

  // 1. Auditoria automática em tempo real
  const auditoria = useMemo(() => {
    return auditarCategoriaParaChaveamento({
      modalidadeCodigo: modObj.codigo,
      modalidadeNome: modObj.nome,
      categoria,
      sexo,
      escolas,
      atletas,
      inscricoes,
      modalidades,
    });
  }, [modObj, categoria, sexo, escolas, atletas, inscricoes, modalidades]);

  const participantesAtivos = useMemo(
    () => auditoria.participantes.filter((p) => !excluidosIds.includes(p.id)),
    [auditoria.participantes, excluidosIds]
  );

  const toggleParticipante = (id: string) => {
    setExcluidosIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    setPrevia(null);
  };

  // 2. Gerar prévia auditável
  const handleGerarPrevia = () => {
    const norm = normalizarCodigoModalidade(modObj.codigo);

    if (norm === 'atletismo') {
      if (participantesAtivos.length === 0) {
        alert('Nenhum atleta inscrito em Atletismo para esta categoria/naipe.');
        return;
      }
      const provas = gerarBalizamentoAtletismo({
        participantes: participantesAtivos,
        seed,
        maxRaiasPorSerie: 8,
      });
      setPrevia({ formato: 'BALIZAMENTO_ATLETISMO', provasAtletismo: provas });
      return;
    }

    if (participantesAtivos.length < 2) {
      alert('São necessários pelo menos 2 participantes selecionados para gerar a tabela de confrontos.');
      return;
    }

    if (norm === 'xadrez') {
      const xadrez = gerarTorneioXadrezInicial({
        participantes: participantesAtivos,
        seed,
        totalRodadas: rodadasXadrez,
      });
      setPrevia({ formato: 'SUICO_XADREZ', xadrez });
      return;
    }

    // Coletivas ou Tênis de Mesa
    const formatoFinal =
      norm === 'tenis_mesa'
        ? modoColetivo === 'MATA_MATA'
          ? 'MATA_MATA'
          : 'GRUPOS_TENIS_MESA'
        : participantesAtivos.length === 2
        ? 'FINAL_DIRETA'
        : modoColetivo === 'MATA_MATA'
        ? 'MATA_MATA'
        : participantesAtivos.length <= 5
        ? 'BERGER_UNICO'
        : 'GRUPOS_MATA_MATA';

    const maxNumExistente = partidas.reduce((max, p) => Math.max(max, p.numeroJogo || 0), 0);
    const { grupos, partidas: partidasGeradas } = gerarChaveamentoColetivoOuTenisMesa({
      participantes: participantesAtivos,
      modalidadeCodigo: norm,
      modalidadeNome: modObj.nome,
      categoria,
      sexo,
      formato: formatoFinal,
      seed,
      dataEvento,
      horaInicio,
      intervaloMinutos: Number(intervaloMinutos) || 30,
      quadras: quadrasStr.split(','),
      numeroJogoInicial: maxNumExistente + 1,
      incluirTerceiroLugar,
    });

    setPrevia({ formato: formatoFinal, grupos, partidas: partidasGeradas });
  };

  // 3. Publicar no banco de dados (PostgreSQL)
  const handlePublicarChaveamento = async () => {
    if (!previa) return;
    const currentUser = JegdStorage.getCurrentUser();
    const operador = currentUser?.nome || 'Coordenação SEMED';

    const estruturaPayload =
      previa.formato === 'BALIZAMENTO_ATLETISMO'
        ? { provas: previa.provasAtletismo }
        : previa.formato === 'SUICO_XADREZ'
        ? previa.xadrez
        : { grupos: previa.grupos };

    try {
      setSalvando(true);
      await EventosApi.criar('chaveamento', {
        municipioId,
        modalidadeCodigo: normalizarCodigoModalidade(modObj.codigo),
        modalidadeNome: modObj.nome,
        categoria,
        sexo,
        formato: previa.formato,
        seed,
        status: 'RASCUNHO',
        criadoPor: operador,
        auditoriaJson: JSON.stringify({
          semaforo: auditoria.semaforo,
          resumo: auditoria.resumo,
          alertas: auditoria.alertas,
          geradoEm: new Date().toISOString(),
        }),
        estruturaJson: JSON.stringify(estruturaPayload),
        partidas: previa.partidas || [],
      });
      setPrevia(null);
      setSeed(gerarSeedAuditavel());
      await onAtualizado();
      alert(`Chaveamento oficial de ${modObj.nome} (${categoria} • ${sexo}) publicado com sucesso!`);
    } catch (err: any) {
      alert(err.message || 'Erro ao publicar chaveamento');
    } finally {
      setSalvando(false);
    }
  };

  // 4. Congelar / Auditar tabela publicada
  const handleCongelarChaveamento = async (ch: ChaveamentoEventoItem) => {
    if (
      !confirm(
        `Deseja CONGELAR oficialmente o chaveamento de ${ch.modalidadeNome} (${ch.categoria} • ${ch.sexo})?\n\nIsso registra o carimbo de auditoria do Congresso Técnico.`
      )
    ) {
      return;
    }
    try {
      setSalvando(true);
      await EventosApi.atualizar('chaveamento', ch.id, { status: 'CONGELADO' });
      await onAtualizado();
    } catch (err: any) {
      alert(err.message || 'Erro ao congelar chaveamento');
    } finally {
      setSalvando(false);
    }
  };

  // 5. Avançar automaticamente classificados dos grupos para Semifinal / Final
  const handleAvancarMataMata = async (ch: ChaveamentoEventoItem) => {
    const partidasCat = partidas.filter(
      (p) =>
        normalizarCodigoModalidade(p.modalidadeCodigo) === normalizarCodigoModalidade(ch.modalidadeCodigo) &&
        p.categoria === ch.categoria &&
        p.sexo === ch.sexo
    );
    const updates = calcularAtualizacoesAvancoMataMata(partidasCat);
    if (updates.length === 0) {
      alert(
        'Nenhum cruzamento pronto para preencher ainda. Encerre todas as partidas de um grupo (ou das semifinais) na aba "Jogos & Placares" primeiro.'
      );
      return;
    }
    try {
      setSalvando(true);
      await EventosApi.atualizar('partidas_atualizar_lote', ch.id, { itens: updates });
      await onAtualizado();
      alert(`${updates.length} confronto(s) eliminatório(s) atualizado(s) automaticamente pela classificação oficial!`);
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar classificados');
    } finally {
      setSalvando(false);
    }
  };

  // 6. Excluir chaveamento (opcionalmente excluindo partidas)
  const handleExcluirChaveamento = async (ch: ChaveamentoEventoItem) => {
    const removerJogos = confirm(
      `Excluir chaveamento de ${ch.modalidadeNome} (${ch.categoria} • ${ch.sexo})?\n\nClique em OK para excluir o chaveamento E todas as partidas desta categoria.`
    );
    if (!removerJogos) return;
    try {
      setSalvando(true);
      await EventosApi.excluir('chaveamento', ch.id, { excluirPartidas: '1' });
      await onAtualizado();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir chaveamento');
    } finally {
      setSalvando(false);
    }
  };

  // 7. Atualizar resultado de Xadrez e gerar próxima rodada Suíça
  const handleAtualizarMesaXadrez = async (
    ch: ChaveamentoEventoItem,
    rodadaNum: number,
    mesaNum: number,
    resultado: 'PENDENTE' | '1-0' | '0-1' | '0.5-0.5' | 'BYE'
  ) => {
    try {
      const est: EstruturaXadrez = JSON.parse(ch.estruturaJson || '{}');
      const novasRodadas = est.rodadas.map((r) =>
        r.numero === rodadaNum
          ? { ...r, mesas: r.mesas.map((m) => (m.mesa === mesaNum ? { ...m, resultado } : m)) }
          : r
      );
      await EventosApi.atualizar('chaveamento', ch.id, {
        estruturaJson: JSON.stringify({ ...est, rodadas: novasRodadas }),
      });
      await onAtualizado();
    } catch (err: any) {
      alert(err.message || 'Erro ao atualizar mesa de Xadrez');
    }
  };

  const handleGerarProximaRodadaXadrez = async (ch: ChaveamentoEventoItem) => {
    try {
      const est: EstruturaXadrez = JSON.parse(ch.estruturaJson || '{}');
      const ultima = est.rodadas[est.rodadas.length - 1];
      if (ultima && ultima.mesas.some((m) => m.resultado === 'PENDENTE')) {
        if (!confirm('Ainda há mesas pendentes na rodada atual. Deseja gerar a próxima rodada mesmo assim?')) return;
      }
      setSalvando(true);
      const novaEst = gerarProximaRodadaSuica(est);
      await EventosApi.atualizar('chaveamento', ch.id, {
        estruturaJson: JSON.stringify(novaEst),
      });
      await onAtualizado();
    } catch (err: any) {
      alert(err.message || 'Erro ao gerar próxima rodada Suíça');
    } finally {
      setSalvando(false);
    }
  };

  // 8. Atualizar marca/posição de Atletismo
  const handleAtualizarRaiaAtletismo = async (
    ch: ChaveamentoEventoItem,
    provaNome: string,
    serieNum: number,
    raiaNum: number,
    campo: 'marca' | 'posicao',
    valor: string
  ) => {
    try {
      const est: { provas: ProvaAtletismoBalizamento[] } = JSON.parse(ch.estruturaJson || '{"provas":[]}');
      const novasProvas = est.provas.map((pr) =>
        pr.prova === provaNome
          ? {
              ...pr,
              series: pr.series.map((s) =>
                s.numero === serieNum
                  ? {
                      ...s,
                      raias: s.raias.map((r) =>
                        r.raia === raiaNum
                          ? {
                              ...r,
                              [campo]: campo === 'posicao' ? (valor ? Number(valor) : null) : valor,
                            }
                          : r
                      ),
                    }
                  : s
              ),
            }
          : pr
      );
      await EventosApi.atualizar('chaveamento', ch.id, {
        estruturaJson: JSON.stringify({ provas: novasProvas }),
      });
      await onAtualizado();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar marca de Atletismo');
    }
  };

  return (
    <div className="space-y-6">
      {/* ================================================================ */}
      {/* PASSO 1: SELEÇÃO & AUDITORIA PRÉ-CHAVEAMENTO                     */}
      {/* ================================================================ */}
      <div className="bg-white border border-[#E2EAE5] rounded-2xl p-5 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E2EAE5] pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F7F1] text-[#087A5B] text-[10px] font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Base Oficial CBDE / JEBs / CBAt / FIDE / CBTM</span>
            </div>
            <h3 className="text-base font-bold text-[#17221D] mt-1">
              Auditoria Pré-Chaveamento & Gerador Oficial de Tabelas
            </h3>
            <p className="text-xs text-[#68756E]">
              Selecione a modalidade, audite as equipes/atletas inscritos e gere o chaveamento oficial com sorteio auditável.
            </p>
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 self-start ${
              auditoria.semaforo === 'OK'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : auditoria.semaforo === 'ALERTA'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {auditoria.semaforo === 'OK' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : auditoria.semaforo === 'ALERTA' ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>
              Auditoria:{' '}
              {auditoria.semaforo === 'OK'
                ? 'Pronto para Chavear'
                : auditoria.semaforo === 'ALERTA'
                ? 'Com Alertas (Liberado)'
                : 'Atenção Crítica'}
            </span>
          </div>
        </div>

        {/* Filtros de Modalidade / Categoria / Naipe */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-[#4B5563] mb-1">Modalidade</label>
            <select
              value={modCodigo}
              onChange={(e) => {
                setModCodigo(e.target.value);
                setExcluidosIds([]);
                setPrevia(null);
              }}
              className="w-full px-3 py-2 rounded-xl border border-[#E2EAE5] text-xs font-semibold text-[#17221D] bg-white"
            >
              {MODALIDADES_OFICIAIS.map((m) => (
                <option key={m.codigo} value={m.codigo}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#4B5563] mb-1">Categoria</label>
            <select
              value={categoria}
              onChange={(e) => {
                setCategoria(e.target.value);
                setExcluidosIds([]);
                setPrevia(null);
              }}
              className="w-full px-3 py-2 rounded-xl border border-[#E2EAE5] text-xs font-semibold text-[#17221D] bg-white"
            >
              {CATEGORIAS_EVENTOS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#4B5563] mb-1">Naipe</label>
            <select
              value={sexo}
              onChange={(e) => {
                setSexo(e.target.value);
                setExcluidosIds([]);
                setPrevia(null);
              }}
              className="w-full px-3 py-2 rounded-xl border border-[#E2EAE5] text-xs font-semibold text-[#17221D] bg-white"
            >
              <option value="MASCULINO">Masculino</option>
              <option value="FEMININO">Feminino</option>
            </select>
          </div>
        </div>

        {/* KPIs de Auditoria */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <p className="text-[10px] font-semibold uppercase text-slate-500">
              {auditoria.individual ? 'Atletas Inscritos' : 'Equipes Inscritas'}
            </p>
            <p className="text-lg font-black text-slate-900">{auditoria.resumo.totalParticipantes}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
            <p className="text-[10px] font-semibold uppercase text-emerald-700">Homologados</p>
            <p className="text-lg font-black text-emerald-800">{auditoria.resumo.validados}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70">
            <p className="text-[10px] font-semibold uppercase text-amber-700">Pendentes</p>
            <p className="text-lg font-black text-amber-800">{auditoria.resumo.pendentes}</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/70">
            <p className="text-[10px] font-semibold uppercase text-rose-700">Elenco Irregular</p>
            <p className="text-lg font-black text-rose-800">{auditoria.resumo.irregularidadeElenco}</p>
          </div>
          <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200/70">
            <p className="text-[10px] font-semibold uppercase text-sky-700">Sem Documento</p>
            <p className="text-lg font-black text-sky-800">{auditoria.resumo.semDocumento}</p>
          </div>
        </div>

        {/* Alertas de Auditoria */}
        {auditoria.alertas.length > 0 && (
          <div className="space-y-2">
            {auditoria.alertas.map((al, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  al.nivel === 'CRITICO'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : al.nivel === 'ALERTA'
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-sky-50 border-sky-200 text-sky-900'
                }`}
              >
                {al.nivel === 'CRITICO' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                )}
                <div>
                  <p className="font-bold">{al.titulo}</p>
                  <p className="text-[11px] opacity-90 mt-0.5">{al.detalhe}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recomendação Oficial + Lista de Participantes */}
        <div className="p-3.5 rounded-xl bg-[#F4F8F6] border border-[#DCE8E2] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#087A5B]">
              Formato Oficial Recomendado ({participantesAtivos.length} selecionados)
            </p>
            <p className="text-xs font-semibold text-[#17221D] mt-0.5">{auditoria.descricaoFormatoRecomendado}</p>
          </div>
        </div>

        {auditoria.participantes.length > 0 && (
          <div>
            <p className="text-[11px] font-bold text-[#4B5563] mb-2">
              Participantes detectados (desmarque caso algum não vá participar):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
              {auditoria.participantes.map((p) => {
                const marcado = !excluidosIds.includes(p.id);
                return (
                  <label
                    key={p.id}
                    className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 cursor-pointer transition-colors ${
                      marcado
                        ? 'bg-white border-[#00A878]/40 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 opacity-55'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => toggleParticipante(p.id)}
                      className="mt-0.5 accent-[#00A878]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-[#17221D] truncate">{p.sigla}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            p.statusHomologacao === 'VALIDADA'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.statusHomologacao}
                        </span>
                      </div>
                      {p.totalAtletas !== undefined && (
                        <p className="text-[10px] text-slate-500">{p.totalAtletas} atleta(s) no elenco</p>
                      )}
                      {p.provas && p.provas.length > 0 && (
                        <p className="text-[10px] text-emerald-700 font-medium truncate">
                          Provas: {p.provas.join(', ')}
                        </p>
                      )}
                      {p.alertas.length > 0 && (
                        <p className="text-[10px] text-rose-600 font-medium mt-0.5">{p.alertas.join(' • ')}</p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================ */}
        {/* PASSO 2: CONFIGURAÇÃO DO FORMATO, SEED E HORÁRIOS                */}
        {/* ================================================================ */}
        <div className="border-t border-[#E2EAE5] pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {modCodigo !== 'atletismo' && modCodigo !== 'xadrez' && (
              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] mb-1">Formato do Chaveamento</label>
                <select
                  value={modoColetivo}
                  onChange={(e) => {
                    setModoColetivo(e.target.value as any);
                    setPrevia(null);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2EAE5] text-xs font-semibold text-[#17221D] bg-white"
                >
                  <option value="GRUPOS_MATA_MATA">Grupos (Berger) + Mata-Mata Oficial</option>
                  <option value="MATA_MATA">Mata-Mata Direto (Eliminatória + BYE)</option>
                </select>
              </div>
            )}

            {modCodigo === 'xadrez' && (
              <div>
                <label className="block text-[11px] font-bold text-[#4B5563] mb-1">Rodadas (Sistema Suíço)</label>
                <input
                  type="number"
                  min={3}
                  max={7}
                  value={rodadasXadrez}
                  onChange={(e) => setRodadasXadrez(Number(e.target.value) || 5)}
                  className="w-full px-3 py-2 rounded-xl border border-[#E2EAE5] text-xs font-semibold text-[#17221D]"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-[#4B5563] mb-1">Semente Auditável (Seed)</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={seed}
                  onChange={(e) => {
                    setSeed(e.target.value);
                    setPrevia(null);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl border border-[#E2EAE5] text-xs font-mono font-semibold text-[#17221D]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setSeed(gerarSeedAuditavel());
                    setPrevia(null);
                  }}
                  className="p-2 rounded-xl border border-[#E2EAE5] hover:bg-slate-50 text-slate-600"
                  title="Sortear nova semente"
                >
                  <Shuffle className="w-4 h-4" />
                </button>
              </div>
            </div>

            {modCodigo !== 'atletismo' && modCodigo !== 'xadrez' && (
              <>
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5563] mb-1">Data dos Jogos</label>
                  <input
                    type="date"
                    value={dataEvento}
                    onChange={(e) => setDataEvento(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E2EAE5] text-xs font-semibold text-[#17221D]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#4B5563] mb-1">Início / Intervalo (min)</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={horaInicio}
                      onChange={(e) => setHoraInicio(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-[#E2EAE5] text-xs font-semibold text-[#17221D]"
                    />
                    <input
                      type="number"
                      min={10}
                      max={120}
                      value={intervaloMinutos}
                      onChange={(e) => setIntervaloMinutos(Number(e.target.value) || 30)}
                      className="w-20 px-2.5 py-2 rounded-xl border border-[#E2EAE5] text-xs font-semibold text-[#17221D]"
                      title="Minutos por jogo"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {modCodigo !== 'atletismo' && modCodigo !== 'xadrez' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-[#4B5563] mb-1">
                  Quadras / Locais (separe por vírgula para rodar jogos em paralelo)
                </label>
                <input
                  type="text"
                  value={quadrasStr}
                  onChange={(e) => setQuadrasStr(e.target.value)}
                  placeholder="Ex: Quadra 01, Quadra 02"
                  className="w-full px-3 py-2 rounded-xl border border-[#E2EAE5] text-xs font-semibold text-[#17221D]"
                />
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-[#17221D] mt-4 sm:mt-5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incluirTerceiroLugar}
                  onChange={(e) => setIncluirTerceiroLugar(e.target.checked)}
                  className="accent-[#00A878]"
                />
                <span>Incluir disputa de 3º Lugar</span>
              </label>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleGerarPrevia}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Gerar Prévia do Sorteio & Tabela</span>
            </button>

            {previa && (
              <button
                type="button"
                disabled={salvando}
                onClick={handlePublicarChaveamento}
                className="px-5 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{salvando ? 'Publicando...' : 'Confirmar & Publicar Tabela Oficial'}</span>
              </button>
            )}
          </div>
        </div>

        {/* ================================================================ */}
        {/* PRÉVIA ANTES DE PUBLICAR                                         */}
        {/* ================================================================ */}
        {previa && (
          <div className="border-t border-emerald-200 bg-emerald-50/40 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">
                Prévia Auditável — Seed: <span className="font-mono">{seed}</span>
              </h4>
              <span className="text-[11px] font-semibold text-emerald-800">
                Revise abaixo e clique em &quot;Confirmar &amp; Publicar Tabela Oficial&quot;
              </span>
            </div>

            {/* Prévia Coletivas / Tênis de Mesa */}
            {previa.grupos && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {previa.grupos.map((g) => (
                  <div key={g.nome} className="bg-white rounded-xl border border-emerald-200/80 p-3">
                    <p className="text-xs font-black text-emerald-800 uppercase mb-2">{g.nome}</p>
                    <ul className="space-y-1 text-xs text-slate-700">
                      {g.participantes.map((p, idx) => (
                        <li key={p.id} className="flex items-center justify-between">
                          <span>
                            <strong>{idx + 1}.</strong> {p.sigla}
                          </span>
                          <span className="text-[10px] text-slate-400">{p.statusHomologacao}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}

            {previa.partidas && previa.partidas.length > 0 && (
              <div className="bg-white rounded-xl border border-emerald-200/80 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2">Jogo</th>
                      <th className="px-3 py-2">Hora / Local</th>
                      <th className="px-3 py-2">Fase / Grupo</th>
                      <th className="px-3 py-2">Confronto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previa.partidas.map((p) => (
                      <tr key={p.numeroJogo}>
                        <td className="px-3 py-2 font-mono font-bold text-slate-700">#{p.numeroJogo}</td>
                        <td className="px-3 py-2 text-slate-600">
                          {p.horario} • {p.local}
                        </td>
                        <td className="px-3 py-2 font-semibold text-emerald-700">
                          {p.fase === 'GRUPOS' ? p.grupo : FASES_LABEL[p.fase] || p.fase}
                        </td>
                        <td className="px-3 py-2 font-bold text-slate-900">
                          {p.escolaASigla} <span className="text-slate-400 font-normal">×</span> {p.escolaBSigla}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Prévia Atletismo */}
            {previa.provasAtletismo && (
              <div className="space-y-3">
                {previa.provasAtletismo.map((pr) => (
                  <div key={pr.prova} className="bg-white rounded-xl border border-emerald-200/80 p-3 space-y-2">
                    <p className="text-xs font-black text-emerald-900 uppercase">{pr.prova}</p>
                    {pr.series.map((s) => (
                      <div key={s.numero} className="text-xs">
                        <p className="font-bold text-slate-600 mb-1">{s.nome}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {s.raias.map((r) => (
                            <div key={r.raia} className="px-2 py-1 rounded bg-slate-50 border border-slate-100">
                              <strong className="text-emerald-700">Raia {r.raia}:</strong> {r.atletaNome} ({r.escolaSigla})
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Prévia Xadrez */}
            {previa.xadrez && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-emerald-900">
                  Sistema: {previa.xadrez.sistema} • {previa.xadrez.totalRodadasPrevistas} rodada(s) previstas
                </p>
                {previa.xadrez.rodadas.map((r) => (
                  <div key={r.numero} className="bg-white rounded-xl border border-emerald-200/80 p-3">
                    <p className="text-xs font-black text-slate-800 mb-1.5">{r.numero}ª Rodada</p>
                    <div className="space-y-1 text-xs">
                      {r.mesas.map((m) => (
                        <div key={m.mesa} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
                          <span>
                            <strong>Mesa {m.mesa}:</strong> {m.brancasNome} ({m.brancasSigla}) <strong>×</strong>{' '}
                            {m.pretasId === 'BYE' ? 'BYE (1 pt)' : `${m.pretasNome} (${m.pretasSigla})`}
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
      </div>

      {/* ================================================================ */}
      {/* CHAVEAMENTOS PUBLICADOS & AUDITORIA ATIVA                        */}
      {/* ================================================================ */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#17221D] flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-[#00A878]" />
          <span>Chaveamentos Oficiais Publicados ({chaveamentos.length})</span>
        </h3>

        {chaveamentos.length === 0 ? (
          <div className="bg-white border border-dashed border-[#CBD5E1] rounded-2xl p-8 text-center text-xs text-[#68756E]">
            Nenhum chaveamento oficial gerado ainda. Use o auditor acima para criar e publicar a primeira tabela!
          </div>
        ) : (
          chaveamentos.map((ch) => {
            const partidasDoChav = partidas.filter(
              (p) =>
                normalizarCodigoModalidade(p.modalidadeCodigo) === normalizarCodigoModalidade(ch.modalidadeCodigo) &&
                p.categoria === ch.categoria &&
                p.sexo === ch.sexo
            );
            const expandido = chaveamentoExpandidoId === ch.id;
            let estrutura: any = null;
            try {
              estrutura = ch.estruturaJson ? JSON.parse(ch.estruturaJson) : null;
            } catch {
              estrutura = null;
            }

            return (
              <div key={ch.id} className="bg-white border border-[#E2EAE5] rounded-2xl p-4 shadow-2xs space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-[#17221D]">
                        {ch.modalidadeNome} • {ch.categoria} • {ch.sexo}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ch.status === 'CONGELADO'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {ch.status === 'CONGELADO' ? '🔒 CONGELADO' : 'RASCUNHO'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        Seed: {ch.seed}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#68756E] mt-0.5">
                      Formato: <strong>{ch.formato}</strong> • Operador: {ch.criadoPor} •{' '}
                      {partidasDoChav.length > 0 ? `${partidasDoChav.length} jogo(s) vinculados` : 'Modalidade individual'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {partidasDoChav.some((p) => p.fase !== 'GRUPOS') && (
                      <button
                        type="button"
                        disabled={salvando}
                        onClick={() => handleAvancarMataMata(ch)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold flex items-center gap-1.5"
                        title="Preenche automaticamente Semifinais, 3º Lugar e Final pela classificação oficial"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Avançar Mata-Mata</span>
                      </button>
                    )}

                    {(ch.formato === 'BALIZAMENTO_ATLETISMO' || ch.formato === 'SUICO_XADREZ') && (
                      <button
                        type="button"
                        onClick={() => setChaveamentoExpandidoId(expandido ? null : ch.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold"
                      >
                        {expandido ? 'Recolher Resultados' : 'Lançar Resultados'}
                      </button>
                    )}

                    {ch.status !== 'CONGELADO' && (
                      <button
                        type="button"
                        disabled={salvando}
                        onClick={() => handleCongelarChaveamento(ch)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Congelar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => gerarPdfChaveamentoOficial(ch, partidasDoChav)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>PDF Oficial</span>
                    </button>

                    <button
                      type="button"
                      disabled={salvando}
                      onClick={() => handleExcluirChaveamento(ch)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                      title="Excluir chaveamento e partidas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Editor Inline: ATLETISMO */}
                {expandido && ch.formato === 'BALIZAMENTO_ATLETISMO' && Array.isArray(estrutura?.provas) && (
                  <div className="border-t border-slate-100 pt-3 space-y-3">
                    {(estrutura.provas as ProvaAtletismoBalizamento[]).map((pr) => (
                      <div key={pr.prova} className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/70 space-y-2">
                        <p className="text-xs font-black text-emerald-900 uppercase">{pr.prova}</p>
                        {pr.series.map((s) => (
                          <div key={s.numero} className="space-y-1.5">
                            <p className="text-[11px] font-bold text-slate-600">{s.nome}</p>
                            {s.raias.map((r) => (
                              <div
                                key={r.raia}
                                className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200/70 text-xs"
                              >
                                <span className="col-span-1 font-bold text-emerald-700">R{r.raia}</span>
                                <span className="col-span-5 font-semibold text-slate-900 truncate">{r.atletaNome}</span>
                                <span className="col-span-2 text-slate-500 truncate">{r.escolaSigla}</span>
                                <input
                                  type="text"
                                  defaultValue={r.marca}
                                  placeholder="Tempo/Marca"
                                  onBlur={(e) =>
                                    handleAtualizarRaiaAtletismo(ch, pr.prova, s.numero, r.raia, 'marca', e.target.value)
                                  }
                                  className="col-span-2 px-2 py-1 rounded border border-slate-200 text-xs"
                                />
                                <input
                                  type="number"
                                  min={1}
                                  max={20}
                                  defaultValue={r.posicao ?? ''}
                                  placeholder="Pos."
                                  onBlur={(e) =>
                                    handleAtualizarRaiaAtletismo(ch, pr.prova, s.numero, r.raia, 'posicao', e.target.value)
                                  }
                                  className="col-span-2 px-2 py-1 rounded border border-slate-200 text-xs"
                                />
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {/* Editor Inline: XADREZ (SUÍÇO / BERGER + BUCHHOLZ) */}
                {expandido && ch.formato === 'SUICO_XADREZ' && estrutura?.rodadas && (
                  <div className="border-t border-slate-100 pt-3 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-slate-700">
                        Sistema {estrutura.sistema} • {estrutura.rodadas.length}/{estrutura.totalRodadasPrevistas} rodadas
                      </span>
                      {estrutura.sistema === 'SUICO' &&
                        estrutura.rodadas.length < estrutura.totalRodadasPrevistas && (
                          <button
                            type="button"
                            disabled={salvando}
                            onClick={() => handleGerarProximaRodadaXadrez(ch)}
                            className="px-3 py-1.5 rounded-lg bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Gerar {estrutura.rodadas.length + 1}ª Rodada Suíça</span>
                          </button>
                        )}
                    </div>

                    {(estrutura as EstruturaXadrez).rodadas.map((rod) => (
                      <div key={rod.numero} className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/70 space-y-1.5">
                        <p className="text-xs font-black text-slate-800">{rod.numero}ª Rodada</p>
                        {rod.mesas.map((m) => (
                          <div
                            key={m.mesa}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white p-2 rounded-lg border border-slate-200/70 text-xs"
                          >
                            <div>
                              <span className="font-mono font-bold text-slate-500 mr-2">M{m.mesa}</span>
                              <strong>{m.brancasNome}</strong> ({m.brancasSigla}){' '}
                              <span className="text-slate-400">×</span>{' '}
                              {m.pretasId === 'BYE' ? (
                                <span className="text-emerald-700 font-bold">BYE</span>
                              ) : (
                                <>
                                  <strong>{m.pretasNome}</strong> ({m.pretasSigla})
                                </>
                              )}
                            </div>
                            {m.pretasId !== 'BYE' && (
                              <select
                                value={m.resultado}
                                onChange={(e) =>
                                  handleAtualizarMesaXadrez(ch, rod.numero, m.mesa, e.target.value as any)
                                }
                                className="px-2 py-1 rounded border border-slate-200 text-xs font-bold bg-white"
                              >
                                <option value="PENDENTE">Pendente</option>
                                <option value="1-0">1 - 0 (Brancas)</option>
                                <option value="0.5-0.5">½ - ½ (Empate)</option>
                                <option value="0-1">0 - 1 (Pretas)</option>
                              </select>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}

                    {/* Classificação Buchholz */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-[10px] uppercase text-slate-500 border-b border-slate-200">
                          <tr>
                            <th className="px-3 py-2">#</th>
                            <th className="px-3 py-2">Enxadrista</th>
                            <th className="px-3 py-2">Escola</th>
                            <th className="px-3 py-2 text-center">J</th>
                            <th className="px-3 py-2 text-center">Pts</th>
                            <th className="px-3 py-2 text-center">Buchholz</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {calcularClassificacaoXadrez(estrutura as EstruturaXadrez).map((c, idx) => (
                            <tr key={c.id}>
                              <td className="px-3 py-1.5 font-bold">{idx + 1}º</td>
                              <td className="px-3 py-1.5 font-semibold text-slate-900">{c.nome}</td>
                              <td className="px-3 py-1.5 text-slate-600">{c.sigla}</td>
                              <td className="px-3 py-1.5 text-center">{c.jogos}</td>
                              <td className="px-3 py-1.5 text-center font-black text-emerald-700">{c.pontos.toFixed(1)}</td>
                              <td className="px-3 py-1.5 text-center font-mono text-slate-600">{c.buchholz.toFixed(1)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
