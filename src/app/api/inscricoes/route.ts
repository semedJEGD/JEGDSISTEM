import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MODALIDADES_JEGDS, JegdsRulesService, ModalidadeCodigoJEGDS } from '@/services/jegds-rules';

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

    // Criar ou atualizar as inscrições dos atletas nesta modalidade (lote para evitar N+1 round-trips)
    const criados = [];
    const equipeChave = id || `insc-${escolaId}-${modalidade.codigo}-${categoria}-${sexo}`;

    const [atletasExistentes, inscricoesExistentes] = await Promise.all([
      prisma.atleta.findMany({
        where: { id: { in: atletaIds } },
        select: { id: true, municipioId: true },
      }),
      prisma.inscricao.findMany({
        where: {
          atletaId: { in: atletaIds },
          modalidadeId: modalidade.id,
        },
        orderBy: { dataInscricao: 'desc' },
      }),
    ]);

    const atletaPorId = new Map(atletasExistentes.map((a) => [a.id, a]));
    const inscsPorAtleta = new Map<string, typeof inscricoesExistentes>();
    for (const e of inscricoesExistentes) {
      if (!inscsPorAtleta.has(e.atletaId)) inscsPorAtleta.set(e.atletaId, []);
      inscsPorAtleta.get(e.atletaId)!.push(e);
    }

    for (const atletaId of atletaIds) {
      const atletaExiste = atletaPorId.get(atletaId);
      if (!atletaExiste) {
        console.warn(`Atleta ${atletaId} não encontrado no banco para inscrição na modalidade ${modalidade.codigo}`);
        continue;
      }

      const provas = provasPorAtleta?.[atletaId];
      const provaStr = Array.isArray(provas) && provas.length > 0 ? provas.filter(Boolean).join(',') : '';

      const existentes = inscsPorAtleta.get(atletaId) || [];

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

/**
 * PATCH /api/inscricoes
 * Reorganiza todas as equipes do banco (principalmente Futsal e Futebol de Campo)
 * separando estritamente em Equipe A e Equipe B conforme os limites oficiais do regulamento.
 */
export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const municipioId = body?.municipioId;
    const where: any = {};
    if (municipioId && municipioId !== 'ALL') {
      where.municipioId = municipioId;
    }

    const todas = await prisma.inscricao.findMany({
      where,
      include: {
        atleta: { select: { id: true, nomeCompleto: true } },
        modalidade: { select: { id: true, codigo: true, maxAtletas: true } },
      },
      orderBy: [{ status: 'asc' }, { dataInscricao: 'asc' }],
    });

    // Agrupa por (escolaId, modalidadeId, categoria, sexo)
    const grupos = new Map<string, typeof todas>();
    for (const insc of todas) {
      const chave = `${insc.escolaId}__${insc.modalidadeId}__${insc.categoria}__${insc.sexo}`;
      if (!grupos.has(chave)) grupos.set(chave, []);
      grupos.get(chave)!.push(insc);
    }

    let atualizados = 0;
    let equipesA = 0;
    let equipesB = 0;

    for (const lista of grupos.values()) {
      const sample = lista[0];
      const modCod = (sample.modalidade?.codigo || '').toLowerCase().replace(/-/g, '_') as ModalidadeCodigoJEGDS;
      const regraMod = MODALIDADES_JEGDS[modCod];
      const maxPorEquipe = regraMod?.limiteMaxElenco || sample.modalidade?.maxAtletas || 10;
      const maxEquipes = JegdsRulesService.getMaxEquipesPorModalidade(modCod);

      // Ordena: VALIDADA primeiro, depois alfabética por nome do atleta
      const ordenada = [...lista].sort((a, b) => {
        const sA = a.status === 'VALIDADA' ? 0 : 1;
        const sB = b.status === 'VALIDADA' ? 0 : 1;
        if (sA !== sB) return sA - sB;
        return (a.atleta?.nomeCompleto || '').localeCompare(b.atleta?.nomeCompleto || '', 'pt-BR');
      });

      const baseChave = `insc-${sample.escolaId}-${modCod}-${sample.categoria}-${sample.sexo}`;
      const chaveA = `${baseChave}-A`;
      const chaveB = `${baseChave}-B`;

      const idsA: string[] = [];
      const idsB: string[] = [];

      ordenada.forEach((item, idx) => {
        if (idx < maxPorEquipe) {
          idsA.push(item.id);
        } else if (maxEquipes >= 2 && idx < maxPorEquipe * 2) {
          idsB.push(item.id);
        } else {
          // Excedente além do teto fica na última equipe permitida para revisão manual
          if (maxEquipes >= 2) idsB.push(item.id);
          else idsA.push(item.id);
        }
      });

      if (idsA.length > 0) {
        equipesA++;
        const r = await prisma.inscricao.updateMany({
          where: { id: { in: idsA } },
          data: { equipe: chaveA },
        });
        atualizados += r.count;
      }

      if (idsB.length > 0) {
        equipesB++;
        const r = await prisma.inscricao.updateMany({
          where: { id: { in: idsB } },
          data: { equipe: chaveB },
        });
        atualizados += r.count;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        registrosAtualizados: atualizados,
        equipesA,
        equipesB,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao reorganizar equipes' },
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
