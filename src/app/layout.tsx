import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "JEGD 2026 - Jogos Escolares de Gonçalves Dias",
  description: "Sistema Oficial de Inscrições, Credenciamento e Gestão Esportiva Escolar do JEGD 2026 - SEMED / Prefeitura Municipal de Gonçalves Dias - MA.",
  icons: {
    icon: [
      { url: "/logo-jegd.png?v=2026", type: "image/png" },
      { url: "/favicon.png?v=2026", type: "image/png" },
      { url: "/favicon.ico?v=2026", type: "image/x-icon" }
    ],
    shortcut: ["/logo-jegd.png?v=2026"],
    apple: ["/logo-jegd.png?v=2026"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/logo-jegd.png?v=2026" type="image/png" />
        <link rel="shortcut icon" href="/logo-jegd.png?v=2026" type="image/png" />
        <link rel="apple-touch-icon" href="/logo-jegd.png?v=2026" />
      </head>
      <body className="min-h-screen bg-[#F7F9F8] text-[#17221D] flex flex-col font-sans antialiased selection:bg-[#00A878] selection:text-white">
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

