import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const preferredRegion = ['gru1'];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const escolaId = searchParams.get('escolaId');
    const municipioId = searchParams.get('municipioId');

    const where: any = {};
    if (municipioId && municipioId !== 'ALL') {
      where.municipioId = municipioId;
    }
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
    const equipeChave = id || `insc-${escolaId}-${modalidade.codigo}-${categoria}-${sexo}`;

    for (const atletaId of atletaIds) {
      // Garante que o atleta existe no banco de dados para evitar erro de chave estrangeira
      const atletaExiste = await prisma.atleta.findUnique({ where: { id: atletaId } });
      if (!atletaExiste) {
        console.warn(`Atleta ${atletaId} não encontrado no banco para inscrição na modalidade ${modalidade.codigo}`);
        continue;
      }

      const provas = provasPorAtleta?.[atletaId];
      const provaStr = Array.isArray(provas) && provas.length > 0 ? provas.filter(Boolean).join(',') : '';

      // Atualiza a inscrição existente da mesma modalidade in-place (sem duplicar nem apagar provas já salvas!)
      const existentes = await prisma.inscricao.findMany({
        where: {
          atletaId,
          modalidadeId: modalidade.id,
        },
        orderBy: { dataInscricao: 'desc' },
      });

      let insc;
      if (existentes.length > 0) {
        const principal = existentes.find((e) => e.prova && e.prova.trim() !== '') || existentes[0];
        const duplicatas = existentes.filter((e) => e.id !== principal.id);
        if (duplicatas.length > 0) {
          await prisma.inscricao.deleteMany({
            where: { id: { in: duplicatas.map((d) => d.id) } },
          });
        }
        const provaFinal = provaStr || principal.prova || '';
        insc = await prisma.inscricao.update({
          where: { id: principal.id },
          data: {
            status: status || principal.status || 'PENDENTE',
            motivoRejeicao: motivoRejeicao !== undefined ? motivoRejeicao : principal.motivoRejeicao,
            categoria: categoria as any,
            sexo: sexo as any,
            prova: provaFinal,
            equipe: equipeChave,
            municipioId: municipioId || atletaExiste.municipioId || undefined,
          },
        });
      } else {
        insc = await prisma.inscricao.create({
          data: {
            id: `${equipeChave}-${atletaId}`,
            atletaId,
            modalidadeId: modalidade.id,
            escolaId,
            municipioId: municipioId || atletaExiste.municipioId || undefined,
            categoria: categoria as any,
            sexo: sexo as any,
            prova: provaStr,
            equipe: equipeChave,
            status: status || 'PENDENTE',
            motivoRejeicao: motivoRejeicao || null,
          },
        });
      }
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
