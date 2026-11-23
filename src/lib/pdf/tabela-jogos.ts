import { ChaveamentoEventoItem, PartidaEventoItem } from '@/types/eventos';
import {
  EstruturaXadrez,
  GrupoChaveamento,
  ProvaAtletismoBalizamento,
  calcularClassificacaoXadrez,
} from '@/lib/chaveamento-service';
import { FASES_LABEL, formatarDataBR } from '@/lib/eventos-service';
import { criarDocumentoA4, abrirPdfNovaGuia } from './pdf-types';

const FORMATO_LABEL: Record<string, string> = {
  GRUPOS_MATA_MATA: 'Grupos (Berger) + Mata-Mata Oficial (CBDE/JEBs)',
  MATA_MATA: 'Eliminatória Simples / Mata-Mata Direto (CBDE)',
  BERGER_UNICO: 'Grupo Único — Tabela de Berger (Todos contra Todos)',
  FINAL_DIRETA: 'Final Direta (2 participantes)',
  BALIZAMENTO_ATLETISMO: 'Balizamento Oficial em Séries e Raias (CBAt)',
  SUICO_XADREZ: 'Torneio de Xadrez — Sistema Suíço / Berger (FIDE/CBX)',
  GRUPOS_TENIS_MESA: 'Tênis de Mesa — Grupos + Mata-Mata (CBTM/ITTF)',
};

export function gerarPdfChaveamentoOficial(
  chaveamento: ChaveamentoEventoItem,
  partidas: PartidaEventoItem[]
): void {
  const doc = criarDocumentoA4();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = 14;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 16) {
      doc.addPage();
      y = 16;
    }
  };

  // Cabeçalho Oficial
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, pageWidth - margin * 2, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('JEGDS 2026 — TABELA OFICIAL DE JOGOS & CHAVEAMENTO', margin + 5, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `${chaveamento.modalidadeNome.toUpperCase()} • ${chaveamento.categoria} • ${chaveamento.sexo}`,
    margin + 5,
    y + 14
  );
  doc.setFontSize(7.5);
  doc.setTextColor(167, 243, 208); // emerald-200
  doc.text(
    FORMATO_LABEL[chaveamento.formato] || chaveamento.formato,
    margin + 5,
    y + 19
  );
  y += 26;

  // Selo de Auditoria do Congresso Técnico
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 13, 2, 2, 'FD');
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`SELO DE AUDITORIA: ${chaveamento.status}`, margin + 4, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const emitidoEm = new Date(chaveamento.createdAt).toLocaleString('pt-BR');
  doc.text(
    `Semente (Seed): ${chaveamento.seed}   |   Operador: ${chaveamento.criadoPor}   |   Gerado em: ${emitidoEm}`,
    margin + 4,
    y + 10
  );
  y += 18;

  let estrutura: any = null;
  try {
    estrutura = chaveamento.estruturaJson ? JSON.parse(chaveamento.estruturaJson) : null;
  } catch {
    estrutura = null;
  }

  // ---- MODO 1: ATLETISMO (BALIZAMENTO POR PROVA / SÉRIE / RAIA) ----
  if (chaveamento.formato === 'BALIZAMENTO_ATLETISMO' && Array.isArray(estrutura?.provas)) {
    const provas: ProvaAtletismoBalizamento[] = estrutura.provas;
    for (const pr of provas) {
      ensureSpace(22);
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor(167, 243, 208);
      doc.rect(margin, y, pageWidth - margin * 2, 7, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(6, 95, 70);
      doc.text(`PROVA: ${pr.prova.toUpperCase()}`, margin + 3, y + 5);
      y += 9;

      for (const serie of pr.series) {
        ensureSpace(16);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        doc.text(serie.nome, margin, y + 4);
        y += 6;

        // Cabeçalho da tabela de raias
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        doc.text('RAIA', margin + 2, y + 4.2);
        doc.text('ATLETA', margin + 16, y + 4.2);
        doc.text('ESCOLA', margin + 98, y + 4.2);
        doc.text('MARCA / TEMPO', margin + 140, y + 4.2);
        doc.text('POS.', margin + 170, y + 4.2);
        y += 6;

        doc.setFont('helvetica', 'normal');
        for (const r of serie.raias) {
          ensureSpace(7);
          doc.setDrawColor(226, 232, 240);
          doc.line(margin, y + 6, pageWidth - margin, y + 6);
          doc.text(String(r.raia), margin + 4, y + 4.2);
          doc.text(r.atletaNome.slice(0, 42), margin + 16, y + 4.2);
          doc.text(r.escolaSigla.slice(0, 22), margin + 98, y + 4.2);
          doc.text(r.marca || '__________', margin + 140, y + 4.2);
          doc.text(r.posicao ? `${r.posicao}º` : '____', margin + 170, y + 4.2);
          y += 6;
        }
        y += 4;
      }
    }
  }
  // ---- MODO 2: XADREZ (SUÍÇO / BERGER + BUCHHOLZ) ----
  else if (chaveamento.formato === 'SUICO_XADREZ' && estrutura?.rodadas) {
    const estXadrez: EstruturaXadrez = estrutura;
    const classif = calcularClassificacaoXadrez(estXadrez);

    for (const rod of estXadrez.rodadas) {
      ensureSpace(18);
      doc.setFillColor(236, 253, 245);
      doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(6, 95, 70);
      doc.text(`${rod.numero}ª RODADA (${estXadrez.sistema})`, margin + 3, y + 5);
      y += 8;

      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text('MESA', margin + 2, y + 4.2);
      doc.text('BRANCAS', margin + 16, y + 4.2);
      doc.text('PRETAS', margin + 96, y + 4.2);
      doc.text('RESULTADO', margin + 160, y + 4.2);
      y += 6;

      doc.setFont('helvetica', 'normal');
      for (const m of rod.mesas) {
        ensureSpace(7);
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y + 6, pageWidth - margin, y + 6);
        doc.text(String(m.mesa), margin + 4, y + 4.2);
        doc.text(`${m.brancasNome.slice(0, 28)} (${m.brancasSigla})`, margin + 16, y + 4.2);
        doc.text(
          m.pretasId === 'BYE' ? 'BYE (1 pt)' : `${m.pretasNome.slice(0, 28)} (${m.pretasSigla})`,
          margin + 96,
          y + 4.2
        );
        doc.text(m.resultado === 'PENDENTE' ? '____' : m.resultado, margin + 162, y + 4.2);
        y += 6;
      }
      y += 4;
    }

    // Classificação Xadrez com Buchholz
    ensureSpace(22);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('CLASSIFICAÇÃO PARCIAL / FINAL (CRITÉRIO FIDE: PONTOS → BUCHHOLZ)', margin, y + 4);
    y += 7;

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
    doc.setFontSize(7.5);
    doc.text('#', margin + 2, y + 4.2);
    doc.text('ENXADRISTA', margin + 12, y + 4.2);
    doc.text('ESCOLA', margin + 95, y + 4.2);
    doc.text('J', margin + 135, y + 4.2);
    doc.text('PTS', margin + 148, y + 4.2);
    doc.text('BUCHHOLZ', margin + 163, y + 4.2);
    y += 6;

    doc.setFont('helvetica', 'normal');
    classif.forEach((c, idx) => {
      ensureSpace(7);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + 6, pageWidth - margin, y + 6);
      doc.text(`${idx + 1}º`, margin + 2, y + 4.2);
      doc.text(c.nome.slice(0, 38), margin + 12, y + 4.2);
      doc.text(c.sigla.slice(0, 20), margin + 95, y + 4.2);
      doc.text(String(c.jogos), margin + 135, y + 4.2);
      doc.setFont('helvetica', 'bold');
      doc.text(c.pontos.toFixed(1), margin + 148, y + 4.2);
      doc.setFont('helvetica', 'normal');
      doc.text(c.buchholz.toFixed(1), margin + 165, y + 4.2);
      y += 6;
    });
  }
  // ---- MODO 3: COLETIVAS & TÊNIS DE MESA (GRUPOS + TABELA DE JOGOS) ----
  else {
    const grupos: GrupoChaveamento[] = Array.isArray(estrutura?.grupos) ? estrutura.grupos : [];
    if (grupos.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text('COMPOSIÇÃO OFICIAL DOS GRUPOS / CHAVES', margin, y + 4);
      y += 7;

      for (const g of grupos) {
        ensureSpace(12 + g.participantes.length * 5);
        doc.setFillColor(236, 253, 245);
        doc.rect(margin, y, pageWidth - margin * 2, 6, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(6, 95, 70);
        doc.text(`${g.nome.toUpperCase()} (${g.participantes.length})`, margin + 3, y + 4.3);
        y += 6.5;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(51, 65, 85);
        g.participantes.forEach((p, idx) => {
          doc.text(`${idx + 1}. ${p.nome} (${p.sigla})`, margin + 5, y + 3.8);
          y += 5;
        });
        y += 2;
      }
      y += 3;
    }

    // Tabela de Jogos
    ensureSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`TABELA OFICIAL DE CONFRONTOS (${partidas.length} JOGOS)`, margin, y + 4);
    y += 7;

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text('JOGO', margin + 2, y + 4.5);
    doc.text('DATA / HORA', margin + 15, y + 4.5);
    doc.text('FASE / GRUPO', margin + 44, y + 4.5);
    doc.text('CONFRONTO', margin + 78, y + 4.5);
    doc.text('LOCAL', margin + 148, y + 4.5);
    doc.text('PLACAR', margin + 169, y + 4.5);
    y += 6.5;

    doc.setFont('helvetica', 'normal');
    for (const p of partidas) {
      ensureSpace(8);
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, y + 7, pageWidth - margin, y + 7);
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`#${p.numeroJogo || '-'}`, margin + 2, y + 4.8);
      doc.text(`${formatarDataBR(p.dataEvento)} ${p.horario}`, margin + 15, y + 4.8);
      const faseTxt = p.fase === 'GRUPOS' ? p.grupo || 'Grupos' : FASES_LABEL[p.fase] || p.fase;
      doc.text(faseTxt.slice(0, 18), margin + 44, y + 4.8);
      doc.setFont('helvetica', 'bold');
      const confronto = `${p.escolaASigla || p.escolaANome}  ×  ${p.escolaBSigla || p.escolaBNome}`;
      doc.text(confronto.slice(0, 38), margin + 78, y + 4.8);
      doc.setFont('helvetica', 'normal');
      doc.text((p.local || '-').slice(0, 14), margin + 148, y + 4.8);
      const placar =
        p.status === 'ENCERRADO' || p.status === 'WO'
          ? `${p.placarA} × ${p.placarB}${p.status === 'WO' ? ' WO' : ''}`
          : '___ × ___';
      doc.text(placar, margin + 169, y + 4.8);
      y += 7;
    }
  }

  // Rodapé de assinatura do Congresso Técnico
  ensureSpace(18);
  y += 8;
  doc.setDrawColor(148, 163, 184);
  doc.line(margin, y + 8, margin + 75, y + 8);
  doc.line(pageWidth - margin - 75, y + 8, pageWidth - margin, y + 8);
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Coordenação Geral SEMED / JEGDS 2026', margin, y + 12);
  doc.text('Representante das Escolas (Congresso Técnico)', pageWidth - margin - 75, y + 12);

  abrirPdfNovaGuia(
    doc,
    `tabela-oficial-${chaveamento.modalidadeCodigo}-${chaveamento.categoria}-${chaveamento.sexo}.pdf`
  );
}
