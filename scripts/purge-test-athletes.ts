import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('--- PURGANDO TODOS OS ATLETAS TESTE DO NEON POSTGRESQL ---');
  const atls = await prisma.atleta.findMany({
    where: {
      OR: [
        { nomeCompleto: { contains: 'TESTE', mode: 'insensitive' } },
        { id: { contains: 'teste' } },
        { documentoNumero: { contains: 'TESTE', mode: 'insensitive' } }
      ]
    }
  });

  console.log(`Encontrados ${atls.length} atletas para purgar:`);
  for (const a of atls) {
    console.log(`- Purgando: ${a.nomeCompleto} (${a.id})`);
    await prisma.registroControle.deleteMany({ where: { atletaId: a.id } });
    await prisma.inscricao.deleteMany({ where: { atletaId: a.id } });
    await prisma.atleta.delete({ where: { id: a.id } });
  }

  // Verifica se restou algum
  const restantes = await prisma.atleta.count({
    where: {
      OR: [
        { nomeCompleto: { contains: 'TESTE', mode: 'insensitive' } },
        { id: { contains: 'teste' } },
        { documentoNumero: { contains: 'TESTE', mode: 'insensitive' } }
      ]
    }
  });
  console.log(`Atletas teste restantes no banco: ${restantes}`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

