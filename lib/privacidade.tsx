"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { brl as brlReal, brlCompacto as brlCompactoReal, brlInt as brlIntReal } from "./format";

// "Olhinho" dos apps de banco: esconde todos os valores em dinheiro das telas.
// A escolha fica guardada no navegador (por aparelho) e vale para o app inteiro.
const CHAVE = "pitangueira:ocultar-valores";
const EVENTO = "pitangueira:privacidade";

const MASCARA = "R$ ••••";
const MASCARA_CURTA = "R$ •••";

function ler(): boolean {
  try {
    return localStorage.getItem(CHAVE) === "1";
  } catch {
    return false;
  }
}

function assinar(aviso: () => void) {
  window.addEventListener(EVENTO, aviso);
  window.addEventListener("storage", aviso); // outra aba mudou a escolha
  return () => {
    window.removeEventListener(EVENTO, aviso);
    window.removeEventListener("storage", aviso);
  };
}

interface PrivacidadeValue {
  /** true = valores escondidos. */
  oculto: boolean;
  alternar: () => void;
  /** Mesmos formatadores de lib/format, mas devolvem a máscara quando os valores estão escondidos. */
  brl: (v: number) => string;
  brlInt: (v: number) => string;
  brlCompacto: (v: number) => string;
}

const Ctx = createContext<PrivacidadeValue | null>(null);

export function PrivacidadeProvider({ children }: { children: ReactNode }) {
  // No servidor (e na hidratação) os valores aparecem; o cliente assume a escolha guardada logo em seguida.
  const oculto = useSyncExternalStore(assinar, ler, () => false);

  const alternar = useCallback(() => {
    try {
      localStorage.setItem(CHAVE, ler() ? "0" : "1");
    } catch {
      /* sem armazenamento: não persiste */
    }
    window.dispatchEvent(new Event(EVENTO));
  }, []);

  const value = useMemo<PrivacidadeValue>(
    () => ({
      oculto,
      alternar,
      brl: oculto ? () => MASCARA : brlReal,
      brlInt: oculto ? () => MASCARA : brlIntReal,
      brlCompacto: oculto ? () => MASCARA_CURTA : brlCompactoReal,
    }),
    [oculto, alternar],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Formatadores de dinheiro que respeitam o olhinho, mais o estado e o botão de alternar. */
export function useDinheiro(): PrivacidadeValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDinheiro precisa estar dentro de <PrivacidadeProvider>");
  return ctx;
}
