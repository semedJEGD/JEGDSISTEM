import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const preferredRegion = ['gru1'];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const municipioId = searchParams.get('municipioId');
    const where = municipioId && municipioId !== 'ALL' ? { municipioId } : {};

    const escolas = await prisma.escola.findMany({
      where,
      select: {
        id: true,
        municipioId: true,
        nome: true,
        sigla: true,
        inep: true,
        endereco: true,
        bairro: true,
        responsavelNome: true,
        responsavelTelefone: true,
        loginEmail: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { nome: 'asc' },
    });
    return NextResponse.json(
      { success: true, data: escolas },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
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
