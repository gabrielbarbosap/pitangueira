// Acompanhamento do projeto: a linha do tempo e as mensagens que o arquiteto encaminha pelo WhatsApp. Funções puras.
import type { Gravidade, Item, ItemVistoria, Ocorrencia, Previsao, Publicacao, Visita } from "./types";

export type TipoEvento = "publicacao" | "andamento" | "prazo" | "visita" | "ocorrencia" | "vistoria";

export const ROTULO_TIPO: Record<TipoEvento, string> = {
  publicacao: "Avisos",
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
  /** Nomes dos itens (só no andamento), para mostrar como etiquetas no cartão. */
  itens?: string[];
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
  /** Quem está mandando: o arquiteto (fala com o cliente) ou o cliente (fala com o arquiteto). */
  remetente?: "arquiteto" | "cliente";
  /** Nome de quem manda (usado quando é o cliente). */
  nomeRemetente?: string;
}

function moldura(c: ContextoMensagem, corpo: string[]): string {
  if (c.remetente === "cliente") {
    const quem = c.nomeRemetente?.trim() ? `Aqui é ${c.nomeRemetente.trim()}, do projeto ${c.projeto}.` : `Sobre o projeto ${c.projeto}.`;
    const partes = [`Olá! ${quem}`, ...corpo];
    if (c.link) partes.push(`Está tudo no app: ${c.link}`);
    return partes.join("\n\n");
  }
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

export function mensagemPublicacao(p: Publicacao, c: ContextoMensagem): string {
  return moldura(c, [p.texto.trim()]);
}

export function mensagemVistoria(itens: ItemVistoria[], c: ContextoMensagem): string {
  const ok = itens.filter((i) => i.status === "ok").length;
  const ajustar = itens.filter((i) => i.status === "ajustar");
  const pendentes = itens.filter((i) => i.status === "pendente");
  const doCliente = c.remetente === "cliente";
  const partes = [`🔍 Vistoria final: ${ok} de ${itens.length} pontos conferidos${doCliente ? " por mim" : ""}.`];
  if (ajustar.length) partes.push(`${doCliente ? "Peço ajuste em" : "Pedem ajuste"}:\n${ajustar.map((i) => `• ${i.texto}${i.ambiente ? ` (${i.ambiente})` : ""}${i.obs ? ` — ${i.obs}` : ""}`).join("\n")}`);
  if (pendentes.length) partes.push(doCliente ? `Ainda falta conferir ${plural(pendentes.length, "ponto", "pontos")}.` : `Faltam conferir: ${plural(pendentes.length, "ponto", "pontos")}. Dá uma olhada no app e marque o que estiver ok.`);
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
  publicacoes?: Publicacao[];
}

/** Todos os fatos do projeto em ordem do mais recente para o mais antigo. Itens marcados no mesmo dia, pela mesma pessoa e na mesma etapa viram uma linha só. */
export function montarLinhaDoTempo({ itens, previsoes, visitas, ocorrencias, vistoria, publicacoes = [] }: Fontes): Evento[] {
  const eventos: Evento[] = [];

  // Avisos publicados pelo arquiteto
  for (const p of publicacoes) {
    eventos.push({ id: `publicacao|${p.id}`, tipo: "publicacao", titulo: p.texto, quando: p.createdAt ?? 0, quem: p.autor });
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
