import type { ReactNode } from "react";

export type TomAlerta = "nota" | "ok" | "aviso" | "perigo";

const tons: Record<TomAlerta, string> = {
  nota: "",
  ok: "alerta-ok",
  aviso: "alerta-aviso",
  perigo: "alerta-perigo",
};

/** Caixa de aviso. `perigo` usa role="alert" (leitores de tela anunciam na hora); os outros são só informativos. */
export function Alerta({ tom = "nota", titulo, children, className = "" }: { tom?: TomAlerta; titulo?: string; children: ReactNode; className?: string }) {
  return (
    <div role={tom === "perigo" ? "alert" : undefined} className={`alerta ${tons[tom]} ${className}`.trim()}>
      {titulo && <p className="mb-0.5 font-semibold">{titulo}</p>}
      {children}
    </div>
  );
}
