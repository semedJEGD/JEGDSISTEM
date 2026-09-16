import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [escolas, atletas, modalidades, registros, comunicados, inscricoes] = await Promise.all([
      prisma.escola.findMany({ orderBy: { nome: 'asc' } }),
      prisma.atleta.findMany({
        include: { escola: true },
        orderBy: { nomeCompleto: 'asc' }
      }),
      prisma.modalidade.findMany({ orderBy: { nome: 'asc' } }),
      prisma.registroControle.findMany({ orderBy: { timestamp: 'desc' } }),
      prisma.comunicado.findMany({ orderBy: { dataPublicacao: 'desc' } }),
      prisma.inscricao.findMany({
        include: { atleta: true, modalidade: true, escola: true },
        orderBy: { dataInscricao: 'desc' }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        escolas,
        atletas,
        modalidades,
        registros,
        comunicados,
        inscricoes
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao sincronizar dados com PostgreSQL' },
      { status: 500 }
    );
  }
}
