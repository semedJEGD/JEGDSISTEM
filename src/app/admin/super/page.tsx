'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  PlusCircle,
  Users,
  School,
  Trophy,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Edit,
  ExternalLink,
  ArrowLeft,
  Lock,
  Search,
  Sparkles,
  MapPin,
  FileCheck
} from 'lucide-react';
import { JegdStorage } from '@/lib/storage';
import { Municipio, Escola, Usuario } from '@/types/jegd';

export default function SuperAdminPage() {
  const router = useRouter();
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busca, setBusca] = useState('');

  // Autenticação SuperAdmin
  const [isAutenticado, setIsAutenticado] = useState(false);
  const [senhaInput, setSenhaInput] = useState('');
  const [erroAuth, setErroAuth] = useState('');

  // Modal Novo Município
  const [modalAberto, setModalAberto] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [novoUf, setNovoUf] = useState('MA');
  const [novaSigla, setNovaSigla] = useState('');
  const [novoNomeEvento, setNovoNomeEvento] = useState('');
  const [novaSiglaEvento, setNovaSiglaEvento] = useState('');
  const [novoSubdominio, setNovoSubdominio] = useState('');
  const [novoDominio, setNovoDominio] = useState('');
  const [novoContato, setNovoContato] = useState('');
  const [novoCoordNome, setNovoCoordNome] = useState('');
  const [novoCoordEmail, setNovoCoordEmail] = useState('');

  useEffect(() => {
    JegdStorage.init();
    if (JegdStorage.isSuperAdminAuth()) {
      setIsAutenticado(true);
      carregarDados();
    }
  }, []);

  const carregarDados = () => {
    setMunicipios(JegdStorage.getMunicipios());
    setEscolas(JegdStorage.getAllEscolas());
    setUsuarios(JegdStorage.getUsuarios('ALL'));
  };

  const handleLoginSuperAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (senhaInput.trim().toLowerCase() === 'superadmin2026' || senhaInput.trim().toLowerCase() === 'semed2026') {
      JegdStorage.setSuperAdminAuth(true);
      setIsAutenticado(true);
      setErroAuth('');
      carregarDados();
    } else {
      setErroAuth('Senha Master incorreta.');
    }
  };

  const handleCriarMunicipio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) return;

    const slug = novoNome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const munId = `mun-${slug}`;
    const siglaCalculada = novaSigla.trim() || novoNome.slice(0, 3).toUpperCase();
    const siglaEventoCalculada = novaSiglaEvento.trim() || `JEG-${siglaCalculada} 2026`;
    const nomeEventoCalculado = novoNomeEvento.trim() || `Jogos Escolares de ${novoNome.trim()}`;
    const subdominioCalculado = novoSubdominio.trim().toLowerCase() || siglaCalculada.toLowerCase();

    const novoMun: Municipio = {
      id: munId,
      nome: novoNome.trim(),
      sigla: siglaCalculada,
      uf: novoUf.toUpperCase(),
      slug,
      subdominio: subdominioCalculado,
      dominio: novoDominio.trim() || undefined,
      dominiosAdicionais: [`jegds-${subdominioCalculado}.vercel.app`],
      nomeEvento: nomeEventoCalculado,
      siglaEvento: siglaEventoCalculada,
      contatoSemed: novoContato.trim(),
      ativo: true,
      createdAt: new Date().toISOString()
    };

    JegdStorage.saveMunicipio(novoMun);

    // Se informou coordenador da SEMED
    if (novoCoordNome.trim()) {
      const coordUser: Usuario = {
        id: `coord-${slug}`,
        municipioId: munId,
        nome: `${novoCoordNome.trim()} (SEMED)`,
        email: novoCoordEmail.trim() || `semed@${slug}.gov.br`,
        telefone: '(99) 98800-0000',
        papel: 'COORDENADOR',
        createdAt: new Date().toISOString()
      };
      JegdStorage.saveUsuario(coordUser);
    }

    setModalAberto(false);
    // Limpar form
    setNovoNome('');
    setNovaSigla('');
    setNovoNomeEvento('');
    setNovaSiglaEvento('');
    setNovoSubdominio('');
    setNovoDominio('');
    setNovoContato('');
    setNovoCoordNome('');
    setNovoCoordEmail('');
    carregarDados();
  };

  const handleAcessarMunicipio = (mun: Municipio) => {
    JegdStorage.setCurrentMunicipio(mun);
    JegdStorage.setComiteAuth(true);
    router.push('/admin/dashboard');
  };

  const handleRemoverMunicipio = (id: string, nome: string) => {
    if (id === 'goncalves-dias-ma') {
      alert('O município primário (Gonçalves Dias) não pode ser excluído.');
      return;
    }
    if (confirm(`Tem certeza que deseja remover o município "${nome}" e suas configurações?`)) {
      JegdStorage.deleteMunicipio(id);
      carregarDados();
    }
  };

  if (!isAutenticado) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 bg-[#F7F9F8]">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-[#E2EAE5] shadow-xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#087A5B]/10 text-[#087A5B] flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#17221D]">SuperAdmin Master</h1>
            <p className="text-xs text-[#68756E] mt-1">
              Gestão Central de Municípios e Prefeituras
            </p>
          </div>

          {erroAuth && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl p-3 mb-4 text-center">
              {erroAuth}
            </div>
          )}

          <form onSubmit={handleLoginSuperAdmin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#17221D] mb-1">
                Senha Master de SuperAdmin
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={senhaInput}
                  onChange={(e) => setSenhaInput(e.target.value)}
                  placeholder="Digite a senha master"
                  className="w-full px-3.5 py-2.5 pl-9 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] text-sm font-bold focus:outline-none focus:border-[#00A878] focus:bg-white"
                />
                <Lock className="w-4 h-4 text-[#68756E] absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#087A5B] hover:bg-[#00A878] text-white font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <span>Desbloquear Painel Master</span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/escola/login" className="text-xs font-bold text-emerald-700 hover:underline">
              ← Voltar ao Portal de Acesso
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const municipiosFiltrados = municipios.filter(m =>
    m.nome.toLowerCase().includes(busca.toLowerCase()) ||
    m.uf.toLowerCase().includes(busca.toLowerCase()) ||
    m.siglaEvento.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#E2EAE5] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
              Central Multi-Tenant
            </span>
            <span className="text-xs text-[#68756E]">
              {municipios.length} {municipios.length === 1 ? 'Município Ativo' : 'Municípios Ativos'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#17221D] tracking-tight">
            Gestão Master de Municípios
          </h1>
          <p className="text-xs sm:text-sm text-[#68756E] mt-1">
            Cadastre novos municípios, prefeituras e comitês de jogos escolares no sistema.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setModalAberto(true)}
            className="px-4 py-2.5 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-black text-xs sm:text-sm shadow-sm flex items-center gap-2 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novo Município</span>
          </button>
          <Link
            href="/escola/login"
            className="px-4 py-2.5 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-[#17221D] font-bold text-xs hover:bg-gray-100 transition-colors"
          >
            Portal de Acesso
          </Link>
        </div>
      </div>

      {/* BUSCA */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar município, estado ou sigla..."
          className="w-full px-4 py-2.5 pl-10 rounded-xl bg-white border border-[#E2EAE5] text-xs font-bold focus:outline-none focus:border-[#00A878]"
        />
        <Search className="w-4 h-4 text-[#68756E] absolute left-3 top-3" />
      </div>

      {/* GRID DE MUNICÍPIOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {municipiosFiltrados.map((mun) => {
          const escolasDoMun = escolas.filter(e => !e.municipioId || e.municipioId === mun.id);
          const atletasDoMun = JegdStorage.getAtletas(undefined, mun.id);
          const coordsDoMun = usuarios.filter(u => u.municipioId === mun.id && u.papel === 'COORDENADOR');

          return (
            <div
              key={mun.id}
              className="bg-white rounded-3xl border border-[#E2EAE5] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-black text-lg shrink-0">
                    {mun.sigla || mun.nome.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRemoverMunicipio(mun.id, mun.nome)}
                      title="Excluir Município"
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 mb-0.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{mun.nome} - {mun.uf}</span>
                  </div>
                  <h2 className="text-lg font-black text-[#17221D] leading-tight">
                    {mun.nomeEvento}
                  </h2>
                  <p className="text-[11px] text-[#68756E] font-medium mt-1">
                    Sigla: <strong className="text-[#17221D]">{mun.siglaEvento}</strong>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black">
                      Subdomínio: {mun.subdominio || mun.slug}
                    </span>
                    {mun.dominio && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold">
                        🌐 {mun.dominio}
                      </span>
                    )}
                  </div>
                </div>

                {/* MÉTRICAS */}
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#E2EAE5] text-center mb-4 bg-[#F7F9F8] rounded-xl p-2">
                  <div>
                    <div className="text-sm font-black text-[#17221D]">{escolasDoMun.length}</div>
                    <div className="text-[10px] text-[#68756E] font-bold">Escolas</div>
                  </div>
                  <div>
                    <div className="text-sm font-black text-[#00A878]">{atletasDoMun.length}</div>
                    <div className="text-[10px] text-[#68756E] font-bold">Atletas</div>
                  </div>
                  <div>
                    <div className="text-sm font-black text-[#087A5B]">{coordsDoMun.length}</div>
                    <div className="text-[10px] text-[#68756E] font-bold">Coords SEMED</div>
                  </div>
                </div>
              </div>

              <div className="pt-2 space-y-1.5">
                <button
                  onClick={() => handleAcessarMunicipio(mun)}
                  className="w-full py-2.5 rounded-xl bg-[#087A5B] hover:bg-[#00A878] text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Acessar Painel SEMED ({mun.sigla || mun.nome})</span>
                </button>
                <Link
                  href={`/escola/login?m=${mun.slug}`}
                  className="w-full py-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-xs flex items-center justify-center gap-1.5 border border-[#E2EAE5] transition-colors"
                >
                  <span>Portal Escola / Professor ({mun.sigla})</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL NOVO MUNICÍPIO */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-[#E2EAE5] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E2EAE5] pb-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <PlusCircle className="w-5 h-5" />
                <h3 className="text-base font-black text-[#17221D]">Cadastrar Novo Município</h3>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCriarMunicipio} className="space-y-3.5">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-[#17221D] mb-1">
                    Nome da Cidade *
                  </label>
                  <input
                    type="text"
                    required
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Ex: Caxias"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-bold focus:outline-none focus:border-[#00A878]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17221D] mb-1">
                    UF *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={novoUf}
                    onChange={(e) => setNovoUf(e.target.value.toUpperCase())}
                    placeholder="MA"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-bold text-center uppercase focus:outline-none focus:border-[#00A878]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#17221D] mb-1">
                    Subdomínio Exclusivo
                  </label>
                  <input
                    type="text"
                    value={novoSubdominio}
                    onChange={(e) => setNovoSubdominio(e.target.value.toLowerCase())}
                    placeholder="Ex: caxias ou cxs"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-bold focus:outline-none focus:border-[#00A878]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#17221D] mb-1">
                    Domínio Customizado (Opcional)
                  </label>
                  <input
                    type="text"
                    value={novoDominio}
                    onChange={(e) => setNovoDominio(e.target.value.toLowerCase())}
                    placeholder="Ex: jogos.caxias.ma.gov.br"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-bold focus:outline-none focus:border-[#00A878]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#17221D] mb-1">
                  Nome Oficial do Evento
                </label>
                <input
                  type="text"
                  value={novoNomeEvento}
                  onChange={(e) => setNovoNomeEvento(e.target.value)}
                  placeholder="Ex: Jogos Escolares de Caxias 2026"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-bold focus:outline-none focus:border-[#00A878]"
                />
              </div>

              <div className="border-t border-[#E2EAE5] pt-3">
                <h4 className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-2">
                  Coordenador Inicial da SEMED (Opcional)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#17221D] mb-1">
                      Nome do Coordenador
                    </label>
                    <input
                      type="text"
                      value={novoCoordNome}
                      onChange={(e) => setNovoCoordNome(e.target.value)}
                      placeholder="Ex: Prof. Carlos Silva"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-bold focus:outline-none focus:border-[#00A878]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#17221D] mb-1">
                      E-mail Institucional
                    </label>
                    <input
                      type="email"
                      value={novoCoordEmail}
                      onChange={(e) => setNovoCoordEmail(e.target.value)}
                      placeholder="semed@caxias.ma.gov.br"
                      className="w-full px-3.5 py-2 rounded-xl bg-[#F7F9F8] border border-[#E2EAE5] text-xs font-bold focus:outline-none focus:border-[#00A878]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2EAE5]">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-[#17221D] font-bold text-xs hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00A878] hover:bg-[#087A5B] text-white font-black text-xs shadow-sm"
                >
                  Salvar Município
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
