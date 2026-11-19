// Peças para montar mensagens de WhatsApp bem estruturadas. O WhatsApp entende *negrito*, _itálico_ e listas com "•".
// Toda mensagem do app segue o mesmo desenho: saudação, projeto, um bloco de título, os dados em linhas rotuladas,
// listas quando há várias coisas, um chamado final e o link, com a assinatura do escritório por último.

/** *Texto em negrito*. */
export const negrito = (t: string) => `*${t.replace(/\*/g, "")}*`;

/** "📅 *Visita agendada*" */
export const titulo = (emoji: string, texto: string) => `${emoji} ${negrito(texto)}`;

/** "🕒 *Quando:* sábado, 21/11 às 09:00" */
export const campo = (emoji: string, rotulo: string, valor: string) => `${emoji} ${negrito(`${rotulo}:`)} ${valor}`;

/** Lista com "•". */
export const bullets = (itens: string[]) => itens.map((i) => `• ${i}`).join("\n");

/**
 * Um texto escrito à mão (pauta, ata, resolução) vira lista quando tem várias linhas, e continua parágrafo quando tem uma.
 * Tira marcadores que a pessoa já tenha digitado ("-", "•", "*").
 */
export function comoLista(texto: string): string {
  const linhas = texto
    .split("\n")
    .map((l) => l.trim().replace(/^[-•*]\s*/, ""))
    .filter(Boolean);
  return linhas.length > 1 ? bullets(linhas) : (linhas[0] ?? "");
}

/** Une os blocos com uma linha em branco entre eles, ignorando os vazios. */
export const blocos = (partes: (string | false | null | undefined)[]) => partes.filter((p): p is string => Boolean(p && p.trim())).join("\n\n");

/** Abertura: "Olá, Marina! 👋" e o nome do projeto numa linha própria. */
export function abertura(opts: { destinatario?: string; projeto: string; remetente?: string }): string {
  const saudacao = opts.remetente ? "Olá! 👋" : opts.destinatario?.trim() ? `Olá, ${opts.destinatario.trim()}! 👋` : "Olá! 👋";
  const quem = opts.remetente ? `\nAqui é ${opts.remetente.trim()}.` : "";
  return `${saudacao}${quem}\n🏗️ ${negrito(`Projeto ${opts.projeto}`)}`;
}

/** Fecho: o chamado para abrir o app e a assinatura. */
export function fecho(opts: { link?: string; chave?: string; assinatura?: string }): string {
  const partes: string[] = [];
  if (opts.link) partes.push(`🔗 ${negrito("Veja no app:")}\n${opts.link}`);
  if (opts.chave) partes.push(campo("🔑", "Chave de acesso", opts.chave));
  const corpo = partes.join("\n");
  const ass = opts.assinatura?.trim() ? `— ${opts.assinatura.trim()}` : "";
  return blocos([corpo, ass]);
}
