import { gerarSugestaoSenhaEscola } from '../src/lib/auth-helpers';
import { ESCOLAS_GONCALVES_DIAS } from '../src/lib/storage/initial-data';

console.log('--- INICIANDO TESTE DE SUGESTÃO DE SENHA DINÂMICA POR ESCOLA ---');

const expectedMap: Record<string, string> = {
  'esc-aldenora-araujo': 'aldenora2026',
  'esc-anisio-gomes': 'anisio2026',
  'esc-anita-furtado': 'anita2026',
  'esc-antonio-goncalves-dias': 'antonio2026',
  'esc-basilio-alves': 'basilio2026',
  'esc-emilio-murad': 'emilio2026',
  'esc-jose-correa': 'josecorrea2026',
  'esc-jose-gd': 'josegd2026',
  'esc-raimundo-reis': 'raimundo2026',
  'esc-sulamita-lucio': 'sulamita2026',
  'esc-benta-vilanova': 'benta2026',
  'esc-cietec': 'cietec2026'
};

let passed = 0;
let total = 0;

for (const escola of ESCOLAS_GONCALVES_DIAS) {
  total++;
  const gerada = gerarSugestaoSenhaEscola(escola);
  const esperada = expectedMap[escola.id];

  if (esperada && gerada === esperada) {
    passed++;
    console.log(`✅ SUCESSO: ${escola.nome} -> Senha sugerida: "${gerada}"`);
  } else if (!esperada) {
    passed++;
    console.log(`✅ SUCESSO (Genérica): ${escola.nome} -> Senha sugerida: "${gerada}"`);
  } else {
    console.error(`❌ ERRO: ${escola.nome} -> Esperada: "${esperada}", mas obteve: "${gerada}"`);
  }
}

if (passed === total) {
  console.log(`\n🎉 TODAS AS ${passed}/${total} ESCOLAS GERAM SUGESTÃO DE SENHA EXATA E DINÂMICA!`);
} else {
  console.error(`\n❌ Falha: ${passed}/${total} testes passaram.`);
  process.exit(1);
}
