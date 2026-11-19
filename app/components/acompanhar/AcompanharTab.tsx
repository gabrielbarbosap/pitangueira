"use client";

import { useMemo, useState } from "react";
import { montarLinhaDoTempo, resumoDoFeed } from "@/lib/acompanhamento";
import { useAuth } from "@/lib/auth";
import { useColecaoObra } from "@/lib/colecaoObra";
import { useData } from "@/lib/data";
import { percentual } from "@/lib/format";
import { situacaoDoPrazo, textoDeTempo } from "@/lib/prazo";
import type { ItemVistoria, Ocorrencia, Publicacao, Visita } from "@/lib/types";
import { useHoje } from "../PrazoVisual";
import { useContextoMensagem, useEnvio } from "./Envio";
import { Feed } from "./Feed";
import { Ocorrencias } from "./Ocorrencias";
import { useAgora } from "./useAgora";
import { Visitas } from "./Visitas";
import { Vistoria } from "./Vistoria";

type Secao = "tempo" | "visitas" | "ocorrencias" | "vistoria";

/**
 * Aba "Acompanhar": o que acontece no projeto além dos números. A tela inicial é um feed (linha do tempo) com tudo, dia a
 * dia; as outras seções gerenciam visitas e reuniões, ocorrências e a vistoria final. O arquiteto encaminha ao cliente
 * pelo WhatsApp (sempre com um toque dele; nada sai sozinho) e o cliente encaminha a vistoria ao arquiteto.
 */
export function AcompanharTab({ visitaFoco = null }: { visitaFoco?: string | null }) {
  const { itens, previsoes, ehCliente, ator } = useData();
  const { user } = useAuth();
  const hoje = useHoje();
  const agora = useAgora();
  const visitas = useColecaoObra<Visita>("visitas", (a, b) => a.quando - b.quando);
  const ocorrencias = useColecaoObra<Ocorrencia>("ocorrencias", (a, b) => b.abertaEm - a.abertaEm);
  const vistoria = useColecaoObra<ItemVistoria>("vistoria", (a, b) => a.ordem - b.ordem);
  const publicacoes = useColecaoObra<Publicacao>("publicacoes", (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  const contexto = useContextoMensagem();
  const { enviar, dialogo } = useEnvio();
  // Quem chega pelo link de um pedido de visita (WhatsApp) já cai nas visitas.
  const [secao, setSecao] = useState<Secao>(visitaFoco ? "visitas" : "tempo");

  const eventos = useMemo(
    () => montarLinhaDoTempo({ itens, previsoes, visitas: visitas.itens, ocorrencias: ocorrencias.itens, vistoria: vistoria.itens, publicacoes: publicacoes.itens }),
    [itens, previsoes, visitas.itens, ocorrencias.itens, vistoria.itens, publicacoes.itens],
  );
  const resumo = useMemo(() => resumoDoFeed(visitas.itens, ocorrencias.itens, vistoria.itens, agora), [visitas.itens, ocorrencias.itens, vistoria.itens, agora]);

  const prazo = useMemo(() => {
    const concluidos = itens.filter((i) => i.feito && i.pago).length;
    const s = hoje ? situacaoDoPrazo(previsoes, hoje, itens.length ? percentual(concluidos, itens.length) : 0) : null;
    return s ? { texto: textoDeTempo(s), atencao: s.status === "atrasado" } : null;
  }, [itens, previsoes, hoje]);

  const proximas = visitas.itens.filter((v) => v.status === "agendada" || (v.status === "solicitada" && !ehCliente)).length;
  const abertas = resumo.ocorrenciasAbertas;
  const pendentes = vistoria.itens.filter((i) => i.status === "pendente").length;
  const abas: { id: Secao; rotulo: string; qtd: number }[] = [
    { id: "tempo", rotulo: "Linha do tempo", qtd: 0 },
    { id: "visitas", rotulo: "Visitas", qtd: proximas },
    { id: "ocorrencias", rotulo: "Ocorrências", qtd: abertas },
    { id: "vistoria", rotulo: "Vistoria", qtd: pendentes },
  ];
  // O arquiteto encaminha tudo ao cliente. O cliente encaminha só a vistoria, ao arquiteto.
  const onEnviarArquiteto = ehCliente ? undefined : enviar;

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

      {secao === "tempo" && (
        <Feed
          eventos={eventos}
          resumo={resumo}
          prazo={prazo}
          contexto={contexto}
          ator={ator}
          ehCliente={ehCliente}
          uid={user?.uid ?? ""}
          onIrPara={setSecao}
          onEnviar={enviar}
          onPublicar={async (texto) => void (await publicacoes.salvar({ texto, autor: `${ator}${ehCliente ? " (cliente)" : ""}`, autorUid: user?.uid }))}
          onRemoverPublicacao={publicacoes.remover}
        />
      )}
      {secao === "visitas" && <Visitas visitas={visitas.itens} contexto={contexto} ehCliente={ehCliente} uid={user?.uid ?? ""} ator={ator} foco={visitaFoco} onSalvar={visitas.salvar} onRemover={visitas.remover} onEnviar={enviar} />}
      {secao === "ocorrencias" && <Ocorrencias ocorrencias={ocorrencias.itens} contexto={contexto} somenteLeitura={ehCliente} onSalvar={async (o) => void (await ocorrencias.salvar(o))} onRemover={ocorrencias.remover} onEnviar={onEnviarArquiteto} />}
      {secao === "vistoria" && (
        <Vistoria itens={vistoria.itens} contexto={contexto} ehCliente={ehCliente} ator={ator} uid={user?.uid ?? ""} onSalvar={async (i) => void (await vistoria.salvar(i))} onRemover={vistoria.remover} onEnviar={enviar} />
      )}
      {dialogo}
    </div>
  );
}
