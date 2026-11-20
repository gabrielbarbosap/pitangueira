import Link from "next/link";
import type { ReactNode } from "react";

export type TomAtalho = "neutro" | "alerta" | "ok";

interface Props {
  icone: ReactNode;
  titulo: string;
  /** Uma linha curta com o que há lá dentro (a contagem, o alerta). */
  detalhe: string;
  tom?: TomAtalho;
  /** Navegação (Next). Sem `href`, vira botão e usa `onClick`. */
  href?: string;
  /** Abre em outra aba (documentação, por exemplo). */
  externo?: boolean;
  onClick?: () => void;
  tour?: string;
}

const COR_DETALHE: Record<TomAtalho, string> = { neutro: "text-ink/55", alerta: "font-semibold text-pitanga-escuro", ok: "font-semibold text-emerald-700" };

/**
 * Atalho grande da home: ícone, nome e o que há lá dentro, numa área de toque confortável (mais de 64px de altura).
 * `alerta` pinta o detalhe de laranja e acende um ponto no canto, para o que pede atenção (ex.: parcela atrasada).
 */
export function Atalho({ icone, titulo, detalhe, tom = "neutro", href, externo = false, onClick, tour }: Props) {
  const classe =
    "prancha prancha-clicavel clicavel relative flex min-h-[4.5rem] w-full items-center gap-3 p-3.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2";
  const conteudo = (
    <>
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tom === "alerta" ? "bg-pitanga/10 text-pitanga-escuro" : "bg-ink/[0.06] text-ink"}`} aria-hidden>
        {icone}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold leading-tight text-ink">{titulo}</span>
        <span className={`mt-0.5 block truncate text-xs leading-snug ${COR_DETALHE[tom]}`}>{detalhe}</span>
      </span>
      {tom === "alerta" && <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-pitanga" aria-hidden />}
    </>
  );
  if (href) {
    return externo ? (
      <a href={href} target="_blank" rel="noreferrer" className={classe} data-tour={tour}>
        {conteudo}
      </a>
    ) : (
      <Link href={href} className={classe} data-tour={tour}>
        {conteudo}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classe} data-tour={tour}>
      {conteudo}
    </button>
  );
}
