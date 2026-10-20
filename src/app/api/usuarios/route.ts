import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cpfParam = searchParams.get('cpf');
    const municipioId = searchParams.get('municipioId');
    const emailParam = searchParams.get('email');

    if (cpfParam) {
      const cleanCpf = cpfParam.replace(/\D/g, '');
      const usuarios = await prisma.usuario.findMany({
        include: { escola: true }
      });
      const usuario = usuarios.find(u => {
        const uCpf = (u.cpf || '').replace(/\D/g, '');
        return uCpf === cleanCpf;
      });

      if (!usuario) {
        return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: usuario });
    }

    if (emailParam) {
      const usuario = await prisma.usuario.findUnique({
        where: { email: emailParam.toLowerCase() },
        include: { escola: true }
      });
      if (!usuario) {
        return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: usuario });
    }

    const where: any = {};
    if (municipioId && municipioId !== 'ALL') {
      where.municipioId = municipioId;
    }

    const usuarios = await prisma.usuario.findMany({
      where,
      include: { escola: true },
      orderBy: { nome: 'asc' }
    });

    return NextResponse.json({ success: true, data: usuarios });
  } catch (error: any) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, municipioId, nome, cpf, email, telefone, senhaHash, papel, escolaId } = body;

    if (!nome) {
      return NextResponse.json({ success: false, error: 'Nome é obrigatório' }, { status: 400 });
    }

    const cleanCpf = cpf ? cpf.replace(/\D/g, '') : null;
    const cleanEmail = email ? email.toLowerCase().trim() : (cleanCpf ? `prof.${cleanCpf}@semed.gd.gov.br` : `usuario.${Date.now()}@semed.gd.gov.br`);

    // Procura se já existe por CPF ou por Email
    let usuarioExistente = null;
    if (cleanCpf) {
      const allUsers = await prisma.usuario.findMany();
      usuarioExistente = allUsers.find(u => (u.cpf || '').replace(/\D/g, '') === cleanCpf);
    }
    if (!usuarioExistente && cleanEmail) {
      usuarioExistente = await prisma.usuario.findUnique({
        where: { email: cleanEmail }
      });
    }

    const senhaFinal = senhaHash || 'semed2026';
    const bcryptHash = senhaFinal.startsWith('$2') ? senhaFinal : await bcrypt.hash(senhaFinal, 10);

    let usuarioSalvo;
    if (usuarioExistente) {
      usuarioSalvo = await prisma.usuario.update({
        where: { id: usuarioExistente.id },
        data: {
          nome: nome.trim(),
          cpf: cleanCpf || usuarioExistente.cpf,
          municipioId: municipioId || usuarioExistente.municipioId,
          escolaId: escolaId || usuarioExistente.escolaId,
          senhaHash: bcryptHash,
          papel: papel === 'COORDENADOR' ? 'COMITE' : (papel === 'SUPERADMIN' ? 'SUPERADMIN' : 'ESCOLA')
        },
        include: { escola: true }
      });
    } else {
      usuarioSalvo = await prisma.usuario.create({
        data: {
          id: id || (cleanCpf ? `prof-${cleanCpf}` : undefined),
          nome: nome.trim(),
          cpf: cleanCpf,
          email: cleanEmail,
          municipioId,
          escolaId,
          senhaHash: bcryptHash,
          papel: papel === 'COORDENADOR' ? 'COMITE' : (papel === 'SUPERADMIN' ? 'SUPERADMIN' : 'ESCOLA')
        },
        include: { escola: true }
      });
    }

    // Se tiver escolaId vinculada e uma senha foi definida, sincronizar com a escola também
    if (escolaId) {
      try {
        await prisma.escola.update({
          where: { id: escolaId },
          data: {
            senhaHash: bcryptHash,
            responsavelNome: nome.trim(),
            responsavelTelefone: telefone || '(99) 98801-0000'
          }
        });
      } catch (err) {
        console.warn('Não foi possível atualizar escola vinculada:', err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        id: usuarioSalvo.id,
        municipioId: usuarioSalvo.municipioId,
        nome: usuarioSalvo.nome,
        cpf: usuarioSalvo.cpf,
        email: usuarioSalvo.email,
        papel: usuarioSalvo.papel,
        escolaId: usuarioSalvo.escolaId,
        senhaHash: senhaFinal, // Retorna em texto limpo para o front validar diretamente
        escola: usuarioSalvo.escola
      }
    });
  } catch (error: any) {
    console.error('Erro ao salvar usuário no Neon:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
