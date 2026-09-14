import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Escola, Atleta, MembroComissao, InscricaoEquipe } from '@/types/jegd';

export class JegdPdfGenerator {
  /**
   * Gera a Ficha Oficial de Inscrição da Equipe / Modalidade
   */
  public static async gerarFichaInscricao(
    escola: Escola,
    inscricao: InscricaoEquipe,
    atletas: Atleta[],
    comissao: MembroComissao[] = []
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Cabeçalho Oficial
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, 10, pageWidth - margin * 2, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('JEGDS 2026 - JOGOS ESCOLARES DE GONÇALVES DIAS', pageWidth / 2, 19, { align: 'center' });

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('PREFEITURA MUNICIPAL DE GONÇALVES DIAS - MA • SECRETARIA MUNICIPAL DE EDUCAÇÃO (SEMED)', pageWidth / 2, 25, { align: 'center' });
    doc.text('COMPROVANTE OFICIAL DE INSCRIÇÃO POR MODALIDADE', pageWidth / 2, 31, { align: 'center' });

    // Informações da Escola e Modalidade
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, 42, pageWidth - margin * 2, 28, 2, 2, 'FD');

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`UNIDADE DE ENSINO: ${escola.nome.toUpperCase()} (${escola.sigla})`, margin + 4, 49);

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`INEP: ${escola.inep || 'N/A'} | Rede: ${escola.rede} | Bairro: ${escola.bairro || 'Centro'}`, margin + 4, 55);
    doc.text(`Responsável: ${escola.responsavelNome} • Contato: ${escola.responsavelTelefone}`, margin + 4, 61);
    doc.text(`Endereço: ${escola.endereco}`, margin + 4, 67);

    // Box da Modalidade / Categoria
    doc.setFillColor(224, 242, 254);
    doc.rect(pageWidth - margin - 60, 44, 56, 24, 'F');
    doc.setTextColor(3, 105, 161);
    doc.setFont('helvetica', 'bold');
    doc.text(inscricao.modalidadeNome.toUpperCase(), pageWidth - margin - 32, 51, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`CATEGORIA: ${inscricao.categoria}`, pageWidth - margin - 32, 57, { align: 'center' });
    doc.text(`GÊNERO: ${inscricao.sexo}`, pageWidth - margin - 32, 63, { align: 'center' });

    // Tabela de Atletas
    let currentY = 76;
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, currentY, pageWidth - margin * 2, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');

    doc.text('Nº', margin + 3, currentY + 5);
    doc.text('NOME COMPLETO DO ESTUDANTE-ATLETA', margin + 12, currentY + 5);
    doc.text('DATA NASC.', margin + 90, currentY + 5);
    doc.text('DOC (RG / CERTIDÃO)', margin + 115, currentY + 5);
    doc.text('PROVAS / MATRÍCULA', margin + 152, currentY + 5);

    currentY += 7;

    atletas.forEach((atleta, index) => {
      if (currentY > 235) {
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
      doc.text(atleta.nomeCompleto.toUpperCase(), margin + 12, currentY + 5);
      doc.text(new Date(atleta.dataNascimento).toLocaleDateString('pt-BR'), margin + 90, currentY + 5);
      
      const docStr = `${atleta.documentoTipo}: ${atleta.documentoNumero}`;
      doc.text(docStr, margin + 115, currentY + 5);

      const provasAtleta = inscricao.provasPorAtleta?.[atleta.id];
      const extraStr = provasAtleta && provasAtleta.length > 0
        ? `Provas: ${provasAtleta.join(', ')}`
        : `Matr: ${atleta.matricula || 'OK'} (${atleta.serieTurma || ''})`;
      
      doc.text(extraStr.slice(0, 24), margin + 152, currentY + 5);

      currentY += 7;
    });

    // Termo LGPD e Assinaturas
    currentY += 6;
    if (currentY > 225) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'DECLARAÇÃO E CONSENTIMENTO LGPD: Declaramos que os alunos acima relacionados estão regularmente matriculados nesta instituição de ensino em Gonçalves Dias - MA e possuem expressa autorização dos pais ou responsáveis legais para participação no JEGDS 2026, com termo de consentimento arquivado na secretaria escolar.',
      margin,
      currentY,
      { maxWidth: pageWidth - margin * 2 }
    );

    currentY += 24;
    const colWidth = (pageWidth - margin * 2) / 3;

    doc.setDrawColor(148, 163, 184);
    doc.line(margin + 5, currentY, margin + colWidth - 5, currentY);
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text('Direção / Responsável Escolar', margin + colWidth / 2, currentY + 4, { align: 'center' });

    doc.line(margin + colWidth + 5, currentY, margin + colWidth * 2 - 5, currentY);
    doc.text('Professor / Técnico Responsável', margin + colWidth * 1.5, currentY + 4, { align: 'center' });

    doc.line(margin + colWidth * 2 + 5, currentY, pageWidth - margin - 5, currentY);
    doc.text('Comitê Organizador JEGDS 2026', margin + colWidth * 2.5, currentY + 4, { align: 'center' });

    doc.save(`Ficha_JEGDS_${escola.sigla}_${inscricao.modalidadeNome}_${inscricao.categoria}.pdf`);
  }

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
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

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

  /**
   * Gera Crachás Oficiais em Lote
   */
  public static async gerarCrachasEmLote(
    escola: Escola,
    atletas: Atleta[],
    modalidadeNome: string,
    categoria: string
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const crachaWidth = 85;
    const crachaHeight = 54;
    const marginX = (pageWidth - crachaWidth * 2) / 3;
    const marginY = 15;
    const gapY = 8;

    let col = 0;
    let row = 0;

    for (let i = 0; i < atletas.length; i++) {
      const atleta = atletas[i];

      if (i > 0 && i % 8 === 0) {
        doc.addPage();
        col = 0;
        row = 0;
      }

      const x = marginX + col * (crachaWidth + marginX);
      const y = marginY + row * (crachaHeight + gapY);

      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, y, crachaWidth, crachaHeight, 3, 3, 'FD');

      doc.setFillColor(16, 185, 129);
      doc.rect(x, y, crachaWidth, 12, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text('JEGDS 2026 • GONÇALVES DIAS', x + crachaWidth / 2, y + 6, { align: 'center' });
      doc.setFontSize(6.5);
      doc.text('CREDENCIAL OFICIAL DE ATLETA', x + crachaWidth / 2, y + 10, { align: 'center' });

      // Placeholder ou foto
      const fotoX = x + 4;
      const fotoY = y + 15;
      const fotoW = 20;
      const fotoH = 25;

      if (atleta.documentos?.foto3x4) {
        try {
          doc.addImage(atleta.documentos.foto3x4, 'JPEG', fotoX, fotoY, fotoW, fotoH);
        } catch {
          this.desenharPlaceholderFoto(doc, fotoX, fotoY, fotoW, fotoH);
        }
      } else {
        this.desenharPlaceholderFoto(doc, fotoX, fotoY, fotoW, fotoH);
      }

      // Dados do Atleta
      const infoX = x + 26;
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.text(atleta.nomeCompleto.slice(0, 22).toUpperCase(), infoX, y + 18);

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Escola: ${escola.sigla} - ${escola.nome.slice(0, 16)}`, infoX, y + 23);
      doc.text(`Modalidade: ${modalidadeNome}`, infoX, y + 27);
      doc.text(`Cat: ${categoria} (${atleta.sexo})`, infoX, y + 31);
      doc.text(`Doc: ${atleta.documentoTipo} ${atleta.documentoNumero}`, infoX, y + 35);
      doc.text(`Nasc: ${new Date(atleta.dataNascimento).toLocaleDateString('pt-BR')}`, infoX, y + 39);

      // QR Code
      try {
        const qrPayload = JSON.stringify({
          id: atleta.id,
          nome: atleta.nomeCompleto,
          escola: escola.sigla,
          modalidade: modalidadeNome,
          cat: categoria,
          validado: true
        });
        const qrDataUrl = await QRCode.toDataURL(qrPayload, { margin: 1, width: 80 });
        doc.addImage(qrDataUrl, 'PNG', x + crachaWidth - 19, y + crachaHeight - 19, 16, 16);
      } catch {}

      // Rodapé do crachá
      doc.setFillColor(241, 245, 249);
      doc.rect(x, y + crachaHeight - 5, crachaWidth, 5, 'F');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(5);
      doc.text(`ID: ${atleta.id} • APRESENTAR JUNTO COM DOCUMENTO OFICIAL COM FOTO`, x + crachaWidth / 2, y + crachaHeight - 1.5, { align: 'center' });

      col++;
      if (col > 1) {
        col = 0;
        row++;
      }
    }

    doc.save(`Crachas_JEGDS_${escola.sigla}_${modalidadeNome}.pdf`);
  }

  private static desenharPlaceholderFoto(doc: jsPDF, x: number, y: number, w: number, h: number): void {
    doc.setFillColor(226, 232, 240);
    doc.rect(x, y, w, h, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(x, y, w, h, 'S');
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(6);
    doc.text('FOTO 3X4', x + w / 2, y + h / 2, { align: 'center' });
  }
}
