import type { Metadata } from "next";
import { Suspense } from "react";
import { RetornoTela } from "../../components/assinatura/RetornoTela";

export const metadata: Metadata = {
  title: "Pagamento — Pitangueira",
  robots: { index: false },
};

export default function RetornoPage() {
  return (
    <Suspense fallback={<div className="grade min-h-dvh" />}>
      <RetornoTela />
    </Suspense>
  );
}
