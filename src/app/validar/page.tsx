'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  QrCode,
  ShieldCheck,
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
  Utensils,
  User,
  Scissors
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
      <div className="text-center max-w-3xl mx-auto space-y-3">
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
      <div className="bg-white rounded-2xl p-6 sm:p-7 border border-[#E2EAE5] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4 max-w-2xl">
          <div className="hidden sm:flex w-12 h-12 rounded-xl bg-[#E8F7F1] border border-[#00A878]/20 text-[#087A5B] items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[#087A5B] text-xs font-bold tracking-wider uppercase">
              <ShieldCheck className="w-4 h-4 sm:hidden" />
              <span>Área Restrita da Arbitragem & SEMED</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#17221D] tracking-tight">
              Você é Árbitro, Mesário ou Fiscal da SEMED?
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed">
              A ferramenta de leitura em tempo real por QR Code, validação de check-in e registro logístico de lanche/água fica dentro do <strong className="text-[#17221D]">Painel da Coordenação SEMED</strong>.
            </p>
          </div>
        </div>

        <Link
          href="/admin/dashboard"
          className="w-full md:w-auto px-5 py-3.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2.5 transition-colors shrink-0"
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

        {/* CONTAINER DO MOCKUP VISUAL (MODELO OFICIAL REGISTRADO NO SISTEMA) */}
        <div className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl p-6 sm:p-10 flex items-center justify-center overflow-x-auto">
          <div className="flex flex-col md:flex-row items-center gap-6 min-w-[290px] max-w-full select-none">

            {/* LADO DA FRENTE — IDÊNTICO AO PDF OFICIAL (CARMIM #8B1D2C + OURO #D97706) */}
            {(ladoCracha === 'AMBOS' || ladoCracha === 'FRENTE') && (
              <div className="w-[280px] h-[392px] bg-white rounded-2xl border border-slate-300 shadow-md flex flex-col justify-between relative overflow-hidden">
                {/* Cabeçalho Carmim Simétrico */}
                <div className="h-[62px] bg-[#8B1D2C] text-white px-4 flex items-center justify-between border-b-[3px] border-[#D97706] shrink-0">
                  <div className="text-left">
                    <h4 className="text-[15px] font-black leading-tight tracking-tight">JEGDS 2026</h4>
                    <p className="text-[8.5px] font-bold tracking-wider text-amber-200 uppercase">GONÇALVES DIAS • MA • SEMED</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-white p-1 shrink-0 overflow-hidden shadow-xs">
                    <img src="/logo-jegd.png" alt="Logo JEGD" className="w-full h-full object-contain" />
                  </div>
                </div>

                {/* Corpo da Frente */}
                <div className="px-4 py-3 flex flex-col items-center flex-1 justify-center space-y-2 text-center">
                  {/* Foto 3x4 */}
                  <div className="w-[68px] h-[84px] rounded-lg border-2 border-[#00A878] bg-slate-50 overflow-hidden flex flex-col items-center justify-center shrink-0 shadow-2xs">
                    <User className="w-7 h-7 text-[#00A878]/60" />
                    <span className="text-[8px] font-bold text-slate-400 mt-0.5">FOTO 3x4</span>
                  </div>

                  {/* Nome e Escola */}
                  <div className="w-full">
                    <p className="text-[12px] font-black text-slate-900 leading-tight truncate uppercase">
                      GABRIEL SILVA SANTOS
                    </p>
                    <p className="text-[9.5px] font-bold text-slate-500 truncate uppercase mt-0.5">
                      U.E. ALDENORA DE ARAÚJO CRUZ
                    </p>
                  </div>

                  {/* Badge Categoria & Sexo */}
                  <div className="inline-block bg-[#065F46] text-white text-[9px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                    INFANTIL • MASC
                  </div>

                  {/* Modalidade / Provas */}
                  <div className="w-full leading-tight">
                    <span className="text-[7.5px] font-black text-[#065F46] uppercase block tracking-wider">MODALIDADE</span>
                    <p className="text-[10px] font-black text-slate-800 truncate uppercase">
                      FUTSAL / ATLETISMO
                    </p>
                    <p className="text-[8.5px] font-bold text-amber-600 truncate">
                      100m Rasos • Revezamento 4x100m
                    </p>
                  </div>

                  {/* Grid Inferior: Nascimento e Documento */}
                  <div className="w-full grid grid-cols-2 gap-2 text-left pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-[7px] font-bold text-slate-400 uppercase block">NASCIMENTO</span>
                      <span className="text-[9.5px] font-black text-slate-800">14/05/2013</span>
                    </div>
                    <div>
                      <span className="text-[7px] font-bold text-slate-400 uppercase block">DOCUMENTO</span>
                      <span className="text-[9.5px] font-black text-slate-800 truncate block">CPF: 000.000.000-00</span>
                    </div>
                  </div>
                </div>

                {/* Rodapé da Frente */}
                <div className="w-full px-3.5 py-2 border-t border-slate-200 flex items-center justify-between text-[8.5px] text-slate-700 font-bold bg-slate-50 shrink-0">
                  <span>ID: CR-ATL-0482</span>
                  <span className="text-[8px] uppercase tracking-wider text-slate-500">USO OBRIGATÓRIO</span>
                </div>
              </div>
            )}

            {/* DIVISOR DE DOBRA */}
            {ladoCracha === 'AMBOS' && (
              <div className="hidden md:flex flex-col items-center justify-center text-slate-400 text-[10px] font-mono gap-1.5">
                <div className="h-24 border-l-2 border-dashed border-slate-300" />
                <div className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 text-slate-600 rounded-full text-[9px] font-bold shadow-2xs">
                  <Scissors className="w-3 h-3 text-slate-400" />
                  <span>DOBRA</span>
                </div>
                <div className="h-24 border-l-2 border-dashed border-slate-300" />
              </div>
            )}

            {/* LADO DO VERSO — IDÊNTICO AO PDF OFICIAL */}
            {(ladoCracha === 'AMBOS' || ladoCracha === 'VERSO') && (
              <div className="w-[280px] h-[392px] bg-white rounded-2xl border border-slate-300 shadow-md flex flex-col justify-between relative overflow-hidden">
                {/* Cabeçalho Carmim Simétrico */}
                <div className="h-[62px] bg-[#8B1D2C] text-white px-4 flex flex-col items-center justify-center border-b-[3px] border-[#D97706] shrink-0 text-center">
                  <h4 className="text-[14px] font-black leading-tight tracking-tight">JEGDS 2026</h4>
                  <p className="text-[8px] font-bold tracking-wider text-amber-200 uppercase">JOGOS ESCOLARES DE GONÇALVES DIAS</p>
                </div>

                {/* Corpo do Verso: Controle Logístico & QR Code */}
                <div className="px-4 py-3 flex flex-col items-center flex-1 justify-center space-y-2.5 text-center">
                  <span className="text-[9.5px] font-black text-[#065F46] uppercase tracking-wider">
                    CONTROLE LOGÍSTICO & ACESSO
                  </span>

                  {/* Box 1: Água */}
                  <div className="w-full bg-slate-50 rounded-lg px-3 py-1.5 flex items-center gap-2 border border-slate-200">
                    <div className="w-3.5 h-3.5 border border-emerald-600 rounded-xs bg-white shrink-0" />
                    <span className="text-[10px] font-bold text-slate-700">Água durante os jogos</span>
                  </div>

                  {/* Box 2: Lanches */}
                  <div className="w-full bg-slate-50 rounded-lg px-3 py-1.5 flex items-center gap-2 border border-slate-200">
                    <div className="w-3.5 h-3.5 border border-emerald-600 rounded-xs bg-white shrink-0" />
                    <span className="text-[10px] font-bold text-slate-700">Lanches e refeições</span>
                  </div>

                  {/* QR Code */}
                  <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs w-[84px] h-[84px] flex items-center justify-center">
                    <QrCode className="w-full h-full text-slate-900" />
                  </div>

                  <p className="text-[7.5px] text-slate-500 leading-snug">
                    Crachá pessoal e intransferível.<br />
                    Apresentação obrigatória na entrada de quadra.
                  </p>
                </div>

                {/* Rodapé Institucional do Verso */}
                <div className="shrink-0">
                  <div className="bg-[#8B1D2C] text-white py-1 text-[8px] font-black uppercase tracking-wider text-center">
                    SEMED • PREFEITURA DE GONÇALVES DIAS
                  </div>
                  <div className="grid grid-cols-2 gap-1 items-center px-3 py-2 bg-white border-t border-slate-200">
                    <div className="text-left leading-tight">
                      <span className="text-[7.5px] font-black text-red-600 uppercase block">PREFEITURA</span>
                      <span className="text-[9px] font-black text-slate-900">GONÇALVES <span className="text-emerald-600">DIAS</span></span>
                      <span className="text-[6.5px] text-slate-400 block font-semibold">Cuidando da nossa gente</span>
                    </div>
                    <div className="text-right leading-tight pl-2 border-l border-slate-200">
                      <span className="text-[9px] font-black text-slate-900 block">SEMED</span>
                      <span className="text-[7px] text-slate-500 block font-medium">Secretaria de Educação</span>
                    </div>
                  </div>
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
