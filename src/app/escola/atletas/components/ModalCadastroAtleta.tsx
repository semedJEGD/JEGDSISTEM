'use client';

import React from 'react';
import {
  X,
  Camera,
  Upload,
  ArrowRight,
  Trophy,
  Check
} from 'lucide-react';
import { Atleta, Genero, TipoDocumento, ModalidadeConfig, ModalidadeCodigo, CategoriaIdade } from '@/types/jegd';
import { JegdStorage } from '@/lib/storage';

interface ModalCadastroAtletaProps {
  isOpen: boolean;
  onClose: () => void;
  atletaEditando: Atleta | null;
  etapaAtual: 1 | 2;
  setEtapaAtual: (etapa: 1 | 2) => void;
  nomeCompleto: string;
  setNomeCompleto: (val: string) => void;
  dataNascimento: string;
  setDataNascimento: (val: string) => void;
  sexo: Genero;
  setSexo: (val: Genero) => void;
  documentoTipo: TipoDocumento;
  setDocumentoTipo: (val: TipoDocumento) => void;
  documentoNumero: string;
  setDocumentoNumero: (val: string) => void;
  matricula: string;
  setMatricula: (val: string) => void;
  serieTurma: string;
  setSerieTurma: (val: string) => void;
  fotoBase64?: string;
  handleFotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  catCalc: { idade: number; categoria: CategoriaIdade | null; mensagem: string };
  modalidadesDisponiveis: ModalidadeConfig[];
  modalidadesEscolhidas: ModalidadeCodigo[];
  toggleModalidade: (codigo: ModalidadeCodigo) => void;
  provasPermitidas: string[];
  provasAtletismo: string[];
  toggleProva: (prova: string) => void;
  handleAvancarParaEtapa2: (e: React.FormEvent) => void;
  handleSalvarAtleta: (continuar?: boolean) => void;
  escolaId: string;
}

export function ModalCadastroAtleta({
  isOpen,
  onClose,
  atletaEditando,
  etapaAtual,
  setEtapaAtual,
  nomeCompleto,
  setNomeCompleto,
  dataNascimento,
  setDataNascimento,
  sexo,
  setSexo,
  documentoTipo,
  setDocumentoTipo,
  documentoNumero,
  setDocumentoNumero,
  matricula,
  setMatricula,
  serieTurma,
  setSerieTurma,
  fotoBase64,
  handleFotoUpload,
  fileInputRef,
  catCalc,
  modalidadesDisponiveis,
  modalidadesEscolhidas,
  toggleModalidade,
  provasPermitidas,
  provasAtletismo,
  toggleProva,
  handleAvancarParaEtapa2,
  handleSalvarAtleta,
  escolaId
}: ModalCadastroAtletaProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-[#E2EAE5] rounded-2xl sm:rounded-3xl max-w-2xl w-full p-4 sm:p-8 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Header do Modal com Indicador de Etapas */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E2EAE5] mb-5">
          <div className="min-w-0 pr-2">
            <h3 className="text-lg sm:text-xl font-black text-[#17221D] flex items-center gap-2 truncate">
              <span>{atletaEditando ? 'Editar Aluno & Inscrição' : 'Cadastro Rápido de Aluno'}</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#4B5563] mt-0.5 truncate">
              {etapaAtual === 1 ? 'Etapa 1 de 2: Dados Pessoais' : 'Etapa 2 de 2: Modalidade & Equipe'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[#F7F9F8] hover:bg-gray-100 text-[#4B5563] hover:text-[#17221D] border border-[#E2EAE5] shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Visual */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-5">
          <button
            type="button"
            onClick={() => setEtapaAtual(1)}
            className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2.5 border transition-all ${
              etapaAtual === 1
                ? 'bg-[#E8F7F1] border-[#00A878] text-[#087A5B]'
                : 'bg-[#F7F9F8] border-[#E2EAE5] text-[#4B5563]'
            }`}
          >
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#00A878] text-white text-[10px] sm:text-xs flex items-center justify-center font-black shrink-0">1</span>
            <span className="truncate">Dados do Aluno</span>
          </button>

          <button
            type="button"
            onClick={(e) => handleAvancarParaEtapa2(e)}
            className={`py-2.5 sm:py-3 px-2 sm:px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2.5 border transition-all ${
              etapaAtual === 2
                ? 'bg-[#E8F7F1] border-[#00A878] text-[#087A5B]'
                : 'bg-[#F7F9F8] border-[#E2EAE5] text-[#4B5563]'
            }`}
          >
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#087A5B] text-white text-[10px] sm:text-xs flex items-center justify-center font-black shrink-0">2</span>
            <span className="truncate">Modalidade</span>
          </button>
        </div>

        {/* ETAPA 1: DADOS DO ALUNO */}
        {etapaAtual === 1 && (
          <form onSubmit={handleAvancarParaEtapa2} className="space-y-4">
            
            {/* Upload Foto (Opcional) */}
            <div className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5]">
              <div className="w-14 h-18 sm:w-16 sm:h-20 rounded-xl bg-white border border-[#E2EAE5] flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                {fotoBase64 ? (
                  <img src={fotoBase64} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-[#CBD5E1]" />
                )}
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#17221D]">Foto do Atleta (Opcional)</h4>
                <p className="text-[11px] sm:text-xs text-[#4B5563] mb-2 font-medium">Para o Crachá Oficial do JEGDS 2026.</p>
                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFotoUpload} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#E2EAE5] text-[#17221D] hover:text-[#087A5B] text-xs font-bold shadow-2xs inline-flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5 text-[#00A878]" />
                  <span>{fotoBase64 ? 'Trocar Foto' : 'Carregar Imagem'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-bold text-[#17221D] mb-1">
                  Nome Completo do Estudante *
                </label>
                <input
                  type="text"
                  required
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  placeholder="Ex: LUCAS GABRIEL OLIVEIRA"
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-bold uppercase focus:outline-none focus:border-[#00A878] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#17221D] mb-1">
                  Data de Nascimento *
                </label>
                <input
                  type="date"
                  required
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white"
                />
                {dataNascimento && (
                  <p className="text-[11px] sm:text-xs mt-1 font-bold text-[#087A5B]">
                    {catCalc.mensagem}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#17221D] mb-1">
                  Gênero / Sexo *
                </label>
                <select
                  value={sexo}
                  onChange={(e) => setSexo(e.target.value as Genero)}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white"
                >
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMININO">Feminino</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#17221D] mb-1">
                  Tipo de Documento *
                </label>
                <select
                  value={documentoTipo}
                  onChange={(e) => setDocumentoTipo(e.target.value as TipoDocumento)}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white"
                >
                  <option value="RG">RG (Identidade)</option>
                  <option value="CERTIDAO">Certidão de Nascimento</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#17221D] mb-1">
                  Número do Documento *
                </label>
                <input
                  type="text"
                  required
                  value={documentoNumero}
                  onChange={(e) => setDocumentoNumero(e.target.value)}
                  placeholder="Número obrigatório"
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#17221D] mb-1">
                  Série / Turma
                </label>
                <input
                  type="text"
                  value={serieTurma}
                  onChange={(e) => setSerieTurma(e.target.value)}
                  placeholder="Ex: 8º Ano B"
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#00A878] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-[#17221D] mb-1">
                  Matrícula Escolar
                </label>
                <input
                  type="text"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  placeholder="Ex: MAT-2026"
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#00A878] focus:bg-white"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 pt-4 border-t border-[#E2EAE5]">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 rounded-xl sm:rounded-2xl bg-[#F7F9F8] hover:bg-gray-100 text-xs sm:text-sm font-bold text-[#4B5563] text-center"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl sm:rounded-2xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs sm:text-sm font-black shadow-md shadow-[#00A878]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <span>Avançar para Escolha da Modalidade (Etapa 2)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ETAPA 2: ESCOLHA DA MODALIDADE & FORMAÇÃO AUTOMÁTICA DA EQUIPE */}
        {etapaAtual === 2 && (
          <div className="space-y-4 sm:space-y-5">
            
            {/* Resumo do Aluno */}
            <div className="bg-[#E8F7F1] border border-[#00A878]/30 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between">
              <div>
                <h4 className="text-xs sm:text-sm font-black text-[#087A5B]">
                  {nomeCompleto || 'Aluno Sem Nome'}
                </h4>
                <p className="text-[11px] sm:text-xs text-[#17221D] mt-0.5">
                  Idade: <strong>{catCalc.idade} anos</strong> • Categoria: <strong className="text-[#087A5B]">{catCalc.categoria}</strong> • Naipe: <strong>{sexo}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEtapaAtual(1)}
                className="text-xs font-bold text-[#087A5B] hover:underline shrink-0"
              >
                Alterar
              </button>
            </div>

            {/* Modalidades Elegíveis */}
            <div>
              <label className="block text-xs sm:text-sm font-black text-[#17221D] uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#00A878]" />
                <span>Selecione a(s) Modalidade(s):</span>
              </label>

              {modalidadesDisponiveis.length === 0 ? (
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                  <p className="text-xs sm:text-sm text-amber-800 font-bold">
                    Nenhuma modalidade oficial disponível para a categoria {catCalc.categoria} ({sexo}) no regulamento.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 max-h-56 sm:max-h-64 overflow-y-auto pr-1">
                  {modalidadesDisponiveis.map((mod) => {
                    const sel = modalidadesEscolhidas.includes(mod.codigo);
                    
                    const equipeAtual = JegdStorage.getInscricoes(escolaId).find(
                      i => i.modalidadeCodigo === mod.codigo && i.categoria === catCalc.categoria && i.sexo === sexo
                    );
                    const contagemAtual = equipeAtual ? equipeAtual.atletaIds.length : 0;

                    return (
                      <div
                        key={mod.id}
                        onClick={() => toggleModalidade(mod.codigo)}
                        className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border cursor-pointer transition-all ${
                          sel
                            ? 'bg-[#E8F7F1] border-[#00A878] shadow-sm'
                            : 'bg-[#F7F9F8] border-[#E2EAE5] text-[#17221D] hover:bg-white hover:border-[#00A878]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-black text-[#17221D]">{mod.nome}</span>
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                            sel ? 'bg-[#00A878] border-[#00A878] text-white' : 'border-[#CBD5E1] bg-white'
                          }`}>
                            {sel && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-[11px] sm:text-xs text-[#4B5563] mt-2">
                          <span>Tipo: <strong className="text-[#17221D]">{mod.tipo}</strong></span>
                          <span className="text-[#087A5B] font-bold">
                            Equipe: {contagemAtual}/{mod.maxAtletas}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sub-seletor de Provas se marcou Atletismo */}
            {modalidadesEscolhidas.includes('atletismo') && (
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold text-amber-950">
                    Provas de Atletismo ({catCalc.categoria}):
                  </span>
                  <span className="text-xs font-bold text-amber-800">
                    {provasAtletismo.length}/2 selecionadas
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {provasPermitidas.map((prova) => {
                    const ativa = provasAtletismo.includes(prova);
                    return (
                      <button
                        type="button"
                        key={prova}
                        onClick={() => toggleProva(prova)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          ativa
                            ? 'bg-amber-500 text-slate-950 shadow-sm'
                            : 'bg-white text-[#17221D] border border-amber-200 hover:border-amber-400'
                        }`}
                      >
                        {prova}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Botões de Ação na Etapa 2 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 pt-4 border-t border-[#E2EAE5]">
              <button
                type="button"
                onClick={() => setEtapaAtual(1)}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#F7F9F8] hover:bg-gray-100 text-xs sm:text-sm font-bold text-[#4B5563] text-center"
              >
                ← Voltar aos Dados
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleSalvarAtleta(true)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#E8F7F1] hover:bg-[#d8f1e7] text-[#087A5B] font-bold text-xs sm:text-sm border border-[#00A878]/30 transition-all text-center"
                >
                  ⚡ Salvar e Próximo Aluno
                </button>

                <button
                  type="button"
                  onClick={() => handleSalvarAtleta(false)}
                  className="w-full sm:w-auto px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#00A878] hover:bg-[#087A5B] text-white font-black text-xs sm:text-sm shadow-md shadow-[#00A878]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  <Check className="w-4 h-4" />
                  <span>Concluir Inscrição</span>
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
