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
  UserCheck
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import {
  Atleta,
  Escola,
  InscricaoEquipe,
  PapelUsuario,
  RegistroControle,
  TipoRegistroControle
} from '@/types/jegd';
import { JegdsRulesService } from '@/services/jegds-rules';
import { PainelOperador } from '@/app/validar/components/PainelOperador';
import { CardAtletaValidacao } from '@/app/validar/components/CardAtletaValidacao';
import { RelatorioLogisticoAgregado } from '@/app/validar/components/RelatorioLogisticoAgregado';

export function AbaCrachaLogistica() {
  const [activeTab, setActiveTab] = useState<'VALIDACAO' | 'RELATORIO'>('VALIDACAO');
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
      texto: `✅ ${labels[tipo] || 'Evento'} com sucesso para ${atletaEncontrado.nomeCompleto.split(' ')[0]}!`
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

        <div className="flex items-center p-1 bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl shrink-0">
          <button
            onClick={() => setActiveTab('VALIDACAO')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === 'VALIDACAO'
                ? 'bg-[#00A878] text-white shadow-xs'
                : 'text-[#68756E] hover:text-[#17221D]'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Validação Individual</span>
          </button>

          <button
            onClick={() => setActiveTab('RELATORIO')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
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
