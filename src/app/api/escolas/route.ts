import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const municipioId = searchParams.get('municipioId');
    const where = municipioId && municipioId !== 'ALL' ? { municipioId } : {};

    const escolas = await prisma.escola.findMany({
      where,
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
        municipioId: body.municipioId,
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
        municipioId: body.municipioId,
        nome: body.nome,
        sigla: body.sigla,
        inep: body.inep,
        endereco: body.endereco || 'Endereço Institucional',
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
