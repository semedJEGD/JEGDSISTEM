import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const escolas = await prisma.escola.findMany({
      orderBy: { nome: 'asc' },
    });
    return NextResponse.json({ success: true, data: escolas });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar escolas' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const escola = await prisma.escola.upsert({
      where: { loginEmail: body.loginEmail },
      update: {
        nome: body.nome,
        sigla: body.sigla,
        inep: body.inep,
        endereco: body.endereco,
        bairro: body.bairro,
        responsavelNome: body.responsavelNome,
        responsavelTelefone: body.responsavelTelefone,
        senhaHash: body.senhaHash || '123456',
      },
      create: {
        id: body.id,
        nome: body.nome,
        sigla: body.sigla,
        inep: body.inep,
        endereco: body.endereco || 'Gonçalves Dias - MA',
        bairro: body.bairro || 'Centro',
        responsavelNome: body.responsavelNome || 'Direção / Coordenação',
        responsavelTelefone: body.responsavelTelefone || '(99) 98801-0000',
        loginEmail: body.loginEmail,
        senhaHash: body.senhaHash || '123456',
      },
    });

    return NextResponse.json({ success: true, data: escola });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao salvar escola' },
      { status: 500 }
    );
  }
}
