/**
 * Módulo de Sincronização em Nuvem (PostgreSQL / Neon)
 * Permite sincronização transparente em tempo real entre o cliente
 * e o banco de dados PostgreSQL central no Neon.
 */

export class JegdCloudSync {
  private static isSyncing = false;

  /**
   * Sincroniza um novo registro de controle logístico com o PostgreSQL
   */
  static async syncRegistroLogistico(registro: any): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;
      const res = await fetch('/api/logistica', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registro)
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Sincroniza o cadastro ou atualização de um atleta com o PostgreSQL
   * Retorna os dados persistidos (incluindo eventual novo crachaToken se houve colisão) ou o erro real.
   */
  static async syncAtleta(atleta: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      if (typeof window === 'undefined') return { ok: false, error: 'Ambiente sem navegador' };
      const res = await fetch('/api/atletas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(atleta)
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        return { ok: false, error: json?.error || `Erro HTTP ${res.status} ao salvar aluno` };
      }
      return { ok: true, data: json.data };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Falha de conexão ao salvar aluno' };
    }
  }

  /**
   * Remove um atleta do PostgreSQL
   */
  static async deleteAtleta(id: string, matricula?: string, documento?: string): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;
      const params = new URLSearchParams();
      if (id) params.set('id', id);
      if (matricula) params.set('matricula', matricula);
      if (documento) params.set('documento', documento);
      const res = await fetch(`/api/atletas?${params.toString()}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Sincroniza uma inscrição de equipe com o PostgreSQL
   */
  static async syncInscricao(inscricao: any): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;
      const res = await fetch('/api/inscricoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inscricao)
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Remove uma inscrição de equipe do PostgreSQL
   */
  static async deleteInscricao(id: string): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;
      const res = await fetch(`/api/inscricoes?id=${encodeURIComponent(id)}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Sincroniza dados do município com o PostgreSQL
   */
  static async syncMunicipio(municipio: any): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;
      const res = await fetch('/api/municipios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(municipio)
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Sincroniza dados da escola com o PostgreSQL
   */
  static async syncEscola(escola: any): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;
      const res = await fetch('/api/escolas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(escola)
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Sincroniza dados do usuário / professor com o PostgreSQL
   */
  static async syncUsuario(usuario: any): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(usuario)
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Busca um usuário diretamente pelo CPF no banco de dados central
   */
  static async buscarUsuarioPorCpf(cpf: string): Promise<any | null> {
    try {
      if (typeof window === 'undefined') return null;
      const res = await fetch(`/api/usuarios?cpf=${encodeURIComponent(cpf)}`, {
        cache: 'no-store'
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.success ? json.data : null;
    } catch {
      return null;
    }
  }

  static async carregarDadosCloud(): Promise<any | null> {
    if (this.isSyncing) return null;
    this.isSyncing = true;
    try {
      if (typeof window === 'undefined') return null;
      const res = await fetch(`/api/sync?_t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.success ? json.data : null;
    } catch {
      return null;
    } finally {
      this.isSyncing = false;
    }
  }
}
