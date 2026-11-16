import { addDoc, collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";

/**
 * Métricas de uso e registro de erros, sem serviço de terceiros.
 *
 * - Guarda só o que é preciso para saber SE e COMO o app é usado: nome do evento, papel (arquiteto/cliente),
 *   um identificador anônimo da conta (uid), a rota e dados técnicos simples (contagens, tipo de documento).
 * - Nunca guarda nomes, e-mails, valores em dinheiro nem o conteúdo de projetos.
 * - Na nuvem vai para a coleção `telemetria` (só dá para criar; ler é só do administrador, em /admin).
 * - No modo demo fica no navegador (localStorage), e o /admin mostra esse registro.
 */

/** Quem pode abrir /admin (as regras do banco usam o mesmo e-mail). */
export const ADMIN_EMAILS = ["gabriel@sistemap.com.br"];

export type Papel = "arquiteto" | "cliente";
export type Props = Record<string, string | number | boolean>;

export interface RegistroTelemetria {
  tipo: "evento" | "erro";
  nome: string;
  em: number;
  uid: string;
  papel: Papel | "visitante";
  rota: string;
  props?: Props;
  /** Só nos erros: mensagem e começo da pilha (limitados). */
  msg?: string;
}

const LS_CHAVE = "pitangueira:telemetria:v1";
const LS_MAX = 400;

let contexto: { uid: string; papel: Papel | "visitante" } = { uid: "anonimo", papel: "visitante" };
const errosEnviados = new Set<string>();
let totalErros = 0;

/** Quem está usando o app agora (chamado pelo componente `Telemetria`). */
export function definirContexto(uid: string | null, papel: Papel | "visitante") {
  contexto = { uid: uid ?? "anonimo", papel };
}

function limpar(props?: Props): Props | undefined {
  if (!props) return undefined;
  const saida: Props = {};
  for (const [k, v] of Object.entries(props).slice(0, 8)) saida[k.slice(0, 30)] = typeof v === "string" ? v.slice(0, 60) : v;
  return saida;
}

function guardarLocal(r: RegistroTelemetria) {
  try {
    const atual = JSON.parse(localStorage.getItem(LS_CHAVE) ?? "[]") as RegistroTelemetria[];
    atual.push(r);
    localStorage.setItem(LS_CHAVE, JSON.stringify(atual.slice(-LS_MAX)));
  } catch {
    /* sem armazenamento: tudo bem, é só medição */
  }
}

async function enviar(r: RegistroTelemetria) {
  if (typeof window === "undefined") return;
  if (!isFirebaseConfigured || !db) return guardarLocal(r);
  try {
    // Sem props/msg indefinidos: o Firestore não aceita `undefined`.
    const dados: Record<string, unknown> = { ...r };
    for (const k of Object.keys(dados)) if (dados[k] === undefined) delete dados[k];
    await addDoc(collection(db, "telemetria"), dados);
  } catch {
    /* medir nunca pode atrapalhar o uso do app */
  }
}

/** Registra algo que aconteceu (ex.: "item_adicionado"). Nunca lança erro. */
export function registrarEvento(nome: string, props?: Props) {
  if (typeof window === "undefined") return;
  void enviar({ tipo: "evento", nome: nome.slice(0, 60), em: Date.now(), ...contexto, rota: rotaGenerica(), props: limpar(props) });
}

/** Registra um erro do app. No máximo 10 por visita e sem repetir a mesma mensagem. */
export function registrarErro(origem: string, erro: unknown) {
  if (typeof window === "undefined") return;
  const msg = erro instanceof Error ? `${erro.name}: ${erro.message}\n${(erro.stack ?? "").split("\n").slice(1, 4).join("\n")}` : String(erro);
  const chave = `${origem}:${msg.slice(0, 80)}`;
  if (errosEnviados.has(chave) || totalErros >= 10) return;
  errosEnviados.add(chave);
  totalErros += 1;
  void enviar({ tipo: "erro", nome: origem.slice(0, 60), em: Date.now(), ...contexto, rota: rotaGenerica(), msg: msg.slice(0, 500) });
}

/** A rota sem o identificador do projeto (não vaza o link): /obra/abc123 → /obra/[id]. */
function rotaGenerica(): string {
  return window.location.pathname.replace(/^\/obra\/[^/]+/, "/obra/[id]").slice(0, 80);
}

/** Lê o registro dos últimos `dias` dias (administrador). Na nuvem, até 2000 registros. */
export async function lerTelemetria(dias: number): Promise<RegistroTelemetria[]> {
  const desde = Date.now() - dias * 86_400_000;
  if (!isFirebaseConfigured || !db) {
    try {
      return (JSON.parse(localStorage.getItem(LS_CHAVE) ?? "[]") as RegistroTelemetria[]).filter((r) => r.em >= desde);
    } catch {
      return [];
    }
  }
  const snap = await getDocs(query(collection(db, "telemetria"), where("em", ">=", desde), orderBy("em", "desc"), limit(2000)));
  return snap.docs.map((d) => d.data() as RegistroTelemetria);
}
