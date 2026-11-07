"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./Modal";
import { useObras } from "@/lib/obras";

function geraCodigo() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

/** Opção de escolha única (círculo marcado = selecionada). */
function Opcao({ ativa, onClick, titulo, dica }: { ativa: boolean; onClick: () => void; titulo: string; dica: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={ativa}
      onClick={onClick}
      className={`clicavel flex w-full items-center gap-2.5 rounded-2xl border px-3.5 py-2.5 text-left transition-colors ${ativa ? "border-ink bg-ink/[0.04]" : "border-linha bg-white hover:border-ink/40"}`}
    >
      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${ativa ? "border-pitanga" : "border-ink/30"}`}>
        {ativa && <span className="h-2 w-2 rounded-full bg-pitanga" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{titulo}</span>
        <span className="block text-xs text-ink/55">{dica}</span>
      </span>
    </button>
  );
}

export function ObraDialog({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { criarObra, obras } = useObras();
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [teto, setTeto] = useState("");
  // Projeto do próprio arquiteto usado como ponto de partida (null = do zero).
  const [origem, setOrigem] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (aberto) {
      setNome("");
      setCodigo(geraCodigo());
      setTeto("");
      setOrigem(null);
      setErro("");
    }
  }, [aberto]);

  const valido = nome.trim() && codigo.trim();

  async function salvar() {
    if (!valido || salvando) return;
    setSalvando(true);
    setErro("");
    try {
      const id = await criarObra(
        { nome: nome.trim(), accessCode: codigo.trim().toUpperCase(), orcamentoTotal: Number(teto) || 0 },
        origem ?? undefined,
      );
      onFechar();
      router.push(`/obra/${id}`);
    } catch {
      setErro("Não consegui criar o projeto. Tente de novo.");
    } finally {
      setSalvando(false);
    }
  }

  const campo = "campo-pit w-full border border-ink/25 bg-white px-3 py-2.5 text-sm text-ink outline-none";
  const rotulo = "rotulo-tec mb-1 block text-ink/55";

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Novo projeto">
      <div className="space-y-4">
        <div>
          <label className={rotulo}>Nome do projeto</label>
          <input className={campo} placeholder="Ex.: Casa Pitanga" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>

        <div>
          <label className={rotulo}>Chave de acesso (para os clientes)</label>
          <div className="flex gap-2">
            <input className={`${campo} font-mono tracking-widest`} value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} />
            <button type="button" onClick={() => setCodigo(geraCodigo())} className="btn btn-linha shrink-0 px-3 font-mono text-[11px] font-semibold uppercase tracking-wider" title="Gerar uma chave nova">
              Gerar
            </button>
          </div>
          <p className="mt-1 text-xs text-ink/50">O cliente usa essa chave, junto com o link do projeto, para acompanhar tudo.</p>
        </div>

        <div>
          <label className={rotulo}>Orçamento disponível (R$) — opcional</label>
          <input type="number" inputMode="decimal" className={campo} placeholder="0,00" value={teto} onChange={(e) => setTeto(e.target.value)} />
          <p className="mt-1 text-xs text-ink/50">O teto do projeto. Pode ser definido depois, em Ajustes.</p>
        </div>

        <div role="radiogroup" aria-label="Como começar">
          <p className={rotulo}>Como começar</p>
          <div className="space-y-2">
            <Opcao ativa={origem === null} onClick={() => setOrigem(null)} titulo="Do zero" dica="Projeto vazio. Você monta o orçamento e o programa." />
            {obras.length > 0 && (
              <>
                <p className="pt-1 text-xs text-ink/50">Ou parta de um projeto seu. Leva os itens do orçamento e o programa de necessidades, sem pagamentos, aprovação, cliente nem endereço.</p>
                <ul className="max-h-52 space-y-2 overflow-y-auto pr-0.5">
                  {obras.map((o) => {
                    const n = o.resumo?.itens ?? 0;
                    return (
                      <li key={o.id}>
                        <Opcao
                          ativa={origem === o.id}
                          onClick={() => setOrigem(o.id)}
                          titulo={o.nome}
                          dica={`${n} ${n === 1 ? "item" : "itens"}${o.arquivada ? " · arquivado" : ""}`}
                        />
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </div>

        {erro && (
          <p role="alert" className="rounded-xl bg-pitanga/10 px-3 py-2 text-[13px] text-pitanga">
            {erro}
          </p>
        )}

        <button onClick={salvar} disabled={!valido || salvando} className="btn btn-primario w-full px-4 py-3 text-sm">
          {salvando ? "Criando…" : "Criar projeto"}
        </button>
      </div>
    </Modal>
  );
}
