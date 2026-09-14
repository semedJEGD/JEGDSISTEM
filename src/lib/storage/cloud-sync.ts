/**
 * Módulo de Sincronização em Nuvem (PostgreSQL / Railway)
 * Permite sincronização transparente entre o cache offline (localStorage)
 * e o banco de dados PostgreSQL central no Railway.
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
   */
  static async syncAtleta(atleta: any): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;
      const res = await fetch('/api/atletas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(atleta)
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Tenta buscar dados atualizados do PostgreSQL na inicialização
   */
  static async carregarDadosCloud(): Promise<any | null> {
    if (this.isSyncing) return null;
    this.isSyncing = true;
    try {
      if (typeof window === 'undefined') return null;
      const res = await fetch('/api/sync', {
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
