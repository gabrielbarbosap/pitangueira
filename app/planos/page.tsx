import type { Metadata } from "next";
import { PlanosTela } from "../components/plano/PlanosTela";

export const metadata: Metadata = {
  title: "Planos — Pitangueira",
  description: "Broto, Safra e Pomar: escolha o plano certo para o tamanho da sua operação.",
};

export default function PlanosPage() {
  return <PlanosTela />;
}
