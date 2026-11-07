"use client";

import { useData } from "@/lib/data";
import { LogoMark } from "./Logo";

const STATUS_ROTULO = { pendente: "Pendente", previsto: "Previsto no orçamento", atendido: "Atendido" } as const;

/** Documento do programa de necessidades em tela cheia; "Imprimir" gera o PDF pelo navegador. */
export function ProgramaDocumento({ onFechar }: { onFechar: () => void }) {
  const { config, projeto, programa, aprovacao } = useData();
  const data = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  const meta: [string, string][] = [
    ["Cliente(s)", projeto.cliente],
    ["Projeto", projeto.tipo || config.nomeObra],
    ["Endereço", projeto.endereco],
    ["Etapa", "Programa de necessidades"],
  ];

  return (
    <div className="print-area fixed inset-0 z-[70] overflow-auto bg-neutral-200 print:static print:overflow-visible print:bg-white">
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-linha bg-papel px-4 py-3">
        <button onClick={onFechar} className="font-mono text-xs font-semibold uppercase tracking-wider text-ink/70 hover:text-ink">
          ← Fechar
        </button>
        <button
          onClick={() => window.print()}
          className="bg-pitanga px-4 py-2 text-sm font-semibold text-white active:bg-pitanga-escuro"
        >
          Imprimir / salvar PDF
        </button>
      </div>

      <article className="mx-auto my-6 max-w-[800px] bg-white p-8 text-ink shadow-sm print:my-0 print:max-w-none print:p-0 print:shadow-none sm:p-12">
        <header className="flex items-start justify-between gap-4 border-b-2 border-ink pb-4">
          <div>
            <p className="rotulo-tec text-ink/60">Programa de necessidades</p>
            <h1 className="mt-1 text-2xl font-semibold leading-tight">{config.nomeObra}</h1>
            <p className="mt-1 text-sm text-ink/60">{data}</p>
          </div>
          <LogoMark size={36} />
        </header>

        <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {meta.map(([k, v]) => (
            <div key={k} className="border-b border-linha pb-2">
              <dt className="rotulo-tec text-ink/50">{k}</dt>
              <dd className="mt-0.5 text-sm">{v || "—"}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-8">
          <h2 className="rotulo-tec border-b border-ink pb-1.5 text-ink">Ambientes e quantidade</h2>
          {programa.ambientes.length === 0 ? (
            <p className="py-3 text-sm text-ink/50">Nenhum ambiente cadastrado.</p>
          ) : (
            <table className="mt-1 w-full text-sm">
              <thead>
                <tr className="text-left text-ink/50">
                  <th className="w-12 py-2 font-normal">Qtd</th>
                  <th className="py-2 font-normal">Ambiente</th>
                  <th className="py-2 font-normal">Função / observação</th>
                  <th className="w-20 py-2 text-right font-normal">Área</th>
                </tr>
              </thead>
              <tbody>
                {programa.ambientes.map((a) => (
                  <tr key={a.id} className="border-t border-linha align-top">
                    <td className="py-2 font-mono">{a.quantidade}</td>
                    <td className="py-2 font-medium">{a.nome}</td>
                    <td className="py-2 text-ink/70">
                      {[a.funcao, a.proximidade && `Próximo de: ${a.proximidade}`].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="py-2 text-right font-mono">{a.area > 0 ? `${a.area} m²` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="mt-8">
          <h2 className="rotulo-tec border-b border-ink pb-1.5 text-ink">Requisitos específicos de uso</h2>
          {programa.requisitos.length === 0 ? (
            <p className="py-3 text-sm text-ink/50">Nenhum requisito cadastrado.</p>
          ) : (
            <ol className="mt-1">
              {programa.requisitos.map((r, i) => (
                <li key={r.id} className="flex gap-3 border-b border-linha py-2 text-sm">
                  <span className="w-6 shrink-0 font-mono text-ink/40">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1">
                    {r.texto}
                    {(r.ambiente || r.etapa) && (
                      <span className="block text-xs text-ink/50">
                        {[r.ambiente && `Ambiente: ${r.ambiente}`, r.etapa && `Etapa do orçamento: ${r.etapa}`].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-ink/60">{STATUS_ROTULO[r.status]}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <footer className="mt-12 grid gap-8 sm:grid-cols-2">
          <div>
            <div className="h-10 border-b border-ink" />
            <p className="mt-1.5 text-sm font-medium">{projeto.responsavel || "Arquiteto responsável"}</p>
            <p className="text-xs text-ink/60">{projeto.registro || "Registro profissional"}</p>
          </div>
          <div>
            {aprovacao ? (
              <div className="flex h-10 items-end border-b border-ink pb-1 text-sm font-semibold">{aprovacao.nome}</div>
            ) : (
              <div className="h-10 border-b border-ink" />
            )}
            <p className="mt-1.5 text-sm font-medium">{projeto.cliente || "Cliente"}</p>
            <p className="text-xs text-ink/60">
              {aprovacao
                ? `Aprovado online em ${new Date(aprovacao.em).toLocaleDateString("pt-BR")}`
                : "Aguardando aprovação"}
            </p>
          </div>
        </footer>
      </article>
    </div>
  );
}
