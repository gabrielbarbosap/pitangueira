"use client";

import { useMemo, useState } from "react";
import { Modal } from "./Modal";
import { useConfirm } from "./ConfirmProvider";
import { IconeBusca, IconeEditar, IconeLixo } from "./Icones";
import { useArquiteto } from "@/lib/arquiteto";
import { useColecaoPessoal } from "@/lib/colecaoPessoal";
import { calcularComposicao, valorDoInsumo } from "@/lib/composicoes";
import { useDinheiro } from "@/lib/privacidade";
import { ROTULO_INSUMO, type CatalogoItem, type Composicao, type InsumoComposicao, type TipoInsumo } from "@/lib/types";

const campo = "campo-pit w-full border border-ink/25 bg-white px-3 py-2.5 text-sm text-ink outline-none";
const campoPeq = "campo-pit w-full border border-ink/25 bg-white px-2.5 py-2 text-sm text-ink outline-none";
const rotulo = "rotulo-tec mb-1 block text-ink/55";

const UNIDADES = ["m²", "m", "m³", "un", "kg", "vb", "h", "dia", "pç"];
const num = (s: string) => Number(String(s).replace(",", ".")) || 0;

/** Insumo em edição: números como texto, para dar para digitar "0," sem a vírgula sumir. */
interface InsumoDraft {
  id: string;
  descricao: string;
  unidade: string;
  quantidade: string;
  valorUnitario: string;
  tipo: TipoInsumo;
  catalogoId?: string;
}
interface Form {
  id?: string;
  createdAt?: number;
  nome: string;
  unidade: string;
  etapa: string;
  insumos: InsumoDraft[];
  bdi: string;
  margem: string;
}

const paraInsumo = (d: InsumoDraft): InsumoComposicao => ({
  id: d.id,
  descricao: d.descricao.trim(),
  unidade: d.unidade.trim() || "un",
  quantidade: num(d.quantidade),
  valorUnitario: num(d.valorUnitario),
  tipo: d.tipo,
  ...(d.catalogoId ? { catalogoId: d.catalogoId } : {}),
});

/**
 * Composições de custo do arquiteto: um serviço (ex.: 1 m² de pintura) feito de insumos
 * (tinta, massa, mão de obra), com BDI e margem dele. Com `onAdicionar`, cada composição
 * entra no orçamento do projeto com a quantidade informada.
 */
export function ComposicoesDialog({
  aberto,
  onFechar,
  etapas = [],
  onAdicionar,
}: {
  aberto: boolean;
  onFechar: () => void;
  etapas?: string[];
  onAdicionar?: (c: Composicao, quantidade: number, precoUnitario: number) => Promise<void>;
}) {
  const { catalogo, parametros, salvarParametros } = useArquiteto();
  const { itens: composicoes, salvar, remover } = useColecaoPessoal<Composicao>("composicoes", (a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const { brl } = useDinheiro();
  const confirmar = useConfirm();

  const [busca, setBusca] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [padrao, setPadrao] = useState(false);
  const [buscaCat, setBuscaCat] = useState("");
  const [qtds, setQtds] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return q ? composicoes.filter((c) => `${c.nome} ${c.etapa}`.toLowerCase().includes(q)) : composicoes;
  }, [composicoes, busca]);

  const sugestoes = useMemo(() => {
    const q = buscaCat.trim().toLowerCase();
    return q ? catalogo.filter((c) => `${c.descricao} ${c.etapa}`.toLowerCase().includes(q)).slice(0, 5) : [];
  }, [catalogo, buscaCat]);

  function novo() {
    setPadrao(false);
    setBuscaCat("");
    setForm({ nome: "", unidade: "m²", etapa: "", insumos: [], bdi: String(parametros.bdi), margem: String(parametros.margem) });
  }
  function editar(c: Composicao) {
    setPadrao(false);
    setBuscaCat("");
    setForm({
      id: c.id,
      createdAt: c.createdAt,
      nome: c.nome,
      unidade: c.unidade,
      etapa: c.etapa,
      insumos: c.insumos.map((i) => ({ ...i, quantidade: String(i.quantidade), valorUnitario: String(i.valorUnitario) })),
      bdi: String(c.bdi),
      margem: String(c.margem),
    });
  }

  const set = (patch: Partial<Form>) => setForm((f) => (f ? { ...f, ...patch } : f));
  const setInsumo = (id: string, patch: Partial<InsumoDraft>) => setForm((f) => (f ? { ...f, insumos: f.insumos.map((i) => (i.id === id ? { ...i, ...patch } : i)) } : f));
  const addInsumo = (d?: Partial<InsumoDraft>) =>
    setForm((f) =>
      f ? { ...f, insumos: [...f.insumos, { id: crypto.randomUUID(), descricao: "", unidade: "un", quantidade: "1", valorUnitario: "", tipo: "material", ...d }] } : f,
    );
  const doCatalogo = (c: CatalogoItem) => {
    addInsumo({ descricao: c.descricao, unidade: c.unidade || "un", valorUnitario: String(c.valorUnitario), catalogoId: c.id });
    setBuscaCat("");
  };

  const resultado = useMemo(
    () => (form ? calcularComposicao({ insumos: form.insumos.map(paraInsumo), bdi: num(form.bdi), margem: num(form.margem) }, catalogo) : null),
    [form, catalogo],
  );

  async function gravar() {
    if (!form || !form.nome.trim() || ocupado) return;
    setOcupado(true);
    try {
      await salvar({
        ...(form.id ? { id: form.id } : {}),
        ...(form.createdAt ? { createdAt: form.createdAt } : {}),
        nome: form.nome.trim(),
        unidade: form.unidade.trim() || "un",
        etapa: form.etapa.trim(),
        insumos: form.insumos.filter((i) => i.descricao.trim()).map(paraInsumo),
        bdi: num(form.bdi),
        margem: num(form.margem),
      });
      if (padrao) await salvarParametros({ bdi: num(form.bdi), margem: num(form.margem) });
      setForm(null);
    } finally {
      setOcupado(false);
    }
  }

  async function excluir(c: Composicao) {
    const ok = await confirmar({ titulo: "Remover composição", mensagem: `Remover "${c.nome}"? Os orçamentos que já a usam não mudam.`, confirmar: "Remover", tom: "perigo" });
    if (ok) await remover(c.id);
  }

  async function adicionar(c: Composicao, preco: number) {
    if (!onAdicionar) return;
    const q = num(qtds[c.id] ?? "1");
    if (q <= 0) return;
    setOcupado(true);
    try {
      await onAdicionar(c, q, preco);
      setAviso(`“${c.nome}” adicionada ao orçamento.`);
      setQtds((s) => ({ ...s, [c.id]: "1" }));
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={form ? (form.id ? "Editar composição" : "Nova composição") : "Composições de custo"} largo>
      {form && resultado ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_110px]">
            <div>
              <label className={rotulo}>Serviço</label>
              <input className={campo} value={form.nome} onChange={(e) => set({ nome: e.target.value })} placeholder="Ex.: Pintura acrílica em parede (2 demãos)" autoFocus />
            </div>
            <div>
              <label className={rotulo}>Por</label>
              <input list="unid-comp" className={campo} value={form.unidade} onChange={(e) => set({ unidade: e.target.value })} />
              <datalist id="unid-comp">{UNIDADES.map((u) => <option key={u} value={u} />)}</datalist>
            </div>
          </div>
          <div>
            <label className={rotulo}>Etapa do orçamento</label>
            <input list="etapas-comp" className={campo} value={form.etapa} onChange={(e) => set({ etapa: e.target.value })} placeholder="Ex.: Pintura" />
            <datalist id="etapas-comp">{etapas.map((e) => <option key={e} value={e} />)}</datalist>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="rotulo-tec text-ink">Insumos para 1 {form.unidade || "unidade"}</p>
              <button type="button" className="btn btn-linha rounded-full px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider" onClick={() => addInsumo()}>
                + Insumo
              </button>
            </div>

            {catalogo.length > 0 && (
              <div className="mb-2">
                <input className={campo} value={buscaCat} onChange={(e) => setBuscaCat(e.target.value)} placeholder="Buscar insumo no meu catálogo (o preço acompanha o catálogo)…" />
                {sugestoes.length > 0 && (
                  <ul className="mt-1.5 divide-y divide-linha overflow-hidden rounded-xl border border-linha">
                    {sugestoes.map((c) => (
                      <li key={c.id}>
                        <button type="button" onClick={() => doCatalogo(c)} className="linha-hover block w-full px-3 py-2 text-left">
                          <span className="block text-sm text-ink">{c.descricao}</span>
                          <span className="block text-xs text-ink/55">{brl(c.valorUnitario)} / {c.unidade || "un"}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {form.insumos.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-ink/30 px-4 py-6 text-center text-sm text-ink/55">
                Nenhum insumo ainda. Adicione tinta, massa, mão de obra… e a quantidade que entra em 1 {form.unidade || "unidade"}.
              </p>
            ) : (
              <ul className="space-y-2">
                {form.insumos.map((i) => {
                  const doCat = Boolean(i.catalogoId && catalogo.some((c) => c.id === i.catalogoId));
                  const sub = num(i.quantidade) * valorDoInsumo(paraInsumo(i), catalogo);
                  return (
                    <li key={i.id} className="space-y-2 rounded-2xl border border-linha bg-papel/50 p-3">
                      <div className="flex items-center gap-2">
                        <input className={campoPeq} value={i.descricao} onChange={(e) => setInsumo(i.id, { descricao: e.target.value })} placeholder="Ex.: Tinta acrílica" aria-label="Descrição do insumo" />
                        <button type="button" className="btn btn-icone perigo h-8 w-8 shrink-0" onClick={() => set({ insumos: form.insumos.filter((x) => x.id !== i.id) })} aria-label="Remover insumo" title="Remover insumo">
                          <IconeLixo />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1.3fr_0.8fr_0.8fr_1fr_auto]">
                        <select className={campoPeq} value={i.tipo} onChange={(e) => setInsumo(i.id, { tipo: e.target.value as TipoInsumo })} aria-label="Tipo do insumo">
                          {(Object.keys(ROTULO_INSUMO) as TipoInsumo[]).map((t) => (
                            <option key={t} value={t}>{ROTULO_INSUMO[t]}</option>
                          ))}
                        </select>
                        <input type="number" inputMode="decimal" className={campoPeq} value={i.quantidade} onChange={(e) => setInsumo(i.id, { quantidade: e.target.value })} aria-label="Quantidade por unidade" placeholder="Qtd." />
                        <input list="unid-comp" className={campoPeq} value={i.unidade} onChange={(e) => setInsumo(i.id, { unidade: e.target.value })} aria-label="Unidade do insumo" placeholder="Unid." />
                        <input
                          type="number"
                          inputMode="decimal"
                          className={`${campoPeq} ${doCat ? "bg-ink/[0.04] text-ink/60" : ""}`}
                          value={doCat ? String(valorDoInsumo(paraInsumo(i), catalogo)) : i.valorUnitario}
                          onChange={(e) => setInsumo(i.id, { valorUnitario: e.target.value })}
                          readOnly={doCat}
                          aria-label="Valor unitário"
                          placeholder="Valor unit."
                          title={doCat ? "Vem do catálogo: para mudar, edite no catálogo" : undefined}
                        />
                        <p className="col-span-2 self-center text-right font-mono text-xs text-ink/60 sm:col-span-1 sm:min-w-[80px]">{brl(sub)}</p>
                      </div>
                      {doCat && <p className="text-[11px] text-emerald-700">Preço do catálogo: acompanha quando o valor de lá mudar.</p>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={rotulo}>BDI (%)</label>
              <input type="number" inputMode="decimal" className={campo} value={form.bdi} onChange={(e) => set({ bdi: e.target.value })} />
              <p className="mt-1 text-xs text-ink/50">Despesas indiretas, impostos e administração.</p>
            </div>
            <div>
              <label className={rotulo}>Margem de lucro (%)</label>
              <input type="number" inputMode="decimal" className={campo} value={form.margem} onChange={(e) => set({ margem: e.target.value })} />
              <p className="mt-1 text-xs text-ink/50">Aplicada sobre o custo com BDI.</p>
            </div>
          </div>

          <dl className="rounded-2xl border border-ink/80 bg-white p-4 text-sm">
            {(Object.keys(ROTULO_INSUMO) as TipoInsumo[])
              .filter((t) => resultado.porTipo[t] > 0)
              .map((t) => (
                <div key={t} className="flex justify-between py-0.5 text-ink/70">
                  <dt>{ROTULO_INSUMO[t]}</dt>
                  <dd className="font-mono">{brl(resultado.porTipo[t])}</dd>
                </div>
              ))}
            <div className="mt-1 flex justify-between border-t border-linha pt-1.5 font-medium text-ink">
              <dt>Custo direto</dt>
              <dd className="font-mono">{brl(resultado.custoDireto)}</dd>
            </div>
            <div className="flex justify-between py-0.5 text-ink/70">
              <dt>BDI ({num(form.bdi)}%)</dt>
              <dd className="font-mono">+ {brl(resultado.bdiValor)}</dd>
            </div>
            <div className="flex justify-between py-0.5 text-ink/70">
              <dt>Margem ({num(form.margem)}%)</dt>
              <dd className="font-mono">+ {brl(resultado.margemValor)}</dd>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between border-t-2 border-ink pt-2">
              <dt className="font-semibold text-ink">Preço por {form.unidade || "unidade"}</dt>
              <dd className="font-mono text-xl font-semibold text-pitanga">{brl(resultado.preco)}</dd>
            </div>
          </dl>

          <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-ink/80">
            <input type="checkbox" className="h-4 w-4 accent-[#d23a1f]" checked={padrao} onChange={(e) => setPadrao(e.target.checked)} />
            Usar este BDI e esta margem como padrão das próximas composições
          </label>

          <div className="flex gap-2">
            <button className="btn btn-linha flex-1 px-4 py-3 text-sm" onClick={() => setForm(null)}>Cancelar</button>
            <button className="btn btn-primario flex-1 px-4 py-3 text-sm" disabled={!form.nome.trim() || ocupado} onClick={gravar}>
              {ocupado ? "Salvando…" : "Salvar composição"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[13px] leading-snug text-ink/65">
            Monte um serviço a partir dos insumos (material, mão de obra, equipamento) e some o seu BDI e a sua margem. O preço de 1 unidade
            {onAdicionar ? " entra no orçamento com a quantidade que você informar." : " fica pronto para usar nos orçamentos."}
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-primario px-4 py-2.5 text-sm" onClick={novo}>+ Nova composição</button>
            <span className="text-xs text-ink/50">
              Padrão: BDI {parametros.bdi}% · margem {parametros.margem}%
            </span>
          </div>

          {aviso && <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-[13px] text-emerald-900">{aviso}</p>}

          {composicoes.length > 0 && (
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40"><IconeBusca /></span>
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar composição…" className="campo-pit w-full border border-ink/20 bg-white py-2.5 pl-11 pr-3 text-sm text-ink outline-none" />
            </div>
          )}

          {composicoes.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-ink/30 px-4 py-8 text-center text-sm text-ink/55">
              Nenhuma composição ainda. Crie a primeira, por exemplo “Pintura acrílica por m²”.
            </p>
          ) : filtradas.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink/55">Nenhuma composição para “{busca}”.</p>
          ) : (
            <ul className="divide-y divide-linha overflow-hidden rounded-2xl border border-linha">
              {filtradas.map((c) => {
                const r = calcularComposicao(c, catalogo);
                return (
                  <li key={c.id} className="space-y-2 px-3 py-2.5">
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium leading-snug text-ink">{c.nome}</p>
                        <p className="mt-0.5 text-xs text-ink/55">
                          <span className="font-mono font-semibold text-ink/80">{brl(r.preco)}</span> / {c.unidade} · {c.insumos.length} {c.insumos.length === 1 ? "insumo" : "insumos"}
                          {c.etapa ? ` · ${c.etapa}` : ""}
                        </p>
                        <p className="text-[11px] text-ink/40">custo {brl(r.custoDireto)} · BDI {c.bdi}% · margem {c.margem}%</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button className="btn btn-icone h-8 w-8" onClick={() => editar(c)} aria-label={`Editar ${c.nome}`} title="Editar"><IconeEditar /></button>
                        <button className="btn btn-icone perigo h-8 w-8" onClick={() => excluir(c)} aria-label={`Remover ${c.nome}`} title="Remover"><IconeLixo /></button>
                      </div>
                    </div>
                    {onAdicionar && (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          inputMode="decimal"
                          aria-label={`Quantidade de ${c.nome}`}
                          className="campo-pit w-24 border border-ink/25 bg-white px-3 py-2 text-sm text-ink outline-none"
                          value={qtds[c.id] ?? "1"}
                          onChange={(e) => setQtds((s) => ({ ...s, [c.id]: e.target.value }))}
                        />
                        <span className="text-xs text-ink/55">{c.unidade}</span>
                        <button className="btn btn-linha ml-auto px-3 py-2 text-xs font-semibold" disabled={ocupado} onClick={() => adicionar(c, r.preco)}>
                          Adicionar ao orçamento
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
}
