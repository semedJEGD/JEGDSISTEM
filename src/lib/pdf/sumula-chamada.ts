import { jsPDF } from 'jspdf';
import { Escola, Atleta, ModalidadeConfig } from '@/types/jegd';
import { criarDocumentoA4, CORES_JEGD } from './pdf-types';

export interface CategoriaSumulaData {
  categoria: string;
  sexo: string;
  atletasComEscola: { atleta: Atleta; escola: Escola; provas?: string[] }[];
}

export interface SumulaOptions {
  escolaFiltro?: { id?: string; nome: string; sigla?: string };
  isModeloManual?: boolean;
  linhasExtrasMinimas?: number;
  tituloPersonalizado?: string;
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
    atletasComEscola: { atleta: Atleta; escola: Escola; provas?: string[] }[],
    options?: SumulaOptions
  ): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pageWidth - margin * 2;

    const isManual = !!options?.isModeloManual;
    const escolaFiltro = options?.escolaFiltro;

    // ============================================================
    // 1. CABEÇALHO OFICIAL DE SÚMULA
    // ============================================================
    doc.setFillColor(...CORES_JEGD.primaria);
    doc.rect(margin, 8, contentWidth, 20, 'F');
    doc.setFillColor(...CORES_JEGD.destaqueOuro);
    doc.rect(margin, 27.4, contentWidth, 0.6, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');

    let tituloHeader = 'JEGDS 2026 • SÚMULA OFICIAL DE PARTIDA & LISTA DE ARBITRAGEM';
    if (isManual) {
      tituloHeader = 'JEGDS 2026 • SÚMULA OFICIAL (MODELO PARA REGISTRO MANUAL)';
    } else if (escolaFiltro) {
      tituloHeader = `JEGDS 2026 • SÚMULA OFICIAL DA ESCOLA: ${(escolaFiltro.sigla || escolaFiltro.nome).toUpperCase()}`;
    }
    if (options?.tituloPersonalizado) {
      tituloHeader = options.tituloPersonalizado;
    }
    doc.text(tituloHeader, pageWidth / 2, 14, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `PREFEITURA DE GONÇALVES DIAS - MA • SECRETARIA MUNICIPAL DE EDUCAÇÃO (SEMED) • COMITÊ TÉCNICO`,
      pageWidth / 2,
      19,
      { align: 'center' }
    );
    doc.setFont('helvetica', 'bold');

    let infoLinha = `MODALIDADE: ${modalidadeNome.toUpperCase()} • CATEGORIA: ${categoria} (${sexo}) • DATA: ${dataJogo}`;
    if (isManual && (!modalidadeNome || modalidadeNome.toUpperCase().includes('UNIVERSAL') || modalidadeNome.toUpperCase().includes('GERAL'))) {
      infoLinha = `MODALIDADE: ________________________ • CATEGORIA: _______________ • DATA: ____/____/2026`;
    } else if (escolaFiltro) {
      infoLinha = `MODALIDADE: ${modalidadeNome.toUpperCase()} • CATEGORIA: ${categoria} (${sexo}) • DATA: ${dataJogo} • ESCOLA: ${(escolaFiltro.sigla || escolaFiltro.nome).toUpperCase()}`;
    }
    doc.text(infoLinha, pageWidth / 2, 24.5, { align: 'center' });

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

    const equipeA = escolaFiltro
      ? `EQUIPE A: ${(escolaFiltro.sigla || escolaFiltro.nome).toUpperCase().slice(0, 30)}`
      : 'EQUIPE A: ____________________________________';
    doc.text(equipeA, margin + 4, currentY + 6);
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
      nome: string = '',
      escolaStr: string = '',
      docStr: string = '',
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
      if (nome) {
        doc.text(nome.slice(0, 32), margin + 22, currentY + 4.2);
      }

      // Escola
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...CORES_JEGD.grafite);
      if (escolaStr) {
        doc.text(escolaStr.slice(0, 16), margin + 76, currentY + 4.2);
      }

      // Documento
      if (docStr) {
        doc.text(docStr.slice(0, 12), margin + 104, currentY + 4.2);
      }

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

    if (isManual || atletasComEscola.length === 0) {
      // 18 a 20 Linhas pautadas para preenchimento manual da mesa
      const totalLinhasManual = 18;
      const escolaNomePreenchido = escolaFiltro ? (escolaFiltro.sigla || escolaFiltro.nome).slice(0, 16) : '';
      for (let i = 0; i < totalLinhasManual; i++) {
        if (currentY > pageHeight - 52) break;
        renderRow(i, '', escolaNomePreenchido, '');
      }
    } else {
      // Renderiza atletas cadastrados
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

      // Se for súmula por escola ou tiver poucas linhas, adiciona linhas extras para reservas/suplentes manuais
      const totalAtual = atletasComEscola.length;
      const metaLinhas = escolaFiltro ? Math.max(totalAtual + 4, 14) : totalAtual;
      const escolaNomeExtra = escolaFiltro ? (escolaFiltro.sigla || escolaFiltro.nome).slice(0, 16) : '';

      for (let j = totalAtual; j < metaLinhas; j++) {
        if (currentY > pageHeight - 52) break;
        renderRow(j, '', escolaNomeExtra, '');
      }
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

  // ==============================================================
  // OPÇÃO 1: SÚMULAS GERAIS / CONSOLIDADAS (TODAS AS ESCOLAS)
  // ==============================================================

  /**
   * Gera a Lista de Chamada Individual (1 única categoria com todas as escolas)
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
    doc.save(`Sumula_Geral_JEGDS_${modalidadeNome.replace(/\s+/g, '_')}_${categoria}_${sexo}.pdf`);
  }

  /**
   * Gera o Caderno Completo de uma Modalidade (Todas as Categorias em 1 só PDF)
   */
  public static async gerarCadernoModalidadeCompleto(
    modalidade: ModalidadeConfig,
    categoriasData: CategoriaSumulaData[],
    options?: SumulaOptions
  ): Promise<void> {
    const doc = criarDocumentoA4('portrait');
    const dataJogo = new Date(modalidade.dataEvento).toLocaleDateString('pt-BR');

    let pageAdded = false;
    categoriasData.forEach((catData) => {
      // Se tiver filtro de escola e não tiver nenhum atleta, podemos pular para não gerar páginas em branco desnecessárias
      if (options?.escolaFiltro && catData.atletasComEscola.length === 0) {
        return;
      }

      if (pageAdded) {
        doc.addPage();
      } else {
        pageAdded = true;
      }

      this.desenharPaginaSumula(
        doc,
        modalidade.nome,
        catData.categoria,
        catData.sexo,
        dataJogo,
        catData.atletasComEscola,
        options
      );
    });

    // Se nenhuma página foi adicionada (ex: escola sem atletas em nenhuma categoria), desenha ao menos uma página modelo
    if (!pageAdded) {
      this.desenharPaginaSumula(
        doc,
        modalidade.nome,
        modalidade.categoriasPermitidas[0] || 'LIVRE',
        'MASCULINO',
        dataJogo,
        [],
        options
      );
    }

    const prefixo = options?.escolaFiltro ? `SUMULA_${(options.escolaFiltro.sigla || options.escolaFiltro.nome).replace(/\s+/g, '_')}` : 'CADERNO_OFICIAL_SUMULAS';
    const nomeFormatado = modalidade.nome.toUpperCase().replace(/\s+/g, '_');
    doc.save(`${prefixo}_${nomeFormatado}_JEGDS2026.pdf`);
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

    doc.save('LIVRO_GERAL_ARBITRAGEM_JEGDS2026.pdf');
  }

  // ==============================================================
  // OPÇÃO 2: SÚMULAS POR ESCOLA (FILTRADAS)
  // ==============================================================

  /**
   * Gera a Súmula Individual isolada de uma única escola
   */
  public static async gerarSumulaEscolaIndividual(
    modalidadeNome: string,
    categoria: string,
    sexo: string,
    dataJogo: string,
    atletasComEscola: { atleta: Atleta; escola: Escola; provas?: string[] }[],
    escola: Escola
  ): Promise<void> {
    const doc = criarDocumentoA4('portrait');
    this.desenharPaginaSumula(
      doc,
      modalidadeNome,
      categoria,
      sexo,
      dataJogo,
      atletasComEscola,
      { escolaFiltro: escola }
    );
    const siglaSafe = (escola.sigla || escola.nome).replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Sumula_JEGDS_${siglaSafe}_${modalidadeNome.replace(/\s+/g, '_')}_${categoria}_${sexo}.pdf`);
  }

  /**
   * Gera o Caderno Completo de Súmulas da Escola (todas as modalidades e categorias em que a escola participa em 1 só PDF)
   */
  public static async gerarCadernoSumulasEscola(
    escola: Escola,
    modalidadesCompletas: { modalidade: ModalidadeConfig; categoriasData: CategoriaSumulaData[] }[]
  ): Promise<void> {
    const doc = criarDocumentoA4('portrait');
    let isFirstPage = true;

    modalidadesCompletas.forEach(item => {
      const dataJogo = new Date(item.modalidade.dataEvento).toLocaleDateString('pt-BR');
      item.categoriasData.forEach(catData => {
        // Inclui apenas categorias onde há atletas da escola
        if (catData.atletasComEscola.length === 0) return;

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
          catData.atletasComEscola,
          { escolaFiltro: escola }
        );
      });
    });

    // Se a escola não tiver atletas cadastrados ainda, gera ao menos uma folha de modelo com o nome da escola
    if (isFirstPage) {
      this.desenharPaginaSumula(
        doc,
        'MODALIDADE GERAL',
        'LIVRE',
        'MASC / FEM',
        '2026',
        [],
        { escolaFiltro: escola, isModeloManual: true }
      );
    }

    const siglaSafe = (escola.sigla || escola.nome).replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`CADERNO_SUMULAS_ESCOLA_${siglaSafe}_JEGDS2026.pdf`);
  }

  // ==============================================================
  // OPÇÃO 3: SÚMULA MODELO MANUAL (EM BRANCO)
  // ==============================================================

  /**
   * Gera o Modelo Oficial Universal em Branco (Qualquer Modalidade / Qualquer Categoria)
   */
  public static async gerarModeloManualUniversal(): Promise<void> {
    const doc = criarDocumentoA4('portrait');
    this.desenharPaginaSumula(
      doc,
      'UNIVERSAL (REGISTRO MANUAL EM QUADRA)',
      'LIVRE',
      'MASC / FEM',
      '____/____/2026',
      [],
      { isModeloManual: true }
    );
    doc.save('MODELO_OFICIAL_SUMULA_MANUAL_JEGDS2026_UNIVERSAL.pdf');
  }

  /**
   * Gera o Modelo Oficial em Branco pré-configurado para uma Modalidade específica
   */
  public static async gerarModeloManualModalidade(
    modalidadeNome: string,
    categoria: string = 'LIVRE',
    sexo: string = 'MASC / FEM',
    dataJogo: string = '____/____/2026'
  ): Promise<void> {
    const doc = criarDocumentoA4('portrait');
    this.desenharPaginaSumula(
      doc,
      modalidadeNome,
      categoria,
      sexo,
      dataJogo,
      [],
      { isModeloManual: true }
    );
    const modSafe = modalidadeNome.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`MODELO_MANUAL_SUMULA_${modSafe}_JEGDS2026.pdf`);
  }
}

