import {
  Escola,
  Atleta,
  MembroComissao,
  ModalidadeConfig,
  InscricaoEquipe,
  ComunicadoAviso,
  PartidaChave,
  CategoriaIdade
} from '@/types/jegd';

export const MODALIDADES_PADRAO: ModalidadeConfig[] = [
  {
    id: 'futsal',
    nome: 'Futsal',
    tipo: 'COLETIVA',
    generos: ['MASCULINO', 'FEMININO'],
    categorias: ['INFANTIL', 'INFANTO'],
    minAtletas: 5,
    maxAtletas: 12,
    maxComissao: 2,
    icone: 'Activity',
    descricao: 'Disputa em quadra poliesportiva oficial com goleiro e 4 na linha.',
    localPadrao: 'Ginásio Poliesportivo Municipal'
  },
  {
    id: 'voleibol',
    nome: 'Voleibol',
    tipo: 'COLETIVA',
    generos: ['MASCULINO', 'FEMININO'],
    categorias: ['INFANTIL', 'INFANTO'],
    minAtletas: 6,
    maxAtletas: 12,
    maxComissao: 2,
    icone: 'Layers',
    descricao: 'Partidas com melhor de 3 sets (25 pontos) e tie-break.',
    localPadrao: 'Quadra Central de Esportes'
  },
  {
    id: 'handebol',
    nome: 'Handebol',
    tipo: 'COLETIVA',
    generos: ['MASCULINO', 'FEMININO'],
    categorias: ['INFANTIL', 'INFANTO'],
    minAtletas: 7,
    maxAtletas: 14,
    maxComissao: 2,
    icone: 'Shield',
    descricao: 'Dois tempos de 20 min com regras oficiais CBHb.',
    localPadrao: 'Ginásio Municipal II'
  },
  {
    id: 'basquetebol',
    nome: 'Basquetebol',
    tipo: 'COLETIVA',
    generos: ['MASCULINO', 'FEMININO'],
    categorias: ['INFANTIL', 'INFANTO'],
    minAtletas: 5,
    maxAtletas: 12,
    maxComissao: 2,
    icone: 'Flame',
    descricao: '4 quartos de 8 minutos com cronometragem oficial.',
    localPadrao: 'Arena Escolar SEMED'
  },
  {
    id: 'atletismo',
    nome: 'Atletismo',
    tipo: 'INDIVIDUAL',
    generos: ['MASCULINO', 'FEMININO'],
    categorias: ['INFANTIL', 'INFANTO'],
    minAtletas: 1,
    maxAtletas: 8,
    maxComissao: 1,
    icone: 'Zap',
    descricao: 'Provas de 75m, 100m, 200m, 800m, Revezamento 4x75m e Salto em Distância.',
    localPadrao: 'Pista de Atletismo Municipal'
  },
  {
    id: 'xadrez',
    nome: 'Xadrez',
    tipo: 'INDIVIDUAL',
    generos: ['MASCULINO', 'FEMININO'],
    categorias: ['INFANTIL', 'INFANTO'],
    minAtletas: 1,
    maxAtletas: 4,
    maxComissao: 1,
    icone: 'Grid',
    descricao: 'Sistema Suíço de emparceiramento em 5 rodadas de 15 minutos.',
    localPadrao: 'Salão Nobre da SEMED'
  },
  {
    id: 'tenis-de-mesa',
    nome: 'Tênis de Mesa',
    tipo: 'INDIVIDUAL',
    generos: ['MASCULINO', 'FEMININO'],
    categorias: ['INFANTIL', 'INFANTO'],
    minAtletas: 1,
    maxAtletas: 4,
    maxComissao: 1,
    icone: 'CircleDot',
    descricao: 'Disputas individuais e duplas em melhor de 5 sets de 11 pontos.',
    localPadrao: 'Centro de Treinamento Municipal'
  },
  {
    id: 'badminton',
    nome: 'Badminton',
    tipo: 'INDIVIDUAL',
    generos: ['MASCULINO', 'FEMININO'],
    categorias: ['INFANTIL', 'INFANTO'],
    minAtletas: 1,
    maxAtletas: 4,
    maxComissao: 1,
    icone: 'Wind',
    descricao: 'Disputa individual e duplas simples com peteca oficial.',
    localPadrao: 'Ginásio Escolar Anexo'
  },
  {
    id: 'natacao',
    nome: 'Natação',
    tipo: 'INDIVIDUAL',
    generos: ['MASCULINO', 'FEMININO'],
    categorias: ['INFANTIL', 'INFANTO'],
    minAtletas: 1,
    maxAtletas: 6,
    maxComissao: 1,
    icone: 'Waves',
    descricao: 'Provas de 50m Livre, 50m Costas, 50m Peito e Revezamento 4x50m.',
    localPadrao: 'Parque Aquático Municipal'
  },
  {
    id: 'judo',
    nome: 'Judô',
    tipo: 'INDIVIDUAL',
    generos: ['MASCULINO', 'FEMININO'],
    categorias: ['INFANTIL', 'INFANTO'],
    minAtletas: 1,
    maxAtletas: 6,
    maxComissao: 1,
    icone: 'Award',
    descricao: 'Categorias de peso Superligeiro até Pesado.',
    localPadrao: 'Dojô Municipal'
  },
  {
    id: 'queimada',
    nome: 'Queimada Escolar',
    tipo: 'COLETIVA',
    generos: ['MASCULINO', 'FEMININO', 'MISTO'],
    categorias: ['INFANTIL'],
    minAtletas: 6,
    maxAtletas: 10,
    maxComissao: 1,
    icone: 'Target',
    descricao: 'Modalidade de integração esportiva e recreativa escolar.',
    localPadrao: 'Quadra da Escola Municipal Polo'
  }
];

export const ESCOLAS_PADRAO: Escola[] = [
  {
    id: 'esc-01',
    nome: 'E.M. Prof. Darcy Ribeiro',
    sigla: 'DARCY',
    inep: '21094812',
    rede: 'MUNICIPAL',
    bairro: 'Centro',
    endereco: 'Av. dos Estudantes, 450 - Centro',
    diretorNome: 'Profa. Maria do Carmo Santos',
    professorRespNome: 'Prof. Carlos Eduardo Silveira (CREF 012498-G/MA)',
    telefone: '(98) 98822-1010',
    email: 'darcyribeiro@semed.edu.br',
    senhaHash: '123456',
    createdAt: new Date().toISOString()
  },
  {
    id: 'esc-02',
    nome: 'E.M. Cora Coralina',
    sigla: 'CORA',
    inep: '21087421',
    rede: 'MUNICIPAL',
    bairro: 'Planalto',
    endereco: 'Rua das Flores, 110 - Planalto',
    diretorNome: 'Prof. Marcos Vinícius Lima',
    professorRespNome: 'Profa. Juliana Mendes Rocha (CREF 009843-G/MA)',
    telefone: '(98) 98711-2020',
    email: 'coracoralina@semed.edu.br',
    senhaHash: '123456',
    createdAt: new Date().toISOString()
  },
  {
    id: 'esc-03',
    nome: 'Centro de Ensino Dr. Paulo Freire',
    sigla: 'CEDPF',
    inep: '21056344',
    rede: 'ESTADUAL',
    bairro: 'Nova Cidade',
    endereco: 'Av. Brasil, 1500 - Nova Cidade',
    diretorNome: 'Profa. Helena Albuquerque',
    professorRespNome: 'Prof. Rodrigo Tavares (CREF 015672-G/MA)',
    telefone: '(98) 98455-3030',
    email: 'ce.paulofreire@educacao.gov.br',
    senhaHash: '123456',
    createdAt: new Date().toISOString()
  },
  {
    id: 'esc-04',
    nome: 'Colégio Integrado Santa Tereza',
    sigla: 'CIST',
    inep: '21012988',
    rede: 'PARTICULAR',
    bairro: 'Jardim América',
    endereco: 'Rua Dom Pedro II, 320 - Jardim América',
    diretorNome: 'Irmã Ana Lúcia Ferreira',
    professorRespNome: 'Prof. Daniel Morais Barbosa (CREF 008711-G/MA)',
    telefone: '(98) 98112-4040',
    email: 'santatereza@colegio.com.br',
    senhaHash: '123456',
    createdAt: new Date().toISOString()
  },
  {
    id: 'esc-05',
    nome: 'Instituto Federal (IFMA / Campus JEGD)',
    sigla: 'IFMA',
    inep: '21000109',
    rede: 'FEDERAL',
    bairro: 'Distrito Universitário',
    endereco: 'Rodovia MA-020, Km 4',
    diretorNome: 'Dr. Valter da Silva Neves',
    professorRespNome: 'Prof. Thiago Fagundes (CREF 019800-G/MA)',
    telefone: '(98) 99120-5500',
    email: 'ifma.esportes@ifma.edu.br',
    senhaHash: '123456',
    createdAt: new Date().toISOString()
  }
];

export const COMUNICADOS_PADRAO: ComunicadoAviso[] = [
  {
    id: 'aviso-01',
    titulo: 'Abertura Oficial do Período de Inscrições - JEGD 2026',
    conteudo: 'A Secretaria Municipal de Educação (SEMED) e a Coordenação Geral dos Jogos Escolares informam que as inscrições oficiais de escolas e estudantes-atletas estão abertas até o dia 30 deste mês.',
    categoria: 'CRONOGRAMA',
    dataPublicacao: '14/09/2026',
    urgente: true,
    autor: 'Coordenação Geral JEGD / SEMED'
  },
  {
    id: 'aviso-02',
    titulo: 'Regulamento Geral e Normas de Elegibilidade Publicados',
    conteudo: 'Confira as regras por modalidade, limites de idade para as categorias Infantil (12 a 14 anos - nascidos entre 2012 e 2014) e Infanto (15 a 17 anos - nascidos entre 2009 e 2011).',
    categoria: 'REGULAMENTO',
    dataPublicacao: '12/09/2026',
    urgente: false,
    autor: 'Comissão Técnica de Arbitragem'
  },
  {
    id: 'aviso-03',
    titulo: 'Obrigatoriedade de Foto 3x4 e Documento Oficial com Foto para Crachá',
    conteudo: 'Todos os atletas deverão portar o Crachá Oficial com QR Code gerado pelo sistema para ingresso nas partidas e eventos do JEGD. Certifique-se de anexar fotos nítidas dos estudantes.',
    categoria: 'ALERTA',
    dataPublicacao: '10/09/2026',
    urgente: false,
    autor: 'Comissão de Credenciamento SEMED'
  }
];

const STORAGE_KEYS = {
  ESCOLAS: 'jegd_escolas_v1',
  ATLETAS: 'jegd_atletas_v1',
  COMISSAO: 'jegd_comissao_v1',
  INSCRICOES: 'jegd_inscricoes_v1',
  MODALIDADES: 'jegd_modalidades_v1',
  COMUNICADOS: 'jegd_comunicados_v1',
  PARTIDAS: 'jegd_partidas_v1',
  CURRENT_AUTH_ESCOLA: 'jegd_current_escola_auth',
  ADMIN_AUTH: 'jegd_admin_auth'
};

export class JegdStorage {
  private static isClient(): boolean {
    return typeof window !== 'undefined';
  }

  // Inicializa dados padrão caso não existam
  public static init(): void {
    if (!this.isClient()) return;

    if (!localStorage.getItem(STORAGE_KEYS.ESCOLAS)) {
      localStorage.setItem(STORAGE_KEYS.ESCOLAS, JSON.stringify(ESCOLAS_PADRAO));
    }

    if (!localStorage.getItem(STORAGE_KEYS.MODALIDADES)) {
      localStorage.setItem(STORAGE_KEYS.MODALIDADES, JSON.stringify(MODALIDADES_PADRAO));
    }

    if (!localStorage.getItem(STORAGE_KEYS.COMUNICADOS)) {
      localStorage.setItem(STORAGE_KEYS.COMUNICADOS, JSON.stringify(COMUNICADOS_PADRAO));
    }

    if (!localStorage.getItem(STORAGE_KEYS.ATLETAS)) {
      const atletasExemplo: Atleta[] = [
        {
          id: 'atl-01',
          escolaId: 'esc-01',
          nomeCompleto: 'Gabriel Henrique dos Santos',
          dataNascimento: '2012-05-14',
          cpf: '054.892.113-09',
          rg: '349812-SSP/MA',
          matricula: '20260012',
          serieTurma: '7º Ano B',
          genero: 'MASCULINO',
          nomeMae: 'Tatiana dos Santos',
          telefoneContato: '(98) 98844-3322',
          tipoSanguineo: 'O+',
          documentos: {},
          ativo: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'atl-02',
          escolaId: 'esc-01',
          nomeCompleto: 'Lucas Gabriel Pires',
          dataNascimento: '2012-08-20',
          cpf: '062.115.980-44',
          rg: '381902-SSP/MA',
          matricula: '20260034',
          serieTurma: '7º Ano A',
          genero: 'MASCULINO',
          nomeMae: 'Silvia Mara Pires',
          telefoneContato: '(98) 98755-1100',
          tipoSanguineo: 'A+',
          documentos: {},
          ativo: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'atl-03',
          escolaId: 'esc-01',
          nomeCompleto: 'Beatriz Vasconcelos de Jesus',
          dataNascimento: '2013-02-11',
          cpf: '071.229.431-88',
          rg: '390145-SSP/MA',
          matricula: '20260055',
          serieTurma: '6º Ano C',
          genero: 'FEMININO',
          nomeMae: 'Rosângela de Jesus',
          telefoneContato: '(98) 98122-9988',
          tipoSanguineo: 'B+',
          documentos: {},
          ativo: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'atl-04',
          escolaId: 'esc-02',
          nomeCompleto: 'Matheus Vinicius Alcantara',
          dataNascimento: '2010-04-18',
          cpf: '049.882.110-33',
          rg: '312890-SSP/MA',
          matricula: '20260190',
          serieTurma: '9º Ano A',
          genero: 'MASCULINO',
          nomeMae: 'Maria de Fátima Alcantara',
          telefoneContato: '(98) 98400-1122',
          tipoSanguineo: 'AB+',
          documentos: {},
          ativo: true,
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(STORAGE_KEYS.ATLETAS, JSON.stringify(atletasExemplo));
    }

    if (!localStorage.getItem(STORAGE_KEYS.COMISSAO)) {
      const comissaoExemplo: MembroComissao[] = [
        {
          id: 'com-01',
          escolaId: 'esc-01',
          nomeCompleto: 'Carlos Eduardo Silveira',
          funcao: 'TECNICO',
          registroProfissional: 'CREF 012498-G/MA',
          cpf: '450.812.990-12',
          telefone: '(98) 98822-1010',
          email: 'carlos.ed@semed.edu.br'
        },
        {
          id: 'com-02',
          escolaId: 'esc-02',
          nomeCompleto: 'Juliana Mendes Rocha',
          funcao: 'TECNICO',
          registroProfissional: 'CREF 009843-G/MA',
          cpf: '512.901.332-88',
          telefone: '(98) 98711-2020',
          email: 'juliana.rocha@semed.edu.br'
        }
      ];
      localStorage.setItem(STORAGE_KEYS.COMISSAO, JSON.stringify(comissaoExemplo));
    }

    if (!localStorage.getItem(STORAGE_KEYS.INSCRICOES)) {
      const inscricaoExemplo: InscricaoEquipe[] = [
        {
          id: 'insc-01',
          escolaId: 'esc-01',
          modalidadeId: 'futsal',
          modalidadeNome: 'Futsal',
          categoria: 'INFANTIL',
          genero: 'MASCULINO',
          atletaIds: ['atl-01', 'atl-02'],
          comissaoIds: ['com-01'],
          status: 'DEFERIDA',
          parecerSemed: 'Documentação validada e deferida pela Coordenação.',
          dataEnvio: '14/09/2026 09:30',
          dataHomologacao: '14/09/2026 10:15',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(STORAGE_KEYS.INSCRICOES, JSON.stringify(inscricaoExemplo));
    }
  }

  // ESCOLAS
  public static getEscolas(): Escola[] {
    if (!this.isClient()) return ESCOLAS_PADRAO;
    this.init();
    const data = localStorage.getItem(STORAGE_KEYS.ESCOLAS);
    return data ? JSON.parse(data) : ESCOLAS_PADRAO;
  }

  public static getEscolaById(id: string): Escola | undefined {
    return this.getEscolas().find(e => e.id === id);
  }

  public static saveEscola(escola: Escola): void {
    if (!this.isClient()) return;
    const escolas = this.getEscolas();
    const index = escolas.findIndex(e => e.id === escola.id);
    if (index >= 0) {
      escolas[index] = escola;
    } else {
      escolas.push(escola);
    }
    localStorage.setItem(STORAGE_KEYS.ESCOLAS, JSON.stringify(escolas));
  }

  // AUTH ESCOLA
  public static setCurrentEscola(escola: Escola | null): void {
    if (!this.isClient()) return;
    if (escola) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_AUTH_ESCOLA, JSON.stringify(escola));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_AUTH_ESCOLA);
    }
  }

  public static getCurrentEscola(): Escola | null {
    if (!this.isClient()) return null;
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_AUTH_ESCOLA);
    return data ? JSON.parse(data) : null;
  }

  // ADMIN AUTH
  public static setAdminAuth(isAuth: boolean): void {
    if (!this.isClient()) return;
    if (isAuth) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
    }
  }

  public static isAdminAuth(): boolean {
    if (!this.isClient()) return false;
    return localStorage.getItem(STORAGE_KEYS.ADMIN_AUTH) === 'true';
  }

  // MODALIDADES
  public static getModalidades(): ModalidadeConfig[] {
    if (!this.isClient()) return MODALIDADES_PADRAO;
    this.init();
    const data = localStorage.getItem(STORAGE_KEYS.MODALIDADES);
    return data ? JSON.parse(data) : MODALIDADES_PADRAO;
  }

  // ATLETAS
  public static getAtletas(escolaId?: string): Atleta[] {
    if (!this.isClient()) return [];
    this.init();
    const data = localStorage.getItem(STORAGE_KEYS.ATLETAS);
    const list: Atleta[] = data ? JSON.parse(data) : [];
    if (escolaId) {
      return list.filter(a => a.escolaId === escolaId);
    }
    return list;
  }

  public static getAtletaById(id: string): Atleta | undefined {
    return this.getAtletas().find(a => a.id === id);
  }

  public static saveAtleta(atleta: Atleta): void {
    if (!this.isClient()) return;
    const atletas = this.getAtletas();
    const index = atletas.findIndex(a => a.id === atleta.id);
    if (index >= 0) {
      atletas[index] = atleta;
    } else {
      atletas.unshift(atleta);
    }
    localStorage.setItem(STORAGE_KEYS.ATLETAS, JSON.stringify(atletas));
  }

  public static deleteAtleta(id: string): void {
    if (!this.isClient()) return;
    const atletas = this.getAtletas().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.ATLETAS, JSON.stringify(atletas));
  }

  // COMISSAO
  public static getComissao(escolaId?: string): MembroComissao[] {
    if (!this.isClient()) return [];
    this.init();
    const data = localStorage.getItem(STORAGE_KEYS.COMISSAO);
    const list: MembroComissao[] = data ? JSON.parse(data) : [];
    if (escolaId) {
      return list.filter(c => c.escolaId === escolaId);
    }
    return list;
  }

  public static saveComissao(membro: MembroComissao): void {
    if (!this.isClient()) return;
    const list = this.getComissao();
    const index = list.findIndex(c => c.id === membro.id);
    if (index >= 0) {
      list[index] = membro;
    } else {
      list.unshift(membro);
    }
    localStorage.setItem(STORAGE_KEYS.COMISSAO, JSON.stringify(list));
  }

  public static deleteComissao(id: string): void {
    if (!this.isClient()) return;
    const list = this.getComissao().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.COMISSAO, JSON.stringify(list));
  }

  // INSCRICOES
  public static getInscricoes(escolaId?: string): InscricaoEquipe[] {
    if (!this.isClient()) return [];
    this.init();
    const data = localStorage.getItem(STORAGE_KEYS.INSCRICOES);
    const list: InscricaoEquipe[] = data ? JSON.parse(data) : [];
    if (escolaId) {
      return list.filter(i => i.escolaId === escolaId);
    }
    return list;
  }

  public static getInscricaoById(id: string): InscricaoEquipe | undefined {
    return this.getInscricoes().find(i => i.id === id);
  }

  public static saveInscricao(insc: InscricaoEquipe): void {
    if (!this.isClient()) return;
    const list = this.getInscricoes();
    const index = list.findIndex(i => i.id === insc.id);
    if (index >= 0) {
      list[index] = { ...insc, updatedAt: new Date().toISOString() };
    } else {
      list.unshift({ ...insc, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    localStorage.setItem(STORAGE_KEYS.INSCRICOES, JSON.stringify(list));
  }

  public static deleteInscricao(id: string): void {
    if (!this.isClient()) return;
    const list = this.getInscricoes().filter(i => i.id !== id);
    localStorage.setItem(STORAGE_KEYS.INSCRICOES, JSON.stringify(list));
  }

  // AVISOS
  public static getComunicados(): ComunicadoAviso[] {
    if (!this.isClient()) return COMUNICADOS_PADRAO;
    this.init();
    const data = localStorage.getItem(STORAGE_KEYS.COMUNICADOS);
    return data ? JSON.parse(data) : COMUNICADOS_PADRAO;
  }

  public static saveComunicado(aviso: ComunicadoAviso): void {
    if (!this.isClient()) return;
    const list = this.getComunicados();
    const index = list.findIndex(a => a.id === aviso.id);
    if (index >= 0) {
      list[index] = aviso;
    } else {
      list.unshift(aviso);
    }
    localStorage.setItem(STORAGE_KEYS.COMUNICADOS, JSON.stringify(list));
  }

  public static deleteComunicado(id: string): void {
    if (!this.isClient()) return;
    const list = this.getComunicados().filter(a => a.id !== id);
    localStorage.setItem(STORAGE_KEYS.COMUNICADOS, JSON.stringify(list));
  }

  // Utilitário de cálculo de categoria por ano de nascimento
  public static calcularCategoria(dataNascimento: string): { categoria: CategoriaIdade | null; idade: number; statusText: string } {
    if (!dataNascimento) return { categoria: null, idade: 0, statusText: 'Data não informada' };
    const anoNasc = new Date(dataNascimento).getFullYear();
    const anoAtual = 2026;
    const idade = anoAtual - anoNasc;

    if (idade >= 12 && idade <= 14) {
      return { categoria: 'INFANTIL', idade, statusText: `Infantil (${idade} anos - Elegível)` };
    } else if (idade >= 15 && idade <= 17) {
      return { categoria: 'INFANTO', idade, statusText: `Infanto (${idade} anos - Elegível)` };
    } else {
      return { categoria: null, idade, statusText: `Fora da faixa etária permitida (${idade} anos)` };
    }
  }
}
