"use client";

import { useState } from "react";
import { dataHoraBr, mensagemAta, mensagemVisitaAgendada, type ContextoMensagem } from "@/lib/acompanhamento";
import type { StatusVisita, Visita } from "@/lib/types";
import { useConfirm } from "../ConfirmProvider";
import { IconeEditar, IconeLixo, IconeMais } from "../Icones";
import { Modal } from "../Modal";
import { Botao } from "../ui/Botao";
import { Chip } from "../ui/Chip";
import { BotaoEnviar } from "./Envio";

const ROTULO: Record<StatusVisita, string> = { agendada: "Agendada", realizada: "Realizada", cancelada: "Cancelada" };

const aCampoData = (ms: number) => new Date(ms).toLocaleDateString("sv-SE");
const aCampoHora = (ms: number) => new Date(ms).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const deCampos = (data: string, hora: string): number | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  const h = /^(\d{2}):(\d{2})$/.exec(hora || "09:00");
  return m && h ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(h[1]), Number(h[2])).getTime() : null;
};

function VisitaDialog({ visita, onFechar, onSalvar }: { visita: Visita | null; onFechar: () => void; onSalvar: (v: Omit<Visita, "id"> & { id?: string }) => Promise<void> }) {
  const [titulo, setTitulo] = useState(visita?.titulo ?? "");
  const [data, setData] = useState(visita ? aCampoData(visita.quando) : "");
  const [hora, setHora] = useState(visita ? aCampoHora(visita.quando) : "09:00");
  const [local, setLocal] = useState(visita?.local ?? "");
  const [participantes, setParticipantes] = useState(visita?.participantes ?? "");
  const [pauta, setPauta] = useState(visita?.pauta ?? "");
  const [status, setStatus] = useState<StatusVisita>(visita?.status ?? "agendada");
  const [ata, setAta] = useState(visita?.ata ?? "");
  const [ocupado, setOcupado] = useState(false);
  const quando = deCampos(data, hora);
  const valido = titulo.trim() !== "" && quando !== null;

  async function salvar() {
    if (!valido || quando === null || ocupado) return;
    setOcupado(true);
    try {
      await onSalvar({ ...(visita ? { id: visita.id, createdAt: visita.createdAt } : {}), titulo: titulo.trim(), quando, local: local.trim(), participantes: participantes.trim(), pauta: pauta.trim(), status, ata: ata.trim() });
      onFechar();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Modal aberto onFechar={onFechar} titulo={visita ? "Editar visita" : "Nova visita"}>
      <div className="space-y-4">
        <div>
          <label htmlFor="vis-titulo" className="rotulo-campo">Título</label>
          <input id="vis-titulo" className="input-pit" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Visita técnica, Reunião de acabamentos" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="vis-data" className="rotulo-campo">Data</label>
            <input id="vis-data" type="date" className="input-pit" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div>
            <label htmlFor="vis-hora" className="rotulo-campo">Hora</label>
            <input id="vis-hora" type="time" className="input-pit" value={hora} onChange={(e) => setHora(e.target.value)} />
          </div>
        </div>
        <div>
          <label htmlFor="vis-local" className="rotulo-campo">Local (opcional)</label>
          <input id="vis-local" className="input-pit" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Na obra, no escritório, online…" />
        </div>
        <div>
          <label htmlFor="vis-part" className="rotulo-campo">Quem participa (opcional)</label>
          <input id="vis-part" className="input-pit" value={participantes} onChange={(e) => setParticipantes(e.target.value)} placeholder="Ex.: Arquiteta, cliente, mestre de obras" />
        </div>
        <div>
          <label htmlFor="vis-pauta" className="rotulo-campo">Pauta (opcional)</label>
          <textarea id="vis-pauta" className="input-pit resize-none" rows={3} value={pauta} onChange={(e) => setPauta(e.target.value)} placeholder="O que vai ser visto ou decidido" />
        </div>
        <div>
          <label htmlFor="vis-status" className="rotulo-campo">Situação</label>
          <select id="vis-status" className="input-pit" value={status} onChange={(e) => setStatus(e.target.value as StatusVisita)}>
            {(Object.keys(ROTULO) as StatusVisita[]).map((s) => (
              <option key={s} value={s}>{ROTULO[s]}</option>
            ))}
          </select>
        </div>
        {status === "realizada" && (
          <div>
            <label htmlFor="vis-ata" className="rotulo-campo">Ata: o que ficou combinado</label>
            <textarea id="vis-ata" className="input-pit resize-none" rows={4} value={ata} onChange={(e) => setAta(e.target.value)} placeholder="Decisões, prazos, quem faz o quê" />
          </div>
        )}
        <div className="flex gap-2">
          <Botao className="flex-1" onClick={onFechar}>Cancelar</Botao>
          <Botao variante="primario" className="flex-1" disabled={!valido || ocupado} onClick={salvar}>{ocupado ? "Salvando…" : "Salvar visita"}</Botao>
        </div>
      </div>
    </Modal>
  );
}

export function Visitas({
  visitas,
  contexto,
  somenteLeitura,
  onSalvar,
  onRemover,
  onEnviar,
}: {
  visitas: Visita[];
  contexto: ContextoMensagem;
  somenteLeitura: boolean;
  onSalvar: (v: Omit<Visita, "id"> & { id?: string }) => Promise<void>;
  onRemover: (id: string) => Promise<void>;
  onEnviar?: (titulo: string, tipo: string, texto: string) => void;
}) {
  const confirmar = useConfirm();
  const [dialogo, setDialogo] = useState<{ chave: number; visita: Visita | null } | null>(null);
  const proximas = visitas.filter((v) => v.status === "agendada").sort((a, b) => a.quando - b.quando);
  const anteriores = visitas.filter((v) => v.status !== "agendada").sort((a, b) => b.quando - a.quando);

  const cartao = (v: Visita) => (
    <li key={v.id} className="prancha p-4">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-ink">{v.titulo}</p>
          <p className="mt-0.5 text-xs text-ink/60">
            {dataHoraBr(v.quando)}
            {v.local && ` · ${v.local}`}
          </p>
        </div>
        <Chip tom={v.status === "agendada" ? "info" : v.status === "realizada" ? "ok" : "neutro"}>{ROTULO[v.status]}</Chip>
      </div>
      {v.participantes && <p className="mt-2 text-xs text-ink/55">Participam: {v.participantes}</p>}
      {v.pauta && <p className="mt-2 whitespace-pre-line text-sm leading-snug text-ink/75">{v.pauta}</p>}
      {v.status === "realizada" && v.ata && (
        <div className="mt-3 rounded-xl bg-ink/[0.04] p-3">
          <p className="rotulo-tec text-ink/50">Ata</p>
          <p className="mt-1 whitespace-pre-line text-sm leading-snug text-ink/80">{v.ata}</p>
        </div>
      )}
      {!somenteLeitura && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {onEnviar && v.status === "agendada" && <BotaoEnviar rotulo="Enviar convite" contexto={v.titulo} onClick={() => onEnviar("Enviar convite da visita", "visita", mensagemVisitaAgendada(v, contexto))} />}
          {onEnviar && v.status === "realizada" && <BotaoEnviar rotulo="Enviar ata" contexto={v.titulo} onClick={() => onEnviar("Enviar a ata ao cliente", "visita", mensagemAta(v, contexto))} />}
          <span className="flex-1" />
          <button className="btn btn-icone h-9 w-9" aria-label={`Editar visita ${v.titulo}`} title="Editar" onClick={() => setDialogo({ chave: Date.now(), visita: v })}>
            <IconeEditar />
          </button>
          <button
            className="btn btn-icone perigo h-9 w-9"
            aria-label={`Remover visita ${v.titulo}`}
            title="Remover"
            onClick={async () => {
              if (await confirmar({ titulo: "Remover visita", mensagem: `Remover "${v.titulo}"? Essa ação não pode ser desfeita.`, confirmar: "Remover", tom: "perigo" })) await onRemover(v.id);
            }}
          >
            <IconeLixo />
          </button>
        </div>
      )}
    </li>
  );

  return (
    <section aria-label="Visitas e reuniões" className="space-y-4">
      {!somenteLeitura && (
        <Botao variante="primario" onClick={() => setDialogo({ chave: Date.now(), visita: null })}>
          <IconeMais /> Nova visita
        </Botao>
      )}
      {visitas.length === 0 && (
        <p className="prancha px-4 py-10 text-center text-sm text-ink/55">
          {somenteLeitura ? "Nenhuma visita ou reunião marcada ainda." : "Marque visitas técnicas e reuniões, avise o cliente pelo WhatsApp e registre a ata depois."}
        </p>
      )}
      {proximas.length > 0 && (
        <div>
          <h3 className="rotulo-tec mb-2 text-ink/50">Próximas</h3>
          <ul className="space-y-3">{proximas.map(cartao)}</ul>
        </div>
      )}
      {anteriores.length > 0 && (
        <div>
          <h3 className="rotulo-tec mb-2 text-ink/50">Anteriores</h3>
          <ul className="space-y-3">{anteriores.map(cartao)}</ul>
        </div>
      )}
      {dialogo && <VisitaDialog key={dialogo.chave} visita={dialogo.visita} onFechar={() => setDialogo(null)} onSalvar={onSalvar} />}
    </section>
  );
}
