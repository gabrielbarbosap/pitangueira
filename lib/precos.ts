/**
 * Preços dos planos (Broto, Safra, Pomar), para MOSTRAR na tela. Seguro no cliente: aqui só há valores, nenhum segredo.
 * Os IDs de preço do Stripe (que a cobrança usa) ficam no servidor, em variáveis de ambiente — veja `lib/servidor/stripe.ts`
 * e o `STRIPE_INTEGRATION_TODO.md`.
 *
 * Regra combinada: o plano anual paga 10 meses (2 meses de desconto). Mudar um preço é mudar um número aqui — e criar/
 * atualizar o preço correspondente no Stripe.
 */
import type { PlanoId } from "./planos";

export type Ciclo = "mensal" | "anual";

/** Quantos meses o plano anual deixa de cobrar (anual = 12 − isto). */
export const MESES_GRATIS_ANUAL = 2;

/**
 * Preço MENSAL de cada plano, em centavos de real. **0 = ainda não definido**: enquanto estiver 0, a tela esconde o valor
 * e o botão de assinar fica como "em breve". Progressão combinada: Broto R$24,99, Safra R$49,99, Pomar R$89,99. Mudar um
 * preço aqui também pede atualizar (criar novo e arquivar o antigo) o preço correspondente no Stripe.
 */
export const PRECO_MENSAL: Record<PlanoId, number> = {
  broto: 2499,
  safra: 4999,
  pomar: 8999,
};

/** O plano tem preço definido? (Senão, a tela não oferece assinatura dele.) */
export const temPreco = (p: PlanoId): boolean => PRECO_MENSAL[p] > 0;

/** Total cobrado uma vez por ano no plano anual (centavos): 10 meses. */
export const precoAnualTotal = (p: PlanoId): number => PRECO_MENSAL[p] * (12 - MESES_GRATIS_ANUAL);

/** Quanto o plano anual sai POR MÊS (centavos), para mostrar "equivale a R$ x/mês". */
export const precoAnualPorMes = (p: PlanoId): number => Math.round(precoAnualTotal(p) / 12);

/** O valor a mostrar, por ciclo e por mês (centavos): mensal é o próprio; anual é o equivalente mensal. */
export const precoPorMes = (p: PlanoId, ciclo: Ciclo): number => (ciclo === "anual" ? precoAnualPorMes(p) : PRECO_MENSAL[p]);

/** R$ a partir de centavos, no formato brasileiro. */
export const emReais = (centavos: number): string => (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
