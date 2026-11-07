"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { IconeArquivo, IconeLixo } from "./Icones";
import { useObras } from "@/lib/obras";
import type { Obra } from "@/lib/types";

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

/**
 * Arquivar e excluir são coisas diferentes e o diálogo diz isso em cada bloco:
 * arquivar guarda (reversível); excluir apaga tudo (sem volta) e pede o nome da obra.
 */
export function GerenciarObraDialog({
  obra,
  onFechar,
  aoConcluir,
}: {
  obra: Obra | null;
  onFechar: () => void;
  /** Chamado depois de arquivar/restaurar/excluir (ex.: voltar para a home). */
  aoConcluir?: (acao: "arquivada" | "restaurada" | "excluida") => void;
}) {
  const { arquivarObra, removerObra } = useObras();
  const [confirmacao, setConfirmacao] = useState("");
  const [ocupado, setOcupado] = useState<"arquivar" | "excluir" | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setConfirmacao("");
    setOcupado(null);
    setErro(null);
  }, [obra?.id]);

  if (!obra) return null;
  const arquivada = obra.arquivada === true;
  const nomeConfere = norm(confirmacao) === norm(obra.nome);

  async function alternarArquivo() {
    if (!obra || ocupado) return;
    setOcupado("arquivar");
    setErro(null);
    try {
      await arquivarObra(obra.id, !arquivada);
      onFechar();
      aoConcluir?.(arquivada ? "restaurada" : "arquivada");
    } catch {
      setErro("Não deu certo agora. Tente de novo em instantes.");
      setOcupado(null);
    }
  }

  async function excluir() {
    if (!obra || !nomeConfere || ocupado) return;
    setOcupado("excluir");
    setErro(null);
    try {
      await removerObra(obra.id);
      onFechar();
      aoConcluir?.("excluida");
    } catch {
      setErro("Não consegui excluir agora. Nada foi perdido, tente de novo em instantes.");
      setOcupado(null);
    }
  }

  return (
    <Modal aberto={obra !== null} onFechar={onFechar} titulo="Gerenciar obra">
      <p className="-mt-2 mb-4 truncate text-sm text-ink/60">{obra.nome}</p>

      <div className="space-y-4">
        {/* Arquivar: reversível */}
        <section className="rounded-2xl border border-linha bg-ink/[0.025] p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/[0.08] text-ink">
              <IconeArquivo />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-ink">{arquivada ? "Restaurar obra" : "Arquivar"}</h3>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-800">
                  Reversível
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-snug text-ink/65">
                {arquivada
                  ? "Traz a obra de volta para a sua lista principal, do jeito que ela estava."
                  : "Tira a obra da lista principal e a guarda em “Arquivadas”. Nada é apagado: itens, programa e aprovações continuam como estão, e você restaura quando quiser. O seu cliente continua acessando com o link e o código."}
              </p>
            </div>
          </div>
          <button onClick={alternarArquivo} disabled={ocupado !== null} className="btn btn-solido mt-4 w-full px-4 py-3 text-sm">
            {ocupado === "arquivar" ? "Aguarde…" : arquivada ? "Restaurar obra" : "Arquivar obra"}
          </button>
        </section>

        {/* Excluir: sem volta */}
        <section className="rounded-2xl border border-pitanga/50 bg-pitanga/[0.05] p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pitanga/15 text-pitanga">
              <IconeLixo size={20} />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-ink">Excluir definitivamente</h3>
                <span className="rounded-full bg-pitanga px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-white">
                  Sem volta
                </span>
              </div>
              <p className="mt-1 text-[13px] leading-snug text-ink/70">
                Apaga a obra e tudo o que está dentro dela: itens do orçamento, programa de necessidades, aprovações e o acesso dos clientes.{" "}
                <strong className="font-semibold text-ink">Não há como recuperar.</strong>
                {!arquivada && " Se só quer tirar da lista, use Arquivar."}
              </p>
            </div>
          </div>

          <label className="rotulo-tec mb-1 mt-4 block text-ink/60" htmlFor="confirma-exclusao">
            Digite o nome da obra para confirmar
          </label>
          <input
            id="confirma-exclusao"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            placeholder={obra.nome}
            autoComplete="off"
            className="campo-pit w-full border border-ink/25 bg-white px-3 py-2.5 text-sm text-ink outline-none"
          />
          <button onClick={excluir} disabled={!nomeConfere || ocupado !== null} className="btn btn-primario mt-3 w-full px-4 py-3 text-sm">
            {ocupado === "excluir" ? "Excluindo…" : "Excluir obra para sempre"}
          </button>
        </section>

        {erro && (
          <p className="rounded-xl border border-pitanga bg-pitanga/[0.07] px-3 py-2 text-center text-sm font-medium text-pitanga-escuro" role="alert">
            {erro}
          </p>
        )}
      </div>
    </Modal>
  );
}
