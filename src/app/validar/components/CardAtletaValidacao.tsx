'use client';

import React from 'react';
import {
  CheckCircle2,
  Printer,
  Users,
  Flame,
  ShieldCheck,
  Droplets,
  Utensils,
  Bus,
  UserCheck,
  History,
  Trash2
} from 'lucide-react';
import { Atleta, Escola, InscricaoEquipe, PapelUsuario, RegistroControle, TipoRegistroControle } from '@/types/jegd';

interface CardAtletaValidacaoProps {
  atletaEncontrado: Atleta;
  escolaAtleta: Escola | null;
  inscricoesAtleta: InscricaoEquipe[];
  historicoAtleta: RegistroControle[];
  operadorPapel: PapelUsuario;
  catInfo: { idade: number; categoria: string | null; mensagem?: string } | null;
  onImprimirCracha: () => void;
  onRegistrarEvento: (tipo: TipoRegistroControle, descricao: string) => void;
  onRemoverRegistro: (id: string) => void;
  getTipoFormatado: (tipo: TipoRegistroControle) => { label: string; color: string; icon: React.ElementType };
}

export function CardAtletaValidacao({
  atletaEncontrado,
  escolaAtleta,
  inscricoesAtleta,
  historicoAtleta,
  operadorPapel,
  catInfo,
  onImprimirCracha,
  onRegistrarEvento,
  onRemoverRegistro,
  getTipoFormatado
}: CardAtletaValidacaoProps) {
  return (
    <div className="space-y-6">
      {/* CARD DO ATLETA ENCONTRADO */}
      <div className="bg-white border-2 border-[#00A878] rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
        
        {/* Badge de Status Topo */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2EAE5] pb-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E8F7F1] text-[#087A5B] text-xs font-black border border-[#00A878]/30">
            <CheckCircle2 className="w-4 h-4" />
            <span>CREDENCIAL AUTÊNTICA & REGULAR</span>
          </div>

          <button
            onClick={onImprimirCracha}
            className="px-3.5 py-1.5 rounded-xl bg-[#F7F9F8] hover:bg-[#E8F7F1] border border-[#00A878]/30 text-[#087A5B] text-xs font-black flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Crachá Individual (PDF)</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Foto / Avatar 3x4 */}
          <div className="w-28 h-36 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
            {atletaEncontrado.documentos?.foto3x4 ? (
              <img
                src={atletaEncontrado.documentos.foto3x4}
                alt={atletaEncontrado.nomeCompleto}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-2">
                <Users className="w-10 h-10 text-[#CBD5E1] mx-auto mb-1" />
                <span className="text-[10px] text-[#6B7280] font-black uppercase">FOTO 3X4</span>
              </div>
            )}
          </div>

          {/* Dados Principais */}
          <div className="space-y-3 flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="text-xs font-black text-[#17221D] bg-[#F7F9F8] px-2.5 py-0.5 rounded-md border border-[#E2EAE5]">
                ID: {atletaEncontrado.id.toUpperCase()}
              </span>
              <span className="text-xs font-black text-[#087A5B] bg-[#E8F7F1] px-2.5 py-0.5 rounded-md border border-[#00A878]/25">
                TOKEN: {atletaEncontrado.crachaToken}
              </span>
              <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                {catInfo?.categoria} • {atletaEncontrado.sexo}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[#17221D]">
              {atletaEncontrado.nomeCompleto}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-[#4B5563]">
              <p>
                Escola: <strong className="text-[#17221D]">{escolaAtleta?.nome} ({escolaAtleta?.sigla})</strong>
              </p>
              <p>
                Documento: <strong className="text-[#17221D]">{atletaEncontrado.documentoTipo} {atletaEncontrado.documentoNumero}</strong>
              </p>
              <p>
                Série / Turma: <strong className="text-[#17221D]">{atletaEncontrado.serieTurma}</strong>
              </p>
              <p>
                Data Nasc.: <strong className="text-[#17221D]">{new Date(atletaEncontrado.dataNascimento).toLocaleDateString('pt-BR')} ({catInfo?.idade} anos)</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Modalidades Vinculadas */}
        <div className="pt-4 border-t border-[#E2EAE5] space-y-2.5">
          <p className="text-xs font-black text-[#17221D] uppercase tracking-wider">
            Modalidades Inscritas & Status em Quadra
          </p>

          {inscricoesAtleta.length === 0 ? (
            <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 font-medium">
              * Atleta cadastrado na escola, mas sem vínculo a equipes homologadas no momento.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {inscricoesAtleta.map((insc) => (
                <div
                  key={insc.id}
                  className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-xl p-3 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs sm:text-sm font-black text-[#17221D]">{insc.modalidadeNome}</p>
                    <p className="text-[11px] text-[#4B5563]">
                      {insc.categoria} • {insc.sexo}
                    </p>
                  </div>
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-[#E8F7F1] text-[#087A5B] border border-[#00A878]/30">
                    LIBERADO PARA JOGO
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PAINEL DE AÇÕES DE CONTROLE LOGÍSTICO (POR PAPEL) */}
        <div className="pt-6 border-t-2 border-[#E2EAE5] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-black text-[#17221D] uppercase tracking-wider flex items-center gap-2">
              <Flame className="w-4 h-4 text-[#00A878]" />
              <span>Ações de Registro em Tempo Real</span>
            </h3>
            <span className="text-[11px] text-[#4B5563] font-bold">
              Papel Ativo: {operadorPapel}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {/* Botão Mesa / Fiscal / Árbitro */}
            {(operadorPapel === 'MESARIO' || operadorPapel === 'ARBITRO' || operadorPapel === 'COORDENADOR') && (
              <button
                onClick={() => onRegistrarEvento('ELEGIBILIDADE', 'Elegibilidade e Presença em Quadra Confirmada')}
                className="p-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2.5 shadow-sm transition-all text-left"
              >
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <div>
                  <p className="font-black">Verificar Elegibilidade</p>
                  <p className="text-[10px] text-emerald-100 font-normal">Check-in de jogo e mesa</p>
                </div>
              </button>
            )}

            {/* Botões Equipe de Apoio / Logística */}
            {(operadorPapel === 'APOIO' || operadorPapel === 'COORDENADOR' || operadorPapel === 'PROFESSOR') && (
              <>
                <button
                  onClick={() => onRegistrarEvento('AGUA', 'Entrega de Kit Água Mineral')}
                  className="p-3.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs flex items-center gap-2.5 shadow-sm transition-all text-left"
                >
                  <Droplets className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-black">Registrar Água</p>
                    <p className="text-[10px] text-sky-100 font-normal">Distribuição de hidratação</p>
                  </div>
                </button>

                <button
                  onClick={() => onRegistrarEvento('LANCHE', 'Entrega de Kit Lanche Oficial')}
                  className="p-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center gap-2.5 shadow-sm transition-all text-left"
                >
                  <Utensils className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-black">Registrar Lanche</p>
                    <p className="text-[10px] text-amber-100 font-normal">Alimentação da delegação</p>
                  </div>
                </button>

                <button
                  onClick={() => onRegistrarEvento('TRANSPORTE_IDA', 'Embarque confirmado - Transporte IDA')}
                  className="p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-2.5 shadow-sm transition-all text-left"
                >
                  <Bus className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-black">Embarque (Ida)</p>
                    <p className="text-[10px] text-indigo-100 font-normal">Saída da escola / praça</p>
                  </div>
                </button>

                <button
                  onClick={() => onRegistrarEvento('TRANSPORTE_VOLTA', 'Embarque confirmado - Transporte RETORNO')}
                  className="p-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center gap-2.5 shadow-sm transition-all text-left"
                >
                  <Bus className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-black">Embarque (Volta)</p>
                    <p className="text-[10px] text-purple-100 font-normal">Retorno após os jogos</p>
                  </div>
                </button>

                <button
                  onClick={() => onRegistrarEvento('CREDENCIAMENTO', 'Credenciamento Geral de Entrada')}
                  className="p-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs flex items-center gap-2.5 shadow-sm transition-all text-left"
                >
                  <UserCheck className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-black">Credenciamento Geral</p>
                    <p className="text-[10px] text-teal-100 font-normal">Entrada no ginásio</p>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* HISTÓRICO RECENTE DO ATLETA */}
      <div className="bg-white border border-[#E2EAE5] rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E2EAE5] pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#00A878]" />
            <h3 className="text-sm font-black text-[#17221D] uppercase">
              Histórico de Controle Deste Atleta ({historicoAtleta.length})
            </h3>
          </div>
          <span className="text-[11px] text-[#6B7280]">Ordenado do mais recente ao mais antigo</span>
        </div>

        {historicoAtleta.length === 0 ? (
          <p className="text-xs sm:text-sm text-[#6B7280] py-4 text-center font-medium">
            Nenhum registro logístico ou de quadra efetuado para este atleta ainda. Utilize os botões acima para registrar.
          </p>
        ) : (
          <div className="space-y-2.5">
            {historicoAtleta.map((log) => {
              const fmt = getTipoFormatado(log.tipo);
              const Icone = fmt.icon;
              const dataHora = new Date(log.timestamp).toLocaleString('pt-BR');

              return (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${fmt.color}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/70 shadow-2xs shrink-0">
                      <Icone className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-black">{log.detalhes || fmt.label}</p>
                      <p className="text-[11px] opacity-85">
                        Registrado por <strong>{log.registradoPor}</strong> ({log.papelOperador || 'Operador'}) • {dataHora}
                      </p>
                    </div>
                  </div>

                  {operadorPapel === 'COORDENADOR' && (
                    <button
                      onClick={() => onRemoverRegistro(log.id)}
                      title="Remover este registro"
                      className="self-end sm:self-center p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
