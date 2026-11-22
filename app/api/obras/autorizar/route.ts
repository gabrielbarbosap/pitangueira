import { bloqueioDeLimite, planoEfetivo, PLANOS, type Assinatura } from "@/lib/planos";
import { consultar, ErroServidor, gravarDocumento, lerDocumento, verificarLogin } from "@/lib/servidor/firebaseAdmin";

/**
 * Autoriza criar ou restaurar um projeto: confere o plano e quantos projetos em andamento a pessoa tem. Se couber,
 * grava uma autorização de 2 minutos em `autorizacoes/{uid}`, que as regras do Firestore exigem (e consomem) para
 * criar/restaurar projeto. DESLIGADO por padrão: só funciona com PLANOS_NO_SERVIDOR=1 (veja o README, "Planos e limites").
 */
export async function POST(req: Request) {
  if (process.env.PLANOS_NO_SERVIDOR !== "1") return Response.json({ ok: false, mensagem: "A conferência de plano no servidor está desligada." }, { status: 501 });
  try {
    const u = await verificarLogin(req);
    if (u.anonimo) throw new ErroServidor(403, "Clientes não criam projetos.");
    const acao = ((await req.json().catch(() => ({}))) as { acao?: string }).acao;
    if (acao !== "criar" && acao !== "restaurar") throw new ErroServidor(400, "Ação inválida.");

    const assinatura = (await lerDocumento(`assinaturas/${u.uid}`)) as (Assinatura & { id: string }) | null;
    const efetivo = planoEfetivo(assinatura, u.criadoEm, Date.now());
    const def = PLANOS[efetivo.plano];

    // Projetos em andamento: os do próprio uid e, se o e-mail for verificado, os que ele co-gerencia.
    const meus = await consultar("obras", "ownerUid", "EQUAL", u.uid, ["arquivada"]);
    const compartilhadas = u.emailVerificado && u.email ? await consultar("obras", "ownerEmails", "ARRAY_CONTAINS", u.email, ["arquivada"]) : [];
    const ativos = new Map([...meus, ...compartilhadas].map((o) => [String(o.id), o.arquivada === true])).values();
    const emAndamento = [...ativos].filter((arquivada) => !arquivada).length;

    const bloqueio = bloqueioDeLimite(def, "obrasAtivas", emAndamento);
    if (bloqueio) return Response.json({ ok: false, ...bloqueio }, { status: 403 });

    await gravarDocumento(`autorizacoes/${u.uid}`, { acao, ate: Date.now() + 120_000 });
    return Response.json({ ok: true });
  } catch (e) {
    const status = e instanceof ErroServidor ? e.status : 500;
    return Response.json({ ok: false, mensagem: e instanceof ErroServidor ? e.message : "Erro inesperado no servidor." }, { status });
  }
}
