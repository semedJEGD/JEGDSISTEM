'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  School,
  Trophy,
  Users,
  ShieldCheck,
  Sparkles,
  Droplets,
  Utensils,
  Bus,
  UserCheck,
  History,
  BarChart3,
  Filter,
  Printer,
  Lock,
  LogIn,
  Check,
  Clock,
  Trash2,
  Flame,
  FileSpreadsheet
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { JegdPdfGenerator } from '@/lib/pdf-generator';
import {
  Atleta,
  Escola,
  InscricaoEquipe,
  PapelUsuario,
  RegistroControle,
  TipoRegistroControle
} from '@/types/jegd';

export default function CrachaControlePage() {
  const [activeTab, setActiveTab] = useState<'VALIDACAO' | 'RELATORIO'>('VALIDACAO');
  const [codigoBusca, setCodigoBusca] = useState('');
  const [atletaEncontrado, setAtletaEncontrado] = useState<Atleta | null>(null);
  const [escolaAtleta, setEscolaAtleta] = useState<Escola | null>(null);
  const [inscricoesAtleta, setInscricoesAtleta] = useState<InscricaoEquipe[]>([]);
  const [historicoAtleta, setHistoricoAtleta] = useState<RegistroControle[]>([]);
  const [buscou, setBuscou] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ tipo: 'sucesso' | 'erro' | 'info'; texto: string } | null>(null);

  // Operador ativo (Sessão de Controle)
  const [operadorNome, setOperadorNome] = useState('');
  const [operadorPapel, setOperadorPapel] = useState<PapelUsuario>('COORDENADOR');
  const [isOperadorAtivo, setIsOperadorAtivo] = useState(false);

  // Relatório Agregado
  const [relatorio, setRelatorio] = useState<ReturnType<typeof JegdStorage.getRelatorioLogistico> | null>(null);
  const [filtroEscolaRelatorio, setFiltroEscolaRelatorio] = useState('TODAS');

  useEffect(() => {
    JegdStorage.init();

    // Checar se há usuário logado no sistema
    const currentUser = JegdStorage.getCurrentUser();
    const currentEscola = JegdStorage.getCurrentEscola();
    const isComite = JegdStorage.isComiteAuth();

    if (currentUser) {
      setOperadorNome(currentUser.nome);
      setOperadorPapel(currentUser.papel);
      setIsOperadorAtivo(true);
    } else if (isComite) {
      setOperadorNome('Coordenação SEMED');
      setOperadorPapel('COORDENADOR');
      setIsOperadorAtivo(true);
    } else if (currentEscola) {
      setOperadorNome(`Prof. ${currentEscola.sigla}`);
      setOperadorPapel('PROFESSOR');
      setIsOperadorAtivo(true);
    }

    carregarRelatorio();
  }, []);

  const carregarRelatorio = () => {
    const dados = JegdStorage.getRelatorioLogistico();
    setRelatorio(dados);
  };

  const showToast = (texto: string, tipo: 'sucesso' | 'erro' | 'info' = 'sucesso') => {
    setFeedbackMsg({ texto, tipo });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4000);
  };

  const handleBuscar = (termoCustom?: string) => {
    const termo = (termoCustom || codigoBusca).trim();
    if (!termo) return;

    setBuscou(true);
    const encontrado = JegdStorage.getAtletaByCrachaToken(termo);

    if (encontrado) {
      // Garantir que o atleta tem token de crachá gerado
      if (!encontrado.crachaToken) {
        encontrado.crachaToken = JegdStorage.gerarOuObterTokenCracha(encontrado.id);
      }

      setAtletaEncontrado(encontrado);
      setEscolaAtleta(JegdStorage.getEscolaById(encontrado.escolaId) || null);

      const todasInscricoes = JegdStorage.getInscricoes();
      const inscsDoAtleta = todasInscricoes.filter((i) => i.atletaIds.includes(encontrado.id));
      setInscricoesAtleta(inscsDoAtleta);

      // Carregar histórico
      const logs = JegdStorage.getRegistrosControle(encontrado.id);
      setHistoricoAtleta(logs);
    } else {
      setAtletaEncontrado(null);
      setEscolaAtleta(null);
      setInscricoesAtleta([]);
      setHistoricoAtleta([]);
    }
  };

  const handleRegistrarEvento = (tipo: TipoRegistroControle, descricao: string) => {
    if (!atletaEncontrado) return;

    if (!isOperadorAtivo || !operadorNome.trim()) {
      showToast('Por favor, informe seu nome e papel de operador no painel acima para registrar.', 'erro');
      return;
    }

    const novoRegistro: RegistroControle = {
      id: `reg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      atletaId: atletaEncontrado.id,
      tipo,
      timestamp: new Date().toISOString(),
      registradoPor: operadorNome.trim(),
      papelOperador: operadorPapel,
      escolaId: atletaEncontrado.escolaId,
      detalhes: descricao
    };

    JegdStorage.saveRegistroControle(novoRegistro);

    // Atualizar histórico local
    const logsAtualizados = JegdStorage.getRegistrosControle(atletaEncontrado.id);
    setHistoricoAtleta(logsAtualizados);
    carregarRelatorio();

    showToast(`✅ ${descricao} registrado com sucesso para ${atletaEncontrado.nomeCompleto}!`, 'sucesso');
  };

  const handleRemoverRegistro = (registroId: string) => {
    if (!confirm('Deseja realmente excluir este registro de histórico?')) return;
    JegdStorage.deleteRegistroControle(registroId);
    if (atletaEncontrado) {
      setHistoricoAtleta(JegdStorage.getRegistrosControle(atletaEncontrado.id));
    }
    carregarRelatorio();
    showToast('Registro removido do histórico.', 'info');
  };

  const handleImprimirCrachaIndividual = async () => {
    if (!atletaEncontrado || !escolaAtleta) return;
    try {
      await JegdPdfGenerator.gerarCrachaIndividual(atletaEncontrado, escolaAtleta, operadorNome);
      showToast('Crachá individual gerado em PDF!', 'sucesso');
    } catch {
      showToast('Erro ao gerar crachá individual.', 'erro');
    }
  };

  const getTipoFormatado = (tipo: TipoRegistroControle) => {
    switch (tipo) {
      case 'ELEGIBILIDADE':
        return { label: 'Elegibilidade em Quadra', icon: ShieldCheck, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 'AGUA':
        return { label: 'Entrega de Água', icon: Droplets, color: 'text-sky-700 bg-sky-50 border-sky-200' };
      case 'LANCHE':
        return { label: 'Entrega de Lanche', icon: Utensils, color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'TRANSPORTE_IDA':
        return { label: 'Embarque Transporte (Ida)', icon: Bus, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
      case 'TRANSPORTE_VOLTA':
        return { label: 'Embarque Transporte (Volta)', icon: Bus, color: 'text-purple-700 bg-purple-50 border-purple-200' };
      case 'CREDENCIAMENTO':
        return { label: 'Credenciamento / Check-in', icon: UserCheck, color: 'text-teal-700 bg-teal-50 border-teal-200' };
    }
  };

  const catInfo = atletaEncontrado ? JegdStorage.calcularCategoria(atletaEncontrado.dataNascimento) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-5 py-3.5 rounded-2xl text-xs sm:text-sm font-bold shadow-lg border flex items-center gap-2.5 transition-all animate-bounce ${
            feedbackMsg.tipo === 'sucesso'
              ? 'bg-[#00A878] text-white border-[#087A5B]'
              : feedbackMsg.tipo === 'erro'
              ? 'bg-rose-600 text-white border-rose-700'
              : 'bg-[#17221D] text-white border-slate-700'
          }`}
        >
          <span>{feedbackMsg.texto}</span>
        </div>
      )}

      {/* Header Principal */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#E8F7F1] border border-[#00A878]/30 text-[#00A878] flex items-center justify-center mx-auto shadow-2xs">
          <QrCode className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.2]" />
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E8F7F1] text-[#087A5B] text-xs font-black border border-[#00A878]/25">
          <Sparkles className="w-3.5 h-3.5 text-[#00A878]" />
          <span>SISTEMA INTEGRADO DE CRACHÁ & CONTROLE LOGÍSTICO</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-[#17221D]">
          Crachá & Controle de Quadra e Logística
        </h1>
        <p className="text-xs sm:text-sm text-[#4B5563] font-medium max-w-xl mx-auto">
          Validação em tempo real para Árbitros e Mesários, controle de entrega de água, lanche e transporte da delegação JEGD 2026.
        </p>

        {/* Abas de Navegação */}
        <div className="flex justify-center gap-2 pt-3">
          <button
            onClick={() => setActiveTab('VALIDACAO')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeTab === 'VALIDACAO'
                ? 'bg-[#00A878] text-white shadow-md shadow-[#00A878]/20'
                : 'bg-white border border-[#E2EAE5] text-[#4B5563] hover:text-[#17221D]'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Consulta & Registro Individual</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('RELATORIO');
              carregarRelatorio();
            }}
            className={`px-4 sm:px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeTab === 'RELATORIO'
                ? 'bg-[#00A878] text-white shadow-md shadow-[#00A878]/20'
                : 'bg-white border border-[#E2EAE5] text-[#4B5563] hover:text-[#17221D]'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Relatório Agregado de Logística</span>
          </button>
        </div>
      </div>

      {/* PAINEL DE OPERADOR (IDENTIFICAÇÃO DE QUEM ESTÁ ESCANEANDO) */}
      <div className="bg-white border border-[#E2EAE5] rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isOperadorAtivo ? 'bg-[#E8F7F1] text-[#00A878]' : 'bg-slate-100 text-slate-400'
            }`}>
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black uppercase text-[#17221D] flex items-center gap-1.5">
                <span>Operador em Serviço:</span>
                {isOperadorAtivo ? (
                  <span className="text-[#087A5B] bg-[#E8F7F1] px-2 py-0.5 rounded-md font-bold text-[11px]">
                    Sessão Ativa ({operadorPapel})
                  </span>
                ) : (
                  <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-bold text-[11px]">
                    Apenas Consulta (Sem Login)
                  </span>
                )}
              </p>
              <p className="text-xs text-[#4B5563]">
                {isOperadorAtivo
                  ? `Registrando eventos como: ${operadorNome || 'Operador Identificado'}`
                  : 'Para registrar ações de mesa, água ou lanche, identifique-se abaixo.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              value={operadorNome}
              onChange={(e) => setOperadorNome(e.target.value)}
              placeholder="Seu nome (ex: Prof. Carlos / Fiscal João)"
              className="px-3 py-1.5 text-xs bg-[#F7F9F8] border border-[#E2EAE5] rounded-lg text-[#17221D] font-medium outline-none focus:border-[#00A878] flex-1 md:w-48"
            />
            <select
              value={operadorPapel}
              onChange={(e) => setOperadorPapel(e.target.value as PapelUsuario)}
              className="px-2.5 py-1.5 text-xs bg-[#F7F9F8] border border-[#E2EAE5] rounded-lg text-[#17221D] font-bold outline-none focus:border-[#00A878]"
            >
              <option value="COORDENADOR">Coordenação SEMED</option>
              <option value="MESARIO">Mesário / Fiscal</option>
              <option value="ARBITRO">Árbitro de Quadra</option>
              <option value="APOIO">Equipe de Apoio / Logística</option>
              <option value="PROFESSOR">Professor / Escola</option>
            </select>
            <button
              onClick={() => {
                if (operadorNome.trim()) {
                  setIsOperadorAtivo(true);
                  showToast(`Operador ${operadorNome} (${operadorPapel}) ativado!`, 'sucesso');
                } else {
                  showToast('Digite seu nome antes de ativar.', 'erro');
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-[#17221D] hover:bg-[#2A3B33] text-white text-xs font-bold transition-all shrink-0"
            >
              {isOperadorAtivo ? 'Atualizar Operador' : 'Identificar-se'}
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'VALIDACAO' && (
        <div className="space-y-6">
          
          {/* Formulário de Busca / Leitura de QR */}
          <div className="bg-white border border-[#E2EAE5] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleBuscar();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs sm:text-sm font-black text-[#17221D] uppercase tracking-wider mb-2">
                  Escanear QR Code ou Buscar por Token / ID / Matrícula / Nome
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={codigoBusca}
                    onChange={(e) => setCodigoBusca(e.target.value)}
                    placeholder="Cole o token do QR (ex: CR-ATL-01-A9F1), ID do atleta ou nome..."
                    className="w-full px-4 py-3.5 pl-11 rounded-xl sm:rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-base font-semibold focus:border-[#00A878] focus:bg-white transition-all outline-none"
                  />
                  <Search className="w-5 h-5 text-[#4B5563] absolute left-3.5 top-3.5" />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#4B5563]">
                  <span className="font-bold">Dica de Busca:</span>
                  <span className="text-[11px] text-[#6B7280]">
                    Aceita leitura de QR Code direto do crachá, ID do atleta ou nome completo.
                  </span>
                </div>

                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-black text-xs sm:text-sm shadow-md shadow-[#00A878]/20 flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Consultar Crachá</span>
                </button>
              </div>
            </form>
          </div>

          {/* Resultado da Busca */}
          {buscou && (
            <div>
              {atletaEncontrado ? (
                <div className="space-y-6">
                  
                  {/* CARD DO ATLETA ENCONTRADO */}
                  <div className="bg-white border-2 border-[#00A878] rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
                    
                    {/* Badge de Status Topo */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2EAE5] pb-4">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E8F7F1] text-[#087A5B] text-xs font-black border border-[#00A878]/30">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>CREDENCIAL AUTÊNTICA & REGULAR</span>
                      </div>

                      <button
                        onClick={handleImprimirCrachaIndividual}
                        className="px-3.5 py-1.5 rounded-xl bg-[#F7F9F8] hover:bg-[#E8F7F1] border border-[#00A878]/30 text-[#087A5B] text-xs font-black flex items-center gap-1.5 transition-all shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir Crachá Individual (PDF)</span>
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                      
                      {/* Foto / Avatar 3x4 */}
                      <div className="w-28 h-36 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                        {atletaEncontrado.documentos?.foto3x4 ? (
                          <img
                            src={atletaEncontrado.documentos.foto3x4}
                            alt={atletaEncontrado.nomeCompleto}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-center p-2">
                            <Users className="w-10 h-10 text-[#CBD5E1] mx-auto mb-1" />
                            <span className="text-[10px] text-[#6B7280] font-black uppercase">FOTO 3X4</span>
                          </div>
                        )}
                      </div>

                      {/* Dados Principais */}
                      <div className="space-y-3 flex-1 text-center sm:text-left">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <span className="text-xs font-black text-[#17221D] bg-[#F7F9F8] px-2.5 py-0.5 rounded-md border border-[#E2EAE5]">
                            ID: {atletaEncontrado.id.toUpperCase()}
                          </span>
                          <span className="text-xs font-black text-[#087A5B] bg-[#E8F7F1] px-2.5 py-0.5 rounded-md border border-[#00A878]/25">
                            TOKEN: {atletaEncontrado.crachaToken}
                          </span>
                          <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                            {catInfo?.categoria} • {atletaEncontrado.sexo}
                          </span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-black text-[#17221D]">
                          {atletaEncontrado.nomeCompleto}
                        </h2>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-[#4B5563]">
                          <p>
                            Escola: <strong className="text-[#17221D]">{escolaAtleta?.nome} ({escolaAtleta?.sigla})</strong>
                          </p>
                          <p>
                            Documento: <strong className="text-[#17221D]">{atletaEncontrado.documentoTipo} {atletaEncontrado.documentoNumero}</strong>
                          </p>
                          <p>
                            Série / Turma: <strong className="text-[#17221D]">{atletaEncontrado.serieTurma}</strong>
                          </p>
                          <p>
                            Data Nasc.: <strong className="text-[#17221D]">{new Date(atletaEncontrado.dataNascimento).toLocaleDateString('pt-BR')} ({catInfo?.idade} anos)</strong>
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* Modalidades Vinculadas */}
                    <div className="pt-4 border-t border-[#E2EAE5] space-y-2.5">
                      <p className="text-xs font-black text-[#17221D] uppercase tracking-wider">
                        Modalidades Inscritas & Status em Quadra
                      </p>

                      {inscricoesAtleta.length === 0 ? (
                        <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 font-medium">
                          * Atleta cadastrado na escola, mas sem vínculo a equipes homologadas no momento.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {inscricoesAtleta.map((insc) => (
                            <div
                              key={insc.id}
                              className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-xl p-3 flex items-center justify-between"
                            >
                              <div>
                                <p className="text-xs sm:text-sm font-black text-[#17221D]">{insc.modalidadeNome}</p>
                                <p className="text-[11px] text-[#4B5563]">
                                  {insc.categoria} • {insc.sexo}
                                </p>
                              </div>
                              <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-[#E8F7F1] text-[#087A5B] border border-[#00A878]/30">
                                LIBERADO PARA JOGO
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* PAINEL DE AÇÕES DE CONTROLE LOGÍSTICO (POR PAPEL) */}
                    <div className="pt-6 border-t-2 border-[#E2EAE5] space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs sm:text-sm font-black text-[#17221D] uppercase tracking-wider flex items-center gap-2">
                          <Flame className="w-4 h-4 text-[#00A878]" />
                          <span>Ações de Registro em Tempo Real</span>
                        </h3>
                        <span className="text-[11px] text-[#4B5563] font-bold">
                          Papel Ativo: {operadorPapel}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        
                        {/* Botão Mesa / Fiscal / Árbitro */}
                        {(operadorPapel === 'MESARIO' || operadorPapel === 'ARBITRO' || operadorPapel === 'COORDENADOR') && (
                          <button
                            onClick={() => handleRegistrarEvento('ELEGIBILIDADE', 'Elegibilidade e Presença em Quadra Confirmada')}
                            className="p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2.5 shadow-sm transition-all text-left"
                          >
                            <ShieldCheck className="w-5 h-5 shrink-0" />
                            <div>
                              <p className="font-black">Verificar Elegibilidade</p>
                              <p className="text-[10px] text-emerald-100 font-normal">Check-in de jogo e mesa</p>
                            </div>
                          </button>
                        )}

                        {/* Botões Equipe de Apoio / Logística */}
                        {(operadorPapel === 'APOIO' || operadorPapel === 'COORDENADOR' || operadorPapel === 'PROFESSOR') && (
                          <>
                            <button
                              onClick={() => handleRegistrarEvento('AGUA', 'Entrega de Kit Água Mineral')}
                              className="p-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs flex items-center gap-2.5 shadow-sm transition-all text-left"
                            >
                              <Droplets className="w-5 h-5 shrink-0" />
                              <div>
                                <p className="font-black">Registrar Água</p>
                                <p className="text-[10px] text-sky-100 font-normal">Distribuição de hidratação</p>
                              </div>
                            </button>

                            <button
                              onClick={() => handleRegistrarEvento('LANCHE', 'Entrega de Kit Lanche Oficial')}
                              className="p-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center gap-2.5 shadow-sm transition-all text-left"
                            >
                              <Utensils className="w-5 h-5 shrink-0" />
                              <div>
                                <p className="font-black">Registrar Lanche</p>
                                <p className="text-[10px] text-amber-100 font-normal">Alimentação da delegação</p>
                              </div>
                            </button>

                            <button
                              onClick={() => handleRegistrarEvento('TRANSPORTE_IDA', 'Embarque confirmado - Transporte IDA')}
                              className="p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-2.5 shadow-sm transition-all text-left"
                            >
                              <Bus className="w-5 h-5 shrink-0" />
                              <div>
                                <p className="font-black">Embarque (Ida)</p>
                                <p className="text-[10px] text-indigo-100 font-normal">Saída da escola / praça</p>
                              </div>
                            </button>

                            <button
                              onClick={() => handleRegistrarEvento('TRANSPORTE_VOLTA', 'Embarque confirmado - Transporte RETORNO')}
                              className="p-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center gap-2.5 shadow-sm transition-all text-left"
                            >
                              <Bus className="w-5 h-5 shrink-0" />
                              <div>
                                <p className="font-black">Embarque (Volta)</p>
                                <p className="text-[10px] text-purple-100 font-normal">Retorno após os jogos</p>
                              </div>
                            </button>

                            <button
                              onClick={() => handleRegistrarEvento('CREDENCIAMENTO', 'Credenciamento Geral de Entrada')}
                              className="p-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs flex items-center gap-2.5 shadow-sm transition-all text-left"
                            >
                              <UserCheck className="w-5 h-5 shrink-0" />
                              <div>
                                <p className="font-black">Credenciamento Geral</p>
                                <p className="text-[10px] text-teal-100 font-normal">Entrada no ginásio</p>
                              </div>
                            </button>
                          </>
                        )}

                      </div>
                    </div>

                  </div>

                  {/* HISTÓRICO RECENTE DO ATLETA */}
                  <div className="bg-white border border-[#E2EAE5] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xs space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E2EAE5] pb-3">
                      <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-[#00A878]" />
                        <h3 className="text-sm font-black text-[#17221D] uppercase">
                          Histórico de Controle Deste Atleta ({historicoAtleta.length})
                        </h3>
                      </div>
                      <span className="text-[11px] text-[#6B7280]">Ordenado do mais recente ao mais antigo</span>
                    </div>

                    {historicoAtleta.length === 0 ? (
                      <p className="text-xs sm:text-sm text-[#6B7280] py-4 text-center font-medium">
                        Nenhum registro logístico ou de quadra efetuado para este atleta ainda. Utilize os botões acima para registrar.
                      </p>
                    ) : (
                      <div className="space-y-2.5">
                        {historicoAtleta.map((log) => {
                          const fmt = getTipoFormatado(log.tipo);
                          const Icone = fmt.icon;
                          const dataHora = new Date(log.timestamp).toLocaleString('pt-BR');

                          return (
                            <div
                              key={log.id}
                              className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${fmt.color}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-white/70 shadow-2xs shrink-0">
                                  <Icone className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-xs sm:text-sm font-black">{log.detalhes || fmt.label}</p>
                                  <p className="text-[11px] opacity-85">
                                    Registrado por <strong>{log.registradoPor}</strong> ({log.papelOperador || 'Operador'}) • {dataHora}
                                  </p>
                                </div>
                              </div>

                              {operadorPapel === 'COORDENADOR' && (
                                <button
                                  onClick={() => handleRemoverRegistro(log.id)}
                                  title="Remover este registro"
                                  className="self-end sm:self-center p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="bg-white border-2 border-rose-200 rounded-2xl sm:rounded-3xl p-8 text-center space-y-3 shadow-xs">
                  <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
                  <h3 className="text-lg sm:text-xl font-black text-[#17221D]">Nenhum Atleta Encontrado</h3>
                  <p className="text-xs sm:text-sm text-[#4B5563] max-w-md mx-auto">
                    Não localizamos nenhum atleta com este código ou QR. Verifique se o token digitado está correto ou se a escola cadastrou o estudante no sistema.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ABA DE RELATÓRIO AGREGADO DE LOGÍSTICA */}
      {activeTab === 'RELATORIO' && relatorio && (
        <div className="space-y-6">
          
          {/* CARDS DE TOTALIZADORES GLOBAIS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            
            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-4 shadow-2xs text-center space-y-1">
              <Users className="w-5 h-5 text-slate-700 mx-auto" />
              <p className="text-[11px] font-black uppercase text-slate-500">Total Atletas</p>
              <p className="text-xl font-black text-[#17221D]">{relatorio.totaisGerais.totalAtletas}</p>
            </div>

            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-4 shadow-2xs text-center space-y-1">
              <UserCheck className="w-5 h-5 text-teal-600 mx-auto" />
              <p className="text-[11px] font-black uppercase text-teal-600">Credenciados</p>
              <p className="text-xl font-black text-[#17221D]">{relatorio.totaisGerais.credenciados}</p>
            </div>

            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-4 shadow-2xs text-center space-y-1">
              <Droplets className="w-5 h-5 text-sky-600 mx-auto" />
              <p className="text-[11px] font-black uppercase text-sky-600">Água Entregue</p>
              <p className="text-xl font-black text-sky-700">{relatorio.totaisGerais.agua}</p>
            </div>

            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-4 shadow-2xs text-center space-y-1">
              <Utensils className="w-5 h-5 text-amber-600 mx-auto" />
              <p className="text-[11px] font-black uppercase text-amber-600">Lanches</p>
              <p className="text-xl font-black text-amber-700">{relatorio.totaisGerais.lanche}</p>
            </div>

            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-4 shadow-2xs text-center space-y-1">
              <Bus className="w-5 h-5 text-indigo-600 mx-auto" />
              <p className="text-[11px] font-black uppercase text-indigo-600">Transp. Ida</p>
              <p className="text-xl font-black text-indigo-700">{relatorio.totaisGerais.transporteIda}</p>
            </div>

            <div className="bg-white border border-[#E2EAE5] rounded-2xl p-4 shadow-2xs text-center space-y-1">
              <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto" />
              <p className="text-[11px] font-black uppercase text-emerald-600">Em Quadra</p>
              <p className="text-xl font-black text-emerald-700">{relatorio.totaisGerais.elegibilidadeQuadra}</p>
            </div>

          </div>

          {/* TABELA POR ESCOLA */}
          <div className="bg-white border border-[#E2EAE5] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2EAE5] pb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#17221D] flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#00A878]" />
                  <span>Controle Logístico Consolidado por Unidade Escolar</span>
                </h3>
                <p className="text-xs text-[#4B5563]">
                  Acompanhe em tempo real as entregas de água, lanche e transporte de cada delegação.
                </p>
              </div>

              {/* Filtro por Escola */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#4B5563]" />
                <select
                  value={filtroEscolaRelatorio}
                  onChange={(e) => setFiltroEscolaRelatorio(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#F7F9F8] border border-[#E2EAE5] rounded-xl text-[#17221D] font-bold outline-none focus:border-[#00A878]"
                >
                  <option value="TODAS">Todas as 12 Escolas</option>
                  {relatorio.porEscola.map((p) => (
                    <option key={p.escola.id} value={p.escola.id}>
                      {p.escola.sigla} ({p.escola.nome})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Listagem em Cards Responsivos */}
            <div className="space-y-3">
              {relatorio.porEscola
                .filter((p) => filtroEscolaRelatorio === 'TODAS' || p.escola.id === filtroEscolaRelatorio)
                .map((item) => {
                  const percAgua = item.totalAtletas > 0 ? Math.round((item.agua / item.totalAtletas) * 100) : 0;
                  const percLanche = item.totalAtletas > 0 ? Math.round((item.lanche / item.totalAtletas) * 100) : 0;

                  return (
                    <div
                      key={item.escola.id}
                      className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl p-4 sm:p-5 space-y-4 hover:border-[#00A878]/50 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2EAE5] pb-3">
                        <div>
                          <h4 className="text-sm sm:text-base font-black text-[#17221D]">
                            {item.escola.nome} ({item.escola.sigla})
                          </h4>
                          <p className="text-xs text-[#4B5563]">
                            Rede {item.escola.rede} • Total de Atletas na Base: <strong>{item.totalAtletas}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200">
                            Credenciados: {item.credenciados}/{item.totalAtletas}
                          </span>
                        </div>
                      </div>

                      {/* Barras de Progresso e Métricas */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        
                        {/* Água */}
                        <div className="bg-white p-3 rounded-xl border border-[#E2EAE5] space-y-1.5">
                          <div className="flex justify-between font-bold">
                            <span className="text-sky-700 flex items-center gap-1">
                              <Droplets className="w-3.5 h-3.5" /> Água Entregue
                            </span>
                            <span className="text-slate-800">{item.agua}/{item.totalAtletas} ({percAgua}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-sky-500 h-full rounded-full transition-all" style={{ width: `${percAgua}%` }} />
                          </div>
                          <p className="text-[10px] text-slate-500 text-right">
                            {item.pendenteAgua > 0 ? `Faltam ${item.pendenteAgua} atletas` : '✅ Todos atendidos'}
                          </p>
                        </div>

                        {/* Lanche */}
                        <div className="bg-white p-3 rounded-xl border border-[#E2EAE5] space-y-1.5">
                          <div className="flex justify-between font-bold">
                            <span className="text-amber-700 flex items-center gap-1">
                              <Utensils className="w-3.5 h-3.5" /> Lanches Entregues
                            </span>
                            <span className="text-slate-800">{item.lanche}/{item.totalAtletas} ({percLanche}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${percLanche}%` }} />
                          </div>
                          <p className="text-[10px] text-slate-500 text-right">
                            {item.pendenteLanche > 0 ? `Faltam ${item.pendenteLanche} atletas` : '✅ Todos atendidos'}
                          </p>
                        </div>

                        {/* Transporte Ida e Volta */}
                        <div className="bg-white p-3 rounded-xl border border-[#E2EAE5] space-y-1">
                          <span className="text-indigo-700 font-bold flex items-center gap-1">
                            <Bus className="w-3.5 h-3.5" /> Transporte (Embarque)
                          </span>
                          <div className="flex justify-between text-xs pt-1 text-[#17221D]">
                            <span>Ida: <strong>{item.transporteIda}</strong></span>
                            <span>Volta: <strong>{item.transporteVolta}</strong></span>
                          </div>
                        </div>

                        {/* Jogos / Quadra */}
                        <div className="bg-white p-3 rounded-xl border border-[#E2EAE5] space-y-1">
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Validação em Quadra
                          </span>
                          <p className="text-xs pt-1 text-[#17221D]">
                            Atletas com Check-in: <strong>{item.elegibilidadeQuadra}</strong>
                          </p>
                        </div>

                      </div>

                    </div>
                  );
                })}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
