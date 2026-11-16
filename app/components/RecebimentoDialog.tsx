"use client";

import { useState } from "react";
import { dataDoCampo, FORMAS_RECEBIMENTO, meiaNoite, paraCampo, type ParcelaDoContrato } from "@/lib/financeiro";
import { useDinheiro } from "@/lib/privacidade";
import { Modal } from "./Modal";
import { Alerta } from "./ui/Alerta";
import { Botao } from "./ui/Botao";

const num = (s: string) => Number(String(s).replace(",", ".")) || 0;

export interface DadosRecebimento {
  recebidoEm: number;
  valorRecebido: number;
  forma: string;
  obs: string;
}

/**
 * Registrar o recebimento de uma parcela: quando entrou (pode ser uma data passada), quanto entrou de fato
 * (se houve desconto ou juros) e como foi pago. É montada de novo a cada abertura (o pai usa `key`).
 */
export function RecebimentoDialog({ parcela, onFechar, onConfirmar }: { parcela: ParcelaDoContrato; onFechar: () => void; onConfirmar: (d: DadosRecebimento) => Promise<void> }) {
  const { brl } = useDinheiro();
  const [data, setData] = useState(() => paraCampo(meiaNoite(new Date())));
  const [valor, setValor] = useState(String(parcela.valor));
  const [forma, setForma] = useState<string>(FORMAS_RECEBIMENTO[0]);
  const [obs, setObs] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const dia = dataDoCampo(data);
  const valorNum = num(valor);
  const dif = Math.round((valorNum - parcela.valor) * 100) / 100;
  const hoje = meiaNoite(new Date());
  const valido = dia !== null && valorNum > 0 && dia <= hoje;

  async function confirmar() {
    if (!valido || ocupado || dia === null) return;
    setOcupado(true);
    try {
      // A hora do dia não importa; meio-dia evita virar o dia anterior em qualquer fuso.
      await onConfirmar({ recebidoEm: dia + 12 * 3_600_000, valorRecebido: valorNum, forma, obs: obs.trim() });
      onFechar();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Modal aberto onFechar={onFechar} titulo="Registrar recebimento">
      <div className="space-y-4">
        <div className="rounded-2xl bg-ink/[0.04] p-3">
          <p className="text-sm font-semibold text-ink">
            {parcela.projetoNome}
            <span className="font-normal text-ink/55"> · {parcela.de > 1 ? `parcela ${parcela.numero}/${parcela.de}` : parcela.contrato}</span>
          </p>
          <p className="mt-0.5 text-xs text-ink/55">{parcela.cliente || "Sem cliente"} · combinado {brl(parcela.valor)}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="rec-data" className="rotulo-campo">Data do recebimento</label>
            <input id="rec-data" type="date" className="input-pit" value={data} max={paraCampo(hoje)} onChange={(e) => setData(e.target.value)} />
          </div>
          <div>
            <label htmlFor="rec-valor" className="rotulo-campo">Valor recebido (R$)</label>
            <input id="rec-valor" type="number" inputMode="decimal" className="input-pit" value={valor} onChange={(e) => setValor(e.target.value)} />
          </div>
        </div>
        {dia !== null && dia > hoje && <p className="-mt-2 text-xs font-medium text-pitanga-escuro">A data não pode ser no futuro.</p>}

        {valido && dif !== 0 && (
          <Alerta tom="aviso">
            {dif < 0 ? `Entrou ${brl(-dif)} a menos que o combinado (desconto).` : `Entrou ${brl(dif)} a mais que o combinado (juros ou multa).`} A parcela será dada como recebida e a diferença fica registrada.
          </Alerta>
        )}

        <div>
          <label htmlFor="rec-forma" className="rotulo-campo">Como foi pago</label>
          <select id="rec-forma" className="input-pit" value={forma} onChange={(e) => setForma(e.target.value)}>
            {FORMAS_RECEBIMENTO.map((f) => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="rec-obs" className="rotulo-campo">Observação (opcional)</label>
          <input id="rec-obs" className="input-pit" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex.: pago com 5% de desconto à vista" />
        </div>

        <div className="flex gap-2">
          <Botao className="flex-1" onClick={onFechar}>Cancelar</Botao>
          <Botao variante="primario" className="flex-1" disabled={!valido || ocupado} onClick={confirmar}>
            {ocupado ? "Salvando…" : "Registrar recebimento"}
          </Botao>
        </div>
      </div>
    </Modal>
  );
}
