import { auth } from "./firebase";
import { ErroDePlano } from "./planos";

/** Só vale com NEXT_PUBLIC_PLANOS_NO_SERVIDOR=1 (e PLANOS_NO_SERVIDOR=1 no servidor). Veja o README, "Planos e limites". */
export const PLANOS_NO_SERVIDOR = process.env.NEXT_PUBLIC_PLANOS_NO_SERVIDOR === "1";

/**
 * Pede ao servidor licença para criar ou restaurar um projeto. Se o plano não permitir, lança `ErroDePlano` com o
 * motivo pronto para mostrar. Se der certo, o servidor deixa uma autorização de 2 minutos que as regras do Firestore
 * exigem na hora de gravar (e que a gravação consome).
 */
export async function autorizarNoServidor(acao: "criar" | "restaurar"): Promise<void> {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error("Você precisa estar logado.");
  const r = await fetch("/api/obras/autorizar", { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ acao }) });
  if (r.ok) return;
  const corpo = (await r.json().catch(() => ({}))) as { titulo?: string; texto?: string; dica?: string; sugestao?: "broto" | "safra" | "pomar" | null; mensagem?: string };
  if (r.status === 403 && corpo.titulo && corpo.texto) throw new ErroDePlano({ titulo: corpo.titulo, texto: corpo.texto, dica: corpo.dica ?? "", sugestao: corpo.sugestao ?? null });
  throw new Error(corpo.mensagem ?? "Não consegui conferir o seu plano agora.");
}
