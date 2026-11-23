import { Atleta, Escola, InscricaoEquipe, ModalidadeConfig } from '@/types/jegd';
import { FormatoChaveamento, PartidaEventoItem } from '@/types/eventos';
import { calcularClassificacaoPorChave } from '@/lib/eventos-service';
import { JegdsRulesService } from '@/services/jegds-rules';

// ============================================================
// NORMALIZAÇÃO & HELPERS
// ============================================================

export function normalizarCodigoModalidade(codigo: string): string {
  return (codigo || '').trim().toLowerCase().replace(/-/g, '_');
}

export function isModalidadeIndividual(codigo: string): boolean {
  const norm = normalizarCodigoModalidade(codigo);
  return norm === 'atletismo' || norm === 'xadrez' || norm === 'tenis_mesa';
}

export function gerarSeedAuditavel(): string {
  const now = new Date();
  const data = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `JEGDS-${data}-${rand}`;
}

/**
 * PRNG determinístico (Mulberry32) alimentado pela seed do sorteio.
 * Permite reproduzir e auditar exatamente o mesmo sorteio no Congresso Técnico.
 */
function criarPrng(seedStr: string): () => number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function embaralharComSeed<T>(lista: T[], seed: string): T[] {
  const arr = [...lista];
  const rng = criarPrng(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function somarMinutosHorario(horaHHMM: string, minutos: number): string {
  const [hStr, mStr] = (horaHHMM || '08:00').split(':');
  const total = (parseInt(hStr, 10) || 8) * 60 + (parseInt(mStr, 10) || 0) + minutos;
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

// ============================================================
// TIPOS DO MOTOR DE AUDITORIA E CHAVEAMENTO
// ============================================================

export interface ParticipanteChaveamento {
  id: string; // escolaId (coletivas) ou atletaId (individuais)
  nome: string; // Nome da escola ou nome do atleta
  sigla: string; // Sigla da escola (ou "ATLETA • SIGLA")
  escolaId: string;
  escolaNome: string;
  escolaSigla: string;
  statusHomologacao: 'VALIDADA' | 'PENDENTE' | 'REJEITADA';
  totalAtletas?: number;
  provas?: string[];
  alertas: string[];
}

export interface AlertaAuditoria {
  nivel: 'INFO' | 'ALERTA' | 'CRITICO';
  titulo: string;
  detalhe: string;
}

export interface RelatorioAuditoriaChaveamento {
  modalidadeCodigo: string;
  modalidadeNome: string;
  categoria: string;
  sexo: string;
  individual: boolean;
  semaforo: 'OK' | 'ALERTA' | 'CRITICO';
  participantes: ParticipanteChaveamento[];
  alertas: AlertaAuditoria[];
  resumo: {
    totalParticipantes: number;
    validados: number;
    pendentes: number;
    irregularidadeElenco: number;
    semDocumento: number;
  };
  formatoRecomendado: FormatoChaveamento;
  descricaoFormatoRecomendado: string;
}

export interface GrupoChaveamento {
  nome: string; // "Grupo A", "Grupo B", "Grupo Único"
  participantes: ParticipanteChaveamento[];
}

export interface PartidaGeradaPayload {
  numeroJogo: number;
  modalidadeCodigo: string;
  modalidadeNome: string;
  categoria: string;
  sexo: string;
  fase: string;
  grupo: string | null;
  dataEvento: string;
  horario: string;
  local: string | null;
  escolaAId: string;
  escolaANome: string;
  escolaASigla: string;
  escolaBId: string;
  escolaBNome: string;
  escolaBSigla: string;
  observacao?: string | null;
}

// --- Atletismo (CBAt) ---
export interface RaiaAtletismo {
  raia: number;
  atletaId: string;
  atletaNome: string;
  escolaId: string;
  escolaSigla: string;
  marca: string; // ex: "12.45s" ou "4.20m"
  posicao?: number | null;
}

export interface SerieAtletismo {
  numero: number;
  nome: string; // "Série 1"
  raias: RaiaAtletismo[];
}

export interface ProvaAtletismoBalizamento {
  prova: string;
  series: SerieAtletismo[];
}

// --- Xadrez (FIDE / CBX - Suíço ou Berger) ---
export interface MesaXadrez {
  mesa: number;
  brancasId: string;
  brancasNome: string;
  brancasSigla: string;
  pretasId: string; // 'BYE' quando ímpar
  pretasNome: string;
  pretasSigla: string;
  resultado: 'PENDENTE' | '1-0' | '0-1' | '0.5-0.5' | 'BYE';
}

export interface RodadaXadrez {
  numero: number;
  mesas: MesaXadrez[];
}

export interface EstruturaXadrez {
  sistema: 'SUICO' | 'BERGER';
  totalRodadasPrevistas: number;
  jogadores: ParticipanteChaveamento[];
  rodadas: RodadaXadrez[];
}

export interface LinhaClassificacaoXadrez {
  id: string;
  nome: string;
  sigla: string;
  jogos: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  pontos: number;
  buchholz: number;
}

// ============================================================
// 1. AUDITORIA PRÉ-CHAVEAMENTO (REAL-TIME SOBRE AS INSCRIÇÕES)
// ============================================================

export function recomendarFormatoOficial(
  modalidadeCodigo: string,
  totalParticipantes: number
): { formato: FormatoChaveamento; descricao: string } {
  const norm = normalizarCodigoModalidade(modalidadeCodigo);

  if (norm === 'atletismo') {
    return {
      formato: 'BALIZAMENTO_ATLETISMO',
      descricao: 'Balizamento oficial CBAt por prova, dividido em séries de até 8 raias.',
    };
  }
  if (norm === 'xadrez') {
    return {
      formato: 'SUICO_XADREZ',
      descricao:
        totalParticipantes <= 6
          ? `Sistema Berger (todos contra todos) — padrão FIDE/JEBs para até 6 enxadristas.`
          : `Sistema Suíço (5 rodadas, desempate Buchholz) — padrão FIDE/CBX/JEBs.`,
    };
  }
  if (norm === 'tenis_mesa') {
    return {
      formato: 'GRUPOS_TENIS_MESA',
      descricao: 'Grupos de 3 a 4 atletas (evitando mesma escola) + Mata-Mata (padrão CBTM/JEBs).',
    };
  }

  if (totalParticipantes <= 2) {
    return {
      formato: 'FINAL_DIRETA',
      descricao: 'Final Direta (jogo único ou ida/volta) — padrão CBDE/JEBs para 2 equipes.',
    };
  }
  if (totalParticipantes <= 5) {
    return {
      formato: 'BERGER_UNICO',
      descricao: `Grupo Único em Tabela de Berger (${totalParticipantes} equipes, todos contra todos em rodadas balanceadas).`,
    };
  }
  if (totalParticipantes === 6) {
    return {
      formato: 'GRUPOS_MATA_MATA',
      descricao: '2 Grupos de 3 (A:3, B:3) → Semifinais cruzadas (1ºA×2ºB, 1ºB×2ºA) → 3º Lugar e Final.',
    };
  }
  if (totalParticipantes === 7) {
    return {
      formato: 'GRUPOS_MATA_MATA',
      descricao: '2 Grupos (A:4, B:3) → Semifinais cruzadas (1ºA×2ºB, 1ºB×2ºA) → 3º Lugar e Final.',
    };
  }
  if (totalParticipantes === 8) {
    return {
      formato: 'GRUPOS_MATA_MATA',
      descricao: '2 Grupos de 4 (A:4, B:4) → Semifinais cruzadas → 3º Lugar e Final.',
    };
  }
  return {
    formato: 'GRUPOS_MATA_MATA',
    descricao:
      totalParticipantes <= 12
        ? `${totalParticipantes <= 10 ? 3 : 4} Grupos balanceados → Fase Eliminatória (Quartas/Semis/Final).`
        : '4 Grupos balanceados → Quartas de Final → Semifinais → 3º Lugar e Final.',
  };
}

export function auditarCategoriaParaChaveamento(params: {
  modalidadeCodigo: string;
  modalidadeNome: string;
  categoria: string;
  sexo: string;
  escolas: Escola[];
  atletas: Atleta[];
  inscricoes: InscricaoEquipe[];
  modalidades?: ModalidadeConfig[];
}): RelatorioAuditoriaChaveamento {
  const { modalidadeCodigo, modalidadeNome, categoria, sexo, escolas, atletas, inscricoes, modalidades } = params;
  const norm = normalizarCodigoModalidade(modalidadeCodigo);
  const individual = isModalidadeIndividual(norm);

  const escolaMap = new Map(escolas.map((e) => [e.id, e]));
  const modConfig = modalidades?.find((m) => normalizarCodigoModalidade(m.codigo) === norm);
  const minAtletas = modConfig?.minAtletas ?? (individual ? 1 : 5);
  const maxAtletas = modConfig?.maxAtletas ?? (norm === 'queimada' ? 8 : 12);

  const alertas: AlertaAuditoria[] = [];
  const participantes: ParticipanteChaveamento[] = [];

  let validados = 0;
  let pendentes = 0;
  let irregularidadeElenco = 0;
  let semDocumentoTotal = 0;

  if (individual) {
    // Modalidades Individuais: participantes são os ATLETAS inscritos
    const atletasDaCat = atletas.filter((a) => {
      const catAtleta = a.categoriaCalculada || JegdsRulesService.calcularCategoria(a.dataNascimento).categoria;
      if (catAtleta !== categoria || a.sexo !== sexo) return false;
      return (a.modalidadesInscritas || []).some((m) => normalizarCodigoModalidade(m.modalidadeCodigo) === norm);
    });

    for (const atl of atletasDaCat) {
      const esc = escolaMap.get(atl.escolaId);
      const escNome = esc?.nome || atl.escolaId;
      const escSigla = esc?.sigla || escNome;
      const modInfo = (atl.modalidadesInscritas || []).find(
        (m) => normalizarCodigoModalidade(m.modalidadeCodigo) === norm
      );
      const partAlertas: string[] = [];

      const isSemDoc = Boolean(
        atl.semDocumento || atl.documentoTipo === 'SEM_DOCUMENTO' || atl.documentoNumero === 'SEM DOCUMENTO'
      );
      if (isSemDoc) {
        semDocumentoTotal++;
        partAlertas.push('Sem documento (RG/Certidão pendente)');
      }
      if (norm === 'atletismo' && (!modInfo?.provas || modInfo.provas.length === 0)) {
        partAlertas.push('Sem prova de Atletismo selecionada');
      }

      const status = atl.conferidoPeloCoordenador ? 'VALIDADA' : 'PENDENTE';
      if (status === 'VALIDADA') validados++;
      else pendentes++;

      participantes.push({
        id: atl.id,
        nome: atl.nomeCompleto,
        sigla: `${atl.nomeCompleto.split(' ').slice(0, 2).join(' ')} (${escSigla})`,
        escolaId: atl.escolaId,
        escolaNome: escNome,
        escolaSigla: escSigla,
        statusHomologacao: status,
        provas: modInfo?.provas || [],
        alertas: partAlertas,
      });
    }
  } else {
    // Modalidades Coletivas: participantes são as EQUIPES (inscrições) ou escolas com atletas inscritos
    const inscsDaCat = inscricoes.filter(
      (i) => normalizarCodigoModalidade(i.modalidadeCodigo) === norm && i.categoria === categoria && i.sexo === sexo
    );

    // Agrupa também atletas diretos caso alguma escola tenha atletas mas ainda não tenha objeto InscricaoEquipe
    const escolasJaIncluidas = new Set<string>();

    for (const insc of inscsDaCat) {
      const esc = escolaMap.get(insc.escolaId);
      const escNome = esc?.nome || insc.escolaId;
      const escSigla = esc?.sigla || escNome;
      const numEq = insc.numeroEquipe && insc.numeroEquipe > 1 ? ` (Eq. ${insc.numeroEquipe})` : '';
      const qtd = insc.atletaIds?.length || 0;
      const partAlertas: string[] = [];

      if (qtd < minAtletas) {
        irregularidadeElenco++;
        partAlertas.push(`Abaixo do mínimo (${qtd}/${minAtletas} atletas)`);
      } else if (qtd > maxAtletas) {
        irregularidadeElenco++;
        partAlertas.push(`Acima do máximo (${qtd}/${maxAtletas} atletas)`);
      }

      const atletasDaEquipe = atletas.filter((a) => insc.atletaIds?.includes(a.id));
      const semDocEq = atletasDaEquipe.filter(
        (a) => a.semDocumento || a.documentoTipo === 'SEM_DOCUMENTO' || a.documentoNumero === 'SEM DOCUMENTO'
      ).length;
      if (semDocEq > 0) {
        semDocumentoTotal += semDocEq;
        partAlertas.push(`${semDocEq} aluno(s) sem documento`);
      }

      const status = insc.status === 'VALIDADA' ? 'VALIDADA' : insc.status === 'REJEITADA' ? 'REJEITADA' : 'PENDENTE';
      if (status === 'VALIDADA') validados++;
      else pendentes++;
      if (status !== 'VALIDADA') {
        partAlertas.push(`Homologação ${status}`);
      }

      const participanteId = insc.numeroEquipe && insc.numeroEquipe > 1 ? `${insc.escolaId}__eq${insc.numeroEquipe}` : insc.escolaId;
      escolasJaIncluidas.add(insc.escolaId);

      participantes.push({
        id: participanteId,
        nome: `${escNome}${numEq}`,
        sigla: `${escSigla}${numEq}`,
        escolaId: insc.escolaId,
        escolaNome: escNome,
        escolaSigla: escSigla,
        statusHomologacao: status,
        totalAtletas: qtd,
        alertas: partAlertas,
      });
    }

    // Fallback: escolas com atletas na modalidade que não têm entrada em inscricoes
    const atletasOrfaosPorEscola = new Map<string, Atleta[]>();
    for (const a of atletas) {
      const catAtleta = a.categoriaCalculada || JegdsRulesService.calcularCategoria(a.dataNascimento).categoria;
      if (catAtleta !== categoria || a.sexo !== sexo) continue;
      if (escolasJaIncluidas.has(a.escolaId)) continue;
      const temMod = (a.modalidadesInscritas || []).some(
        (m) => normalizarCodigoModalidade(m.modalidadeCodigo) === norm
      );
      if (temMod) {
        if (!atletasOrfaosPorEscola.has(a.escolaId)) atletasOrfaosPorEscola.set(a.escolaId, []);
        atletasOrfaosPorEscola.get(a.escolaId)!.push(a);
      }
    }
    for (const [escId, lista] of atletasOrfaosPorEscola.entries()) {
      const esc = escolaMap.get(escId);
      const escNome = esc?.nome || escId;
      const escSigla = esc?.sigla || escNome;
      const partAlertas = ['Inscrição PENDENTE (detectada via atletas)'];
      if (lista.length < minAtletas) {
        irregularidadeElenco++;
        partAlertas.push(`Abaixo do mínimo (${lista.length}/${minAtletas})`);
      } else if (lista.length > maxAtletas) {
        irregularidadeElenco++;
        partAlertas.push(`Acima do máximo (${lista.length}/${maxAtletas})`);
      }
      pendentes++;
      participantes.push({
        id: escId,
        nome: escNome,
        sigla: escSigla,
        escolaId: escId,
        escolaNome: escNome,
        escolaSigla: escSigla,
        statusHomologacao: 'PENDENTE',
        totalAtletas: lista.length,
        alertas: partAlertas,
      });
    }
  }

  participantes.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  // Gera alertas consolidados de auditoria
  if (participantes.length === 0) {
    alertas.push({
      nivel: 'CRITICO',
      titulo: 'Nenhum participante inscrito',
      detalhe: `Não há ${individual ? 'atletas' : 'equipes'} inscritos em ${modalidadeNome} • ${categoria} • ${sexo}.`,
    });
  } else if (participantes.length === 1 && norm !== 'atletismo') {
    alertas.push({
      nivel: 'CRITICO',
      titulo: 'Inscrição única (N = 1)',
      detalhe: `Apenas "${participantes[0].sigla}" está inscrito(a). Não é possível gerar confrontos — defina W.O./campeão único ou remanejamento no Congresso Técnico.`,
    });
  }

  if (pendentes > 0) {
    alertas.push({
      nivel: 'ALERTA',
      titulo: `${pendentes} participante(s) com homologação pendente`,
      detalhe: 'Você pode gerar a tabela normalmente em modo livre, mas recomenda-se homologar todas as equipes na aba Homologação antes de congelar o chaveamento.',
    });
  }

  if (irregularidadeElenco > 0) {
    alertas.push({
      nivel: 'ALERTA',
      titulo: `${irregularidadeElenco} equipe(s) fora do limite de elenco (${minAtletas} a ${maxAtletas} atletas)`,
      detalhe: 'Verifique os cards abaixo para identificar equipes abaixo do mínimo ou acima do máximo permitido pelo regulamento.',
    });
  }

  if (semDocumentoTotal > 0) {
    alertas.push({
      nivel: 'INFO',
      titulo: `${semDocumentoTotal} estudante(s) sem RG/Certidão anexado`,
      detalhe: 'A conferência documental deverá ser concluída antes da entrada em quadra/pista.',
    });
  }

  const semaforo: 'OK' | 'ALERTA' | 'CRITICO' = alertas.some((a) => a.nivel === 'CRITICO')
    ? 'CRITICO'
    : alertas.some((a) => a.nivel === 'ALERTA')
    ? 'ALERTA'
    : 'OK';

  const rec = recomendarFormatoOficial(norm, participantes.length);

  return {
    modalidadeCodigo: norm,
    modalidadeNome,
    categoria,
    sexo,
    individual,
    semaforo,
    participantes,
    alertas,
    resumo: {
      totalParticipantes: participantes.length,
      validados,
      pendentes,
      irregularidadeElenco,
      semDocumento: semDocumentoTotal,
    },
    formatoRecomendado: rec.formato,
    descricaoFormatoRecomendado: rec.descricao,
  };
}

// ============================================================
// 2. TABELA DE BERGER OFICIAL (TODOS CONTRA TODOS BALANCEADO)
// ============================================================

/**
 * Algoritmo oficial da Tabela de Berger (padrão CBDE / CBF / FIDE).
 * Garante rodadas balanceadas onde nenhuma equipe joga duas vezes na mesma rodada
 * e alterna mando de quadra/mesa.
 */
export function gerarTabelaBerger<T>(participantes: T[]): { rodada: number; confrontos: [T, T][] }[] {
  if (participantes.length < 2) return [];
  const lista: (T | null)[] = [...participantes];
  if (lista.length % 2 !== 0) {
    lista.push(null); // Folga (BYE)
  }

  const n = lista.length;
  const totalRodadas = n - 1;
  const metade = n / 2;
  const rodadas: { rodada: number; confrontos: [T, T][] }[] = [];

  const rotacionaveis = lista.slice(1);
  const fixo = lista[0];

  for (let r = 0; r < totalRodadas; r++) {
    const atual = [fixo, ...rotacionaveis];
    const confrontos: [T, T][] = [];

    for (let i = 0; i < metade; i++) {
      const a = atual[i];
      const b = atual[n - 1 - i];
      if (a !== null && b !== null) {
        // Alterna mando de campo/brancas na mesa 0 conforme Berger
        if (i === 0 && r % 2 === 1) {
          confrontos.push([b, a]);
        } else {
          confrontos.push([a, b]);
        }
      }
    }

    rodadas.push({ rodada: r + 1, confrontos });

    // Rotação horária mantendo o índice 0 fixo
    const ultimo = rotacionaveis.pop()!;
    rotacionaveis.unshift(ultimo);
  }

  return rodadas;
}

// ============================================================
// 3. SORTEIO DE GRUPOS OFICIAL (SEPARANDO MESMA ESCOLA)
// ============================================================

export function sortearGruposOficiais(
  participantes: ParticipanteChaveamento[],
  opts: { seed: string; forcarGrupoUnico?: boolean }
): GrupoChaveamento[] {
  const n = participantes.length;
  if (n === 0) return [];

  const embaralhados = embaralharComSeed(participantes, opts.seed);

  let numGrupos = 1;
  if (!opts.forcarGrupoUnico) {
    if (n >= 6 && n <= 8) numGrupos = 2;
    else if (n >= 9 && n <= 10) numGrupos = 3;
    else if (n >= 11) numGrupos = 4;
  }

  if (numGrupos === 1) {
    return [{ nome: n === 2 ? 'Final Direta' : 'Grupo Único', participantes: embaralhados }];
  }

  const letras = ['Grupo A', 'Grupo B', 'Grupo C', 'Grupo D'];
  const grupos: GrupoChaveamento[] = Array.from({ length: numGrupos }, (_, idx) => ({
    nome: letras[idx] || `Grupo ${idx + 1}`,
    participantes: [],
  }));

  // Distribuição snake/balanceada evitando colocar mesma escola no mesmo grupo
  for (const part of embaralhados) {
    // Ordena grupos candidatos: 1º menor tamanho, 2º não conter a mesma escola
    const candidatos = [...grupos].sort((g1, g2) => {
      const g1TemEscola = g1.participantes.some((p) => p.escolaId === part.escolaId) ? 1 : 0;
      const g2TemEscola = g2.participantes.some((p) => p.escolaId === part.escolaId) ? 1 : 0;
      if (g1.participantes.length !== g2.participantes.length) {
        return g1.participantes.length - g2.participantes.length;
      }
      return g1TemEscola - g2TemEscola;
    });
    candidatos[0].participantes.push(part);
  }

  return grupos;
}

// ============================================================
// 4. GERADOR DE PARTIDAS (GRUPOS+MATA-MATA OU MATA-MATA DIRETO)
// ============================================================

export function gerarChaveamentoColetivoOuTenisMesa(params: {
  participantes: ParticipanteChaveamento[];
  modalidadeCodigo: string;
  modalidadeNome: string;
  categoria: string;
  sexo: string;
  formato: 'GRUPOS_MATA_MATA' | 'MATA_MATA' | 'BERGER_UNICO' | 'FINAL_DIRETA' | 'GRUPOS_TENIS_MESA';
  seed: string;
  dataEvento: string;
  horaInicio: string;
  intervaloMinutos: number;
  quadras: string[];
  numeroJogoInicial: number;
  incluirTerceiroLugar?: boolean;
}): {
  grupos: GrupoChaveamento[];
  partidas: PartidaGeradaPayload[];
} {
  const {
    participantes,
    modalidadeCodigo,
    modalidadeNome,
    categoria,
    sexo,
    formato,
    seed,
    dataEvento,
    horaInicio,
    intervaloMinutos,
    quadras,
    numeroJogoInicial,
    incluirTerceiroLugar = true,
  } = params;

  const locais = quadras.map((q) => q.trim()).filter(Boolean);
  if (locais.length === 0) locais.push('Quadra Principal');

  const partidas: PartidaGeradaPayload[] = [];
  let numJogo = numeroJogoInicial;
  let slotIndex = 0;

  const proximoSlot = () => {
    const rodadaSlot = Math.floor(slotIndex / locais.length);
    const local = locais[slotIndex % locais.length];
    const horario = somarMinutosHorario(horaInicio, rodadaSlot * intervaloMinutos);
    slotIndex++;
    return { horario, local };
  };

  // --- MODO A: FINAL DIRETA (2 participantes) ---
  if (formato === 'FINAL_DIRETA' || participantes.length === 2) {
    const emb = embaralharComSeed(participantes, seed);
    const { horario, local } = proximoSlot();
    partidas.push({
      numeroJogo: numJogo++,
      modalidadeCodigo,
      modalidadeNome,
      categoria,
      sexo,
      fase: 'FINAL',
      grupo: null,
      dataEvento,
      horario,
      local,
      escolaAId: emb[0].id,
      escolaANome: emb[0].nome,
      escolaASigla: emb[0].sigla,
      escolaBId: emb[1].id,
      escolaBNome: emb[1].nome,
      escolaBSigla: emb[1].sigla,
      observacao: 'Final Direta (2 participantes inscritos)',
    });
    return { grupos: [{ nome: 'Final Direta', participantes: emb }], partidas };
  }

  // --- MODO B: MATA-MATA DIRETO (Eliminatória Simples com BYEs oficiais) ---
  if (formato === 'MATA_MATA') {
    const emb = embaralharComSeed(participantes, seed);
    const n = emb.length;
    let potencia = 2;
    while (potencia < n) potencia *= 2;
    const totalByes = potencia - n;

    const faseInicial =
      potencia === 16 ? 'OITAVAS' : potencia === 8 ? 'QUARTAS' : potencia === 4 ? 'SEMIFINAL' : 'FINAL';

    // Os primeiros `totalByes` são cabeças de chave que avançam direto (BYE)
    const cabecasComBye = emb.slice(0, totalByes);
    const jogamPrimeiraFase = emb.slice(totalByes);

    const vencedoresSlots: { label: string; participante?: ParticipanteChaveamento }[] = [];

    // Cabeças que passaram direto por BYE
    cabecasComBye.forEach((p) => {
      vencedoresSlots.push({ label: p.sigla, participante: p });
    });

    // Confrontos reais da 1ª fase
    for (let i = 0; i < jogamPrimeiraFase.length; i += 2) {
      const a = jogamPrimeiraFase[i];
      const b = jogamPrimeiraFase[i + 1];
      if (!a || !b) continue;
      const { horario, local } = proximoSlot();
      const jNum = numJogo++;
      partidas.push({
        numeroJogo: jNum,
        modalidadeCodigo,
        modalidadeNome,
        categoria,
        sexo,
        fase: faseInicial,
        grupo: null,
        dataEvento,
        horario,
        local,
        escolaAId: a.id,
        escolaANome: a.nome,
        escolaASigla: a.sigla,
        escolaBId: b.id,
        escolaBNome: b.nome,
        escolaBSigla: b.sigla,
        observacao: `Eliminatória Direta — Jogo ${jNum}`,
      });
      vencedoresSlots.push({ label: `Vencedor J${jNum}` });
    }

    // Fases subsequentes até a Final
    const ordemFases: Record<string, string | null> = {
      OITAVAS: 'QUARTAS',
      QUARTAS: 'SEMIFINAL',
      SEMIFINAL: 'FINAL',
      FINAL: null,
    };

    let faseAtual = ordemFases[faseInicial];
    let slotsAtuais = vencedoresSlots;

    while (faseAtual && slotsAtuais.length >= 2) {
      const proximosSlots: { label: string; participante?: ParticipanteChaveamento }[] = [];
      const jogosSemifinal: number[] = [];

      for (let i = 0; i < slotsAtuais.length; i += 2) {
        const sA = slotsAtuais[i];
        const sB = slotsAtuais[i + 1];
        if (!sA || !sB) continue;
        const { horario, local } = proximoSlot();
        const jNum = numJogo++;

        if (faseAtual === 'SEMIFINAL') jogosSemifinal.push(jNum);

        partidas.push({
          numeroJogo: jNum,
          modalidadeCodigo,
          modalidadeNome,
          categoria,
          sexo,
          fase: faseAtual,
          grupo: null,
          dataEvento,
          horario,
          local,
          escolaAId: sA.participante ? sA.participante.id : `TBD_${sA.label}`,
          escolaANome: sA.participante ? sA.participante.nome : sA.label,
          escolaASigla: sA.participante ? sA.participante.sigla : sA.label,
          escolaBId: sB.participante ? sB.participante.id : `TBD_${sB.label}`,
          escolaBNome: sB.participante ? sB.participante.nome : sB.label,
          escolaBSigla: sB.participante ? sB.participante.sigla : sB.label,
          observacao: `${faseAtual} — ${sA.label} × ${sB.label}`,
        });
        proximosSlots.push({ label: `Vencedor J${jNum}` });
      }

      // Disputa de 3º lugar antes da Final
      if (faseAtual === 'SEMIFINAL' && incluirTerceiroLugar && jogosSemifinal.length === 2) {
        const { horario, local } = proximoSlot();
        partidas.push({
          numeroJogo: numJogo++,
          modalidadeCodigo,
          modalidadeNome,
          categoria,
          sexo,
          fase: 'TERCEIRO_LUGAR',
          grupo: null,
          dataEvento,
          horario,
          local,
          escolaAId: `TBD_PERDEDOR_J${jogosSemifinal[0]}`,
          escolaANome: `Perdedor J${jogosSemifinal[0]}`,
          escolaASigla: `Perd. J${jogosSemifinal[0]}`,
          escolaBId: `TBD_PERDEDOR_J${jogosSemifinal[1]}`,
          escolaBNome: `Perdedor J${jogosSemifinal[1]}`,
          escolaBSigla: `Perd. J${jogosSemifinal[1]}`,
          observacao: 'Disputa de 3º Lugar',
        });
      }

      slotsAtuais = proximosSlots;
      faseAtual = ordemFases[faseAtual];
    }

    return {
      grupos: [{ nome: `Chave Eliminatória (${n} participantes, ${totalByes} BYE)`, participantes: emb }],
      partidas,
    };
  }

  // --- MODO C: GRUPOS (BERGER) + MATA-MATA OFICIAL ---
  const forcarGrupoUnico = formato === 'BERGER_UNICO' || participantes.length <= 5;
  const grupos = sortearGruposOficiais(participantes, { seed, forcarGrupoUnico });

  // Gera rodadas de Berger intercalando grupos (Grupo A Rodada 1, Grupo B Rodada 1, ...)
  // para garantir descanso entre partidas de cada escola!
  const tabelasPorGrupo = grupos.map((g) => ({
    grupo: g.nome,
    rodadas: gerarTabelaBerger(g.participantes),
  }));
  const maxRodadas = Math.max(...tabelasPorGrupo.map((t) => t.rodadas.length), 0);

  for (let r = 0; r < maxRodadas; r++) {
    for (const tg of tabelasPorGrupo) {
      const rod = tg.rodadas[r];
      if (!rod) continue;
      for (const [a, b] of rod.confrontos) {
        const { horario, local } = proximoSlot();
        partidas.push({
          numeroJogo: numJogo++,
          modalidadeCodigo,
          modalidadeNome,
          categoria,
          sexo,
          fase: 'GRUPOS',
          grupo: tg.grupo,
          dataEvento,
          horario,
          local,
          escolaAId: a.id,
          escolaANome: a.nome,
          escolaASigla: a.sigla,
          escolaBId: b.id,
          escolaBNome: b.nome,
          escolaBSigla: b.sigla,
          observacao: `${tg.grupo} • ${rod.rodada}ª Rodada (Berger)`,
        });
      }
    }
  }

  // Cria fase eliminatória automática quando há 2+ grupos
  if (grupos.length === 2) {
    const slotSF1 = proximoSlot();
    const sf1Num = numJogo++;
    partidas.push({
      numeroJogo: sf1Num,
      modalidadeCodigo,
      modalidadeNome,
      categoria,
      sexo,
      fase: 'SEMIFINAL',
      grupo: null,
      dataEvento,
      horario: slotSF1.horario,
      local: slotSF1.local,
      escolaAId: 'TBD_1_Grupo A',
      escolaANome: '1º Colocado Grupo A',
      escolaASigla: '1º Grupo A',
      escolaBId: 'TBD_2_Grupo B',
      escolaBNome: '2º Colocado Grupo B',
      escolaBSigla: '2º Grupo B',
      observacao: 'Semifinal 1 (Cruzamento Oficial 1ºA × 2ºB)',
    });

    const slotSF2 = proximoSlot();
    const sf2Num = numJogo++;
    partidas.push({
      numeroJogo: sf2Num,
      modalidadeCodigo,
      modalidadeNome,
      categoria,
      sexo,
      fase: 'SEMIFINAL',
      grupo: null,
      dataEvento,
      horario: slotSF2.horario,
      local: slotSF2.local,
      escolaAId: 'TBD_1_Grupo B',
      escolaANome: '1º Colocado Grupo B',
      escolaASigla: '1º Grupo B',
      escolaBId: 'TBD_2_Grupo A',
      escolaBNome: '2º Colocado Grupo A',
      escolaBSigla: '2º Grupo A',
      observacao: 'Semifinal 2 (Cruzamento Oficial 1ºB × 2ºA)',
    });

    if (incluirTerceiroLugar) {
      const slot3 = proximoSlot();
      partidas.push({
        numeroJogo: numJogo++,
        modalidadeCodigo,
        modalidadeNome,
        categoria,
        sexo,
        fase: 'TERCEIRO_LUGAR',
        grupo: null,
        dataEvento,
        horario: slot3.horario,
        local: slot3.local,
        escolaAId: `TBD_PERDEDOR_J${sf1Num}`,
        escolaANome: `Perdedor Semifinal 1 (J${sf1Num})`,
        escolaASigla: `Perd. SF1`,
        escolaBId: `TBD_PERDEDOR_J${sf2Num}`,
        escolaBNome: `Perdedor Semifinal 2 (J${sf2Num})`,
        escolaBSigla: `Perd. SF2`,
        observacao: 'Disputa de 3º Lugar',
      });
    }

    const slotFin = proximoSlot();
    partidas.push({
      numeroJogo: numJogo++,
      modalidadeCodigo,
      modalidadeNome,
      categoria,
      sexo,
      fase: 'FINAL',
      grupo: null,
      dataEvento,
      horario: slotFin.horario,
      local: slotFin.local,
      escolaAId: `TBD_VENCEDOR_J${sf1Num}`,
      escolaANome: `Vencedor Semifinal 1 (J${sf1Num})`,
      escolaASigla: `Venc. SF1`,
      escolaBId: `TBD_VENCEDOR_J${sf2Num}`,
      escolaBNome: `Vencedor Semifinal 2 (J${sf2Num})`,
      escolaBSigla: `Venc. SF2`,
      observacao: 'Grande Final',
    });
  } else if (grupos.length >= 3) {
    // 3 ou 4 grupos → Semifinais (1ºA × 1ºB ou melhor 2º, etc.) + 3º Lugar + Final
    const slotSF1 = proximoSlot();
    const sf1Num = numJogo++;
    partidas.push({
      numeroJogo: sf1Num,
      modalidadeCodigo,
      modalidadeNome,
      categoria,
      sexo,
      fase: 'SEMIFINAL',
      grupo: null,
      dataEvento,
      horario: slotSF1.horario,
      local: slotSF1.local,
      escolaAId: 'TBD_1_Grupo A',
      escolaANome: '1º Colocado Grupo A',
      escolaASigla: '1º Grupo A',
      escolaBId: grupos.length === 4 ? 'TBD_1_Grupo C' : 'TBD_MELHOR_2',
      escolaBNome: grupos.length === 4 ? '1º Colocado Grupo C' : 'Melhor 2º Colocado (Índice Técnico)',
      escolaBSigla: grupos.length === 4 ? '1º Grupo C' : 'Melhor 2º',
      observacao: 'Semifinal 1',
    });

    const slotSF2 = proximoSlot();
    const sf2Num = numJogo++;
    partidas.push({
      numeroJogo: sf2Num,
      modalidadeCodigo,
      modalidadeNome,
      categoria,
      sexo,
      fase: 'SEMIFINAL',
      grupo: null,
      dataEvento,
      horario: slotSF2.horario,
      local: slotSF2.local,
      escolaAId: 'TBD_1_Grupo B',
      escolaANome: '1º Colocado Grupo B',
      escolaASigla: '1º Grupo B',
      escolaBId: grupos.length === 4 ? 'TBD_1_Grupo D' : 'TBD_1_Grupo C',
      escolaBNome: grupos.length === 4 ? '1º Colocado Grupo D' : '1º Colocado Grupo C',
      escolaBSigla: grupos.length === 4 ? '1º Grupo D' : '1º Grupo C',
      observacao: 'Semifinal 2',
    });

    if (incluirTerceiroLugar) {
      const slot3 = proximoSlot();
      partidas.push({
        numeroJogo: numJogo++,
        modalidadeCodigo,
        modalidadeNome,
        categoria,
        sexo,
        fase: 'TERCEIRO_LUGAR',
        grupo: null,
        dataEvento,
        horario: slot3.horario,
        local: slot3.local,
        escolaAId: `TBD_PERDEDOR_J${sf1Num}`,
        escolaANome: `Perdedor SF1 (J${sf1Num})`,
        escolaASigla: 'Perd. SF1',
        escolaBId: `TBD_PERDEDOR_J${sf2Num}`,
        escolaBNome: `Perdedor SF2 (J${sf2Num})`,
        escolaBSigla: 'Perd. SF2',
        observacao: 'Disputa de 3º Lugar',
      });
    }

    const slotFin = proximoSlot();
    partidas.push({
      numeroJogo: numJogo++,
      modalidadeCodigo,
      modalidadeNome,
      categoria,
      sexo,
      fase: 'FINAL',
      grupo: null,
      dataEvento,
      horario: slotFin.horario,
      local: slotFin.local,
      escolaAId: `TBD_VENCEDOR_J${sf1Num}`,
      escolaANome: `Vencedor SF1 (J${sf1Num})`,
      escolaASigla: 'Venc. SF1',
      escolaBId: `TBD_VENCEDOR_J${sf2Num}`,
      escolaBNome: `Vencedor SF2 (J${sf2Num})`,
      escolaBSigla: 'Venc. SF2',
      observacao: 'Grande Final',
    });
  }

  return { grupos, partidas };
}

// ============================================================
// 5. AVANÇO AUTOMÁTICO DE CLASSIFICADOS PARA O MATA-MATA
// ============================================================

export function calcularAtualizacoesAvancoMataMata(
  partidasCategoria: PartidaEventoItem[]
): { id: string; dados: Partial<PartidaEventoItem> }[] {
  const updates: { id: string; dados: Partial<PartidaEventoItem> }[] = [];
  const classificacoes = calcularClassificacaoPorChave(partidasCategoria);

  // Mapa de grupos encerrados: "Grupo A" -> [1º, 2º, ...]
  const classPorGrupo = new Map<string, typeof classificacoes[0]['linhas']>();
  const segundosColocados: (typeof classificacoes[0]['linhas'][0] & { aproveitamento: number })[] = [];

  for (const cl of classificacoes) {
    const jogosDoGrupo = partidasCategoria.filter((p) => p.fase === 'GRUPOS' && (p.grupo || 'Grupo Único') === cl.grupo);
    const todosEncerrados = jogosDoGrupo.length > 0 && jogosDoGrupo.every((p) => p.status === 'ENCERRADO' || p.status === 'WO');
    if (todosEncerrados) {
      classPorGrupo.set(cl.grupo, cl.linhas);
      if (cl.linhas[1]) {
        const s = cl.linhas[1];
        segundosColocados.push({
          ...s,
          aproveitamento: s.jogos > 0 ? s.pontos / (s.jogos * 3) : 0,
        });
      }
    }
  }

  segundosColocados.sort((a, b) => {
    if (b.aproveitamento !== a.aproveitamento) return b.aproveitamento - a.aproveitamento;
    if (b.saldo !== a.saldo) return b.saldo - a.saldo;
    return b.pro - a.pro;
  });
  const melhorSegundo = segundosColocados[0];

  // Mapa de jogos já encerrados por numeroJogo
  const porNumero = new Map<number, PartidaEventoItem>();
  partidasCategoria.forEach((p) => {
    if (p.numeroJogo) porNumero.set(p.numeroJogo, p);
  });

  const resolverSlot = (tbdId: string): { id: string; nome: string; sigla: string } | null => {
    if (!tbdId || !tbdId.startsWith('TBD_')) return null;

    // TBD_1_Grupo A ou TBD_2_Grupo B
    const mGrupo = tbdId.match(/^TBD_(\d+)_(.+)$/);
    if (mGrupo) {
      const pos = parseInt(mGrupo[1], 10) - 1;
      const nomeGrupo = mGrupo[2];
      const linhas = classPorGrupo.get(nomeGrupo);
      if (linhas && linhas[pos]) {
        return {
          id: linhas[pos].escolaId,
          nome: linhas[pos].escolaNome,
          sigla: linhas[pos].escolaSigla,
        };
      }
    }

    if (tbdId === 'TBD_MELHOR_2' && melhorSegundo) {
      return {
        id: melhorSegundo.escolaId,
        nome: melhorSegundo.escolaNome,
        sigla: melhorSegundo.escolaSigla,
      };
    }

    // TBD_VENCEDOR_J12 ou TBD_PERDEDOR_J12
    const mJogo = tbdId.match(/^TBD_(VENCEDOR|PERDEDOR)_J(\d+)$/);
    if (mJogo) {
      const tipo = mJogo[1];
      const num = parseInt(mJogo[2], 10);
      const jogo = porNumero.get(num);
      if (jogo && (jogo.status === 'ENCERRADO' || jogo.status === 'WO')) {
        const venceuA =
          jogo.vencedorEscolaId === jogo.escolaAId ||
          (!jogo.vencedorEscolaId && jogo.placarA > jogo.placarB);
        const venceuB =
          jogo.vencedorEscolaId === jogo.escolaBId ||
          (!jogo.vencedorEscolaId && jogo.placarB > jogo.placarA);
        if (!venceuA && !venceuB) return null;

        const lado =
          (tipo === 'VENCEDOR' && venceuA) || (tipo === 'PERDEDOR' && venceuB) ? 'A' : 'B';
        return lado === 'A'
          ? { id: jogo.escolaAId, nome: jogo.escolaANome, sigla: jogo.escolaASigla || jogo.escolaANome }
          : { id: jogo.escolaBId, nome: jogo.escolaBNome, sigla: jogo.escolaBSigla || jogo.escolaBNome };
      }
    }

    return null;
  };

  for (const p of partidasCategoria) {
    if (p.fase === 'GRUPOS') continue;
    const resA = resolverSlot(p.escolaAId);
    const resB = resolverSlot(p.escolaBId);
    if (resA || resB) {
      updates.push({
        id: p.id,
        dados: {
          ...(resA ? { escolaAId: resA.id, escolaANome: resA.nome, escolaASigla: resA.sigla } : {}),
          ...(resB ? { escolaBId: resB.id, escolaBNome: resB.nome, escolaBSigla: resB.sigla } : {}),
        },
      });
    }
  }

  return updates;
}

// ============================================================
// 6. ATLETISMO (CBAt) — BALIZAMENTO EM SÉRIES E RAIAS
// ============================================================

export function gerarBalizamentoAtletismo(params: {
  participantes: ParticipanteChaveamento[];
  seed: string;
  maxRaiasPorSerie?: number;
}): ProvaAtletismoBalizamento[] {
  const maxRaias = params.maxRaiasPorSerie || 8;
  const porProva = new Map<string, ParticipanteChaveamento[]>();

  for (const p of params.participantes) {
    const provas = p.provas && p.provas.length > 0 ? p.provas : ['Prova Geral (não especificada)'];
    for (const prova of provas) {
      if (!porProva.has(prova)) porProva.set(prova, []);
      porProva.get(prova)!.push(p);
    }
  }

  const resultado: ProvaAtletismoBalizamento[] = [];
  const provasOrdenadas = Array.from(porProva.keys()).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  for (const prova of provasOrdenadas) {
    const inscritos = embaralharComSeed(porProva.get(prova)!, `${params.seed}__${prova}`);
    const numSeries = Math.max(1, Math.ceil(inscritos.length / maxRaias));
    const seriesBuckets: ParticipanteChaveamento[][] = Array.from({ length: numSeries }, () => []);

    // Distribui balanceado tentando separar atletas da mesma escola em séries diferentes
    for (const atl of inscritos) {
      const idxOrdenados = seriesBuckets
        .map((b, idx) => ({
          idx,
          tam: b.length,
          temEscola: b.some((x) => x.escolaId === atl.escolaId) ? 1 : 0,
        }))
        .sort((a, b) => (a.tam !== b.tam ? a.tam - b.tam : a.temEscola - b.temEscola));
      seriesBuckets[idxOrdenados[0].idx].push(atl);
    }

    const series: SerieAtletismo[] = seriesBuckets.map((bucket, sIdx) => ({
      numero: sIdx + 1,
      nome: numSeries === 1 ? 'Final Direta (Série Única)' : `Série ${sIdx + 1}`,
      raias: bucket.map((atl, rIdx) => ({
        raia: rIdx + 1,
        atletaId: atl.id,
        atletaNome: atl.nome,
        escolaId: atl.escolaId,
        escolaSigla: atl.escolaSigla,
        marca: '',
        posicao: null,
      })),
    }));

    resultado.push({ prova, series });
  }

  return resultado;
}

// ============================================================
// 7. XADREZ (FIDE / CBX) — SISTEMA SUÍÇO & BERGER + BUCHHOLZ
// ============================================================

export function calcularClassificacaoXadrez(estrutura: EstruturaXadrez): LinhaClassificacaoXadrez[] {
  const mapa = new Map<string, LinhaClassificacaoXadrez>();
  const oponentes = new Map<string, string[]>();

  for (const j of estrutura.jogadores) {
    mapa.set(j.id, {
      id: j.id,
      nome: j.nome,
      sigla: j.escolaSigla,
      jogos: 0,
      vitorias: 0,
      empates: 0,
      derrotas: 0,
      pontos: 0,
      buchholz: 0,
    });
    oponentes.set(j.id, []);
  }

  for (const rod of estrutura.rodadas) {
    for (const m of rod.mesas) {
      if (m.resultado === 'PENDENTE') continue;
      const rowB = mapa.get(m.brancasId);
      const rowP = m.pretasId !== 'BYE' ? mapa.get(m.pretasId) : undefined;

      if (m.resultado === 'BYE' && rowB) {
        rowB.jogos += 1;
        rowB.vitorias += 1;
        rowB.pontos += 1;
        continue;
      }

      if (rowB && rowP) {
        rowB.jogos += 1;
        rowP.jogos += 1;
        oponentes.get(rowB.id)!.push(rowP.id);
        oponentes.get(rowP.id)!.push(rowB.id);

        if (m.resultado === '1-0') {
          rowB.vitorias += 1;
          rowB.pontos += 1;
          rowP.derrotas += 1;
        } else if (m.resultado === '0-1') {
          rowP.vitorias += 1;
          rowP.pontos += 1;
          rowB.derrotas += 1;
        } else if (m.resultado === '0.5-0.5') {
          rowB.empates += 1;
          rowP.empates += 1;
          rowB.pontos += 0.5;
          rowP.pontos += 0.5;
        }
      }
    }
  }

  // Cálculo oficial de Buchholz (soma dos pontos de todos os adversários enfrentados)
  for (const row of mapa.values()) {
    const ops = oponentes.get(row.id) || [];
    row.buchholz = ops.reduce((acc, opId) => acc + (mapa.get(opId)?.pontos || 0), 0);
  }

  return Array.from(mapa.values()).sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
    if (b.vitorias !== a.vitorias) return b.vitorias - a.vitorias;
    return a.nome.localeCompare(b.nome, 'pt-BR');
  });
}

export function gerarTorneioXadrezInicial(params: {
  participantes: ParticipanteChaveamento[];
  seed: string;
  totalRodadas?: number;
}): EstruturaXadrez {
  const jogadores = embaralharComSeed(params.participantes, params.seed);

  // Até 6 enxadristas → Berger completo (todos contra todos)
  if (jogadores.length <= 6) {
    const berger = gerarTabelaBerger(jogadores);
    const rodadas: RodadaXadrez[] = berger.map((r) => ({
      numero: r.rodada,
      mesas: r.confrontos.map(([b, p], idx) => ({
        mesa: idx + 1,
        brancasId: b.id,
        brancasNome: b.nome,
        brancasSigla: b.escolaSigla,
        pretasId: p.id,
        pretasNome: p.nome,
        pretasSigla: p.escolaSigla,
        resultado: 'PENDENTE',
      })),
    }));
    return {
      sistema: 'BERGER',
      totalRodadasPrevistas: rodadas.length,
      jogadores,
      rodadas,
    };
  }

  // 7+ enxadristas → Sistema Suíço (gera Rodada 1: metade superior × metade inferior)
  const totalRodadasPrevistas = params.totalRodadas || Math.min(5, Math.max(3, Math.ceil(Math.log2(jogadores.length)) + 1));
  const mesas: MesaXadrez[] = [];
  const metade = Math.floor(jogadores.length / 2);

  for (let i = 0; i < metade; i++) {
    const a = jogadores[i];
    const b = jogadores[i + metade];
    mesas.push({
      mesa: i + 1,
      brancasId: i % 2 === 0 ? a.id : b.id,
      brancasNome: i % 2 === 0 ? a.nome : b.nome,
      brancasSigla: i % 2 === 0 ? a.escolaSigla : b.escolaSigla,
      pretasId: i % 2 === 0 ? b.id : a.id,
      pretasNome: i % 2 === 0 ? b.nome : a.nome,
      pretasSigla: i % 2 === 0 ? b.escolaSigla : a.escolaSigla,
      resultado: 'PENDENTE',
    });
  }

  if (jogadores.length % 2 !== 0) {
    const ultimo = jogadores[jogadores.length - 1];
    mesas.push({
      mesa: mesas.length + 1,
      brancasId: ultimo.id,
      brancasNome: ultimo.nome,
      brancasSigla: ultimo.escolaSigla,
      pretasId: 'BYE',
      pretasNome: 'BYE (Folga — 1 ponto)',
      pretasSigla: 'BYE',
      resultado: 'BYE',
    });
  }

  return {
    sistema: 'SUICO',
    totalRodadasPrevistas,
    jogadores,
    rodadas: [{ numero: 1, mesas }],
  };
}

export function gerarProximaRodadaSuica(estrutura: EstruturaXadrez): EstruturaXadrez {
  const classificacao = calcularClassificacaoXadrez(estrutura);
  const jogMap = new Map(estrutura.jogadores.map((j) => [j.id, j]));

  // Histórico de confrontos já realizados e quem já recebeu BYE
  const jaJogaram = new Set<string>();
  const recebeuBye = new Set<string>();
  const saldoCor = new Map<string, number>(); // +1 brancas, -1 pretas

  for (const r of estrutura.rodadas) {
    for (const m of r.mesas) {
      if (m.pretasId === 'BYE') {
        recebeuBye.add(m.brancasId);
      } else {
        jaJogaram.add(`${m.brancasId}__${m.pretasId}`);
        jaJogaram.add(`${m.pretasId}__${m.brancasId}`);
        saldoCor.set(m.brancasId, (saldoCor.get(m.brancasId) || 0) + 1);
        saldoCor.set(m.pretasId, (saldoCor.get(m.pretasId) || 0) - 1);
      }
    }
  }

  const livres = classificacao.map((c) => jogMap.get(c.id)!).filter(Boolean);
  const mesas: MesaXadrez[] = [];

  // Se ímpar, atribui BYE ao jogador de menor pontuação que ainda não recebeu BYE
  if (livres.length % 2 !== 0) {
    let idxBye = livres.length - 1;
    for (let i = livres.length - 1; i >= 0; i--) {
      if (!recebeuBye.has(livres[i].id)) {
        idxBye = i;
        break;
      }
    }
    const [jogadorBye] = livres.splice(idxBye, 1);
    mesas.push({
      mesa: 999,
      brancasId: jogadorBye.id,
      brancasNome: jogadorBye.nome,
      brancasSigla: jogadorBye.escolaSigla,
      pretasId: 'BYE',
      pretasNome: 'BYE (Folga — 1 ponto)',
      pretasSigla: 'BYE',
      resultado: 'BYE',
    });
  }

  const emparelhados: MesaXadrez[] = [];
  while (livres.length >= 2) {
    const j1 = livres.shift()!;
    let idxOponente = livres.findIndex((j2) => !jaJogaram.has(`${j1.id}__${j2.id}`));
    if (idxOponente === -1) idxOponente = 0; // fallback se todos já se enfrentaram
    const [j2] = livres.splice(idxOponente, 1);

    const cor1 = saldoCor.get(j1.id) || 0;
    const cor2 = saldoCor.get(j2.id) || 0;
    const j1Brancas = cor1 <= cor2;

    emparelhados.push({
      mesa: emparelhados.length + 1,
      brancasId: j1Brancas ? j1.id : j2.id,
      brancasNome: j1Brancas ? j1.nome : j2.nome,
      brancasSigla: j1Brancas ? j1.escolaSigla : j2.escolaSigla,
      pretasId: j1Brancas ? j2.id : j1.id,
      pretasNome: j1Brancas ? j2.nome : j1.nome,
      pretasSigla: j1Brancas ? j2.escolaSigla : j1.escolaSigla,
      resultado: 'PENDENTE',
    });
  }

  // Coloca BYE por último na numeração das mesas
  const byeMesas = mesas.map((m, idx) => ({ ...m, mesa: emparelhados.length + idx + 1 }));

  return {
    ...estrutura,
    rodadas: [
      ...estrutura.rodadas,
      {
        numero: estrutura.rodadas.length + 1,
        mesas: [...emparelhados, ...byeMesas],
      },
    ],
  };
}
