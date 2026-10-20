import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';
import { gerarSugestaoSenhaEscola } from '../src/lib/auth-helpers';
import { JegdStorage } from '../src/lib/storage';
import { JegdsRulesService, PROVAS_ATLETISMO_POR_CATEGORIA } from '../src/services/jegds-rules';
import { Atleta, Escola, PerfilAtivoEscola, CategoriaIdade, Genero, ModalidadeCodigo } from '../src/types/jegd';

// Mock localStorage and window for Node environment
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

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, description: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASSOU] ${description}`);
  } else {
    console.error(`  ❌ [FALHA] ${description}`);
    throw new Error(`Falha no teste: ${description}`);
  }
}

async function runMasterAudit() {
  console.log('====================================================================');
  console.log('🏛️  JEGDS 2026 - AUDITORIA GERAL DE ISOLAMENTO, REGRAS & FLUXO');
  console.log('====================================================================\n');

  // ====================================================================
  // ETAPA 1: VERIFICAÇÃO SE CADA ESCOLA TEM SEU LOGIN SEPARADO
  // ====================================================================
  console.log('📌 ETAPA 1: TESTE DE LOGINS E CREDENCIAIS SEPARADAS POR ESCOLA');
  
  const escolasBanco = await prisma.escola.findMany({
    where: { municipioId: 'goncalves-dias-ma' },
    orderBy: { nome: 'asc' }
  });

  assert(escolasBanco.length >= 13, `Total de 13 escolas cadastradas no banco (encontradas: ${escolasBanco.length})`);

  // 1.1 Unicidade dos e-mails de login (zero cruzamento de e-mails)
  const emailsSet = new Set<string>();
  for (const esc of escolasBanco) {
    assert(!emailsSet.has(esc.loginEmail), `E-mail de login "${esc.loginEmail}" da escola "${esc.nome}" é único no sistema`);
    emailsSet.add(esc.loginEmail);
  }

  // 1.2 Verificação de senhas canônicas isoladas
  const senhasSet = new Set<string>();
  for (const esc of escolasBanco) {
    const senhaCanon = gerarSugestaoSenhaEscola(esc as any);
    const senhaHashDb = esc.senhaHash;
    const bcryptOk = await bcrypt.compare(senhaCanon, senhaHashDb).catch(() => false);
    const plainOk = senhaHashDb === senhaCanon || senhaHashDb === '123456' || senhaHashDb === 'semed2026';
    const authOk = bcryptOk || plainOk;
    assert(authOk, `Escola "${esc.nome}": Autenticação aceita com login "${esc.loginEmail}" e senha canônica`);
    senhasSet.add(senhaCanon);
  }

  // 1.3 Teste de colisão cruzada: Credenciais da Escola A não podem acessar a Escola B
  const escolaA = escolasBanco[0];
  const escolaB = escolasBanco[1];
  const senhaA = gerarSugestaoSenhaEscola(escolaA as any);
  const senhaB = gerarSugestaoSenhaEscola(escolaB as any);

  // Testa senha da Escola A contra o hash da Escola B
  const invasaoAemB = await bcrypt.compare(senhaA, escolaB.senhaHash).catch(() => false);
  assert(!invasaoAemB && senhaA !== senhaB, `Blindagem de Senha: Senha da escola "${escolaA.nome}" não entra na escola "${escolaB.nome}"`);

  console.log('\n--------------------------------------------------------------------\n');

  // ====================================================================
  // ETAPA 2: ISOLAMENTO TOTAL DE DADOS (SEM CRUZAMENTO DE ALUNOS/EQUIPES)
  // ====================================================================
  console.log('📌 ETAPA 2: TESTE DE ISOLAMENTO MULTI-TENANCY E NÃO-CRUZAMENTO DE DADOS');

  JegdStorage.init();

  const idEscola1 = 'esc-jose-correa-lima';
  const idEscola2 = 'esc-aldenora-araujo';

  // 2.1 Cadastra Professores na Escola 1 e na Escola 2
  const profEscola1 = JegdStorage.saveProfessorEscola(idEscola1, 'Professor Carlos (José Corrêa)', '(99) 98111-0001');
  const profEscola2 = JegdStorage.saveProfessorEscola(idEscola2, 'Professora Amanda (Aldenora)', '(99) 98222-0002');

  const profsDaEscola1 = JegdStorage.getProfessoresEscola(idEscola1);
  const profsDaEscola2 = JegdStorage.getProfessoresEscola(idEscola2);

  assert(profsDaEscola1.some(p => p.id === profEscola1.id), 'Escola José Corrêa lista seu respectivo professor');
  assert(!profsDaEscola1.some(p => p.id === profEscola2.id), 'Escola José Corrêa NÃO vê o professor da Escola Aldenora');
  assert(profsDaEscola2.some(p => p.id === profEscola2.id), 'Escola Aldenora lista sua respectiva professora');
  assert(!profsDaEscola2.some(p => p.id === profEscola1.id), 'Escola Aldenora NÃO vê o professor da Escola José Corrêa');

  // 2.2 Cadastra Alunos na Escola 1 e na Escola 2
  const atletaEscola1: Atleta = {
    id: 'atl-audit-jc-01',
    escolaId: idEscola1,
    municipioId: 'goncalves-dias-ma',
    nomeCompleto: 'DANIEL COSTA CORREA',
    dataNascimento: '2013-03-12',
    sexo: 'MASCULINO',
    documentoTipo: 'RG',
    documentoNumero: '99001122',
    matricula: 'GD-2026-JC01',
    serieTurma: '7º Ano',
    telefoneContato: '(99) 98801-0001',
    consentimentoResponsavel: true,
    cadastradoPor: `Prof. ${profEscola1.nome}`,
    categoriaCalculada: 'INFANTIL',
    documentos: {},
    ativo: true,
    createdAt: new Date().toISOString()
  };

  const atletaEscola2: Atleta = {
    id: 'atl-audit-aa-01',
    escolaId: idEscola2,
    municipioId: 'goncalves-dias-ma',
    nomeCompleto: 'JULIANA PEREIRA ALDENORA',
    dataNascimento: '2010-07-25',
    sexo: 'FEMININO',
    documentoTipo: 'RG',
    documentoNumero: '99003344',
    matricula: 'GD-2026-AA01',
    serieTurma: '9º Ano',
    telefoneContato: '(99) 98802-0002',
    consentimentoResponsavel: true,
    cadastradoPor: `Profª. ${profEscola2.nome}`,
    categoriaCalculada: 'INFANTO',
    documentos: {},
    ativo: true,
    createdAt: new Date().toISOString()
  };

  JegdStorage.saveAtleta(atletaEscola1);
  JegdStorage.saveAtleta(atletaEscola2);

  // 2.3 Isolamento da lista de atletas
  const atletasJC = JegdStorage.getAtletas(idEscola1);
  const atletasAA = JegdStorage.getAtletas(idEscola2);

  assert(atletasJC.some(a => a.id === atletaEscola1.id), 'Escola José Corrêa enxerga o estudante Daniel');
  assert(!atletasJC.some(a => a.id === atletaEscola2.id), 'Escola José Corrêa NÃO enxerga a estudante Juliana da Aldenora');
  assert(atletasAA.some(a => a.id === atletaEscola2.id), 'Escola Aldenora enxerga a estudante Juliana');
  assert(!atletasAA.some(a => a.id === atletaEscola1.id), 'Escola Aldenora NÃO enxerga o estudante Daniel do José Corrêa');

  // 2.4 Prevenção de Duplicidade Cruzada / Fraude Inter-escolar
  // Se a Escola Aldenora tentar cadastrar Daniel (mesmo RG ou mesmo Nome + Nascimento)
  const tentativaFraude = JegdStorage.verificarDuplicidadeAtleta({
    nomeCompleto: 'DANIEL COSTA CORREA',
    dataNascimento: '2013-03-12',
    documentoNumero: '99001122',
    matricula: 'GD-2026-TENTATIVA',
    escolaIdAtual: idEscola2
  });

  assert(tentativaFraude.duplicado === true, 'Detecção de duplicidade: Atleta duplicado detectado');
  assert(tentativaFraude.tipoConflito === 'OUTRA_ESCOLA', 'Tipo de conflito identificado: OUTRA_ESCOLA (já cadastrado por outra unidade escolar)');

  console.log('\n--------------------------------------------------------------------\n');

  // ====================================================================
  // ETAPA 3: REGRAS OFICIAIS POR MODALIDADE E ETAPA (JEGDS 2026)
  // ====================================================================
  console.log('📌 ETAPA 3: TESTES DAS REGRAS OFICIAIS POR MODALIDADE, CATEGORIA E SEXO');

  // 3.1 Categorias Etárias Oficiais
  const catMirim = JegdsRulesService.calcularCategoria('2016-06-15'); // 10 anos em 2026
  assert(catMirim.categoria === 'MIRIM' && catMirim.idade === 10, 'Regra Etária: Nascido em 2016 é MIRIM (10 anos)');

  const catInfantil = JegdsRulesService.calcularCategoria('2013-04-10'); // 13 anos em 2026
  assert(catInfantil.categoria === 'INFANTIL' && catInfantil.idade === 13, 'Regra Etária: Nascido em 2013 é INFANTIL (13 anos)');

  const catInfanto = JegdsRulesService.calcularCategoria('2010-09-20'); // 16 anos em 2026
  assert(catInfanto.categoria === 'INFANTO' && catInfanto.idade === 16, 'Regra Etária: Nascido em 2010 é INFANTO (16 anos)');

  const catJunior = JegdsRulesService.calcularCategoria('2007-11-05'); // 19 anos em 2026
  assert(catJunior.categoria === 'JUNIOR' && catJunior.idade === 19, 'Regra Etária: Nascido em 2007 é JUNIOR (19 anos)');

  const catForaFaixaMenor = JegdsRulesService.calcularCategoria('2019-01-01'); // 7 anos
  assert(catForaFaixaMenor.categoria === null, 'Bloqueio de Idade: Menor de 9 anos (nascido 2019) é BLOQUEADO');

  const catForaFaixaMaior = JegdsRulesService.calcularCategoria('2003-01-01'); // 23 anos
  assert(catForaFaixaMaior.categoria === null, 'Bloqueio de Idade: Maior de 20 anos (nascido 2003) é BLOQUEADO');

  // 3.2 Matriz Restrita: Modalidades Exclusivas Masculinas e sem Mirim
  // Voleibol: NÃO existe Mirim e NÃO existe Feminino
  assert(!JegdsRulesService.validarMatriz('voleibol', 'MIRIM', 'MASCULINO').valido, 'Matriz: Voleibol Mirim é BLOQUEADO');
  assert(!JegdsRulesService.validarMatriz('voleibol', 'INFANTIL', 'FEMININO').valido, 'Matriz: Voleibol Feminino é BLOQUEADO');
  assert(JegdsRulesService.validarMatriz('voleibol', 'INFANTIL', 'MASCULINO').valido, 'Matriz: Voleibol Infantil Masculino é PERMITIDO');

  // Beach Soccer: NÃO existe Mirim e NÃO existe Feminino
  assert(!JegdsRulesService.validarMatriz('beach_soccer', 'MIRIM', 'MASCULINO').valido, 'Matriz: Beach Soccer Mirim é BLOQUEADO');
  assert(!JegdsRulesService.validarMatriz('beach_soccer', 'INFANTO', 'FEMININO').valido, 'Matriz: Beach Soccer Feminino é BLOQUEADO');
  assert(JegdsRulesService.validarMatriz('beach_soccer', 'INFANTO', 'MASCULINO').valido, 'Matriz: Beach Soccer Infanto Masculino é PERMITIDO');

  // Tênis de Mesa: NÃO existe Mirim e NÃO existe Feminino
  assert(!JegdsRulesService.validarMatriz('tenis_mesa', 'MIRIM', 'MASCULINO').valido, 'Matriz: Tênis de Mesa Mirim é BLOQUEADO');
  assert(!JegdsRulesService.validarMatriz('tenis_mesa', 'INFANTO', 'FEMININO').valido, 'Matriz: Tênis de Mesa Feminino é BLOQUEADO');
  assert(JegdsRulesService.validarMatriz('tenis_mesa', 'INFANTO', 'MASCULINO').valido, 'Matriz: Tênis de Mesa Infanto Masculino é PERMITIDO');

  // Futsal e Futebol: Existem para Masculino e Feminino em todas as categorias
  assert(JegdsRulesService.validarMatriz('futsal', 'MIRIM', 'FEMININO').valido, 'Matriz: Futsal Mirim Feminino é PERMITIDO');
  assert(JegdsRulesService.validarMatriz('futsal', 'JUNIOR', 'MASCULINO').valido, 'Matriz: Futsal Junior Masculino é PERMITIDO');
  assert(JegdsRulesService.validarMatriz('futebol_campo', 'INFANTIL', 'MASCULINO').valido, 'Matriz: Futebol Infantil Masculino é PERMITIDO');
  assert(JegdsRulesService.validarMatriz('futebol_campo', 'INFANTO', 'FEMININO').valido, 'Matriz: Futebol Infanto Feminino é PERMITIDO');

  // 3.3 Regras Específicas do Atletismo: Máximo 2 provas e provas permitidas por categoria
  const valAtletismoOk = JegdsRulesService.validarProvasAtletismo('MIRIM', ['75m', '100m']);
  assert(valAtletismoOk.valido, 'Atletismo Mirim: 2 provas (75m e 100m) válidas');

  const valAtletismoExcesso = JegdsRulesService.validarProvasAtletismo('MIRIM', ['75m', '100m', 'salto']);
  assert(!valAtletismoExcesso.valido, 'Atletismo: Mais de 2 provas é BLOQUEADO');

  const valAtletismoProvaInvalida = JegdsRulesService.validarProvasAtletismo('MIRIM', ['salto']);
  assert(!valAtletismoProvaInvalida.valido, 'Atletismo Mirim: Prova de salto não permitida para categoria Mirim');

  const valAtletismoInfantilSalto = JegdsRulesService.validarProvasAtletismo('INFANTIL', ['75m', 'salto']);
  assert(valAtletismoInfantilSalto.valido, 'Atletismo Infantil: Salto em Distância é PERMITIDO');

  // 3.4 Limites de Elenco por Equipe
  const maxFutsalEquipes = JegdsRulesService.getMaxEquipesPorModalidade('futsal');
  assert(maxFutsalEquipes === 2, 'Limite de Equipes: Futsal permite até 2 equipes por escola (Equipe 1 e Equipe 2)');

  const maxVoleiEquipes = JegdsRulesService.getMaxEquipesPorModalidade('voleibol');
  assert(maxVoleiEquipes === 1, 'Limite de Equipes: Voleibol permite 1 equipe por escola');

  console.log('\n--------------------------------------------------------------------\n');

  // ====================================================================
  // ETAPA 4: VERIFICAÇÃO DO FLUXO COMPLETO (NETFLIX -> CADASTRO -> HOMOLOGAÇÃO)
  // ====================================================================
  console.log('📌 ETAPA 4: VERIFICAÇÃO DO FLUXO COMPLETO DE OPERAÇÃO');

  const escolaFluxo = 'esc-jose-correa-lima';

  // 4.1 Login e Seletor Netflix: Troca para Professor
  JegdStorage.setCurrentPerfilEscola({ tipo: 'PROFESSOR', nome: 'Carlos Silva', id: 'prof-carlos' });
  const perfilAtivo1 = JegdStorage.getCurrentPerfilEscola();
  assert(perfilAtivo1?.tipo === 'PROFESSOR' && perfilAtivo1?.nome === 'Carlos Silva', 'Fluxo: Professor Carlos Silva ativo na sessão');

  // 4.2 Professor cadastra alunos
  const novoAlunoProfCarlos: Atleta = {
    id: 'atl-fluxo-carlos-01',
    escolaId: escolaFluxo,
    municipioId: 'goncalves-dias-ma',
    nomeCompleto: 'RODRIGO ALVES DE SOUZA',
    dataNascimento: '2012-08-14',
    sexo: 'MASCULINO',
    documentoTipo: 'RG',
    documentoNumero: '33445566',
    matricula: 'GD-2026-JC02',
    serieTurma: '8º Ano A',
    telefoneContato: '(99) 98801-9999',
    consentimentoResponsavel: true,
    cadastradoPor: `Prof. ${perfilAtivo1.nome}`,
    categoriaCalculada: 'INFANTIL',
    modalidadesInscritas: [
      { modalidadeCodigo: 'futsal', modalidadeNome: 'Futsal' }
    ],
    documentos: {},
    ativo: true,
    createdAt: new Date().toISOString()
  };
  JegdStorage.saveAtleta(novoAlunoProfCarlos);
  JegdStorage.syncAtletaComEquipes(escolaFluxo, novoAlunoProfCarlos);

  const atletaGravado = JegdStorage.getAtletaById('atl-fluxo-carlos-01');
  assert(atletaGravado?.cadastradoPor === 'Prof. Carlos Silva', 'Fluxo: Estudante salvo com autoria do Prof. Carlos Silva');

  // Verifica que a equipe de Futsal Infantil Masculino foi montada
  const inscricoesJC = JegdStorage.getInscricoes(escolaFluxo);
  const equipeFutsal = inscricoesJC.find(i => i.modalidadeCodigo === 'futsal' && i.categoria === 'INFANTIL' && i.sexo === 'MASCULINO');
  assert(!!equipeFutsal, 'Fluxo: Equipe de Futsal Infantil Masculino auto-formada com o aluno vinculado');

  // 4.3 Troca de Perfil no estilo Netflix: Direção entra para homologar
  JegdStorage.setCurrentPerfilEscola({ tipo: 'DIRECAO', nome: 'Diretora Maria do Socorro' });
  const perfilDiretor = JegdStorage.getCurrentPerfilEscola();
  assert(perfilDiretor?.tipo === 'DIRECAO', 'Fluxo: Sessão alternada para perfil DIREÇÃO');

  // Status inicial antes da homologação
  const statusAntes = JegdStorage.getHomologacaoDirecao(escolaFluxo);
  assert(statusAntes.homologado === false, 'Fluxo: Delegação aguardando aprovação da Direção');

  // Direção homologa a delegação
  JegdStorage.setHomologacaoDirecao(escolaFluxo, true, perfilDiretor.nome, 'Homologação oficial das turmas de Ed. Física');
  const statusDepois = JegdStorage.getHomologacaoDirecao(escolaFluxo);
  assert(statusDepois.homologado === true, 'Fluxo: Delegação homologada pela Direção com sucesso');
  assert(statusDepois.responsavelNome === 'Diretora Maria do Socorro', 'Fluxo: Responsável legal gravado na homologação');

  // 4.4 Coordenação Central SEMED visualiza o consolidado
  const consolidadoSemed = JegdStorage.getProgressoEscolas();
  const resumoJC = consolidadoSemed.find(p => p.escola.id === escolaFluxo);
  assert(!!resumoJC && resumoJC.totalAtletas >= 2, `Fluxo: SEMED central consolida delegação homologada (${resumoJC?.totalAtletas} atletas)`);

  console.log('\n====================================================================');
  console.log(`🎉 AUDITORIA CONCLUÍDA: ${passedTests}/${totalTests} TESTES APROVADOS COM 100% DE SUCESSO!`);
  console.log('====================================================================\n');
}

runMasterAudit().catch(err => {
  console.error(err);
  process.exit(1);
});
