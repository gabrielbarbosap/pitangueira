"use client";

import { useSyncExternalStore } from "react";

/**
 * Camada de eventos pensada para o Google Analytics (GA4), mas por enquanto SÓ EM MEMÓRIA: nada sai do navegador.
 * Os eventos ficam num buffer da aba aberta (somem ao recarregar) e aparecem em /admin, para vermos o que um dia
 * mandaríamos ao GA. Para ligar de verdade, é só implementar `enviarAoGoogle` (gtag) e trocar `ENVIAR_AO_GOOGLE`.
 *
 * Regras (as mesmas da telemetria): nomes em snake_case, só dados técnicos simples nos parâmetros. Nunca nomes,
 * e-mails, valores em dinheiro nem conteúdo de projetos.
 */

export type ParamsAnalytics = Record<string, string | number | boolean>;

export interface EventoAnalytics {
  nome: string;
  params?: ParamsAnalytics;
  em: number;
  rota: string;
}

/** Interruptor geral: só vira true quando o Google Analytics for contratado e `enviarAoGoogle` existir. */
const ENVIAR_AO_GOOGLE = false;
const MAXIMO = 300;

let buffer: EventoAnalytics[] = [];
const ouvintes = new Set<() => void>();

function rotaAtual(): string {
  try {
    return window.location.pathname.replace(/\/obra\/[^/]+/, "/obra/:id");
  } catch {
    return "";
  }
}

/** Futuro: window.gtag("event", nome, params). Hoje não faz nada de propósito. */
function enviarAoGoogle(nome: string, params?: ParamsAnalytics) {
  void nome;
  void params; // GA desligado
}

/** Registra um evento na memória (e, no futuro, no GA). Nunca lança erro. */
export function track(nome: string, params?: ParamsAnalytics) {
  if (typeof window === "undefined") return;
  const limpos: ParamsAnalytics | undefined = params ? Object.fromEntries(Object.entries(params).slice(0, 8).map(([k, v]) => [k.slice(0, 30), typeof v === "string" ? v.slice(0, 60) : v])) : undefined;
  buffer = [...buffer, { nome: nome.slice(0, 60), params: limpos, em: Date.now(), rota: rotaAtual() }].slice(-MAXIMO);
  ouvintes.forEach((f) => f());
  if (ENVIAR_AO_GOOGLE) enviarAoGoogle(nome, limpos);
}

const VAZIO: EventoAnalytics[] = [];

/** Os eventos desta aba (mais antigos primeiro). */
export function useEventosAnalytics(): readonly EventoAnalytics[] {
  return useSyncExternalStore(
    (cb) => {
      ouvintes.add(cb);
      return () => ouvintes.delete(cb);
    },
    () => buffer,
    () => VAZIO,
  );
}

export const limparEventosAnalytics = () => {
  buffer = [];
  ouvintes.forEach((f) => f());
};
