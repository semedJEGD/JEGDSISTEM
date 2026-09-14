'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  ArrowLeft,
  Camera,
  Trash2,
  Edit2,
  CheckCircle,
  AlertCircle,
  Search,
  Upload,
  FileText,
  IdCard,
  Phone,
  Calendar,
  ShieldCheck,
  Trophy,
  Sparkles,
  Check,
  X
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { Escola, Atleta, Genero, TipoDocumento, ModalidadeConfig, ModalidadeCodigo, CategoriaIdade } from '@/types/jegd';
import { JegdsRulesService, PROVAS_ATLETISMO_POR_CATEGORIA } from '@/services/jegds-rules';

export default function EscolaAtletasPage() {
  const router = useRouter();
  const [escola, setEscola] = useState<Escola | null>(null);
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [modalidades, setModalidades] = useState<ModalidadeConfig[]>([]);
  const [busca, setBusca] = useState('');
  const [filtroSexo, setFiltroSexo] = useState<string>('TODOS');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODOS');

  // Modal de Cadastro / Edição
  const [modalAberto, setModalAberto] = useState(false);
  const [atletaEditando, setAtletaEditando] = useState<Atleta | null>(null);

  // Form State
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [dataNascimento, setDataNascimento] = useState('2013-05-10');
  const [sexo, setSexo] = useState<Genero>('MASCULINO');
  const [documentoTipo, setDocumentoTipo] = useState<TipoDocumento>('RG');
  const [documentoNumero, setDocumentoNumero] = useState('');
  const [matricula, setMatricula] = useState('');
  const [serieTurma, setSerieTurma] = useState('');
  const [nomeMae, setNomeMae] = useState('');
  const [telefoneContato, setTelefoneContato] = useState('');
  const [tipoSanguineo, setTipoSanguineo] = useState('O+');
  const [consentimentoResponsavel, setConsentimentoResponsavel] = useState(true);
  const [fotoBase64, setFotoBase64] = useState<string | undefined>(undefined);

  // Inscrição em Modalidade direta no cadastro do aluno
  const [modalidadesEscolhidas, setModalidadesEscolhidas] = useState<ModalidadeCodigo[]>([]);
  const [provasAtletismo, setProvasAtletismo] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    JegdStorage.init();
    const atual = JegdStorage.getCurrentEscola();
    if (!atual) {
      router.push('/escola/login');
      return;
    }
    setEscola(atual);
    setAtletas(JegdStorage.getAtletas(atual.id));
    setModalidades(JegdStorage.getModalidades());
  }, []);

  const handleAbrirModalNovo = () => {
    setAtletaEditando(null);
    setNomeCompleto('');
    setDataNascimento('2013-05-10');
    setSexo('MASCULINO');
    setDocumentoTipo('RG');
    setDocumentoNumero('');
    setMatricula('');
    setSerieTurma('7º Ano A');
    setNomeMae('');
    setTelefoneContato('(99) 98888-0000');
    setTipoSanguineo('O+');
    setConsentimentoResponsavel(true);
    setFotoBase64(undefined);
    setModalidadesEscolhidas([]);
    setProvasAtletismo([]);
    setModalAberto(true);
  };

  const handleAbrirModalEditar = (atleta: Atleta) => {
    setAtletaEditando(atleta);
    setNomeCompleto(atleta.nomeCompleto);
    setDataNascimento(atleta.dataNascimento);
    setSexo(atleta.sexo);
    setDocumentoTipo(atleta.documentoTipo || 'RG');
    setDocumentoNumero(atleta.documentoNumero || '');
    setMatricula(atleta.matricula);
    setSerieTurma(atleta.serieTurma);
    setNomeMae(atleta.nomeMae || '');
    setTelefoneContato(atleta.telefoneContato);
    setTipoSanguineo(atleta.tipoSanguineo || 'O+');
    setConsentimentoResponsavel(atleta.consentimentoResponsavel);
    setFotoBase64(atleta.documentos?.foto3x4);
    
    const modsInsc = atleta.modalidadesInscritas?.map(m => m.modalidadeCodigo) || [];
    setModalidadesEscolhidas(modsInsc);
    const atletismoInsc = atleta.modalidadesInscritas?.find(m => m.modalidadeCodigo === 'atletismo');
    setProvasAtletismo(atletismoInsc?.provas || []);

    setModalAberto(true);
  };

  const handleFotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('A foto deve ter no máximo 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const catCalc = JegdsRulesService.calcularCategoria(dataNascimento);

  // Filtra as modalidades disponíveis estritamente pela matriz oficial para esta categoria e sexo
  const modalidadesDisponiveis = modalidades.filter(mod => {
    if (!catCalc.categoria) return false;
    const res = JegdsRulesService.validarMatriz(mod.codigo, catCalc.categoria as CategoriaIdade, sexo);
    return res.valido;
  });

  const toggleModalidade = (modCodigo: ModalidadeCodigo) => {
    if (!catCalc.categoria) return;
    const infoVagas = JegdStorage.getVagasOcupadas(modCodigo, catCalc.categoria as CategoriaIdade, sexo);
    
    if (modalidadesEscolhidas.includes(modCodigo)) {
      setModalidadesEscolhidas(modalidadesEscolhidas.filter(c => c !== modCodigo));
      if (modCodigo === 'atletismo') setProvasAtletismo([]);
    } else {
      if (infoVagas.esgotada) {
        alert(`A modalidade selecionada atingiu o limite oficial (${infoVagas.total} vagas) e está esgotada.`);
        return;
      }
      setModalidadesEscolhidas([...modalidadesEscolhidas, modCodigo]);
    }
  };

  const toggleProva = (prova: string) => {
    if (provasAtletismo.includes(prova)) {
      setProvasAtletismo(provasAtletismo.filter(p => p !== prova));
    } else {
      if (provasAtletismo.length >= 2) {
        alert('No Atletismo, cada atleta pode se inscrever em no máximo 2 provas.');
        return;
      }
      setProvasAtletismo([...provasAtletismo, prova]);
    }
  };

  const handleSalvarAtleta = (e: React.FormEvent, cadastrarOutro: boolean = false) => {
    e.preventDefault();
    if (!escola) return;

    if (!nomeCompleto || !dataNascimento || !documentoNumero) {
      alert('Por favor, preencha todos os campos obrigatórios (Nome, Nascimento e Documento).');
      return;
    }

    const valDoc = JegdsRulesService.validarDocumento(documentoTipo, documentoNumero);
    if (!valDoc.valido) {
      alert(valDoc.erro);
      return;
    }

    if (!catCalc.categoria) {
      alert('A data de nascimento informada não se enquadra nas categorias oficiais do JEGD 2026 (9 a 20 anos).');
      return;
    }

    if (!consentimentoResponsavel) {
      alert('É obrigatório confirmar o consentimento do responsável para cadastrar o atleta menor de idade (LGPD).');
      return;
    }

    if (modalidadesEscolhidas.includes('atletismo')) {
      if (provasAtletismo.length === 0) {
        alert('Selecione ao menos 1 prova de Atletismo para o atleta (máximo 2).');
        return;
      }
    }

    const currentUser = JegdStorage.getCurrentUser();
    const atletaId = atletaEditando ? atletaEditando.id : `atl-${Date.now()}`;

    const modalidadesMapeadas = modalidadesEscolhidas.map(mCod => {
      const modObj = modalidades.find(m => m.codigo === mCod);
      return {
        modalidadeCodigo: mCod,
        modalidadeNome: modObj?.nome || mCod,
        provas: mCod === 'atletismo' ? provasAtletismo : undefined
      };
    });

    const atleta: Atleta = {
      id: atletaId,
      escolaId: escola.id,
      nomeCompleto,
      dataNascimento,
      sexo,
      documentoTipo,
      documentoNumero,
      matricula,
      serieTurma,
      nomeMae,
      telefoneContato,
      tipoSanguineo,
      consentimentoResponsavel,
      cadastradoPor: currentUser?.nome || escola.responsavelNome,
      categoriaCalculada: catCalc.categoria,
      modalidadesInscritas: modalidadesMapeadas,
      conferidoPeloCoordenador: atletaEditando?.conferidoPeloCoordenador || false,
      observacaoCoordenador: atletaEditando?.observacaoCoordenador,
      documentos: {
        ...(atletaEditando?.documentos || {}),
        foto3x4: fotoBase64
      },
      ativo: true,
      createdAt: atletaEditando ? atletaEditando.createdAt : new Date().toISOString()
    };

    JegdStorage.saveAtleta(atleta);

    // Cria ou atualiza as inscrições em equipes correspondentes
    modalidadesEscolhidas.forEach(modCod => {
      const modObj = modalidades.find(m => m.codigo === modCod);
      if (!modObj || !catCalc.categoria) return;

      const inscricoesAtuais = JegdStorage.getInscricoes(escola.id);
      let insc = inscricoesAtuais.find(
        i => i.modalidadeCodigo === modCod && i.categoria === catCalc.categoria && i.sexo === sexo
      );

      if (!insc) {
        insc = {
          id: `insc-${Date.now()}-${modCod}`,
          escolaId: escola.id,
          modalidadeCodigo: modCod,
          modalidadeNome: modObj.nome,
          categoria: catCalc.categoria,
          sexo: sexo,
          atletaIds: [atletaId],
          provasPorAtleta: modCod === 'atletismo' ? { [atletaId]: provasAtletismo } : undefined,
          comissaoIds: [],
          status: 'PENDENTE',
          dataInscricao: new Date().toLocaleString('pt-BR'),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      } else {
        if (!insc.atletaIds.includes(atletaId)) {
          insc.atletaIds.push(atletaId);
        }
        if (modCod === 'atletismo') {
          insc.provasPorAtleta = {
            ...(insc.provasPorAtleta || {}),
            [atletaId]: provasAtletismo
          };
        }
      }
      JegdStorage.saveInscricao(insc);
    });

    setAtletas(JegdStorage.getAtletas(escola.id));

    if (cadastrarOutro) {
      handleAbrirModalNovo();
    } else {
      setModalAberto(false);
    }
  };

  const handleExcluirAtleta = (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir o cadastro do aluno "${nome}"?`)) {
      JegdStorage.deleteAtleta(id);
      if (escola) setAtletas(JegdStorage.getAtletas(escola.id));
    }
  };

  if (!escola) return null;

  // Filtros
  const atletasFiltrados = atletas.filter(a => {
    const bateBusca = a.nomeCompleto.toLowerCase().includes(busca.toLowerCase()) ||
                      a.matricula.includes(busca) ||
                      a.documentoNumero.includes(busca);
    const bateSexo = filtroSexo === 'TODOS' || a.sexo === filtroSexo;
    const catInfo = a.categoriaCalculada || JegdsRulesService.calcularCategoria(a.dataNascimento).categoria;
    const bateCategoria = filtroCategoria === 'TODOS' || catInfo === filtroCategoria;

    return bateBusca && bateSexo && bateCategoria;
  });

  const provasPermitidas = catCalc.categoria ? PROVAS_ATLETISMO_POR_CATEGORIA[catCalc.categoria] || [] : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/escola/dashboard"
            className="p-2.5 rounded-xl bg-white border border-[#E2EAE5] text-[#68756E] hover:text-[#17221D] transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-[#17221D]">Alunos-Atletas da Escola</h1>
            <p className="text-xs text-[#68756E] mt-0.5">
              Escola: <strong className="text-[#17221D]">{escola.nome}</strong> ({escola.sigla}) • {escola.rede}
            </p>
          </div>
        </div>

        <button
          onClick={handleAbrirModalNovo}
          className="px-5 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-bold text-xs shadow-xs hover:shadow-md flex items-center gap-2 transition-all active:scale-98"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Aluno (Um a Um)</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white border border-[#E2EAE5] rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 shadow-xs">
        <div className="sm:col-span-2 relative">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, matrícula ou documento..."
            className="w-full px-4 py-2.5 pl-10 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:border-[#00A878] focus:bg-white outline-none"
          />
          <Search className="w-4 h-4 text-[#68756E] absolute left-3.5 top-3" />
        </div>

        <div>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:border-[#00A878] outline-none font-medium"
          >
            <option value="TODOS">Todas as Categorias</option>
            <option value="MIRIM">Mirim (9 a 11 anos)</option>
            <option value="INFANTIL">Infantil (12 a 14 anos)</option>
            <option value="INFANTO">Infanto (15 a 17 anos)</option>
            <option value="JUNIOR">Junior (18 a 20 anos)</option>
          </select>
        </div>

        <div>
          <select
            value={filtroSexo}
            onChange={(e) => setFiltroSexo(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:border-[#00A878] outline-none font-medium"
          >
            <option value="TODOS">Todos os Gêneros</option>
            <option value="MASCULINO">Masculino</option>
            <option value="FEMININO">Feminino</option>
          </select>
        </div>
      </div>

      {/* Grid de Atletas */}
      {atletasFiltrados.length === 0 ? (
        <div className="bg-white border border-[#E2EAE5] rounded-3xl p-12 text-center shadow-xs">
          <Users className="w-12 h-12 text-[#CBD5E1] mx-auto mb-3" />
          <p className="text-base font-bold text-[#17221D]">Nenhum atleta cadastrado ainda.</p>
          <p className="text-xs text-[#68756E] mt-1">
            Cadastre os alunos da sua escola para garantir as vagas nas modalidades do JEGD 2026.
          </p>
          <button
            onClick={handleAbrirModalNovo}
            className="px-5 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-bold text-xs inline-flex items-center gap-2 mt-4 shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Primeiro Aluno</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {atletasFiltrados.map((atleta) => {
            const catInfo = atleta.categoriaCalculada || JegdsRulesService.calcularCategoria(atleta.dataNascimento).categoria;

            return (
              <div
                key={atleta.id}
                className="bg-white border border-[#E2EAE5] hover:border-[#00A878]/50 rounded-2xl p-5 shadow-xs hover:shadow-md relative group transition-all"
              >
                <div className="flex items-start gap-4 mb-4">
                  {/* Foto */}
                  <div className="w-16 h-20 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] flex items-center justify-center shrink-0 overflow-hidden relative shadow-2xs">
                    {atleta.documentos?.foto3x4 ? (
                      <img
                        src={atleta.documentos.foto3x4}
                        alt={atleta.nomeCompleto}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-1">
                        <Users className="w-6 h-6 text-[#CBD5E1] mx-auto mb-0.5" />
                        <span className="text-[8px] text-[#68756E] font-bold uppercase">Sem foto</span>
                      </div>
                    )}
                  </div>

                  {/* Informações */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#087A5B]">
                        {atleta.sexo}
                      </span>
                      {catInfo ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#EDF7F2] text-[#087A5B] border border-[#00A878]/20">
                          {catInfo}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          Não Elegível
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-[#17221D] truncate mt-1" title={atleta.nomeCompleto}>
                      {atleta.nomeCompleto}
                    </h3>
                    
                    <p className="text-xs text-[#68756E] mt-1">
                      Doc: <strong className="text-[#17221D]">{atleta.documentoTipo} {atleta.documentoNumero}</strong>
                    </p>
                    <p className="text-xs text-[#68756E]">
                      Nasc: <strong className="text-[#17221D]">{new Date(atleta.dataNascimento).toLocaleDateString('pt-BR')}</strong>
                    </p>
                  </div>
                </div>

                {/* Modalidades Inscritas */}
                <div className="pt-3 border-t border-[#E2EAE5] text-xs text-[#68756E] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#17221D]">Modalidades:</span>
                    <span className="text-[10px] text-[#00A878] font-bold">
                      {atleta.modalidadesInscritas?.length || 0} vinculada(s)
                    </span>
                  </div>
                  
                  {atleta.modalidadesInscritas && atleta.modalidadesInscritas.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {atleta.modalidadesInscritas.map((m, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-[#F7F9F8] text-[#17221D] text-[10px] border border-[#E2EAE5] font-semibold"
                        >
                          {m.modalidadeNome} {m.provas && m.provas.length > 0 ? `(${m.provas.join(', ')})` : ''}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#94A3B8] italic">Nenhuma modalidade vinculada</span>
                  )}
                </div>

                {/* Status Conferência SEMED */}
                <div className="mt-3 pt-2 border-t border-[#E2EAE5] flex items-center justify-between text-[11px]">
                  <span className="text-[#68756E]">Conferência SEMED:</span>
                  {atleta.conferidoPeloCoordenador ? (
                    <span className="text-[#00A878] font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Conferido
                    </span>
                  ) : (
                    <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[10px] font-semibold border border-amber-200">
                      Aguardando mesa
                    </span>
                  )}
                </div>

                {/* Ações */}
                <div className="mt-4 pt-3 border-t border-[#E2EAE5] flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleAbrirModalEditar(atleta)}
                    className="p-2 rounded-lg bg-[#F7F9F8] hover:bg-[#E8F7F1] text-[#68756E] hover:text-[#087A5B] transition-colors border border-[#E2EAE5]"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleExcluirAtleta(atleta.id, atleta.nomeCompleto)}
                    className="p-2 rounded-lg bg-[#F7F9F8] hover:bg-rose-50 text-[#68756E] hover:text-rose-600 transition-colors border border-[#E2EAE5]"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro / Edição 1 a 1 */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E2EAE5] rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-xl relative my-8">
            
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#E2EAE5]">
              <div>
                <h3 className="text-lg font-black text-[#17221D]">
                  {atletaEditando ? 'Editar Cadastro do Aluno' : 'Cadastro de Aluno-Atleta (Passo a Passo)'}
                </h3>
                <p className="text-xs text-[#68756E]">
                  Preencha os dados do estudante e selecione as modalidades e provas disponíveis.
                </p>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="p-2 rounded-xl bg-[#F7F9F8] hover:bg-slate-100 text-[#68756E] hover:text-[#17221D] border border-[#E2EAE5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => handleSalvarAtleta(e, false)} className="space-y-4">
              
              {/* Foto Upload Box */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5]">
                <div className="w-24 h-32 rounded-xl bg-white border-2 border-dashed border-[#CBD5E1] flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                  {fotoBase64 ? (
                    <img src={fotoBase64} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-2">
                      <Camera className="w-6 h-6 text-[#CBD5E1] mx-auto mb-1" />
                      <span className="text-[10px] text-[#68756E] font-medium">Foto 3x4</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-center sm:text-left">
                  <h4 className="text-xs font-bold text-[#17221D] uppercase tracking-wider">
                    Foto 3x4 do Estudante
                  </h4>
                  <p className="text-[11px] text-[#68756E] leading-relaxed">
                    Será impressa no Crachá Oficial com QR Code.
                  </p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-lg bg-[#E8F7F1] border border-[#00A878]/30 text-[#087A5B] text-xs font-bold hover:bg-[#d8f1e7] transition-colors inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#00A878]" />
                    <span>Carregar Foto</span>
                  </button>
                </div>
              </div>

              {/* Dados Básicos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#17221D] mb-1">
                    Nome Completo do Aluno *
                  </label>
                  <input
                    type="text"
                    required
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    placeholder="Nome completo do estudante"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:border-[#00A878] focus:bg-white outline-none uppercase font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17221D] mb-1">
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:border-[#00A878] focus:bg-white outline-none"
                  />
                  {dataNascimento && (
                    <p className="text-[11px] mt-1 font-bold text-[#087A5B]">
                      {catCalc.mensagem}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17221D] mb-1">
                    Gênero / Sexo *
                  </label>
                  <select
                    value={sexo}
                    onChange={(e) => setSexo(e.target.value as Genero)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:border-[#00A878] outline-none font-medium"
                  >
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMININO">Feminino</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17221D] mb-1">
                    Tipo de Documento *
                  </label>
                  <select
                    value={documentoTipo}
                    onChange={(e) => setDocumentoTipo(e.target.value as TipoDocumento)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:border-[#00A878] outline-none font-medium"
                  >
                    <option value="RG">RG (Carteira de Identidade)</option>
                    <option value="CERTIDAO">Certidão de Nascimento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#17221D] mb-1">
                    Número do Documento *
                  </label>
                  <input
                    type="text"
                    required
                    value={documentoNumero}
                    onChange={(e) => setDocumentoNumero(e.target.value)}
                    placeholder="Número obrigatório do documento"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs focus:border-[#00A878] focus:bg-white outline-none"
                  />
                </div>
              </div>

              {/* SELEÇÃO DE MODALIDADES DISPONÍVEIS & VAGAS EM TEMPO REAL */}
              <div className="p-4 rounded-2xl bg-[#F7F9F8] border border-[#E2EAE5] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#17221D] uppercase tracking-wider flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-[#00A878]" />
                    <span>Modalidades Válidas para este Aluno ({catCalc.categoria || 'Selecione a data'} - {sexo})</span>
                  </label>
                </div>

                {modalidadesDisponiveis.length === 0 ? (
                  <p className="text-xs text-[#68756E] italic">
                    Nenhuma modalidade oficial disponível para a combinação de idade e sexo deste aluno.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {modalidadesDisponiveis.map(mod => {
                      const sel = modalidadesEscolhidas.includes(mod.codigo);
                      const infoVagas = catCalc.categoria
                        ? JegdStorage.getVagasOcupadas(mod.codigo, catCalc.categoria as CategoriaIdade, sexo)
                        : { ocupadas: 0, total: mod.maxAtletas, disponiveis: mod.maxAtletas, esgotada: false };

                      return (
                        <div
                          key={mod.id}
                          onClick={() => toggleModalidade(mod.codigo)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            sel
                              ? 'bg-[#E8F7F1] border-[#00A878] text-[#087A5B] shadow-2xs'
                              : infoVagas.esgotada
                              ? 'bg-rose-50 border-rose-200 opacity-60 cursor-not-allowed text-rose-700'
                              : 'bg-white border-[#E2EAE5] hover:border-[#00A878]/40 text-[#17221D]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">{mod.nome}</span>
                            {infoVagas.esgotada ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200">
                                ESGOTADA
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-[#00A878]">
                                {infoVagas.ocupadas}/{infoVagas.total} vagas
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#68756E] mt-1">
                            {infoVagas.disponiveis} vaga(s) restante(s) no JEGD
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Se Atletismo selecionado, escolher até 2 provas */}
                {modalidadesEscolhidas.includes('atletismo') && (
                  <div className="mt-3 pt-3 border-t border-[#E2EAE5] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-900">
                        Selecione até 2 Provas de Atletismo ({catCalc.categoria}):
                      </span>
                      <span className="text-[10px] text-[#68756E] font-medium">
                        {provasAtletismo.length}/2 selecionadas
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {provasPermitidas.map(prova => {
                        const ativa = provasAtletismo.includes(prova);
                        return (
                          <button
                            type="button"
                            key={prova}
                            onClick={() => toggleProva(prova)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              ativa
                                ? 'bg-amber-500 text-slate-950 shadow-2xs'
                                : 'bg-white text-[#17221D] border border-[#E2EAE5] hover:border-[#CBD5E1]'
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

              {/* Consentimento LGPD */}
              <div className="p-3.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] flex items-start gap-3">
                <input
                  type="checkbox"
                  id="consentimentoLgpd"
                  checked={consentimentoResponsavel}
                  onChange={(e) => setConsentimentoResponsavel(e.target.checked)}
                  className="w-4 h-4 rounded text-[#00A878] bg-white border-[#CBD5E1] mt-0.5 accent-[#00A878]"
                />
                <label htmlFor="consentimentoLgpd" className="text-xs text-[#68756E] leading-relaxed cursor-pointer">
                  <strong className="text-[#17221D]">Consentimento LGPD:</strong> Confirmo que o pai/mãe ou responsável legal do estudante-atleta menor de idade está ciente e formalmente autorizou sua participação nos Jogos Escolares de Gonçalves Dias (JEGD 2026).
                </label>
              </div>

              {/* Footer de Ações */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#E2EAE5]">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#F7F9F8] hover:bg-slate-100 text-xs font-semibold text-[#17221D] border border-[#E2EAE5]"
                >
                  Cancelar
                </button>

                {!atletaEditando && (
                  <button
                    type="button"
                    onClick={(e) => handleSalvarAtleta(e, true)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-white hover:bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-xs font-bold"
                  >
                    Salvar e Cadastrar Próximo
                  </button>
                )}

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white text-xs font-bold shadow-xs hover:shadow-md"
                >
                  {atletaEditando ? 'Salvar Alterações' : 'Salvar e Finalizar'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}


