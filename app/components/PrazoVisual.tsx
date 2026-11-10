"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { meiaNoite } from "@/lib/financeiro";
import { ROTULO_STATUS, dataCurta, dataLonga, situacaoDoPrazo, textoDeDiferenca, textoDeTempo, type SituacaoPrazo, type StatusPrazo } from "@/lib/prazo";
import type { Obra, Previsao } from "@/lib/types";
import { IconeCadeado } from "./Icones";
import { PrevisaoDialog } from "./PrevisaoDialog";

/** "Hoje" (meia-noite local). Vale 0 na pré-renderização: o Next não aceita `new Date()` solto na renderização. */
export function useHoje(): number {
  return useSyncExternalStore(
    () => () => {},
    () => meiaNoite(new Date()),
    () => 0,
  );
}

const TOM: Record<StatusPrazo, { chip: string; ponto: string; texto: string }> = {
  nao_iniciado: { chip: "bg-ink/[0.07] text-ink/70", ponto: "bg-ink/35", texto: "text-ink" },
  no_prazo: { chip: "bg-emerald-100 text-emerald-800", ponto: "bg-emerald-600", texto: "text-emerald-700" },
  atencao: { chip: "bg-amber-100 text-amber-800", ponto: "bg-amber-500", texto: "text-amber-700" },
  atrasado: { chip: "bg-pitanga/15 text-pitanga", ponto: "bg-pitanga", texto: "text-pitanga" },
  concluido: { chip: "bg-emerald-100 text-emerald-800", ponto: "bg-emerald-600", texto: "text-emerald-700" },
};

function ChipStatus({ status }: { status: StatusPrazo }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${TOM[status].chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${TOM[status].ponto}`} aria-hidden />
      {ROTULO_STATUS[status]}
    </span>
  );
}

function Barra({ rotulo, pct, cor }: { rotulo: string; pct: number; cor: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-ink/60">
        <span>{rotulo}</span>
        <span className="font-mono tabular-nums">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink/10" role="img" aria-label={`${rotulo}: ${pct}%`}>
        <div className={`h-full rounded-full ${cor} transition-[width] duration-700`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  );
}

/**
 * Uma barra por previsão, na mesma escala de datas: a original aparece apagada, as novas previsões em
 * laranja (a atual, cheia) e uma linha marca "hoje". Dá para ver de relance quanto o prazo deslizou.
 */
function LinhaDoTempo({ previsoes, hoje }: { previsoes: Previsao[]; hoje: number }) {
  const { inicioEscala, fimEscala } = useMemo(() => {
    const marcos = [...previsoes.flatMap((p) => [p.inicio, p.termino]), hoje];
    const min = Math.min(...marcos);
    const max = Math.max(...marcos);
    const folga = Math.max((max - min) * 0.04, 86_400_000);
    return { inicioEscala: min - folga, fimEscala: max + folga };
  }, [previsoes, hoje]);
  const pos = (t: number) => ((t - inicioEscala) / (fimEscala - inicioEscala)) * 100;
  const comNovas = previsoes.length > 1;
  const ultimo = previsoes.length - 1;

  return (
    <div>
      <ul className="space-y-3.5">
        {previsoes.map((p, idx) => {
          const ehOriginal = idx === 0;
          const atual = idx === ultimo;
          const estilo = !comNovas ? "bg-ink" : ehOriginal ? "bg-ink/20 ring-1 ring-inset ring-ink/30" : atual ? "bg-pitanga" : "bg-pitanga/30 ring-1 ring-inset ring-pitanga/40";
          const esq = pos(p.inicio);
          const larg = Math.max(1.5, pos(p.termino) - esq);
          return (
            <li key={p.id}>
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-ink">
                  {ehOriginal ? (
                    <>
                      <span className="text-ink/50"><IconeCadeado size={12} /></span> Previsão original
                    </>
                  ) : (
                    <>
                      Nova previsão · {p.numero}ª
                      {atual && <span className="rounded-full bg-pitanga px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-white">atual</span>}
                    </>
                  )}
                </span>
                <span className="whitespace-nowrap font-mono text-ink/55">
                  {dataCurta(p.inicio)} → {dataCurta(p.termino)} · {p.dias} d
                </span>
              </div>
              <div className="relative h-3.5 rounded-full bg-ink/[0.06]">
                <div className={`absolute inset-y-0 rounded-full ${estilo}`} style={{ left: `${esq}%`, width: `${larg}%` }} />
                <div className="pointer-events-none absolute -inset-y-1 w-0.5 rounded bg-pitanga" style={{ left: `${pos(hoje)}%` }} aria-hidden />
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-2.5 flex items-center gap-2 text-[11px] text-ink/50">
        <span className="h-3 w-0.5 rounded bg-pitanga" aria-hidden /> Hoje · {dataCurta(hoje)}
      </p>
    </div>
  );
}

function Historico({ previsoes }: { previsoes: Previsao[] }) {
  const atualId = previsoes[previsoes.length - 1].id;
  return (
    <ol className="space-y-2">
      {[...previsoes].reverse().map((p) => (
        <li key={p.id} className="rounded-2xl border border-linha p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white ${p.numero === 1 ? "bg-ink" : "bg-pitanga"}`}>
              {p.numero === 1 ? "Original" : `Nova previsão · ${p.numero}ª`}
            </span>
            {p.id === atualId && <span className="text-[11px] font-semibold text-emerald-700">em vigor</span>}
            <span className="ml-auto text-ink/35" title="Registrada: não pode ser editada">
              <IconeCadeado size={14} />
            </span>
          </div>
          <p className="mt-1.5 text-sm text-ink">
            {dataLonga(p.inicio)} → {dataLonga(p.termino)} <span className="text-ink/50">· {p.dias} dias</span>
          </p>
          <p className="text-xs text-ink/50">
            Registrada em {dataLonga(p.registradaEm)} por {p.registradaPor}
          </p>
          {p.motivo && <p className="mt-1.5 text-[13px] italic leading-snug text-ink/70">“{p.motivo}”</p>}
        </li>
      ))}
    </ol>
  );
}

/** Home do projeto: o prazo, a linha do tempo das previsões, o ritmo e o histórico. */
export function PrazoCard({
  previsoes,
  pctConcluido,
  ehCliente,
  onRegistrar,
}: {
  previsoes: Previsao[];
  pctConcluido: number;
  ehCliente: boolean;
  onRegistrar: (p: { inicio: number; termino: number; motivo: string }) => Promise<void>;
}) {
  const hoje = useHoje();
  const [dialogo, setDialogo] = useState<number | null>(null);
  const [historico, setHistorico] = useState(false);
  const s: SituacaoPrazo | null = useMemo(() => (hoje ? situacaoDoPrazo(previsoes, hoje, pctConcluido) : null), [previsoes, hoje, pctConcluido]);

  if (hoje === 0) return null;

  const dialogoAberto =
    dialogo !== null ? <PrevisaoDialog key={dialogo} aberto onFechar={() => setDialogo(null)} previsoes={previsoes} onRegistrar={onRegistrar} /> : null;

  // Ainda sem previsão: o arquiteto é convidado a registrar a original; o cliente só vê um aviso.
  if (!s) {
    if (ehCliente) {
      return (
        <p data-tour="prazo" className="rounded-2xl border border-dashed border-ink/30 bg-white/70 px-4 py-3 text-[13px] text-ink/60">
          O arquiteto ainda não registrou o prazo previsto deste projeto.
        </p>
      );
    }
    return (
      <section data-tour="prazo" aria-label="Prazo do projeto" className="rounded-3xl border border-dashed border-ink/30 bg-white/70 p-5">
        <p className="rotulo-tec text-ink/50">Prazo do projeto</p>
        <p className="mt-1 text-lg font-semibold text-ink">Defina quanto tempo a obra deve levar</p>
        <p className="mt-1 text-sm leading-snug text-ink/65">
          Registre o prazo previsto no começo. Ele fica guardado como referência e <strong className="font-semibold text-ink">não pode ser editado</strong>. Se mudar, você registra uma nova previsão ao lado
          dele, e o cliente vê as duas.
        </p>
        <button className="btn btn-primario mt-4 px-5 py-2.5 text-sm" onClick={() => setDialogo(Date.now())}>
          Registrar previsão inicial
        </button>
        {dialogoAberto}
      </section>
    );
  }

  const tom = TOM[s.status];
  const frase =
    s.status === "nao_iniciado"
      ? "O projeto ainda não começou."
      : s.status === "concluido"
        ? "Todos os itens foram feitos e pagos."
        : `Passaram ${s.pctTempo}% do tempo previsto e ${s.pctConcluido}% do projeto está concluído.`;

  return (
    <section data-tour="prazo" aria-label="Prazo do projeto" className="prancha space-y-5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="rotulo-tec text-ink/50">Prazo do projeto</p>
          <p className={`mt-1 text-2xl font-semibold leading-tight tracking-tight ${tom.texto}`}>{textoDeTempo(s)}</p>
          <p className="mt-0.5 text-sm text-ink/60">
            Término previsto: <strong className="font-semibold text-ink">{dataLonga(s.vigente.termino)}</strong>
          </p>
        </div>
        <ChipStatus status={s.status} />
      </div>

      {s.novasPrevisoes > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900">
          <span className="rounded-full bg-amber-500 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white">Nova previsão · {s.vigente.numero}ª</span>
          <span>
            Prazo original: <strong className="font-semibold">{dataCurta(s.original.termino)}</strong> · a nova previsão tem {textoDeDiferenca(s.desvioDias)}
          </span>
        </div>
      )}

      <LinhaDoTempo previsoes={previsoes} hoje={hoje} />

      <div className="space-y-2.5 border-t border-linha pt-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Barra rotulo="Tempo decorrido" pct={s.pctTempo} cor="bg-ink" />
          <Barra rotulo="Projeto concluído" pct={s.pctConcluido} cor="bg-emerald-600" />
        </div>
        <p className="text-xs text-ink/55">{frase}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-linha pt-4">
        {!ehCliente && (
          <button className="btn btn-linha px-4 py-2.5 text-sm" onClick={() => setDialogo(Date.now())}>
            Registrar nova previsão
          </button>
        )}
        <button className="font-mono text-[11px] font-semibold uppercase tracking-wider text-pitanga hover:underline" onClick={() => setHistorico((v) => !v)} aria-expanded={historico}>
          {historico ? "Ocultar histórico" : `Ver histórico (${previsoes.length})`}
        </button>
      </div>

      <p className="flex items-start gap-1.5 text-[11px] leading-snug text-ink/45">
        <span className="mt-px shrink-0"><IconeCadeado size={12} /></span>
        A previsão original não pode ser editada. Mudanças viram uma nova previsão, registrada ao lado dela, com data e motivo.
      </p>

      {historico && <Historico previsoes={previsoes} />}
      {dialogoAberto}
    </section>
  );
}

const pctDaObra = (o: Obra) => (o.resumo && o.resumo.itens > 0 ? Math.round((o.resumo.concluidos / o.resumo.itens) * 100) : 0);

/** Cartão do projeto na home do arquiteto: status do prazo, quanto tempo e quanto projeto já foram, e se há nova previsão. */
export function PrazoMini({ obra, hoje }: { obra: Obra; hoje: number }) {
  const s = hoje ? situacaoDoPrazo(obra.previsoes, hoje, pctDaObra(obra)) : null;
  if (!s) {
    return <p className="mt-3 text-xs text-ink/40">{hoje ? "Sem prazo registrado" : ""}</p>;
  }
  return (
    <div className="mt-3 rounded-2xl border border-linha px-3 py-2.5">
      <div className="flex items-center justify-between gap-2">
        <ChipStatus status={s.status} />
        <span className={`truncate text-xs font-semibold ${TOM[s.status].texto}`}>{textoDeTempo(s)}</span>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-3">
        <div>
          <div className="mb-1 flex justify-between text-[10px] text-ink/50">
            <span>Tempo</span>
            <span className="font-mono">{s.pctTempo}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
            <div className="h-full rounded-full bg-ink" style={{ width: `${s.pctTempo}%` }} />
          </div>
        </div>
        <div>
          <div className="mb-1 flex justify-between text-[10px] text-ink/50">
            <span>Concluído</span>
            <span className="font-mono">{s.pctConcluido}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
            <div className="h-full rounded-full bg-emerald-600" style={{ width: `${s.pctConcluido}%` }} />
          </div>
        </div>
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink/50">
        <span>Término {dataCurta(s.vigente.termino)}</span>
        {s.novasPrevisoes > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">
            Nova previsão · {s.vigente.numero}ª · {s.desvioDias > 0 ? "+" : s.desvioDias < 0 ? "−" : ""}
            {Math.abs(s.desvioDias)} d
          </span>
        )}
      </p>
    </div>
  );
}

/** Faixa rolável com os próximos términos, do mais próximo (ou mais atrasado) ao mais distante. */
export function ProximasEntregas({ obras, hoje }: { obras: Obra[]; hoje: number }) {
  const itens = useMemo(() => {
    if (!hoje) return [];
    return obras
      .map((o) => ({ obra: o, s: situacaoDoPrazo(o.previsoes, hoje, pctDaObra(o)) }))
      .filter((x): x is { obra: Obra; s: SituacaoPrazo } => x.s !== null && x.s.status !== "concluido")
      .sort((a, b) => a.s.vigente.termino - b.s.vigente.termino)
      .slice(0, 8);
  }, [obras, hoje]);

  if (itens.length === 0) return null;

  return (
    <section aria-label="Próximas entregas" data-tour="proximas-entregas">
      <div className="mb-3 flex items-center gap-3">
        <h2 className="text-xl font-semibold text-ink">Próximas entregas</h2>
        <span className="h-px flex-1 bg-linha" />
      </div>
      <ul className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
        {itens.map(({ obra, s }) => (
          <li key={obra.id} className="w-52 shrink-0 snap-start">
            <Link href={`/obra/${obra.id}`} className="prancha prancha-clicavel clicavel flex h-full flex-col gap-1.5 p-3.5">
              <span className="flex items-center gap-1.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${TOM[s.status].ponto}`} aria-hidden />
                <span className="truncate text-sm font-semibold text-ink">{obra.nome}</span>
              </span>
              <span className="font-mono text-xs text-ink/60">{dataCurta(s.vigente.termino)}</span>
              <span className={`text-xs font-semibold ${TOM[s.status].texto}`}>{textoDeTempo(s)}</span>
              {s.novasPrevisoes > 0 && (
                <span className="mt-auto w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">Nova previsão · {s.vigente.numero}ª</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
