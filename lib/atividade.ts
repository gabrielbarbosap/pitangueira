import type { Item } from "./types";

/** Uma marcação de Feito ou Pago, com quem fez e quando. */
export interface Atividade {
  itemId: string;
  descricao: string;
  etapa: string;
  tipo: "feito" | "pago";
  quem: string;
  /** Marcação feita pelo cliente (o nome vem gravado como "Nome (cliente)"). */
  porCliente: boolean;
  quando: number;
}

const SUFIXO_CLIENTE = / \(cliente\)$/;

/** Separa o nome de quem marcou do aviso "(cliente)". */
export function quemMarcou(autor: string): { nome: string; cliente: boolean } {
  return { nome: autor.replace(SUFIXO_CLIENTE, ""), cliente: SUFIXO_CLIENTE.test(autor) };
}

/**
 * As últimas marcações de Feito e Pago, da mais recente para a mais antiga.
 * Itens marcados antes de o app guardar data e autor não aparecem (não há como saber).
 */
export function atividadeRecente(itens: Item[], limite = 8): Atividade[] {
  const lista: Atividade[] = [];
  for (const i of itens) {
    if (i.feito && i.feitoEm) {
      const q = quemMarcou(i.feitoPor ?? "");
      lista.push({ itemId: i.id, descricao: i.descricao, etapa: i.etapa, tipo: "feito", quem: q.nome || "Alguém", porCliente: q.cliente, quando: i.feitoEm });
    }
    if (i.pago && i.pagoEm) {
      const q = quemMarcou(i.pagoPor ?? "");
      lista.push({ itemId: i.id, descricao: i.descricao, etapa: i.etapa, tipo: "pago", quem: q.nome || "Alguém", porCliente: q.cliente, quando: i.pagoEm });
    }
  }
  return lista.sort((a, b) => b.quando - a.quando).slice(0, limite);
}

const hora = (ms: number) => new Date(ms).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const dia = (ms: number) => new Date(ms).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

/** "hoje 14:30", "ontem 09:10" ou "12/11 14:30". `inicioDeHoje` é a meia-noite de hoje (0 = ainda não sabemos: só a data). */
export function quandoTexto(ms: number, inicioDeHoje: number): string {
  if (!inicioDeHoje) return `${dia(ms)} ${hora(ms)}`;
  const DIA = 86_400_000;
  if (ms >= inicioDeHoje) return `hoje ${hora(ms)}`;
  if (ms >= inicioDeHoje - DIA) return `ontem ${hora(ms)}`;
  return `${dia(ms)} ${hora(ms)}`;
}
