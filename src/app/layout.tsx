import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "JEGD 2026 - Jogos Escolares de Gonçalves Dias",
  description: "Sistema Oficial de Inscrições, Credenciamento e Gestão Esportiva Escolar do JEGD 2026 - SEMED / Prefeitura Municipal de Gonçalves Dias - MA.",
  icons: {
    icon: [
      { url: "/logo-jegd.png", type: "image/png" },
      { url: "/favicon.png", type: "image/png" }
    ],
    shortcut: ["/logo-jegd.png"],
    apple: ["/logo-jegd.png"],
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
        <link rel="icon" href="/logo-jegd.png" type="image/png" />
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

