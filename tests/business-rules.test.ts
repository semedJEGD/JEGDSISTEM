import {
  JegdsRulesService,
  CategoriaEtariaJEGDS,
  SexoJEGDS,
  ModalidadeCodigoJEGDS,
  MODALIDADES_JEGDS,
  PROVAS_ATLETISMO_POR_CATEGORIA
} from '../src/services/jegds-rules';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FALHA: ${message}`);
    throw new Error(message);
  } else {
    console.log(`✅ SUCESSO: ${message}`);
  }
}

console.log('--- INICIANDO TESTES DE REGRAS DE NEGÓCIO DO JEGDS 2026 ---\n');

// 1. TESTE DE CÁLCULO DE CATEGORIAS POR DATA DE NASCIMENTO (Ref: 31/12/2026)
console.log('1. Testes de Cálculo de Categorias:');
// Mirim: 9 a 11 anos (Nascidos entre 2015 e 2017)
const resMirim = JegdsRulesService.calcularCategoria('2015-05-10');
assert(resMirim.categoria === 'MIRIM', 'Nascido em 2015 deve ser MIRIM (11 anos)');

const resMirim9 = JegdsRulesService.calcularCategoria('2017-12-31');
assert(resMirim9.categoria === 'MIRIM', 'Nascido em 2017 deve ser MIRIM (9 anos)');

// Infantil: 12 a 14 anos (Nascidos entre 2012 e 2014)
const resInfantil = JegdsRulesService.calcularCategoria('2013-08-20');
assert(resInfantil.categoria === 'INFANTIL', 'Nascido em 2013 deve ser INFANTIL (13 anos)');

// Infanto: 15 a 17 anos (Nascidos entre 2009 e 2011)
const resInfanto = JegdsRulesService.calcularCategoria('2010-04-18');
assert(resInfanto.categoria === 'INFANTO', 'Nascido em 2010 deve ser INFANTO (16 anos)');

// Junior: 18 a 20 anos (Nascidos entre 2006 e 2008)
const resJunior = JegdsRulesService.calcularCategoria('2007-02-15');
assert(resJunior.categoria === 'JUNIOR', 'Nascido em 2007 deve ser JUNIOR (19 anos)');

// Fora da faixa (Menor que 9 ou Maior que 20)
const resMuitoNovo = JegdsRulesService.calcularCategoria('2019-01-01');
assert(resMuitoNovo.categoria === null, 'Nascido em 2019 (7 anos) deve retornar null / fora da faixa');

const resMuitoVelho = JegdsRulesService.calcularCategoria('2004-01-01');
assert(resMuitoVelho.categoria === null, 'Nascido em 2004 (22 anos) deve retornar null / fora da faixa');

// 2. TESTE DA MATRIZ MODALIDADE X CATEGORIA X SEXO
console.log('\n2. Testes da Matriz Restrita:');

// Voleibol, Beach Soccer e Tênis de Mesa NÃO existem para Mirim
assert(
  !JegdsRulesService.validarMatriz('voleibol', 'MIRIM', 'MASCULINO').valido,
  'Voleibol Mirim deve ser BLOQUEADO'
);
assert(
  !JegdsRulesService.validarMatriz('beach_soccer', 'MIRIM', 'MASCULINO').valido,
  'Beach Soccer Mirim deve ser BLOQUEADO'
);
assert(
  !JegdsRulesService.validarMatriz('tenis_mesa', 'MIRIM', 'MASCULINO').valido,
  'Tênis de Mesa Mirim deve ser BLOQUEADO'
);

// Voleibol, Beach Soccer e Tênis de Mesa são válidos a partir do Infantil (MASC)
assert(
  JegdsRulesService.validarMatriz('voleibol', 'INFANTIL', 'MASCULINO').valido,
  'Voleibol Infantil Masculino deve ser PERMITIDO'
);
assert(
  JegdsRulesService.validarMatriz('beach_soccer', 'INFANTO', 'MASCULINO').valido,
  'Beach Soccer Infanto Masculino deve ser PERMITIDO'
);
assert(
  JegdsRulesService.validarMatriz('tenis_mesa', 'JUNIOR', 'MASCULINO').valido,
  'Tênis de Mesa Junior Masculino deve ser PERMITIDO'
);

// Voleibol, Beach Soccer, Futebol de Campo e Tênis de Mesa são EXCLUSIVAMENTE MASCULINOS
assert(
  !JegdsRulesService.validarMatriz('futebol_campo', 'INFANTIL', 'FEMININO').valido,
  'Futebol de Campo Feminino deve ser BLOQUEADO'
);
assert(
  !JegdsRulesService.validarMatriz('voleibol', 'INFANTO', 'FEMININO').valido,
  'Voleibol Feminino deve ser BLOQUEADO'
);
assert(
  !JegdsRulesService.validarMatriz('beach_soccer', 'INFANTIL', 'FEMININO').valido,
  'Beach Soccer Feminino deve ser BLOQUEADO'
);
assert(
  !JegdsRulesService.validarMatriz('tenis_mesa', 'INFANTO', 'FEMININO').valido,
  'Tênis de Mesa Feminino deve ser BLOQUEADO'
);

// Futsal, Queimada, Xadrez e Atletismo são permitidos em FEM e MASC em todas as 4 categorias
const modalidadesAmbosSexos: ModalidadeCodigoJEGDS[] = ['futsal', 'queimada', 'xadrez', 'atletismo'];
const categoriasTodas: CategoriaEtariaJEGDS[] = ['MIRIM', 'INFANTIL', 'INFANTO', 'JUNIOR'];

for (const mod of modalidadesAmbosSexos) {
  for (const cat of categoriasTodas) {
    assert(
      JegdsRulesService.validarMatriz(mod, cat, 'FEMININO').valido,
      `${mod} ${cat} Feminino deve ser PERMITIDO`
    );
    assert(
      JegdsRulesService.validarMatriz(mod, cat, 'MASCULINO').valido,
      `${mod} ${cat} Masculino deve ser PERMITIDO`
    );
  }
}

// 3. TESTE DE LIMITES DE PROVAS DE ATLETISMO
console.log('\n3. Testes de Provas de Atletismo:');
// Máximo 2 provas
assert(
  JegdsRulesService.validarProvasAtletismo('MIRIM', ['75m', '100m']).valido,
  '2 provas permitidas em Mirim (75m e 100m) deve ser VÁLIDO'
);
assert(
  !JegdsRulesService.validarProvasAtletismo('MIRIM', ['75m', '100m', '200m']).valido,
  '3 provas de atletismo deve ser BLOQUEADO (máx 2)'
);
assert(
  !JegdsRulesService.validarProvasAtletismo('MIRIM', ['salto']).valido,
  'Salto para categoria Mirim deve ser BLOQUEADO (só 75m e 100m)'
);
assert(
  JegdsRulesService.validarProvasAtletismo('INFANTIL', ['75m', 'salto']).valido,
  '75m e salto para Infantil deve ser VÁLIDO'
);
assert(
  JegdsRulesService.validarProvasAtletismo('INFANTO', ['400m', 'salto']).valido,
  '400m e salto para Infanto deve ser VÁLIDO'
);

// 4. TESTE DE LIMITES DE ELENCO
console.log('\n4. Testes de Limites de Elenco:');
// Futsal máx 10
assert(
  JegdsRulesService.validarLimiteElenco('futsal', 10).valido,
  'Futsal com 10 atletas deve ser VÁLIDO'
);
assert(
  !JegdsRulesService.validarLimiteElenco('futsal', 11).valido,
  'Futsal com 11 atletas deve ser BLOQUEADO (máx 10)'
);

// Futebol de Campo máx 20
assert(
  JegdsRulesService.validarLimiteElenco('futebol_campo', 20).valido,
  'Futebol com 20 atletas deve ser VÁLIDO'
);
assert(
  !JegdsRulesService.validarLimiteElenco('futebol_campo', 21).valido,
  'Futebol com 21 atletas deve ser BLOQUEADO (máx 20)'
);

// Queimada mín 8
assert(
  JegdsRulesService.validarLimiteElenco('queimada', 8).valido,
  'Queimada com 8 atletas deve ser VÁLIDO'
);
assert(
  !JegdsRulesService.validarLimiteElenco('queimada', 7).valido,
  'Queimada com 7 atletas deve ser BLOQUEADO (mínimo 8)'
);

console.log('\n🎉 TODOS OS TESTES DE REGRAS DE NEGÓCIO PASSARAM COM 100% DE SUCESSO!');
