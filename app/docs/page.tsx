import type { Metadata } from "next";
import Link from "next/link";
import { paginas } from "./paginas";

export const metadata: Metadata = {
  alternates: { canonical: "/docs" },
};

export default function DocsHome() {
  const grupos = [...new Set(paginas.map((p) => p.grupo))];
  return (
    <div className="max-w-[900px]">
      <p className="rotulo-tec text-pitanga">Documentação</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-5xl">Aprenda a usar a Pitangueira</h1>
      <p className="mt-4 max-w-[640px] text-[17px] leading-relaxed text-ink/70">
        Cada funcionalidade explicada passo a passo, com os nomes exatos dos botões e campos da tela. Use a busca do índice para achar um assunto.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/docs/primeiros-passos" className="btn btn-primario px-5 py-3 text-sm">
          Primeiros passos
        </Link>
        <Link href="/docs/introducao" className="btn btn-linha px-5 py-3 text-sm">
          Visão geral
        </Link>
      </div>
      <div className="mt-12 space-y-10">
        {grupos.map((g) => (
          <section key={g} aria-labelledby={`g-${g}`}>
            <h2 id={`g-${g}`} className="rotulo-tec mb-3 text-ink/50">
              {g}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {paginas
                .filter((p) => p.grupo === g)
                .map((p) => (
                  <li key={p.slug}>
                    <Link href={`/docs/${p.slug}`} className="prancha block h-full p-4 transition-colors hover:border-ink/40">
                      <span className="block font-semibold text-ink">{p.titulo}</span>
                      <span className="mt-1 block text-[13.5px] leading-snug text-ink/60">{p.resumo}</span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
