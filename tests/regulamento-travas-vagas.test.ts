import { JegdStorage } from '../src/lib/storage';
import { JegdsRulesService } from '../src/services/jegds-rules';
import { Atleta, Escola, InscricaoEquipe } from '../src/types/jegd';

// Mock localStorage para execução no ambiente NodeJS
class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value.toString();
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

const mockStorage = new LocalStorageMock();
(global as any).localStorage = mockStorage;
(global as any).window = {
  dispatchEvent: () => true
};
(global as any).fetch = async () => ({ ok: false, json: async () => ({}) });

console.log('--- TESTES DE TRAVAS DO REGULAMENTO & SANITIZAÇÃO DE VAGAS (JEGDS 2026) ---\n');

const ESCOLA_TESTE_ID = 'esc-basilio-alves';
const ESCOLA_TESTE: Escola = {
  id: ESCOLA_TESTE_ID,
  nome: 'U.E. BASÍLIO ALVES',
  sigla: 'BASÍLIO ALVES',
  inep: '21004505',
  rede: 'MUNICIPAL',
  bairro: 'Centro',
  endereco: 'Rua Principal',
  responsavelNome: 'Diretor Teste',
  responsavelTelefone: '999999999',
  loginEmail: 'basilio@test.com',
  createdAt: new Date().toISOString()
};

mockStorage.setItem('jegds_escolas_v6', JSON.stringify([ESCOLA_TESTE]));
JegdStorage.init();

// =========================================================================
// 1. TESTE DE CÁLCULO DE VAGAS E STATUS DE ESGOTAMENTO
// =========================================================================
console.log('1. Testes de Cálculo de Vagas e Limites Oficiais:');

const infoQueimadaVazia = JegdStorage.getVagasModalidadeInfo(
  ESCOLA_TESTE_ID,
  'queimada',
  'MIRIM',
  'FEMININO'
);

if (infoQueimadaVazia.limiteMaximo === 8 && infoQueimadaVazia.maxEquipes === 1 && !infoQueimadaVazia.esgotado) {
  console.log('✅ SUCESSO: Queimada possui limite oficial de 8 vagas (1 equipe de 8) e inicia desocupada');
} else {
  console.error('❌ ERRO: Limite de Queimada divergente:', infoQueimadaVazia);
  process.exit(1);
}

const infoFutsal = JegdStorage.getVagasModalidadeInfo(
  ESCOLA_TESTE_ID,
  'futsal',
  'INFANTIL',
  'MASCULINO'
);

if (infoFutsal.limiteMaximo === 20 && infoFutsal.maxEquipes === 2) {
  console.log('✅ SUCESSO: Futsal possui limite oficial de 20 vagas (até 2 equipes de 10)');
} else {
  console.error('❌ ERRO: Limite de Futsal divergente:', infoFutsal);
  process.exit(1);
}

// =========================================================================
// 2. TESTE DE SANITIZAÇÃO DE EXCESSO (Caso Basílio Alves: 34 atletas na Queimada)
// =========================================================================
console.log('\n2. Teste de Sanitização de Excesso (Caso Basílio Alves):');

// Criar 21 atletas em Queimada Mirim F e 11 em Queimada Infantil F (total 32 atletas com excesso)
const atletasComExcesso: Atleta[] = [];

// 21 atletas MIRIM FEMININO
for (let i = 1; i <= 21; i++) {
  const seq = String(i).padStart(4, '0');
  atletasComExcesso.push({
    id: `atl-mirim-f-${i}`,
    nomeCompleto: `ATLETA MIRIM FEM ${i}`,
    dataNascimento: '2016-04-10', // MIRIM
    sexo: 'FEMININO',
    semDocumento: false,
    documentoTipo: 'RG',
    documentoNumero: `RG-MIRIM-${i}`,
    matricula: `JEGD-${seq}`,
    crachaToken: `JEGD-${seq}`,
    categoriaCalculada: 'MIRIM',
    serieTurma: '5º Ano',
    escolaId: ESCOLA_TESTE_ID,
    modalidadesInscritas: [
      { modalidadeCodigo: 'queimada', modalidadeNome: 'Queimada' }
    ]
  });
}

// 11 atletas INFANTIL FEMININO
for (let i = 1; i <= 11; i++) {
  const seq = String(100 + i).padStart(4, '0');
  atletasComExcesso.push({
    id: `atl-infantil-f-${i}`,
    nomeCompleto: `ATLETA INFANTIL FEM ${i}`,
    dataNascimento: '2013-05-15', // INFANTIL
    sexo: 'FEMININO',
    semDocumento: false,
    documentoTipo: 'RG',
    documentoNumero: `RG-INF-${i}`,
    matricula: `JEGD-${seq}`,
    crachaToken: `JEGD-${seq}`,
    categoriaCalculada: 'INFANTIL',
    serieTurma: '7º Ano',
    escolaId: ESCOLA_TESTE_ID,
    modalidadesInscritas: [
      { modalidadeCodigo: 'queimada', modalidadeNome: 'Queimada' }
    ]
  });
}

mockStorage.setItem('jegds_atletas_v6', JSON.stringify(atletasComExcesso));

// Criar equipes excedentes (como as criadas pelo fluxo antigo desgovernado)
const inscricoesExcedentes: InscricaoEquipe[] = [
  {
    id: 'insc-queimada-mirim-eq1',
    escolaId: ESCOLA_TESTE_ID,
    modalidadeCodigo: 'queimada',
    modalidadeNome: 'Queimada',
    categoria: 'MIRIM',
    sexo: 'FEMININO',
    numeroEquipe: 1,
    atletaIds: atletasComExcesso.slice(0, 8).map(a => a.id),
    status: 'VALIDADA',
    dataInscricao: '10/11/2026',
    comissaoIds: []
  },
  {
    id: 'insc-queimada-mirim-eq2',
    escolaId: ESCOLA_TESTE_ID,
    modalidadeCodigo: 'queimada',
    modalidadeNome: 'Queimada',
    categoria: 'MIRIM',
    sexo: 'FEMININO',
    numeroEquipe: 2,
    atletaIds: atletasComExcesso.slice(8, 16).map(a => a.id),
    status: 'PENDENTE',
    dataInscricao: '10/11/2026',
    comissaoIds: []
  },
  {
    id: 'insc-queimada-mirim-eq3',
    escolaId: ESCOLA_TESTE_ID,
    modalidadeCodigo: 'queimada',
    modalidadeNome: 'Queimada',
    categoria: 'MIRIM',
    sexo: 'FEMININO',
    numeroEquipe: 3,
    atletaIds: atletasComExcesso.slice(16, 21).map(a => a.id),
    status: 'PENDENTE',
    dataInscricao: '10/11/2026',
    comissaoIds: []
  }
];

mockStorage.setItem('jegds_inscricoes_v6', JSON.stringify(inscricoesExcedentes));

// Executar rotina oficial de sanitização de segurança
const resultadoSanitizacao = JegdStorage.sanitizarExcessoEquipes();

// Verificar atletas pós-sanitização
const atletasAposSanitizacao: Atleta[] = JSON.parse(mockStorage.getItem('jegds_atletas_v6') || '[]');
const queimadaMirimApos = atletasAposSanitizacao.filter(a =>
  a.categoriaCalculada === 'MIRIM' &&
  a.sexo === 'FEMININO' &&
  a.modalidadesInscritas?.some(m => m.modalidadeCodigo === 'queimada')
);

const queimadaInfantilApos = atletasAposSanitizacao.filter(a =>
  a.categoriaCalculada === 'INFANTIL' &&
  a.sexo === 'FEMININO' &&
  a.modalidadesInscritas?.some(m => m.modalidadeCodigo === 'queimada')
);

if (queimadaMirimApos.length === 8) {
  console.log(`✅ SUCESSO: Queimada Mirim Feminina reduzida de 21 para exatamente 8 atletas (teto regulamentar)`);
} else {
  console.error(`❌ ERRO: Queimada Mirim deveria ter 8 atletas, tem: ${queimadaMirimApos.length}`);
  process.exit(1);
}

// Verificar se os 8 mantidos foram os primeiros (matrículas JEGD-0001 até JEGD-0008)
const mantidosIds = queimadaMirimApos.map(a => a.id);
const esperadoPrimeiros8 = ['atl-mirim-f-1', 'atl-mirim-f-2', 'atl-mirim-f-3', 'atl-mirim-f-4', 'atl-mirim-f-5', 'atl-mirim-f-6', 'atl-mirim-f-7', 'atl-mirim-f-8'];
const manteveOsPrimeiros = esperadoPrimeiros8.every(id => mantidosIds.includes(id));

if (manteveOsPrimeiros) {
  console.log('✅ SUCESSO: Foram preservados estritamente os 1º atletas que ocuparam a equipe (JEGD-0001 a JEGD-0008)');
} else {
  console.error('❌ ERRO: Atletas mantidos não coincidem com os primeiros:', mantidosIds);
  process.exit(1);
}

if (queimadaInfantilApos.length === 8) {
  console.log(`✅ SUCESSO: Queimada Infantil Feminina reduzida de 11 para exatamente 8 atletas`);
} else {
  console.error(`❌ ERRO: Queimada Infantil deveria ter 8 atletas, tem: ${queimadaInfantilApos.length}`);
  process.exit(1);
}

// Verificar se as equipes excedentes foram removidas
const inscricoesApos: InscricaoEquipe[] = JSON.parse(mockStorage.getItem('jegds_inscricoes_v6') || '[]');
const equipesQueimadaMirim = inscricoesApos.filter(i =>
  i.escolaId === ESCOLA_TESTE_ID &&
  i.modalidadeCodigo === 'queimada' &&
  i.categoria === 'MIRIM'
);

if (equipesQueimadaMirim.length === 1 && equipesQueimadaMirim[0].atletaIds.length === 8) {
  console.log('✅ SUCESSO: Equipes 2 e 3 de Queimada excluídas, restando apenas a Equipe 1 oficial com 8 atletas');
} else {
  console.error('❌ ERRO: Inscrições de Queimada após sanitização:', equipesQueimadaMirim);
  process.exit(1);
}

// =========================================================================
// 3. TESTE DE BLOQUEIO DE NOVO CADASTRO QUANDO VAGAS ESTÃO ESGOTADAS
// =========================================================================
console.log('\n3. Teste de Bloqueio de Inscrição em Modalidade com Vagas Esgotadas:');

const infoAposSanitizacao = JegdStorage.getVagasModalidadeInfo(
  ESCOLA_TESTE_ID,
  'queimada',
  'MIRIM',
  'FEMININO'
);

if (infoAposSanitizacao.esgotado && infoAposSanitizacao.vagasRestantes === 0) {
  console.log('✅ SUCESSO: getVagasModalidadeInfo reporta esgotado=true e 0 vagas restantes para Queimada Mirim F');
} else {
  console.error('❌ ERRO: Status de vagas inesperado:', infoAposSanitizacao);
  process.exit(1);
}

// Tentar adicionar um 9º atleta via syncAtletaComEquipes
const atleta9: Atleta = {
  id: 'atl-mirim-f-999',
  nomeCompleto: 'TENTATIVA 9º ATLETA QUEIMADA',
  dataNascimento: '2016-01-01',
  sexo: 'FEMININO',
  semDocumento: false,
  documentoTipo: 'RG',
  documentoNumero: '999999',
  matricula: 'JEGD-0999',
  crachaToken: 'JEGD-0999',
  categoriaCalculada: 'MIRIM',
  serieTurma: '5º Ano',
  escolaId: ESCOLA_TESTE_ID,
  modalidadesInscritas: [
    { modalidadeCodigo: 'queimada', modalidadeNome: 'Queimada' }
  ]
};

JegdStorage.syncAtletaComEquipes(ESCOLA_TESTE_ID, atleta9);

const inscricoesAposTentativa = JegdStorage.getInscricoes(ESCOLA_TESTE_ID).filter(i =>
  i.modalidadeCodigo === 'queimada' && i.categoria === 'MIRIM' && i.sexo === 'FEMININO'
);

const totalAtletasNaInscricao = inscricoesAposTentativa.reduce((acc, eq) => acc + eq.atletaIds.length, 0);

if (inscricoesAposTentativa.length === 1 && totalAtletasNaInscricao === 8) {
  console.log('✅ SUCESSO: Tentativa de inscrever atleta excedente foi estritamente barrada! Elenco permanece travado em 8.');
} else {
  console.error('❌ ERRO: Elenco excedeu o limite após tentativa:', totalAtletasNaInscricao, inscricoesAposTentativa);
  process.exit(1);
}

console.log('\n🎉 TODOS OS TESTES DE TRAVAS DO REGULAMENTO & VAGAS FORAM APROVADOS COM SUCESSO TOTAL!');
