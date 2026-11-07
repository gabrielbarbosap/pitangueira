"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useDinheiro } from "@/lib/privacidade";
import { statusGrupo, type Grupo, type Resumo } from "@/lib/calc";
import type { Item } from "@/lib/types";

const CORES = [
  "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#14b8a6", "#ec4899", "#84cc16",
  "#f97316", "#6366f1", "#06b6d4", "#d946ef", "#eab308", "#22c55e", "#f43f5e", "#3b82f6",
];

const tooltipStyle = { borderRadius: 0, border: "1px solid #14110f", fontSize: 13, boxShadow: "3px 3px 0 0 #14110f" } as const;

function corte(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function Painel({
  titulo,
  subtitulo,
  altura,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  altura: number;
  children: React.ReactNode;
}) {
  return (
    <div className="prancha p-5">
      <h3 className="rotulo-tec text-ink">{titulo}</h3>
      {subtitulo && <p className="mb-2 mt-1 text-xs text-ink/50">{subtitulo}</p>}
      <div style={{ height: altura }} className="mt-2 w-full">
        {children}
      </div>
    </div>
  );
}

const rotuloPct = ({ percent }: { percent?: number }) =>
  percent && percent > 0.03 ? `${Math.round(percent * 100)}%` : "";

/** Rosca: composição do orçamento (todas as etapas/ambientes). Detalhe só no hover. */
export function ChartComposicao({ grupos }: { grupos: Grupo[] }) {
  const { brl } = useDinheiro();
  if (grupos.length === 0) return null;
  const dados = [...grupos]
    .sort((a, b) => b.orcado - a.orcado)
    .map((g) => ({ name: g.nome, value: Math.round(g.orcado) }));
  const total = grupos.reduce((s, g) => s + g.orcado, 0);

  return (
    <Painel titulo="Composição do orçamento" subtitulo={`Total orçado: ${brl(total)} · passe o mouse nas fatias`} altura={360}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={dados} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" innerRadius="55%" paddingAngle={2} label={rotuloPct} labelLine={false} style={{ fontSize: 12 }}>
            {dados.map((_, i) => (
              <Cell key={i} fill={CORES[i % CORES.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => brl(Number(v))} contentStyle={tooltipStyle} />
        </PieChart>
      </ResponsiveContainer>
    </Painel>
  );
}

/** Barras horizontais: orçamento por grupo, com a parte paga em verde. */
export function ChartAndamento({ grupos, titulo }: { grupos: Grupo[]; titulo: string }) {
  const { oculto, brl, brlCompacto } = useDinheiro();
  // Escondido: eixo e rótulos de valor ficam vazios (a máscara repetida só poluiria).
  const compacto = (v: number) => (oculto ? "" : brlCompacto(v));
  if (grupos.length === 0) return null;
  const dados = [...grupos]
    .sort((a, b) => b.previsto - a.previsto)
    .map((g) => ({
      nome: g.nome,
      Pago: Math.round(g.pago),
      "A pagar": Math.max(0, Math.round(g.previsto - g.pago)),
      total: Math.round(g.previsto),
    }));
  const altura = Math.max(300, grupos.length * 34);

  return (
    <Painel titulo={titulo} subtitulo="Cada barra é o orçamento — a parte verde é o que já foi pago." altura={altura}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} layout="vertical" margin={{ left: 8, right: 64, top: 4, bottom: 4 }} barCategoryGap="22%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" horizontal={false} />
          <XAxis type="number" tickFormatter={compacto} tick={{ fontSize: 10, fill: "#a8a29e" }} />
          <YAxis type="category" dataKey="nome" tickFormatter={(v: string) => corte(v, 24)} tick={{ fontSize: 11, fill: "#57534e" }} width={160} />
          <Tooltip formatter={(v) => brl(Number(v))} contentStyle={tooltipStyle} cursor={{ fill: "#faf9f7" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Pago" stackId="a" fill="#10b981" />
          <Bar dataKey="A pagar" stackId="a" fill="#e7e5e4" radius={[0, 4, 4, 0]}>
            <LabelList dataKey="total" position="right" formatter={(v) => compacto(Number(v))} style={{ fontSize: 11, fill: "#78716c" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Painel>
  );
}

/** Rosca: visão financeira geral (pago x a pagar). */
export function ChartPagoApagar({ resumo }: { resumo: Resumo }) {
  const { brl } = useDinheiro();
  const dados = [
    { name: "Pago", value: Math.round(resumo.pagoTotal), cor: "#10b981" },
    { name: "A pagar", value: Math.max(0, Math.round(resumo.faltaPagar)), cor: "#e7e5e4" },
  ];
  return (
    <Painel titulo="Pago × A pagar" subtitulo={`Projeção de custo: ${brl(resumo.previstoTotal)}`} altura={320}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={dados} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" innerRadius="55%" paddingAngle={2} label={rotuloPct} labelLine={false} style={{ fontSize: 13 }}>
            {dados.map((d, i) => (
              <Cell key={i} fill={d.cor} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => brl(Number(v))} contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </Painel>
  );
}

/** Rosca: quantas etapas estão pendentes / em progresso / concluídas. */
export function ChartStatus({ grupos }: { grupos: Grupo[] }) {
  if (grupos.length === 0) return null;
  const contagem = { pendente: 0, progresso: 0, finalizado: 0 };
  for (const g of grupos) contagem[statusGrupo(g)] += 1;
  const dados = [
    { name: "Pendente", value: contagem.pendente, cor: "#d6d3d1" },
    { name: "Em progresso", value: contagem.progresso, cor: "#fbbf24" },
    { name: "Concluído", value: contagem.finalizado, cor: "#10b981" },
  ].filter((d) => d.value > 0);

  return (
    <Painel titulo="Status das etapas" subtitulo={`${grupos.length} etapas no total`} altura={320}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={dados} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" innerRadius="55%" paddingAngle={2} label={({ value }) => `${value}`} labelLine={false} style={{ fontSize: 13 }}>
            {dados.map((d, i) => (
              <Cell key={i} fill={d.cor} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => `${Number(v)} etapa(s)`} contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </Painel>
  );
}

/** Barras: os 10 itens mais caros do orçamento. */
export function ChartTopItens({ itens }: { itens: Item[] }) {
  const { oculto, brl, brlCompacto } = useDinheiro();
  const compacto = (v: number) => (oculto ? "" : brlCompacto(v));
  if (itens.length === 0) return null;
  const dados = [...itens]
    .sort((a, b) => b.valorOrcado - a.valorOrcado)
    .slice(0, 10)
    .map((i) => ({ nome: i.descricao, valor: Math.round(i.valorOrcado) }));

  return (
    <Painel titulo="Top 10 itens mais caros" subtitulo="Onde estão os maiores valores individuais." altura={400}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} layout="vertical" margin={{ left: 8, right: 64, top: 4, bottom: 4 }} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" horizontal={false} />
          <XAxis type="number" tickFormatter={compacto} tick={{ fontSize: 10, fill: "#a8a29e" }} />
          <YAxis type="category" dataKey="nome" tickFormatter={(v: string) => corte(v, 26)} tick={{ fontSize: 11, fill: "#57534e" }} width={170} />
          <Tooltip formatter={(v) => brl(Number(v))} contentStyle={tooltipStyle} cursor={{ fill: "#faf9f7" }} />
          <Bar dataKey="valor" name="Orçado" fill="#0ea5e9" radius={[0, 4, 4, 0]}>
            <LabelList dataKey="valor" position="right" formatter={(v) => compacto(Number(v))} style={{ fontSize: 11, fill: "#78716c" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Painel>
  );
}
