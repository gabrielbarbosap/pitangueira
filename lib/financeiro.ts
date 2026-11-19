// Cálculos do financeiro do escritório (honorários e parcelas a receber). Funções puras.
import { blocos, campo, titulo } from "./mensagens";
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

/** Quanto entrou de uma parcela recebida: o valor informado no recebimento, ou o da parcela. */
export const valorRecebidoDe = (p: Parcela) => p.valorRecebido ?? p.valor;

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
        r.totalRecebido += valorRecebidoDe(p);
        if (p.recebidoEm >= inicioMes && p.recebidoEm < fimMes) r.recebidoNoMes += valorRecebidoDe(p);
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
      if (p.recebidoEm !== null) m.Recebido += Math.round(valorRecebidoDe(p));
      else if (p.vencimento < hoje) m.Vencido += v;
      else m["A receber"] += v;
    }
  }
  return [...meses.values()].sort((a, b) => a.mes.localeCompare(b.mes));
}

/** Quanto de um contrato já foi recebido. */
export function andamentoContrato(h: Honorario) {
  const total = h.parcelas.reduce((s, p) => s + p.valor, 0);
  const recebido = h.parcelas.filter((p) => p.recebidoEm !== null).reduce((s, p) => s + valorRecebidoDe(p), 0);
  return { total, recebido, pct: total > 0 ? Math.round((recebido / total) * 100) : 0 };
}

// ---------- Visões e ferramentas do dia a dia ----------

export const FORMAS_RECEBIMENTO = ["PIX", "Transferência", "Boleto", "Cartão", "Dinheiro", "Outro"] as const;

export type FiltroParcelas = "todas" | "vencidas" | "hoje" | "7dias" | "30dias";

export const ROTULO_FILTRO: Record<FiltroParcelas, string> = {
  todas: "Todas",
  vencidas: "Atrasadas",
  hoje: "Hoje",
  "7dias": "Próximos 7 dias",
  "30dias": "Próximos 30 dias",
};

const semAcento = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** As parcelas em aberto que cabem no filtro de prazo e na busca (cliente, projeto ou descrição). */
export function filtrarAbertas(parcelas: ParcelaDoContrato[], filtro: FiltroParcelas, hoje: number, busca = ""): ParcelaDoContrato[] {
  const q = semAcento(busca.trim());
  return parcelas.filter((p) => {
    if (p.recebidoEm !== null) return false;
    if (filtro === "vencidas" && !(p.vencimento < hoje)) return false;
    if (filtro === "hoje" && p.vencimento !== hoje) return false;
    if (filtro === "7dias" && !(p.vencimento >= hoje && p.vencimento <= hoje + 7 * DIA)) return false;
    if (filtro === "30dias" && !(p.vencimento >= hoje && p.vencimento <= hoje + 30 * DIA)) return false;
    return !q || semAcento(`${p.cliente} ${p.projetoNome} ${p.contrato} ${p.descricao}`).includes(q);
  });
}

/** Quanto de cada filtro tem em aberto (para mostrar a contagem no botão do filtro). */
export function contagemPorFiltro(parcelas: ParcelaDoContrato[], hoje: number): Record<FiltroParcelas, number> {
  return {
    todas: filtrarAbertas(parcelas, "todas", hoje).length,
    vencidas: filtrarAbertas(parcelas, "vencidas", hoje).length,
    hoje: filtrarAbertas(parcelas, "hoje", hoje).length,
    "7dias": filtrarAbertas(parcelas, "7dias", hoje).length,
    "30dias": filtrarAbertas(parcelas, "30dias", hoje).length,
  };
}

export interface FaixaAtraso {
  rotulo: string;
  valor: number;
  qtd: number;
}

/** O que está atrasado, separado por há quanto tempo (o relatório clássico de contas a receber vencidas). */
export function faixasDeAtraso(parcelas: ParcelaDoContrato[], hoje: number): FaixaAtraso[] {
  const faixas: FaixaAtraso[] = [
    { rotulo: "1 a 15 dias", valor: 0, qtd: 0 },
    { rotulo: "16 a 30 dias", valor: 0, qtd: 0 },
    { rotulo: "31 a 60 dias", valor: 0, qtd: 0 },
    { rotulo: "Mais de 60 dias", valor: 0, qtd: 0 },
  ];
  for (const p of parcelas) {
    if (p.recebidoEm !== null || p.vencimento >= hoje) continue;
    const dias = Math.round((hoje - p.vencimento) / DIA);
    const f = dias <= 15 ? faixas[0] : dias <= 30 ? faixas[1] : dias <= 60 ? faixas[2] : faixas[3];
    f.valor += p.valor;
    f.qtd += 1;
  }
  return faixas;
}

export interface ResumoCliente {
  cliente: string;
  contratos: number;
  contratado: number;
  recebido: number;
  aReceber: number;
  vencido: number;
}

/** Quanto cada cliente contratou, já pagou, ainda deve e está atrasado. Os que mais devem primeiro. */
export function porCliente(honorarios: Honorario[], hoje: number): ResumoCliente[] {
  const mapa = new Map<string, ResumoCliente>();
  for (const h of honorarios) {
    const nome = h.cliente.trim() || "Sem cliente";
    const chave = semAcento(nome);
    const r = mapa.get(chave) ?? { cliente: nome, contratos: 0, contratado: 0, recebido: 0, aReceber: 0, vencido: 0 };
    r.contratos += 1;
    for (const p of h.parcelas) {
      r.contratado += p.valor;
      if (p.recebidoEm !== null) r.recebido += valorRecebidoDe(p);
      else {
        r.aReceber += p.valor;
        if (p.vencimento < hoje) r.vencido += p.valor;
      }
    }
    mapa.set(chave, r);
  }
  return [...mapa.values()].sort((a, b) => b.vencido - a.vencido || b.aReceber - a.aReceber || a.cliente.localeCompare(b.cliente, "pt-BR"));
}

export interface Indicadores {
  /** O que vence de hoje até 90 dias (sem contar o que já está atrasado). */
  previsao90: number;
  /** Média por mês do que entrou nos últimos 3 meses. */
  mediaMensal: number;
  /** % do que já venceu até hoje que continua sem receber (0 a 100). */
  inadimplencia: number;
}

export function indicadores(honorarios: Honorario[], hoje: number): Indicadores {
  const d = new Date(hoje);
  const tresMesesAtras = new Date(d.getFullYear(), d.getMonth() - 3, d.getDate()).getTime();
  let previsao90 = 0;
  let entrou3 = 0;
  let venceuAteHoje = 0;
  let vencidoAberto = 0;
  for (const h of honorarios) {
    for (const p of h.parcelas) {
      if (p.recebidoEm !== null) {
        if (p.recebidoEm >= tresMesesAtras) entrou3 += valorRecebidoDe(p);
        if (p.vencimento < hoje) venceuAteHoje += p.valor;
      } else if (p.vencimento < hoje) {
        venceuAteHoje += p.valor;
        vencidoAberto += p.valor;
      } else if (p.vencimento <= hoje + 90 * DIA) {
        previsao90 += p.valor;
      }
    }
  }
  return { previsao90, mediaMensal: entrou3 / 3, inadimplencia: venceuAteHoje > 0 ? Math.round((vencidoAberto / venceuAteHoje) * 100) : 0 };
}

const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dataBr = (ms: number) => new Date(ms).toLocaleDateString("pt-BR");

/** Texto de cobrança educado, com o valor, o vencimento e a chave PIX (se houver). */
export function mensagemCobranca(p: { cliente: string; projeto: string; descricao: string; valor: number; vencimento: number; hoje: number; pix?: string; escritorio?: string }): string {
  const dias = Math.round((p.hoje - p.vencimento) / DIA);
  const situacao =
    dias > 0 ? `${dataBr(p.vencimento)} (venceu há ${dias} ${dias === 1 ? "dia" : "dias"})` : dias === 0 ? `${dataBr(p.vencimento)} (vence hoje)` : `${dataBr(p.vencimento)} (vence em ${Math.abs(dias)} ${Math.abs(dias) === 1 ? "dia" : "dias"})`;
  return blocos([
    p.cliente.trim() ? `Olá, ${p.cliente.trim()}! 👋` : "Olá! 👋",
    titulo("💰", dias > 0 ? "Pagamento em aberto" : "Lembrete de pagamento"),
    [campo("🏗️", "Projeto", p.projeto), campo("🧾", "Parcela", p.descricao), campo("💵", "Valor", reais(p.valor)), campo("📅", "Vencimento", situacao)].join("\n"),
    p.pix?.trim() && `${titulo("💳", "Chave PIX")}\n${p.pix.trim()}`,
    dias > 0 ? "Se já pagou, desconsidere e me avise para eu dar baixa. Obrigado! 🙏" : "Qualquer dúvida, é só falar. Obrigado! 🙏",
    p.escritorio?.trim() && `— ${p.escritorio.trim()}`,
  ]);
}

/** Planilha (CSV com ; e acentos corretos no Excel) de todas as parcelas, para o contador ou para guardar. */
export function csvParcelas(parcelas: ParcelaDoContrato[], hoje: number): string {
  const ROTULO: Record<StatusParcela, string> = { recebida: "Recebida", vencida: "Vencida", vence_hoje: "Vence hoje", a_vencer: "A vencer" };
  const cel = (v: string | number) => {
    const t = String(v);
    return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const num = (v: number) => v.toFixed(2).replace(".", ",");
  const linhas = [["Projeto", "Cliente", "Contrato", "Parcela", "Vencimento", "Valor", "Situação", "Recebido em", "Valor recebido", "Forma", "Observação"]];
  for (const p of parcelas) {
    linhas.push([
      p.projetoNome,
      p.cliente,
      p.contrato,
      `${p.numero}/${p.de}`,
      dataBr(p.vencimento),
      num(p.valor),
      ROTULO[statusParcela(p, hoje)],
      p.recebidoEm !== null ? dataBr(p.recebidoEm) : "",
      p.recebidoEm !== null ? num(valorRecebidoDe(p)) : "",
      p.forma ?? "",
      p.obs ?? "",
    ]);
  }
  return "\uFEFF" + linhas.map((l) => l.map(cel).join(";")).join("\r\n");
}
