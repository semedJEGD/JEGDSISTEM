'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Atleta, Escola } from '@/types/jegd';
import { User, Scissors } from 'lucide-react';

interface CrachaDobravelPreviewProps {
  atleta: Atleta;
  escola: Escola;
  modalidadeNome?: string;
  professorNome?: string;
  escala?: number;
}

export function CrachaDobravelPreview({
  atleta,
  escola,
  modalidadeNome,
  professorNome,
  escala = 1
}: CrachaDobravelPreviewProps) {
  const [qrUrl, setQrUrl] = useState<string>('');
  const tokenCracha = atleta.crachaToken || `CR-${atleta.id.toUpperCase()}`;
  const sexoSigla = atleta.sexo === 'FEMININO' ? 'F' : 'M';
  const dataNasc = new Date(atleta.dataNascimento).toLocaleDateString('pt-BR');
  const prof = professorNome || atleta.cadastradoPor || escola.responsavelNome || 'SEMED';
  const modNome = modalidadeNome || (atleta.modalidadesInscritas && atleta.modalidadesInscritas.length > 0 ? atleta.modalidadesInscritas.map(m => m.modalidadeNome).join(' / ') : 'DELEGAÇÃO OFICIAL');
  const provas = atleta.modalidadesInscritas?.find(m => m.provas && m.provas.length > 0)?.provas;

  useEffect(() => {
    let ativo = true;
    QRCode.toDataURL(tokenCracha, { margin: 0, width: 90, errorCorrectionLevel: 'M' })
      .then(url => {
        if (ativo) setQrUrl(url);
      })
      .catch(() => {});
    return () => { ativo = false; };
  }, [tokenCracha]);

  return (
    <div 
      className="inline-flex bg-white rounded-2xl shadow-xl border border-[#E2EAE5] overflow-hidden select-none"
      style={{
        width: `${400 * escala}px`,
        height: `${280 * escala}px`,
        transformOrigin: 'top left'
      }}
    >
      {/* 1. FRENTE DO CRACHÁ (LADO ESQUERDO) */}
      <div className="w-1/2 h-full flex flex-col justify-between bg-white relative p-2.5 text-center">
        
        {/* Cabeçalho Carmim */}
        <div className="absolute top-0 left-0 right-0 bg-[#8B1D2C] text-white px-2.5 py-1.5 flex items-center justify-between">
          <div className="text-left">
            <h4 className="text-[11px] font-black leading-tight tracking-tight">JEGDS 2026</h4>
            <p className="text-[6.5px] font-bold tracking-wider opacity-90">GONÇALVES DIAS • MA • SEMED</p>
          </div>
          <div className="w-6 h-6 rounded-full bg-white p-0.5 shrink-0 overflow-hidden shadow-xs">
            <img src="/logo-jegd.png" alt="Logo JEGD" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Corpo da Frente */}
        <div className="mt-8 flex flex-col items-center flex-1 justify-center space-y-1">
          {/* Foto 3x4 */}
          <div className="w-14 h-16 rounded-lg border-2 border-[#00A878] bg-[#F7F9F8] overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
            {atleta.documentos?.foto3x4 ? (
              <img src={atleta.documentos.foto3x4} alt={atleta.nomeCompleto} className="w-full h-full object-cover" />
            ) : (
              <User className="w-7 h-7 text-[#00A878]/60" />
            )}
          </div>

          {/* Nome e Escola */}
          <div className="w-full px-1">
            <p className="text-[9.5px] font-black text-[#17221D] leading-tight truncate uppercase">
              {atleta.nomeCompleto}
            </p>
            <p className="text-[7.5px] font-bold text-[#4B5563] truncate uppercase">
              {escola.nome}
            </p>
          </div>

          {/* Badge Categoria */}
          <div className="inline-block bg-[#065F46] text-white text-[7px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
            {atleta.categoriaCalculada || 'LIVRE'}
          </div>

          {/* Modalidade / Provas */}
          <div className="w-full">
            <span className="text-[6.5px] font-black text-[#065F46] uppercase block">MODALIDADE</span>
            <p className="text-[7.5px] font-black text-[#17221D] truncate uppercase leading-tight">
              {modNome}
            </p>
            {provas && provas.length > 0 && (
              <p className="text-[6.5px] font-bold text-[#4B5563] truncate">
                {provas.join(' • ')}
              </p>
            )}
          </div>

          {/* Grid Inferior: Nascimento e Professor */}
          <div className="w-full grid grid-cols-2 gap-1 text-left pt-0.5 border-t border-[#E2EAE5]">
            <div>
              <span className="text-[5.5px] font-bold text-[#9CA3AF] uppercase block">NASCIMENTO</span>
              <span className="text-[7px] font-black text-[#17221D]">{dataNasc} • {sexoSigla}</span>
            </div>
            <div>
              <span className="text-[5.5px] font-bold text-[#9CA3AF] uppercase block">PROFESSOR</span>
              <span className="text-[7px] font-black text-[#17221D] truncate block">{prof}</span>
            </div>
          </div>
        </div>

        {/* Rodapé da Frente */}
        <div className="w-full pt-1 border-t border-[#E2EAE5] flex items-center justify-between text-[6px] text-[#6B7280] font-bold">
          <span>ID {tokenCracha}</span>
          <span className="text-[5.5px] uppercase tracking-wider text-[#9CA3AF]">USO OBRIGATÓRIO</span>
        </div>
      </div>

      {/* 2. LINHA CENTRAL DE DOBRA (TRACEJADA COM TESOURA) */}
      <div className="relative w-0 flex items-center justify-center border-l-2 border-dashed border-[#CBD5E1] z-10">
        <div className="absolute top-2 bg-white rounded-full p-0.5 shadow-xs border border-[#CBD5E1] text-[#9CA3AF]">
          <Scissors className="w-2.5 h-2.5" />
        </div>
      </div>

      {/* 3. VERSO DO CRACHÁ (LADO DIREITO) */}
      <div className="w-1/2 h-full flex flex-col justify-between bg-white relative p-2.5 text-center">
        
        {/* Cabeçalho Carmim */}
        <div className="absolute top-0 left-0 right-0 bg-[#8B1D2C] text-white px-2.5 py-1.5 flex flex-col items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-white p-0.5 shrink-0 overflow-hidden mb-0.5">
            <img src="/logo-jegd.png" alt="Logo JEGD" className="w-full h-full object-contain" />
          </div>
          <h4 className="text-[10px] font-black leading-tight">JEGDS 2026</h4>
          <p className="text-[6px] font-medium tracking-wider opacity-90">JOGOS ESCOLARES DE GONÇALVES DIAS</p>
        </div>

        {/* Corpo do Verso: Direitos & QR Code */}
        <div className="mt-11 flex flex-col items-center flex-1 justify-center space-y-1.5">
          <span className="text-[7px] font-black text-[#065F46] uppercase tracking-wider">
            ESTE CRACHÁ DÁ DIREITO A
          </span>

          {/* Box 1: Água */}
          <div className="w-full bg-[#F3F4F6] rounded-md px-2 py-1 flex items-center gap-1.5 border border-[#E5E7EB]">
            <div className="w-2.5 h-2.5 border border-[#9CA3AF] rounded-xs bg-white shrink-0" />
            <span className="text-[7.5px] font-bold text-[#1F2937]">Água durante os jogos</span>
          </div>

          {/* Box 2: Lanches */}
          <div className="w-full bg-[#F3F4F6] rounded-md px-2 py-1 flex items-center gap-1.5 border border-[#E5E7EB]">
            <div className="w-2.5 h-2.5 border border-[#9CA3AF] rounded-xs bg-white shrink-0" />
            <span className="text-[7.5px] font-bold text-[#1F2937]">Lanches e refeições</span>
          </div>

          {/* QR Code */}
          <div className="bg-white p-1 rounded-md border border-[#E5E7EB] shadow-2xs w-10 h-10 flex items-center justify-center">
            {qrUrl ? (
              <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain" />
            ) : (
              <div className="w-8 h-8 bg-gray-100 rounded animate-pulse" />
            )}
          </div>

          <p className="text-[5.5px] text-[#6B7280] leading-tight">
            Crachá pessoal e intransferível.<br />
            Apresente-o em todos os pontos de apoio.
          </p>
        </div>

        {/* Faixa Escura SEMED */}
        <div className="bg-[#17221D] text-white py-0.5 text-[6px] font-black uppercase tracking-wider -mx-2.5 mb-1">
          SEMED • PREFEITURA DE GONÇALVES DIAS
        </div>

        {/* Rodapé Institucional com Brasões */}
        <div className="grid grid-cols-2 gap-1 items-center pt-0.5 border-t border-[#E2EAE5]">
          <div className="text-left leading-tight pl-1">
            <span className="text-[6px] font-black text-red-600 uppercase block">PREFEITURA</span>
            <span className="text-[7px] font-black text-[#17221D]">GONÇALVES <span className="text-emerald-600">DIAS</span></span>
            <span className="text-[4.5px] text-[#9CA3AF] block font-semibold">Cuidando da nossa gente</span>
          </div>
          <div className="text-right leading-tight pr-1 border-l border-[#E2EAE5]">
            <span className="text-[7px] font-black text-[#17221D] block">SEMED</span>
            <span className="text-[5px] text-[#6B7280] block font-medium">Secretaria Municipal de Educação</span>
          </div>
        </div>

      </div>
    </div>
  );
}
