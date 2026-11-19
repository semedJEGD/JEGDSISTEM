import { jsPDF } from 'jspdf';
import { Escola, Atleta, ModalidadeConfig } from '@/types/jegd';
import { criarDocumentoA4, CORES_JEGD, abrirPdfNovaGuia } from './pdf-types';

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

type TipoLayoutModalidade = 'FUTSAL' | 'FUTEBOL' | 'BEACH' | 'VOLEI' | 'TENIS_MESA' | 'QUEIMADA' | 'ATLETISMO' | 'XADREZ';

function detectarTipoModalidade(modalidadeNome: string): TipoLayoutModalidade {
  const n = (modalidadeNome || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (n.includes('futsal')) return 'FUTSAL';
  if (n.includes('beach')) return 'BEACH';
  if (n.includes('futebol')) return 'FUTEBOL';
  if (n.includes('volei') || n.includes('voleibol')) return 'VOLEI';
  if (n.includes('tenis')) return 'TENIS_MESA';
  if (n.includes('queimada')) return 'QUEIMADA';
  if (n.includes('atletismo')) return 'ATLETISMO';
  if (n.includes('xadrez')) return 'XADREZ';
  return 'FUTSAL';
}

function obterRegraRapidaModalidade(tipo: TipoLayoutModalidade, categoria: string): string {
  const cat = (categoria || '').toUpperCase();
  switch (tipo) {
    case 'FUTSAL':
      return cat === 'MIRIM'
        ? 'Regulamento: 2x10 min (cron. parado) • Obrigatorio 1/4 do jogo (Mirim/Infantil) • Vit. 3 / Emp. 1 / Der. 0 • W.O.: 15 min (1x0)'
        : 'Regulamento: 2x15 min (cron. parado) • Obrigatorio 1/4 do jogo (Infantil) • Vit. 3 / Emp. 1 / Der. 0 • W.O.: 15 min (1x0)';
    case 'FUTEBOL':
      return cat === 'MIRIM' || cat === 'INFANTIL'
        ? 'Regulamento: 2x20 min (cron. corrido, s/ intervalo) • Ate 20 inscritos • Vit. 3 / Emp. 1 / Der. 0 • W.O.: 15 min (1x0)'
        : 'Regulamento: 2x30 min (cron. corrido, s/ intervalo) • Ate 20 inscritos • Vit. 3 / Emp. 1 / Der. 0 • W.O.: 15 min (1x0)';
    case 'BEACH':
      return 'Regulamento: 3 periodos de 12 min (int. 3 min) • 5 em campo • Sem empate (Pror. 3 min + Penaltis) • Pts: 3/2/1 • W.O.: 15 min';
    case 'VOLEI':
      return 'Regulamento: Classif. melhor de 3 sets (25/25/15) | Semi/Final melhor de 5 • Sem libero • Rede: 2,20m (F) / 2,35m (M) • W.O.: 2x0 / 3x0';
    case 'TENIS_MESA':
      return 'Regulamento (ITTF/CBTM): Sets de 11 pts (dif. 2) • Classif.: melhor de 3 sets | Eliminatorias: melhor de 5 sets • W.O. elimina do grupo';
    case 'QUEIMADA':
      return 'Regulamento: 8 atletas em campo • Queimado: bola atinge o corpo e toca o chao s/ dominio, ou sair da quadra • W.O.: 15 min';
    case 'ATLETISMO':
      return 'Regulamento: Confirmacao obrigatoria na Cabine • Ate 2 atletas/escola por prova e 2 provas/atleta • DNS=nao largou | DNF=nao concluiu | DQ=descl.';
    case 'XADREZ':
      return 'Regulamento (FIDE): Resultado 1-0 (Brancas), 1/2-1/2 (Empate), 0-1 (Pretas) • Xadrez rapido dispensa anotacao de lances';
  }
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
    const tipoMod = detectarTipoModalidade(modalidadeNome);
    const futsalComUmQuarto = tipoMod === 'FUTSAL' && (categoria.toUpperCase() === 'MIRIM' || categoria.toUpperCase() === 'INFANTIL');

    let currentY = 8;

    // ============================================================
    // 0. FAIXA DE SEÇÃO DA ESCOLA (QUANDO INÍCIO DE ESCOLA NO LIVRO)
    // ============================================================
    if (options?.faixaSecaoEscola) {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(...CORES_JEGD.borda);
      doc.setLineWidth(0.25);
      doc.roundedRect(margin, currentY, contentWidth, 6, 1, 1, 'FD');

      doc.setFillColor(...CORES_JEGD.secundaria);
      doc.rect(margin, currentY, 2.2, 6, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(...CORES_JEGD.escuro);
      doc.text(ajustarTexto(doc, options.faixaSecaoEscola.toUpperCase(), contentWidth - 8), margin + 5, currentY + 4.1);
      currentY += 7.5;
    }

    // ============================================================
    // 1. CABEÇALHO OFICIAL DE SÚMULA
    // ============================================================
    const headerH = 19.5;
    doc.setFillColor(...CORES_JEGD.primaria);
    doc.roundedRect(margin, currentY, contentWidth, headerH, 1.5, 1.5, 'F');
    doc.setFillColor(...CORES_JEGD.destaqueOuro);
    doc.rect(margin, currentY + headerH - 0.8, contentWidth, 0.8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10.2);
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
    doc.text(ajustarTexto(doc, tituloHeader, contentWidth - 10), pageWidth / 2, currentY + 6.2, { align: 'center' });

    doc.setFontSize(7.0);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(245, 232, 234);
    doc.text(
      'PREFEITURA DE GONÇALVES DIAS - MA  •  SECRETARIA MUNICIPAL DE EDUCAÇÃO (SEMED)  •  COMITÊ TÉCNICO',
      pageWidth / 2,
      currentY + 11.4,
      { align: 'center' }
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.4);
    doc.setTextColor(255, 255, 255);
    let infoLinha = `MODALIDADE: ${modalidadeNome.toUpperCase()}  •  FAIXA ETÁRIA: ${formatarFaixaEtaria(categoria)}  •  NAIPE: ${sexo.toUpperCase()}  •  DATA: ${dataJogo}`;
    if (isManual && (!modalidadeNome || modalidadeNome.toUpperCase().includes('UNIVERSAL') || modalidadeNome.toUpperCase().includes('GERAL'))) {
      infoLinha = 'MODALIDADE: ______________________  •  FAIXA ETÁRIA: _______________  •  NAIPE: ( ) MASC  ( ) FEM  •  DATA: ___/___/2026';
    }
    doc.text(ajustarTexto(doc, infoLinha, contentWidth - 8), pageWidth / 2, currentY + 16.6, { align: 'center' });

    currentY += headerH + 2;

    // ============================================================
    // 1.5. FAIXA OPERACIONAL DA PARTIDA + REGRA RÁPIDA (PRÁTICO NA MESA)
    // ============================================================
    const metaBoxH = 10.5;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...CORES_JEGD.borda);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, currentY, contentWidth, metaBoxH, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(...CORES_JEGD.escuro);
    doc.text('JOGO Nº:', margin + 3, currentY + 4);
    doc.setDrawColor(...CORES_JEGD.borda);
    doc.line(margin + 15.5, currentY + 4.3, margin + 27, currentY + 4.3);

    doc.text('FASE / GRUPO:', margin + 30, currentY + 4);
    doc.line(margin + 49, currentY + 4.3, margin + 84, currentY + 4.3);

    doc.text('QUADRA / LOCAL:', margin + 87, currentY + 4);
    doc.line(margin + 109.5, currentY + 4.3, margin + 143, currentY + 4.3);

    doc.text('INÍCIO:', margin + 146, currentY + 4);
    doc.line(margin + 156, currentY + 4.3, margin + 167.5, currentY + 4.3);

    doc.text('TÉRM.:', margin + 170, currentY + 4);
    doc.line(margin + 179.5, currentY + 4.3, rightEdge - 2.5, currentY + 4.3);

    // Faixa inferior com regra rápida do regulamento da modalidade
    doc.setFillColor(248, 250, 252);
    doc.rect(margin + 0.2, currentY + 5.6, contentWidth - 0.4, 4.7, 'F');
    doc.setDrawColor(...CORES_JEGD.bordaSuave);
    doc.line(margin, currentY + 5.6, rightEdge, currentY + 5.6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.9);
    doc.setTextColor(...CORES_JEGD.grafite);
    doc.text(
      ajustarTexto(doc, obterRegraRapidaModalidade(tipoMod, categoria), contentWidth - 6),
      pageWidth / 2,
      currentY + 9,
      { align: 'center' }
    );

    currentY += metaBoxH + 2;

    // ============================================================
    // 2. QUADRO DO CONFRONTO & PLACAR ADAPTADO À MODALIDADE
    // ============================================================
    const centerX = pageWidth / 2;
    const isIndividual = tipoMod === 'ATLETISMO' || tipoMod === 'XADREZ';
    const boxConfrontoH = isIndividual ? 9.5 : 14.5;

    doc.setFillColor(...CORES_JEGD.fundoCinza);
    doc.setDrawColor(...CORES_JEGD.borda);
    doc.setLineWidth(0.25);
    doc.roundedRect(margin, currentY, contentWidth, boxConfrontoH, 1.2, 1.2, 'FD');

    if (isIndividual) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...CORES_JEGD.escuro);
      if (tipoMod === 'ATLETISMO') {
        doc.text('PROVA / SÉRIE:', margin + 3.5, currentY + 6);
        doc.setDrawColor(...CORES_JEGD.grafite);
        doc.line(margin + 25, currentY + 6.3, margin + 92, currentY + 6.3);
        doc.text('ETAPA:', margin + 96, currentY + 6);
        doc.setFont('helvetica', 'normal');
        doc.text('( ) Eliminatória   ( ) Semifinal   ( ) Final', margin + 107, currentY + 6);
        doc.setFont('helvetica', 'bold');
        doc.text('CRON.:', margin + 158, currentY + 6);
        doc.setFont('helvetica', 'normal');
        doc.text('( ) Man.  ( ) Elet.', margin + 169, currentY + 6);
      } else {
        doc.text('RODADA Nº:', margin + 3.5, currentY + 6);
        doc.setDrawColor(...CORES_JEGD.grafite);
        doc.line(margin + 21, currentY + 6.3, margin + 36, currentY + 6.3);
        doc.text('MODALIDADE:', margin + 40, currentY + 6);
        doc.setFont('helvetica', 'normal');
        doc.text('( ) Xadrez Clássico   ( ) Xadrez Rápido', margin + 60, currentY + 6);
        doc.setFont('helvetica', 'bold');
        doc.text('RITMO / TEMPO:', margin + 122, currentY + 6);
        doc.line(margin + 146, currentY + 6.3, rightEdge - 3.5, currentY + 6.3);
      }
    } else {
      doc.setTextColor(...CORES_JEGD.escuro);
      doc.setFontSize(7.3);
      doc.setFont('helvetica', 'bold');

      // Equipe A (esquerda)
      doc.text('EQUIPE A:', margin + 3.5, currentY + 5.5);
      if (escolaFiltro) {
        doc.setTextColor(...CORES_JEGD.primaria);
        doc.text(
          ajustarTexto(doc, (escolaFiltro.sigla || escolaFiltro.nome).toUpperCase(), 58),
          margin + 19,
          currentY + 5.5
        );
        doc.setTextColor(...CORES_JEGD.escuro);
      } else {
        doc.setDrawColor(...CORES_JEGD.grafite);
        doc.setLineWidth(0.2);
        doc.line(margin + 19, currentY + 5.8, margin + 76, currentY + 5.8);
      }

      // Placar Central (vetorial)
      doc.setDrawColor(...CORES_JEGD.borda);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(centerX - 16, currentY + 1.9, 11, 4.8, 0.8, 0.8, 'FD');
      doc.roundedRect(centerX + 5, currentY + 1.9, 11, 4.8, 0.8, 0.8, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...CORES_JEGD.escuro);
      doc.text('X', centerX, currentY + 5.3, { align: 'center' });

      // Equipe B (direita)
      doc.setFontSize(7.3);
      doc.text('EQUIPE B:', centerX + 20, currentY + 5.5);
      doc.setDrawColor(...CORES_JEGD.grafite);
      doc.setLineWidth(0.2);
      doc.line(centerX + 36, currentY + 5.8, rightEdge - 3.5, currentY + 5.8);

      // Linha divisória suave interna
      doc.setDrawColor(...CORES_JEGD.bordaSuave);
      doc.setLineWidth(0.15);
      doc.line(margin + 3, currentY + 8.3, rightEdge - 3, currentY + 8.3);

      // Placares Parciais adaptados à modalidade
      doc.setFontSize(6.3);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...CORES_JEGD.grafite);
      let textoParciais = '1º TEMPO: [    ] x [    ]    |    2º TEMPO: [    ] x [    ]    |    PRORROGAÇÃO: [    ] x [    ]    |    PÊNALTIS: [    ] x [    ]';
      if (tipoMod === 'BEACH') {
        textoParciais = '1º PER.: [   ] x [   ]  |  2º PER.: [   ] x [   ]  |  3º PER.: [   ] x [   ]  |  PROR.: [   ] x [   ]  |  PÊNALTIS: [   ] x [   ]';
      } else if (tipoMod === 'VOLEI' || tipoMod === 'TENIS_MESA') {
        textoParciais = '1º SET: [   ] x [   ]  |  2º SET: [   ] x [   ]  |  3º SET: [   ] x [   ]  |  4º SET: [   ] x [   ]  |  5º SET: [   ] x [   ]';
      } else if (tipoMod === 'QUEIMADA') {
        textoParciais = '1º PER.: [   ] x [   ]   |   2º PER.: [   ] x [   ]   |   3º PER.: [   ] x [   ]   |   RESTANTES FINAL: A [   ]  x  B [   ]';
      }
      doc.text(textoParciais, centerX, currentY + 12.4, { align: 'center' });
    }

    currentY += boxConfrontoH + 2.5;

    // ============================================================
    // 3. DEFINIÇÃO MATEMÁTICA EXATA DAS COLUNAS POR MODALIDADE (SOMA = 190.0mm)
    // ============================================================
    type ColDef = {
      key: string;
      label: string;
      x: number;
      w: number;
      align?: 'left' | 'center';
    };

    const montarColunas = (): ColDef[] => {
      if (tipoMod === 'ATLETISMO') {
        return [
          { key: 'num', label: 'Nº', x: margin + 0, w: 8, align: 'center' },
          { key: 'peito', label: 'PEITO', x: margin + 8, w: 12, align: 'center' },
          { key: 'nome', label: 'NOME DO ESTUDANTE-ATLETA', x: margin + 20, w: 54, align: 'left' },
          { key: 'provas', label: 'PROVA(S) INSCRITAS', x: margin + 74, w: 34, align: 'left' },
          { key: 'doc', label: 'DOCUMENTO', x: margin + 108, w: 25, align: 'left' },
          { key: 'raia', label: 'RAIA', x: margin + 133, w: 10, align: 'center' },
          { key: 'marca', label: 'TEMPO / MARCA', x: margin + 143, w: 20, align: 'center' },
          { key: 'classif', label: 'CLASS.', x: margin + 163, w: 11, align: 'center' },
          { key: 'rubrica', label: 'CHECK', x: margin + 174, w: 16, align: 'center' },
        ];
      }

      if (tipoMod === 'XADREZ') {
        return [
          { key: 'num', label: 'Nº', x: margin + 0, w: 8, align: 'center' },
          { key: 'mesa', label: 'MESA', x: margin + 8, w: 11, align: 'center' },
          { key: 'nome', label: 'NOME DO ESTUDANTE-ATLETA', x: margin + 19, w: 62, align: 'left' },
          { key: 'doc', label: 'DOCUMENTO (CPF/RG)', x: margin + 81, w: 27, align: 'left' },
          { key: 'r1', label: 'R1', x: margin + 108, w: 10, align: 'center' },
          { key: 'r2', label: 'R2', x: margin + 118, w: 10, align: 'center' },
          { key: 'r3', label: 'R3', x: margin + 128, w: 10, align: 'center' },
          { key: 'r4', label: 'R4', x: margin + 138, w: 10, align: 'center' },
          { key: 'pts', label: 'PTS', x: margin + 148, w: 13, align: 'center' },
          { key: 'rubrica', label: 'RUBRICA / CHECK', x: margin + 161, w: 29, align: 'center' },
        ];
      }

      if (tipoMod === 'VOLEI' || tipoMod === 'TENIS_MESA') {
        return [
          { key: 'num', label: 'Nº', x: margin + 0, w: 9, align: 'center' },
          { key: 'camisa', label: tipoMod === 'VOLEI' ? 'CAM.' : 'MESA', x: margin + 9, w: 13, align: 'center' },
          { key: 'nome', label: 'NOME DO ESTUDANTE-ATLETA', x: margin + 22, w: 86, align: 'left' },
          { key: 'doc', label: 'DOCUMENTO (CPF/RG)', x: margin + 108, w: 32, align: 'left' },
          { key: 'cap', label: tipoMod === 'VOLEI' ? 'CAP.' : 'SAQ.', x: margin + 140, w: 12, align: 'center' },
          { key: 'rubrica', label: 'RUBRICA / CHECK-IN', x: margin + 152, w: 38, align: 'center' },
        ];
      }

      if (tipoMod === 'QUEIMADA') {
        return [
          { key: 'num', label: 'Nº', x: margin + 0, w: 9, align: 'center' },
          { key: 'camisa', label: 'CAM.', x: margin + 9, w: 12, align: 'center' },
          { key: 'nome', label: 'NOME DO ESTUDANTE-ATLETA', x: margin + 21, w: 78, align: 'left' },
          { key: 'doc', label: 'DOCUMENTO (CPF/RG)', x: margin + 99, w: 30, align: 'left' },
          { key: 'cap', label: 'T / R', x: margin + 129, w: 12, align: 'center' },
          { key: 'queimado', label: 'QUEIM.', x: margin + 141, w: 14, align: 'center' },
          { key: 'rubrica', label: 'RUBRICA / CHECK-IN', x: margin + 155, w: 35, align: 'center' },
        ];
      }

      // FUTSAL (Mirim/Infantil com coluna 1/4 do jogo)
      if (futsalComUmQuarto && ocultarColunaEscola) {
        return [
          { key: 'num', label: 'Nº', x: margin + 0, w: 7.5, align: 'center' },
          { key: 'camisa', label: 'CAM.', x: margin + 7.5, w: 10.5, align: 'center' },
          { key: 'nome', label: 'NOME DO ESTUDANTE-ATLETA', x: margin + 18, w: 57, align: 'left' },
          { key: 'doc', label: 'DOCUMENTO (CPF/RG)', x: margin + 75, w: 26, align: 'left' },
          { key: 'quarto', label: '1/4', x: margin + 101, w: 9, align: 'center' },
          { key: 'pontos', label: 'GOLS', x: margin + 110, w: 16, align: 'center' },
          { key: 'faltas', label: 'FALTAS', x: margin + 126, w: 17, align: 'center' },
          { key: 'ca', label: 'C.A.', x: margin + 143, w: 7.5, align: 'center' },
          { key: 'cv', label: 'C.V.', x: margin + 150.5, w: 7.5, align: 'center' },
          { key: 'rubrica', label: 'RUBRICA / CHECK-IN', x: margin + 158, w: 32, align: 'center' },
        ];
      }

      // COLETIVOS PADRÃO (Futsal Infanto/Junior, Futebol de Campo, Beach Soccer)
      return ocultarColunaEscola
        ? [
            { key: 'num', label: 'Nº', x: margin + 0, w: 8, align: 'center' },
            { key: 'camisa', label: 'CAM.', x: margin + 8, w: 11, align: 'center' },
            { key: 'nome', label: 'NOME DO ESTUDANTE-ATLETA', x: margin + 19, w: 64, align: 'left' },
            { key: 'doc', label: 'DOCUMENTO (CPF/RG)', x: margin + 83, w: 27, align: 'left' },
            { key: 'pontos', label: 'GOLS', x: margin + 110, w: 18, align: 'center' },
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
            { key: 'pontos', label: 'GOLS', x: margin + 115, w: 16, align: 'center' },
            { key: 'faltas', label: 'FALTAS', x: margin + 131, w: 16.5, align: 'center' },
            { key: 'ca', label: 'C.A.', x: margin + 147.5, w: 7, align: 'center' },
            { key: 'cv', label: 'C.V.', x: margin + 154.5, w: 7, align: 'center' },
            { key: 'rubrica', label: 'RUBRICA / CHECK', x: margin + 161.5, w: 28.5, align: 'center' },
          ];
    };

    const colunas = montarColunas();
    const colMap = Object.fromEntries(colunas.map((c) => [c.key, c]));

    const desenharCabecalhoTabela = () => {
      const thH = 6.8;
      doc.setFillColor(...CORES_JEGD.escuro);
      doc.rect(margin, currentY, contentWidth, thH, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6.2);
      doc.setFont('helvetica', 'bold');

      colunas.forEach((col, idx) => {
        if (idx > 0) {
          doc.setDrawColor(51, 65, 85);
          doc.setLineWidth(0.15);
          doc.line(col.x, currentY, col.x, currentY + thH);
        }
        if (col.align === 'center') {
          doc.text(col.label, col.x + col.w / 2, currentY + 4.5, { align: 'center' });
        } else {
          doc.text(col.label, col.x + 2, currentY + 4.5);
        }
      });

      currentY += thH;
    };

    const desenharLinha = (
      index: number,
      nome: string = '',
      escolaStr: string = '',
      docStr: string = '',
      provasStr: string = '',
      presente: boolean = false
    ) => {
      const rowH = 6.4;

      if (index % 2 === 1) {
        doc.setFillColor(...CORES_JEGD.fundoZebra);
        doc.rect(margin, currentY, contentWidth, rowH, 'F');
      } else {
        doc.setFillColor(255, 255, 255);
        doc.rect(margin, currentY, contentWidth, rowH, 'F');
      }

      doc.setDrawColor(...CORES_JEGD.bordaSuave);
      doc.setLineWidth(0.18);
      doc.rect(margin, currentY, contentWidth, rowH, 'S');
      colunas.forEach((col, idx) => {
        if (idx > 0) {
          doc.line(col.x, currentY, col.x, currentY + rowH);
        }
      });

      const midY = currentY + 4.3;

      // Nº
      if (colMap.num) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.4);
        doc.setTextColor(...CORES_JEGD.grafite);
        doc.text((index + 1).toString().padStart(2, '0'), colMap.num.x + colMap.num.w / 2, midY, { align: 'center' });
      }

      // Caixa de Camisa / Peito / Mesa
      const boxCol = colMap.camisa || colMap.peito || colMap.mesa;
      if (boxCol) {
        doc.setDrawColor(...CORES_JEGD.borda);
        doc.setLineWidth(0.2);
        const bw = Math.min(boxCol.w - 4, 7);
        const bh = 3.8;
        doc.rect(boxCol.x + (boxCol.w - bw) / 2, currentY + (rowH - bh) / 2, bw, bh, 'S');
      }

      // Nome
      if (colMap.nome && nome) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.4);
        doc.setTextColor(...CORES_JEGD.escuro);
        doc.text(ajustarTexto(doc, nome, colMap.nome.w - 3.5), colMap.nome.x + 2, midY);
      }

      // Provas (Atletismo)
      if (colMap.provas && provasStr) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.0);
        doc.setTextColor(...CORES_JEGD.primaria);
        doc.text(ajustarTexto(doc, provasStr, colMap.provas.w - 3), colMap.provas.x + 1.8, midY);
      }

      // Escola (se tabela mista)
      if (!ocultarColunaEscola && colMap.escola && escolaStr) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.1);
        doc.setTextColor(...CORES_JEGD.grafite);
        doc.text(ajustarTexto(doc, escolaStr, colMap.escola.w - 3), colMap.escola.x + 1.8, midY);
      }

      // Documento (CPF/RG completo)
      if (colMap.doc && docStr) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.2);
        doc.setTextColor(...CORES_JEGD.grafite);
        doc.text(ajustarTexto(doc, docStr, colMap.doc.w - 3), colMap.doc.x + 1.8, midY);
      }

      // Checkbox 1/4 do jogo (Futsal Mirim/Infantil)
      if (colMap.quarto) {
        doc.setDrawColor(...CORES_JEGD.borda);
        doc.setLineWidth(0.2);
        doc.rect(colMap.quarto.x + (colMap.quarto.w - 3.4) / 2, currentY + (rowH - 3.4) / 2, 3.4, 3.4, 'S');
      }

      // Checkbox Cap / T-R / Queimado
      if (colMap.cap) {
        doc.setDrawColor(...CORES_JEGD.borda);
        doc.setLineWidth(0.2);
        doc.rect(colMap.cap.x + (colMap.cap.w - 4.5) / 2, currentY + (rowH - 3.6) / 2, 4.5, 3.6, 'S');
      }
      if (colMap.queimado) {
        doc.setDrawColor(...CORES_JEGD.borda);
        doc.setLineWidth(0.2);
        doc.rect(colMap.queimado.x + (colMap.queimado.w - 3.6) / 2, currentY + (rowH - 3.6) / 2, 3.6, 3.6, 'S');
      }

      // Pontos / Gols
      if (colMap.pontos) {
        doc.setDrawColor(...CORES_JEGD.borda);
        doc.setLineWidth(0.2);
        const ptsBoxW = colMap.pontos.w - 4.5;
        doc.rect(colMap.pontos.x + (colMap.pontos.w - ptsBoxW) / 2, currentY + (rowH - 3.8) / 2, ptsBoxW, 3.8, 'S');
      }

      // Faltas (5 quadrados)
      if (colMap.faltas) {
        doc.setDrawColor(...CORES_JEGD.borda);
        doc.setLineWidth(0.18);
        const fBoxW = 2.3;
        const fGap = 0.55;
        const totalFaltasW = 5 * fBoxW + 4 * fGap;
        const fStartX = colMap.faltas.x + (colMap.faltas.w - totalFaltasW) / 2;
        for (let f = 0; f < 5; f++) {
          doc.rect(fStartX + f * (fBoxW + fGap), currentY + (rowH - 3.6) / 2, fBoxW, 3.6, 'S');
        }
      }

      // C.A. e C.V.
      if (colMap.ca && colMap.cv) {
        doc.setDrawColor(...CORES_JEGD.borda);
        doc.setLineWidth(0.2);
        const cardBox = 3.5;
        doc.rect(colMap.ca.x + (colMap.ca.w - cardBox) / 2, currentY + (rowH - cardBox) / 2, cardBox, cardBox, 'S');
        doc.rect(colMap.cv.x + (colMap.cv.w - cardBox) / 2, currentY + (rowH - cardBox) / 2, cardBox, cardBox, 'S');
      }

      // Rubrica / Check-in
      if (colMap.rubrica) {
        const rubX = colMap.rubrica.x;
        const rubW = colMap.rubrica.w;
        const chkSize = 3.2;
        doc.setDrawColor(...CORES_JEGD.borda);
        doc.setLineWidth(0.2);

        if (rubW <= 18) {
          // Modo compacto (Atletismo): apenas checkbox centralizado
          const cx = rubX + (rubW - chkSize) / 2;
          const cy = currentY + (rowH - chkSize) / 2;
          doc.rect(cx, cy, chkSize, chkSize, 'S');
        } else {
          const chkX = rubX + 2.2;
          const chkY = currentY + (rowH - chkSize) / 2;
          doc.rect(chkX, chkY, chkSize, chkSize, 'S');
          if (presente) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6);
            doc.setTextColor(...CORES_JEGD.secundaria);
            doc.text('X', chkX + chkSize / 2, chkY + 2.4, { align: 'center' });
          }
          doc.line(chkX + chkSize + 1.8, currentY + rowH - 1.5, rubX + rubW - 2.2, currentY + rowH - 1.5);
        }
      }

      currentY += rowH;
    };

    desenharCabecalhoTabela();

    // Limite inferior para reservar espaço confortável para Técnico + W.O./Ocorrências + Assinaturas + Rodapé
    const limiteTabelaY = pageHeight - 69;

    if (isManual || atletasComEscola.length === 0) {
      const totalLinhasManual = 18;
      const escolaNomePreenchido = escolaFiltro ? (escolaFiltro.sigla || escolaFiltro.nome) : '';
      for (let i = 0; i < totalLinhasManual; i++) {
        if (currentY + 6.4 > limiteTabelaY) break;
        desenharLinha(i, '', escolaNomePreenchido, '', '');
      }
    } else {
      const atletasOrdenadosSumula = [...atletasComEscola].sort((a, b) =>
        a.atleta.nomeCompleto.localeCompare(b.atleta.nomeCompleto, 'pt-BR')
      );

      atletasOrdenadosSumula.forEach((item, index) => {
        if (currentY + 6.4 > limiteTabelaY) {
          doc.addPage();
          currentY = 12;

          doc.setFillColor(248, 250, 252);
          doc.setDrawColor(...CORES_JEGD.borda);
          doc.setLineWidth(0.2);
          doc.roundedRect(margin, currentY, contentWidth, 7, 1, 1, 'FD');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.1);
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

        const provasStr =
          item.provas && item.provas.length > 0
            ? item.provas.join(', ')
            : item.atleta.modalidadesInscritas
                ?.flatMap((m) => m.provas || [])
                .join(', ') || '';

        desenharLinha(
          index,
          item.atleta.nomeCompleto.toUpperCase(),
          item.escola.sigla || item.escola.nome,
          docExibicao,
          provasStr
        );
      });

      const totalAtual = atletasOrdenadosSumula.length;
      const metaLinhas = escolaFiltro ? Math.min(Math.max(totalAtual + 2, 12), totalAtual + 4) : totalAtual;
      const escolaNomeExtra = escolaFiltro ? (escolaFiltro.sigla || escolaFiltro.nome) : '';

      for (let j = totalAtual; j < metaLinhas; j++) {
        if (currentY + 6.4 > limiteTabelaY) break;
        desenharLinha(j, '', escolaNomeExtra, '', '');
      }
    }

    // ============================================================
    // 4. LINHA COMPACTA DE COMISSÃO TÉCNICA
    // ============================================================
    const tecY = Math.max(currentY + 2.5, pageHeight - 66);
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...CORES_JEGD.borda);
    doc.setLineWidth(0.2);
    doc.roundedRect(margin, tecY, contentWidth, 6.8, 1, 1, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(...CORES_JEGD.escuro);
    doc.text('TÉCNICO / PROFESSOR RESPONSÁVEL:', margin + 3, tecY + 4.5);
    doc.setDrawColor(...CORES_JEGD.borda);
    doc.line(margin + 51, tecY + 4.8, margin + 128, tecY + 4.8);

    doc.text('DOC. (RG/CPF):', margin + 132, tecY + 4.5);
    doc.line(margin + 153, tecY + 4.8, rightEdge - 3, tecY + 4.8);

    // ============================================================
    // 5. QUADRO DE W.O., IRREGULARIDADES, PROTESTO & OBSERVAÇÕES
    // ============================================================
    const obsY = tecY + 8.5;
    const obsH = 19.5;
    doc.setFillColor(...CORES_JEGD.fundoCinza);
    doc.setDrawColor(...CORES_JEGD.borda);
    doc.setLineWidth(0.25);
    doc.roundedRect(margin, obsY, contentWidth, obsH, 1.2, 1.2, 'FD');

    // Linha de checkboxes rápidos (praticidade em quadra!)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.1);
    doc.setTextColor(...CORES_JEGD.escuro);
    doc.text('REGISTROS RÁPIDOS:', margin + 3.5, obsY + 4.3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.0);
    doc.setTextColor(...CORES_JEGD.grafite);
    doc.text(
      '( ) W.O. Equipe A     ( ) W.O. Equipe B     ( ) Duplo W.O.     ( ) Atleta s/ doc.     ( ) Uniforme irreg.     ( ) Intenção de protesto',
      margin + 31,
      obsY + 4.3
    );

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.9);
    doc.setTextColor(...CORES_JEGD.escuro);
    doc.text('RELATÓRIO / OCORRÊNCIAS:', margin + 3.5, obsY + 9.0);

    doc.setDrawColor(...CORES_JEGD.borda);
    doc.setLineWidth(0.2);
    doc.line(margin + 39, obsY + 9.2, rightEdge - 3.5, obsY + 9.2);
    doc.line(margin + 3.5, obsY + 13.5, rightEdge - 3.5, obsY + 13.5);
    doc.line(margin + 3.5, obsY + 17.5, rightEdge - 3.5, obsY + 17.5);

    // ============================================================
    // 6. ASSINATURAS (ARBITRAGEM + CAPITÃES/REPRESENTANTES + CIÊNCIA)
    // ============================================================
    const signY = obsY + obsH + 10.5;
    const colSW = (contentWidth - 9) / 4;

    const assinantes = [
      { cargo: 'Árbitro Principal', sub: 'Nome legível e assinatura' },
      { cargo: 'Auxiliar / Mesa', sub: 'Apontador / Cronometrista' },
      { cargo: 'Cap. / Rep. Equipe A', sub: 'Ciência do resultado' },
      { cargo: 'Cap. / Rep. Equipe B', sub: 'Ciência do resultado' },
    ];

    assinantes.forEach((itemAss, idx) => {
      const sX = margin + idx * (colSW + 3);
      doc.setDrawColor(...CORES_JEGD.grafite);
      doc.setLineWidth(0.25);
      doc.line(sX + 2, signY, sX + colSW - 2, signY);

      doc.setFontSize(6.2);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...CORES_JEGD.escuro);
      doc.text(itemAss.cargo, sX + colSW / 2, signY + 3.3, { align: 'center' });
      doc.setFontSize(5.1);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...CORES_JEGD.textoMuted);
      doc.text(itemAss.sub, sX + colSW / 2, signY + 5.8, { align: 'center' });
    });

    // Nota de ciência jurídica + Carimbo de recebimento SEMED
    doc.setFontSize(5.3);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(...CORES_JEGD.textoMuted);
    doc.text(
      'A assinatura dos representantes registra apenas ciência do resultado e ocorrências (não implica renúncia ao direito de protesto).   |   Recebido SEMED: ___/___ às ___:___',
      pageWidth / 2,
      signY + 10.2,
      { align: 'center' }
    );
  }

  // ==============================================================
  // OPÇÃO 1: SÚMULAS GERAIS / LIVRO GERAL DE ARBITRAGEM
  // ==============================================================

  /**
   * Gera a Súmula por Etapa/Categoria separada rigorosamente por ESCOLA:
   * cada escola participante recebe sua própria página oficial de súmula (sem misturar alunos de escolas diferentes).
   */
  public static async gerarListaChamadaOficial(
    modalidadeNome: string,
    categoria: string,
    sexo: string,
    dataJogo: string,
    atletasComEscola: { atleta: Atleta; escola: Escola; provas?: string[] }[]
  ): Promise<void> {
    const doc = criarDocumentoA4('portrait');

    if (atletasComEscola.length === 0) {
      this.desenharPaginaSumula(doc, modalidadeNome, categoria, sexo, dataJogo, [], { isModeloManual: true });
      aplicarRodapePaginado(doc, `JEGDS 2026 • Súmula Oficial • ${modalidadeNome}`);
      abrirPdfNovaGuia(doc, `Sumula_Geral_JEGDS_${modalidadeNome.replace(/\s+/g, '_')}_${categoria}_${sexo}.pdf`);
      return;
    }

    // Agrupar atletas por escola (ordem alfabética de escola)
    const mapaEscolas = new Map<string, { escola: Escola; atletas: { atleta: Atleta; escola: Escola; provas?: string[] }[] }>();
    atletasComEscola.forEach((entry) => {
      const key = entry.escola.id || entry.escola.nome;
      if (!mapaEscolas.has(key)) {
        mapaEscolas.set(key, { escola: entry.escola, atletas: [] });
      }
      const lista = mapaEscolas.get(key)!.atletas;
      if (!lista.some((x) => x.atleta.id === entry.atleta.id)) {
        lista.push(entry);
      }
    });

    const escolasOrdenadas = Array.from(mapaEscolas.values()).sort((a, b) =>
      a.escola.nome.localeCompare(b.escola.nome, 'pt-BR')
    );

    const contextosPorPagina: Record<number, string> = {};

    escolasOrdenadas.forEach((grupo, idx) => {
      if (idx > 0) doc.addPage();
      const pagAntes = doc.getNumberOfPages();

      this.desenharPaginaSumula(
        doc,
        modalidadeNome,
        categoria,
        sexo,
        dataJogo,
        grupo.atletas,
        {
          escolaFiltro: grupo.escola,
          faixaSecaoEscola: `ESCOLA ${(idx + 1).toString().padStart(2, '0')} DE ${escolasOrdenadas.length.toString().padStart(2, '0')}  •  ${grupo.escola.nome} (${grupo.escola.sigla || 'SEMED'})  •  ${grupo.atletas.length} ${grupo.atletas.length === 1 ? 'ATLETA' : 'ATLETAS'}`,
        }
      );

      const pagDepois = doc.getNumberOfPages();
      for (let p = pagAntes; p <= pagDepois; p++) {
        contextosPorPagina[p] = `${grupo.escola.sigla || grupo.escola.nome} • ${modalidadeNome} (${categoria} - ${sexo})`;
      }
    });

    aplicarRodapePaginado(doc, `JEGDS 2026 • Súmula Oficial • ${modalidadeNome}`, contextosPorPagina);
    abrirPdfNovaGuia(doc, `Sumula_Geral_JEGDS_${modalidadeNome.replace(/\s+/g, '_')}_${categoria}_${sexo}.pdf`);
  }

  /**
   * Gera o Caderno Completo de uma Modalidade:
   *  - Sem filtro de escola: Página 1 com Índice da Modalidade por Escola -> organizado por ESCOLA (A-Z) -> FAIXA ETÁRIA -> NAIPE -> ATLETAS (A-Z).
   *  - Com filtro de escola: organizado por FAIXA ETÁRIA -> NAIPE -> ATLETAS (A-Z) daquela escola.
   */
  public static async gerarCadernoModalidadeCompleto(
    modalidade: ModalidadeConfig,
    categoriasData: CategoriaSumulaData[],
    options?: SumulaOptions
  ): Promise<void> {
    const doc = criarDocumentoA4('portrait');
    const dataJogo = new Date(modalidade.dataEvento).toLocaleDateString('pt-BR');
    const nomeFormatado = modalidade.nome.toUpperCase().replace(/\s+/g, '_');

    // Caso 1: Filtrado por uma única escola
    if (options?.escolaFiltro) {
      const categoriasOrdenadas = [...categoriasData].sort((a, b) => {
        const diffCat = ordemCategoria(a.categoria) - ordemCategoria(b.categoria);
        if (diffCat !== 0) return diffCat;
        return ordemNaipe(a.sexo) - ordemNaipe(b.sexo);
      });

      const contextosPorPagina: Record<number, string> = {};
      let pageAdded = false;

      categoriasOrdenadas.forEach((catData) => {
        if (catData.atletasComEscola.length === 0) return;

        if (pageAdded) {
          doc.addPage();
        } else {
          pageAdded = true;
        }

        const pagAntes = doc.getNumberOfPages();
        this.desenharPaginaSumula(
          doc,
          modalidade.nome,
          catData.categoria,
          catData.sexo,
          dataJogo,
          catData.atletasComEscola,
          options
        );
        const pagDepois = doc.getNumberOfPages();
        for (let p = pagAntes; p <= pagDepois; p++) {
          contextosPorPagina[p] = `${options.escolaFiltro?.sigla || options.escolaFiltro?.nome} • ${modalidade.nome} (${catData.categoria})`;
        }
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

      aplicarRodapePaginado(doc, `JEGDS 2026 • Caderno de Súmulas • ${modalidade.nome}`, contextosPorPagina);
      const prefixo = `SUMULA_${(options.escolaFiltro.sigla || options.escolaFiltro.nome).replace(/\s+/g, '_')}`;
      abrirPdfNovaGuia(doc, `${prefixo}_${nomeFormatado}_JEGDS2026.pdf`);
      return;
    }

    // Caso 2: Caderno Geral da Modalidade (Todas as Escolas) -> Separado rigorosamente por ESCOLA -> FAIXA ETÁRIA -> NAIPE
    type GrupoEscolaMod = {
      escola: Escola;
      atletasUnicos: Set<string>;
      categorias: Map<
        string,
        {
          categoria: string;
          sexo: string;
          atletasComEscola: { atleta: Atleta; escola: Escola; provas?: string[] }[];
        }
      >;
    };

    const mapaEscolas = new Map<string, GrupoEscolaMod>();
    categoriasData.forEach((catData) => {
      catData.atletasComEscola.forEach((entry) => {
        const escKey = entry.escola.id || entry.escola.nome;
        if (!mapaEscolas.has(escKey)) {
          mapaEscolas.set(escKey, {
            escola: entry.escola,
            atletasUnicos: new Set<string>(),
            categorias: new Map(),
          });
        }
        const grupo = mapaEscolas.get(escKey)!;
        grupo.atletasUnicos.add(entry.atleta.id);

        const catKey = `${catData.categoria}__${catData.sexo}`;
        if (!grupo.categorias.has(catKey)) {
          grupo.categorias.set(catKey, {
            categoria: catData.categoria,
            sexo: catData.sexo,
            atletasComEscola: [],
          });
        }
        const lista = grupo.categorias.get(catKey)!.atletasComEscola;
        if (!lista.some((x) => x.atleta.id === entry.atleta.id)) {
          lista.push(entry);
        }
      });
    });

    const escolasOrdenadas = Array.from(mapaEscolas.values()).sort((a, b) =>
      a.escola.nome.localeCompare(b.escola.nome, 'pt-BR')
    );

    if (escolasOrdenadas.length === 0) {
      this.desenharPaginaSumula(
        doc,
        modalidade.nome,
        modalidade.categoriasPermitidas[0] || 'LIVRE',
        'MASCULINO',
        dataJogo,
        [],
        { isModeloManual: true }
      );
      aplicarRodapePaginado(doc, `JEGDS 2026 • Caderno de Súmulas • ${modalidade.nome}`);
      abrirPdfNovaGuia(doc, `CADERNO_OFICIAL_SUMULAS_${nomeFormatado}_JEGDS2026.pdf`);
      return;
    }

    // Reservar página(s) do Índice da Modalidade por Escola
    const maxLinhasIndice = 26;
    const paginasIndice = Math.max(1, Math.ceil(escolasOrdenadas.length / maxLinhasIndice));
    for (let i = 1; i < paginasIndice; i++) {
      doc.addPage();
    }

    const contextosPorPagina: Record<number, string> = {};
    for (let p = 1; p <= paginasIndice; p++) {
      contextosPorPagina[p] = `${modalidade.nome} • Índice por Escola`;
    }

    const indiceRegistros: {
      numero: number;
      escola: Escola;
      totalAtletas: number;
      totalSumulas: number;
      faixasLabel: string;
      paginaInicial: number;
    }[] = [];

    let totalSumulasMod = 0;

    escolasOrdenadas.forEach((grupoEsc, idxEsc) => {
      const categoriasOrdenadas = Array.from(grupoEsc.categorias.values()).sort((a, b) => {
        const diffCat = ordemCategoria(a.categoria) - ordemCategoria(b.categoria);
        if (diffCat !== 0) return diffCat;
        return ordemNaipe(a.sexo) - ordemNaipe(b.sexo);
      });

      let paginaInicialEscola = 0;
      let sumulasDaEscola = 0;
      const faixasResumo: string[] = [];

      categoriasOrdenadas.forEach((catObj) => {
        if (catObj.atletasComEscola.length === 0) return;

        faixasResumo.push(`${catObj.categoria} (${catObj.sexo === 'FEMININO' ? 'F' : 'M'})`);
        doc.addPage();
        const pagAntes = doc.getNumberOfPages();
        const ehPrimeiraDaEscola = paginaInicialEscola === 0;
        if (ehPrimeiraDaEscola) {
          paginaInicialEscola = pagAntes;
        }

        sumulasDaEscola++;
        totalSumulasMod++;

        this.desenharPaginaSumula(
          doc,
          modalidade.nome,
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
        for (let p = pagAntes; p <= pagDepois; p++) {
          contextosPorPagina[p] = `${grupoEsc.escola.sigla || grupoEsc.escola.nome} • ${modalidade.nome} (${catObj.categoria} - ${catObj.sexo})`;
        }
      });

      indiceRegistros.push({
        numero: idxEsc + 1,
        escola: grupoEsc.escola,
        totalAtletas: grupoEsc.atletasUnicos.size,
        totalSumulas: sumulasDaEscola,
        faixasLabel: faixasResumo.join(', '),
        paginaInicial: paginaInicialEscola,
      });
    });

    // Preencher Índice da Modalidade por Escola na(s) página(s) inicial(is)
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;
    const totalAtletasMod = indiceRegistros.reduce((acc, r) => acc + r.totalAtletas, 0);

    for (let pagIdx = 0; pagIdx < paginasIndice; pagIdx++) {
      doc.setPage(pagIdx + 1);
      let y = 10;

      doc.setFillColor(...CORES_JEGD.primaria);
      doc.roundedRect(margin, y, contentWidth, 24, 1.8, 1.8, 'F');
      doc.setFillColor(...CORES_JEGD.destaqueOuro);
      doc.rect(margin, y + 23.1, contentWidth, 0.9, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.5);
      doc.text(`JEGDS 2026 • CADERNO OFICIAL DE ${modalidade.nome.toUpperCase()}`, pageWidth / 2, y + 8.5, { align: 'center' });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(245, 232, 234);
      doc.text(
        'PREFEITURA MUNICIPAL DE GONÇALVES DIAS - MA  •  SECRETARIA MUNICIPAL DE EDUCAÇÃO (SEMED)',
        pageWidth / 2,
        y + 14.5,
        { align: 'center' }
      );

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 240, 196);
      doc.text(
        `ORGANIZAÇÃO: POR ESCOLA  →  FAIXA ETÁRIA  →  NAIPE  •  DATA PREVISTA: ${dataJogo}`,
        pageWidth / 2,
        y + 20.2,
        { align: 'center' }
      );

      y += 28;

      if (pagIdx === 0) {
        const cardW = (contentWidth - 9) / 4;
        const resumoCards = [
          { label: 'ESCOLAS INSCRITAS', valor: String(indiceRegistros.length) },
          { label: 'ATLETAS NA MODALIDADE', valor: String(totalAtletasMod) },
          { label: 'TOTAL DE SÚMULAS', valor: String(totalSumulasMod) },
          { label: 'DATA DA ETAPA', valor: dataJogo },
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

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...CORES_JEGD.escuro);
      doc.text(
        pagIdx === 0
          ? `ÍNDICE DE ESCOLAS EM ${modalidade.nome.toUpperCase()} (MANUSEIO RÁPIDO)`
          : `ÍNDICE DE ESCOLAS EM ${modalidade.nome.toUpperCase()} (CONTINUAÇÃO)`,
        margin,
        y
      );
      y += 3.5;

      const idxCols = [
        { key: 'num', label: 'Nº', x: margin + 0, w: 9, align: 'center' as const },
        { key: 'escola', label: 'ESCOLA / UNIDADE', x: margin + 9, w: 66, align: 'left' as const },
        { key: 'faixas', label: 'FAIXAS ETÁRIAS & NAIPES', x: margin + 75, w: 66, align: 'left' as const },
        { key: 'atl', label: 'ATLETAS', x: margin + 141, w: 16, align: 'center' as const },
        { key: 'sum', label: 'SÚMULAS', x: margin + 157, w: 16, align: 'center' as const },
        { key: 'pag', label: 'PÁG.', x: margin + 173, w: 17, align: 'center' as const },
      ];

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

      const sliceInicio = pagIdx * maxLinhasIndice;
      const itensPagina = indiceRegistros.slice(sliceInicio, sliceInicio + maxLinhasIndice);

      itensPagina.forEach((reg, rIdx) => {
        const rowH = 7.4;
        doc.setFillColor(...(rIdx % 2 === 1 ? CORES_JEGD.fundoZebra : [255, 255, 255] as [number, number, number]));
        doc.rect(margin, y, contentWidth, rowH, 'F');
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
        doc.text(ajustarTexto(doc, reg.faixasLabel, idxCols[2].w - 4), idxCols[2].x + 2.2, midY);

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

    aplicarRodapePaginado(doc, `JEGDS 2026 • Caderno de Súmulas • ${modalidade.nome}`, contextosPorPagina);
    abrirPdfNovaGuia(doc, `CADERNO_OFICIAL_SUMULAS_${nomeFormatado}_JEGDS2026.pdf`);
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
      abrirPdfNovaGuia(doc, 'LIVRO_GERAL_ARBITRAGEM_JEGDS2026.pdf');
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

    // 3.5. Página Final: Controle de Entrega de Súmulas à Coordenação (SEMED)
    doc.addPage();
    const pagControle = doc.getNumberOfPages();
    contextosPorPagina[pagControle] = 'Controle de Entrega de Súmulas à Coordenação';
    {
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();
      const m = 10;
      const cw = pw - m * 2;
      let cy = 10;

      doc.setFillColor(...CORES_JEGD.primaria);
      doc.roundedRect(m, cy, cw, 20, 1.5, 1.5, 'F');
      doc.setFillColor(...CORES_JEGD.destaqueOuro);
      doc.rect(m, cy + 19.2, cw, 0.8, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      doc.text('JEGDS 2026 • CONTROLE DE ENTREGA DE SÚMULAS À COORDENAÇÃO', pw / 2, cy + 7.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(245, 232, 234);
      doc.text('PREFEITURA MUNICIPAL DE GONÇALVES DIAS - MA  •  SECRETARIA MUNICIPAL DE EDUCAÇÃO (SEMED)', pw / 2, cy + 13.2, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(255, 240, 196);
      doc.text('CONFERÊNCIA FINAL DE DEVOLUÇÃO DAS FICHAS DE ARBITRAGEM POR MODALIDADE', pw / 2, cy + 17.6, { align: 'center' });

      cy += 24;

      // Metadados do dia
      doc.setFillColor(...CORES_JEGD.fundoCinza);
      doc.setDrawColor(...CORES_JEGD.borda);
      doc.setLineWidth(0.2);
      doc.roundedRect(m, cy, cw, 10, 1, 1, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...CORES_JEGD.escuro);
      doc.text('DATA: ____/____/2026', m + 4, cy + 6.3);
      doc.text('LOCAL / ETAPA: _________________________________', m + 42, cy + 6.3);
      doc.text('RESPONSÁVEL: ______________________________', m + 122, cy + 6.3);
      cy += 14;

      // Tabela de Controle das 8 Modalidades (soma = 190mm)
      const cCols = [
        { label: 'MODALIDADE', x: m + 0, w: 46, align: 'left' as const },
        { label: 'QTD. SÚMULAS', x: m + 46, w: 28, align: 'center' as const },
        { label: 'CONFERIDO POR', x: m + 74, w: 48, align: 'left' as const },
        { label: 'DATA / HORA', x: m + 122, w: 30, align: 'center' as const },
        { label: 'OBSERVAÇÕES', x: m + 152, w: 38, align: 'left' as const },
      ];

      doc.setFillColor(...CORES_JEGD.escuro);
      doc.rect(m, cy, cw, 7.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(255, 255, 255);
      cCols.forEach((col, i) => {
        if (i > 0) {
          doc.setDrawColor(51, 65, 85);
          doc.line(col.x, cy, col.x, cy + 7.5);
        }
        if (col.align === 'center') {
          doc.text(col.label, col.x + col.w / 2, cy + 5, { align: 'center' });
        } else {
          doc.text(col.label, col.x + 2.5, cy + 5);
        }
      });
      cy += 7.5;

      const listaModsControle = [
        'Futebol de Campo',
        'Futsal',
        'Voleibol',
        'Beach Soccer',
        'Queimada',
        'Atletismo',
        'Tênis de Mesa',
        'Xadrez / Xadrez Rápido',
        'Outras / Ocorrências Extras',
      ];

      listaModsControle.forEach((modNome, idx) => {
        const rh = 11;
        doc.setFillColor(...(idx % 2 === 1 ? CORES_JEGD.fundoZebra : [255, 255, 255] as [number, number, number]));
        doc.rect(m, cy, cw, rh, 'F');
        doc.setDrawColor(...CORES_JEGD.bordaSuave);
        doc.setLineWidth(0.2);
        doc.rect(m, cy, cw, rh, 'S');
        cCols.forEach((col, i) => {
          if (i > 0) doc.line(col.x, cy, col.x, cy + rh);
        });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(...CORES_JEGD.escuro);
        doc.text(modNome, cCols[0].x + 2.5, cy + 6.8);
        cy += rh;
      });

      cy += 8;

      // Observações Gerais da Coordenação
      doc.setFillColor(...CORES_JEGD.fundoCinza);
      doc.setDrawColor(...CORES_JEGD.borda);
      doc.setLineWidth(0.25);
      doc.roundedRect(m, cy, cw, 56, 1.2, 1.2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(...CORES_JEGD.escuro);
      doc.text('OBSERVAÇÕES GERAIS DA COORDENAÇÃO DOS JOGOS (OCORRÊNCIAS DO DIA, PENDÊNCIAS E PROVIDÊNCIAS):', m + 4, cy + 6);

      doc.setDrawColor(...CORES_JEGD.borda);
      doc.setLineWidth(0.2);
      for (let l = 1; l <= 6; l++) {
        doc.line(m + 4, cy + 6 + l * 7.5, m + cw - 4, cy + 6 + l * 7.5);
      }

      // Assinaturas da Coordenação
      const sY = ph - 32;
      const halfW = (cw - 14) / 2;
      [
        { title: 'Coordenação Geral dos Jogos (SEMED)', sub: 'Nome legível e assinatura' },
        { title: 'Coordenação Técnica / Arbitragem', sub: 'Nome legível e assinatura' },
      ].forEach((ass, idx) => {
        const sx = m + idx * (halfW + 14);
        doc.setDrawColor(...CORES_JEGD.grafite);
        doc.setLineWidth(0.25);
        doc.line(sx + 6, sY, sx + halfW - 6, sY);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(...CORES_JEGD.escuro);
        doc.text(ass.title, sx + halfW / 2, sY + 4.5, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(...CORES_JEGD.textoMuted);
        doc.text(ass.sub, sx + halfW / 2, sY + 8, { align: 'center' });
      });
    }

    // 4. Aplicar rodapé numerado em todas as páginas
    aplicarRodapePaginado(doc, 'JEGDS 2026 • Livro Geral de Arbitragem', contextosPorPagina);

    abrirPdfNovaGuia(doc, 'LIVRO_GERAL_ARBITRAGEM_JEGDS2026.pdf');
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
    abrirPdfNovaGuia(doc, `Sumula_JEGDS_${siglaSafe}_${modalidadeNome.replace(/\s+/g, '_')}_${categoria}_${sexo}.pdf`);
  }

  /**
   * Gera o Caderno Completo de Súmulas da Escola:
   *  - Página 1: Índice de Modalidades & Faixas Etárias da Escola (quando há 2+ súmulas)
   *  - Sequência: Modalidade -> Faixa Etária (Mirim, Infantil, Infanto, Junior) -> Naipe -> Atletas (A-Z)
   */
  public static async gerarCadernoSumulasEscola(
    escola: Escola,
    modalidadesCompletas: { modalidade: ModalidadeConfig; categoriasData: CategoriaSumulaData[] }[]
  ): Promise<void> {
    const doc = criarDocumentoA4('portrait');

    // Coletar lista plana ordenada de súmulas da escola
    const sumulasEscola: {
      modalidade: ModalidadeConfig;
      dataJogo: string;
      categoria: string;
      sexo: string;
      atletasComEscola: { atleta: Atleta; escola: Escola; provas?: string[] }[];
    }[] = [];

    const atletasUnicosSet = new Set<string>();

    modalidadesCompletas.forEach((item) => {
      const dataJogo = new Date(item.modalidade.dataEvento).toLocaleDateString('pt-BR');
      const categoriasOrdenadas = [...item.categoriasData].sort((a, b) => {
        const diffCat = ordemCategoria(a.categoria) - ordemCategoria(b.categoria);
        if (diffCat !== 0) return diffCat;
        return ordemNaipe(a.sexo) - ordemNaipe(b.sexo);
      });

      categoriasOrdenadas.forEach((catData) => {
        if (catData.atletasComEscola.length === 0) return;
        catData.atletasComEscola.forEach((x) => atletasUnicosSet.add(x.atleta.id));
        sumulasEscola.push({
          modalidade: item.modalidade,
          dataJogo,
          categoria: catData.categoria,
          sexo: catData.sexo,
          atletasComEscola: catData.atletasComEscola,
        });
      });
    });

    if (sumulasEscola.length === 0) {
      this.desenharPaginaSumula(
        doc,
        'MODALIDADE GERAL',
        'LIVRE',
        'MASC / FEM',
        '2026',
        [],
        { escolaFiltro: escola, isModeloManual: true }
      );
      aplicarRodapePaginado(doc, `JEGDS 2026 • Caderno de Súmulas (${escola.sigla || escola.nome})`);
      const siglaSafe = (escola.sigla || escola.nome).replace(/[^a-zA-Z0-9]/g, '_');
      abrirPdfNovaGuia(doc, `CADERNO_SUMULAS_ESCOLA_${siglaSafe}_JEGDS2026.pdf`);
      return;
    }

    const incluirIndice = sumulasEscola.length >= 2;
    const maxLinhasIndice = 26;
    const paginasIndice = incluirIndice ? Math.max(1, Math.ceil(sumulasEscola.length / maxLinhasIndice)) : 0;

    if (incluirIndice) {
      for (let i = 1; i < paginasIndice; i++) {
        doc.addPage();
      }
    }

    const contextosPorPagina: Record<number, string> = {};
    for (let p = 1; p <= paginasIndice; p++) {
      contextosPorPagina[p] = `${escola.sigla || escola.nome} • Índice de Súmulas`;
    }

    const indiceRegistros: {
      numero: number;
      modalidade: string;
      faixa: string;
      naipe: string;
      totalAtletas: number;
      paginaInicial: number;
    }[] = [];

    sumulasEscola.forEach((sum, idx) => {
      if (incluirIndice || idx > 0) {
        doc.addPage();
      }
      const pagAntes = doc.getNumberOfPages();

      this.desenharPaginaSumula(
        doc,
        sum.modalidade.nome,
        sum.categoria,
        sum.sexo,
        sum.dataJogo,
        sum.atletasComEscola,
        { escolaFiltro: escola }
      );

      const pagDepois = doc.getNumberOfPages();
      for (let p = pagAntes; p <= pagDepois; p++) {
        contextosPorPagina[p] = `${escola.sigla || escola.nome} • ${sum.modalidade.nome} (${sum.categoria} - ${sum.sexo})`;
      }

      indiceRegistros.push({
        numero: idx + 1,
        modalidade: sum.modalidade.nome,
        faixa: formatarFaixaEtaria(sum.categoria),
        naipe: sum.sexo,
        totalAtletas: sum.atletasComEscola.length,
        paginaInicial: pagAntes,
      });
    });

    if (incluirIndice) {
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      const dataEmissao = new Date().toLocaleDateString('pt-BR');

      for (let pagIdx = 0; pagIdx < paginasIndice; pagIdx++) {
        doc.setPage(pagIdx + 1);
        let y = 10;

        doc.setFillColor(...CORES_JEGD.primaria);
        doc.roundedRect(margin, y, contentWidth, 24, 1.8, 1.8, 'F');
        doc.setFillColor(...CORES_JEGD.destaqueOuro);
        doc.rect(margin, y + 23.1, contentWidth, 0.9, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(
          ajustarTexto(doc, `JEGDS 2026 • CADERNO DE SÚMULAS — ${escola.nome.toUpperCase()}`, contentWidth - 10),
          pageWidth / 2,
          y + 8.5,
          { align: 'center' }
        );

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.8);
        doc.setTextColor(245, 232, 234);
        doc.text(
          'PREFEITURA MUNICIPAL DE GONÇALVES DIAS - MA  •  SECRETARIA MUNICIPAL DE EDUCAÇÃO (SEMED)',
          pageWidth / 2,
          y + 14.5,
          { align: 'center' }
        );

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 240, 196);
        doc.text(
          'ORGANIZAÇÃO: MODALIDADE  →  FAIXA ETÁRIA (MIRIM, INFANTIL, INFANTO, JUNIOR)  →  NAIPE',
          pageWidth / 2,
          y + 20.2,
          { align: 'center' }
        );

        y += 28;

        if (pagIdx === 0) {
          const cardW = (contentWidth - 6) / 3;
          const resumoCards = [
            { label: 'ATLETAS DA ESCOLA', valor: String(atletasUnicosSet.size) },
            { label: 'TOTAL DE SÚMULAS', valor: String(sumulasEscola.length) },
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

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...CORES_JEGD.escuro);
        doc.text(
          pagIdx === 0 ? 'ÍNDICE DE SÚMULAS DA DELEGAÇÃO ESCOLAR' : 'ÍNDICE DE SÚMULAS (CONTINUAÇÃO)',
          margin,
          y
        );
        y += 3.5;

        const idxCols = [
          { key: 'num', label: 'Nº', x: margin + 0, w: 10, align: 'center' as const },
          { key: 'mod', label: 'MODALIDADE', x: margin + 10, w: 54, align: 'left' as const },
          { key: 'faixa', label: 'FAIXA ETÁRIA', x: margin + 64, w: 54, align: 'left' as const },
          { key: 'naipe', label: 'NAIPE', x: margin + 118, w: 28, align: 'center' as const },
          { key: 'atl', label: 'ATLETAS', x: margin + 146, w: 22, align: 'center' as const },
          { key: 'pag', label: 'PÁG.', x: margin + 168, w: 22, align: 'center' as const },
        ];

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

        const sliceInicio = pagIdx * maxLinhasIndice;
        const itensPagina = indiceRegistros.slice(sliceInicio, sliceInicio + maxLinhasIndice);

        itensPagina.forEach((reg, rIdx) => {
          const rowH = 7.4;
          doc.setFillColor(...(rIdx % 2 === 1 ? CORES_JEGD.fundoZebra : [255, 255, 255] as [number, number, number]));
          doc.rect(margin, y, contentWidth, rowH, 'F');
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
          doc.text(ajustarTexto(doc, reg.modalidade.toUpperCase(), idxCols[1].w - 4), idxCols[1].x + 2.2, midY);

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(6.5);
          doc.setTextColor(...CORES_JEGD.grafite);
          doc.text(ajustarTexto(doc, reg.faixa, idxCols[2].w - 4), idxCols[2].x + 2.2, midY);

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.text(reg.naipe, idxCols[3].x + idxCols[3].w / 2, midY, { align: 'center' });

          doc.setFontSize(7);
          doc.setTextColor(...CORES_JEGD.escuro);
          doc.text(String(reg.totalAtletas), idxCols[4].x + idxCols[4].w / 2, midY, { align: 'center' });

          doc.setTextColor(...CORES_JEGD.primaria);
          doc.text(`Pág. ${reg.paginaInicial}`, idxCols[5].x + idxCols[5].w / 2, midY, { align: 'center' });

          y += rowH;
        });
      }
    }

    aplicarRodapePaginado(doc, `JEGDS 2026 • Caderno de Súmulas (${escola.sigla || escola.nome})`, contextosPorPagina);

    const siglaSafe = (escola.sigla || escola.nome).replace(/[^a-zA-Z0-9]/g, '_');
    abrirPdfNovaGuia(doc, `CADERNO_SUMULAS_ESCOLA_${siglaSafe}_JEGDS2026.pdf`);
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
    abrirPdfNovaGuia(doc, 'MODELO_OFICIAL_SUMULA_MANUAL_JEGDS2026_UNIVERSAL.pdf');
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
    abrirPdfNovaGuia(doc, `MODELO_MANUAL_SUMULA_${modSafe}_JEGDS2026.pdf`);
  }
}
