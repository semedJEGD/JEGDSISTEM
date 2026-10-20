import React from 'react';
import MunicipioLandingPage from '@/components/MunicipioLandingPage';

export const metadata = {
  title: 'JESAC 2026 • Jogos Escolares de Senador Alexandre Costa',
  description: 'Portal oficial dos Jogos Escolares de Senador Alexandre Costa (JESAC 2026). Sistema oficial de credenciamento esportivo e inscrições escolares.'
};

export default function JesacPage() {
  return <MunicipioLandingPage targetSlug="senador-alexandre-costa" />;
}
