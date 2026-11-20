// Acompanhamento do projeto: a linha do tempo e as mensagens que o arquiteto encaminha pelo WhatsApp. Funções puras.
import { abertura, blocos, bullets, campo, comoLista, fecho, titulo } from "./mensagens";
import type { CobrancaObra, Gravidade, Item, ItemVistoria, Ocorrencia, Previsao, Publicacao, Visita } from "./types";

export type TipoEvento = "publicacao" | "andamento" | "valor" | "cobranca" | "prazo" | "visita" | "ocorrencia" | "vistoria";

export const ROTULO_TIPO: Record<TipoEvento, string> = {
  publicacao: "Avisos",
  andamento: "Andamento",
  valor: "Valores",
  cobranca: "Cobranças",
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
  /** Uid de quem criou (publicações): serve para o autor remover o que é dele. */
  donoUid?: string;
  /** Valor que mudou (só em "valor"): a tela formata com o olhinho de privacidade. */
  valor?: { de: number; para: number };
  /** Total e vencimento (só em "cobranca"). */
  dinheiro?: { total: number; vencimento: number | null };
  /** Nomes dos itens (só no andamento), para mostrar como etiquetas no cartão. */
  itens?: string[];
  /** Texto pronto para encaminhar ao cliente (vazio = não tem o que encaminhar). */
  mensagem?: string;
}

export const ROTULO_GRAVIDADE: Record<Gravidade, string> = { baixa: "Baixa", media: "Média", alta: "Alta" };

const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
  /** Quem está mandando: o arquiteto (fala com o cliente) ou o cliente (fala com o arquiteto). */
  remetente?: "arquiteto" | "cliente";
  /** Nome de quem manda (usado quando é o cliente). */
  nomeRemetente?: string;
}

/** Abertura (saudação e projeto), os blocos da mensagem e o fecho (link e assinatura). */
function moldura(c: ContextoMensagem, corpo: (string | false | null | undefined)[], opts: { link?: string } = {}): string {
  const doCliente = c.remetente === "cliente";
  return blocos([
    abertura(doCliente ? { projeto: c.projeto, remetente: c.nomeRemetente?.trim() || "o cliente" } : { destinatario: c.cliente, projeto: c.projeto }),
    ...corpo,
    fecho({ link: opts.link ?? c.link, assinatura: doCliente ? "" : c.escritorio }),
  ]);
}

const DIAS_SEMANA_CURTO = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

/** "sábado, 21/11/2026 às 09:00" */
export function dataLonga(ms: number): string {
  return `${DIAS_SEMANA_CURTO[new Date(ms).getDay()]}, ${dataBr(ms)} às ${horaBr(ms)}`;
}

/** Endereço que abre o projeto já na visita (o arquiteto toca no link do WhatsApp e cai direto nela, para aprovar). */
export function linkDaVisita(c: ContextoMensagem, v: Visita): string {
  return c.link ? `${c.link}?visita=${v.id}` : "";
}

function dadosDaVisita(v: Visita): string[] {
  return [campo("🕒", "Quando", dataLonga(v.quando)), v.local.trim() && campo("📍", "Onde", v.local.trim()), v.participantes.trim() && campo("👥", "Quem", v.participantes.trim())].filter(Boolean) as string[];
}

export function mensagemVisitaAgendada(v: Visita, c: ContextoMensagem): string {
  return moldura(c, [
    `${titulo("📅", "Visita agendada")}\n${v.titulo}`,
    dadosDaVisita(v).join("\n"),
    v.pauta.trim() && `${titulo("📝", "Pauta")}\n${comoLista(v.pauta)}`,
    "Pode confirmar presença por aqui? 🙏",
  ]);
}

/** O cliente pede uma visita e manda o link para o arquiteto aprovar (o link abre o projeto direto no pedido). */
export function mensagemPedidoVisita(v: Visita, c: ContextoMensagem): string {
  return moldura(
    c,
    [
      `${titulo("🙋", "Pedido de visita")}\n${v.titulo}`,
      dadosDaVisita(v).join("\n"),
      v.pauta.trim() && `${titulo("📝", "Motivo")}\n${comoLista(v.pauta)}`,
      "Pode aprovar, ou sugerir outro horário, por este link? 🙏",
    ],
    { link: linkDaVisita(c, v) },
  );
}

/** O arquiteto aprovou o pedido do cliente. */
export function mensagemVisitaAprovada(v: Visita, c: ContextoMensagem): string {
  return moldura(c, [`${titulo("✅", "Visita confirmada")}\n${v.titulo}`, dadosDaVisita(v).join("\n"), "Combinado! Até lá. 🙌"]);
}

/** O arquiteto não pôde no horário pedido. */
export function mensagemVisitaRecusada(v: Visita, c: ContextoMensagem): string {
  return moldura(c, [
    `${titulo("🔄", "Sobre o seu pedido de visita")}\n${v.titulo} (${dataLonga(v.quando)})`,
    v.ata.trim() ? `${titulo("💬", "Resposta")}\n${v.ata.trim()}` : "Não consigo nesse horário. Podemos combinar outro? 🙏",
  ]);
}

export function mensagemAta(v: Visita, c: ContextoMensagem): string {
  return moldura(c, [
    `${titulo("📝", "Ata da visita")}\n${v.titulo} · ${dataBr(v.quando)}`,
    v.ata.trim() ? `${titulo("✅", "O que ficou combinado")}\n${comoLista(v.ata)}` : "Visita realizada. A ata segue em seguida.",
  ]);
}

const EMOJI_GRAVIDADE: Record<Gravidade, string> = { alta: "🔴", media: "🟡", baixa: "🟢" };

export function mensagemOcorrencia(o: Ocorrencia, c: ContextoMensagem): string {
  if (o.status === "resolvida") {
    return moldura(c, [`${titulo("✅", "Ocorrência resolvida")}\n${o.titulo}`, o.resolucao.trim() && `${titulo("🛠️", "Como foi resolvido")}\n${comoLista(o.resolucao)}`]);
  }
  return moldura(c, [
    `${titulo("⚠️", "Ocorrência")}\n${o.titulo}`,
    [campo(EMOJI_GRAVIDADE[o.gravidade], "Gravidade", ROTULO_GRAVIDADE[o.gravidade]), o.responsavel.trim() && campo("👷", "Responsável", o.responsavel.trim())].filter(Boolean).join("\n"),
    o.descricao.trim() && `${titulo("📋", "Detalhes")}\n${comoLista(o.descricao)}`,
    "Já estamos cuidando. Aviso por aqui assim que for resolvido. 🤝",
  ]);
}

export function mensagemPublicacao(p: Publicacao, c: ContextoMensagem): string {
  const doCliente = c.remetente === "cliente";
  return moldura(c, [`${titulo(doCliente ? "💬" : "📢", doCliente ? "Recado" : "Novidade da obra")}\n${comoLista(p.texto)}`]);
}

const limitar = (itens: string[], max = 6) => (itens.length > max ? [...itens.slice(0, max), `e mais ${itens.length - max}…`] : itens);

export function mensagemVistoria(itens: ItemVistoria[], c: ContextoMensagem): string {
  const doCliente = c.remetente === "cliente";
  const ok = itens.filter((i) => i.status === "ok").length;
  const ajustar = itens.filter((i) => i.status === "ajustar");
  const pendentes = itens.filter((i) => i.status === "pendente");
  const pct = itens.length ? Math.round((ok / itens.length) * 100) : 0;
  const rotulo = (i: ItemVistoria) => `${i.texto}${i.ambiente && i.ambiente !== "Geral" ? ` (${i.ambiente})` : ""}${i.obs ? ` — ${i.obs}` : ""}`;
  return moldura(c, [
    `${titulo("🔍", "Vistoria final")}\n${campo("✅", "Conferidos", `${ok} de ${itens.length} pontos (${pct}%)${doCliente ? ", por mim" : ""}`)}`,
    ajustar.length > 0 && `${titulo("🔧", doCliente ? `Peço ajuste (${ajustar.length})` : `Pedem ajuste (${ajustar.length})`)}\n${bullets(limitar(ajustar.map(rotulo)))}`,
    pendentes.length > 0 && `${titulo("⏳", `Faltam conferir (${pendentes.length})`)}\n${bullets(limitar(pendentes.map(rotulo)))}`,
    !ajustar.length && !pendentes.length && "Está tudo conferido. 🎉",
    ajustar.length + pendentes.length > 0 && !doCliente && "Pode dar uma olhada no app e marcar o que estiver ok? 🙏",
  ]);
}

const EMOJI_TIPO: Record<TipoEvento, string> = { publicacao: "📢", andamento: "✅", valor: "💲", cobranca: "💰", prazo: "🗓️", visita: "📅", ocorrencia: "⚠️", vistoria: "🔍" };
const ROTULO_UNICO: Record<TipoEvento, string> = { publicacao: "Novidade da obra", andamento: "Andamento", valor: "Valor alterado", cobranca: "Cobrança", prazo: "Prazo", visita: "Visita", ocorrencia: "Ocorrência", vistoria: "Vistoria" };

/** Mensagem de um fato da linha do tempo. */
export function mensagemDoEvento(e: Evento, c: ContextoMensagem): string {
  return moldura(c, [`${titulo(EMOJI_TIPO[e.tipo], ROTULO_UNICO[e.tipo])}\n${e.titulo}`, e.detalhe?.trim() && comoLista(e.detalhe)]);
}

/** Resumo do que aconteceu nos últimos dias, pronto para encaminhar. */
export function mensagemResumo(eventos: Evento[], desde: number, c: ContextoMensagem): string {
  const agora = Date.now();
  const recentes = eventos.filter((e) => e.quando >= desde && e.quando <= agora + 1000);
  const periodo = `_${dataBr(desde)} a ${dataBr(agora)}_`;
  if (recentes.length === 0) return moldura(c, [`${titulo("📋", "Resumo da semana")}\n${periodo}`, "Sem novidades nesta semana. Qualquer coisa aviso por aqui."]);
  const linhas = recentes.slice(0, 10).map((e) => `${EMOJI_TIPO[e.tipo]} ${e.titulo} _(${dataBr(e.quando).slice(0, 5)})_`);
  if (recentes.length > 10) linhas.push(`e mais ${recentes.length - 10}…`);
  return moldura(c, [`${titulo("📋", "Resumo da semana")}\n${periodo}`, bullets(linhas)]);
}

interface Fontes {
  itens: Item[];
  previsoes: Previsao[];
  visitas: Visita[];
  ocorrencias: Ocorrencia[];
  vistoria: ItemVistoria[];
  publicacoes?: Publicacao[];
  cobrancas?: CobrancaObra[];
}

/** Todos os fatos do projeto em ordem do mais recente para o mais antigo. Itens marcados no mesmo dia, pela mesma pessoa e na mesma etapa viram uma linha só. */
export function montarLinhaDoTempo({ itens, previsoes, visitas, ocorrencias, vistoria, publicacoes = [], cobrancas = [] }: Fontes): Evento[] {
  const eventos: Evento[] = [];

  // Avisos publicados pelo arquiteto
  for (const p of publicacoes) {
    const doCliente = / \(cliente\)$/.test(p.autor);
    eventos.push({ id: `publicacao|${p.id}`, tipo: "publicacao", titulo: p.texto, quando: p.createdAt ?? 0, quem: p.autor.replace(/ \(cliente\)$/, ""), porCliente: doCliente, donoUid: p.autorUid });
  }

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
      detalhe: n === 1 ? g.etapa : undefined,
      itens: n === 1 ? undefined : g.descricoes,
      quando: g.quando,
      quem: g.quem,
      porCliente: g.porCliente,
    });
  }

  // Valores que mudaram: de quanto para quanto, e se ficou mais caro ou mais barato.
  for (const i of itens) {
    for (const h of i.historicoValor ?? []) {
      const sobe = h.para > h.de;
      const dif = Math.abs(h.para - h.de);
      eventos.push({
        id: `valor|${i.id}|${h.em}`,
        tipo: "valor",
        titulo: `Valor alterado: ${i.descricao}`,
        detalhe: `${reais(h.de)} → ${reais(h.para)} (${sobe ? "+" : "−"}${reais(dif)}, ficou mais ${sobe ? "caro" : "barato"})`,
        valor: { de: h.de, para: h.para },
        quando: h.em,
        quem: h.por.replace(/ \(cliente\)$/, ""),
      });
    }
  }

  // Cobranças geradas e pagas
  for (const c of cobrancas) {
    const venc = c.vencimento ? ` · vence em ${dataBr(c.vencimento)}` : "";
    eventos.push({ id: `cobranca|${c.id}`, tipo: "cobranca", titulo: `Cobrança gerada: ${c.titulo}`, detalhe: `${reais(c.total)}${venc}`, dinheiro: { total: c.total, vencimento: c.vencimento }, quando: c.createdAt ?? 0, quem: c.criadoPor });
    if (c.status === "paga" && c.pagaEm) {
      eventos.push({ id: `cobranca-paga|${c.id}`, tipo: "cobranca", titulo: `Cobrança paga: ${c.titulo}`, detalhe: reais(c.total), dinheiro: { total: c.total, vencimento: c.vencimento }, quando: c.pagaEm });
    }
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
    const pedido = v.status === "solicitada" || v.status === "recusada";
    const rotulo = { solicitada: "Visita solicitada", recusada: "Pedido de visita recusado", realizada: "Visita realizada", cancelada: "Visita cancelada", agendada: "Visita agendada" }[v.status];
    const cliente = / \(cliente\)$/.test(v.criadoPorNome ?? "");
    eventos.push({
      id: `visita|${v.id}`,
      tipo: "visita",
      titulo: `${rotulo}: ${v.titulo}`,
      detalhe:
        v.status === "recusada" && v.ata.trim()
          ? `Resposta: ${v.ata.trim()}`
          : v.status === "realizada" && v.ata.trim()
            ? v.ata.trim()
            : [pedido ? `Para ${dataLonga(v.quando)}` : dataHoraBr(v.quando), v.local].filter(Boolean).join(" · "),
      // Um pedido é um fato de agora (de quando foi feito), não do dia da visita.
      quando: pedido ? (v.createdAt ?? v.quando) : v.quando,
      quem: v.status === "solicitada" && cliente ? (v.criadoPorNome ?? "").replace(/ \(cliente\)$/, "") : undefined,
      porCliente: v.status === "solicitada" && cliente ? true : undefined,
    });
  }

  // Ocorrências
  for (const o of ocorrencias) {
    eventos.push({ id: `ocorrencia-aberta|${o.id}`, tipo: "ocorrencia", titulo: `Ocorrência aberta: ${o.titulo}`, detalhe: `Gravidade ${ROTULO_GRAVIDADE[o.gravidade].toLowerCase()}${o.responsavel ? ` · ${o.responsavel}` : ""}`, quando: o.abertaEm });
    if (o.status === "resolvida" && o.resolvidaEm) {
      eventos.push({ id: `ocorrencia-resolvida|${o.id}`, tipo: "ocorrencia", titulo: `Ocorrência resolvida: ${o.titulo}`, detalhe: o.resolucao || undefined, quando: o.resolvidaEm });
    }
  }

  // Vistoria: pontos adicionados (agrupados por dia e por quem adicionou).
  const adicionados = new Map<string, { quando: number; quem?: string; porCliente: boolean; textos: string[] }>();
  for (const i of vistoria) {
    if (!i.createdAt) continue;
    const cliente = / \(cliente\)$/.test(i.criadoPorNome ?? "");
    const quem = (i.criadoPorNome ?? "").replace(/ \(cliente\)$/, "") || undefined;
    const chave = `${quem ?? ""}|${cliente}|${diaChave(i.createdAt)}`;
    const g = adicionados.get(chave) ?? { quando: i.createdAt, quem, porCliente: cliente, textos: [] };
    g.quando = Math.max(g.quando, i.createdAt);
    g.textos.push(i.texto);
    adicionados.set(chave, g);
  }
  for (const [chave, g] of adicionados) {
    const n = g.textos.length;
    eventos.push({
      id: `vistoria-adicionados|${chave}`,
      tipo: "vistoria",
      titulo: n === 1 ? `Ponto adicionado à vistoria: ${g.textos[0]}` : `${n} pontos adicionados à vistoria`,
      itens: n === 1 ? undefined : g.textos,
      quando: g.quando,
      quem: g.quem,
      porCliente: g.porCliente,
    });
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

// ---------- O feed: dias, tempo relativo e resumo ----------

const DIA_MS = 86_400_000;
const MESES_LONGOS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const DIAS_SEMANA = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

export interface DiaDoFeed {
  chave: string;
  rotulo: string;
  eventos: Evento[];
}

/** "Hoje", "Ontem" ou "quarta, 12 de novembro" (com o ano se não for o deste ano). */
function rotuloDoDia(ms: number, inicioDeHoje: number): string {
  if (inicioDeHoje && ms >= inicioDeHoje) return "Hoje";
  if (inicioDeHoje && ms >= inicioDeHoje - DIA_MS) return "Ontem";
  const d = new Date(ms);
  const ano = inicioDeHoje && d.getFullYear() !== new Date(inicioDeHoje).getFullYear() ? ` de ${d.getFullYear()}` : "";
  return `${DIAS_SEMANA[d.getDay()]}, ${d.getDate()} de ${MESES_LONGOS[d.getMonth()]}${ano}`;
}

/**
 * Os fatos do projeto prontos para o feed: o que está agendado (visitas futuras) numa seção "Agendado" no topo,
 * da mais próxima para a mais distante, e depois cada dia, do mais recente ao mais antigo.
 * `inicioDeHoje` é a meia-noite de hoje (0 = ainda não sabemos: sem "Hoje" e "Ontem").
 */
export function agruparPorDia(eventos: Evento[], inicioDeHoje: number): DiaDoFeed[] {
  const fimDeHoje = inicioDeHoje ? inicioDeHoje + DIA_MS : Infinity;
  const futuros = eventos.filter((e) => e.quando >= fimDeHoje).sort((a, b) => a.quando - b.quando);
  const passados = eventos.filter((e) => e.quando < fimDeHoje);
  const dias: DiaDoFeed[] = [];
  if (futuros.length) dias.push({ chave: "agendado", rotulo: "Agendado", eventos: futuros });
  for (const e of passados) {
    const chave = diaChave(e.quando);
    const ultimo = dias[dias.length - 1];
    if (ultimo && ultimo.chave === chave) ultimo.eventos.push(e);
    else dias.push({ chave, rotulo: rotuloDoDia(e.quando, inicioDeHoje), eventos: [e] });
  }
  return dias;
}

/** "agora", "há 5 min", "há 2 h", "ontem 14:30" ou "12/11 14:30". `agora` em ms (0 = ainda não sabemos: data e hora). */
export function tempoRelativo(ms: number, agora: number): string {
  if (!agora) return `${dataBr(ms)} ${horaBr(ms)}`;
  const dif = agora - ms;
  // O relógio do feed anda de minuto em minuto: um fato deste mesmo minuto pode estar "no futuro" por segundos.
  if (Math.abs(dif) < 60_000) return "agora";
  if (dif < 0) {
    const dias = Math.round((new Date(ms).setHours(0, 0, 0, 0) - new Date(agora).setHours(0, 0, 0, 0)) / DIA_MS);
    const quando = dias <= 0 ? "hoje" : dias === 1 ? "amanhã" : `em ${dias} dias`;
    return `${quando} às ${horaBr(ms)}`;
  }
  if (dif < 3_600_000) return `há ${Math.floor(dif / 60_000)} min`;
  if (dif < DIA_MS && diaChave(ms) === diaChave(agora)) return `há ${Math.floor(dif / 3_600_000)} h`;
  const ontem = diaChave(agora - DIA_MS);
  if (diaChave(ms) === ontem) return `ontem ${horaBr(ms)}`;
  return `${dataBr(ms).slice(0, 5)} ${horaBr(ms)}`;
}

export interface ResumoFeed {
  proximaVisita: Visita | null;
  ocorrenciasAbertas: number;
  vistoriaOk: number;
  vistoriaTotal: number;
  vistoriaAjustar: number;
}

/** Os números do topo do feed: o que está por vir e o que pede atenção. */
export function resumoDoFeed(visitas: Visita[], ocorrencias: Ocorrencia[], vistoria: ItemVistoria[], agora: number): ResumoFeed {
  const proxima = visitas.filter((v) => v.status === "agendada" && v.quando >= agora - 3_600_000).sort((a, b) => a.quando - b.quando)[0] ?? null;
  return {
    proximaVisita: proxima,
    ocorrenciasAbertas: ocorrencias.filter((o) => o.status !== "resolvida").length,
    vistoriaOk: vistoria.filter((i) => i.status === "ok").length,
    vistoriaTotal: vistoria.length,
    vistoriaAjustar: vistoria.filter((i) => i.status === "ajustar").length,
  };
}
