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
  Sparkles,
  BookOpen,
  Scale,
  Clock,
  Flame,
  ChevronDown,
  ChevronUp,
  Search,
  ExternalLink,
  Info
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { ComunicadoAviso } from '@/types/jegd';

export default function RegulamentoPage() {
  const [comunicados, setComunicados] = useState<ComunicadoAviso[]>([]);
  const [apendiceAberto, setApendiceAberto] = useState<string | null>('futsal');

  useEffect(() => {
    JegdStorage.init();
    setComunicados(JegdStorage.getComunicados());
  }, []);

  const toggleApendice = (id: string) => {
    setApendiceAberto(prev => (prev === id ? null : id));
  };

  const apendicesTecnicos = [
    {
      id: 'atletismo',
      titulo: 'Apêndice I • Atletismo (Mirim, Infantil, Infanto e Júnior)',
      regras: [
        'Regras da IAAF e CBAt aplicadas com adaptações aos JEGDs.',
        'Cada escola pode inscrever até 02 (dois) atletas por prova individual.',
        'Cada estudante-atleta pode participar de no máximo 02 (duas) provas individuais.',
        'Categorias e Provas Permitidas:',
        '• Mirim: 75m e 100m rasos.',
        '• Infantil: 75m, 100m, 200m rasos e Salto em Distância.',
        '• Infanto: 100m, 200m, 400m rasos e Salto em Distância.',
        '• Júnior: 100m, 200m, 400m, 1.000m e Salto em Distância.',
        'Competição dividida em 2 dias conforme sorteio no Congresso Técnico.'
      ]
    },
    {
      id: 'futebol',
      titulo: 'Apêndice II • Futebol de Campo (Mirim, Infantil, Infanto e Júnior)',
      regras: [
        'Regras da FIFA / CBF aplicadas ao regulamento escolar.',
        'Elenco: Até 20 (vinte) atletas inscritos por equipe.',
        'Tempos de Jogo (sem intervalo entre tempos):',
        '• Mirim e Infantil: 2 tempos de 20 minutos (cronômetro corrido).',
        '• Infanto e Júnior: 2 tempos de 30 minutos (cronômetro corrido).',
        'Pontuação: Vitória = 3 pts | Empate = 1 pt | Derrota = 0 pt.',
        'Tolerância de WxO: 15 minutos (apenas no primeiro jogo da rodada). Placar de 1 x 0.',
        'Vedado o uso de piercings, brincos, anéis, pulseiras ou colares.',
        'Apresentação obrigatória com 30 minutos de antecedência e uniformização oficial.',
        'Comissão Técnica: 1 Técnico e 1 Preparador Físico devidamente credenciados.'
      ]
    },
    {
      id: 'futsal',
      titulo: 'Apêndice III • Futsal (Mirim, Infantil, Infanto e Júnior)',
      regras: [
        'Regras da FIFA / CBFS / Federação de Futsal do Maranhão (FEFUSMA).',
        'Elenco: 10 (dez) atletas por equipe.',
        'Tempos de Jogo (cronômetro parado com bola fora):',
        '• Mirim: 2 tempos de 10 minutos.',
        '• Infantil, Infanto e Júnior: 2 tempos de 15 minutos.',
        'Regra de Participação Obrigatória: Nas categorias Mirim e Infantil, todos os atletas relacionados devem obrigatoriamente jogar pelo menos 1/4 do tempo da partida.',
        'Pontuação: Vitória = 3 pts | Empate = 1 pt | Derrota = 0 pt.',
        'Suspensão automática de 1 jogo para cartão vermelho (expulsão).'
      ]
    },
    {
      id: 'queimada',
      titulo: 'Apêndice IV • Queimada (Mirim, Infantil, Infanto e Júnior)',
      regras: [
        'Elenco: 08 (oito) atletas em campo.',
        'Considerado Queimado: Jogador atingido pela bola no corpo que tocar o chão antes do domínio; jogador que sair dos limites da quadra.',
        'Rebatida Múltipla: Se a bola tocar em 2 ou mais atletas no mesmo lançamento e for ao chão, apenas o último atingido é queimado.',
        'NÃO é Queimado se: Segurar a bola dominada mesmo caindo ao chão; ou se a bola bater primeiro no solo antes do corpo.'
      ]
    },
    {
      id: 'xadrez',
      titulo: 'Apêndice V (a/b) • Xadrez Clássico & Xadrez Rápido',
      regras: [
        'Tabuleiro de 64 casas; objetivo de xeque-mate ao rei.',
        'Movimentos especiais: Roque, Promoção de Peão e En Passant.',
        'Xadrez Rápido: Limite de tempo de 10 (dez) minutos para a partida.',
        'Não há obrigatoriedade de anotação de lances no Xadrez Rápido.',
        'Supervisão: 1 árbitro para cada 3 mesas no ritmo rápido.'
      ]
    },
    {
      id: 'beach_soccer',
      titulo: 'Apêndice VI • Beach Soccer (Infantil, Infanto e Júnior)',
      regras: [
        'Regras da FIFA e Confederação Brasileira de Beach Soccer (CBSB).',
        'Elenco e Quadra: 5 jogadores (1 goleiro + 4 de linha); substituições ilimitadas.',
        'Duração: 3 períodos de 12 minutos (cronômetro para nas faltas/saídas). Intervalos de 3 min.',
        'Sem Empate: Prorrogação de 3 minutos e disputa de pênaltis se persistir.',
        'Pontuação: Vitória no tempo normal = 3 pts | Na prorrogação = 2 pts | Nos pênaltis = 1 pt.',
        'Faltas: Cobranças diretas SEM BARREIRA batidas obrigatoriamente por quem sofreu a falta.',
        'Goleiro: 4 segundos para recolocar a bola em jogo; não pode marcar gol direto com as mãos.',
        'Sem impedimento no futebol de areia.'
      ]
    },
    {
      id: 'voleibol',
      titulo: 'Apêndice VII • Voleibol (Infantil, Infanto e Júnior)',
      regras: [
        'Regras da FIVB e CBV com adaptações escolares municipais.',
        'Inscrição: Mínimo 10 e máximo 12 atletas + 1 técnico por equipe.',
        'Formato: Fase Classificatória em melhor de 3 sets (25 pts e tie-break de 15 pts). Semifinais e Finais em melhor de 5 sets.',
        'Alturas da Rede: Feminino 2,20m | Masculino 2,35m.',
        'Proibição de Líbero: Não é permitida a função de líbero na competição.',
        'Rodízio Obrigatório de Reservas: No 2º set da fase classificatória, os reservas entram obrigatoriamente como titulares para garantir rodagem pedagógica.',
        'Pontuação: Vitória 2x0 = 3 pts | Vitória 2x1 = 2 pts | Derrota 1x2 = 1 pt | Derrota 0x2 = 0 pt.',
        'Desempate: Sets Average e Pontos Average.'
      ]
    },
    {
      id: 'tenis_mesa',
      titulo: 'Apêndice VIII • Tênis de Mesa (Infantil, Infanto e Júnior)',
      regras: [
        'Regras oficiais da ITTF e CBTM (Confederação Brasileira de Tênis de Mesa).',
        'Cada escola pode inscrever até 04 atletas por categoria/naipe.',
        'Provas: Individual, Duplas Simples, Duplas Mistas e Equipes.',
        'Pontuação dos Sets: Sets de 11 pontos (Melhor de 3 sets na fase classificatória; Melhor de 5 sets a partir das oitavas de final).',
        'Uniforme: Cores branca e laranja são expressamente proibidas nas camisas.',
        'Raquetes: Mínimo 85% de madeira com borrachas seladas pela ITTF (uma face preta e outra vermelha/distinta).'
      ]
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 sm:space-y-12 w-full max-w-full">
      
      {/* Header Principal */}
      <div className="text-center max-w-3xl mx-auto space-y-3.5">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8F7F1] border border-[#00A878]/30 text-[#087A5B] text-xs font-black tracking-wide shadow-2xs">
          <Sparkles className="w-4 h-4 text-[#00A878]" />
          <span>REGULAMENTO GERAL OFICIAL • SETEMBRO 2026 (REVISADO)</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-[#17221D] tracking-tight break-words">
          Regulamento Geral dos JEGDs 2026
        </h1>
        <p className="text-xs sm:text-base text-[#374151] leading-relaxed font-normal">
          Secretaria Municipal de Educação (SEMED) • Secretaria de Esportes • Prefeitura Municipal de Gonçalves Dias - MA
        </p>
      </div>

      {/* Card de Destaque com Download Oficial do PDF de 35 Páginas */}
      <div className="bg-gradient-to-br from-[#17221D] via-[#0F172A] to-[#1E293B] rounded-3xl p-6 sm:p-8 text-white shadow-lg border border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-[#00A878] text-xs font-black tracking-wider uppercase">
            <BookOpen className="w-4 h-4" />
            <span>Documento Integral Publicado (35 Páginas)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Baixar Caderno Oficial do Regulamento Geral (PDF)
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Tenha em mãos o documento normativo completo contendo o Preâmbulo, os 17 Capítulos Regimentais, o Código Disciplinar Antirracismo e os 8 Apêndices Técnicos Oficiais.
          </p>
        </div>

        <a
          href="/regulamento-oficial-jegd-2026.pdf"
          download="REGULAMENTO_GERAL_JEGDS_2026_SEMED.pdf"
          className="px-6 py-4 rounded-2xl bg-[#00A878] hover:bg-[#087A5B] text-white font-black text-sm shadow-md shadow-[#00A878]/30 flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shrink-0"
        >
          <Download className="w-5 h-5" />
          <span>Baixar PDF Oficial (35 Páginas)</span>
        </a>
      </div>

      {/* Grid de Informações Chave */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E2EAE5] rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-[#00A878]">
            <Calendar className="w-5 h-5" />
            <h3 className="text-xs font-black uppercase tracking-wider text-[#087A5B]">Abertura Solene</h3>
          </div>
          <p className="text-2xl font-black text-[#17221D]">21 de Novembro</p>
          <p className="text-xs text-[#68756E]">
            Local: <strong>Unidade Escolar Aldenora de Araújo Cruz</strong>. Presença obrigatória com delegações uniformizadas.
          </p>
        </div>

        <div className="bg-white border border-[#E2EAE5] rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-amber-600">
            <Award className="w-5 h-5" />
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-800">Encerramento & Premiação</h3>
          </div>
          <p className="text-2xl font-black text-[#17221D]">19 de Dezembro</p>
          <p className="text-xs text-[#68756E]">
            Local: <strong>Unidade Escolar Aldenora de Araújo Cruz</strong>. Entrega oficial de troféus e medalhas.
          </p>
        </div>

        <div className="bg-white border border-[#E2EAE5] rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-blue-600">
            <Clock className="w-5 h-5" />
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-800">Horários & Tolerância</h3>
          </div>
          <p className="text-2xl font-black text-[#17221D]">30 min / 15 min</p>
          <p className="text-xs text-[#68756E]">
            Check-in 30 min antes do jogo (Vôlei 1h). Tolerância máxima de <strong>15 minutos para WxO</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* Coluna Esquerda: Artigos e Resumos */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          
          {/* Categorias e Faixas Etárias Oficiais */}
          <div className="bg-white border border-[#00A878]/30 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xs space-y-4">
            <h2 className="text-lg sm:text-2xl font-black text-[#17221D] flex items-center gap-2">
              <Award className="w-5 h-5 sm:w-6 sm:h-6 text-[#00A878] shrink-0" />
              <span>Categorias & Anos de Nascimento (Art. 17)</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#4B5563] leading-relaxed font-medium">
              O enquadramento é auditado automaticamente pelo sistema de acordo com a data de nascimento:
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
                  Modalidades: Atletismo, Xadrez, Futsal, Queimada e Futebol.
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
                  Todas as 8 modalidades autorizadas.
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
                  Todas as 8 modalidades autorizadas.
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
                  Todas as 8 modalidades autorizadas.
                </p>
              </div>
            </div>
          </div>

          {/* Destaque do Código Disciplinar e Lei Antirracismo */}
          <div className="bg-red-50/70 border border-red-200 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-red-700">
              <Scale className="w-6 h-6 shrink-0" />
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider">
                Capítulo XI • Código Disciplinar & Lei Antirracismo (Lei 14.532/2023)
              </h3>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-800 leading-relaxed">
              <div className="p-3.5 bg-white border border-red-100 rounded-xl space-y-1">
                <strong className="text-red-700 block">Art. 31 — Racismo e Discriminação Étnica, Religiosa ou de Gênero:</strong>
                <p>
                  • <strong>Atletas:</strong> Expulsão imediata da partida e <strong>suspensão automática de todo o restante do campeonato</strong>, com comunicação formal às autoridades policiais e à direção escolar.
                </p>
                <p>
                  • <strong>Técnicos / Comissão:</strong> Exclusão imediata dos Jogos e <strong>proibição de participar da edição seguinte</strong>.
                </p>
                <p>
                  • <strong>Torcidas:</strong> Caso haja ofensa coletiva, o jogo é paralisado, a torcida é evacuada e a equipe joga a partida seguinte com <strong>portões fechados (sem torcida)</strong>.
                </p>
              </div>

              <div className="p-3.5 bg-white border border-red-100 rounded-xl space-y-1">
                <strong className="text-slate-900 block">Art. 32 — Bullying e Invasões de Campo/Quadra:</strong>
                <p>Suspensão de 01 a 03 partidas. Em caso de agressão física comprovada, eliminação imediata dos Jogos.</p>
              </div>

              <div className="p-3.5 bg-white border border-red-100 rounded-xl space-y-1">
                <strong className="text-slate-900 block">Art. 33 e 34 — Ofensas Verbais, Palavrões e Gestos Obscenos:</strong>
                <p>Cartão Amarelo na 1ª infração; Cartão Vermelho na reincidência com suspensão automática. Gestos obscenos acarretam 2 partidas de suspensão ou eliminação se direcionados à arbitragem.</p>
              </div>
            </div>
          </div>

          {/* Resumo dos 17 Capítulos Normativos */}
          <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <h3 className="text-lg sm:text-xl font-black text-[#17221D] flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#00A878]" />
              <span>Resumo dos 17 Capítulos Regimentais</span>
            </h3>

            <div className="space-y-4 text-xs sm:text-sm text-[#374151]">
              <div className="border-b border-[#E2EAE5] pb-3">
                <h4 className="font-black text-[#087A5B]">Capítulo I a IV • Finalidade, Organização e Competências</h4>
                <p className="mt-1">
                  Evento oficial educacional promovido pela SEMED e Prefeitura de Gonçalves Dias. Compete às escolas garantir a fidedignidade dos dados, conduta exemplar e pontualidade.
                </p>
              </div>

              <div className="border-b border-[#E2EAE5] pb-3">
                <h4 className="font-black text-[#087A5B]">Capítulo V • Participação & Limite de Inscrições (Art. 13)</h4>
                <p className="mt-1">
                  Cada estudante-atleta poderá participar de <strong>no máximo 03 (três) modalidades</strong>, sendo até <strong>02 modalidades individuais e 01 coletiva</strong>.
                </p>
              </div>

              <div className="border-b border-[#E2EAE5] pb-3">
                <h4 className="font-black text-[#087A5B]">Capítulo VI • Documentação & Identificação (Art. 14 a 16)</h4>
                <p className="mt-1">
                  Exigência de RG ou Certidão de Nascimento. O estudante que esquecer o documento no momento do jogo <strong>não será impedido de jogar</strong>, desde que a escola apresente o documento oficial em <strong>até 24 horas</strong> após o encerramento da partida.
                </p>
              </div>

              <div className="border-b border-[#E2EAE5] pb-3">
                <h4 className="font-black text-[#087A5B]">Capítulo IX e X • Realização dos Jogos, WxO e Arbitragem (Art. 23 a 29)</h4>
                <p className="mt-1">
                  Tolerância de 15 minutos de WxO. Decisões do árbitro em campo são soberanas para fatos do jogo, cabendo recursos formais à Comissão Organizadora para irregularidades administrativas.
                </p>
              </div>

              <div className="border-b border-[#E2EAE5] pb-3">
                <h4 className="font-black text-[#087A5B]">Capítulo XII • Recursos e Protestos (Art. 35 a 38)</h4>
                <p className="mt-1">
                  Os protestos devem ser protocolados por responsável credenciado da escola, devidamente fundamentados, no prazo estabelecido pela coordenação.
                </p>
              </div>

              <div>
                <h4 className="font-black text-[#087A5B]">Capítulo XIII a XVII • Saúde, Patrimônio e Disposições Finais</h4>
                <p className="mt-1">
                  Atendimento médico em parceria com a Secretaria Municipal de Saúde. Responsabilização escolar por eventuais danos ao patrimônio público.
                </p>
              </div>
            </div>
          </div>

          {/* Acordeão de Apêndices Técnicos (I a VIII) */}
          <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[#17221D] flex items-center gap-2">
                  <Scale className="w-5 h-5 text-[#00A878]" />
                  <span>Regulamentos Técnicos Específicos (Apêndices I a VIII)</span>
                </h3>
                <p className="text-xs text-[#68756E] mt-0.5">
                  Clique em cada modalidade para conferir o regulamento técnico detalhado de jogo.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {apendicesTecnicos.map((ap) => {
                const isOpen = apendiceAberto === ap.id;
                return (
                  <div
                    key={ap.id}
                    className="border border-[#E2EAE5] rounded-2xl overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => toggleApendice(ap.id)}
                      className="w-full p-4 text-left font-black text-xs sm:text-sm text-[#17221D] hover:bg-[#F7F9F8] flex items-center justify-between gap-3 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#00A878]" />
                        {ap.titulo}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-[#00A878] shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="p-4 sm:p-5 bg-[#F7F9F8] border-t border-[#E2EAE5] space-y-2 text-xs sm:text-sm text-[#374151] leading-relaxed">
                        {ap.regras.map((r, rIdx) => (
                          <p key={rIdx} className={r.startsWith('•') ? 'pl-4 text-[#087A5B] font-semibold' : ''}>
                            {r}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Coluna Direita: Comitê, Suporte e Mural */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quadro de Autoridades e Comitê Organizador */}
          <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-black text-[#17221D] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#00A878]" />
              <span>Comitê Organizador Oficial</span>
            </h3>

            <div className="space-y-3 text-xs text-[#374151]">
              <div className="bg-[#F7F9F8] p-3 rounded-xl border border-[#E2EAE5]">
                <strong className="text-[#17221D] block text-xs">Prefeitura de Gonçalves Dias</strong>
                <p>Suane Maria Barros Dias (Prefeita)</p>
                <p>Josilda Oliveira Andrade (Vice-prefeita)</p>
              </div>

              <div className="bg-[#F7F9F8] p-3 rounded-xl border border-[#E2EAE5]">
                <strong className="text-[#17221D] block text-xs">Secretaria Municipal de Educação (SEMED)</strong>
                <p>Marcelo Henrique Cardoso Gonçalves (Secretário)</p>
                <p>Aline Gonçalves Silva (Secretária Adjunta)</p>
              </div>

              <div className="bg-[#F7F9F8] p-3 rounded-xl border border-[#E2EAE5]">
                <strong className="text-[#17221D] block text-xs">Coordenação dos Jogos</strong>
                <p><strong>Coord. Geral:</strong> Laecio Amaury da Silva Lucena</p>
                <p><strong>Coord. Ed. Física:</strong> Elias Veloso de Araújo & Luis Herbert de Sá Sousa</p>
              </div>
            </div>
          </div>

          {/* Mural de Comunicados SEMED */}
          <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-black text-[#17221D] flex items-center gap-2">
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
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                      {aviso.categoria}
                    </span>
                    <span className="text-[10px] text-[#4B5563]">{aviso.dataPublicacao}</span>
                  </div>
                  <h4 className="text-xs font-black text-[#17221D]">{aviso.titulo}</h4>
                  <p className="text-[11px] text-[#374151] leading-relaxed">{aviso.conteudo}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Card de Suporte SEMED */}
          <div className="bg-[#E8F7F1] border border-[#00A878]/30 rounded-3xl p-6 shadow-xs space-y-3">
            <Shield className="w-7 h-7 text-[#00A878]" />
            <h4 className="text-base font-black text-[#17221D]">Coordenação Técnica & Recursos</h4>
            <p className="text-xs text-[#374151] leading-relaxed">
              Dúvidas sobre o regulamento ou envio de recursos para julgamento da comissão organizadora?
            </p>
            <p className="text-xs font-black text-[#087A5B]">
              E-mail: jogosescolares@semed.gov.br
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

