import type { Metadata } from "next";
import { Suspense } from "react";
import { AcaoTela } from "../components/AcaoTela";

export const metadata: Metadata = {
  title: "Pitangueira",
  robots: { index: false },
};

/** Destino dos links dos e-mails do Firebase (redefinir senha, confirmar e-mail). */
export default function AcaoPage() {
  return (
    <Suspense fallback={<div className="grade flex min-h-dvh items-center justify-center font-mono text-xs uppercase tracking-wider text-ink/40">Carregando…</div>}>
      <AcaoTela />
    </Suspense>
  );
}
