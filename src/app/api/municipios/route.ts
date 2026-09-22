import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const municipios = await prisma.municipio.findMany({
      where: { ativo: true },
      include: {
        _count: {
          select: {
            escolas: true,
            atletas: true,
            inscricoes: true,
          }
        }
      },
      orderBy: { nome: 'asc' },
    });
    return NextResponse.json({ success: true, data: municipios });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar municípios' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slug = (body.slug || body.nome)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const municipio = await prisma.municipio.upsert({
      where: { slug },
      update: {
        nome: body.nome,
        sigla: body.sigla,
        uf: body.uf || 'MA',
        nomeEvento: body.nomeEvento || `Jogos Escolares de ${body.nome}`,
        siglaEvento: body.siglaEvento || `JEG-${body.sigla || '2026'}`,
        logoUrl: body.logoUrl,
        brasaoUrl: body.brasaoUrl,
        contatoSemed: body.contatoSemed,
        ativo: body.ativo ?? true,
      },
      create: {
        id: body.id || `mun-${slug}`,
        nome: body.nome,
        sigla: body.sigla,
        uf: body.uf || 'MA',
        slug,
        nomeEvento: body.nomeEvento || `Jogos Escolares de ${body.nome}`,
        siglaEvento: body.siglaEvento || `JEG-${body.sigla || '2026'}`,
        logoUrl: body.logoUrl,
        brasaoUrl: body.brasaoUrl,
        contatoSemed: body.contatoSemed,
        ativo: body.ativo ?? true,
      },
    });

    return NextResponse.json({ success: true, data: municipio });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao salvar município' },
      { status: 500 }
    );
  }
}
