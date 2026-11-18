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

    // Ordenação e agrupamento estrito por Categoria, Naipe e Ordem Alfabética
    const ordemCat: Record<string, number> = { MIRIM: 1, INFANTIL: 2, INFANTO: 3, JUNIOR: 4 };
    atletasFiltrados.sort((a, b) => {
      const cA = ordemCat[a.categoriaCalculada || ''] || 99;
      const cB = ordemCat[b.categoriaCalculada || ''] || 99;
      if (cA !== cB) return cA - cB;

      if (a.sexo !== b.sexo) {
        return a.sexo === 'FEMININO' ? -1 : 1;
      }

      return a.nomeCompleto.localeCompare(b.nomeCompleto);
    });

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

    let ultimoGrupoDelegacao = '';
    atletasFiltrados.forEach((atleta, index) => {
      const grupoChave = `${atleta.categoriaCalculada || 'LIVRE'} • ${atleta.sexo || 'MISTO'}`;
      const mudouGrupo = grupoChave !== ultimoGrupoDelegacao;

      if (mudouGrupo) {
        ultimoGrupoDelegacao = grupoChave;
        if (currentY > pageHeight - 45) {
          doc.addPage();
          currentY = 15;
          cabecalhoTabela();
        }

        // Faixa de Separação de Categoria e Naipe
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, currentY, contentWidth, 5.5, 'F');
        doc.setDrawColor(...CORES_JEGD.bordaSuave);
        doc.line(margin, currentY + 5.5, margin + contentWidth, currentY + 5.5);

        doc.setFontSize(6.2);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...CORES_JEGD.escuro);
        const grupoLabel = `DIVISÃO: ${(atleta.categoriaCalculada || 'LIVRE').toUpperCase()} • NAIPE: ${(atleta.sexo || 'MISTO').toUpperCase()}`;
        doc.text(grupoLabel, margin + 4, currentY + 3.8);

        currentY += 5.5;
      }

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
      const docStr = (atleta.semDocumento || atleta.documentoTipo === 'SEM_DOCUMENTO' || atleta.documentoNumero === 'SEM DOCUMENTO')
        ? 'SEM DOC'
        : `${(atleta.documentoTipo || 'DOC').slice(0, 3)}: ${atleta.documentoNumero}`;
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

  /**
   * Gera Relatório Geral Consolidado de Todos os Alunos Inscritos no Município
   * Agrupado por Etapa / Categoria, Modalidade e Naipe com Métricas Executivas
   */
  public static async gerarRelatorioGeralAtletas(
    escolas: Escola[],
    atletas: Atleta[],
    filtros?: {
      busca?: string;
      modalidade?: string;
      categoria?: string;
      sexo?: string;
      escolaId?: string;
    }
  ): Promise<void> {
    const doc = criarDocumentoA4('portrait');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;

    const logoBase64 = await this.getLogoBase64();
    const brasaoBase64 = await this.getBrasaoBase64();

    // Filtros
    let lista = [...atletas];
    if (filtros?.busca) {
      const q = filtros.busca.toLowerCase();
      lista = lista.filter(a => {
        const esc = escolas.find(e => e.id === a.escolaId);
        return a.nomeCompleto.toLowerCase().includes(q) ||
          (a.documentoNumero && a.documentoNumero.toLowerCase().includes(q)) ||
          (esc && esc.nome.toLowerCase().includes(q)) ||
          (esc && esc.sigla.toLowerCase().includes(q));
      });
    }
    if (filtros?.categoria && filtros.categoria !== 'TODAS') {
      lista = lista.filter(a => a.categoriaCalculada === filtros.categoria);
    }
    if (filtros?.sexo && filtros.sexo !== 'TODOS') {
      lista = lista.filter(a => a.sexo === filtros.sexo);
    }
    if (filtros?.escolaId && filtros.escolaId !== 'TODAS') {
      lista = lista.filter(a => a.escolaId === filtros.escolaId);
    }
    if (filtros?.modalidade && filtros.modalidade !== 'TODAS') {
      lista = lista.filter(a =>
        a.modalidadesInscritas?.some(m =>
          m.modalidadeNome.toLowerCase().includes(filtros.modalidade!.toLowerCase()) ||
          m.modalidadeCodigo === filtros.modalidade
        )
      );
    }

    // Ordenação: Categoria -> Modalidade -> Naipe -> Nome
    const ordemCat: Record<string, number> = { MIRIM: 1, INFANTIL: 2, INFANTO: 3, JUNIOR: 4 };
    lista.sort((a, b) => {
      const cA = ordemCat[a.categoriaCalculada || ''] || 99;
      const cB = ordemCat[b.categoriaCalculada || ''] || 99;
      if (cA !== cB) return cA - cB;
      if (a.sexo !== b.sexo) return a.sexo === 'FEMININO' ? -1 : 1;
      return a.nomeCompleto.localeCompare(b.nomeCompleto);
    });

    const totalAlunos = lista.length;
    const totalMasc = lista.filter(a => a.sexo === 'MASCULINO').length;
    const totalFem = lista.filter(a => a.sexo === 'FEMININO').length;
    const totalSemDoc = lista.filter(a => a.semDocumento || a.documentoTipo === 'SEM_DOCUMENTO' || a.documentoNumero === 'SEM DOCUMENTO').length;
    const totalHomologados = lista.filter(a => a.conferidoPeloCoordenador).length;

    // Cabeçalho
    doc.setFillColor(...CORES_JEGD.primaria);
    doc.rect(margin, 10, contentWidth, 24, 'F');
    doc.setFillColor(...CORES_JEGD.destaqueOuro);
    doc.rect(margin, 33.3, contentWidth, 0.7, 'F');

    if (logoBase64) {
      try { doc.addImage(logoBase64, 'PNG', margin + 3, 11, 21, 21); } catch {}
    }
    if (brasaoBase64) {
      try { doc.addImage(brasaoBase64, 'PNG', pageWidth - margin - 24, 11, 21, 21); } catch {}
    }

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('PREFEITURA DE GONÇALVES DIAS • SECRETARIA MUNICIPAL DE EDUCAÇÃO', pageWidth / 2, 16, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('COMITÊ ORGANIZADOR OFICIAL • JOGOS ESCOLARES DE GONÇALVES DIAS - JEGDS 2026', pageWidth / 2, 21.5, { align: 'center' });

    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text('RELAÇÃO GERAL CONSOLIDADA DE ESTUDANTES-ATLETAS INSCRITOS', pageWidth / 2, 28, { align: 'center' });

    let currentY = 36.5;

    // Métricas Resumidas
    doc.setFillColor(...CORES_JEGD.fundoCinza);
    doc.roundedRect(margin, currentY, contentWidth, 18, 1.5, 1.5, 'FD');
    doc.setDrawColor(...CORES_JEGD.borda);
    doc.setLineWidth(0.25);
    doc.roundedRect(margin, currentY, contentWidth, 18, 1.5, 1.5, 'S');

    doc.setTextColor(...CORES_JEGD.escuro);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`TOTAL DE ALUNOS: ${totalAlunos}`, margin + 5, currentY + 6.5);
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...CORES_JEGD.grafite);
    doc.text(`Masculino: ${totalMasc} | Feminino: ${totalFem} | Em Regularização: ${totalSemDoc} | Homologados: ${totalHomologados}`, margin + 5, currentY + 11.5);
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} • Sistema Oficial JEGDS`, margin + 5, currentY + 15.5);

    currentY += 21;

    const cabecalhoTabela = () => {
      doc.setFillColor(...CORES_JEGD.escuro);
      doc.rect(margin, currentY, contentWidth, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');

      doc.text('Nº', margin + 2, currentY + 4.2);
      doc.text('NOME COMPLETO DO ATLETA', margin + 8, currentY + 4.2);
      doc.text('ESCOLA', margin + 68, currentY + 4.2);
      doc.text('ETAPA / NAIPE', margin + 110, currentY + 4.2);
      doc.text('DOCUMENTO', margin + 138, currentY + 4.2);
      doc.text('MODALIDADE(S)', margin + 163, currentY + 4.2);

      currentY += 6;
    };

    cabecalhoTabela();

    let etapaAtual = '';

    for (let i = 0; i < lista.length; i++) {
      const a = lista[i];
      const esc = escolas.find(e => e.id === a.escolaId);
      const etapa = a.categoriaCalculada || 'LIVRE';

      // Quebra de página
      if (currentY + 8 > pageHeight - 20) {
        doc.addPage();
        currentY = 15;
        cabecalhoTabela();
      }

      // Separador de Etapa
      if (etapa !== etapaAtual) {
        etapaAtual = etapa;
        doc.setFillColor(...CORES_JEGD.fundoZebra);
        doc.rect(margin, currentY, contentWidth, 5.5, 'F');
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...CORES_JEGD.primaria);
        doc.text(`ETAPA ${etapa} • ${lista.filter(x => (x.categoriaCalculada || 'LIVRE') === etapa).length} ATLETAS`, margin + 4, currentY + 3.8);
        currentY += 5.5;
      }

      // Linha do atleta
      if (i % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, currentY, contentWidth, 5.2, 'F');
      }

      doc.setFontSize(5.8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...CORES_JEGD.escuro);

      doc.text((i + 1).toString().padStart(3, '0'), margin + 2, currentY + 3.6);
      doc.setFont('helvetica', 'bold');
      doc.text(a.nomeCompleto.toUpperCase().slice(0, 36), margin + 8, currentY + 3.6);
      doc.setFont('helvetica', 'normal');
      doc.text((esc?.sigla || esc?.nome || 'N/A').toUpperCase().slice(0, 22), margin + 68, currentY + 3.6);
      doc.text(`${a.categoriaCalculada || 'LIVRE'} (${a.sexo === 'FEMININO' ? 'FEM' : 'MASC'})`, margin + 110, currentY + 3.6);

      const isSemDoc = a.semDocumento || a.documentoTipo === 'SEM_DOCUMENTO' || a.documentoNumero === 'SEM DOCUMENTO';
      if (isSemDoc) {
        doc.setTextColor(180, 83, 9); // amber-700
        doc.setFont('helvetica', 'bold');
        doc.text('REGULARIZAÇÃO', margin + 138, currentY + 3.6);
      } else {
        doc.setTextColor(...CORES_JEGD.escuro);
        doc.text(`${a.documentoTipo || 'DOC'}: ${a.documentoNumero || 'N/A'}`.slice(0, 16), margin + 138, currentY + 3.6);
      }

      doc.setTextColor(...CORES_JEGD.grafite);
      const mods = a.modalidadesInscritas && a.modalidadesInscritas.length > 0
        ? a.modalidadesInscritas.map(m => m.modalidadeNome).join(', ')
        : 'Geral';
      doc.text(mods.slice(0, 22), margin + 163, currentY + 3.6);

      currentY += 5.2;
    }

    doc.save(`Relatorio_Geral_Alunos_JEGDS_2026.pdf`);
  }
}
