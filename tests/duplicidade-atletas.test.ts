import assert from 'node:assert';
import { JegdsRulesService } from '../src/services/jegds-rules';
import { JegdStorage } from '../src/lib/storage';
import { Atleta, Escola } from '../src/types/jegd';

console.log('\n--- INICIANDO TESTES DE DETECÇÃO DE ALUNOS REPETIDOS & MULTI-INSCRIÇÃO (JEGD 2026) ---\n');

// Mock localStorage
const storageMock: Record<string, string> = {};
(global as any).window = {};
(global as any).localStorage = {
  getItem: (key: string) => storageMock[key] || null,
  setItem: (key: string, value: string) => { storageMock[key] = value; },
  removeItem: (key: string) => { delete storageMock[key]; },
  clear: () => { Object.keys(storageMock).forEach(k => delete storageMock[k]); }
};

JegdStorage.init();

const escolaA: Escola = {
  id: 'esc-anisio',
  nome: 'Escola Anísio Gomes',
  sigla: 'EAG',
  inep: '11111111',
  rede: 'MUNICIPAL',
  bairro: 'Centro',
  endereco: 'Rua Principal, 100',
  responsavelNome: 'Prof. Marcos',
  responsavelTelefone: '(99) 98888-1111',
  loginEmail: 'marcos@anisio.edu.br',
  createdAt: new Date().toISOString()
};

const escolaB: Escola = {
  id: 'esc-aldenora',
  nome: 'Escola Aldenora Araújo',
  sigla: 'EAA',
  inep: '22222222',
  rede: 'MUNICIPAL',
  bairro: 'Vila Nova',
  endereco: 'Av. Brasil, 200',
  responsavelNome: 'Prof. Carlos',
  responsavelTelefone: '(99) 98888-2222',
  loginEmail: 'carlos@aldenora.edu.br',
  createdAt: new Date().toISOString()
};

JegdStorage.saveEscola(escolaA);
JegdStorage.saveEscola(escolaB);

// 1. Cadastra Aluno Inicial na Escola A
const atletaOriginal: Atleta = {
  id: 'atl-joao-01',
  escolaId: 'esc-anisio',
  nomeCompleto: 'JOÃO PEDRO DOS SANTOS',
  dataNascimento: '2013-05-15',
  sexo: 'MASCULINO',
  documentoTipo: 'RG',
  documentoNumero: '048.992.110-5',
  matricula: 'MAT-2026-001',
  serieTurma: '7º Ano A',
  telefoneContato: '(99) 98800-1111',
  consentimentoResponsavel: true,
  categoriaCalculada: 'INFANTIL',
  modalidadesInscritas: [
    { modalidadeCodigo: 'futsal', modalidadeNome: 'Futsal' }
  ],
  ativo: true,
  createdAt: new Date().toISOString()
};

JegdStorage.saveAtleta(atletaOriginal);
JegdStorage.syncAtletaComEquipes('esc-anisio', atletaOriginal);

console.log('1. Testes de Comparação e Normalização:');

// Teste de Documento Idêntico (com ou sem pontuação)
const checkDoc = JegdsRulesService.compararDuplicidade(
  { nomeCompleto: 'João Santos', dataNascimento: '2013-05-15', documentoNumero: '0489921105' },
  atletaOriginal
);
assert(checkDoc.duplicado && checkDoc.motivo === 'DOCUMENTO', 'Deve acusar duplicidade por documento mesmo sem pontuação');
console.log('✅ SUCESSO: Documento com pontuação normalizada detectado como repetido.');

// Teste de Nome + Data de Nascimento Idênticos (com variação de acentos e maiúsculas)
const checkNomeData = JegdsRulesService.compararDuplicidade(
  { nomeCompleto: 'joao pedro dos santos', dataNascimento: '2013-05-15', documentoNumero: '999999' },
  atletaOriginal
);
assert(checkNomeData.duplicado && checkNomeData.motivo === 'NOME_DATA_NASC', 'Deve acusar duplicidade por Nome + Data Nasc');
console.log('✅ SUCESSO: Nome Completo (sem acentos) + Data de Nascimento detectado como repetido.');

console.log('\n2. Testes de Diagnóstico de Duplicidade no Storage:');

// Diagnóstico na MESMA ESCOLA
const diagMesmaEscola = JegdStorage.verificarDuplicidadeAtleta({
  nomeCompleto: 'João Pedro dos Santos',
  dataNascimento: '2013-05-15',
  documentoNumero: '048.992.110-5',
  escolaIdAtual: 'esc-anisio'
});
assert(diagMesmaEscola.duplicado === true, 'Deve identificar que está duplicado');
assert(diagMesmaEscola.tipoConflito === 'MESMA_ESCOLA', 'Tipo de conflito deve ser MESMA_ESCOLA');
assert(diagMesmaEscola.atletaExistente?.id === 'atl-joao-01', 'Deve retornar o registro do atleta original');
console.log('✅ SUCESSO: Conflito interno (mesma escola) identificado com referência ao atleta para auto-carregamento.');

// Diagnóstico em OUTRA ESCOLA (Bloqueio)
const diagOutraEscola = JegdStorage.verificarDuplicidadeAtleta({
  nomeCompleto: 'João Pedro dos Santos',
  dataNascimento: '2013-05-15',
  documentoNumero: '048.992.110-5',
  escolaIdAtual: 'esc-aldenora'
});
assert(diagOutraEscola.duplicado === true, 'Deve identificar duplicidade em outra escola');
assert(diagOutraEscola.tipoConflito === 'OUTRA_ESCOLA', 'Tipo de conflito deve ser OUTRA_ESCOLA');
assert(diagOutraEscola.escolaExistente?.nome === 'Escola Anísio Gomes', 'Deve indicar a escola detentora original da matrícula');
console.log('✅ SUCESSO: Conflito inter-escolar bloqueado com identificação da escola de origem.');

console.log('\n3. Testes de Multi-Inscrição do mesmo Aluno em Múltiplas Modalidades:');

// Professor adiciona Atletismo ao mesmo aluno sem duplicar o registro
const atletaAtualizado: Atleta = {
  ...atletaOriginal,
  modalidadesInscritas: [
    { modalidadeCodigo: 'futsal', modalidadeNome: 'Futsal' },
    { modalidadeCodigo: 'atletismo', modalidadeNome: 'Atletismo', provas: ['75m', '100m'] }
  ]
};

JegdStorage.saveAtleta(atletaAtualizado);
JegdStorage.syncAtletaComEquipes('esc-anisio', atletaAtualizado);

const totalAtletasAnisio = JegdStorage.getAtletas('esc-anisio');
assert.strictEqual(totalAtletasAnisio.length, 1, 'Não deve criar segundo registro; deve manter apenas 1 atleta na base');

const inscricoesAnisio = JegdStorage.getInscricoes('esc-anisio');
const inscFutsal = inscricoesAnisio.find(i => i.modalidadeCodigo === 'futsal');
const inscAtletismo = inscricoesAnisio.find(i => i.modalidadeCodigo === 'atletismo');

assert(inscFutsal && inscFutsal.atletaIds.includes('atl-joao-01'), 'Atleta deve constar na equipe de Futsal');
assert(inscAtletismo && inscAtletismo.atletaIds.includes('atl-joao-01'), 'Atleta deve constar na equipe de Atletismo');
assert.deepStrictEqual(inscAtletismo?.provasPorAtleta?.['atl-joao-01'], ['75m', '100m'], 'Provas de atletismo devem estar vinculadas');

console.log('✅ SUCESSO: Aluno vinculado com precisão a múltiplas equipes sem duplicação de cadastro (1 único ID e Crachá).');

console.log('\n🎉 TODOS OS TESTES DE AUDITORIA DE DUPLICIDADE E MULTI-INSCRIÇÃO FORAM APROVADOS COM 100% DE SUCESSO!\n');
