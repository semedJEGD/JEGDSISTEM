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
  Bell
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          Documentos & Normas Oficiais
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Regulamento Geral • JEGD 2026
        </h1>
        <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
          Secretaria Municipal de Educação (SEMED) • Coordenação de Desporto Escolar
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Regulamento em Artigos */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Box de Faixas Etárias Oficiais */}
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <span>Categorias & Anos de Nascimento Permitidos</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              O sistema calcula automaticamente a elegibilidade de cada aluno com base no ano de nascimento:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Categoria Infantil
                </span>
                <p className="text-2xl font-black text-white mt-1">12 a 14 anos</p>
                <p className="text-xs text-slate-300 mt-2 font-medium">
                  Nascidos nos anos: <strong>2012, 2013 e 2014</strong>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Estudantes matriculados do 6º ao 9º ano do Ensino Fundamental.
                </p>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Categoria Infanto
                </span>
                <p className="text-2xl font-black text-white mt-1">15 a 17 anos</p>
                <p className="text-xs text-slate-300 mt-2 font-medium">
                  Nascidos nos anos: <strong>2009, 2010 e 2011</strong>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Estudantes do Ensino Médio ou anos finais do Fundamental.
                </p>
              </div>
            </div>
          </div>

          {/* Artigos Principais */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
            
            <section className="space-y-2">
              <h3 className="text-base font-bold text-white uppercase tracking-wider text-emerald-400">
                Capítulo I - Das Finalidades
              </h3>
              <p>
                <strong>Art. 1º</strong> — Os Jogos Escolares (JEGD 2026) têm por finalidade promover a ampla mobilização da juventude estudantil em torno do esporte, incentivando a prática da atividade física como instrumento pedagógico de desenvolvimento integral do estudante, disciplina, respeito e cidadania.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-white uppercase tracking-wider text-emerald-400">
                Capítulo II - Da Participação e Escolas
              </h3>
              <p>
                <strong>Art. 2º</strong> — Poderão participar do JEGD 2026 todas as Unidades Escolares pertencentes às Redes Municipal, Estadual, Federal e Particular com sede no município e devidamente cadastradas no sistema oficial.
              </p>
              <p>
                <strong>Art. 3º</strong> — Cada escola poderá inscrever até 1 (uma) equipe por modalidade, categoria e gênero.
              </p>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-white uppercase tracking-wider text-emerald-400">
                Capítulo III - Da Documentação e Credenciamento Obrigatório
              </h3>
              <p>
                <strong>Art. 4º</strong> — Para ter acesso às praças esportivas e aos jogos, o estudante-atleta deverá obrigatoriamente apresentar:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-400">
                <li><strong>Crachá Oficial do JEGD 2026</strong> com Foto e QR Code gerado pelo sistema.</li>
                <li>Documento oficial de identidade original com foto (RG) ou Certidão de Nascimento acompanhada de documento com foto.</li>
                <li>Comprovação de vínculo e frequência escolar ativa emitida pela direção.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h3 className="text-base font-bold text-white uppercase tracking-wider text-emerald-400">
                Capítulo IV - Da Comissão Técnica e Disciplina
              </h3>
              <p>
                <strong>Art. 5º</strong> — Todos os técnicos e professores responsáveis deverão possuir registro no Conselho Regional de Educação Física (CREF) ou autorização especial chancelada pela SEMED.
              </p>
            </section>

          </div>

        </div>

        {/* Lateral: Mural de Avisos e Download do PDF */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" />
              <span>Mural de Comunicados SEMED</span>
            </h3>

            <div className="space-y-3">
              {comunicados.map((aviso) => (
                <div
                  key={aviso.id}
                  className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {aviso.categoria}
                    </span>
                    <span className="text-[10px] text-slate-400">{aviso.dataPublicacao}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{aviso.titulo}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{aviso.conteudo}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-950 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-3">
            <Shield className="w-8 h-8 text-emerald-400" />
            <h4 className="text-base font-bold text-white">Precisa de suporte?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dúvidas sobre o regulamento ou envio de recursos? Entre em contato direto com a Coordenação Técnica de Arbitragem da SEMED.
            </p>
            <p className="text-xs font-semibold text-emerald-400">
              E-mail: jogosescolares@semed.gov.br
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
