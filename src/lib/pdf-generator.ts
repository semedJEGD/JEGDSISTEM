import { Escola, Atleta, MembroComissao, InscricaoEquipe } from '@/types/jegd';
import { FichaInscricaoService } from './pdf/ficha-inscricao';
import { SumulaChamadaService } from './pdf/sumula-chamada';
import { CrachaDobravelService } from './pdf/cracha-dobravel';
import { RelatorioDelegacaoService } from './pdf/relatorio-delegacao';

export {
  FichaInscricaoService,
  SumulaChamadaService,
  CrachaDobravelService,
  RelatorioDelegacaoService
};

/**
 * Fachada Central de Geração de PDFs JEGDS 2026
 * Preserva 100% de compatibilidade com todos os módulos e páginas do sistema
 */
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
    return FichaInscricaoService.gerarFichaInscricao(escola, inscricao, atletas, comissao);
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
    return SumulaChamadaService.gerarListaChamadaOficial(
      modalidadeNome,
      categoria,
      sexo,
      dataJogo,
      atletasComEscola
    );
  }

  /**
   * Gera o Caderno Completo de uma Modalidade (Todas as Categorias em 1 só PDF)
   */
  public static async gerarCadernoModalidadeCompleto(
    modalidade: any,
    categoriasData: any[]
  ): Promise<void> {
    return SumulaChamadaService.gerarCadernoModalidadeCompleto(modalidade, categoriasData);
  }

  /**
   * Gera o Caderno Geral de Arbitragem com todas as modalidades reunidas em 1 PDF
   */
  public static async gerarCadernoGeralArbitragem(
    modalidadesCompletas: any[]
  ): Promise<void> {
    return SumulaChamadaService.gerarCadernoGeralArbitragem(modalidadesCompletas);
  }

  /**
   * Gera Crachá Individual em PDF (Formato Dobrável Frente e Verso)
   */
  public static async gerarCrachaIndividual(
    atleta: Atleta,
    escola: Escola,
    professorNome?: string
  ): Promise<void> {
    return CrachaDobravelService.gerarCrachaIndividual(atleta, escola, professorNome);
  }

  /**
   * Gera Crachás Oficiais em Lote por Escola (Otimizado: 6 Crachás Dobráveis por Folha A4)
   */
  public static async gerarCrachasEmLote(
    escola: Escola,
    atletas: Atleta[],
    modalidadeNome?: string,
    categoria?: string
  ): Promise<void> {
    return CrachaDobravelService.gerarCrachasEmLote(escola, atletas, modalidadeNome, categoria);
  }

  /**
   * Gera Todos os Crachás de Todas as Escolas
   */
  public static async gerarTodosCrachasGeral(
    escolas: Escola[],
    atletas: Atleta[]
  ): Promise<void> {
    return CrachaDobravelService.gerarTodosCrachasGeral(escolas, atletas);
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
    return RelatorioDelegacaoService.gerarLoteCompletoEscola(
      escola,
      atletas,
      inscricoes,
      filtroModalidade,
      filtroCategoria,
      filtroSexo
    );
  }
}
