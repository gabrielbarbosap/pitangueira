"use client";

import { useAuth } from "@/lib/auth";
import { Landing } from "./components/landing/Landing";
import { Painel } from "./components/Painel";
import { HomeCliente } from "./components/HomeCliente";
import { faqJsonLd } from "@/lib/seo";

export default function Home() {
  const { user, loading } = useAuth();

  // Quem já entrou vê o app (arquiteto ou cliente). Deslogado — e também enquanto carrega — mostramos a
  // landing: assim o conteúdo e as perguntas já saem no HTML (SSR), que é o que buscadores e prévias de
  // link leem. Para quem já tem sessão, a troca para o painel acontece logo que o login resolve.
  if (!loading && user) return user.anonimo ? <HomeCliente /> : <Painel />;

  return (
    <>
      <script
        type="application/ld+json"
        // FAQPage: as mesmas perguntas que aparecem na landing (ver lib/seo.ts). Conteúdo fixo.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd()) }}
      />
      <Landing />
    </>
  );
}
