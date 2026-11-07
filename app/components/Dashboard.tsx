"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { useRouter } from "next/navigation";
import { registrarObraCliente } from "@/lib/clienteObras";
import { useAuth } from "@/lib/auth";
import { useObras } from "@/lib/obras";
import { useData } from "@/lib/data";
import { percentual } from "@/lib/format";
import { agruparPor, calcularResumo, distintos, filtrarItens, ordenarPorStatus, resumoDeItens } from "@/lib/calc";
import type { Agrupamento, Item } from "@/lib/types";
import { ResumoTopo, SummaryCards } from "./SummaryCards";
import { ChartComposicao } from "./BudgetCharts";
import { AbaGraficos } from "./GraficosAba";
import { ItemsList } from "./ItemsList";
import { ItemDialog } from "./ItemDialog";
import { ConfigDialog } from "./ConfigDialog";
import { ProgramaTab } from "./ProgramaTab";
import { CatalogoDialog } from "./CatalogoDialog";
import { EmAndamento } from "./EmAndamento";
import { BotaoOlho } from "./BotaoOlho";
import { OrcamentoDocumento, type ConfigOrcamentoPdf } from "./OrcamentoDocumento";
import { OrcamentoPdfDialog } from "./OrcamentoPdfDialog";
import { GerenciarObraDialog } from "./GerenciarObraDialog";
import { Logo } from "./Logo";
import {
  IconeAjustes,
  IconeBusca,
  IconeGraficos,
  IconeItens,
  IconeMais,
  IconePrograma,
  IconeResumo,
  IconeSair,
  IconeVoltar,
} from "./Icones";

type Aba = "resumo" | "itens" | "graficos" | "programa";

const ABAS: readonly { id: Aba; rotulo: string; Icone: ComponentType }[] = [
  { id: "resumo", rotulo: "Resumo", Icone: IconeResumo },
  { id: "itens", rotulo: "Itens", Icone: IconeItens },
  { id: "graficos", rotulo: "Gráficos", Icone: IconeGraficos },
  { id: "programa", rotulo: "Programa", Icone: IconePrograma },
];

const botaoTopo =
  "flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export function Dashboard() {
  const { user, logout } = useAuth();
  const { obraId, itens, config, loading, ehCliente, addItem } = useData();
  const [catalogoAberto, setCatalogoAberto] = useState(false);
  const [pdfDialog, setPdfDialog] = useState(false);
  const [cfgPdf, setCfgPdf] = useState<ConfigOrcamentoPdf | null>(null);
  const { obras } = useObras();
  const router = useRouter();
  const [gerenciando, setGerenciando] = useState(false);
  // A obra como o arquiteto a vê na lista (cliente não tem lista, então não vê essa opção).
  const obraAtual = !ehCliente ? obras.find((o) => o.id === obraId) ?? null : null;

  // Cliente: lembra desta obra para listá-la na home dele.
  useEffect(() => {
    if (ehCliente && !loading && config.nomeObra) registrarObraCliente(obraId, config.nomeObra);
  }, [ehCliente, loading, obraId, config.nomeObra]);

  const [itemDialog, setItemDialog] = useState(false);
  const [configDialog, setConfigDialog] = useState(false);
  const [itemEdicao, setItemEdicao] = useState<Item | null>(null);
  const [agrupamento, setAgrupamento] = useState<Agrupamento>("etapa");
  const [busca, setBusca] = useState("");
  const [aba, setAba] = useState<Aba>("resumo");

  const resumo = useMemo(() => calcularResumo(itens, config), [itens, config]);
  const agregado = useMemo(() => resumoDeItens(itens), [itens]);
  const pct = agregado.itens > 0 ? percentual(agregado.concluidos, agregado.itens) : 0;
  const [etapaFoco, setEtapaFoco] = useState<string | null>(null);
  const itensFiltrados = useMemo(
    () => filtrarItens(etapaFoco ? itens.filter((i) => (i.etapa?.trim() || "Sem definição") === etapaFoco) : itens, busca),
    [itens, busca, etapaFoco],
  );
  const gruposGrafico = useMemo(() => agruparPor(itens, agrupamento), [itens, agrupamento]);
  const gruposLista = useMemo(() => ordenarPorStatus(agruparPor(itensFiltrados, agrupamento)), [itensFiltrados, agrupamento]);
  const gruposEtapa = useMemo(() => agruparPor(itens, "etapa"), [itens]);
  const etapas = useMemo(() => distintos(itens, "etapa"), [itens]);
  const ambientes = useMemo(() => distintos(itens, "ambiente"), [itens]);

  /** Dentro da obra volta para o início dela (Resumo); já no início, sai para a home de quem está logado. */
  function voltar() {
    if (aba !== "resumo") {
      setEtapaFoco(null);
      setAba("resumo");
      window.scrollTo({ top: 0 });
      return;
    }
    router.push("/");
  }

  function abrirNovo() {
    setItemEdicao(null);
    setItemDialog(true);
  }
  function abrirEdicao(item: Item) {
    setItemEdicao(item);
    setItemDialog(true);
  }

  const vazio = (
    <div className="prancha px-6 py-14 text-center">
      <p className="text-lg font-semibold text-ink">Nenhum item neste projeto ainda</p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-ink/60">
        {ehCliente ? "O arquiteto ainda não cadastrou o orçamento." : "Cadastre os itens do orçamento para acompanhar valores e andamento."}
      </p>
      {!ehCliente && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button onClick={abrirNovo} className="btn btn-primario px-5 py-2.5 text-sm">
            <IconeMais /> Adicionar primeiro item
          </button>
          <button onClick={() => setCatalogoAberto(true)} className="btn btn-linha px-5 py-2.5 text-sm">
            Usar meu catálogo
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="grade min-h-dvh">
      {/* Topo colorido: a obra, quem está vendo e o progresso geral */}
      <header className={`rounded-b-[32px] bg-pitanga text-white transition-[padding] ${aba === "resumo" ? "pb-16" : "pb-7"}`}>
        <div className="mx-auto max-w-3xl px-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={voltar}
              className={botaoTopo}
              aria-label={aba === "resumo" ? "Voltar ao painel" : "Voltar ao início do projeto"}
              title={aba === "resumo" ? "Voltar ao painel" : "Voltar ao início do projeto"}
            >
              <IconeVoltar />
            </button>
            <Logo claro />
            <div className="flex gap-2">
              <BotaoOlho className={botaoTopo} />
              <button onClick={() => setConfigDialog(true)} className={botaoTopo} aria-label="Ajustes do projeto" title="Ajustes do projeto">
                <IconeAjustes />
              </button>
              <button onClick={logout} className={botaoTopo} aria-label="Sair" title="Sair">
                <IconeSair />
              </button>
            </div>
          </div>

          <p className="rotulo-tec mt-6 truncate text-white/85">
            {user?.nome ?? "Modo demo"}
            {ehCliente ? " · cliente" : ""}
          </p>
          <h1 className="mt-1 text-3xl font-semibold leading-tight tracking-tight">{config.nomeObra || "Projeto"}</h1>
          <p className="mt-1 text-sm text-white">
            {pct}% concluído · {agregado.concluidos} de {agregado.itens} itens
          </p>
          <div className="mt-4 h-2 rounded-full bg-white/25" role="img" aria-label={`${pct}% concluído`}>
            <div className="h-2 rounded-full bg-white transition-[width] duration-500" style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        </div>
      </header>

      <main className={`mx-auto max-w-3xl space-y-5 px-4 pb-32 ${aba === "resumo" ? "-mt-9" : "pt-5"}`}>
        {loading ? (
          <div className="prancha px-6 py-16 text-center font-mono text-xs uppercase tracking-wider text-ink/40">Carregando…</div>
        ) : aba === "programa" ? (
          <ProgramaTab gruposEtapa={gruposEtapa} />
        ) : itens.length === 0 ? (
          vazio
        ) : aba === "resumo" ? (
          <>
            <ResumoTopo resumo={resumo} />
            <EmAndamento
              gruposEtapa={gruposEtapa}
              onAbrirEtapa={(nome) => {
                setAgrupamento("etapa");
                setBusca("");
                setEtapaFoco(nome);
                setAba("itens");
              }}
              onVerTodas={() => {
                setAgrupamento("etapa");
                setBusca("");
                setEtapaFoco(null);
                setAba("itens");
              }}
            />
            <SummaryCards resumo={resumo} />
            <ChartComposicao grupos={gruposGrafico} />
          </>
        ) : aba === "itens" ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-ink">Itens do orçamento</h2>
              {!ehCliente && (
                <button onClick={abrirNovo} className="btn btn-primario gap-1.5 px-4 py-2.5 text-sm">
                  <IconeMais /> Item
                </button>
              )}
            </div>
            <div className="-mt-2 flex flex-wrap gap-2">
              {!ehCliente && (
                <button onClick={() => setCatalogoAberto(true)} className="btn btn-linha rounded-full px-3.5 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider">
                  Catálogo
                </button>
              )}
              <button onClick={() => setPdfDialog(true)} className="btn btn-linha rounded-full px-3.5 py-2 font-mono text-[11px] font-semibold uppercase tracking-wider">
                Orçamento em PDF
              </button>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40">
                  <IconeBusca />
                </span>
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar serviço, fornecedor, etapa ou valor…"
                  className="campo-pit w-full border border-ink/20 bg-white py-3 pl-11 pr-11 text-sm text-ink outline-none"
                />
                {busca && (
                  <button
                    onClick={() => setBusca("")}
                    className="btn btn-icone absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full text-xs"
                    aria-label="Limpar busca"
                    title="Limpar busca"
                  >
                    ✕
                  </button>
                )}
              </div>
              {etapaFoco && (
                <button
                  onClick={() => setEtapaFoco(null)}
                  className="btn btn-linha flex max-w-full items-center gap-2 rounded-full px-3.5 py-2 text-left text-xs font-semibold"
                  title="Remover o filtro de etapa"
                >
                  <span className="min-w-0 truncate">Etapa: {etapaFoco}</span>
                  <span aria-hidden className="shrink-0 text-ink/50">✕</span>
                </button>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="rotulo-tec text-ink/55">
                  {busca.trim() || etapaFoco ? `${itensFiltrados.length} de ${itens.length} itens` : "Agrupar por"}
                </span>
                <div className="inline-flex rounded-full bg-ink/[0.07] p-1" role="tablist">
                  {(
                    [
                      ["etapa", "Etapa"],
                      ["ambiente", "Ambiente"],
                    ] as const
                  ).map(([v, label]) => (
                    <button
                      key={v}
                      role="tab"
                      aria-selected={agrupamento === v}
                      onClick={() => setAgrupamento(v)}
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                        agrupamento === v ? "bg-ink text-white" : "text-ink/60 hover:text-ink"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {gruposLista.length === 0 ? (
              <div className="prancha py-12 text-center text-sm text-ink/55">{busca.trim() ? `Nenhum serviço encontrado para “${busca}”.` : "Nenhum serviço nesta etapa."}</div>
            ) : (
              <ItemsList grupos={gruposLista} onEditar={abrirEdicao} expandir={busca.trim().length > 0 || etapaFoco !== null} />
            )}
          </>
        ) : (
          <AbaGraficos itens={itens} config={config} />
        )}
      </main>

      {/* Menu em pílula: ao alcance do polegar */}
      <nav aria-label="Seções do projeto" className="pb-seguro pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4">
        <div role="tablist" className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-1 rounded-full bg-ink p-1.5 shadow-[0_14px_30px_-10px_rgba(20,17,15,0.55)]">
          {ABAS.map(({ id, rotulo, Icone }) => {
            const ativa = aba === id;
            return (
              <button
                key={id}
                role="tab"
                aria-selected={ativa}
                onClick={() => setAba(id)}
                className={`clicavel flex flex-1 flex-col items-center gap-0.5 rounded-full px-2 py-2 transition-colors ${
                  ativa ? "bg-pitanga text-white" : "text-white/65 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icone />
                <span className="text-[11px] font-medium leading-none">{rotulo}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <ItemDialog aberto={itemDialog} onFechar={() => setItemDialog(false)} item={itemEdicao} etapas={etapas} ambientes={ambientes} />
      {!ehCliente && (
        <CatalogoDialog
          aberto={catalogoAberto}
          onFechar={() => setCatalogoAberto(false)}
          etapas={etapas}
          itensObra={itens}
          onAdicionar={(c, quantidade) =>
            addItem({
              etapaNum: 0,
              etapa: c.etapa || "Sem etapa",
              ambiente: "Geral",
              descricao: c.descricao,
              unidade: c.unidade || undefined,
              quantidade,
              valorUnitario: c.valorUnitario,
              valorOrcado: Math.round(quantidade * c.valorUnitario * 100) / 100,
              valorReal: 0,
              feito: false,
              pago: false,
            })
          }
        />
      )}
      <OrcamentoPdfDialog
        aberto={pdfDialog}
        onFechar={() => setPdfDialog(false)}
        itens={itens}
        onGerar={(cfg) => {
          setPdfDialog(false);
          setCfgPdf(cfg);
        }}
      />
      {cfgPdf && <OrcamentoDocumento cfg={cfgPdf} onFechar={() => setCfgPdf(null)} />}
      <ConfigDialog
        aberto={configDialog}
        onFechar={() => setConfigDialog(false)}
        onGerenciar={
          obraAtual
            ? () => {
                setConfigDialog(false);
                setGerenciando(true);
              }
            : undefined
        }
      />
      <GerenciarObraDialog
        obra={gerenciando ? obraAtual : null}
        onFechar={() => setGerenciando(false)}
        aoConcluir={(acao) => {
          // Arquivada ou excluída: a obra sai da vista principal, então volta para a home.
          if (acao !== "restaurada") router.push("/");
        }}
      />
    </div>
  );
}
