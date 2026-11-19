"use client";

import { useSyncExternalStore } from "react";

let ouvintes = new Set<() => void>();
let relogio: ReturnType<typeof setInterval> | null = null;

function assinar(avisar: () => void) {
  ouvintes.add(avisar);
  // Um relógio só para todos: atualiza uma vez por minuto ("há 5 min" vira "há 6 min").
  if (!relogio) relogio = setInterval(() => ouvintes.forEach((f) => f()), 60_000);
  return () => {
    ouvintes.delete(avisar);
    if (ouvintes.size === 0 && relogio) {
      clearInterval(relogio);
      relogio = null;
      ouvintes = new Set();
    }
  };
}

/**
 * O instante de agora, arredondado ao minuto e atualizado de minuto em minuto. Vale 0 na pré-renderização (o Next não
 * aceita `Date.now()` solto na renderização), então a tela precisa aceitar 0 como "ainda não sei".
 */
export function useAgora(): number {
  return useSyncExternalStore(
    assinar,
    () => Math.floor(Date.now() / 60_000) * 60_000,
    () => 0,
  );
}
