import { JegdStorage } from '../src/lib/storage';
import { Atleta, Escola, InscricaoEquipe } from '../src/types/jegd';

/**
 * Bateria de Testes de Isolamento Multi-Escola e Agregação SEMED
 * JEGD 2026
 */

function mockLocalStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

// Configura mock global do localStorage para ambiente Node
(global as any).localStorage = mockLocalStorage();
(global as any).window = {};

console.log('\n--- INICIANDO TESTES DE ISOLAMENTO POR ESCOLA & DASHBOARD SEMED ---');

// 1. Inicializa base
JegdStorage.init();

const escolaAnisio: Escola = {
  id: 'esc-anisio-gomes',
  nome: 'Anísio Gomes',
  sigla: 'ANÍSIO GOMES',
  inep: '21004502',
  rede: 'MUNICIPAL',
  bairro: 'Centro',
  endereco: 'Gonçalves Dias - MA',
  responsavelNome: 'Prof. Carlos Anísio',
  responsavelTelefone: '(99) 98801-0002',
  loginEmail: 'anisiogomes@semed.gd.gov.br',
  createdAt: new Date().toISOString()
};

const escolaAldenora: Escola = {
  id: 'esc-aldenora-araujo',
  nome: 'Aldenora Araújo',
  sigla: 'ALDENORA ARAÚJO',
  inep: '21004501',
  rede: 'MUNICIPAL',
  bairro: 'Centro',
  endereco: 'Gonçalves Dias - MA',
  responsavelNome: 'Prof. Marcos Aldenora',
  responsavelTelefone: '(99) 98801-0001',
  loginEmail: 'aldenora@semed.gd.gov.br',
  createdAt: new Date().toISOString()
};

// 2. Cadastra Atletas na Escola Anísio Gomes
const atletaAnisio1: Atleta = {
  id: 'atl-anisio-01',
  escolaId: 'esc-anisio-gomes',
  nomeCompleto: 'GABRIEL SILVA ANISIO',
  dataNascimento: '2013-05-10', // Infantil
  sexo: 'MASCULINO',
  documentoTipo: 'RG',
  documentoNumero: '99887766',
  matricula: 'MAT-ANISIO-01',
  serieTurma: '7º Ano B',
  telefoneContato: '(99) 98888-1111',
  consentimentoResponsavel: true,
  ativo: true,
  documentos: {},
  createdAt: new Date().toISOString()
};

// Cadastra Atleta na Escola Aldenora Araújo
const atletaAldenora1: Atleta = {
  id: 'atl-aldenora-01',
  escolaId: 'esc-aldenora-araujo',
  nomeCompleto: 'BEATRIZ SOUZA ALDENORA',
  dataNascimento: '2010-08-20', // Infanto
  sexo: 'FEMININO',
  documentoTipo: 'RG',
  documentoNumero: '11223344',
  matricula: 'MAT-ALDENORA-01',
  serieTurma: '9º Ano A',
  telefoneContato: '(99) 98888-2222',
  consentimentoResponsavel: true,
  ativo: true,
  documentos: {},
  createdAt: new Date().toISOString()
};

JegdStorage.saveAtleta(atletaAnisio1);
JegdStorage.saveAtleta(atletaAldenora1);

// Teste 1: Isolamento de Visualização por Escola
console.log('\n1. Teste de Isolamento de Alunos por Escola:');
const atletasAnisio = JegdStorage.getAtletas('esc-anisio-gomes');
const atletasAldenora = JegdStorage.getAtletas('esc-aldenora-araujo');

if (atletasAnisio.length === 1 && atletasAnisio[0].id === 'atl-anisio-01') {
  console.log('✅ SUCESSO: Escola Anísio Gomes visualiza APENAS seus próprios alunos');
} else {
  console.error('❌ FALHA: Escola Anísio Gomes visualizou dados indevidos');
  process.exit(1);
}

if (atletasAldenora.length === 1 && atletasAldenora[0].id === 'atl-aldenora-01') {
  console.log('✅ SUCESSO: Escola Aldenora Araújo visualiza APENAS seus próprios alunos');
} else {
  console.error('❌ FALHA: Escola Aldenora Araújo visualizou dados indevidos');
  process.exit(1);
}

// Teste 2: Impossibilidade de Cruzamento ou Vazamento
console.log('\n2. Teste de Blindagem contra Vazamento de Dados:');
const vazamentoAnisioEmAldenora = atletasAldenora.find(a => a.escolaId === 'esc-anisio-gomes');
const vazamentoAldenoraEmAnisio = atletasAnisio.find(a => a.escolaId === 'esc-aldenora-araujo');

if (!vazamentoAnisioEmAldenora && !vazamentoAldenoraEmAnisio) {
  console.log('✅ SUCESSO: 0% de vazamento entre escolas diferentes');
} else {
  console.error('❌ FALHA: Houve vazamento de alunos entre escolas');
  process.exit(1);
}

// Teste 3: Visão Agregada da Coordenação SEMED
console.log('\n3. Teste de Agregação Global da Coordenação SEMED:');
const totalAtletasGlobal = JegdStorage.getAtletas(); // Sem filtro de escola (Visão SEMED)
const progressoGeral = JegdStorage.getProgressoEscolas();

if (totalAtletasGlobal.length >= 2) {
  console.log(`✅ SUCESSO: Coordenação SEMED enxerga o total consolidado de todas as escolas (${totalAtletasGlobal.length} atletas)`);
} else {
  console.error('❌ FALHA: Coordenação SEMED não conseguiu consolidar os atletas');
  process.exit(1);
}

const progressoAnisio = progressoGeral.find(p => p.escola.id === 'esc-anisio-gomes');
const progressoAldenora = progressoGeral.find(p => p.escola.id === 'esc-aldenora-araujo');

if (progressoAnisio && progressoAnisio.totalAtletas === 1 && progressoAldenora && progressoAldenora.totalAtletas === 1) {
  console.log('✅ SUCESSO: Painel SEMED mapeia com precisão métricas separadas por escola no lote');
} else {
  console.error('❌ FALHA: Métricas por escola divergentes no painel SEMED');
  process.exit(1);
}

console.log('\n🎉 TODOS OS TESTES DE ISOLAMENTO MULTI-TENANCY E VISÃO SEMED FORAM APROVADOS COM SUCESSO!\n');
