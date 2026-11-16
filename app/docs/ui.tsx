import Link from "next/link";
import type { ReactNode } from "react";

/** Peças de texto da documentação. Mantêm todas as páginas com a mesma cara. */

export function P({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-[15px] leading-relaxed text-ink/85">{children}</p>;
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="mt-7 text-[16px] font-semibold tracking-tight text-ink">{children}</h3>;
}

/** Nome exato de um botão, aba ou campo da tela. */
export function Btn({ children }: { children: ReactNode }) {
  return <span className="whitespace-nowrap rounded-md border border-ink/15 bg-ink/[0.05] px-1.5 py-0.5 font-mono text-[12.5px] font-medium text-ink">{children}</span>;
}

export function Cod({ children }: { children: ReactNode }) {
  return <code className="rounded bg-ink/[0.07] px-1 py-0.5 font-mono text-[13px] text-ink">{children}</code>;
}

export function Lista({ children }: { children: ReactNode }) {
  return <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink/85 marker:text-ink/30">{children}</ul>;
}

/** Passo a passo numerado. */
export function Passos({ children }: { children: ReactNode }) {
  return (
    <ol className="mt-4 space-y-3 [counter-reset:passo]">
      {children}
    </ol>
  );
}

export function Passo({ children }: { children: ReactNode }) {
  return (
    <li className="relative pl-10 text-[15px] leading-relaxed text-ink/85 [counter-increment:passo] before:absolute before:left-0 before:top-0 before:flex before:h-6 before:w-6 before:items-center before:justify-center before:rounded-full before:bg-ink before:font-mono before:text-[11px] before:font-semibold before:text-white before:content-[counter(passo)]">
      {children}
    </li>
  );
}

const tons = {
  dica: { rotulo: "Dica", caixa: "border-emerald-600/25 bg-emerald-50", texto: "text-emerald-900", marca: "bg-emerald-600" },
  atencao: { rotulo: "Atenção", caixa: "border-pitanga/30 bg-pitanga/[0.06]", texto: "text-pitanga-escuro", marca: "bg-pitanga" },
  nota: { rotulo: "Bom saber", caixa: "border-ink/15 bg-ink/[0.04]", texto: "text-ink/80", marca: "bg-ink" },
} as const;

export function Aviso({ tipo = "nota", titulo, children }: { tipo?: keyof typeof tons; titulo?: string; children: ReactNode }) {
  const t = tons[tipo];
  return (
    <aside className={`mt-5 rounded-2xl border px-4 py-3 ${t.caixa}`}>
      <p className={`flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] ${t.texto}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${t.marca}`} aria-hidden />
        {titulo ?? t.rotulo}
      </p>
      <div className={`mt-1.5 text-[14px] leading-relaxed ${t.texto}`}>{children}</div>
    </aside>
  );
}

/** Tabela simples: cabeçalho + linhas de texto. */
export function Tabela({ colunas, linhas }: { colunas: string[]; linhas: ReactNode[][] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-2xl border border-linha bg-white">
      <table className="w-full min-w-[420px] text-left text-[14px]">
        <thead>
          <tr className="border-b border-linha bg-ink/[0.03]">
            {colunas.map((c) => (
              <th key={c} className="px-3.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/55">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-linha">
          {linhas.map((l, i) => (
            <tr key={i} className="align-top">
              {l.map((c, j) => (
                <td key={j} className={`px-3.5 py-2.5 leading-snug ${j === 0 ? "font-medium text-ink" : "text-ink/80"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Quem pode: etiquetas de papel. */
export function Papel({ quem }: { quem: "arquiteto" | "cliente" | "todos" }) {
  const t = {
    arquiteto: ["Só o arquiteto", "bg-ink text-white"],
    cliente: ["Cliente", "bg-sky-100 text-sky-900"],
    todos: ["Arquiteto e cliente", "bg-emerald-100 text-emerald-900"],
  }[quem];
  return <span className={`ml-2 inline-block rounded-full px-2 py-0.5 align-middle font-mono text-[10px] font-semibold ${t[1]}`}>{t[0]}</span>;
}

/** Link para outra página da documentação. */
export function Ir({ para, children }: { para: string; children: ReactNode }) {
  return (
    <Link href={`/docs/${para}`} className="font-medium text-pitanga underline underline-offset-2 hover:text-pitanga-escuro">
      {children}
    </Link>
  );
}
