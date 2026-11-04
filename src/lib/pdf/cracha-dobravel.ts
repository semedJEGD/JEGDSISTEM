import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Escola, Atleta } from '@/types/jegd';
import { criarDocumentoA4, CORES_JEGD, carregarImagemBase64, ajustarFonte } from './pdf-types';

export class CrachaDobravelService {
  private static logoCache: string | null = null;
  private static brasaoCache: string | null = null;

  /**
   * Obtém a logo oficial do JEGD em Base64
   */
  public static async getLogoBase64(): Promise<string | null> {
    if (this.logoCache) return this.logoCache;
    this.logoCache = await carregarImagemBase64('/logo-jegd.png');
    return this.logoCache;
  }

  /**
   * Obtém o brasão da Prefeitura em Base64
   */
  public static async getBrasaoBase64(): Promise<string | null> {
    if (this.brasaoCache) return this.brasaoCache;
    this.brasaoCache = await carregarImagemBase64('/logos/prefeitura-goncalves-dias.png');
    return this.brasaoCache;
  }

  /**
   * Placeholder visual caso o atleta não tenha foto 3x4 anexada
   */
  public static desenharPlaceholderFoto(doc: jsPDF, x: number, y: number, w: number, h: number): void {
    doc.setFillColor(...CORES_JEGD.fundoZebra);
    doc.roundedRect(x, y, w, h, 1, 1, 'F');
    doc.setDrawColor(...CORES_JEGD.borda);
    doc.setLineWidth(0.25);
    doc.roundedRect(x, y, w, h, 1, 1, 'S');

    // Ícone silhueta estilizado
    doc.setFillColor(...CORES_JEGD.borda);
    const cx = x + w / 2;
    // Cabeça
    doc.circle(cx, y + h * 0.38, 2.8, 'F');
    // Ombros
    doc.roundedRect(cx - 4.5, y + h * 0.55, 9, 5, 2, 2, 'F');

    doc.setTextColor(...CORES_JEGD.textoMuted);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.2);
    doc.text('FOTO 3X4', cx, y + h - 2, { align: 'center' });
  }

  /**
   * Desenha o Novo Modelo Oficial do Crachá JEGDS 2026 Dobrável (Frente e Verso lado a lado)
   * Dimensões desdobrado: 96mm x 76mm (Cada face mede 48mm x 76mm - Padrão Cartão / Porta-Crachá)
   */
  public static async desenharCrachaDobravelOficial(
    doc: jsPDF,
    x: number,
    y: number,
    atleta: Atleta,
    escola: Escola,
    modalidadeEspecifica?: string,
    professorNome?: string,
    logoBase64?: string | null,
    brasaoBase64?: string | null
  ): Promise<void> {
    const wHalf = 48;
    const h = 76;
    const headerH = 14; // Altura idêntica na frente e no verso (Simetria de Dobra 100%)
    const tokenCracha = atleta.crachaToken || `CR-${atleta.id.toUpperCase().slice(0, 8)}`;

    // -------------------------------------------------------------
    // 1. FRENTE (LADO ESQUERDO: x até x + 48)
    // -------------------------------------------------------------
    // Fundo Branco do Crachá
    doc.setFillColor(255, 255, 255);
    doc.rect(x, y, wHalf, h, 'F');

    // Cabeçalho Carmim / Vinho Oficial JEGDS
    doc.setFillColor(...CORES_JEGD.primaria);
    doc.rect(x, y, wHalf, headerH, 'F');

    // Linha dourada de detalhe na base do cabeçalho
    doc.setFillColor(...CORES_JEGD.destaqueOuro);
    doc.rect(x, y + headerH - 0.7, wHalf, 0.7, 'F');

    // Tipografia do Cabeçalho da Frente
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('JEGDS 2026', x + 3.5, y + 6);

    doc.setFontSize(4.0);
    doc.setFont('helvetica', 'bold');
    doc.text('GONÇALVES DIAS • MA • SEMED', x + 3.5, y + 10.2);

    // Logo Circular no Canto Direito do Cabeçalho
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', x + wHalf - 12.5, y + 1.5, 10.5, 10.5);
      } catch {}
    }

    // Moldura e Foto 3x4 do Atleta (Centralizada)
    const fotoW = 16.5;
    const fotoH = 20.5;
    const fotoX = x + (wHalf - fotoW) / 2;
    const fotoY = y + 15.5;

    doc.setDrawColor(...CORES_JEGD.secundaria);
    doc.setLineWidth(0.4);
    doc.roundedRect(fotoX, fotoY, fotoW, fotoH, 1, 1, 'S');

    if (atleta.documentos?.foto3x4) {
      try {
        doc.addImage(atleta.documentos.foto3x4, 'JPEG', fotoX + 0.3, fotoY + 0.3, fotoW - 0.6, fotoH - 0.6);
      } catch {
        this.desenharPlaceholderFoto(doc, fotoX + 0.3, fotoY + 0.3, fotoW - 0.6, fotoH - 0.6);
      }
    } else {
      this.desenharPlaceholderFoto(doc, fotoX + 0.3, fotoY + 0.3, fotoW - 0.6, fotoH - 0.6);
    }

    // Nome do Atleta (Tipografia Responsiva para Evitar Colisão)
    doc.setTextColor(...CORES_JEGD.escuro);
    doc.setFont('helvetica', 'bold');
    const nomeLimpo = atleta.nomeCompleto.toUpperCase();
    ajustarFonte(doc, nomeLimpo, 44, 6.6, 4.8);
    doc.text(nomeLimpo, x + wHalf / 2, y + 38.5, { align: 'center', maxWidth: 44 });

    // Nome da Escola
    doc.setTextColor(...CORES_JEGD.textoMuted);
    doc.setFont('helvetica', 'bold');
    const nomeEscolaTratado = escola.nome.toUpperCase().startsWith('ESC') ? escola.nome.toUpperCase() : `ESC. ${escola.nome.toUpperCase()}`;
    ajustarFonte(doc, nomeEscolaTratado, 44, 5.0, 3.8);
    doc.text(nomeEscolaTratado, x + wHalf / 2, y + 42.5, { align: 'center', maxWidth: 44 });

    // Pílula / Badge da Categoria & Sexo
    const pillW = 25;
    const pillH = 4.2;
    const pillX = x + (wHalf - pillW) / 2;
    const pillY = y + 44.8;
    doc.setFillColor(...CORES_JEGD.secundariaEscura);
    doc.roundedRect(pillX, pillY, pillW, pillH, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.6);
    const catSexo = `${atleta.categoriaCalculada || 'LIVRE'} • ${atleta.sexo === 'FEMININO' ? 'FEM' : 'MASC'}`;
    doc.text(catSexo, x + wHalf / 2, pillY + 3.0, { align: 'center' });

    // Modalidade(s)
    doc.setTextColor(...CORES_JEGD.secundariaEscura);
    doc.setFontSize(3.6);
    doc.setFont('helvetica', 'bold');
    doc.text('MODALIDADE', x + wHalf / 2, y + 51.5, { align: 'center' });

    doc.setTextColor(...CORES_JEGD.grafite);
    doc.setFont('helvetica', 'bold');
    const modNome = modalidadeEspecifica || (atleta.modalidadesInscritas && atleta.modalidadesInscritas.length > 0 ? atleta.modalidadesInscritas.map(m => m.modalidadeNome).join(' / ') : 'DELEGAÇÃO ESCOLAR');
    ajustarFonte(doc, modNome.toUpperCase(), 44, 5.0, 3.8);
    doc.text(modNome.toUpperCase(), x + wHalf / 2, y + 54.8, { align: 'center', maxWidth: 44 });

    // Provas de Atletismo (quando houver)
    const atletaProvas = atleta.modalidadesInscritas?.find(m => m.provas && m.provas.length > 0)?.provas;
    if (atletaProvas && atletaProvas.length > 0) {
      doc.setTextColor(...CORES_JEGD.destaqueOuro);
      doc.setFontSize(3.8);
      doc.setFont('helvetica', 'bold');
      doc.text(atletaProvas.join(' • ').toUpperCase(), x + wHalf / 2, y + 58.2, { align: 'center', maxWidth: 44 });
    }

    // Grid Inferior: Nascimento e Documento (2 colunas)
    doc.setTextColor(...CORES_JEGD.textoMuted);
    doc.setFontSize(3.4);
    doc.setFont('helvetica', 'bold');
    doc.text('NASCIMENTO', x + 3.5, y + 61.2);
    doc.text('DOCUMENTO / DOC', x + 25, y + 61.2);

    doc.setTextColor(...CORES_JEGD.escuro);
    doc.setFontSize(4.4);
    doc.setFont('helvetica', 'bold');
    const dataNasc = new Date(atleta.dataNascimento).toLocaleDateString('pt-BR');
    doc.text(dataNasc, x + 3.5, y + 64.5);

    const docStr = `${atleta.documentoTipo}: ${atleta.documentoNumero}`;
    doc.setFontSize(4.0);
    doc.text(docStr.slice(0, 16), x + 25, y + 64.5);

    // Rodapé da Frente
    doc.setFillColor(...CORES_JEGD.fundoCinza);
    doc.rect(x, y + 67.5, wHalf, 8.5, 'F');
    doc.setDrawColor(...CORES_JEGD.bordaSuave);
    doc.setLineWidth(0.25);
    doc.line(x, y + 67.5, x + wHalf, y + 67.5);

    doc.setTextColor(...CORES_JEGD.escuro);
    doc.setFontSize(4.6);
    doc.setFont('helvetica', 'bold');
    doc.text(`ID: ${tokenCracha}`, x + wHalf / 2, y + 71.2, { align: 'center' });

    doc.setTextColor(...CORES_JEGD.textoMuted);
    doc.setFontSize(3.4);
    doc.setFont('helvetica', 'normal');
    doc.text('ESTUDANTE-ATLETA • USO OBRIGATÓRIO', x + wHalf / 2, y + 74.2, { align: 'center' });

    // -------------------------------------------------------------
    // 2. VERSO (LADO DIREITO: x + 48 até x + 96)
    // -------------------------------------------------------------
    const vX = x + wHalf;
    doc.setFillColor(255, 255, 255);
    doc.rect(vX, y, wHalf, h, 'F');

    // Cabeçalho Carmim / Vinho do Verso (EXATA MESMA ALTURA: 14mm)
    doc.setFillColor(...CORES_JEGD.primaria);
    doc.rect(vX, y, wHalf, headerH, 'F');

    // Linha dourada de detalhe
    doc.setFillColor(...CORES_JEGD.destaqueOuro);
    doc.rect(vX, y + headerH - 0.7, wHalf, 0.7, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('JEGDS 2026', vX + wHalf / 2, y + 6.2, { align: 'center' });

    doc.setFontSize(3.8);
    doc.setFont('helvetica', 'bold');
    doc.text('JOGOS ESCOLARES DE GONÇALVES DIAS', vX + wHalf / 2, y + 10.2, { align: 'center' });

    // Título do Bloco de Logística
    doc.setTextColor(...CORES_JEGD.secundariaEscura);
    doc.setFontSize(4.4);
    doc.setFont('helvetica', 'bold');
    doc.text('CONTROLE LOGÍSTICO & ACESSO', vX + wHalf / 2, y + 18, { align: 'center' });

    // Card 1: Hidratação
    doc.setFillColor(...CORES_JEGD.fundoCinza);
    doc.roundedRect(vX + 4, y + 20, 40, 5.2, 1, 1, 'F');
    doc.setDrawColor(...CORES_JEGD.bordaSuave);
    doc.setLineWidth(0.2);
    doc.roundedRect(vX + 4, y + 20, 40, 5.2, 1, 1, 'S');

    doc.setDrawColor(...CORES_JEGD.secundaria);
    doc.rect(vX + 6.2, y + 21.1, 3, 3, 'S');
    doc.setTextColor(...CORES_JEGD.grafite);
    doc.setFontSize(4.2);
    doc.setFont('helvetica', 'bold');
    doc.text('Água & Hidratação durante os jogos', vX + 11.2, y + 23.6);

    // Card 2: Lanche e Refeições
    doc.setFillColor(...CORES_JEGD.fundoCinza);
    doc.roundedRect(vX + 4, y + 26.2, 40, 5.2, 1, 1, 'F');
    doc.setDrawColor(...CORES_JEGD.bordaSuave);
    doc.setLineWidth(0.2);
    doc.roundedRect(vX + 4, y + 26.2, 40, 5.2, 1, 1, 'S');

    doc.setDrawColor(...CORES_JEGD.secundaria);
    doc.rect(vX + 6.2, y + 27.3, 3, 3, 'S');
    doc.setTextColor(...CORES_JEGD.grafite);
    doc.setFontSize(4.2);
    doc.setFont('helvetica', 'bold');
    doc.text('Lanche & Alimentação da Delegação', vX + 11.2, y + 29.8);

    // QR Code Oficial de Validação
    const qrSize = 14.5;
    const qrX = vX + (wHalf - qrSize) / 2;
    const qrY = y + 32.5;

    try {
      const qrDataUrl = await QRCode.toDataURL(tokenCracha, {
        margin: 0,
        width: 100,
        errorCorrectionLevel: 'M'
      });
      doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    } catch {}

    // Token do QR Code para leitura manual da mesa
    doc.setTextColor(...CORES_JEGD.escuro);
    doc.setFontSize(4.0);
    doc.setFont('helvetica', 'bold');
    doc.text(`VALIDAÇÃO: ${tokenCracha}`, vX + wHalf / 2, y + 49.5, { align: 'center' });

    // Instruções de Uso
    doc.setTextColor(...CORES_JEGD.textoMuted);
    doc.setFontSize(3.3);
    doc.setFont('helvetica', 'normal');
    doc.text('Crachá pessoal e intransferível.', vX + wHalf / 2, y + 53.0, { align: 'center' });
    doc.text('Apresentação obrigatória na entrada de quadra.', vX + wHalf / 2, y + 55.5, { align: 'center' });

    // Faixa Escura SEMED / Prefeitura
    doc.setFillColor(...CORES_JEGD.escuro);
    doc.rect(vX, y + 58, wHalf, 4.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(3.8);
    doc.setFont('helvetica', 'bold');
    doc.text('SEMED • PREFEITURA DE GONÇALVES DIAS', vX + wHalf / 2, y + 61.2, { align: 'center' });

    // Rodapé Institucional: Prefeitura & SEMED
    doc.setFillColor(255, 255, 255);
    doc.rect(vX, y + 62.5, wHalf, 13.5, 'F');
    doc.setDrawColor(...CORES_JEGD.bordaSuave);
    doc.setLineWidth(0.2);
    doc.line(vX, y + 62.5, vX + wHalf, y + 62.5);

    // Lado Esquerdo: Prefeitura
    doc.setTextColor(185, 28, 28); // red-700
    doc.setFontSize(3.8);
    doc.setFont('helvetica', 'bold');
    doc.text('PREFEITURA', vX + 12, y + 66.5, { align: 'center' });

    doc.setFontSize(4.4);
    doc.setTextColor(...CORES_JEGD.escuro);
    doc.text('GONÇALVES DIAS', vX + 12, y + 70.0, { align: 'center' });

    doc.setTextColor(...CORES_JEGD.textoMuted);
    doc.setFontSize(2.8);
    doc.setFont('helvetica', 'normal');
    doc.text('Cuidando da nossa gente', vX + 12, y + 73.0, { align: 'center' });

    // Linha Divisória Central
    doc.setDrawColor(...CORES_JEGD.bordaSuave);
    doc.setLineWidth(0.2);
    doc.line(vX + 24, y + 64, vX + 24, y + 74);

    // Lado Direito: SEMED
    doc.setTextColor(...CORES_JEGD.escuro);
    doc.setFontSize(4.2);
    doc.setFont('helvetica', 'bold');
    doc.text('SEMED', vX + 36, y + 66.5, { align: 'center' });

    doc.setTextColor(...CORES_JEGD.textoMuted);
    doc.setFontSize(2.8);
    doc.setFont('helvetica', 'normal');
    doc.text('Secretaria Municipal', vX + 36, y + 69.8, { align: 'center' });
    doc.text('de Educação', vX + 36, y + 72.8, { align: 'center' });

    // -------------------------------------------------------------
    // 3. CONTORNO EXTERNO E LINHA CENTRAL DE DOBRA PERFEITA
    // -------------------------------------------------------------
    doc.setDrawColor(...CORES_JEGD.borda);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, wHalf * 2, h, 1.5, 1.5, 'S');

    // Linha Tracejada no Meio Exato para Dobra Perfeita (x + 48)
    doc.setDrawColor(156, 163, 175);
    doc.setLineWidth(0.25);
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.line(x + wHalf, y, x + wHalf, y + h);
    doc.setLineDashPattern([], 0);

    // Guias de Dobra (Pequenos Vínculos no Topo e na Base)
    doc.setDrawColor(...CORES_JEGD.primaria);
    doc.setLineWidth(0.3);
    doc.line(x + wHalf, y - 2, x + wHalf, y);
    doc.line(x + wHalf, y + h, x + wHalf, y + h + 2);

    // Marcas de Corte Precisas nos 4 Cantos (Externas para não sujar o crachá)
    doc.setDrawColor(160, 174, 192);
    doc.setLineWidth(0.25);
    const mLen = 2.5;
    // Canto Superior Esquerdo
    doc.line(x - mLen, y, x, y);
    doc.line(x, y - mLen, x, y);
    // Canto Superior Direito
    doc.line(x + wHalf * 2, y, x + wHalf * 2 + mLen, y);
    doc.line(x + wHalf * 2, y - mLen, x + wHalf * 2, y);
    // Canto Inferior Esquerdo
    doc.line(x - mLen, y + h, x, y + h);
    doc.line(x, y + h, x, y + h + mLen);
    // Canto Inferior Direito
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
    const doc = criarDocumentoA4('portrait');
    const pageWidth = doc.internal.pageSize.getWidth();
    const crachaWidth = 96;
    const crachaHeight = 76;
    const centerX = (pageWidth - crachaWidth) / 2;
    const centerY = 40;

    const logoBase64 = await this.getLogoBase64();
    const brasaoBase64 = await this.getBrasaoBase64();

    // Cabeçalho da Folha de Impressão
    doc.setFillColor(...CORES_JEGD.primaria);
    doc.rect(14, 12, pageWidth - 28, 18, 'F');
    doc.setFillColor(...CORES_JEGD.destaqueOuro);
    doc.rect(14, 29.3, pageWidth - 28, 0.7, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('JEGDS 2026 • GUIA OFICIAL DE IMPRESSÃO DE CRACHÁ', pageWidth / 2, 21, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Secretaria Municipal de Educação (SEMED) • Prefeitura de Gonçalves Dias - MA', pageWidth / 2, 26, { align: 'center' });

    // Instrução
    doc.setFontSize(8.0);
    doc.setTextColor(...CORES_JEGD.textoMuted);
    doc.text('Recorte pelas marcas externas e dobre na linha central tracejada para plastificar ou colocar no porta-crachá.', pageWidth / 2, 35, { align: 'center' });

    // Desenha o Crachá Centralizado
    await this.desenharCrachaDobravelOficial(doc, centerX, centerY, atleta, escola, undefined, professorNome, logoBase64, brasaoBase64);

    // Painel de Instruções de Validação
    const boxY = centerY + crachaHeight + 16;
    doc.setFillColor(...CORES_JEGD.fundoCinza);
    doc.roundedRect(centerX - 10, boxY, crachaWidth + 20, 36, 2, 2, 'F');
    doc.setDrawColor(...CORES_JEGD.bordaSuave);
    doc.roundedRect(centerX - 10, boxY, crachaWidth + 20, 36, 2, 2, 'S');

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...CORES_JEGD.escuro);
    doc.text('INSTRUÇÕES DE CONTROLE LOGÍSTICO & ARBITRAGEM:', centerX - 5, boxY + 7);

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...CORES_JEGD.grafite);
    doc.text('1. O QR Code do crachá é individual, seguro e criptografado para o estudante-atleta.', centerX - 5, boxY + 14);
    doc.text('2. Árbitros e Mesários devem escanear o QR Code para checar elegibilidade e validar presença.', centerX - 5, boxY + 20);
    doc.text('3. Equipes de apoio utilizam o crachá para registro e entrega de água e lanches nos ginásios.', centerX - 5, boxY + 26);
    doc.text('4. Em caso de perda, solicite a reemissão imediata no painel da escola ou coordenação SEMED.', centerX - 5, boxY + 32);

    doc.save(`Cracha_JEGDS_${escola.sigla}_${atleta.nomeCompleto.replace(/\s+/g, '_')}.pdf`);
  }

  /**
   * Gera Crachás Oficiais em Lote por Escola (Otimizado: 6 Crachás Dobráveis por Folha A4 com Simetria Perfeita)
   */
  public static async gerarCrachasEmLote(
    escola: Escola,
    atletas: Atleta[],
    modalidadeNome?: string,
    categoria?: string
  ): Promise<void> {
    const doc = criarDocumentoA4('portrait');
    // Margens perfeitamente simétricas: 7mm esquerda + 96mm + 4mm vão + 96mm + 7mm direita = 210mm
    const colXs = [7, 107];
    // Linhas perfeitamente balanceadas: 16mm topo + 76 + 9mm vão + 76 + 9mm vão + 76 = 262mm (sobra 35mm para rodapé)
    const rowYs = [16, 101, 186];
    const porPagina = 6;

    const logoBase64 = await this.getLogoBase64();
    const brasaoBase64 = await this.getBrasaoBase64();

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

    const totalPaginas = Math.ceil(atletasOrdenados.length / porPagina);

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

      await this.desenharCrachaDobravelOficial(doc, x, y, atleta, escola, modalidadeNome, undefined, logoBase64, brasaoBase64);

      if (slotIndex === porPagina - 1 || i === atletasOrdenados.length - 1) {
        doc.setFontSize(7.0);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...CORES_JEGD.textoMuted);
        doc.text(
          `JEGDS 2026 • Lote de Crachás: ${escola.nome} (${escola.sigla}) • Página ${pageIndex + 1} de ${totalPaginas}`,
          105,
          285,
          { align: 'center' }
        );
        doc.setFontSize(6.0);
        doc.text(
          'Instrução: Recorte pelas cruzes de corte e dobre na linha central tracejada para plastificar ou colocar no porta-crachá.',
          105,
          289,
          { align: 'center' }
        );
      }
    }

    const nomeArquivo = `Crachas_Lote_${escola.sigla.replace(/\s+/g, '_')}${modalidadeNome ? `_${modalidadeNome}` : ''}${categoria ? `_${categoria}` : ''}.pdf`;
    doc.save(nomeArquivo);
  }

  /**
   * Gera Todos os Crachás de Todas as Escolas
   */
  public static async gerarTodosCrachasGeral(
    escolas: Escola[],
    atletas: Atleta[]
  ): Promise<void> {
    const doc = criarDocumentoA4('portrait');
    const colXs = [7, 107];
    const rowYs = [16, 101, 186];
    const porPagina = 6;

    const logoBase64 = await this.getLogoBase64();
    const brasaoBase64 = await this.getBrasaoBase64();

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

    const totalPaginas = Math.ceil(atletasOrdenados.length / porPagina);

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

      await this.desenharCrachaDobravelOficial(doc, x, y, atleta, escola, undefined, undefined, logoBase64, brasaoBase64);

      if (slotIndex === porPagina - 1 || i === atletasOrdenados.length - 1) {
        doc.setFontSize(7.0);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...CORES_JEGD.textoMuted);
        doc.text(
          `JEGDS 2026 • Lote Geral de Todos os Atletas • Página ${pageIndex + 1} de ${totalPaginas}`,
          105,
          285,
          { align: 'center' }
        );
        doc.setFontSize(6.0);
        doc.text(
          'Instrução: Recorte pelas cruzes de corte e dobre na linha central tracejada para plastificar ou colocar no porta-crachá.',
          105,
          289,
          { align: 'center' }
        );
      }
    }

    doc.save('Crachas_GERAL_TODOS_ATLETAS_JEGDS_2026.pdf');
  }
}
