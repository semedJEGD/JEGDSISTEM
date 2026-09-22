import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const municipioId = searchParams.get('municipioId');

    const whereMunicipio = municipioId && municipioId !== 'ALL' ? { municipioId } : {};

    const [municipios, escolas, atletas, modalidades, registros, comunicados, inscricoes] = await Promise.all([
      prisma.municipio.findMany({ orderBy: { nome: 'asc' } }),
      prisma.escola.findMany({
        where: whereMunicipio,
        orderBy: { nome: 'asc' }
      }),
      prisma.atleta.findMany({
        where: whereMunicipio,
        include: { escola: true },
        orderBy: { nomeCompleto: 'asc' }
      }),
      prisma.modalidade.findMany({ orderBy: { nome: 'asc' } }),
      prisma.registroControle.findMany({
        where: whereMunicipio,
        orderBy: { timestamp: 'desc' }
      }),
      prisma.comunicado.findMany({
        where: whereMunicipio,
        orderBy: { dataPublicacao: 'desc' }
      }),
      prisma.inscricao.findMany({
        where: whereMunicipio,
        include: { atleta: true, modalidade: true, escola: true },
        orderBy: { dataInscricao: 'desc' }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        municipios,
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
