import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SGJE - Sistema de Gestão de Jogos Escolares | i6 Systems',
  description: 'Portal de Acesso aos Municípios - SGJE. Plataforma de Gestão Integrada de Jogos Escolares desenvolvida pela i6 Systems.'
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
