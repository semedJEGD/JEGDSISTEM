import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const municipioId = searchParams.get('municipioId');
    const where = municipioId && municipioId !== 'ALL' ? { municipioId } : {};

    const [noticias, cronograma, partidas, artilharia, medalhas, avisos] = await Promise.all([
      prisma.noticiaEvento.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.cronogramaItem.findMany({
        where,
        orderBy: [{ dataEvento: 'asc' }, { horarioInicio: 'asc' }, { ordem: 'asc' }],
      }),
      prisma.partidaEvento.findMany({
        where,
        orderBy: [{ dataEvento: 'asc' }, { horario: 'asc' }, { numeroJogo: 'asc' }],
      }),
      prisma.artilhariaEvento.findMany({
        where,
        orderBy: [{ gols: 'desc' }, { atletaNome: 'asc' }],
      }),
      prisma.medalhaEvento.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.avisoTelao.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        noticias,
        cronograma,
        partidas,
        artilharia,
        medalhas,
        avisos,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[API /api/eventos GET]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Erro ao carregar eventos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { entidade, dados } = body || {};

    if (!entidade || !dados) {
      return NextResponse.json({ success: false, error: 'Payload inválido' }, { status: 400 });
    }

    let result: any;

    switch (entidade) {
      case 'noticia':
        result = await prisma.noticiaEvento.create({
          data: {
            municipioId: dados.municipioId || null,
            titulo: dados.titulo,
            resumo: dados.resumo,
            conteudo: dados.conteudo || null,
            modalidadeNome: dados.modalidadeNome || null,
            categoria: dados.categoria || null,
            horarioOcorrencia: dados.horarioOcorrencia || null,
            local: dados.local || null,
            imagemUrl: dados.imagemUrl || null,
            destaqueTelao: dados.destaqueTelao ?? true,
            publicado: dados.publicado ?? true,
            autor: dados.autor || 'Coordenação SEMED',
          },
        });
        break;

      case 'cronograma':
        result = await prisma.cronogramaItem.create({
          data: {
            municipioId: dados.municipioId || null,
            titulo: dados.titulo,
            descricao: dados.descricao || null,
            etapa: dados.etapa || '1ª Etapa',
            modalidadeNome: dados.modalidadeNome || null,
            categoria: dados.categoria || null,
            local: dados.local || null,
            dataEvento: dados.dataEvento,
            horarioInicio: dados.horarioInicio,
            horarioFim: dados.horarioFim || null,
            status: dados.status || 'PREVISTO',
            resumoResultado: dados.resumoResultado || null,
            ordem: Number(dados.ordem || 0),
          },
        });
        break;

      case 'cronograma_lote':
        result = await prisma.cronogramaItem.createMany({
          data: (dados.itens || []).map((item: any, idx: number) => ({
            municipioId: dados.municipioId || null,
            titulo: item.titulo,
            descricao: item.descricao || null,
            etapa: item.etapa || '1ª Etapa',
            modalidadeNome: item.modalidadeNome || null,
            categoria: item.categoria || null,
            local: item.local || null,
            dataEvento: item.dataEvento,
            horarioInicio: item.horarioInicio,
            horarioFim: item.horarioFim || null,
            status: item.status || 'PREVISTO',
            resumoResultado: item.resumoResultado || null,
            ordem: Number(item.ordem ?? idx + 1),
          })),
        });
        break;

      case 'partida':
        result = await prisma.partidaEvento.create({
          data: {
            municipioId: dados.municipioId || null,
            numeroJogo: dados.numeroJogo ? Number(dados.numeroJogo) : null,
            modalidadeCodigo: dados.modalidadeCodigo,
            modalidadeNome: dados.modalidadeNome,
            categoria: dados.categoria,
            sexo: dados.sexo,
            fase: dados.fase || 'GRUPOS',
            grupo: dados.grupo || null,
            dataEvento: dados.dataEvento,
            horario: dados.horario,
            local: dados.local || null,
            escolaAId: dados.escolaAId,
            escolaANome: dados.escolaANome,
            escolaASigla: dados.escolaASigla || null,
            escolaBId: dados.escolaBId,
            escolaBNome: dados.escolaBNome,
            escolaBSigla: dados.escolaBSigla || null,
            placarA: Number(dados.placarA || 0),
            placarB: Number(dados.placarB || 0),
            detalhesPlacar: dados.detalhesPlacar || null,
            status: dados.status || 'AGENDADO',
            observacao: dados.observacao || null,
          },
        });
        break;

      case 'partidas_lote':
        result = await prisma.partidaEvento.createMany({
          data: (dados.partidas || []).map((p: any) => ({
            municipioId: dados.municipioId || null,
            numeroJogo: p.numeroJogo ? Number(p.numeroJogo) : null,
            modalidadeCodigo: p.modalidadeCodigo,
            modalidadeNome: p.modalidadeNome,
            categoria: p.categoria,
            sexo: p.sexo,
            fase: p.fase || 'GRUPOS',
            grupo: p.grupo || null,
            dataEvento: p.dataEvento,
            horario: p.horario,
            local: p.local || null,
            escolaAId: p.escolaAId,
            escolaANome: p.escolaANome,
            escolaASigla: p.escolaASigla || null,
            escolaBId: p.escolaBId,
            escolaBNome: p.escolaBNome,
            escolaBSigla: p.escolaBSigla || null,
            placarA: 0,
            placarB: 0,
            status: 'AGENDADO',
          })),
        });
        break;

      case 'artilharia':
        result = await prisma.artilhariaEvento.create({
          data: {
            municipioId: dados.municipioId || null,
            atletaId: dados.atletaId || null,
            atletaNome: dados.atletaNome,
            fotoUrl: dados.fotoUrl || null,
            escolaId: dados.escolaId,
            escolaNome: dados.escolaNome,
            escolaSigla: dados.escolaSigla || null,
            modalidadeCodigo: dados.modalidadeCodigo,
            modalidadeNome: dados.modalidadeNome,
            categoria: dados.categoria || 'INFANTIL',
            sexo: dados.sexo || 'MASCULINO',
            gols: Number(dados.gols || 1),
          },
        });
        break;

      case 'medalha':
        result = await prisma.medalhaEvento.create({
          data: {
            municipioId: dados.municipioId || null,
            escolaId: dados.escolaId,
            escolaNome: dados.escolaNome,
            escolaSigla: dados.escolaSigla || null,
            modalidadeCodigo: dados.modalidadeCodigo,
            modalidadeNome: dados.modalidadeNome,
            categoria: dados.categoria || 'INFANTIL',
            sexo: dados.sexo || 'MASCULINO',
            prova: dados.prova || null,
            tipo: dados.tipo,
            atletaNome: dados.atletaNome || null,
          },
        });
        break;

      case 'aviso':
        result = await prisma.avisoTelao.create({
          data: {
            municipioId: dados.municipioId || null,
            titulo: dados.titulo,
            mensagem: dados.mensagem,
            tipo: dados.tipo || 'CHAMADA',
            ativo: dados.ativo ?? true,
          },
        });
        break;

      default:
        return NextResponse.json({ success: false, error: `Entidade desconhecida: ${entidade}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[API /api/eventos POST]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Erro ao criar registro' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { entidade, id, dados } = body || {};

    if (!entidade || !id || !dados) {
      return NextResponse.json({ success: false, error: 'Payload inválido' }, { status: 400 });
    }

    let result: any;

    switch (entidade) {
      case 'noticia':
        result = await prisma.noticiaEvento.update({ where: { id }, data: dados });
        break;
      case 'cronograma':
        result = await prisma.cronogramaItem.update({ where: { id }, data: dados });
        break;
      case 'partida':
        result = await prisma.partidaEvento.update({ where: { id }, data: dados });
        break;
      case 'artilharia':
        result = await prisma.artilhariaEvento.update({ where: { id }, data: dados });
        break;
      case 'aviso':
        result = await prisma.avisoTelao.update({ where: { id }, data: dados });
        break;
      default:
        return NextResponse.json({ success: false, error: `Entidade não atualizável: ${entidade}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('[API /api/eventos PATCH]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Erro ao atualizar registro' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const entidade = searchParams.get('entidade');
    const id = searchParams.get('id');

    if (!entidade || !id) {
      return NextResponse.json({ success: false, error: 'Parâmetros entidade e id obrigatórios' }, { status: 400 });
    }

    switch (entidade) {
      case 'noticia':
        await prisma.noticiaEvento.delete({ where: { id } });
        break;
      case 'cronograma':
        await prisma.cronogramaItem.delete({ where: { id } });
        break;
      case 'partida':
        await prisma.partidaEvento.delete({ where: { id } });
        break;
      case 'artilharia':
        await prisma.artilhariaEvento.delete({ where: { id } });
        break;
      case 'medalha':
        await prisma.medalhaEvento.delete({ where: { id } });
        break;
      case 'aviso':
        await prisma.avisoTelao.delete({ where: { id } });
        break;
      default:
        return NextResponse.json({ success: false, error: `Entidade desconhecida: ${entidade}` }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API /api/eventos DELETE]', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Erro ao excluir registro' },
      { status: 500 }
    );
  }
}
