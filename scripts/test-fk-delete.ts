import { prisma } from '../src/lib/prisma';

async function main() {
  const atls = await prisma.atleta.findMany({
    where: {
      OR: [
        { nomeCompleto: { contains: 'TESTE', mode: 'insensitive' } },
        { id: { contains: 'teste' } }
      ]
    },
    include: {
      inscricoes: true
    }
  });

  console.log(`Encontrados ${atls.length} atletas:`);
  for (const a of atls) {
    console.log(`- Atleta ${a.id}: ${a.inscricoes.length} inscricoes vinculadas`);
    try {
      console.log(`Tentando prisma.atleta.delete(${a.id})...`);
      await prisma.atleta.delete({ where: { id: a.id } });
      console.log('-> Sucesso!');
    } catch (err: any) {
      console.error('-> FALHA ao deletar:', err.message);
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });

