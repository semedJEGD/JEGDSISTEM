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
  Camera
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
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-teal-500/10">
          <QrCode className="w-7 h-7 stroke-[2.2]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Validador de Credencial & Crachá Oficial
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Uso oficial para Árbitros, Mesários e Fiscais de Quadra confirmarem a elegibilidade dos atletas em quadra.
        </p>
      </div>

      {/* Formulário de Busca / Leitura de QR */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleValidar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Cole o Código QR ou digite o ID / Matrícula / Nome do Atleta
            </label>
            <div className="relative">
              <input
                type="text"
                value={codigoBusca}
                onChange={(e) => setCodigoBusca(e.target.value)}
                placeholder="Ex: atl-01, 20260012 ou cole o payload do QR Code..."
                className="w-full px-4 py-3.5 pl-11 rounded-2xl bg-slate-800/90 border border-slate-700 text-white text-sm focus:border-teal-500 transition-colors"
              />
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Exemplos para teste:</span>
              <button
                type="button"
                onClick={() => handleCarregarExemplo('atl-01')}
                className="text-teal-400 hover:underline font-semibold"
              >
                Gabriel Henrique (atl-01)
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => handleCarregarExemplo('atl-02')}
                className="text-teal-400 hover:underline font-semibold"
              >
                Lucas Gabriel (atl-02)
              </button>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2 transition-all hover:scale-105"
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
            <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-xs font-black px-6 py-1.5 rounded-bl-2xl uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                <CheckCircle2 className="w-4 h-4" />
                <span>Credencial Válida & Regular</span>
              </div>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pt-4">
                
                {/* Foto do Atleta */}
                <div className="w-28 h-36 rounded-2xl bg-slate-800 border-2 border-emerald-500/30 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                  {atletaEncontrado.documentos?.foto3x4 ? (
                    <img
                      src={atletaEncontrado.documentos.foto3x4}
                      alt={atletaEncontrado.nomeCompleto}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <Users className="w-10 h-10 text-slate-600 mx-auto mb-1" />
                      <span className="text-[10px] text-slate-400 font-bold">FOTO OFICIAL</span>
                    </div>
                  )}
                </div>

                {/* Dados Principais */}
                <div className="space-y-3 flex-1 text-center sm:text-left">
                  <div>
                    <span className="text-xs font-bold text-emerald-400">
                      ID: {atletaEncontrado.id} • {atletaEncontrado.sexo}
                    </span>
                    <h2 className="text-2xl font-black text-white">
                      {atletaEncontrado.nomeCompleto}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                    <p>
                      Escola: <strong className="text-white">{escolaAtleta?.nome} ({escolaAtleta?.sigla})</strong>
                    </p>
                    <p>
                      Rede de Ensino: <strong className="text-white">{escolaAtleta?.rede}</strong>
                    </p>
                    <p>
                      Documento: <strong className="text-white">{atletaEncontrado.documentoTipo} {atletaEncontrado.documentoNumero}</strong>
                    </p>
                    <p>
                      Série / Turma: <strong className="text-white">{atletaEncontrado.serieTurma}</strong>
                    </p>
                    <p>
                      Data de Nasc.: <strong className="text-white">{new Date(atletaEncontrado.dataNascimento).toLocaleDateString('pt-BR')}</strong>
                    </p>
                    <p>
                      Categoria: <strong className="text-emerald-400 font-bold">{catInfo?.categoria} ({catInfo?.idade} anos)</strong>
                    </p>
                  </div>
                </div>

              </div>

              {/* Modalidades Inscritas */}
              <div className="pt-6 border-t border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Equipes & Modalidades Vinculadas
                </h3>

                {inscricoesAtleta.length === 0 ? (
                  <p className="text-xs text-amber-400">
                    * Este atleta está cadastrado no banco da escola, mas ainda não foi convocado em nenhuma equipe homologada.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {inscricoesAtleta.map((insc) => (
                      <div
                        key={insc.id}
                        className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">{insc.modalidadeNome}</p>
                          <p className="text-[10px] text-slate-400">
                            {insc.categoria} • {insc.sexo}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          insc.status === 'VALIDADA'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
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
            <div className="bg-slate-900 border-2 border-red-500/40 rounded-3xl p-8 text-center space-y-3">
              <XCircle className="w-12 h-12 text-red-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Nenhum Atleta Encontrado</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Não localizamos nenhum estudante-atleta com esse código ou QR. Verifique se o código digitado está correto ou se o aluno está cadastrado na base da SEMED.
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
