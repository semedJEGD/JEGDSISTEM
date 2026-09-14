export type CategoriaIdade = 'MIRIM' | 'INFANTIL' | 'INFANTO' | 'JUNIOR';

export type Genero = 'MASCULINO' | 'FEMININO';

export type TipoDocumento = 'RG' | 'CERTIDAO';

export type RedeEscolar = 'MUNICIPAL' | 'ESTADUAL' | 'PARTICULAR' | 'FEDERAL';

export type StatusInscricao = 'PENDENTE' | 'VALIDADA' | 'REJEITADA';

export type ModalidadeCodigo =
  | 'atletismo'
  | 'xadrez'
  | 'futsal'
  | 'queimada'
  | 'futebol_campo'
  | 'voleibol'
  | 'beach_soccer'
  | 'tenis_mesa';

export interface ModalidadeConfig {
  id: string;
  codigo: ModalidadeCodigo;
  nome: string;
  tipo: 'COLETIVA' | 'INDIVIDUAL';
  dataEvento: string; // YYYY-MM-DD
  prazoInscricao: string; // YYYY-MM-DD (7 dias antes)
  categoriasPermitidas: CategoriaIdade[];
  sexosPermitidos: Genero[];
  minAtletas: number;
  maxAtletas: number;
  maxProvasPorAtleta: number;
  provasDisponiveis?: string[];
  descricao: string;
  localPadrao?: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senhaHash?: string;
  telefone: string;
  papel: 'PROFESSOR' | 'COORDENADOR';
  escolaId?: string | null;
  createdAt: string;
}

export interface DocumentosAluno {
  foto3x4?: string; // Data URL / Base64
  documentoIdentidade?: string; // RG ou Certidão
  comprovanteMatricula?: string;
  autorizacaoPais?: string;
}

export interface Atleta {
  id: string;
  escolaId: string;
  nomeCompleto: string;
  dataNascimento: string; // YYYY-MM-DD
  sexo: Genero;
  documentoTipo: TipoDocumento;
  documentoNumero: string;
  matricula: string;
  serieTurma: string;
  nomeMae?: string;
  telefoneContato: string;
  tipoSanguineo?: string;
  consentimentoResponsavel: boolean;
  cadastradoPor?: string; // Nome ou ID do professor
  categoriaCalculada?: CategoriaIdade;
  modalidadesInscritas?: {
    modalidadeCodigo: ModalidadeCodigo;
    modalidadeNome: string;
    provas?: string[];
  }[];
  conferidoPeloCoordenador?: boolean;
  observacaoCoordenador?: string;
  documentos: DocumentosAluno;
  ativo: boolean;
  createdAt: string;
}

export interface MembroComissao {
  id: string;
  escolaId: string;
  nomeCompleto: string;
  funcao: 'TECNICO' | 'AUXILIAR' | 'DELEGADO' | 'MASSAGISTA_FISIO';
  registroProfissional?: string; // CREF
  cpf: string;
  telefone: string;
  email: string;
}

export interface Escola {
  id: string;
  nome: string;
  sigla: string;
  inep: string;
  rede: RedeEscolar;
  bairro: string;
  endereco: string;
  responsavelNome: string;
  responsavelTelefone: string;
  loginEmail: string;
  senhaHash?: string;
  createdAt: string;
}

export interface InscricaoEquipe {
  id: string;
  escolaId: string;
  modalidadeCodigo: ModalidadeCodigo;
  modalidadeNome: string;
  categoria: CategoriaIdade;
  sexo: Genero;
  atletaIds: string[];
  provasPorAtleta?: Record<string, string[]>; // Para atletismo: atletaId -> ["100m", "salto"]
  comissaoIds: string[];
  status: StatusInscricao;
  motivoRejeicao?: string;
  parecerComite?: string;
  dataInscricao: string;
  dataHomologacao?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComunicadoAviso {
  id: string;
  titulo: string;
  conteudo: string;
  categoria: 'REGULAMENTO' | 'CRONOGRAMA' | 'ALERTA' | 'RESULTADOS';
  dataPublicacao: string;
  urgente: boolean;
  autor: string;
}

