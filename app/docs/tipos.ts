import type { ReactNode } from "react";

export interface SecaoDoc {
  id: string;
  titulo: string;
  corpo: ReactNode;
  /** Quem usa esta parte (aparece como etiqueta ao lado do título). */
  papel?: "arquiteto" | "cliente" | "todos";
}

export interface PaginaDoc {
  slug: string;
  grupo: string;
  titulo: string;
  resumo: string;
  secoes: SecaoDoc[];
}
