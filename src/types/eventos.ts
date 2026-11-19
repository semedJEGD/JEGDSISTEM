export type StatusCronograma = 'PREVISTO' | 'EM_ANDAMENTO' | 'CONCLUIDO';
export type StatusPartida = 'AGENDADO' | 'AO_VIVO' | 'ENCERRADO' | 'WO';
export type FasePartida = 'GRUPOS' | 'OITAVAS' | 'QUARTAS' | 'SEMIFINAL' | 'TERCEIRO_LUGAR' | 'FINAL';
export type TipoMedalha = 'OURO' | 'PRATA' | 'BRONZE';
export type TipoAvisoTelao = 'CHAMADA' | 'INFORMATIVO' | 'URGENTE';

export interface NoticiaEventoItem {
  id: string;
  municipioId?: string | null;
  titulo: string;
  resumo: string;
  conteudo?: string | null;
  modalidadeNome?: string | null;
  categoria?: string | null;
  horarioOcorrencia?: string | null;
  local?: string | null;
  imagemUrl?: string | null;
  destaqueTelao: boolean;
  publicado: boolean;
  autor: string;
  createdAt: string;
}

export interface CronogramaEventoItem {
  id: string;
  municipioId?: string | null;
  titulo: string;
  descricao?: string | null;
  etapa: string;
  modalidadeNome?: string | null;
  categoria?: string | null;
  local?: string | null;
  dataEvento: string; // YYYY-MM-DD
  horarioInicio: string; // HH:mm
  horarioFim?: string | null;
  status: StatusCronograma;
  resumoResultado?: string | null;
  ordem: number;
}

export interface PartidaEventoItem {
  id: string;
  municipioId?: string | null;
  numeroJogo?: number | null;
  modalidadeCodigo: string;
  modalidadeNome: string;
  categoria: string;
  sexo: string;
  fase: FasePartida | string;
  grupo?: string | null;
  dataEvento: string;
  horario: string;
  local?: string | null;
  escolaAId: string;
  escolaANome: string;
  escolaASigla?: string | null;
  escolaBId: string;
  escolaBNome: string;
  escolaBSigla?: string | null;
  placarA: number;
  placarB: number;
  detalhesPlacar?: string | null;
  status: StatusPartida | string;
  woEscolaId?: string | null;
  vencedorEscolaId?: string | null;
  observacao?: string | null;
}

export interface ArtilhariaEventoItem {
  id: string;
  municipioId?: string | null;
  atletaId?: string | null;
  atletaNome: string;
  fotoUrl?: string | null;
  escolaId: string;
  escolaNome: string;
  escolaSigla?: string | null;
  modalidadeCodigo: string;
  modalidadeNome: string;
  categoria: string;
  sexo: string;
  gols: number;
}

export interface MedalhaEventoItem {
  id: string;
  municipioId?: string | null;
  escolaId: string;
  escolaNome: string;
  escolaSigla?: string | null;
  modalidadeCodigo: string;
  modalidadeNome: string;
  categoria: string;
  sexo: string;
  prova?: string | null;
  tipo: TipoMedalha | string;
  atletaNome?: string | null;
  createdAt: string;
}

export interface AvisoTelaoItem {
  id: string;
  municipioId?: string | null;
  titulo: string;
  mensagem: string;
  tipo: TipoAvisoTelao | string;
  ativo: boolean;
  createdAt: string;
}

export interface EventosBundle {
  noticias: NoticiaEventoItem[];
  cronograma: CronogramaEventoItem[];
  partidas: PartidaEventoItem[];
  artilharia: ArtilhariaEventoItem[];
  medalhas: MedalhaEventoItem[];
  avisos: AvisoTelaoItem[];
  updatedAt: string;
}

export interface LinhaClassificacao {
  escolaId: string;
  escolaNome: string;
  escolaSigla: string;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  pro: number;
  contra: number;
  saldo: number;
  pontos: number;
}

export interface LinhaQuadroMedalhas {
  escolaId: string;
  escolaNome: string;
  escolaSigla: string;
  ouro: number;
  prata: number;
  bronze: number;
  total: number;
}
