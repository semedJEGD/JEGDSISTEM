import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const atletaId = searchParams.get('atletaId');
    const tipo = searchParams.get('tipo');

    const where: any = {};
    if (atletaId) where.atletaId = atletaId;
    if (tipo) where.tipo = tipo;

    const registros = await prisma.registroControle.findMany({
      where,
      include: {
        atleta: {
          include: { escola: true }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    return NextResponse.json({ success: true, data: registros });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar registros logísticos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const registro = await prisma.registroControle.create({
      data: {
        id: body.id || `reg-${Date.now()}`,
        atletaId: body.atletaId,
        tipo: body.tipo,
        registradoPor: body.registradoPor || 'Operador',
        papelOperador: body.papelOperador,
        escolaId: body.escolaId,
        detalhes: body.detalhes,
        timestamp: body.timestamp ? new Date(body.timestamp) : new Date()
      },
      include: {
        atleta: true
      }
    });

    return NextResponse.json({ success: true, data: registro });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao registrar evento logístico' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID é obrigatório' }, { status: 400 });
    }

    await prisma.registroControle.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao excluir registro' },
      { status: 500 }
    );
  }
}
