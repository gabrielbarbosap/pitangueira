// Acompanhamento do projeto: a linha do tempo e as mensagens que o arquiteto encaminha pelo WhatsApp. Funções puras.
import type { Gravidade, Item, ItemVistoria, Ocorrencia, Previsao, Visita } from "./types";

export type TipoEvento = "andamento" | "prazo" | "visita" | "ocorrencia" | "vistoria";

export const ROTULO_TIPO: Record<TipoEvento, string> = {
  andamento: "Andamento",
  prazo: "Prazo",
  visita: "Visitas",
  ocorrencia: "Ocorrências",
  vistoria: "Vistoria",
};

export interface Evento {
  id: string;
  tipo: TipoEvento;
  titulo: string;
  detalhe?: string;
  /** Data do fato, em ms (pode ser futura, no caso de uma visita agendada). */
  quando: number;
  quem?: string;
  porCliente?: boolean;
  /** Texto pronto para encaminhar ao cliente (vazio = não tem o que encaminhar). */
  mensagem?: string;
}

export const ROTULO_GRAVIDADE: Record<Gravidade, string> = { baixa: "Baixa", media: "Média", alta: "Alta" };

const dataBr = (ms: number) => new Date(ms).toLocaleDateString("pt-BR");
const horaBr = (ms: number) => new Date(ms).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
export const dataHoraBr = (ms: number) => `${dataBr(ms)} às ${horaBr(ms)}`;
const diaChave = (ms: number) => new Date(ms).toLocaleDateString("sv-SE");
const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Contexto das mensagens: para quem, de qual projeto e com qual link. */
export interface ContextoMensagem {
  cliente: string;
  projeto: string;
  escritorio: string;
  link: string;
}

function moldura(c: ContextoMensagem, corpo: string[]): string {
  const saudacao = c.cliente.trim() ? `Olá, ${c.cliente.trim()}!` : "Olá!";
  const partes = [`${saudacao} Atualização do projeto ${c.projeto}:`, ...corpo];
  if (c.link) partes.push(`Veja tudo no app: ${c.link}`);
  if (c.escritorio.trim()) partes.push(`— ${c.escritorio.trim()}`);
  return partes.join("\n\n");
}

export function mensagemVisitaAgendada(v: Visita, c: ContextoMensagem): string {
  const linhas = [`📅 Visita agendada: ${v.titulo}`, `Quando: ${dataHoraBr(v.quando)}`];
  if (v.local.trim()) linhas.push(`Onde: ${v.local.trim()}`);
  if (v.participantes.trim()) linhas.push(`Quem: ${v.participantes.trim()}`);
  const partes = [linhas.join("\n")];
  if (v.pauta.trim()) partes.push(`Pauta:\n${v.pauta.trim()}`);
  partes.push("Pode confirmar presença por aqui?");
  return moldura(c, partes);
}

export function mensagemAta(v: Visita, c: ContextoMensagem): string {
  const partes = [`📝 Ata da visita "${v.titulo}" (${dataBr(v.quando)})`];
  partes.push(v.ata.trim() ? `O que ficou combinado:\n${v.ata.trim()}` : "Visita realizada. A ata será enviada em seguida.");
  return moldura(c, partes);
}

export function mensagemOcorrencia(o: Ocorrencia, c: ContextoMensagem): string {
  if (o.status === "resolvida") {
    const partes = [`✅ Ocorrência resolvida: ${o.titulo}`];
    if (o.resolucao.trim()) partes.push(`Como foi resolvido:\n${o.resolucao.trim()}`);
    return moldura(c, partes);
  }
  const linhas = [`⚠️ Ocorrência (${ROTULO_GRAVIDADE[o.gravidade].toLowerCase()}): ${o.titulo}`];
  if (o.descricao.trim()) linhas.push(o.descricao.trim());
  if (o.responsavel.trim()) linhas.push(`Responsável: ${o.responsavel.trim()}`);
  return moldura(c, [linhas.join("\n"), "Já estamos cuidando. Aviso assim que for resolvido."]);
}

export function mensagemVistoria(itens: ItemVistoria[], c: ContextoMensagem): string {
  const ok = itens.filter((i) => i.status === "ok").length;
  const ajustar = itens.filter((i) => i.status === "ajustar");
  const pendentes = itens.filter((i) => i.status === "pendente");
  const partes = [`🔍 Vistoria final: ${ok} de ${itens.length} pontos conferidos.`];
  if (ajustar.length) partes.push(`Pedem ajuste:\n${ajustar.map((i) => `• ${i.texto}${i.ambiente ? ` (${i.ambiente})` : ""}${i.obs ? ` — ${i.obs}` : ""}`).join("\n")}`);
  if (pendentes.length) partes.push(`Faltam conferir: ${plural(pendentes.length, "ponto", "pontos")}. Dá uma olhada no app e marque o que estiver ok.`);
  if (!ajustar.length && !pendentes.length) partes.push("Está tudo conferido. 🎉");
  return moldura(c, partes);
}

/** Mensagem de um fato da linha do tempo. */
export function mensagemDoEvento(e: Evento, c: ContextoMensagem): string {
  const corpo = [`${e.titulo}${e.detalhe ? `\n${e.detalhe}` : ""}`];
  return moldura(c, corpo);
}

/** Resumo do que aconteceu nos últimos dias (padrão 7), pronto para encaminhar. */
export function mensagemResumo(eventos: Evento[], desde: number, c: ContextoMensagem): string {
  const recentes = eventos.filter((e) => e.quando >= desde && e.quando <= Date.now() + 1000);
  if (recentes.length === 0) return moldura(c, ["Sem novidades nesta semana. Qualquer coisa eu aviso por aqui."]);
  const linhas = recentes.slice(0, 10).map((e) => `• ${e.titulo}${e.detalhe ? ` — ${e.detalhe}` : ""}`);
  if (recentes.length > 10) linhas.push(`• e mais ${recentes.length - 10}…`);
  return moldura(c, [`O que aconteceu nos últimos dias:\n${linhas.join("\n")}`]);
}

interface Fontes {
  itens: Item[];
  previsoes: Previsao[];
  visitas: Visita[];
  ocorrencias: Ocorrencia[];
  vistoria: ItemVistoria[];
}

/** Todos os fatos do projeto em ordem do mais recente para o mais antigo. Itens marcados no mesmo dia, pela mesma pessoa e na mesma etapa viram uma linha só. */
export function montarLinhaDoTempo({ itens, previsoes, visitas, ocorrencias, vistoria }: Fontes): Evento[] {
  const eventos: Evento[] = [];

  // Andamento: feito e pago, agrupados.
  const grupos = new Map<string, { tipo: "feito" | "pago"; quem: string; porCliente: boolean; etapa: string; quando: number; descricoes: string[] }>();
  for (const i of itens) {
    for (const [tipo, ok, em, por] of [
      ["feito", i.feito, i.feitoEm, i.feitoPor],
      ["pago", i.pago, i.pagoEm, i.pagoPor],
    ] as const) {
      if (!ok || !em) continue;
      const cliente = / \(cliente\)$/.test(por ?? "");
      const quem = (por ?? "").replace(/ \(cliente\)$/, "") || "Alguém";
      const etapa = i.etapa?.trim() || "Sem etapa";
      const chave = `${tipo}|${quem}|${cliente}|${etapa}|${diaChave(em)}`;
      const g = grupos.get(chave) ?? { tipo, quem, porCliente: cliente, etapa, quando: em, descricoes: [] };
      g.quando = Math.max(g.quando, em);
      g.descricoes.push(i.descricao);
      grupos.set(chave, g);
    }
  }
  for (const [chave, g] of grupos) {
    const n = g.descricoes.length;
    const acao = g.tipo === "feito" ? "feito" : "pago";
    eventos.push({
      id: `item|${chave}`,
      tipo: "andamento",
      titulo: n === 1 ? `“${g.descricoes[0]}” marcado como ${acao}` : `${plural(n, "item", "itens")} de ${g.etapa} marcados como ${g.tipo === "feito" ? "feitos" : "pagos"}`,
      detalhe: n === 1 ? g.etapa : g.descricoes.slice(0, 3).join(", ") + (n > 3 ? ` e mais ${n - 3}` : ""),
      quando: g.quando,
      quem: g.quem,
      porCliente: g.porCliente,
    });
  }

  // Prazo
  for (const p of previsoes) {
    eventos.push({
      id: `previsao|${p.id}`,
      tipo: "prazo",
      titulo: p.numero === 1 ? "Prazo original registrado" : `Nova previsão de prazo (${p.numero}ª)`,
      detalhe: `Término previsto em ${dataBr(p.termino)}${p.motivo ? ` — ${p.motivo}` : ""}`,
      quando: p.registradaEm,
      quem: p.registradaPor,
    });
  }

  // Visitas
  for (const v of visitas) {
    const rotulo = v.status === "realizada" ? "Visita realizada" : v.status === "cancelada" ? "Visita cancelada" : "Visita agendada";
    eventos.push({
      id: `visita|${v.id}`,
      tipo: "visita",
      titulo: `${rotulo}: ${v.titulo}`,
      detalhe: v.status === "realizada" && v.ata.trim() ? v.ata.trim() : [dataHoraBr(v.quando), v.local].filter(Boolean).join(" · "),
      quando: v.quando,
    });
  }

  // Ocorrências
  for (const o of ocorrencias) {
    eventos.push({ id: `ocorrencia-aberta|${o.id}`, tipo: "ocorrencia", titulo: `Ocorrência aberta: ${o.titulo}`, detalhe: `Gravidade ${ROTULO_GRAVIDADE[o.gravidade].toLowerCase()}${o.responsavel ? ` · ${o.responsavel}` : ""}`, quando: o.abertaEm });
    if (o.status === "resolvida" && o.resolvidaEm) {
      eventos.push({ id: `ocorrencia-resolvida|${o.id}`, tipo: "ocorrencia", titulo: `Ocorrência resolvida: ${o.titulo}`, detalhe: o.resolucao || undefined, quando: o.resolvidaEm });
    }
  }

  // Vistoria: conferências agrupadas por dia e resultado.
  const conferidos = new Map<string, { ok: boolean; quando: number; qtd: number; quem?: string; porCliente: boolean }>();
  for (const i of vistoria) {
    if (i.status === "pendente" || !i.conferidoEm) continue;
    const cliente = / \(cliente\)$/.test(i.conferidoPor ?? "");
    const quem = (i.conferidoPor ?? "").replace(/ \(cliente\)$/, "") || undefined;
    const chave = `${i.status}|${quem ?? ""}|${cliente}|${diaChave(i.conferidoEm)}`;
    const g = conferidos.get(chave) ?? { ok: i.status === "ok", quando: i.conferidoEm, qtd: 0, quem, porCliente: cliente };
    g.qtd += 1;
    g.quando = Math.max(g.quando, i.conferidoEm);
    conferidos.set(chave, g);
  }
  for (const [chave, g] of conferidos) {
    eventos.push({
      id: `vistoria|${chave}`,
      tipo: "vistoria",
      titulo: g.ok ? `${plural(g.qtd, "ponto conferido", "pontos conferidos")} na vistoria` : `${plural(g.qtd, "ponto", "pontos")} da vistoria ${g.qtd === 1 ? "pede" : "pedem"} ajuste`,
      quando: g.quando,
      quem: g.quem,
      porCliente: g.porCliente,
    });
  }

  return eventos.sort((a, b) => b.quando - a.quando);
}

/** Pontos comuns de uma vistoria final de obra, para o arquiteto começar de um modelo. */
export const MODELO_VISTORIA: { ambiente: string; texto: string }[] = [
  { ambiente: "Geral", texto: "Pintura sem manchas, falhas ou respingos" },
  { ambiente: "Geral", texto: "Tomadas e interruptores funcionando e bem fixados" },
  { ambiente: "Geral", texto: "Luminárias e pontos de luz funcionando" },
  { ambiente: "Geral", texto: "Portas e janelas abrem, fecham e travam bem" },
  { ambiente: "Geral", texto: "Pisos e revestimentos sem peças soltas, trincadas ou manchadas" },
  { ambiente: "Geral", texto: "Rodapés e acabamentos bem fixados" },
  { ambiente: "Banheiros", texto: "Torneiras, chuveiros e registros sem vazamento" },
  { ambiente: "Banheiros", texto: "Ralos escoando bem e vasos descarregando" },
  { ambiente: "Cozinha", texto: "Pia, torneira e sifão sem vazamento" },
  { ambiente: "Cozinha", texto: "Bancadas e armários alinhados, com portas e gavetas funcionando" },
  { ambiente: "Geral", texto: "Limpeza final feita e entulho retirado" },
  { ambiente: "Geral", texto: "Manuais, garantias e chaves entregues" },
];
