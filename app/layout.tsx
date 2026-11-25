import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { SITE_URL, SITE_NOME, SITE_DESCRICAO, siteJsonLd, grafoJsonLd } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITULO_PADRAO = "Pitangueira — software de gestão de obras para arquitetos e engenheiros";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITULO_PADRAO,
  description: SITE_DESCRICAO,
  applicationName: SITE_NOME,
  keywords: [
    "gestão de obras",
    "software de gestão de obras",
    "software para arquitetos",
    "software para engenheiros",
    "orçamento de obra",
    "orçamento de reforma",
    "controle de obra",
    "acompanhamento de obra",
    "aplicativo para obra",
    "gestão de reformas",
    "gestão de projetos de arquitetura",
    "planilha de obra",
    "cobrança de obra",
  ],
  authors: [{ name: SITE_NOME }],
  creator: SITE_NOME,
  publisher: SITE_NOME,
  category: "technology",
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: SITE_NOME,
    title: TITULO_PADRAO,
    description: SITE_DESCRICAO,
  },
  twitter: {
    card: "summary_large_image",
    title: TITULO_PADRAO,
    description: SITE_DESCRICAO,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  appleWebApp: { capable: true, title: SITE_NOME, statusBarStyle: "default" },
  verification: { google: "qqbsJn6FjZXN1EVCXLQhU6xDA-DII8mWGOqsDfcIBOs" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f2ee",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <script
          type="application/ld+json"
          // Dados estruturados (schema.org) do site, produto e organização. Conteúdo fixo, sem entrada do usuário.
          dangerouslySetInnerHTML={{ __html: grafoJsonLd(siteJsonLd()) }}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
