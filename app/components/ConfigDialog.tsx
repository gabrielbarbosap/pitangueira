"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { useData } from "@/lib/data";

const campo = "campo-pit w-full border border-ink/25 bg-white px-3 py-2.5 text-sm text-ink outline-none";
const rotulo = "rotulo-tec mb-1 block text-ink/55";

export function ConfigDialog({
  aberto,
  onFechar,
  onGerenciar,
}: {
  aberto: boolean;
  onFechar: () => void;
  /** Abre o diálogo de arquivar/excluir (só para o arquiteto dono). */
  onGerenciar?: () => void;
}) {
  const { config, saveConfig, ehCliente } = useData();
  const [nomeObra, setNomeObra] = useState("");
  const [teto, setTeto] = useState("");

  useEffect(() => {
    if (!aberto) return;
    setNomeObra(config.nomeObra ?? "");
    setTeto(config.orcamentoTotal ? String(config.orcamentoTotal) : "");
  }, [aberto, config]);

  async function salvar() {
    // Cliente só pode alterar o orçamento; arquiteto altera nome + orçamento.
    await saveConfig(
      ehCliente
        ? { orcamentoTotal: Number(teto) || 0 }
        : { nomeObra: nomeObra.trim() || "Projeto", orcamentoTotal: Number(teto) || 0 },
    );
    onFechar();
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Ajustes do projeto">
      <div className="space-y-4">
        {!ehCliente && (
          <div>
            <label className={rotulo}>Nome do projeto</label>
            <input className={campo} value={nomeObra} onChange={(e) => setNomeObra(e.target.value)} />
          </div>
        )}
        <div>
          <label className={rotulo}>Orçamento total disponível (R$)</label>
          <input
            type="number"
            inputMode="decimal"
            className={campo}
            placeholder="Quanto há para gastar no total"
            value={teto}
            onChange={(e) => setTeto(e.target.value)}
          />
          <p className="mt-1 text-xs text-ink/50">É o teto do projeto: usado para calcular o saldo em caixa e avisar se a projeção estourar.</p>
        </div>
        <button onClick={salvar} className="btn btn-primario w-full px-4 py-3 text-sm">
          Salvar ajustes
        </button>
        {!ehCliente && onGerenciar && (
          <div className="border-t border-linha pt-4">
            <p className="rotulo-tec text-ink/55">Encerrar este projeto</p>
            <p className="mt-1 text-xs text-ink/60">
              <strong className="font-semibold text-ink/80">Arquivar</strong> guarda o projeto sem apagar nada.{" "}
              <strong className="font-semibold text-ink/80">Excluir</strong> apaga tudo de vez.
            </p>
            <button onClick={onGerenciar} className="btn btn-linha mt-2.5 w-full px-3 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider">
              Arquivar ou excluir…
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
