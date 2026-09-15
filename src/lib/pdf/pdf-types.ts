import { jsPDF } from 'jspdf';
import { Escola, Atleta, InscricaoEquipe, MembroComissao } from '@/types/jegd';

export interface BasePdfOptions {
  orientation?: 'portrait' | 'landscape';
  unit?: 'mm';
  format?: 'a4';
}

export function criarDocumentoA4(orientation: 'portrait' | 'landscape' = 'portrait'): jsPDF {
  return new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4'
  });
}
