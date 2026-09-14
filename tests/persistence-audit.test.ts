import { JegdStorage } from '../src/lib/storage';
import { Atleta, Escola, Usuario } from '../src/types/jegd';

// Mock localStorage in Node environment
class LocalStorageMock {
  store: Record<string, string> = {};

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

// @ts-ignore
global.localStorage = new LocalStorageMock();
// @ts-ignore
global.window = {
  addEventListener: () => {},
  removeEventListener: () => {}
};

function assert(condition: boolean, title: string) {
  if (!condition) {
    console.error(`❌ FALHA NA AUDITORIA: ${title}`);
    throw new Error(title);
  } else {
    console.log(`✅ [OK] ${title}`);
  }
}

console.log('================================================================');
console.log('       AUDITORIA COMPLETA DE PERSISTÊNCIA E FLUXO DO JEGDS 2026 ');
console.log('================================================================\n');

// 1. INICIALIZAÇÃO DO STORAGE
console.log('--- ETAPA 1: Inicialização do Banco de Dados Local ---');
JegdStorage.init();

const escolas = JegdStorage.getEscolas();
assert(escolas.length === 12, `Deve inicializar exatamente as 12 escolas oficiais da rede (Encontradas: ${escolas.length})`);

const modalidades = JegdStorage.getModalidades();
assert(modalidades.length === 8, `Deve inicializar as 8 modalidades oficiais do regulamento (Encontradas: ${modalidades.length})`);

// 2. SIMULAÇÃO DE LOGIN DO PROFESSOR
console.log('\n--- ETAPA 2: Autenticação e Sessão da Escola ---');
const escolaAldenora = escolas[0]; // Aldenora Araújo
const profUser: Usuario = {
  id: 'prof-test-1',
  nome: 'Prof. Carlos Alberto Silva',
  email: 'carlos@aldenora.edu.br',
  telefone: '(99) 98801-0001',
  papel: 'PROFESSOR',
  escolaId: escolaAldenora.id,
  createdAt: new Date().toISOString()
};

JegdStorage.setCurrentUser(profUser);
JegdStorage.setCurrentEscola(escolaAldenora);

const escolaLogada = JegdStorage.getCurrentEscola();
assert(escolaLogada?.id === escolaAldenora.id, 'Sessão da escola atual deve ser recuperada com sucesso');

const usuarioLogado = JegdStorage.getCurrentUser();
assert(usuarioLogado?.nome === 'Prof. Carlos Alberto Silva', 'Sessão do professor autenticado deve persistir');

// 3. CADASTRO RÁPIDO DO ALUNO 1 + VINCULAÇÃO IMEDIATA (Futsal Infantil Masc)
console.log('\n--- ETAPA 3: Cadastro Rápido do 1º Aluno e Formação Automática da Equipe ---');
const aluno1: Atleta = {
  id: 'atl-lucas-01',
  escolaId: escolaAldenora.id,
  nomeCompleto: 'LUCAS GABRIEL OLIVEIRA',
  dataNascimento: '2013-05-10', // 13 anos -> INFANTIL
  sexo: 'MASCULINO',
  documentoTipo: 'RG',
  documentoNumero: '123456789',
  matricula: 'MAT-2026-01',
  serieTurma: '7º Ano A',
  telefoneContato: '(99) 98801-0001',
  consentimentoResponsavel: true,
  cadastradoPor: profUser.nome,
  categoriaCalculada: 'INFANTIL',
  modalidadesInscritas: [
    {
      modalidadeCodigo: 'futsal',
      modalidadeNome: 'Futsal'
    }
  ],
  conferidoPeloCoordenador: false,
  documentos: {},
  ativo: true,
  createdAt: new Date().toISOString()
};

JegdStorage.saveAtleta(aluno1);
JegdStorage.syncAtletaComEquipes(escolaAldenora.id, aluno1);

// Verificação de persistência
const atletasEscolaAposAluno1 = JegdStorage.getAtletas(escolaAldenora.id);
assert(atletasEscolaAposAluno1.length === 1, 'Deve conter exatamente 1 atleta cadastrado na escola');
assert(atletasEscolaAposAluno1[0].nomeCompleto === 'LUCAS GABRIEL OLIVEIRA', 'Nome do aluno deve ser salvo em maiúsculas');

const equipesAposAluno1 = JegdStorage.getInscricoes(escolaAldenora.id);
assert(equipesAposAluno1.length === 1, 'Equipe de Futsal Infantil Masculino deve ser criada automaticamente');
assert(equipesAposAluno1[0].modalidadeCodigo === 'futsal', 'Modalidade da equipe deve ser Futsal');
assert(equipesAposAluno1[0].categoria === 'INFANTIL', 'Categoria da equipe deve ser INFANTIL');
assert(equipesAposAluno1[0].sexo === 'MASCULINO', 'Gênero da equipe deve ser MASCULINO');
assert(equipesAposAluno1[0].atletaIds.length === 1 && equipesAposAluno1[0].atletaIds[0] === 'atl-lucas-01', 'Aluno 1 deve constar no elenco da equipe');

// 4. CADASTRO DO 2º ALUNO NA MESMA MODALIDADE (Incremento do Elenco)
console.log('\n--- ETAPA 4: Cadastro do 2º Aluno na Mesma Equipe (Incremento de Elenco) ---');
const aluno2: Atleta = {
  id: 'atl-marcos-02',
  escolaId: escolaAldenora.id,
  nomeCompleto: 'MARCOS VINICIUS SANTOS',
  dataNascimento: '2014-02-18', // 12 anos -> INFANTIL
  sexo: 'MASCULINO',
  documentoTipo: 'CERTIDAO',
  documentoNumero: '987654321',
  matricula: 'MAT-2026-02',
  serieTurma: '7º Ano B',
  telefoneContato: '(99) 98801-0002',
  consentimentoResponsavel: true,
  cadastradoPor: profUser.nome,
  categoriaCalculada: 'INFANTIL',
  modalidadesInscritas: [
    {
      modalidadeCodigo: 'futsal',
      modalidadeNome: 'Futsal'
    }
  ],
  conferidoPeloCoordenador: false,
  documentos: {},
  ativo: true,
  createdAt: new Date().toISOString()
};

JegdStorage.saveAtleta(aluno2);
JegdStorage.syncAtletaComEquipes(escolaAldenora.id, aluno2);

const equipesAposAluno2 = JegdStorage.getInscricoes(escolaAldenora.id);
assert(equipesAposAluno2.length === 1, 'Deve continuar existindo apenas 1 equipe de Futsal Infantil Masc');
assert(equipesAposAluno2[0].atletaIds.length === 2, 'Equipe de Futsal deve conter agora 2 atletas no elenco');
assert(equipesAposAluno2[0].atletaIds.includes('atl-marcos-02'), 'Aluno 2 deve estar presente na equipe');

// 5. CADASTRO DO 3º ALUNO EM MODALIDADE INDIVIDUAL COM PROVAS (Atletismo)
console.log('\n--- ETAPA 5: Cadastro em Atletismo com Provas Específicas ---');
const aluno3: Atleta = {
  id: 'atl-rafael-03',
  escolaId: escolaAldenora.id,
  nomeCompleto: 'RAFAEL COSTA PINTO',
  dataNascimento: '2010-09-05', // 16 anos -> INFANTO
  sexo: 'MASCULINO',
  documentoTipo: 'RG',
  documentoNumero: '554433221',
  matricula: 'MAT-2026-03',
  serieTurma: '1º Ano Médio',
  telefoneContato: '(99) 98801-0003',
  consentimentoResponsavel: true,
  cadastradoPor: profUser.nome,
  categoriaCalculada: 'INFANTO',
  modalidadesInscritas: [
    {
      modalidadeCodigo: 'atletismo',
      modalidadeNome: 'Atletismo',
      provas: ['100m', 'salto']
    }
  ],
  conferidoPeloCoordenador: false,
  documentos: {},
  ativo: true,
  createdAt: new Date().toISOString()
};

JegdStorage.saveAtleta(aluno3);
JegdStorage.syncAtletaComEquipes(escolaAldenora.id, aluno3);

const equipesAposAluno3 = JegdStorage.getInscricoes(escolaAldenora.id);
assert(equipesAposAluno3.length === 2, 'Deve constar 2 equipes na escola (Futsal Infantil e Atletismo Infanto)');
const equipeAtletismo = equipesAposAluno3.find(e => e.modalidadeCodigo === 'atletismo');
assert(equipeAtletismo !== undefined, 'Equipe de Atletismo deve existir');
assert(
  equipeAtletismo?.provasPorAtleta?.['atl-rafael-03']?.length === 2 &&
  equipeAtletismo?.provasPorAtleta?.['atl-rafael-03']?.includes('100m') &&
  equipeAtletismo?.provasPorAtleta?.['atl-rafael-03']?.includes('salto'),
  'Provas de Atletismo (100m e Salto) do aluno 3 devem persistir associadas'
);

// 6. TESTE DE CONFERÊNCIA DA COORDENAÇÃO SEMED
console.log('\n--- ETAPA 6: Auditoria da Mesa e Conferência SEMED ---');
JegdStorage.updateAtletaConferencia('atl-lucas-01', true, 'Documento original verificado presencialmente com sucesso.');

const alunoConferido = JegdStorage.getAtletaById('atl-lucas-01');
assert(alunoConferido?.conferidoPeloCoordenador === true, 'Flag de conferência do coordenador deve ser true');
assert(
  alunoConferido?.observacaoCoordenador === 'Documento original verificado presencialmente com sucesso.',
  'Observação do coordenador deve estar gravada e persistida'
);

// Homologação da equipe de Futsal pelo comitê
const futsalTeam = JegdStorage.getInscricoes(escolaAldenora.id).find(i => i.modalidadeCodigo === 'futsal');
if (futsalTeam) {
  const homologada = {
    ...futsalTeam,
    status: 'VALIDADA' as const,
    parecerComite: 'Equipe completa e homologada com sucesso.'
  };
  JegdStorage.saveInscricao(homologada);
}

const futsalHomologado = JegdStorage.getInscricoes(escolaAldenora.id).find(i => i.modalidadeCodigo === 'futsal');
assert(futsalHomologado?.status === 'VALIDADA', 'Status da equipe deve estar persistido como VALIDADA');

// 7. TESTE DE EXCLUSÃO COM REORGANIZAÇÃO AUTOMÁTICA
console.log('\n--- ETAPA 7: Exclusão de Atleta e Sincronização de Elenco ---');
JegdStorage.deleteAtleta('atl-marcos-02');

const atletasAposDelete = JegdStorage.getAtletas(escolaAldenora.id);
assert(atletasAposDelete.length === 2, 'Total de atletas deve cair para 2 após exclusão');
assert(!atletasAposDelete.some(a => a.id === 'atl-marcos-02'), 'Atleta excluído não deve existir mais');

const futsalAposDelete = JegdStorage.getInscricoes(escolaAldenora.id).find(i => i.modalidadeCodigo === 'futsal');
assert(futsalAposDelete?.atletaIds.length === 1, 'Elenco do Futsal deve ser reduzido automaticamente para 1 atleta');
assert(!futsalAposDelete?.atletaIds.includes('atl-marcos-02'), 'ID do atleta excluído deve ser removido do time');

// 8. TESTE DE PERSISTÊNCIA BRUTA EM LOCALSTORAGE (SIMULANDO REFRESH)
console.log('\n--- ETAPA 8: Verificação de Serialização Bruta (JSON / Storage Keys) ---');
const rawAtletas = localStorage.getItem('jegds_atletas_v4');
assert(rawAtletas !== null, 'Chave jegds_atletas_v4 deve conter dados em string JSON');
const parsedAtletas = JSON.parse(rawAtletas || '[]');
assert(parsedAtletas.length >= 2, `JSON de atletas deve conter registros persistidos (Encontrados: ${parsedAtletas.length})`);

const rawInscricoes = localStorage.getItem('jegds_inscricoes_v4');
assert(rawInscricoes !== null, 'Chave jegds_inscricoes_v4 deve conter dados em string JSON');
const parsedInscricoes = JSON.parse(rawInscricoes || '[]');
assert(parsedInscricoes.length >= 2, `JSON de equipes deve conter equipes persistidas (Encontradas: ${parsedInscricoes.length})`);

console.log('\n================================================================');
console.log(' 🎉 AUDITORIA CONCLUÍDA: 100% DOS TESTES DE PERSISTÊNCIA PASSARAM! ');
console.log('================================================================\n');
