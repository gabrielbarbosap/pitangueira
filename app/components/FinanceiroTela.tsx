"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { useAuth } from "@/lib/auth";
import { useColecaoPessoal } from "@/lib/colecaoPessoal";
import { useDinheiro } from "@/lib/privacidade";
import {
  andamentoContrato,
  contagemPorFiltro,
  csvParcelas,
  faixasDeAtraso,
  filtrarAbertas,
  indicadores,
  meiaNoite,
  porCliente,
  resumoFinanceiro,
  ROTULO_FILTRO,
  serieMensal,
  statusParcela,
  todasAsParcelas,
  valorRecebidoDe,
  type FiltroParcelas,
  type ParcelaDoContrato,
} from "@/lib/financeiro";
import { registrarEvento } from "@/lib/telemetria";
import { useArquiteto } from "@/lib/arquiteto";
import { usePlano } from "@/lib/plano";
import { CartaoBloqueado, PlanoBloqueado } from "./plano/Bloqueio";
import type { ConfigCobranca, Honorario } from "@/lib/types";
import { RecebimentoDialog, type DadosRecebimento } from "./RecebimentoDialog";
import { CobrancaDialog } from "./CobrancaDialog";
import { Chip } from "./ui/Chip";
import { useConfirm } from "./ConfirmProvider";
import { HonorarioDialog } from "./HonorarioDialog";
import { BotaoOlho } from "./BotaoOlho";
import { Logo } from "./Logo";
import { Painel, tooltipStyle } from "./BudgetCharts";
import { IconeBusca, IconeEditar, IconeLixo, IconeMais, IconeVoltar } from "./Icones";

const DIA = 86_400_000;
const botaoTopo = "btn-topo";

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

function LinhaParcela({
  p,
  hoje,
  onReceber,
  onDesfazer,
  onCobrar,
}: {
  p: ParcelaDoContrato;
  hoje: number;
  onReceber: () => void;
  onDesfazer: () => void;
  onCobrar: () => void;
}) {
  const { brl } = useDinheiro();
  const st = statusParcela(p, hoje);
  const dias = Math.round((p.vencimento - hoje) / DIA);
  const situacao =
    st === "recebida"
      ? { texto: `Recebida em ${data(p.recebidoEm as number)}${p.forma ? ` · ${p.forma}` : ""}`, cor: "text-emerald-700", ponto: "bg-emerald-600" }
      : st === "vencida"
        ? { texto: `Vencida há ${Math.abs(dias)} ${Math.abs(dias) === 1 ? "dia" : "dias"}`, cor: "text-pitanga", ponto: "bg-pitanga" }
        : st === "vence_hoje"
          ? { texto: "Vence hoje", cor: "text-amber-700", ponto: "bg-amber-500" }
          : { texto: `Vence em ${dias} ${dias === 1 ? "dia" : "dias"} · ${data(p.vencimento)}`, cor: "text-ink/55", ponto: "bg-ink/25" };
  const diferenca = st === "recebida" ? Math.round((valorRecebidoDe(p) - p.valor) * 100) / 100 : 0;
  const podeCobrar = st === "vencida" || st === "vence_hoje" || (st === "a_vencer" && dias <= 7);

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
        {diferenca !== 0 && <p className="text-[11px] text-ink/50">{diferenca < 0 ? `Desconto de ${brl(-diferenca)}` : `Juros/multa de ${brl(diferenca)}`}</p>}
      </div>
      <div className="shrink-0 text-right">
        <p className="font-mono text-sm font-semibold tabular-nums text-ink">{brl(st === "recebida" ? valorRecebidoDe(p) : p.valor)}</p>
        {st === "recebida" ? (
          <button onClick={onDesfazer} className="mt-1 text-[11px] font-semibold text-ink/45 hover:text-ink hover:underline">
            Desfazer
          </button>
        ) : (
          <div className="mt-1 flex justify-end gap-1.5">
            {podeCobrar && (
              <button
                onClick={onCobrar}
                aria-label={`Cobrar ${p.projetoNome} pelo WhatsApp`}
                className="btn btn-linha rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider"
              >
                Cobrar
              </button>
            )}
            <button onClick={onReceber} aria-label={`Receber ${p.projetoNome}`} className="btn btn-solido rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider">
              Receber
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

/** Financeiro do escritório: o que há a receber, o que atrasou, cobrança, recebimentos e visão por cliente. */
export function FinanceiroTela() {
  const { user, loading } = useAuth();
  const { itens: honorarios, carregando, salvar, remover } = useColecaoPessoal<Honorario>("honorarios", (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  const { itens: configs, salvar: salvarConfig } = useColecaoPessoal<ConfigCobranca>("configuracoes", (a, b) => a.id.localeCompare(b.id));
  const { perfil } = useArquiteto();
  const { pode } = usePlano();
  const { oculto, brlCompacto, brlInt, brl } = useDinheiro();
  const confirmar = useConfirm();
  // "Hoje" só existe no navegador (0 durante a pré-renderização): o Next não aceita `new Date()` solto na renderização.
  const hoje = useSyncExternalStore(
    () => () => {},
    () => meiaNoite(new Date()),
    () => 0,
  );
  const [dialogo, setDialogo] = useState<{ chave: number; honorario: Honorario | null } | null>(null);
  const [recebendo, setRecebendo] = useState<{ chave: number; parcela: ParcelaDoContrato } | null>(null);
  const [cobrando, setCobrando] = useState<{ chave: number; parcela: ParcelaDoContrato } | null>(null);
  const [verRecebidas, setVerRecebidas] = useState(false);
  const [verTodas, setVerTodas] = useState(false);
  const [visao, setVisao] = useState<"parcelas" | "clientes" | "contratos">("parcelas");
  const [filtro, setFiltro] = useState<FiltroParcelas>("todas");
  const [busca, setBusca] = useState("");

  const parcelas = useMemo(() => todasAsParcelas(honorarios), [honorarios]);
  const resumo = useMemo(() => resumoFinanceiro(honorarios, hoje), [honorarios, hoje]);
  const serie = useMemo(() => serieMensal(honorarios, hoje), [honorarios, hoje]);
  const faixas = useMemo(() => faixasDeAtraso(parcelas, hoje), [parcelas, hoje]);
  const ind = useMemo(() => indicadores(honorarios, hoje), [honorarios, hoje]);
  const clientes = useMemo(() => porCliente(honorarios, hoje), [honorarios, hoje]);
  const contagem = useMemo(() => contagemPorFiltro(parcelas, hoje), [parcelas, hoje]);
  const abertas = parcelas.filter((p) => p.recebidoEm === null);
  const filtradas = useMemo(() => filtrarAbertas(parcelas, filtro, hoje, busca), [parcelas, filtro, hoje, busca]);
  const totalFiltradas = filtradas.reduce((s, p) => s + p.valor, 0);
  const recebidas = parcelas.filter((p) => p.recebidoEm !== null).sort((a, b) => (b.recebidoEm as number) - (a.recebidoEm as number));
  const visiveis = verTodas ? filtradas : filtradas.slice(0, 8);
  const compacto = (v: number) => (oculto ? "" : brlCompacto(v));
  const pixSalvo = configs.find((c) => c.id === "cobranca")?.pix ?? "";
  const totalAtraso = faixas.reduce((s, f) => s + f.valor, 0);

  async function registrarRecebimento(p: ParcelaDoContrato, d: DadosRecebimento) {
    const h = honorarios.find((x) => x.id === p.honorarioId);
    if (!h) return;
    registrarEvento("recebimento_registrado", { forma: d.forma });
    await salvar({
      ...h,
      parcelas: h.parcelas.map((x) =>
        x.id === p.id ? { ...x, recebidoEm: d.recebidoEm, valorRecebido: d.valorRecebido === x.valor ? undefined : d.valorRecebido, forma: d.forma, obs: d.obs || undefined } : x,
      ),
    });
  }

  async function desfazer(p: ParcelaDoContrato) {
    const h = honorarios.find((x) => x.id === p.honorarioId);
    if (!h) return;
    await salvar({
      ...h,
      parcelas: h.parcelas.map((x) => {
        if (x.id !== p.id) return x;
        const base = { ...x, recebidoEm: null };
        delete base.valorRecebido;
        delete base.forma;
        delete base.obs;
        return base;
      }),
    });
  }

  async function guardarCobranca(p: ParcelaDoContrato, d: { telefone: string; pix: string }) {
    const h = honorarios.find((x) => x.id === p.honorarioId);
    if (h && d.telefone !== (h.telefone ?? "")) await salvar({ ...h, telefone: d.telefone || undefined });
    if (d.pix !== pixSalvo) await salvarConfig({ id: "cobranca", pix: d.pix });
  }

  function exportar() {
    registrarEvento("financeiro_exportado");
    const blob = new Blob([csvParcelas(parcelas, hoje)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Financeiro - parcelas - ${new Date().toLocaleDateString("sv-SE")}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
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

  if (!pode("financeiro")) {
    return (
      <div className="grade min-h-dvh">
        <header className="rounded-b-[32px] bg-pitanga pb-8 text-white">
          <div className="mx-auto max-w-3xl px-4 pt-4">
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className={botaoTopo} aria-label="Voltar ao painel" title="Voltar ao painel">
                <IconeVoltar />
              </Link>
              <Logo claro />
              <span className="h-10 w-10" />
            </div>
            <p className="rotulo-tec mt-6 text-white/85">Financeiro do escritório</p>
            <h1 className="mt-1 text-3xl font-semibold leading-tight tracking-tight">Honorários</h1>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 pb-24 pt-8">
          <PlanoBloqueado recurso="financeiro" />
        </main>
      </div>
    );
  }

  const completo = pode("financeiroCompleto");
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

        {comCartoes && !completo && <CartaoBloqueado recurso="financeiroCompleto" />}

        {comCartoes && completo && (
          <section aria-label="Indicadores" className="prancha grid grid-cols-3 divide-x divide-linha p-1">
            <div className="p-3">
              <p className="rotulo-tec text-ink/50">Previsão 90 dias</p>
              <p className="mt-1 font-mono text-[15px] font-semibold tabular-nums text-ink sm:text-lg">{brlInt(ind.previsao90)}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-ink/50">ainda vai vencer</p>
            </div>
            <div className="p-3">
              <p className="rotulo-tec text-ink/50">Média mensal</p>
              <p className="mt-1 font-mono text-[15px] font-semibold tabular-nums text-ink sm:text-lg">{brlInt(ind.mediaMensal)}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-ink/50">recebida nos últimos 3 meses</p>
            </div>
            <div className="p-3">
              <p className="rotulo-tec text-ink/50">Inadimplência</p>
              <p className={`mt-1 font-mono text-[15px] font-semibold tabular-nums sm:text-lg ${ind.inadimplencia > 0 ? "text-pitanga" : "text-emerald-700"}`}>{ind.inadimplencia}%</p>
              <p className="mt-0.5 text-[11px] leading-snug text-ink/50">do que já venceu</p>
            </div>
          </section>
        )}

        {honorarios.length === 0 && !carregando && (
          <div className="prancha px-6 py-12 text-center">
            <p className="text-lg font-semibold text-ink">Nenhum honorário ainda</p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-ink/60">Registre o contrato de um projeto, divida em parcelas e marque cada uma como recebida.</p>
          </div>
        )}

        {completo && totalAtraso > 0 && (
          <section aria-label="Atrasos por tempo" className="prancha p-4">
            <p className="rotulo-tec text-ink/50">Atrasos por tempo</p>
            <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-ink/10" role="img" aria-label={`${brlInt(totalAtraso)} em atraso, por faixa de dias`}>
              {faixas.map((f, i) =>
                f.valor > 0 ? <div key={f.rotulo} className={["bg-amber-400", "bg-amber-500", "bg-pitanga/80", "bg-pitanga-escuro"][i]} style={{ width: `${(f.valor / totalAtraso) * 100}%` }} title={`${f.rotulo}: ${brl(f.valor)}`} /> : null,
              )}
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs sm:grid-cols-4">
              {faixas.map((f, i) => (
                <li key={f.rotulo} className="flex items-start gap-2">
                  <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${["bg-amber-400", "bg-amber-500", "bg-pitanga/80", "bg-pitanga-escuro"][i]}`} aria-hidden />
                  <span>
                    <span className="block text-ink/55">{f.rotulo}</span>
                    <span className="font-mono font-semibold tabular-nums text-ink">{brlInt(f.valor)}</span>
                    <span className="text-ink/45"> · {f.qtd}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {comCartoes && completo && (
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

        {comCartoes && (
          <div className="inline-flex rounded-full bg-ink/[0.07] p-1" role="tablist" aria-label="Visões do financeiro">
            {(
              [
                ["parcelas", "Parcelas"],
                ["clientes", "Por cliente"],
                ["contratos", "Contratos"],
              ] as const
            ).map(([v, rot]) => (
              <button
                key={v}
                role="tab"
                aria-selected={visao === v}
                onClick={() => setVisao(v)}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${visao === v ? "bg-ink text-white" : "text-ink/60 hover:text-ink"}`}
              >
                {rot}
              </button>
            ))}
          </div>
        )}

        {comCartoes && visao === "parcelas" && (
          <>
            <section aria-label="Parcelas a receber">
              <div className="mb-3 flex items-center gap-3">
                <h2 className="text-xl font-semibold text-ink">A receber</h2>
                <span className="h-px flex-1 bg-linha" />
                <button onClick={exportar} className="font-mono text-[11px] font-semibold uppercase tracking-wider text-pitanga hover:underline">
                  Exportar planilha
                </button>
              </div>

              <div className="mb-3 space-y-2.5">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40">
                    <IconeBusca />
                  </span>
                  <label htmlFor="fin-busca" className="sr-only">Buscar parcela</label>
                  <input id="fin-busca" className="input-pit input-pit-busca" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por cliente, projeto ou parcela…" autoComplete="off" />
                </div>
                <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Filtrar por prazo">
                  {(Object.keys(ROTULO_FILTRO) as FiltroParcelas[]).map((f) => (
                    <button
                      key={f}
                      aria-pressed={filtro === f}
                      onClick={() => {
                        setFiltro(f);
                        setVerTodas(false);
                      }}
                      className={`clicavel shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        filtro === f ? "border-ink bg-ink text-white" : f === "vencidas" && contagem.vencidas > 0 ? "border-pitanga/50 bg-white text-pitanga-escuro hover:border-pitanga" : "border-ink/20 bg-white text-ink/70 hover:border-ink/50"
                      }`}
                    >
                      {ROTULO_FILTRO[f]} <span className="font-mono opacity-70">{contagem[f]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {filtradas.length === 0 ? (
                <p className="prancha px-4 py-8 text-center text-sm text-ink/55">
                  {abertas.length === 0 ? "Tudo recebido. Nenhuma parcela em aberto." : "Nenhuma parcela neste filtro."}
                </p>
              ) : (
                <>
                  <p className="mb-2 text-xs text-ink/55" aria-live="polite">
                    {filtradas.length} {filtradas.length === 1 ? "parcela" : "parcelas"} · <span className="font-mono font-semibold text-ink">{brl(totalFiltradas)}</span>
                  </p>
                  <ul className="prancha divide-y divide-linha overflow-hidden">
                    {visiveis.map((p) => (
                      <LinhaParcela
                        key={p.id}
                        p={p}
                        hoje={hoje}
                        onReceber={() => setRecebendo({ chave: Date.now(), parcela: p })}
                        onDesfazer={() => desfazer(p)}
                        onCobrar={() => setCobrando({ chave: Date.now(), parcela: p })}
                      />
                    ))}
                  </ul>
                  {filtradas.length > 8 && (
                    <button onClick={() => setVerTodas((v) => !v)} className="mt-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-pitanga hover:underline">
                      {verTodas ? "Mostrar menos" : `Ver todas (${filtradas.length})`}
                    </button>
                  )}
                </>
              )}
            </section>

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
                      <LinhaParcela key={p.id} p={p} hoje={hoje} onReceber={() => undefined} onDesfazer={() => desfazer(p)} onCobrar={() => undefined} />
                    ))}
                  </ul>
                )}
              </section>
            )}
          </>
        )}

        {comCartoes && visao === "clientes" && (
          <section aria-label="Por cliente">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-xl font-semibold text-ink">Quem me deve</h2>
              <span className="h-px flex-1 bg-linha" />
            </div>
            <ul className="space-y-3">
              {clientes.map((c) => {
                const pct = c.contratado > 0 ? Math.round((c.recebido / c.contratado) * 100) : 0;
                return (
                  <li key={c.cliente} className="prancha p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-ink">{c.cliente}</p>
                        <p className="text-xs text-ink/55">{c.contratos} {c.contratos === 1 ? "contrato" : "contratos"} · {brlInt(c.contratado)} contratado</p>
                      </div>
                      {c.vencido > 0 ? <Chip tom="perigo">Atrasado {brlInt(c.vencido)}</Chip> : c.aReceber > 0 ? <Chip tom="info">Em dia</Chip> : <Chip tom="ok">Quitado</Chip>}
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10" role="img" aria-label={`${pct}% recebido`}>
                      <div className="h-full rounded-full bg-emerald-600" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1.5 flex justify-between text-xs text-ink/55">
                      <span>
                        Recebido <span className="font-mono">{brlInt(c.recebido)}</span>
                      </span>
                      <span>
                        Falta <span className="font-mono font-semibold text-ink">{brlInt(c.aReceber)}</span>
                      </span>
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {comCartoes && visao === "contratos" && (
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
      {recebendo && (
        <RecebimentoDialog key={recebendo.chave} parcela={recebendo.parcela} onFechar={() => setRecebendo(null)} onConfirmar={(d) => registrarRecebimento(recebendo.parcela, d)} />
      )}
      {cobrando && (
        <CobrancaDialog
          key={cobrando.chave}
          parcela={cobrando.parcela}
          hoje={hoje}
          telefoneInicial={honorarios.find((h) => h.id === cobrando.parcela.honorarioId)?.telefone ?? ""}
          pixInicial={pixSalvo}
          escritorio={perfil.escritorio}
          onFechar={() => setCobrando(null)}
          onGuardar={(d) => guardarCobranca(cobrando.parcela, d)}
        />
      )}
    </div>
  );
}
