"use client";

import { useDinheiro } from "@/lib/privacidade";
import type { Resumo } from "@/lib/calc";
import { Chip } from "./ui/Chip";

/** O total do orçamento sempre à vista enquanto se monta a lista: quanto vai, quanto cabe e o que ainda falta preencher. */
export function OrcamentoBarra({ resumo, etapas, semValor }: { resumo: Resumo; etapas: number; semValor: number }) {
  const { brl } = useDinheiro();
  const { previstoTotal, teto, projecaoVsTeto, totalItens } = resumo;

  return (
    <section aria-label="Resumo do orçamento" className="prancha p-4" data-tour="total-orcamento">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <p className="rotulo-tec text-ink/50">Total do orçamento</p>
          <p className="mt-0.5 font-mono text-2xl font-semibold tabular-nums text-ink">{brl(previstoTotal)}</p>
          <p className="mt-0.5 text-xs text-ink/55">
            {totalItens} {totalItens === 1 ? "item" : "itens"} · {etapas} {etapas === 1 ? "etapa" : "etapas"}
          </p>
        </div>
        <div className="text-right">
          {teto > 0 ? (
            <>
              <p className="rotulo-tec text-ink/50">Teto {brl(teto)}</p>
              <p className={`mt-0.5 text-sm font-semibold ${projecaoVsTeto < 0 ? "text-pitanga-escuro" : "text-emerald-700"}`}>
                {projecaoVsTeto < 0 ? `Passou ${brl(-projecaoVsTeto)} do teto` : `Folga de ${brl(projecaoVsTeto)}`}
              </p>
            </>
          ) : (
            <p className="max-w-[12rem] text-xs leading-snug text-ink/55">Defina o teto em Ajustes (engrenagem) para ver a folga.</p>
          )}
        </div>
      </div>
      {semValor > 0 && (
        <p className="mt-3 flex items-center gap-2 border-t border-linha pt-3 text-xs text-ink/70">
          <Chip tom="aviso">{semValor} {semValor === 1 ? "item sem valor" : "itens sem valor"}</Chip>
          <span>Preencha o valor para o total ficar certo.</span>
        </p>
      )}
    </section>
  );
}
