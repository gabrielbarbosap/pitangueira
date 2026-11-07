"use client";

import { useDinheiro } from "@/lib/privacidade";
import type { Resumo } from "@/lib/calc";
import { Regua } from "./Regua";

function Cartao({ rotulo, valor, sub, alerta }: { rotulo: string; valor: string; sub?: string; alerta?: boolean }) {
  return (
    <div className="prancha p-4">
      <p className="rotulo-tec text-ink/50">{rotulo}</p>
      <p className={`mt-2 font-mono text-[19px] font-semibold tabular-nums leading-none sm:text-2xl ${alerta ? "text-pitanga" : "text-ink"}`}>{valor}</p>
      {sub && <p className="mt-2 text-xs text-ink/50">{sub}</p>}
    </div>
  );
}

/** Os dois números que ficam flutuando sobre o topo laranja: o que já saiu e o que falta. */
export function ResumoTopo({ resumo }: { resumo: Resumo }) {
  const { brlInt } = useDinheiro();
  return (
    <section className="relative z-10 grid grid-cols-2 gap-3" aria-label="Pago e a pagar">
      <Cartao rotulo="Já pago" valor={brlInt(resumo.pagoTotal)} sub={`${resumo.pctPago}% do previsto`} />
      <Cartao rotulo="Falta pagar" valor={brlInt(resumo.faltaPagar)} sub="itens ainda não pagos" />
    </section>
  );
}

function Barra({ rotulo, pct, detalhe }: { rotulo: string; pct: number; detalhe?: string }) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm text-ink/75">{rotulo}</span>
        <span className="font-mono text-sm font-semibold tabular-nums text-ink">{pct}%</span>
      </div>
      <Regua pct={pct} altura="h-2" />
      {detalhe && <p className="mt-1.5 text-xs text-ink/45">{detalhe}</p>}
    </div>
  );
}

export function SummaryCards({ resumo }: { resumo: Resumo }) {
  const { brl } = useDinheiro();
  const estouro = resumo.projecaoVsTeto < 0;
  return (
    <section className="space-y-3" aria-label="Orçamento e andamento">
      <div className="grid grid-cols-2 gap-3">
        <Cartao
          rotulo="Orçamento disponível"
          valor={resumo.teto > 0 ? brl(resumo.teto) : "—"}
          sub={resumo.teto > 0 ? "o teto do projeto" : "defina em Ajustes"}
        />
        <Cartao
          rotulo="Saldo em caixa"
          valor={resumo.teto > 0 ? brl(resumo.saldoCaixa) : "—"}
          sub={resumo.teto > 0 ? "teto menos o já pago" : "precisa do teto definido"}
          alerta={resumo.teto > 0 && resumo.saldoCaixa < 0}
        />
      </div>

      <div className="prancha p-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Barra rotulo="Execução financeira (pago)" pct={resumo.pctPago} />
          <Barra rotulo="Serviços concluídos" pct={resumo.pctFeito} detalhe={`${resumo.itensFeitos} de ${resumo.totalItens} itens feitos`} />
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-1.5 border-t border-linha pt-4 text-sm">
          <span className="text-ink/55">
            Orçado (planilha): <strong className="font-mono font-semibold text-ink">{brl(resumo.orcadoTotal)}</strong>
          </span>
          <span className="text-ink/55">
            Projeção de custo: <strong className="font-mono font-semibold text-ink">{brl(resumo.previstoTotal)}</strong>
          </span>
          {resumo.teto > 0 && (
            <span className={`font-medium ${estouro ? "text-pitanga" : "text-emerald-700"}`}>
              {estouro
                ? `Projeção acima do teto em ${brl(Math.abs(resumo.projecaoVsTeto))}`
                : `Folga de ${brl(resumo.projecaoVsTeto)} no teto`}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
