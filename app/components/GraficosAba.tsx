"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  ResponsiveContainer,
  Treemap,
  Tooltip,
  ComposedChart,
  Bar,
  Line,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
} from "recharts";
import { useDinheiro } from "@/lib/privacidade";
import { agruparPor, type Grupo } from "@/lib/calc";
import { desvios, fatos, pipelineDinheiro, serieDePagamentos } from "@/lib/graficos";
import type { Config, Item } from "@/lib/types";
import { ChartAndamento, ChartTopItens, Painel, corte, tooltipStyle } from "./BudgetCharts";

const PITANGA = "#d23a1f";
const TINTA = "#14110f";
const VERDE = "#059669";

function Secao({ titulo, texto, children }: { titulo: string; texto?: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold text-ink">{titulo}</h2>
        {texto && <p className="mt-0.5 text-[13px] leading-snug text-ink/55">{texto}</p>}
      </div>
      {children}
    </section>
  );
}

/** Mensagem curta quando um gráfico ainda não tem dados. */
function SemDados({ children }: { children: ReactNode }) {
  return <p className="prancha px-4 py-8 text-center text-sm leading-snug text-ink/55">{children}</p>;
}

// ---------- 1. Leitura rápida ----------

function CartaoFato({ rotulo, destaque, texto, tom }: { rotulo: string; destaque: string; texto: string; tom: "neutro" | "bom" | "alerta" }) {
  const cor = tom === "alerta" ? "text-pitanga" : tom === "bom" ? "text-emerald-700" : "text-ink";
  const ponto = tom === "alerta" ? "bg-pitanga" : tom === "bom" ? "bg-emerald-600" : "bg-ink/30";
  return (
    <div className="prancha p-4 odd:last:col-span-2">
      <p className="rotulo-tec flex items-center gap-1.5 text-ink/50">
        <span className={`h-1.5 w-1.5 rounded-full ${ponto}`} aria-hidden />
        {rotulo}
      </p>
      <p className={`mt-2 text-[19px] font-semibold leading-snug tracking-tight ${cor}`}>{destaque}</p>
      <p className="mt-1 text-xs leading-snug text-ink/55">{texto}</p>
    </div>
  );
}

function LeituraRapida({ itens, config, gruposEtapa }: { itens: Item[]; config: Config; gruposEtapa: Grupo[] }) {
  const { brlInt } = useDinheiro();
  const f = useMemo(() => fatos(itens, config, gruposEtapa), [itens, config, gruposEtapa]);
  const abs = Math.abs;

  return (
    <div className="grid grid-cols-2 gap-3">
      {f.maiorEtapa && (
        <CartaoFato rotulo="Maior fatia" destaque={corte(f.maiorEtapa.nome, 34)} texto={`concentra ${f.maiorEtapa.pct}% do orçamento`} tom="neutro" />
      )}
      <CartaoFato
        rotulo="Feito, falta pagar"
        destaque={f.feitoAPagar.qtd > 0 ? brlInt(f.feitoAPagar.valor) : "Em dia"}
        texto={f.feitoAPagar.qtd > 0 ? `${f.feitoAPagar.qtd} ${f.feitoAPagar.qtd === 1 ? "item entregue" : "itens entregues"} aguardando pagamento` : "nenhum serviço feito aguardando pagamento"}
        tom={f.feitoAPagar.qtd > 0 ? "alerta" : "bom"}
      />
      {f.teto.definido ? (
        <CartaoFato
          rotulo="Projeção × teto"
          destaque={f.teto.folga >= 0 ? brlInt(f.teto.folga) : brlInt(abs(f.teto.folga))}
          texto={f.teto.folga >= 0 ? "de folga no teto do projeto" : "acima do teto do projeto"}
          tom={f.teto.folga >= 0 ? "bom" : "alerta"}
        />
      ) : (
        <CartaoFato rotulo="Projeção × teto" destaque="Teto não definido" texto="defina o orçamento disponível em Ajustes do projeto" tom="neutro" />
      )}
      <CartaoFato
        rotulo="Real × orçado"
        destaque={abs(f.desvio.total) < 1 ? "No orçado" : brlInt(abs(f.desvio.total))}
        texto={abs(f.desvio.total) < 1 ? "o custo previsto bate com a planilha" : `${f.desvio.total > 0 ? "acima" : "abaixo"} do orçado (${f.desvio.pct > 0 ? "+" : "−"}${abs(f.desvio.pct).toFixed(1).replace(".", ",")}%)`}
        tom={abs(f.desvio.total) < 1 ? "neutro" : f.desvio.total > 0 ? "alerta" : "bom"}
      />
      {f.maisAdiantada && (
        <CartaoFato rotulo="Mais adiantada" destaque={corte(f.maisAdiantada.nome, 34)} texto={`${f.maisAdiantada.pct}% dos itens concluídos`} tom="bom" />
      )}
    </div>
  );
}

// ---------- 2. Orçamento em foco ----------

function OrcamentoEmFoco({ itens, config }: { itens: Item[]; config: Config }) {
  const { brlInt } = useDinheiro();
  const { previsto, pago } = useMemo(() => {
    const r = pipelineDinheiro(itens);
    const total = r.reduce((s, x) => s + x.valor, 0);
    const pg = r.filter((x) => x.chave === "concluido" || x.chave === "pagoAExecutar").reduce((s, x) => s + x.valor, 0);
    return { previsto: total, pago: pg };
  }, [itens]);
  const teto = config.orcamentoTotal;
  const max = Math.max(teto, previsto, pago) * 1.06 || 1;
  const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`;
  const estourou = teto > 0 && previsto > teto;

  const linhas = [
    { rotulo: "Projeção de custo", valor: previsto, cor: estourou ? "bg-pitanga" : "bg-ink" },
    { rotulo: "Já pago", valor: pago, cor: "bg-emerald-600" },
  ];

  return (
    <div className="prancha p-5">
      <div className="relative">
        {/* Marcador do teto, atravessando as barras */}
        {teto > 0 && (
          <div className="pointer-events-none absolute inset-y-0 z-10 border-l-2 border-dashed border-pitanga" style={{ left: pct(teto) }}>
            <span
              className={`absolute -top-0.5 -translate-y-full whitespace-nowrap rounded-full bg-pitanga px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white ${
                teto / max > 0.55 ? "right-1.5" : "left-1.5"
              }`}
            >
              Teto {brlInt(teto)}
            </span>
          </div>
        )}
        <div className={`space-y-5 ${teto > 0 ? "pt-7" : ""}`}>
          {linhas.map((l) => (
            <div key={l.rotulo}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3">
                <span className="text-sm text-ink/75">{l.rotulo}</span>
                <span className="font-mono text-sm font-semibold tabular-nums text-ink">{brlInt(l.valor)}</span>
              </div>
              <div className="h-4 rounded-full bg-ink/[0.07]">
                <div className={`h-4 rounded-full ${l.cor} transition-[width] duration-700`} style={{ width: pct(l.valor) }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-4 text-xs leading-snug text-ink/50">
        {teto <= 0
          ? "Defina o orçamento disponível em Ajustes do projeto para ver o teto na escala."
          : estourou
            ? "A projeção passou da linha do teto."
            : "A projeção cabe dentro do teto."}
      </p>
    </div>
  );
}

// ---------- 3. Onde está o dinheiro ----------

const COR_FASE = { concluido: "bg-emerald-600", feitoAPagar: "bg-amber-500", pagoAExecutar: "bg-sky-500", naoIniciado: "bg-ink/20" } as const;

function OndeEstaODinheiro({ itens }: { itens: Item[] }) {
  const { brlInt } = useDinheiro();
  const fases = useMemo(() => pipelineDinheiro(itens), [itens]);
  const total = fases.reduce((s, f) => s + f.valor, 0) || 1;

  return (
    <div className="prancha p-5">
      <div className="flex h-5 gap-0.5 overflow-hidden rounded-full" role="img" aria-label="Divisão do dinheiro do projeto por situação">
        {fases
          .filter((f) => f.valor > 0)
          .map((f) => (
            <div key={f.chave} className={`${COR_FASE[f.chave]} transition-[width] duration-700`} style={{ width: `${(f.valor / total) * 100}%` }} title={`${f.rotulo}: ${Math.round((f.valor / total) * 100)}%`} />
          ))}
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {fases.map((f) => (
          <li key={f.chave} className="flex items-start gap-2.5">
            <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${COR_FASE[f.chave]}`} aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-medium leading-tight text-ink">
                {f.rotulo} <span className="font-mono text-xs font-normal text-ink/45">{Math.round((f.valor / total) * 100)}%</span>
              </p>
              <p className="mt-0.5 text-xs text-ink/55">
                <span className="font-mono">{brlInt(f.valor)}</span> · {f.qtd} {f.qtd === 1 ? "item" : "itens"}
              </p>
              <p className="text-[11px] text-ink/40">{f.dica}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- 4. Para onde vai o dinheiro (mapa em blocos) ----------

interface BlocoProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  index?: number;
  name?: string;
  pct?: number;
  total?: number;
}

/** Cor do bloco: do pitanga (maior) ao tom claro (menor). */
function corBloco(i: number, n: number): { fundo: string; texto: string } {
  const t = n <= 1 ? 0 : i / (n - 1);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
  const fundo = `rgb(${mix(210, 246)}, ${mix(58, 217)}, ${mix(31, 209)})`;
  return { fundo, texto: t < 0.45 ? "#ffffff" : TINTA };
}

function Bloco({ x = 0, y = 0, width = 0, height = 0, index = 0, name = "", pct = 0, total = 1 }: BlocoProps) {
  const { fundo, texto } = corBloco(index, total);
  const cabeTexto = width > 74 && height > 38;
  // Cada letra (bold 12px, muitas vezes em caixa alta) ocupa ~8,6px; deixa folga das bordas.
  const maxChars = Math.max(4, Math.floor((width - 20) / 8.6));
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={10} fill={fundo} stroke="#ffffff" strokeWidth={3} />
      {cabeTexto && (
        <>
          <text x={x + 10} y={y + 22} fill={texto} fontSize={12} fontWeight={600}>
            {corte(name, maxChars)}
          </text>
          <text x={x + 10} y={y + 38} fill={texto} fontSize={11} opacity={0.85} fontFamily="var(--font-geist-mono), monospace">
            {pct}%
          </text>
        </>
      )}
    </g>
  );
}

function MapaDoDinheiro({ gruposEtapa, gruposAmbiente }: { gruposEtapa: Grupo[]; gruposAmbiente: Grupo[] }) {
  const { brl } = useDinheiro();
  const [por, setPor] = useState<"etapa" | "ambiente">("etapa");
  const grupos = por === "etapa" ? gruposEtapa : gruposAmbiente;

  const dados = useMemo(() => {
    const ordenados = [...grupos].filter((g) => g.previsto > 0).sort((a, b) => b.previsto - a.previsto);
    const soma = ordenados.reduce((s, g) => s + g.previsto, 0) || 1;
    return ordenados.map((g, i) => ({ name: g.nome, size: Math.round(g.previsto), pct: Math.round((g.previsto / soma) * 100), index: i, total: ordenados.length }));
  }, [grupos]);

  return (
    <div className="prancha p-5">
      <div className="mb-3 inline-flex rounded-full bg-ink/[0.07] p-1" role="tablist" aria-label="Agrupar o mapa">
        {(["etapa", "ambiente"] as const).map((v) => (
          <button
            key={v}
            role="tab"
            aria-selected={por === v}
            onClick={() => setPor(v)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${por === v ? "bg-ink text-white" : "text-ink/60 hover:text-ink"}`}
          >
            {v}
          </button>
        ))}
      </div>
      {dados.length === 0 ? (
        <p className="py-8 text-center text-sm text-ink/55">Sem valores para mostrar.</p>
      ) : (
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap data={dados} dataKey="size" nameKey="name" isAnimationActive={false} content={<Bloco />}>
              <Tooltip
                content={({ active, payload }) => {
                  const p = active ? (payload?.[0]?.payload as { name: string; size: number; pct: number } | undefined) : undefined;
                  if (!p) return null;
                  return (
                    <div style={tooltipStyle} className="bg-white px-3 py-2">
                      <p className="max-w-[240px] text-[13px] font-semibold leading-snug text-ink">{p.name}</p>
                      <p className="mt-0.5 font-mono text-xs text-ink/65">
                        {brl(p.size)} · {p.pct}% do orçamento
                      </p>
                    </div>
                  );
                }}
              />
            </Treemap>
          </ResponsiveContainer>
        </div>
      )}
      <p className="mt-2 text-xs text-ink/50">Quanto maior o bloco, maior a fatia do orçamento. Passe o mouse ou toque para ver os valores.</p>
    </div>
  );
}

// ---------- 5. Ritmo de pagamento ----------

function RitmoDePagamento({ itens }: { itens: Item[] }) {
  const { oculto, brl, brlCompacto } = useDinheiro();
  const { pontos, semData } = useMemo(() => serieDePagamentos(itens), [itens]);
  const compacto = (v: number) => (oculto ? "" : brlCompacto(v));

  if (pontos.length === 0) {
    return (
      <SemDados>
        Quando itens forem marcados como pagos, o ritmo de pagamento aparece aqui, mês a mês.
        {semData > 0 && " Os pagamentos já registrados antes não têm data, por isso ficam de fora."}
      </SemDados>
    );
  }

  return (
    <Painel titulo="Pago por mês e acumulado" subtitulo="As barras são o que saiu em cada mês; a linha é o total já pago." altura={280}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={pontos} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" vertical={false} />
          <XAxis dataKey="rotulo" tick={{ fontSize: 11, fill: "#57534e" }} />
          <YAxis tickFormatter={compacto} tick={{ fontSize: 10, fill: "#a8a29e" }} width={56} />
          <Tooltip formatter={(v) => brl(Number(v))} contentStyle={tooltipStyle} cursor={{ fill: "#faf9f7" }} />
          <Bar dataKey="mensal" name="No mês" fill={PITANGA} radius={[6, 6, 0, 0]} maxBarSize={44} />
          <Line dataKey="acumulado" name="Acumulado" stroke={TINTA} strokeWidth={2.5} dot={{ r: 3.5, fill: TINTA }} type="monotone" />
        </ComposedChart>
      </ResponsiveContainer>
      {semData > 0 && <p className="mt-2 text-xs text-ink/45">Pagamentos sem data registrada não entram neste gráfico.</p>}
    </Painel>
  );
}

// ---------- 6. Estouros e economias ----------

function EstourosEEconomias({ gruposEtapa }: { gruposEtapa: Grupo[] }) {
  const { oculto, brl, brlCompacto } = useDinheiro();
  const lista = useMemo(() => desvios(gruposEtapa).slice(0, 12), [gruposEtapa]);
  const compacto = (v: number) => (oculto ? "" : `${v > 0 ? "+" : "−"}${brlCompacto(Math.abs(v))}`);

  if (lista.length === 0) {
    return <SemDados>Tudo no orçado: nenhuma etapa tem valor real diferente do que a planilha previa.</SemDados>;
  }

  return (
    <Painel
      titulo="Real × orçado por etapa"
      subtitulo="Em laranja, etapas que custam mais do que o orçado. Em verde, as que custam menos."
      altura={Math.max(260, lista.length * 38)}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={lista} layout="vertical" margin={{ left: 8, right: 64, top: 4, bottom: 4 }} barCategoryGap="22%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" horizontal={false} />
          {/* Folga dos dois lados para os rótulos das barras não invadirem os nomes nem o limite do gráfico. */}
          {/* Sem eixo de valores: cada barra já traz o seu rótulo, e as marcas automáticas não caem no zero. */}
          <XAxis type="number" hide domain={[(min: number) => Math.min(min * 1.7, -1), (max: number) => Math.max(max * 1.3, 1)]} />
          <YAxis type="category" dataKey="nome" tickFormatter={(v: string) => corte(v, 20)} tick={{ fontSize: 11, fill: "#57534e" }} width={140} tickLine={false} />
          <Tooltip formatter={(v) => brl(Number(v))} contentStyle={tooltipStyle} cursor={{ fill: "#faf9f7" }} />
          <ReferenceLine x={0} stroke={TINTA} />
          <Bar dataKey="diff" name="Diferença" radius={4}>
            {lista.map((d) => (
              <Cell key={d.nome} fill={d.diff > 0 ? PITANGA : VERDE} />
            ))}
            <LabelList dataKey="diff" position="right" formatter={(v) => compacto(Number(v))} style={{ fontSize: 11, fill: "#78716c" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Painel>
  );
}

// ---------- A aba ----------

export function AbaGraficos({ itens, config }: { itens: Item[]; config: Config }) {
  const gruposEtapa = useMemo(() => agruparPor(itens, "etapa"), [itens]);
  const gruposAmbiente = useMemo(() => agruparPor(itens, "ambiente"), [itens]);

  return (
    <div className="space-y-8">
      <Secao titulo="Leitura rápida" texto="Os pontos que mais merecem sua atenção agora.">
        <LeituraRapida itens={itens} config={config} gruposEtapa={gruposEtapa} />
      </Secao>

      <Secao titulo="Orçamento em foco" texto="Teto, custo projetado e o que já foi pago, na mesma escala.">
        <OrcamentoEmFoco itens={itens} config={config} />
      </Secao>

      <Secao titulo="Onde está o dinheiro" texto="O valor do projeto dividido pela situação de cada item.">
        <OndeEstaODinheiro itens={itens} />
      </Secao>

      <Secao titulo="Para onde vai o dinheiro" texto="O tamanho de cada bloco mostra quanto pesa no orçamento.">
        <MapaDoDinheiro gruposEtapa={gruposEtapa} gruposAmbiente={gruposAmbiente} />
      </Secao>

      <Secao titulo="Ritmo de pagamento" texto="Quanto saiu a cada mês e quanto já foi pago no total.">
        <RitmoDePagamento itens={itens} />
      </Secao>

      <Secao titulo="Estouros e economias" texto="Onde o custo real se afastou do que a planilha previa.">
        <EstourosEEconomias gruposEtapa={gruposEtapa} />
      </Secao>

      <Secao titulo="Andamento" texto="Quanto de cada etapa e de cada ambiente já foi pago.">
        <div className="space-y-4">
          <ChartAndamento grupos={gruposEtapa} titulo="Por etapa" />
          <ChartAndamento grupos={gruposAmbiente} titulo="Por ambiente" />
        </div>
      </Secao>

      <Secao titulo="Maiores itens" texto="Onde estão os maiores valores individuais.">
        <ChartTopItens itens={itens} />
      </Secao>
    </div>
  );
}
