import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const escolaId = searchParams.get('escolaId');

    const where: any = {};
    if (escolaId) {
      where.escolaId = escolaId;
    }

    const inscricoes = await prisma.inscricao.findMany({
      where,
      include: {
        atleta: true,
        escola: true,
        modalidade: true
      },
      orderBy: { dataInscricao: 'desc' }
    });

    return NextResponse.json({ success: true, data: inscricoes });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar inscrições' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, escolaId, modalidadeCodigo, modalidadeNome, categoria, sexo, atletaIds, provasPorAtleta, status, motivoRejeicao, parecerComite, dataInscricao } = body;

    if (!escolaId || !modalidadeCodigo || !categoria || !sexo || !atletaIds || !Array.isArray(atletaIds)) {
      return NextResponse.json({ success: false, error: 'Dados incompletos para inscrição da equipe' }, { status: 400 });
    }

    // Localizar município da escola se não enviado
    let municipioId = body.municipioId;
    if (!municipioId && escolaId) {
      const esc = await prisma.escola.findUnique({ where: { id: escolaId } });
      if (esc) municipioId = esc.municipioId;
    }

    // Localizar ou criar a Modalidade
    let modalidade = await prisma.modalidade.findFirst({
      where: { 
        codigo: modalidadeCodigo,
        ...(municipioId ? { municipioId } : {})
      }
    });

    if (!modalidade) {
      modalidade = await prisma.modalidade.findFirst({
        where: { codigo: modalidadeCodigo }
      });
    }

    if (!modalidade) {
      modalidade = await prisma.modalidade.create({
        data: {
          codigo: modalidadeCodigo,
          nome: modalidadeNome || modalidadeCodigo,
          tipo: 'COLETIVA',
          dataEvento: new Date('2026-12-12T00:00:00Z'),
          prazoInscricao: new Date('2026-12-05T00:00:00Z'),
          municipioId: municipioId || undefined
        }
      });
    }

    // Criar ou atualizar as inscrições dos atletas nesta modalidade
    const criados = [];
    for (const atletaId of atletaIds) {
      const provas = provasPorAtleta?.[atletaId];
      const provaStr = provas && provas.length > 0 ? provas.join(',') : null;

      const insc = await prisma.inscricao.upsert({
        where: {
          atletaId_modalidadeId_prova: {
            atletaId,
            modalidadeId: modalidade.id,
            prova: provaStr || ''
          }
        },
        update: {
          status: status || 'PENDENTE',
          motivoRejeicao: motivoRejeicao || null,
          categoria: categoria as any,
          sexo: sexo as any,
          equipe: id || undefined,
          municipioId: municipioId || undefined
        },
        create: {
          id: `${id || 'insc'}-${atletaId}`,
          atletaId,
          modalidadeId: modalidade.id,
          escolaId,
          municipioId: municipioId || undefined,
          categoria: categoria as any,
          sexo: sexo as any,
          prova: provaStr || '',
          equipe: id || 'EQUIPE-OFICIAL',
          status: status || 'PENDENTE',
          motivoRejeicao: motivoRejeicao || null
        }
      });
      criados.push(insc);
    }

    return NextResponse.json({ success: true, data: criados });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao processar inscrição' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID da inscrição não informado' }, { status: 400 });
    }

    await prisma.inscricao.deleteMany({
      where: {
        OR: [
          { id: id },
          { equipe: id }
        ]
      }
    });

    return NextResponse.json({ success: true, message: 'Inscrição removida com sucesso' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao excluir inscrição' },
      { status: 500 }
    );
  }
}
