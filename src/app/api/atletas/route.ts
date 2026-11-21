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

    const isSemDoc = Boolean(body.semDocumento || body.documentoTipo === 'SEM_DOCUMENTO');
    const docTipoFinal = isSemDoc ? 'SEM_DOCUMENTO' : (body.documentoTipo || 'RG');
    const docNumeroFinal = isSemDoc ? (body.documentoNumero || 'SEM DOCUMENTO') : (body.documentoNumero || 'SEM DOCUMENTO');

    const atleta = await prisma.atleta.upsert({
      where: { id: body.id || `atl-${Date.now()}` },
      update: {
        nomeCompleto: body.nomeCompleto,
        dataNascimento,
        sexo: body.sexo,
        semDocumento: isSemDoc,
        documentoTipo: docTipoFinal,
        documentoNumero: docNumeroFinal,
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
        semDocumento: isSemDoc,
        documentoTipo: docTipoFinal,
        documentoNumero: docNumeroFinal,
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

        const provasArr = Array.isArray(modInsc.provas) ? modInsc.provas.filter(Boolean) : [];
        const provaStr = provasArr.length > 0 ? provasArr.join(',') : '';
        const equipeId = `insc-${atleta.escolaId}-${modDb.codigo}-eq1`;

        // Busca inscrições existentes para (atletaId, modalidadeId) para atualizar in-place
        // sem criar linhas duplicadas quando o usuário altera as provas de Atletismo!
        const existentes = await prisma.inscricao.findMany({
          where: {
            atletaId: atleta.id,
            modalidadeId: modDb.id,
          },
          orderBy: { dataInscricao: 'desc' },
        });

        if (existentes.length > 0) {
          const principal = existentes[0];
          // Remove eventuais duplicatas antigas da mesma modalidade antes de atualizar a chave única prova
          if (existentes.length > 1) {
            await prisma.inscricao.deleteMany({
              where: {
                id: { in: existentes.slice(1).map((e) => e.id) },
              },
            });
          }
          await prisma.inscricao.update({
            where: { id: principal.id },
            data: {
              escolaId: atleta.escolaId,
              municipioId: atleta.municipioId,
              categoria: atleta.categoria,
              sexo: atleta.sexo,
              prova: provaStr,
              equipe: equipeId,
            },
          });
        } else {
          await prisma.inscricao.create({
            data: {
              id: `insc-${Date.now()}-${atleta.id}-${modDb.codigo}`,
              atletaId: atleta.id,
              modalidadeId: modDb.id,
              escolaId: atleta.escolaId,
              municipioId: atleta.municipioId,
              categoria: atleta.categoria,
              sexo: atleta.sexo,
              prova: provaStr,
              equipe: equipeId,
              status: 'PENDENTE',
            },
          });
        }
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
    const matricula = searchParams.get('matricula');
    const documento = searchParams.get('documento');

    if (!id && !matricula && !documento) {
      return NextResponse.json({ success: false, error: 'Identificador do atleta não informado' }, { status: 400 });
    }

    // Busca o atleta no banco por id, crachaToken, matricula ou documento
    const whereOr: any[] = [];
    if (id) {
      whereOr.push({ id });
      whereOr.push({ crachaToken: id });
      whereOr.push({ matricula: id });
    }
    if (matricula) {
      whereOr.push({ matricula });
      whereOr.push({ crachaToken: matricula });
    }
    if (documento && documento.toUpperCase() !== 'SEM DOCUMENTO' && documento.toUpperCase() !== 'SEM DOC') {
      whereOr.push({ documentoNumero: documento });
    }

    const atletasDb = await prisma.atleta.findMany({
      where: { OR: whereOr },
      select: { id: true, matricula: true, crachaToken: true }
    });

    const targetIds = Array.from(new Set([
      ...(id ? [id] : []),
      ...atletasDb.map(a => a.id)
    ]));

    if (targetIds.length > 0) {
      // Remove dependências primeiro para evitar violações de integridade referencial
      await prisma.registroControle.deleteMany({
        where: { atletaId: { in: targetIds } }
      });

      await prisma.inscricao.deleteMany({
        where: { atletaId: { in: targetIds } }
      });

      await prisma.atleta.deleteMany({
        where: { id: { in: targetIds } }
      });
    }

    return NextResponse.json({ success: true, message: 'Atleta removido com sucesso', deletedIds: targetIds });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao remover atleta' },
      { status: 500 }
    );
  }
}
