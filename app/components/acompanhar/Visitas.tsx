"use client";

import { useEffect, useState } from "react";
import { dataHoraBr, mensagemAta, mensagemPedidoVisita, mensagemVisitaAgendada, mensagemVisitaAprovada, mensagemVisitaRecusada, type ContextoMensagem } from "@/lib/acompanhamento";
import type { StatusVisita, Visita } from "@/lib/types";
import { useConfirm } from "../ConfirmProvider";
import { IconeEditar, IconeLixo, IconeMais } from "../Icones";
import { Modal } from "../Modal";
import { Botao } from "../ui/Botao";
import { Chip, type TomChip } from "../ui/Chip";
import { BotaoEnviar } from "./Envio";

const ROTULO: Record<StatusVisita, string> = { solicitada: "Aguardando aprovação", agendada: "Agendada", realizada: "Realizada", cancelada: "Cancelada", recusada: "Recusada" };
const TOM: Record<StatusVisita, TomChip> = { solicitada: "aviso", agendada: "info", realizada: "ok", cancelada: "neutro", recusada: "perigo" };

const aCampoData = (ms: number) => new Date(ms).toLocaleDateString("sv-SE");
const aCampoHora = (ms: number) => new Date(ms).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const deCampos = (data: string, hora: string): number | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data);
  const h = /^(\d{2}):(\d{2})$/.exec(hora || "09:00");
  return m && h ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(h[1]), Number(h[2])).getTime() : null;
};

type DadosVisita = Omit<Visita, "id"> & { id?: string };

/**
 * Janela de uma visita. O arquiteto agenda (e muda tudo); o cliente PEDE uma visita (`modo="pedido"`): título, data, hora,
 * local e o motivo. `statusInicial` deixa "Sugerir outro horário" já abrir como visita agendada.
 */
function VisitaDialog({
  visita,
  modo,
  statusInicial,
  onFechar,
  onSalvar,
}: {
  visita: Visita | null;
  modo: "arquiteto" | "pedido";
  statusInicial?: StatusVisita;
  onFechar: () => void;
  onSalvar: (v: DadosVisita) => Promise<void>;
}) {
  const pedido = modo === "pedido";
  const [titulo, setTitulo] = useState(visita?.titulo ?? "");
  const [data, setData] = useState(visita ? aCampoData(visita.quando) : "");
  const [hora, setHora] = useState(visita ? aCampoHora(visita.quando) : "09:00");
  const [local, setLocal] = useState(visita?.local ?? "");
  const [participantes, setParticipantes] = useState(visita?.participantes ?? "");
  const [pauta, setPauta] = useState(visita?.pauta ?? "");
  const [status, setStatus] = useState<StatusVisita>(statusInicial ?? visita?.status ?? "agendada");
  const [ata, setAta] = useState(visita?.ata ?? "");
  const [ocupado, setOcupado] = useState(false);
  const quando = deCampos(data, hora);
  const valido = titulo.trim() !== "" && quando !== null;

  async function salvar() {
    if (!valido || quando === null || ocupado) return;
    setOcupado(true);
    try {
      await onSalvar({
        ...(visita ? { ...visita } : {}),
        titulo: titulo.trim(),
        quando,
        local: local.trim(),
        participantes: participantes.trim(),
        pauta: pauta.trim(),
        status: pedido ? "solicitada" : status,
        ata: pedido ? "" : ata.trim(),
      });
      onFechar();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Modal aberto onFechar={onFechar} titulo={pedido ? "Pedir uma visita" : visita ? "Editar visita" : "Nova visita"}>
      <div className="space-y-4">
        {pedido && <p className="text-sm leading-snug text-ink/65">Sugira o dia e o horário. O arquiteto aprova pelo link que você manda no WhatsApp, ou propõe outro horário.</p>}
        <div>
          <label htmlFor="vis-titulo" className="rotulo-campo">{pedido ? "Para quê?" : "Título"}</label>
          <input id="vis-titulo" className="input-pit" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder={pedido ? "Ex.: Ver a cozinha antes de fechar o forro" : "Ex.: Visita técnica, Reunião de acabamentos"} />
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
        {!pedido && (
          <div>
            <label htmlFor="vis-part" className="rotulo-campo">Quem participa (opcional)</label>
            <input id="vis-part" className="input-pit" value={participantes} onChange={(e) => setParticipantes(e.target.value)} placeholder="Ex.: Arquiteta, cliente, mestre de obras" />
          </div>
        )}
        <div>
          <label htmlFor="vis-pauta" className="rotulo-campo">{pedido ? "Motivo ou assuntos (opcional)" : "Pauta (opcional)"}</label>
          <textarea id="vis-pauta" className="input-pit resize-none" rows={3} value={pauta} onChange={(e) => setPauta(e.target.value)} placeholder={pedido ? "O que você quer ver ou decidir" : "O que vai ser visto ou decidido"} />
        </div>
        {!pedido && (
          <div>
            <label htmlFor="vis-status" className="rotulo-campo">Situação</label>
            <select id="vis-status" className="input-pit" value={status} onChange={(e) => setStatus(e.target.value as StatusVisita)}>
              {(Object.keys(ROTULO) as StatusVisita[]).map((s) => (
                <option key={s} value={s}>{ROTULO[s]}</option>
              ))}
            </select>
          </div>
        )}
        {!pedido && (status === "realizada" || status === "recusada") && (
          <div>
            <label htmlFor="vis-ata" className="rotulo-campo">{status === "recusada" ? "Resposta ao cliente" : "Ata: o que ficou combinado"}</label>
            <textarea id="vis-ata" className="input-pit resize-none" rows={4} value={ata} onChange={(e) => setAta(e.target.value)} placeholder={status === "recusada" ? "Ex.: Nesse dia não consigo, que tal quinta, às 15h?" : "Decisões, prazos, quem faz o quê"} />
          </div>
        )}
        <div className="flex gap-2">
          <Botao className="flex-1" onClick={onFechar}>Cancelar</Botao>
          <Botao variante="primario" className="flex-1" disabled={!valido || ocupado} onClick={salvar}>
            {ocupado ? "Salvando…" : pedido ? "Pedir visita" : "Salvar visita"}
          </Botao>
        </div>
      </div>
    </Modal>
  );
}

/** O arquiteto recusa o pedido e escreve a resposta (opcional), que vai na mensagem ao cliente. */
function RecusaDialog({ visita, onFechar, onConfirmar }: { visita: Visita; onFechar: () => void; onConfirmar: (resposta: string) => Promise<void> }) {
  const [resposta, setResposta] = useState("");
  const [ocupado, setOcupado] = useState(false);
  return (
    <Modal aberto onFechar={onFechar} titulo="Recusar o pedido de visita">
      <div className="space-y-4">
        <p className="text-sm leading-snug text-ink/65">
          “{visita.titulo}” em {dataHoraBr(visita.quando)}. O cliente fica sabendo que o pedido foi recusado. Se quiser, sugira outro horário.
        </p>
        <div>
          <label htmlFor="rec-resposta" className="rotulo-campo">Resposta ao cliente (opcional)</label>
          <textarea id="rec-resposta" className="input-pit resize-none" rows={3} value={resposta} onChange={(e) => setResposta(e.target.value)} placeholder="Ex.: Nesse dia não consigo, que tal quinta, às 15h?" />
        </div>
        <div className="flex gap-2">
          <Botao className="flex-1" onClick={onFechar}>Cancelar</Botao>
          <Botao
            variante="primario"
            className="flex-1"
            disabled={ocupado}
            onClick={async () => {
              setOcupado(true);
              try {
                await onConfirmar(resposta.trim());
                onFechar();
              } finally {
                setOcupado(false);
              }
            }}
          >
            Recusar o pedido
          </Botao>
        </div>
      </div>
    </Modal>
  );
}

export function Visitas({
  visitas,
  contexto,
  ehCliente,
  uid,
  ator,
  foco,
  onSalvar,
  onRemover,
  onEnviar,
}: {
  visitas: Visita[];
  contexto: ContextoMensagem;
  ehCliente: boolean;
  uid: string;
  ator: string;
  /** Visita para destacar (vem do link do WhatsApp): a tela rola até ela. */
  foco?: string | null;
  onSalvar: (v: DadosVisita) => Promise<string>;
  onRemover: (id: string) => Promise<void>;
  onEnviar?: (titulo: string, tipo: string, texto: string) => void;
}) {
  const confirmar = useConfirm();
  const [dialogo, setDialogo] = useState<{ chave: number; visita: Visita | null; modo: "arquiteto" | "pedido"; statusInicial?: StatusVisita } | null>(null);
  const [recusando, setRecusando] = useState<Visita | null>(null);
  const aguardando = visitas.filter((v) => v.status === "solicitada").sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  const proximas = visitas.filter((v) => v.status === "agendada").sort((a, b) => a.quando - b.quando);
  const anteriores = visitas.filter((v) => v.status !== "agendada" && v.status !== "solicitada").sort((a, b) => b.quando - a.quando);

  // Chegou pelo link do WhatsApp: rola até a visita do pedido.
  useEffect(() => {
    if (foco) document.getElementById(`visita-${foco}`)?.scrollIntoView({ block: "center" });
  }, [foco, visitas.length]);

  const meu = (v: Visita) => ehCliente && Boolean(uid) && v.criadoPorUid === uid;

  async function aprovar(v: Visita) {
    const aprovada: Visita = { ...v, status: "agendada" };
    await onSalvar(aprovada);
    onEnviar?.("Avisar o cliente da confirmação", "visita", mensagemVisitaAprovada(aprovada, contexto));
  }

  async function recusar(v: Visita, resposta: string) {
    const recusada: Visita = { ...v, status: "recusada", ata: resposta };
    await onSalvar(recusada);
    onEnviar?.("Avisar o cliente da resposta", "visita", mensagemVisitaRecusada(recusada, contexto));
  }

  /** O cliente salva o pedido e já cai na janela do WhatsApp com o link para o arquiteto aprovar. */
  async function pedir(dados: DadosVisita) {
    const completo: DadosVisita = { ...dados, criadoPorUid: uid, criadoPorNome: `${ator} (cliente)` };
    const id = await onSalvar(completo);
    onEnviar?.("Enviar o pedido ao arquiteto", "visita", mensagemPedidoVisita({ ...completo, id } as Visita, contexto));
  }

  const cartao = (v: Visita) => (
    <li key={v.id} id={`visita-${v.id}`} className={`prancha p-4 ${foco === v.id ? "ring-2 ring-pitanga" : ""}`}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-ink">{v.titulo}</p>
          <p className="mt-0.5 text-xs text-ink/60">
            {dataHoraBr(v.quando)}
            {v.local && ` · ${v.local}`}
          </p>
          {v.status === "solicitada" && v.criadoPorNome && <p className="mt-0.5 text-xs text-ink/50">Pedida por {v.criadoPorNome}</p>}
        </div>
        <Chip tom={TOM[v.status]}>{ROTULO[v.status]}</Chip>
      </div>
      {v.participantes && <p className="mt-2 text-xs text-ink/55">Participam: {v.participantes}</p>}
      {v.pauta && <p className="mt-2 whitespace-pre-line text-sm leading-snug text-ink/75">{v.pauta}</p>}
      {v.status === "realizada" && v.ata && (
        <div className="mt-3 rounded-xl bg-ink/[0.04] p-3">
          <p className="rotulo-tec text-ink/50">Ata</p>
          <p className="mt-1 whitespace-pre-line text-sm leading-snug text-ink/80">{v.ata}</p>
        </div>
      )}
      {v.status === "recusada" && v.ata && (
        <div className="mt-3 rounded-xl bg-pitanga/[0.07] p-3">
          <p className="rotulo-tec text-pitanga-escuro">Resposta do arquiteto</p>
          <p className="mt-1 whitespace-pre-line text-sm leading-snug text-ink/80">{v.ata}</p>
        </div>
      )}

      {/* Arquiteto: decide o pedido */}
      {!ehCliente && v.status === "solicitada" && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Botao variante="primario" tamanho="pequeno" onClick={() => void aprovar(v)} aria-label={`Aprovar a visita: ${v.titulo}`}>
            Aprovar
          </Botao>
          <Botao tamanho="pequeno" onClick={() => setDialogo({ chave: Date.now(), visita: v, modo: "arquiteto", statusInicial: "agendada" })} aria-label={`Sugerir outro horário: ${v.titulo}`}>
            Sugerir outro horário
          </Botao>
          <Botao tamanho="pequeno" onClick={() => setRecusando(v)} aria-label={`Recusar a visita: ${v.titulo}`}>
            Recusar
          </Botao>
        </div>
      )}

      {/* Cliente: acompanha o próprio pedido */}
      {meu(v) && v.status === "solicitada" && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {onEnviar && <BotaoEnviar rotulo="Enviar ao arquiteto" contexto={v.titulo} onClick={() => onEnviar("Enviar o pedido ao arquiteto", "visita", mensagemPedidoVisita(v, contexto))} />}
          <span className="flex-1" />
          <button
            className="btn btn-icone perigo h-9 w-9"
            aria-label={`Cancelar o pedido: ${v.titulo}`}
            title="Cancelar o pedido"
            onClick={async () => {
              if (await confirmar({ titulo: "Cancelar o pedido", mensagem: `Cancelar o pedido de visita "${v.titulo}"?`, confirmar: "Cancelar o pedido", tom: "perigo" })) await onRemover(v.id);
            }}
          >
            <IconeLixo />
          </button>
        </div>
      )}

      {/* Arquiteto: envios e edição */}
      {!ehCliente && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {onEnviar && v.status === "agendada" && <BotaoEnviar rotulo="Enviar convite" contexto={v.titulo} onClick={() => onEnviar("Enviar convite da visita", "visita", mensagemVisitaAgendada(v, contexto))} />}
          {onEnviar && v.status === "realizada" && <BotaoEnviar rotulo="Enviar ata" contexto={v.titulo} onClick={() => onEnviar("Enviar a ata ao cliente", "visita", mensagemAta(v, contexto))} />}
          <span className="flex-1" />
          <button className="btn btn-icone h-9 w-9" aria-label={`Editar visita ${v.titulo}`} title="Editar" onClick={() => setDialogo({ chave: Date.now(), visita: v, modo: "arquiteto" })}>
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
      {ehCliente ? (
        <Botao variante="primario" onClick={() => setDialogo({ chave: Date.now(), visita: null, modo: "pedido" })}>
          <IconeMais /> Pedir uma visita
        </Botao>
      ) : (
        <Botao variante="primario" onClick={() => setDialogo({ chave: Date.now(), visita: null, modo: "arquiteto" })}>
          <IconeMais /> Nova visita
        </Botao>
      )}
      {visitas.length === 0 && (
        <p className="prancha px-4 py-10 text-center text-sm text-ink/55">
          {ehCliente ? "Nenhuma visita ou reunião marcada ainda. Se quiser ver a obra, peça uma visita: o arquiteto aprova pelo WhatsApp." : "Marque visitas técnicas e reuniões, avise o cliente pelo WhatsApp e registre a ata depois. O cliente também pode pedir uma visita."}
        </p>
      )}
      {aguardando.length > 0 && (
        <div>
          <h3 className="rotulo-tec mb-2 text-ink/50">{ehCliente ? "Seus pedidos aguardando" : "Aguardando a sua aprovação"} ({aguardando.length})</h3>
          <ul className="space-y-3">{aguardando.map(cartao)}</ul>
        </div>
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
      {dialogo && (
        <VisitaDialog
          key={dialogo.chave}
          visita={dialogo.visita}
          modo={dialogo.modo}
          statusInicial={dialogo.statusInicial}
          onFechar={() => setDialogo(null)}
          onSalvar={async (v) => {
            if (dialogo.modo === "pedido") await pedir(v);
            else {
              const salva = await onSalvar(v);
              // "Sugerir outro horário": já abre a mensagem ao cliente com o novo horário.
              if (dialogo.statusInicial === "agendada" && v.status === "agendada" && dialogo.visita?.status === "solicitada") {
                onEnviar?.("Avisar o cliente do novo horário", "visita", mensagemVisitaAprovada({ ...v, id: salva } as Visita, contexto));
              }
            }
          }}
        />
      )}
      {recusando && <RecusaDialog visita={recusando} onFechar={() => setRecusando(null)} onConfirmar={(r) => recusar(recusando, r)} />}
    </section>
  );
}
