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
  const escola1 = await prisma.escola.upsert({
    where: { loginEmail: 'uigd@semed.gd.gov.br' },
    update: {},
    create: {
      nome: 'Unidade Integrada Gonçalves Dias',
      sigla: 'UIGD',
      inep: '21004512',
      endereco: 'Rua Principal, 100 - Centro, Gonçalves Dias - MA',
      bairro: 'Centro',
      responsavelNome: 'Prof. Antônio Carlos Lima',
      responsavelTelefone: '(99) 98112-2030',
      loginEmail: 'uigd@semed.gd.gov.br',
      senhaHash: senhaHashEscola
    }
  });

  await prisma.usuario.upsert({
    where: { email: 'uigd@semed.gd.gov.br' },
    update: {},
    create: {
      nome: 'Diretoria UIGD',
      email: 'uigd@semed.gd.gov.br',
      senhaHash: senhaHashEscola,
      papel: 'ESCOLA',
      escolaId: escola1.id
    }
  });

  console.log('✅ SEED EXECUTADO COM SUCESSO!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
