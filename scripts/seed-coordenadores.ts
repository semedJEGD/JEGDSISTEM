import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('semed2026', 10);

  const elias = await prisma.usuario.upsert({
    where: { email: 'elias.veloso@semed.gd.gov.br' },
    update: {
      nome: 'Elias Veloso',
      papel: 'COMITE',
      municipioId: 'goncalves-dias-ma',
      senhaHash: hash
    },
    create: {
      id: 'coord-elias-veloso',
      nome: 'Elias Veloso',
      email: 'elias.veloso@semed.gd.gov.br',
      papel: 'COMITE',
      municipioId: 'goncalves-dias-ma',
      senhaHash: hash
    }
  });
  console.log('✅ Elias Veloso seeded:', elias.id, elias.nome, elias.email);

  const herbert = await prisma.usuario.upsert({
    where: { email: 'herbert.sa@semed.gd.gov.br' },
    update: {
      nome: 'Herbert de Sá',
      papel: 'COMITE',
      municipioId: 'goncalves-dias-ma',
      senhaHash: hash
    },
    create: {
      id: 'coord-herbert-sa',
      nome: 'Herbert de Sá',
      email: 'herbert.sa@semed.gd.gov.br',
      papel: 'COMITE',
      municipioId: 'goncalves-dias-ma',
      senhaHash: hash
    }
  });
  console.log('✅ Herbert de Sá seeded:', herbert.id, herbert.nome, herbert.email);
}

main()
  .catch((e) => {
    console.error('Erro ao executar seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

