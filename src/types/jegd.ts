export type ModalidadeTipo = 'COLETIVA' | 'INDIVIDUAL';

export type CategoriaIdade = 'INFANTIL' | 'INFANTO'; // Infantil: 12-14 anos | Infanto: 15-17 anos

export type Genero = 'MASCULINO' | 'FEMININO' | 'MISTO';

export type RedeEscolar = 'MUNICIPAL' | 'ESTADUAL' | 'PARTICULAR' | 'FEDERAL';

export type StatusInscricao = 'RASCUNHO' | 'ENVIADA' | 'DEFERIDA' | 'INDEFERIDA' | 'PENDENTE_AJUSTE';

export interface ModalidadeConfig {
  id: string;
  nome: string;
  tipo: ModalidadeTipo;
  generos: Genero[];
  categorias: CategoriaIdade[];
  minAtletas: number;
  maxAtletas: number;
  maxComissao: number;
  icone: string;
  descricao: string;
  localPadrao?: string;
}

export interface DocumentosAluno {
  foto3x4?: string; // Data URL / Base64
  documentoIdentidade?: string; // RG ou Certidão
  comprovanteMatricula?: string;
  autorizacaoPais?: string;
  atestadoMedico?: string;
}

export interface Atleta {
  id: string;
  escolaId: string;
  nomeCompleto: string;
  dataNascimento: string; // YYYY-MM-DD
  cpf: string;
  rg: string;
  orgaoExpedidor?: string;
  matricula: string;
  serieTurma: string;
  genero: Genero;
  nomeMae: string;
  telefoneContato: string;
  tipoSanguineo?: string;
  alergiasCuidados?: string;
  documentos: DocumentosAluno;
  ativo: boolean;
  createdAt: string;
}

export interface MembroComissao {
  id: string;
  escolaId: string;
  nomeCompleto: string;
  funcao: 'TECNICO' | 'AUXILIAR' | 'DELEGADO' | 'MASSAGISTA_FISIO';
  registroProfissional?: string; // CREF ou similar
  cpf: string;
  telefone: string;
  email: string;
  foto?: string;
}

export interface Escola {
  id: string;
  nome: string;
  sigla: string;
  inep: string;
  rede: RedeEscolar;
  bairro: string;
  endereco: string;
  diretorNome: string;
  professorRespNome: string;
  telefone: string;
  email: string;
  senhaHash?: string;
  brasaoLogo?: string;
  createdAt: string;
}

export interface InscricaoEquipe {
  id: string;
  escolaId: string;
  modalidadeId: string;
  modalidadeNome: string;
  categoria: CategoriaIdade;
  genero: Genero;
  atletaIds: string[];
  comissaoIds: string[];
  status: StatusInscricao;
  parecerSemed?: string;
  dataEnvio?: string;
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

export interface PartidaChave {
  id: string;
  modalidadeId: string;
  categoria: CategoriaIdade;
  genero: Genero;
  fase: 'CLASSIFICATORIA' | 'QUARTAS' | 'SEMIFINAL' | 'FINAL' | 'TERCEIRO_LUGAR';
  escolaAId: string;
  escolaBId: string;
  placarA?: number;
  placarB?: number;
  dataHora: string;
  local: string;
  status: 'AGENDADA' | 'EM_ANDAMENTO' | 'FINALIZADA' | 'CANCELADA';
}
