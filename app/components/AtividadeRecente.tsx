"use client";

import { atividadeRecente, quandoTexto } from "@/lib/atividade";
import type { Item } from "@/lib/types";
import { Chip } from "./ui/Chip";
import { useHoje } from "./PrazoVisual";

/** Quem marcou o quê e quando: o arquiteto vê o que o cliente mexeu, e o cliente vê que o arquiteto avançou. */
export function AtividadeRecente({ itens }: { itens: Item[] }) {
  const hoje = useHoje();
  const lista = atividadeRecente(itens, 6);
  if (itens.length === 0) return null;

  return (
    <section aria-label="Atividade recente" className="prancha p-4">
      <p className="rotulo-tec text-ink/50">Atividade recente</p>
      {lista.length === 0 ? (
        <p className="mt-2 text-sm leading-snug text-ink/55">Quando alguém marcar um item como Feito ou Pago, aparece aqui, com o nome e a hora.</p>
      ) : (
        <ul className="mt-2 divide-y divide-linha">
          {lista.map((a) => (
            <li key={`${a.itemId}-${a.tipo}`} className="flex items-start gap-3 py-2.5">
              <span
                aria-hidden
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-semibold uppercase ${a.porCliente ? "bg-sky-100 text-sky-900" : "bg-ink/[0.08] text-ink/70"}`}
              >
                {a.quem.slice(0, 1)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-ink">
                  <strong className="font-semibold">{a.quem}</strong>
                  {a.porCliente && <Chip tom="info" className="ml-1.5 align-middle">cliente</Chip>}{" "}
                  marcou <span className="font-medium">“{a.descricao}”</span> como {a.tipo === "feito" ? "feito" : "pago"}
                </p>
                <p className="mt-0.5 text-xs text-ink/50">
                  {a.etapa || "Sem etapa"} · {quandoTexto(a.quando, hoje)}
                </p>
              </div>
              <Chip tom={a.tipo === "feito" ? "ink" : "ok"}>{a.tipo === "feito" ? "Feito" : "Pago"}</Chip>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
