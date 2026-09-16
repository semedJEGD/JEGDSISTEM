import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const escolaId = searchParams.get('escolaId');
    const token = searchParams.get('token');
    const q = searchParams.get('q');

    if (token) {
      const atleta = await prisma.atleta.findFirst({
        where: {
          OR: [
            { crachaToken: token },
            { id: token },
            { matricula: token },
            { documentoNumero: token }
          ]
        },
        include: {
          escola: true,
          registrosControle: {
            orderBy: { timestamp: 'desc' }
          }
        }
      });
      return NextResponse.json({ success: true, data: atleta });
    }

    const where: any = {};
    if (escolaId) {
      where.escolaId = escolaId;
    }
    if (q) {
      where.OR = [
        { nomeCompleto: { contains: q, mode: 'insensitive' } },
        { matricula: { contains: q, mode: 'insensitive' } },
        { crachaToken: { contains: q, mode: 'insensitive' } }
      ];
    }

    const atletas = await prisma.atleta.findMany({
      where,
      include: {
        escola: true,
        registrosControle: {
          orderBy: { timestamp: 'desc' }
        }
      },
      orderBy: { nomeCompleto: 'asc' }
    });

    return NextResponse.json({ success: true, data: atletas });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar atletas' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const dataNascimento = body.dataNascimento
      ? new Date(body.dataNascimento)
      : new Date('2010-01-01');

    const atleta = await prisma.atleta.upsert({
      where: { id: body.id || `atl-${Date.now()}` },
      update: {
        nomeCompleto: body.nomeCompleto,
        dataNascimento,
        sexo: body.sexo,
        documentoTipo: body.documentoTipo || 'RG',
        documentoNumero: body.documentoNumero,
        crachaToken: body.crachaToken,
        matricula: body.matricula,
        turma: body.serieTurma || body.turma,
        tipoSanguineo: body.tipoSanguineo,
        fotoUrl: body.documentos?.foto3x4 || body.fotoUrl,
        documentoUrl: body.documentos?.documentoIdentidade || body.documentoUrl,
        escolaId: body.escolaId,
        categoria: body.categoriaCalculada || body.categoria || 'INFANTIL',
        consentimentoResponsavel: body.consentimentoResponsavel ?? true,
      },
      create: {
        id: body.id,
        nomeCompleto: body.nomeCompleto,
        dataNascimento,
        sexo: body.sexo,
        documentoTipo: body.documentoTipo || 'RG',
        documentoNumero: body.documentoNumero,
        crachaToken: body.crachaToken,
        matricula: body.matricula,
        turma: body.serieTurma || body.turma,
        tipoSanguineo: body.tipoSanguineo,
        fotoUrl: body.documentos?.foto3x4 || body.fotoUrl,
        documentoUrl: body.documentos?.documentoIdentidade || body.documentoUrl,
        escolaId: body.escolaId,
        categoria: body.categoriaCalculada || body.categoria || 'INFANTIL',
        consentimentoResponsavel: body.consentimentoResponsavel ?? true,
      }
    });

    return NextResponse.json({ success: true, data: atleta });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao salvar atleta' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID do atleta não informado' }, { status: 400 });
    }

    await prisma.atleta.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Atleta removido com sucesso' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao remover atleta' },
      { status: 500 }
    );
  }
}
