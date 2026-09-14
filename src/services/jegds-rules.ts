export type CategoriaEtariaJEGDS = 'MIRIM' | 'INFANTIL' | 'INFANTO' | 'JUNIOR';
export type SexoJEGDS = 'MASCULINO' | 'FEMININO';
export type ModalidadeCodigoJEGDS =
  | 'atletismo'
  | 'xadrez'
  | 'futsal'
  | 'queimada'
  | 'futebol_campo'
  | 'voleibol'
  | 'beach_soccer'
  | 'tenis_mesa';

export interface ModalidadeInfo {
  codigo: ModalidadeCodigoJEGDS;
  nome: string;
  tipo: 'INDIVIDUAL' | 'COLETIVA';
  dataEvento: string; // YYYY-MM-DD
  prazoInscricaoPadrao: string; // YYYY-MM-DD
  limiteMaxElenco?: number;
  limiteMinElenco?: number;
}

export const MODALIDADES_JEGDS: Record<ModalidadeCodigoJEGDS, ModalidadeInfo> = {
  queimada: {
    codigo: 'queimada',
    nome: 'Queimada',
    tipo: 'COLETIVA',
    dataEvento: '2026-11-28',
    prazoInscricaoPadrao: '2026-11-21',
    limiteMinElenco: 8
  },
  tenis_mesa: {
    codigo: 'tenis_mesa',
    nome: 'Tênis de Mesa',
    tipo: 'INDIVIDUAL',
    dataEvento: '2026-11-28',
    prazoInscricaoPadrao: '2026-11-21',
    limiteMaxElenco: 4
  },
  atletismo: {
    codigo: 'atletismo',
    nome: 'Atletismo',
    tipo: 'INDIVIDUAL',
    dataEvento: '2026-12-05',
    prazoInscricaoPadrao: '2026-11-28',
    limiteMaxElenco: 8
  },
  beach_soccer: {
    codigo: 'beach_soccer',
    nome: 'Beach Soccer',
    tipo: 'COLETIVA',
    dataEvento: '2026-12-05',
    prazoInscricaoPadrao: '2026-11-28',
    limiteMaxElenco: 12
  },
  futsal: {
    codigo: 'futsal',
    nome: 'Futsal',
    tipo: 'COLETIVA',
    dataEvento: '2026-12-12',
    prazoInscricaoPadrao: '2026-12-05',
    limiteMaxElenco: 10
  },
  xadrez: {
    codigo: 'xadrez',
    nome: 'Xadrez',
    tipo: 'INDIVIDUAL',
    dataEvento: '2026-12-12',
    prazoInscricaoPadrao: '2026-12-05',
    limiteMaxElenco: 4
  },
  futebol_campo: {
    codigo: 'futebol_campo',
    nome: 'Futebol de Campo',
    tipo: 'COLETIVA',
    dataEvento: '2026-12-12',
    prazoInscricaoPadrao: '2026-12-05',
    limiteMaxElenco: 20
  },
  voleibol: {
    codigo: 'voleibol',
    nome: 'Voleibol',
    tipo: 'COLETIVA',
    dataEvento: '2026-12-12',
    prazoInscricaoPadrao: '2026-12-05',
    limiteMaxElenco: 12
  }
};

export const PROVAS_ATLETISMO_POR_CATEGORIA: Record<CategoriaEtariaJEGDS, string[]> = {
  MIRIM: ['75m', '100m'],
  INFANTIL: ['75m', '100m', '200m', 'salto'],
  INFANTO: ['100m', '200m', '400m', '1000m', 'salto'],
  JUNIOR: ['100m', '200m', '400m', '1000m', 'salto']
};

export class JegdsRulesService {
  /**
   * Calcula a categoria etária exata a partir da data de nascimento.
   * Data de referência oficial: 31/12/2026.
   */
  public static calcularCategoria(
    dataNascimento: Date | string,
    dataReferencia: Date = new Date('2026-12-31T23:59:59Z')
  ): { categoria: CategoriaEtariaJEGDS | null; idade: number; mensagem: string } {
    const dataNasc = typeof dataNascimento === 'string' ? new Date(dataNascimento) : dataNascimento;

    if (isNaN(dataNasc.getTime())) {
      return { categoria: null, idade: 0, mensagem: 'Data de nascimento inválida.' };
    }

    // Cálculo da idade completada até 31/12/2026
    let idade = dataReferencia.getUTCFullYear() - dataNasc.getUTCFullYear();
    const mesRef = dataReferencia.getUTCMonth();
    const diaRef = dataReferencia.getUTCDate();
    const mesNasc = dataNasc.getUTCMonth();
    const diaNasc = dataNasc.getUTCDate();

    if (mesRef < mesNasc || (mesRef === mesNasc && diaRef < diaNasc)) {
      idade--;
    }

    if (idade >= 9 && idade <= 11) {
      return { categoria: 'MIRIM', idade, mensagem: `Mirim (${idade} anos em 31/12/2026)` };
    } else if (idade >= 12 && idade <= 14) {
      return { categoria: 'INFANTIL', idade, mensagem: `Infantil (${idade} anos em 31/12/2026)` };
    } else if (idade >= 15 && idade <= 17) {
      return { categoria: 'INFANTO', idade, mensagem: `Infanto (${idade} anos em 31/12/2026)` };
    } else if (idade >= 18 && idade <= 20) {
      return { categoria: 'JUNIOR', idade, mensagem: `Junior (${idade} anos em 31/12/2026)` };
    } else {
      return {
        categoria: null,
        idade,
        mensagem: `Idade (${idade} anos) fora da faixa permitida pelo JEGDS 2026 (9 a 20 anos).`
      };
    }
  }

  /**
   * Valida a Matriz Oficial Modalidade x Categoria x Sexo
   * Lança erro ou retorna objeto de validação se for inválido.
   */
  public static validarMatriz(
    modalidade: ModalidadeCodigoJEGDS,
    categoria: CategoriaEtariaJEGDS,
    sexo: SexoJEGDS
  ): { valido: boolean; erro?: string } {
    // Regra 1: Modalidades que não existem para a categoria Mirim
    const modalidadesSemMirim: ModalidadeCodigoJEGDS[] = ['voleibol', 'beach_soccer', 'tenis_mesa'];
    if (categoria === 'MIRIM' && modalidadesSemMirim.includes(modalidade)) {
      const nomeMod = MODALIDADES_JEGDS[modalidade]?.nome || modalidade;
      return {
        valido: false,
        erro: `A modalidade ${nomeMod} não existe para a categoria Mirim. É permitida apenas a partir do Infantil (12 anos).`
      };
    }

    // Regra 2: Modalidades que são exclusivamente MASCULINAS
    const modalidadesApenasMasculino: ModalidadeCodigoJEGDS[] = [
      'futebol_campo',
      'voleibol',
      'beach_soccer',
      'tenis_mesa'
    ];
    if (sexo === 'FEMININO' && modalidadesApenasMasculino.includes(modalidade)) {
      const nomeMod = MODALIDADES_JEGDS[modalidade]?.nome || modalidade;
      return {
        valido: false,
        erro: `A modalidade ${nomeMod} é disputada exclusivamente no naipe Masculino no JEGDS 2026.`
      };
    }

    // Regra 3: Modalidades mistas/ambos os sexos permitidas
    const modalidadesMascFem: ModalidadeCodigoJEGDS[] = ['atletismo', 'xadrez', 'futsal', 'queimada'];
    if (modalidadesMascFem.includes(modalidade)) {
      return { valido: true };
    }

    // Se passou pelas validações acima para esportes apenas masc
    if (modalidadesApenasMasculino.includes(modalidade) && sexo === 'MASCULINO') {
      return { valido: true };
    }

    return { valido: false, erro: 'Combinação de modalidade, categoria e sexo inválida.' };
  }

  /**
   * Validação de provas de Atletismo
   * Máximo 2 provas por atleta e provas compatíveis com a categoria.
   */
  public static validarProvasAtletismo(
    categoria: CategoriaEtariaJEGDS,
    provas: string[]
  ): { valido: boolean; erro?: string } {
    if (!provas || provas.length === 0) {
      return { valido: false, erro: 'Selecione ao menos 1 prova de atletismo.' };
    }

    if (provas.length > 2) {
      return {
        valido: false,
        erro: `No Atletismo, cada atleta pode se inscrever em no máximo 2 provas. Você selecionou ${provas.length} provas.`
      };
    }

    const provasPermitidas = PROVAS_ATLETISMO_POR_CATEGORIA[categoria] || [];
    for (const p of provas) {
      const pNorm = p.toLowerCase().trim();
      const permitida = provasPermitidas.some(pp => pp.toLowerCase() === pNorm);
      if (!permitida) {
        return {
          valido: false,
          erro: `A prova "${p}" não está disponível para a categoria ${categoria}. Provas permitidas: ${provasPermitidas.join(', ')}.`
        };
      }
    }

    return { valido: true };
  }

  /**
   * Validação de limites de elenco por equipe
   */
  public static validarLimiteElenco(
    modalidade: ModalidadeCodigoJEGDS,
    quantidadeAtletas: number
  ): { valido: boolean; erro?: string } {
    const config = MODALIDADES_JEGDS[modalidade];
    if (!config) return { valido: true };

    if (config.limiteMaxElenco && quantidadeAtletas > config.limiteMaxElenco) {
      return {
        valido: false,
        erro: `O limite máximo de atletas para ${config.nome} é de ${config.limiteMaxElenco} atletas. Total selecionado: ${quantidadeAtletas}.`
      };
    }

    if (config.limiteMinElenco && quantidadeAtletas < config.limiteMinElenco) {
      return {
        valido: false,
        erro: `A modalidade ${config.nome} exige no mínimo ${config.limiteMinElenco} atletas no elenco. Total selecionado: ${quantidadeAtletas}.`
      };
    }

    return { valido: true };
  }

  /**
   * Validação de Documento Obrigatório (RG ou Certidão)
   */
  public static validarDocumento(
    tipo: 'RG' | 'CERTIDAO',
    numero: string
  ): { valido: boolean; erro?: string } {
    if (!numero || numero.trim().length < 3) {
      return {
        valido: false,
        erro: 'O número do documento (RG ou Certidão de Nascimento) é obrigatório para homologação.'
      };
    }
    return { valido: true };
  }

  /**
   * Verifica se o prazo de inscrição de uma modalidade está expirado
   */
  public static isPrazoExpirado(
    prazoInscricao: Date | string,
    dataAtual: Date = new Date()
  ): boolean {
    const prazo = typeof prazoInscricao === 'string' ? new Date(`${prazoInscricao}T23:59:59`) : prazoInscricao;
    return dataAtual.getTime() > prazo.getTime();
  }
}
