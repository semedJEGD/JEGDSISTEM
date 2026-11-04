import { jsPDF } from 'jspdf';
import { Escola, Atleta, ModalidadeConfig } from '@/types/jegd';
import { criarDocumentoA4, CORES_JEGD } from './pdf-types';

export interface CategoriaSumulaData {
  categoria: string;
  sexo: string;
  atletasComEscola: { atleta: Atleta; escola: Escola; provas?: string[] }[];
}

export class SumulaChamadaService {
  /**
   * Desenha a página individual de uma súmula/lista de chamada oficial no documento PDF
   */
  public static desenharPaginaSumula(
    doc: jsPDF,
    modalidadeNome: string,
    categoria: string,
    sexo: string,
    dataJogo: string,
    atletasComEscola: { atleta: Atleta; escola: Escola; provas?: string[] }[]
  ): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;

    // ============================================================
    // 1. CABEÇALHO OFICIAL DE SÚMULA
    // ============================================================
    doc.setFillColor(...CORES_JEGD.primaria);
    doc.rect(margin, 8, contentWidth, 20, 'F');
    doc.setFillColor(...CORES_JEGD.destaqueOuro);
    doc.rect(margin, 27.4, contentWidth, 0.6, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11.5);
    doc.setFont('helvetica', 'bold');
    doc.text('JEGDS 2026 • SÚMULA OFICIAL DE PARTIDA & LISTA DE ARBITRAGEM', pageWidth / 2, 14, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `PREFEITURA DE GONÇALVES DIAS - MA • SECRETARIA MUNICIPAL DE EDUCAÇÃO (SEMED) • COMITÊ TÉCNICO`,
      pageWidth / 2,
      19,
      { align: 'center' }
    );
    doc.setFont('helvetica', 'bold');
    doc.text(
      `MODALIDADE: ${modalidadeNome.toUpperCase()} • CATEGORIA: ${categoria} (${sexo}) • DATA: ${dataJogo}`,
      pageWidth / 2,
      24.5,
      { align: 'center' }
    );

    // ============================================================
    // 2. QUADRO DO CONFRONTO & PLACAR OFICIAL
    // ============================================================
    let currentY = 30;
    doc.setFillColor(...CORES_JEGD.fundoCinza);
    doc.roundedRect(margin, currentY, contentWidth, 15, 1, 1, 'FD');
    doc.setDrawColor(...CORES_JEGD.borda);
    doc.setLineWidth(0.25);
    doc.roundedRect(margin, currentY, contentWidth, 15, 1, 1, 'S');

    // Box de Confronto
    doc.setTextColor(...CORES_JEGD.escuro);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('EQUIPE A: ____________________________________', margin + 4, currentY + 6);
    doc.text('[       ]  X  [       ]', pageWidth / 2, currentY + 6, { align: 'center' });
    doc.text('EQUIPE B: ____________________________________', pageWidth - margin - 4, currentY + 6, { align: 'right' });

    // Placares Parciais
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...CORES_JEGD.grafite);
    doc.text(
      '1º TEMPO: [    ] x [    ]   |   2º TEMPO: [    ] x [    ]   |   PRORROGAÇÃO: [    ] x [    ]   |   PÊNALTIS/DECISÃO: [    ] x [    ]',
      pageWidth / 2,
      currentY + 12,
      { align: 'center' }
    );

    currentY += 17.5;

    // ============================================================
    // 3. TABELA OFICIAL DE ATLETAS E CONTROLE DISCIPLINAR
    // ============================================================
    const cabecalhoTabela = () => {
      doc.setFillColor(...CORES_JEGD.escuro);
      doc.rect(margin, currentY, contentWidth, 6.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6.2);
      doc.setFont('helvetica', 'bold');

      doc.text('Nº', margin + 2, currentY + 4.5);
      doc.text('CAMISA', margin + 7.5, currentY + 4.5);
      doc.text('NOME DO ESTUDANTE-ATLETA', margin + 22, currentY + 4.5);
      doc.text('ESCOLA', margin + 76, currentY + 4.5);
      doc.text('DOCUMENTO', margin + 104, currentY + 4.5);
      doc.text('PONTOS/GOLS', margin + 124, currentY + 4.5);
      doc.text('FALTAS', margin + 144, currentY + 4.5);
      doc.text('C.A.', margin + 158, currentY + 4.5);
      doc.text('C.V.', margin + 165, currentY + 4.5);
      doc.text('RUBRICA / CHECK-IN', margin + 172, currentY + 4.5);

      currentY += 6.5;
    };

    cabecalhoTabela();

    const renderRow = (
      index: number,
      nome: string,
      escolaStr: string,
      docStr: string,
      presente: boolean = false
    ) => {
      const rowH = 6.2;
      if (index % 2 === 0) {
        doc.setFillColor(...CORES_JEGD.fundoZebra);
        doc.rect(margin, currentY, contentWidth, rowH, 'F');
      }

      doc.setDrawColor(...CORES_JEGD.bordaSuave);
      doc.setLineWidth(0.2);
      doc.line(margin, currentY + rowH, margin + contentWidth, currentY + rowH);

      doc.setTextColor(...CORES_JEGD.escuro);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');

      // Nº
      doc.text((index + 1).toString().padStart(2, '0'), margin + 2, currentY + 4.2);

      // Caixa de Camisa
      doc.setDrawColor(...CORES_JEGD.borda);
      doc.rect(margin + 8, currentY + 1.2, 5.5, 3.8, 'S');

      // Nome do Atleta
      doc.setFont('helvetica', 'bold');
      doc.text(nome.slice(0, 32), margin + 22, currentY + 4.2);

      // Escola
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...CORES_JEGD.grafite);
      doc.text(escolaStr.slice(0, 16), margin + 76, currentY + 4.2);

      // Documento
      doc.text(docStr.slice(0, 12), margin + 104, currentY + 4.2);

      // Caixas de Pontos / Faltas
      doc.rect(margin + 124, currentY + 1.2, 14, 3.8, 'S'); // Gols/Pontos
      // Faltas (1 a 5)
      for (let f = 0; f < 5; f++) {
        doc.rect(margin + 144 + f * 2.5, currentY + 1.2, 2.2, 3.8, 'S');
      }
      // Cartão Amarelo e Vermelho
      doc.rect(margin + 158.5, currentY + 1.2, 3.5, 3.8, 'S');
      doc.rect(margin + 165.5, currentY + 1.2, 3.5, 3.8, 'S');

      // Rubrica / Check-in
      if (presente) {
        doc.text('[X] OK _______________', margin + 172, currentY + 4.2);
      } else {
        doc.text('[  ] _________________', margin + 172, currentY + 4.2);
      }

      currentY += rowH;
    };

    if (atletasComEscola.length === 0) {
      // Linhas pautadas para preenchimento manual da mesa
      for (let i = 0; i < 18; i++) {
        if (currentY > pageHeight - 52) break;
        renderRow(i, '________________________________', '________________', '___________');
      }
    } else {
      atletasComEscola.forEach((item, index) => {
        if (currentY > pageHeight - 52) {
          doc.addPage();
          currentY = 15;
          cabecalhoTabela();
        }

        renderRow(
          index,
          item.atleta.nomeCompleto.toUpperCase(),
          item.escola.sigla || item.escola.nome,
          item.atleta.documentoNumero
        );
      });
    }

    // ============================================================
    // 4. QUADRO DISCIPLINAR / OBSERVAÇÕES & WxO
    // ============================================================
    const obsY = Math.max(currentY + 3, pageHeight - 44);
    doc.setFillColor(...CORES_JEGD.fundoCinza);
    doc.roundedRect(margin, obsY, contentWidth, 14, 1, 1, 'FD');
    doc.setDrawColor(...CORES_JEGD.borda);
    doc.roundedRect(margin, obsY, contentWidth, 14, 1, 1, 'S');

    doc.setFontSize(6.2);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...CORES_JEGD.escuro);
    doc.text('RELATÓRIO DA ARBITRAGEM, OCORRÊNCIAS DISCIPLINARES OU REGISTRO DE WxO:', margin + 3, obsY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...CORES_JEGD.textoMuted);
    doc.text('________________________________________________________________________________________________________________________________________________', margin + 3, obsY + 8);
    doc.text('________________________________________________________________________________________________________________________________________________', margin + 3, obsY + 12);

    // ============================================================
    // 5. ASSINATURAS DA EQUIPE DE ARBITRAGEM (4 COLUNAS)
    // ============================================================
    const signY = obsY + 20;
    const colSW = (contentWidth - 9) / 4;

    const arbitros = [
      'Árbitro Principal',
      'Árbitro Auxiliar',
      'Apontador / Cronometrista',
      'Coordenador / SEMED'
    ];

    arbitros.forEach((cargo, idx) => {
      const sX = margin + idx * (colSW + 3);
      doc.setDrawColor(...CORES_JEGD.grafite);
      doc.setLineWidth(0.25);
      doc.line(sX + 2, signY, sX + colSW - 2, signY);

      doc.setFontSize(6.0);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...CORES_JEGD.escuro);
      doc.text(cargo, sX + colSW / 2, signY + 3.2, { align: 'center' });
      doc.setFontSize(5.0);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...CORES_JEGD.textoMuted);
      doc.text('Assinatura / Visto', sX + colSW / 2, signY + 5.8, { align: 'center' });
    });
  }

  /**
   * Gera a Lista de Chamada Individual (1 única categoria)
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
    doc.save(`Sumula_Oficial_JEGDS_${modalidadeNome.replace(/\s+/g, '_')}_${categoria}_${sexo}.pdf`);
  }

  /**
   * Gera o Caderno Completo de uma Modalidade (Todas as Categorias em 1 só PDF)
   */
  public static async gerarCadernoModalidadeCompleto(
    modalidade: ModalidadeConfig,
    categoriasData: CategoriaSumulaData[]
  ): Promise<void> {
    const doc = criarDocumentoA4('portrait');
    const dataJogo = new Date(modalidade.dataEvento).toLocaleDateString('pt-BR');

    categoriasData.forEach((catData, idx) => {
      if (idx > 0) {
        doc.addPage();
      }
      this.desenharPaginaSumula(
        doc,
        modalidade.nome,
        catData.categoria,
        catData.sexo,
        dataJogo,
        catData.atletasComEscola
      );
    });

    const nomeFormatado = modalidade.nome.toUpperCase().replace(/\s+/g, '_');
    doc.save(`CADERNO_OFICIAL_SUMULAS_${nomeFormatado}_JEGDS2026.pdf`);
  }

  /**
   * Gera o Caderno Geral de Arbitragem com todas as modalidades reunidas
   */
  public static async gerarCadernoGeralArbitragem(
    modalidadesCompletas: { modalidade: ModalidadeConfig; categoriasData: CategoriaSumulaData[] }[]
  ): Promise<void> {
    const doc = criarDocumentoA4('portrait');
    let isFirstPage = true;

    modalidadesCompletas.forEach(item => {
      const dataJogo = new Date(item.modalidade.dataEvento).toLocaleDateString('pt-BR');
      item.categoriasData.forEach(catData => {
        if (!isFirstPage) {
          doc.addPage();
        } else {
          isFirstPage = false;
        }

        this.desenharPaginaSumula(
          doc,
          item.modalidade.nome,
          catData.categoria,
          catData.sexo,
          dataJogo,
          catData.atletasComEscola
        );
      });
    });

    doc.save('CADERNO_GERAL_ARBITRAGEM_JEGDS2026.pdf');
  }
}
