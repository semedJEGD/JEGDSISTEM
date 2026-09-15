import { jsPDF } from 'jspdf';
import { Escola, Atleta } from '@/types/jegd';
import { criarDocumentoA4 } from './pdf-types';

export class SumulaChamadaService {
  /**
   * Gera a Lista de Chamada Oficial do Comitê Organizador (Súmula de Check-in e WxO)
   */
  public static async gerarListaChamadaOficial(
    modalidadeNome: string,
    categoria: string,
    sexo: string,
    dataJogo: string,
    atletasComEscola: { atleta: Atleta; escola: Escola; provas?: string[] }[]
  ): Promise<void> {
    const doc = criarDocumentoA4('portrait');
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Topo Oficial
    doc.setFillColor(15, 23, 42);
    doc.rect(margin, 10, pageWidth - margin * 2, 26, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('JEGDS 2026 • SÚMULA E LISTA DE CHAMADA OFICIAL', pageWidth / 2, 18, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`MODALIDADE: ${modalidadeNome.toUpperCase()} • CATEGORIA: ${categoria} (${sexo})`, pageWidth / 2, 24, { align: 'center' });
    doc.text(`DATA PREVISTA DO CONFRONTO: ${dataJogo} • CHECK-IN: 30 MIN ANTES • WxO: 15 MIN DE TOLERÂNCIA`, pageWidth / 2, 30, { align: 'center' });

    // Tabela de Atletas
    let currentY = 42;
    doc.setFillColor(30, 41, 59);
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

    atletasComEscola.forEach((item, index) => {
      if (currentY > 250) {
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

    currentY += 10;
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    doc.setDrawColor(148, 163, 184);
    doc.line(margin + 10, currentY + 15, margin + 80, currentY + 15);
    doc.text('Assinatura do Árbitro Principal', margin + 45, currentY + 20, { align: 'center' });

    doc.line(pageWidth - margin - 80, currentY + 15, pageWidth - margin - 10, currentY + 15);
    doc.text('Assinatura do Mesário / Fiscal de Mesa', pageWidth - margin - 45, currentY + 20, { align: 'center' });

    doc.save(`Lista_Chamada_JEGDS_${modalidadeNome}_${categoria}.pdf`);
  }
}
