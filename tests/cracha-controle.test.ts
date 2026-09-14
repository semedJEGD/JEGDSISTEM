import { describe, it } from 'node:test';
import assert from 'node:assert';
import { JegdStorage } from '../src/lib/storage';
import { Atleta, Escola, RegistroControle, TipoRegistroControle } from '../src/types/jegd';

console.log('\n--- INICIANDO TESTES DO MÓDULO CRACHÁ & CONTROLE LOGÍSTICO (JEGD 2026) ---');

// Mock localStorage para Node.js
const storageMock: Record<string, string> = {};
(global as any).window = {};
(global as any).localStorage = {
  getItem: (key: string) => storageMock[key] || null,
  setItem: (key: string) => { storageMock[key] = arguments[1] || ''; },
  removeItem: (key: string) => { delete storageMock[key]; },
  clear: () => { Object.keys(storageMock).forEach(k => delete storageMock[k]); }
};

// Implementação do setItem compatível
(global as any).localStorage.setItem = (key: string, value: string) => {
  storageMock[key] = value;
};

// Teste 1: Geração de Token Único de Crachá
console.log('\n1. Teste de Geração de Token Único de Crachá:');
JegdStorage.init();

const atletaTeste: Atleta = {
  id: 'atl-teste-01',
  escolaId: 'esc-aldenora-araujo',
  nomeCompleto: 'Gabriel Silva Teste',
  dataNascimento: '2013-05-14',
  sexo: 'MASCULINO',
  documentoTipo: 'RG',
  documentoNumero: '99887766',
  matricula: '2026001',
  serieTurma: '7º Ano A',
  telefoneContato: '(99) 98800-1122',
  consentimentoResponsavel: true,
  categoriaCalculada: 'INFANTIL',
  documentos: {},
  ativo: true,
  createdAt: new Date().toISOString()
};

JegdStorage.saveAtleta(atletaTeste);

const token1 = JegdStorage.gerarOuObterTokenCracha(atletaTeste.id);
assert(token1 && token1.startsWith('CR-ATL-TESTE-01-'), 'Token deve iniciar com prefixo padronizado do ID');
console.log(`✅ SUCESSO: Token gerado com sucesso: ${token1}`);

// Re-obter o token deve retornar o mesmo (persistência idempotente)
const token2 = JegdStorage.gerarOuObterTokenCracha(atletaTeste.id);
assert.strictEqual(token1, token2, 'O token deve permanecer o mesmo nas chamadas subsequentes');
console.log(`✅ SUCESSO: Token persistido e idempotente: ${token2}`);

// Teste 2: Busca por Token, ID, Matrícula e QR Code
console.log('\n2. Teste de Busca de Atletas:');
const buscaPorToken = JegdStorage.getAtletaByCrachaToken(token1);
assert(buscaPorToken && buscaPorToken.id === atletaTeste.id, 'Busca por token deve encontrar o atleta');
console.log('✅ SUCESSO: Atleta localizado exatamente pelo crachaToken');

const buscaPorId = JegdStorage.getAtletaByCrachaToken('atl-teste-01');
assert(buscaPorId && buscaPorId.id === atletaTeste.id, 'Busca por ID deve encontrar o atleta');
console.log('✅ SUCESSO: Atleta localizado pelo ID');

const buscaPorMatricula = JegdStorage.getAtletaByCrachaToken('2026001');
assert(buscaPorMatricula && buscaPorMatricula.id === atletaTeste.id, 'Busca por matrícula deve encontrar o atleta');
console.log('✅ SUCESSO: Atleta localizado pela matrícula');

const qrPayload = JSON.stringify({ token: token1 });
const buscaPorQR = JegdStorage.getAtletaByCrachaToken(qrPayload);
assert(buscaPorQR && buscaPorQR.id === atletaTeste.id, 'Busca por JSON do QR Code deve encontrar o atleta');
console.log('✅ SUCESSO: Atleta localizado pelo payload do QR Code');

// Teste 3: Registro de Eventos Logísticos e Elegibilidade
console.log('\n3. Teste de Registro de Eventos Logísticos:');
const regAgua: RegistroControle = {
  id: 'reg-01',
  atletaId: atletaTeste.id,
  tipo: 'AGUA',
  timestamp: new Date().toISOString(),
  registradoPor: 'Apoio SEMED João',
  papelOperador: 'APOIO',
  escolaId: atletaTeste.escolaId,
  detalhes: 'Entrega de Garrafa de Água'
};

const regLanche: RegistroControle = {
  id: 'reg-02',
  atletaId: atletaTeste.id,
  tipo: 'LANCHE',
  timestamp: new Date().toISOString(),
  registradoPor: 'Apoio SEMED Maria',
  papelOperador: 'APOIO',
  escolaId: atletaTeste.escolaId,
  detalhes: 'Entrega de Kit Lanche'
};

const regEleg: RegistroControle = {
  id: 'reg-03',
  atletaId: atletaTeste.id,
  tipo: 'ELEGIBILIDADE',
  timestamp: new Date().toISOString(),
  registradoPor: 'Árbitro Carlos',
  papelOperador: 'ARBITRO',
  escolaId: atletaTeste.escolaId,
  detalhes: 'Conferência de Quadra Futsal'
};

JegdStorage.saveRegistroControle(regAgua);
JegdStorage.saveRegistroControle(regLanche);
JegdStorage.saveRegistroControle(regEleg);

const historico = JegdStorage.getRegistrosControle(atletaTeste.id);
assert.strictEqual(historico.length, 3, 'O atleta deve ter exatamente 3 registros de controle');
console.log(`✅ SUCESSO: 3 registros gravados no histórico do atleta (${historico.map(h => h.tipo).join(', ')})`);

// Teste 4: Relatório Logístico Agregado por Escola
console.log('\n4. Teste de Relatório Logístico Consolidado:');
const relatorio = JegdStorage.getRelatorioLogistico();
assert(relatorio.totaisGerais.agua >= 1, 'Total geral de água deve ser no mínimo 1');
assert(relatorio.totaisGerais.lanche >= 1, 'Total geral de lanche deve ser no mínimo 1');
assert(relatorio.totaisGerais.elegibilidadeQuadra >= 1, 'Total geral de quadra deve ser no mínimo 1');

const escolaReport = relatorio.porEscola.find(e => e.escola.id === atletaTeste.escolaId);
assert(escolaReport, 'Relatório da escola do atleta deve existir');
assert.strictEqual(escolaReport.agua, 1, 'Escola deve ter 1 água registrada');
assert.strictEqual(escolaReport.lanche, 1, 'Escola deve ter 1 lanche registrado');
assert.strictEqual(escolaReport.elegibilidadeQuadra, 1, 'Escola deve ter 1 presença em quadra registrada');
console.log(`✅ SUCESSO: Relatório consolidado por escola verificado com precisão para ${escolaReport.escola.sigla}`);

// Teste 5: Remoção e Isolamento
console.log('\n5. Teste de Exclusão de Registro:');
JegdStorage.deleteRegistroControle('reg-01');
const historicoAposDelete = JegdStorage.getRegistrosControle(atletaTeste.id);
assert.strictEqual(historicoAposDelete.length, 2, 'Após excluir 1 registro, histórico deve conter 2');
console.log('✅ SUCESSO: Exclusão pontual de registro efetuada');

console.log('\n🎉 TODOS OS TESTES DO MÓDULO CRACHÁ & CONTROLE LOGÍSTICO FORAM APROVADOS COM 100% DE SUCESSO!\n');
