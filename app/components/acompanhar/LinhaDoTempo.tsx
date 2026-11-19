"use client";

import { useMemo, useState } from "react";
import { mensagemDoEvento, mensagemResumo, ROTULO_TIPO, type ContextoMensagem, type Evento, type TipoEvento } from "@/lib/acompanhamento";
import { quandoTexto } from "@/lib/atividade";
import { useHoje } from "../PrazoVisual";
import { Chip } from "../ui/Chip";
import { BotaoEnviar } from "./Envio";

const COR: Record<TipoEvento, string> = {
  andamento: "bg-ink",
  prazo: "bg-amber-500",
  visita: "bg-sky-500",
  ocorrencia: "bg-pitanga",
  vistoria: "bg-emerald-600",
};

const FILTROS: ("todos" | TipoEvento)[] = ["todos", "andamento", "prazo", "visita", "ocorrencia", "vistoria"];

/** Tudo o que aconteceu no projeto, do mais recente ao mais antigo. O arquiteto encaminha qualquer fato (ou o resumo da semana) ao cliente. */
export function LinhaDoTempo({ eventos, contexto, onEnviar }: { eventos: Evento[]; contexto: ContextoMensagem; onEnviar?: (titulo: string, tipo: string, texto: string) => void }) {
  const hoje = useHoje();
  const [filtro, setFiltro] = useState<"todos" | TipoEvento>("todos");
  const [limite, setLimite] = useState(30);
  function enviarResumo() {
    onEnviar?.("Resumo da semana", "resumo", mensagemResumo(eventos, Date.now() - 7 * 86_400_000, contexto));
  }
  const visiveis = useMemo(() => (filtro === "todos" ? eventos : eventos.filter((e) => e.tipo === filtro)), [eventos, filtro]);

  return (
    <section aria-label="Linha do tempo" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Filtrar a linha do tempo">
          {FILTROS.map((f) => (
            <button
              key={f}
              aria-pressed={filtro === f}
              onClick={() => {
                setFiltro(f);
                setLimite(30);
              }}
              className={`clicavel shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${filtro === f ? "border-ink bg-ink text-white" : "border-ink/20 bg-white text-ink/70 hover:border-ink/50"}`}
            >
              {f === "todos" ? "Tudo" : ROTULO_TIPO[f]}
            </button>
          ))}
        </div>
        {onEnviar && <BotaoEnviar rotulo="Enviar resumo da semana" onClick={enviarResumo} />}
      </div>

      {visiveis.length === 0 ? (
        <p className="prancha px-4 py-10 text-center text-sm text-ink/55">
          {eventos.length === 0 ? "Quando algo acontecer no projeto (itens feitos, visitas, ocorrências, prazos), aparece aqui, em ordem." : "Nada neste filtro ainda."}
        </p>
      ) : (
        <ol className="prancha divide-y divide-linha overflow-hidden">
          {visiveis.slice(0, limite).map((e) => (
            <li key={e.id} className="flex items-start gap-3 px-4 py-3">
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${COR[e.tipo]}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug text-ink">{e.titulo}</p>
                {e.detalhe && <p className="mt-0.5 whitespace-pre-line text-xs leading-snug text-ink/60">{e.detalhe}</p>}
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink/45">
                  <span>{ROTULO_TIPO[e.tipo]}</span>
                  <span>· {quandoTexto(e.quando, hoje)}</span>
                  {e.quem && <span>· {e.quem}</span>}
                  {e.porCliente && <Chip tom="info">cliente</Chip>}
                </p>
              </div>
              {onEnviar && e.tipo !== "andamento" && (
                <BotaoEnviar rotulo="Enviar" contexto={e.titulo} onClick={() => onEnviar("Enviar ao cliente", e.tipo, e.mensagem ?? mensagemDoEvento(e, contexto))} />
              )}
            </li>
          ))}
        </ol>
      )}
      {visiveis.length > limite && (
        <button onClick={() => setLimite((l) => l + 30)} className="font-mono text-[11px] font-semibold uppercase tracking-wider text-pitanga hover:underline">
          Ver mais ({visiveis.length - limite})
        </button>
      )}
    </section>
  );
}
