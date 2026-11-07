"use client";

import { useMemo } from "react";
import { brlInt } from "@/lib/format";
import { statusGrupo, valorEfetivo, type Grupo } from "@/lib/calc";
import type { Item } from "@/lib/types";

const MAX_ETAPAS = 4;
const MAX_ITENS = 3;

/** Anel de progresso: o arco é o que já está concluído (feito e pago). */
function Anel({ pct }: { pct: number }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-16 w-16 shrink-0" role="img" aria-label={`${pct}% concluído`}>
      <svg viewBox="0 0 60 60" className="h-full w-full -rotate-90">
        <circle cx="30" cy="30" r={r} fill="none" strokeWidth="6" className="stroke-ink/10" />
        <circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className="stroke-pitanga transition-[stroke-dashoffset] duration-700"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(100, pct) / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-mono text-[13px] font-semibold tabular-nums text-ink">{pct}%</span>
    </div>
  );
}

function Mini({ rotulo, pct, cor }: { rotulo: string; pct: number; cor: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-ink/55">
        <span>{rotulo}</span>
        <span className="font-mono tabular-nums">{pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
        <div className={`h-full rounded-full ${cor} transition-[width] duration-700`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

/** Em que pé está o item: o que já aconteceu e o que falta. */
function situacao(i: Item) {
  if (i.feito && !i.pago) return { texto: "Feito · falta pagar", ponto: "bg-amber-500", etiqueta: "bg-amber-50 text-amber-900 border-amber-300" };
  return { texto: "Pago · falta executar", ponto: "bg-sky-500", etiqueta: "bg-sky-50 text-sky-900 border-sky-300" };
}

interface EtapaAndamento {
  grupo: Grupo;
  concluidos: number;
  pctConcluido: number;
  pctFeito: number;
  pctPago: number;
  meio: Item[];
}

/** Etapas com algum progresso mas ainda não finalizadas, as mais próximas do fim primeiro. */
function calcular(grupos: Grupo[]): EtapaAndamento[] {
  return grupos
    .filter((g) => statusGrupo(g) === "progresso")
    .map((g) => {
      const concluidos = g.itens.filter((i) => i.feito && i.pago).length;
      const meio = g.itens.filter((i) => i.feito !== i.pago).sort((a, b) => valorEfetivo(b) - valorEfetivo(a));
      return {
        grupo: g,
        concluidos,
        pctConcluido: Math.round((concluidos / g.total) * 100),
        pctFeito: Math.round((g.feitos / g.total) * 100),
        pctPago: g.previsto > 0 ? Math.round((g.pago / g.previsto) * 100) : 0,
        meio,
      };
    })
    .sort((a, b) => b.pctConcluido - a.pctConcluido || b.grupo.previsto - a.grupo.previsto);
}

/**
 * Bloco do Resumo: o que está acontecendo agora na obra. Cada etapa em andamento ganha um cartão
 * com anel de progresso, barras de feito/pago e os itens que estão no meio do caminho.
 */
export function EmAndamento({ gruposEtapa, onAbrirEtapa, onVerTodas }: { gruposEtapa: Grupo[]; onAbrirEtapa: (nome: string) => void; onVerTodas: () => void }) {
  const etapas = useMemo(() => calcular(gruposEtapa), [gruposEtapa]);
  const aPagar = useMemo(() => etapas.reduce((s, e) => s + e.meio.filter((i) => i.feito && !i.pago).reduce((t, i) => t + valorEfetivo(i), 0), 0), [etapas]);
  const itensNoMeio = etapas.reduce((s, e) => s + e.meio.length, 0);
  const visiveis = etapas.slice(0, MAX_ETAPAS);

  return (
    <section aria-label="Em andamento" className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold text-ink">
            <span className="relative flex h-2.5 w-2.5" aria-hidden>
              {etapas.length > 0 && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pitanga opacity-60 motion-reduce:hidden" />}
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${etapas.length > 0 ? "bg-pitanga" : "bg-ink/25"}`} />
            </span>
            Em andamento
          </h2>
          <p className="mt-0.5 text-[13px] text-ink/55">
            {etapas.length === 0
              ? "Nada em execução agora."
              : `${etapas.length} ${etapas.length === 1 ? "etapa" : "etapas"} · ${itensNoMeio} ${itensNoMeio === 1 ? "item" : "itens"} no meio do caminho${aPagar > 0 ? ` · ${brlInt(aPagar)} feito e a pagar` : ""}`}
          </p>
        </div>
        {etapas.length > MAX_ETAPAS && (
          <button onClick={onVerTodas} className="shrink-0 font-mono text-[11px] font-semibold uppercase tracking-wider text-pitanga hover:underline">
            Ver todas ({etapas.length})
          </button>
        )}
      </div>

      {etapas.length === 0 ? (
        <p className="prancha px-4 py-6 text-center text-sm text-ink/55">
          Quando um item for marcado como feito ou pago, a etapa dele aparece aqui com o progresso.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visiveis.map((e, idx) => (
            <li key={e.grupo.nome} className="entra" style={{ animationDelay: `${idx * 70}ms` }}>
              <button
                onClick={() => onAbrirEtapa(e.grupo.nome)}
                className="prancha prancha-clicavel clicavel flex h-full w-full flex-col gap-3.5 p-4 text-left"
                title={`Abrir ${e.grupo.nome} na lista de itens`}
              >
                <div className="flex items-center gap-3.5">
                  <Anel pct={e.pctConcluido} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink">{e.grupo.nome}</p>
                    <p className="mt-1 text-xs text-ink/55">
                      {e.concluidos} de {e.grupo.total} concluídos · <span className="font-mono">{brlInt(e.grupo.previsto)}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Mini rotulo="Executado" pct={e.pctFeito} cor="bg-ink" />
                  <Mini rotulo="Pago" pct={e.pctPago} cor="bg-emerald-600" />
                </div>

                {e.meio.length > 0 && (
                  <ul className="space-y-1.5 border-t border-linha pt-3">
                    {e.meio.slice(0, MAX_ITENS).map((i) => {
                      const s = situacao(i);
                      return (
                        <li key={i.id} className="flex items-center gap-2">
                          <span className={`h-2 w-2 shrink-0 rounded-full ${s.ponto}`} aria-hidden />
                          <span className="min-w-0 flex-1 truncate text-[13px] text-ink/80">{i.descricao}</span>
                          <span className={`hidden shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium min-[420px]:inline ${s.etiqueta}`}>{s.texto}</span>
                          <span className="shrink-0 font-mono text-xs tabular-nums text-ink/60">{brlInt(valorEfetivo(i))}</span>
                        </li>
                      );
                    })}
                    {e.meio.length > MAX_ITENS && <li className="pl-4 text-xs text-ink/45">+ {e.meio.length - MAX_ITENS} {e.meio.length - MAX_ITENS === 1 ? "item" : "itens"} em andamento</li>}
                  </ul>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
