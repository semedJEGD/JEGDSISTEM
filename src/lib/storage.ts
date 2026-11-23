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
  TipoRegistroControle,
  ProfessorPerfil,
  PerfilAtivoEscola,
  HomologacaoDirecao
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
  SUPERADMIN_AUTH: 'jegds_superadmin_auth',
  PROFESSORES_ESCOLA: 'jegds_professores_escola_v6',
  CURRENT_PERFIL_ESCOLA: 'jegds_current_perfil_escola_v6',
  HOMOLOGACOES_DIRECAO: 'jegds_homologacoes_direcao_v6',
  DELETED_ATLETAS_IDS: 'jegds_deleted_atletas_ids_v6'
};

export class JegdStorage {
  private static isInitializing = false;
  private static hasInitialized = false;
  private static lastSyncTimestamp = 0;
  private static readonly SYNC_COOLDOWN_MS = 25000;

  private static isClient(): boolean {
    return typeof window !== 'undefined';
  }

  private static compactAtletasList(parsed: Atleta[]): Atleta[] {
    return parsed.map((a) => ({
      ...a,
      fotoUrl: a.fotoUrl && a.fotoUrl.length > 500 ? undefined : a.fotoUrl,
      documentoUrl: a.documentoUrl && a.documentoUrl.length > 500 ? undefined : a.documentoUrl,
      documentos: a.documentos
        ? {
            ...a.documentos,
            foto3x4: a.documentos.foto3x4 && a.documentos.foto3x4.length > 500 ? undefined : a.documentos.foto3x4,
            documentoIdentidade:
              a.documentos.documentoIdentidade && a.documentos.documentoIdentidade.length > 500
                ? undefined
                : a.documentos.documentoIdentidade,
          }
        : {},
    }));
  }

  /**
   * Escrita segura no localStorage com proteção contra QuotaExceededError.
   * Se o armazenamento atingir 5MB por excesso de fotos base64 em cache, libera espaço
   * removendo apenas imagens em cache de atletas para nunca impedir login ou salvamentos.
   */
  private static safeSetItem(key: string, value: string): boolean {
    if (!this.isClient()) return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      try {
        if (key === STORAGE_KEYS.ATLETAS) {
          const parsed: Atleta[] = JSON.parse(value);
          localStorage.setItem(STORAGE_KEYS.ATLETAS, JSON.stringify(this.compactAtletasList(parsed)));
          return true;
        }
        const rawAtletas = localStorage.getItem(STORAGE_KEYS.ATLETAS);
        if (rawAtletas) {
          const parsed: Atleta[] = JSON.parse(rawAtletas);
          localStorage.setItem(STORAGE_KEYS.ATLETAS, JSON.stringify(this.compactAtletasList(parsed)));
        }
        localStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    }
  }

  public static init(): void {
    if (!this.isClient() || this.isInitializing) return;
    if (
      this.hasInitialized &&
      localStorage.getItem(STORAGE_KEYS.MUNICIPIOS) &&
      localStorage.getItem(STORAGE_KEYS.ESCOLAS)
    ) {
      return;
    }
    this.isInitializing = true;
    try {

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
    } else {
      try {
        const storedEscolas: Escola[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ESCOLAS) || '[]');
        let updatedEscolas = false;
        ESCOLAS_GONCALVES_DIAS.forEach(initialEscola => {
          if (!storedEscolas.some(e => e.id === initialEscola.id)) {
            storedEscolas.push(initialEscola);
            updatedEscolas = true;
          }
        });
        if (updatedEscolas) {
          localStorage.setItem(STORAGE_KEYS.ESCOLAS, JSON.stringify(storedEscolas));
        }
      } catch {}
    }

    if (!localStorage.getItem(STORAGE_KEYS.MODALIDADES)) {
      localStorage.setItem(STORAGE_KEYS.MODALIDADES, JSON.stringify(MODALIDADES_OFICIAIS_JEGDS));
    } else {
      try {
        const storedMods: ModalidadeConfig[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MODALIDADES) || '[]');
        let updatedMods = false;
        const newMods = storedMods.map(sm => {
          const official = MODALIDADES_OFICIAIS_JEGDS.find(m => m.codigo === sm.codigo);
          if (official && (sm.maxAtletas !== official.maxAtletas || sm.minAtletas !== official.minAtletas)) {
            updatedMods = true;
            return { ...sm, minAtletas: official.minAtletas, maxAtletas: official.maxAtletas };
          }
          return sm;
        });
        if (updatedMods) {
          localStorage.setItem(STORAGE_KEYS.MODALIDADES, JSON.stringify(newMods));
        }
      } catch {}
    }

    if (!localStorage.getItem(STORAGE_KEYS.COMUNICADOS)) {
      localStorage.setItem(STORAGE_KEYS.COMUNICADOS, JSON.stringify(COMUNICADOS_JEGDS));
    } else {
      try {
        const storedAvisos: ComunicadoAviso[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.COMUNICADOS) || '[]');
        let updatedAvisos = false;
        COMUNICADOS_JEGDS.forEach(initialAviso => {
          if (!storedAvisos.some(a => a.id === initialAviso.id)) {
            storedAvisos.push(initialAviso);
            updatedAvisos = true;
          }
        });
        if (updatedAvisos) {
          localStorage.setItem(STORAGE_KEYS.COMUNICADOS, JSON.stringify(storedAvisos));
        }
      } catch {}
    }

    if (!localStorage.getItem(STORAGE_KEYS.USUARIOS)) {
      localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(COORDENADORES_OFICIAIS_SEMED));
    } else {
      try {
        const storedUsers: Usuario[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USUARIOS) || '[]');
        let updatedUsers = false;
        COORDENADORES_OFICIAIS_SEMED.forEach(initialUser => {
          if (!storedUsers.some(u => u.id === initialUser.id || (initialUser.email && u.email?.toLowerCase() === initialUser.email.toLowerCase()))) {
            storedUsers.push(initialUser);
            updatedUsers = true;
          }
        });
        if (updatedUsers) {
          localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(storedUsers));
        }
      } catch {}
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

    // Sanitização de segurança das travas do regulamento JEGDS 2026 (limpeza de excessos)
    try {
      this.sanitizarExcessoEquipes();
    } catch {}

    this.hasInitialized = true;

    // Sincronização em tempo real com o banco de dados central (apenas 1x na inicialização)
    this.sincronizarComNuvem(false).catch(() => {});
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Sincronização ativa e periódica com o banco de dados online (PostgreSQL / Neon)
   * Dispara evento para atualização instantânea em tempo real nos dashboards de professores e coordenadores.
   */
  public static async sincronizarComNuvem(force = false): Promise<boolean> {
    if (!this.isClient()) return false;
    const now = Date.now();
    if (!force && this.lastSyncTimestamp > 0 && now - this.lastSyncTimestamp < this.SYNC_COOLDOWN_MS) {
      return false;
    }
    this.lastSyncTimestamp = now;
    try {
      const data = await JegdCloudSync.carregarDadosCloud();
      if (!data) return false;

      let changed = false;
      if (data.municipios && Array.isArray(data.municipios) && data.municipios.length > 0) {
        const mergedMunicipios = data.municipios.map((m: Municipio) => {
          const initial = MUNICIPIOS_INICIAIS.find(im => im.id === m.id || im.slug === m.slug);
          return initial
            ? {
                ...initial,
                ...m,
                subdominio: m.subdominio || initial.subdominio,
                dominio: m.dominio || initial.dominio,
                dominiosAdicionais: m.dominiosAdicionais || initial.dominiosAdicionais,
              }
            : m;
        });
        this.safeSetItem(STORAGE_KEYS.MUNICIPIOS, JSON.stringify(mergedMunicipios));
        changed = true;
      }
      if (data.escolas && Array.isArray(data.escolas) && data.escolas.length > 0) {
        this.safeSetItem(STORAGE_KEYS.ESCOLAS, JSON.stringify(data.escolas));
        changed = true;
      }
      if (data.atletas && Array.isArray(data.atletas)) {
        const storedData = localStorage.getItem(STORAGE_KEYS.ATLETAS);
        const storedAtletas: Atleta[] = storedData ? JSON.parse(storedData) : [];
        const deletedRaw = localStorage.getItem(STORAGE_KEYS.DELETED_ATLETAS_IDS);
        const deletedIds: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];

        // Filtra da nuvem qualquer atleta que foi excluído ou que seja de teste e reconstrói documentos em memória
        const cloudValidos = data.atletas
          .filter((a: Atleta) => {
            const isDeleted = deletedIds.includes(a.id) ||
              (a.matricula && deletedIds.includes(a.matricula)) ||
              (a.crachaToken && deletedIds.includes(a.crachaToken)) ||
              (a.documentoNumero && a.documentoNumero.toUpperCase() !== 'SEM DOCUMENTO' && deletedIds.includes(a.documentoNumero));

            if (isDeleted) {
              JegdCloudSync.deleteAtleta(a.id, a.matricula, a.documentoNumero).catch(() => {});
              return false;
            }
            return true;
          })
          .map((a: Atleta) => ({
            ...a,
            documentos: a.documentos || {
              foto3x4: a.fotoUrl || undefined,
              documentoIdentidade: a.documentoUrl || undefined,
            },
          }));

        const mergedAtletas: Atleta[] = [...cloudValidos];

        for (const localAtl of storedAtletas) {
          // Ignora excluídos ou testes locais
          const isLocalDeleted = deletedIds.includes(localAtl.id) ||
            (localAtl.matricula && deletedIds.includes(localAtl.matricula)) ||
            (localAtl.crachaToken && deletedIds.includes(localAtl.crachaToken)) ||
            (localAtl.documentoNumero && localAtl.documentoNumero.toUpperCase() !== 'SEM DOCUMENTO' && deletedIds.includes(localAtl.documentoNumero));

          if (isLocalDeleted) {
            continue;
          }

          const idx = mergedAtletas.findIndex(a => a.id === localAtl.id);
          if (idx >= 0) {
            const cloudMods = mergedAtletas[idx].modalidadesInscritas || [];
            const localMods = localAtl.modalidadesInscritas || [];
            if (localMods.length > 0 && cloudMods.length === 0) {
              mergedAtletas[idx].modalidadesInscritas = localMods;
            }
            if (mergedAtletas[idx].conferidoPeloCoordenador === undefined && localAtl.conferidoPeloCoordenador !== undefined) {
              mergedAtletas[idx].conferidoPeloCoordenador = localAtl.conferidoPeloCoordenador;
            }
            if (!mergedAtletas[idx].observacaoCoordenador && localAtl.observacaoCoordenador) {
              mergedAtletas[idx].observacaoCoordenador = localAtl.observacaoCoordenador;
            }
          } else {
            // Atleta salvo localmente que ainda está sincronizando com a nuvem
            mergedAtletas.push(localAtl);
            JegdCloudSync.syncAtleta(localAtl).catch(() => {});
          }
        }
        this.safeSetItem(STORAGE_KEYS.ATLETAS, JSON.stringify(mergedAtletas));
        changed = true;
      }
      if (data.inscricoes && Array.isArray(data.inscricoes)) {
        const storedInscData = localStorage.getItem(STORAGE_KEYS.INSCRICOES);
        const storedInscricoes: InscricaoEquipe[] = storedInscData ? JSON.parse(storedInscData) : [];
        const mergedInscricoes: InscricaoEquipe[] = [...data.inscricoes];

        for (const localInsc of storedInscricoes) {
          const idx = mergedInscricoes.findIndex(i => i.id === localInsc.id);
          if (idx >= 0) {
            const cloudIds = mergedInscricoes[idx].atletaIds || [];
            const localIds = localInsc.atletaIds || [];
            if (localIds.length > cloudIds.length) {
              mergedInscricoes[idx].atletaIds = Array.from(new Set([...cloudIds, ...localIds]));
            }
            const localTime = localInsc.updatedAt ? new Date(localInsc.updatedAt).getTime() : 0;
            const cloudTime = mergedInscricoes[idx].updatedAt ? new Date(mergedInscricoes[idx].updatedAt).getTime() : 0;
            if (localTime > cloudTime) {
              mergedInscricoes[idx].status = localInsc.status;
              mergedInscricoes[idx].motivoRejeicao = localInsc.motivoRejeicao;
              mergedInscricoes[idx].parecerComite = localInsc.parecerComite;
              mergedInscricoes[idx].dataHomologacao = localInsc.dataHomologacao;
              mergedInscricoes[idx].updatedAt = localInsc.updatedAt;
            }
          } else {
            mergedInscricoes.push(localInsc);
            JegdCloudSync.syncInscricao(localInsc).catch(() => {});
          }
        }
        localStorage.setItem(STORAGE_KEYS.INSCRICOES, JSON.stringify(mergedInscricoes));
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
      if (data.usuarios && Array.isArray(data.usuarios) && data.usuarios.length > 0) {
        const storedUsuarios = this.getAllUsuarios();
        const mergedUsuarios = [...storedUsuarios];
        for (const cloudUser of data.usuarios) {
          const cloudCpf = (cloudUser.cpf || '').replace(/\D/g, '');
          const idx = mergedUsuarios.findIndex(u => {
            if (u.id === cloudUser.id) return true;
            if (cloudCpf && (u.cpf || '').replace(/\D/g, '') === cloudCpf) return true;
            if (cloudUser.email && u.email?.toLowerCase() === cloudUser.email.toLowerCase()) return true;
            return false;
          });
          if (idx >= 0) {
            mergedUsuarios[idx] = { ...mergedUsuarios[idx], ...cloudUser };
          } else {
            mergedUsuarios.push(cloudUser);
          }
        }
        localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(mergedUsuarios));
        changed = true;
      }

      // Sanitiza qualquer excesso vindo de sincronização na nuvem
      try {
        this.sanitizarExcessoEquipes();
      } catch {}

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
    if (!this.isClient()) {
      if (municipioId && municipioId !== 'ALL') {
        return ESCOLAS_GONCALVES_DIAS.filter(e => !e.municipioId || e.municipioId === municipioId);
      }
      return ESCOLAS_GONCALVES_DIAS;
    }
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

      this.safeSetItem(STORAGE_KEYS.CURRENT_AUTH_ESCOLA, JSON.stringify(escola));
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

      this.safeSetItem(STORAGE_KEYS.COMITE_AUTH, 'true');
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

  public static isComite(): boolean {
    return this.isAdminAuth();
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

  public static logoutEscola(): void {
    if (!this.isClient()) return;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_AUTH_ESCOLA);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_AUTH_USER);
    localStorage.removeItem('jegd_current_escola_auth');
    localStorage.removeItem('jegds_current_escola_auth');
    localStorage.removeItem('jegd_current_user_auth');
    localStorage.removeItem('jegds_current_user_auth');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('jegd-auth-changed'));
    }
  }

  public static logoutAdmin(): void {
    if (!this.isClient()) return;
    localStorage.removeItem(STORAGE_KEYS.COMITE_AUTH);
    localStorage.removeItem(STORAGE_KEYS.SUPERADMIN_AUTH);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_AUTH_USER);
    localStorage.removeItem('jegd_comite_auth');
    localStorage.removeItem('jegds_comite_auth');
    localStorage.removeItem('jegd_superadmin_auth');
    localStorage.removeItem('jegds_superadmin_auth');
    localStorage.removeItem('jegd_current_user_auth');
    localStorage.removeItem('jegds_current_user_auth');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('jegd-auth-changed'));
    }
  }

  public static logoutAll(): void {
    this.logoutEscola();
    this.logoutAdmin();
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

  /**
   * Gera o próximo Código de Inscrição Sequencial Oficial do JEGD (ex: JEGD-2026-0001, JEGD-2026-0002)
   * Este mesmo código é o identificador único do aluno e do seu Crachá Oficial com QR Code.
   */
  public static gerarProximoCodigoInscricao(municipioId?: string): string {
    if (!this.isClient()) return 'JEGD-2026-0001';
    this.init();
    const curMun = municipioId ? this.getMunicipioById(municipioId) : this.getCurrentMunicipio();
    const siglaEvento = (curMun?.siglaEvento || 'JEGD 2026').replace(/\s+/g, '-').toUpperCase();

    const data = localStorage.getItem(STORAGE_KEYS.ATLETAS);
    const todosAtletas: Atleta[] = data ? JSON.parse(data) : [];

    let maxSeq = 0;
    for (const a of todosAtletas) {
      const code = a.matricula || a.crachaToken || '';
      const match = code.match(/(\d{4,})$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
    const nextSeq = Math.max(maxSeq + 1, todosAtletas.length + 1);
    const formattedNum = String(nextSeq).padStart(4, '0');
    return `${siglaEvento}-${formattedNum}`;
  }

  public static async saveAtleta(atleta: Atleta): Promise<{ ok: boolean; atleta: Atleta; error?: string }> {
    if (!this.isClient()) return { ok: false, atleta, error: 'Ambiente sem navegador' };
    const curMun = this.getCurrentMunicipio();

    // Código de Inscrição Único Sequencial
    const codigoInscricao = atleta.matricula && atleta.matricula.trim() !== '' && !atleta.matricula.startsWith('MAT-')
      ? atleta.matricula
      : this.gerarProximoCodigoInscricao(atleta.municipioId || curMun.id);

    // O código do crachá é exatamente o mesmo código de inscrição do aluno
    const crachaToken = atleta.crachaToken && atleta.crachaToken.trim() !== ''
      ? atleta.crachaToken
      : codigoInscricao;

    let atletaToSave: Atleta = {
      ...atleta,
      municipioId: atleta.municipioId || curMun.id,
      matricula: codigoInscricao,
      crachaToken
    };

    const data = localStorage.getItem(STORAGE_KEYS.ATLETAS);
    const list: Atleta[] = data ? JSON.parse(data) : [];
    const idx = list.findIndex(a => a.id === atletaToSave.id);
    if (idx >= 0) list[idx] = atletaToSave;
    else list.unshift(atletaToSave);
    this.safeSetItem(STORAGE_KEYS.ATLETAS, JSON.stringify(list));

    const cloudRes = await JegdCloudSync.syncAtleta(atletaToSave);
    if (cloudRes.ok && cloudRes.data) {
      // Atualiza código/crachá caso o servidor tenha resolvido colisão de crachaToken
      const matriculaServidor = cloudRes.data.matricula || atletaToSave.matricula;
      const crachaServidor = cloudRes.data.crachaToken || atletaToSave.crachaToken;
      if (matriculaServidor !== atletaToSave.matricula || crachaServidor !== atletaToSave.crachaToken) {
        atletaToSave = {
          ...atletaToSave,
          matricula: matriculaServidor,
          crachaToken: crachaServidor,
        };
        const latestRaw = localStorage.getItem(STORAGE_KEYS.ATLETAS);
        const latestList: Atleta[] = latestRaw ? JSON.parse(latestRaw) : [];
        const latestIdx = latestList.findIndex(a => a.id === atletaToSave.id);
        if (latestIdx >= 0) {
          latestList[latestIdx] = atletaToSave;
          this.safeSetItem(STORAGE_KEYS.ATLETAS, JSON.stringify(latestList));
        }
      }
      return { ok: true, atleta: atletaToSave };
    }

    return { ok: false, atleta: atletaToSave, error: cloudRes.error };
  }

  public static verificarDuplicidadeAtleta(params: {
    nomeCompleto: string;
    dataNascimento: string;
    documentoNumero?: string;
    matricula?: string;
    semDocumento?: boolean;
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
          matricula: params.matricula,
          semDocumento: params.semDocumento
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

  public static async deleteAtleta(id: string): Promise<void> {
    if (!this.isClient()) return;

    // Localiza o atleta para capturar todos os seus identificadores (id, matricula, crachaToken, documento)
    const data = localStorage.getItem(STORAGE_KEYS.ATLETAS);
    const list: Atleta[] = data ? JSON.parse(data) : [];
    const targetAtleta = list.find(a => a.id === id || a.matricula === id || a.crachaToken === id);
    const idReal = targetAtleta?.id || id;
    const matriculaReal = targetAtleta?.matricula;
    const crachaReal = targetAtleta?.crachaToken;
    const docReal = targetAtleta?.documentoNumero;

    // 1. Registra no tombstone para o polling nunca re-inserir
    try {
      const deletedRaw = localStorage.getItem(STORAGE_KEYS.DELETED_ATLETAS_IDS);
      const deletedIds: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
      const docValidoParaTomb = docReal && docReal.trim().toUpperCase() !== 'SEM DOCUMENTO' && docReal.trim().toUpperCase() !== 'SEM DOC' ? docReal : null;
      const novosIds = [id, idReal, matriculaReal, crachaReal, docValidoParaTomb].filter((v): v is string => Boolean(v && v.trim()));
      let mudouTomb = false;
      for (const nid of novosIds) {
        if (!deletedIds.includes(nid)) {
          deletedIds.push(nid);
          mudouTomb = true;
        }
      }
      if (mudouTomb) {
        localStorage.setItem(STORAGE_KEYS.DELETED_ATLETAS_IDS, JSON.stringify(deletedIds));
      }
    } catch {}

    // 2. Remove do localStorage de atletas
    const updated = list.filter(a =>
      a.id !== id &&
      a.id !== idReal &&
      (!matriculaReal || a.matricula !== matriculaReal) &&
      (!docReal || docReal.toUpperCase() === 'SEM DOCUMENTO' || a.documentoNumero !== docReal)
    );
    localStorage.setItem(STORAGE_KEYS.ATLETAS, JSON.stringify(updated));

    // 3. Remove das equipes vinculadas com segurança total
    try {
      const rawInsc = localStorage.getItem(STORAGE_KEYS.INSCRICOES);
      let todasInscricoes: InscricaoEquipe[] = rawInsc ? JSON.parse(rawInsc) : [];
      let mudouInsc = false;
      todasInscricoes = todasInscricoes.map(insc => {
        if (Array.isArray(insc.atletaIds) && (insc.atletaIds.includes(id) || insc.atletaIds.includes(idReal) || (matriculaReal && insc.atletaIds.includes(matriculaReal)))) {
          mudouInsc = true;
          const newIds = insc.atletaIds.filter(aId => aId !== id && aId !== idReal && aId !== matriculaReal);
          const newProvas = { ...(insc.provasPorAtleta || {}) };
          delete newProvas[id];
          delete newProvas[idReal];
          if (matriculaReal) delete newProvas[matriculaReal];
          return {
            ...insc,
            atletaIds: newIds,
            provasPorAtleta: newProvas,
            updatedAt: new Date().toISOString()
          };
        }
        return insc;
      });
      if (mudouInsc) {
        localStorage.setItem(STORAGE_KEYS.INSCRICOES, JSON.stringify(todasInscricoes));
      }
    } catch (e) {
      console.error('Erro ao remover atleta das equipes:', e);
    }

    // 4. Remove do banco de dados na nuvem (Neon PostgreSQL) passando múltiplos identificadores
    try {
      await JegdCloudSync.deleteAtleta(idReal, matriculaReal, docReal);
    } catch {}

    // 5. Dispara evento para atualizar a interface imediatamente
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('jegd-data-synced'));
    }
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

    // Atualiza imediatamente os atletas locais para refletirem esta modalidade
    try {
      const dataAtl = localStorage.getItem(STORAGE_KEYS.ATLETAS);
      const listAtl: Atleta[] = dataAtl ? JSON.parse(dataAtl) : [];
      let atlChanged = false;
      for (const atlId of insc.atletaIds) {
        const atl = listAtl.find(a => a.id === atlId);
        if (atl) {
          const mods = atl.modalidadesInscritas || [];
          if (!mods.some(m => m.modalidadeCodigo === insc.modalidadeCodigo)) {
            atl.modalidadesInscritas = [
              ...mods,
              {
                modalidadeCodigo: insc.modalidadeCodigo,
                modalidadeNome: insc.modalidadeNome,
                provas: insc.provasPorAtleta?.[atlId]
              }
            ];
            atlChanged = true;
          }
        }
      }
      if (atlChanged) {
        localStorage.setItem(STORAGE_KEYS.ATLETAS, JSON.stringify(listAtl));
      }
    } catch {}

    JegdCloudSync.syncInscricao(inscToSave).catch(() => {});
  }

  /**
   * Consulta a contagem de vagas ocupadas e limite máximo oficial por modalidade, categoria e sexo.
   * Usado para travar a interface e impedir que qualquer escola exceda o limite de atletas ou equipes.
   */
  public static getVagasModalidadeInfo(
    escolaId: string,
    modCodigo: string,
    categoria?: string | null,
    sexo?: string,
    atletaIdIgnorar?: string
  ): {
    vagasOcupadas: number;
    limiteMaximo: number;
    esgotado: boolean;
    vagasRestantes: number;
    maxEquipes: number;
    maxAtletasPorEquipe: number;
  } {
    const modalidadesConfig = this.getModalidades();
    const modObj = modalidadesConfig.find(m => m.codigo === modCodigo);
    const maxEquipes = JegdsRulesService.getMaxEquipesPorModalidade(modCodigo as any);
    const maxAtletasPorEquipe = modObj?.maxAtletas || 10;
    const limiteMaximo = maxEquipes * maxAtletasPorEquipe;

    const atletasEscola = this.getAtletas(escolaId);
    const atletasDaModalidade = atletasEscola.filter(a => {
      if (atletaIdIgnorar && (a.id === atletaIdIgnorar || a.matricula === atletaIdIgnorar)) return false;
      if (categoria && a.categoriaCalculada !== categoria) return false;
      if (sexo && a.sexo !== sexo) return false;
      return a.modalidadesInscritas?.some(m =>
        m.modalidadeCodigo === modCodigo ||
        (modObj && m.modalidadeNome.toLowerCase().includes(modObj.nome.toLowerCase()))
      );
    });

    const vagasOcupadas = atletasDaModalidade.length;
    const esgotado = vagasOcupadas >= limiteMaximo;
    const vagasRestantes = Math.max(0, limiteMaximo - vagasOcupadas);

    return {
      vagasOcupadas,
      limiteMaximo,
      esgotado,
      vagasRestantes,
      maxEquipes,
      maxAtletasPorEquipe
    };
  }

  /**
   * Sanitização rigorosa das travas do Regulamento Oficial JEGDS 2026.
   * Se alguma escola excedeu o número máximo de equipes ou de atletas por equipe (ex: Queimada com 34 atletas),
   * preserva ESTRITAMENTE os primeiros atletas cadastrados até o limite máximo oficial e expurga os excedentes,
   * excluindo equipes excedentes do banco e atualizando a nuvem.
   */
  public static sanitizarExcessoEquipes(): {
    atletasAjustados: number;
    inscricoesRemovidas: number;
    inscricoesAjustadas: number;
  } {
    if (!this.isClient()) {
      return { atletasAjustados: 0, inscricoesRemovidas: 0, inscricoesAjustadas: 0 };
    }

    const rawAtl = localStorage.getItem(STORAGE_KEYS.ATLETAS);
    let atletas: Atleta[] = rawAtl ? JSON.parse(rawAtl) : [];
    const rawInsc = localStorage.getItem(STORAGE_KEYS.INSCRICOES);
    let inscricoes: InscricaoEquipe[] = rawInsc ? JSON.parse(rawInsc) : [];
    const rawMods = localStorage.getItem(STORAGE_KEYS.MODALIDADES);
    const modalidades: ModalidadeConfig[] = rawMods ? JSON.parse(rawMods) : MODALIDADES_OFICIAIS_JEGDS;
    const rawEsc = localStorage.getItem(STORAGE_KEYS.ESCOLAS);
    const escolas: Escola[] = rawEsc ? JSON.parse(rawEsc) : ESCOLAS_GONCALVES_DIAS;

    const categorias: CategoriaIdade[] = ['MIRIM', 'INFANTIL', 'INFANTO', 'JUNIOR'];
    const sexos: Genero[] = ['FEMININO', 'MASCULINO'];

    let atletasAjustados = 0;
    let inscricoesRemovidas = 0;
    let inscricoesAjustadas = 0;
    const atletasAlteradosIds = new Set<string>();
    const inscricoesExcluidasIds: string[] = [];

    // Helper para ordenação cronológica consistente (menor número de matrícula / token ou createdAt mais antigo)
    const extrairSequencia = (val?: string) => {
      if (!val) return 999999;
      const match = val.match(/(\d+)/);
      return match ? parseInt(match[1], 10) : 999999;
    };

    for (const esc of escolas) {
      for (const mod of modalidades) {
        const maxEquipes = JegdsRulesService.getMaxEquipesPorModalidade(mod.codigo as any);
        const maxAtletas = mod.maxAtletas || 10;
        const tetoMaximo = maxEquipes * maxAtletas;

        for (const cat of categorias) {
          for (const sx of sexos) {
            // 1. Identificar atletas cadastrados nesta escola, categoria e sexo para este esporte
            const atletasInscritos = atletas.filter(a => {
              if (a.escolaId !== esc.id) return false;
              if (a.categoriaCalculada !== cat) return false;
              if (a.sexo !== sx) return false;
              return a.modalidadesInscritas?.some(m =>
                m.modalidadeCodigo === mod.codigo ||
                m.modalidadeNome.toLowerCase().includes(mod.nome.toLowerCase())
              );
            });

            if (atletasInscritos.length > tetoMaximo) {
              // Ordena cronologicamente: os primeiros que ocuparam as vagas permanecem
              atletasInscritos.sort((a, b) => {
                const seqA = extrairSequencia(a.matricula || a.crachaToken);
                const seqB = extrairSequencia(b.matricula || b.crachaToken);
                if (seqA !== seqB) return seqA - seqB;
                const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return timeA - timeB;
              });

              // Excedentes perdem a modalidade que extrapolou a vaga
              const excedentes = atletasInscritos.slice(tetoMaximo);
              for (const exc of excedentes) {
                const idxMod = exc.modalidadesInscritas?.findIndex(m =>
                  m.modalidadeCodigo === mod.codigo ||
                  m.modalidadeNome.toLowerCase().includes(mod.nome.toLowerCase())
                );
                if (idxMod !== undefined && idxMod >= 0 && exc.modalidadesInscritas) {
                  exc.modalidadesInscritas.splice(idxMod, 1);
                  atletasAlteradosIds.add(exc.id);
                  atletasAjustados++;
                }
              }
            }

            // 2. Sanitizar as equipes cadastradas em `inscricoes`
            const equipesDestaMod = inscricoes.filter(i =>
              i.escolaId === esc.id &&
              (i.modalidadeCodigo === mod.codigo || i.modalidadeNome.toLowerCase().includes(mod.nome.toLowerCase())) &&
              i.categoria === cat &&
              i.sexo === sx
            );

            if (equipesDestaMod.length > 0) {
              equipesDestaMod.sort((a, b) => (a.numeroEquipe || 1) - (b.numeroEquipe || 1));

              // Se há mais equipes que o permitido pelo regulamento (ex: Queimada só permite 1)
              if (equipesDestaMod.length > maxEquipes) {
                const excedentesEq = equipesDestaMod.slice(maxEquipes);
                for (const eq of excedentesEq) {
                  inscricoesExcluidasIds.push(eq.id);
                  inscricoesRemovidas++;
                }
              }

              // Para as equipes mantidas (até maxEquipes):
              const mantidasEq = equipesDestaMod.slice(0, maxEquipes);
              const atletasValidos = atletas
                .filter(a =>
                  a.escolaId === esc.id &&
                  a.categoriaCalculada === cat &&
                  a.sexo === sx &&
                  a.modalidadesInscritas?.some(m =>
                    m.modalidadeCodigo === mod.codigo ||
                    m.modalidadeNome.toLowerCase().includes(mod.nome.toLowerCase())
                  )
                )
                .sort((a, b) => {
                  const seqA = extrairSequencia(a.matricula || a.crachaToken);
                  const seqB = extrairSequencia(b.matricula || b.crachaToken);
                  return seqA - seqB;
                });

              mantidasEq.forEach((eq, eqIdx) => {
                const start = eqIdx * maxAtletas;
                const end = start + maxAtletas;
                const atletasDoTime = atletasValidos.slice(start, end);
                const novosIds = atletasDoTime.map(a => a.id);
                const idsAtuais = eq.atletaIds || [];

                const precisaAjustar = idsAtuais.length !== novosIds.length ||
                  !idsAtuais.every((id, i) => id === novosIds[i]);

                if (precisaAjustar) {
                  eq.atletaIds = novosIds;
                  if (eq.provasPorAtleta) {
                    const novasProvas: Record<string, string[]> = {};
                    novosIds.forEach(id => {
                      if (eq.provasPorAtleta?.[id]) novasProvas[id] = eq.provasPorAtleta[id];
                    });
                    eq.provasPorAtleta = novasProvas;
                  }
                  eq.updatedAt = new Date().toISOString();
                  inscricoesAjustadas++;
                }
              });
            }
          }
        }
      }
    }

    if (atletasAjustados > 0) {
      localStorage.setItem(STORAGE_KEYS.ATLETAS, JSON.stringify(atletas));
      for (const id of atletasAlteradosIds) {
        const atl = atletas.find(a => a.id === id);
        if (atl) {
          JegdCloudSync.syncAtleta(atl).catch(() => {});
        }
      }
    }

    if (inscricoesRemovidas > 0 || inscricoesAjustadas > 0) {
      inscricoes = inscricoes.filter(i => !inscricoesExcluidasIds.includes(i.id));
      localStorage.setItem(STORAGE_KEYS.INSCRICOES, JSON.stringify(inscricoes));

      for (const idExcluido of inscricoesExcluidasIds) {
        JegdCloudSync.deleteInscricao(idExcluido).catch(() => {});
      }
      for (const insc of inscricoes) {
        JegdCloudSync.syncInscricao(insc).catch(() => {});
      }
    }

    if (atletasAjustados > 0 || inscricoesRemovidas > 0 || inscricoesAjustadas > 0) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('jegd-data-synced'));
      }
    }

    return { atletasAjustados, inscricoesRemovidas, inscricoesAjustadas };
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

    // 2. Adiciona/atualiza nas equipes vinculadas com BLINDAGEM TOTAL contra excesso de elenco e equipes
    atleta.modalidadesInscritas?.forEach(modInsc => {
      const modObj = modalidadesConfig.find(m => m.codigo === modInsc.modalidadeCodigo);
      if (!modObj) return;

      const maxEquipesPermitidas = JegdsRulesService.getMaxEquipesPorModalidade(modInsc.modalidadeCodigo as any);
      const maxAtletasModalidade = modObj.maxAtletas || 10;
      const tetoTotalVagas = maxEquipesPermitidas * maxAtletasModalidade;

      // 2.1 Verifica se o atleta já está em alguma equipe desta modalidade/categoria/sexo
      let idx = todasInscricoes.findIndex(
        i => i.escolaId === escolaId &&
             i.modalidadeCodigo === modInsc.modalidadeCodigo &&
             i.categoria === cat &&
             i.sexo === atleta.sexo &&
             i.atletaIds.includes(atleta.id)
      );

      // 2.2 Se não está em nenhuma, procura uma equipe aberta que ainda não atingiu o limite de atletas
      if (idx === -1) {
        idx = todasInscricoes.findIndex(
          i => i.escolaId === escolaId &&
               i.modalidadeCodigo === modInsc.modalidadeCodigo &&
               i.categoria === cat &&
               i.sexo === atleta.sexo &&
               i.atletaIds.length < maxAtletasModalidade
        );
      }

      if (idx >= 0) {
        const equipeExistente = todasInscricoes[idx];
        const atletaJaPresente = equipeExistente.atletaIds.includes(atleta.id);
        
        // Só adiciona se o atleta já estiver lá ou se a equipe ainda tiver vaga
        const podeAdicionar = atletaJaPresente || equipeExistente.atletaIds.length < maxAtletasModalidade;

        if (podeAdicionar) {
          const atletaIds = atletaJaPresente
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
        }
      } else {
        // Bloqueio rigoroso: se já atingiu o máximo de equipes permitidas pelo regulamento, NÃO cria equipe excedente!
        const totalEquipesDestaMod = todasInscricoes.filter(
          i => i.escolaId === escolaId &&
               i.modalidadeCodigo === modInsc.modalidadeCodigo &&
               i.categoria === cat &&
               i.sexo === atleta.sexo
        ).length;

        if (totalEquipesDestaMod < maxEquipesPermitidas) {
          const proxNumero = totalEquipesDestaMod + 1;

          const novaInsc: InscricaoEquipe = {
            id: `insc-${Date.now()}-${modInsc.modalidadeCodigo}-eq${proxNumero}`,
            municipioId: curMun.id,
            escolaId,
            modalidadeCodigo: modInsc.modalidadeCodigo,
            modalidadeNome: modObj.nome,
            categoria: cat,
            sexo: atleta.sexo,
            numeroEquipe: proxNumero,
            nomeEquipe: proxNumero > 1 ? `${modObj.nome} - Equipe ${proxNumero}` : modObj.nome,
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
      }
    });

    todasInscricoes = todasInscricoes.filter(i => i.atletaIds.length > 0);
    this.safeSetItem(STORAGE_KEYS.INSCRICOES, JSON.stringify(todasInscricoes));

    // Sincroniza em tempo real as equipes da escola atualizadas com o banco de dados
    const equipesParaSincronizar = todasInscricoes.filter(i => i.escolaId === escolaId);
    for (const eq of equipesParaSincronizar) {
      JegdCloudSync.syncInscricao(eq).catch(() => {});
    }
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
    const list = this.getAllUsuarios();
    const userCpfLimpo = (userToSave.cpf || '').replace(/\D/g, '');
    const idx = list.findIndex(u => {
      if (u.id === userToSave.id) return true;
      if (userCpfLimpo && (u.cpf || '').replace(/\D/g, '') === userCpfLimpo) return true;
      if (userToSave.email && u.email?.toLowerCase() === userToSave.email.toLowerCase()) return true;
      return false;
    });
    if (idx >= 0) list[idx] = userToSave;
    else list.push(userToSave);
    localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(list));
    JegdCloudSync.syncUsuario(userToSave).catch(() => {});
  }

  public static setCurrentUser(user: any | null): void {
    if (!this.isClient()) return;
    if (user) this.safeSetItem(STORAGE_KEYS.CURRENT_AUTH_USER, JSON.stringify(user));
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

  // ==========================================
  // PERFIS DA ESCOLA (DIREÇÃO / PROFESSORES - ESTILO NETFLIX)
  // ==========================================

  public static getProfessoresEscola(escolaId: string): ProfessorPerfil[] {
    if (!this.isClient()) return [];
    this.init();
    const data = localStorage.getItem(STORAGE_KEYS.PROFESSORES_ESCOLA);
    const list: ProfessorPerfil[] = data ? JSON.parse(data) : [];
    return list.filter(p => p.escolaId === escolaId);
  }

  public static saveProfessorEscola(escolaId: string, nome: string, telefone?: string): ProfessorPerfil {
    if (!this.isClient()) {
      return { id: `prof-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, escolaId, nome, telefone, createdAt: new Date().toISOString() };
    }
    const data = localStorage.getItem(STORAGE_KEYS.PROFESSORES_ESCOLA);
    const list: ProfessorPerfil[] = data ? JSON.parse(data) : [];
    const novo: ProfessorPerfil = {
      id: `prof-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      escolaId,
      nome: nome.trim(),
      telefone: telefone?.trim(),
      createdAt: new Date().toISOString()
    };
    list.push(novo);
    localStorage.setItem(STORAGE_KEYS.PROFESSORES_ESCOLA, JSON.stringify(list));
    return novo;
  }

  public static deleteProfessorEscola(escolaId: string, profId: string): void {
    if (!this.isClient()) return;
    const data = localStorage.getItem(STORAGE_KEYS.PROFESSORES_ESCOLA);
    const list: ProfessorPerfil[] = data ? JSON.parse(data) : [];
    const updated = list.filter(p => !(p.escolaId === escolaId && p.id === profId));
    localStorage.setItem(STORAGE_KEYS.PROFESSORES_ESCOLA, JSON.stringify(updated));
  }

  public static getCurrentPerfilEscola(): PerfilAtivoEscola | null {
    if (!this.isClient()) return null;
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_PERFIL_ESCOLA);
    return data ? JSON.parse(data) : null;
  }

  public static setCurrentPerfilEscola(perfil: PerfilAtivoEscola | null): void {
    if (!this.isClient()) return;
    if (perfil) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_PERFIL_ESCOLA, JSON.stringify(perfil));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_PERFIL_ESCOLA);
    }
  }

  // ==========================================
  // HOMOLOGAÇÃO DA DELEGAÇÃO PELA DIREÇÃO
  // ==========================================

  public static getHomologacaoDirecao(escolaId: string): HomologacaoDirecao {
    if (!this.isClient()) return { homologado: false };
    const data = localStorage.getItem(STORAGE_KEYS.HOMOLOGACOES_DIRECAO);
    const map: Record<string, HomologacaoDirecao> = data ? JSON.parse(data) : {};
    return map[escolaId] || { homologado: false };
  }

  public static setHomologacaoDirecao(escolaId: string, homologado: boolean, diretorNome?: string, observacoes?: string): void {
    if (!this.isClient()) return;
    const data = localStorage.getItem(STORAGE_KEYS.HOMOLOGACOES_DIRECAO);
    const map: Record<string, HomologacaoDirecao> = data ? JSON.parse(data) : {};
    map[escolaId] = {
      homologado,
      dataHomologacao: homologado ? new Date().toISOString() : undefined,
      responsavelNome: diretorNome || 'Direção Escolar',
      observacoes
    };
    localStorage.setItem(STORAGE_KEYS.HOMOLOGACOES_DIRECAO, JSON.stringify(map));
  }
}

