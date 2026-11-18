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
  Layers,
  FileQuestion
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
  semDocumento?: boolean;
  setSemDocumento?: (val: boolean) => void;
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
  semDocumento,
  setSemDocumento,
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
  const [internalSemDoc, setInternalSemDoc] = React.useState(false);
  const semDocAtivo = semDocumento !== undefined ? semDocumento : internalSemDoc;

  const handleToggleSemDoc = (checked: boolean) => {
    if (setSemDocumento) {
      setSemDocumento(checked);
    } else {
      setInternalSemDoc(checked);
    }
    if (checked) {
      setDocumentoTipo('SEM_DOCUMENTO');
      setDocumentoNumero('SEM DOCUMENTO');
    } else {
      setDocumentoTipo('RG');
      setDocumentoNumero('');
    }
  };

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
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-5 sm:p-6 shadow-xl relative my-auto max-h-[92vh] overflow-y-auto">
        
        {/* Header do Modal */}
        <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 mb-5">
          <div className="min-w-0 pr-3">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {atletaEditando ? `Editar: ${atletaEditando.nomeCompleto}` : 'Cadastrar Aluno-Atleta'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Informe os dados do aluno e selecione as modalidades em que participará.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 shrink-0 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerta de Duplicidade - Mesma Escola */}
        {diagnosticoDuplicidade?.duplicado && diagnosticoDuplicidade.tipoConflito === 'MESMA_ESCOLA' && diagnosticoDuplicidade.atletaExistente && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <UserCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-emerald-900">
                  Estudante já cadastrado nesta escola
                </h4>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  {diagnosticoDuplicidade.mensagemUsuario}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onCarregarAtletaDuplicado?.(diagnosticoDuplicidade.atletaExistente!)}
              className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shrink-0 transition-colors"
            >
              Carregar Dados
            </button>
          </div>
        )}

        {/* Alerta de Duplicidade - Outra Escola */}
        {diagnosticoDuplicidade?.duplicado && diagnosticoDuplicidade.tipoConflito === 'OUTRA_ESCOLA' && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-semibold text-rose-900">
                Aluno já cadastrado em outra escola
              </h4>
              <p className="text-[11px] text-rose-700 mt-0.5">
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
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 pb-1 border-b border-slate-100">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>1. Dados do Aluno</span>
              </div>

              {/* Nome Completo */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  placeholder="Ex: LUCAS GABRIEL SILVA OLIVEIRA"
                  className="w-full px-3 py-2 rounded-lg bg-slate-50/50 border border-slate-200 text-slate-900 text-xs sm:text-sm font-medium uppercase focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                />
              </div>

              {/* Data de Nascimento & Sexo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50/50 border border-slate-200 text-slate-900 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors"
                  />
                  {catCalc.categoria ? (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200/60">
                      <Calendar className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
                      <span>{catCalc.mensagem}</span>
                    </div>
                  ) : (
                    <p className="mt-1 text-[11px] font-medium text-amber-700">
                      Fora da faixa oficial (9 a 20 anos)
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Gênero / Naipe *
                  </label>
                  <select
                    value={sexo}
                    onChange={(e) => setSexo(e.target.value as Genero)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50/50 border border-slate-200 text-slate-900 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-colors cursor-pointer"
                  >
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMININO">Feminino</option>
                  </select>
                </div>
              </div>

              {/* Opção Caixinha: Aluno sem Documentos */}
              <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <FileQuestion className="w-3.5 h-3.5 text-amber-700" />
                  </div>
                  <div>
                    <label htmlFor="chk-sem-documento" className="text-xs font-semibold text-slate-900 cursor-pointer block">
                      Aluno sem documentos
                    </label>
                    <p className="text-[11px] text-amber-800">
                      Marque para cadastrar sem RG ou Certidão no momento
                    </p>
                  </div>
                </div>
                <input
                  id="chk-sem-documento"
                  type="checkbox"
                  checked={semDocAtivo}
                  onChange={(e) => handleToggleSemDoc(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer accent-emerald-600 shrink-0"
                />
              </div>

              {/* Documento (Tipo e Número) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Documento {!semDocAtivo && '*'}
                  </label>
                  <select
                    value={semDocAtivo ? 'SEM_DOCUMENTO' : documentoTipo}
                    disabled={semDocAtivo}
                    onChange={(e) => setDocumentoTipo(e.target.value as TipoDocumento)}
                    className={`w-full px-3 py-2 rounded-lg border text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600 transition-colors cursor-pointer ${
                      semDocAtivo
                        ? 'bg-amber-50/50 border-amber-200 text-amber-900 cursor-not-allowed opacity-90'
                        : 'bg-slate-50/50 border-slate-200 text-slate-900 focus:bg-white'
                    }`}
                  >
                    <option value="RG">RG</option>
                    <option value="CERTIDAO">Certidão</option>
                    <option value="SEM_DOCUMENTO">Sem Documento</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Número do Documento {!semDocAtivo && '*'}
                  </label>
                  <input
                    type="text"
                    required={!semDocAtivo}
                    disabled={semDocAtivo}
                    value={semDocAtivo ? 'SEM DOCUMENTO' : documentoNumero}
                    onChange={(e) => setDocumentoNumero(e.target.value)}
                    placeholder={semDocAtivo ? 'Aluno sem documentação (Pendente)' : 'Ex: 0001234567-8'}
                    className={`w-full px-3 py-2 rounded-lg border text-xs sm:text-sm font-medium focus:outline-none focus:border-emerald-600 transition-colors ${
                      semDocAtivo
                        ? 'bg-amber-50/50 border-amber-200 text-amber-900 cursor-not-allowed uppercase font-semibold'
                        : 'bg-slate-50/50 border-slate-200 text-slate-900 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* Série / Turma & Identificador Automático */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Série / Turma *
                  </label>
                  <select
                    value={serieTurma}
                    onChange={(e) => setSerieTurma(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-50/50 border border-slate-200 text-slate-900 text-xs sm:text-sm font-medium focus:bg-white focus:outline-none focus:border-emerald-600 transition-colors cursor-pointer"
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
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Código do Atleta
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={matricula}
                      className="w-full px-3 py-2 pl-8 rounded-lg bg-slate-100/70 border border-slate-200 text-slate-800 text-xs sm:text-sm font-mono font-semibold cursor-default"
                    />
                    <QrCode className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                    <span className="absolute right-2 top-1.5 text-[10px] font-medium text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      Automático
                    </span>
                  </div>
                </div>
              </div>

              {/* Upload Foto (Opcional) */}
              <div className="p-2.5 rounded-lg bg-slate-50/60 border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                    {fotoBase64 ? (
                      <img src={fotoBase64} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-medium text-slate-800">Foto 3x4 do Crachá</h5>
                    <p className="text-[11px] text-slate-500">Opcional. Pode ser adicionada depois.</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFotoUpload} className="hidden" />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-emerald-700 text-xs font-medium shadow-2xs inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-500" />
                    <span>{fotoBase64 ? 'Trocar' : 'Anexar'}</span>
                  </button>
                  {fotoBase64 && (
                    <button
                      type="button"
                      onClick={() => handleFotoUpload({ target: { files: [] } } as any)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs transition-colors"
                      title="Remover foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* COLUNA DIREITA: MODALIDADES E EQUIPES (5 colunas) */}
            <div className="lg:col-span-5 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <Trophy className="w-3.5 h-3.5 text-slate-400" />
                    <span>2. Modalidades</span>
                  </div>
                  {modalidadesEscolhidas.length > 0 && (
                    <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                      {modalidadesEscolhidas.length} selecionada(s)
                    </span>
                  )}
                </div>

                <p className="text-[11px] font-normal text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/80 mb-2">
                  Regra do Edital: máx. 1 coletiva e até 2 individuais (3 no total).
                </p>

                {modalidadesDisponiveis.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center space-y-1">
                    <AlertCircle className="w-5 h-5 text-amber-600 mx-auto" />
                    <p className="text-xs text-amber-900 font-semibold">
                      Nenhuma modalidade disponível para esta faixa etária ou gênero.
                    </p>
                    <p className="text-[11px] text-amber-800">
                      Verifique a data de nascimento e o sexo do estudante.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-[310px] overflow-y-auto pr-1">
                    {modalidadesDisponiveis.map((mod) => {
                      const sel = modalidadesEscolhidas.includes(mod.codigo);
                      const vagasInfo = escolaId ? JegdStorage.getVagasModalidadeInfo(
                        escolaId,
                        mod.codigo,
                        catCalc.categoria,
                        sexo,
                        atletaEditando?.id
                      ) : null;
                      const esgotado = Boolean(vagasInfo && vagasInfo.esgotado && !sel);

                      return (
                        <div
                          key={mod.id}
                          onClick={() => {
                            if (esgotado) {
                              alert(`⚠️ Vagas Esgotadas: A escola já preencheu todas as ${vagasInfo?.limiteMaximo} vagas permitidas pelo Regulamento Oficial do JEGDS 2026 para ${mod.nome} (${catCalc.categoria || 'Categoria'} - ${sexo}).\n\nNão é permitido inscrever alunos além do limite.`);
                              return;
                            }
                            toggleModalidade(mod.codigo);
                          }}
                          className={`p-2.5 rounded-xl border transition-all select-none ${
                            esgotado
                              ? 'bg-rose-50/30 border-rose-200/80 text-slate-400 opacity-70 cursor-not-allowed'
                              : sel
                              ? 'bg-emerald-50/90 border-emerald-500 text-emerald-950 font-medium cursor-pointer'
                              : 'bg-slate-50/50 border-slate-200 text-slate-800 hover:bg-white hover:border-slate-300 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs sm:text-sm font-semibold truncate">{mod.nome}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {esgotado && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                                  🔒 Esgotado ({vagasInfo?.vagasOcupadas}/{vagasInfo?.limiteMaximo})
                                </span>
                              )}
                              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                                sel ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                              }`}>
                                {sel && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                            <span className="text-[10px] uppercase font-medium">
                              {mod.tipo === 'COLETIVA' ? 'Coletiva' : 'Individual'}
                            </span>
                            <span className={esgotado ? 'text-rose-700 font-semibold text-[10px]' : 'text-emerald-700 font-medium'}>
                              {vagasInfo
                                ? `Vagas: ${vagasInfo.vagasOcupadas}/${vagasInfo.limiteMaximo} (${vagasInfo.vagasRestantes} restantes)`
                                : `Máx: ${mod.maxAtletas} atletas`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Sub-seletor de Provas se marcou Atletismo */}
                {modalidadesEscolhidas.includes('atletismo') && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-950">
                        Provas de Atletismo ({catCalc.categoria}):
                      </span>
                      <span className="text-[11px] font-medium text-amber-800">
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
                            className={`px-2 py-0.5 rounded-md text-xs font-medium transition-colors ${
                              ativa
                                ? 'bg-amber-500 text-slate-950 font-semibold'
                                : 'bg-white text-slate-700 border border-amber-200 hover:border-amber-400'
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
                <p className="text-[11px] text-slate-500 text-center italic bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                  Clique em ao menos uma modalidade para inscrever o estudante.
                </p>
              )}
            </div>

          </div>

          {/* Barra de Ações Inferior */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-3.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              Cancelar
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
              {!atletaEditando && (
                <button
                  type="button"
                  disabled={bloqueadoPorOutraEscola || !nomeCompleto.trim()}
                  onClick={() => handleSalvarAtleta(true)}
                  className="w-full sm:w-auto px-3.5 py-2 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100/70 text-emerald-800 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Salva este aluno e limpa o formulário para o próximo"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Salvar & Próximo</span>
                </button>
              )}

              <button
                type="submit"
                disabled={bloqueadoPorOutraEscola || !nomeCompleto.trim()}
                className="w-full sm:w-auto px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
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
