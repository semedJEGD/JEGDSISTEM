'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  QrCode,
  ShieldCheck,
  Sparkles,
  School,
  Trophy,
  Users,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowRight,
  Printer,
  Search,
  X,
  Calendar,
  Award,
  Clock,
  Check,
  Utensils
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { Atleta, Escola, InscricaoEquipe } from '@/types/jegd';
import { CrachaDobravelService } from '@/lib/pdf/cracha-dobravel';

function ValidadorPublicoForm() {
  const searchParams = useSearchParams();
  const [termoBusca, setTermoBusca] = useState('');
  const [atletaEncontrado, setAtletaEncontrado] = useState<Atleta | null>(null);
  const [escolaAtleta, setEscolaAtleta] = useState<Escola | null>(null);
  const [inscricoes, setInscricoes] = useState<InscricaoEquipe[]>([]);
  const [consultou, setConsultou] = useState(false);
  const [dataConsulta, setDataConsulta] = useState<string>('');

  const realizarBusca = (codigo: string) => {
    if (!codigo.trim()) return;
    setConsultou(true);
    setDataConsulta(new Date().toLocaleString('pt-BR'));

    const atleta = JegdStorage.getAtletaByCrachaToken(codigo.trim());
    if (atleta) {
      setAtletaEncontrado(atleta);
      const escola = JegdStorage.getEscolaById(atleta.escolaId) || null;
      setEscolaAtleta(escola);
      const inscs = JegdStorage.getInscricoes().filter(i => i.atletaIds && i.atletaIds.includes(atleta.id));
      setInscricoes(inscs);
    } else {
      setAtletaEncontrado(null);
      setEscolaAtleta(null);
      setInscricoes([]);
    }
  };

  useEffect(() => {
    const tokenParam = searchParams.get('token') || searchParams.get('codigo') || searchParams.get('id');
    if (tokenParam) {
      setTermoBusca(tokenParam);
      realizarBusca(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    realizarBusca(termoBusca);
  };

  const limparBusca = () => {
    setTermoBusca('');
    setAtletaEncontrado(null);
    setEscolaAtleta(null);
    setInscricoes([]);
    setConsultou(false);
  };

  const handleImprimir = async () => {
    if (!atletaEncontrado) return;
    const escolaPadrao: Escola = escolaAtleta || {
      id: 'geral',
      nome: 'Escola Municipal',
      sigla: 'SEMED',
      inep: '',
      rede: 'MUNICIPAL',
      bairro: '',
      endereco: '',
      responsavelNome: '',
      responsavelTelefone: '',
      loginEmail: '',
      createdAt: ''
    };
    await CrachaDobravelService.gerarCrachaIndividual(atletaEncontrado, escolaPadrao);
  };

  return (
    <div className="bg-white border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-black tracking-wide uppercase">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Validação Pública em Tempo Real</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
            Consultar Autenticidade do Crachá
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Escaneie o QR Code com a câmera do celular ou digite o Token/Matrícula do estudante-atleta.
          </p>
        </div>

        {consultou && (
          <button
            onClick={limparBusca}
            className="self-start sm:self-auto text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Nova Consulta</span>
          </button>
        )}
      </div>

      {/* Formulário de Busca */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            placeholder="Digite o Token (ex: CR-...), Matrícula ou Nome do Atleta..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0 flex items-center justify-center gap-2"
        >
          <QrCode className="w-4 h-4" />
          <span>Verificar Credencial</span>
        </button>
      </form>

      {/* RESULTADO DA CONSULTA */}
      {consultou && (
        <div className="pt-2 animate-in fade-in duration-300">
          {atletaEncontrado ? (
            <div className="bg-gradient-to-br from-emerald-50/50 via-white to-slate-50 border-2 border-emerald-500 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
              
              {/* Cabeçalho do Certificado de Validade */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm font-black text-emerald-900 tracking-wide uppercase">
                        CREDENCIAL OFICIAL AUTÊNTICA
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">
                        HOMOLOGADO SEMED
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Consulta realizada em {dataConsulta}</span>
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleImprimir}
                  className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Baixar Crachá (PDF)</span>
                </button>
              </div>

              {/* Informações Centrais do Atleta */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                {/* Foto ou Avatar */}
                <div className="w-28 h-36 rounded-2xl bg-white border-2 border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                  {atletaEncontrado.documentos?.foto3x4 ? (
                    <img
                      src={atletaEncontrado.documentos.foto3x4}
                      alt={atletaEncontrado.nomeCompleto}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <Users className="w-10 h-10 text-slate-300 mx-auto mb-1" />
                      <span className="text-[9px] text-slate-400 font-black uppercase">Foto Oficial 3x4</span>
                    </div>
                  )}
                </div>

                {/* Dados Cadastrais */}
                <div className="space-y-3 flex-1 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="text-xs font-black text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                      ID: {atletaEncontrado.id.toUpperCase().slice(0, 10)}
                    </span>
                    <span className="text-xs font-black text-emerald-800 bg-emerald-100/60 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      TOKEN: {atletaEncontrado.crachaToken || 'GERADO NA IMPRESSÃO'}
                    </span>
                    <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                      {atletaEncontrado.categoriaCalculada || 'LIVRE'} • {atletaEncontrado.sexo}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                    {atletaEncontrado.nomeCompleto}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 pt-1">
                    <div className="bg-white/80 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Escola Representada</span>
                      <p className="font-black text-slate-800 text-sm mt-0.5 truncate">
                        {escolaAtleta ? `${escolaAtleta.nome} (${escolaAtleta.sigla})` : 'Delegação Escolar SEMED'}
                      </p>
                    </div>

                    <div className="bg-white/80 p-3 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Documento Oficial</span>
                      {atletaEncontrado.semDocumento || atletaEncontrado.documentoTipo === 'SEM_DOCUMENTO' || atletaEncontrado.documentoNumero === 'SEM DOCUMENTO' ? (
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 mt-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-black">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>EM REGULARIZAÇÃO COM A SEMED</span>
                        </div>
                      ) : (
                        <p className="font-black text-slate-800 text-sm mt-0.5">
                          {atletaEncontrado.documentoTipo}: {atletaEncontrado.documentoNumero}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Modalidades Inscritas */}
                  <div className="bg-white/80 p-3 rounded-xl border border-slate-100 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Modalidades Autorizadas para Competição</span>
                    <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                      {atletaEncontrado.modalidadesInscritas && atletaEncontrado.modalidadesInscritas.length > 0 ? (
                        atletaEncontrado.modalidadesInscritas.map((m, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black"
                          >
                            ⚽ {m.modalidadeNome} {m.provas && m.provas.length > 0 ? `(${m.provas.join(', ')})` : ''}
                          </span>
                        ))
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                          Delegação Escolar Geral
                        </span>
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Rodapé Institucional do Certificado */}
              <div className="border-t border-emerald-100 pt-3 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span>Comitê Organizador dos Jogos Escolares de Gonçalves Dias • JEGDS 2026</span>
                <span className="font-bold text-emerald-800">Secretaria Municipal de Educação (SEMED)</span>
              </div>

            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <h4 className="text-sm font-black text-rose-900">
                Nenhum Atleta Encontrado com o Código Informado
              </h4>
              <p className="text-xs text-rose-700 max-w-md mx-auto">
                Verifique se o token foi digitado corretamente ou certifique-se de que o crachá pertence à edição oficial dos Jogos Escolares JEGDS 2026.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CrachaGuiaPage() {
  const [ladoCracha, setLadoCracha] = useState<'FRENTE' | 'VERSO' | 'AMBOS'>('AMBOS');

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 w-full">
      
      {/* Header Principal */}
      <div className="text-center max-w-3xl mx-auto space-y-3.5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8F7F1] border border-[#00A878]/30 text-[#087A5B] text-xs font-black tracking-wide shadow-2xs">
          <Sparkles className="w-4 h-4 text-[#00A878]" />
          <span>SISTEMA OFICIAL DE IDENTIFICAÇÃO & CREDENCIAMENTO</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-[#17221D] tracking-tight break-words">
          Crachá Oficial do Atleta • JEGD 2026
        </h1>
        <p className="text-xs sm:text-base text-[#374151] leading-relaxed font-normal">
          Consulte a autenticidade de qualquer credencial pela câmera ou conheça o modelo oficial dobrável emitido pela SEMED.
        </p>
      </div>

      {/* VALIDADOR PÚBLICO EM TEMPO REAL */}
      <Suspense fallback={<div className="p-8 text-center text-sm font-bold text-slate-400 bg-white rounded-3xl border border-slate-200">Carregando sistema validador...</div>}>
        <ValidadorPublicoForm />
      </Suspense>

      {/* BANNER CTA PARA ÁRBITROS & COORDENAÇÃO DA SEMED */}
      <div className="bg-gradient-to-r from-[#17221D] via-[#0F172A] to-[#1E293B] rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-[#00A878] text-xs font-black tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>Área Restrita da Arbitragem & SEMED</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Você é Árbitro, Mesário ou Fiscal da SEMED?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            A ferramenta de leitura em tempo real por QR Code, validação de check-in e registro logístico de lanche/água fica dentro do <strong>Painel da Coordenação SEMED</strong>.
          </p>
        </div>

        <Link
          href="/admin/dashboard"
          className="px-6 py-4 rounded-2xl bg-[#00A878] hover:bg-[#087A5B] text-white font-black text-sm shadow-md shadow-[#00A878]/30 flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shrink-0"
        >
          <Lock className="w-4 h-4" />
          <span>Acessar Validador na SEMED</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* APRESENTAÇÃO VISUAL DO MODELO DE CRACHÁ (MOCKUP INTERATIVO) */}
      <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2EAE5] pb-6">
          <div>
            <h3 className="text-lg sm:text-2xl font-black text-[#17221D] flex items-center gap-2.5">
              <QrCode className="w-6 h-6 text-[#00A878]" />
              <span>Modelo Oficial Dobrável (Formato 96 × 76 mm)</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#68756E] mt-1">
              Desenvolvido com tecnologia anti-fraude, frente e verso lado a lado para dobra central perfeita em porta-crachá padrão.
            </p>
          </div>

          {/* Seletor de Visão do Crachá */}
          <div className="flex items-center p-1 bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl shrink-0 self-start sm:self-auto">
            <button
              onClick={() => setLadoCracha('AMBOS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                ladoCracha === 'AMBOS' ? 'bg-[#00A878] text-white shadow-xs' : 'text-[#68756E] hover:text-[#17221D]'
              }`}
            >
              Frente & Verso
            </button>
            <button
              onClick={() => setLadoCracha('FRENTE')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                ladoCracha === 'FRENTE' ? 'bg-[#00A878] text-white shadow-xs' : 'text-[#68756E] hover:text-[#17221D]'
              }`}
            >
              Frente
            </button>
            <button
              onClick={() => setLadoCracha('VERSO')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                ladoCracha === 'VERSO' ? 'bg-[#00A878] text-white shadow-xs' : 'text-[#68756E] hover:text-[#17221D]'
              }`}
            >
              Verso
            </button>
          </div>
        </div>

        {/* CONTAINER DO MOCKUP VISUAL */}
        <div className="bg-[#0F172A]/5 border border-dashed border-[#00A878]/30 rounded-3xl p-6 sm:p-10 flex items-center justify-center overflow-x-auto">
          <div className="flex flex-col md:flex-row items-center gap-6 min-w-[320px] max-w-full">
            
            {/* LADO DA FRENTE */}
            {(ladoCracha === 'AMBOS' || ladoCracha === 'FRENTE') && (
              <div className="w-[300px] h-[390px] bg-white rounded-2xl border-2 border-slate-900 shadow-md p-4 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-xl">
                {/* Cabeçalho do Crachá */}
                <div className="bg-slate-900 text-white -mx-4 -mt-4 p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src="/logo-jegd.png" alt="Logo" className="w-7 h-7 object-contain bg-white rounded-full p-0.5" />
                    <div>
                      <h4 className="text-[11px] font-black tracking-tight leading-tight">JEGD 2026</h4>
                      <p className="text-[8px] text-emerald-300 font-bold uppercase">Jogos Escolares</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                    ATLETA
                  </span>
                </div>

                {/* Corpo do Crachá com Foto e Dados */}
                <div className="space-y-3 pt-2">
                  <div className="flex gap-3 items-center">
                    {/* Foto Modelo */}
                    <div className="w-16 h-20 bg-slate-100 border border-slate-300 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs shrink-0 shadow-inner">
                      FOTO 3x4
                    </div>
                    {/* Identificação */}
                    <div className="space-y-1 min-w-0">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Nome do Atleta</span>
                      <p className="text-xs font-black text-slate-900 truncate">GABRIEL SILVA SANTOS</p>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block pt-0.5">Escola</span>
                      <p className="text-[11px] font-bold text-emerald-700 truncate">U.E. ALDENORA DE ARAÚJO</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 text-[10px]">
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase block">Categoria</span>
                      <span className="font-black text-slate-800">INFANTIL (MASC)</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-bold text-slate-400 uppercase block">Documento Oficial</span>
                      <span className="font-black text-slate-800">EM REGULARIZAÇÃO</span>
                    </div>
                  </div>
                </div>

                {/* Rodapé da Frente */}
                <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[9px] text-slate-500">
                  <span>Gonçalves Dias - MA</span>
                  <span className="font-bold text-emerald-700">SEMED 2026</span>
                </div>
              </div>
            )}

            {/* DIVISOR DE DOBRA */}
            {ladoCracha === 'AMBOS' && (
              <div className="hidden md:flex flex-col items-center justify-center text-slate-400 text-[10px] font-mono gap-1">
                <div className="h-16 border-l-2 border-dashed border-slate-300" />
                <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] font-bold">LINHA DE DOBRA</span>
                <div className="h-16 border-l-2 border-dashed border-slate-300" />
              </div>
            )}

            {/* LADO DO VERSO */}
            {(ladoCracha === 'AMBOS' || ladoCracha === 'VERSO') && (
              <div className="w-[300px] h-[390px] bg-white rounded-2xl border-2 border-slate-900 shadow-md p-4 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-xl">
                {/* Cabeçalho do Verso */}
                <div className="bg-slate-800 text-white -mx-4 -mt-4 p-2.5 text-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                    CONTROLE OFICIAL & QR CODE
                  </span>
                </div>

                {/* QR Code Central e Modalidades */}
                <div className="space-y-2.5 text-center pt-2">
                  <div className="w-24 h-24 bg-white border-2 border-slate-900 rounded-xl mx-auto p-1.5 flex items-center justify-center shadow-xs">
                    <QrCode className="w-full h-full text-slate-900" />
                  </div>
                  <span className="font-mono text-[9px] font-black text-slate-600 block">
                    CR-ATL-ALDENORA-0482
                  </span>

                  <div className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-xl p-2 text-left space-y-1">
                    <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider block">
                      Modalidades Inscritas:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">FUTSAL</span>
                      <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">ATLETISMO (100m)</span>
                    </div>
                  </div>
                </div>

                {/* Termo e LGPD */}
                <div className="text-[7.5px] text-slate-400 leading-tight text-justify border-t border-slate-100 pt-1.5">
                  Uso pessoal e intransferível. Obrigatória apresentação para entrada em quadra, almoço e hidratação conforme Lei 14.532/2023.
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* GUIA PASSO A PASSO: COMO CONSEGUIR O CRACHÁ */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h3 className="text-xl sm:text-3xl font-black text-[#17221D]">
            Como Funciona o Credenciamento do Atleta?
          </h3>
          <p className="text-xs sm:text-sm text-[#68756E]">
            Todo o processo é digital, seguro e emitido diretamente pela direção de cada escola.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F7F1] text-[#00A878] font-black flex items-center justify-center text-sm shadow-2xs">
              1
            </div>
            <h4 className="text-sm font-black text-[#17221D]">Cadastro na Escola</h4>
            <p className="text-xs text-[#68756E] leading-relaxed">
              O professor ou diretor cadastra o aluno com foto, RG/Certidão e termo de consentimento assinado pelos pais.
            </p>
          </div>

          <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F7F1] text-[#00A878] font-black flex items-center justify-center text-sm shadow-2xs">
              2
            </div>
            <h4 className="text-sm font-black text-[#17221D]">Homologação SEMED</h4>
            <p className="text-xs text-[#68756E] leading-relaxed">
              A Comissão Organizadora valida os documentos e a elegibilidade da categoria etária pelo sistema oficial.
            </p>
          </div>

          <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F7F1] text-[#00A878] font-black flex items-center justify-center text-sm shadow-2xs">
              3
            </div>
            <h4 className="text-sm font-black text-[#17221D]">Impressão dos Crachás</h4>
            <p className="text-xs text-[#68756E] leading-relaxed">
              A escola gera e imprime o lote de crachás em PDF dobrável de alta resolução com QR Code exclusivo.
            </p>
          </div>

          <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8F7F1] text-[#00A878] font-black flex items-center justify-center text-sm shadow-2xs">
              4
            </div>
            <h4 className="text-sm font-black text-[#17221D]">Acesso aos Jogos</h4>
            <p className="text-xs text-[#68756E] leading-relaxed">
              O aluno apresenta o crachá na quadra e refeitório para validação instantânea sem filas em até 5 segundos.
            </p>
          </div>
        </div>
      </div>

      {/* POR QUE O CRACHÁ É OBRIGATÓRIO? (BENEFÍCIOS E SEGURANÇA) */}
      <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <h3 className="text-lg sm:text-2xl font-black text-[#17221D] flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-[#00A878]" />
          <span>Por Que o Crachá é Obrigatório em Todos os Jogos?</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] space-y-1.5">
            <div className="flex items-center gap-2 text-[#087A5B] font-black text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#00A878]" />
              <span>Entrada Rápida em Quadra</span>
            </div>
            <p className="text-xs text-[#68756E] leading-relaxed">
              Check-in de 5 segundos pelo leitor de QR Code para iniciar as partidas pontualmente sem atrasos.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] space-y-1.5">
            <div className="flex items-center gap-2 text-[#087A5B] font-black text-xs">
              <Utensils className="w-4 h-4 text-[#00A878]" />
              <span>Controle Nutricional & Lanches</span>
            </div>
            <p className="text-xs text-[#68756E] leading-relaxed">
              Garante a entrega justa de alimentação e hidratação para todos os estudantes da delegação.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] space-y-1.5">
            <div className="flex items-center gap-2 text-[#087A5B] font-black text-xs">
              <ShieldCheck className="w-4 h-4 text-[#00A878]" />
              <span>Prevenção de Fraudes de Idade</span>
            </div>
            <p className="text-xs text-[#68756E] leading-relaxed">
              Blindagem completa da integridade das categorias (Mirim, Infantil, Infanto e Júnior).
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
