// Cálculos do orçamento, compartilhados entre cards, gráficos e lista.
import type { Agrupamento, Config, Item, ResumoObra } from "./types";
import { percentual } from "./format";

/** Valor efetivo de um item: o real quando informado, senão o orçado. */
export function valorEfetivo(i: Item): number {
  return i.valorReal > 0 ? i.valorReal : i.valorOrcado;
}

/** Agregado enxuto de uma obra (previsto, pago, contagens). */
export function resumoDeItens(itens: Item[]): ResumoObra {
  let previsto = 0;
  let pago = 0;
  let feitos = 0;
  let concluidos = 0;
  for (const i of itens) {
    const v = valorEfetivo(i);
    previsto += v;
    if (i.pago) pago += v;
    if (i.feito) feitos += 1;
    if (i.feito && i.pago) concluidos += 1;
  }
  return { previsto, pago, itens: itens.length, feitos, concluidos };
}

export interface Resumo {
  teto: number;
  orcadoTotal: number;
  previstoTotal: number;
  pagoTotal: number;
  faltaPagar: number;
  saldoCaixa: number;
  projecaoVsTeto: number;
  pctPago: number;
  itensFeitos: number;
  totalItens: number;
  pctFeito: number;
}

export function calcularResumo(itens: Item[], config: Config): Resumo {
  let orcadoTotal = 0;
  let previstoTotal = 0;
  let pagoTotal = 0;
  let itensFeitos = 0;

  for (const i of itens) {
    const ef = valorEfetivo(i);
    orcadoTotal += i.valorOrcado;
    previstoTotal += ef;
    if (i.pago) pagoTotal += ef;
    if (i.feito) itensFeitos += 1;
  }

  const teto = config.orcamentoTotal || 0;
  return {
    teto,
    orcadoTotal,
    previstoTotal,
    pagoTotal,
    faltaPagar: previstoTotal - pagoTotal,
    saldoCaixa: teto - pagoTotal,
    projecaoVsTeto: teto - previstoTotal,
    pctPago: percentual(pagoTotal, previstoTotal),
    itensFeitos,
    totalItens: itens.length,
    pctFeito: percentual(itensFeitos, itens.length),
  };
}

export interface Grupo {
  nome: string;
  ordem: number;
  orcado: number;
  previsto: number;
  pago: number;
  feitos: number;
  total: number;
  itens: Item[];
}

/** Agrupa os itens por etapa ou por ambiente. */
export function agruparPor(itens: Item[], campo: Agrupamento): Grupo[] {
  const mapa = new Map<string, Grupo>();
  for (const i of itens) {
    const nome = (campo === "etapa" ? i.etapa : i.ambiente)?.trim() || "Sem definição";
    const g =
      mapa.get(nome) ??
      { nome, ordem: campo === "etapa" ? i.etapaNum : 0, orcado: 0, previsto: 0, pago: 0, feitos: 0, total: 0, itens: [] };
    const ef = valorEfetivo(i);
    g.orcado += i.valorOrcado;
    g.previsto += ef;
    if (i.pago) g.pago += ef;
    if (i.feito) g.feitos += 1;
    g.total += 1;
    g.itens.push(i);
    mapa.set(nome, g);
  }
  const grupos = Array.from(mapa.values());
  // Do mais caro para o mais barato (empate: ordem alfabética).
  grupos.sort((a, b) => b.previsto - a.previsto || a.nome.localeCompare(b.nome));
  return grupos;
}

export type StatusGrupo = "pendente" | "progresso" | "finalizado";

/** Status de uma seção: nada iniciado, em andamento, ou tudo feito e pago. */
export function statusGrupo(g: Grupo): StatusGrupo {
  const concluidos = g.itens.filter((i) => i.feito && i.pago).length;
  const comAlgumProgresso = g.itens.some((i) => i.feito || i.pago);
  if (!comAlgumProgresso) return "pendente";
  if (concluidos === g.total) return "finalizado";
  return "progresso";
}

// Ordem dos status na lista: em andamento primeiro, depois concluído, depois pendente.
const RANK_STATUS: Record<StatusGrupo, number> = { progresso: 0, finalizado: 1, pendente: 2 };

/** Reordena os grupos por status; dentro de cada status, do mais caro ao mais barato. */
export function ordenarPorStatus(grupos: Grupo[]): Grupo[] {
  return [...grupos].sort(
    (a, b) =>
      RANK_STATUS[statusGrupo(a)] - RANK_STATUS[statusGrupo(b)] ||
      b.previsto - a.previsto ||
      a.nome.localeCompare(b.nome),
  );
}

/** Normaliza para busca: minúsculas e sem acentos. */
export function normalizar(s: string): string {
  return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/** Filtra itens por texto livre (descrição, etapa, ambiente, fornecedor, obs ou valor). */
export function filtrarItens(itens: Item[], busca: string): Item[] {
  const q = normalizar(busca.trim());
  if (!q) return itens;
  return itens.filter((i) =>
    normalizar(
      `${i.descricao} ${i.etapa} ${i.ambiente} ${i.fornecedor ?? ""} ${i.observacao ?? ""} ${i.valorOrcado} ${i.valorReal} ${i.quantidade}`,
    ).includes(q),
  );
}

/** Valores distintos de um campo (para sugestões no formulário). */
export function distintos(itens: Item[], campo: Agrupamento): string[] {
  return Array.from(
    new Set(itens.map((i) => (campo === "etapa" ? i.etapa : i.ambiente)?.trim()).filter(Boolean)),
  ).sort();
}
