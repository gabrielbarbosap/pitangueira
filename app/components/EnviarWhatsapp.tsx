"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";
import { useData } from "@/lib/data";
import { useObras } from "@/lib/obras";
import { gerarPdf } from "@/lib/pdf";
import { registrarErro, registrarEvento } from "@/lib/telemetria";
import { enviarPorWhatsApp, montarMensagem, normalizarTelefone } from "@/lib/whatsapp";
import { Alerta } from "./ui/Alerta";
import { Botao } from "./ui/Botao";

/**
 * Janela "Enviar por WhatsApp" de um documento aberto. O PDF já começa a ser preparado ao abrir, para o envio
 * acontecer direto do clique (celulares só deixam compartilhar arquivo logo após um toque).
 */
export function EnviarWhatsapp({
  alvo,
  tipo,
  rotulo,
  nomeArquivo,
  extra,
  onFechar,
}: {
  alvo: RefObject<HTMLElement | null>;
  tipo: string;
  rotulo: string;
  nomeArquivo: string;
  extra?: string;
  onFechar: () => void;
}) {
  const { projeto, config, obraId, ehCliente } = useData();
  const { obras } = useObras();
  const chave = !ehCliente ? obras.find((o) => o.id === obraId)?.accessCode ?? "" : "";
  const podeLink = !ehCliente && Boolean(chave);

  const [pdf, setPdf] = useState<Blob | null>(null);
  const [falhou, setFalhou] = useState(false);
  const [telefone, setTelefone] = useState(projeto.telefone ?? "");
  const [comLink, setComLink] = useState(podeLink);
  const [editada, setEditada] = useState(false);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<"baixado" | null>(null);

  // Texto sugerido; só deixa de acompanhar as opções quando a pessoa edita à mão.
  const sugerido = useMemo(
    () =>
      montarMensagem({
        tipo,
        rotulo,
        projeto: config.nomeObra,
        cliente: projeto.cliente,
        escritorio: projeto.escritorio,
        link: comLink ? `${typeof window === "undefined" ? "" : window.location.origin}/obra/${obraId}` : undefined,
        chave: comLink ? chave : undefined,
        extra,
      }),
    [tipo, rotulo, config.nomeObra, projeto.cliente, projeto.escritorio, comLink, obraId, chave, extra],
  );
  const mensagem = editada ? texto : sugerido;

  // Prepara o PDF assim que a janela abre.
  useEffect(() => {
    let vivo = true;
    const el = alvo.current;
    if (!el) return;
    gerarPdf(el)
      .then((b) => vivo && setPdf(b))
      .catch((e) => {
        registrarErro("pdf_falhou", e);
        if (vivo) setFalhou(true);
      });
    return () => {
      vivo = false;
    };
  }, [alvo]);

  useEffect(() => {
    const aoTecla = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", aoTecla);
    return () => window.removeEventListener("keydown", aoTecla);
  }, [onFechar]);

  const foneOk = telefone.trim() === "" || normalizarTelefone(telefone) !== "";

  async function enviar() {
    if (!pdf || enviando) return;
    setEnviando(true);
    try {
      const r = await enviarPorWhatsApp({ pdf, nomeArquivo: nomeArquivo, texto: mensagem, telefone, titulo: tipo });
      if (r !== "cancelado") registrarEvento("pdf_whatsapp", { tipo, metodo: r === "compartilhado" ? "compartilhar" : "baixar" });
      if (r === "compartilhado") onFechar();
      if (r === "baixado") setAviso("baixado");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="no-print fixed inset-0 z-[80] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4" onClick={onFechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Enviar por WhatsApp"
        className="max-h-[92dvh] w-full max-w-md overflow-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="rotulo-tec text-ink/50">{tipo}</p>
            <h2 className="mt-0.5 text-lg font-semibold text-ink">Enviar por WhatsApp</h2>
          </div>
          <button onClick={onFechar} className="btn btn-icone h-9 w-9 rounded-full" aria-label="Fechar" title="Fechar">
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {falhou ? (
            <Alerta tom="perigo">Não consegui preparar o PDF agora. Use “Imprimir / salvar PDF” e anexe o arquivo no WhatsApp.</Alerta>
          ) : pdf ? (
            <p role="status" className="rounded-xl border border-emerald-600/30 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
              ✓ PDF pronto ({Math.max(1, Math.round(pdf.size / 1024))} KB)
            </p>
          ) : (
            <p role="status" className="rounded-xl bg-ink/[0.05] px-3 py-2 text-sm text-ink/70">
              Preparando o PDF…
            </p>
          )}

          <div>
            <label htmlFor="wpp-fone" className="rotulo-campo">
              WhatsApp do cliente (opcional)
            </label>
            <input
              id="wpp-fone"
              type="tel"
              inputMode="tel"
              className="input-pit"
              placeholder="(11) 91234-5678"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              aria-invalid={!foneOk}
            />
            <p className={`mt-1 text-xs ${foneOk ? "text-ink/50" : "font-medium text-pitanga-escuro"}`}>
              {foneOk ? "No celular você escolhe a conversa na hora. No computador, abrimos direto a conversa do cliente." : "Digite o DDD e o número, por exemplo (11) 91234-5678."}
            </p>
          </div>

          {podeLink && (
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink/80">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#d23a1f]" checked={comLink} onChange={(e) => setComLink(e.target.checked)} />
              <span>
                Incluir o link do projeto e a chave de acesso
                <span className="block text-xs text-ink/50">Assim o cliente já consegue acompanhar tudo por lá.</span>
              </span>
            </label>
          )}

          <div>
            <label htmlFor="wpp-msg" className="rotulo-campo">
              Mensagem
            </label>
            <textarea
              id="wpp-msg"
              className="input-pit resize-none text-[13.5px] leading-snug"
              rows={7}
              value={mensagem}
              onChange={(e) => {
                setTexto(e.target.value);
                setEditada(true);
              }}
            />
          </div>

          {aviso === "baixado" && (
            <Alerta tom="ok" titulo="PDF baixado">
              No WhatsApp que abriu, toque no clipe (anexar) e escolha o arquivo baixado.
            </Alerta>
          )}

          <div className="flex gap-2">
            <Botao className="flex-1" onClick={onFechar}>
              {aviso ? "Fechar" : "Cancelar"}
            </Botao>
            <Botao variante="primario" className="flex-1" disabled={!pdf || enviando || !foneOk} onClick={enviar}>
              {enviando ? "Enviando…" : pdf ? "Enviar pelo WhatsApp" : "Preparando…"}
            </Botao>
          </div>
        </div>
      </div>
    </div>
  );
}
