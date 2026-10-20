import { JegdStorage } from '../src/lib/storage';
import { Atleta, PerfilAtivoEscola } from '../src/types/jegd';

// Mock localStorage and window if in Node environment
if (typeof window === 'undefined') {
  const store: Record<string, string> = {};
  (global as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
  (global as any).window = {
    location: { hostname: 'localhost' },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true
  };
}

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FALHA: ${msg}`);
    throw new Error(msg);
  } else {
    console.log(`✅ [OK] ${msg}`);
  }
}

async function testFluxoPerfilNetflixEHomologacao() {
  console.log('================================================================');
  console.log('🧪 TESTE DO FLUXO NETFLIX (DIVISOR DE PERFIL) & HOMOLOGAÇÃO');
  console.log('================================================================\n');

  JegdStorage.init();
  const escolaId = 'esc-jose-correa';

  // 1. ADICIONANDO PROFESSORES SEM SENHA
  console.log('--- 1. CADASTRO DE PROFESSORES (SEM SENHA / ESTILO NETFLIX) ---');
  const prof1 = JegdStorage.saveProfessorEscola(escolaId, 'Carlos Silva', '(99) 98111-2222');
  assert(prof1.nome === 'Carlos Silva', 'Professor 1 (Carlos Silva) cadastrado com sucesso');
  assert(prof1.escolaId === escolaId, 'Professor 1 associado à escola correta');

  const prof2 = JegdStorage.saveProfessorEscola(escolaId, 'Amanda Oliveira', '(99) 98222-3333');
  assert(prof2.nome === 'Amanda Oliveira', 'Professor 2 (Amanda Oliveira) cadastrado com sucesso');

  const profs = JegdStorage.getProfessoresEscola(escolaId);
  assert(profs.length === 2, 'Escola possui 2 professores de Educação Física listados');

  // 2. ALTERNÂNCIA DE PERFIS
  console.log('\n--- 2. SELEÇÃO DE PERFIL ATIVO ---');
  // Entra como Professor Carlos
  const perfilProf1: PerfilAtivoEscola = { tipo: 'PROFESSOR', nome: prof1.nome, id: prof1.id };
  JegdStorage.setCurrentPerfilEscola(perfilProf1);
  assert(JegdStorage.getCurrentPerfilEscola()?.nome === 'Carlos Silva', 'Perfil ativo atual é Prof. Carlos Silva');

  // 3. CADASTRO DE ATLETA PELO PROFESSOR CARLOS
  console.log('\n--- 3. CADASTRO DE ALUNO PELO PROFESSOR CARLOS ---');
  const atleta1: Atleta = {
    id: 'atl-teste-1',
    escolaId,
    municipioId: 'goncalves-dias-ma',
    nomeCompleto: 'LUCAS PEREIRA DA SILVA',
    dataNascimento: '2012-04-10',
    sexo: 'MASCULINO',
    documentoTipo: 'RG',
    documentoNumero: '123456789',
    matricula: 'GD-2026-0001',
    serieTurma: '8º Ano B',
    telefoneContato: '(99) 98888-7777',
    consentimentoResponsavel: true,
    cadastradoPor: `Prof. ${perfilProf1.nome}`,
    categoriaCalculada: 'INFANTIL',
    documentos: {},
    ativo: true,
    createdAt: new Date().toISOString()
  };
  JegdStorage.saveAtleta(atleta1);

  const atletaSalvo1 = JegdStorage.getAtletaById('atl-teste-1');
  assert(atletaSalvo1?.cadastradoPor === 'Prof. Carlos Silva', 'Atleta 1 gravado com cadastradoPor: "Prof. Carlos Silva"');

  // 4. TROCA DE PERFIL PARA PROFESSORA AMANDA E CADASTRO DE OUTRO ALUNO
  console.log('\n--- 4. TROCA PARA PROFª AMANDA & CADASTRO DE OUTRO ALUNO ---');
  const perfilProf2: PerfilAtivoEscola = { tipo: 'PROFESSOR', nome: prof2.nome, id: prof2.id };
  JegdStorage.setCurrentPerfilEscola(perfilProf2);
  assert(JegdStorage.getCurrentPerfilEscola()?.nome === 'Amanda Oliveira', 'Perfil ativo mudou para Profª. Amanda Oliveira');

  const atleta2: Atleta = {
    id: 'atl-teste-2',
    escolaId,
    municipioId: 'goncalves-dias-ma',
    nomeCompleto: 'BEATRIZ SOUZA LIMA',
    dataNascimento: '2013-09-15',
    sexo: 'FEMININO',
    documentoTipo: 'RG',
    documentoNumero: '987654321',
    matricula: 'GD-2026-0002',
    serieTurma: '7º Ano A',
    telefoneContato: '(99) 98888-6666',
    consentimentoResponsavel: true,
    cadastradoPor: `Profª. ${perfilProf2.nome}`,
    categoriaCalculada: 'INFANTIL',
    documentos: {},
    ativo: true,
    createdAt: new Date().toISOString()
  };
  JegdStorage.saveAtleta(atleta2);

  const atletaSalvo2 = JegdStorage.getAtletaById('atl-teste-2');
  assert(atletaSalvo2?.cadastradoPor === 'Profª. Amanda Oliveira', 'Atleta 2 gravado com cadastradoPor: "Profª. Amanda Oliveira"');

  // Verifica isolamento de autoria
  const atletasEscola = JegdStorage.getAtletas(escolaId);
  const atletasDoCarlos = atletasEscola.filter(a => a.cadastradoPor === 'Prof. Carlos Silva');
  const atletasDaAmanda = atletasEscola.filter(a => a.cadastradoPor === 'Profª. Amanda Oliveira');
  assert(atletasDoCarlos.length === 1 && atletasDoCarlos[0].nomeCompleto === 'LUCAS PEREIRA DA SILVA', 'Filtro por Professor Carlos validado');
  assert(atletasDaAmanda.length === 1 && atletasDaAmanda[0].nomeCompleto === 'BEATRIZ SOUZA LIMA', 'Filtro por Professora Amanda validado');

  // 5. ENTRADA COMO DIREÇÃO E HOMOLOGAÇÃO DA DELEGAÇÃO
  console.log('\n--- 5. PERFIL DA DIREÇÃO & HOMOLOGAÇÃO DA DELEGAÇÃO PARA A SEMED ---');
  const perfilDirecao: PerfilAtivoEscola = { tipo: 'DIRECAO', nome: 'Diretora Maria do Socorro' };
  JegdStorage.setCurrentPerfilEscola(perfilDirecao);
  assert(JegdStorage.getCurrentPerfilEscola()?.tipo === 'DIRECAO', 'Perfil ativo atual é DIREÇÃO');

  // Antes da homologação: status pendente
  const antesHomol = JegdStorage.getHomologacaoDirecao(escolaId);
  assert(antesHomol.homologado === false, 'Delegação inicialmente em status: Aguardando Homologação da Direção');

  // Direção clica em "Homologar e Aprovar Delegação para a SEMED"
  JegdStorage.setHomologacaoDirecao(escolaId, true, perfilDirecao.nome, 'Todos os alunos conferidos com matrícula ativa');
  const depoisHomol = JegdStorage.getHomologacaoDirecao(escolaId);
  assert(depoisHomol.homologado === true, 'Delegação HOMOLOGADA pela Direção com sucesso');
  assert(depoisHomol.responsavelNome === 'Diretora Maria do Socorro', 'Responsável pela homologação registrado corretamente');
  assert(!!depoisHomol.dataHomologacao, 'Data da homologação registrada');

  // Direção decide reabrir para ajustes
  console.log('\n--- 6. REABERTURA DA DELEGAÇÃO PELA DIREÇÃO ---');
  JegdStorage.setHomologacaoDirecao(escolaId, false);
  const reaberto = JegdStorage.getHomologacaoDirecao(escolaId);
  assert(reaberto.homologado === false, 'Delegação reaberta com sucesso pela Direção para novos ajustes dos professores');

  console.log('\n================================================================');
  console.log('🎉 TODOS OS TESTES DO FLUXO NETFLIX E HOMOLOGAÇÃO PASSARAM COM SUCESSO!');
  console.log('================================================================');
}

testFluxoPerfilNetflixEHomologacao().catch(err => {
  console.error(err);
  process.exit(1);
});
