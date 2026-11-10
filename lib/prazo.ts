// Cálculos do prazo do projeto. Funções puras: `hoje` entra por parâmetro (meia-noite local, em ms).
import type { Previsao } from "./types";

const DIA = 86_400_000;

/** Dias inteiros entre duas meias-noites locais (robusto a horário de verão). */
export function diasEntre(de: number, ate: number): number {
  return Math.round((ate - de) / DIA);
}

export type UnidadePrazo = "dias" | "semanas" | "meses";

/** Início + duração → término. Meses somam meses de calendário (e não 30 dias). */
export function terminoPrevisto(inicio: number, quantidade: number, unidade: UnidadePrazo): number {
  const d = new Date(inicio);
  if (unidade === "dias") return new Date(d.getFullYear(), d.getMonth(), d.getDate() + quantidade).getTime();
  if (unidade === "semanas") return new Date(d.getFullYear(), d.getMonth(), d.getDate() + quantidade * 7).getTime();
  const alvo = new Date(d.getFullYear(), d.getMonth() + quantidade, 1);
  const ultimoDia = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
  return new Date(alvo.getFullYear(), alvo.getMonth(), Math.min(d.getDate(), ultimoDia)).getTime();
}

export type StatusPrazo = "nao_iniciado" | "no_prazo" | "atencao" | "atrasado" | "concluido";

export const ROTULO_STATUS: Record<StatusPrazo, string> = {
  nao_iniciado: "Ainda não começou",
  no_prazo: "No prazo",
  atencao: "Atenção ao ritmo",
  atrasado: "Atrasado",
  concluido: "Concluído",
};

export interface SituacaoPrazo {
  original: Previsao;
  /** A previsão em vigor: a mais recente. Igual à original enquanto não houver nova previsão. */
  vigente: Previsao;
  /** Quantas vezes o prazo foi replanejado (0 = só existe a original). */
  novasPrevisoes: number;
  /** Quanto o término vigente se afastou do original. Positivo = depois do original. */
  desvioDias: number;
  /** Dias até o término vigente. Negativo = já passou. */
  diasRestantes: number;
  /** Dias até o início. Positivo = ainda não começou. */
  diasParaInicio: number;
  /** % do tempo da previsão vigente que já passou (0 a 100). */
  pctTempo: number;
  /** % do projeto concluído (itens feitos e pagos). */
  pctConcluido: number;
  status: StatusPrazo;
}

/**
 * Situação do prazo. O ritmo compara o tempo gasto com o que já foi concluído:
 * com até 10 pontos de folga é "no prazo"; até 25, "atenção"; além disso, "atrasado".
 * Passou do término sem concluir também é "atrasado".
 */
export function situacaoDoPrazo(previsoes: Previsao[] | undefined, hoje: number, pctConcluido: number): SituacaoPrazo | null {
  if (!previsoes || previsoes.length === 0) return null;
  const original = previsoes[0];
  const vigente = previsoes[previsoes.length - 1];
  const total = Math.max(1, vigente.termino - vigente.inicio);
  const pctTempo = Math.min(100, Math.max(0, Math.round(((hoje - vigente.inicio) / total) * 100)));
  const diasRestantes = diasEntre(hoje, vigente.termino);
  const diasParaInicio = diasEntre(hoje, vigente.inicio);

  let status: StatusPrazo;
  if (pctConcluido >= 100) status = "concluido";
  else if (hoje < vigente.inicio) status = "nao_iniciado";
  else if (hoje > vigente.termino) status = "atrasado";
  else {
    const folga = pctTempo - pctConcluido;
    status = folga <= 10 ? "no_prazo" : folga <= 25 ? "atencao" : "atrasado";
  }

  return {
    original,
    vigente,
    novasPrevisoes: previsoes.length - 1,
    desvioDias: diasEntre(original.termino, vigente.termino),
    diasRestantes,
    diasParaInicio,
    pctTempo,
    pctConcluido,
    status,
  };
}

/** Texto curto do que falta (ou passou): "Faltam 47 dias", "Atrasado há 5 dias", "Começa em 3 dias". */
export function textoDeTempo(s: SituacaoPrazo): string {
  const n = (v: number) => `${Math.abs(v)} ${Math.abs(v) === 1 ? "dia" : "dias"}`;
  if (s.status === "concluido") return "Projeto concluído";
  if (s.status === "nao_iniciado") return `Começa em ${n(s.diasParaInicio)}`;
  if (s.diasRestantes < 0) return `Atrasado há ${n(s.diasRestantes)}`;
  if (s.diasRestantes === 0) return "Termina hoje";
  return `${s.diasRestantes === 1 ? "Falta" : "Faltam"} ${n(s.diasRestantes)}`;
}

/** "+21 dias" / "−10 dias" / "sem mudança", para comparar o prazo atual com o original. */
export function textoDeDesvio(dias: number): string {
  if (dias === 0) return "mesmo prazo do original";
  return `${dias > 0 ? "+" : "−"}${Math.abs(dias)} ${Math.abs(dias) === 1 ? "dia" : "dias"} do original`;
}

/** "45 dias a mais" / "10 dias a menos" / "o mesmo prazo": a nova previsão comparada com a original. */
export function textoDeDiferenca(dias: number): string {
  if (dias === 0) return "o mesmo prazo";
  return `${Math.abs(dias)} ${Math.abs(dias) === 1 ? "dia" : "dias"} ${dias > 0 ? "a mais" : "a menos"}`;
}

export const dataCurta = (ms: number) => new Date(ms).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" }).replace(".", "");
export const dataLonga = (ms: number) => new Date(ms).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
