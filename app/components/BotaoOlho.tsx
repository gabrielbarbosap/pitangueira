"use client";

import { useDinheiro } from "@/lib/privacidade";
import { IconeOlho, IconeOlhoRisco } from "./Icones";

/** Olhinho de privacidade: esconde ou mostra todos os valores em dinheiro. */
export function BotaoOlho({ className, tour }: { className: string; /** Marca o botão como alvo de um passo do tutorial. */ tour?: string }) {
  const { oculto, alternar } = useDinheiro();
  const rotulo = oculto ? "Mostrar valores" : "Ocultar valores";
  return (
    <button onClick={alternar} className={className} aria-label={rotulo} aria-pressed={oculto} title={rotulo} data-tour={tour}>
      {oculto ? <IconeOlhoRisco /> : <IconeOlho />}
    </button>
  );
}
