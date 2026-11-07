"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useAuth } from "@/lib/auth";
import { useColecaoPessoal } from "@/lib/colecaoPessoal";
import { useDinheiro } from "@/lib/privacidade";
import { andamentoContrato, meiaNoite, resumoFinanceiro, serieMensal, statusParcela, todasAsParcelas, type ParcelaDoContrato } from "@/lib/financeiro";
import type { Honorario } from "@/lib/types";
import { useConfirm } from "./ConfirmProvider";
import { HonorarioDialog } from "./HonorarioDialog";
import { BotaoOlho } from "./BotaoOlho";
import { Logo } from "./Logo";
import { Painel, tooltipStyle } from "./BudgetCharts";
import { IconeEditar, IconeLixo, IconeMais, IconeVoltar } from "./Icones";

const DIA = 86_400_000;
const botaoTopo =
  "flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

const data = (ms: number) => new Date(ms).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

function Cartao({ rotulo, valor, sub, tom }: { rotulo: string; valor: string; sub?: string; tom?: "alerta" | "bom" }) {
  const cor = tom === "alerta" ? "text-pitanga" : tom === "bom" ? "text-emerald-700" : "text-ink";
  return (
    <div className="prancha p-4">
      <p className="rotulo-tec text-ink/50">{rotulo}</p>
      <p className={`mt-2 font-mono text-[19px] font-semibold tabular-nums leading-none sm:text-2xl ${cor}`}>{valor}</p>
      {sub && <p className="mt-2 text-xs text-ink/50">{sub}</p>}
    </div>
  );
}

function LinhaParcela({ p, hoje, onReceber, onDesfazer }: { p: ParcelaDoContrato; hoje: number; onReceber: () => void; onDesfazer: () => void }) {
  const { brl } = useDinheiro();
  const st = statusParcela(p, hoje);
  const dias = Math.round((p.vencimento - hoje) / DIA);
  const situacao =
    st === "recebida"
      ? { texto: `Recebida em ${data(p.recebidoEm as number)}`, cor: "text-emerald-700", ponto: "bg-emerald-600" }
      : st === "vencida"
        ? { texto: `Vencida há ${Math.abs(dias)} ${Math.abs(dias) === 1 ? "dia" : "dias"}`, cor: "text-pitanga", ponto: "bg-pitanga" }
        : st === "vence_hoje"
          ? { texto: "Vence hoje", cor: "text-amber-700", ponto: "bg-amber-500" }
          : { texto: `Vence em ${dias} ${dias === 1 ? "dia" : "dias"} · ${data(p.vencimento)}`, cor: "text-ink/55", ponto: "bg-ink/25" };

  return (
    <li className="linha-hover flex items-center gap-3 px-4 py-3">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${situacao.ponto}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">
          {p.projetoNome}
          <span className="font-normal text-ink/50"> · {p.de > 1 ? `parcela ${p.numero}/${p.de}` : p.contrato}</span>
        </p>
        <p className="truncate text-xs text-ink/50">{[p.cliente, p.contrato !== p.projetoNome && p.de > 1 ? p.contrato : ""].filter(Boolean).join(" · ") || "—"}</p>
        <p className={`text-xs font-medium ${situacao.cor}`}>{situacao.texto}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-sm font-semibold tabular-nums text-ink">{brl(p.valor)}</p>
        {st === "recebida" ? (
          <button onClick={onDesfazer} className="mt-1 text-[11px] font-semibold text-ink/45 hover:text-ink hover:underline">
            Desfazer
          </button>
        ) : (
          <button onClick={onReceber} className="btn btn-linha mt-1 rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider">
            Receber
          </button>
        )}
      </div>
    </li>
  );
}

/** Financeiro do escritório: honorários, parcelas a receber, o que venceu e o ritmo dos recebimentos. */
export function FinanceiroTela() {
  const { user, loading } = useAuth();
  const { itens: honorarios, carregando, salvar, remover } = useColecaoPessoal<Honorario>("honorarios", (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  const { oculto, brlCompacto, brlInt, brl } = useDinheiro();
  const confirmar = useConfirm();
  // "Hoje" só existe no navegador (0 durante a pré-renderização): o Next não aceita `new Date()` solto na renderização.
  const hoje = useSyncExternalStore(
    () => () => {},
    () => meiaNoite(new Date()),
    () => 0,
  );
  const [dialogo, setDialogo] = useState<{ chave: number; honorario: Honorario | null } | null>(null);
  const [verRecebidas, setVerRecebidas] = useState(false);
  const [verTodas, setVerTodas] = useState(false);

  const parcelas = useMemo(() => todasAsParcelas(honorarios), [honorarios]);
  const resumo = useMemo(() => resumoFinanceiro(honorarios, hoje), [honorarios, hoje]);
  const serie = useMemo(() => serieMensal(honorarios, hoje), [honorarios, hoje]);
  const abertas = parcelas.filter((p) => p.recebidoEm === null);
  const recebidas = parcelas.filter((p) => p.recebidoEm !== null).sort((a, b) => (b.recebidoEm as number) - (a.recebidoEm as number));
  const abertasVisiveis = verTodas ? abertas : abertas.slice(0, 8);
  const compacto = (v: number) => (oculto ? "" : brlCompacto(v));

  async function marcar(p: ParcelaDoContrato, recebido: boolean) {
    const h = honorarios.find((x) => x.id === p.honorarioId);
    if (!h) return;
    await salvar({ ...h, parcelas: h.parcelas.map((x) => (x.id === p.id ? { ...x, recebidoEm: recebido ? Date.now() : null } : x)) });
  }

  async function excluir(h: Honorario) {
    const ok = await confirmar({ titulo: "Remover honorário", mensagem: `Remover o contrato de "${h.projetoNome}" e todas as suas parcelas? Não há como desfazer.`, confirmar: "Remover", tom: "perigo" });
    if (ok) await remover(h.id);
  }

  if (loading || hoje === 0) {
    return <div className="grade flex min-h-dvh items-center justify-center font-mono text-xs uppercase tracking-wider text-ink/40">Carregando…</div>;
  }
  if (!user || user.anonimo) {
    return (
      <div className="grade flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-semibold text-ink">O financeiro é só para arquitetos.</p>
        <Link href="/" className="btn btn-primario px-5 py-2.5 text-sm">Ir para o início</Link>
      </div>
    );
  }

  const comCartoes = honorarios.length > 0;

  return (
    <div className="grade min-h-dvh">
      <header className={`rounded-b-[32px] bg-pitanga text-white ${comCartoes ? "pb-16" : "pb-8"}`}>
        <div className="mx-auto max-w-3xl px-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className={botaoTopo} aria-label="Voltar ao painel" title="Voltar ao painel">
              <IconeVoltar />
            </Link>
            <Logo claro />
            <BotaoOlho className={botaoTopo} />
          </div>
          <p className="rotulo-tec mt-6 text-white/85">Financeiro do escritório</p>
          <h1 className="mt-1 text-3xl font-semibold leading-tight tracking-tight">Honorários</h1>
          <p className="mt-1 text-sm text-white">
            {carregando
              ? "Carregando…"
              : honorarios.length === 0
                ? "Cadastre o que você cobra e acompanhe cada parcela."
                : `${honorarios.length} ${honorarios.length === 1 ? "contrato" : "contratos"} · ${abertas.length} ${abertas.length === 1 ? "parcela" : "parcelas"} a receber`}
          </p>
        </div>
      </header>

      <main className={`mx-auto max-w-3xl space-y-6 px-4 pb-32 ${comCartoes ? "-mt-9" : "pt-6"}`}>
        {comCartoes && (
          <section aria-label="Resumo financeiro" className="relative z-10 grid grid-cols-2 gap-3">
            <Cartao rotulo="A receber" valor={brlInt(resumo.aReceber)} sub={`${abertas.length} ${abertas.length === 1 ? "parcela" : "parcelas"} em aberto`} />
            <Cartao
              rotulo="Vencido"
              valor={brlInt(resumo.vencido)}
              tom={resumo.vencido > 0 ? "alerta" : "bom"}
              sub={resumo.qtdVencidas > 0 ? `${resumo.qtdVencidas} ${resumo.qtdVencidas === 1 ? "parcela atrasada" : "parcelas atrasadas"}` : "nada atrasado"}
            />
            <Cartao rotulo="Próximos 30 dias" valor={brlInt(resumo.proximos30)} sub="vencem em breve" />
            <Cartao rotulo="Recebido no mês" valor={brlInt(resumo.recebidoNoMes)} tom="bom" sub={`${brlInt(resumo.totalRecebido)} no total`} />
          </section>
        )}

        {honorarios.length === 0 && !carregando && (
          <div className="prancha px-6 py-12 text-center">
            <p className="text-lg font-semibold text-ink">Nenhum honorário ainda</p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-ink/60">Registre o contrato de um projeto, divida em parcelas e marque cada uma como recebida.</p>
          </div>
        )}

        {comCartoes && (
          <Painel titulo="Parcelas por mês" subtitulo="Pelo mês de vencimento: o que já entrou, o que ainda vem e o que está atrasado." altura={260}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serie} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" vertical={false} />
                <XAxis dataKey="rotulo" tick={{ fontSize: 11, fill: "#57534e" }} />
                <YAxis tickFormatter={compacto} tick={{ fontSize: 10, fill: "#a8a29e" }} width={56} />
                <Tooltip formatter={(v) => brl(Number(v))} contentStyle={tooltipStyle} cursor={{ fill: "#faf9f7" }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Recebido" stackId="m" fill="#059669" maxBarSize={40} />
                <Bar dataKey="A receber" stackId="m" fill="#d6d3d1" maxBarSize={40} />
                <Bar dataKey="Vencido" stackId="m" fill="#d23a1f" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </Painel>
        )}

        {abertas.length > 0 && (
          <section aria-label="Parcelas a receber">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-xl font-semibold text-ink">A receber</h2>
              <span className="h-px flex-1 bg-linha" />
            </div>
            <ul className="prancha divide-y divide-linha overflow-hidden">
              {abertasVisiveis.map((p) => (
                <LinhaParcela key={p.id} p={p} hoje={hoje} onReceber={() => marcar(p, true)} onDesfazer={() => marcar(p, false)} />
              ))}
            </ul>
            {abertas.length > 8 && (
              <button onClick={() => setVerTodas((v) => !v)} className="mt-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-pitanga hover:underline">
                {verTodas ? "Mostrar menos" : `Ver todas (${abertas.length})`}
              </button>
            )}
          </section>
        )}

        {honorarios.length > 0 && (
          <section aria-label="Contratos">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-xl font-semibold text-ink">Contratos</h2>
              <span className="h-px flex-1 bg-linha" />
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {honorarios.map((h) => {
                const a = andamentoContrato(h);
                return (
                  <li key={h.id} className="prancha p-4">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-semibold text-ink">{h.projetoNome}</p>
                        <p className="truncate text-xs text-ink/55">{[h.cliente, h.descricao].filter(Boolean).join(" · ")}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button className="btn btn-icone h-8 w-8" onClick={() => setDialogo({ chave: Date.now(), honorario: h })} aria-label={`Editar ${h.projetoNome}`} title="Editar"><IconeEditar /></button>
                        <button className="btn btn-icone perigo h-8 w-8" onClick={() => excluir(h)} aria-label={`Remover ${h.projetoNome}`} title="Remover"><IconeLixo /></button>
                      </div>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10" role="img" aria-label={`${a.pct}% recebido`}>
                      <div className="h-full rounded-full bg-emerald-600 transition-[width] duration-500" style={{ width: `${a.pct}%` }} />
                    </div>
                    <p className="mt-1.5 flex justify-between text-xs text-ink/55">
                      <span>
                        <span className="font-mono">{brlInt(a.recebido)}</span> de <span className="font-mono">{brlInt(a.total)}</span>
                      </span>
                      <span className="font-mono">{a.pct}%</span>
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {recebidas.length > 0 && (
          <section aria-label="Parcelas recebidas">
            <button onClick={() => setVerRecebidas((v) => !v)} aria-expanded={verRecebidas} className="clicavel flex w-full items-center gap-3 rounded-xl py-1 text-left">
              <h2 className="text-base font-semibold text-ink/75">Recebidas ({recebidas.length})</h2>
              <span className="h-px flex-1 bg-linha" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ink/50">{verRecebidas ? "Ocultar" : "Mostrar"}</span>
            </button>
            {verRecebidas && (
              <ul className="prancha mt-3 divide-y divide-linha overflow-hidden">
                {recebidas.slice(0, 20).map((p) => (
                  <LinhaParcela key={p.id} p={p} hoje={hoje} onReceber={() => marcar(p, true)} onDesfazer={() => marcar(p, false)} />
                ))}
              </ul>
            )}
          </section>
        )}
      </main>

      <div className="pb-seguro pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4">
        <button
          onClick={() => setDialogo({ chave: Date.now(), honorario: null })}
          className="btn btn-primario pointer-events-auto gap-2 rounded-full px-7 py-4 text-base shadow-[0_14px_30px_-10px_rgba(210,58,31,0.7)]"
        >
          <IconeMais size={20} /> Novo honorário
        </button>
      </div>

      {dialogo && (
        <HonorarioDialog key={dialogo.chave} aberto onFechar={() => setDialogo(null)} honorario={dialogo.honorario} onSalvar={async (d) => void (await salvar(d))} />
      )}
    </div>
  );
}
