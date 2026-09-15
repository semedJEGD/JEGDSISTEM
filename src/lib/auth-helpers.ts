import { Escola } from '@/types/jegd';

/**
 * Gera a sugestão de senha canônica e amigável para a escola (ex: "aldenora2026", "sulamita2026")
 */
export function gerarSugestaoSenhaEscola(escola: Escola | undefined): string {
  if (!escola) return 'jegd2026';

  const nomeNorm = (escola.nome || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  // Mapeamentos diretos conhecidos para garantir simplicidade
  if (nomeNorm.includes('aldenora')) return 'aldenora2026';
  if (nomeNorm.includes('anisio')) return 'anisio2026';
  if (nomeNorm.includes('anita')) return 'anita2026';
  if (nomeNorm.includes('antonio')) return 'antonio2026';
  if (nomeNorm.includes('basilio')) return 'basilio2026';
  if (nomeNorm.includes('emilio')) return 'emilio2026';
  if (nomeNorm.includes('jose correa') || nomeNorm.includes('correa')) return 'josecorrea2026';
  if (nomeNorm.includes('jose goncalves') || nomeNorm.includes('jose gd')) return 'josegd2026';
  if (nomeNorm.includes('raimundo')) return 'raimundo2026';
  if (nomeNorm.includes('sulamita')) return 'sulamita2026';
  if (nomeNorm.includes('benta')) return 'benta2026';
  if (nomeNorm.includes('cietec')) return 'cietec2026';

  // Fallback: primeiro nome significativo
  const palavras = nomeNorm
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(p => !['escola', 'municipal', 'estadual', 'unidade', 'centro', 'colegio', 'de', 'da', 'do', 'dos', 'das', 'prof', 'professor', 'professora', 'ue', 'ce'].includes(p));
  
  const base = palavras[0] || 'escola';
  return `${base}2026`;
}
