import React from 'react';
import MunicipioLandingPage from '@/components/MunicipioLandingPage';

export const metadata = {
  title: 'JESAL 2026 • Jogos Escolares de Santo Antônio dos Lopes',
  description: 'Portal oficial dos Jogos Escolares de Santo Antônio dos Lopes (JESAL 2026). Sistema oficial de credenciamento esportivo e inscrições escolares.'
};

export default function JesalPage() {
  return <MunicipioLandingPage targetSlug="santo-antonio-dos-lopes" />;
}
