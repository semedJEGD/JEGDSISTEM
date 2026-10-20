'use client';

import React from 'react';
import {
  X,
  Camera,
  Upload,
  UserPlus,
  Trophy,
  Check,
  QrCode,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  UserCheck,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';
import { Atleta, Genero, TipoDocumento, ModalidadeConfig, ModalidadeCodigo, CategoriaIdade, Escola, OPCOES_SERIE_TURMA } from '@/types/jegd';
import { JegdStorage } from '@/lib/storage';

interface DiagnosticoDuplicidadeProps {
  duplicado: boolean;
  tipoConflito?: 'MESMA_ESCOLA' | 'OUTRA_ESCOLA';
  atletaExistente?: Atleta;
  escolaExistente?: Escola;
  motivo?: 'DOCUMENTO' | 'NOME_DATA_NASC' | 'MATRICULA';
  descricao?: string;
  mensagemUsuario?: string;
}

interface ModalCadastroAtletaProps {
  isOpen: boolean;
  onClose: () => void;
  atletaEditando: Atleta | null;
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
  handleSalvarAtleta: (continuar?: boolean) => void;
  escolaId: string;
  diagnosticoDuplicidade?: DiagnosticoDuplicidadeProps;
  onCarregarAtletaDuplicado?: (atleta: Atleta) => void;
}

export function ModalCadastroAtleta({
  isOpen,
  onClose,
  atletaEditando,
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
  handleSalvarAtleta,
  escolaId,
  diagnosticoDuplicidade,
  onCarregarAtletaDuplicado
}: ModalCadastroAtletaProps) {
  if (!isOpen) return null;

  const bloqueadoPorOutraEscola = diagnosticoDuplicidade?.duplicado && diagnosticoDuplicidade.tipoConflito === 'OUTRA_ESCOLA';

  const onSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (bloqueadoPorOutraEscola) {
      alert(diagnosticoDuplicidade?.mensagemUsuario || 'Estudante bloqueado por duplicidade em outra escola.');
      return;
    }
    handleSalvarAtleta(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-[#E2EAE5] rounded-3xl max-w-4xl w-full p-4 sm:p-7 shadow-2xl relative my-auto max-h-[94vh] overflow-y-auto">
        
        {/* Header do Modal */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E2EAE5] mb-5">
          <div className="min-w-0 pr-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F7F1] border border-[#00A878]/30 text-[#087A5B] text-[11px] font-black mb-1">
              <Sparkles className="w-3 h-3" />
              <span>{atletaEditando ? 'Edição de Atleta' : 'Cadastro Rápido & Sem Burocracia'}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-[#17221D] truncate">
              {atletaEditando ? `Editar: ${atletaEditando.nomeCompleto}` : 'Novo Aluno-Atleta'}
            </h3>
            <p className="text-xs text-[#64748B]">
              Preencha os dados e escolha a(s) modalidade(s). A equipe da escola é montada automaticamente!
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-2xl bg-[#F7F9F8] hover:bg-gray-100 text-[#4B5563] hover:text-[#17221D] border border-[#E2EAE5] shrink-0 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerta de Duplicidade - Mesma Escola */}
        {diagnosticoDuplicidade?.duplicado && diagnosticoDuplicidade.tipoConflito === 'MESMA_ESCOLA' && diagnosticoDuplicidade.atletaExistente && (
          <div className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <UserCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs sm:text-sm font-black text-emerald-900">
                  Estudante já cadastrado nesta escola!
                </h4>
                <p className="text-[11px] sm:text-xs text-emerald-800 mt-0.5">
                  {diagnosticoDuplicidade.mensagemUsuario}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onCarregarAtletaDuplicado?.(diagnosticoDuplicidade.atletaExistente!)}
              className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 shadow-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Carregar Dados & Modalidades</span>
            </button>
          </div>
        )}

        {/* Alerta de Duplicidade - Outra Escola */}
        {diagnosticoDuplicidade?.duplicado && diagnosticoDuplicidade.tipoConflito === 'OUTRA_ESCOLA' && (
          <div className="mb-4 p-3.5 sm:p-4 rounded-2xl bg-rose-50 border border-rose-300 flex items-start gap-2.5 shadow-xs">
            <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs sm:text-sm font-black text-rose-900">
                Bloqueio de Duplicidade — Aluno já cadastrado em outra escola
              </h4>
              <p className="text-[11px] sm:text-xs text-rose-800 mt-0.5">
                {diagnosticoDuplicidade.mensagemUsuario}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={onSubmitForm} className="space-y-5">
          {/* Grade Principal: Dados do Aluno (Esq) + Modalidades (Dir) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            
            {/* COLUNA ESQUERDA: DADOS PESSOAIS E ESCOLARES (7 colunas) */}
            <div className="lg:col-span-7 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#087A5B] pb-1 border-b border-[#E2EAE5]">
                <Layers className="w-3.5 h-3.5" />
                <span>1. Dados Pessoais do Aluno</span>
              </div>

              {/* Nome Completo */}
              <div>
                <label className="block text-xs font-bold text-[#17221D] mb-1">
                  Nome Completo do Estudante *
                </label>
                <input
                  type="text"
                  required
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  placeholder="Ex: LUCAS GABRIEL SILVA OLIVEIRA"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-bold uppercase focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
                />
              </div>

              {/* Data de Nascimento & Sexo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17221D] mb-1">
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
                  />
                  {catCalc.categoria ? (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-black text-[#087A5B] bg-[#E8F7F1] px-2.5 py-1 rounded-lg border border-[#00A878]/30">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>{catCalc.mensagem}</span>
                    </div>
                  ) : (
                    <p className="mt-1 text-[10.5px] font-bold text-amber-700">
                      Fora da faixa oficial (9 a 20 anos)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17221D] mb-1">
                    Gênero / Naipe *
                  </label>
                  <select
                    value={sexo}
                    onChange={(e) => setSexo(e.target.value as Genero)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors cursor-pointer"
                  >
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMININO">Feminino</option>
                  </select>
                </div>
              </div>

              {/* Documento (Tipo e Número) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-[#17221D] mb-1">
                    Documento *
                  </label>
                  <select
                    value={documentoTipo}
                    onChange={(e) => setDocumentoTipo(e.target.value as TipoDocumento)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors cursor-pointer"
                  >
                    <option value="RG">RG</option>
                    <option value="CERTIDAO">Certidão</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#17221D] mb-1">
                    Número do Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={documentoNumero}
                    onChange={(e) => setDocumentoNumero(e.target.value)}
                    placeholder="Ex: 0001234567-8"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Série / Turma & Identificador Automático */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17221D] mb-1">
                    Série / Turma *
                  </label>
                  <select
                    value={serieTurma}
                    onChange={(e) => setSerieTurma(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs sm:text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white transition-colors cursor-pointer"
                  >
                    <optgroup label="Ensino Fundamental">
                      {OPCOES_SERIE_TURMA.filter(s => s.includes('Fundamental')).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Ensino Médio">
                      {OPCOES_SERIE_TURMA.filter(s => s.includes('Médio')).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Outro">
                      <option value="EJA / Regular">EJA / Regular</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17221D] mb-1">
                    Código do Atleta
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={matricula}
                      className="w-full px-3 py-2.5 pl-8 rounded-xl bg-emerald-50/70 border border-emerald-300 text-emerald-950 text-xs sm:text-sm font-mono font-black cursor-default"
                    />
                    <QrCode className="w-3.5 h-3.5 text-emerald-700 absolute left-2.5 top-3" />
                    <span className="absolute right-2.5 top-2.5 text-[10px] font-black text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                      Automático
                    </span>
                  </div>
                </div>
              </div>

              {/* Upload Foto (Opcional e Rápido) */}
              <div className="p-3 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-14 rounded-xl bg-white border border-[#E2EAE5] flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {fotoBase64 ? (
                      <img src={fotoBase64} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-5 h-5 text-[#94A3B8]" />
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#17221D]">Foto 3x4 do Crachá</h5>
                    <p className="text-[10px] text-[#64748B]">Opcional. Pode ser adicionada depois.</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFotoUpload} className="hidden" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-white border border-[#E2EAE5] text-[#17221D] hover:text-[#087A5B] text-xs font-bold shadow-2xs inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#00A878]" />
                    <span>{fotoBase64 ? 'Trocar' : 'Anexar'}</span>
                  </button>
                  {fotoBase64 && (
                    <button
                      type="button"
                      onClick={() => handleFotoUpload({ target: { files: [] } } as any)}
                      className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-xs transition-colors"
                      title="Remover foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* COLUNA DIREITA: MODALIDADES E EQUIPES (5 colunas) */}
            <div className="lg:col-span-5 space-y-3.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1 border-b border-[#E2EAE5] mb-2.5">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#087A5B]">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>2. Modalidades & Equipes</span>
                  </div>
                  {modalidadesEscolhidas.length > 0 && (
                    <span className="text-[10px] font-black text-[#087A5B] bg-[#E8F7F1] px-2 py-0.5 rounded-md">
                      {modalidadesEscolhidas.length} selecionada(s)
                    </span>
                  )}
                </div>

                {modalidadesDisponiveis.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-1">
                    <AlertCircle className="w-6 h-6 text-amber-600 mx-auto" />
                    <p className="text-xs text-amber-900 font-bold">
                      Nenhuma modalidade disponível para esta faixa etária ou gênero.
                    </p>
                    <p className="text-[11px] text-amber-800">
                      Verifique a data de nascimento e o sexo do estudante.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[310px] overflow-y-auto pr-1">
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
                          className={`p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                            sel
                              ? 'bg-[#E8F7F1] border-[#00A878] shadow-xs ring-1 ring-[#00A878]/30 font-bold'
                              : 'bg-[#F7F9F8] border-[#E2EAE5] text-[#17221D] hover:bg-white hover:border-[#00A878]/50'
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
                          
                          <div className="flex items-center justify-between text-[11px] text-[#4B5563] mt-1.5 font-medium">
                            <span className="text-[10px] uppercase font-bold text-slate-500">
                              {mod.tipo === 'COLETIVA' ? 'Equipe Coletiva' : 'Individual'}
                            </span>
                            <span className="text-[#087A5B] font-bold text-[10.5px]">
                              Elenco: {contagemAtual}/{mod.maxAtletas}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Sub-seletor de Provas se marcou Atletismo */}
                {modalidadesEscolhidas.includes('atletismo') && (
                  <div className="mt-3 p-3 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-950">
                        Provas de Atletismo ({catCalc.categoria}):
                      </span>
                      <span className="text-[11px] font-bold text-amber-800">
                        {provasAtletismo.length}/2
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {provasPermitidas.map((prova) => {
                        const ativa = provasAtletismo.includes(prova);
                        return (
                          <button
                            type="button"
                            key={prova}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleProva(prova);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                              ativa
                                ? 'bg-amber-500 text-slate-950 shadow-xs scale-102'
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
              </div>

              {modalidadesEscolhidas.length === 0 && modalidadesDisponiveis.length > 0 && (
                <p className="text-[11px] text-[#64748B] text-center italic bg-slate-50 p-2 rounded-xl border border-slate-200">
                  👆 Clique em ao menos uma modalidade para inscrever o estudante.
                </p>
              )}
            </div>

          </div>

          {/* Barra de Ações Inferior */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#E2EAE5]">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#F7F9F8] hover:bg-gray-100 text-xs sm:text-sm font-bold text-[#4B5563] transition-colors"
            >
              Cancelar
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              {!atletaEditando && (
                <button
                  type="button"
                  disabled={bloqueadoPorOutraEscola || !nomeCompleto.trim()}
                  onClick={() => handleSalvarAtleta(true)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#E8F7F1] hover:bg-[#d8f1e7] text-[#087A5B] font-bold text-xs sm:text-sm border border-[#00A878]/30 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  title="Salva este aluno e limpa o formulário para cadastrar o próximo sem fechar a tela"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Salvar & Cadastrar Próximo</span>
                </button>
              )}

              <button
                type="submit"
                disabled={bloqueadoPorOutraEscola || !nomeCompleto.trim()}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-black text-xs sm:text-sm shadow-md shadow-[#00A878]/20 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{atletaEditando ? 'Salvar Alterações' : 'Concluir Cadastro'}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
