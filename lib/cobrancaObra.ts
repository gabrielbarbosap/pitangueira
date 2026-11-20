// Cobrança da obra: a mensagem de WhatsApp e os totais. Funções puras.
import type { ContextoMensagem } from "./acompanhamento";
import { abertura, blocos, bullets, campo, comoLista, fecho, titulo } from "./mensagens";
import type { CobrancaObra, ItemCobrado } from "./types";

const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBr = (ms: number) => new Date(ms).toLocaleDateString("pt-BR");

/** Soma de uma lista de itens cobrados, em centavos certos. */
export const totalDosItens = (itens: ItemCobrado[]) => Math.round(itens.reduce((s, i) => s + i.valor, 0) * 100) / 100;

/** Os dados da cobrança (total, vencimento e PIX) como bloco de WhatsApp: vai na mensagem que acompanha o PDF. */
export function blocoCobranca(c: CobrancaObra): string {
  return blocos([
    [campo("💵", "Total", reais(c.total)), c.vencimento && campo("📅", "Vencimento", dataBr(c.vencimento))].filter(Boolean).join("\n"),
    c.pix.trim() && `${titulo("💳", "Chave PIX")}\n${c.pix.trim()}`,
  ]);
}

/** A mensagem de cobrança com a lista dos itens, o total, o vencimento e a chave PIX. */
export function mensagemCobrancaObra(c: CobrancaObra, ctx: ContextoMensagem): string {
  const linhas = c.itens.slice(0, 12).map((i) => `${i.descricao} — ${reais(i.valor)}`);
  if (c.itens.length > 12) linhas.push(`e mais ${c.itens.length - 12}…`);
  return blocos([
    abertura({ destinatario: ctx.cliente, projeto: ctx.projeto }),
    titulo("💰", `Cobrança: ${c.titulo}`),
    bullets(linhas),
    blocoCobranca(c),
    c.obs.trim() && `${titulo("📝", "Observações")}\n${comoLista(c.obs)}`,
    fecho({ link: ctx.link, assinatura: ctx.escritorio }),
  ]);
}
