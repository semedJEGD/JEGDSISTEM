'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  QrCode,
  ShieldCheck,
  Sparkles,
  School,
  Trophy,
  Users,
  CheckCircle2,
  FileText,
  Lock,
  ArrowRight,
  Printer,
  Droplets,
  Utensils,
  Clock,
  Layers,
  Check,
  HelpCircle,
  Eye
} from 'lucide-react';

export default function CrachaGuiaPage() {
  const [ladoCracha, setLadoCracha] = useState<'FRENTE' | 'VERSO' | 'AMBOS'>('AMBOS');

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 w-full max-w-full">
      
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
          Conheça o modelo oficial dobrável, entenda como emitir pela sua escola e veja por que ele é obrigatório para entrada em quadra e refeições.
        </p>
      </div>

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
                      <span className="text-[8px] font-bold text-slate-400 uppercase block">Documento / RG</span>
                      <span className="font-black text-slate-800">058.***.***-01</span>
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
