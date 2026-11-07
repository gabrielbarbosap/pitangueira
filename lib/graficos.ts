// Cálculos dos gráficos da obra (separados dos componentes para ficarem simples de ler e testar).
import type { Config, Item } from "./types";
import { valorEfetivo, type Grupo } from "./calc";

/** Em que ponto está cada item: o dinheiro da obra dividido pelo que já aconteceu com ele. */
export interface FaseDinheiro {
  chave: "concluido" | "feitoAPagar" | "pagoAExecutar" | "naoIniciado";
  rotulo: string;
  dica: string;
  valor: number;
  qtd: number;
}

export function pipelineDinheiro(itens: Item[]): FaseDinheiro[] {
  const fases: FaseDinheiro[] = [
    { chave: "concluido", rotulo: "Concluído", dica: "Feito e pago", valor: 0, qtd: 0 },
    { chave: "feitoAPagar", rotulo: "Feito, falta pagar", dica: "Serviço entregue, pagamento pendente", valor: 0, qtd: 0 },
    { chave: "pagoAExecutar", rotulo: "Pago, falta executar", dica: "Já pago, serviço ainda não feito", valor: 0, qtd: 0 },
    { chave: "naoIniciado", rotulo: "Não iniciado", dica: "Nem feito nem pago", valor: 0, qtd: 0 },
  ];
  const por = Object.fromEntries(fases.map((f) => [f.chave, f]));
  for (const i of itens) {
    const f = i.feito && i.pago ? por.concluido : i.feito ? por.feitoAPagar : i.pago ? por.pagoAExecutar : por.naoIniciado;
    f.valor += valorEfetivo(i);
    f.qtd += 1;
  }
  return fases;
}

/** Diferença entre o previsto (real quando houver) e o orçado, por grupo. Positivo = estourou. */
export interface Desvio {
  nome: string;
  orcado: number;
  previsto: number;
  diff: number;
}

export function desvios(grupos: Grupo[]): Desvio[] {
  return grupos
    .map((g) => ({ nome: g.nome, orcado: g.orcado, previsto: g.previsto, diff: Math.round(g.previsto - g.orcado) }))
    .filter((d) => Math.abs(d.diff) >= 1)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
}

export interface PontoMensal {
  /** AAAA-MM, para ordenar. */
  mes: string;
  rotulo: string;
  mensal: number;
  acumulado: number;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/** Quanto foi pago a cada mês (pela data em que o item foi marcado como pago) e o acumulado. */
export function serieDePagamentos(itens: Item[]): { pontos: PontoMensal[]; semData: number } {
  const porMes = new Map<string, number>();
  let semData = 0;
  for (const i of itens) {
    if (!i.pago) continue;
    if (!i.pagoEm) {
      semData += valorEfetivo(i);
      continue;
    }
    const d = new Date(i.pagoEm);
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    porMes.set(chave, (porMes.get(chave) ?? 0) + valorEfetivo(i));
  }
  let acumulado = 0;
  const pontos = [...porMes.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, mensal]) => {
      acumulado += mensal;
      const [ano, m] = mes.split("-");
      return { mes, rotulo: `${MESES[Number(m) - 1]}/${ano.slice(2)}`, mensal: Math.round(mensal), acumulado: Math.round(acumulado) };
    });
  return { pontos, semData };
}

/** Os achados que viram as frases da "Leitura rápida". Valores crus: quem exibe formata (e respeita o olhinho). */
export interface Fatos {
  maiorEtapa: { nome: string; pct: number } | null;
  feitoAPagar: { qtd: number; valor: number };
  teto: { definido: boolean; folga: number };
  desvio: { total: number; pct: number };
  maisAdiantada: { nome: string; pct: number } | null;
}

export function fatos(itens: Item[], config: Config, gruposEtapa: Grupo[]): Fatos {
  const previsto = itens.reduce((s, i) => s + valorEfetivo(i), 0);
  const orcado = itens.reduce((s, i) => s + i.valorOrcado, 0);
  const maior = [...gruposEtapa].sort((a, b) => b.previsto - a.previsto)[0];
  const fp = itens.filter((i) => i.feito && !i.pago);
  // Etapa mais adiantada: maior % de itens concluídos entre as que ainda não terminaram.
  const adiantada = gruposEtapa
    .map((g) => ({ nome: g.nome, total: g.total, concl: g.itens.filter((i) => i.feito && i.pago).length }))
    .filter((g) => g.concl > 0 && g.concl < g.total)
    .sort((a, b) => b.concl / b.total - a.concl / a.total)[0];
  return {
    maiorEtapa: maior && previsto > 0 ? { nome: maior.nome, pct: Math.round((maior.previsto / previsto) * 100) } : null,
    feitoAPagar: { qtd: fp.length, valor: fp.reduce((s, i) => s + valorEfetivo(i), 0) },
    teto: { definido: config.orcamentoTotal > 0, folga: config.orcamentoTotal - previsto },
    desvio: { total: previsto - orcado, pct: orcado > 0 ? ((previsto - orcado) / orcado) * 100 : 0 },
    maisAdiantada: adiantada ? { nome: adiantada.nome, pct: Math.round((adiantada.concl / adiantada.total) * 100) } : null,
  };
}
