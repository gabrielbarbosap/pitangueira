import type { Metadata } from "next";
import { PlanosTela } from "../components/plano/PlanosTela";

export const metadata: Metadata = {
  title: "Planos e preços — Pitangueira",
  description: "Broto, Safra e Pomar: planos de gestão de obras a partir de R$ 24,99/mês. Teste grátis por 5 dias, com cartão, e cancele quando quiser.",
  alternates: { canonical: "/planos" },
  openGraph: {
    type: "website",
    url: "/planos",
    title: "Planos e preços — Pitangueira",
    description: "Planos de gestão de obras a partir de R$ 24,99/mês. Teste grátis por 5 dias.",
  },
};

export default function PlanosPage() {
  return <PlanosTela />;
}
