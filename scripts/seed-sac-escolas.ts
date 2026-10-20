import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ESCOLAS_SAC = [
  {
    id: 'esc-sac-alcides-cesar',
    municipioId: 'senador-alexandre-costa-ma',
    nome: 'Centro de Ensino Alcides César Meneses',
    sigla: 'ALCIDES CÉSAR',
    inep: '21129990',
    endereco: 'Rua Principal, Centro, Senador Alexandre Costa - MA',
    bairro: 'Centro',
    responsavelNome: 'Direção Escolar',
    responsavelTelefone: '(99) 98805-0001',
    loginEmail: 'alcidescesar@educacao.ma.gov.br',
    senhaHash: '123456'
  },
  {
    id: 'esc-sac-gastao-vieira',
    municipioId: 'senador-alexandre-costa-ma',
    nome: 'U.I. Deputado Gastão Vieira',
    sigla: 'GASTÃO VIEIRA',
    inep: '21130001',
    endereco: 'Senador Alexandre Costa - MA',
    bairro: 'Centro',
    responsavelNome: 'Direção SEMED',
    responsavelTelefone: '(99) 98805-0002',
    loginEmail: 'gastaovieira@semed.sac.gov.br',
    senhaHash: '123456'
  },
  {
    id: 'esc-sac-sao-raimundo',
    municipioId: 'senador-alexandre-costa-ma',
    nome: 'U.E. São Raimundo Nonato',
    sigla: 'SÃO RAIMUNDO',
    inep: '21130015',
    endereco: 'Senador Alexandre Costa - MA',
    bairro: 'Bairro Novo',
    responsavelNome: 'Direção SEMED',
    responsavelTelefone: '(99) 98805-0003',
    loginEmail: 'saoraimundo@semed.sac.gov.br',
    senhaHash: '123456'
  },
  {
    id: 'esc-sac-senador-alexandre',
    municipioId: 'senador-alexandre-costa-ma',
    nome: 'U.I. Senador Alexandre Costa',
    sigla: 'SENADOR ALEXANDRE',
    inep: '21130028',
    endereco: 'Senador Alexandre Costa - MA',
    bairro: 'Centro',
    responsavelNome: 'Direção SEMED',
    responsavelTelefone: '(99) 98805-0004',
    loginEmail: 'senadoralexandre@semed.sac.gov.br',
    senhaHash: '123456'
  },
  {
    id: 'esc-sac-maria-rosa',
    municipioId: 'senador-alexandre-costa-ma',
    nome: 'U.E. Maria Rosa',
    sigla: 'MARIA ROSA',
    inep: '21130042',
    endereco: 'Zona Rural, Senador Alexandre Costa - MA',
    bairro: 'Povoado Santana (Zona Rural)',
    responsavelNome: 'Direção SEMED',
    responsavelTelefone: '(99) 98805-0005',
    loginEmail: 'mariarosa@semed.sac.gov.br',
    senhaHash: '123456'
  }
];

async function main() {
  try {
    for (const esc of ESCOLAS_SAC) {
      await prisma.escola.upsert({
        where: { loginEmail: esc.loginEmail },
        update: {
          nome: esc.nome,
          sigla: esc.sigla,
          municipioId: esc.municipioId,
          inep: esc.inep,
          endereco: esc.endereco,
          bairro: esc.bairro,
          responsavelNome: esc.responsavelNome,
          responsavelTelefone: esc.responsavelTelefone,
          senhaHash: esc.senhaHash
        },
        create: esc
      });
      console.log('Escola cadastrada:', esc.sigla);
    }
  } catch (err: any) {
    console.error('Erro ao cadastrar escolas:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
