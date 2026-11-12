// Cálculos do relatório mensal de andamento. Funções puras: `hoje` entra por parâmetro (ms).
import type { Item } from "./types";
import { valorEfetivo } from "./calc";

export interface Mes {
  ano: number;
  /** 0 a 11, como no Date. */
  mes: number;
}

/** Primeiro instante do mês e o primeiro instante do mês seguinte (intervalo [inicio, fim)). */
export function limitesDoMes({ ano, mes }: Mes): { inicio: number; fim: number } {
  return { inicio: new Date(ano, mes, 1).getTime(), fim: new Date(ano, mes + 1, 1).getTime() };
}

export const mesDe = (ms: number): Mes => {
  const d = new Date(ms);
  return { ano: d.getFullYear(), mes: d.getMonth() };
};

export const mesmoMes = (a: Mes, b: Mes) => a.ano === b.ano && a.mes === b.mes;
export const chaveDoMes = ({ ano, mes }: Mes) => `${ano}-${String(mes + 1).padStart(2, "0")}`;
const indice = ({ ano, mes }: Mes) => ano * 12 + mes;

export function somaMeses({ ano, mes }: Mes, n: number): Mes {
  const total = ano * 12 + mes + n;
  return { ano: Math.floor(total / 12), mes: ((total % 12) + 12) % 12 };
}

export const rotuloDoMes = ({ ano, mes }: Mes) => new Date(ano, mes, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
export const rotuloCurto = ({ ano, mes }: Mes) => new Date(ano, mes, 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", "");

/** Um item que teve algo registrado no mês: foi executado, foi pago, ou os dois. */
export interface Movimento {
  item: Item;
  feitoNoMes: boolean;
  pagoNoMes: boolean;
}

const dentro = (ms: number | undefined, inicio: number, fim: number) => ms !== undefined && ms >= inicio && ms < fim;

/** Itens com execução ou pagamento registrados dentro do mês. */
export function movimentosDoMes(itens: Item[], mes: Mes): Movimento[] {
  const { inicio, fim } = limitesDoMes(mes);
  const lista: Movimento[] = [];
  for (const item of itens) {
    const feitoNoMes = item.feito && dentro(item.feitoEm, inicio, fim);
    const pagoNoMes = item.pago && dentro(item.pagoEm, inicio, fim);
    if (feitoNoMes || pagoNoMes) lista.push({ item, feitoNoMes, pagoNoMes });
  }
  return lista;
}

/**
 * Itens marcados como feitos ou pagos antes de o app guardar a data. Não dá para dizer em que mês
 * aconteceram: o arquiteto decide se entram no relatório.
 */
export function semDataRegistrada(itens: Item[]): Item[] {
  return itens.filter((i) => (i.feito && !i.feitoEm) || (i.pago && !i.pagoEm));
}

/** Meses com movimento, do mais antigo ao atual (o mês de `hoje` sempre entra, mesmo vazio). */
export function mesesDisponiveis(itens: Item[], hoje: number): { mes: Mes; qtd: number }[] {
  const contagem = new Map<string, { mes: Mes; qtd: number }>();
  const registra = (ms: number | undefined) => {
    if (!ms) return;
    const m = mesDe(ms);
    const k = chaveDoMes(m);
    const atual = contagem.get(k);
    if (atual) return;
    contagem.set(k, { mes: m, qtd: 0 });
  };
  for (const i of itens) {
    if (i.feito) registra(i.feitoEm);
    if (i.pago) registra(i.pagoEm);
  }
  registra(hoje);
  const lista = [...contagem.values()].sort((a, b) => indice(a.mes) - indice(b.mes));
  for (const x of lista) x.qtd = movimentosDoMes(itens, x.mes).length;
  return lista;
}

export interface Progresso {
  /** % de itens executados no começo e no fim do mês. */
  antes: number;
  depois: number;
  total: number;
}

/**
 * Quanto do projeto estava executado no começo e no fim do mês. Itens sem data contam como já feitos
 * antes (não há como saber), o que mantém o ganho do mês restrito ao que tem data.
 */
export function progressoDoMes(itens: Item[], mes: Mes): Progresso {
  const { inicio, fim } = limitesDoMes(mes);
  const total = itens.length;
  if (total === 0) return { antes: 0, depois: 0, total };
  let antes = 0;
  let depois = 0;
  for (const i of itens) {
    if (!i.feito) continue;
    if (!i.feitoEm) {
      antes += 1;
      depois += 1;
      continue;
    }
    if (i.feitoEm < inicio) antes += 1;
    if (i.feitoEm < fim) depois += 1;
  }
  return { antes: Math.round((antes / total) * 100), depois: Math.round((depois / total) * 100), total };
}

/** Soma dos valores dos itens pagos (valor real quando houver). */
export const totalPago = (itens: Item[]) => itens.reduce((s, i) => s + valorEfetivo(i), 0);

/** Agrupa itens por etapa, mantendo a ordem em que aparecem. */
export function porEtapa<T extends { item: Item }>(lista: T[]): { etapa: string; itens: T[] }[] {
  const mapa = new Map<string, T[]>();
  for (const x of lista) {
    const e = x.item.etapa?.trim() || "Sem definição";
    mapa.set(e, [...(mapa.get(e) ?? []), x]);
  }
  return [...mapa.entries()].map(([etapa, itens]) => ({ etapa, itens }));
}
