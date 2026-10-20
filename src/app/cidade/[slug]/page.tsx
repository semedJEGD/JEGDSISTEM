import React from 'react';
import MunicipioLandingPage from '@/components/MunicipioLandingPage';

interface CidadePageProps {
  params: Promise<{ slug: string }>;
}

export default async function CidadePage({ params }: CidadePageProps) {
  const resolvedParams = await params;
  return <MunicipioLandingPage targetSlug={resolvedParams.slug} />;
}
