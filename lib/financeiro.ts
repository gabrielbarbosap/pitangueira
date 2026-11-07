// Cálculos do financeiro do escritório (honorários e parcelas a receber). Funções puras.
import type { Honorario, Parcela } from "./types";

const DIA = 86_400_000;

/** Meia-noite local do dia de `d`. */
export function meiaNoite(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** "AAAA-MM-DD" (campo de data) → meia-noite local; vazio ou inválido = null. */
export function dataDoCampo(texto: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).getTime() : null;
}

/** Meia-noite local → "AAAA-MM-DD" para o campo de data. */
export function paraCampo(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type StatusParcela = "recebida" | "vencida" | "vence_hoje" | "a_vencer";

export function statusParcela(p: Parcela, hoje: number): StatusParcela {
  if (p.recebidoEm !== null) return "recebida";
  if (p.vencimento < hoje) return "vencida";
  if (p.vencimento === hoje) return "vence_hoje";
  return "a_vencer";
}

export interface ParcelaDoContrato extends Parcela {
  honorarioId: string;
  projetoNome: string;
  cliente: string;
  contrato: string;
  /** Posição da parcela no contrato (ex.: 2 de 6), para exibir "2/6". */
  numero: number;
  de: number;
}

/** Todas as parcelas de todos os contratos, com a origem de cada uma, em ordem de vencimento. */
export function todasAsParcelas(honorarios: Honorario[]): ParcelaDoContrato[] {
  return honorarios
    .flatMap((h) => {
      const ordenadas = [...h.parcelas].sort((a, b) => a.vencimento - b.vencimento);
      return ordenadas.map((p, i) => ({ ...p, honorarioId: h.id, projetoNome: h.projetoNome, cliente: h.cliente, contrato: h.descricao, numero: i + 1, de: ordenadas.length }));
    })
    .sort((a, b) => a.vencimento - b.vencimento);
}

export interface ResumoFinanceiro {
  aReceber: number;
  vencido: number;
  qtdVencidas: number;
  recebidoNoMes: number;
  proximos30: number;
  totalContratado: number;
  totalRecebido: number;
}

export function resumoFinanceiro(honorarios: Honorario[], hoje: number): ResumoFinanceiro {
  const r: ResumoFinanceiro = { aReceber: 0, vencido: 0, qtdVencidas: 0, recebidoNoMes: 0, proximos30: 0, totalContratado: 0, totalRecebido: 0 };
  const d = new Date(hoje);
  const inicioMes = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  const fimMes = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
  for (const h of honorarios) {
    for (const p of h.parcelas) {
      r.totalContratado += p.valor;
      if (p.recebidoEm !== null) {
        r.totalRecebido += p.valor;
        if (p.recebidoEm >= inicioMes && p.recebidoEm < fimMes) r.recebidoNoMes += p.valor;
        continue;
      }
      r.aReceber += p.valor;
      if (p.vencimento < hoje) {
        r.vencido += p.valor;
        r.qtdVencidas += 1;
      } else if (p.vencimento <= hoje + 30 * DIA) {
        r.proximos30 += p.valor;
      }
    }
  }
  return r;
}

export type Periodicidade = "mensal" | "bimestral" | "trimestral" | "quinzenal";
export const ROTULO_PERIODICIDADE: Record<Periodicidade, string> = {
  mensal: "Todo mês",
  bimestral: "A cada 2 meses",
  trimestral: "A cada 3 meses",
  quinzenal: "A cada 15 dias",
};

/** Soma `n` períodos à data (meses mantêm o dia; em mês mais curto vai para o último dia). */
function somaPeriodo(base: number, n: number, p: Periodicidade): number {
  const d = new Date(base);
  if (p === "quinzenal") return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 15 * n).getTime();
  const meses = p === "mensal" ? n : p === "bimestral" ? 2 * n : 3 * n;
  const alvo = new Date(d.getFullYear(), d.getMonth() + meses, 1);
  const ultimoDia = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
  return new Date(alvo.getFullYear(), alvo.getMonth(), Math.min(d.getDate(), ultimoDia)).getTime();
}

/**
 * Divide o total em `n` parcelas iguais (os centavos que sobram vão para a última) com vencimentos
 * a partir de `primeiro`, na periodicidade escolhida.
 */
export function gerarParcelas(total: number, n: number, primeiro: number, periodicidade: Periodicidade, descricao = "Parcela"): Parcela[] {
  const qtd = Math.max(1, Math.min(60, Math.floor(n) || 1));
  const centavos = Math.round(total * 100);
  const base = Math.floor(centavos / qtd);
  return Array.from({ length: qtd }, (_, i) => {
    const valor = i === qtd - 1 ? centavos - base * (qtd - 1) : base;
    return {
      id: crypto.randomUUID(),
      descricao: qtd === 1 ? descricao : `${descricao} ${i + 1}/${qtd}`,
      valor: valor / 100,
      vencimento: somaPeriodo(primeiro, i, periodicidade),
      recebidoEm: null,
    };
  });
}

export interface PontoMes {
  mes: string;
  rotulo: string;
  Recebido: number;
  "A receber": number;
  Vencido: number;
}

const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/**
 * Parcelas por mês de vencimento, separadas em recebido / a receber / vencido.
 * Mostra de 2 meses atrás até 6 meses à frente (ou todos os meses que tenham parcelas, se couberem).
 */
export function serieMensal(honorarios: Honorario[], hoje: number): PontoMes[] {
  const d = new Date(hoje);
  const chave = (ms: number) => {
    const x = new Date(ms);
    return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
  };
  const meses = new Map<string, PontoMes>();
  const garantir = (ms: number) => {
    const k = chave(ms);
    if (!meses.has(k)) {
      const x = new Date(ms);
      meses.set(k, { mes: k, rotulo: `${MESES[x.getMonth()]}/${String(x.getFullYear()).slice(2)}`, Recebido: 0, "A receber": 0, Vencido: 0 });
    }
    return meses.get(k)!;
  };
  for (let i = -2; i <= 6; i++) garantir(new Date(d.getFullYear(), d.getMonth() + i, 1).getTime());
  for (const h of honorarios) {
    for (const p of h.parcelas) {
      const m = garantir(p.vencimento);
      const v = Math.round(p.valor);
      if (p.recebidoEm !== null) m.Recebido += v;
      else if (p.vencimento < hoje) m.Vencido += v;
      else m["A receber"] += v;
    }
  }
  return [...meses.values()].sort((a, b) => a.mes.localeCompare(b.mes));
}

/** Quanto de um contrato já foi recebido. */
export function andamentoContrato(h: Honorario) {
  const total = h.parcelas.reduce((s, p) => s + p.valor, 0);
  const recebido = h.parcelas.filter((p) => p.recebidoEm !== null).reduce((s, p) => s + p.valor, 0);
  return { total, recebido, pct: total > 0 ? Math.round((recebido / total) * 100) : 0 };
}
