"use client";

import { useData } from "@/lib/data";
import { brl } from "@/lib/format";
import { statusDoRequisito, vinculoDoRequisito } from "@/lib/calc";
import { DocumentoBase, TituloSecao } from "./DocumentoBase";

const STATUS_ROTULO = { pendente: "Pendente", previsto: "Previsto no orçamento", atendido: "Atendido" } as const;

/** Documento do programa de necessidades em tela cheia; "Imprimir" gera o PDF pelo navegador. */
export function ProgramaDocumento({ onFechar }: { onFechar: () => void }) {
  const { programa, aprovacao, itens } = useData();

  return (
    <DocumentoBase onFechar={onFechar} titulo="Escopo do projeto" etapaRotulo="Programa de necessidades" aprovacao={aprovacao}>
      <section className="mt-8">
        <TituloSecao>Ambientes e quantidade</TituloSecao>
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
        <TituloSecao>Requisitos específicos de uso</TituloSecao>
        {programa.requisitos.length === 0 ? (
          <p className="py-3 text-sm text-ink/50">Nenhum requisito cadastrado.</p>
        ) : (
          <ol className="mt-1">
            {programa.requisitos.map((r, i) => {
              const v = vinculoDoRequisito(r.itensIds, itens);
              return (
                <li key={r.id} className="break-inside-avoid border-b border-linha py-2 text-sm">
                  <div className="flex gap-3">
                    <span className="w-6 shrink-0 font-mono text-ink/40">{String(i + 1).padStart(2, "0")}</span>
                    <span className="flex-1">
                      {r.texto}
                      {(r.ambiente || r.etapa) && (
                        <span className="block text-xs text-ink/50">
                          {[r.ambiente && `Ambiente: ${r.ambiente}`, r.etapa && `Etapa do orçamento: ${r.etapa}`].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-xs text-ink/60">{STATUS_ROTULO[statusDoRequisito(r, itens).status]}</span>
                  </div>
                  {v.lista.length > 0 && (
                    <ul className="ml-9 mt-1.5 space-y-0.5 text-xs text-ink/65">
                      {v.lista.map((it) => (
                        <li key={it.id} className="flex justify-between gap-3">
                          <span>{it.descricao}</span>
                          <span className="shrink-0 font-mono">{brl(it.valorReal > 0 ? it.valorReal : it.valorOrcado)}</span>
                        </li>
                      ))}
                      <li className="flex justify-between gap-3 border-t border-linha pt-0.5 font-semibold text-ink/80">
                        <span>Custo previsto · {v.concluidos} de {v.lista.length} concluídos</span>
                        <span className="shrink-0 font-mono">{brl(v.previsto)}</span>
                      </li>
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </DocumentoBase>
  );
}
