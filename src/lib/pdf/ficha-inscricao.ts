import { jsPDF } from 'jspdf';
import { Escola, Atleta, InscricaoEquipe, MembroComissao } from '@/types/jegd';
import { criarDocumentoA4 } from './pdf-types';

export class FichaInscricaoService {
  /**
   * Gera a Ficha Oficial de Inscrição da Equipe / Modalidade
   */
  public static async gerarFichaInscricao(
    escola: Escola,
    inscricao: InscricaoEquipe,
    atletas: Atleta[],
    comissao: MembroComissao[] = []
  ): Promise<void> {
    const doc = criarDocumentoA4('portrait');
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
}
