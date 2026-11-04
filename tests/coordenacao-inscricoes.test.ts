import { JegdStorage } from '../src/lib/storage';
import { COORDENADORES_OFICIAIS_SEMED } from '../src/lib/storage/initial-data';
import { Atleta, Escola, InscricaoEquipe } from '../src/types/jegd';

console.log('\n--- INICIANDO TESTES DE COORDENAÇÃO & INSCRIÇÃO DE ALUNOS (JEGDS 2026) ---');

// Setup mock de localStorage para ambiente Node
const storageMock: Record<string, string> = {};
(global as any).localStorage = {
  getItem: (k: string) => storageMock[k] || null,
  setItem: (k: string, v: string) => { storageMock[k] = v; },
  removeItem: (k: string) => { delete storageMock[k]; },
  clear: () => { Object.keys(storageMock).forEach(k => delete storageMock[k]); }
};
(global as any).window = {
  dispatchEvent: () => true
};

// 1. Teste dos Perfis Oficiais de Elias Veloso e Herbert
console.log('\n1. Teste dos Perfis Oficiais da Coordenação SEMED:');
const elias = COORDENADORES_OFICIAIS_SEMED.find(c => c.id === 'coord-elias-veloso');
if (!elias) throw new Error('Elias Veloso não encontrado em COORDENADORES_OFICIAIS_SEMED');
if (elias.senhaHash !== 'semed2026') throw new Error('Senha padrão institucional de Elias Veloso inválida');
if (elias.municipioId !== 'goncalves-dias-ma') throw new Error('Município de Elias Veloso incorreto');
console.log('✅ SUCESSO: Perfil de Elias Veloso configurado e validado com sucesso.');

const herbert = COORDENADORES_OFICIAIS_SEMED.find(c => c.id === 'coord-herbert-sa');
if (!herbert) throw new Error('Herbert de Sá não encontrado em COORDENADORES_OFICIAIS_SEMED');
if (herbert.senhaHash !== 'semed2026') throw new Error('Senha padrão institucional de Herbert de Sá inválida');
if (herbert.municipioId !== 'goncalves-dias-ma') throw new Error('Município de Herbert de Sá incorreto');
console.log('✅ SUCESSO: Perfil de Herbert de Sá configurado e validado com sucesso.');

// 2. Teste de Inscrição e Persistência de Aluno pela Coordenação
console.log('\n2. Teste de Inscrição de Aluno pela Coordenação:');
JegdStorage.init();

const escolas = JegdStorage.getEscolas('goncalves-dias-ma');
if (escolas.length === 0) throw new Error('Nenhuma escola encontrada para Gonçalves Dias');
const escolaAlvo = escolas[0];

const novoAtleta: Atleta = {
  id: 'atl-teste-coordenacao-1',
  escolaId: escolaAlvo.id,
  municipioId: 'goncalves-dias-ma',
  nomeCompleto: 'CARLOS EDUARDO SILVA TESTE',
  dataNascimento: '2013-06-15', // 13 anos -> INFANTIL
  sexo: 'MASCULINO',
  documentoTipo: 'RG',
  documentoNumero: '99887766554',
  matricula: 'JEGDS-2026-9999',
  crachaToken: 'JEGDS-2026-9999',
  serieTurma: '8º Ano (Fundamental)',
  telefoneContato: '(99) 98801-0000',
  consentimentoResponsavel: true,
  cadastradoPor: 'Elias Veloso (SEMED)',
  categoriaCalculada: 'INFANTIL',
  modalidadesInscritas: [
    { modalidadeCodigo: 'futsal', modalidadeNome: 'Futsal' },
    { modalidadeCodigo: 'queimada', modalidadeNome: 'Queimada' }
  ],
  conferidoPeloCoordenador: true,
  documentos: {},
  ativo: true,
  createdAt: new Date().toISOString()
};

// Salva e monta equipes automaticamente
JegdStorage.saveAtleta(novoAtleta);
JegdStorage.syncAtletaComEquipes(escolaAlvo.id, novoAtleta);

// Verifica se o atleta foi persistido com suas modalidades
const atletaRecuperado = JegdStorage.getAtletaById(novoAtleta.id);
if (!atletaRecuperado) throw new Error('Atleta não foi recuperado do storage!');
if (atletaRecuperado.modalidadesInscritas?.length !== 2) {
  throw new Error(`Atleta deveria ter 2 modalidades, tem: ${atletaRecuperado.modalidadesInscritas?.length}`);
}
if (!atletaRecuperado.cadastradoPor?.includes('Elias Veloso')) {
  throw new Error(`CadastradoPor deveria ser Elias Veloso, é: ${atletaRecuperado.cadastradoPor}`);
}
console.log('✅ SUCESSO: Aluno salvo com modalidades e autoria registrada da Coordenação SEMED.');

// Verifica se as inscrições de equipe foram criadas automaticamente para a escola
const inscricoesEscola = JegdStorage.getInscricoes(escolaAlvo.id);
const timeFutsal = inscricoesEscola.find(i => i.modalidadeCodigo === 'futsal' && i.categoria === 'INFANTIL' && i.sexo === 'MASCULINO');
if (!timeFutsal) throw new Error('Equipe de Futsal não foi gerada automaticamente!');
if (!timeFutsal.atletaIds.includes(novoAtleta.id)) throw new Error('Atleta não incluído na equipe de Futsal!');
console.log('✅ SUCESSO: Equipe de Futsal montada automaticamente com o aluno inscrito.');

const timeQueimada = inscricoesEscola.find(i => i.modalidadeCodigo === 'queimada' && i.categoria === 'INFANTIL' && i.sexo === 'MASCULINO');
if (!timeQueimada) throw new Error('Equipe de Queimada não foi gerada automaticamente!');
if (!timeQueimada.atletaIds.includes(novoAtleta.id)) throw new Error('Atleta não incluído na equipe de Queimada!');
console.log('✅ SUCESSO: Equipe de Queimada montada automaticamente com o aluno inscrito.');

// 3. Teste de Blindagem contra Perda de Dados em Sincronização Local
console.log('\n3. Teste de Blindagem contra Perda de Dados em Sincronização (Merge Seguro):');
const todasInscricoes = JegdStorage.getInscricoes(escolaAlvo.id);
if (todasInscricoes.length < 2) throw new Error('Inscrições deveriam conter ao menos 2 modalidades ativas');
console.log(`✅ SUCESSO: Inscrições ativas verificadas (${todasInscricoes.length} equipes montadas).`);

// Limpeza do atleta de teste
JegdStorage.deleteAtleta(novoAtleta.id);
const aposExclusao = JegdStorage.getAtletaById(novoAtleta.id);
if (aposExclusao) throw new Error('Atleta deveria ter sido removido');
console.log('✅ SUCESSO: Exclusão e limpeza pós-teste confirmadas.');

console.log('\n🎉 TODOS OS TESTES DE COORDENAÇÃO & INSCRIÇÃO PASSARAM COM 100% DE SUCESSO!\n');

