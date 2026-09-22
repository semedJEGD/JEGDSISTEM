import { Atleta, Escola, RegistroControle } from '@/types/jegd';

export const STORAGE_KEYS_LOGISTICA = {
  REGISTROS_CONTROLE: 'jegds_registros_controle_v6',
  ATLETAS: 'jegds_atletas_v6',
  ESCOLAS: 'jegds_escolas_v6'
};

function isClient(): boolean {
  return typeof window !== 'undefined';
}

function getStoredAtletas(): Atleta[] {
  if (!isClient()) return [];
  const data = localStorage.getItem(STORAGE_KEYS_LOGISTICA.ATLETAS);
  return data ? JSON.parse(data) : [];
}

function saveStoredAtleta(atleta: Atleta): void {
  if (!isClient()) return;
  const list = getStoredAtletas();
  const idx = list.findIndex(a => a.id === atleta.id);
  if (idx >= 0) {
    list[idx] = atleta;
  } else {
    list.push(atleta);
  }
  localStorage.setItem(STORAGE_KEYS_LOGISTICA.ATLETAS, JSON.stringify(list));
}

function getStoredEscolas(): Escola[] {
  if (!isClient()) return [];
  const data = localStorage.getItem(STORAGE_KEYS_LOGISTICA.ESCOLAS);
  return data ? JSON.parse(data) : [];
}

export class LogisticaStorage {
  /**
   * Obtém ou gera o token único de crachá para um atleta (ex: CR-ATL-01-sx2zbn)
   */
  public static gerarOuObterTokenCracha(atletaId: string): string {
    if (!isClient()) return `CR-${atletaId.toUpperCase()}`;
    const atletas = getStoredAtletas();
    const atleta = atletas.find(a => a.id === atletaId);
    if (!atleta) return `CR-${atletaId.toUpperCase()}`;

    if (atleta.crachaToken && atleta.crachaToken.trim() !== '') {
      return atleta.crachaToken;
    }

    if (atleta.matricula && atleta.matricula.trim() !== '') {
      atleta.crachaToken = atleta.matricula;
      saveStoredAtleta(atleta);
      return atleta.crachaToken;
    }

    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const token = `CR-${atleta.id.toUpperCase()}-${randomSuffix}`;
    atleta.crachaToken = token;
    saveStoredAtleta(atleta);
    return token;
  }

  /**
   * Busca atleta por Token de Crachá, ID, Matrícula, Documento ou Nome
   */
  public static getAtletaByCrachaToken(tokenOrQuery: string): Atleta | undefined {
    if (!tokenOrQuery) return undefined;
    const query = tokenOrQuery.trim().toLowerCase();
    const atletas = getStoredAtletas();

    // 1. Busca exata por crachaToken
    const porToken = atletas.find(a => a.crachaToken && a.crachaToken.toLowerCase() === query);
    if (porToken) return porToken;

    // 2. Se for JSON colado de QR Code
    try {
      if (query.startsWith('{') && query.endsWith('}')) {
        const parsed = JSON.parse(query);
        if (parsed.token) {
          const porParsedToken = atletas.find(a => a.crachaToken && a.crachaToken.toLowerCase() === parsed.token.toLowerCase());
          if (porParsedToken) return porParsedToken;
        }
        if (parsed.id) {
          const porParsedId = atletas.find(a => a.id.toLowerCase() === parsed.id.toLowerCase());
          if (porParsedId) return porParsedId;
        }
      }
    } catch {}

    // 3. Busca por ID exato
    const porId = atletas.find(a => a.id.toLowerCase() === query);
    if (porId) return porId;

    // 4. Busca por matrícula ou documento
    const porMatricula = atletas.find(a => a.matricula && a.matricula.toLowerCase() === query);
    if (porMatricula) return porMatricula;

    const numLimpo = query.replace(/\D/g, '');
    if (numLimpo.length >= 4) {
      const porDoc = atletas.find(a => a.documentoNumero && a.documentoNumero.replace(/\D/g, '') === numLimpo);
      if (porDoc) return porDoc;
    }

    // 5. Busca por nome parcial
    return atletas.find(a => a.nomeCompleto.toLowerCase().includes(query));
  }

  /**
   * Retorna os registros de controle logístico (filtrado por atletaId ou todos)
   */
  public static getRegistrosControle(atletaId?: string): RegistroControle[] {
    if (!isClient()) return [];
    const data = localStorage.getItem(STORAGE_KEYS_LOGISTICA.REGISTROS_CONTROLE);
    const list: RegistroControle[] = data ? JSON.parse(data) : [];
    if (atletaId) {
      return list
        .filter(r => r.atletaId === atletaId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Salva um novo registro de controle logístico
   */
  public static saveRegistroControle(registro: RegistroControle): void {
    if (!isClient()) return;
    const list = this.getRegistrosControle();
    list.unshift(registro);
    localStorage.setItem(STORAGE_KEYS_LOGISTICA.REGISTROS_CONTROLE, JSON.stringify(list));
  }

  /**
   * Remove um registro de controle logístico
   */
  public static deleteRegistroControle(id: string): void {
    if (!isClient()) return;
    const list = this.getRegistrosControle().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEYS_LOGISTICA.REGISTROS_CONTROLE, JSON.stringify(list));
  }

  /**
   * Limpa histórico de registros de controle
   */
  public static clearRegistrosControle(): void {
    if (!isClient()) return;
    localStorage.setItem(STORAGE_KEYS_LOGISTICA.REGISTROS_CONTROLE, JSON.stringify([]));
  }

  /**
   * Relatório Agregado de Logística por Escola
   */
  public static getRelatorioLogistico(): {
    totaisGerais: {
      totalAtletas: number;
      credenciados: number;
      agua: number;
      lanche: number;
      transporteIda: number;
      transporteVolta: number;
      elegibilidadeQuadra: number;
    };
    porEscola: {
      escola: Escola;
      totalAtletas: number;
      credenciados: number;
      agua: number;
      lanche: number;
      transporteIda: number;
      transporteVolta: number;
      elegibilidadeQuadra: number;
      pendenteAgua: number;
      pendenteLanche: number;
    }[];
  } {
    const escolas = getStoredEscolas();
    const atletas = getStoredAtletas();
    const registros = this.getRegistrosControle();

    // Contadores únicos por atleta para cada tipo
    const porEscola = escolas.map(esc => {
      const atletasEsc = atletas.filter(a => a.escolaId === esc.id);
      const atletaIdsEsc = new Set(atletasEsc.map(a => a.id));

      const registrosEsc = registros.filter(r => atletaIdsEsc.has(r.atletaId));

      const atletasCredenciados = new Set(registrosEsc.filter(r => r.tipo === 'CREDENCIAMENTO').map(r => r.atletaId)).size;
      const atletasAgua = new Set(registrosEsc.filter(r => r.tipo === 'AGUA').map(r => r.atletaId)).size;
      const atletasLanche = new Set(registrosEsc.filter(r => r.tipo === 'LANCHE').map(r => r.atletaId)).size;
      const atletasIda = new Set(registrosEsc.filter(r => r.tipo === 'TRANSPORTE_IDA').map(r => r.atletaId)).size;
      const atletasVolta = new Set(registrosEsc.filter(r => r.tipo === 'TRANSPORTE_VOLTA').map(r => r.atletaId)).size;
      const atletasElegibilidade = new Set(registrosEsc.filter(r => r.tipo === 'ELEGIBILIDADE').map(r => r.atletaId)).size;

      return {
        escola: esc,
        totalAtletas: atletasEsc.length,
        credenciados: atletasCredenciados,
        agua: atletasAgua,
        lanche: atletasLanche,
        transporteIda: atletasIda,
        transporteVolta: atletasVolta,
        elegibilidadeQuadra: atletasElegibilidade,
        pendenteAgua: Math.max(0, atletasEsc.length - atletasAgua),
        pendenteLanche: Math.max(0, atletasEsc.length - atletasLanche)
      };
    });

    const totaisGerais = {
      totalAtletas: atletas.length,
      credenciados: new Set(registros.filter(r => r.tipo === 'CREDENCIAMENTO').map(r => r.atletaId)).size,
      agua: new Set(registros.filter(r => r.tipo === 'AGUA').map(r => r.atletaId)).size,
      lanche: new Set(registros.filter(r => r.tipo === 'LANCHE').map(r => r.atletaId)).size,
      transporteIda: new Set(registros.filter(r => r.tipo === 'TRANSPORTE_IDA').map(r => r.atletaId)).size,
      transporteVolta: new Set(registros.filter(r => r.tipo === 'TRANSPORTE_VOLTA').map(r => r.atletaId)).size,
      elegibilidadeQuadra: new Set(registros.filter(r => r.tipo === 'ELEGIBILIDADE').map(r => r.atletaId)).size
    };

    return {
      totaisGerais,
      porEscola
    };
  }
}
