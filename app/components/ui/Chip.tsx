import type { ReactNode } from "react";

export type TomChip = "neutro" | "ink" | "ok" | "aviso" | "perigo" | "info";

const tons: Record<TomChip, string> = {
  neutro: "",
  ink: "chip-ink",
  ok: "chip-ok",
  aviso: "chip-aviso",
  perigo: "chip-perigo",
  info: "chip-info",
};

/** Etiqueta pequena de status. `ok` = concluído/pago, `aviso` = atenção, `perigo` = atrasado/erro, `ink` = destaque neutro. */
export function Chip({ tom = "neutro", children, className = "" }: { tom?: TomChip; children: ReactNode; className?: string }) {
  return <span className={`chip ${tons[tom]} ${className}`.trim()}>{children}</span>;
}
