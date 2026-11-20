"use client";

import { useData } from "@/lib/data";
import { brl } from "@/lib/format";
import { blocoCobranca } from "@/lib/cobrancaObra";
import type { CobrancaObra } from "@/lib/types";
import { DocumentoBase, TituloSecao } from "../DocumentoBase";

const data = (ms: number) => new Date(ms).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

/** O documento da cobrança, em PDF, com a marca do escritório: itens, total, vencimento e chave PIX. */
export function CobrancaObraDocumento({ cobranca, onFechar }: { cobranca: CobrancaObra; onFechar: () => void }) {
  const { config } = useData();
  const novos = cobranca.itens.filter((i) => i.novo).length;

  return (
    <DocumentoBase
      onFechar={onFechar}
      titulo="Cobrança"
      etapaRotulo={cobranca.titulo}
      nomeArquivo={`Cobrança - ${config.nomeObra} - ${cobranca.titulo}`}
      mensagemExtra={blocoCobranca(cobranca)}
    >
      <section className="mt-8">
        <TituloSecao>Resumo</TituloSecao>
        <dl className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="rotulo-tec text-ink/50">Total a pagar</dt>
            <dd className="mt-0.5 font-mono text-xl font-semibold">{brl(cobranca.total)}</dd>
          </div>
          <div>
            <dt className="rotulo-tec text-ink/50">Vencimento</dt>
            <dd className="mt-0.5 font-mono text-lg font-semibold">{cobranca.vencimento ? data(cobranca.vencimento) : "A combinar"}</dd>
          </div>
          <div>
            <dt className="rotulo-tec text-ink/50">Itens</dt>
            <dd className="mt-0.5 font-mono text-lg font-semibold">{cobranca.itens.length}</dd>
            {novos > 0 && <dd className="text-xs text-ink/55">{novos} {novos === 1 ? "item novo" : "itens novos"}</dd>}
          </div>
        </dl>
      </section>

      <section className="mt-8">
        <TituloSecao>O que está sendo cobrado</TituloSecao>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="text-left text-ink/50">
              <th className="py-1.5 pr-2 font-normal">Descrição</th>
              <th className="w-20 py-1.5 text-right font-normal">Qtd</th>
              <th className="w-28 py-1.5 text-right font-normal">Valor</th>
            </tr>
          </thead>
          <tbody>
            {cobranca.itens.map((i, k) => (
              <tr key={`${i.itemId ?? i.descricao}-${k}`} className="break-inside-avoid border-t border-linha align-top">
                <td className="py-1.5 pr-2">
                  {i.descricao}
                  <span className="block text-xs text-ink/50">
                    {i.etapa}
                    {i.novo && " · item novo"}
                  </span>
                </td>
                <td className="py-1.5 text-right font-mono text-ink/60">
                  {i.quantidade}
                  {i.unidade ? ` ${i.unidade}` : ""}
                </td>
                <td className="py-1.5 text-right font-mono">{brl(i.valor)}</td>
              </tr>
            ))}
            <tr className="border-t border-ink">
              <td colSpan={2} className="py-1.5 text-right text-xs font-semibold uppercase tracking-wider text-ink/60">
                Total
              </td>
              <td className="py-1.5 text-right font-mono font-semibold">{brl(cobranca.total)}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {cobranca.pix.trim() && (
        <section className="mt-8 break-inside-avoid">
          <TituloSecao>Como pagar</TituloSecao>
          <p className="mt-2 text-sm text-ink/85">
            Chave PIX: <strong className="font-mono font-semibold">{cobranca.pix.trim()}</strong>
          </p>
        </section>
      )}

      {cobranca.obs.trim() && (
        <section className="mt-8 break-inside-avoid">
          <TituloSecao>Observações</TituloSecao>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink/85">{cobranca.obs.trim()}</p>
        </section>
      )}
    </DocumentoBase>
  );
}
