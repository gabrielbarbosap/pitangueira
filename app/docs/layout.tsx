import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "../components/Logo";
import { DocsNav } from "./DocsNav";
import { paginas } from "./paginas";

export const metadata: Metadata = {
  title: "Documentação — Pitangueira",
  description: "Aprenda a usar cada funcionalidade da Pitangueira, passo a passo.",
};

export default function DocsLayout({ children }: { children: ReactNode }) {
  const indice = paginas.map((p) => ({ slug: p.slug, grupo: p.grupo, titulo: p.titulo, resumo: p.resumo, secoes: p.secoes.map((s) => s.titulo) }));
  return (
    <div className="min-h-dvh bg-papel">
      <header className="sticky top-0 z-20 border-b border-linha bg-papel/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/docs" className="flex items-center gap-3" aria-label="Documentação da Pitangueira">
            <Logo />
            <span className="hidden rounded-full bg-ink px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white sm:inline">Docs</span>
          </Link>
          <Link href="/" className="btn btn-linha px-4 py-2 text-sm">
            Abrir o app
          </Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1240px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-10 lg:py-10">
        <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:self-start lg:overflow-y-auto lg:pr-2">
          <DocsNav indice={indice} />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
