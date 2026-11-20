"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  agruparPorDia,
  mensagemDoEvento,
  mensagemPublicacao,
  mensagemResumo,
  ROTULO_TIPO,
  tempoRelativo,
  type ContextoMensagem,
  type Evento,
  type ResumoFeed,
  type TipoEvento,
} from "@/lib/acompanhamento";
import { useDinheiro } from "@/lib/privacidade";
import { useConfirm } from "../ConfirmProvider";
import { IconeLixo } from "../Icones";
import { useHoje } from "../PrazoVisual";
import { Botao } from "../ui/Botao";
import { Chip } from "../ui/Chip";
import { BotaoEnviar } from "./Envio";
import { useAgora } from "./useAgora";

type Secao = "tempo" | "visitas" | "ocorrencias" | "vistoria";

const FILTROS: ("todos" | TipoEvento)[] = ["todos", "publicacao", "andamento", "valor", "cobranca", "prazo", "visita", "ocorrencia", "vistoria"];

const icone = (d: ReactNode) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {d}
  </svg>
);

/** Cada tipo de fato tem sua cor e seu ícone, para o olho achar o que procura rolando o feed. */
const ESTILO: Record<TipoEvento, { fundo: string; borda: string; icone: ReactNode }> = {
  publicacao: { fundo: "bg-ink text-white", borda: "border-l-ink", icone: icone(<path d="M4 5h16v11H9l-5 4V5Z" />) },
  andamento: { fundo: "bg-emerald-100 text-emerald-800", borda: "border-l-emerald-600", icone: icone(<path d="m5 12 4.5 4.5L19 7" />) },
  valor: { fundo: "bg-amber-100 text-amber-800", borda: "border-l-amber-500", icone: icone(<path d="M12 3v18M16 7.5C16 6 14.2 5 12 5s-4 1-4 2.8c0 4.2 8 2.4 8 6.7 0 1.8-1.8 3-4 3s-4-1.2-4-3" />) },
  cobranca: { fundo: "bg-emerald-100 text-emerald-800", borda: "border-l-emerald-600", icone: icone(<><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></>) },
  prazo: { fundo: "bg-amber-100 text-amber-800", borda: "border-l-amber-500", icone: icone(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>) },
  visita: { fundo: "bg-sky-100 text-sky-800", borda: "border-l-sky-500", icone: icone(<><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></>) },
  ocorrencia: { fundo: "bg-pitanga/15 text-pitanga-escuro", borda: "border-l-pitanga", icone: icone(<><path d="M12 4 3 20h18L12 4Z" /><path d="M12 10v4M12 17v.5" /></>) },
  vistoria: { fundo: "bg-emerald-100 text-emerald-800", borda: "border-l-emerald-600", icone: icone(<><circle cx="11" cy="11" r="6" /><path d="m20 20-4-4" /></>) },
};

const ROTULO_SINGULAR: Record<TipoEvento, string> = { publicacao: "Aviso", andamento: "Andamento", valor: "Valor", cobranca: "Cobrança", prazo: "Prazo", visita: "Visita", ocorrencia: "Ocorrência", vistoria: "Vistoria" };

const iniciais = (nome: string) =>
  nome
    .trim()
    .split(/\s+/)
    .filter((p) => /^\p{L}/u.test(p)) // "Gabriel (demo)": só o Gabriel conta
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

function Avatar({ e }: { e: Evento }) {
  const est = ESTILO[e.tipo];
  // Quem fez aparece pelas iniciais (cliente em azul); o que é do próprio projeto aparece pelo ícone do tipo.
  if (e.quem && (e.tipo === "publicacao" || e.tipo === "andamento" || e.tipo === "vistoria")) {
    return (
      <span aria-hidden className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold ${e.porCliente ? "bg-sky-100 text-sky-900" : "bg-ink text-white"}`}>
        {iniciais(e.quem)}
      </span>
    );
  }
  return (
    <span aria-hidden className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${est.fundo}`}>
      {est.icone}
    </span>
  );
}

function Cartao({ e, agora, onEnviar, tituloEnvio, onRemover, contexto }: { e: Evento; agora: number; onEnviar?: (t: string, tipo: string, m: string) => void; tituloEnvio: string; onRemover?: () => void; contexto: ContextoMensagem }) {
  const { brl } = useDinheiro();
  const est = ESTILO[e.tipo];
  const ehPost = e.tipo === "publicacao";
  // Dinheiro no feed obedece ao olhinho de privacidade (o texto pronto para o WhatsApp, não: ele é uma mensagem de verdade).
  const dif = e.valor ? Math.abs(e.valor.para - e.valor.de) : 0;
  const sobe = e.valor ? e.valor.para > e.valor.de : false;
  const detalhe = e.valor
    ? `${brl(e.valor.de)} → ${brl(e.valor.para)}`
    : e.dinheiro
      ? `${brl(e.dinheiro.total)}${e.dinheiro.vencimento ? ` · vence em ${new Date(e.dinheiro.vencimento).toLocaleDateString("pt-BR")}` : ""}`
      : e.detalhe;
  const autor = e.quem ?? ROTULO_SINGULAR[e.tipo];
  const itens = e.itens ?? [];

  return (
    <li className={`prancha border-l-4 p-4 ${est.borda}`}>
      <div className="flex items-start gap-3">
        <Avatar e={e} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-semibold text-ink">{autor}</p>
            {e.porCliente && <Chip tom="info">cliente</Chip>}
            <span className="text-xs text-ink/45">· {tempoRelativo(e.quando, agora)}</span>
          </div>
          {ehPost ? (
            <p className="mt-1.5 whitespace-pre-line text-[15px] leading-relaxed text-ink">{e.titulo}</p>
          ) : (
            <>
              <p className="mt-1 text-[15px] font-medium leading-snug text-ink">{e.titulo}</p>
              {detalhe && <p className="mt-1 whitespace-pre-line text-sm leading-snug text-ink/65">{detalhe}</p>}
              {e.valor && (
                <p className="mt-1.5">
                  <Chip tom={sobe ? "perigo" : "ok"}>
                    {sobe ? "▲" : "▼"} {brl(dif)} {sobe ? "mais caro" : "mais barato"}
                  </Chip>
                </p>
              )}
            </>
          )}
          {itens.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {itens.slice(0, 4).map((i) => (
                <span key={i} className="rounded-full bg-ink/[0.06] px-2.5 py-1 text-xs text-ink/75">
                  {i}
                </span>
              ))}
              {itens.length > 4 && <span className="rounded-full bg-ink/[0.06] px-2.5 py-1 text-xs text-ink/55">+{itens.length - 4}</span>}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider ${est.fundo}`}>
              {ROTULO_TIPO[e.tipo]}
            </span>
            <span className="flex-1" />
            {onEnviar && (
              <BotaoEnviar
                rotulo="Enviar"
                contexto={e.titulo.slice(0, 60)}
                onClick={() => onEnviar(tituloEnvio, e.tipo, ehPost ? mensagemPublicacao({ id: e.id, texto: e.titulo, autor: e.quem ?? "" }, contexto) : (e.mensagem ?? mensagemDoEvento(e, contexto)))}
              />
            )}
            {onRemover && (
              <button className="btn btn-icone perigo h-8 w-8" aria-label={`Remover aviso: ${e.titulo.slice(0, 40)}`} title="Remover aviso" onClick={onRemover}>
                <IconeLixo />
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

/** Os números do topo: o que está por vir e o que pede atenção. Cada um leva à seção correspondente. */
function Resumo({ resumo, prazo, irPara }: { resumo: ResumoFeed; prazo: { texto: string; atencao: boolean } | null; irPara: (s: Secao) => void }) {
  const v = resumo.proximaVisita;
  const tile = "prancha clicavel flex min-w-[9.5rem] shrink-0 flex-col items-start gap-0.5 p-3 text-left transition-colors hover:border-ink/40";
  return (
    <section aria-label="Resumo do acompanhamento" className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
      {prazo && (
        <div className={tile}>
          <span className="rotulo-tec text-ink/45">Prazo</span>
          <span className={`text-sm font-semibold ${prazo.atencao ? "text-pitanga-escuro" : "text-ink"}`}>{prazo.texto}</span>
        </div>
      )}
      <button onClick={() => irPara("visitas")} className={tile}>
        <span className="rotulo-tec text-ink/45">Próxima visita</span>
        <span className="text-sm font-semibold text-ink">
          {v ? new Date(v.quando).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" }) + " · " + new Date(v.quando).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "Nenhuma marcada"}
        </span>
        {v && <span className="max-w-[10rem] truncate text-xs text-ink/55">{v.titulo}</span>}
      </button>
      <button onClick={() => irPara("ocorrencias")} className={tile}>
        <span className="rotulo-tec text-ink/45">Ocorrências</span>
        <span className={`text-sm font-semibold ${resumo.ocorrenciasAbertas > 0 ? "text-pitanga-escuro" : "text-emerald-700"}`}>
          {resumo.ocorrenciasAbertas > 0 ? `${resumo.ocorrenciasAbertas} em aberto` : "Nenhuma em aberto"}
        </span>
      </button>
      <button onClick={() => irPara("vistoria")} className={tile}>
        <span className="rotulo-tec text-ink/45">Vistoria</span>
        <span className="text-sm font-semibold text-ink">{resumo.vistoriaTotal ? `${resumo.vistoriaOk} de ${resumo.vistoriaTotal} conferidos` : "Não começou"}</span>
        {resumo.vistoriaAjustar > 0 && <span className="text-xs font-medium text-pitanga-escuro">{resumo.vistoriaAjustar} pedem ajuste</span>}
      </button>
    </section>
  );
}

/**
 * A tela inicial do Acompanhar: um feed, como numa rede social, com tudo o que acontece no projeto, dia a dia.
 * Em cima, os números que importam; o arquiteto pode publicar um aviso; abaixo, os fatos do mais novo ao mais antigo.
 */
export function Feed({
  eventos,
  resumo,
  prazo,
  contexto,
  ator,
  ehCliente,
  uid,
  onIrPara,
  onEnviar,
  onPublicar,
  onRemoverPublicacao,
}: {
  eventos: Evento[];
  resumo: ResumoFeed;
  prazo: { texto: string; atencao: boolean } | null;
  contexto: ContextoMensagem;
  ator: string;
  ehCliente: boolean;
  uid: string;
  onIrPara: (s: Secao) => void;
  /** O arquiteto encaminha ao cliente qualquer fato; o cliente encaminha ao arquiteto só o que ele mesmo publicou. */
  onEnviar?: (titulo: string, tipo: string, texto: string) => void;
  onPublicar?: (texto: string) => Promise<void>;
  onRemoverPublicacao?: (id: string) => Promise<void>;
}) {
  const hoje = useHoje();
  const agora = useAgora();
  const confirmar = useConfirm();
  const [filtro, setFiltro] = useState<"todos" | TipoEvento>("todos");
  const [limite, setLimite] = useState(25);
  const [texto, setTexto] = useState("");
  const [publicando, setPublicando] = useState(false);

  const visiveis = useMemo(() => (filtro === "todos" ? eventos : eventos.filter((e) => e.tipo === filtro)), [eventos, filtro]);
  const dias = useMemo(() => agruparPorDia(visiveis.slice(0, limite), hoje), [visiveis, limite, hoje]);

  async function publicar() {
    if (!onPublicar || !texto.trim() || publicando) return;
    setPublicando(true);
    try {
      await onPublicar(texto.trim());
      setTexto("");
    } finally {
      setPublicando(false);
    }
  }

  /** O arquiteto encaminha qualquer fato (menos o andamento solto); o cliente, só os próprios recados. */
  const podeEnviar = (e: Evento) => (ehCliente ? e.tipo === "publicacao" && Boolean(uid) && e.donoUid === uid : e.tipo !== "andamento");
  /** O arquiteto remove qualquer aviso; o cliente, só o que ele mesmo escreveu. */
  const podeRemover = (e: Evento) => !ehCliente || (Boolean(uid) && e.donoUid === uid);

  function enviarResumo() {
    onEnviar?.("Resumo da semana", "resumo", mensagemResumo(eventos, Date.now() - 7 * 86_400_000, contexto));
  }

  return (
    <section aria-label="Linha do tempo" className="space-y-4">
      <Resumo resumo={resumo} prazo={prazo} irPara={onIrPara} />

      {onPublicar && (
        <div className="prancha p-4">
          <div className="flex items-start gap-3">
            <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink font-mono text-xs font-semibold text-white">
              {iniciais(ator) || "EU"}
            </span>
            <div className="min-w-0 flex-1">
              <label htmlFor="feed-texto" className="sr-only">{ehCliente ? "Escreva uma mensagem para o feed do projeto" : "Escreva um aviso para o feed do projeto"}</label>
              <textarea
                id="feed-texto"
                className="input-pit resize-none"
                rows={2}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder={ehCliente ? "Escreva uma mensagem ou dúvida para o arquiteto…" : "Compartilhe uma novidade da obra…"}
              />
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xs text-ink/45">{ehCliente ? "Aparece no feed para o arquiteto. Depois você pode encaminhar pelo WhatsApp." : "Aparece no feed para o cliente. Depois você pode encaminhar pelo WhatsApp."}</p>
                <Botao variante="solido" tamanho="pequeno" disabled={!texto.trim() || publicando} onClick={publicar}>
                  {publicando ? "Publicando…" : "Publicar"}
                </Botao>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="group" aria-label="Filtrar a linha do tempo">
          {FILTROS.map((f) => (
            <button
              key={f}
              aria-pressed={filtro === f}
              onClick={() => {
                setFiltro(f);
                setLimite(25);
              }}
              className={`clicavel shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${filtro === f ? "border-ink bg-ink text-white" : "border-ink/20 bg-white text-ink/70 hover:border-ink/50"}`}
            >
              {f === "todos" ? "Tudo" : ROTULO_TIPO[f]}
            </button>
          ))}
        </div>
        {onEnviar && !ehCliente && <BotaoEnviar rotulo="Enviar resumo da semana" onClick={enviarResumo} />}
      </div>

      {visiveis.length === 0 ? (
        <p className="prancha px-4 py-12 text-center text-sm leading-snug text-ink/55">
          {eventos.length === 0
            ? ehCliente
              ? "O feed ainda está vazio. Escreva uma mensagem acima: o arquiteto vê aqui. Tudo o que acontecer no projeto também aparece, dia a dia."
              : "O feed ainda está vazio. Publique um aviso acima, marque uma visita ou marque itens como feitos: tudo aparece aqui, dia a dia."
            : "Nada neste filtro ainda."}
        </p>
      ) : (
        <div className="space-y-5">
          {dias.map((d) => (
            <div key={d.chave}>
              <h3 className="rotulo-tec mb-2 flex items-center gap-3 capitalize text-ink/50">
                {d.rotulo}
                <span className="h-px flex-1 bg-linha" />
              </h3>
              <ol className="space-y-3">
                {d.eventos.map((e) => (
                  <Cartao
                    key={e.id}
                    e={e}
                    agora={agora}
                    contexto={contexto}
                    tituloEnvio={ehCliente ? "Enviar ao arquiteto" : "Enviar ao cliente"}
                    onEnviar={onEnviar && podeEnviar(e) ? onEnviar : undefined}
                    onRemover={
                      onRemoverPublicacao && e.tipo === "publicacao" && podeRemover(e)
                        ? async () => {
                            if (await confirmar({ titulo: "Remover aviso", mensagem: "Remover este aviso do feed? Essa ação não pode ser desfeita.", confirmar: "Remover", tom: "perigo" })) await onRemoverPublicacao(e.id.replace("publicacao|", ""));
                          }
                        : undefined
                    }
                  />
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      {visiveis.length > limite && (
        <button onClick={() => setLimite((l) => l + 25)} className="font-mono text-[11px] font-semibold uppercase tracking-wider text-pitanga hover:underline">
          Ver mais ({visiveis.length - limite})
        </button>
      )}
    </section>
  );
}
