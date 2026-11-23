import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { ErroServidor } from "./firebaseAdmin";
import type { Ciclo } from "../precos";
import type { PlanoId } from "../planos";

/**
 * Acesso ao Stripe SÓ NO SERVIDOR e SEM DEPENDÊNCIAS (mesmo estilo do `firebaseAdmin.ts`): fala com a REST API do Stripe
 * com `fetch` usando a chave secreta (STRIPE_SECRET_KEY) e verifica a assinatura dos webhooks com `crypto`. Os IDs de
 * preço de cada plano/ciclo vêm de variáveis de ambiente. Veja o `STRIPE_INTEGRATION_TODO.md`.
 */

const BASE = "https://api.stripe.com/v1";
/** Versão da API fixada pela integração de formulário embutido (Checkout Studio / Dahlia). */
const VERSAO_API = "2026-03-25.dahlia";

function chaveSecreta(): string {
  const k = process.env.STRIPE_SECRET_KEY;
  if (!k) throw new ErroServidor(503, "O servidor ainda não tem a chave do Stripe (STRIPE_SECRET_KEY).");
  return k;
}

/** Achata objetos/arrays no formato de formulário do Stripe: `a[b][0][c]=valor`. Ignora null/undefined. */
function achatar(valor: unknown, prefixo: string, saida: [string, string][]): void {
  if (valor === null || valor === undefined) return;
  if (Array.isArray(valor)) {
    valor.forEach((v, i) => achatar(v, `${prefixo}[${i}]`, saida));
  } else if (typeof valor === "object") {
    for (const [k, v] of Object.entries(valor as Record<string, unknown>)) achatar(v, prefixo ? `${prefixo}[${k}]` : k, saida);
  } else {
    saida.push([prefixo, String(valor)]);
  }
}

async function chamarStripe(caminho: string, params?: Record<string, unknown>, metodo: "GET" | "POST" = "POST"): Promise<Record<string, unknown>> {
  const pares: [string, string][] = [];
  if (params) for (const [k, v] of Object.entries(params)) achatar(v, k, pares);
  const corpo = metodo === "POST" ? new URLSearchParams(pares) : undefined;
  const sufixo = metodo === "GET" && pares.length ? `?${new URLSearchParams(pares)}` : "";
  const r = await fetch(`${BASE}${caminho}${sufixo}`, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${chaveSecreta()}`,
      "Stripe-Version": VERSAO_API,
      ...(corpo ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: corpo,
  });
  const j = (await r.json().catch(() => ({}))) as Record<string, unknown>;
  if (!r.ok) {
    const erro = (j.error as { message?: string } | undefined)?.message;
    throw new ErroServidor(r.status >= 500 ? 502 : r.status, erro ?? `O Stripe recusou o pedido (${r.status}).`);
  }
  return j;
}

// ---- IDs de preço (um por plano e ciclo), vindos do ambiente ----------------------------------------------------

const PRICE_IDS: Record<PlanoId, Record<Ciclo, string | undefined>> = {
  broto: { mensal: process.env.STRIPE_PRICE_BROTO_MENSAL, anual: process.env.STRIPE_PRICE_BROTO_ANUAL },
  safra: { mensal: process.env.STRIPE_PRICE_SAFRA_MENSAL, anual: process.env.STRIPE_PRICE_SAFRA_ANUAL },
  pomar: { mensal: process.env.STRIPE_PRICE_POMAR_MENSAL, anual: process.env.STRIPE_PRICE_POMAR_ANUAL },
};

function priceIdDe(plano: PlanoId, ciclo: Ciclo): string {
  const id = PRICE_IDS[plano]?.[ciclo];
  if (!id) throw new ErroServidor(503, `O preço do plano ${plano} (${ciclo}) ainda não foi configurado no servidor.`);
  return id;
}

/** De um ID de preço do Stripe, descobre o plano e o ciclo (para o webhook). Nulo se não for um preço conhecido. */
export function planoDoPrice(priceId: string | undefined): { plano: PlanoId; ciclo: Ciclo } | null {
  if (!priceId) return null;
  for (const plano of Object.keys(PRICE_IDS) as PlanoId[]) {
    for (const ciclo of ["mensal", "anual"] as Ciclo[]) {
      if (PRICE_IDS[plano][ciclo] === priceId) return { plano, ciclo };
    }
  }
  return null;
}

// ---- Checkout e portal -------------------------------------------------------------------------------------------

export interface DadosCheckout {
  uid: string;
  email: string;
  plano: PlanoId;
  ciclo: Ciclo;
  /** Origem do app (ex.: https://app.exemplo.com) para montar o return_url. */
  origem: string;
  /** Se o arquiteto já é um cliente no Stripe, reaproveita (evita cliente duplicado). */
  customerId?: string;
}

/** Cria a sessão de Checkout do formulário embutido e devolve o `client_secret` para o cliente montar o form. */
export async function criarSessaoCheckout(d: DadosCheckout): Promise<{ clientSecret: string; id: string }> {
  // automatic_tax exige o Stripe Tax ativo e um endereço/CPF do cliente. Fica ligado por padrão (como no Checkout
  // Studio); STRIPE_AUTOMATIC_TAX=0 desliga caso o Stripe Tax ainda não esteja configurado.
  const taxAtivo = process.env.STRIPE_AUTOMATIC_TAX !== "0";
  const params: Record<string, unknown> = {
    ui_mode: "form",
    mode: "subscription",
    line_items: [{ price: priceIdDe(d.plano, d.ciclo), quantity: 1 }],
    client_reference_id: d.uid,
    return_url: `${d.origem}/assinar/retorno?session_id={CHECKOUT_SESSION_ID}`,
    billing_address_collection: "auto",
    phone_number_collection: { enabled: false },
    automatic_tax: { enabled: taxAtivo },
    payment_method_collection: "always",
    submit_type: "auto",
    saved_payment_method_options: { payment_method_save: "enabled" },
    integration_identifier: "custom_embedded_web_0001",
    subscription_data: { metadata: { uid: d.uid, plano: d.plano, ciclo: d.ciclo } },
    metadata: { uid: d.uid, plano: d.plano, ciclo: d.ciclo },
  };
  if (d.customerId) params.customer = d.customerId;
  else params.customer_email = d.email;
  if (taxAtivo) params.tax_id_collection = { enabled: true };
  const s = await chamarStripe("/checkout/sessions", params);
  const clientSecret = s.client_secret as string | undefined;
  if (!clientSecret) throw new ErroServidor(502, "O Stripe não devolveu o segredo da sessão.");
  return { clientSecret, id: s.id as string };
}

/** Cria a sessão do portal do cliente (onde a pessoa troca cartão, muda ou cancela o plano) e devolve a URL. */
export async function criarSessaoPortal(customerId: string, retorno: string): Promise<{ url: string }> {
  const s = await chamarStripe("/billing_portal/sessions", { customer: customerId, return_url: retorno });
  return { url: s.url as string };
}

// ---- Leitura de assinatura e verificação de webhook --------------------------------------------------------------

export interface AssinaturaStripe {
  id: string;
  status: string;
  customer: string;
  /** Fim do período atual, em segundos (epoch). */
  fimPeriodo: number;
  cancelarNoFim: boolean;
  priceId?: string;
  metadata: Record<string, string>;
}

interface ItemSubBruto {
  price?: { id?: string };
  current_period_end?: number;
}
interface SubBruta {
  id: string;
  status: string;
  customer: string | { id?: string };
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  items?: { data?: ItemSubBruto[] };
  metadata?: Record<string, string>;
}

/** Normaliza o objeto de assinatura do Stripe (seja de um webhook, seja de uma leitura). */
export function normalizarAssinatura(s: SubBruta): AssinaturaStripe {
  const item = s.items?.data?.[0];
  return {
    id: s.id,
    status: s.status,
    customer: typeof s.customer === "string" ? s.customer : (s.customer?.id ?? ""),
    fimPeriodo: Number(item?.current_period_end ?? s.current_period_end ?? 0),
    cancelarNoFim: s.cancel_at_period_end === true,
    priceId: item?.price?.id,
    metadata: s.metadata ?? {},
  };
}

export async function lerAssinaturaStripe(id: string): Promise<AssinaturaStripe> {
  const s = (await chamarStripe(`/subscriptions/${id}`, undefined, "GET")) as unknown as SubBruta;
  return normalizarAssinatura(s);
}

export interface EventoStripe {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

function seguroIgual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

/** Tolerância (segundos) entre o horário do webhook e o nosso, contra replays. */
const TOLERANCIA = 300;

/**
 * Confere a assinatura do webhook (cabeçalho `Stripe-Signature`) sobre o corpo CRU e devolve o evento. Lança se não
 * bater — quem chama responde 400. O corpo PRECISA ser o texto cru recebido, sem reserializar.
 */
export function verificarEvento(payloadBruto: string, cabecalho: string | null): EventoStripe {
  const segredo = process.env.STRIPE_WEBHOOK_SECRET;
  if (!segredo) throw new ErroServidor(503, "O servidor não tem o segredo do webhook (STRIPE_WEBHOOK_SECRET).");
  if (!cabecalho) throw new ErroServidor(400, "Faltou a assinatura do webhook.");
  let t = "";
  const v1: string[] = [];
  for (const parte of cabecalho.split(",")) {
    const i = parte.indexOf("=");
    if (i < 0) continue;
    const k = parte.slice(0, i).trim();
    const v = parte.slice(i + 1).trim();
    if (k === "t") t = v;
    else if (k === "v1") v1.push(v);
  }
  if (!t || v1.length === 0) throw new ErroServidor(400, "A assinatura do webhook está mal formada.");
  const esperado = createHmac("sha256", segredo).update(`${t}.${payloadBruto}`, "utf8").digest("hex");
  if (!v1.some((v) => seguroIgual(v, esperado))) throw new ErroServidor(400, "A assinatura do webhook não confere.");
  const idade = Math.abs(Date.now() / 1000 - Number(t));
  if (!Number.isFinite(idade) || idade > TOLERANCIA) throw new ErroServidor(400, "O webhook chegou fora da janela de tempo.");
  try {
    return JSON.parse(payloadBruto) as EventoStripe;
  } catch {
    throw new ErroServidor(400, "O corpo do webhook não é um JSON válido.");
  }
}
