"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Modal } from "./Modal";
import { agruparPor } from "@/lib/calc";
import { useDinheiro } from "@/lib/privacidade";
import type { Item } from "@/lib/types";
import type { ConfigOrcamentoPdf, EscopoOrcamento, SaidaOrcamento } from "./OrcamentoDocumento";

const ESCOPOS: { id: EscopoOrcamento; titulo: string; dica: string }[] = [
  { id: "geral", titulo: "Orçamento geral", dica: "O projeto todo, organizado por etapa, com o resumo financeiro." },
  { id: "etapa", titulo: "Por etapa", dica: "Só as etapas que você escolher (ex.: Pintura, Elétrica)." },
  { id: "ambiente", titulo: "Por ambiente", dica: "Só os ambientes que você escolher (ex.: Cozinha, Suíte)." },
];

function Opcao({ ativa, onClick, titulo, dica, children }: { ativa: boolean; onClick: () => void; titulo: string; dica: string; children?: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={ativa}
      onClick={onClick}
      className={`clicavel w-full rounded-2xl border px-3.5 py-3 text-left transition-colors ${ativa ? "border-ink bg-ink/[0.04]" : "border-linha bg-white hover:border-ink/40"}`}
    >
      <span className="flex items-center gap-2.5">
        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${ativa ? "border-pitanga" : "border-ink/30"}`}>
          {ativa && <span className="h-2 w-2 rounded-full bg-pitanga" />}
        </span>
        <span className="text-sm font-semibold text-ink">{titulo}</span>
      </span>
      <span className="mt-1 block pl-[26px] text-xs text-ink/55">{dica}</span>
      {children}
    </button>
  );
}

/** Escolha do que entra no PDF do orçamento: geral, por etapa ou por ambiente, num arquivo só ou em vários. */
export function OrcamentoPdfDialog({
  aberto,
  onFechar,
  itens,
  onGerar,
}: {
  aberto: boolean;
  onFechar: () => void;
  itens: Item[];
  onGerar: (cfg: ConfigOrcamentoPdf) => void;
}) {
  const { brlInt } = useDinheiro();
  const [escopo, setEscopo] = useState<EscopoOrcamento>("geral");
  // Guarda o que foi desmarcado: tudo começa marcado, ao abrir e ao trocar o escopo.
  const [fora, setFora] = useState<string[]>([]);
  const [saida, setSaida] = useState<SaidaOrcamento>("junto");

  const grupos = useMemo(() => agruparPor(itens, escopo === "ambiente" ? "ambiente" : "etapa"), [itens, escopo]);
  const sel = useMemo(() => grupos.map((g) => g.nome).filter((n) => !fora.includes(n)), [grupos, fora]);

  const alternar = (nome: string) => setFora((f) => (f.includes(nome) ? f.filter((x) => x !== nome) : [...f, nome]));
  const trocarEscopo = (e: EscopoOrcamento) => {
    setEscopo(e);
    setFora([]);
  };
  const fechar = () => {
    setFora([]);
    onFechar();
  };
  const parcial = escopo !== "geral";
  const pode = !parcial || sel.length > 0;
  const rotuloParte = escopo === "ambiente" ? "ambiente" : "etapa";

  return (
    <Modal aberto={aberto} onFechar={fechar} titulo="Orçamento em PDF">
      <div className="space-y-5">
        <div role="radiogroup" aria-label="O que incluir" className="space-y-2">
          {ESCOPOS.map((e) => (
            <Opcao key={e.id} ativa={escopo === e.id} onClick={() => trocarEscopo(e.id)} titulo={e.titulo} dica={e.dica} />
          ))}
        </div>

        {parcial && (
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="rotulo-tec text-ink/55">
                {escopo === "ambiente" ? "Ambientes" : "Etapas"} · {sel.length} de {grupos.length}
              </p>
              <div className="flex gap-3 text-xs">
                <button type="button" className="font-semibold text-pitanga hover:underline" onClick={() => setFora([])}>
                  Todos
                </button>
                <button type="button" className="font-semibold text-ink/55 hover:underline" onClick={() => setFora(grupos.map((g) => g.nome))}>
                  Nenhum
                </button>
              </div>
            </div>
            <ul className="max-h-56 divide-y divide-linha overflow-y-auto rounded-2xl border border-linha">
              {grupos.map((g) => (
                <li key={g.nome}>
                  <label className="linha-hover flex cursor-pointer items-center gap-2.5 px-3 py-2.5">
                    <input type="checkbox" className="h-4 w-4 shrink-0 accent-[#d23a1f]" checked={sel.includes(g.nome)} onChange={() => alternar(g.nome)} />
                    <span className="min-w-0 flex-1 text-sm leading-snug text-ink">{g.nome}</span>
                    <span className="shrink-0 text-right font-mono text-xs text-ink/55">
                      {g.total} {g.total === 1 ? "item" : "itens"} · {brlInt(g.previsto)}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {parcial && sel.length > 1 && (
          <div role="radiogroup" aria-label="Formato de saída" className="space-y-2">
            <p className="rotulo-tec text-ink/55">Como gerar</p>
            <Opcao ativa={saida === "junto"} onClick={() => setSaida("junto")} titulo="Um PDF só" dica={`Todos juntos, cada ${rotuloParte} em uma página.`} />
            <Opcao
              ativa={saida === "separado"}
              onClick={() => setSaida("separado")}
              titulo={`Um PDF por ${rotuloParte}`}
              dica={`Você salva um arquivo de cada vez, com o nome da ${rotuloParte} no arquivo (${sel.length} PDFs).`}
            />
          </div>
        )}

        <button className="btn btn-primario w-full px-4 py-3 text-sm" disabled={!pode} onClick={() => {
            onGerar({ escopo, partes: sel, saida });
            setFora([]);
          }}>
          {!parcial
            ? "Gerar orçamento geral"
            : sel.length > 1 && saida === "separado"
              ? `Gerar ${sel.length} PDFs`
              : "Gerar PDF"}
        </button>
      </div>
    </Modal>
  );
}
