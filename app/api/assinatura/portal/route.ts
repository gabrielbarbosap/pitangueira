import { ErroServidor, lerDocumento, verificarLogin } from "@/lib/servidor/firebaseAdmin";
import { criarSessaoPortal } from "@/lib/servidor/stripe";

/**
 * Abre o portal do cliente do Stripe (trocar cartão, mudar ou cancelar o plano, ver faturas) para o arquiteto logado.
 * Devolve a URL para a qual o navegador deve ir. Só funciona para quem já tem uma assinatura (um cliente no Stripe).
 */
export async function POST(req: Request) {
  try {
    const u = await verificarLogin(req);
    if (u.anonimo) throw new ErroServidor(403, "Clientes não têm assinatura.");

    const atual = (await lerDocumento(`assinaturas/${u.uid}`)) as { stripeCustomerId?: string } | null;
    if (!atual?.stripeCustomerId) throw new ErroServidor(404, "Você ainda não tem uma assinatura para gerenciar.");

    const origem = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;
    const { url } = await criarSessaoPortal(atual.stripeCustomerId, `${origem}/conta`);
    return Response.json({ url });
  } catch (e) {
    const status = e instanceof ErroServidor ? e.status : 500;
    return Response.json({ mensagem: e instanceof ErroServidor ? e.message : "Erro inesperado ao abrir o portal." }, { status });
  }
}
