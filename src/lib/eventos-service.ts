import {
  EventosBundle,
  PartidaEventoItem,
  MedalhaEventoItem,
  ArtilhariaEventoItem,
  LinhaClassificacao,
  LinhaQuadroMedalhas,
} from '@/types/eventos';

export const MODALIDADES_EVENTOS_OPCOES = [
  { codigo: 'queimada', nome: 'Queimada' },
  { codigo: 'tenis-mesa', nome: 'Tênis de Mesa' },
  { codigo: 'atletismo', nome: 'Atletismo' },
  { codigo: 'beach-soccer', nome: 'Beach Soccer' },
  { codigo: 'futsal', nome: 'Futsal' },
  { codigo: 'xadrez', nome: 'Xadrez' },
  { codigo: 'futebol-campo', nome: 'Futebol de Campo' },
  { codigo: 'voleibol', nome: 'Voleibol' },
];

export const CATEGORIAS_EVENTOS = ['MIRIM', 'INFANTIL', 'INFANTO', 'JUNIOR'] as const;

export const FASES_LABEL: Record<string, string> = {
  GRUPOS: 'Fase de Grupos',
  OITAVAS: 'Oitavas de Final',
  QUARTAS: 'Quartas de Final',
  SEMIFINAL: 'Semifinal',
  TERCEIRO_LUGAR: 'Disputa 3º Lugar',
  FINAL: 'Grande Final',
};

export const CRONOGRAMA_PADRAO_JEGDS = [
  {
    titulo: 'Abertura Solene dos JEGDs 2026',
    descricao: 'Desfile oficial das delegações escolares, juramento do atleta e acendimento da pira olímpica.',
    etapa: 'Abertura',
    modalidadeNome: 'Cerimônia Oficial',
    categoria: 'TODAS',
    local: 'U.E. Aldenora de Araújo Cruz',
    dataEvento: '2026-11-21',
    horarioInicio: '08:00',
    horarioFim: '11:30',
    status: 'PREVISTO',
    ordem: 1,
  },
  {
    titulo: '1ª Etapa — Queimada & Tênis de Mesa',
    descricao: 'Disputas classificatórias e eliminatórias de Queimada (Mirim a Júnior) e Tênis de Mesa.',
    etapa: '1ª Etapa',
    modalidadeNome: 'Queimada / Tênis de Mesa',
    categoria: 'TODAS',
    local: 'Quadra Poliesportiva SEMED',
    dataEvento: '2026-11-28',
    horarioInicio: '08:00',
    horarioFim: '17:00',
    status: 'PREVISTO',
    ordem: 2,
  },
  {
    titulo: '2ª Etapa — Atletismo & Beach Soccer',
    descricao: 'Provas de pista (75m, 100m, 200m, 400m, 1.000m), salto em distância e torneio de Beach Soccer.',
    etapa: '2ª Etapa',
    modalidadeNome: 'Atletismo / Beach Soccer',
    categoria: 'TODAS',
    local: 'Pista & Arena Municipal',
    dataEvento: '2026-12-05',
    horarioInicio: '07:30',
    horarioFim: '17:00',
    status: 'PREVISTO',
    ordem: 3,
  },
  {
    titulo: '3ª Etapa — Futsal, Futebol, Voleibol & Xadrez',
    descricao: 'Rodadas oficiais das modalidades coletivas de quadra/campo e torneio de Xadrez rápido.',
    etapa: '3ª Etapa',
    modalidadeNome: 'Futsal / Futebol / Vôlei / Xadrez',
    categoria: 'TODAS',
    local: 'Ginásio & Estádio Municipal',
    dataEvento: '2026-12-12',
    horarioInicio: '08:00',
    horarioFim: '18:00',
    status: 'PREVISTO',
    ordem: 4,
  },
  {
    titulo: 'Encerramento & Premiação Geral',
    descricao: 'Entrega oficial de troféus, medalhas e consagração da escola campeã geral dos JEGDs 2026.',
    etapa: 'Encerramento',
    modalidadeNome: 'Premiação Oficial',
    categoria: 'TODAS',
    local: 'U.E. Aldenora de Araújo Cruz',
    dataEvento: '2026-12-19',
    horarioInicio: '08:30',
    horarioFim: '12:00',
    status: 'PREVISTO',
    ordem: 5,
  },
];

/**
 * Calcula tabelas de classificação (Fase de Grupos) automaticamente a partir das partidas encerradas,
 * seguindo a pontuação oficial do Regulamento JEGDs 2026.
 */
export function calcularClassificacaoPorChave(partidas: PartidaEventoItem[]): {
  chave: string;
  modalidadeNome: string;
  modalidadeCodigo: string;
  categoria: string;
  sexo: string;
  grupo: string;
  linhas: LinhaClassificacao[];
}[] {
  const gruposMap = new Map<
    string,
    {
      modalidadeNome: string;
      modalidadeCodigo: string;
      categoria: string;
      sexo: string;
      grupo: string;
      escolas: Map<string, LinhaClassificacao>;
    }
  >();

  const partidasGrupo = partidas.filter((p) => p.fase === 'GRUPOS');

  partidasGrupo.forEach((p) => {
    const grupoNome = p.grupo?.trim() || 'Grupo Único';
    const chave = `${p.modalidadeCodigo}__${p.categoria}__${p.sexo}__${grupoNome}`;

    if (!gruposMap.has(chave)) {
      gruposMap.set(chave, {
        modalidadeNome: p.modalidadeNome,
        modalidadeCodigo: p.modalidadeCodigo,
        categoria: p.categoria,
        sexo: p.sexo,
        grupo: grupoNome,
        escolas: new Map(),
      });
    }

    const g = gruposMap.get(chave)!;
    const garantirEscola = (id: string, nome: string, sigla?: string | null) => {
      if (!g.escolas.has(id)) {
        g.escolas.set(id, {
          escolaId: id,
          escolaNome: nome,
          escolaSigla: sigla || nome,
          jogos: 0,
          vitorias: 0,
          empates: 0,
          derrotas: 0,
          pro: 0,
          contra: 0,
          saldo: 0,
          pontos: 0,
        });
      }
      return g.escolas.get(id)!;
    };

    const rowA = garantirEscola(p.escolaAId, p.escolaANome, p.escolaASigla);
    const rowB = garantirEscola(p.escolaBId, p.escolaBNome, p.escolaBSigla);

    if (p.status !== 'ENCERRADO' && p.status !== 'WO') return;

    rowA.jogos += 1;
    rowB.jogos += 1;
    rowA.pro += p.placarA;
    rowA.contra += p.placarB;
    rowB.pro += p.placarB;
    rowB.contra += p.placarA;

    const isVolei = p.modalidadeCodigo.includes('volei');

    if (p.placarA > p.placarB) {
      rowA.vitorias += 1;
      rowB.derrotas += 1;
      if (isVolei && p.placarA === 2 && p.placarB === 1) {
        rowA.pontos += 2;
        rowB.pontos += 1;
      } else {
        rowA.pontos += 3;
      }
    } else if (p.placarB > p.placarA) {
      rowB.vitorias += 1;
      rowA.derrotas += 1;
      if (isVolei && p.placarB === 2 && p.placarA === 1) {
        rowB.pontos += 2;
        rowA.pontos += 1;
      } else {
        rowB.pontos += 3;
      }
    } else {
      rowA.empates += 1;
      rowB.empates += 1;
      rowA.pontos += 1;
      rowB.pontos += 1;
    }

    rowA.saldo = rowA.pro - rowA.contra;
    rowB.saldo = rowB.pro - rowB.contra;
  });

  return Array.from(gruposMap.entries()).map(([chave, g]) => ({
    chave,
    modalidadeNome: g.modalidadeNome,
    modalidadeCodigo: g.modalidadeCodigo,
    categoria: g.categoria,
    sexo: g.sexo,
    grupo: g.grupo,
    linhas: Array.from(g.escolas.values()).sort((a, b) => {
      if (b.pontos !== a.pontos) return b.pontos - a.pontos;
      if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
      if (b.saldo !== a.saldo) return b.saldo - a.saldo;
      if (b.pro !== a.pro) return b.pro - a.pro;
      return a.escolaNome.localeCompare(b.escolaNome, 'pt-BR');
    }),
  }));
}

/**
 * Calcula o Quadro Geral de Medalhas pelo critério olímpico oficial:
 * Ouro -> Prata -> Bronze -> Total -> Ordem alfabética.
 */
export function calcularQuadroMedalhas(medalhas: MedalhaEventoItem[]): LinhaQuadroMedalhas[] {
  const mapa = new Map<string, LinhaQuadroMedalhas>();

  medalhas.forEach((m) => {
    if (!mapa.has(m.escolaId)) {
      mapa.set(m.escolaId, {
        escolaId: m.escolaId,
        escolaNome: m.escolaNome,
        escolaSigla: m.escolaSigla || m.escolaNome,
        ouro: 0,
        prata: 0,
        bronze: 0,
        total: 0,
      });
    }
    const row = mapa.get(m.escolaId)!;
    const tipo = (m.tipo || '').toUpperCase();
    if (tipo === 'OURO') row.ouro += 1;
    else if (tipo === 'PRATA') row.prata += 1;
    else if (tipo === 'BRONZE') row.bronze += 1;
    row.total = row.ouro + row.prata + row.bronze;
  });

  return Array.from(mapa.values()).sort((a, b) => {
    if (b.ouro !== a.ouro) return b.ouro - a.ouro;
    if (b.prata !== a.prata) return b.prata - a.prata;
    if (b.bronze !== a.bronze) return b.bronze - a.bronze;
    return a.escolaNome.localeCompare(b.escolaNome, 'pt-BR');
  });
}

/**
 * Agrupa o ranking de artilharia (gols/pontos) por modalidade, ordenado do maior goleador para o menor.
 */
export function agruparArtilhariaPorModalidade(artilharia: ArtilhariaEventoItem[]): {
  modalidadeCodigo: string;
  modalidadeNome: string;
  ranking: ArtilhariaEventoItem[];
}[] {
  const mapa = new Map<string, { modalidadeCodigo: string; modalidadeNome: string; ranking: ArtilhariaEventoItem[] }>();

  artilharia.forEach((a) => {
    const key = a.modalidadeCodigo || a.modalidadeNome;
    if (!mapa.has(key)) {
      mapa.set(key, {
        modalidadeCodigo: a.modalidadeCodigo,
        modalidadeNome: a.modalidadeNome,
        ranking: [],
      });
    }
    mapa.get(key)!.ranking.push(a);
  });

  return Array.from(mapa.values()).map((g) => ({
    ...g,
    ranking: [...g.ranking].sort((a, b) => {
      if (b.gols !== a.gols) return b.gols - a.gols;
      return a.atletaNome.localeCompare(b.atletaNome, 'pt-BR');
    }),
  }));
}

export function formatarDataBR(dataIso: string): string {
  if (!dataIso) return '';
  const partes = dataIso.split('-');
  if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
  return dataIso;
}

/**
 * Cliente HTTP unificado para /api/eventos
 */
export const EventosApi = {
  async carregar(municipioId?: string): Promise<EventosBundle> {
    const qs = municipioId ? `?municipioId=${encodeURIComponent(municipioId)}` : '';
    const res = await fetch(`/api/eventos${qs}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Falha ao carregar eventos');
    const json = await res.json();
    return json.data as EventosBundle;
  },

  async criar(entidade: string, dados: Record<string, any>): Promise<any> {
    const res = await fetch('/api/eventos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entidade, dados }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Erro ao salvar');
    return json.data;
  },

  async atualizar(entidade: string, id: string, dados: Record<string, any>): Promise<any> {
    const res = await fetch('/api/eventos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entidade, id, dados }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Erro ao atualizar');
    return json.data;
  },

  async excluir(entidade: string, id: string): Promise<void> {
    const res = await fetch(`/api/eventos?entidade=${encodeURIComponent(entidade)}&id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.error || 'Erro ao excluir');
  },
};
