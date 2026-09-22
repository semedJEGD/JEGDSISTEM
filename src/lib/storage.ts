import {
  Municipio,
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
import { JegdCloudSync } from './storage/cloud-sync';
import { resolveMunicipioFromHost, DomainResolutionResult } from './domain-resolver';

export {
  MUNICIPIOS_INICIAIS,
  MODALIDADES_OFICIAIS_JEGDS,
  ESCOLAS_GONCALVES_DIAS,
  COMUNICADOS_JEGDS,
  COORDENADORES_OFICIAIS_SEMED
} from './storage/initial-data';
import {
  MUNICIPIOS_INICIAIS,
  MODALIDADES_OFICIAIS_JEGDS,
  ESCOLAS_GONCALVES_DIAS,
  COMUNICADOS_JEGDS,
  COORDENADORES_OFICIAIS_SEMED
} from './storage/initial-data';

const STORAGE_KEYS = {
  MUNICIPIOS: 'jegds_municipios_v6',
  CURRENT_MUNICIPIO: 'jegds_current_municipio_v6',
  ESCOLAS: 'jegds_escolas_v6',
  ATLETAS: 'jegds_atletas_v6',
  COMISSAO: 'jegds_comissao_v6',
  INSCRICOES: 'jegds_inscricoes_v6',
  MODALIDADES: 'jegds_modalidades_v6',
  COMUNICADOS: 'jegds_comunicados_v6',
  USUARIOS: 'jegds_usuarios_v6',
  REGISTROS_CONTROLE: 'jegds_registros_controle_v6',
  CURRENT_AUTH_ESCOLA: 'jegds_current_escola_auth',
  CURRENT_AUTH_USER: 'jegds_current_user_auth',
  COMITE_AUTH: 'jegds_comite_auth',
  SUPERADMIN_AUTH: 'jegds_superadmin_auth'
};

export class JegdStorage {
  private static isClient(): boolean {
    return typeof window !== 'undefined';
  }

  public static init(): void {
    if (!this.isClient()) return;

    // Inicialização e atualização de municípios com suporte a domínios
    const rawMunicipios = localStorage.getItem(STORAGE_KEYS.MUNICIPIOS);
    if (!rawMunicipios) {
      localStorage.setItem(STORAGE_KEYS.MUNICIPIOS, JSON.stringify(MUNICIPIOS_INICIAIS));
    } else {
      // Mescla municípios iniciais para garantir que os campos de subdominio/dominio estejam presentes
      try {
        const stored: Municipio[] = JSON.parse(rawMunicipios);
        let updated = false;
        MUNICIPIOS_INICIAIS.forEach(initial => {
          const idx = stored.findIndex(m => m.id === initial.id || m.slug === initial.slug);
          if (idx >= 0) {
            if (!stored[idx].subdominio || !stored[idx].dominio || !stored[idx].dominiosAdicionais) {
              stored[idx] = { ...initial, ...stored[idx], subdominio: initial.subdominio, dominio: initial.dominio, dominiosAdicionais: initial.dominiosAdicionais };
              updated = true;
            }
          } else {
            stored.push(initial);
            updated = true;
          }
        });
        if (updated) {
          localStorage.setItem(STORAGE_KEYS.MUNICIPIOS, JSON.stringify(stored));
        }
      } catch {}
    }

    // Identificação e resolução do domínio atual
    const municipiosList = this.getMunicipios();
    const hostname = typeof window !== 'undefined' && window.location ? window.location.hostname : '';
    const resolution = resolveMunicipioFromHost(hostname, municipiosList);

    if (resolution.isDomainLocked && resolution.municipio) {
      // Força o município travado pelo domínio
      localStorage.setItem(STORAGE_KEYS.CURRENT_MUNICIPIO, JSON.stringify(resolution.municipio));

      // Segurança: Se houver uma sessão ativa de OUTRO município, encerra para evitar contaminação
      const escolaLogada = this.getCurrentEscola();
      if (escolaLogada && escolaLogada.municipioId && escolaLogada.municipioId !== resolution.municipio.id) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_AUTH_ESCOLA);
      }
      const userLogado = this.getCurrentUser();
      if (userLogado && userLogado.municipioId && userLogado.papel !== 'SUPERADMIN' && userLogado.municipioId !== resolution.municipio.id) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_AUTH_USER);
        localStorage.removeItem(STORAGE_KEYS.COMITE_AUTH);
      }
    } else if (!localStorage.getItem(STORAGE_KEYS.CURRENT_MUNICIPIO)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_MUNICIPIO, JSON.stringify(MUNICIPIOS_INICIAIS[0]));
    }

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

    // Sincronização em tempo real com o banco de dados central
    this.sincronizarComNuvem().catch(() => {});
  }

  /**
   * Sincronização ativa e periódica com o banco de dados online (PostgreSQL / Neon)
   * Dispara evento para atualização instantânea em tempo real nos dashboards de professores e coordenadores.
   */
  public static async sincronizarComNuvem(): Promise<boolean> {
    if (!this.isClient()) return false;
    try {
      const data = await JegdCloudSync.carregarDadosCloud();
      if (!data) return false;

      let changed = false;
      if (data.municipios && Array.isArray(data.municipios) && data.municipios.length > 0) {
        localStorage.setItem(STORAGE_KEYS.MUNICIPIOS, JSON.stringify(data.municipios));
        changed = true;
      }
      if (data.escolas && Array.isArray(data.escolas) && data.escolas.length > 0) {
        localStorage.setItem(STORAGE_KEYS.ESCOLAS, JSON.stringify(data.escolas));
        changed = true;
      }
      if (data.atletas && Array.isArray(data.atletas)) {
        localStorage.setItem(STORAGE_KEYS.ATLETAS, JSON.stringify(data.atletas));
        changed = true;
      }
      if (data.inscricoes && Array.isArray(data.inscricoes)) {
        localStorage.setItem(STORAGE_KEYS.INSCRICOES, JSON.stringify(data.inscricoes));
        changed = true;
      }
      if (data.registros && Array.isArray(data.registros)) {
        localStorage.setItem(STORAGE_KEYS.REGISTROS_CONTROLE, JSON.stringify(data.registros));
        changed = true;
      }
      if (data.comunicados && Array.isArray(data.comunicados)) {
        localStorage.setItem(STORAGE_KEYS.COMUNICADOS, JSON.stringify(data.comunicados));
        changed = true;
      }

      if (changed && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('jegd-data-synced', { detail: data }));
      }
      return true;
    } catch {
      return false;
    }
  }

  // ==========================================
  // GESTÃO DE DOMÍNIO E MULTI-TENANT
  // ==========================================

  public static getDomainResolution(): DomainResolutionResult {
    if (!this.isClient()) {
      return {
        municipio: MUNICIPIOS_INICIAIS[0],
        isDomainLocked: false,
        detectedHostname: '',
        matchedBy: 'none'
      };
    }
    const munList = this.getMunicipios();
    const hostname = typeof window !== 'undefined' && window.location ? window.location.hostname : '';
    return resolveMunicipioFromHost(hostname, munList);
  }

  public static isDomainLocked(): boolean {
    return this.getDomainResolution().isDomainLocked;
  }

  // ==========================================
  // GESTÃO DE MUNICÍPIOS (MULTI-TENANT)
  // ==========================================

  public static getMunicipios(): Municipio[] {
    if (!this.isClient()) return MUNICIPIOS_INICIAIS;
    const data = localStorage.getItem(STORAGE_KEYS.MUNICIPIOS);
    return data ? JSON.parse(data) : MUNICIPIOS_INICIAIS;
  }

  public static getMunicipioById(id: string): Municipio | undefined {
    return this.getMunicipios().find(m => m.id === id);
  }

  public static getMunicipioBySlug(slug: string): Municipio | undefined {
    return this.getMunicipios().find(m => m.slug === slug);
  }

  public static saveMunicipio(municipio: Municipio): void {
    if (!this.isClient()) return;
    const list = this.getMunicipios();
    const idx = list.findIndex(m => m.id === municipio.id);
    if (idx >= 0) list[idx] = municipio;
    else list.push(municipio);
    localStorage.setItem(STORAGE_KEYS.MUNICIPIOS, JSON.stringify(list));
    JegdCloudSync.syncMunicipio(municipio).catch(() => {});
  }

  public static deleteMunicipio(id: string): void {
    if (!this.isClient()) return;
    const list = this.getMunicipios().filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MUNICIPIOS, JSON.stringify(list));
  }

  public static getCurrentMunicipio(): Municipio {
    if (!this.isClient()) return MUNICIPIOS_INICIAIS[0];
    
    // Se o domínio atual estiver travado para um município específico
    const resolution = this.getDomainResolution();
    if (resolution.isDomainLocked && resolution.municipio) {
      return resolution.municipio;
    }

    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_MUNICIPIO);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed && parsed.id) return parsed;
      } catch {}
    }
    const fallback = this.getMunicipios()[0] || MUNICIPIOS_INICIAIS[0];
    this.setCurrentMunicipio(fallback);
    return fallback;
  }

  public static setCurrentMunicipio(municipio: Municipio | null): void {
    if (!this.isClient()) return;
    
    // Se o domínio for travado e tentar mudar para outro município que não o do domínio, bloqueia
    const resolution = this.getDomainResolution();
    if (resolution.isDomainLocked && resolution.municipio && municipio && municipio.id !== resolution.municipio.id) {
      console.warn(`[JegdStorage] Tentativa de alterar município bloqueada pelo domínio travado: ${resolution.municipio.nome}`);
      return;
    }

    if (municipio) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_MUNICIPIO, JSON.stringify(municipio));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('jegd-municipio-changed', { detail: municipio }));
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_MUNICIPIO);
    }
  }

  // ==========================================
  // ESCOLAS
  // ==========================================

  public static getEscolas(municipioId?: string): Escola[] {
    if (!this.isClient()) return ESCOLAS_GONCALVES_DIAS;
    this.init();
    const data = localStorage.getItem(STORAGE_KEYS.ESCOLAS);
    const list: Escola[] = data ? JSON.parse(data) : ESCOLAS_GONCALVES_DIAS;
    const targetMunicipio = municipioId || this.getCurrentMunicipio().id;
    if (targetMunicipio && targetMunicipio !== 'ALL') {
      return list.filter(e => !e.municipioId || e.municipioId === targetMunicipio);
    }
    return list;
  }

  public static getAllEscolas(): Escola[] {
    if (!this.isClient()) return ESCOLAS_GONCALVES_DIAS;
    this.init();
    const data = localStorage.getItem(STORAGE_KEYS.ESCOLAS);
    return data ? JSON.parse(data) : ESCOLAS_GONCALVES_DIAS;
  }

  public static getEscolaById(id: string): Escola | undefined {
    return this.getAllEscolas().find(e => e.id === id);
  }

  public static saveEscola(escola: Escola): void {
    if (!this.isClient()) return;
    const curMun = this.getCurrentMunicipio();
    const escolaToSave: Escola = {
      ...escola,
      municipioId: escola.municipioId || curMun.id
    };
    const list = this.getAllEscolas();
    const idx = list.findIndex(e => e.id === escolaToSave.id);
    if (idx >= 0) list[idx] = escolaToSave;
    else list.push(escolaToSave);
    localStorage.setItem(STORAGE_KEYS.ESCOLAS, JSON.stringify(list));
    JegdCloudSync.syncEscola(escolaToSave).catch(() => {});
  }

  public static deleteEscola(id: string): void {
    if (!this.isClient()) return;
    const list = this.getAllEscolas().filter(e => e.id !== id);
    localStorage.setItem(STORAGE_KEYS.ESCOLAS, JSON.stringify(list));
  }

  // ==========================================
  // AUTENTICAÇÃO E SESSÃO
  // ==========================================

  public static setCurrentEscola(escola: Escola | null): boolean {
    if (!this.isClient()) return false;
    if (escola) {
      const resolution = this.getDomainResolution();
      // Se estiver em um domínio travado e a escola for de outro município, bloqueia
      if (resolution.isDomainLocked && resolution.municipio && escola.municipioId && escola.municipioId !== resolution.municipio.id) {
        console.error(`[JegdStorage] Acesso Negado: A escola ${escola.nome} (${escola.municipioId}) não pertence ao domínio de ${resolution.municipio.nome}`);
        return false;
      }

      localStorage.setItem(STORAGE_KEYS.CURRENT_AUTH_ESCOLA, JSON.stringify(escola));
      if (escola.municipioId && !resolution.isDomainLocked) {
        const mun = this.getMunicipioById(escola.municipioId);
        if (mun) this.setCurrentMunicipio(mun);
      }
      return true;
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_AUTH_ESCOLA);
      return true;
    }
  }

  public static getCurrentEscola(): Escola | null {
    if (!this.isClient()) return null;
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_AUTH_ESCOLA);
    if (!data) return null;
    try {
      const escola: Escola = JSON.parse(data);
      const resolution = this.getDomainResolution();
      if (resolution.isDomainLocked && resolution.municipio && escola.municipioId && escola.municipioId !== resolution.municipio.id) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_AUTH_ESCOLA);
        return null;
      }
      return escola;
    } catch {
      return null;
    }
  }

  public static setComiteAuth(isAuth: boolean, usuario?: Usuario): boolean {
    if (!this.isClient()) return false;
    if (isAuth) {
      const resolution = this.getDomainResolution();
      if (usuario && usuario.papel !== 'SUPERADMIN' && resolution.isDomainLocked && resolution.municipio && usuario.municipioId && usuario.municipioId !== resolution.municipio.id) {
        console.error(`[JegdStorage] Acesso Negado: O coordenador ${usuario.nome} não pertence ao domínio de ${resolution.municipio.nome}`);
        return false;
      }

      localStorage.setItem(STORAGE_KEYS.COMITE_AUTH, 'true');
      if (usuario) {
        this.setCurrentUser(usuario);
        if (usuario.municipioId && !resolution.isDomainLocked) {
          const mun = this.getMunicipioById(usuario.municipioId);
          if (mun) this.setCurrentMunicipio(mun);
        }
      }
      return true;
    } else {
      localStorage.removeItem(STORAGE_KEYS.COMITE_AUTH);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_AUTH_USER);
      return true;
    }
  }

  public static isComiteAuth(): boolean {
    if (!this.isClient()) return false;
    return localStorage.getItem(STORAGE_KEYS.COMITE_AUTH) === 'true';
  }

  public static setSuperAdminAuth(isAuth: boolean): void {
    if (!this.isClient()) return;
    if (isAuth) localStorage.setItem(STORAGE_KEYS.SUPERADMIN_AUTH, 'true');
    else localStorage.removeItem(STORAGE_KEYS.SUPERADMIN_AUTH);
  }

  public static isSuperAdminAuth(): boolean {
    if (!this.isClient()) return false;
    return localStorage.getItem(STORAGE_KEYS.SUPERADMIN_AUTH) === 'true';
  }

  public static setAdminAuth(isAuth: boolean): void {
    this.setComiteAuth(isAuth);
  }

  public static isAdminAuth(): boolean {
    return this.isComiteAuth() || this.isSuperAdminAuth();
  }

  // ==========================================
  // MODALIDADES
  // ==========================================

  public static getModalidades(municipioId?: string): ModalidadeConfig[] {
    if (!this.isClient()) return MODALIDADES_OFICIAIS_JEGDS;
    this.init();
    const data = localStorage.getItem(STORAGE_KEYS.MODALIDADES);
    const list: ModalidadeConfig[] = data ? JSON.parse(data) : MODALIDADES_OFICIAIS_JEGDS;
    const targetMunicipio = municipioId || this.getCurrentMunicipio().id;
    const filtered = list.filter(m => !m.municipioId || m.municipioId === targetMunicipio);
    return filtered.length > 0 ? filtered : MODALIDADES_OFICIAIS_JEGDS;
  }

  // ==========================================
  // ATLETAS
  // ==========================================

  public static getAtletas(escolaId?: string, municipioId?: string): Atleta[] {
    if (!this.isClient()) return [];
    this.init();
    const data = localStorage.getItem(STORAGE_KEYS.ATLETAS);
    let list: Atleta[] = data ? JSON.parse(data) : [];
    
    if (escolaId) {
      return list.filter(a => a.escolaId === escolaId);
    }

    const targetMunicipio = municipioId || this.getCurrentMunicipio().id;
    if (targetMunicipio && targetMunicipio !== 'ALL') {
      const escolasDoMunicipio = this.getEscolas(targetMunicipio).map(e => e.id);
      list = list.filter(a => (a.municipioId && a.municipioId === targetMunicipio) || escolasDoMunicipio.includes(a.escolaId));
    }
    return list;
  }

  public static getAtletaById(id: string): Atleta | undefined {
    if (!this.isClient()) return undefined;
    this.init();
    const data = localStorage.getItem(STORAGE_KEYS.ATLETAS);
    const list: Atleta[] = data ? JSON.parse(data) : [];
    return list.find(a => a.id === id);
  }

  public static saveAtleta(atleta: Atleta): void {
    if (!this.isClient()) return;
    const curMun = this.getCurrentMunicipio();
    const atletaToSave: Atleta = {
      ...atleta,
      municipioId: atleta.municipioId || curMun.id
    };
    const data = localStorage.getItem(STORAGE_KEYS.ATLETAS);
    const list: Atleta[] = data ? JSON.parse(data) : [];
    const idx = list.findIndex(a => a.id === atletaToSave.id);
    if (idx >= 0) list[idx] = atletaToSave;
    else list.unshift(atletaToSave);
    localStorage.setItem(STORAGE_KEYS.ATLETAS, JSON.stringify(list));
    JegdCloudSync.syncAtleta(atletaToSave).catch(() => {});
  }

  public static verificarDuplicidadeAtleta(params: {
    nomeCompleto: string;
    dataNascimento: string;
    documentoNumero?: string;
    matricula?: string;
    escolaIdAtual: string;
    atletaIdIgnorado?: string;
  }): {
    duplicado: boolean;
    tipoConflito?: 'MESMA_ESCOLA' | 'OUTRA_ESCOLA';
    atletaExistente?: Atleta;
    escolaExistente?: Escola;
    motivo?: 'DOCUMENTO' | 'NOME_DATA_NASC' | 'MATRICULA';
    descricao?: string;
    mensagemUsuario?: string;
  } {
    if (!this.isClient()) return { duplicado: false };
    this.init();
    const data = localStorage.getItem(STORAGE_KEYS.ATLETAS);
    const todosAtletas: Atleta[] = data ? JSON.parse(data) : [];
    const escolas = this.getAllEscolas();

    for (const atl of todosAtletas) {
      if (params.atletaIdIgnorado && atl.id === params.atletaIdIgnorado) {
        continue;
      }

      const check = JegdsRulesService.compararDuplicidade(
        {
          nomeCompleto: params.nomeCompleto,
          dataNascimento: params.dataNascimento,
          documentoNumero: params.documentoNumero,
          matricula: params.matricula
        },
        atl
      );

      if (check.duplicado) {
        const mesmaEscola = atl.escolaId === params.escolaIdAtual;
        const esc = escolas.find(e => e.id === atl.escolaId);

        let mensagemUsuario = '';
        if (mesmaEscola) {
          mensagemUsuario = `O estudante "${atl.nomeCompleto}" já está cadastrado nesta escola (${check.descricao || ''}).`;
        } else {
          mensagemUsuario = `Conflito de Instituição: O estudante "${atl.nomeCompleto}" já se encontra cadastrado pela escola "${esc?.nome || atl.escolaId}" (${check.descricao || ''}). Conforme o regulamento, um aluno não pode representar duas escolas.`;
        }

        return {
          duplicado: true,
          tipoConflito: mesmaEscola ? 'MESMA_ESCOLA' : 'OUTRA_ESCOLA',
          atletaExistente: atl,
          escolaExistente: esc,
          motivo: check.motivo,
          descricao: check.descricao,
          mensagemUsuario
        };
      }
    }

    return { duplicado: false };
  }

  public static deleteAtleta(id: string): void {
    if (!this.isClient()) return;
    const data = localStorage.getItem(STORAGE_KEYS.ATLETAS);
    const list: Atleta[] = data ? JSON.parse(data) : [];
    const updated = list.filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ATLETAS, JSON.stringify(updated));
    JegdCloudSync.deleteAtleta(id).catch(() => {});

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

  // ==========================================
  // COMISSÃO TÉCNICA
  // ==========================================

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
    const curMun = this.getCurrentMunicipio();
    const membroToSave: MembroComissao = {
      ...membro,
      municipioId: membro.municipioId || curMun.id
    };
    const list = this.getComissao();
    const idx = list.findIndex(c => c.id === membroToSave.id);
    if (idx >= 0) list[idx] = membroToSave;
    else list.unshift(membroToSave);
    localStorage.setItem(STORAGE_KEYS.COMISSAO, JSON.stringify(list));
  }

  public static deleteComissao(id: string): void {
    if (!this.isClient()) return;
    const list = this.getComissao().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.COMISSAO, JSON.stringify(list));
  }

  public static calcularCategoria(dataNascimento: string | Date) {
    return JegdsRulesService.calcularCategoria(dataNascimento);
  }

  // ==========================================
  // INSCRIÇÕES
  // ==========================================

  public static getInscricoes(escolaId?: string, municipioId?: string): InscricaoEquipe[] {
    if (!this.isClient()) return [];
    this.init();
    const data = localStorage.getItem(STORAGE_KEYS.INSCRICOES);
    let list: InscricaoEquipe[] = data ? JSON.parse(data) : [];
    
    if (escolaId) {
      return list.filter(i => i.escolaId === escolaId);
    }

    const targetMunicipio = municipioId || this.getCurrentMunicipio().id;
    if (targetMunicipio && targetMunicipio !== 'ALL') {
      const escolasDoMunicipio = this.getEscolas(targetMunicipio).map(e => e.id);
      list = list.filter(i => (i.municipioId && i.municipioId === targetMunicipio) || escolasDoMunicipio.includes(i.escolaId));
    }
    return list;
  }

  public static saveInscricao(insc: InscricaoEquipe): void {
    if (!this.isClient()) return;
    const curMun = this.getCurrentMunicipio();
    const inscToSave: InscricaoEquipe = {
      ...insc,
      municipioId: insc.municipioId || curMun.id
    };
    const data = localStorage.getItem(STORAGE_KEYS.INSCRICOES);
    const list: InscricaoEquipe[] = data ? JSON.parse(data) : [];
    const idx = list.findIndex(i => i.id === inscToSave.id);
    if (idx >= 0) list[idx] = { ...inscToSave, updatedAt: new Date().toISOString() };
    else list.unshift({ ...inscToSave, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEYS.INSCRICOES, JSON.stringify(list));
    JegdCloudSync.syncInscricao(inscToSave).catch(() => {});
  }

  public static syncAtletaComEquipes(escolaId: string, atleta: Atleta): void {
    if (!this.isClient()) return;
    const cat = atleta.categoriaCalculada || JegdsRulesService.calcularCategoria(atleta.dataNascimento).categoria;
    if (!cat) return;

    const modalidadesConfig = this.getModalidades();
    let todasInscricoes = this.getInscricoes();
    const curMun = this.getCurrentMunicipio();

    // 1. Remove o atleta de equipes inválidas
    const modCodigosAtuais = atleta.modalidadesInscritas?.map(m => m.modalidadeCodigo) || [];
    
    todasInscricoes = todasInscricoes.map(insc => {
      if (insc.escolaId === escolaId) {
        if (!modCodigosAtuais.includes(insc.modalidadeCodigo) || insc.categoria !== cat || insc.sexo !== atleta.sexo) {
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

    // 2. Adiciona/atualiza nas equipes vinculadas
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
          municipioId: equipeExistente.municipioId || curMun.id,
          atletaIds,
          provasPorAtleta: modInsc.modalidadeCodigo === 'atletismo' ? provasPorAtleta : equipeExistente.provasPorAtleta,
          updatedAt: new Date().toISOString()
        };
      } else {
        const novaInsc: InscricaoEquipe = {
          id: `insc-${Date.now()}-${modInsc.modalidadeCodigo}`,
          municipioId: curMun.id,
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

    todasInscricoes = todasInscricoes.filter(i => i.atletaIds.length > 0);
    localStorage.setItem(STORAGE_KEYS.INSCRICOES, JSON.stringify(todasInscricoes));
  }

  public static deleteInscricao(id: string): void {
    if (!this.isClient()) return;
    const list = this.getInscricoes().filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.INSCRICOES, JSON.stringify(list));
    JegdCloudSync.deleteInscricao(id).catch(() => {});
  }

  // ==========================================
  // COMUNICADOS
  // ==========================================

  public static getComunicados(municipioId?: string): ComunicadoAviso[] {
    if (!this.isClient()) return COMUNICADOS_JEGDS;
    this.init();
    const data = localStorage.getItem(STORAGE_KEYS.COMUNICADOS);
    const list: ComunicadoAviso[] = data ? JSON.parse(data) : COMUNICADOS_JEGDS;
    const targetMunicipio = municipioId || this.getCurrentMunicipio().id;
    if (targetMunicipio && targetMunicipio !== 'ALL') {
      return list.filter(c => !c.municipioId || c.municipioId === targetMunicipio);
    }
    return list;
  }

  public static saveComunicado(aviso: ComunicadoAviso): void {
    if (!this.isClient()) return;
    const curMun = this.getCurrentMunicipio();
    const avisoToSave: ComunicadoAviso = {
      ...aviso,
      municipioId: aviso.municipioId || curMun.id
    };
    const list = this.getComunicados();
    const idx = list.findIndex(a => a.id === avisoToSave.id);
    if (idx >= 0) list[idx] = avisoToSave;
    else list.unshift(avisoToSave);
    localStorage.setItem(STORAGE_KEYS.COMUNICADOS, JSON.stringify(list));
  }

  public static deleteComunicado(id: string): void {
    if (!this.isClient()) return;
    const list = this.getComunicados().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.COMUNICADOS, JSON.stringify(list));
  }

  // ==========================================
  // USUÁRIOS E COORDENADORES
  // ==========================================

  public static getAllUsuarios(): Usuario[] {
    if (!this.isClient()) return [];
    this.init();
    const data = localStorage.getItem(STORAGE_KEYS.USUARIOS);
    return data ? JSON.parse(data) : [];
  }

  public static getUsuarios(municipioId?: string): Usuario[] {
    if (!this.isClient()) return [];
    this.init();
    const list = this.getAllUsuarios();
    const targetMunicipio = municipioId || this.getCurrentMunicipio().id;
    if (targetMunicipio && targetMunicipio !== 'ALL') {
      return list.filter(u => !u.municipioId || u.municipioId === targetMunicipio || u.papel === 'SUPERADMIN');
    }
    return list;
  }

  public static getUsuarioByCpf(cpf: string, municipioId?: string): Usuario | undefined {
    const limpo = cpf.replace(/\D/g, '');
    if (!limpo) return undefined;
    return this.getUsuarios(municipioId).find(u => {
      const uCpf = (u.cpf || '').replace(/\D/g, '');
      return uCpf === limpo;
    });
  }

  public static findUsuarioInAnyMunicipio(cpf: string): Usuario | undefined {
    const limpo = cpf.replace(/\D/g, '');
    if (!limpo) return undefined;
    return this.getAllUsuarios().find(u => {
      const uCpf = (u.cpf || '').replace(/\D/g, '');
      return uCpf === limpo;
    });
  }

  public static findEscolaInAnyMunicipio(emailOrSigla: string): Escola | undefined {
    const clean = emailOrSigla.trim().toLowerCase();
    if (!clean) return undefined;
    return this.getAllEscolas().find(e => 
      e.loginEmail?.toLowerCase() === clean || 
      e.id === clean || 
      (e.sigla && e.sigla.toLowerCase() === clean)
    );
  }

  public static saveUsuario(user: Usuario): void {
    if (!this.isClient()) return;
    const curMun = this.getCurrentMunicipio();
    const userToSave: Usuario = {
      ...user,
      municipioId: user.municipioId !== undefined ? user.municipioId : curMun.id
    };
    const list = this.getUsuarios();
    const userCpfLimpo = (userToSave.cpf || '').replace(/\D/g, '');
    const idx = list.findIndex(u => {
      if (u.id === userToSave.id) return true;
      if (userCpfLimpo && (u.cpf || '').replace(/\D/g, '') === userCpfLimpo) return true;
      if (userToSave.email && u.email === userToSave.email) return true;
      return false;
    });
    if (idx >= 0) list[idx] = userToSave;
    else list.push(userToSave);
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

  public static getVagasOcupadas(
    modalidadeCodigo: ModalidadeCodigo,
    categoria: CategoriaIdade,
    sexo: Genero
  ): { ocupadas: number; total: number; disponiveis: number; esgotada: boolean } {
    const modalidades = this.getModalidades();
    const mod = modalidades.find(m => m.codigo === modalidadeCodigo);
    const total = mod ? mod.maxAtletas : 10;

    const inscricoes = this.getInscricoes();
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

  public static updateAtletaConferencia(
    atletaId: string,
    conferido: boolean,
    observacao?: string
  ): void {
    if (!this.isClient()) return;
    const data = localStorage.getItem(STORAGE_KEYS.ATLETAS);
    const atletas: Atleta[] = data ? JSON.parse(data) : [];
    const idx = atletas.findIndex(a => a.id === atletaId);
    if (idx >= 0) {
      atletas[idx].conferidoPeloCoordenador = conferido;
      if (observacao !== undefined) {
        atletas[idx].observacaoCoordenador = observacao;
      }
      localStorage.setItem(STORAGE_KEYS.ATLETAS, JSON.stringify(atletas));
    }
  }

  public static getProgressoEscolas(municipioId?: string): {
    escola: Escola;
    totalAtletas: number;
    totalInscricoes: number;
    totalConferidos: number;
    status: 'PREENCHIDO' | 'EM_ANDAMENTO' | 'SEM_INSCRICAO';
  }[] {
    const escolas = this.getEscolas(municipioId);
    const todosAtletas = this.getAtletas(undefined, municipioId);
    const todasInscricoes = this.getInscricoes(undefined, municipioId);

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

  // ==========================================
  // CRACHÁ & CONTROLE LOGÍSTICO
  // ==========================================

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
