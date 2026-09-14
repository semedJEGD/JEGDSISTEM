import {
  Escola,
  Atleta,
  MembroComissao,
  ModalidadeConfig,
  InscricaoEquipe,
  ComunicadoAviso,
  CategoriaIdade,
  ModalidadeCodigo,
  Genero,
  Usuario,
  RegistroControle,
  TipoRegistroControle
} from '@/types/jegd';
import { JegdsRulesService } from '@/services/jegds-rules';
import { LogisticaStorage } from './storage/logistica-storage';

export {
  MODALIDADES_OFICIAIS_JEGDS,
  ESCOLAS_GONCALVES_DIAS,
  COMUNICADOS_JEGDS,
  COORDENADORES_OFICIAIS_SEMED
} from './storage/initial-data';
import {
  MODALIDADES_OFICIAIS_JEGDS,
  ESCOLAS_GONCALVES_DIAS,
  COMUNICADOS_JEGDS,
  COORDENADORES_OFICIAIS_SEMED
} from './storage/initial-data';

const STORAGE_KEYS = {
  ESCOLAS: 'jegds_escolas_v5',
  ATLETAS: 'jegds_atletas_v5',
  COMISSAO: 'jegds_comissao_v5',
  INSCRICOES: 'jegds_inscricoes_v5',
  MODALIDADES: 'jegds_modalidades_v5',
  COMUNICADOS: 'jegds_comunicados_v5',
  USUARIOS: 'jegds_usuarios_v5',
  REGISTROS_CONTROLE: 'jegds_registros_controle_v5',
  CURRENT_AUTH_ESCOLA: 'jegds_current_escola_auth',
  CURRENT_AUTH_USER: 'jegds_current_user_auth',
  COMITE_AUTH: 'jegds_comite_auth'
};

export class JegdStorage {
  private static isClient(): boolean {
    return typeof window !== 'undefined';
  }

  public static init(): void {
    if (!this.isClient()) return;

    if (!localStorage.getItem(STORAGE_KEYS.ESCOLAS)) {
      localStorage.setItem(STORAGE_KEYS.ESCOLAS, JSON.stringify(ESCOLAS_GONCALVES_DIAS));
    }

    if (!localStorage.getItem(STORAGE_KEYS.MODALIDADES)) {
      localStorage.setItem(STORAGE_KEYS.MODALIDADES, JSON.stringify(MODALIDADES_OFICIAIS_JEGDS));
    }

    if (!localStorage.getItem(STORAGE_KEYS.COMUNICADOS)) {
      localStorage.setItem(STORAGE_KEYS.COMUNICADOS, JSON.stringify(COMUNICADOS_JEGDS));
    }

    if (!localStorage.getItem(STORAGE_KEYS.USUARIOS)) {
      localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(COORDENADORES_OFICIAIS_SEMED));
    }

    // Inicialização sem mockups (zerado para uso real)
    if (!localStorage.getItem(STORAGE_KEYS.ATLETAS)) {
      localStorage.setItem(STORAGE_KEYS.ATLETAS, JSON.stringify([]));
    }

    if (!localStorage.getItem(STORAGE_KEYS.INSCRICOES)) {
      localStorage.setItem(STORAGE_KEYS.INSCRICOES, JSON.stringify([]));
    }

    if (!localStorage.getItem(STORAGE_KEYS.COMISSAO)) {
      localStorage.setItem(STORAGE_KEYS.COMISSAO, JSON.stringify([]));
    }

    if (!localStorage.getItem(STORAGE_KEYS.REGISTROS_CONTROLE)) {
      localStorage.setItem(STORAGE_KEYS.REGISTROS_CONTROLE, JSON.stringify([]));
    }
  }

  public static getEscolas(): Escola[] {
    if (!this.isClient()) return ESCOLAS_GONCALVES_DIAS;
    this.init();
    const data = localStorage.getItem(STORAGE_KEYS.ESCOLAS);
    return data ? JSON.parse(data) : ESCOLAS_GONCALVES_DIAS;
  }

  public static getEscolaById(id: string): Escola | undefined {
    return this.getEscolas().find(e => e.id === id);
  }

  public static saveEscola(escola: Escola): void {
    if (!this.isClient()) return;
    const list = this.getEscolas();
    const idx = list.findIndex(e => e.id === escola.id);
    if (idx >= 0) list[idx] = escola;
    else list.push(escola);
    localStorage.setItem(STORAGE_KEYS.ESCOLAS, JSON.stringify(list));
  }

  public static setCurrentEscola(escola: Escola | null): void {
    if (!this.isClient()) return;
    if (escola) localStorage.setItem(STORAGE_KEYS.CURRENT_AUTH_ESCOLA, JSON.stringify(escola));
    else localStorage.removeItem(STORAGE_KEYS.CURRENT_AUTH_ESCOLA);
  }

  public static getCurrentEscola(): Escola | null {
    if (!this.isClient()) return null;
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_AUTH_ESCOLA);
    return data ? JSON.parse(data) : null;
  }

  public static setComiteAuth(isAuth: boolean): void {
    if (!this.isClient()) return;
    if (isAuth) localStorage.setItem(STORAGE_KEYS.COMITE_AUTH, 'true');
    else localStorage.removeItem(STORAGE_KEYS.COMITE_AUTH);
  }

  public static isComiteAuth(): boolean {
    if (!this.isClient()) return false;
    return localStorage.getItem(STORAGE_KEYS.COMITE_AUTH) === 'true';
  }

  public static setAdminAuth(isAuth: boolean): void {
    this.setComiteAuth(isAuth);
  }

  public static isAdminAuth(): boolean {
    return this.isComiteAuth();
  }

  public static getModalidades(): ModalidadeConfig[] {
    if (!this.isClient()) return MODALIDADES_OFICIAIS_JEGDS;
    this.init();
    const data = localStorage.getItem(STORAGE_KEYS.MODALIDADES);
    return data ? JSON.parse(data) : MODALIDADES_OFICIAIS_JEGDS;
  }

  public static getAtletas(escolaId?: string): Atleta[] {
    if (!this.isClient()) return [];
    this.init();
    const data = localStorage.getItem(STORAGE_KEYS.ATLETAS);
    const list: Atleta[] = data ? JSON.parse(data) : [];
    if (escolaId) return list.filter(a => a.escolaId === escolaId);
    return list;
  }

  public static getAtletaById(id: string): Atleta | undefined {
    return this.getAtletas().find(a => a.id === id);
  }

  public static saveAtleta(atleta: Atleta): void {
    if (!this.isClient()) return;
    const list = this.getAtletas();
    const idx = list.findIndex(a => a.id === atleta.id);
    if (idx >= 0) list[idx] = atleta;
    else list.unshift(atleta);
    localStorage.setItem(STORAGE_KEYS.ATLETAS, JSON.stringify(list));
  }

  public static deleteAtleta(id: string): void {
    if (!this.isClient()) return;
    const list = this.getAtletas().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ATLETAS, JSON.stringify(list));

    let inscricoes = this.getInscricoes();
    inscricoes = inscricoes.map(insc => {
      if (insc.atletaIds.includes(id)) {
        const newIds = insc.atletaIds.filter(aId => aId !== id);
        const newProvas = { ...(insc.provasPorAtleta || {}) };
        delete newProvas[id];
        return {
          ...insc,
          atletaIds: newIds,
          provasPorAtleta: newProvas,
          updatedAt: new Date().toISOString()
        };
      }
      return insc;
    }).filter(insc => insc.atletaIds.length > 0);

    localStorage.setItem(STORAGE_KEYS.INSCRICOES, JSON.stringify(inscricoes));
  }

  // COMISSAO
  public static getComissao(escolaId?: string): MembroComissao[] {
    if (!this.isClient()) return [];
    this.init();
    const data = localStorage.getItem(STORAGE_KEYS.COMISSAO);
    const list: MembroComissao[] = data ? JSON.parse(data) : [];
    if (escolaId) return list.filter(c => c.escolaId === escolaId);
    return list;
  }

  public static saveComissao(membro: MembroComissao): void {
    if (!this.isClient()) return;
    const list = this.getComissao();
    const idx = list.findIndex(c => c.id === membro.id);
    if (idx >= 0) list[idx] = membro;
    else list.unshift(membro);
    localStorage.setItem(STORAGE_KEYS.COMISSAO, JSON.stringify(list));
  }

  public static deleteComissao(id: string): void {
    if (!this.isClient()) return;
    const list = this.getComissao().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.COMISSAO, JSON.stringify(list));
  }

  // Alias para cálculo de categoria
  public static calcularCategoria(dataNascimento: string | Date) {
    return JegdsRulesService.calcularCategoria(dataNascimento);
  }

  public static getInscricoes(escolaId?: string): InscricaoEquipe[] {
    if (!this.isClient()) return [];
    this.init();
    const data = localStorage.getItem(STORAGE_KEYS.INSCRICOES);
    const list: InscricaoEquipe[] = data ? JSON.parse(data) : [];
    if (escolaId) return list.filter(i => i.escolaId === escolaId);
    return list;
  }

  public static saveInscricao(insc: InscricaoEquipe): void {
    if (!this.isClient()) return;
    const list = this.getInscricoes();
    const idx = list.findIndex(i => i.id === insc.id);
    if (idx >= 0) list[idx] = { ...insc, updatedAt: new Date().toISOString() };
    else list.unshift({ ...insc, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEYS.INSCRICOES, JSON.stringify(list));
  }

  public static syncAtletaComEquipes(escolaId: string, atleta: Atleta): void {
    if (!this.isClient()) return;
    const cat = atleta.categoriaCalculada || JegdsRulesService.calcularCategoria(atleta.dataNascimento).categoria;
    if (!cat) return;

    const modalidadesConfig = this.getModalidades();
    let todasInscricoes = this.getInscricoes();

    // 1. Primeiro removemos o atleta de quaisquer equipes que ele não esteja mais vinculado
    const modCodigosAtuais = atleta.modalidadesInscritas?.map(m => m.modalidadeCodigo) || [];
    
    todasInscricoes = todasInscricoes.map(insc => {
      if (insc.escolaId === escolaId) {
        if (!modCodigosAtuais.includes(insc.modalidadeCodigo) || insc.categoria !== cat || insc.sexo !== atleta.sexo) {
          // Remove o atleta se ele estava nessa equipe
          if (insc.atletaIds.includes(atleta.id)) {
            const newAtletaIds = insc.atletaIds.filter(id => id !== atleta.id);
            const newProvas = { ...(insc.provasPorAtleta || {}) };
            delete newProvas[atleta.id];
            return {
              ...insc,
              atletaIds: newAtletaIds,
              provasPorAtleta: newProvas,
              updatedAt: new Date().toISOString()
            };
          }
        }
      }
      return insc;
    });

    // 2. Agora adiciona/atualiza nas equipes vinculadas
    atleta.modalidadesInscritas?.forEach(modInsc => {
      const modObj = modalidadesConfig.find(m => m.codigo === modInsc.modalidadeCodigo);
      if (!modObj) return;

      const idx = todasInscricoes.findIndex(
        i => i.escolaId === escolaId && i.modalidadeCodigo === modInsc.modalidadeCodigo && i.categoria === cat && i.sexo === atleta.sexo
      );

      if (idx >= 0) {
        const equipeExistente = todasInscricoes[idx];
        const atletaIds = equipeExistente.atletaIds.includes(atleta.id)
          ? equipeExistente.atletaIds
          : [...equipeExistente.atletaIds, atleta.id];

        const provasPorAtleta = {
          ...(equipeExistente.provasPorAtleta || {}),
          ...(modInsc.provas ? { [atleta.id]: modInsc.provas } : {})
        };

        todasInscricoes[idx] = {
          ...equipeExistente,
          atletaIds,
          provasPorAtleta: modInsc.modalidadeCodigo === 'atletismo' ? provasPorAtleta : equipeExistente.provasPorAtleta,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Cria nova inscrição de equipe
        const novaInsc: InscricaoEquipe = {
          id: `insc-${Date.now()}-${modInsc.modalidadeCodigo}`,
          escolaId,
          modalidadeCodigo: modInsc.modalidadeCodigo,
          modalidadeNome: modObj.nome,
          categoria: cat,
          sexo: atleta.sexo,
          atletaIds: [atleta.id],
          provasPorAtleta: modInsc.provas ? { [atleta.id]: modInsc.provas } : undefined,
          comissaoIds: [],
          status: 'PENDENTE',
          dataInscricao: new Date().toLocaleString('pt-BR'),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        todasInscricoes.unshift(novaInsc);
      }
    });

    // Remove equipes que ficaram com 0 atletas
    todasInscricoes = todasInscricoes.filter(i => i.atletaIds.length > 0);
    localStorage.setItem(STORAGE_KEYS.INSCRICOES, JSON.stringify(todasInscricoes));
  }

  public static deleteInscricao(id: string): void {
    if (!this.isClient()) return;
    const list = this.getInscricoes().filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.INSCRICOES, JSON.stringify(list));
  }

  public static getComunicados(): ComunicadoAviso[] {
    if (!this.isClient()) return COMUNICADOS_JEGDS;
    this.init();
    const data = localStorage.getItem(STORAGE_KEYS.COMUNICADOS);
    return data ? JSON.parse(data) : COMUNICADOS_JEGDS;
  }

  public static saveComunicado(aviso: ComunicadoAviso): void {
    if (!this.isClient()) return;
    const list = this.getComunicados();
    const idx = list.findIndex(a => a.id === aviso.id);
    if (idx >= 0) list[idx] = aviso;
    else list.unshift(aviso);
    localStorage.setItem(STORAGE_KEYS.COMUNICADOS, JSON.stringify(list));
  }

  public static getUsuarios(): any[] {
    if (!this.isClient()) return [];
    this.init();
    const data = localStorage.getItem(STORAGE_KEYS.USUARIOS);
    return data ? JSON.parse(data) : [];
  }

  public static saveUsuario(user: any): void {
    if (!this.isClient()) return;
    const list = this.getUsuarios();
    const idx = list.findIndex(u => u.id === user.id || u.email === user.email);
    if (idx >= 0) list[idx] = user;
    else list.push(user);
    localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(list));
  }

  public static setCurrentUser(user: any | null): void {
    if (!this.isClient()) return;
    if (user) localStorage.setItem(STORAGE_KEYS.CURRENT_AUTH_USER, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEYS.CURRENT_AUTH_USER);
  }

  public static getCurrentUser(): any | null {
    if (!this.isClient()) return null;
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_AUTH_USER);
    return data ? JSON.parse(data) : null;
  }

  /**
   * Cálculo em tempo real de Vagas Ocupadas x Vagas Totais (Competitivo entre todas as escolas)
   */
  public static getVagasOcupadas(
    modalidadeCodigo: ModalidadeCodigo,
    categoria: CategoriaIdade,
    sexo: Genero
  ): { ocupadas: number; total: number; disponiveis: number; esgotada: boolean } {
    const modalidades = this.getModalidades();
    const mod = modalidades.find(m => m.codigo === modalidadeCodigo);
    const total = mod ? mod.maxAtletas : 10;

    const inscricoes = this.getInscricoes();
    // Inscrições ativas para essa modalidade + categoria + sexo
    const inscricoesAtivas = inscricoes.filter(
      i => i.modalidadeCodigo === modalidadeCodigo && i.categoria === categoria && i.sexo === sexo
    );

    let ocupadas = 0;
    inscricoesAtivas.forEach(i => {
      ocupadas += i.atletaIds.length;
    });

    const disponiveis = Math.max(0, total - ocupadas);
    const esgotada = ocupadas >= total;

    return { ocupadas, total, disponiveis, esgotada };
  }

  /**
   * Atualização de status de conferência pelo coordenador SEMED
   */
  public static updateAtletaConferencia(
    atletaId: string,
    conferido: boolean,
    observacao?: string
  ): void {
    if (!this.isClient()) return;
    const atletas = this.getAtletas();
    const idx = atletas.findIndex(a => a.id === atletaId);
    if (idx >= 0) {
      atletas[idx].conferidoPeloCoordenador = conferido;
      if (observacao !== undefined) {
        atletas[idx].observacaoCoordenador = observacao;
      }
      localStorage.setItem(STORAGE_KEYS.ATLETAS, JSON.stringify(atletas));
    }
  }

  /**
   * Progresso geral de todas as escolas cadastradas
   */
  public static getProgressoEscolas(): {
    escola: Escola;
    totalAtletas: number;
    totalInscricoes: number;
    totalConferidos: number;
    status: 'PREENCHIDO' | 'EM_ANDAMENTO' | 'SEM_INSCRICAO';
  }[] {
    const escolas = this.getEscolas();
    const todosAtletas = this.getAtletas();
    const todasInscricoes = this.getInscricoes();

    return escolas.map(esc => {
      const atletasEsc = todosAtletas.filter(a => a.escolaId === esc.id);
      const inscsEsc = todasInscricoes.filter(i => i.escolaId === esc.id);
      const conferidos = atletasEsc.filter(a => a.conferidoPeloCoordenador).length;

      let status: 'PREENCHIDO' | 'EM_ANDAMENTO' | 'SEM_INSCRICAO' = 'SEM_INSCRICAO';
      if (atletasEsc.length > 0 && inscsEsc.length > 0) {
        status = 'PREENCHIDO';
      } else if (atletasEsc.length > 0 || inscsEsc.length > 0) {
        status = 'EM_ANDAMENTO';
      }

      return {
        escola: esc,
        totalAtletas: atletasEsc.length,
        totalInscricoes: inscsEsc.length,
        totalConferidos: conferidos,
        status
      };
    });
  }

  public static deleteComunicado(id: string): void {
    if (!this.isClient()) return;
    const list = this.getComunicados().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.COMUNICADOS, JSON.stringify(list));
  }

  /**
   * ==========================================
   * CRACHÁ & CONTROLE LOGÍSTICO (SEMED / JEGD)
   * ==========================================
   */

  public static gerarOuObterTokenCracha(atletaId: string): string {
    return LogisticaStorage.gerarOuObterTokenCracha(atletaId);
  }

  public static getAtletaByCrachaToken(tokenOrQuery: string): Atleta | undefined {
    return LogisticaStorage.getAtletaByCrachaToken(tokenOrQuery);
  }

  public static getRegistrosControle(atletaId?: string): RegistroControle[] {
    return LogisticaStorage.getRegistrosControle(atletaId);
  }

  public static saveRegistroControle(registro: RegistroControle): void {
    LogisticaStorage.saveRegistroControle(registro);
  }

  public static deleteRegistroControle(id: string): void {
    LogisticaStorage.deleteRegistroControle(id);
  }

  public static clearRegistrosControle(): void {
    LogisticaStorage.clearRegistrosControle();
  }

  public static getRelatorioLogistico() {
    return LogisticaStorage.getRelatorioLogistico();
  }
}


