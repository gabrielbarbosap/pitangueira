// Cálculo das composições de custo. Funções puras: recebem os dados e devolvem números.
import type { CatalogoItem, Composicao, InsumoComposicao, TipoInsumo } from "./types";

/** Valor unitário em uso: o do catálogo (se o insumo veio de lá e ainda existe) ou o digitado. */
export function valorDoInsumo(ins: InsumoComposicao, catalogo: CatalogoItem[]): number {
  if (ins.catalogoId) {
    const c = catalogo.find((x) => x.id === ins.catalogoId);
    if (c) return c.valorUnitario;
  }
  return ins.valorUnitario;
}

export interface ResultadoComposicao {
  /** Custo direto de 1 unidade do serviço: soma de quantidade × valor dos insumos. */
  custoDireto: number;
  porTipo: Record<TipoInsumo, number>;
  /** Valor do BDI (despesas indiretas) sobre o custo direto. */
  bdiValor: number;
  /** Valor da margem de lucro sobre (custo direto + BDI). */
  margemValor: number;
  /** Preço de venda de 1 unidade: custo direto + BDI + margem. */
  preco: number;
}

const arredonda = (v: number) => Math.round(v * 100) / 100;

export function calcularComposicao(c: Pick<Composicao, "insumos" | "bdi" | "margem">, catalogo: CatalogoItem[]): ResultadoComposicao {
  const porTipo: Record<TipoInsumo, number> = { material: 0, mao_de_obra: 0, equipamento: 0 };
  for (const i of c.insumos) porTipo[i.tipo] += (i.quantidade || 0) * valorDoInsumo(i, catalogo);
  const custoDireto = porTipo.material + porTipo.mao_de_obra + porTipo.equipamento;
  const bdiValor = custoDireto * ((c.bdi || 0) / 100);
  const margemValor = (custoDireto + bdiValor) * ((c.margem || 0) / 100);
  return {
    custoDireto: arredonda(custoDireto),
    porTipo: { material: arredonda(porTipo.material), mao_de_obra: arredonda(porTipo.mao_de_obra), equipamento: arredonda(porTipo.equipamento) },
    bdiValor: arredonda(bdiValor),
    margemValor: arredonda(margemValor),
    preco: arredonda(custoDireto + bdiValor + margemValor),
  };
}
