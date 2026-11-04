import { jsPDF } from 'jspdf';
import { Escola, Atleta, InscricaoEquipe, MembroComissao } from '@/types/jegd';
import { JegdStorage } from '@/lib/storage';
import { criarDocumentoA4, CORES_JEGD, carregarImagemBase64, ajustarFonte } from './pdf-types';

export class FichaInscricaoService {
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
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;

    const logoBase64 = await this.getLogoBase64();
    const brasaoBase64 = await this.getBrasaoBase64();

    // ============================================================
    // 1. CABEÇALHO GOVERNAMENTAL OFICIAL
    // ============================================================
    doc.setFillColor(...CORES_JEGD.primaria);
    doc.rect(margin, 10, contentWidth, 26, 'F');

    // Faixa dourada decorativa
    doc.setFillColor(...CORES_JEGD.destaqueOuro);
    doc.rect(margin, 35.3, contentWidth, 0.7, 'F');

    // Logo JEGD na esquerda
    if (logoBase64) {
      try {
        doc.addImage(logoBase64, 'PNG', margin + 3, 11.5, 23, 23);
      } catch {}
    }

    // Brasão Prefeitura na direita
    if (brasaoBase64) {
      try {
        doc.addImage(brasaoBase64, 'PNG', pageWidth - margin - 26, 11.5, 23, 23);
      } catch {}
    }

    // Textos do Cabeçalho Central
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ESTADO DO MARANHÃO • PREFEITURA DE GONÇALVES DIAS', pageWidth / 2, 16.5, { align: 'center' });

    doc.setFontSize(8.0);
    doc.setFont('helvetica', 'normal');
    doc.text('SECRETARIA MUNICIPAL DE EDUCAÇÃO (SEMED) • DEPARTAMENTO DE ESPORTES', pageWidth / 2, 22.5, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('JEGDS 2026 • JOGOS ESCOLARES DE GONÇALVES DIAS', pageWidth / 2, 29.5, { align: 'center' });

    doc.setFontSize(7.5);
    doc.setTextColor(254, 240, 138); // amber-200
    doc.text('COMPROVANTE OFICIAL DE INSCRIÇÃO & HOMOLOGAÇÃO POR EQUIPE', pageWidth / 2, 34, { align: 'center' });

    // ============================================================
    // 2. QUADRO DA UNIDADE DE ENSINO & MODALIDADE (2 COLUNAS)
    // ============================================================
    let currentY = 38.5;
    const colW = (contentWidth - 4) / 2;

    // Coluna 1: Dados da Escola
    doc.setFillColor(...CORES_JEGD.fundoCinza);
    doc.roundedRect(margin, currentY, colW, 28, 1.5, 1.5, 'FD');
    doc.setDrawColor(...CORES_JEGD.borda);
    doc.setLineWidth(0.25);
    doc.roundedRect(margin, currentY, colW, 28, 1.5, 1.5, 'S');

    // Tarja da Coluna 1
    doc.setFillColor(...CORES_JEGD.escuro);
    doc.rect(margin, currentY, colW, 5.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('UNIDADE ESCOLAR PARTICIPANTE', margin + 4, currentY + 4);

    doc.setTextColor(...CORES_JEGD.escuro);
    doc.setFontSize(8.5);
    const nomeEscolaCompleto = `${escola.nome.toUpperCase()} (${escola.sigla})`;
    doc.text(nomeEscolaCompleto.slice(0, 42), margin + 4, currentY + 10.5);

    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...CORES_JEGD.grafite);
    doc.text(`INEP: ${escola.inep || 'N/A'} • Rede: ${escola.rede} • Bairro: ${escola.bairro || 'Sede'}`, margin + 4, currentY + 15.5);
    doc.text(`Direção: ${escola.responsavelNome || 'Secretaria Escolar'} • Contato: ${escola.responsavelTelefone || 'N/A'}`, margin + 4, currentY + 20.5);
    doc.text(`Endereço: ${escola.endereco || 'Gonçalves Dias - MA'}`, margin + 4, currentY + 25.5);

    // Coluna 2: Dados da Modalidade e Equipe
    const col2X = margin + colW + 4;
    doc.setFillColor(...CORES_JEGD.fundoCinza);
    doc.roundedRect(col2X, currentY, colW, 28, 1.5, 1.5, 'FD');
    doc.setDrawColor(...CORES_JEGD.borda);
    doc.roundedRect(col2X, currentY, colW, 28, 1.5, 1.5, 'S');

    doc.setFillColor(...CORES_JEGD.primaria);
    doc.rect(col2X, currentY, colW, 5.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('MODALIDADE, CATEGORIA & EQUIPE', col2X + 4, currentY + 4);

    doc.setTextColor(...CORES_JEGD.primaria);
    doc.setFontSize(10);
    const modTitulo = `${inscricao.modalidadeNome.toUpperCase()} (${inscricao.sexo})`;
    doc.text(modTitulo, col2X + 4, currentY + 11);

    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...CORES_JEGD.grafite);
    const nomeEq = inscricao.nomeEquipe || `Equipe ${inscricao.numeroEquipe || 1}`;
    doc.text(`Equipe / Denominação: ${nomeEq.toUpperCase()}`, col2X + 4, currentY + 16);
    doc.text(`Categoria: ${inscricao.categoria} • Total de Atletas: ${atletas.length} inscritos`, col2X + 4, currentY + 20.5);

    const statusTexto = `Status: ${inscricao.status === 'VALIDADA' ? 'HOMOLOGADA SEMED' : 'REGISTRADA / EM AUDITORIA'}`;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...(inscricao.status === 'VALIDADA' ? CORES_JEGD.secundariaEscura : CORES_JEGD.destaqueOuro));
    doc.text(statusTexto, col2X + 4, currentY + 25.5);

    currentY += 31;

    // ============================================================
    // 3. QUADRO DA COMISSÃO TÉCNICA OFICIAL
    // ============================================================
    const membrosComissao = (comissao && comissao.length > 0)
      ? comissao
      : JegdStorage.getComissao(escola.id);

    doc.setFillColor(...CORES_JEGD.fundoCinza);
    doc.roundedRect(margin, currentY, contentWidth, 14, 1.5, 1.5, 'FD');
    doc.setDrawColor(...CORES_JEGD.borda);
    doc.roundedRect(margin, currentY, contentWidth, 14, 1.5, 1.5, 'S');

    doc.setFillColor(...CORES_JEGD.secundariaEscura);
    doc.rect(margin, currentY, contentWidth, 4.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.0);
    doc.text('COMISSÃO TÉCNICA OFICIAL CREDENCIADA', margin + 4, currentY + 3.2);

    if (membrosComissao && membrosComissao.length > 0) {
      const colComW = contentWidth / Math.min(membrosComissao.length, 3);
      membrosComissao.slice(0, 3).forEach((membro, idx) => {
        const mX = margin + 4 + idx * colComW;
        doc.setTextColor(...CORES_JEGD.escuro);
        doc.setFontSize(7.2);
        doc.setFont('helvetica', 'bold');
        doc.text(`${membro.funcao}: ${membro.nomeCompleto.toUpperCase()}`, mX, currentY + 8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(...CORES_JEGD.textoMuted);
        const docCom = `CPF: ${membro.cpf || 'N/A'}${membro.registroProfissional ? ` | CREF: ${membro.registroProfissional}` : ''} | Tel: ${membro.telefone || 'N/A'}`;
        doc.text(docCom, mX, currentY + 12);
      });
    } else {
      // Linhas para preenchimento oficial
      doc.setTextColor(...CORES_JEGD.grafite);
      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'normal');
      doc.text('Professor / Técnico Resp.: _____________________________________________ CPF: ____________________ CREF: __________________ Tel: ______________', margin + 4, currentY + 8.2);
      doc.text('Assistente / Auxiliar Técnico: _________________________________________ CPF: ____________________ CREF/RG: _______________ Tel: ______________', margin + 4, currentY + 12.2);
    }

    currentY += 16.5;

    // ============================================================
    // 4. TABELA OFICIAL DE ATLETAS DA EQUIPE
    // ============================================================
    const cabecalhoTabela = () => {
      doc.setFillColor(...CORES_JEGD.escuro);
      doc.rect(margin, currentY, contentWidth, 6.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'bold');

      doc.text('Nº', margin + 2, currentY + 4.5);
      doc.text('Nº', margin + 8.5, currentY + 4.5);
      doc.text('NOME COMPLETO DO ESTUDANTE-ATLETA', margin + 18, currentY + 4.5);
      doc.text('FILIAÇÃO (NOME DA MÃE)', margin + 78, currentY + 4.5);
      doc.text('NASCIMENTO', margin + 120, currentY + 4.5);
      doc.text('DOCUMENTO (RG / CERT)', margin + 140, currentY + 4.5);
      doc.text('MATRÍCULA / ANO', margin + 172, currentY + 4.5);

      currentY += 6.5;
    };

    cabecalhoTabela();

    atletas.forEach((atleta, index) => {
      if (currentY > pageHeight - 48) {
        doc.addPage();
        currentY = 15;
        cabecalhoTabela();
      }

      const rowH = 6.8;
      // Fundo zebrado
      if (index % 2 === 0) {
        doc.setFillColor(...CORES_JEGD.fundoZebra);
        doc.rect(margin, currentY, contentWidth, rowH, 'F');
      }

      doc.setDrawColor(...CORES_JEGD.bordaSuave);
      doc.setLineWidth(0.2);
      doc.line(margin, currentY + rowH, margin + contentWidth, currentY + rowH);

      doc.setTextColor(...CORES_JEGD.escuro);
      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'normal');

      // Nº Ordem
      const numStr = (index + 1).toString().padStart(2, '0');
      doc.text(numStr, margin + 2, currentY + 4.5);

      // Caixa de Camisa / Uniforme
      doc.setDrawColor(...CORES_JEGD.borda);
      doc.rect(margin + 8, currentY + 1.2, 6.5, 4.5, 'S');

      // Nome do Atleta
      doc.setFont('helvetica', 'bold');
      const nomeAtl = atleta.nomeCompleto.toUpperCase();
      doc.text(nomeAtl.slice(0, 36), margin + 18, currentY + 4.5);

      // Nome da Mãe (Filiação)
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...CORES_JEGD.grafite);
      const mae = atleta.nomeMae ? atleta.nomeMae.toUpperCase() : 'DECLARADO NA ESCOLA';
      doc.text(mae.slice(0, 24), margin + 78, currentY + 4.5);

      // Data Nascimento
      const dataNascStr = new Date(atleta.dataNascimento).toLocaleDateString('pt-BR');
      doc.text(dataNascStr, margin + 120, currentY + 4.5);

      // Documento
      const docStr = `${atleta.documentoTipo}: ${atleta.documentoNumero}`;
      doc.text(docStr.slice(0, 20), margin + 140, currentY + 4.5);

      // Matrícula / Série
      const matrStr = `${atleta.matricula || 'OK'} (${(atleta.serieTurma || '').slice(0, 6)})`;
      doc.text(matrStr.slice(0, 16), margin + 172, currentY + 4.5);

      currentY += rowH;
    });

    // ============================================================
    // 5. TERMO DE RESPONSABILIDADE & LGPD
    // ============================================================
    currentY += 4;
    if (currentY > pageHeight - 42) {
      doc.addPage();
      currentY = 20;
    }

    doc.setFillColor(...CORES_JEGD.fundoCinza);
    doc.roundedRect(margin, currentY, contentWidth, 12, 1, 1, 'FD');
    doc.setDrawColor(...CORES_JEGD.bordaSuave);
    doc.roundedRect(margin, currentY, contentWidth, 12, 1, 1, 'S');

    doc.setFontSize(5.8);
    doc.setTextColor(...CORES_JEGD.textoMuted);
    doc.setFont('helvetica', 'normal');
    const termoTexto = 'DECLARAÇÃO DE RESPONSABILIDADE, APTIDÃO FÍSICA E LGPD: A Direção Escolar e o Professor/Técnico Responsável declaram, sob as penas da lei e do Regulamento Geral dos Jogos Escolares de Gonçalves Dias (JEGDS 2026), que todos os estudantes-atletas acima relacionados estão devidamente matriculados com frequência regular nesta Unidade de Ensino, possuem atestado médico comprobatório de aptidão física para esforço competitivo e autorização expressa dos pais ou responsáveis legais arquivada na secretaria escolar.';
    doc.text(termoTexto, margin + 2.5, currentY + 4, { maxWidth: contentWidth - 5 });

    currentY += 16;

    // ============================================================
    // 6. BLOCO EXECUTIVO DE HOMOLOGAÇÃO (3 COLUNAS)
    // ============================================================
    const colAssW = (contentWidth - 8) / 3;

    // Assinatura 1: Direção Escolar
    const x1 = margin;
    doc.setDrawColor(...CORES_JEGD.grafite);
    doc.setLineWidth(0.3);
    doc.line(x1 + 4, currentY + 8, x1 + colAssW - 4, currentY + 8);
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...CORES_JEGD.escuro);
    doc.text('DIREÇÃO / SECRETARIA ESCOLAR', x1 + colAssW / 2, currentY + 11.5, { align: 'center' });
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...CORES_JEGD.textoMuted);
    doc.text('Assinatura e Carimbo da Escola', x1 + colAssW / 2, currentY + 14.5, { align: 'center' });

    // Assinatura 2: Professor / Técnico
    const x2 = margin + colAssW + 4;
    doc.line(x2 + 4, currentY + 8, x2 + colAssW - 4, currentY + 8);
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...CORES_JEGD.escuro);
    doc.text('PROFESSOR / TÉCNICO RESPONSÁVEL', x2 + colAssW / 2, currentY + 11.5, { align: 'center' });
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...CORES_JEGD.textoMuted);
    doc.text('Assinatura e Registro CREF', x2 + colAssW / 2, currentY + 14.5, { align: 'center' });

    // Assinatura 3: Coordenação Geral SEMED
    const x3 = margin + (colAssW + 4) * 2;
    doc.line(x3 + 4, currentY + 8, x3 + colAssW - 4, currentY + 8);
    doc.setFontSize(6.8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...CORES_JEGD.escuro);
    doc.text('COORDENAÇÃO GERAL JEGDS / SEMED', x3 + colAssW / 2, currentY + 11.5, { align: 'center' });
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...CORES_JEGD.secundariaEscura);
    doc.text('Visto de Homologação Oficial', x3 + colAssW / 2, currentY + 14.5, { align: 'center' });

    // Rodapé de segurança do documento
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...CORES_JEGD.textoMuted);
    const dataEmissao = new Date().toLocaleString('pt-BR');
    doc.text(
      `JEGDS 2026 • Registro ID: ${inscricao.id.toUpperCase().slice(0, 12)} • Emissão Oficial: ${dataEmissao} • Documento Autenticado pelo Sistema JEGDS`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );

    const nomeArquivo = `Ficha_Oficial_JEGDS_${escola.sigla.replace(/\s+/g, '_')}_${inscricao.modalidadeNome}_${inscricao.categoria}.pdf`;
    doc.save(nomeArquivo);
  }
}
