import { jsPDF } from 'jspdf';
import { Escola, Atleta, InscricaoEquipe, MembroComissao } from '@/types/jegd';

export interface BasePdfOptions {
  orientation?: 'portrait' | 'landscape';
  unit?: 'mm';
  format?: 'a4';
}

/**
 * Cria documento A4 padrão
 */
export function criarDocumentoA4(orientation: 'portrait' | 'landscape' = 'portrait'): jsPDF {
  return new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });
}

/**
 * Paleta de Cores Oficial dos Jogos Escolares (JEGDS 2026)
 */
export const CORES_JEGD = {
  primaria: [139, 29, 44] as [number, number, number],      // Vinho/Carmim Oficial #8B1D2C
  primariaEscura: [100, 18, 30] as [number, number, number],// Vinho Profundo
  secundaria: [0, 168, 120] as [number, number, number],     // Verde Esmeralda #00A878
  secundariaEscura: [6, 95, 70] as [number, number, number], // Verde Floresta #065F46
  destaqueOuro: [217, 119, 6] as [number, number, number],   // Âmbar / Ouro #D97706
  escuro: [15, 23, 42] as [number, number, number],          // Slate 900 #0F172A
  grafite: [30, 41, 59] as [number, number, number],         // Slate 800 #1E293B
  textoMuted: [100, 116, 139] as [number, number, number],   // Slate 500 #64748B
  borda: [203, 213, 225] as [number, number, number],        // Slate 300 #CBD5E1
  bordaSuave: [226, 232, 240] as [number, number, number],   // Slate 200 #E2E8F0
  fundoCinza: [248, 250, 252] as [number, number, number],   // Slate 50 #F8FAFC
  fundoZebra: [241, 245, 249] as [number, number, number],   // Slate 100 #F1F5F9
  branco: [255, 255, 255] as [number, number, number]
};

/**
 * Helper para carregar imagem em Base64
 */
export async function carregarImagemBase64(url: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Calcula dinamicamente o tamanho da fonte para que o texto caiba na largura sem sobrepor
 */
export function ajustarFonte(
  doc: jsPDF,
  texto: string,
  larguraMax: number,
  tamanhoInicial: number = 7,
  tamanhoMinimo: number = 4.5
): number {
  let tamanho = tamanhoInicial;
  doc.setFontSize(tamanho);
  while (doc.getTextWidth(texto) > larguraMax && tamanho > tamanhoMinimo) {
    tamanho -= 0.3;
    doc.setFontSize(tamanho);
  }
  return tamanho;
}
