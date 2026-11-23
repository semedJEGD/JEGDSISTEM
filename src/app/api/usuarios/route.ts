import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const preferredRegion = ['gru1'];
import bcrypt from 'bcryptjs';

function formatCPF(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 11);
  if (d.length !== 11) return digits;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

const usuarioSafeSelect = {
  id: true,
  municipioId: true,
  nome: true,
  email: true,
  cpf: true,
  papel: true,
  escolaId: true,
  createdAt: true,
  updatedAt: true,
  escola: {
    select: {
      id: true,
      municipioId: true,
      nome: true,
      sigla: true,
      loginEmail: true,
      responsavelNome: true,
      responsavelTelefone: true,
    },
  },
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cpfParam = searchParams.get('cpf');
    const municipioId = searchParams.get('municipioId');
    const emailParam = searchParams.get('email');

    if (cpfParam) {
      const cleanCpf = cpfParam.replace(/\D/g, '');
      const formattedCpf = formatCPF(cleanCpf);
      const usuario = await prisma.usuario.findFirst({
        where: {
          OR: [{ cpf: cleanCpf }, { cpf: formattedCpf }],
        },
        select: usuarioSafeSelect,
      });

      if (!usuario) {
        return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: usuario });
    }

    if (emailParam) {
      const usuario = await prisma.usuario.findUnique({
        where: { email: emailParam.toLowerCase() },
        select: usuarioSafeSelect,
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
      select: usuarioSafeSelect,
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

    // Procura se já existe por CPF ou por Email (consulta direta no banco, sem full-table scan)
    let usuarioExistente = null;
    if (cleanCpf) {
      const formattedCpf = formatCPF(cleanCpf);
      usuarioExistente = await prisma.usuario.findFirst({
        where: { OR: [{ cpf: cleanCpf }, { cpf: formattedCpf }] }
      });
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
