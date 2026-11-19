"use client";

import { useState, type ReactNode } from "react";
import { useData } from "@/lib/data";
import type { ContextoMensagem } from "@/lib/acompanhamento";
import { registrarEvento } from "@/lib/telemetria";
import { normalizarTelefone } from "@/lib/whatsapp";
import { Modal } from "../Modal";
import { Botao } from "../ui/Botao";

/** Quem recebe e de qual projeto: serve para montar as mensagens ao cliente. */
export function useContextoMensagem(): ContextoMensagem {
  const { config, projeto, obraId, ehCliente, ator } = useData();
  return {
    cliente: projeto.cliente,
    projeto: config.nomeObra,
    escritorio: projeto.escritorio,
    link: typeof window === "undefined" ? "" : `${window.location.origin}/obra/${obraId}`,
    remetente: ehCliente ? "cliente" : "arquiteto",
    nomeRemetente: ator,
  };
}

/** O número do arquiteto, guardado só neste aparelho (o cliente não grava nada no projeto). */
const chaveFoneArquiteto = (obraId: string) => `pitangueira:wpp-arquiteto:${obraId}`;
function lerFoneArquiteto(obraId: string): string {
  try {
    return localStorage.getItem(chaveFoneArquiteto(obraId)) ?? "";
  } catch {
    return "";
  }
}

const IconeWhatsapp = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M20.5 3.5A11.8 11.8 0 0 0 12 0 12 12 0 0 0 1.6 17.9L0 24l6.3-1.6A12 12 0 0 0 24 12c0-3.2-1.2-6.2-3.5-8.5ZM12 22a10 10 0 0 1-5.1-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A10 10 0 1 1 12 22Zm5.5-7.5c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.7.1a8.2 8.2 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.1c-.2-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.8 3.8 0 0 0-1.2 2.8c0 1.7 1.2 3.3 1.4 3.5s2.4 3.7 5.8 5.1c2.1.9 2.9.9 4 .8a3.4 3.4 0 0 0 2.2-1.6 2.7 2.7 0 0 0 .2-1.6c-.1-.1-.3-.2-.6-.3Z" />
  </svg>
);

/**
 * Janela "Enviar ao cliente": mostra a mensagem pronta (que o arquiteto pode ajustar) e abre o WhatsApp.
 * Nada é enviado sozinho: o arquiteto confere e aperta enviar no próprio WhatsApp.
 */
function EnvioDialog({ titulo, texto, tipo, onFechar }: { titulo: string; texto: string; tipo: string; onFechar: () => void }) {
  const { projeto, saveProjeto, ehCliente, obraId } = useData();
  // Arquiteto manda ao cliente (número guardado no projeto); cliente manda ao arquiteto (número guardado neste aparelho).
  const [telefone, setTelefone] = useState(() => (ehCliente ? lerFoneArquiteto(obraId) : (projeto.telefone ?? "")));
  const [mensagem, setMensagem] = useState(texto);
  const [ocupado, setOcupado] = useState(false);
  const foneOk = telefone.trim() === "" || normalizarTelefone(telefone) !== "";

  async function abrir() {
    if (!foneOk || ocupado) return;
    setOcupado(true);
    try {
      // Abre antes de qualquer espera, para o navegador não bloquear a nova aba.
      window.open(`https://wa.me/${normalizarTelefone(telefone)}?text=${encodeURIComponent(mensagem)}`, "_blank", "noopener");
      registrarEvento("atualizacao_whatsapp", { tipo });
      if (ehCliente) {
        try {
          if (telefone.trim()) localStorage.setItem(chaveFoneArquiteto(obraId), telefone.trim());
        } catch {
          /* sem armazenamento: o número só não fica guardado */
        }
      } else if (telefone.trim() !== (projeto.telefone ?? "") && telefone.trim()) {
        await saveProjeto({ ...projeto, telefone: telefone.trim() });
      }
      onFechar();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Modal aberto onFechar={onFechar} titulo={titulo}>
      <div className="space-y-4">
        <div>
          <label htmlFor="env-msg" className="rotulo-campo">{ehCliente ? "Mensagem para o arquiteto" : "Mensagem para o cliente"}</label>
          <textarea id="env-msg" className="input-pit resize-none text-[13.5px] leading-snug" rows={9} value={mensagem} onChange={(e) => setMensagem(e.target.value)} />
        </div>
        <div>
          <label htmlFor="env-fone" className="rotulo-campo">{ehCliente ? "WhatsApp do arquiteto (opcional)" : "WhatsApp do cliente (opcional)"}</label>
          <input id="env-fone" type="tel" inputMode="tel" className="input-pit" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 91234-5678" aria-invalid={!foneOk} />
          <p className={`mt-1 text-xs ${foneOk ? "text-ink/50" : "font-medium text-pitanga-escuro"}`}>
            {foneOk ? (ehCliente ? "Com o número, abre direto a conversa com o arquiteto (e fica guardado neste aparelho). Sem ele, você escolhe o contato no WhatsApp." : "Com o número, abre direto a conversa do cliente (e fica guardado no projeto). Sem ele, você escolhe o contato no WhatsApp.") : "Digite o DDD e o número, por exemplo (11) 91234-5678."}
          </p>
        </div>
        <p className="text-xs leading-snug text-ink/55">Nada é enviado sozinho: o WhatsApp abre com o texto pronto e você aperta enviar.</p>
        <div className="flex gap-2">
          <Botao className="flex-1" onClick={onFechar}>Cancelar</Botao>
          <Botao variante="primario" className="flex-1" disabled={!foneOk || ocupado} onClick={abrir}>Abrir no WhatsApp</Botao>
        </div>
      </div>
    </Modal>
  );
}

/**
 * Dá a quem usa a tela o botão "Enviar ao cliente" de qualquer item: `enviar(titulo, tipo, texto)` abre a janela.
 * `dialogo` precisa ser desenhado no fim da tela. O cliente nunca vê isso (o pai só passa `enviar` ao arquiteto).
 */
export function useEnvio() {
  const [aberto, setAberto] = useState<{ chave: number; titulo: string; tipo: string; texto: string } | null>(null);
  const enviar = (titulo: string, tipo: string, texto: string) => setAberto({ chave: Date.now(), titulo, tipo, texto });
  const dialogo: ReactNode = aberto && <EnvioDialog key={aberto.chave} titulo={aberto.titulo} tipo={aberto.tipo} texto={aberto.texto} onFechar={() => setAberto(null)} />;
  return { enviar, dialogo };
}

/** Botão pequeno "Enviar ao cliente" com o ícone do WhatsApp. */
export function BotaoEnviar({ onClick, rotulo = "Enviar ao cliente", contexto }: { onClick: () => void; rotulo?: string; contexto?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={contexto ? `${rotulo}: ${contexto}` : rotulo}
      title={rotulo}
      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-700/40 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
    >
      <IconeWhatsapp />
      {rotulo}
    </button>
  );
}
