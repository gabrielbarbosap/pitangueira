"use client";

import { useMemo, useState } from "react";
import { mensagemVistoria, MODELO_VISTORIA, type ContextoMensagem } from "@/lib/acompanhamento";
import type { ItemVistoria, StatusVistoria } from "@/lib/types";
import { useConfirm } from "../ConfirmProvider";
import { IconeLixo } from "../Icones";
import { Botao } from "../ui/Botao";
import { BotaoEnviar } from "./Envio";

/** O instante de agora (fora do componente: só é chamado quando alguém toca num botão). */
const agora = () => Date.now();

const OPCOES: { valor: StatusVistoria; rotulo: string; ativo: string }[] = [
  { valor: "ok", rotulo: "OK", ativo: "border-emerald-600 bg-emerald-600 text-white" },
  { valor: "ajustar", rotulo: "Ajustar", ativo: "border-pitanga bg-pitanga text-white" },
];

/** Observação de um ponto: grava ao sair do campo (o cliente também escreve aqui, quando pede ajuste). */
function Observacao({ item, onSalvar }: { item: ItemVistoria; onSalvar: (obs: string) => void }) {
  const [texto, setTexto] = useState(item.obs);
  return (
    <input
      className="input-pit input-pit-peq mt-2"
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      onBlur={() => texto.trim() !== item.obs && onSalvar(texto.trim())}
      placeholder="O que precisa ser ajustado?"
      aria-label={`Observação sobre ${item.texto}`}
    />
  );
}

/**
 * Vistoria final: a lista do que conferir antes de entregar a obra. O arquiteto monta a lista; arquiteto e cliente
 * marcam cada ponto como OK ou "Ajustar" (com observação). O avanço aparece no topo.
 */
export function Vistoria({
  itens,
  contexto,
  ehCliente,
  ator,
  onSalvar,
  onRemover,
  onEnviar,
}: {
  itens: ItemVistoria[];
  contexto: ContextoMensagem;
  ehCliente: boolean;
  ator: string;
  onSalvar: (i: Omit<ItemVistoria, "id"> & { id?: string }) => Promise<void>;
  onRemover: (id: string) => Promise<void>;
  onEnviar?: (titulo: string, tipo: string, texto: string) => void;
}) {
  const confirmar = useConfirm();
  const [texto, setTexto] = useState("");
  const [ambiente, setAmbiente] = useState("");
  const conferidos = itens.filter((i) => i.status === "ok").length;
  const ajustar = itens.filter((i) => i.status === "ajustar").length;
  const pct = itens.length ? Math.round((conferidos / itens.length) * 100) : 0;
  const ambientes = useMemo(() => [...new Set(itens.map((i) => i.ambiente || "Geral"))], [itens]);
  const proximaOrdem = () => itens.reduce((m, i) => Math.max(m, i.ordem), 0) + 1;

  async function marcar(i: ItemVistoria, status: StatusVistoria) {
    const novo = i.status === status ? "pendente" : status;
    const autor = `${ator}${ehCliente ? " (cliente)" : ""}`;
    await onSalvar({ ...i, status: novo, conferidoPor: novo === "pendente" ? undefined : autor, conferidoEm: novo === "pendente" ? undefined : agora() });
  }

  async function adicionar() {
    if (!texto.trim()) return;
    await onSalvar({ texto: texto.trim(), ambiente: ambiente.trim() || "Geral", status: "pendente", obs: "", ordem: proximaOrdem() });
    setTexto("");
  }

  async function usarModelo() {
    const existentes = new Set(itens.map((i) => i.texto.toLowerCase()));
    let ordem = proximaOrdem();
    for (const m of MODELO_VISTORIA) {
      if (existentes.has(m.texto.toLowerCase())) continue;
      await onSalvar({ texto: m.texto, ambiente: m.ambiente, status: "pendente", obs: "", ordem: ordem++ });
    }
  }

  return (
    <section aria-label="Vistoria final" className="space-y-4">
      {itens.length > 0 && (
        <div className="prancha p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="rotulo-tec text-ink/50">Vistoria final</p>
              <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-ink">
                {conferidos} <span className="text-base font-normal text-ink/50">de {itens.length} conferidos</span>
              </p>
              {ajustar > 0 && <p className="mt-0.5 text-xs font-medium text-pitanga-escuro">{ajustar} {ajustar === 1 ? "ponto pede" : "pontos pedem"} ajuste</p>}
            </div>
            {onEnviar && <BotaoEnviar rotulo="Enviar ao cliente" contexto="vistoria" onClick={() => onEnviar("Enviar a vistoria ao cliente", "vistoria", mensagemVistoria(itens, contexto))} />}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/10" role="img" aria-label={`${pct}% conferido`}>
            <div className="h-full rounded-full bg-emerald-600 transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      {!ehCliente && (
        <div className="prancha space-y-3 p-4">
          <p className="text-sm font-semibold text-ink">Adicionar um ponto</p>
          <div className="grid gap-2 sm:grid-cols-[1fr_9rem_auto]">
            <div>
              <label htmlFor="vist-texto" className="sr-only">Ponto a conferir</label>
              <input id="vist-texto" className="input-pit" value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void adicionar()} placeholder="Ex.: Porta da suíte fechando bem" />
            </div>
            <div>
              <label htmlFor="vist-amb" className="sr-only">Ambiente</label>
              <input id="vist-amb" list="vist-ambientes" className="input-pit" value={ambiente} onChange={(e) => setAmbiente(e.target.value)} placeholder="Ambiente" />
              <datalist id="vist-ambientes">{ambientes.map((a) => <option key={a} value={a} />)}</datalist>
            </div>
            <Botao variante="solido" onClick={adicionar} disabled={!texto.trim()}>Adicionar</Botao>
          </div>
          <button type="button" onClick={usarModelo} className="text-xs font-semibold text-pitanga hover:underline">
            Usar o modelo de vistoria (pontos comuns de obra)
          </button>
        </div>
      )}

      {itens.length === 0 && (
        <p className="prancha px-4 py-10 text-center text-sm text-ink/55">
          {ehCliente ? "O arquiteto ainda não montou a vistoria final." : "Monte a lista do que conferir antes de entregar a obra. O cliente também marca o que está ok e o que precisa de ajuste."}
        </p>
      )}

      {ambientes.map((amb) => {
        const doAmbiente = itens.filter((i) => (i.ambiente || "Geral") === amb).sort((a, b) => a.ordem - b.ordem);
        return (
          <div key={amb}>
            <h3 className="rotulo-tec mb-2 text-ink/50">{amb}</h3>
            <ul className="prancha divide-y divide-linha overflow-hidden">
              {doAmbiente.map((i) => (
                <li key={i.id} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <p className={`min-w-0 flex-1 text-sm leading-snug ${i.status === "ok" ? "text-ink/50 line-through decoration-ink/30" : "text-ink"}`}>{i.texto}</p>
                    <div className="flex shrink-0 items-center gap-1.5" role="group" aria-label={`Conferir: ${i.texto}`}>
                      {OPCOES.map((o) => (
                        <button
                          key={o.valor}
                          onClick={() => void marcar(i, o.valor)}
                          aria-pressed={i.status === o.valor}
                          aria-label={`${o.rotulo}: ${i.texto}`}
                          className={`btn clicavel h-8 rounded-full border px-3 font-mono text-[10px] font-semibold uppercase tracking-wider ${i.status === o.valor ? o.ativo : "border-ink/25 bg-white text-ink/55 hover:border-ink/50 hover:text-ink"}`}
                        >
                          {i.status === o.valor && o.valor === "ok" ? "✓ " : ""}
                          {o.rotulo}
                        </button>
                      ))}
                      {!ehCliente && (
                        <button
                          className="btn btn-icone perigo h-8 w-8"
                          aria-label={`Remover ponto: ${i.texto}`}
                          title="Remover"
                          onClick={async () => {
                            if (await confirmar({ titulo: "Remover ponto", mensagem: `Remover "${i.texto}" da vistoria?`, confirmar: "Remover", tom: "perigo" })) await onRemover(i.id);
                          }}
                        >
                          <IconeLixo />
                        </button>
                      )}
                    </div>
                  </div>
                  {i.status === "ajustar" && <Observacao item={i} onSalvar={(obs) => void onSalvar({ ...i, obs })} />}
                  {i.conferidoPor && i.conferidoEm && (
                    <p className="mt-1 text-[11px] text-ink/45">
                      {i.status === "ok" ? "Conferido" : "Pede ajuste"} por {i.conferidoPor} em {new Date(i.conferidoEm).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
  );
}
