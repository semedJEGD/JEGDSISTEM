import { jsPDF } from 'jspdf';
import { Escola, Atleta, ModalidadeConfig } from '@/types/jegd';
import { criarDocumentoA4, CORES_JEGD } from './pdf-types';

export interface CategoriaSumulaData {
  categoria: string;
  sexo: string;
  atletasComEscola: { atleta: Atleta; escola: Escola; provas?: string[] }[];
}

export interface SumulaOptions {
  escolaFiltro?: { id?: string; nome: string; sigla?: string };
  isModeloManual?: boolean;
  linhasExtrasMinimas?: number;
  tituloPersonalizado?: string;
  rodapeContexto?: string;
  faixaSecaoEscola?: string;
}

const ORDEM_FAIXA_ETARIA: Record<string, number> = {
  MIRIM: 1,
  INFANTIL: 2,
  INFANTO: 3,
  JUNIOR: 4,
};

const ORDEM_NAIPE: Record<string, number> = {
  MASCULINO: 1,
  FEMININO: 2,
};

const DESCRICAO_FAIXA_ETARIA: Record<string, string> = {
  MIRIM: 'MIRIM (9 a 11 anos)',
  INFANTIL: 'INFANTIL (12 a 14 anos)',
  INFANTO: 'INFANTO (15 a 17 anos)',
  JUNIOR: 'JUNIOR (18 a 20 anos)',
};

function ordemCategoria(cat: string): number {
  return ORDEM_FAIXA_ETARIA[cat.toUpperCase()] ?? 99;
}

function ordemNaipe(sexo: string): number {
  return ORDEM_NAIPE[sexo.toUpperCase()] ?? 99;
}

function formatarFaixaEtaria(cat: string): string {
  const key = cat.toUpperCase();
  return DESCRICAO_FAIXA_ETARIA[key] || key;
}

/**
 * Ajusta o texto para caber exatamente na largura máxima (em mm) com reticências limpas,
 * evitando qualquer sobreposição ou corte quebrado entre colunas.
 */
function ajustarTexto(doc: jsPDF, texto: string, maxWidthMm: number): string {
  const limpo = (texto || '').trim();
  if (!limpo) return '';
  if (doc.getTextWidth(limpo) <= maxWidthMm) return limpo;
  let atual = limpo;
  while (atual.length > 1 && doc.getTextWidth(`${atual}…`) > maxWidthMm) {
    atual = atual.slice(0, -1);
  }
  return `${atual.trimEnd()}…`;
}

/**
 * Adiciona rodapé paginado em todas as páginas do documento.
 */
function aplicarRodapePaginado(doc: jsPDF, tituloDocumento: string, contextosPorPagina?: Record<number, string>): void {
  const totalPaginas = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  for (let p = 1; p <= totalPaginas; p++) {
    doc.setPage(p);
    doc.setDrawColor(...CORES_JEGD.bordaSuave);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 9.5, pageWidth - margin, pageHeight - 9.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(...CORES_JEGD.textoMuted);

    const contexto = contextosPorPagina?.[p];
    const textoEsquerda = contexto
      ? `${tituloDocumento}  •  ${contexto}`
      : tituloDocumento;
    doc.text(ajustarTexto(doc, textoEsquerda, 145), margin, pageHeight - 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...CORES_JEGD.grafite);
    doc.text(`Página ${p} de ${totalPaginas}`, pageWidth - margin, pageHeight - 5.5, { align: 'right' });
  }
}

export class SumulaChamadaService {
  /**
   * Desenha a página individual de uma súmula/lista de chamada oficial no documento PDF
   * com alinhamento matemático exato (largura útil = 190,0 mm, x = 10 mm até 200 mm).
   */
  public static desenharPaginaSumula(
    doc: jsPDF,
    modalidadeNome: string,
    categoria: string,
    sexo: string,
    dataJogo: string,
    atletasComEscola: { atleta: Atleta; escola: Escola; provas?: string[] }[],
    options?: SumulaOptions
  ): void {
    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
    const margin = 10;
    const contentWidth = pageWidth - margin * 2; // 190mm
    const rightEdge = margin + contentWidth; // 200mm

    const isManual = !!options?.isModeloManual;
    const escolaFiltro = options?.escolaFiltro;
    const ocultarColunaEscola = !!escolaFiltro;

    let currentY = 8;

    // ============================================================
    // 0. FAIXA DE SEÇÃO DA ESCOLA (QUANDO INÍCIO DE ESCOLA NO LIVRO)
    // ============================================================
    if (options?.faixaSecaoEscola) {
      doc.setFillColor(241, 245, 249); // slate-100
      doc.setDrawColor(...CORES_JEGD.borda);
      doc.setLineWidth(0.25);
      doc.roundedRect(margin, currentY, contentWidth, 6.2, 1, 1, 'FD');

      doc.setFillColor(...CORES_JEGD.secundaria);
      doc.rect(margin, currentY, 2.2, 6.2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...CORES_JEGD.escuro);
      doc.text(ajustarTexto(doc, options.faixaSecaoEscola.toUpperCase(), contentWidth - 8), margin + 5, currentY + 4.2);
      currentY += 8;
    }

    // ============================================================
    // 1. CABEÇALHO OFICIAL DE SÚMULA
    // ============================================================
    const headerH = 21;
    doc.setFillColor(...CORES_JEGD.primaria);
    doc.roundedRect(margin, currentY, contentWidth, headerH, 1.5, 1.5, 'F');
    doc.setFillColor(...CORES_JEGD.destaqueOuro);
    doc.rect(margin, currentY + headerH - 0.8, contentWidth, 0.8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');

    let tituloHeader = 'JEGDS 2026 • SÚMULA OFICIAL DE PARTIDA & LISTA DE ARBITRAGEM';
    if (isManual) {
      tituloHeader = 'JEGDS 2026 • SÚMULA OFICIAL (MODELO PARA REGISTRO MANUAL)';
    } else if (escolaFiltro) {
      tituloHeader = `JEGDS 2026 • SÚMULA OFICIAL — ${escolaFiltro.nome.toUpperCase()}`;
    }
    if (options?.tituloPersonalizado) {
      tituloHeader = options.tituloPersonalizado;
    }
    doc.text(ajustarTexto(doc, tituloHeader, contentWidth - 10), pageWidth / 2, currentY + 6.5, { align: 'center' });

    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(245, 232, 234);
    doc.text(
      'PREFEITURA DE GONÇALVES DIAS - MA  •  SECRETARIA MUNICIPAL DE EDUCAÇÃO (SEMED)  •  COMITÊ TÉCNICO',
      pageWidth / 2,
      currentY + 12,
      { align: 'center' }
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.6);
    doc.setTextColor(255, 255, 255);
    let infoLinha = `MODALIDADE: ${modalidadeNome.toUpperCase()}  •  FAIXA ETÁRIA: ${formatarFaixaEtaria(categoria)}  •  NAIPE: ${sexo.toUpperCase()}  •  DATA: ${dataJogo}`;
    if (isManual && (!modalidadeNome || modalidadeNome.toUpperCase().includes('UNIVERSAL') || modalidadeNome.toUpperCase().includes('GERAL'))) {
      infoLinha = 'MODALIDADE: ______________________  •  FAIXA ETÁRIA: _______________  •  NAIPE: ( ) MASC  ( ) FEM  •  DATA: ___/___/2026';
    }
    doc.text(ajustarTexto(doc, infoLinha, contentWidth - 8), pageWidth / 2, currentY + 17.5, { align: 'center' });

    currentY += headerH + 3;

    // ============================================================
    // 2. QUADRO DO CONFRONTO & PLACAR OFICIAL (VETORIAL E ALINHADO)
    // ============================================================
    const boxConfrontoH = 15.5;
    doc.setFillColor(...CORES_JEGD.fundoCinza);
    doc.setDrawColor(...CORES_JEGD.borda);
    doc.setLineWidth(0.25);
    doc.roundedRect(margin, currentY, contentWidth, boxConfrontoH, 1.2, 1.2, 'FD');

    doc.setTextColor(...CORES_JEGD.escuro);
    doc.setFontSize(7.4);
    doc.setFont('helvetica', 'bold');

    // Equipe A (esquerda)
    const labelEqA = 'EQUIPE A:';
    doc.text(labelEqA, margin + 3.5, currentY + 5.8);
    if (escolaFiltro) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...CORES_JEGD.primaria);
      doc.text(
        ajustarTexto(doc, (escolaFiltro.sigla || escolaFiltro.nome).toUpperCase(), 58),
        margin + 19,
        currentY + 5.8
      );
      doc.setTextColor(...CORES_JEGD.escuro);
    } else {
      doc.setDrawColor(...CORES_JEGD.grafite);
      doc.setLineWidth(0.2);
      doc.line(margin + 19, currentY + 6.1, margin + 76, currentY + 6.1);
    }

    // Placar Central (vetorial)
    const centerX = pageWidth / 2;
    doc.setDrawColor(...CORES_JEGD.borda);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(centerX - 16, currentY + 2.2, 11, 5, 0.8, 0.8, 'FD');
    doc.roundedRect(centerX + 5, currentY + 2.2, 11, 5, 0.8, 0.8, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...CORES_JEGD.escuro);
    doc.text('X', centerX, currentY + 5.7, { align: 'center' });

    // Equipe B (direita)
    doc.setFontSize(7.4);
    doc.text('EQUIPE B:', centerX + 20, currentY + 5.8);
    doc.setDrawColor(...CORES_JEGD.grafite);
    doc.setLineWidth(0.2);
    doc.line(centerX + 36, currentY + 6.1, rightEdge - 3.5, currentY + 6.1);

    // Linha divisória suave interna
    doc.setDrawColor(...CORES_JEGD.bordaSuave);
    doc.setLineWidth(0.15);
    doc.line(margin + 3, currentY + 8.8, rightEdge - 3, currentY + 8.8);

    // Placares Parciais
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...CORES_JEGD.grafite);
    doc.text(
      '1º TEMPO: [    ] x [    ]     |     2º TEMPO: [    ] x [    ]     |     PRORROGAÇÃO: [    ] x [    ]     |     PÊNALTIS/DECISÃO: [    ] x [    ]',
      centerX,
      currentY + 13.2,
      { align: 'center' }
    );

    currentY += boxConfrontoH + 3;

    // ============================================================
    // 3. DEFINIÇÃO MATEMÁTICA EXATA DAS COLUNAS (SOMA = 190.0mm)
    // ============================================================
    type ColDef = {
      key: string;
      label: string;
      x: number;
      w: number;
      align?: 'left' | 'center';
    };

    const colunas: ColDef[] = ocultarColunaEscola
      ? [
          { key: 'num', label: 'Nº', x: margin + 0, w: 8, align: 'center' },
          { key: 'camisa', label: 'CAM.', x: margin + 8, w: 11, align: 'center' },
          { key: 'nome', label: 'NOME DO ESTUDANTE-ATLETA', x: margin + 19, w: 64, align: 'left' },
          { key: 'doc', label: 'DOCUMENTO (CPF/RG)', x: margin + 83, w: 27, align: 'left' },
          { key: 'pontos', label: 'PONTOS', x: margin + 110, w: 18, align: 'center' },
          { key: 'faltas', label: 'FALTAS', x: margin + 128, w: 17, align: 'center' },
          { key: 'ca', label: 'C.A.', x: margin + 145, w: 7.5, align: 'center' },
          { key: 'cv', label: 'C.V.', x: margin + 152.5, w: 7.5, align: 'center' },
          { key: 'rubrica', label: 'RUBRICA / CHECK-IN', x: margin + 160, w: 30, align: 'center' },
        ]
      : [
          { key: 'num', label: 'Nº', x: margin + 0, w: 7.5, align: 'center' },
          { key: 'camisa', label: 'CAM.', x: margin + 7.5, w: 10.5, align: 'center' },
          { key: 'nome', label: 'NOME DO ESTUDANTE-ATLETA', x: margin + 18, w: 50, align: 'left' },
          { key: 'escola', label: 'ESCOLA', x: margin + 68, w: 22, align: 'left' },
          { key: 'doc', label: 'DOCUMENTO', x: margin + 90, w: 25, align: 'left' },
          { key: 'pontos', label: 'PONTOS', x: margin + 115, w: 16, align: 'center' },
          { key: 'faltas', label: 'FALTAS', x: margin + 131, w: 16.5, align: 'center' },
          { key: 'ca', label: 'C.A.', x: margin + 147.5, w: 7, align: 'center' },
          { key: 'cv', label: 'C.V.', x: margin + 154.5, w: 7, align: 'center' },
          { key: 'rubrica', label: 'RUBRICA / CHECK', x: margin + 161.5, w: 28.5, align: 'center' },
        ];

    const colMap = Object.fromEntries(colunas.map((c) => [c.key, c]));

    const desenharCabecalhoTabela = () => {
      const thH = 7;
      doc.setFillColor(...CORES_JEGD.escuro);
      doc.rect(margin, currentY, contentWidth, thH, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6.3);
      doc.setFont('helvetica', 'bold');

      colunas.forEach((col, idx) => {
        if (idx > 0) {
          doc.setDrawColor(51, 65, 85); // slate-700
          doc.setLineWidth(0.15);
          doc.line(col.x, currentY, col.x, currentY + thH);
        }
        if (col.align === 'center') {
          doc.text(col.label, col.x + col.w / 2, currentY + 4.6, { align: 'center' });
        } else {
          doc.text(col.label, col.x + 2, currentY + 4.6);
        }
      });

      currentY += thH;
    };

    const desenharLinha = (
      index: number,
      nome: string = '',
      escolaStr: string = '',
      docStr: string = '',
      presente: boolean = false
    ) => {
      const rowH = 6.6;

      // Fundo zebra alternado
      if (index % 2 === 1) {
        doc.setFillColor(...CORES_JEGD.fundoZebra);
        doc.rect(margin, currentY, contentWidth, rowH, 'F');
      } else {
        doc.setFillColor(255, 255, 255);
        doc.rect(margin, currentY, contentWidth, rowH, 'F');
      }

      // Borda externa e divisórias verticais sutis
      doc.setDrawColor(...CORES_JEGD.bordaSuave);
      doc.setLineWidth(0.18);
      doc.rect(margin, currentY, contentWidth, rowH, 'S');
      colunas.forEach((col, idx) => {
        if (idx > 0) {
          doc.line(col.x, currentY, col.x, currentY + rowH);
        }
      });

      const midY = currentY + 4.4;

      // Nº
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(...CORES_JEGD.grafite);
      doc.text((index + 1).toString().padStart(2, '0'), colMap.num.x + colMap.num.w / 2, midY, { align: 'center' });

      // Caixa de Camisa (centralizada)
      doc.setDrawColor(...CORES_JEGD.borda);
      doc.setLineWidth(0.22);
      const camBoxW = 6.2;
      const camBoxH = 4.0;
      doc.rect(
        colMap.camisa.x + (colMap.camisa.w - camBoxW) / 2,
        currentY + (rowH - camBoxH) / 2,
        camBoxW,
        camBoxH,
        'S'
      );

      // Nome do Estudante-Atleta
      if (nome) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(...CORES_JEGD.escuro);
        doc.text(ajustarTexto(doc, nome, colMap.nome.w - 3.5), colMap.nome.x + 2, midY);
      }

      // Escola (quando tabela mista)
      if (!ocultarColunaEscola && colMap.escola && escolaStr) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.2);
        doc.setTextColor(...CORES_JEGD.grafite);
        doc.text(ajustarTexto(doc, escolaStr, colMap.escola.w - 3), colMap.escola.x + 1.8, midY);
      }

      // Documento (CPF / RG completo sem corte)
      if (docStr) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.3);
        doc.setTextColor(...CORES_JEGD.grafite);
        doc.text(ajustarTexto(doc, docStr, colMap.doc.w - 3), colMap.doc.x + 1.8, midY);
      }

      // Pontos / Gols (caixa centralizada)
      doc.setDrawColor(...CORES_JEGD.borda);
      doc.setLineWidth(0.2);
      const ptsBoxW = colMap.pontos.w - 4.5;
      doc.rect(
        colMap.pontos.x + (colMap.pontos.w - ptsBoxW) / 2,
        currentY + (rowH - 4.0) / 2,
        ptsBoxW,
        4.0,
        'S'
      );

      // Faltas (5 quadrados perfeitamente centralizados)
      const fBoxW = 2.3;
      const fGap = 0.55;
      const totalFaltasW = 5 * fBoxW + 4 * fGap;
      const fStartX = colMap.faltas.x + (colMap.faltas.w - totalFaltasW) / 2;
      for (let f = 0; f < 5; f++) {
        doc.rect(fStartX + f * (fBoxW + fGap), currentY + (rowH - 3.8) / 2, fBoxW, 3.8, 'S');
      }

      // C.A. e C.V. (quadrados centralizados)
      const cardBox = 3.6;
      doc.rect(
        colMap.ca.x + (colMap.ca.w - cardBox) / 2,
        currentY + (rowH - cardBox) / 2,
        cardBox,
        cardBox,
        'S'
      );
      doc.rect(
        colMap.cv.x + (colMap.cv.w - cardBox) / 2,
        currentY + (rowH - cardBox) / 2,
        cardBox,
        cardBox,
        'S'
      );

      // Rubrica / Check-in (checkbox vetorial + linha vetorial dentro dos limites da coluna!)
      const rubX = colMap.rubrica.x;
      const rubW = colMap.rubrica.w;
      const chkSize = 3.2;
      const chkX = rubX + 2.2;
      const chkY = currentY + (rowH - chkSize) / 2;
      doc.setDrawColor(...CORES_JEGD.borda);
      doc.rect(chkX, chkY, chkSize, chkSize, 'S');
      if (presente) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(...CORES_JEGD.secundaria);
        doc.text('X', chkX + chkSize / 2, chkY + 2.5, { align: 'center' });
      }
      // Linha de assinatura vetorial terminando 2mm antes da borda direita
      doc.setDrawColor(...CORES_JEGD.borda);
      doc.setLineWidth(0.2);
      doc.line(chkX + chkSize + 1.8, currentY + rowH - 1.6, rubX + rubW - 2.2, currentY + rowH - 1.6);

      currentY += rowH;
    };

    desenharCabecalhoTabela();

    // Limite inferior para reservar espaço confortável para Relatório + Assinaturas + Rodapé
    const limiteTabelaY = pageHeight - 55;

    if (isManual || atletasComEscola.length === 0) {
      const totalLinhasManual = 18;
      const escolaNomePreenchido = escolaFiltro ? (escolaFiltro.sigla || escolaFiltro.nome) : '';
      for (let i = 0; i < totalLinhasManual; i++) {
        if (currentY + 6.6 > limiteTabelaY) break;
        desenharLinha(i, '', escolaNomePreenchido, '');
      }
    } else {
      // Ordenação alfabética rigorosa dos atletas
      const atletasOrdenadosSumula = [...atletasComEscola].sort((a, b) =>
        a.atleta.nomeCompleto.localeCompare(b.atleta.nomeCompleto, 'pt-BR')
      );

      atletasOrdenadosSumula.forEach((item, index) => {
        if (currentY + 6.6 > limiteTabelaY) {
          doc.addPage();
          currentY = 12;

          // Mini cabeçalho de continuação para nunca perder o contexto ao virar a folha
          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(...CORES_JEGD.borda);
          doc.setLineWidth(0.2);
          doc.roundedRect(margin, currentY, contentWidth, 7, 1, 1, 'FD');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.2);
          doc.setTextColor(...CORES_JEGD.primaria);
          const contTexto = escolaFiltro
            ? `CONTINUAÇÃO • ${escolaFiltro.nome.toUpperCase()} • ${modalidadeNome.toUpperCase()} • ${formatarFaixaEtaria(categoria)} • ${sexo.toUpperCase()}`
            : `CONTINUAÇÃO • ${modalidadeNome.toUpperCase()} • ${formatarFaixaEtaria(categoria)} • ${sexo.toUpperCase()}`;
          doc.text(ajustarTexto(doc, contTexto, contentWidth - 8), margin + 4, currentY + 4.7);
          currentY += 9;

          desenharCabecalhoTabela();
        }

        const docExibicao =
          item.atleta.semDocumento ||
          item.atleta.documentoTipo === 'SEM_DOCUMENTO' ||
          item.atleta.documentoNumero === 'SEM DOCUMENTO'
            ? 'SEM DOC.'
            : item.atleta.documentoNumero || 'SEM DOC.';

        desenharLinha(
          index,
          item.atleta.nomeCompleto.toUpperCase(),
          item.escola.sigla || item.escola.nome,
          docExibicao
        );
      });

      // Linhas extras para reservas/suplentes em súmulas de escola (até 3 linhas se houver espaço)
      const totalAtual = atletasOrdenadosSumula.length;
      const metaLinhas = escolaFiltro ? Math.min(Math.max(totalAtual + 2, 12), totalAtual + 4) : totalAtual;
      const escolaNomeExtra = escolaFiltro ? (escolaFiltro.sigla || escolaFiltro.nome) : '';

      for (let j = totalAtual; j < metaLinhas; j++) {
        if (currentY + 6.6 > limiteTabelaY) break;
        desenharLinha(j, '', escolaNomeExtra, '');
      }
    }

    // ============================================================
    // 4. QUADRO DISCIPLINAR / OBSERVAÇÕES & WxO (LINHAS VETORIAIS)
    // ============================================================
    const obsY = Math.max(currentY + 4, pageHeight - 50);
    const obsH = 15.5;
    doc.setFillColor(...CORES_JEGD.fundoCinza);
    doc.setDrawColor(...CORES_JEGD.borda);
    doc.setLineWidth(0.25);
    doc.roundedRect(margin, obsY, contentWidth, obsH, 1.2, 1.2, 'FD');

    doc.setFontSize(6.4);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...CORES_JEGD.escuro);
    doc.text('RELATÓRIO DA ARBITRAGEM, OCORRÊNCIAS DISCIPLINARES OU REGISTRO DE WxO:', margin + 3.5, obsY + 4.3);

    doc.setDrawColor(...CORES_JEGD.borda);
    doc.setLineWidth(0.2);
    doc.line(margin + 3.5, obsY + 9.2, rightEdge - 3.5, obsY + 9.2);
    doc.line(margin + 3.5, obsY + 13.4, rightEdge - 3.5, obsY + 13.4);

    // ============================================================
    // 5. ASSINATURAS DA EQUIPE DE ARBITRAGEM (4 COLUNAS ALINHADAS)
    // ============================================================
    const signY = obsY + obsH + 10.5;
    const colSW = (contentWidth - 9) / 4;

    const arbitros = [
      'Árbitro Principal',
      'Árbitro Auxiliar',
      'Apontador / Cronometrista',
      'Coordenador / SEMED',
    ];

    arbitros.forEach((cargo, idx) => {
      const sX = margin + idx * (colSW + 3);
      doc.setDrawColor(...CORES_JEGD.grafite);
      doc.setLineWidth(0.25);
      doc.line(sX + 2, signY, sX + colSW - 2, signY);

      doc.setFontSize(6.2);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...CORES_JEGD.escuro);
      doc.text(cargo, sX + colSW / 2, signY + 3.4, { align: 'center' });
      doc.setFontSize(5.2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...CORES_JEGD.textoMuted);
      doc.text('Assinatura / Visto', sX + colSW / 2, signY + 6.0, { align: 'center' });
    });
  }

  // ==============================================================
  // OPÇÃO 1: SÚMULAS GERAIS / LIVRO GERAL DE ARBITRAGEM
  // ==============================================================

  /**
   * Gera a Lista de Chamada Individual (1 única categoria com todas as escolas)
   */
  public static async gerarListaChamadaOficial(
    modalidadeNome: string,
    categoria: string,
    sexo: string,
    dataJogo: string,
    atletasComEscola: { atleta: Atleta; escola: Escola; provas?: string[] }[]
  ): Promise<void> {
    const doc = criarDocumentoA4('portrait');
    this.desenharPaginaSumula(doc, modalidadeNome, categoria, sexo, dataJogo, atletasComEscola);
    aplicarRodapePaginado(doc, `JEGDS 2026 • Súmula Oficial • ${modalidadeNome}`);
    doc.save(`Sumula_Geral_JEGDS_${modalidadeNome.replace(/\s+/g, '_')}_${categoria}_${sexo}.pdf`);
  }

  /**
   * Gera o Caderno Completo de uma Modalidade (Todas as Categorias em 1 só PDF)
   */
  public static async gerarCadernoModalidadeCompleto(
    modalidade: ModalidadeConfig,
    categoriasData: CategoriaSumulaData[],
    options?: SumulaOptions
  ): Promise<void> {
    const doc = criarDocumentoA4('portrait');
    const dataJogo = new Date(modalidade.dataEvento).toLocaleDateString('pt-BR');

    const categoriasOrdenadas = [...categoriasData].sort((a, b) => {
      const diffCat = ordemCategoria(a.categoria) - ordemCategoria(b.categoria);
      if (diffCat !== 0) return diffCat;
      return ordemNaipe(a.sexo) - ordemNaipe(b.sexo);
    });

    let pageAdded = false;
    categoriasOrdenadas.forEach((catData) => {
      if (options?.escolaFiltro && catData.atletasComEscola.length === 0) {
        return;
      }

      if (pageAdded) {
        doc.addPage();
      } else {
        pageAdded = true;
      }

      this.desenharPaginaSumula(
        doc,
        modalidade.nome,
        catData.categoria,
        catData.sexo,
        dataJogo,
        catData.atletasComEscola,
        options
      );
    });

    if (!pageAdded) {
      this.desenharPaginaSumula(
        doc,
        modalidade.nome,
        modalidade.categoriasPermitidas[0] || 'LIVRE',
        'MASCULINO',
        dataJogo,
        [],
        options
      );
    }

    aplicarRodapePaginado(doc, `JEGDS 2026 • Caderno de Súmulas • ${modalidade.nome}`);

    const prefixo = options?.escolaFiltro
      ? `SUMULA_${(options.escolaFiltro.sigla || options.escolaFiltro.nome).replace(/\s+/g, '_')}`
      : 'CADERNO_OFICIAL_SUMULAS';
    const nomeFormatado = modalidade.nome.toUpperCase().replace(/\s+/g, '_');
    doc.save(`${prefixo}_${nomeFormatado}_JEGDS2026.pdf`);
  }

  /**
   * Gera o LIVRO GERAL DE ARBITRAGEM organizado para fácil manuseio:
   *  - Página 1: Índice Geral por Escola (com página inicial exata de cada escola)
   *  - Sequência rigorosa: ESCOLA -> MODALIDADE -> FAIXA ETÁRIA (Mirim, Infantil, Infanto, Junior) -> NAIPE (Masc/Fem) -> ATLETAS (A-Z)
   *  - Termina 100% dos alunos/modalidades de uma escola antes de iniciar a escola seguinte.
   */
  public static async gerarCadernoGeralArbitragem(
    modalidadesCompletas: { modalidade: ModalidadeConfig; categoriasData: CategoriaSumulaData[] }[]
  ): Promise<void> {
    const doc = criarDocumentoA4('portrait');

    // 1. Reagrupar todos os atletas por ESCOLA -> MODALIDADE -> FAIXA ETÁRIA -> NAIPE
    type GrupoEscola = {
      escola: Escola;
      atletasUnicos: Set<string>;
      modalidadesMap: Map<
        string,
        {
          modalidade: ModalidadeConfig;
          ordemMod: number;
          categorias: Map<
            string,
            {
              categoria: string;
              sexo: string;
              atletasComEscola: { atleta: Atleta; escola: Escola; provas?: string[] }[];
            }
          >;
        }
      >;
    };

    const mapaEscolas = new Map<string, GrupoEscola>();

    modalidadesCompletas.forEach((modItem, modIdx) => {
      modItem.categoriasData.forEach((catData) => {
        catData.atletasComEscola.forEach((entry) => {
          const esc = entry.escola;
          const escKey = esc.id || esc.nome;

          if (!mapaEscolas.has(escKey)) {
            mapaEscolas.set(escKey, {
              escola: esc,
              atletasUnicos: new Set<string>(),
              modalidadesMap: new Map(),
            });
          }

          const grupoEsc = mapaEscolas.get(escKey)!;
          grupoEsc.atletasUnicos.add(entry.atleta.id);

          const modKey = modItem.modalidade.codigo || modItem.modalidade.nome;
          if (!grupoEsc.modalidadesMap.has(modKey)) {
            grupoEsc.modalidadesMap.set(modKey, {
              modalidade: modItem.modalidade,
              ordemMod: modIdx,
              categorias: new Map(),
            });
          }

          const grupoMod = grupoEsc.modalidadesMap.get(modKey)!;
          const catKey = `${catData.categoria}__${catData.sexo}`;
          if (!grupoMod.categorias.has(catKey)) {
            grupoMod.categorias.set(catKey, {
              categoria: catData.categoria,
              sexo: catData.sexo,
              atletasComEscola: [],
            });
          }

          const listaCat = grupoMod.categorias.get(catKey)!.atletasComEscola;
          if (!listaCat.some((x) => x.atleta.id === entry.atleta.id)) {
            listaCat.push(entry);
          }
        });
      });
    });

    // Ordenar escolas alfabeticamente
    const escolasOrdenadas = Array.from(mapaEscolas.values()).sort((a, b) =>
      a.escola.nome.localeCompare(b.escola.nome, 'pt-BR')
    );

    // Se não houver nenhum atleta inscrito, gera uma folha modelo limpa
    if (escolasOrdenadas.length === 0) {
      this.desenharPaginaSumula(doc, 'UNIVERSAL', 'LIVRE', 'MASC / FEM', '2026', [], { isModeloManual: true });
      aplicarRodapePaginado(doc, 'JEGDS 2026 • Livro Geral de Arbitragem');
      doc.save('LIVRO_GERAL_ARBITRAGEM_JEGDS2026.pdf');
      return;
    }

    // Reservar página(s) do Índice Geral (página 1; se houver > 26 escolas, usa 2 páginas)
    const maxLinhasIndicePag1 = 26;
    const paginasIndice = Math.max(1, Math.ceil(escolasOrdenadas.length / maxLinhasIndicePag1));
    for (let i = 1; i < paginasIndice; i++) {
      doc.addPage();
    }

    // 2. Renderizar todas as súmulas agrupadas por Escola -> Modalidade -> Faixa Etária -> Naipe
    const indiceRegistros: {
      numero: number;
      escola: Escola;
      totalAtletas: number;
      totalSumulas: number;
      modalidadesNomes: string[];
      paginaInicial: number;
    }[] = [];

    const contextosPorPagina: Record<number, string> = {};
    for (let p = 1; p <= paginasIndice; p++) {
      contextosPorPagina[p] = 'Índice Geral por Escola';
    }

    let totalSumulasGeral = 0;

    escolasOrdenadas.forEach((grupoEsc, idxEsc) => {
      const modalidadesDaEscola = Array.from(grupoEsc.modalidadesMap.values()).sort(
        (a, b) => a.ordemMod - b.ordemMod
      );

      let paginaInicialEscola = 0;
      let sumulasDaEscola = 0;
      const nomesMods: string[] = [];

      modalidadesDaEscola.forEach((grupoMod) => {
        nomesMods.push(grupoMod.modalidade.nome);
        const dataJogo = new Date(grupoMod.modalidade.dataEvento).toLocaleDateString('pt-BR');

        // Ordenar faixas etárias (Mirim -> Infantil -> Infanto -> Junior) e naipes (Masc -> Fem)
        const categoriasOrdenadas = Array.from(grupoMod.categorias.values()).sort((a, b) => {
          const diffCat = ordemCategoria(a.categoria) - ordemCategoria(b.categoria);
          if (diffCat !== 0) return diffCat;
          return ordemNaipe(a.sexo) - ordemNaipe(b.sexo);
        });

        categoriasOrdenadas.forEach((catObj) => {
          if (catObj.atletasComEscola.length === 0) return;

          doc.addPage();
          const pagAtual = doc.getNumberOfPages();
          const ehPrimeiraDaEscola = paginaInicialEscola === 0;
          if (ehPrimeiraDaEscola) {
            paginaInicialEscola = pagAtual;
          }

          sumulasDaEscola++;
          totalSumulasGeral++;

          const inicioPagAntes = pagAtual;

          this.desenharPaginaSumula(
            doc,
            grupoMod.modalidade.nome,
            catObj.categoria,
            catObj.sexo,
            dataJogo,
            catObj.atletasComEscola,
            {
              escolaFiltro: grupoEsc.escola,
              faixaSecaoEscola: ehPrimeiraDaEscola
                ? `ESCOLA ${(idxEsc + 1).toString().padStart(2, '0')} DE ${escolasOrdenadas.length.toString().padStart(2, '0')}  •  ${grupoEsc.escola.nome} (${grupoEsc.escola.sigla || 'SEMED'})  •  ${grupoEsc.atletasUnicos.size} ATLETAS`
                : undefined,
            }
          );

          const pagDepois = doc.getNumberOfPages();
          for (let p = inicioPagAntes; p <= pagDepois; p++) {
            contextosPorPagina[p] = `${grupoEsc.escola.sigla || grupoEsc.escola.nome} • ${grupoMod.modalidade.nome} (${catObj.categoria})`;
          }
        });
      });

      indiceRegistros.push({
        numero: idxEsc + 1,
        escola: grupoEsc.escola,
        totalAtletas: grupoEsc.atletasUnicos.size,
        totalSumulas: sumulasDaEscola,
        modalidadesNomes: nomesMods,
        paginaInicial: paginaInicialEscola,
      });
    });

    // 3. Preencher Capa / Índice Geral nas páginas iniciais reservadas
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    const dataEmissao = new Date().toLocaleDateString('pt-BR');
    const totalAtletasUnicosLivro = indiceRegistros.reduce((acc, r) => acc + r.totalAtletas, 0);

    for (let pagIdx = 0; pagIdx < paginasIndice; pagIdx++) {
      doc.setPage(pagIdx + 1);
      let y = 10;

      // Cabeçalho Institucional do Livro
      doc.setFillColor(...CORES_JEGD.primaria);
      doc.roundedRect(margin, y, contentWidth, 24, 1.8, 1.8, 'F');
      doc.setFillColor(...CORES_JEGD.destaqueOuro);
      doc.rect(margin, y + 23.1, contentWidth, 0.9, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('JEGDS 2026 • LIVRO GERAL DE ARBITRAGEM', pageWidth / 2, y + 8.5, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(245, 232, 234);
      doc.text(
        'PREFEITURA MUNICIPAL DE GONÇALVES DIAS - MA  •  SECRETARIA MUNICIPAL DE EDUCAÇÃO (SEMED)',
        pageWidth / 2,
        y + 14.5,
        { align: 'center' }
      );

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.6);
      doc.setTextColor(255, 240, 196);
      doc.text(
        'ORGANIZAÇÃO OFICIAL: POR ESCOLA  →  MODALIDADE  →  FAIXA ETÁRIA (MIRIM, INFANTIL, INFANTO, JUNIOR)',
        pageWidth / 2,
        y + 20.2,
        { align: 'center' }
      );

      y += 28;

      // Faixa de Resumo Consolidado (apenas na primeira página do índice)
      if (pagIdx === 0) {
        const cardW = (contentWidth - 9) / 4;
        const resumoCards = [
          { label: 'ESCOLAS NO LIVRO', valor: String(indiceRegistros.length) },
          { label: 'TOTAL DE ATLETAS', valor: String(totalAtletasUnicosLivro) },
          { label: 'TOTAL DE SÚMULAS', valor: String(totalSumulasGeral) },
          { label: 'DATA DE EMISSÃO', valor: dataEmissao },
        ];

        resumoCards.forEach((card, cIdx) => {
          const cx = margin + cIdx * (cardW + 3);
          doc.setFillColor(...CORES_JEGD.fundoCinza);
          doc.setDrawColor(...CORES_JEGD.borda);
          doc.setLineWidth(0.22);
          doc.roundedRect(cx, y, cardW, 13.5, 1.2, 1.2, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.2);
          doc.setTextColor(...CORES_JEGD.textoMuted);
          doc.text(card.label, cx + cardW / 2, y + 4.8, { align: 'center' });

          doc.setFontSize(10.5);
          doc.setTextColor(...CORES_JEGD.escuro);
          doc.text(card.valor, cx + cardW / 2, y + 10.8, { align: 'center' });
        });

        y += 18;
      }

      // Título da Tabela de Índice
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...CORES_JEGD.escuro);
      doc.text(
        pagIdx === 0 ? 'ÍNDICE GERAL POR ESCOLA (MANUSEIO RÁPIDO EM QUADRA)' : 'ÍNDICE GERAL POR ESCOLA (CONTINUAÇÃO)',
        margin,
        y
      );
      y += 3.5;

      // Colunas do Índice (soma = 190.0mm)
      const idxCols = [
        { key: 'num', label: 'Nº', x: margin + 0, w: 9, align: 'center' as const },
        { key: 'escola', label: 'ESCOLA / UNIDADE', x: margin + 9, w: 66, align: 'left' as const },
        { key: 'mods', label: 'MODALIDADES INSCRITAS', x: margin + 75, w: 66, align: 'left' as const },
        { key: 'atl', label: 'ATLETAS', x: margin + 141, w: 16, align: 'center' as const },
        { key: 'sum', label: 'SÚMULAS', x: margin + 157, w: 16, align: 'center' as const },
        { key: 'pag', label: 'PÁG.', x: margin + 173, w: 17, align: 'center' as const },
      ];

      // Cabeçalho da Tabela de Índice
      const thH = 7;
      doc.setFillColor(...CORES_JEGD.escuro);
      doc.rect(margin, y, contentWidth, thH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      idxCols.forEach((col, i) => {
        if (i > 0) {
          doc.setDrawColor(51, 65, 85);
          doc.setLineWidth(0.15);
          doc.line(col.x, y, col.x, y + thH);
        }
        if (col.align === 'center') {
          doc.text(col.label, col.x + col.w / 2, y + 4.7, { align: 'center' });
        } else {
          doc.text(col.label, col.x + 2.2, y + 4.7);
        }
      });
      y += thH;

      // Linhas do Índice desta página
      const sliceInicio = pagIdx * maxLinhasIndicePag1;
      const sliceFim = sliceInicio + maxLinhasIndicePag1;
      const itensPagina = indiceRegistros.slice(sliceInicio, sliceFim);

      itensPagina.forEach((reg, rIdx) => {
        const rowH = 7.4;
        if (rIdx % 2 === 1) {
          doc.setFillColor(...CORES_JEGD.fundoZebra);
          doc.rect(margin, y, contentWidth, rowH, 'F');
        } else {
          doc.setFillColor(255, 255, 255);
          doc.rect(margin, y, contentWidth, rowH, 'F');
        }

        doc.setDrawColor(...CORES_JEGD.bordaSuave);
        doc.setLineWidth(0.18);
        doc.rect(margin, y, contentWidth, rowH, 'S');
        idxCols.forEach((col, i) => {
          if (i > 0) doc.line(col.x, y, col.x, y + rowH);
        });

        const midY = y + 4.9;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(...CORES_JEGD.grafite);
        doc.text(reg.numero.toString().padStart(2, '0'), idxCols[0].x + idxCols[0].w / 2, midY, { align: 'center' });

        doc.setTextColor(...CORES_JEGD.escuro);
        doc.text(ajustarTexto(doc, reg.escola.nome.toUpperCase(), idxCols[1].w - 4), idxCols[1].x + 2.2, midY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.3);
        doc.setTextColor(...CORES_JEGD.grafite);
        doc.text(ajustarTexto(doc, reg.modalidadesNomes.join(', '), idxCols[2].w - 4), idxCols[2].x + 2.2, midY);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(...CORES_JEGD.escuro);
        doc.text(String(reg.totalAtletas), idxCols[3].x + idxCols[3].w / 2, midY, { align: 'center' });
        doc.text(String(reg.totalSumulas), idxCols[4].x + idxCols[4].w / 2, midY, { align: 'center' });

        doc.setTextColor(...CORES_JEGD.primaria);
        doc.text(`Pág. ${reg.paginaInicial}`, idxCols[5].x + idxCols[5].w / 2, midY, { align: 'center' });

        y += rowH;
      });
    }

    // 4. Aplicar rodapé numerado em todas as páginas
    aplicarRodapePaginado(doc, 'JEGDS 2026 • Livro Geral de Arbitragem', contextosPorPagina);

    doc.save('LIVRO_GERAL_ARBITRAGEM_JEGDS2026.pdf');
  }

  // ==============================================================
  // OPÇÃO 2: SÚMULAS POR ESCOLA (FILTRADAS)
  // ==============================================================

  /**
   * Gera a Súmula Individual isolada de uma única escola
   */
  public static async gerarSumulaEscolaIndividual(
    modalidadeNome: string,
    categoria: string,
    sexo: string,
    dataJogo: string,
    atletasComEscola: { atleta: Atleta; escola: Escola; provas?: string[] }[],
    escola: Escola
  ): Promise<void> {
    const doc = criarDocumentoA4('portrait');
    this.desenharPaginaSumula(
      doc,
      modalidadeNome,
      categoria,
      sexo,
      dataJogo,
      atletasComEscola,
      { escolaFiltro: escola }
    );
    aplicarRodapePaginado(doc, `JEGDS 2026 • ${escola.sigla || escola.nome} • ${modalidadeNome}`);
    const siglaSafe = (escola.sigla || escola.nome).replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Sumula_JEGDS_${siglaSafe}_${modalidadeNome.replace(/\s+/g, '_')}_${categoria}_${sexo}.pdf`);
  }

  /**
   * Gera o Caderno Completo de Súmulas da Escola (ordenado por Modalidade -> Faixa Etária -> Naipe)
   */
  public static async gerarCadernoSumulasEscola(
    escola: Escola,
    modalidadesCompletas: { modalidade: ModalidadeConfig; categoriasData: CategoriaSumulaData[] }[]
  ): Promise<void> {
    const doc = criarDocumentoA4('portrait');
    let isFirstPage = true;
    const contextosPorPagina: Record<number, string> = {};

    modalidadesCompletas.forEach((item) => {
      const dataJogo = new Date(item.modalidade.dataEvento).toLocaleDateString('pt-BR');
      const categoriasOrdenadas = [...item.categoriasData].sort((a, b) => {
        const diffCat = ordemCategoria(a.categoria) - ordemCategoria(b.categoria);
        if (diffCat !== 0) return diffCat;
        return ordemNaipe(a.sexo) - ordemNaipe(b.sexo);
      });

      categoriasOrdenadas.forEach((catData) => {
        if (catData.atletasComEscola.length === 0) return;

        if (!isFirstPage) {
          doc.addPage();
        } else {
          isFirstPage = false;
        }

        const pagAntes = doc.getNumberOfPages();
        this.desenharPaginaSumula(
          doc,
          item.modalidade.nome,
          catData.categoria,
          catData.sexo,
          dataJogo,
          catData.atletasComEscola,
          { escolaFiltro: escola }
        );
        const pagDepois = doc.getNumberOfPages();
        for (let p = pagAntes; p <= pagDepois; p++) {
          contextosPorPagina[p] = `${escola.sigla || escola.nome} • ${item.modalidade.nome} (${catData.categoria})`;
        }
      });
    });

    if (isFirstPage) {
      this.desenharPaginaSumula(
        doc,
        'MODALIDADE GERAL',
        'LIVRE',
        'MASC / FEM',
        '2026',
        [],
        { escolaFiltro: escola, isModeloManual: true }
      );
    }

    aplicarRodapePaginado(doc, `JEGDS 2026 • Caderno de Súmulas (${escola.sigla || escola.nome})`, contextosPorPagina);

    const siglaSafe = (escola.sigla || escola.nome).replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`CADERNO_SUMULAS_ESCOLA_${siglaSafe}_JEGDS2026.pdf`);
  }

  // ==============================================================
  // OPÇÃO 3: SÚMULA MODELO MANUAL (EM BRANCO)
  // ==============================================================

  /**
   * Gera o Modelo Oficial Universal em Branco (Qualquer Modalidade / Qualquer Categoria)
   */
  public static async gerarModeloManualUniversal(): Promise<void> {
    const doc = criarDocumentoA4('portrait');
    this.desenharPaginaSumula(
      doc,
      'UNIVERSAL (REGISTRO MANUAL EM QUADRA)',
      'LIVRE',
      'MASC / FEM',
      '____/____/2026',
      [],
      { isModeloManual: true }
    );
    aplicarRodapePaginado(doc, 'JEGDS 2026 • Modelo Oficial de Súmula Manual');
    doc.save('MODELO_OFICIAL_SUMULA_MANUAL_JEGDS2026_UNIVERSAL.pdf');
  }

  /**
   * Gera o Modelo Oficial em Branco pré-configurado para uma Modalidade específica
   */
  public static async gerarModeloManualModalidade(
    modalidadeNome: string,
    categoria: string = 'LIVRE',
    sexo: string = 'MASC / FEM',
    dataJogo: string = '____/____/2026'
  ): Promise<void> {
    const doc = criarDocumentoA4('portrait');
    this.desenharPaginaSumula(
      doc,
      modalidadeNome,
      categoria,
      sexo,
      dataJogo,
      [],
      { isModeloManual: true }
    );
    aplicarRodapePaginado(doc, `JEGDS 2026 • Súmula Manual • ${modalidadeNome}`);
    const modSafe = modalidadeNome.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`MODELO_MANUAL_SUMULA_${modSafe}_JEGDS2026.pdf`);
  }
}
