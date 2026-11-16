import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { paginas } from "../paginas";
import { Pagina } from "../Pagina";

export function generateStaticParams() {
  return paginas.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = paginas.find((x) => x.slug === slug);
  return p ? { title: `${p.titulo} — Documentação Pitangueira`, description: p.resumo } : {};
}

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<p className="font-mono text-xs uppercase tracking-wider text-ink/40">Carregando…</p>}>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const i = paginas.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const anterior = paginas[i - 1];
  const proxima = paginas[i + 1];
  return (
    <>
      <Pagina pagina={paginas[i]} />
      <nav aria-label="Navegação entre páginas" className="mt-12 grid gap-3 border-t border-linha pt-6 sm:grid-cols-2">
        {anterior ? (
          <Link href={`/docs/${anterior.slug}`} className="prancha block p-4 transition-colors hover:border-ink/40">
            <span className="rotulo-tec text-ink/45">← Anterior</span>
            <span className="mt-1 block font-semibold text-ink">{anterior.titulo}</span>
          </Link>
        ) : (
          <span />
        )}
        {proxima && (
          <Link href={`/docs/${proxima.slug}`} className="prancha block p-4 text-right transition-colors hover:border-ink/40">
            <span className="rotulo-tec text-ink/45">Próxima →</span>
            <span className="mt-1 block font-semibold text-ink">{proxima.titulo}</span>
          </Link>
        )}
      </nav>
    </>
  );
}
