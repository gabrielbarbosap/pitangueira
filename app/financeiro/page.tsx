import type { Metadata } from "next";
import { FinanceiroTela } from "../components/FinanceiroTela";

export const metadata: Metadata = {
  title: "Financeiro — Pitangueira",
};

export default function FinanceiroPage() {
  return <FinanceiroTela />;
}
