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

  private static logoCache: string | null = null;

  /**
   * Obtém a logo oficial do JEGD em Base64
   */
  private static async getLogoBase64(): Promise<string | null> {
    if (this.logoCache) return this.logoCache;
    if (typeof window === 'undefined') return null;
    try {
      const res = await fetch('/logo-jegd.png');
      if (!res.ok) return null;
      const blob = await res.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          this.logoCache = reader.result as string;
          resolve(this.logoCache);
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  /**
   * Desenha o Novo Modelo Oficial do Crachá JEGDS 2026 Dobrável (Frente e Verso lado a lado)
   * Dimensões desdobrado: 96mm x 76mm (Cada face mede 48mm x 76mm - Padrão Cartão / Porta-Crachá)
   */
  private static async desenharCrachaDobravelOficial(
    doc: jsPDF,
    x: number,
    y: number,
    atleta: Atleta,
    escola: Escola,
    modalidadeEspecifica?: string,
    professorNome?: string,
    logoBase64?: string | null
  ): Promise<void> {
    const wHalf = 48;
    const h = 76;
    const tokenCracha = atleta.crachaToken || `CR-${atleta.id.toUpperCase()}`;

    // -------------------------------------------------------------
    // 1. FRENTE (LADO ESQUERDO: x até x + 48)
    // -------------------------------------------------------------
    doc.setFillColor(255, 255, 255);
    doc.rect(x, y, wHalf, h, 'F');

    // Cabeçalho Carmim / Vinho Oficial (RGB: 139, 29, 44)
    doc.setFillColor(139, 29, 44);
    doc.rect(x, y, wHalf, 12, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('JEGDS 2026', x + 3, y + 5.5);

    doc.setFontSize(4);
    doc.setFont('helvetica', 'bold');
    doc.text('GONÇALVES DIAS • MA • SEMED', x + 3, y + 9.5);

    // Logo Circular no Canto Direito do Cabeçalho da Frente
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', x + wHalf - 11, y + 1.2, 9.5, 9.5);
      } catch {}
    }

    // Moldura e Foto 3x4 do Atleta (Centralizada)
    const fotoW = 16;
    const fotoH = 20;
    const fotoX = x + (wHalf - fotoW) / 2;
    const fotoY = y + 13.5;

    doc.setDrawColor(0, 168, 120);
    doc.setLineWidth(0.35);
    doc.roundedRect(fotoX, fotoY, fotoW, fotoH, 1.2, 1.2, 'S');

    if (atleta.documentos?.foto3x4) {
      try {
        doc.addImage(atleta.documentos.foto3x4, 'JPEG', fotoX + 0.3, fotoY + 0.3, fotoW - 0.6, fotoH - 0.6);
      } catch {
        this.desenharPlaceholderFoto(doc, fotoX + 0.3, fotoY + 0.3, fotoW - 0.6, fotoH - 0.6);
      }
    } else {
      this.desenharPlaceholderFoto(doc, fotoX + 0.3, fotoY + 0.3, fotoW - 0.6, fotoH - 0.6);
    }

    // Nome do Atleta (Caixa Alta, Negrito)
    doc.setTextColor(23, 34, 29);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text(atleta.nomeCompleto.toUpperCase(), x + wHalf / 2, y + 36.5, { align: 'center', maxWidth: 44 });

    // Nome da Escola
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5);
    const nomeEscolaTratado = escola.nome.toUpperCase().startsWith('ESCOLA') ? escola.nome.toUpperCase() : `ESCOLA ${escola.nome.toUpperCase()}`;
    doc.text(nomeEscolaTratado, x + wHalf / 2, y + 40, { align: 'center', maxWidth: 44 });

    // Pílula / Badge da Categoria (Verde Escuro)
    doc.setFillColor(6, 95, 70);
    doc.roundedRect(x + (wHalf - 20) / 2, y + 42, 20, 4.2, 1.2, 1.2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.8);
    doc.text(atleta.categoriaCalculada || 'LIVRE', x + wHalf / 2, y + 45.2, { align: 'center' });

    // Modalidade(s)
    doc.setTextColor(6, 95, 70);
    doc.setFontSize(4);
    doc.setFont('helvetica', 'bold');
    doc.text('MODALIDADE', x + wHalf / 2, y + 48.8, { align: 'center' });

    doc.setTextColor(23, 34, 29);
    doc.setFontSize(5);
    const modNome = modalidadeEspecifica || (atleta.modalidadesInscritas && atleta.modalidadesInscritas.length > 0 ? atleta.modalidadesInscritas.map(m => m.modalidadeNome).join(' / ') : 'DELEGAÇÃO OFICIAL');
    doc.text(modNome.toUpperCase().slice(0, 28), x + wHalf / 2, y + 52, { align: 'center', maxWidth: 44 });

    // Provas de Atletismo (quando houver)
    const atletaProvas = atleta.modalidadesInscritas?.find(m => m.provas && m.provas.length > 0)?.provas;
    if (atletaProvas && atletaProvas.length > 0) {
      doc.setTextColor(6, 95, 70);
      doc.setFontSize(3.6);
      doc.text('PROVAS', x + wHalf / 2, y + 55.2, { align: 'center' });
      doc.setTextColor(23, 34, 29);
      doc.setFontSize(4.2);
      doc.text(atletaProvas.join(' • ').toUpperCase(), x + wHalf / 2, y + 58, { align: 'center', maxWidth: 44 });
    }

    // Grid Inferior: Nascimento e Professor (2 colunas)
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(3.6);
    doc.setFont('helvetica', 'bold');
    doc.text('NASCIMENTO', x + 3.5, y + 61);
    doc.text('PROFESSOR', x + 26, y + 61);

    doc.setTextColor(23, 34, 29);
    doc.setFontSize(4.6);
    const sexoLetra = atleta.sexo === 'FEMININO' ? 'F' : 'M';
    const dataNasc = new Date(atleta.dataNascimento).toLocaleDateString('pt-BR');
    doc.text(`${dataNasc} • ${sexoLetra}`, x + 3.5, y + 64.5);

    const profNome = professorNome || atleta.cadastradoPor || escola.responsavelNome || 'SEMED';
    doc.text(profNome.slice(0, 15).toUpperCase(), x + 26, y + 64.5);

    // Rodapé da Frente
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(x, y + 67.5, x + wHalf, y + 67.5);
    doc.setFillColor(248, 250, 252);
    doc.rect(x, y + 67.5, wHalf, 8.5, 'F');

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(4.2);
    doc.setFont('helvetica', 'bold');
    doc.text(`ID ${tokenCracha}`, x + wHalf / 2, y + 71, { align: 'center' });

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(3.6);
    doc.text('USO OBRIGATÓRIO EM JOGO', x + wHalf / 2, y + 74, { align: 'center' });

    // -------------------------------------------------------------
    // 2. VERSO (LADO DIREITO: x + 48 até x + 96)
    // -------------------------------------------------------------
    const vX = x + wHalf;
    doc.setFillColor(255, 255, 255);
    doc.rect(vX, y, wHalf, h, 'F');

    // Cabeçalho Carmim / Vinho do Verso
    doc.setFillColor(139, 29, 44);
    doc.rect(vX, y, wHalf, 14, 'F');

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', vX + (wHalf - 8) / 2, y + 1, 8, 8);
      } catch {}
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('JEGDS 2026', vX + wHalf / 2, y + 10.5, { align: 'center' });

    doc.setFontSize(3.8);
    doc.setFont('helvetica', 'normal');
    doc.text('JOGOS ESCOLARES DE GONÇALVES DIAS', vX + wHalf / 2, y + 13, { align: 'center' });

    // Corpo do Verso: Direitos do Atleta
    doc.setTextColor(6, 95, 70);
    doc.setFontSize(4.5);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTE CRACHÁ DÁ DIREITO A', vX + wHalf / 2, y + 18, { align: 'center' });

    // Card 1: Água
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(vX + 4, y + 20, 40, 5.5, 1, 1, 'F');
    doc.setDrawColor(209, 213, 219);
    doc.rect(vX + 6.5, y + 21.2, 3, 3, 'S');
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(4.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Água durante os jogos', vX + 11.5, y + 23.8);

    // Card 2: Lanche e Refeições
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(vX + 4, y + 27, 40, 5.5, 1, 1, 'F');
    doc.setDrawColor(209, 213, 219);
    doc.rect(vX + 6.5, y + 28.2, 3, 3, 'S');
    doc.setTextColor(31, 41, 55);
    doc.setFontSize(4.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Lanches e refeições', vX + 11.5, y + 30.8);

    // QR Code Oficial de Validação e Logística
    const qrSize = 13.5;
    const qrX = vX + (wHalf - qrSize) / 2;
    const qrY = y + 34;

    try {
      const qrDataUrl = await QRCode.toDataURL(tokenCracha, {
        margin: 0,
        width: 80,
        errorCorrectionLevel: 'M'
      });
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    } catch {}

    // Instruções de Uso
    doc.setTextColor(107, 114, 128);
    doc.setFontSize(3.6);
    doc.setFont('helvetica', 'normal');
    doc.text('Crachá pessoal e intransferível.', vX + wHalf / 2, y + 50, { align: 'center' });
    doc.text('Apresente-o em todos os pontos de apoio.', vX + wHalf / 2, y + 52.5, { align: 'center' });

    // Faixa Escura SEMED / Prefeitura
    doc.setFillColor(23, 34, 29);
    doc.rect(vX, y + 55, wHalf, 4.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(4);
    doc.setFont('helvetica', 'bold');
    doc.text('SEMED • PREFEITURA DE GONÇALVES DIAS', vX + wHalf / 2, y + 58.2, { align: 'center' });

    // Rodapé Institucional: Brasão / Prefeitura & SEMED
    doc.setFillColor(255, 255, 255);
    doc.rect(vX, y + 59.5, wHalf, 16.5, 'F');

    // Lado Esquerdo: Prefeitura
    doc.setTextColor(220, 38, 38);
    doc.setFontSize(3.8);
    doc.setFont('helvetica', 'bold');
    doc.text('PREFEITURA', vX + 12, y + 63.5, { align: 'center' });

    doc.setFontSize(5);
    doc.text('GONÇALVES', vX + 12, y + 67, { align: 'center' });

    doc.setTextColor(5, 150, 105);
    doc.text('DIAS', vX + 12, y + 70.5, { align: 'center' });

    doc.setTextColor(107, 114, 128);
    doc.setFontSize(2.8);
    doc.text('Cuidando da nossa gente', vX + 12, y + 73.2, { align: 'center' });

    // Linha Divisória Central do Rodapé
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(vX + 24, y + 61.5, vX + 24, y + 74);

    // Lado Direito: SEMED
    doc.setTextColor(23, 34, 29);
    doc.setFontSize(4.6);
    doc.setFont('helvetica', 'bold');
    doc.text('SEMED', vX + 36, y + 65.5, { align: 'center' });

    doc.setTextColor(107, 114, 128);
    doc.setFontSize(3);
    doc.setFont('helvetica', 'normal');
    doc.text('Secretaria Municipal', vX + 36, y + 69, { align: 'center' });
    doc.text('de Educação', vX + 36, y + 72, { align: 'center' });

    // -------------------------------------------------------------
    // 3. CONTORNO EXTERNO E LINHA CENTRAL DE DOBRA
    // -------------------------------------------------------------
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, wHalf * 2, h, 2, 2, 'S');

    // Linha Tracejada no Meio para Dobra Perfeita
    doc.setDrawColor(156, 163, 175);
    doc.setLineWidth(0.25);
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.line(x + wHalf, y, x + wHalf, y + h);
    doc.setLineDashPattern([], 0);

    // Marcas de Corte nos 4 Cantos
    doc.setDrawColor(180, 190, 200);
    const mLen = 2.5;
    doc.line(x - mLen, y, x, y);
    doc.line(x, y - mLen, x, y);
    doc.line(x + wHalf * 2, y, x + wHalf * 2 + mLen, y);
    doc.line(x + wHalf * 2, y - mLen, x + wHalf * 2, y);
    doc.line(x - mLen, y + h, x, y + h);
    doc.line(x, y + h, x, y + h + mLen);
    doc.line(x + wHalf * 2, y + h, x + wHalf * 2 + mLen, y + h);
    doc.line(x + wHalf * 2, y + h, x + wHalf * 2, y + h + mLen);
  }

  /**
   * Gera Crachá Individual em PDF (Formato Dobrável Frente e Verso)
   */
  public static async gerarCrachaIndividual(
    atleta: Atleta,
    escola: Escola,
    professorNome?: string
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const crachaWidth = 96;
    const crachaHeight = 76;
    const centerX = (pageWidth - crachaWidth) / 2;
    const centerY = 35;

    const logoBase64 = await this.getLogoBase64();

    // Cabeçalho da Folha de Impressão Individual
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('JEGD 2026 • GUIA DE IMPRESSÃO DE CRACHÁ OFICIAL', pageWidth / 2, 18, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Recorte no contorno externo e dobre na linha central tracejada para plastificar ou usar em porta-crachá.', pageWidth / 2, 24, { align: 'center' });

    await this.desenharCrachaDobravelOficial(doc, centerX, centerY, atleta, escola, undefined, professorNome, logoBase64);

    // Instruções de Uso no rodapé da folha
    doc.setDrawColor(226, 232, 240);
    doc.line(20, centerY + crachaHeight + 20, pageWidth - 20, centerY + crachaHeight + 20);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('INSTRUÇÕES DE CONTROLE LOGÍSTICO & ARBITRAGEM:', 20, centerY + crachaHeight + 28);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text('1. O QR Code do crachá contém o token seguro e único do estudante-atleta.', 20, centerY + crachaHeight + 34);
    doc.text('2. Árbitros e Mesários devem ler o QR Code para checar elegibilidade e validar presença em quadra.', 20, centerY + crachaHeight + 39);
    doc.text('3. Equipes de apoio utilizam o mesmo crachá para registrar entrega de água e lanches nos pontos de apoio.', 20, centerY + crachaHeight + 44);

    doc.save(`Cracha_JEGD_${escola.sigla}_${atleta.nomeCompleto.replace(/\s+/g, '_')}.pdf`);
  }

  /**
   * Gera Crachás Oficiais em Lote por Escola (Otimizado: 6 Crachás Dobráveis Frente e Verso por Folha A4)
   */
  public static async gerarCrachasEmLote(
    escola: Escola,
    atletas: Atleta[],
    modalidadeNome?: string,
    categoria?: string
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const crachaWidth = 96;
    const crachaHeight = 76;
    const colXs = [6, 108]; // 2 Colunas perfeitamente centralizadas no A4 (210mm)
    const rowYs = [14, 100, 186]; // 3 Linhas perfeitamente distribuídas no A4 (297mm)
    const porPagina = 6;

    const logoBase64 = await this.getLogoBase64();

    // Ordenação: primeiro por Categoria (Mirim -> Infantil -> Infanto -> Junior), depois por Nome
    const ordemCategorias: Record<string, number> = {
      MIRIM: 1,
      INFANTIL: 2,
      INFANTO: 3,
      JUNIOR: 4
    };

    const atletasOrdenados = [...atletas].sort((a, b) => {
      const catA = ordemCategorias[a.categoriaCalculada || ''] || 99;
      const catB = ordemCategorias[b.categoriaCalculada || ''] || 99;
      if (catA !== catB) return catA - catB;
      return a.nomeCompleto.localeCompare(b.nomeCompleto);
    });

    for (let i = 0; i < atletasOrdenados.length; i++) {
      const atleta = atletasOrdenados[i];
      const pageIndex = Math.floor(i / porPagina);
      const slotIndex = i % porPagina;

      if (i > 0 && slotIndex === 0) {
        doc.addPage();
      }

      const col = slotIndex % 2;
      const row = Math.floor(slotIndex / 2);
      const x = colXs[col];
      const y = rowYs[row];

      await this.desenharCrachaDobravelOficial(doc, x, y, atleta, escola, modalidadeNome, undefined, logoBase64);

      // Rodapé da folha com paginação
      if (slotIndex === porPagina - 1 || i === atletasOrdenados.length - 1) {
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(
          `JEGDS 2026 • Lote de Crachás: ${escola.nome} (${escola.sigla}) • Página ${pageIndex + 1} de ${Math.ceil(atletasOrdenados.length / porPagina)}`,
          105,
          290,
          { align: 'center' }
        );
      }
    }

    const nomeArquivo = `Crachas_Lote_${escola.sigla.replace(/\s+/g, '_')}${modalidadeNome ? `_${modalidadeNome}` : ''}${categoria ? `_${categoria}` : ''}.pdf`;
    doc.save(nomeArquivo);
  }

  /**
   * Gera Todos os Crachás de Todas as Escolas (6 Crachás Dobráveis por Folha A4)
   */
  public static async gerarTodosCrachasGeral(
    escolas: Escola[],
    atletas: Atleta[]
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const colXs = [6, 108];
    const rowYs = [14, 100, 186];
    const porPagina = 6;

    const logoBase64 = await this.getLogoBase64();

    const ordemCategorias: Record<string, number> = {
      MIRIM: 1,
      INFANTIL: 2,
      INFANTO: 3,
      JUNIOR: 4
    };

    const atletasOrdenados = [...atletas].sort((a, b) => {
      const catA = ordemCategorias[a.categoriaCalculada || ''] || 99;
      const catB = ordemCategorias[b.categoriaCalculada || ''] || 99;
      if (catA !== catB) return catA - catB;
      return a.nomeCompleto.localeCompare(b.nomeCompleto);
    });

    for (let i = 0; i < atletasOrdenados.length; i++) {
      const atleta = atletasOrdenados[i];
      const escola = escolas.find(e => e.id === atleta.escolaId) || {
        id: 'geral',
        nome: 'Escola Municipal',
        sigla: 'SEMED',
        inep: '',
        rede: 'MUNICIPAL',
        bairro: '',
        endereco: '',
        responsavelNome: '',
        responsavelTelefone: '',
        loginEmail: '',
        createdAt: ''
      };

      const pageIndex = Math.floor(i / porPagina);
      const slotIndex = i % porPagina;

      if (i > 0 && slotIndex === 0) {
        doc.addPage();
      }

      const col = slotIndex % 2;
      const row = Math.floor(slotIndex / 2);
      const x = colXs[col];
      const y = rowYs[row];

      await this.desenharCrachaDobravelOficial(doc, x, y, atleta, escola, undefined, undefined, logoBase64);

      if (slotIndex === porPagina - 1 || i === atletasOrdenados.length - 1) {
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(
          `JEGDS 2026 • Lote Geral de Crachás • Página ${pageIndex + 1} de ${Math.ceil(atletasOrdenados.length / porPagina)}`,
          105,
          290,
          { align: 'center' }
        );
      }
    }

    doc.save('Crachas_TODOS_ATLETAS_JEGD_2026.pdf');
  }

  /**
   * Gera Relatório Oficial em PDF do Lote (Geral ou Filtrado por Modalidade/Categoria/Naipe)
   */
  public static async gerarLoteCompletoEscola(
    escola: Escola,
    atletas: Atleta[],
    inscricoes: InscricaoEquipe[] = [],
    filtroModalidade?: string,
    filtroCategoria?: string,
    filtroSexo?: string
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Filtros aplicados
    let atletasFiltrados = [...atletas];
    if (filtroModalidade && filtroModalidade !== 'TODAS') {
      atletasFiltrados = atletasFiltrados.filter(a => 
        a.modalidadesInscritas?.some(m => m.modalidadeNome.toLowerCase().includes(filtroModalidade.toLowerCase()) || m.modalidadeCodigo === filtroModalidade)
      );
    }
    if (filtroCategoria && filtroCategoria !== 'TODAS') {
      atletasFiltrados = atletasFiltrados.filter(a => a.categoriaCalculada === filtroCategoria);
    }
    if (filtroSexo && filtroSexo !== 'TODOS') {
      atletasFiltrados = atletasFiltrados.filter(a => a.sexo === filtroSexo);
    }

    // Cabeçalho Oficial
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(margin, 10, pageWidth - margin * 2, 28, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('JEGDS 2026 - JOGOS ESCOLARES DE GONÇALVES DIAS', pageWidth / 2, 18, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('SECRETARIA MUNICIPAL DE EDUCAÇÃO (SEMED) • PREFEITURA DE GONÇALVES DIAS - MA', pageWidth / 2, 24, { align: 'center' });
    
    let subtituloFiltro = 'RELATÓRIO OFICIAL DE DELEGAÇÃO ESCOLAR EM LOTE';
    if (filtroModalidade && filtroModalidade !== 'TODAS') subtituloFiltro += ` • MODALIDADE: ${filtroModalidade.toUpperCase()}`;
    if (filtroCategoria && filtroCategoria !== 'TODAS') subtituloFiltro += ` • CAT: ${filtroCategoria}`;
    if (filtroSexo && filtroSexo !== 'TODOS') subtituloFiltro += ` • NAIPE: ${filtroSexo}`;
    doc.text(subtituloFiltro, pageWidth / 2, 30, { align: 'center' });

    // Informações da Escola
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, 41, pageWidth - margin * 2, 26, 2, 2, 'FD');

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`UNIDADE ESCOLAR: ${escola.nome.toUpperCase()} (${escola.sigla})`, margin + 4, 47);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`INEP: ${escola.inep || 'N/A'} | Rede: ${escola.rede} | Responsável: ${escola.responsavelNome} (${escola.responsavelTelefone})`, margin + 4, 53);
    doc.text(`Total de Atletas Listados: ${atletasFiltrados.length} | Modalidades: ${inscricoes.map(i => i.modalidadeNome).join(', ') || 'Geral'}`, margin + 4, 59);

    // Tabela de Atletas do Lote
    let currentY = 70;
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, currentY, pageWidth - margin * 2, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');

    doc.text('Nº', margin + 3, currentY + 5);
    doc.text('ESTUDANTE-ATLETA', margin + 10, currentY + 5);
    doc.text('DATA NASC.', margin + 65, currentY + 5);
    doc.text('CAT/SEXO', margin + 88, currentY + 5);
    doc.text('DOCUMENTO', margin + 112, currentY + 5);
    doc.text('MODALIDADE(S)', margin + 142, currentY + 5);
    doc.text('CONFERÊNCIA', margin + 168, currentY + 5);

    currentY += 7;

    atletasFiltrados.forEach((atleta, index) => {
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
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');

      const numStr = (index + 1).toString().padStart(2, '0');
      doc.text(numStr, margin + 3, currentY + 5);
      doc.text(atleta.nomeCompleto.toUpperCase().slice(0, 26), margin + 10, currentY + 5);
      doc.text(new Date(atleta.dataNascimento).toLocaleDateString('pt-BR'), margin + 65, currentY + 5);
      
      const catInfo = (atleta.categoriaCalculada || 'N/A').slice(0, 4);
      doc.text(`${catInfo} (${atleta.sexo === 'MASCULINO' ? 'M' : 'F'})`, margin + 88, currentY + 5);
      
      const docStr = `${atleta.documentoTipo.slice(0, 3)}: ${atleta.documentoNumero}`;
      doc.text(docStr.slice(0, 15), margin + 112, currentY + 5);

      const modsStr = atleta.modalidadesInscritas?.map(m => m.modalidadeNome).join(', ') || 'N/A';
      doc.text(modsStr.slice(0, 15), margin + 142, currentY + 5);

      const statusConf = atleta.conferidoPeloCoordenador ? '[OK] HOMOLOGADO' : '[ ] PENDENTE';
      doc.text(statusConf, margin + 168, currentY + 5);

      currentY += 7;
    });

    currentY += 10;
    if (currentY > 245) {
      doc.addPage();
      currentY = 20;
    }

    doc.setDrawColor(148, 163, 184);
    doc.line(margin + 5, currentY + 15, margin + 75, currentY + 15);
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    doc.text('Professor Responsável da Escola', margin + 40, currentY + 20, { align: 'center' });

    doc.line(pageWidth - margin - 75, currentY + 15, pageWidth - margin - 5, currentY + 15);
    doc.text('Coordenação SEMED / Homologação', pageWidth - margin - 40, currentY + 20, { align: 'center' });

    const nomeArquivo = `Lote_${escola.sigla.replace(/\s+/g, '_')}${filtroModalidade && filtroModalidade !== 'TODAS' ? `_${filtroModalidade}` : ''}${filtroCategoria && filtroCategoria !== 'TODAS' ? `_${filtroCategoria}` : ''}.pdf`;
    doc.save(nomeArquivo);
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

