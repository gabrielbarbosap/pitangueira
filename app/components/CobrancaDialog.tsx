"use client";

import { useState } from "react";
import { mensagemCobranca, type ParcelaDoContrato } from "@/lib/financeiro";
import { registrarEvento } from "@/lib/telemetria";
import { normalizarTelefone } from "@/lib/whatsapp";
import { Modal } from "./Modal";
import { Botao } from "./ui/Botao";

/**
 * Cobrar uma parcela pelo WhatsApp: mensagem educada e pronta (valor, vencimento e chave PIX), telefone do cliente
 * e um toque para abrir a conversa. A chave PIX e o telefone ficam guardados para as próximas cobranças.
 * É montada de novo a cada abertura (o pai usa `key`).
 */
export function CobrancaDialog({
  parcela,
  hoje,
  telefoneInicial,
  pixInicial,
  escritorio,
  onFechar,
  onGuardar,
}: {
  parcela: ParcelaDoContrato;
  hoje: number;
  telefoneInicial: string;
  pixInicial: string;
  escritorio: string;
  onFechar: () => void;
  /** Guarda o telefone no contrato e a chave PIX nos ajustes. */
  onGuardar: (d: { telefone: string; pix: string }) => Promise<void>;
}) {
  const [telefone, setTelefone] = useState(telefoneInicial);
  const [pix, setPix] = useState(pixInicial);
  const [editada, setEditada] = useState(false);
  const [texto, setTexto] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const sugerida = mensagemCobranca({ cliente: parcela.cliente, projeto: parcela.projetoNome, descricao: parcela.descricao, valor: parcela.valor, vencimento: parcela.vencimento, hoje, pix, escritorio });
  const mensagem = editada ? texto : sugerida;
  const foneOk = telefone.trim() === "" || normalizarTelefone(telefone) !== "";

  async function abrir() {
    if (!foneOk || ocupado) return;
    setOcupado(true);
    try {
      const fone = normalizarTelefone(telefone);
      // Abre antes de qualquer espera, para o navegador não bloquear a nova aba.
      window.open(`https://wa.me/${fone}?text=${encodeURIComponent(mensagem)}`, "_blank", "noopener");
      registrarEvento("cobranca_whatsapp");
      await onGuardar({ telefone: telefone.trim(), pix: pix.trim() });
      onFechar();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Modal aberto onFechar={onFechar} titulo="Cobrar pelo WhatsApp">
      <div className="space-y-4">
        <div>
          <label htmlFor="cob-fone" className="rotulo-campo">WhatsApp do cliente</label>
          <input id="cob-fone" type="tel" inputMode="tel" className="input-pit" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(11) 91234-5678" aria-invalid={!foneOk} />
          <p className={`mt-1 text-xs ${foneOk ? "text-ink/50" : "font-medium text-pitanga-escuro"}`}>
            {foneOk ? "Fica guardado neste contrato. Sem número, o WhatsApp abre para você escolher a conversa." : "Digite o DDD e o número, por exemplo (11) 91234-5678."}
          </p>
        </div>
        <div>
          <label htmlFor="cob-pix" className="rotulo-campo">Sua chave PIX</label>
          <input id="cob-pix" className="input-pit" value={pix} onChange={(e) => setPix(e.target.value)} placeholder="CPF, CNPJ, e-mail, celular ou chave aleatória" />
          <p className="mt-1 text-xs text-ink/50">Vai na mensagem e fica guardada para as próximas cobranças.</p>
        </div>
        <div>
          <label htmlFor="cob-msg" className="rotulo-campo">Mensagem</label>
          <textarea
            id="cob-msg"
            className="input-pit resize-none text-[13.5px] leading-snug"
            rows={8}
            value={mensagem}
            onChange={(e) => {
              setTexto(e.target.value);
              setEditada(true);
            }}
          />
        </div>
        <div className="flex gap-2">
          <Botao className="flex-1" onClick={onFechar}>Cancelar</Botao>
          <Botao variante="primario" className="flex-1" disabled={!foneOk || ocupado} onClick={abrir}>
            Abrir no WhatsApp
          </Botao>
        </div>
      </div>
    </Modal>
  );
}
