"use client";

import { useDinheiro } from "@/lib/privacidade";
import { IconeOlho, IconeOlhoRisco } from "./Icones";

/** Olhinho de privacidade: esconde ou mostra todos os valores em dinheiro. */
export function BotaoOlho({ className }: { className: string }) {
  const { oculto, alternar } = useDinheiro();
  const rotulo = oculto ? "Mostrar valores" : "Ocultar valores";
  return (
    <button onClick={alternar} className={className} aria-label={rotulo} aria-pressed={oculto} title={rotulo}>
      {oculto ? <IconeOlhoRisco /> : <IconeOlho />}
    </button>
  );
}
