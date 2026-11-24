'use client';

import React, { useMemo, useState } from 'react';
import {
  FileText,
  Download,
  Search,
  Users,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  FileSpreadsheet,
  School,
} from 'lucide-react';
import { Atleta, Escola, InscricaoEquipe, ModalidadeConfig } from '@/types/jegd';
import { JegdPdfGenerator } from '@/lib/pdf-generator';

interface RelatorioEscolaDetalhadoProps {
  escola: Escola;
  atletas: Atleta[];
  inscricoes: InscricaoEquipe[];
  modalidades: ModalidadeConfig[];
  onGerarCadernoEscola?: (escola: Escola) => Promise<void> | void;
}

type VisaoRelatorio = 'MODALIDADES' | 'ALUNOS' | 'PENDENCIAS';

function isSemDocumento(a: Atleta): boolean {
  return Boolean(
    a.semDocumento || a.documentoTipo === 'SEM_DOCUMENTO' || a.documentoNumero === 'SEM DOCUMENTO'
  );
}

function formatarNasc(iso?: string): string {
  if (!iso) return '-';
  const p = iso.slice(0, 10).split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
}

export function RelatorioEscolaDetalhado({
  escola,
  atletas,
  inscricoes,
  modalidades,
  onGerarCadernoEscola,
}: RelatorioEscolaDetalhadoProps) {
  const [visao, setVisao] = useState<VisaoRelatorio>('MODALIDADES');
  const [busca, setBusca] = useState('');
  const [filtroMod, setFiltroMod] = useState('TODAS');
  const [filtroCat, setFiltroCat] = useState('TODAS');
  const [filtroSexo, setFiltroSexo] = useState('TODOS');
  const [filtroSituacao, setFiltroSituacao] = useState<'TODOS' | 'OK' | 'SEM_DOC' | 'PENDENTE'>('TODOS');
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const atletasEscola = useMemo(
    () =>
      atletas
        .filter((a) => a.escolaId === escola.id)
        .sort((a, b) => a.nomeCompleto.localeCompare(b.nomeCompleto, 'pt-BR')),
    [atletas, escola.id]
  );

  const inscricoesEscola = useMemo(
    () => inscricoes.filter((i) => i.escolaId === escola.id),
    [inscricoes, escola.id]
  );

  // KPIs gerais da escola
  const metricas = useMemo(() => {
    const masc = atletasEscola.filter((a) => a.sexo === 'MASCULINO').length;
    const fem = atletasEscola.filter((a) => a.sexo === 'FEMININO').length;
    const homologados = atletasEscola.filter((a) => a.conferidoPeloCoordenador).length;
    const semDoc = atletasEscola.filter(isSemDocumento).length;
    const semFoto = atletasEscola.filter((a) => !a.documentos?.foto3x4).length;

    const modsSet = new Set<string>();
    atletasEscola.forEach((a) =>
      (a.modalidadesInscritas || []).forEach((m) => modsSet.add(m.modalidadeNome || m.modalidadeCodigo))
    );

    return {
      total: atletasEscola.length,
      masc,
      fem,
      homologados,
      semDoc,
      semFoto,
      totalModalidades: modsSet.size,
      totalEquipes: inscricoesEscola.length,
    };
  }, [atletasEscola, inscricoesEscola]);

  // Atletas filtrados
  const atletasFiltrados = useMemo(() => {
    return atletasEscola.filter((a) => {
      if (busca.trim()) {
        const q = busca.toLowerCase();
        const matchNome = a.nomeCompleto.toLowerCase().includes(q);
        const matchDoc = (a.documentoNumero || '').toLowerCase().includes(q);
        const matchTurma = (a.serieTurma || '').toLowerCase().includes(q);
        if (!matchNome && !matchDoc && !matchTurma) return false;
      }
      if (filtroMod !== 'TODAS') {
        const temMod = (a.modalidadesInscritas || []).some(
          (m) => m.modalidadeCodigo === filtroMod || m.modalidadeNome === filtroMod
        );
        if (!temMod) return false;
      }
      if (filtroCat !== 'TODAS' && a.categoriaCalculada !== filtroCat) return false;
      if (filtroSexo !== 'TODOS' && a.sexo !== filtroSexo) return false;
      if (filtroSituacao === 'SEM_DOC' && !isSemDocumento(a)) return false;
      if (filtroSituacao === 'PENDENTE' && a.conferidoPeloCoordenador) return false;
      if (filtroSituacao === 'OK' && (isSemDocumento(a) || !a.conferidoPeloCoordenador)) return false;
      return true;
    });
  }, [atletasEscola, busca, filtroMod, filtroCat, filtroSexo, filtroSituacao]);

  // Agrupamento por Modalidade -> Categoria -> Naipe -> Equipe (Equipe A / Equipe B)
  const gruposPorModalidade = useMemo(() => {
    const mapa = new Map<
      string,
      {
        chave: string;
        modalidadeCodigo: string;
        modalidadeNome: string;
        categoria: string;
        sexo: string;
        equipeLabel?: string;
        statusEquipe?: string;
        minAtletas: number;
        maxAtletas: number;
        atletas: (Atleta & { provasNaMod: string[] })[];
      }
    >();

    // Mapa rápido: atletaId + mod + cat + sexo -> inscrição da equipe (A ou B)
    const inscPorAtletaMod = new Map<string, InscricaoEquipe>();
    const qtdEquipesPorModCat = new Map<string, number>();
    for (const insc of inscricoesEscola) {
      const mcKey = `${insc.modalidadeCodigo}__${insc.categoria}__${insc.sexo}`;
      qtdEquipesPorModCat.set(mcKey, (qtdEquipesPorModCat.get(mcKey) || 0) + 1);
      for (const aid of insc.atletaIds || []) {
        inscPorAtletaMod.set(`${aid}__${mcKey}`, insc);
      }
    }

    for (const a of atletasFiltrados) {
      const mods = a.modalidadesInscritas || [];
      if (mods.length === 0) continue;
      for (const m of mods) {
        if (filtroMod !== 'TODAS' && m.modalidadeCodigo !== filtroMod && m.modalidadeNome !== filtroMod) {
          continue;
        }
        const cat = a.categoriaCalculada || 'LIVRE';
        const mcKey = `${m.modalidadeCodigo}__${cat}__${a.sexo}`;
        const inscRel = inscPorAtletaMod.get(`${a.id}__${mcKey}`);
        const temMultiplas = (qtdEquipesPorModCat.get(mcKey) || 0) > 1;
        const isEqB = inscRel?.numeroEquipe === 2 || /(-B|-eq2|__eq2)$/i.test(inscRel?.id || '');
        const eqSufixo = temMultiplas || isEqB ? (isEqB ? 'B' : 'A') : '';
        const chave = eqSufixo ? `${mcKey}__${eqSufixo}` : mcKey;

        if (!mapa.has(chave)) {
          const modConf = modalidades.find((mc) => mc.codigo === m.modalidadeCodigo);
          mapa.set(chave, {
            chave,
            modalidadeCodigo: m.modalidadeCodigo,
            modalidadeNome: m.modalidadeNome || modConf?.nome || m.modalidadeCodigo,
            categoria: cat,
            sexo: a.sexo,
            equipeLabel: eqSufixo ? `Equipe ${eqSufixo}` : undefined,
            statusEquipe: inscRel?.status,
            minAtletas: modConf?.minAtletas || 1,
            maxAtletas: modConf?.maxAtletas || 10,
            atletas: [],
          });
        }
        mapa.get(chave)!.atletas.push({ ...a, provasNaMod: m.provas || [] });
      }
    }

    return Array.from(mapa.values()).sort((a, b) =>
      `${a.modalidadeNome} ${a.categoria} ${a.sexo} ${a.equipeLabel || ''}`.localeCompare(
        `${b.modalidadeNome} ${b.categoria} ${b.sexo} ${b.equipeLabel || ''}`,
        'pt-BR'
      )
    );
  }, [atletasFiltrados, filtroMod, modalidades, inscricoesEscola]);

  // Pendências consolidadas
  const pendencias = useMemo(() => {
    const alunosSemDoc = atletasEscola.filter(isSemDocumento);
    const alunosSemFoto = atletasEscola.filter((a) => !a.documentos?.foto3x4);
    const equipesAbaixoMinimo = gruposPorModalidade.filter(
      (g) => g.minAtletas > 1 && g.atletas.length < g.minAtletas
    );
    return { alunosSemDoc, alunosSemFoto, equipesAbaixoMinimo };
  }, [atletasEscola, gruposPorModalidade]);

  const handleBaixarPdf = async () => {
    try {
      setGerandoPdf(true);
      await JegdPdfGenerator.gerarLoteCompletoEscola(
        escola,
        atletasEscola,
        inscricoesEscola,
        filtroMod !== 'TODAS' ? filtroMod : undefined,
        filtroCat !== 'TODAS' ? filtroCat : undefined,
        filtroSexo !== 'TODOS' ? filtroSexo : undefined
      );
    } catch (err: any) {
      alert(err?.message || 'Erro ao gerar PDF da escola');
    } finally {
      setGerandoPdf(false);
    }
  };

  const handleExportarCsv = () => {
    const cabecalho = [
      'Nº',
      'Nome Completo',
      'Nascimento',
      'Sexo',
      'Categoria',
      'Turma',
      'Documento',
      'Situação Doc.',
      'Conferido',
      'Modalidades',
    ];
    const linhas = atletasFiltrados.map((a, idx) => {
      const mods = (a.modalidadesInscritas || [])
        .map((m) => (m.provas && m.provas.length > 0 ? `${m.modalidadeNome} (${m.provas.join(', ')})` : m.modalidadeNome))
        .join(' | ');
      return [
        idx + 1,
        a.nomeCompleto,
        formatarNasc(a.dataNascimento),
        a.sexo,
        a.categoriaCalculada || '',
        a.serieTurma || '',
        isSemDocumento(a) ? 'SEM DOCUMENTO' : `${a.documentoTipo || ''} ${a.documentoNumero || ''}`.trim(),
        isSemDocumento(a) ? 'Pendente' : 'Regular',
        a.conferidoPeloCoordenador ? 'Sim' : 'Não',
        mods,
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(';');
    });

    const csv = '\uFEFF' + [cabecalho.join(';'), ...linhas].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Relatorio_${(escola.sigla || escola.nome).replace(/\s+/g, '_')}_JEGDS_2026.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPendencias =
    pendencias.alunosSemDoc.length +
    pendencias.alunosSemFoto.length +
    pendencias.equipesAbaixoMinimo.length;

  return (
    <div className="space-y-5">
      {/* CABEÇALHO EXECUTIVO DA ESCOLA */}
      <div className="rounded-2xl bg-[#F4F6F8] border border-slate-200/80 p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-[#00A878]/10 text-[#087A5B] text-[11px] font-bold">
                {escola.sigla || 'ESCOLA'}
              </span>
              <span className="text-xs text-slate-500">
                INEP: {escola.inep || 'N/I'} · {escola.rede}
              </span>
            </div>
            <h3 className="text-lg font-black text-[#0F2540] tracking-tight flex items-center gap-2">
              <School className="w-5 h-5 text-[#00A878] shrink-0" />
              <span>{escola.nome}</span>
            </h3>
            <p className="text-xs text-slate-500">
              Responsável: <strong className="text-slate-700">{escola.responsavelNome || '-'}</strong>
              {escola.responsavelTelefone ? ` · ${escola.responsavelTelefone}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={gerandoPdf}
              onClick={handleBaixarPdf}
              className="px-4 py-2 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{gerandoPdf ? 'Gerando PDF...' : 'PDF da Escola'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportarCsv}
              className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-[#0F2540] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#00A878]" />
              <span>Excel / CSV</span>
            </button>

            {onGerarCadernoEscola && (
              <button
                type="button"
                onClick={() => onGerarCadernoEscola(escola)}
                className="px-3.5 py-2 rounded-xl bg-[#0F2540] hover:bg-[#17355A] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-300" />
                <span>Caderno de Súmulas</span>
              </button>
            )}
          </div>
        </div>

        {/* KPIs limpos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-200/80">
          <div className="bg-white rounded-xl px-4 py-3 border border-slate-200/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Alunos Inscritos</p>
            <p className="text-xl font-black text-[#0F2540] tabular-nums mt-0.5">{metricas.total}</p>
            <p className="text-[11px] text-slate-400">
              {metricas.masc} Masc · {metricas.fem} Fem
            </p>
          </div>
          <div className="bg-white rounded-xl px-4 py-3 border border-slate-200/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Modalidades</p>
            <p className="text-xl font-black text-[#0F2540] tabular-nums mt-0.5">{metricas.totalModalidades}</p>
            <p className="text-[11px] text-slate-400">{metricas.totalEquipes} equipe(s) registrada(s)</p>
          </div>
          <div className="bg-white rounded-xl px-4 py-3 border border-slate-200/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Conferidos</p>
            <p className="text-xl font-black text-[#00A878] tabular-nums mt-0.5">{metricas.homologados}</p>
            <p className="text-[11px] text-slate-400">de {metricas.total} alunos</p>
          </div>
          <div className="bg-white rounded-xl px-4 py-3 border border-slate-200/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pendências</p>
            <p
              className={`text-xl font-black tabular-nums mt-0.5 ${
                totalPendencias > 0 ? 'text-rose-600' : 'text-[#00A878]'
              }`}
            >
              {totalPendencias}
            </p>
            <p className="text-[11px] text-slate-400">
              {metricas.semDoc} sem doc · {metricas.semFoto} sem foto
            </p>
          </div>
        </div>
      </div>

      {/* SUB-ABAS + FILTROS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-5">
          {(
            [
              { id: 'MODALIDADES', label: 'Por Modalidade', count: gruposPorModalidade.length, icon: Trophy },
              { id: 'ALUNOS', label: 'Lista de Alunos', count: atletasFiltrados.length, icon: Users },
              { id: 'PENDENCIAS', label: 'Pendências', count: totalPendencias, icon: AlertTriangle },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const ativa = visao === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setVisao(t.id)}
                className={`pb-2 -mb-3.5 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  ativa
                    ? 'border-[#00A878] text-[#0F2540]'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${ativa ? 'text-[#00A878]' : 'text-slate-400'}`} />
                <span>{t.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full tabular-nums ${
                    t.id === 'PENDENCIAS' && t.count > 0
                      ? 'bg-rose-100 text-rose-700'
                      : ativa
                      ? 'bg-emerald-50 text-[#087A5B]'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filtros compactos */}
        {visao !== 'PENDENCIAS' && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar aluno..."
                className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white w-44"
              />
            </div>
            <select
              value={filtroMod}
              onChange={(e) => setFiltroMod(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-[#0F2540]"
            >
              <option value="TODAS">Todas modalidades</option>
              {modalidades.map((m) => (
                <option key={m.codigo} value={m.codigo}>
                  {m.nome}
                </option>
              ))}
            </select>
            <select
              value={filtroCat}
              onChange={(e) => setFiltroCat(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-[#0F2540]"
            >
              <option value="TODAS">Categorias</option>
              <option value="MIRIM">Mirim</option>
              <option value="INFANTIL">Infantil</option>
              <option value="INFANTO">Infanto</option>
              <option value="JUNIOR">Júnior</option>
            </select>
            <select
              value={filtroSexo}
              onChange={(e) => setFiltroSexo(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-[#0F2540]"
            >
              <option value="TODOS">Naipe</option>
              <option value="MASCULINO">Masculino</option>
              <option value="FEMININO">Feminino</option>
            </select>
            <select
              value={filtroSituacao}
              onChange={(e) => setFiltroSituacao(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-[#0F2540]"
            >
              <option value="TODOS">Situação</option>
              <option value="OK">Regular / OK</option>
              <option value="SEM_DOC">Sem documento</option>
              <option value="PENDENTE">Não conferido</option>
            </select>
          </div>
        )}
      </div>

      {/* VISÃO 1: POR MODALIDADE */}
      {visao === 'MODALIDADES' && (
        <div className="space-y-4">
          {gruposPorModalidade.length === 0 ? (
            <div className="rounded-xl bg-[#F4F6F8] py-10 text-center text-xs text-slate-500">
              Nenhum aluno encontrado para os filtros aplicados.
            </div>
          ) : (
            gruposPorModalidade.map((g) => {
              const abaixoMin = g.minAtletas > 1 && g.atletas.length < g.minAtletas;
              return (
                <div key={g.chave} className="rounded-2xl bg-[#F4F6F8] p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-black text-[#0F2540]">
                        {g.modalidadeNome} · {g.categoria} · {g.sexo === 'MASCULINO' ? 'Masculino' : 'Feminino'}
                      </h4>
                      {g.equipeLabel && (
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#0F2540] text-white">
                          {g.equipeLabel}
                        </span>
                      )}
                      {g.statusEquipe && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            g.statusEquipe === 'VALIDADA'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {g.statusEquipe}
                        </span>
                      )}
                      {abaixoMin && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                          Abaixo do mínimo ({g.atletas.length}/{g.minAtletas})
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-[#087A5B]">
                      {g.atletas.length} aluno(s)
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {g.atletas.map((a, idx) => {
                      const semDoc = isSemDocumento(a);
                      return (
                        <div
                          key={`${g.chave}_${a.id}`}
                          className="bg-white rounded-lg px-3.5 py-2.5 shadow-[0_1px_2px_rgba(15,37,64,0.04)] flex flex-wrap items-center justify-between gap-2 text-xs"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span className="font-mono text-[11px] text-slate-400 w-5">{idx + 1}.</span>
                            {a.documentos?.foto3x4 ? (
                              <img
                                src={a.documentos.foto3x4}
                                alt={a.nomeCompleto}
                                className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                                {a.nomeCompleto.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-[#0F2540] truncate">{a.nomeCompleto}</p>
                              <p className="text-[11px] text-slate-400">
                                Nasc.: {formatarNasc(a.dataNascimento)}
                                {a.serieTurma ? ` · ${a.serieTurma}` : ''}
                                {a.provasNaMod.length > 0 ? ` · Provas: ${a.provasNaMod.join(', ')}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`text-[11px] font-semibold ${
                                semDoc ? 'text-rose-600' : 'text-slate-600'
                              }`}
                            >
                              {semDoc ? 'Sem documento' : `${a.documentoTipo} ${a.documentoNumero}`}
                            </span>
                            {a.conferidoPeloCoordenador ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-[#087A5B] text-[10px] font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> OK
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">
                                Pendente
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* VISÃO 2: LISTA COMPLETA DE ALUNOS */}
      {visao === 'ALUNOS' && (
        <div className="rounded-2xl bg-[#F4F6F8] p-4 overflow-x-auto">
          {atletasFiltrados.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">Nenhum aluno encontrado.</div>
          ) : (
            <table className="w-full text-xs text-left min-w-[700px]">
              <thead className="text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Aluno</th>
                  <th className="px-3 py-2">Nascimento</th>
                  <th className="px-3 py-2">Categoria / Naipe</th>
                  <th className="px-3 py-2">Documento</th>
                  <th className="px-3 py-2">Modalidades</th>
                  <th className="px-3 py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70">
                {atletasFiltrados.map((a, idx) => {
                  const semDoc = isSemDocumento(a);
                  return (
                    <tr key={a.id} className="bg-white hover:bg-slate-50/70">
                      <td className="px-3 py-2.5 font-mono text-slate-400">{idx + 1}</td>
                      <td className="px-3 py-2.5 font-bold text-[#0F2540]">{a.nomeCompleto}</td>
                      <td className="px-3 py-2.5 text-slate-500 tabular-nums">{formatarNasc(a.dataNascimento)}</td>
                      <td className="px-3 py-2.5 text-slate-600">
                        {a.categoriaCalculada} · {a.sexo === 'MASCULINO' ? 'M' : 'F'}
                      </td>
                      <td className={`px-3 py-2.5 font-medium ${semDoc ? 'text-rose-600' : 'text-slate-600'}`}>
                        {semDoc ? 'Sem documento' : `${a.documentoTipo} ${a.documentoNumero}`}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">
                        {(a.modalidadesInscritas || []).map((m) => m.modalidadeNome).join(', ') || '-'}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            a.conferidoPeloCoordenador
                              ? 'bg-emerald-50 text-[#087A5B]'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {a.conferidoPeloCoordenador ? 'Conferido' : 'Pendente'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* VISÃO 3: PENDÊNCIAS DA ESCOLA */}
      {visao === 'PENDENCIAS' && (
        <div className="space-y-4">
          {totalPendencias === 0 ? (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-8 text-center space-y-1">
              <CheckCircle2 className="w-8 h-8 text-[#00A878] mx-auto" />
              <p className="text-sm font-bold text-emerald-950">Tudo regularizado!</p>
              <p className="text-xs text-emerald-700">
                Nenhuma pendência de documento, foto ou elenco encontrada para esta escola.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Sem documento */}
              <div className="rounded-2xl bg-white border border-slate-200/80 p-4 space-y-2.5">
                <h4 className="text-xs font-black uppercase text-rose-700 flex items-center justify-between">
                  <span>Alunos sem documento</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100">{pendencias.alunosSemDoc.length}</span>
                </h4>
                {pendencias.alunosSemDoc.length === 0 ? (
                  <p className="text-xs text-slate-400">Nenhum aluno sem documento.</p>
                ) : (
                  <ul className="space-y-1.5 max-h-64 overflow-y-auto text-xs">
                    {pendencias.alunosSemDoc.map((a) => (
                      <li key={a.id} className="px-2.5 py-1.5 rounded-lg bg-rose-50/60 text-slate-800 font-medium">
                        {a.nomeCompleto}{' '}
                        <span className="text-[10px] text-slate-400">({a.categoriaCalculada})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Sem foto */}
              <div className="rounded-2xl bg-white border border-slate-200/80 p-4 space-y-2.5">
                <h4 className="text-xs font-black uppercase text-amber-800 flex items-center justify-between">
                  <span>Alunos sem foto 3×4</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100">{pendencias.alunosSemFoto.length}</span>
                </h4>
                {pendencias.alunosSemFoto.length === 0 ? (
                  <p className="text-xs text-slate-400">Todos os alunos possuem foto.</p>
                ) : (
                  <ul className="space-y-1.5 max-h-64 overflow-y-auto text-xs">
                    {pendencias.alunosSemFoto.map((a) => (
                      <li key={a.id} className="px-2.5 py-1.5 rounded-lg bg-amber-50/60 text-slate-800 font-medium">
                        {a.nomeCompleto}{' '}
                        <span className="text-[10px] text-slate-400">({a.categoriaCalculada})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Equipes abaixo do mínimo */}
              <div className="rounded-2xl bg-white border border-slate-200/80 p-4 space-y-2.5">
                <h4 className="text-xs font-black uppercase text-[#0F2540] flex items-center justify-between">
                  <span>Equipes abaixo do mínimo</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100">{pendencias.equipesAbaixoMinimo.length}</span>
                </h4>
                {pendencias.equipesAbaixoMinimo.length === 0 ? (
                  <p className="text-xs text-slate-400">Todas as equipes atingiram o mínimo.</p>
                ) : (
                  <ul className="space-y-1.5 max-h-64 overflow-y-auto text-xs">
                    {pendencias.equipesAbaixoMinimo.map((g) => (
                      <li key={g.chave} className="px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-800 font-medium flex justify-between">
                        <span>
                          {g.modalidadeNome} · {g.categoria} ({g.sexo === 'MASCULINO' ? 'M' : 'F'})
                        </span>
                        <span className="font-bold text-rose-600">
                          {g.atletas.length}/{g.minAtletas}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
