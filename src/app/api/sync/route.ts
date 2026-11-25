import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const preferredRegion = ['gru1'];
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const municipioId = searchParams.get('municipioId');

    const whereMunicipio = municipioId && municipioId !== 'ALL' ? { municipioId } : {};
    const whereAtleta = municipioId && municipioId !== 'ALL' 
      ? { OR: [{ municipioId }, { escola: { municipioId } }] } 
      : {};

    const [municipios, escolas, atletas, modalidades, registros, comunicados, inscricoes, usuarios] = await Promise.all([
      prisma.municipio.findMany({ orderBy: { nome: 'asc' } }),
      prisma.escola.findMany({
        where: whereMunicipio,
        select: {
          id: true,
          municipioId: true,
          nome: true,
          sigla: true,
          inep: true,
          endereco: true,
          bairro: true,
          responsavelNome: true,
          responsavelTelefone: true,
          loginEmail: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { nome: 'asc' }
      }),
      prisma.atleta.findMany({
        where: {
          AND: [
            whereAtleta,
            { NOT: { nomeCompleto: { contains: 'TESTE', mode: 'insensitive' } } },
            { NOT: { id: { contains: 'teste' } } }
          ]
        },
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
        select: {
          id: true,
          municipioId: true,
          escolaId: true,
          atletaId: true,
          modalidadeId: true,
          categoria: true,
          sexo: true,
          equipe: true,
          prova: true,
          status: true,
          motivoRejeicao: true,
          dataInscricao: true,
          updatedAt: true,
          modalidade: { select: { codigo: true, nome: true } },
        },
        orderBy: { dataInscricao: 'desc' }
      }),
      prisma.usuario.findMany({
        where: whereMunicipio,
        select: {
          id: true,
          municipioId: true,
          nome: true,
          email: true,
          cpf: true,
          papel: true,
          escolaId: true,
          createdAt: true,
        },
        orderBy: { nome: 'asc' }
      })
    ]);

    // Índices O(1) em memória para evitar N+1 / joins redundantes e loops O(N×M)
    const escolaPorId = new Map(escolas.map(e => [e.id, e]));
    const inscricoesPorAtleta = new Map<string, typeof inscricoes>();
    for (const i of inscricoes) {
      if (!inscricoesPorAtleta.has(i.atletaId)) {
        inscricoesPorAtleta.set(i.atletaId, []);
      }
      inscricoesPorAtleta.get(i.atletaId)!.push(i);
    }

    // Normalizar atletas para o formato esperado pelo frontend
    const atletasFormatados = atletas.map(a => {
      const escolaAtleta = escolaPorId.get(a.escolaId);
      const dataNascStr = a.dataNascimento instanceof Date 
        ? a.dataNascimento.toISOString().split('T')[0] 
        : String(a.dataNascimento).split('T')[0];

      // Vincular modalidades em que o atleta está inscrito (deduplicando por modalidade e preservando provas preenchidas)
      const inscricoesDoAtleta = inscricoesPorAtleta.get(a.id) || [];
      const modsPorCodigo = new Map<string, {
        modalidadeCodigo: string;
        modalidadeNome: string;
        categoria: any;
        sexo: any;
        provas: string[];
      }>();
      for (const i of inscricoesDoAtleta) {
        const cod = i.modalidade?.codigo || i.modalidadeId;
        const provasList = i.prova ? i.prova.split(',').map((p: string) => p.trim()).filter(Boolean) : [];
        const atual = modsPorCodigo.get(cod);
        if (!atual) {
          modsPorCodigo.set(cod, {
            modalidadeCodigo: cod,
            modalidadeNome: i.modalidade?.nome || i.modalidadeId,
            categoria: i.categoria,
            sexo: i.sexo,
            provas: provasList,
          });
        } else if (provasList.length > 0) {
          const merged = Array.from(new Set([...atual.provas, ...provasList]));
          atual.provas = merged;
        }
      }
      const modalidadesDoAtleta = Array.from(modsPorCodigo.values());
      const todosValidados = inscricoesDoAtleta.length > 0 && inscricoesDoAtleta.every(i => i.status === 'VALIDADA');
        
      return {
        id: a.id,
        municipioId: a.municipioId || escolaAtleta?.municipioId || undefined,
        escolaId: a.escolaId,
        nomeCompleto: a.nomeCompleto,
        dataNascimento: dataNascStr,
        sexo: a.sexo,
        semDocumento: Boolean(a.semDocumento || a.documentoTipo === 'SEM_DOCUMENTO' || a.documentoNumero === 'SEM DOCUMENTO'),
        documentoTipo: a.documentoTipo || 'RG',
        documentoNumero: a.documentoNumero,
        matricula: a.matricula || a.crachaToken || '',
        serieTurma: a.turma || '',
        turma: a.turma || '',
        nomeMae: (a as any).nomeMae || '',
        telefoneContato: (a as any).telefoneContato || escolaAtleta?.responsavelTelefone || '',
        tipoSanguineo: a.tipoSanguineo || 'O+',
        consentimentoResponsavel: a.consentimentoResponsavel ?? true,
        categoriaCalculada: a.categoria,
        categoria: a.categoria,
        crachaToken: a.crachaToken || a.matricula || a.id,
        conferidoPeloCoordenador: todosValidados ? true : undefined,
        modalidadesInscritas: modalidadesDoAtleta,
        fotoUrl: a.fotoUrl || undefined,
        documentoUrl: a.documentoUrl || undefined,
        ativo: true,
        createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString()
      };
    });

    // Reagrupar inscrições por Equipe para o formato do Frontend
    const inscricoesMap = new Map<string, any>();
    for (const insc of inscricoes) {
      const modCodigo = insc.modalidade?.codigo || insc.modalidadeId;
      const modNome = insc.modalidade?.nome || modCodigo;
      const equipeKey = insc.equipe || `insc-${insc.escolaId}-${modCodigo}-${insc.categoria}-${insc.sexo}`;

      if (!inscricoesMap.has(equipeKey)) {
        const isEquipeB = /(-B|-eq2|__eq2|_2)$/i.test(equipeKey);
        inscricoesMap.set(equipeKey, {
          id: equipeKey,
          municipioId: insc.municipioId || escolaPorId.get(insc.escolaId)?.municipioId || undefined,
          escolaId: insc.escolaId,
          modalidadeCodigo: modCodigo,
          modalidadeNome: modNome,
          categoria: insc.categoria,
          sexo: insc.sexo,
          numeroEquipe: isEquipeB ? 2 : 1,
          atletaIds: [],
          provasPorAtleta: {},
          comissaoIds: [],
          status: insc.status || 'PENDENTE',
          motivoRejeicao: insc.motivoRejeicao || undefined,
          dataInscricao: insc.dataInscricao ? insc.dataInscricao.toISOString() : new Date().toISOString(),
          createdAt: insc.dataInscricao ? insc.dataInscricao.toISOString() : new Date().toISOString(),
          updatedAt: insc.updatedAt ? insc.updatedAt.toISOString() : new Date().toISOString()
        });
      }

      const eq = inscricoesMap.get(equipeKey);
      if (insc.atletaId && !eq.atletaIds.includes(insc.atletaId)) {
        eq.atletaIds.push(insc.atletaId);
      }
      if (insc.atletaId && insc.prova) {
        eq.provasPorAtleta[insc.atletaId] = insc.prova.split(',');
      }
    }
    const inscricoesFormatadas = Array.from(inscricoesMap.values());

    const usuariosFormatados = usuarios.map(u => {
      const escolaUsuario = u.escolaId ? escolaPorId.get(u.escolaId) : undefined;
      return {
        id: u.id,
        municipioId: u.municipioId,
        nome: u.nome,
        email: u.email,
        cpf: u.cpf,
        papel: u.papel === 'COMITE' ? 'COORDENADOR' : (u.papel === 'SUPERADMIN' ? 'SUPERADMIN' : 'PROFESSOR'),
        escolaId: u.escolaId,
        escola: escolaUsuario ? {
          id: escolaUsuario.id,
          nome: escolaUsuario.nome,
          sigla: escolaUsuario.sigla,
          loginEmail: escolaUsuario.loginEmail
        } : undefined,
        createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString()
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          municipios,
          escolas,
          atletas: atletasFormatados,
          modalidades,
          registros,
          comunicados,
          inscricoes: inscricoesFormatadas,
          usuarios: usuariosFormatados
        }
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao sincronizar dados com PostgreSQL' },
      { status: 500 }
    );
  }
}
