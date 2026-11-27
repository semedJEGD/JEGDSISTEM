'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BarChart3,
  ShieldCheck,
  Droplets,
  Utensils,
  Bus,
  UserCheck,
  Printer,
  Trophy,
  Users,
  School,
  Filter
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { JegdPdfGenerator } from '@/lib/pdf-generator';
import {
  Atleta,
  Escola,
  InscricaoEquipe,
  ModalidadeConfig,
  PapelUsuario,
  RegistroControle,
  TipoRegistroControle
} from '@/types/jegd';
import { JegdsRulesService } from '@/services/jegds-rules';
import { PainelOperador } from '@/app/validar/components/PainelOperador';
import { CardAtletaValidacao } from '@/app/validar/components/CardAtletaValidacao';
import { RelatorioLogisticoAgregado } from '@/app/validar/components/RelatorioLogisticoAgregado';

interface AbaCrachaLogisticaProps {
  atletas?: Atleta[];
  escolas?: Escola[];
  modalidades?: ModalidadeConfig[];
  inscricoes?: InscricaoEquipe[];
  onGerarTodosCrachas?: () => void;
  gerandoPdf?: boolean;
}

function getEtapaModalidade(codigo: string): { etapa: number; label: string; badgeClass: string } {
  switch (codigo) {
    case 'queimada':
    case 'tenis_mesa':
    case 'xadrez':
      return { etapa: 1, label: '1ª Etapa', badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    case 'atletismo':
    case 'beach_soccer':
      return { etapa: 2, label: '2ª Etapa', badgeClass: 'bg-sky-50 text-sky-800 border-sky-200' };
    default:
      return { etapa: 3, label: '3ª Etapa', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' };
  }
}

export function AbaCrachaLogistica({
  atletas: atletasProp,
  escolas: escolasProp,
  modalidades: modalidadesProp,
  inscricoes: inscricoesProp,
  onGerarTodosCrachas,
  gerandoPdf
}: AbaCrachaLogisticaProps) {
  const [activeTab, setActiveTab] = useState<'VALIDACAO' | 'IMPRESSAO_MODALIDADES' | 'RELATORIO'>('VALIDACAO');
  const [filtroCatMod, setFiltroCatMod] = useState<string>('TODAS');
  const [filtroSexoMod, setFiltroSexoMod] = useState<string>('TODOS');
  const [filtroEscolaMod, setFiltroEscolaMod] = useState<string>('TODAS');
  const [gerandoModCodigo, setGerandoModCodigo] = useState<string | null>(null);
  const [codigoBusca, setCodigoBusca] = useState('');
  const [atletaEncontrado, setAtletaEncontrado] = useState<Atleta | null>(null);
  const [escolaAtleta, setEscolaAtleta] = useState<Escola | null>(null);
  const [inscricoesAtleta, setInscricoesAtleta] = useState<InscricaoEquipe[]>([]);
  const [historicoAtleta, setHistoricoAtleta] = useState<RegistroControle[]>([]);
  const [buscou, setBuscou] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'sucesso' | 'erro' | 'info'; texto: string } | null>(null);
  const [filtroEscolaRelatorio, setFiltroEscolaRelatorio] = useState('TODAS');

  // Operador ativo (Sessão da Coordenação SEMED)
  const [operadorNome, setOperadorNome] = useState('Elias Veloso (SEMED)');
  const [operadorPapel, setOperadorPapel] = useState<PapelUsuario>('COORDENADOR');
  const [isOperadorAtivo, setIsOperadorAtivo] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('jegd_operador_ativo');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.nome) {
          setOperadorNome(parsed.nome);
          setOperadorPapel(parsed.papel || 'COORDENADOR');
          setIsOperadorAtivo(true);
        }
      }
    } catch (e) {}
  }, []);

  const relatorio = useMemo(() => {
    return JegdStorage.getRelatorioLogistico();
  }, [historicoAtleta, activeTab]);

  const atletasLista = useMemo(
    () => atletasProp ?? JegdStorage.getAtletas(),
    [atletasProp, activeTab]
  );
  const escolasLista = useMemo(
    () => escolasProp ?? JegdStorage.getEscolas(),
    [escolasProp, activeTab]
  );
  const modalidadesLista = useMemo(
    () => modalidadesProp ?? JegdStorage.getModalidades(),
    [modalidadesProp, activeTab]
  );
  const inscricoesLista = useMemo(
    () => inscricoesProp ?? JegdStorage.getInscricoes(),
    [inscricoesProp, activeTab]
  );

  // Agrupamento de atletas por modalidade (com filtros de Categoria, Naipe e Escola)
  const modalidadesComAtletas = useMemo(() => {
    const atletaPorId = new Map(atletasLista.map((a) => [a.id, a]));

    const passaFiltro = (a: Atleta) => {
      if (filtroCatMod !== 'TODAS' && a.categoriaCalculada !== filtroCatMod) return false;
      if (filtroSexoMod !== 'TODOS' && a.sexo !== filtroSexoMod) return false;
      if (filtroEscolaMod !== 'TODAS' && a.escolaId !== filtroEscolaMod) return false;
      return true;
    };

    return modalidadesLista
      .map((mod) => {
        const codLower = mod.codigo.toLowerCase();
        const nomeLower = mod.nome.toLowerCase();
        const idsSet = new Set<string>();

        for (const atl of atletasLista) {
          if (!passaFiltro(atl)) continue;
          const temMod = atl.modalidadesInscritas?.some(
            (m) =>
              m.modalidadeCodigo?.toLowerCase() === codLower ||
              m.modalidadeNome?.toLowerCase().includes(nomeLower)
          );
          if (temMod) idsSet.add(atl.id);
        }

        for (const insc of inscricoesLista) {
          const bateMod =
            insc.modalidadeCodigo?.toLowerCase() === codLower ||
            insc.modalidadeNome?.toLowerCase().includes(nomeLower);
          if (!bateMod) continue;
          for (const aId of insc.atletaIds || []) {
            const atl = atletaPorId.get(aId);
            if (atl && passaFiltro(atl)) idsSet.add(atl.id);
          }
        }

        const atletasDaMod = Array.from(idsSet)
          .map((id) => atletaPorId.get(id))
          .filter((a): a is Atleta => Boolean(a));

        const escolasUnicas = new Set(atletasDaMod.map((a) => a.escolaId));
        const porCat: Record<string, number> = {};
        for (const a of atletasDaMod) {
          const c = a.categoriaCalculada || 'OUTRA';
          porCat[c] = (porCat[c] || 0) + 1;
        }

        return {
          modalidade: mod,
          etapaInfo: getEtapaModalidade(mod.codigo),
          atletas: atletasDaMod,
          totalEscolas: escolasUnicas.size,
          porCat,
        };
      })
      .sort((a, b) => {
        if (a.etapaInfo.etapa !== b.etapaInfo.etapa) return a.etapaInfo.etapa - b.etapaInfo.etapa;
        return a.modalidade.nome.localeCompare(b.modalidade.nome, 'pt-BR');
      });
  }, [atletasLista, modalidadesLista, inscricoesLista, filtroCatMod, filtroSexoMod, filtroEscolaMod]);

  const atletasFiltradosGeral = useMemo(() => {
    return atletasLista.filter((a) => {
      if (filtroCatMod !== 'TODAS' && a.categoriaCalculada !== filtroCatMod) return false;
      if (filtroSexoMod !== 'TODOS' && a.sexo !== filtroSexoMod) return false;
      if (filtroEscolaMod !== 'TODAS' && a.escolaId !== filtroEscolaMod) return false;
      return true;
    });
  }, [atletasLista, filtroCatMod, filtroSexoMod, filtroEscolaMod]);

  const handleImprimirPorModalidade = async (mod: ModalidadeConfig, atletasDaMod: Atleta[]) => {
    if (atletasDaMod.length === 0) {
      alert(`Nenhum atleta encontrado em ${mod.nome} com os filtros selecionados.`);
      return;
    }
    setGerandoModCodigo(mod.codigo);
    try {
      const partesTitulo = [mod.nome];
      if (filtroCatMod !== 'TODAS') partesTitulo.push(filtroCatMod);
      if (filtroSexoMod !== 'TODOS') partesTitulo.push(filtroSexoMod === 'MASCULINO' ? 'Masculino' : 'Feminino');
      if (filtroEscolaMod !== 'TODAS') {
        const esc = escolasLista.find((e) => e.id === filtroEscolaMod);
        if (esc) partesTitulo.push(esc.sigla || esc.nome);
      }
      const slug = partesTitulo
        .join('_')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_|_$/g, '');

      await JegdPdfGenerator.gerarTodosCrachasGeral(escolasLista, atletasDaMod, {
        tituloLote: `Crachás — ${partesTitulo.join(' • ')}`,
        nomeArquivo: `Crachas_${slug}_JEGDS_2026.pdf`,
        modalidadeNome: mod.nome,
        categoria: filtroCatMod !== 'TODAS' ? filtroCatMod : undefined,
      });
    } catch (e) {
      console.error(e);
      alert(`Erro ao gerar crachás de ${mod.nome}.`);
    } finally {
      setGerandoModCodigo(null);
    }
  };

  const handleImprimirLoteFiltradoGeral = async () => {
    if (atletasFiltradosGeral.length === 0) {
      alert('Nenhum atleta encontrado com os filtros selecionados.');
      return;
    }
    setGerandoModCodigo('__GERAL__');
    try {
      const partes: string[] = ['Lote Geral'];
      if (filtroCatMod !== 'TODAS') partes.push(filtroCatMod);
      if (filtroSexoMod !== 'TODOS') partes.push(filtroSexoMod === 'MASCULINO' ? 'Masculino' : 'Feminino');
      if (filtroEscolaMod !== 'TODAS') {
        const esc = escolasLista.find((e) => e.id === filtroEscolaMod);
        if (esc) partes.push(esc.sigla || esc.nome);
      }
      const slug = partes
        .join('_')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]+/g, '_')
        .replace(/^_|_$/g, '');

      await JegdPdfGenerator.gerarTodosCrachasGeral(escolasLista, atletasFiltradosGeral, {
        tituloLote: partes.join(' • '),
        nomeArquivo: `Crachas_${slug}_JEGDS_2026.pdf`,
        categoria: filtroCatMod !== 'TODAS' ? filtroCatMod : undefined,
      });
    } catch (e) {
      console.error(e);
      alert('Erro ao gerar o lote de crachás.');
    } finally {
      setGerandoModCodigo(null);
    }
  };

  const handleSalvarOperador = () => {
    if (!operadorNome.trim()) {
      alert('Por favor, informe seu nome antes de registrar ações.');
      return;
    }
    try {
      localStorage.setItem('jegd_operador_ativo', JSON.stringify({ nome: operadorNome, papel: operadorPapel }));
    } catch (e) {}
    setIsOperadorAtivo(true);
    setFeedbackMsg({ tipo: 'sucesso', texto: `Operador "${operadorNome}" ativo com sucesso!` });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleBuscar = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!codigoBusca.trim()) return;

    setBuscou(true);
    setFeedbackMsg(null);

    const atleta = JegdStorage.getAtletaByCrachaToken(codigoBusca.trim());

    if (atleta) {
      setAtletaEncontrado(atleta);
      const escola = JegdStorage.getEscolaById(atleta.escolaId) || null;
      setEscolaAtleta(escola);
      const inscs = JegdStorage.getInscricoes().filter(i => i.atletaIds && i.atletaIds.includes(atleta.id));
      setInscricoesAtleta(inscs);
      const hist = JegdStorage.getRegistrosControle(atleta.id);
      setHistoricoAtleta(hist);
    } else {
      setAtletaEncontrado(null);
      setEscolaAtleta(null);
      setInscricoesAtleta([]);
      setHistoricoAtleta([]);
      setFeedbackMsg({
        tipo: 'erro',
        texto: 'Nenhum atleta localizado com este token, matrícula ou ID.'
      });
    }
  };

  const catInfo = useMemo(() => {
    if (!atletaEncontrado) return null;
    return JegdsRulesService.calcularCategoria(atletaEncontrado.dataNascimento);
  }, [atletaEncontrado]);

  const getTipoFormatado = (tipo: TipoRegistroControle) => {
    switch (tipo) {
      case 'ELEGIBILIDADE':
        return { label: 'Acesso à Quadra / Elegibilidade', color: 'bg-emerald-50 border-emerald-200 text-emerald-900', icon: ShieldCheck };
      case 'AGUA':
        return { label: 'Entrega de Água', color: 'bg-sky-50 border-sky-200 text-sky-900', icon: Droplets };
      case 'LANCHE':
        return { label: 'Entrega de Lanche', color: 'bg-amber-50 border-amber-200 text-amber-900', icon: Utensils };
      case 'TRANSPORTE_IDA':
        return { label: 'Embarque Transporte (Ida)', color: 'bg-indigo-50 border-indigo-200 text-indigo-900', icon: Bus };
      case 'TRANSPORTE_VOLTA':
        return { label: 'Embarque Transporte (Volta)', color: 'bg-purple-50 border-purple-200 text-purple-900', icon: Bus };
      case 'CREDENCIAMENTO':
      default:
        return { label: 'Credenciamento Geral', color: 'bg-teal-50 border-teal-200 text-teal-900', icon: UserCheck };
    }
  };

  const handleRegistrarEvento = (tipo: TipoRegistroControle, observacao?: string) => {
    if (!atletaEncontrado) return;

    if (!isOperadorAtivo || !operadorNome.trim()) {
      alert('Identifique-se como operador no topo antes de registrar ações logísticas.');
      return;
    }

    const novoRegistro: RegistroControle = {
      id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      atletaId: atletaEncontrado.id,
      tipo,
      timestamp: new Date().toISOString(),
      registradoPor: operadorNome.trim(),
      papelOperador: operadorPapel,
      escolaId: atletaEncontrado.escolaId,
      detalhes: observacao || undefined
    };

    JegdStorage.saveRegistroControle(novoRegistro);

    const histAtualizado = JegdStorage.getRegistrosControle(atletaEncontrado.id);
    setHistoricoAtleta(histAtualizado);

    const labels: Record<TipoRegistroControle, string> = {
      LANCHE: 'Lanche registrado',
      AGUA: 'Água registrada',
      ELEGIBILIDADE: 'Acesso à quadra validado',
      TRANSPORTE_IDA: 'Embarque (Ida) registrado',
      TRANSPORTE_VOLTA: 'Embarque (Volta) registrado',
      CREDENCIAMENTO: 'Credenciamento confirmado'
    };

    setFeedbackMsg({
      tipo: 'sucesso',
      texto: `${labels[tipo] || 'Evento'} registrado com sucesso para ${atletaEncontrado.nomeCompleto.split(' ')[0]}!`
    });

    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4000);
  };

  const handleExcluirRegistro = (registroId: string) => {
    if (!confirm('Deseja realmente remover este registro de controle?')) return;
    if (!atletaEncontrado) return;

    JegdStorage.deleteRegistroControle(registroId);
    const histAtualizado = JegdStorage.getRegistrosControle(atletaEncontrado.id);
    setHistoricoAtleta(histAtualizado);
  };

  const handleImprimirCracha = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#E8F7F1] text-[#00A878]">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-[#17221D]">
              Validador de Crachás, Acesso à Quadra & Logística
            </h3>
          </div>
          <p className="text-xs text-[#68756E]">
            Módulo oficial de controle para fiscais da SEMED, árbitros e mesários. Valide credenciais via QR Code e audite entregas de água e lanches.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onGerarTodosCrachas && (
            <button
              type="button"
              onClick={onGerarTodosCrachas}
              disabled={gerandoPdf}
              className="px-4 py-2 rounded-xl bg-[#E8F7F1] hover:bg-[#00A878] text-[#087A5B] hover:text-white border border-[#00A878]/30 text-xs font-bold transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              title="Gerar PDF com os crachás de todas as escolas em lote"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{gerandoPdf ? 'Gerando Lote...' : 'Imprimir Crachás em Lote (PDF)'}</span>
            </button>
          )}

          <div className="flex items-center p-1 bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('VALIDACAO')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'VALIDACAO'
                ? 'bg-[#00A878] text-white shadow-xs'
                : 'text-[#68756E] hover:text-[#17221D]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Validação Individual</span>
          </button>

          <button
            onClick={() => setActiveTab('IMPRESSAO_MODALIDADES')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'IMPRESSAO_MODALIDADES'
                ? 'bg-[#00A878] text-white shadow-xs'
                : 'text-[#68756E] hover:text-[#17221D]'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Por Modalidade</span>
          </button>

          <button
            onClick={() => setActiveTab('RELATORIO')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'RELATORIO'
                ? 'bg-[#00A878] text-white shadow-xs'
                : 'text-[#68756E] hover:text-[#17221D]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Relatório Agregado</span>
          </button>
          </div>
        </div>
      </div>

      <PainelOperador
        operadorNome={operadorNome}
        setOperadorNome={setOperadorNome}
        operadorPapel={operadorPapel}
        setOperadorPapel={setOperadorPapel}
        isOperadorAtivo={isOperadorAtivo}
        onSalvarOperador={handleSalvarOperador}
      />

      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-3 transition-all ${
            feedbackMsg.tipo === 'sucesso'
              ? 'bg-[#E8F7F1] border-[#00A878]/30 text-[#087A5B]'
              : feedbackMsg.tipo === 'erro'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {feedbackMsg.tipo === 'sucesso' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-[#00A878]" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" />
          )}
          <span>{feedbackMsg.texto}</span>
        </div>
      )}

      {activeTab === 'VALIDACAO' && (
        <div className="space-y-6">
          <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 sm:p-8 shadow-xs">
            <form onSubmit={handleBuscar} className="space-y-4 max-w-2xl mx-auto">
              <div className="text-center space-y-1">
                <label className="text-xs sm:text-sm font-black text-[#17221D] block">
                  Escanear QR Code ou Digitar Token / Matrícula do Atleta
                </label>
                <p className="text-[11px] text-[#68756E]">
                  Use o leitor de código de barras ou digite o código do crachá (Ex: CR-ATL-..., Matrícula ou ID).
                </p>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={codigoBusca}
                    onChange={(e) => setCodigoBusca(e.target.value)}
                    placeholder="Cole o payload do QR Code ou digite o Token..."
                    className="w-full pl-11 pr-4 py-3.5 bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl text-sm font-bold text-[#17221D] outline-none focus:border-[#00A878] focus:bg-white transition-all shadow-xs"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3.5 bg-[#00A878] hover:bg-[#087A5B] text-white font-black text-sm rounded-2xl shadow-xs transition-all flex items-center gap-2"
                >
                  <span>Consultar</span>
                </button>
              </div>
            </form>
          </div>

          {atletaEncontrado && (
            <CardAtletaValidacao
              atletaEncontrado={atletaEncontrado}
              escolaAtleta={escolaAtleta}
              inscricoesAtleta={inscricoesAtleta}
              historicoAtleta={historicoAtleta}
              operadorPapel={operadorPapel}
              catInfo={catInfo}
              onImprimirCracha={handleImprimirCracha}
              onRegistrarEvento={handleRegistrarEvento}
              onRemoverRegistro={handleExcluirRegistro}
              getTipoFormatado={getTipoFormatado}
            />
          )}

          {buscou && !atletaEncontrado && (
            <div className="bg-white border border-[#E2EAE5] rounded-3xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <XCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-[#17221D]">Atleta não localizado</h4>
              <p className="text-xs text-[#68756E] max-w-md mx-auto">
                Verifique se o token foi digitado corretamente ou se o crachá pertence a outra edição.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'IMPRESSAO_MODALIDADES' && (
        <div className="space-y-5">
          {/* Barra de Filtros + Lote Filtrado */}
          <div className="bg-white border border-[#E2EAE5] rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#E8F7F1] text-[#087A5B]">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-[#17221D]">
                    Impressão de Crachás por Modalidade
                  </h4>
                  <p className="text-[11px] text-[#68756E]">
                    Gere lotes separados por esporte (4 crachás dobráveis grandes por folha A4). Use os filtros abaixo para refinar por categoria, naipe ou escola.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleImprimirLoteFiltradoGeral}
                disabled={gerandoModCodigo !== null || atletasFiltradosGeral.length === 0}
                className="px-4 py-2 rounded-xl bg-[#0F2540] hover:bg-[#1a3a61] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shrink-0"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>
                  {gerandoModCodigo === '__GERAL__'
                    ? 'Gerando PDF...'
                    : `Imprimir Todos Filtrados (${atletasFiltradosGeral.length})`}
                </span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E2EAE5]/70">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#68756E] mb-1">
                  Categoria
                </label>
                <select
                  value={filtroCatMod}
                  onChange={(e) => setFiltroCatMod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-bold text-[#17221D] focus:outline-none focus:border-[#00A878]"
                >
                  <option value="TODAS">Todas as Categorias</option>
                  <option value="MIRIM">Mirim (9 a 11 anos)</option>
                  <option value="INFANTIL">Infantil (12 a 14 anos)</option>
                  <option value="INFANTO">Infanto (15 a 17 anos)</option>
                  <option value="JUNIOR">Júnior (18 a 20 anos)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#68756E] mb-1">
                  Naipe
                </label>
                <select
                  value={filtroSexoMod}
                  onChange={(e) => setFiltroSexoMod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-bold text-[#17221D] focus:outline-none focus:border-[#00A878]"
                >
                  <option value="TODOS">Todos os Naipes</option>
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMININO">Feminino</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#68756E] mb-1">
                  Escola
                </label>
                <select
                  value={filtroEscolaMod}
                  onChange={(e) => setFiltroEscolaMod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-bold text-[#17221D] focus:outline-none focus:border-[#00A878]"
                >
                  <option value="TODAS">Todas as Escolas ({escolasLista.length})</option>
                  {[...escolasLista]
                    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                    .map((esc) => (
                      <option key={esc.id} value={esc.id}>
                        {esc.sigla || esc.nome}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Grid de Cards por Modalidade */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {modalidadesComAtletas.map(({ modalidade, etapaInfo, atletas: atletasMod, totalEscolas, porCat }) => {
              const totalFolhas = Math.ceil(atletasMod.length / 4);
              const isGerando = gerandoModCodigo === modalidade.codigo;

              return (
                <div
                  key={modalidade.codigo}
                  className="bg-white border border-[#E2EAE5] rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-4 hover:border-[#00A878]/50 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#E8F7F1] text-[#087A5B] flex items-center justify-center shrink-0">
                          <Trophy className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-sm font-black text-[#17221D] truncate">
                            {modalidade.nome}
                          </h5>
                          <span className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md border ${etapaInfo.badgeClass}`}>
                            {etapaInfo.label}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-lg font-black text-[#087A5B] leading-none">
                          {atletasMod.length}
                        </div>
                        <div className="text-[10px] font-semibold text-[#68756E]">
                          {atletasMod.length === 1 ? 'atleta' : 'atletas'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[#68756E] font-medium">
                      <span className="flex items-center gap-1">
                        <School className="w-3.5 h-3.5 text-slate-400" />
                        {totalEscolas} {totalEscolas === 1 ? 'escola' : 'escolas'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {totalFolhas} {totalFolhas === 1 ? 'folha A4' : 'folhas A4'}
                      </span>
                    </div>

                    {atletasMod.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {(['MIRIM', 'INFANTIL', 'INFANTO', 'JUNIOR'] as const)
                          .filter((cat) => (porCat[cat] || 0) > 0)
                          .map((cat) => (
                            <span
                              key={cat}
                              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D]"
                            >
                              {cat}: {porCat[cat]}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleImprimirPorModalidade(modalidade, atletasMod)}
                    disabled={atletasMod.length === 0 || gerandoModCodigo !== null}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#00A878] hover:bg-[#087A5B] disabled:bg-slate-200 disabled:text-slate-500 text-white text-xs font-black transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>
                      {isGerando
                        ? 'Gerando Crachás...'
                        : atletasMod.length === 0
                        ? 'Sem atletas neste filtro'
                        : `Imprimir Crachás (${atletasMod.length})`}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'RELATORIO' && (
        <RelatorioLogisticoAgregado
          relatorio={relatorio}
          filtroEscolaRelatorio={filtroEscolaRelatorio}
          setFiltroEscolaRelatorio={setFiltroEscolaRelatorio}
        />
      )}
    </div>
  );
}
