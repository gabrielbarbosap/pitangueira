"use client";

import { useMemo } from "react";
import { useData } from "@/lib/data";
import { brl } from "@/lib/format";
import { agruparPor, valorEfetivo } from "@/lib/calc";
import { DocumentoBase, TituloSecao } from "./DocumentoBase";

/** Orçamento da obra por etapa, pronto para imprimir ou salvar em PDF com a marca do escritório. */
export function OrcamentoDocumento({ onFechar }: { onFechar: () => void }) {
  const { itens, config } = useData();
  const grupos = useMemo(() => agruparPor(itens, "etapa"), [itens]);
  const total = useMemo(() => itens.reduce((s, i) => s + valorEfetivo(i), 0), [itens]);
  const sobra = config.orcamentoTotal - total;

  return (
    <DocumentoBase onFechar={onFechar} titulo="Orçamento" etapaRotulo="Orçamento por etapa">
      <section className="mt-8">
        <TituloSecao>Resumo</TituloSecao>
        <dl className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="rotulo-tec text-ink/50">Custo previsto</dt>
            <dd className="mt-0.5 font-mono text-lg font-semibold">{brl(total)}</dd>
          </div>
          <div>
            <dt className="rotulo-tec text-ink/50">Orçamento disponível</dt>
            <dd className="mt-0.5 font-mono text-lg">{config.orcamentoTotal > 0 ? brl(config.orcamentoTotal) : "—"}</dd>
          </div>
          <div>
            <dt className="rotulo-tec text-ink/50">{sobra >= 0 ? "Folga" : "Acima do disponível"}</dt>
            <dd className="mt-0.5 font-mono text-lg">{config.orcamentoTotal > 0 ? brl(Math.abs(sobra)) : "—"}</dd>
          </div>
        </dl>
      </section>

      {grupos.length === 0 ? (
        <p className="mt-8 py-3 text-sm text-ink/50">Nenhum item no orçamento.</p>
      ) : (
        grupos.map((g) => (
          <section key={g.nome} className="mt-8">
            <TituloSecao>{g.nome}</TituloSecao>
            <table className="mt-1 w-full text-sm">
              <thead>
                <tr className="text-left text-ink/50">
                  <th className="py-2 font-normal">Descrição</th>
                  <th className="w-20 py-2 text-right font-normal">Qtd</th>
                  <th className="w-24 py-2 text-right font-normal">Unitário</th>
                  <th className="w-28 py-2 text-right font-normal">Total</th>
                </tr>
              </thead>
              <tbody>
                {g.itens.map((i) => (
                  <tr key={i.id} className="break-inside-avoid border-t border-linha align-top">
                    <td className="py-1.5 pr-2">
                      {i.descricao}
                      {i.ambiente && i.ambiente !== "Geral" && <span className="block text-xs text-ink/50">{i.ambiente}</span>}
                    </td>
                    <td className="py-1.5 text-right font-mono text-ink/70">
                      {i.quantidade ? `${i.quantidade}${i.unidade ? ` ${i.unidade}` : ""}` : "—"}
                    </td>
                    <td className="py-1.5 text-right font-mono text-ink/70">{i.valorUnitario ? brl(i.valorUnitario) : "—"}</td>
                    <td className="py-1.5 text-right font-mono">{brl(valorEfetivo(i))}</td>
                  </tr>
                ))}
                <tr className="border-t border-ink">
                  <td colSpan={3} className="py-1.5 text-right text-xs font-semibold uppercase tracking-wider text-ink/60">Subtotal</td>
                  <td className="py-1.5 text-right font-mono font-semibold">{brl(g.previsto)}</td>
                </tr>
              </tbody>
            </table>
          </section>
        ))
      )}

      <p className="mt-8 border-t-2 pt-3 text-right" style={{ borderColor: "var(--marca)" }}>
        <span className="rotulo-tec mr-3 text-ink/60">Total</span>
        <span className="font-mono text-xl font-semibold">{brl(total)}</span>
      </p>
    </DocumentoBase>
  );
}
