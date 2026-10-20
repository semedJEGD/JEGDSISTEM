import React from 'react';
import MunicipioLandingPage from '@/components/MunicipioLandingPage';

export const metadata = {
  title: 'JEGDS 2026 • Jogos Escolares de Gonçalves Dias',
  description: 'Portal oficial dos Jogos Escolares de Gonçalves Dias (JEGDS 2026). Sistema oficial de credenciamento esportivo e inscrições escolares.'
};

export default function JegdPage() {
  return <MunicipioLandingPage targetSlug="goncalves-dias" />;
}
