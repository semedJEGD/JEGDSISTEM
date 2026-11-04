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
  const tokenCracha = atleta.crachaToken || `CR-${atleta.id.toUpperCase().slice(0, 8)}`;
  const sexoSigla = atleta.sexo === 'FEMININO' ? 'FEM' : 'MASC';
  const dataNasc = new Date(atleta.dataNascimento).toLocaleDateString('pt-BR');
  const modNome = modalidadeNome || (atleta.modalidadesInscritas && atleta.modalidadesInscritas.length > 0 ? atleta.modalidadesInscritas.map(m => m.modalidadeNome).join(' / ') : 'DELEGAÇÃO ESCOLAR');
  const provas = atleta.modalidadesInscritas?.find(m => m.provas && m.provas.length > 0)?.provas;

  useEffect(() => {
    let ativo = true;
    QRCode.toDataURL(tokenCracha, { margin: 0, width: 100, errorCorrectionLevel: 'M' })
      .then(url => {
        if (ativo) setQrUrl(url);
      })
      .catch(() => {});
    return () => { ativo = false; };
  }, [tokenCracha]);

  return (
    <div 
      className="inline-flex bg-white rounded-2xl shadow-xl border border-slate-300 overflow-hidden select-none"
      style={{
        width: `${400 * escala}px`,
        height: `${280 * escala}px`,
        transformOrigin: 'top left'
      }}
    >
      {/* 1. FRENTE DO CRACHÁ (LADO ESQUERDO) */}
      <div className="w-1/2 h-full flex flex-col justify-between bg-white relative p-2 text-center">
        
        {/* Cabeçalho Carmim Simétrico */}
        <div className="absolute top-0 left-0 right-0 h-11 bg-[#8B1D2C] text-white px-2.5 flex items-center justify-between border-b-2 border-[#D97706]">
          <div className="text-left">
            <h4 className="text-[11px] font-black leading-tight tracking-tight">JEGDS 2026</h4>
            <p className="text-[6.0px] font-bold tracking-wider text-amber-200">GONÇALVES DIAS • MA • SEMED</p>
          </div>
          <div className="w-7 h-7 rounded-full bg-white p-0.5 shrink-0 overflow-hidden shadow-xs">
            <img src="/logo-jegd.png" alt="Logo JEGD" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Corpo da Frente */}
        <div className="mt-11 flex flex-col items-center flex-1 justify-center space-y-0.5">
          {/* Foto 3x4 */}
          <div className="w-12 h-15 rounded-md border-2 border-[#00A878] bg-slate-50 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
            {atleta.documentos?.foto3x4 ? (
              <img src={atleta.documentos.foto3x4} alt={atleta.nomeCompleto} className="w-full h-full object-cover" />
            ) : (
              <User className="w-6 h-6 text-[#00A878]/60" />
            )}
          </div>

          {/* Nome e Escola */}
          <div className="w-full px-1">
            <p className="text-[8.5px] font-black text-slate-900 leading-tight truncate uppercase">
              {atleta.nomeCompleto}
            </p>
            <p className="text-[7.0px] font-bold text-slate-500 truncate uppercase">
              {escola.nome}
            </p>
          </div>

          {/* Badge Categoria & Sexo */}
          <div className="inline-block bg-[#065F46] text-white text-[6.5px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
            {atleta.categoriaCalculada || 'LIVRE'} • {sexoSigla}
          </div>

          {/* Modalidade / Provas */}
          <div className="w-full leading-tight">
            <span className="text-[5.5px] font-black text-[#065F46] uppercase block">MODALIDADE</span>
            <p className="text-[7.0px] font-black text-slate-800 truncate uppercase">
              {modNome}
            </p>
            {provas && provas.length > 0 && (
              <p className="text-[6.0px] font-bold text-amber-600 truncate">
                {provas.join(' • ')}
              </p>
            )}
          </div>

          {/* Grid Inferior: Nascimento e Documento */}
          <div className="w-full grid grid-cols-2 gap-1 text-left pt-0.5 border-t border-slate-200">
            <div>
              <span className="text-[5.0px] font-bold text-slate-400 uppercase block">NASCIMENTO</span>
              <span className="text-[6.5px] font-black text-slate-800">{dataNasc}</span>
            </div>
            <div>
              <span className="text-[5.0px] font-bold text-slate-400 uppercase block">DOCUMENTO</span>
              <span className="text-[6.5px] font-black text-slate-800 truncate block">{atleta.documentoTipo}: {atleta.documentoNumero}</span>
            </div>
          </div>
        </div>

        {/* Rodapé da Frente */}
        <div className="w-full pt-1 border-t border-slate-200 flex items-center justify-between text-[6.0px] text-slate-700 font-bold bg-slate-50 -mx-2 px-2 -mb-2 py-1">
          <span>ID: {tokenCracha}</span>
          <span className="text-[5.5px] uppercase tracking-wider text-slate-500">USO OBRIGATÓRIO</span>
        </div>
      </div>

      {/* 2. LINHA CENTRAL DE DOBRA (TRACEJADA COM TESOURA) */}
      <div className="relative w-0 flex items-center justify-center border-l-2 border-dashed border-slate-300 z-10">
        <div className="absolute top-2 bg-white rounded-full p-0.5 shadow-xs border border-slate-300 text-slate-400">
          <Scissors className="w-2.5 h-2.5" />
        </div>
      </div>

      {/* 3. VERSO DO CRACHÁ (LADO DIREITO) */}
      <div className="w-1/2 h-full flex flex-col justify-between bg-white relative p-2 text-center">
        
        {/* Cabeçalho Carmim Simétrico (Exata Mesma Altura: h-11) */}
        <div className="absolute top-0 left-0 right-0 h-11 bg-[#8B1D2C] text-white px-2.5 flex flex-col items-center justify-center border-b-2 border-[#D97706]">
          <h4 className="text-[10px] font-black leading-tight tracking-tight">JEGDS 2026</h4>
          <p className="text-[5.5px] font-bold tracking-wider text-amber-200">JOGOS ESCOLARES DE GONÇALVES DIAS</p>
        </div>

        {/* Corpo do Verso: Direitos & QR Code */}
        <div className="mt-11 flex flex-col items-center flex-1 justify-center space-y-1">
          <span className="text-[6.5px] font-black text-[#065F46] uppercase tracking-wider">
            CONTROLE LOGÍSTICO & ACESSO
          </span>

          {/* Box 1: Água */}
          <div className="w-full bg-slate-50 rounded px-1.5 py-0.5 flex items-center gap-1.5 border border-slate-200">
            <div className="w-2.5 h-2.5 border border-emerald-600 rounded-xs bg-white shrink-0" />
            <span className="text-[6.8px] font-bold text-slate-700">Água durante os jogos</span>
          </div>

          {/* Box 2: Lanches */}
          <div className="w-full bg-slate-50 rounded px-1.5 py-0.5 flex items-center gap-1.5 border border-slate-200">
            <div className="w-2.5 h-2.5 border border-emerald-600 rounded-xs bg-white shrink-0" />
            <span className="text-[6.8px] font-bold text-slate-700">Lanches e refeições</span>
          </div>

          {/* QR Code */}
          <div className="bg-white p-0.5 rounded border border-slate-200 shadow-2xs w-11 h-11 flex items-center justify-center">
            {qrUrl ? (
              <img src={qrUrl} alt="QR Code" className="w-full h-full object-contain" />
            ) : (
              <div className="w-8 h-8 bg-gray-100 rounded animate-pulse" />
            )}
          </div>

          <p className="text-[5.0px] text-slate-500 leading-tight">
            Crachá pessoal e intransferível.<br />
            Apresentação obrigatória na entrada de quadra.
          </p>
        </div>

        {/* Faixa Escura SEMED */}
        <div className="bg-slate-900 text-white py-0.5 text-[5.5px] font-black uppercase tracking-wider -mx-2 mb-0.5">
          SEMED • PREFEITURA DE GONÇALVES DIAS
        </div>

        {/* Rodapé Institucional com Brasões */}
        <div className="grid grid-cols-2 gap-1 items-center pt-0.5 border-t border-slate-200">
          <div className="text-left leading-tight pl-1">
            <span className="text-[5.5px] font-black text-red-600 uppercase block">PREFEITURA</span>
            <span className="text-[6.5px] font-black text-slate-900">GONÇALVES <span className="text-emerald-600">DIAS</span></span>
            <span className="text-[4.0px] text-slate-400 block font-semibold">Cuidando da nossa gente</span>
          </div>
          <div className="text-right leading-tight pr-1 border-l border-slate-200">
            <span className="text-[6.5px] font-black text-slate-900 block">SEMED</span>
            <span className="text-[4.5px] text-slate-500 block font-medium">Secretaria de Educação</span>
          </div>
        </div>

      </div>
    </div>
  );
}
