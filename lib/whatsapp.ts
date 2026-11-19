/** Envio de documentos pelo WhatsApp: monta a mensagem e entrega o PDF pelo melhor caminho que o aparelho oferece. */
import { abertura, blocos, campo, titulo } from "./mensagens";

export interface DadosMensagem {
  /** Título do documento: "Orçamento", "Escopo do projeto", "Relatório mensal de andamento". */
  tipo: string;
  /** Rótulo da etapa/mês (usado no relatório: "Novembro de 2026"). */
  rotulo: string;
  projeto: string;
  cliente: string;
  escritorio: string;
  /** Link e chave do projeto (só o arquiteto os tem). Vazios = não incluir. */
  link?: string;
  chave?: string;
}

/** Só números, com o 55 do Brasil quando vier só DDD + número. "" se não parecer um telefone. */
export function normalizarTelefone(texto: string): string {
  const n = texto.replace(/\D/g, "");
  if (n.length === 10 || n.length === 11) return `55${n}`;
  if ((n.length === 12 || n.length === 13) && n.startsWith("55")) return n;
  return "";
}

function nomeDoDocumento(d: DadosMensagem): string {
  const t = d.tipo.toLowerCase();
  if (t.startsWith("relatório")) return `relatório de andamento de ${d.rotulo.toLowerCase()}`;
  return t;
}

/** O texto que acompanha o PDF. O arquiteto edita antes de enviar. */
export function montarMensagem(d: DadosMensagem): string {
  return blocos([
    abertura({ destinatario: d.cliente, projeto: d.projeto }),
    `${titulo("📄", d.tipo.toLowerCase().startsWith("relatório") ? `Relatório de andamento · ${d.rotulo}` : d.tipo)}\nSegue o ${nomeDoDocumento(d)} do projeto ${d.projeto}, em PDF.`,
    "Qualquer dúvida, é só falar! 😊",
    d.link && `${titulo("🔗", "Acompanhe tudo em tempo real")}\n${d.link}${d.chave ? `\n${campo("🔑", "Chave de acesso", d.chave)}` : ""}`,
    d.escritorio.trim() && `— ${d.escritorio.trim()}`,
  ]);
}

export type ResultadoEnvio = "compartilhado" | "baixado" | "cancelado";

function baixar(arquivo: File) {
  const url = URL.createObjectURL(arquivo);
  const a = document.createElement("a");
  a.href = url;
  a.download = arquivo.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/**
 * Celular (e navegadores com compartilhamento de arquivos): abre a folha de compartilhamento do aparelho com o PDF e o
 * texto, e a pessoa escolhe o WhatsApp e a conversa. Computador: baixa o PDF e abre o WhatsApp Web já na conversa
 * do cliente (se houver telefone), com o texto pronto; é só anexar o arquivo baixado.
 * Deve ser chamado direto de um clique (o PDF já pronto), senão alguns navegadores bloqueiam o compartilhamento.
 */
export async function enviarPorWhatsApp(opts: { pdf: Blob; nomeArquivo: string; texto: string; telefone?: string; titulo: string }): Promise<ResultadoEnvio> {
  const nome = opts.nomeArquivo.replace(/[\\/:*?"<>|]+/g, "-").trim() || "documento";
  const arquivo = new File([opts.pdf], `${nome}.pdf`, { type: "application/pdf" });

  if (typeof navigator !== "undefined" && typeof navigator.canShare === "function" && navigator.canShare({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], text: opts.texto, title: opts.titulo });
      return "compartilhado";
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return "cancelado";
      // Qualquer outro problema do compartilhamento: cai no caminho do computador, para a pessoa não ficar sem o arquivo.
    }
  }

  baixar(arquivo);
  const fone = normalizarTelefone(opts.telefone ?? "");
  window.open(`https://wa.me/${fone}?text=${encodeURIComponent(opts.texto)}`, "_blank", "noopener");
  return "baixado";
}
