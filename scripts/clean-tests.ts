import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const atls = await prisma.atleta.findMany({
    where: {
      OR: [
        { id: { contains: 'teste' } },
        { nomeCompleto: { contains: 'TESTE' } }
      ]
    }
  });

  for (const a of atls) {
    await prisma.inscricao.deleteMany({ where: { atletaId: a.id } });
    await prisma.atleta.delete({ where: { id: a.id } });
    console.log(`Deletado teste: ${a.nomeCompleto} (${a.id})`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

