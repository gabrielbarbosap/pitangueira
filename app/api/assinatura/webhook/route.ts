import { PLANOS, type Assinatura, type PlanoId } from "@/lib/planos";
import { consultar, gravarDocumento, lerDocumento } from "@/lib/servidor/firebaseAdmin";
import { lerAssinaturaStripe, normalizarAssinatura, planoDoPrice, verificarEvento, type AssinaturaStripe } from "@/lib/servidor/stripe";

export const runtime = "nodejs";

/**
 * Webhook do Stripe: a ÚNICA porta que grava `assinaturas/{uid}` e os recibos. Confere a assinatura do evento sobre o
 * corpo cru e mantém o Firestore em dia com o Stripe. Configure a URL e o segredo no painel do Stripe (veja o
 * STRIPE_INTEGRATION_TODO.md). Responde 200 mesmo em evento ignorado; só 400 quando a assinatura não bate.
 */
export async function POST(req: Request) {
  const bruto = await req.text();
  let evento;
  try {
    evento = verificarEvento(bruto, req.headers.get("stripe-signature"));
  } catch {
    return new Response("Assinatura inválida.", { status: 400 });
  }

  try {
    const obj = evento.data.object;
    switch (evento.type) {
      case "checkout.session.completed": {
        const sessao = obj as { subscription?: string; metadata?: Record<string, string>; client_reference_id?: string };
        if (sessao.subscription) {
          const assinatura = await lerAssinaturaStripe(sessao.subscription);
          const uid = sessao.metadata?.uid ?? sessao.client_reference_id ?? assinatura.metadata.uid;
          await gravarAssinatura(uid, assinatura);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const assinatura = normalizarAssinatura(obj as unknown as Parameters<typeof normalizarAssinatura>[0]);
        const uid = assinatura.metadata.uid;
        await gravarAssinatura(uid, assinatura, evento.type === "customer.subscription.deleted");
        break;
      }
      case "invoice.paid":
      case "invoice.payment_succeeded": {
        await gravarRecibo(obj as unknown as FaturaBruta, "paga");
        break;
      }
      case "charge.refunded": {
        const cobranca = obj as { invoice?: string; customer?: string };
        await marcarReciboReembolsado(cobranca.customer, cobranca.invoice);
        break;
      }
      default:
        break;
    }
  } catch (e) {
    // Log no servidor; devolve 500 para o Stripe tentar de novo (os eventos são reprocessáveis).
    console.error("Falha ao processar webhook do Stripe:", evento.type, e);
    return new Response("Erro ao processar o evento.", { status: 500 });
  }
  return new Response("ok", { status: 200 });
}

/** Converte o status do Stripe no nosso e grava `assinaturas/{uid}` (documento inteiro). */
async function gravarAssinatura(uid: string | undefined, s: AssinaturaStripe, apagada = false): Promise<void> {
  if (!uid) {
    console.error("Webhook sem uid na assinatura:", s.id);
    return;
  }
  const plano: PlanoId = planoDoPrice(s.priceId)?.plano ?? (s.metadata.plano as PlanoId) ?? "broto";
  const fimMs = s.fimPeriodo ? s.fimPeriodo * 1000 : Date.now();
  let status: Assinatura["status"];
  if (apagada || s.status === "canceled") status = "cancelada";
  else if (s.status === "active" || s.status === "trialing") status = "ativa";
  else if (s.status === "past_due" || s.status === "unpaid") status = "atrasada";
  else status = "cancelada"; // incomplete, incomplete_expired, paused: sem acesso

  const doc: Record<string, string | number | boolean> = {
    plano,
    status,
    ate: fimMs,
    atualizadoEm: Date.now(),
    stripeCustomerId: s.customer,
    stripeSubscriptionId: s.id,
  };
  if (status === "atrasada") doc.carenciaAte = fimMs;
  if (status === "cancelada" && !apagada && s.cancelarNoFim) doc.aviso = "Sua assinatura foi cancelada e vale até o fim do período já pago.";
  await gravarDocumento(`assinaturas/${uid}`, doc);
}

interface FaturaBruta {
  id: string;
  customer?: string;
  amount_paid?: number;
  hosted_invoice_url?: string;
  created?: number;
}

/** Grava um recibo em `assinaturas/{uid}/recibos/{faturaId}` (idempotente pelo id da fatura). */
async function gravarRecibo(f: FaturaBruta, status: "paga" | "reembolsada"): Promise<void> {
  if (!f.customer) return;
  const donos = await consultar("assinaturas", "stripeCustomerId", "EQUAL", f.customer, ["plano"]);
  const dono = donos[0];
  if (!dono) {
    console.error("Recibo sem dono (cliente não mapeado):", f.customer);
    return;
  }
  const uid = String(dono.id);
  const plano = dono.plano as PlanoId | undefined;
  const recibo: Record<string, string | number | boolean> = {
    em: f.created ? f.created * 1000 : Date.now(),
    valor: f.amount_paid ?? 0,
    descricao: plano ? `Assinatura ${PLANOS[plano].nome}` : "Assinatura Pitangueira",
    status,
  };
  if (plano) recibo.plano = plano;
  if (f.hosted_invoice_url) recibo.url = f.hosted_invoice_url;
  await gravarDocumento(`assinaturas/${uid}/recibos/${f.id}`, recibo);
}

/** Acha o dono (pelo cliente) e regrava o recibo daquela fatura como reembolsado, preservando os demais campos. */
async function marcarReciboReembolsado(customer: string | undefined, faturaId: string | undefined): Promise<void> {
  if (!customer || !faturaId) return;
  const donos = await consultar("assinaturas", "stripeCustomerId", "EQUAL", customer, ["plano"]);
  const dono = donos[0];
  if (!dono) return;
  const uid = String(dono.id);
  const atual = await lerDocumento(`assinaturas/${uid}/recibos/${faturaId}`);
  if (!atual) return;
  const recibo: Record<string, string | number | boolean> = {
    em: Number(atual.em) || Date.now(),
    valor: Number(atual.valor) || 0,
    descricao: String(atual.descricao ?? "Assinatura Pitangueira"),
    status: "reembolsada",
  };
  if (atual.plano) recibo.plano = String(atual.plano);
  if (atual.url) recibo.url = String(atual.url);
  await gravarDocumento(`assinaturas/${uid}/recibos/${faturaId}`, recibo);
}
