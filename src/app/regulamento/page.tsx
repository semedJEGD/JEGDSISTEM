'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Download,
  Shield,
  Award,
  Users,
  Bell,
  Sparkles
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { ComunicadoAviso } from '@/types/jegd';

export default function RegulamentoPage() {
  const [comunicados, setComunicados] = useState<ComunicadoAviso[]>([]);

  useEffect(() => {
    JegdStorage.init();
    setComunicados(JegdStorage.getComunicados());
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-12 w-full max-w-full">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-3.5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8F7F1] border border-[#00A878]/25 text-[#087A5B] text-xs font-black tracking-wide">
          <Sparkles className="w-4 h-4 text-[#00A878]" />
          <span>DOCUMENTOS & NORMAS OFICIAIS</span>
        </div>
        <h1 className="text-2xl sm:text-5xl font-black text-[#17221D] tracking-tight break-words">
          Regulamento Geral • JEGD 2026
        </h1>
        <p className="text-xs sm:text-base text-[#374151] leading-relaxed font-normal">
          Secretaria Municipal de Educação (SEMED) • Coordenação de Desporto Escolar de Gonçalves Dias - MA
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Regulamento em Artigos */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          
          {/* Box de Faixas Etárias Oficiais */}
          <div className="bg-white border border-[#00A878]/30 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-lg sm:text-2xl font-black text-[#17221D] flex items-center gap-2">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-[#00A878] shrink-0" />
              <span>Categorias & Anos de Nascimento</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed font-medium">
              O sistema calcula automaticamente a elegibilidade de cada aluno com base na data de nascimento e no ano de referência (2026):
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 pt-2">
              <div className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl p-4 sm:p-5 space-y-1">
                <span className="text-[10px] sm:text-xs font-black text-[#087A5B] uppercase tracking-wider">
                  Categoria Mirim
                </span>
                <p className="text-2xl sm:text-3xl font-black text-[#17221D]">9 a 11 anos</p>
                <p className="text-xs sm:text-sm text-[#17221D] font-bold">
                  Nascidos entre: <span className="text-[#087A5B]">01/01/2015 e 31/12/2017</span>
                </p>
                <p className="text-[11px] sm:text-xs text-[#4B5563] mt-1">
                  Atletismo, Xadrez, Futsal, Queimada e Futebol.
                </p>
              </div>

              <div className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl p-4 sm:p-5 space-y-1">
                <span className="text-[10px] sm:text-xs font-black text-[#00A878] uppercase tracking-wider">
                  Categoria Infantil
                </span>
                <p className="text-2xl sm:text-3xl font-black text-[#17221D]">12 a 14 anos</p>
                <p className="text-xs sm:text-sm text-[#17221D] font-bold">
                  Nascidos entre: <span className="text-[#087A5B]">01/01/2012 e 31/12/2014</span>
                </p>
                <p className="text-[11px] sm:text-xs text-[#4B5563] mt-1">
                  Todas as 8 modalidades disponíveis.
                </p>
              </div>

              <div className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl p-4 sm:p-5 space-y-1">
                <span className="text-[10px] sm:text-xs font-black text-amber-800 uppercase tracking-wider">
                  Categoria Infanto
                </span>
                <p className="text-2xl sm:text-3xl font-black text-[#17221D]">15 a 17 anos</p>
                <p className="text-xs sm:text-sm text-[#17221D] font-bold">
                  Nascidos entre: <span className="text-[#087A5B]">01/01/2009 e 31/12/2011</span>
                </p>
                <p className="text-[11px] sm:text-xs text-[#4B5563] mt-1">
                  Todas as 8 modalidades disponíveis.
                </p>
              </div>

              <div className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl p-4 sm:p-5 space-y-1">
                <span className="text-[10px] sm:text-xs font-black text-teal-800 uppercase tracking-wider">
                  Categoria Junior
                </span>
                <p className="text-2xl sm:text-3xl font-black text-[#17221D]">18 a 20 anos</p>
                <p className="text-xs sm:text-sm text-[#17221D] font-bold">
                  Nascidos entre: <span className="text-[#087A5B]">01/01/2006 e 31/12/2008</span>
                </p>
                <p className="text-[11px] sm:text-xs text-[#4B5563] mt-1">
                  Todas as 8 modalidades disponíveis.
                </p>
              </div>
            </div>
          </div>

          {/* Artigos Principais */}
          <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 text-[#17221D] text-sm sm:text-base leading-relaxed">
            
            <section className="space-y-2">
              <h3 className="text-sm sm:text-base font-black text-[#087A5B] uppercase tracking-wider">
                Capítulo I - Das Finalidades
              </h3>
              <p className="text-[#374151]">
                <strong>Art. 1º</strong> — Os Jogos Escolares de Gonçalves Dias (JEGD 2026) têm por finalidade promover a ampla mobilização da juventude estudantil em torno do esporte, incentivando a prática da atividade física como instrumento pedagógico de desenvolvimento integral do estudante, disciplina, respeito e cidadania.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm sm:text-base font-black text-[#087A5B] uppercase tracking-wider">
                Capítulo II - Da Participação e Escolas
              </h3>
              <p className="text-[#374151]">
                <strong>Art. 2º</strong> — Poderão participar do JEGD 2026 todas as Unidades Escolares pertencentes às Redes Municipal, Estadual, Federal e Particular com sede no município e devidamente cadastradas no sistema oficial.
              </p>
              <p className="text-[#374151]">
                <strong>Art. 3º</strong> — Cada escola poderá inscrever até 1 (uma) equipe por modalidade, categoria e gênero.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm sm:text-base font-black text-[#087A5B] uppercase tracking-wider">
                Capítulo III - Da Documentação e Credenciamento Obrigatório
              </h3>
              <p className="text-[#374151]">
                <strong>Art. 4º</strong> — Para ter acesso às praças esportivas e aos jogos, o estudante-atleta deverá obrigatoriamente apresentar:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-[#374151]">
                <li><strong className="text-[#17221D]">Crachá Oficial do JEGD 2026</strong> com Foto e QR Code gerado pelo sistema.</li>
                <li>Documento oficial de identidade original com foto (RG) ou Certidão de Nascimento acompanhada de documento com foto.</li>
                <li>Comprovação de vínculo e frequência escolar ativa emitida pela direção da escola.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-sm sm:text-base font-black text-[#087A5B] uppercase tracking-wider">
                Capítulo IV - Da Comissão Técnica e Disciplina
              </h3>
              <p className="text-[#374151]">
                <strong>Art. 5º</strong> — Todos os técnicos e professores responsáveis deverão possuir registro no Conselho Regional de Educação Física (CREF) ou autorização especial chancelada pela SEMED.
              </p>
            </section>

          </div>

        </div>

        {/* Lateral: Mural de Avisos */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-lg font-black text-[#17221D] flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-600" />
              <span>Mural de Comunicados SEMED</span>
            </h3>

            <div className="space-y-3">
              {comunicados.map((aviso) => (
                <div
                  key={aviso.id}
                  className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                      {aviso.categoria}
                    </span>
                    <span className="text-xs text-[#4B5563]">{aviso.dataPublicacao}</span>
                  </div>
                  <h4 className="text-sm font-black text-[#17221D]">{aviso.titulo}</h4>
                  <p className="text-xs text-[#374151] leading-relaxed">{aviso.conteudo}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#E8F7F1] border border-[#00A878]/30 rounded-3xl p-6 shadow-xs space-y-3">
            <Shield className="w-8 h-8 text-[#00A878]" />
            <h4 className="text-lg font-black text-[#17221D]">Precisa de suporte?</h4>
            <p className="text-sm text-[#374151] leading-relaxed">
              Dúvidas sobre o regulamento ou envio de recursos? Entre em contato direto com a Coordenação Técnica de Arbitragem da SEMED.
            </p>
            <p className="text-sm font-black text-[#087A5B]">
              E-mail: jogosescolares@semed.gov.br
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

