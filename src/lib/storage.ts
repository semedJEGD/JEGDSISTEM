import {
  Escola,
  Atleta,
  MembroComissao,
  ModalidadeConfig,
  InscricaoEquipe,
  ComunicadoAviso,
  CategoriaIdade,
  ModalidadeCodigo,
  Genero
} from '@/types/jegd';
import { JegdsRulesService } from '@/services/jegds-rules';

export const MODALIDADES_OFICIAIS_JEGDS: ModalidadeConfig[] = [
  {
    id: 'queimada',
    codigo: 'queimada',
    nome: 'Queimada',
    tipo: 'COLETIVA',
    dataEvento: '2026-11-28',
    prazoInscricao: '2026-11-21',
    categoriasPermitidas: ['MIRIM', 'INFANTIL', 'INFANTO', 'JUNIOR'],
    sexosPermitidos: ['FEMININO', 'MASCULINO'],
    minAtletas: 8,
    maxAtletas: 12,
    maxProvasPorAtleta: 1,
    descricao: 'Dinâmica de 8 atletas em quadra. Masculino e Feminino em todas as 4 categorias.',
    localPadrao: 'Quadra Poliesportiva Municipal de Gonçalves Dias'
  },
  {
    id: 'tenis_mesa',
    codigo: 'tenis_mesa',
    nome: 'Tênis de Mesa',
    tipo: 'INDIVIDUAL',
    dataEvento: '2026-11-28',
    prazoInscricao: '2026-11-21',
    categoriasPermitidas: ['INFANTIL', 'INFANTO', 'JUNIOR'],
    sexosPermitidos: ['MASCULINO'],
    minAtletas: 1,
    maxAtletas: 4,
    maxProvasPorAtleta: 1,
    descricao: 'Exclusivamente Masculino a partir do Infantil (12 anos). Não existe categoria Mirim.',
    localPadrao: 'Centro Esportivo Municipal'
  },
  {
    id: 'atletismo',
    codigo: 'atletismo',
    nome: 'Atletismo',
    tipo: 'INDIVIDUAL',
    dataEvento: '2026-12-05',
    prazoInscricao: '2026-11-28',
    categoriasPermitidas: ['MIRIM', 'INFANTIL', 'INFANTO', 'JUNIOR'],
    sexosPermitidos: ['FEMININO', 'MASCULINO'],
    minAtletas: 1,
    maxAtletas: 8,
    maxProvasPorAtleta: 2,
    provasDisponiveis: ['75m', '100m', '200m', '400m', '1000m', 'salto'],
    descricao: 'Máximo 2 provas por atleta. Mirim (75m, 100m); Infantil (75m, 100m, 200m, salto); Infanto/Junior (100m, 200m, 400m, 1000m, salto).',
    localPadrao: 'Pista de Atletismo Municipal'
  },
  {
    id: 'beach_soccer',
    codigo: 'beach_soccer',
    nome: 'Beach Soccer',
    tipo: 'COLETIVA',
    dataEvento: '2026-12-05',
    prazoInscricao: '2026-11-28',
    categoriasPermitidas: ['INFANTIL', 'INFANTO', 'JUNIOR'],
    sexosPermitidos: ['MASCULINO'],
    minAtletas: 5,
    maxAtletas: 12,
    maxProvasPorAtleta: 1,
    descricao: 'Exclusivamente Masculino na areia a partir do Infantil (12 anos). Não existe Mirim.',
    localPadrao: 'Arena de Areia de Gonçalves Dias'
  },
  {
    id: 'futsal',
    codigo: 'futsal',
    nome: 'Futsal',
    tipo: 'COLETIVA',
    dataEvento: '2026-12-12',
    prazoInscricao: '2026-12-05',
    categoriasPermitidas: ['MIRIM', 'INFANTIL', 'INFANTO', 'JUNIOR'],
    sexosPermitidos: ['FEMININO', 'MASCULINO'],
    minAtletas: 5,
    maxAtletas: 10,
    maxProvasPorAtleta: 1,
    descricao: 'Máximo 10 atletas inscritos por equipe/categoria/sexo. Fase de grupos até finais.',
    localPadrao: 'Ginásio Municipal Central'
  },
  {
    id: 'xadrez',
    codigo: 'xadrez',
    nome: 'Xadrez',
    tipo: 'INDIVIDUAL',
    dataEvento: '2026-12-12',
    prazoInscricao: '2026-12-05',
    categoriasPermitidas: ['MIRIM', 'INFANTIL', 'INFANTO', 'JUNIOR'],
    sexosPermitidos: ['FEMININO', 'MASCULINO'],
    minAtletas: 1,
    maxAtletas: 4,
    maxProvasPorAtleta: 1,
    descricao: 'Disputa em Sistema Suíço para todas as idades e ambos os sexos.',
    localPadrao: 'Salão Comunitário da SEMED'
  },
  {
    id: 'futebol_campo',
    codigo: 'futebol_campo',
    nome: 'Futebol de Campo',
    tipo: 'COLETIVA',
    dataEvento: '2026-12-12',
    prazoInscricao: '2026-12-05',
    categoriasPermitidas: ['MIRIM', 'INFANTIL', 'INFANTO', 'JUNIOR'],
    sexosPermitidos: ['MASCULINO'],
    minAtletas: 11,
    maxAtletas: 20,
    maxProvasPorAtleta: 1,
    descricao: 'Exclusivamente Masculino. Elenco com no máximo 20 atletas por equipe.',
    localPadrao: 'Estádio Municipal de Gonçalves Dias'
  },
  {
    id: 'voleibol',
    codigo: 'voleibol',
    nome: 'Voleibol',
    tipo: 'COLETIVA',
    dataEvento: '2026-12-12',
    prazoInscricao: '2026-12-05',
    categoriasPermitidas: ['INFANTIL', 'INFANTO', 'JUNIOR'],
    sexosPermitidos: ['MASCULINO'],
    minAtletas: 6,
    maxAtletas: 12,
    maxProvasPorAtleta: 1,
    descricao: 'Exclusivamente Masculino a partir do Infantil (12 anos). Não existe categoria Mirim.',
    localPadrao: 'Ginásio Municipal de Esportes'
  }
];

export const ESCOLAS_GONCALVES_DIAS: Escola[] = [
  {
    id: 'esc-aldenora-araujo',
    nome: 'Aldenora Araújo',
    sigla: 'ALDENORA ARAÚJO',
    inep: '21004501',
    rede: 'MUNICIPAL',
    bairro: 'Centro',
    endereco: 'Gonçalves Dias - MA',
    responsavelNome: 'Direção / Coordenação',
    responsavelTelefone: '(99) 98801-0001',
    loginEmail: 'aldenora@semed.gd.gov.br',
    senhaHash: '123456',
    createdAt: new Date().toISOString()
  },
  {
    id: 'esc-anisio-gomes',
    nome: 'Anísio Gomes',
    sigla: 'ANÍSIO GOMES',
    inep: '21004502',
    rede: 'MUNICIPAL',
    bairro: 'Centro',
    endereco: 'Gonçalves Dias - MA',
    responsavelNome: 'Direção / Coordenação',
    responsavelTelefone: '(99) 98801-0002',
    loginEmail: 'anisiogomes@semed.gd.gov.br',
    senhaHash: '123456',
    createdAt: new Date().toISOString()
  },
  {
    id: 'esc-anita-furtado',
    nome: 'Anita Furtado',
    sigla: 'ANITA FURTADO',
    inep: '21004503',
    rede: 'MUNICIPAL',
    bairro: 'Bairro Novo',
    endereco: 'Gonçalves Dias - MA',
    responsavelNome: 'Direção / Coordenação',
    responsavelTelefone: '(99) 98801-0003',
    loginEmail: 'anitafurtado@semed.gd.gov.br',
    senhaHash: '123456',
    createdAt: new Date().toISOString()
  },
  {
    id: 'esc-antonio-goncalves-dias',
    nome: 'Antônio Gonçalves Dias',
    sigla: 'ANTÔNIO GD',
    inep: '21004504',
    rede: 'MUNICIPAL',
    bairro: 'Centro',
    endereco: 'Gonçalves Dias - MA',
    responsavelNome: 'Direção / Coordenação',
    responsavelTelefone: '(99) 98801-0004',
    loginEmail: 'antoniogd@semed.gd.gov.br',
    senhaHash: '123456',
    createdAt: new Date().toISOString()
  },
  {
    id: 'esc-basilio-alves',
    nome: 'Basílio Alves',
    sigla: 'BASÍLIO ALVES',
    inep: '21004505',
    rede: 'MUNICIPAL',
    bairro: 'Zona Rural',
    endereco: 'Gonçalves Dias - MA',
    responsavelNome: 'Direção / Coordenação',
    responsavelTelefone: '(99) 98801-0005',
    loginEmail: 'basilioalves@semed.gd.gov.br',
    senhaHash: '123456',
    createdAt: new Date().toISOString()
  },
  {
    id: 'esc-emilio-murad',
    nome: 'Emílio Murad',
    sigla: 'EMÍLIO MURAD',
    inep: '21004506',
    rede: 'MUNICIPAL',
    bairro: 'Centro',
    endereco: 'Gonçalves Dias - MA',
    responsavelNome: 'Direção / Coordenação',
    responsavelTelefone: '(99) 98801-0006',
    loginEmail: 'emiliomurad@semed.gd.gov.br',
    senhaHash: '123456',
    createdAt: new Date().toISOString()
  },
  {
    id: 'esc-jose-correa-lima',
    nome: 'José Corrêa Lima',
    sigla: 'JOSÉ CORRÊA',
    inep: '21004507',
    rede: 'MUNICIPAL',
    bairro: 'Centro',
    endereco: 'Gonçalves Dias - MA',
    responsavelNome: 'Direção / Coordenação',
    responsavelTelefone: '(99) 98801-0007',
    loginEmail: 'josecorrea@semed.gd.gov.br',
    senhaHash: '123456',
    createdAt: new Date().toISOString()
  },
  {
    id: 'esc-jose-goncalves-dias',
    nome: 'José Gonçalves Dias',
    sigla: 'JOSÉ GD',
    inep: '21004508',
    rede: 'MUNICIPAL',
    bairro: 'Centro',
    endereco: 'Gonçalves Dias - MA',
    responsavelNome: 'Direção / Coordenação',
    responsavelTelefone: '(99) 98801-0008',
    loginEmail: 'josegd@semed.gd.gov.br',
    senhaHash: '123456',
    createdAt: new Date().toISOString()
  },
  {
    id: 'esc-raimundo-reis',
    nome: 'Raimundo Reis',
    sigla: 'RAIMUNDO REIS',
    inep: '21004509',
    rede: 'MUNICIPAL',
    bairro: 'Bairro Novo',
    endereco: 'Gonçalves Dias - MA',
    responsavelNome: 'Direção / Coordenação',
    responsavelTelefone: '(99) 98801-0009',
    loginEmail: 'raimundoreis@semed.gd.gov.br',
    senhaHash: '123456',
    createdAt: new Date().toISOString()
  },
  {
    id: 'esc-ce-sulamita-lucio',
    nome: 'C.E Sulamita Lúcio',
    sigla: 'C.E SULAMITA LÚCIO',
    inep: '21004510',
    rede: 'ESTADUAL',
    bairro: 'Centro',
    endereco: 'Gonçalves Dias - MA',
    responsavelNome: 'Direção / Coordenação',
    responsavelTelefone: '(99) 98801-0010',
    loginEmail: 'sulamitalucio@educacao.ma.gov.br',
    senhaHash: '123456',
    createdAt: new Date().toISOString()
  },
  {
    id: 'esc-ue-benta-vilanova',
    nome: 'U.E Benta Vilanova',
    sigla: 'U.E BENTA VILANOVA',
    inep: '21004511',
    rede: 'MUNICIPAL',
    bairro: 'Centro',
    endereco: 'Gonçalves Dias - MA',
    responsavelNome: 'Direção / Coordenação',
    responsavelTelefone: '(99) 98801-0011',
    loginEmail: 'bentavilanova@semed.gd.gov.br',
    senhaHash: '123456',
    createdAt: new Date().toISOString()
  },
  {
    id: 'esc-cietec',
    nome: 'C.I.E.T.E.C',
    sigla: 'C.I.E.T.E.C',
    inep: '21004512',
    rede: 'MUNICIPAL',
    bairro: 'Centro',
    endereco: 'Gonçalves Dias - MA',
    responsavelNome: 'Direção / Coordenação',
    responsavelTelefone: '(99) 98801-0012',
    loginEmail: 'cietec@semed.gd.gov.br',
    senhaHash: '123456',
    createdAt: new Date().toISOString()
  }
];

export const COMUNICADOS_JEGDS: ComunicadoAviso[] = [
  {
    id: 'aviso-01',
    titulo: 'Regulamento Oficial do JEGDS 2026 - Gonçalves Dias Publicado',
    conteudo: 'A SEMED e o Comitê Organizador convidam todas as 12 escolas oficiais a realizarem as inscrições de seus alunos nas 8 modalidades. O evento ocorre entre 21/11/2026 e 19/12/2026.',
    categoria: 'REGULAMENTO',
    dataPublicacao: '14/09/2026',
    urgente: true,
    autor: 'Comitê Organizador JEGDS 2026'
  },
  {
    id: 'aviso-02',
    titulo: 'Prazos de Inscrição: 7 dias de antecedência de cada modalidade',
    conteudo: 'Atenção aos prazos de encerramento: Queimada e Tênis de Mesa encerram em 21/11; Atletismo e Beach Soccer em 28/11; Futsal, Xadrez, Futebol e Voleibol em 05/12.',
    categoria: 'CRONOGRAMA',
    dataPublicacao: '14/09/2026',
    urgente: false,
    autor: 'Coordenação Geral de Desporto'
  }
];

const STORAGE_KEYS = {
  ESCOLAS: 'jegds_escolas_v4',
  ATLETAS: 'jegds_atletas_v4',
  COMISSAO: 'jegds_comissao_v4',
  INSCRICOES: 'jegds_inscricoes_v4',
  MODALIDADES: 'jegds_modalidades_v4',
  COMUNICADOS: 'jegds_comunicados_v4',
  USUARIOS: 'jegds_usuarios_v4',
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

    if (!localStorage.getItem(STORAGE_KEYS.ATLETAS)) {
      const atletasExemplo: Atleta[] = [
        {
          id: 'atl-01',
          escolaId: 'esc-01',
          nomeCompleto: 'Lucas Gabriel Morais',
          dataNascimento: '2016-04-12', // 10 anos -> MIRIM
          sexo: 'MASCULINO',
          documentoTipo: 'RG',
          documentoNumero: '054.912.880-12',
          matricula: '2026-GD-001',
          serieTurma: '5º Ano A',
          nomeMae: 'Tereza Morais',
          telefoneContato: '(99) 98112-9900',
          tipoSanguineo: 'O+',
          consentimentoResponsavel: true,
          documentos: {},
          ativo: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'atl-02',
          escolaId: 'esc-01',
          nomeCompleto: 'Matheus Henrique Sousa',
          dataNascimento: '2013-06-20', // 13 anos -> INFANTIL
          sexo: 'MASCULINO',
          documentoTipo: 'RG',
          documentoNumero: '061.229.450-33',
          matricula: '2026-GD-002',
          serieTurma: '7º Ano B',
          nomeMae: 'Francisca Sousa',
          telefoneContato: '(99) 98455-8811',
          tipoSanguineo: 'A+',
          consentimentoResponsavel: true,
          documentos: {},
          ativo: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'atl-03',
          escolaId: 'esc-01',
          nomeCompleto: 'Beatriz Vasconcelos Lima',
          dataNascimento: '2010-08-15', // 16 anos -> INFANTO
          sexo: 'FEMININO',
          documentoTipo: 'CERTIDAO',
          documentoNumero: 'Termo 1245 Lv 12 Fl 90',
          matricula: '2026-GD-003',
          serieTurma: '1º Ano EM',
          nomeMae: 'Maria de Fátima Lima',
          telefoneContato: '(99) 98844-3322',
          tipoSanguineo: 'B+',
          consentimentoResponsavel: true,
          documentos: {},
          ativo: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'atl-04',
          escolaId: 'esc-02',
          nomeCompleto: 'João Victor da Silva',
          dataNascimento: '2007-03-10', // 19 anos -> JUNIOR
          sexo: 'MASCULINO',
          documentoTipo: 'RG',
          documentoNumero: '039.882.112-55',
          matricula: '2026-GD-004',
          serieTurma: '3º Ano EM',
          nomeMae: 'Raimunda Silva',
          telefoneContato: '(99) 99122-0044',
          tipoSanguineo: 'AB+',
          consentimentoResponsavel: true,
          documentos: {},
          ativo: true,
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(STORAGE_KEYS.ATLETAS, JSON.stringify(atletasExemplo));
    }

    if (!localStorage.getItem(STORAGE_KEYS.INSCRICOES)) {
      const inscricoesExemplo: InscricaoEquipe[] = [
        {
          id: 'insc-01',
          escolaId: 'esc-01',
          modalidadeCodigo: 'futsal',
          modalidadeNome: 'Futsal',
          categoria: 'INFANTIL',
          sexo: 'MASCULINO',
          atletaIds: ['atl-02'],
          comissaoIds: [],
          status: 'VALIDADA',
          parecerComite: 'Inscrição homologada pelo Comitê Organizador.',
          dataInscricao: '14/09/2026 10:00',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(STORAGE_KEYS.INSCRICOES, JSON.stringify(inscricoesExemplo));
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
}

