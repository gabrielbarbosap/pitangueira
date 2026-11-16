"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export interface ItemDoIndice {
  slug: string;
  grupo: string;
  titulo: string;
  resumo: string;
  secoes: string[];
}

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Menu lateral da documentação: busca + páginas por grupo. No celular vira um menu que abre e fecha. */
export function DocsNav({ indice }: { indice: ItemDoIndice[] }) {
  const atual = usePathname();
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const termo = semAcento(busca.trim());
  const visiveis = termo
    ? indice.filter((p) => semAcento([p.titulo, p.resumo, p.grupo, ...p.secoes].join(" ")).includes(termo))
    : indice;
  const grupos = [...new Set(visiveis.map((p) => p.grupo))];

  const lista = (
    <nav aria-label="Páginas da documentação" className="space-y-5">
      <div>
        <label htmlFor="docs-busca" className="sr-only">
          Buscar na documentação
        </label>
        <input
          id="docs-busca"
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar na documentação…"
          autoComplete="off"
          className="input-pit"
        />
      </div>
      {grupos.length === 0 && <p className="text-sm text-ink/50">Nada encontrado para “{busca}”.</p>}
      {grupos.map((g) => (
        <div key={g}>
          <p className="rotulo-tec mb-1.5 text-ink/45">{g}</p>
          <ul className="space-y-0.5">
            {visiveis
              .filter((p) => p.grupo === g)
              .map((p) => {
                const ativo = atual === `/docs/${p.slug}`;
                return (
                  <li key={p.slug}>
                    <Link
                      href={`/docs/${p.slug}`}
                      aria-current={ativo ? "page" : undefined}
                      onClick={() => setAberto(false)}
                      className={`block rounded-lg px-3 py-1.5 text-[14px] leading-snug transition-colors ${ativo ? "bg-ink font-medium text-white" : "text-ink/75 hover:bg-ink/[0.06] hover:text-ink"}`}
                    >
                      {p.titulo}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Celular */}
      <div className="lg:hidden">
        <button
          type="button"
          aria-expanded={aberto}
          aria-controls="docs-menu-celular"
          onClick={() => setAberto((a) => !a)}
          className="flex w-full items-center justify-between rounded-2xl border border-linha bg-white px-4 py-3 text-left text-sm font-semibold text-ink"
        >
          Índice da documentação
          <span aria-hidden className="font-mono text-xs text-ink/50">{aberto ? "−" : "+"}</span>
        </button>
        {aberto && (
          <div id="docs-menu-celular" className="mt-2 rounded-2xl border border-linha bg-white p-4">
            {lista}
          </div>
        )}
      </div>
      {/* Computador */}
      <div className="hidden lg:block">{lista}</div>
    </>
  );
}
