import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const escolaId = searchParams.get('escolaId');
    const municipioId = searchParams.get('municipioId');
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
    if (municipioId && municipioId !== 'ALL') {
      where.municipioId = municipioId;
    }
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

    let municipioId = body.municipioId;
    if (!municipioId && body.escolaId) {
      const esc = await prisma.escola.findUnique({ where: { id: body.escolaId } });
      if (esc) municipioId = esc.municipioId;
    }

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
        municipioId: municipioId || undefined,
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
        municipioId: municipioId || undefined,
        categoria: body.categoriaCalculada || body.categoria || 'INFANTIL',
        consentimentoResponsavel: body.consentimentoResponsavel ?? true,
      }
    });

    // Sincroniza as modalidades em que o atleta foi inscrito
    if (Array.isArray(body.modalidadesInscritas)) {
      const modalidadesDb = await prisma.modalidade.findMany({
        where: municipioId ? { OR: [{ municipioId }, { municipioId: null }] } : {}
      });

      const modalidadeIdsMantidas: string[] = [];

      for (const modInsc of body.modalidadesInscritas) {
        if (!modInsc || !modInsc.modalidadeCodigo) continue;

        let modDb = modalidadesDb.find(m => m.codigo === modInsc.modalidadeCodigo && m.municipioId === municipioId);
        if (!modDb) {
          modDb = modalidadesDb.find(m => m.codigo === modInsc.modalidadeCodigo);
        }
        if (!modDb) {
          modDb = await prisma.modalidade.create({
            data: {
              codigo: modInsc.modalidadeCodigo,
              nome: modInsc.modalidadeNome || modInsc.modalidadeCodigo,
              tipo: 'COLETIVA',
              dataEvento: new Date('2026-12-12T00:00:00Z'),
              prazoInscricao: new Date('2026-12-05T23:59:59Z'),
              municipioId: municipioId || undefined
            }
          });
        }

        modalidadeIdsMantidas.push(modDb.id);

        const provasArr = Array.isArray(modInsc.provas) ? modInsc.provas : [];
        const provaStr = provasArr.length > 0 ? provasArr.join(',') : '';
        const equipeId = `insc-${atleta.escolaId}-${modDb.codigo}-eq1`;

        await prisma.inscricao.upsert({
          where: {
            atletaId_modalidadeId_prova: {
              atletaId: atleta.id,
              modalidadeId: modDb.id,
              prova: provaStr
            }
          },
          update: {
            escolaId: atleta.escolaId,
            municipioId: atleta.municipioId,
            categoria: atleta.categoria,
            sexo: atleta.sexo,
            equipe: equipeId,
            status: 'PENDENTE'
          },
          create: {
            id: `insc-${Date.now()}-${atleta.id}-${modDb.codigo}`,
            atletaId: atleta.id,
            modalidadeId: modDb.id,
            escolaId: atleta.escolaId,
            municipioId: atleta.municipioId,
            categoria: atleta.categoria,
            sexo: atleta.sexo,
            prova: provaStr,
            equipe: equipeId,
            status: 'PENDENTE'
          }
        });
      }

      // Remove inscrições em modalidades que foram desmarcadas
      await prisma.inscricao.deleteMany({
        where: {
          atletaId: atleta.id,
          modalidadeId: { notIn: modalidadeIdsMantidas }
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...atleta,
        modalidadesInscritas: body.modalidadesInscritas || []
      }
    });
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
