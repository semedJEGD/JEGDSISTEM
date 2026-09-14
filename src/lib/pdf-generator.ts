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
    comissao: MembroComissao[]
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Margens e Dimensões
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Cabeçalho Oficial
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, 10, pageWidth - margin * 2, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('JEGD 2026 - JOGOS ESCOLARES', pageWidth / 2, 19, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('SECRETARIA MUNICIPAL DE EDUCAÇÃO - COORDENAÇÃO DE EDUCAÇÃO FÍSICA E ESPORTE ESCOLAR', pageWidth / 2, 25, { align: 'center' });
    doc.text('FICHA OFICIAL DE INSCRIÇÃO POR MODALIDADE', pageWidth / 2, 31, { align: 'center' });

    // Informações da Escola e Modalidade
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, 42, pageWidth - margin * 2, 28, 2, 2, 'FD');

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`ESCOLA: ${escola.nome.toUpperCase()} (${escola.sigla})`, margin + 4, 49);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`INEP: ${escola.inep} | Rede: ${escola.rede} | Bairro: ${escola.bairro}`, margin + 4, 55);
    doc.text(`Diretor(a): ${escola.diretorNome}`, margin + 4, 61);
    doc.text(`Prof. Responsável: ${escola.professorRespNome}`, margin + 4, 67);

    // Box da Modalidade / Categoria
    doc.setFillColor(224, 242, 254);
    doc.rect(pageWidth - margin - 60, 44, 56, 24, 'F');
    doc.setTextColor(3, 105, 161);
    doc.setFont('helvetica', 'bold');
    doc.text(inscricao.modalidadeNome.toUpperCase(), pageWidth - margin - 32, 51, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`CAT: ${inscricao.categoria}`, pageWidth - margin - 32, 57, { align: 'center' });
    doc.text(`GÊNERO: ${inscricao.genero}`, pageWidth - margin - 32, 63, { align: 'center' });

    // Tabela de Atletas
    let currentY = 76;
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, currentY, pageWidth - margin * 2, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');

    doc.text('Nº', margin + 3, currentY + 5);
    doc.text('NOME COMPLETO DO ESTUDANTE-ATLETA', margin + 12, currentY + 5);
    doc.text('NASCIMENTO', margin + 95, currentY + 5);
    doc.text('CPF / RG', margin + 120, currentY + 5);
    doc.text('MATRÍCULA / TURMA', margin + 152, currentY + 5);

    currentY += 7;

    atletas.forEach((atleta, index) => {
      if (currentY > 240) {
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
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');

      const numStr = (index + 1).toString().padStart(2, '0');
      doc.text(numStr, margin + 3, currentY + 5);
      doc.text(atleta.nomeCompleto.toUpperCase(), margin + 12, currentY + 5);
      doc.text(new Date(atleta.dataNascimento).toLocaleDateString('pt-BR'), margin + 95, currentY + 5);
      doc.text(`${atleta.cpf || atleta.rg}`, margin + 120, currentY + 5);
      doc.text(`${atleta.matricula} (${atleta.serieTurma})`, margin + 152, currentY + 5);

      currentY += 7;
    });

    // Comissão Técnica
    currentY += 4;
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, currentY, pageWidth - margin * 2, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('COMISSÃO TÉCNICA / RESPONSÁVEIS', margin + 4, currentY + 4.5);

    currentY += 6;
    comissao.forEach((com, index) => {
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`${index + 1}. [${com.funcao}] ${com.nomeCompleto.toUpperCase()} - Registro/CREF: ${com.registroProfissional || 'N/A'} - Tel: ${com.telefone}`, margin + 4, currentY + 5);
      currentY += 6;
    });

    // Termo e Assinaturas
    currentY += 4;
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'DECLARAÇÃO: A Direção Escolar e os Professores responsáveis declaram que os alunos acima relacionados estão regularmente matriculados e com frequência ativa nesta Unidade de Ensino, estando devidamente autorizados pelos pais ou responsáveis legais a participar dos Jogos Escolares (JEGD 2026).',
      margin,
      currentY,
      { maxWidth: pageWidth - margin * 2 }
    );

    currentY += 22;

    const colWidth = (pageWidth - margin * 2) / 3;

    // Assinatura 1
    doc.line(margin + 5, currentY, margin + colWidth - 5, currentY);
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text('Diretor(a) Escolar', margin + colWidth / 2, currentY + 4, { align: 'center' });

    // Assinatura 2
    doc.line(margin + colWidth + 5, currentY, margin + colWidth * 2 - 5, currentY);
    doc.text('Professor(a) / Técnico Responsável', margin + colWidth * 1.5, currentY + 4, { align: 'center' });

    // Assinatura 3
    doc.line(margin + colWidth * 2 + 5, currentY, pageWidth - margin - 5, currentY);
    doc.text('Coordenação Geral JEGD / SEMED', margin + colWidth * 2.5, currentY + 4, { align: 'center' });

    // Salvar arquivo
    const fileName = `Ficha_Inscricao_${escola.sigla}_${inscricao.modalidadeNome}_${inscricao.categoria}.pdf`;
    doc.save(fileName);
  }

  /**
   * Gera Crachás / Credenciais Oficiais com Fotos e QR Codes
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

    const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
    const crachaWidth = 85;
    const crachaHeight = 54; // Padrão cartão PVC / Crachá
    const marginX = (pageWidth - crachaWidth * 2) / 3;
    const marginY = 15;
    const gapY = 8;

    let col = 0;
    let row = 0;

    for (let i = 0; i < atletas.length; i++) {
      const atleta = atletas[i];

      // Nova página a cada 8 crachás (2 colunas x 4 linhas)
      if (i > 0 && i % 8 === 0) {
        doc.addPage();
        col = 0;
        row = 0;
      }

      const x = marginX + col * (crachaWidth + marginX);
      const y = marginY + row * (crachaHeight + gapY);

      // Borda e fundo do crachá
      doc.setDrawColor(203, 213, 225);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(x, y, crachaWidth, crachaHeight, 3, 3, 'FD');

      // Topo Colorido do Crachá
      doc.setFillColor(16, 185, 129); // Esmeralda JEGD
      doc.rect(x, y, crachaWidth, 12, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text('JEGD 2026 • ATLETA OFICIAL', x + crachaWidth / 2, y + 6, { align: 'center' });
      doc.setFontSize(6.5);
      doc.text('SEMED - JOGOS ESCOLARES', x + crachaWidth / 2, y + 10, { align: 'center' });

      // Foto 3x4 / Placeholder
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
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(atleta.nomeCompleto.slice(0, 24).toUpperCase(), infoX, y + 18);

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(`Escola: ${escola.sigla} - ${escola.nome.slice(0, 18)}`, infoX, y + 23);
      doc.text(`Modalidade: ${modalidadeNome}`, infoX, y + 27);
      doc.text(`Categoria: ${categoria} (${atleta.genero})`, infoX, y + 31);
      doc.text(`Matrícula: ${atleta.matricula} | Turma: ${atleta.serieTurma}`, infoX, y + 35);
      doc.text(`Nasc: ${new Date(atleta.dataNascimento).toLocaleDateString('pt-BR')}`, infoX, y + 39);

      // Gerar QR Code de Validação
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
      } catch {
        // Fallback silencioso
      }

      // Rodapé do crachá
      doc.setFillColor(241, 245, 249);
      doc.rect(x, y + crachaHeight - 5, crachaWidth, 5, 'F');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(5);
      doc.text(`ID: ${atleta.id} • DOCUMENTO OBRIGATÓRIO DE ACESSO AOS JOGOS`, x + crachaWidth / 2, y + crachaHeight - 1.5, { align: 'center' });

      // Avançar coluna e linha
      col++;
      if (col > 1) {
        col = 0;
        row++;
      }
    }

    doc.save(`Crachas_Oficiais_${escola.sigla}_${modalidadeNome}.pdf`);
  }

  private static desenharPlaceholderFoto(doc: jsPDF, x: number, y: number, w: number, h: number): void {
    doc.setFillColor(226, 232, 240);
    doc.rect(x, y, w, h, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(x, y, w, h, 'S');
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(6);
    doc.text('FOTO', x + w / 2, y + h / 2, { align: 'center' });
  }
}
