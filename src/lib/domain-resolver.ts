import { Municipio } from '@/types/jegd';

export interface DomainResolutionResult {
  municipio: Municipio | null;
  isDomainLocked: boolean;
  detectedHostname: string;
  matchedBy?: 'custom_domain' | 'additional_domain' | 'subdomain' | 'slug' | 'vercel_alias' | 'none';
}

/**
 * Normaliza um hostname removendo portas, protocolo e espaços
 */
export function normalizeHostname(host: string): string {
  if (!host) return '';
  return host
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split(':')[0]
    .trim();
}

/**
 * Extrai os subdomínios de um hostname.
 * Ex: "sal.jegdsistem.com" -> ["sal"]
 * Ex: "inscricoes.sal.jegdsistem.com" -> ["inscricoes", "sal"]
 */
export function extractSubdomains(hostname: string): string[] {
  const cleanHost = normalizeHostname(hostname);
  if (!cleanHost || cleanHost === 'localhost' || cleanHost === '127.0.0.1') {
    return [];
  }

  const parts = cleanHost.split('.');
  // Se for algo como localhost com subdomínio (ex: sal.localhost)
  if (parts.length === 2 && parts[1] === 'localhost') {
    return [parts[0]];
  }

  // Se for domínio padrão (ex: sal.jegdsistem.com ou sal.vercel.app)
  if (parts.length >= 3) {
    // Retorna todos os subdomínios exceto domínio principal e TLD
    return parts.slice(0, parts.length - 2);
  }

  return [];
}

/**
 * Resolve o município correto com base no Hostname atual.
 * Identifica se a sessão deve ser estritamente travada (isDomainLocked: true)
 * para impedir vazamento de dados ou logins de outras cidades.
 */
export function resolveMunicipioFromHost(
  rawHostname: string,
  municipios: Municipio[]
): DomainResolutionResult {
  const hostname = normalizeHostname(rawHostname);

  if (!hostname || !municipios || municipios.length === 0) {
    return {
      municipio: municipios?.[0] || null,
      isDomainLocked: false,
      detectedHostname: hostname,
      matchedBy: 'none'
    };
  }

  // 1. Verificação por Domínio Personalizado Exato (ex: "jesal.santoantonio.ma.gov.br")
  const matchCustomDomain = municipios.find(
    m => m.dominio && normalizeHostname(m.dominio) === hostname
  );
  if (matchCustomDomain) {
    return {
      municipio: matchCustomDomain,
      isDomainLocked: true,
      detectedHostname: hostname,
      matchedBy: 'custom_domain'
    };
  }

  // 2. Verificação por Domínios Adicionais (ex: aliases de Vercel/Cloudflare)
  const matchAdditional = municipios.find(m =>
    m.dominiosAdicionais?.some(d => normalizeHostname(d) === hostname)
  );
  if (matchAdditional) {
    return {
      municipio: matchAdditional,
      isDomainLocked: true,
      detectedHostname: hostname,
      matchedBy: 'additional_domain'
    };
  }

  // 3. Verificação por Subdomínio Específico (ex: "sal.jegdsistem.com" ou "sal.localhost")
  const subdomains = extractSubdomains(hostname);
  for (const sub of subdomains) {
    const cleanSub = sub.toLowerCase();

    const matchSub = municipios.find(m => {
      // Checa subdominio direto
      if (m.subdominio && m.subdominio.toLowerCase() === cleanSub) return true;
      // Checa sigla
      if (m.sigla && m.sigla.toLowerCase() === cleanSub) return true;
      // Checa slug
      if (m.slug && m.slug.toLowerCase() === cleanSub) return true;
      // Checa se subdomínio é variação direta (ex: "santoantonio", "goncalvesdias")
      const slugCompacto = m.slug.replace(/-/g, '');
      if (slugCompacto === cleanSub) return true;
      return false;
    });

    if (matchSub) {
      return {
        municipio: matchSub,
        isDomainLocked: true,
        detectedHostname: hostname,
        matchedBy: 'subdomain'
      };
    }
  }

  // 4. Verificação por Vercel URLs com sufixos/hífens (ex: "jegds-sal.vercel.app", "jegdsistem-archer.vercel.app")
  for (const m of municipios) {
    const slugComp = m.slug.toLowerCase();
    const siglaComp = (m.sigla || '').toLowerCase();
    const subComp = (m.subdominio || '').toLowerCase();

    const patterns = [
      `-${subComp}.vercel.app`,
      `-${slugComp}.vercel.app`,
      `-${siglaComp}.vercel.app`,
      `${subComp}.vercel.app`,
      `${slugComp}.vercel.app`
    ].filter(p => p.length > 12);

    for (const pattern of patterns) {
      if (hostname.includes(pattern)) {
        return {
          municipio: m,
          isDomainLocked: true,
          detectedHostname: hostname,
          matchedBy: 'vercel_alias'
        };
      }
    }
  }

  // Se estiver em localhost, portal central ou domínio genérico sem subdomínio específico:
  return {
    municipio: municipios[0] || null,
    isDomainLocked: false,
    detectedHostname: hostname,
    matchedBy: 'none'
  };
}
