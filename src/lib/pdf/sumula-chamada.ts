import { jsPDF } from 'jspdf';
import { Escola, Atleta, ModalidadeConfig } from '@/types/jegd';
import { criarDocumentoA4 } from './pdf-types';

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
    const margin = 14;

    // Cabeçalho Oficial
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.rect(margin, 10, pageWidth - margin * 2, 26, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('JEGDS 2026 • SÚMULA E LISTA DE CHAMADA OFICIAL', pageWidth / 2, 18, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `MODALIDADE: ${modalidadeNome.toUpperCase()} • CATEGORIA: ${categoria} (${sexo})`,
      pageWidth / 2,
      24,
      { align: 'center' }
    );
    doc.text(
      `DATA PREVISTA: ${dataJogo} • CHECK-IN: 30 MIN ANTES • WxO: 15 MIN DE TOLERÂNCIA`,
      pageWidth / 2,
      30,
      { align: 'center' }
    );

    // Tabela de Atletas
    let currentY = 42;
    doc.setFillColor(30, 41, 59); // Slate-800
    doc.rect(margin, currentY, pageWidth - margin * 2, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    doc.text('Nº', margin + 3, currentY + 5);
    doc.text('NOME DO ATLETA', margin + 12, currentY + 5);
    doc.text('ESCOLA', margin + 85, currentY + 5);
    doc.text('DOC / RG', margin + 125, currentY + 5);
    doc.text('CHECK-IN (ASSINATURA / RUBRICA)', margin + 150, currentY + 5);

    currentY += 7;

    if (atletasComEscola.length === 0) {
      // Linha vazia de preenchimento para mesa
      for (let i = 1; i <= 12; i++) {
        if (currentY > pageHeight - 35) break;
        if (i % 2 === 0) {
          doc.setFillColor(241, 245, 249);
          doc.rect(margin, currentY, pageWidth - margin * 2, 7, 'F');
        }
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, currentY + 7, pageWidth - margin, currentY + 7);
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.text(i.toString().padStart(2, '0'), margin + 3, currentY + 5);
        doc.text('________________________________', margin + 12, currentY + 5);
        doc.text('__________________', margin + 85, currentY + 5);
        doc.text('___________', margin + 125, currentY + 5);
        doc.text('[   ] Presente  ________________', margin + 150, currentY + 5);
        currentY += 7;
      }
    } else {
      atletasComEscola.forEach((item, index) => {
        if (currentY > pageHeight - 35) {
          doc.addPage();
          currentY = 20;
        }

        if (index % 2 === 0) {
          doc.setFillColor(241, 245, 249);
          doc.rect(margin, currentY, pageWidth - margin * 2, 7, 'F');
        }

        doc.setDrawColor(226, 232, 240);
        doc.line(margin, currentY + 7, pageWidth - margin, currentY + 7);

        doc.setTextColor(30, 41, 59);
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');

        const numStr = (index + 1).toString().padStart(2, '0');
        doc.text(numStr, margin + 3, currentY + 5);
        doc.text(item.atleta.nomeCompleto.toUpperCase().slice(0, 32), margin + 12, currentY + 5);
        doc.text(item.escola.sigla || item.escola.nome.slice(0, 15), margin + 85, currentY + 5);
        doc.text(item.atleta.documentoNumero.slice(0, 14), margin + 125, currentY + 5);
        doc.text('[   ] Presente  ________________', margin + 150, currentY + 5);

        currentY += 7;
      });
    }

    // Área de Assinatura da Arbitragem
    const signY = Math.max(currentY + 12, pageHeight - 25);
    doc.setDrawColor(148, 163, 184);
    doc.line(margin + 10, signY, margin + 80, signY);
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(7);
    doc.text('Assinatura do Árbitro Principal', margin + 45, signY + 4, { align: 'center' });

    doc.line(pageWidth - margin - 80, signY, pageWidth - margin - 10, signY);
    doc.text('Assinatura do Mesário / Fiscal de Mesa', pageWidth - margin - 45, signY + 4, { align: 'center' });
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
    doc.save(`Lista_Chamada_JEGDS_${modalidadeNome.replace(/\s+/g, '_')}_${categoria}_${sexo}.pdf`);
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
    doc.save(`CADERNO_COMPLETO_${nomeFormatado}_JEGD2026.pdf`);
  }

  /**
   * Gera o Caderno Geral de Arbitragem com todas as 8 modalidades reunidas
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

    doc.save('CADERNO_GERAL_ARBITRAGEM_JEGD2026.pdf');
  }
}
