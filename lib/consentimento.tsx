"use client";

import { useSyncExternalStore } from "react";

/**
 * Consentimento de cookies (LGPD). Guarda, por aparelho, se a pessoa aceitou ou recusou os cookies de
 * análise/marketing (Google Analytics e Pixel da Meta). Enquanto não há decisão, nada de terceiros carrega.
 * Mesmo padrão do "olhinho" (lib/privacidade): estado no localStorage + evento para todas as telas reagirem.
 *
 * Os cookies essenciais (login, preferências do próprio app) não dependem disto — só os de terceiros.
 */
export type Consentimento = "aceito" | "recusado" | null;

const CHAVE = "pitangueira:consentimento:v1";
const EVENTO = "pitangueira:consentimento";

function ler(): Consentimento {
  try {
    const v = localStorage.getItem(CHAVE);
    return v === "aceito" || v === "recusado" ? v : null;
  } catch {
    return null;
  }
}

function assinar(aviso: () => void) {
  window.addEventListener(EVENTO, aviso);
  window.addEventListener("storage", aviso); // outra aba decidiu
  return () => {
    window.removeEventListener(EVENTO, aviso);
    window.removeEventListener("storage", aviso);
  };
}

function gravar(v: Consentimento) {
  try {
    if (v) localStorage.setItem(CHAVE, v);
    else localStorage.removeItem(CHAVE);
  } catch {
    /* sem armazenamento: vale só nesta visita */
  }
  window.dispatchEvent(new Event(EVENTO));
}

/** Aceita os cookies de análise/marketing. */
export const aceitarCookies = () => gravar("aceito");
/** Recusa os cookies de análise/marketing. */
export const recusarCookies = () => gravar("recusado");
/** Volta a perguntar (mostra o aviso de novo). */
export const redefinirCookies = () => gravar(null);

export interface EstadoConsentimento {
  estado: Consentimento;
  /** Já decidiu (aceitou ou recusou)? */
  decidido: boolean;
  /** Pode carregar análise/marketing? */
  aceito: boolean;
  aceitar: () => void;
  recusar: () => void;
  redefinir: () => void;
}

/** Estado reativo do consentimento. Sem provider: o estado mora no localStorage e é compartilhado. */
export function useConsentimento(): EstadoConsentimento {
  const estado = useSyncExternalStore(assinar, ler, () => null);
  return {
    estado,
    decidido: estado !== null,
    aceito: estado === "aceito",
    aceitar: aceitarCookies,
    recusar: recusarCookies,
    redefinir: redefinirCookies,
  };
}
