import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    let mun = await prisma.municipio.findFirst({
      where: { slug: 'senador-alexandre-costa' }
    });

    if (!mun) {
      mun = await prisma.municipio.create({
        data: {
          id: 'senador-alexandre-costa-ma',
          nome: 'Senador Alexandre Costa',
          sigla: 'SAC',
          uf: 'MA',
          slug: 'senador-alexandre-costa',
          nomeEvento: 'Jogos Escolares de Senador Alexandre Costa',
          siglaEvento: 'JESAC 2026',
          brasaoUrl: '/logos/brasao-senador-alexandre-costa.png',
          contatoSemed: 'semed@senadoralexandrecosta.ma.gov.br',
          ativo: true
        }
      });
      console.log('Município SAC criado:', mun.id);
    } else {
      console.log('Município SAC já existia:', mun.id);
    }

    const user = await prisma.usuario.upsert({
      where: { email: 'josean.amorim@semed.sac.gov.br' },
      update: {
        nome: 'Josean Amorim',
        municipioId: mun.id,
        senhaHash: 'semed2026',
        papel: 'COMITE'
      },
      create: {
        id: 'coord-sac-josean-amorim',
        nome: 'Josean Amorim',
        email: 'josean.amorim@semed.sac.gov.br',
        municipioId: mun.id,
        senhaHash: 'semed2026',
        papel: 'COMITE'
      }
    });

    console.log('Coordenador Josean Amorim registrado com sucesso:', user.id, user.nome, user.email);
  } catch (err: any) {
    console.error('Erro ao executar seed de Josean Amorim:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
