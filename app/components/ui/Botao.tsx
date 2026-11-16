import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type VarianteBotao = "primario" | "solido" | "linha";
export type TamanhoBotao = "pequeno" | "medio" | "grande";

const variantes: Record<VarianteBotao, string> = {
  primario: "btn-primario",
  solido: "btn-solido",
  linha: "btn-linha",
};

const tamanhos: Record<TamanhoBotao, string> = {
  pequeno: "px-3 py-2 text-[13px]",
  medio: "px-4 py-2.5 text-sm",
  grande: "px-5 py-3.5 text-sm",
};

export const classeBotao = (variante: VarianteBotao = "linha", tamanho: TamanhoBotao = "medio", extra = "") =>
  `btn ${variantes[variante]} ${tamanhos[tamanho]} ${extra}`.trim();

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBotao;
  tamanho?: TamanhoBotao;
}

/**
 * Botão padrão. `primario` (laranja) é a ação principal da tela, uma só por tela;
 * `solido` (escuro) é a ação normal; `linha` é a ação secundária.
 */
export function Botao({ variante = "linha", tamanho = "medio", className = "", type = "button", ...resto }: Props) {
  return <button type={type} className={classeBotao(variante, tamanho, className)} {...resto} />;
}

/** Link com a cara de botão (navegação). */
export function BotaoLink({ href, variante = "linha", tamanho = "medio", className = "", children }: { href: string; variante?: VarianteBotao; tamanho?: TamanhoBotao; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={classeBotao(variante, tamanho, className)}>
      {children}
    </Link>
  );
}

/** Botão só com ícone (editar, remover). Sempre com `rotulo`: ele vira o nome acessível e a dica. `perigo` avisa que apaga. */
export function BotaoIcone({
  rotulo,
  perigo = false,
  className = "",
  type = "button",
  children,
  ...resto
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "title"> & { rotulo: string; perigo?: boolean }) {
  return (
    <button type={type} aria-label={rotulo} title={rotulo} className={`btn btn-icone h-10 w-10 ${perigo ? "perigo" : ""} ${className}`.trim()} {...resto}>
      {children}
    </button>
  );
}
