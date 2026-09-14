import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [escolas, atletas, modalidades, registros, comunicados] = await Promise.all([
      prisma.escola.findMany({ orderBy: { nome: 'asc' } }),
      prisma.atleta.findMany({ orderBy: { nomeCompleto: 'asc' } }),
      prisma.modalidade.findMany({ orderBy: { nome: 'asc' } }),
      prisma.registroControle.findMany({ orderBy: { timestamp: 'desc' } }),
      prisma.comunicado.findMany({ orderBy: { dataPublicacao: 'desc' } })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        escolas,
        atletas,
        modalidades,
        registros,
        comunicados
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao sincronizar dados com PostgreSQL' },
      { status: 500 }
    );
  }
}
