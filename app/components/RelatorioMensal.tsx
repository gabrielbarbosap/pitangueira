"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useData } from "@/lib/data";
import { brl } from "@/lib/format";
import { situacaoDoPrazo, dataCurta, dataLonga, textoDeDiferenca, textoDeTempo } from "@/lib/prazo";
import {
  chaveDoMes,
  mesDe,
  mesesDisponiveis,
  mesmoMes,
  movimentosDoMes,
  porEtapa,
  progressoDoMes,
  rotuloCurto,
  rotuloDoMes,
  semDataRegistrada,
  totalPago,
  type Mes,
  type Progresso,
} from "@/lib/relatorio";
import { limitesDoMes } from "@/lib/relatorio";
import type { Item } from "@/lib/types";
import { Modal } from "./Modal";
import { DocumentoBase, TituloSecao } from "./DocumentoBase";
import { useHoje } from "./PrazoVisual";

const campo = "campo-pit w-full border border-ink/25 bg-white px-3 py-2.5 text-sm text-ink outline-none";
const dia = (ms?: number) => (ms ? new Date(ms).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "—");
const maiuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- Cartão no Resumo ----------

/** Convite no Resumo (só do arquiteto): mostra o que já aconteceu no mês e abre a janela do relatório. */
export function RelatorioCard({ itens, onAbrir }: { itens: Item[]; onAbrir: () => void }) {
  const hoje = useHoje();
  if (hoje === 0) return null;
  const mes = mesDe(hoje);
  const mov = movimentosDoMes(itens, mes);
  const executados = mov.filter((m) => m.feitoNoMes).length;
  const pagos = mov.filter((m) => m.pagoNoMes).length;

  return (
    <section aria-label="Relatório mensal" data-tour="relatorio" className="prancha flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
      <div className="min-w-0 flex-1">
        <p className="rotulo-tec text-ink/50">Relatório mensal de andamento</p>
        <p className="mt-1 text-[15px] font-semibold leading-snug text-ink">
          {mov.length === 0
            ? `Nada marcado em ${rotuloDoMes(mes)} ainda`
            : `${executados} ${executados === 1 ? "serviço executado" : "serviços executados"} · ${pagos} ${pagos === 1 ? "pagamento" : "pagamentos"} em ${rotuloDoMes(mes)}`}
        </p>
        <p className="mt-0.5 text-xs text-ink/55">Escolha o que entra e gere o PDF para mandar ao cliente.</p>
      </div>
      <button className="btn btn-primario shrink-0 px-4 py-2.5 text-sm" onClick={onAbrir}>
        Gerar relatório
      </button>
    </section>
  );
}

// ---------- Janela de escolha ----------

function Numero({ n, children }: { n: number; children: ReactNode }) {
  return (
    <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink font-mono text-[11px] text-white" aria-hidden>
        {n}
      </span>
      {children}
    </p>
  );
}

function Selo({ cor, children }: { cor: string; children: ReactNode }) {
  return <span className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold ${cor}`}>{children}</span>;
}

/**
 * Janela do relatório: 1) escolher o mês, 2) escolher o que entra (tudo marcado por padrão, é só desmarcar o que
 * não vale), 3) contar o que importa. O documento abre por cima e, ao fechar, a escolha continua aqui.
 * É montada de novo a cada abertura (o pai usa `key`), então começa sempre limpa.
 */
export function RelatorioDialog({ aberto, onFechar, itens }: { aberto: boolean; onFechar: () => void; itens: Item[] }) {
  const hoje = useHoje();
  const meses = useMemo(() => mesesDisponiveis(itens, hoje), [itens, hoje]);

  // Começa no mês atual se já houve movimento; senão no último mês que teve.
  const [mes, setMes] = useState<Mes>(() => {
    const atual = mesDe(hoje);
    const comMovimento = mesesDisponiveis(itens, hoje).filter((m) => m.qtd > 0);
    return comMovimento.some((m) => mesmoMes(m.mes, atual)) || comMovimento.length === 0 ? atual : comMovimento[comMovimento.length - 1].mes;
  });
  const [fora, setFora] = useState<Set<string>>(new Set()); // desmarcados do mês
  const [incluirSemData, setIncluirSemData] = useState<Set<string>>(new Set());
  const [destaques, setDestaques] = useState("");
  const [proximos, setProximos] = useState("");
  const [comValores, setComValores] = useState(true);
  const [gerando, setGerando] = useState(false);

  const movimentos = useMemo(() => movimentosDoMes(itens, mes), [itens, mes]);
  const grupos = useMemo(() => porEtapa(movimentos), [movimentos]);
  const semData = useMemo(() => semDataRegistrada(itens), [itens]);
  const progresso = useMemo(() => progressoDoMes(itens, mes), [itens, mes]);

  const selecionados = movimentos.filter((m) => !fora.has(m.item.id));
  const semDataEscolhidos = semData.filter((i) => incluirSemData.has(i.id));
  const executados = [...selecionados.filter((m) => m.feitoNoMes).map((m) => m.item), ...semDataEscolhidos.filter((i) => i.feito)];
  const pagos = [...selecionados.filter((m) => m.pagoNoMes).map((m) => m.item), ...semDataEscolhidos.filter((i) => i.pago)];
  const nada = executados.length === 0 && pagos.length === 0 && !destaques.trim();

  const trocarMes = (m: Mes) => {
    setMes(m);
    setFora(new Set());
  };
  const alternar = (id: string) =>
    setFora((f) => {
      const n = new Set(f);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const marcarGrupo = (ids: string[], marcar: boolean) =>
    setFora((f) => {
      const n = new Set(f);
      for (const id of ids) {
        if (marcar) n.delete(id);
        else n.add(id);
      }
      return n;
    });
  const alternarSemData = (id: string) =>
    setIncluirSemData((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Relatório mensal de andamento" largo>
      <div className="space-y-6">
        <p className="text-[13px] leading-snug text-ink/65">
          Reúne o que foi executado e pago no mês, o avanço do projeto e o prazo, num PDF com a sua marca para mandar ao cliente.
        </p>

        {/* 1. Mês */}
        <section>
          <Numero n={1}>Escolha o mês</Numero>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Mês do relatório">
            {meses.map(({ mes: m, qtd }) => {
              const ativo = mesmoMes(m, mes);
              return (
                <button
                  key={chaveDoMes(m)}
                  role="tab"
                  aria-selected={ativo}
                  onClick={() => trocarMes(m)}
                  className={`shrink-0 rounded-2xl border px-3.5 py-2 text-left transition-colors ${ativo ? "border-ink bg-ink text-white" : "border-linha bg-white text-ink hover:border-ink/40"}`}
                >
                  <span className="block text-sm font-semibold capitalize">{rotuloCurto(m)}</span>
                  <span className={`block text-[11px] ${ativo ? "text-white/70" : "text-ink/50"}`}>
                    {qtd === 0 ? "sem movimento" : `${qtd} ${qtd === 1 ? "item" : "itens"}`}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Resumo da seleção */}
        <dl className="grid grid-cols-3 gap-2 text-center" aria-label="Resumo do que vai no relatório">
          <div className="rounded-2xl bg-ink/[0.05] px-2 py-3">
            <dd className="font-mono text-xl font-semibold text-ink">{executados.length}</dd>
            <dt className="mt-0.5 text-[11px] text-ink/55">executados</dt>
          </div>
          <div className="rounded-2xl bg-ink/[0.05] px-2 py-3">
            <dd className="font-mono text-xl font-semibold text-ink">{pagos.length}</dd>
            <dt className="mt-0.5 text-[11px] text-ink/55">pagos</dt>
          </div>
          <div className="rounded-2xl bg-ink/[0.05] px-2 py-3">
            <dd className="font-mono text-xl font-semibold text-ink">
              {progresso.antes}% → {progresso.depois}%
            </dd>
            <dt className="mt-0.5 text-[11px] text-ink/55">execução do projeto</dt>
          </div>
        </dl>

        {/* 2. O que entra */}
        <section>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <Numero n={2}>Escolha o que entra</Numero>
            {movimentos.length > 0 && (
              <div className="flex gap-3 text-xs">
                <span className="text-ink/50">
                  {selecionados.length} de {movimentos.length} incluídos
                </span>
                <button type="button" className="font-semibold text-pitanga hover:underline" onClick={() => setFora(new Set())}>
                  Todos
                </button>
                <button type="button" className="font-semibold text-ink/55 hover:underline" onClick={() => setFora(new Set(movimentos.map((m) => m.item.id)))}>
                  Nenhum
                </button>
              </div>
            )}
          </div>

          {movimentos.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-ink/30 px-4 py-7 text-center text-sm leading-snug text-ink/55">
              Nenhum serviço foi marcado como feito ou pago em {rotuloDoMes(mes)}. Escolha outro mês acima, ou escreva só os destaques abaixo.
            </p>
          ) : (
            <div className="space-y-3">
              {grupos.map((g) => {
                const ids = g.itens.map((x) => x.item.id);
                const todos = ids.every((id) => !fora.has(id));
                return (
                  <div key={g.etapa} className="overflow-hidden rounded-2xl border border-linha">
                    <div className="flex items-center justify-between gap-3 bg-ink/[0.04] px-3.5 py-2">
                      <p className="min-w-0 truncate text-[13px] font-semibold text-ink">
                        {g.etapa} <span className="font-normal text-ink/45">· {g.itens.length}</span>
                      </p>
                      <button type="button" className="shrink-0 text-xs font-semibold text-pitanga hover:underline" onClick={() => marcarGrupo(ids, !todos)}>
                        {todos ? "Desmarcar a etapa" : "Marcar a etapa"}
                      </button>
                    </div>
                    <ul className="divide-y divide-linha">
                      {g.itens.map(({ item, feitoNoMes, pagoNoMes }) => (
                        <li key={item.id}>
                          <label className="linha-hover flex cursor-pointer items-start gap-3 px-3.5 py-2.5">
                            <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[#d23a1f]" checked={!fora.has(item.id)} onChange={() => alternar(item.id)} />
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm leading-snug text-ink">{item.descricao}</span>
                              {item.ambiente && item.ambiente !== "Geral" && <span className="block text-xs text-ink/45">{item.ambiente}</span>}
                            </span>
                            <span className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center">
                              {feitoNoMes && <Selo cor="bg-ink text-white">Executado {dia(item.feitoEm)}</Selo>}
                              {pagoNoMes && <Selo cor="bg-emerald-100 text-emerald-800">Pago {dia(item.pagoEm)}</Selo>}
                            </span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          {semData.length > 0 && (
            <details className="mt-3 rounded-2xl border border-dashed border-ink/30 px-3.5 py-2.5">
              <summary className="cursor-pointer text-[13px] font-medium text-ink/70">
                {semData.length} {semData.length === 1 ? "item marcado" : "itens marcados"} antes de o app guardar a data
              </summary>
              <p className="mt-2 text-xs leading-snug text-ink/50">Não dá para saber em que mês aconteceram. Marque os que você quer incluir neste relatório.</p>
              <ul className="mt-2 max-h-48 divide-y divide-linha overflow-y-auto">
                {semData.map((item) => (
                  <li key={item.id}>
                    <label className="flex cursor-pointer items-start gap-3 py-2">
                      <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[#d23a1f]" checked={incluirSemData.has(item.id)} onChange={() => alternarSemData(item.id)} />
                      <span className="min-w-0 flex-1 text-sm leading-snug text-ink">
                        {item.descricao} <span className="text-xs text-ink/45">· {item.etapa}</span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>

        {/* 3. O que contar */}
        <section className="space-y-3">
          <Numero n={3}>Conte o que importa</Numero>
          <div>
            <label className="rotulo-tec mb-1 block text-ink/55" htmlFor="rel-destaques">
              Destaques do mês (opcional)
            </label>
            <textarea
              id="rel-destaques"
              className={`${campo} resize-none`}
              rows={3}
              value={destaques}
              onChange={(e) => setDestaques(e.target.value)}
              placeholder="Ex.: concluímos a alvenaria e a instalação elétrica; as esquadrias chegaram"
            />
          </div>
          <div>
            <label className="rotulo-tec mb-1 block text-ink/55" htmlFor="rel-proximos">
              Próximos passos (opcional)
            </label>
            <textarea
              id="rel-proximos"
              className={`${campo} resize-none`}
              rows={2}
              value={proximos}
              onChange={(e) => setProximos(e.target.value)}
              placeholder="Ex.: início do revestimento dos banheiros; visita técnica no dia 12"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink/80">
            <input type="checkbox" className="h-4 w-4 accent-[#d23a1f]" checked={comValores} onChange={(e) => setComValores(e.target.checked)} />
            Mostrar os valores em R$ no relatório
          </label>
        </section>

        <div className="flex gap-2">
          <button className="btn btn-linha flex-1 px-4 py-3 text-sm" onClick={onFechar}>
            Cancelar
          </button>
          <button className="btn btn-primario flex-1 px-4 py-3 text-sm" disabled={nada} onClick={() => setGerando(true)}>
            Gerar relatório de {rotuloDoMes(mes)}
          </button>
        </div>
        {nada && <p className="-mt-3 text-center text-xs text-ink/45">Inclua pelo menos um item ou escreva os destaques para gerar.</p>}
      </div>

      {gerando && (
        <RelatorioDocumento
          onFechar={() => setGerando(false)}
          mes={mes}
          executados={executados}
          pagos={pagos}
          progresso={progresso}
          destaques={destaques}
          proximos={proximos}
          comValores={comValores}
          itens={itens}
        />
      )}
    </Modal>
  );
}

// ---------- Documento (PDF) ----------

interface PropsDocumento {
  onFechar: () => void;
  mes: Mes;
  executados: Item[];
  pagos: Item[];
  progresso: Progresso;
  destaques: string;
  proximos: string;
  comValores: boolean;
  itens: Item[];
}

function Paragrafos({ texto }: { texto: string }) {
  return (
    <div className="mt-2 space-y-2 text-sm leading-relaxed text-ink/85">
      {texto
        .split(/\n{1,}/)
        .filter((p) => p.trim())
        .map((p, i) => (
          <p key={i}>{p}</p>
        ))}
    </div>
  );
}

/** O relatório pronto para imprimir ou salvar em PDF, com a marca do escritório. */
function RelatorioDocumento({ onFechar, mes, executados, pagos, progresso, destaques, proximos, comValores, itens }: PropsDocumento) {
  const { config, previsoes } = useData();
  const hoje = useHoje();
  const rotulo = maiuscula(rotuloDoMes(mes));
  const { inicio, fim } = limitesDoMes(mes);

  const concluidos = itens.filter((i) => i.feito && i.pago).length;
  const pctConcluido = itens.length > 0 ? Math.round((concluidos / itens.length) * 100) : 0;
  const prazo = situacaoDoPrazo(previsoes, hoje, pctConcluido);
  const novasNoMes = previsoes.filter((p) => p.numero > 1 && p.registradaEm >= inicio && p.registradaEm < fim);

  const gruposExecutados = porEtapa(executados.map((item) => ({ item })));
  const total = totalPago(pagos);

  return (
    <DocumentoBase onFechar={onFechar} titulo="Relatório mensal de andamento" etapaRotulo={rotulo} nomeArquivo={`Relatório de andamento - ${config.nomeObra} - ${chaveDoMes(mes)}`}>
      <section className="mt-8">
        <TituloSecao>Resumo do mês</TituloSecao>
        <dl className="mt-3 grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="rotulo-tec text-ink/50">Serviços executados</dt>
            <dd className="mt-0.5 font-mono text-lg font-semibold">{executados.length}</dd>
          </div>
          <div>
            <dt className="rotulo-tec text-ink/50">Execução do projeto</dt>
            <dd className="mt-0.5 font-mono text-lg font-semibold">
              {progresso.antes}% → {progresso.depois}%
            </dd>
            {progresso.depois !== progresso.antes && <dd className="text-xs text-ink/55">+{progresso.depois - progresso.antes} pontos no mês</dd>}
          </div>
          <div>
            <dt className="rotulo-tec text-ink/50">{comValores ? "Pagamentos no mês" : "Itens pagos no mês"}</dt>
            <dd className="mt-0.5 font-mono text-lg font-semibold">{comValores ? brl(total) : pagos.length}</dd>
            {comValores && <dd className="text-xs text-ink/55">{pagos.length} {pagos.length === 1 ? "item" : "itens"}</dd>}
          </div>
        </dl>
      </section>

      {prazo && (
        <section className="mt-8 break-inside-avoid">
          <TituloSecao>Prazo</TituloSecao>
          <p className="mt-2 text-sm text-ink/85">
            Término previsto em <strong className="font-semibold">{dataLonga(prazo.vigente.termino)}</strong> · {textoDeTempo(prazo).toLowerCase()}.
          </p>
          {prazo.novasPrevisoes > 0 && (
            <p className="mt-1 text-sm text-ink/70">
              Previsão atual: nova previsão ({prazo.vigente.numero}ª). O prazo original era {dataCurta(prazo.original.termino)}, e a nova previsão tem {textoDeDiferenca(prazo.desvioDias)}.
            </p>
          )}
          {novasNoMes.map((p) => (
            <p key={p.id} className="mt-1 text-sm text-ink/70">
              Nova previsão registrada em {dataLonga(p.registradaEm)}
              {p.motivo ? `: ${p.motivo}` : "."}
            </p>
          ))}
        </section>
      )}

      {destaques.trim() && (
        <section className="mt-8 break-inside-avoid">
          <TituloSecao>Destaques do mês</TituloSecao>
          <Paragrafos texto={destaques} />
        </section>
      )}

      <section className="mt-8">
        <TituloSecao>Serviços executados em {rotuloDoMes(mes)}</TituloSecao>
        {executados.length === 0 ? (
          <p className="py-3 text-sm text-ink/50">Nenhum serviço incluído.</p>
        ) : (
          gruposExecutados.map((g) => (
            <div key={g.etapa} className="mt-3 break-inside-avoid">
              <p className="text-[13px] font-semibold text-ink">{g.etapa}</p>
              <table className="mt-1 w-full text-sm">
                <tbody>
                  {g.itens.map(({ item }) => (
                    <tr key={item.id} className="break-inside-avoid border-t border-linha align-top">
                      <td className="py-1.5 pr-2">
                        {item.descricao}
                        {item.ambiente && item.ambiente !== "Geral" && <span className="block text-xs text-ink/50">{item.ambiente}</span>}
                      </td>
                      <td className="w-20 py-1.5 text-right font-mono text-ink/60">{item.feitoEm ? dia(item.feitoEm) : "sem data"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        )}
      </section>

      {pagos.length > 0 && (
        <section className="mt-8">
          <TituloSecao>Pagamentos em {rotuloDoMes(mes)}</TituloSecao>
          <table className="mt-2 w-full text-sm">
            <tbody>
              {pagos.map((item) => (
                <tr key={item.id} className="break-inside-avoid border-t border-linha align-top">
                  <td className="py-1.5 pr-2">
                    {item.descricao}
                    <span className="block text-xs text-ink/50">{item.etapa}</span>
                  </td>
                  <td className="w-16 py-1.5 text-right font-mono text-ink/60">{item.pagoEm ? dia(item.pagoEm) : "sem data"}</td>
                  {comValores && <td className="w-28 py-1.5 text-right font-mono">{brl(item.valorReal > 0 ? item.valorReal : item.valorOrcado)}</td>}
                </tr>
              ))}
              {comValores && (
                <tr className="border-t border-ink">
                  <td colSpan={2} className="py-1.5 text-right text-xs font-semibold uppercase tracking-wider text-ink/60">
                    Total pago no mês
                  </td>
                  <td className="py-1.5 text-right font-mono font-semibold">{brl(total)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      )}

      {proximos.trim() && (
        <section className="mt-8 break-inside-avoid">
          <TituloSecao>Próximos passos</TituloSecao>
          <Paragrafos texto={proximos} />
        </section>
      )}
    </DocumentoBase>
  );
}
