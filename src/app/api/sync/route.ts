import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
        orderBy: { nome: 'asc' }
      }),
      prisma.atleta.findMany({
        where: whereAtleta,
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
      }),
      prisma.usuario.findMany({
        where: whereMunicipio,
        include: { escola: true },
        orderBy: { nome: 'asc' }
      })
    ]);

    // Normalizar atletas para o formato esperado pelo frontend
    const atletasFormatados = atletas.map(a => {
      const dataNascStr = a.dataNascimento instanceof Date 
        ? a.dataNascimento.toISOString().split('T')[0] 
        : String(a.dataNascimento).split('T')[0];

      // Vincular modalidades em que o atleta está inscrito
      const modalidadesDoAtleta = inscricoes
        .filter(i => i.atletaId === a.id)
        .map(i => ({
          modalidadeCodigo: i.modalidade?.codigo || i.modalidadeId,
          modalidadeNome: i.modalidade?.nome || i.modalidadeId,
          categoria: i.categoria,
          sexo: i.sexo,
          provas: i.prova ? i.prova.split(',') : []
        }));
        
      return {
        id: a.id,
        municipioId: a.municipioId || a.escola?.municipioId || undefined,
        escolaId: a.escolaId,
        nomeCompleto: a.nomeCompleto,
        dataNascimento: dataNascStr,
        sexo: a.sexo,
        documentoTipo: a.documentoTipo || 'RG',
        documentoNumero: a.documentoNumero,
        matricula: a.matricula || a.crachaToken || '',
        serieTurma: a.turma || '',
        turma: a.turma || '',
        nomeMae: (a as any).nomeMae || '',
        telefoneContato: (a as any).telefoneContato || a.escola?.responsavelTelefone || '',
        tipoSanguineo: a.tipoSanguineo || 'O+',
        consentimentoResponsavel: a.consentimentoResponsavel ?? true,
        categoriaCalculada: a.categoria,
        categoria: a.categoria,
        crachaToken: a.crachaToken || a.matricula || a.id,
        modalidadesInscritas: modalidadesDoAtleta,
        documentos: {
          foto3x4: a.fotoUrl || undefined,
          documentoIdentidade: a.documentoUrl || undefined
        },
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
        inscricoesMap.set(equipeKey, {
          id: equipeKey,
          municipioId: insc.municipioId || insc.escola?.municipioId || undefined,
          escolaId: insc.escolaId,
          modalidadeCodigo: modCodigo,
          modalidadeNome: modNome,
          categoria: insc.categoria,
          sexo: insc.sexo,
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

    const usuariosFormatados = usuarios.map(u => ({
      id: u.id,
      municipioId: u.municipioId,
      nome: u.nome,
      email: u.email,
      cpf: u.cpf,
      senhaHash: u.senhaHash,
      papel: u.papel === 'COMITE' ? 'COORDENADOR' : (u.papel === 'SUPERADMIN' ? 'SUPERADMIN' : 'PROFESSOR'),
      escolaId: u.escolaId,
      escola: u.escola ? {
        id: u.escola.id,
        nome: u.escola.nome,
        sigla: u.escola.sigla,
        loginEmail: u.escola.loginEmail
      } : undefined,
      createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString()
    }));

    return NextResponse.json({
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
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao sincronizar dados com PostgreSQL' },
      { status: 500 }
    );
  }
}
