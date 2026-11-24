"use client";

import { useSyncExternalStore } from "react";

/**
 * Camada de eventos: guarda tudo num buffer da aba (aparece em /admin) e também envia ao Google Analytics (GA4)
 * e ao Pixel da Meta — quando eles estão carregados, o que só acontece com o consentimento de cookies aceito e os
 * IDs configurados (ver app/components/Analytics.tsx e lib/consentimento.tsx). Sem isso, fica só o buffer em memória.
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

/** Envia o evento ao GA4 (gtag) e ao Pixel (fbq), se já carregados. Se não estiverem, não faz nada. */
function enviarAosTerceiros(nome: string, params?: ParamsAnalytics) {
  const w = window as unknown as { gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void };
  try {
    if (typeof w.gtag === "function") w.gtag("event", nome, params ?? {});
    if (typeof w.fbq === "function") w.fbq("trackCustom", nome, params ?? {});
  } catch {
    /* medir nunca pode atrapalhar o uso do app */
  }
}

/** Registra um evento na memória (e, no futuro, no GA). Nunca lança erro. */
export function track(nome: string, params?: ParamsAnalytics) {
  if (typeof window === "undefined") return;
  const limpos: ParamsAnalytics | undefined = params ? Object.fromEntries(Object.entries(params).slice(0, 8).map(([k, v]) => [k.slice(0, 30), typeof v === "string" ? v.slice(0, 60) : v])) : undefined;
  buffer = [...buffer, { nome: nome.slice(0, 60), params: limpos, em: Date.now(), rota: rotaAtual() }].slice(-MAXIMO);
  ouvintes.forEach((f) => f());
  enviarAosTerceiros(nome, limpos);
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
