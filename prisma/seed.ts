import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- SEEDING JEGDS 2026 DATABASE ---');

  // 1. Modalidades Oficiais
  const modalidades = [
    {
      codigo: 'queimada',
      nome: 'Queimada',
      tipo: 'COLETIVA',
      dataEvento: new Date('2026-11-28T08:00:00Z'),
      prazoInscricao: new Date('2026-11-21T23:59:59Z'),
      minAtletas: 8,
      maxAtletas: 12,
      maxProvasPorAtleta: 1,
      descricao: 'Dinâmica de 8 atletas em quadra. Todas as 4 categorias (Fem e Masc).'
    },
    {
      codigo: 'tenis_mesa',
      nome: 'Tênis de Mesa',
      tipo: 'INDIVIDUAL',
      dataEvento: new Date('2026-11-28T08:00:00Z'),
      prazoInscricao: new Date('2026-11-21T23:59:59Z'),
      minAtletas: 1,
      maxAtletas: 4,
      maxProvasPorAtleta: 1,
      descricao: 'Apenas Masculino a partir do Infantil (12 anos).'
    },
    {
      codigo: 'atletismo',
      nome: 'Atletismo',
      tipo: 'INDIVIDUAL',
      dataEvento: new Date('2026-12-05T07:30:00Z'),
      prazoInscricao: new Date('2026-11-28T23:59:59Z'),
      minAtletas: 1,
      maxAtletas: 8,
      maxProvasPorAtleta: 2,
      provasDisponiveis: ['75m', '100m', '200m', '400m', '1000m', 'salto'],
      descricao: 'Máx 2 provas por atleta. Mirim, Infantil, Infanto e Junior (Fem e Masc).'
    },
    {
      codigo: 'beach_soccer',
      nome: 'Beach Soccer',
      tipo: 'COLETIVA',
      dataEvento: new Date('2026-12-05T08:00:00Z'),
      prazoInscricao: new Date('2026-11-28T23:59:59Z'),
      minAtletas: 5,
      maxAtletas: 12,
      maxProvasPorAtleta: 1,
      descricao: 'Apenas Masculino na areia a partir do Infantil (12 anos).'
    },
    {
      codigo: 'futsal',
      nome: 'Futsal',
      tipo: 'COLETIVA',
      dataEvento: new Date('2026-12-12T08:00:00Z'),
      prazoInscricao: new Date('2026-12-05T23:59:59Z'),
      minAtletas: 5,
      maxAtletas: 10,
      maxProvasPorAtleta: 1,
      descricao: 'Máximo 10 atletas inscritos por equipe/categoria/sexo.'
    },
    {
      codigo: 'xadrez',
      nome: 'Xadrez',
      tipo: 'INDIVIDUAL',
      dataEvento: new Date('2026-12-12T08:30:00Z'),
      prazoInscricao: new Date('2026-12-05T23:59:59Z'),
      minAtletas: 1,
      maxAtletas: 4,
      maxProvasPorAtleta: 1,
      descricao: 'Disputa em Sistema Suíço em todas as categorias (Fem e Masc).'
    },
    {
      codigo: 'futebol_campo',
      nome: 'Futebol de Campo',
      tipo: 'COLETIVA',
      dataEvento: new Date('2026-12-12T08:00:00Z'),
      prazoInscricao: new Date('2026-12-05T23:59:59Z'),
      minAtletas: 11,
      maxAtletas: 20,
      maxProvasPorAtleta: 1,
      descricao: 'Apenas Masculino. Máximo 20 atletas no elenco.'
    },
    {
      codigo: 'voleibol',
      nome: 'Voleibol',
      tipo: 'COLETIVA',
      dataEvento: new Date('2026-12-12T08:00:00Z'),
      prazoInscricao: new Date('2026-12-05T23:59:59Z'),
      minAtletas: 6,
      maxAtletas: 12,
      maxProvasPorAtleta: 1,
      descricao: 'Apenas Masculino a partir do Infantil (12 anos).'
    }
  ];

  for (const mod of modalidades) {
    await prisma.modalidade.upsert({
      where: { codigo: mod.codigo },
      update: mod,
      create: mod
    });
  }

  // 2. Usuário Administrador do Comitê Organizador
  const senhaHashComite = await bcrypt.hash('semed2026', 10);
  await prisma.usuario.upsert({
    where: { email: 'admin.comite@jegds.com.br' },
    update: {},
    create: {
      nome: 'Comitê Organizador JEGDS 2026',
      email: 'admin.comite@jegds.com.br',
      senhaHash: senhaHashComite,
      papel: 'COMITE'
    }
  });

  // 3. Escolas de Gonçalves Dias - MA
  const senhaHashEscola = await bcrypt.hash('123456', 10);
  const escolasLista = [
    { id: 'esc-aldenora-araujo', nome: 'Aldenora Araújo', sigla: 'ALDENORA ARAÚJO', inep: '21004501', loginEmail: 'aldenora@semed.gd.gov.br' },
    { id: 'esc-anisio-gomes', nome: 'Anísio Gomes', sigla: 'ANÍSIO GOMES', inep: '21004502', loginEmail: 'anisiogomes@semed.gd.gov.br' },
    { id: 'esc-anita-furtado', nome: 'Anita Furtado', sigla: 'ANITA FURTADO', inep: '21004503', loginEmail: 'anitafurtado@semed.gd.gov.br' },
    { id: 'esc-antonio-goncalves-dias', nome: 'Antônio Gonçalves Dias', sigla: 'ANTÔNIO GD', inep: '21004504', loginEmail: 'antoniogd@semed.gd.gov.br' },
    { id: 'esc-basilio-alves', nome: 'Basílio Alves', sigla: 'BASÍLIO ALVES', inep: '21004505', loginEmail: 'basilioalves@semed.gd.gov.br' },
    { id: 'esc-emilio-murad', nome: 'Emílio Murad', sigla: 'EMÍLIO MURAD', inep: '21004506', loginEmail: 'emiliomurad@semed.gd.gov.br' },
    { id: 'esc-jose-correa-lima', nome: 'José Corrêa Lima', sigla: 'JOSÉ CORRÊA', inep: '21004507', loginEmail: 'josecorrea@semed.gd.gov.br' },
    { id: 'esc-jose-goncalves-dias', nome: 'José Gonçalves Dias', sigla: 'JOSÉ GD', inep: '21004508', loginEmail: 'josegd@semed.gd.gov.br' },
    { id: 'esc-raimundo-reis', nome: 'Raimundo Reis', sigla: 'RAIMUNDO REIS', inep: '21004509', loginEmail: 'raimundoreis@semed.gd.gov.br' },
    { id: 'esc-ce-sulamita-lucio', nome: 'C.E Sulamita Lúcio', sigla: 'C.E SULAMITA LÚCIO', inep: '21004510', loginEmail: 'sulamitalucio@educacao.ma.gov.br' },
    { id: 'esc-ue-benta-vilanova', nome: 'U.E Benta Vilanova', sigla: 'U.E BENTA VILANOVA', inep: '21004511', loginEmail: 'bentavilanova@semed.gd.gov.br' },
    { id: 'esc-cietec', nome: 'C.I.E.T.E.C', sigla: 'C.I.E.T.E.C', inep: '21004512', loginEmail: 'cietec@semed.gd.gov.br' }
  ];

  for (const esc of escolasLista) {
    await prisma.escola.upsert({
      where: { loginEmail: esc.loginEmail },
      update: {},
      create: {
        id: esc.id,
        nome: esc.nome,
        sigla: esc.sigla,
        inep: esc.inep,
        endereco: 'Gonçalves Dias - MA',
        bairro: 'Centro',
        responsavelNome: 'Direção / Coordenação',
        responsavelTelefone: '(99) 98801-0000',
        loginEmail: esc.loginEmail,
        senhaHash: senhaHashEscola
      }
    });

    await prisma.usuario.upsert({
      where: { email: esc.loginEmail },
      update: {},
      create: {
        nome: `Prof. Responsável - ${esc.sigla}`,
        email: esc.loginEmail,
        senhaHash: senhaHashEscola,
        papel: 'PROFESSOR',
        escolaId: esc.id
      }
    });
  }

  console.log('✅ SEED EXECUTADO COM SUCESSO COM AS 12 ESCOLAS DE GONÇALVES DIAS!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

