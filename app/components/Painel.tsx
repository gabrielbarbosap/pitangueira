"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useObras } from "@/lib/obras";
import { CASA_PITANGA_EMAILS } from "@/lib/demo";
import { percentual } from "@/lib/format";
import { useDinheiro } from "@/lib/privacidade";
import { BotaoOlho } from "./BotaoOlho";
import type { Obra } from "@/lib/types";
import { Logo, LogoMark } from "./Logo";
import { Regua } from "./Regua";
import { ObraDialog } from "./ObraDialog";
import { GerenciarObraDialog } from "./GerenciarObraDialog";
import { CatalogoDialog } from "./CatalogoDialog";
import { ComposicoesDialog } from "./ComposicoesDialog";
import { FornecedoresDialog } from "./FornecedoresDialog";
import { Tour, useTour, type PassoTour } from "./Tour";
import { IconeAjuda, IconeArquivo, IconeMais, IconeObra, IconeOpcoes, IconeSair } from "./Icones";

type StatusObra = "nova" | "parada" | "andamento" | "concluida";

const STATUS: Record<StatusObra, { rotulo: string; tile: string; ponto: string }> = {
  nova: { rotulo: "Sem itens ainda", tile: "bg-ink/[0.07] text-ink/60", ponto: "bg-ink/30" },
  parada: { rotulo: "Não iniciada", tile: "bg-ink/[0.07] text-ink/60", ponto: "bg-ink/30" },
  andamento: { rotulo: "Em andamento", tile: "bg-amber-100 text-amber-800", ponto: "bg-amber-500" },
  concluida: { rotulo: "Concluída", tile: "bg-emerald-100 text-emerald-800", ponto: "bg-emerald-600" },
};

function statusDe(o: Obra): StatusObra {
  const r = o.resumo;
  if (!r || r.itens === 0) return "nova";
  if (r.concluidos === r.itens) return "concluida";
  return r.feitos > 0 || r.pago > 0 ? "andamento" : "parada";
}

function Cartao({ rotulo, valor, sub, destaque }: { rotulo: string; valor: string; sub?: string; destaque?: boolean }) {
  return (
    <div className="prancha p-4">
      <p className="rotulo-tec text-ink/50">{rotulo}</p>
      <p className={`mt-2 font-mono text-3xl font-semibold tabular-nums leading-none ${destaque ? "text-pitanga" : "text-ink"}`}>{valor}</p>
      {sub && <p className="mt-2 text-xs leading-snug text-ink/50">{sub}</p>}
    </div>
  );
}

function CardObra({ obra, onGerenciar, tour }: { obra: Obra; onGerenciar: () => void; tour?: boolean }) {
  const [copiado, setCopiado] = useState(false);
  const { brlInt } = useDinheiro();
  const r = obra.resumo;
  const st = STATUS[statusDe(obra)];
  const execucao = r && r.itens > 0 ? percentual(r.concluidos, r.itens) : 0;
  const pagoPct = r && r.previsto > 0 ? percentual(r.pago, r.previsto) : 0;

  async function copiar() {
    const link = `${window.location.origin}/obra/${obra.id}`;
    try {
      // Só o link: a chave o arquiteto passa ao cliente à parte.
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      window.prompt("Copie o link do projeto:", link);
    }
  }

  return (
    <article className="prancha overflow-hidden" data-tour={tour ? "cartao-projeto" : undefined}>
      <Link href={`/obra/${obra.id}`} className="clicavel block p-4 transition-colors hover:bg-ink/[0.02] active:bg-ink/[0.04]">
        <div className="flex items-start gap-3">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${st.tile}`}>
            <IconeObra />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold leading-tight text-ink">{obra.nome}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-ink/65">
              <span className={`h-2 w-2 rounded-full ${st.ponto}`} />
              {st.rotulo}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-3xl font-semibold tabular-nums leading-none text-ink">
              {execucao}
              <span className="text-base text-ink/40">%</span>
            </p>
            <p className="rotulo-tec mt-1 text-ink/45">concluído</p>
          </div>
        </div>

        <div className="mt-4">
          <Regua pct={execucao} />
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-2">
          {[
            ["Orçado", r ? brlInt(r.previsto) : "calculando…"],
            ["Pago", r ? brlInt(r.pago) : "calculando…"],
            ["A pagar", r ? brlInt(Math.max(0, r.previsto - r.pago)) : "calculando…"],
            ["Teto", obra.orcamentoTotal > 0 ? brlInt(obra.orcamentoTotal) : "a definir"],
          ].map(([rotulo, valor]) => (
            <div key={rotulo} className="rounded-2xl bg-ink/[0.04] px-3 py-2.5">
              <dt className="rotulo-tec text-ink/45">{rotulo}</dt>
              <dd className="mt-1 truncate font-mono text-[15px] font-semibold tabular-nums text-ink">{valor}</dd>
            </div>
          ))}
        </dl>
        {r && r.itens > 0 && (
          <p className="mt-2.5 text-xs text-ink/45">
            {r.concluidos}/{r.itens} itens concluídos · {pagoPct}% do valor pago
          </p>
        )}
      </Link>

      <div className="flex items-center justify-between gap-3 border-t border-linha bg-ink/[0.025] px-4 py-2.5">
        <p className="rotulo-tec min-w-0 truncate text-ink/55">
          Chave <span className="ml-1 font-semibold tracking-[0.2em] text-ink">{obra.accessCode}</span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={copiar}
            title="Copia só o link do projeto (a chave você passa à parte)"
            className="btn btn-linha rounded-full px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider"
          >
            {copiado ? "Copiado ✓" : "Copiar link"}
          </button>
          <button
            onClick={onGerenciar}
            aria-label={`Arquivar ou excluir ${obra.nome}`}
            title="Arquivar ou excluir"
            className="btn btn-icone h-8 w-8 rounded-full"
          >
            <IconeOpcoes />
          </button>
        </div>
      </div>
    </article>
  );
}

function CardArquivada({ obra, onGerenciar }: { obra: Obra; onGerenciar: () => void }) {
  const quando = obra.arquivadaEm ? new Date(obra.arquivadaEm).toLocaleDateString("pt-BR") : null;
  return (
    <article className="flex items-center gap-3 rounded-2xl border border-dashed border-ink/25 bg-white/60 p-3.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink/[0.07] text-ink/55">
        <IconeArquivo />
      </span>
      <div className="min-w-0 flex-1">
        <Link href={`/obra/${obra.id}`} className="clicavel block truncate font-semibold text-ink/80 hover:text-ink">
          {obra.nome}
        </Link>
        <p className="text-xs text-ink/50">Arquivado{quando ? ` em ${quando}` : ""}</p>
      </div>
      <button onClick={onGerenciar} className="btn btn-linha shrink-0 rounded-full px-3.5 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider">
        Gerenciar
      </button>
    </article>
  );
}

export function Painel() {
  const { user, logout, configured } = useAuth();
  const { obras, loading, recuperarCasaPitanga } = useObras();
  const router = useRouter();
  const [dialog, setDialog] = useState(false);
  const [recuperando, setRecuperando] = useState(false);
  const [gerenciarId, setGerenciarId] = useState<string | null>(null);
  const [verArquivadas, setVerArquivadas] = useState(false);
  const [catalogo, setCatalogo] = useState(false);
  const [composicoes, setComposicoes] = useState(false);
  const [fornecedores, setFornecedores] = useState(false);

  // Tutorial da home: abre sozinho na primeira visita (depois que a lista de projetos carregou).
  const tour = useTour("painel", { auto: true, pronto: !loading });
  const passosTour: PassoTour[] = [
    {
      titulo: "Bem-vindo à Pitangueira",
      texto: "Em um minuto você conhece a sua home. Cada projeto reúne orçamento, andamento, programa de necessidades e o acesso do seu cliente.",
    },
    {
      alvo: "novo-projeto",
      titulo: "Comece por aqui",
      texto: "Crie um projeto do zero ou parta de um projeto seu: os itens e o programa já vêm prontos, sem pagamentos nem dados do cliente.",
    },
    {
      alvo: "cartao-projeto",
      opcional: true,
      titulo: "Cada projeto é um cartão",
      texto: "Veja o andamento de relance. A chave é o código que o cliente digita; “Copiar link” leva só o endereço, e a chave você passa à parte. No botão ⋯ você arquiva ou exclui.",
    },
    {
      alvo: "resumo-geral",
      opcional: true,
      titulo: "A visão de todos os projetos",
      texto: "Quantos projetos você toca e o progresso geral, somando todos os itens.",
    },
    {
      alvo: "atalhos",
      titulo: "Suas ferramentas pessoais",
      texto:
        "Meu catálogo guarda seus itens e preços. Composições monta serviços com insumos, BDI e margem. Fornecedores mostra o histórico de prazo e custo. Financeiro controla honorários e parcelas a receber.",
    },
    {
      alvo: "olhinho",
      titulo: "Privacidade num toque",
      texto: "O olhinho esconde todos os valores em dinheiro, como nos apps de banco. Bom para mostrar a tela a um cliente.",
    },
    {
      titulo: "Pronto!",
      texto: "Reveja este tutorial quando quiser, pelo botão ? no topo. Dentro de cada projeto há outro tutorial, que abre na primeira visita.",
    },
  ];

  const ehArqPitanga =
    !!user?.email && CASA_PITANGA_EMAILS.map((e) => e.toLowerCase()).includes(user.email.toLowerCase());
  const temCompartilhada = obras.some((o) => (o.ownerEmails?.length ?? 0) > 1);

  // Totais e lista principal só com obras ativas; arquivadas ficam numa seção à parte.
  const ativas = useMemo(() => obras.filter((o) => !o.arquivada), [obras]);
  const arquivadas = useMemo(() => obras.filter((o) => o.arquivada), [obras]);
  const obraGerenciada = obras.find((o) => o.id === gerenciarId) ?? null;

  // Progresso geral: todos os projetos ativas juntas (itens concluídos / itens totais), não a média das médias.
  const geral = useMemo(() => {
    let itens = 0;
    let concluidos = 0;
    let emAndamento = 0;
    for (const o of ativas) {
      const r = o.resumo;
      if (!r) continue;
      itens += r.itens;
      concluidos += r.concluidos;
      if (r.itens > 0 && r.concluidos < r.itens) emAndamento += 1;
    }
    return { itens, concluidos, emAndamento, pct: itens > 0 ? percentual(concluidos, itens) : 0 };
  }, [ativas]);

  const primeiroNome = (user?.nome ?? "").split(" ")[0] || "arquiteto";
  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
  const comCartoes = ativas.length > 0 && !loading;

  async function recuperar() {
    setRecuperando(true);
    try {
      const id = await recuperarCasaPitanga();
      router.push(`/obra/${id}`);
    } finally {
      setRecuperando(false);
    }
  }

  return (
    <div className="grade min-h-dvh">
      {/* Topo colorido: saudação e contexto */}
      <header className={`rounded-b-[32px] bg-pitanga text-white ${comCartoes ? "pb-16" : "pb-8"}`}>
        <div className="mx-auto max-w-3xl px-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <Logo claro />
            <div className="flex items-center gap-2">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 font-mono text-sm font-semibold uppercase"
                aria-hidden
                title={user?.nome}
              >
                {primeiroNome.slice(0, 1)}
              </span>
              <button
                onClick={tour.iniciar}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label="Ver o tutorial"
                title="Ver o tutorial"
              >
                <IconeAjuda />
              </button>
              <BotaoOlho
                tour="olhinho"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              />
              <button
                onClick={logout}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                aria-label="Sair"
                title="Sair"
              >
                <IconeSair />
              </button>
            </div>
          </div>

          <p className="rotulo-tec mt-7 text-white/85">{hoje}</p>
          <h1 className="mt-1 text-4xl font-semibold leading-tight tracking-tight">Olá, {primeiroNome}.</h1>
          <p className="mt-1 text-sm text-white">
            {loading
              ? "Carregando seus projetos…"
              : obras.length === 0
                ? "Comece criando o seu primeiro projeto."
                : `${ativas.length} ${ativas.length === 1 ? "projeto sob sua gestão" : "projetos sob sua gestão"}${arquivadas.length > 0 ? ` · ${arquivadas.length} arquivado${arquivadas.length > 1 ? "s" : ""}` : ""}.`}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2" data-tour="atalhos">
            <button
              onClick={() => setCatalogo(true)}
              className="rotulo-tec rounded-full bg-white/15 px-3 py-1.5 text-white transition-colors hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Meu catálogo
            </button>
            <button
              onClick={() => setComposicoes(true)}
              className="rotulo-tec rounded-full bg-white/15 px-3 py-1.5 text-white transition-colors hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Composições
            </button>
            <button
              onClick={() => setFornecedores(true)}
              className="rotulo-tec rounded-full bg-white/15 px-3 py-1.5 text-white transition-colors hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Fornecedores
            </button>
            <Link
              href="/financeiro"
              className="rotulo-tec rounded-full bg-white/15 px-3 py-1.5 text-white transition-colors hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Financeiro
            </Link>
            {!configured && (
              <p className="rotulo-tec inline-block rounded-full bg-white/15 px-3 py-1.5 text-white">Modo demo · dados só neste navegador</p>
            )}
          </div>
        </div>
      </header>

      <main className={`mx-auto max-w-3xl space-y-6 px-4 pb-32 ${comCartoes ? "-mt-9" : "pt-6"}`}>
        {comCartoes && (
          <section aria-label="Resumo geral" className="relative z-10 grid grid-cols-2 gap-3" data-tour="resumo-geral">
            <Cartao
              rotulo="Projetos que você toca"
              valor={String(ativas.length)}
              sub={geral.emAndamento > 0 ? `${geral.emAndamento} em andamento` : "nenhum em andamento"}
            />
            <Cartao
              rotulo="Progresso geral"
              valor={`${geral.pct}%`}
              sub={`${geral.concluidos}/${geral.itens} itens, todos os projetos`}
              destaque
            />
          </section>
        )}

        {ehArqPitanga && !temCompartilhada && !loading && (
          <div className="flex flex-col gap-3 rounded-3xl border border-ink/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink">
              O projeto <strong>Casa Pitanga</strong> é compartilhado entre os 3 arquitetos. Traga-o para o seu painel.
            </p>
            <button onClick={recuperar} disabled={recuperando} className="btn btn-primario shrink-0 px-4 py-2.5 text-sm">
              {recuperando ? "Criando…" : "Recuperar Casa Pitanga"}
            </button>
          </div>
        )}

        <section aria-label="Projetos">
          <div className="mb-3 flex items-center gap-3">
            <h2 className="text-xl font-semibold text-ink">Seus projetos</h2>
            <span className="h-px flex-1 bg-linha" />
          </div>

          {loading ? (
            <div className="prancha px-6 py-16 text-center font-mono text-xs uppercase tracking-wider text-ink/40">Carregando…</div>
          ) : obras.length === 0 ? (
            <div className="prancha px-6 py-14 text-center">
              <div className="flex justify-center"><LogoMark size={76} /></div>
              <p className="mt-5 text-lg font-semibold text-ink">Nenhum projeto ainda</p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-ink/60">
                Crie o projeto, cadastre os itens do orçamento e envie a chave para o seu cliente acompanhar.
              </p>
            </div>
          ) : ativas.length === 0 ? (
            <div className="prancha px-6 py-10 text-center">
              <p className="text-lg font-semibold text-ink">Todos os seus projetos estão arquivados</p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-ink/60">Crie um novo projeto ou restaure um dos arquivados, logo abaixo.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {ativas.map((o, idx) => (
                <CardObra key={o.id} obra={o} tour={idx === 0} onGerenciar={() => setGerenciarId(o.id)} />
              ))}
            </div>
          )}
        </section>

        {arquivadas.length > 0 && !loading && (
          <section aria-label="Projetos arquivados">
            <button
              onClick={() => setVerArquivadas((v) => !v)}
              aria-expanded={verArquivadas}
              className="clicavel flex w-full items-center gap-3 rounded-xl py-1 text-left"
            >
              <h2 className="text-base font-semibold text-ink/75">Arquivados ({arquivadas.length})</h2>
              <span className="h-px flex-1 bg-linha" />
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ink/50">{verArquivadas ? "Ocultar" : "Mostrar"}</span>
            </button>
            {verArquivadas && (
              <div className="mt-3 space-y-2.5">
                <p className="text-xs text-ink/50">Guardados fora da lista principal. Nada foi apagado: use Gerenciar para restaurar ou excluir de vez.</p>
                {arquivadas.map((o) => (
                  <CardArquivada key={o.id} obra={o} onGerenciar={() => setGerenciarId(o.id)} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Ação principal flutuante, ao alcance do polegar */}
      <div className="pb-seguro pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4">
        <button
          onClick={() => setDialog(true)}
          data-tour="novo-projeto"
          className="btn btn-primario pointer-events-auto gap-2 rounded-full px-7 py-4 text-base shadow-[0_14px_30px_-10px_rgba(210,58,31,0.7)]"
        >
          <IconeMais size={20} /> Novo projeto
        </button>
      </div>

      <ObraDialog aberto={dialog} onFechar={() => setDialog(false)} />
      <GerenciarObraDialog obra={obraGerenciada} onFechar={() => setGerenciarId(null)} />
      <CatalogoDialog aberto={catalogo} onFechar={() => setCatalogo(false)} />
      <ComposicoesDialog aberto={composicoes} onFechar={() => setComposicoes(false)} />
      <FornecedoresDialog aberto={fornecedores} onFechar={() => setFornecedores(false)} />
      <Tour passos={passosTour} aberto={tour.aberto} onFechar={tour.fechar} />
    </div>
  );
}
