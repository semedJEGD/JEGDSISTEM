'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  School,
  Trophy,
  Users,
  ShieldCheck,
  Camera,
  Sparkles
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { Atleta, Escola, InscricaoEquipe } from '@/types/jegd';

export default function ValidarCrachaPage() {
  const [codigoBusca, setCodigoBusca] = useState('');
  const [atletaEncontrado, setAtletaEncontrado] = useState<Atleta | null>(null);
  const [escolaAtleta, setEscolaAtleta] = useState<Escola | null>(null);
  const [inscricoesAtleta, setInscricoesAtleta] = useState<InscricaoEquipe[]>([]);
  const [buscou, setBuscou] = useState(false);

  useEffect(() => {
    JegdStorage.init();
  }, []);

  const handleValidar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoBusca.trim()) return;

    setBuscou(true);
    const termo = codigoBusca.trim().toLowerCase();

    // Pode ser um JSON do QR Code ou um ID/CPF/Matrícula
    let idParaBuscar = termo;
    try {
      if (termo.startsWith('{') && termo.endsWith('}')) {
        const parsed = JSON.parse(termo);
        if (parsed.id) idParaBuscar = parsed.id.toLowerCase();
      }
    } catch {}

    const todosAtletas = JegdStorage.getAtletas();
    const encontrado = todosAtletas.find(
      a => a.id.toLowerCase() === idParaBuscar ||
           (a.matricula && a.matricula.toLowerCase() === idParaBuscar) ||
           (a.documentoNumero && a.documentoNumero.replace(/\D/g, '') === idParaBuscar.replace(/\D/g, '')) ||
           a.nomeCompleto.toLowerCase().includes(termo)
    );

    if (encontrado) {
      setAtletaEncontrado(encontrado);
      setEscolaAtleta(JegdStorage.getEscolaById(encontrado.escolaId) || null);
      
      const todasInscricoes = JegdStorage.getInscricoes();
      const inscsDoAtleta = todasInscricoes.filter(i => i.atletaIds.includes(encontrado.id));
      setInscricoesAtleta(inscsDoAtleta);
    } else {
      setAtletaEncontrado(null);
      setEscolaAtleta(null);
      setInscricoesAtleta([]);
    }
  };

  const handleCarregarExemplo = (atletaId: string) => {
    setCodigoBusca(atletaId);
    const todosAtletas = JegdStorage.getAtletas();
    const encontrado = todosAtletas.find(a => a.id === atletaId);
    if (encontrado) {
      setBuscou(true);
      setAtletaEncontrado(encontrado);
      setEscolaAtleta(JegdStorage.getEscolaById(encontrado.escolaId) || null);
      const todasInscricoes = JegdStorage.getInscricoes();
      setInscricoesAtleta(todasInscricoes.filter(i => i.atletaIds.includes(encontrado.id)));
    }
  };

  const catInfo = atletaEncontrado ? JegdStorage.calcularCategoria(atletaEncontrado.dataNascimento) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3.5">
        <div className="w-16 h-16 rounded-2xl bg-[#E8F7F1] border border-[#00A878]/30 text-[#00A878] flex items-center justify-center mx-auto mb-2 shadow-2xs">
          <QrCode className="w-8 h-8 stroke-[2.2]" />
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E8F7F1] text-[#087A5B] text-xs font-black border border-[#00A878]/25">
          <Sparkles className="w-4 h-4 text-[#00A878]" />
          <span>MESA & ARBITRAGEM</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-[#17221D]">
          Validador de Credencial & Crachá Oficial
        </h1>
        <p className="text-sm sm:text-base text-[#4B5563] font-medium">
          Uso oficial para Árbitros, Mesários e Fiscais de Quadra confirmarem a elegibilidade dos atletas em quadra.
        </p>
      </div>

      {/* Formulário de Busca / Leitura de QR */}
      <div className="bg-white border border-[#E2EAE5] rounded-3xl p-6 sm:p-8 shadow-xs">
        <form onSubmit={handleValidar} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-black text-[#17221D] uppercase tracking-wider mb-2.5">
              Cole o Código QR ou digite o ID / Matrícula / Nome do Atleta
            </label>
            <div className="relative">
              <input
                type="text"
                value={codigoBusca}
                onChange={(e) => setCodigoBusca(e.target.value)}
                placeholder="Ex: atl-01, 20260012 ou cole o payload do QR Code..."
                className="w-full px-4 py-4 pl-12 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-sm sm:text-base font-semibold focus:border-[#00A878] focus:bg-white transition-all outline-none"
              />
              <Search className="w-5 h-5 text-[#4B5563] absolute left-4 top-4" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#4B5563]">
              <span>Exemplos:</span>
              <button
                type="button"
                onClick={() => handleCarregarExemplo('atl-01')}
                className="text-[#00A878] hover:text-[#087A5B] hover:underline font-bold"
              >
                Gabriel Henrique (atl-01)
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleCarregarExemplo('atl-02')}
                className="text-[#00A878] hover:text-[#087A5B] hover:underline font-bold"
              >
                Lucas Gabriel (atl-02)
              </button>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#00A878] hover:bg-[#087A5B] text-white font-black text-sm shadow-md shadow-[#00A878]/20 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verificar Autenticidade</span>
            </button>
          </div>
        </form>
      </div>

      {/* Resultado da Validação */}
      {buscou && (
        <div>
          {atletaEncontrado ? (
            <div className="bg-white border-2 border-[#00A878] rounded-3xl p-6 sm:p-8 shadow-md space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#00A878] text-white text-xs font-black px-6 py-1.5 rounded-bl-2xl uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>Credencial Válida & Regular</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-4">
                
                {/* Foto do Atleta */}
                <div className="w-28 h-36 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                  {atletaEncontrado.documentos?.foto3x4 ? (
                    <img
                      src={atletaEncontrado.documentos.foto3x4}
                      alt={atletaEncontrado.nomeCompleto}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <Users className="w-10 h-10 text-[#CBD5E1] mx-auto mb-1" />
                      <span className="text-xs text-[#4B5563] font-bold">FOTO OFICIAL</span>
                    </div>
                  )}
                </div>

                {/* Dados Principais */}
                <div className="space-y-3 flex-1 text-center sm:text-left">
                  <div>
                    <span className="text-xs font-black text-[#087A5B] bg-[#E8F7F1] px-3 py-1 rounded-lg border border-[#00A878]/20">
                      ID: {atletaEncontrado.id} • {atletaEncontrado.sexo}
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-[#17221D] mt-2">
                      {atletaEncontrado.nomeCompleto}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-[#4B5563]">
                    <p>
                      Escola: <strong className="text-[#17221D]">{escolaAtleta?.nome} ({escolaAtleta?.sigla})</strong>
                    </p>
                    <p>
                      Rede de Ensino: <strong className="text-[#17221D]">{escolaAtleta?.rede}</strong>
                    </p>
                    <p>
                      Documento: <strong className="text-[#17221D]">{atletaEncontrado.documentoTipo} {atletaEncontrado.documentoNumero}</strong>
                    </p>
                    <p>
                      Série / Turma: <strong className="text-[#17221D]">{atletaEncontrado.serieTurma}</strong>
                    </p>
                    <p>
                      Data de Nasc.: <strong className="text-[#17221D]">{new Date(atletaEncontrado.dataNascimento).toLocaleDateString('pt-BR')}</strong>
                    </p>
                    <p>
                      Categoria: <strong className="text-[#087A5B] font-bold">{catInfo?.categoria} ({catInfo?.idade} anos)</strong>
                    </p>
                  </div>
                </div>

              </div>

              {/* Modalidades Inscritas */}
              <div className="pt-6 border-t border-[#E2EAE5] space-y-3">
                <h3 className="text-xs font-black text-[#17221D] uppercase tracking-wider">
                  Equipes & Modalidades Vinculadas
                </h3>

                {inscricoesAtleta.length === 0 ? (
                  <p className="text-sm text-amber-800 bg-amber-50 p-4 rounded-2xl border border-amber-200 font-medium">
                    * Este atleta está cadastrado no banco da escola, mas ainda não foi vinculado em nenhuma equipe homologada.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {inscricoesAtleta.map((insc) => (
                      <div
                        key={insc.id}
                        className="bg-[#F7F9F8] border border-[#E2EAE5] rounded-2xl p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-black text-[#17221D]">{insc.modalidadeNome}</p>
                          <p className="text-xs text-[#4B5563] font-medium">
                            {insc.categoria} • {insc.sexo}
                          </p>
                        </div>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                          insc.status === 'VALIDADA'
                            ? 'bg-[#E8F7F1] text-[#087A5B] border-[#00A878]/30'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {insc.status === 'VALIDADA' ? 'LIBERADO PARA JOGO' : insc.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white border-2 border-rose-200 rounded-3xl p-8 text-center space-y-3 shadow-xs">
              <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
              <h3 className="text-xl font-black text-[#17221D]">Nenhum Atleta Encontrado</h3>
              <p className="text-sm text-[#4B5563] max-w-md mx-auto">
                Não localizamos nenhum estudante-atleta com esse código ou QR. Verifique se o código digitado está correto ou se o aluno está cadastrado na base da SEMED.
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}

