import { ORDEM_PLANOS, type PlanoId } from "@/lib/planos";
import { ErroServidor, lerDocumento, verificarLogin } from "@/lib/servidor/firebaseAdmin";
import { criarSessaoCheckout } from "@/lib/servidor/stripe";
import type { Ciclo } from "@/lib/precos";

/**
 * Cria uma sessão de Checkout (formulário embutido, assinatura) para o arquiteto logado e devolve o `client_secret`
 * que a tela /assinar usa para montar o formulário. Quem provisiona o plano é o webhook, não esta rota.
 */
export async function POST(req: Request) {
  try {
    const u = await verificarLogin(req);
    if (u.anonimo) throw new ErroServidor(403, "Clientes não assinam planos.");

    const corpo = (await req.json().catch(() => ({}))) as { plano?: string; ciclo?: string };
    const plano = corpo.plano as PlanoId | undefined;
    const ciclo = corpo.ciclo as Ciclo | undefined;
    if (!plano || !ORDEM_PLANOS.includes(plano)) throw new ErroServidor(400, "Plano inválido.");
    if (ciclo !== "mensal" && ciclo !== "anual") throw new ErroServidor(400, "Ciclo inválido.");

    const atual = (await lerDocumento(`assinaturas/${u.uid}`)) as { stripeCustomerId?: string } | null;
    const origem = req.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin;

    const { clientSecret } = await criarSessaoCheckout({
      uid: u.uid,
      email: u.email,
      plano,
      ciclo,
      origem,
      customerId: atual?.stripeCustomerId,
    });
    return Response.json({ client_secret: clientSecret });
  } catch (e) {
    const status = e instanceof ErroServidor ? e.status : 500;
    return Response.json({ mensagem: e instanceof ErroServidor ? e.message : "Erro inesperado ao iniciar o checkout." }, { status });
  }
}
