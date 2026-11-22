import "server-only";
import { createSign } from "node:crypto";

/**
 * Acesso de administrador ao Firestore e verificação de login, SÓ NO SERVIDOR e sem dependências: fala com as APIs REST
 * do Google usando a conta de serviço guardada em FIREBASE_SERVICE_ACCOUNT (o JSON da chave, em uma linha) e a chave
 * pública do app (NEXT_PUBLIC_FIREBASE_API_KEY). Sem essas variáveis, nada aqui funciona: quem chama trata o erro.
 */

interface ContaServico {
  client_email: string;
  private_key: string;
  project_id: string;
}

export class ErroServidor extends Error {
  constructor(
    public status: number,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

function conta(): ContaServico {
  const bruto = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!bruto) throw new ErroServidor(503, "O servidor ainda não tem a conta de serviço configurada (FIREBASE_SERVICE_ACCOUNT).");
  try {
    const c = JSON.parse(bruto) as ContaServico;
    return { ...c, private_key: c.private_key.replace(/\\n/g, "\n") };
  } catch {
    throw new ErroServidor(503, "FIREBASE_SERVICE_ACCOUNT não é um JSON válido.");
  }
}

const b64 = (o: object | Buffer) => Buffer.from(o instanceof Buffer ? o : JSON.stringify(o)).toString("base64url");

let cache: { token: string; ate: number } | null = null;
async function tokenDeAcesso(): Promise<string> {
  if (cache && cache.ate > Date.now() + 60_000) return cache.token;
  const c = conta();
  const agora = Math.floor(Date.now() / 1000);
  const base = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: c.client_email, scope: "https://www.googleapis.com/auth/datastore", aud: "https://oauth2.googleapis.com/token", iat: agora, exp: agora + 3600 })}`;
  const assinatura = createSign("RSA-SHA256").update(base).sign(c.private_key);
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${base}.${b64(assinatura)}` }),
  });
  if (!r.ok) throw new ErroServidor(502, "Não consegui autenticar o servidor no Google.");
  const j = (await r.json()) as { access_token: string; expires_in: number };
  cache = { token: j.access_token, ate: Date.now() + j.expires_in * 1000 };
  return cache.token;
}

const raiz = () => `https://firestore.googleapis.com/v1/projects/${conta().project_id}/databases/(default)/documents`;

type Valor = { stringValue?: string; integerValue?: string; doubleValue?: number; booleanValue?: boolean; arrayValue?: { values?: Valor[] }; mapValue?: { fields?: Record<string, Valor> }; nullValue?: null };
function valor(v: Valor): unknown {
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return Number(v.integerValue);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.arrayValue) return (v.arrayValue.values ?? []).map(valor);
  if (v.mapValue) return Object.fromEntries(Object.entries(v.mapValue.fields ?? {}).map(([k, x]) => [k, valor(x)]));
  return null;
}
const plano = (d: { name: string; fields?: Record<string, Valor> }) => ({ id: d.name.split("/").pop() ?? "", ...(Object.fromEntries(Object.entries(d.fields ?? {}).map(([k, v]) => [k, valor(v)])) as Record<string, unknown>) });

async function chamar(url: string, init?: RequestInit) {
  const r = await fetch(url, { ...init, headers: { Authorization: `Bearer ${await tokenDeAcesso()}`, "Content-Type": "application/json", ...(init?.headers ?? {}) } });
  if (r.status === 404) return null;
  if (!r.ok) throw new ErroServidor(502, `O Firestore recusou o pedido (${r.status}).`);
  return r.json();
}

export async function lerDocumento(caminho: string): Promise<Record<string, unknown> | null> {
  const d = await chamar(`${raiz()}/${caminho}`);
  return d ? plano(d) : null;
}

/** Consulta simples: documentos de `colecao` em que `campo` == valor (ou array-contains). Devolve só os campos pedidos. */
export async function consultar(colecao: string, campo: string, operador: "EQUAL" | "ARRAY_CONTAINS", valorBusca: string, selecionar: string[]): Promise<Record<string, unknown>[]> {
  const corpo = {
    structuredQuery: {
      from: [{ collectionId: colecao }],
      where: { fieldFilter: { field: { fieldPath: campo }, op: operador, value: { stringValue: valorBusca } } },
      select: { fields: selecionar.map((fieldPath) => ({ fieldPath })) },
    },
  };
  const r = (await chamar(`${raiz()}:runQuery`, { method: "POST", body: JSON.stringify(corpo) })) as { document?: { name: string; fields?: Record<string, Valor> } }[] | null;
  return (r ?? []).filter((x) => x.document).map((x) => plano(x.document!));
}

export async function gravarDocumento(caminho: string, campos: Record<string, string | number | boolean>): Promise<void> {
  const fields = Object.fromEntries(Object.entries(campos).map(([k, v]) => [k, typeof v === "string" ? { stringValue: v } : typeof v === "boolean" ? { booleanValue: v } : { integerValue: String(Math.round(v)) }]));
  await chamar(`${raiz()}/${caminho}`, { method: "PATCH", body: JSON.stringify({ fields }) });
}

export interface UsuarioVerificado {
  uid: string;
  email: string;
  emailVerificado: boolean;
  criadoEm: number | null;
  anonimo: boolean;
}

/** Confere o token de login que o navegador manda e devolve quem é. Lança 401 se não valer. */
export async function verificarLogin(req: Request): Promise<UsuarioVerificado> {
  const token = /^Bearer (.+)$/i.exec(req.headers.get("authorization") ?? "")?.[1];
  const chave = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!token) throw new ErroServidor(401, "Você precisa estar logado.");
  if (!chave) throw new ErroServidor(503, "O servidor não tem a chave do app configurada.");
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${chave}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: token }) });
  if (!r.ok) throw new ErroServidor(401, "Seu login expirou. Entre de novo.");
  const u = ((await r.json()) as { users?: { localId: string; email?: string; emailVerified?: boolean; createdAt?: string; providerUserInfo?: unknown[] }[] }).users?.[0];
  if (!u) throw new ErroServidor(401, "Não reconheci o seu login.");
  return { uid: u.localId, email: u.email ?? "", emailVerificado: u.emailVerified === true, criadoEm: u.createdAt ? Number(u.createdAt) : null, anonimo: (u.providerUserInfo ?? []).length === 0 && !u.email };
}
