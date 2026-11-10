"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data";
import { useArquiteto } from "@/lib/arquiteto";
import { useDinheiro } from "@/lib/privacidade";
import { MODELOS_PROGRAMA, type ModeloPrograma } from "@/lib/modelosPrograma";
import { filtrarItens, statusDoRequisito, valorEfetivo, vinculoDoRequisito, type Grupo } from "@/lib/calc";
import type { AmbientePrograma, Item, Projeto, Requisito, StatusRequisito } from "@/lib/types";
import { Modal } from "./Modal";
import { useConfirm } from "./ConfirmProvider";
import { ProgramaDocumento } from "./ProgramaDocumento";
import { IconeEditar, IconeLixo } from "./Icones";

const campo = "campo-pit w-full border border-ink/25 bg-white px-3 py-2.5 text-sm text-ink outline-none";
const rotulo = "rotulo-tec mb-1 block text-ink/55";

const STATUS: Record<StatusRequisito, { rotulo: string; dica: string; classe: string; ponto: string }> = {
  pendente: {
    rotulo: "Pendente",
    dica: "ainda sem item no orçamento",
    classe: "border-ink/30 bg-white text-ink/65",
    ponto: "bg-ink/30",
  },
  previsto: {
    rotulo: "No orçamento",
    dica: "já tem item no orçamento",
    classe: "border-amber-400 bg-amber-50 text-amber-900",
    ponto: "bg-amber-500",
  },
  atendido: {
    rotulo: "Concluído",
    dica: "os itens ligados estão feitos e pagos",
    classe: "border-emerald-500 bg-emerald-50 text-emerald-900",
    ponto: "bg-emerald-600",
  },
};

/** Botões de ação de uma linha: ícone + rótulo (rótulo some só em telas muito estreitas). */
function Acoes({ onEditar, onRemover, nome }: { onEditar: () => void; onRemover: () => void; nome: string }) {
  return (
    <div className="flex shrink-0 gap-1.5">
      <button
        onClick={onEditar}
        title={`Editar ${nome}`}
        aria-label={`Editar ${nome}`}
        className="btn btn-icone h-9 gap-1.5 px-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider"
      >
        <IconeEditar />
        <span className="hidden min-[420px]:inline">Editar</span>
      </button>
      <button
        onClick={onRemover}
        title={`Remover ${nome}`}
        aria-label={`Remover ${nome}`}
        className="btn btn-icone perigo h-9 w-9"
      >
        <IconeLixo />
      </button>
    </div>
  );
}

function Secao({ titulo, descricao, contagem, acao }: { titulo: string; descricao?: string; contagem?: number; acao?: ReactNode }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-3">
        <h2 className="rotulo-tec text-ink">
          {titulo}
          {contagem !== undefined && <span className="ml-2 text-ink/40">{contagem}</span>}
        </h2>
        <span className="h-px flex-1 bg-linha" />
        {acao}
      </div>
      {descricao && <p className="mt-1.5 text-[13px] leading-snug text-ink/60">{descricao}</p>}
    </div>
  );
}

function Campo({ nome, dica, children }: { nome: string; dica?: string; children: ReactNode }) {
  return (
    <div>
      <label className={rotulo}>{nome}</label>
      {children}
      {dica && <p className="mt-1 text-xs text-ink/50">{dica}</p>}
    </div>
  );
}

const AMBIENTES_COMUNS = ["Suíte", "Quarto", "Cozinha", "Sala", "Banheiro", "Lavabo", "Escritório", "Garagem", "Área de serviço", "Varanda"];

/** Digitar e apertar Enter para acrescentar uma linha, sem abrir janela. Aceita atalhos de um toque. */
function AdicionarRapido({
  rotulo: nome,
  placeholder,
  botao,
  sugestoes = [],
  onAdicionar,
}: {
  rotulo: string;
  placeholder: string;
  botao: string;
  sugestoes?: string[];
  onAdicionar: (texto: string) => Promise<void>;
}) {
  const [texto, setTexto] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function enviar(valor: string) {
    const v = valor.trim();
    if (!v || ocupado) return;
    setOcupado(true);
    try {
      await onAdicionar(v);
      setTexto("");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="mt-3 space-y-2.5">
      {sugestoes.length > 0 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Atalhos de um toque">
          {sugestoes.map((s) => (
            <button key={s} type="button" disabled={ocupado} onClick={() => enviar(s)} className="btn btn-linha rounded-full px-3 py-1.5 text-xs font-semibold">
              + {s}
            </button>
          ))}
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void enviar(texto);
        }}
        className="flex gap-2"
      >
        <input className={campo} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={placeholder} aria-label={nome} disabled={ocupado} />
        <button type="submit" className="btn btn-primario shrink-0 px-4 text-sm" disabled={!texto.trim() || ocupado}>
          {botao}
        </button>
      </form>
    </div>
  );
}

/** Etiqueta com a situação do pedido. `automatico` = vem dos itens ligados ao orçamento. */
function PilulaStatus({ status, automatico }: { status: StatusRequisito; automatico: boolean }) {
  const st = STATUS[status];
  return (
    <span
      title={`${st.dica}${automatico ? ". Atualiza sozinho conforme os itens ligados." : ""}`}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider ${st.classe}`}
    >
      <span className={`h-2 w-2 shrink-0 ${st.ponto}`} />
      {st.rotulo}
      {automatico && <span className="font-sans text-[10px] font-medium normal-case tracking-normal text-ink/45">· auto</span>}
    </span>
  );
}

type Filtro = "todos" | StatusRequisito;

export function ProgramaTab({ gruposEtapa }: { gruposEtapa: Grupo[] }) {
  const { user } = useAuth();
  const { brlInt } = useDinheiro();
  const { ehCliente, projeto, programa, aprovacao, saveProjeto, savePrograma, aprovarPrograma, itens } = useData();
  const confirmar = useConfirm();

  const [documento, setDocumento] = useState(false);
  const [dlgProjeto, setDlgProjeto] = useState(false);
  const [amb, setAmb] = useState<AmbientePrograma | "novo" | null>(null);
  const [req, setReq] = useState<Requisito | "novo" | null>(null);
  const [nomeAprov, setNomeAprov] = useState(user?.nome ?? "");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const vazio = programa.ambientes.length === 0 && programa.requisitos.length === 0;
  const etapaInfo = (nome: string) => gruposEtapa.find((g) => g.nome === nome);

  // Situação de cada pedido: sai dos itens ligados ao orçamento quando há; senão vale a marcação manual.
  const efetivos = useMemo(() => programa.requisitos.map((r) => ({ r, ...statusDoRequisito(r, itens) })), [programa.requisitos, itens]);
  const contagem: Record<Filtro, number> = {
    todos: efetivos.length,
    pendente: efetivos.filter((x) => x.status === "pendente").length,
    previsto: efetivos.filter((x) => x.status === "previsto").length,
    atendido: efetivos.filter((x) => x.status === "atendido").length,
  };
  const visiveis = filtro === "todos" ? efetivos : efetivos.filter((x) => x.status === filtro);
  const ligados = efetivos.filter((x) => x.automatico).length;
  const semItem = efetivos.length - ligados;

  const nomesAmbiente = new Set(programa.ambientes.map((a) => a.nome.trim().toLowerCase()));
  const sugestoesAmbiente = AMBIENTES_COMUNS.filter((n) => !nomesAmbiente.has(n.toLowerCase()));

  const dadosResumo = [projeto.cliente, projeto.endereco].filter(Boolean).join(" · ");

  async function usarModelo(m: ModeloPrograma) {
    if (!vazio) {
      const ok = await confirmar({
        titulo: "Substituir o escopo atual?",
        mensagem: `Os ambientes e pedidos atuais serão trocados pelo modelo "${m.nome}". A aprovação do cliente também será desfeita.`,
        confirmar: "Substituir",
        tom: "perigo",
      });
      if (!ok) return;
    }
    await savePrograma(m.gerar());
  }

  async function removerAmbiente(a: AmbientePrograma) {
    const ok = await confirmar({ titulo: "Remover ambiente", mensagem: `Remover "${a.nome}" do escopo?`, confirmar: "Remover", tom: "perigo" });
    if (ok) await savePrograma({ ...programa, ambientes: programa.ambientes.filter((x) => x.id !== a.id) });
  }

  async function removerRequisito(r: Requisito) {
    const ok = await confirmar({ titulo: "Remover pedido", mensagem: "Remover este pedido do escopo?", confirmar: "Remover", tom: "perigo" });
    if (ok) await savePrograma({ ...programa, requisitos: programa.requisitos.filter((x) => x.id !== r.id) });
  }

  // Marcar à mão só acontece sem itens ligados e acompanha a execução; não é mudança de conteúdo, então mantém a aprovação.
  async function marcarSituacao(r: Requisito, status: StatusRequisito) {
    await savePrograma({ ...programa, requisitos: programa.requisitos.map((x) => (x.id === r.id ? { ...x, status } : x)) }, { manterAprovacao: true });
  }

  async function adicionarAmbiente(nome: string) {
    await savePrograma({
      ...programa,
      ambientes: [...programa.ambientes, { id: crypto.randomUUID(), nome, quantidade: 1, funcao: "", area: 0, proximidade: "" }],
    });
  }

  async function adicionarPedido(texto: string) {
    await savePrograma({
      ...programa,
      requisitos: [...programa.requisitos, { id: crypto.randomUUID(), texto, ambiente: "", etapa: "", itensIds: [], status: "pendente" }],
    });
  }

  // O próximo passo que faz sentido para o arquiteto, em uma frase.
  const proximoPasso = ehCliente
    ? null
    : vazio
      ? "Comece por um modelo ou adicione os ambientes do projeto."
      : programa.requisitos.length === 0
        ? "Agora registre os pedidos do cliente: o que ele precisa em cada espaço."
        : itens.length > 0 && semItem > 0
          ? `${semItem} ${semItem === 1 ? "pedido ainda não tem item" : "pedidos ainda não têm item"} no orçamento. Ligue-${semItem === 1 ? "o" : "os"} para acompanhar custo e andamento.`
          : !aprovacao
            ? "Tudo registrado. Envie o link e a chave ao cliente para ele aprovar o escopo."
            : null;

  const passos: { titulo: string; estado: string; ok: boolean }[] = [
    {
      titulo: "Registre",
      estado: vazio ? "ambientes e pedidos" : `${programa.ambientes.length} ${programa.ambientes.length === 1 ? "ambiente" : "ambientes"} · ${programa.requisitos.length} ${programa.requisitos.length === 1 ? "pedido" : "pedidos"}`,
      ok: !vazio,
    },
    {
      titulo: "Ligue ao orçamento",
      estado: efetivos.length === 0 ? "cada pedido a seus itens" : `${ligados} de ${efetivos.length} ligados`,
      ok: efetivos.length > 0 && semItem === 0,
    },
    { titulo: "Cliente aprova", estado: aprovacao ? "aprovado" : "aguardando", ok: Boolean(aprovacao) },
  ];

  const botaoSecao = "btn btn-linha rounded-full px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider";

  return (
    <div className="space-y-7">
      {/* O que é o escopo, em que ponto está e qual o próximo passo */}
      <section aria-label="Sobre o escopo" data-tour="programa-passos" className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">Escopo do projeto</h2>
          <p className="mt-0.5 text-[13px] leading-snug text-ink/60">
            O que foi combinado com o cliente: os espaços da obra e o que ele precisa em cada um.{" "}
            {ehCliente ? "Confira e aprove." : "Cada pedido pode ser ligado a itens do orçamento, e o cliente aprova online."}
          </p>
        </div>

        <ol className="grid grid-cols-3 gap-2">
          {passos.map((p, i) => (
            <li key={p.titulo} className={`rounded-2xl border px-3 py-2.5 ${p.ok ? "border-emerald-300 bg-emerald-50/70" : "border-linha bg-white"}`}>
              <p className="flex items-center gap-1.5 text-[13px] font-semibold leading-tight text-ink">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full font-mono text-[10px] ${p.ok ? "bg-emerald-600 text-white" : "border border-ink/30 text-ink/45"}`}
                  aria-hidden
                >
                  {p.ok ? "✓" : i + 1}
                </span>
                {p.titulo}
              </p>
              <p className={`mt-1 text-[11px] leading-snug ${p.ok ? "text-emerald-800" : "text-ink/50"}`}>{p.estado}</p>
            </li>
          ))}
        </ol>

        {proximoPasso && (
          <p className="flex items-start gap-2 rounded-2xl bg-pitanga/10 px-3.5 py-2.5 text-[13px] leading-snug text-ink/85">
            <span className="mt-px shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wider text-pitanga">Próximo</span>
            {proximoPasso}
          </p>
        )}
      </section>

      {/* Aprovação do cliente */}
      {aprovacao ? (
        <div className="rounded-2xl border border-emerald-600 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <span className="rotulo-tec block text-emerald-800">Escopo aprovado</span>
          <strong>{aprovacao.nome}</strong> aprovou em {new Date(aprovacao.em).toLocaleDateString("pt-BR")}.
        </div>
      ) : !vazio && ehCliente ? (
        <div className="prancha space-y-3 p-4">
          <p className="rotulo-tec text-ink/55">Sua aprovação</p>
          <p className="text-sm text-ink/80">Confira os ambientes e os pedidos abaixo. Ao aprovar, seu nome e a data ficam registrados.</p>
          <input className={campo} value={nomeAprov} onChange={(e) => setNomeAprov(e.target.value)} placeholder="Seu nome" />
          <button className="btn btn-primario w-full px-4 py-3 text-sm" disabled={!nomeAprov.trim()} onClick={() => aprovarPrograma(nomeAprov.trim())}>
            Aprovar o escopo
          </button>
        </div>
      ) : !vazio ? (
        <p className="rounded-2xl border border-dashed border-ink/30 bg-white/70 px-3 py-2.5 text-[13px] leading-snug text-ink/70">
          <strong className="font-semibold text-ink">Aguardando o cliente.</strong> Ele aprova pela aba Escopo, usando o link e a chave do projeto. Qualquer mudança nos
          ambientes ou pedidos pede nova aprovação.
        </p>
      ) : null}

      {/* Dados do projeto: recolhidos, porque são o menos mexido */}
      <details className="prancha group overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <span className="rotulo-tec text-ink">Dados do projeto</span>
          <span className="min-w-0 flex-1 truncate text-xs text-ink/50">
            {dadosResumo || (ehCliente ? "" : "Cliente, endereço, responsável e a marca que vai nos PDFs")}
          </span>
          <span aria-hidden className="text-ink/40 transition-transform group-open:rotate-180">
            ▾
          </span>
        </summary>
        <div className="border-t border-linha">
          <dl className="grid gap-px bg-linha sm:grid-cols-2">
            {([
              ["Cliente(s)", projeto.cliente],
              ["Tipo de projeto", projeto.tipo],
              ["Endereço", projeto.endereco],
              ["Responsável técnico", [projeto.responsavel, projeto.registro].filter(Boolean).join(" · ")],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} className="bg-white px-4 py-3">
                <dt className="rotulo-tec text-ink/45">{k}</dt>
                <dd className="mt-1 text-sm text-ink">{v || <span className="text-ink/35">{ehCliente ? "—" : "não informado"}</span>}</dd>
              </div>
            ))}
          </dl>
          {!ehCliente && (
            <div className="flex items-center justify-between gap-3 border-t border-linha px-4 py-3">
              <p className="text-xs text-ink/50">Aparecem no cabeçalho dos PDFs, junto com a marca do escritório.</p>
              <button className={botaoSecao} onClick={() => setDlgProjeto(true)}>
                Editar dados
              </button>
            </div>
          )}
        </div>
      </details>

      {/* Vazio: escolher um modelo */}
      {vazio && (
        <section>
          <Secao titulo="Comece por um modelo" descricao={ehCliente ? undefined : "Já vem com ambientes e pedidos sugeridos. Tudo pode ser editado depois. Ou, se preferir, adicione os ambientes direto, logo abaixo."} />
          {ehCliente ? (
            <p className="prancha px-4 py-10 text-center text-sm text-ink/60">O arquiteto ainda não preencheu o escopo do projeto.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {MODELOS_PROGRAMA.map((m) => (
                <button key={m.chave} onClick={() => usarModelo(m)} className="prancha prancha-clicavel clicavel p-4 text-left">
                  <p className="font-semibold text-ink">{m.nome}</p>
                  <p className="mt-1 text-sm text-ink/60">{m.descricao}</p>
                  <p className="mt-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-pitanga">Usar este modelo →</p>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Ambientes */}
      {(!ehCliente || programa.ambientes.length > 0) && (
        <section>
          <Secao
            titulo="Ambientes"
            descricao={
              ehCliente
                ? "Os espaços do projeto e quantos de cada um."
                : "Os espaços do projeto e quantos de cada um. Para informar função, área ou proximidade, toque em Editar."
            }
            contagem={programa.ambientes.length}
          />
          {programa.ambientes.length === 0 ? (
            <p className="prancha px-4 py-6 text-center text-sm text-ink/50">Nenhum ambiente ainda.</p>
          ) : (
            <ul className="prancha divide-y divide-linha overflow-hidden">
              {programa.ambientes.map((a) => (
                <li key={a.id} className="linha-hover flex items-start gap-3 px-4 py-3">
                  <span className="mt-0.5 w-9 shrink-0 font-mono text-sm font-semibold text-pitanga" title="Quantidade">{a.quantidade}×</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{a.nome}</p>
                    {(a.funcao || a.area > 0 || a.proximidade) && (
                      <p className="mt-0.5 text-xs text-ink/55">
                        {[a.funcao, a.area > 0 && `${a.area} m²`, a.proximidade && `próximo de ${a.proximidade}`].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  {!ehCliente && <Acoes nome={a.nome} onEditar={() => setAmb(a)} onRemover={() => removerAmbiente(a)} />}
                </li>
              ))}
            </ul>
          )}
          {!ehCliente && <AdicionarRapido rotulo="Novo ambiente" placeholder="Novo ambiente (ex.: Suíte) e Enter" botao="Adicionar" sugestoes={sugestoesAmbiente} onAdicionar={adicionarAmbiente} />}
        </section>
      )}

      {/* Pedidos do cliente */}
      {(!ehCliente || programa.requisitos.length > 0) && (
        <section>
          <Secao
            titulo="Pedidos do cliente"
            descricao={
              ehCliente
                ? "O que você precisa no projeto, e como cada pedido está no orçamento."
                : "O que o cliente precisa e que vira item de obra (ex.: carregador de carro elétrico, infraestrutura de wi-fi). Ligue cada pedido aos itens do orçamento que o atendem."
            }
            contagem={programa.requisitos.length}
          />

          {programa.requisitos.length > 0 && (
            <>
              {/* Legenda: o que cada situação quer dizer */}
              <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink/60">
                {(Object.keys(STATUS) as StatusRequisito[]).map((k) => (
                  <li key={k} className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 ${STATUS[k].ponto}`} />
                    <strong className="font-semibold text-ink/80">{STATUS[k].rotulo}:</strong> {STATUS[k].dica}
                  </li>
                ))}
              </ul>
              {!ehCliente && <p className="mb-3 text-xs text-ink/50">Com itens ligados, a situação se atualiza sozinha. Sem itens, você marca à mão.</p>}

              {programa.requisitos.length >= 4 && (
                <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Filtrar pedidos por situação">
                  {([
                    ["todos", "Todos"],
                    ["pendente", STATUS.pendente.rotulo],
                    ["previsto", STATUS.previsto.rotulo],
                    ["atendido", STATUS.atendido.rotulo],
                  ] as [Filtro, string][]).map(([k, nome]) => (
                    <button
                      key={k}
                      role="tab"
                      aria-selected={filtro === k}
                      onClick={() => setFiltro(k)}
                      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${filtro === k ? "bg-ink text-white" : "bg-ink/[0.07] text-ink/65 hover:text-ink"}`}
                    >
                      {nome} <span className={filtro === k ? "text-white/60" : "text-ink/40"}>{contagem[k]}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {programa.requisitos.length === 0 ? (
            <p className="prancha px-4 py-6 text-center text-sm text-ink/50">Nenhum pedido ainda.</p>
          ) : visiveis.length === 0 ? (
            <p className="prancha px-4 py-6 text-center text-sm text-ink/50">Nenhum pedido nesta situação.</p>
          ) : (
            <ul className="prancha divide-y divide-linha overflow-hidden">
              {visiveis.map(({ r, status, automatico }) => {
                const e = r.etapa ? etapaInfo(r.etapa) : undefined;
                const vinc = vinculoDoRequisito(r.itensIds, itens);
                return (
                  <li key={r.id} className="linha-hover flex flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-start sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink">{r.texto}</p>
                      {(r.ambiente || r.etapa) && (
                        <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink/55">
                          {r.ambiente && <span>Ambiente: <strong className="font-medium text-ink/75">{r.ambiente}</strong></span>}
                          {r.etapa && (
                            <span>
                              Etapa: <strong className="font-medium text-ink/75">{r.etapa}</strong>
                              {e && <span className="ml-1 font-mono">· {brlInt(e.previsto)} ({Math.round(e.previsto > 0 ? (e.pago / e.previsto) * 100 : 0)}% pago)</span>}
                            </span>
                          )}
                        </p>
                      )}
                      {vinc.lista.length > 0 ? (
                        <details className="group mt-2 rounded-xl border border-linha bg-papel/60 px-3 py-2">
                          <summary className="flex cursor-pointer list-none items-baseline gap-x-3 gap-y-0.5 text-xs text-ink/65 [&::-webkit-details-marker]:hidden">
                            <span className="flex flex-1 flex-wrap items-baseline gap-x-3 gap-y-0.5">
                              <strong className="font-semibold text-ink/85">
                                {vinc.lista.length} {vinc.lista.length === 1 ? "item" : "itens"} do orçamento
                              </strong>
                              <span className="font-mono">{brlInt(vinc.previsto)}</span>
                              <span>{vinc.concluidos} de {vinc.lista.length} concluídos · {Math.round(vinc.previsto > 0 ? (vinc.pago / vinc.previsto) * 100 : 0)}% pago</span>
                            </span>
                            <span aria-hidden className="shrink-0 text-ink/40 transition-transform group-open:rotate-180">▾</span>
                          </summary>
                          <ul className="mt-1.5 space-y-0.5 text-xs text-ink/55">
                            {vinc.lista.map((it) => (
                              <li key={it.id} className="flex items-center gap-1.5">
                                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${it.feito && it.pago ? "bg-emerald-600" : it.feito || it.pago ? "bg-amber-500" : "bg-ink/25"}`} />
                                <span className="truncate">{it.descricao}</span>
                              </li>
                            ))}
                          </ul>
                        </details>
                      ) : (
                        !ehCliente &&
                        itens.length > 0 && (
                          <button onClick={() => setReq(r)} className="mt-1.5 text-xs font-semibold text-pitanga hover:underline">
                            Ligar a itens do orçamento
                          </button>
                        )
                      )}
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                      {ehCliente || automatico ? (
                        <PilulaStatus status={status} automatico={automatico} />
                      ) : (
                        <select
                          value={r.status}
                          onChange={(ev) => marcarSituacao(r, ev.target.value as StatusRequisito)}
                          aria-label="Situação do pedido"
                          title="Situação do pedido. Sem itens ligados, você marca à mão."
                          className={`h-9 shrink-0 cursor-pointer rounded-full border px-3 font-mono text-[10px] font-semibold uppercase tracking-wider outline-none ${STATUS[r.status].classe}`}
                        >
                          {(Object.keys(STATUS) as StatusRequisito[]).map((k) => (
                            <option key={k} value={k}>
                              {STATUS[k].rotulo}
                            </option>
                          ))}
                        </select>
                      )}
                      {!ehCliente && <Acoes nome="pedido" onEditar={() => setReq(r)} onRemover={() => removerRequisito(r)} />}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {!ehCliente && <AdicionarRapido rotulo="Novo pedido" placeholder="Novo pedido do cliente e Enter" botao="Adicionar" onAdicionar={adicionarPedido} />}
        </section>
      )}

      {/* Documento */}
      {!vazio && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="btn btn-primario px-4 py-3 text-sm sm:flex-1" onClick={() => setDocumento(true)}>
            Gerar PDF do escopo
          </button>
          {!ehCliente && (
            <details className="relative sm:flex-1">
              <summary className="btn btn-linha w-full cursor-pointer list-none px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-wider">
                Trocar por outro modelo
              </summary>
              <div className="prancha absolute inset-x-0 z-10 mt-1 grid">
                {MODELOS_PROGRAMA.map((m) => (
                  <button key={m.chave} onClick={() => usarModelo(m)} className="linha-hover border-b border-linha px-4 py-3 text-left last:border-b-0">
                    <p className="text-sm font-semibold text-ink">{m.nome}</p>
                    <p className="text-xs text-ink/55">{m.descricao}</p>
                  </button>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {documento && <ProgramaDocumento onFechar={() => setDocumento(false)} />}

      <ProjetoDialog aberto={dlgProjeto} onFechar={() => setDlgProjeto(false)} projeto={projeto} onSalvar={saveProjeto} />
      <AmbienteDialog
        aberto={amb !== null}
        onFechar={() => setAmb(null)}
        ambiente={amb && amb !== "novo" ? amb : null}
        onSalvar={async (a) => {
          const existe = programa.ambientes.some((x) => x.id === a.id);
          await savePrograma({
            ...programa,
            ambientes: existe ? programa.ambientes.map((x) => (x.id === a.id ? a : x)) : [...programa.ambientes, a],
          });
        }}
      />
      <RequisitoDialog
        aberto={req !== null}
        onFechar={() => setReq(null)}
        requisito={req && req !== "novo" ? req : null}
        ambientes={programa.ambientes.map((a) => a.nome)}
        etapas={gruposEtapa.map((g) => g.nome)}
        itens={itens}
        onSalvar={async (r) => {
          const anterior = programa.requisitos.find((x) => x.id === r.id);
          // Ligar itens/etapa só acompanha a execução: não pede nova aprovação do cliente.
          const soVinculo = anterior !== undefined && anterior.texto === r.texto && anterior.ambiente === r.ambiente;
          await savePrograma(
            {
              ...programa,
              requisitos: anterior ? programa.requisitos.map((x) => (x.id === r.id ? r : x)) : [...programa.requisitos, r],
            },
            { manterAprovacao: soVinculo },
          );
        }}
      />
    </div>
  );
}

const btnSalvar = "btn btn-primario w-full px-4 py-3 text-sm";

const CORES_MARCA = ["#14110f", "#d23a1f", "#1d4ed8", "#0f766e", "#7c3aed", "#b45309"];

/** Reduz a imagem para caber no documento da obra (lado maior = `max` px) e devolve um data URL PNG. */
function reduzirImagem(arquivo: File, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, max / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * escala));
      const h = Math.max(1, Math.round(img.height * escala));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("imagem"));
    };
    img.src = url;
  });
}

function ProjetoDialog({ aberto, onFechar, projeto, onSalvar }: { aberto: boolean; onFechar: () => void; projeto: Projeto; onSalvar: (p: Projeto) => Promise<void> }) {
  const [f, setF] = useState<Projeto>(projeto);
  useEffect(() => {
    if (aberto) setF(projeto);
  }, [aberto, projeto]);
  const { perfil, salvarPerfil } = useArquiteto();
  const [padrao, setPadrao] = useState(false);
  const [erroLogo, setErroLogo] = useState("");
  const set = (k: keyof Projeto) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const temPerfil = Object.values(perfil).some(Boolean);

  async function escolherLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const arq = e.target.files?.[0];
    e.target.value = "";
    if (!arq) return;
    setErroLogo("");
    try {
      setF((s) => ({ ...s, logo: "" }));
      const url = await reduzirImagem(arq, 320);
      setF((s) => ({ ...s, logo: url }));
    } catch {
      setErroLogo("Não consegui ler essa imagem. Tente um PNG ou JPG.");
    }
  }

  async function salvar() {
    await onSalvar(f);
    if (padrao) {
      await salvarPerfil({ escritorio: f.escritorio, contato: f.contato, cor: f.cor, logo: f.logo, responsavel: f.responsavel, registro: f.registro });
    }
    onFechar();
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Dados do projeto">
      <div className="space-y-4">
        <Campo nome="Cliente(s)" dica="Quem contrata o projeto."><input className={campo} value={f.cliente} onChange={set("cliente")} placeholder="Ex.: Gabriel e Mariana" /></Campo>
        <Campo nome="Tipo de projeto"><input className={campo} value={f.tipo} onChange={set("tipo")} placeholder="Ex.: Reforma residencial" /></Campo>
        <Campo nome="Endereço do projeto"><input className={campo} value={f.endereco} onChange={set("endereco")} placeholder="Rua, número, bairro, cidade" /></Campo>
        <Campo nome="Responsável técnico"><input className={campo} value={f.responsavel} onChange={set("responsavel")} placeholder="Nome do arquiteto" /></Campo>
        <Campo nome="Registro profissional" dica="CAU ou CREA, aparece abaixo da assinatura no PDF."><input className={campo} value={f.registro} onChange={set("registro")} placeholder="Ex.: CAU/BR A000000-0" /></Campo>

        <div className="space-y-3 rounded-2xl border border-linha bg-papel/60 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="rotulo-tec text-ink">Marca nos PDFs</p>
            {temPerfil && (
              <button
                type="button"
                className="font-mono text-[11px] font-semibold uppercase tracking-wider text-pitanga hover:underline"
                onClick={() => setF({ ...f, ...perfil })}
              >
                Usar minha marca padrão
              </button>
            )}
          </div>
          <Campo nome="Nome do escritório"><input className={campo} value={f.escritorio} onChange={set("escritorio")} placeholder="Ex.: Jadir Arquitetura" /></Campo>
          <Campo nome="Contato" dica="Telefone, e-mail ou site. Aparece sob o nome no cabeçalho."><input className={campo} value={f.contato} onChange={set("contato")} placeholder="Ex.: (11) 99999-0000 · contato@escritorio.com" /></Campo>
          <div>
            <label className={rotulo}>Cor de destaque</label>
            <div className="flex flex-wrap items-center gap-2">
              {CORES_MARCA.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Cor ${c}`}
                  aria-pressed={f.cor === c}
                  onClick={() => setF({ ...f, cor: c })}
                  className={`h-8 w-8 rounded-full border-2 ${f.cor === c ? "border-ink" : "border-white shadow-[0_0_0_1px_rgba(20,17,15,0.2)]"}`}
                  style={{ background: c }}
                />
              ))}
              {f.cor && (
                <button type="button" className="ml-1 text-xs text-ink/55 underline" onClick={() => setF({ ...f, cor: "" })}>
                  Padrão
                </button>
              )}
            </div>
          </div>
          <div>
            <label className={rotulo}>Logo</label>
            <div className="flex items-center gap-3">
              {f.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={f.logo} alt="Logo" className="h-12 max-w-[120px] rounded-lg border border-linha bg-white object-contain p-1" />
              ) : (
                <span className="flex h-12 w-20 items-center justify-center rounded-lg border border-dashed border-ink/30 text-[11px] text-ink/40">sem logo</span>
              )}
              <label className="btn btn-linha cursor-pointer px-3 py-2 text-xs font-semibold">
                {f.logo ? "Trocar" : "Enviar logo"}
                <input type="file" accept="image/*" className="sr-only" onChange={escolherLogo} />
              </label>
              {f.logo && (
                <button type="button" className="text-xs text-ink/55 underline" onClick={() => setF({ ...f, logo: "" })}>Remover</button>
              )}
            </div>
            {erroLogo && <p className="mt-1 text-xs text-red-700">{erroLogo}</p>}
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink/80">
            <input type="checkbox" className="h-4 w-4 accent-[#d23a1f]" checked={padrao} onChange={(e) => setPadrao(e.target.checked)} />
            Guardar como minha marca padrão (para os próximos projetos)
          </label>
        </div>

        <button className={btnSalvar} onClick={salvar}>Salvar dados</button>
      </div>
    </Modal>
  );
}

function AmbienteDialog({ aberto, onFechar, ambiente, onSalvar }: { aberto: boolean; onFechar: () => void; ambiente: AmbientePrograma | null; onSalvar: (a: AmbientePrograma) => Promise<void> }) {
  const [nome, setNome] = useState("");
  const [qtd, setQtd] = useState("1");
  const [funcao, setFuncao] = useState("");
  const [area, setArea] = useState("");
  const [prox, setProx] = useState("");

  useEffect(() => {
    if (!aberto) return;
    setNome(ambiente?.nome ?? "");
    setQtd(String(ambiente?.quantidade ?? 1));
    setFuncao(ambiente?.funcao ?? "");
    setArea(ambiente && ambiente.area > 0 ? String(ambiente.area) : "");
    setProx(ambiente?.proximidade ?? "");
  }, [aberto, ambiente]);

  async function salvar() {
    await onSalvar({
      id: ambiente?.id ?? crypto.randomUUID(),
      nome: nome.trim(),
      quantidade: Math.max(1, Number(qtd) || 1),
      funcao: funcao.trim(),
      area: Number(area) || 0,
      proximidade: prox.trim(),
    });
    onFechar();
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={ambiente ? "Editar ambiente" : "Novo ambiente"}>
      <div className="space-y-4">
        <div className="grid grid-cols-[1fr_88px] gap-3">
          <Campo nome="Nome do ambiente"><input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Suíte" /></Campo>
          <Campo nome="Qtd."><input className={campo} type="number" inputMode="numeric" value={qtd} onChange={(e) => setQtd(e.target.value)} /></Campo>
        </div>
        <Campo nome="Função / observação" dica="Para que o espaço será usado. Opcional."><input className={campo} value={funcao} onChange={(e) => setFuncao(e.target.value)} placeholder="Ex.: Games ou academia" /></Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo nome="Área aprox. (m²)"><input className={campo} type="number" inputMode="decimal" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Opcional" /></Campo>
          <Campo nome="Próximo de"><input className={campo} value={prox} onChange={(e) => setProx(e.target.value)} placeholder="Ex.: Cozinha" /></Campo>
        </div>
        <button className={btnSalvar} disabled={!nome.trim()} onClick={salvar}>Salvar ambiente</button>
      </div>
    </Modal>
  );
}

function RequisitoDialog({ aberto, onFechar, requisito, ambientes, etapas, itens, onSalvar }: { aberto: boolean; onFechar: () => void; requisito: Requisito | null; ambientes: string[]; etapas: string[]; itens: Item[]; onSalvar: (r: Requisito) => Promise<void> }) {
  const [texto, setTexto] = useState("");
  const [ambiente, setAmbiente] = useState("");
  const [etapa, setEtapa] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const [busca, setBusca] = useState("");
  const { brlInt } = useDinheiro();

  useEffect(() => {
    if (!aberto) return;
    setTexto(requisito?.texto ?? "");
    setAmbiente(requisito?.ambiente ?? "");
    setEtapa(requisito?.etapa ?? "");
    setSel(requisito?.itensIds ?? []);
    setBusca("");
  }, [aberto, requisito]);

  const visiveis = useMemo(() => filtrarItens(itens, busca), [itens, busca]);
  const alternar = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const totalSel = itens.filter((i) => sel.includes(i.id)).reduce((s, i) => s + valorEfetivo(i), 0);

  async function salvar() {
    await onSalvar({
      id: requisito?.id ?? crypto.randomUUID(),
      texto: texto.trim(),
      ambiente,
      etapa,
      itensIds: sel.filter((id) => itens.some((i) => i.id === id)),
      status: requisito?.status ?? "pendente",
    });
    onFechar();
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={requisito ? "Editar pedido" : "Novo pedido"}>
      <div className="space-y-4">
        <Campo nome="Pedido do cliente" dica="Descreva o que ele precisa, em uma frase.">
          <textarea className={`${campo} resize-none`} rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ex.: Pré-instalação de cabeamento de rede wi-fi" />
        </Campo>
        <Campo nome="Ambiente" dica="Escolha “Geral” se vale para o projeto todo.">
          <select className={campo} value={ambiente} onChange={(e) => setAmbiente(e.target.value)}>
            <option value="">Geral (todo o projeto)</option>
            {ambientes.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </Campo>
        <Campo nome="Etapa do orçamento (opcional)" dica="Só para organizar. O que conta para custo e andamento são os itens ligados, logo abaixo.">
          <select className={campo} value={etapa} onChange={(e) => setEtapa(e.target.value)} disabled={etapas.length === 0}>
            <option value="">{etapas.length === 0 ? "Cadastre o orçamento para vincular" : "Não vinculado"}</option>
            {etapas.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </Campo>
        <Campo
          nome={`Itens do orçamento que atendem${sel.length > 0 ? ` (${sel.length} · ${brlInt(totalSel)})` : ""}`}
          dica="Marque os itens que entregam este pedido. Assim você vê quanto ele custa e quanto já foi feito e pago."
        >
          {itens.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink/30 px-3 py-3 text-xs text-ink/55">Cadastre itens no orçamento para poder ligá-los.</p>
          ) : (
            <>
              <input className={`${campo} mb-2`} value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar item, etapa ou ambiente…" />
              <ul className="max-h-48 divide-y divide-linha overflow-y-auto rounded-xl border border-linha">
                {visiveis.length === 0 ? (
                  <li className="px-3 py-4 text-center text-xs text-ink/50">Nenhum item encontrado.</li>
                ) : (
                  visiveis.slice(0, 80).map((i) => (
                    <li key={i.id}>
                      <label className="linha-hover flex cursor-pointer items-start gap-2.5 px-3 py-2">
                        <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[#d23a1f]" checked={sel.includes(i.id)} onChange={() => alternar(i.id)} />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm leading-snug text-ink">{i.descricao}</span>
                          <span className="block text-xs text-ink/50">{[i.etapa, i.ambiente !== "Geral" && i.ambiente].filter(Boolean).join(" · ")} · {brlInt(valorEfetivo(i))}</span>
                        </span>
                      </label>
                    </li>
                  ))
                )}
              </ul>
              {visiveis.length > 80 && <p className="mt-1 text-xs text-ink/50">Mostrando 80 de {visiveis.length}. Use a busca para achar o resto.</p>}
            </>
          )}
        </Campo>
        <button className={btnSalvar} disabled={!texto.trim()} onClick={salvar}>Salvar pedido</button>
      </div>
    </Modal>
  );
}
