"use client";

import { useState } from "react";
import { dataHoraBr, mensagemOcorrencia, ROTULO_GRAVIDADE, type ContextoMensagem } from "@/lib/acompanhamento";
import type { Gravidade, Ocorrencia, StatusOcorrencia } from "@/lib/types";
import { useConfirm } from "../ConfirmProvider";
import { IconeEditar, IconeLixo, IconeMais } from "../Icones";
import { Modal } from "../Modal";
import { Botao } from "../ui/Botao";
import { Chip, type TomChip } from "../ui/Chip";
import { BotaoEnviar } from "./Envio";

const ROTULO_STATUS: Record<StatusOcorrencia, string> = { aberta: "Aberta", em_andamento: "Em andamento", resolvida: "Resolvida" };
const TOM_GRAVIDADE: Record<Gravidade, TomChip> = { alta: "perigo", media: "aviso", baixa: "neutro" };
const PESO: Record<Gravidade, number> = { alta: 0, media: 1, baixa: 2 };

function OcorrenciaDialog({ ocorrencia, onFechar, onSalvar }: { ocorrencia: Ocorrencia | null; onFechar: () => void; onSalvar: (o: Omit<Ocorrencia, "id"> & { id?: string }) => Promise<void> }) {
  const [titulo, setTitulo] = useState(ocorrencia?.titulo ?? "");
  const [descricao, setDescricao] = useState(ocorrencia?.descricao ?? "");
  const [gravidade, setGravidade] = useState<Gravidade>(ocorrencia?.gravidade ?? "media");
  const [responsavel, setResponsavel] = useState(ocorrencia?.responsavel ?? "");
  const [status, setStatus] = useState<StatusOcorrencia>(ocorrencia?.status ?? "aberta");
  const [resolucao, setResolucao] = useState(ocorrencia?.resolucao ?? "");
  const [ocupado, setOcupado] = useState(false);
  const valido = titulo.trim() !== "";

  async function salvar() {
    if (!valido || ocupado) return;
    setOcupado(true);
    try {
      const agora = Date.now();
      await onSalvar({
        ...(ocorrencia ? { id: ocorrencia.id, createdAt: ocorrencia.createdAt } : {}),
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        gravidade,
        responsavel: responsavel.trim(),
        status,
        abertaEm: ocorrencia?.abertaEm ?? agora,
        // Resolvida agora: grava a data. Já estava resolvida: mantém. Reaberta: apaga.
        resolvidaEm: status === "resolvida" ? (ocorrencia?.resolvidaEm ?? agora) : null,
        resolucao: status === "resolvida" ? resolucao.trim() : "",
      });
      onFechar();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Modal aberto onFechar={onFechar} titulo={ocorrencia ? "Editar ocorrência" : "Nova ocorrência"}>
      <div className="space-y-4">
        <div>
          <label htmlFor="oc-titulo" className="rotulo-campo">O que aconteceu</label>
          <input id="oc-titulo" className="input-pit" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Vazamento na laje do banheiro" />
        </div>
        <div>
          <label htmlFor="oc-desc" className="rotulo-campo">Detalhes (opcional)</label>
          <textarea id="oc-desc" className="input-pit resize-none" rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="oc-grav" className="rotulo-campo">Gravidade</label>
            <select id="oc-grav" className="input-pit" value={gravidade} onChange={(e) => setGravidade(e.target.value as Gravidade)}>
              {(Object.keys(ROTULO_GRAVIDADE) as Gravidade[]).map((g) => (
                <option key={g} value={g}>{ROTULO_GRAVIDADE[g]}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="oc-status" className="rotulo-campo">Situação</label>
            <select id="oc-status" className="input-pit" value={status} onChange={(e) => setStatus(e.target.value as StatusOcorrencia)}>
              {(Object.keys(ROTULO_STATUS) as StatusOcorrencia[]).map((s) => (
                <option key={s} value={s}>{ROTULO_STATUS[s]}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="oc-resp" className="rotulo-campo">Responsável (opcional)</label>
          <input id="oc-resp" className="input-pit" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Quem vai resolver" />
        </div>
        {status === "resolvida" && (
          <div>
            <label htmlFor="oc-res" className="rotulo-campo">Como foi resolvido</label>
            <textarea id="oc-res" className="input-pit resize-none" rows={3} value={resolucao} onChange={(e) => setResolucao(e.target.value)} />
          </div>
        )}
        <div className="flex gap-2">
          <Botao className="flex-1" onClick={onFechar}>Cancelar</Botao>
          <Botao variante="primario" className="flex-1" disabled={!valido || ocupado} onClick={salvar}>{ocupado ? "Salvando…" : "Salvar ocorrência"}</Botao>
        </div>
      </div>
    </Modal>
  );
}

export function Ocorrencias({
  ocorrencias,
  contexto,
  somenteLeitura,
  onSalvar,
  onRemover,
  onEnviar,
}: {
  ocorrencias: Ocorrencia[];
  contexto: ContextoMensagem;
  somenteLeitura: boolean;
  onSalvar: (o: Omit<Ocorrencia, "id"> & { id?: string }) => Promise<void>;
  onRemover: (id: string) => Promise<void>;
  onEnviar?: (titulo: string, tipo: string, texto: string) => void;
}) {
  const confirmar = useConfirm();
  const [dialogo, setDialogo] = useState<{ chave: number; ocorrencia: Ocorrencia | null } | null>(null);
  const abertas = ocorrencias.filter((o) => o.status !== "resolvida").sort((a, b) => PESO[a.gravidade] - PESO[b.gravidade] || b.abertaEm - a.abertaEm);
  const resolvidas = ocorrencias.filter((o) => o.status === "resolvida").sort((a, b) => (b.resolvidaEm ?? 0) - (a.resolvidaEm ?? 0));

  const cartao = (o: Ocorrencia) => (
    <li key={o.id} className="prancha p-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-ink">{o.titulo}</p>
          <p className="mt-0.5 text-xs text-ink/55">
            Aberta em {dataHoraBr(o.abertaEm)}
            {o.responsavel && ` · ${o.responsavel}`}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <Chip tom={o.status === "resolvida" ? "ok" : TOM_GRAVIDADE[o.gravidade]}>{o.status === "resolvida" ? "Resolvida" : `Gravidade ${ROTULO_GRAVIDADE[o.gravidade].toLowerCase()}`}</Chip>
          {o.status === "em_andamento" && <Chip tom="info">Em andamento</Chip>}
        </div>
      </div>
      {o.descricao && <p className="mt-2 whitespace-pre-line text-sm leading-snug text-ink/75">{o.descricao}</p>}
      {o.status === "resolvida" && o.resolucao && (
        <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm leading-snug text-emerald-900">
          <span className="font-semibold">Resolvida{o.resolvidaEm ? ` em ${dataHoraBr(o.resolvidaEm)}` : ""}:</span> {o.resolucao}
        </div>
      )}
      {!somenteLeitura && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {onEnviar && <BotaoEnviar rotulo="Avisar o cliente" contexto={o.titulo} onClick={() => onEnviar("Avisar o cliente", "ocorrencia", mensagemOcorrencia(o, contexto))} />}
          <span className="flex-1" />
          {o.status !== "resolvida" && (
            <button className="btn btn-linha rounded-full px-3 py-1.5 text-xs font-semibold" onClick={() => setDialogo({ chave: Date.now(), ocorrencia: { ...o, status: "resolvida" } })}>
              Marcar como resolvida
            </button>
          )}
          <button className="btn btn-icone h-9 w-9" aria-label={`Editar ocorrência ${o.titulo}`} title="Editar" onClick={() => setDialogo({ chave: Date.now(), ocorrencia: o })}>
            <IconeEditar />
          </button>
          <button
            className="btn btn-icone perigo h-9 w-9"
            aria-label={`Remover ocorrência ${o.titulo}`}
            title="Remover"
            onClick={async () => {
              if (await confirmar({ titulo: "Remover ocorrência", mensagem: `Remover "${o.titulo}"? Essa ação não pode ser desfeita.`, confirmar: "Remover", tom: "perigo" })) await onRemover(o.id);
            }}
          >
            <IconeLixo />
          </button>
        </div>
      )}
    </li>
  );

  return (
    <section aria-label="Ocorrências" className="space-y-4">
      {!somenteLeitura && (
        <Botao variante="primario" onClick={() => setDialogo({ chave: Date.now(), ocorrencia: null })}>
          <IconeMais /> Nova ocorrência
        </Botao>
      )}
      {ocorrencias.length === 0 && (
        <p className="prancha px-4 py-10 text-center text-sm text-ink/55">
          {somenteLeitura ? "Nenhuma ocorrência registrada. Boa notícia!" : "Registre problemas e imprevisões da obra, quem cuida de cada um e como foram resolvidos."}
        </p>
      )}
      {abertas.length > 0 && (
        <div>
          <h3 className="rotulo-tec mb-2 text-ink/50">Em aberto ({abertas.length})</h3>
          <ul className="space-y-3">{abertas.map(cartao)}</ul>
        </div>
      )}
      {resolvidas.length > 0 && (
        <div>
          <h3 className="rotulo-tec mb-2 text-ink/50">Resolvidas ({resolvidas.length})</h3>
          <ul className="space-y-3">{resolvidas.map(cartao)}</ul>
        </div>
      )}
      {dialogo && <OcorrenciaDialog key={dialogo.chave} ocorrencia={dialogo.ocorrencia} onFechar={() => setDialogo(null)} onSalvar={onSalvar} />}
    </section>
  );
}
