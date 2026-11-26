import { ChaveamentoEventoItem, PartidaEventoItem } from '@/types/eventos';
import {
  EstruturaXadrez,
  GrupoChaveamento,
  ProvaAtletismoBalizamento,
  calcularClassificacaoXadrez,
  formatarPlacarComPenaltis,
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
  // ---- MODO 3: COLETIVAS, XADREZ MATA-MATA & TÊNIS DE MESA (CONFRONTOS COMPLETOS) ----
  else {
    const grupos: GrupoChaveamento[] = Array.isArray(estrutura?.grupos) ? estrutura.grupos : [];
    const mostrarGrupos =
      grupos.length > 0 &&
      chaveamento.formato !== 'MATA_MATA' &&
      chaveamento.formato !== 'FINAL_DIRETA';

    if (mostrarGrupos) {
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

    // Tabela de Confrontos agrupada por Fase e ordenada por número do jogo
    const partidasOrdenadas = [...partidas].sort((a, b) => (a.numeroJogo || 0) - (b.numeroJogo || 0));
    const concluidos = partidasOrdenadas.filter((p) => p.status === 'ENCERRADO' || p.status === 'WO').length;

    ensureSpace(18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `TABELA OFICIAL DE CONFRONTOS (${partidasOrdenadas.length} JOGOS · ${concluidos} CONCLUÍDO(S))`,
      margin,
      y + 4
    );
    y += 7;

    const ORDEM_BLOCOS = ['GRUPOS', 'OITAVAS', 'QUARTAS', 'SEMIFINAL', 'TERCEIRO_LUGAR', 'FINAL'];
    const fasesPresentes = Array.from(new Set(partidasOrdenadas.map((p) => p.fase || 'GRUPOS'))).sort((a, b) => {
      const ia = ORDEM_BLOCOS.indexOf(a);
      const ib = ORDEM_BLOCOS.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    const desenharHeaderConfrontos = () => {
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, y, pageWidth - margin * 2, 6.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(30, 41, 59);
      doc.text('JOGO', margin + 2, y + 4.4);
      doc.text('DATA / HORA / LOCAL', margin + 15, y + 4.4);
      doc.text('CONFRONTO (JOGADOR / EQUIPE A  ×  JOGADOR / EQUIPE B)', margin + 54, y + 4.4);
      doc.text('PLACAR / SITUAÇÃO', pageWidth - margin - 2, y + 4.4, { align: 'right' });
      y += 6.5;
    };

    for (const fase of fasesPresentes) {
      const jogosDaFase = partidasOrdenadas.filter((p) => (p.fase || 'GRUPOS') === fase);
      if (jogosDaFase.length === 0) continue;

      ensureSpace(22);
      doc.setFillColor(232, 247, 241);
      doc.rect(margin, y, pageWidth - margin * 2, 6.2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(11, 79, 53);
      const labelFase = fase === 'FINAL' ? 'GRANDE FINAL' : (FASES_LABEL[fase] || fase).toUpperCase();
      doc.text(`${labelFase} (${jogosDaFase.length} jogo(s))`, margin + 3, y + 4.3);
      y += 6.5;

      desenharHeaderConfrontos();

      for (const p of jogosDaFase) {
        const rowH = 11.5;
        if (y + rowH > pageHeight - 16) {
          doc.addPage();
          y = 16;
          desenharHeaderConfrontos();
        }

        const encerrado = p.status === 'ENCERRADO' || p.status === 'WO';
        const venceuA =
          encerrado && (p.vencedorEscolaId === p.escolaAId || (!p.vencedorEscolaId && p.placarA > p.placarB));
        const venceuB =
          encerrado && (p.vencedorEscolaId === p.escolaBId || (!p.vencedorEscolaId && p.placarB > p.placarA));

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.25);
        doc.line(margin, y + rowH, pageWidth - margin, y + rowH);

        // Número do Jogo
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 37, 64);
        doc.text(`J${p.numeroJogo || '-'}`, margin + 2, y + 6.5);

        // Data / Hora / Local
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(30, 41, 59);
        doc.text(`${formatarDataBR(p.dataEvento).slice(0, 5)} · ${p.horario}`, margin + 15, y + 4.6);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139);
        const subMeta = [p.grupo, p.local].filter(Boolean).join(' · ') || '-';
        doc.text(subMeta.slice(0, 24), margin + 15, y + 9.2);

        // Confronto completo em 2 linhas (Jogador/Equipe A e Jogador/Equipe B — sem cortar!)
        const nomeA = (p.escolaASigla || p.escolaANome || 'A definir').trim();
        const nomeB = (p.escolaBSigla || p.escolaBNome || 'A definir').trim();

        doc.setFont('helvetica', venceuA ? 'bold' : 'normal');
        doc.setFontSize(7.5);
        if (venceuA) doc.setTextColor(11, 79, 53);
        else doc.setTextColor(15, 23, 42);
        doc.text(`A: ${nomeA.slice(0, 56)}${venceuA ? '  [VENC.]' : ''}`, margin + 54, y + 4.6);

        doc.setFont('helvetica', venceuB ? 'bold' : 'normal');
        doc.setFontSize(7.5);
        if (venceuB) doc.setTextColor(11, 79, 53);
        else doc.setTextColor(15, 23, 42);
        doc.text(`B: ${nomeB.slice(0, 56)}${venceuB ? '  [VENC.]' : ''}`, margin + 54, y + 9.4);

        // Placar e Status
        const placarStr = encerrado
          ? `${formatarPlacarComPenaltis(p.placarA, p.placarB, p.detalhesPlacar)}${p.status === 'WO' ? ' (W.O.)' : ''}`
          : p.status === 'AO_VIVO'
          ? `${p.placarA} × ${p.placarB}`
          : '___ × ___';

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.2);
        doc.setTextColor(encerrado ? 11 : 15, encerrado ? 79 : 23, encerrado ? 53 : 42);
        doc.text(placarStr, pageWidth - margin - 2, y + 5, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.3);
        doc.setTextColor(100, 116, 139);
        const statusLabel =
          p.status === 'ENCERRADO'
            ? 'Encerrado'
            : p.status === 'WO'
            ? 'W.O.'
            : p.status === 'AO_VIVO'
            ? 'Ao Vivo'
            : 'Agendado';
        doc.text(statusLabel, pageWidth - margin - 2, y + 9.4, { align: 'right' });

        y += rowH;
      }
      y += 4;
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

// ============================================================
// MODELO 2: PDF CHAVEAMENTO VISUAL EM ÁRVORE (PAISAGEM A4)
// ============================================================

function iniciaisEquipePdf(sigla?: string | null): string {
  if (!sigla) return '?';
  const clean = sigla.replace(/[^A-Za-zÀ-ÿ0-9\s]/g, '').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return clean.slice(0, 2).toUpperCase() || '?';
}

function isTbdPdf(id?: string | null): boolean {
  return !id || id.startsWith('TBD_');
}

export function gerarPdfChaveamentoVisual(
  chaveamento: ChaveamentoEventoItem,
  partidas: PartidaEventoItem[]
): void {
  const doc = criarDocumentoA4('landscape');
  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const margin = 12;

  const partidasOrd = [...partidas].sort((a, b) => (a.numeroJogo || 0) - (b.numeroJogo || 0));
  const equipesSet = new Set<string>();
  partidasOrd.forEach((p) => {
    if (!isTbdPdf(p.escolaAId)) equipesSet.add(p.escolaAId);
    if (!isTbdPdf(p.escolaBId)) equipesSet.add(p.escolaBId);
  });
  const totalEquipes = equipesSet.size;
  const totalPartidas = partidasOrd.length;
  const concluidas = partidasOrd.filter((p) => p.status === 'ENCERRADO' || p.status === 'WO').length;
  const pendentes = totalPartidas - concluidas;

  const ORDEM_FASES = ['OITAVAS', 'QUARTAS', 'SEMIFINAL', 'FINAL'];
  const fasesMataMata = ORDEM_FASES.map((fase) => ({
    fase,
    label: fase === 'FINAL' ? 'GRANDE FINAL' : (FASES_LABEL[fase] || fase).toUpperCase(),
    jogos: partidasOrd.filter((p) => p.fase === fase),
  })).filter((f) => f.jogos.length > 0);

  const jogoTerceiro = partidasOrd.find((p) => p.fase === 'TERCEIRO_LUGAR') || null;
  const jogosGrupos = partidasOrd.filter((p) => p.fase === 'GRUPOS');
  const faseAtualLabel =
    fasesMataMata[0]?.label || (jogosGrupos.length > 0 ? 'FASE DE GRUPOS' : 'CHAVEAMENTO OFICIAL');

  const sexoLabel = chaveamento.sexo === 'MASCULINO' ? 'Masculino' : 'Feminino';

  const desenharCabecalho = (subtituloExtra?: string) => {
    // Card cabeçalho (estilo limpo igual à interface)
    doc.setFillColor(244, 246, 248);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, 10, pageWidth - margin * 2, 22, 3, 3, 'FD');

    // Tag superior verde esmeralda
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(0, 168, 120);
    doc.text(
      `JEGDS 2026 • ${subtituloExtra || faseAtualLabel} • ${chaveamento.categoria} · ${sexoLabel}`,
      margin + 6,
      17
    );

    // Título principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(15, 37, 64);
    doc.text(chaveamento.modalidadeNome, margin + 6, 26.5);

    // Métricas à direita
    const metricas = [
      { label: 'EQUIPES', valor: String(totalEquipes), cor: [15, 37, 64] as [number, number, number] },
      { label: 'PARTIDAS', valor: String(totalPartidas), cor: [15, 37, 64] as [number, number, number] },
      { label: 'CONCLUÍDAS', valor: String(concluidas), cor: [0, 168, 120] as [number, number, number] },
      { label: 'PENDENTES', valor: String(pendentes), cor: [71, 85, 105] as [number, number, number] },
    ];
    let mx = pageWidth - margin - 108;
    metricas.forEach((m, idx) => {
      if (idx > 0) {
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.25);
        doc.line(mx - 4, 15, mx - 4, 27);
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(m.label, mx, 17.5);
      doc.setFontSize(12);
      doc.setTextColor(...m.cor);
      doc.text(m.valor, mx, 26);
      mx += 27;
    });
  };

  const desenharRodape = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'JEGDS 2026 • Secretaria Municipal de Educação (SEMED) • Chaveamento Oficial Visual',
      margin,
      pageHeight - 6
    );
    const emitido = new Date().toLocaleString('pt-BR');
    doc.text(
      `Seed: ${chaveamento.seed} • Emitido em ${emitido}`,
      pageWidth - margin,
      pageHeight - 6,
      { align: 'right' }
    );
  };

  const desenharCardPartida = (
    p: PartidaEventoItem,
    x: number,
    y: number,
    w: number,
    h: number,
    isFinal = false
  ) => {
    const encerrado = p.status === 'ENCERRADO' || p.status === 'WO';
    const tbdA = isTbdPdf(p.escolaAId);
    const tbdB = isTbdPdf(p.escolaBId);
    const venceuA =
      encerrado && (p.vencedorEscolaId === p.escolaAId || (!p.vencedorEscolaId && p.placarA > p.placarB));
    const venceuB =
      encerrado && (p.vencedorEscolaId === p.escolaBId || (!p.vencedorEscolaId && p.placarB > p.placarA));

    // Card branco com borda dourada na Final
    doc.setFillColor(255, 255, 255);
    if (isFinal) {
      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.6);
    } else {
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
    }
    doc.roundedRect(x, y, w, h, 2.5, 2.5, 'FD');

    // Cabeçalho do card: J1 · 28/11 08:30 | Status
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    const dataCurta = formatarDataBR(p.dataEvento).slice(0, 5);
    const localCurto = p.local ? ` · ${p.local.slice(0, 12)}` : '';
    doc.text(`J${p.numeroJogo || '-'} · ${dataCurta} ${p.horario}${localCurto}`, x + 3, y + 5);

    const statusTxt =
      p.status === 'ENCERRADO'
        ? 'Encerrada'
        : p.status === 'WO'
        ? 'W.O.'
        : p.status === 'AO_VIVO'
        ? 'Ao Vivo'
        : 'Agendada';
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(
      p.status === 'AO_VIVO' ? 0 : encerrado ? 15 : 100,
      p.status === 'AO_VIVO' ? 168 : encerrado ? 37 : 116,
      p.status === 'AO_VIVO' ? 120 : encerrado ? 64 : 139
    );
    doc.text(statusTxt, x + w - 3, y + 5, { align: 'right' });

    // Duas linhas de equipe
    const rowH = Math.min(9.5, (h - 10) / 2);
    const drawTeamRow = (
      ry: number,
      nome: string,
      placar: number,
      tbd: boolean,
      venceu: boolean,
      perdeu: boolean
    ) => {
      if (venceu) {
        doc.setFillColor(236, 253, 245);
      } else {
        doc.setFillColor(248, 250, 252);
      }
      doc.roundedRect(x + 2.5, ry, w - 5, rowH, 1.5, 1.5, 'F');

      // Barra lateral colorida
      if (venceu) doc.setFillColor(0, 168, 120);
      else if (perdeu) doc.setFillColor(251, 113, 133);
      else doc.setFillColor(203, 213, 225);
      doc.rect(x + 2.5, ry, 1.1, rowH, 'F');

      let textX = x + 5.5;
      if (!tbd) {
        const cr = 3.1;
        const cx = x + 7.5;
        const cy = ry + rowH / 2;
        if (venceu) doc.setFillColor(0, 168, 120);
        else doc.setFillColor(226, 232, 240);
        doc.circle(cx, cy, cr, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        if (venceu) doc.setTextColor(255, 255, 255);
        else doc.setTextColor(15, 37, 64);
        doc.text(iniciaisEquipePdf(nome), cx, cy + 1.8, { align: 'center' });
        textX = x + 12.2;
      }

      doc.setFont('helvetica', venceu ? 'bold' : 'normal');
      doc.setFontSize(7.5);
      if (tbd || perdeu) doc.setTextColor(148, 163, 184);
      else doc.setTextColor(15, 37, 64);
      const maxChars = Math.max(14, Math.floor((w - 22) / 1.85));
      doc.text(nome.slice(0, maxChars), textX, ry + rowH / 2 + 2.2);

      // Placar à direita
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(venceu ? 0 : 15, venceu ? 168 : 37, venceu ? 120 : 64);
      const placarStr = encerrado || p.status === 'AO_VIVO' ? String(placar) : '—';
      doc.text(placarStr, x + w - 4.5, ry + rowH / 2 + 2.4, { align: 'right' });
    };

    const row1Y = y + 7.5;
    const row2Y = row1Y + rowH + 1.8;
    drawTeamRow(row1Y, p.escolaASigla || p.escolaANome, p.placarA, tbdA, venceuA, venceuB);
    drawTeamRow(row2Y, p.escolaBSigla || p.escolaBNome, p.placarB, tbdB, venceuB, venceuA);

    // Parciais ou pênaltis se houver
    if (encerrado && p.detalhesPlacar) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.8);
      doc.setTextColor(100, 116, 139);
      doc.text(p.detalhesPlacar.slice(0, 32), x + w / 2, y + h - 1.5, { align: 'center' });
    }
  };

  // ============================================================
  // PÁGINA 1: ÁRVORE VISUAL DO CHAVEAMENTO (OU GRADE DE JOGOS)
  // ============================================================
  desenharCabecalho();

  const canvasX = margin;
  const canvasY = 36;
  const canvasW = pageWidth - margin * 2;
  const canvasH = pageHeight - canvasY - 12;

  doc.setFillColor(244, 246, 248);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(canvasX, canvasY, canvasW, canvasH, 3, 3, 'FD');

  if (fasesMataMata.length > 0) {
    const numCols = fasesMataMata.length;
    const padX = 8;
    const padTop = 14;
    const padBottom = 8;
    const gapX = numCols <= 3 ? 12 : 8;
    const colW = (canvasW - padX * 2 - gapX * (numCols - 1)) / numCols;
    const availH = canvasH - padTop - padBottom;

    // Guardar posições centrais dos cards de cada coluna para desenhar conectores
    const cardCentros: Array<Array<{ rightX: number; leftX: number; midY: number; numeroJogo: number | null; escolaAId: string; escolaBId: string }>> = [];

    fasesMataMata.forEach((col, colIdx) => {
      const colX = canvasX + padX + colIdx * (colW + gapX);
      const isFinalCol = col.fase === 'FINAL';

      // Cabeçalho da coluna
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 37, 64);
      doc.text(col.label, colX, canvasY + 8.5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`${col.jogos.length} jogo(s)`, colX + colW, canvasY + 8.5, { align: 'right' });

      const count = col.jogos.length;
      const areaColH = isFinalCol && jogoTerceiro ? availH * 0.56 : availH;
      const cardH = Math.min(34, Math.max(24, (areaColH - (count - 1) * 6) / count));
      const slotH = areaColH / count;

      const centrosCol: Array<{ rightX: number; leftX: number; midY: number; numeroJogo: number | null; escolaAId: string; escolaBId: string }> = [];

      col.jogos.forEach((jogo, jIdx) => {
        const cardY = canvasY + padTop + jIdx * slotH + (slotH - cardH) / 2;
        desenharCardPartida(jogo, colX, cardY, colW, cardH, isFinalCol);
        centrosCol.push({
          leftX: colX,
          rightX: colX + colW,
          midY: cardY + cardH / 2,
          numeroJogo: jogo.numeroJogo ?? null,
          escolaAId: jogo.escolaAId,
          escolaBId: jogo.escolaBId,
        });
      });

      cardCentros.push(centrosCol);

      // Disputa de 3º lugar abaixo da Grande Final
      if (isFinalCol && jogoTerceiro) {
        const sepY = canvasY + padTop + areaColH + 4;
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.25);
        doc.line(colX, sepY, colX + colW, sepY);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text('DISPUTA DE 3º LUGAR', colX, sepY + 6);

        const card3Y = sepY + 9;
        const card3H = Math.min(32, canvasY + canvasH - padBottom - card3Y);
        desenharCardPartida(jogoTerceiro, colX, card3Y, colW, card3H, false);
      }
    });

    // Desenhar linhas conectoras ortogonais entre rodadas (ligando cada jogo ao seu destino real)
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.45);
    for (let c = 0; c < cardCentros.length - 1; c++) {
      const atual = cardCentros[c];
      const prox = cardCentros[c + 1];
      if (atual.length === 0 || prox.length === 0) continue;

      const midX = atual[0].rightX + gapX / 2;

      atual.forEach((orig, idx) => {
        const refTag = orig.numeroJogo ? `TBD_VENCEDOR_J${orig.numeroJogo}` : null;
        const targetByRef = refTag
          ? prox.find((t) => t.escolaAId === refTag || t.escolaBId === refTag)
          : undefined;
        const target = targetByRef || prox[Math.min(Math.floor(idx / 2), prox.length - 1)];
        doc.line(orig.rightX, orig.midY, midX, orig.midY);
        doc.line(midX, orig.midY, midX, target.midY);
        doc.line(midX, target.midY, target.leftX, target.midY);
      });
    }
  } else {
    // Fallback para Pontos Corridos (grade visual de cards 3 por linha)
    const cols = 3;
    const padX = 8;
    const gap = 6;
    const cardW = (canvasW - padX * 2 - gap * (cols - 1)) / cols;
    const cardH = 30;
    let cx = canvasX + padX;
    let cy = canvasY + 10;

    partidasOrd.slice(0, 12).forEach((p, idx) => {
      desenharCardPartida(p, cx, cy, cardW, cardH, false);
      if ((idx + 1) % cols === 0) {
        cx = canvasX + padX;
        cy += cardH + 6;
      } else {
        cx += cardW + gap;
      }
    });
  }

  desenharRodape();

  // ============================================================
  // PÁGINA 2 (SE HOUVER FASE DE GRUPOS): CONFRONTOS DOS GRUPOS
  // ============================================================
  if (fasesMataMata.length > 0 && jogosGrupos.length > 0) {
    doc.addPage('a4', 'landscape');
    desenharCabecalho('FASE DE GRUPOS');

    doc.setFillColor(244, 246, 248);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(canvasX, canvasY, canvasW, canvasH, 3, 3, 'FD');

    const cols = 3;
    const padX = 8;
    const gap = 5.5;
    const cardW = (canvasW - padX * 2 - gap * (cols - 1)) / cols;
    const cardH = 29;
    let cx = canvasX + padX;
    let cy = canvasY + 9;

    jogosGrupos.forEach((p, idx) => {
      if (cy + cardH > canvasY + canvasH - 4) {
        desenharRodape();
        doc.addPage('a4', 'landscape');
        desenharCabecalho('FASE DE GRUPOS (CONT.)');
        doc.setFillColor(244, 246, 248);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(canvasX, canvasY, canvasW, canvasH, 3, 3, 'FD');
        cx = canvasX + padX;
        cy = canvasY + 9;
      }
      desenharCardPartida(p, cx, cy, cardW, cardH, false);
      if ((idx + 1) % cols === 0) {
        cx = canvasX + padX;
        cy += cardH + 5.5;
      } else {
        cx += cardW + gap;
      }
    });

    desenharRodape();
  }

  abrirPdfNovaGuia(
    doc,
    `chaveamento-visual-${chaveamento.modalidadeCodigo}-${chaveamento.categoria}-${chaveamento.sexo}.pdf`
  );
}
