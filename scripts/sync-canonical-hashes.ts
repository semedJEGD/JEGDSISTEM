import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';
import { gerarSugestaoSenhaEscola } from '../src/lib/auth-helpers';

async function main() {
  console.log('--- ATUALIZANDO HASHES CANÔNICOS DAS ESCOLAS NO BANCO ---');
  const escolas = await prisma.escola.findMany({
    orderBy: { nome: 'asc' }
  });

  for (const esc of escolas) {
    const senha = gerarSugestaoSenhaEscola(esc as any);
    const hash = await bcrypt.hash(senha, 10);
    await prisma.escola.update({
      where: { id: esc.id },
      data: { senhaHash: hash }
    });
    console.log(`✅ [HASH OK] ${esc.nome}: "${senha}" gravado com sucesso no DB.`);
  }

  console.log(`\n🎉 Total de ${escolas.length} escolas atualizadas com senhas canônicas isoladas!`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
