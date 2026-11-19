"use client";

import { useMemo, useState } from "react";
import { montarLinhaDoTempo } from "@/lib/acompanhamento";
import { useColecaoObra } from "@/lib/colecaoObra";
import { useData } from "@/lib/data";
import type { ItemVistoria, Ocorrencia, Visita } from "@/lib/types";
import { useContextoMensagem, useEnvio } from "./Envio";
import { LinhaDoTempo } from "./LinhaDoTempo";
import { Ocorrencias } from "./Ocorrencias";
import { Visitas } from "./Visitas";
import { Vistoria } from "./Vistoria";

type Secao = "tempo" | "visitas" | "ocorrencias" | "vistoria";

/**
 * Aba "Acompanhar": o que acontece no projeto além dos números. Linha do tempo, visitas e reuniões, ocorrências e a
 * vistoria final. O arquiteto encaminha qualquer coisa ao cliente pelo WhatsApp (sempre com um toque dele; nada sai sozinho).
 */
export function AcompanharTab() {
  const { itens, previsoes, ehCliente, ator } = useData();
  const visitas = useColecaoObra<Visita>("visitas", (a, b) => a.quando - b.quando);
  const ocorrencias = useColecaoObra<Ocorrencia>("ocorrencias", (a, b) => b.abertaEm - a.abertaEm);
  const vistoria = useColecaoObra<ItemVistoria>("vistoria", (a, b) => a.ordem - b.ordem);
  const contexto = useContextoMensagem();
  const { enviar, dialogo } = useEnvio();
  const [secao, setSecao] = useState<Secao>("tempo");

  const eventos = useMemo(
    () => montarLinhaDoTempo({ itens, previsoes, visitas: visitas.itens, ocorrencias: ocorrencias.itens, vistoria: vistoria.itens }),
    [itens, previsoes, visitas.itens, ocorrencias.itens, vistoria.itens],
  );

  const proximas = visitas.itens.filter((v) => v.status === "agendada").length;
  const abertas = ocorrencias.itens.filter((o) => o.status !== "resolvida").length;
  const pendentes = vistoria.itens.filter((i) => i.status === "pendente").length;
  const abas: { id: Secao; rotulo: string; qtd: number }[] = [
    { id: "tempo", rotulo: "Linha do tempo", qtd: 0 },
    { id: "visitas", rotulo: "Visitas", qtd: proximas },
    { id: "ocorrencias", rotulo: "Ocorrências", qtd: abertas },
    { id: "vistoria", rotulo: "Vistoria", qtd: pendentes },
  ];
  // O cliente não encaminha nada: o botão de WhatsApp é só do arquiteto.
  const onEnviar = ehCliente ? undefined : enviar;

  return (
    <div className="space-y-4">
      <div className="-mx-1 overflow-x-auto px-1 pb-1" data-tour="acompanhar">
        <div className="inline-flex rounded-full bg-ink/[0.07] p-1" role="tablist" aria-label="Acompanhamento">
          {abas.map((a) => (
            <button
              key={a.id}
              role="tab"
              aria-selected={secao === a.id}
              onClick={() => setSecao(a.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${secao === a.id ? "bg-ink text-white" : "text-ink/60 hover:text-ink"}`}
            >
              {a.rotulo}
              {a.qtd > 0 && <span className={`rounded-full px-1.5 font-mono text-[10px] ${secao === a.id ? "bg-white/20" : "bg-ink/10"}`}>{a.qtd}</span>}
            </button>
          ))}
        </div>
      </div>

      {secao === "tempo" && <LinhaDoTempo eventos={eventos} contexto={contexto} onEnviar={onEnviar} />}
      {secao === "visitas" && <Visitas visitas={visitas.itens} contexto={contexto} somenteLeitura={ehCliente} onSalvar={async (v) => void (await visitas.salvar(v))} onRemover={visitas.remover} onEnviar={onEnviar} />}
      {secao === "ocorrencias" && <Ocorrencias ocorrencias={ocorrencias.itens} contexto={contexto} somenteLeitura={ehCliente} onSalvar={async (o) => void (await ocorrencias.salvar(o))} onRemover={ocorrencias.remover} onEnviar={onEnviar} />}
      {secao === "vistoria" && <Vistoria itens={vistoria.itens} contexto={contexto} ehCliente={ehCliente} ator={ator} onSalvar={async (i) => void (await vistoria.salvar(i))} onRemover={vistoria.remover} onEnviar={onEnviar} />}
      {dialogo}
    </div>
  );
}
