import { jsPDF } from 'jspdf';
import { Escola, Atleta, InscricaoEquipe } from '@/types/jegd';
import { criarDocumentoA4, CORES_JEGD, carregarImagemBase64 } from './pdf-types';

export class RelatorioDelegacaoService {
  private static logoCache: string | null = null;
  private static brasaoCache: string | null = null;

  private static async getLogoBase64(): Promise<string | null> {
    if (this.logoCache) return this.logoCache;
    this.logoCache = await carregarImagemBase64('/logo-jegd.png');
    return this.logoCache;
  }

  private static async getBrasaoBase64(): Promise<string | null> {
    if (this.brasaoCache) return this.brasaoCache;
    this.brasaoCache = await carregarImagemBase64('/logos/prefeitura-goncalves-dias.png');
    return this.brasaoCache;
  }

  /**
   * Gera Relatório Oficial em PDF do Lote da Delegação Escolar
   */
  public static async gerarLoteCompletoEscola(
    escola: Escola,
    atletas: Atleta[],
    inscricoes: InscricaoEquipe[] = [],
    filtroModalidade?: string,
    filtroCategoria?: string,
    filtroSexo?: string
  ): Promise<void> {
    const doc = criarDocumentoA4('portrait');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;

    const logoBase64 = await this.getLogoBase64();
    const brasaoBase64 = await this.getBrasaoBase64();

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

    const totalMasc = atletasFiltrados.filter(a => a.sexo === 'MASCULINO').length;
    const totalFem = atletasFiltrados.filter(a => a.sexo === 'FEMININO').length;
    const totalHomologados = atletasFiltrados.filter(a => a.conferidoPeloCoordenador).length;

    // ============================================================
    // 1. CABEÇALHO GOVERNAMENTAL
    // ============================================================
    doc.setFillColor(...CORES_JEGD.primaria);
    doc.rect(margin, 10, contentWidth, 24, 'F');
    doc.setFillColor(...CORES_JEGD.destaqueOuro);
    doc.rect(margin, 33.3, contentWidth, 0.7, 'F');

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', margin + 3, 11, 21, 21);
      } catch {}
    }

    if (brasaoBase64) {
      try {
        doc.addImage(brasaoBase64, 'PNG', pageWidth - margin - 24, 11, 21, 21);
      } catch {}
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.text('ESTADO DO MARANHÃO • PREFEITURA DE GONÇALVES DIAS', pageWidth / 2, 16, { align: 'center' });

    doc.setFontSize(7.8);
    doc.setFont('helvetica', 'normal');
    doc.text('SECRETARIA MUNICIPAL DE EDUCAÇÃO (SEMED) • COMITÊ GERAL DO JEGDS 2026', pageWidth / 2, 21.5, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('RELATÓRIO OFICIAL DE HOMOLOGAÇÃO DA DELEGAÇÃO ESCOLAR', pageWidth / 2, 28, { align: 'center' });

    // ============================================================
    // 2. QUADRO DA ESCOLA & MÉTRICAS EXECUTIVAS
    // ============================================================
    let currentY = 36.5;

    doc.setFillColor(...CORES_JEGD.fundoCinza);
    doc.roundedRect(margin, currentY, contentWidth, 24, 1.5, 1.5, 'FD');
    doc.setDrawColor(...CORES_JEGD.borda);
    doc.setLineWidth(0.25);
    doc.roundedRect(margin, currentY, contentWidth, 24, 1.5, 1.5, 'S');

    // Dados da Escola (Lado Esquerdo)
    doc.setTextColor(...CORES_JEGD.escuro);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`UNIDADE DE ENSINO: ${escola.nome.toUpperCase()} (${escola.sigla})`, margin + 4, currentY + 6);

    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...CORES_JEGD.grafite);
    doc.text(`INEP: ${escola.inep || 'N/A'} • Rede: ${escola.rede} • Bairro/Povoado: ${escola.bairro || 'Sede'}`, margin + 4, currentY + 11);
    doc.text(`Responsável: ${escola.responsavelNome} • Contato: ${escola.responsavelTelefone || 'N/A'}`, margin + 4, currentY + 16);
    
    const filtroTexto = `Filtros Aplicados: Modalidade: ${filtroModalidade || 'Todas'} | Categoria: ${filtroCategoria || 'Todas'} | Sexo: ${filtroSexo || 'Todos'}`;
    doc.text(filtroTexto, margin + 4, currentY + 21);

    // Ribbon de Métricas (Lado Direito)
    const metricW = 22;
    const startMetricX = pageWidth - margin - (metricW * 3 + 4);
    const metricLabels = [
      { titulo: 'TOTAL LOTE', valor: atletasFiltrados.length, cor: CORES_JEGD.primaria },
      { titulo: 'MASC / FEM', valor: `${totalMasc}/${totalFem}`, cor: CORES_JEGD.secundariaEscura },
      { titulo: 'HOMOLOG.', valor: totalHomologados, cor: CORES_JEGD.destaqueOuro }
    ];

    metricLabels.forEach((m, idx) => {
      const mX = startMetricX + idx * (metricW + 1.5);
      doc.setFillColor(...CORES_JEGD.fundoZebra);
      doc.roundedRect(mX, currentY + 3, metricW, 18, 1, 1, 'FD');
      doc.setDrawColor(...CORES_JEGD.bordaSuave);
      doc.roundedRect(mX, currentY + 3, metricW, 18, 1, 1, 'S');

      doc.setTextColor(...m.cor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(m.valor.toString(), mX + metricW / 2, currentY + 11.5, { align: 'center' });

      doc.setTextColor(...CORES_JEGD.textoMuted);
      doc.setFontSize(5.5);
      doc.text(m.titulo, mX + metricW / 2, currentY + 17, { align: 'center' });
    });

    currentY += 27;

    // ============================================================
    // 3. TABELA OFICIAL DE ATLETAS DA DELEGAÇÃO
    // ============================================================
    const cabecalhoTabela = () => {
      doc.setFillColor(...CORES_JEGD.escuro);
      doc.rect(margin, currentY, contentWidth, 6.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');

      doc.text('Nº', margin + 2, currentY + 4.5);
      doc.text('NOME COMPLETO DO ATLETA', margin + 9, currentY + 4.5);
      doc.text('FILIAÇÃO (MÃE)', margin + 65, currentY + 4.5);
      doc.text('NASCIMENTO', margin + 104, currentY + 4.5);
      doc.text('CAT / N.', margin + 125, currentY + 4.5);
      doc.text('DOCUMENTO', margin + 142, currentY + 4.5);
      doc.text('MODALIDADE(S)', margin + 163, currentY + 4.5);

      currentY += 6.5;
    };

    cabecalhoTabela();

    atletasFiltrados.forEach((atleta, index) => {
      if (currentY > pageHeight - 40) {
        doc.addPage();
        currentY = 15;
        cabecalhoTabela();
      }

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
      const numStr = (index + 1).toString().padStart(2, '0');
      doc.text(numStr, margin + 2, currentY + 4.2);

      // Nome do Atleta
      doc.setFont('helvetica', 'bold');
      const nomeAtl = atleta.nomeCompleto.toUpperCase();
      doc.text(nomeAtl.slice(0, 32), margin + 9, currentY + 4.2);

      // Nome da Mãe
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...CORES_JEGD.grafite);
      const mae = atleta.nomeMae ? atleta.nomeMae.toUpperCase() : 'DECLARADA NA ESCOLA';
      doc.text(mae.slice(0, 22), margin + 65, currentY + 4.2);

      // Nascimento
      const dataNascStr = new Date(atleta.dataNascimento).toLocaleDateString('pt-BR');
      doc.text(dataNascStr, margin + 104, currentY + 4.2);

      // Categoria & Naipe
      const cat = (atleta.categoriaCalculada || 'LIVRE').slice(0, 4);
      const sexo = atleta.sexo === 'FEMININO' ? 'F' : 'M';
      doc.text(`${cat} (${sexo})`, margin + 125, currentY + 4.2);

      // Documento
      const docStr = `${atleta.documentoTipo.slice(0, 3)}: ${atleta.documentoNumero}`;
      doc.text(docStr.slice(0, 13), margin + 142, currentY + 4.2);

      // Modalidades
      const modsStr = atleta.modalidadesInscritas && atleta.modalidadesInscritas.length > 0
        ? atleta.modalidadesInscritas.map(m => m.modalidadeNome).join(', ')
        : 'DELEGAÇÃO';
      doc.text(modsStr.slice(0, 15), margin + 163, currentY + 4.2);

      currentY += rowH;
    });

    // ============================================================
    // 4. BLOCO DE HOMOLOGAÇÃO & ASSINATURAS
    // ============================================================
    currentY += 8;
    if (currentY > pageHeight - 35) {
      doc.addPage();
      currentY = 20;
    }

    const colAssW = (contentWidth - 6) / 2;

    // Assinatura 1: Direção da Escola
    doc.setDrawColor(...CORES_JEGD.grafite);
    doc.setLineWidth(0.3);
    doc.line(margin + 10, currentY + 12, margin + colAssW - 10, currentY + 12);
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...CORES_JEGD.escuro);
    doc.text('DIREÇÃO / SECRETARIA DA UNIDADE ESCOLAR', margin + colAssW / 2, currentY + 15.5, { align: 'center' });
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...CORES_JEGD.textoMuted);
    doc.text('Assinatura e Carimbo Oficial da Instituição', margin + colAssW / 2, currentY + 18.5, { align: 'center' });

    // Assinatura 2: Coordenação SEMED
    const xSemed = margin + colAssW + 6;
    doc.line(xSemed + 10, currentY + 12, xSemed + colAssW - 10, currentY + 12);
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...CORES_JEGD.escuro);
    doc.text('COORDENAÇÃO GERAL SEMED / JEGDS 2026', xSemed + colAssW / 2, currentY + 15.5, { align: 'center' });
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...CORES_JEGD.secundariaEscura);
    doc.text('Visto de Homologação da Delegação', xSemed + colAssW / 2, currentY + 18.5, { align: 'center' });

    const nomeArquivo = `Relatorio_Delegacao_JEGDS_${escola.sigla.replace(/\s+/g, '_')}${filtroModalidade && filtroModalidade !== 'TODAS' ? `_${filtroModalidade}` : ''}${filtroCategoria && filtroCategoria !== 'TODAS' ? `_${filtroCategoria}` : ''}.pdf`;
    doc.save(nomeArquivo);
  }
}
