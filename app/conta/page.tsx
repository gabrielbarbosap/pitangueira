import type { Metadata } from "next";
import { ContaTela } from "../components/ContaTela";

export const metadata: Metadata = {
  title: "Minha conta — Pitangueira",
};

export default function ContaPage() {
  return <ContaTela />;
}
