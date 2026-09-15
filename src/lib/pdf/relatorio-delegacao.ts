import { jsPDF } from 'jspdf';
import { Escola, Atleta, InscricaoEquipe } from '@/types/jegd';
import { criarDocumentoA4 } from './pdf-types';

export class RelatorioDelegacaoService {
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
    const doc = criarDocumentoA4('portrait');
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

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('PREFEITURA MUNICIPAL DE GONÇALVES DIAS - MA • SECRETARIA MUNICIPAL DE EDUCAÇÃO (SEMED)', pageWidth / 2, 24, { align: 'center' });
    doc.text('RELATÓRIO OFICIAL DE HOMOLOGAÇÃO DA DELEGAÇÃO ESCOLAR', pageWidth / 2, 30, { align: 'center' });

    // Informações da Escola e Lote
    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, 42, pageWidth - margin * 2, 24, 2, 2, 'FD');

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.text(`ESCOLA: ${escola.nome.toUpperCase()} (${escola.sigla})`, margin + 4, 48);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`INEP: ${escola.inep || 'N/A'} | Rede: ${escola.rede} | Bairro: ${escola.bairro || 'Centro'}`, margin + 4, 53.5);
    doc.text(`Responsável: ${escola.responsavelNome} • Contato: ${escola.responsavelTelefone}`, margin + 4, 58.5);
    
    const filtroTexto = `Filtros: Modalidade: ${filtroModalidade || 'Todas'} | Categoria: ${filtroCategoria || 'Todas'} | Sexo: ${filtroSexo || 'Todos'}`;
    doc.text(filtroTexto, margin + 4, 63.5);

    // Box de Totais
    doc.setFillColor(224, 242, 254);
    doc.rect(pageWidth - margin - 50, 44, 46, 20, 'F');
    doc.setTextColor(3, 105, 161);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`${atletasFiltrados.length}`, pageWidth - margin - 27, 54, { align: 'center' });
    doc.setFontSize(7.5);
    doc.text('ATLETAS NO LOTE', pageWidth - margin - 27, 60, { align: 'center' });

    // Tabela de Atletas do Lote
    let currentY = 70;
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, currentY, pageWidth - margin * 2, 7, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');

    doc.text('Nº', margin + 3, currentY + 5);
    doc.text('NOME COMPLETO DO ATLETA', margin + 10, currentY + 5);
    doc.text('DATA NASC.', margin + 65, currentY + 5);
    doc.text('CAT / SEXO', margin + 88, currentY + 5);
    doc.text('DOC (RG/CERT)', margin + 112, currentY + 5);
    doc.text('MODALIDADE(S)', margin + 142, currentY + 5);
    doc.text('STATUS', margin + 168, currentY + 5);

    currentY += 7;

    atletasFiltrados.forEach((atleta, index) => {
      if (currentY > 260) {
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
}
