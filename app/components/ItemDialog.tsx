"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "./Modal";
import { Botao } from "./ui/Botao";
import { useData } from "@/lib/data";
import { useArquiteto } from "@/lib/arquiteto";
import { useDinheiro } from "@/lib/privacidade";
import { useColecaoPessoal } from "@/lib/colecaoPessoal";
import type { CatalogoItem, Fornecedor, Item } from "@/lib/types";

const VAZIO = {
  etapa: "",
  ambiente: "",
  descricao: "",
  unidade: "",
  quantidade: "1",
  valorUnitario: "",
  valorOrcado: "",
  valorReal: "",
  fornecedor: "",
  observacao: "",
  prazo: "",
  feito: false,
  pago: false,
};

/** Timestamp do prazo (fim do dia) → "AAAA-MM-DD" para o campo de data. */
function deData(ms?: number): string {
  if (!ms) return "";
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
/** "AAAA-MM-DD" → fim desse dia no horário local; vazio = sem prazo. */
function paraPrazo(texto: string): number | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59).getTime() : undefined;
}

export function ItemDialog({
  aberto,
  onFechar,
  item,
  etapas,
  ambientes,
  inicial,
}: {
  aberto: boolean;
  onFechar: () => void;
  item?: Item | null;
  etapas: string[];
  ambientes: string[];
  /** Ao criar: etapa e/ou ambiente já preenchidos (ex.: o botão "+" de uma etapa). */
  inicial?: { etapa?: string; ambiente?: string } | null;
}) {
  const { addItem, updateItem } = useData();
  const [form, setForm] = useState(VAZIO);
  const [salvando, setSalvando] = useState(false);
  const { catalogo, salvarItem: salvarNoCatalogo } = useArquiteto();
  const { brl } = useDinheiro();
  const { itens: fornecedores } = useColecaoPessoal<Fornecedor>("fornecedores", (a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const [buscaCat, setBuscaCat] = useState("");
  const [guardar, setGuardar] = useState(false);
  const [mais, setMais] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [lancados, setLancados] = useState(0);
  const descricaoRef = useRef<HTMLInputElement>(null);

  const sugestoes = useMemo(() => {
    const q = buscaCat.trim().toLowerCase();
    if (!q) return [];
    return catalogo.filter((c) => `${c.descricao} ${c.etapa}`.toLowerCase().includes(q)).slice(0, 5);
  }, [catalogo, buscaCat]);

  function usarDoCatalogo(c: CatalogoItem) {
    const q = Number(form.quantidade) || 1;
    setForm({
      ...form,
      descricao: c.descricao,
      unidade: c.unidade,
      etapa: form.etapa.trim() || c.etapa,
      quantidade: String(q),
      valorUnitario: c.valorUnitario ? String(c.valorUnitario) : "",
      valorOrcado: c.valorUnitario ? String(Math.round(q * c.valorUnitario * 100) / 100) : form.valorOrcado,
    });
    setBuscaCat("");
  }

  useEffect(() => {
    if (!aberto) return;
    setBuscaCat("");
    setGuardar(false);
    setFeedback("");
    setLancados(0);
    setMais(Boolean(item && (item.ambiente !== "Geral" || item.fornecedor || item.observacao || item.prazo || item.valorReal > 0 || item.feito || item.pago)) || Boolean(!item && inicial?.ambiente));
    if (item) {
      setForm({
        etapa: item.etapa,
        ambiente: item.ambiente,
        descricao: item.descricao,
        unidade: item.unidade ?? "",
        quantidade: String(item.quantidade ?? 1),
        valorUnitario: item.valorUnitario ? String(item.valorUnitario) : "",
        valorOrcado: String(item.valorOrcado ?? ""),
        valorReal: item.valorReal ? String(item.valorReal) : "",
        fornecedor: item.fornecedor ?? "",
        observacao: item.observacao ?? "",
        prazo: deData(item.prazo),
        feito: item.feito,
        pago: item.pago,
      });
    } else {
      setForm({ ...VAZIO, etapa: inicial?.etapa ?? "", ambiente: inicial?.ambiente ?? "" });
    }
  }, [aberto, item, inicial]);

  // Atualiza qtd/unit e recalcula o orçado automaticamente.
  function setQtdUnit(campo: "quantidade" | "valorUnitario", valor: string) {
    const novo = { ...form, [campo]: valor };
    const q = Number(campo === "quantidade" ? valor : novo.quantidade) || 0;
    const u = Number(campo === "valorUnitario" ? valor : novo.valorUnitario) || 0;
    if (q && u) novo.valorOrcado = String(q * u);
    setForm(novo);
  }

  const valido = form.etapa.trim() && form.descricao.trim();

  // Editando: o novo valor (real, ou orçado) é maior ou menor que o atual? A janela avisa antes de salvar.
  const valorNovo = Number(form.valorReal) > 0 ? Number(form.valorReal) : Number(form.valorOrcado) || 0;
  const valorAtual = item ? (item.valorReal > 0 ? item.valorReal : item.valorOrcado) : null;
  const difValor = valorAtual === null ? 0 : Math.round((valorNovo - valorAtual) * 100) / 100;

  /** `continuar`: guarda e deixa a janela aberta para lançar o próximo item da mesma etapa. */
  async function salvar(continuar = false) {
    if (!valido || salvando) return;
    setSalvando(true);
    const dados = {
      etapaNum: item?.etapaNum ?? 0,
      etapa: form.etapa.trim(),
      ambiente: form.ambiente.trim() || "Geral",
      descricao: form.descricao.trim(),
      unidade: form.unidade.trim() || undefined,
      quantidade: Number(form.quantidade) || 0,
      valorUnitario: Number(form.valorUnitario) || 0,
      valorOrcado: Number(form.valorOrcado) || 0,
      valorReal: Number(form.valorReal) || 0,
      fornecedor: form.fornecedor.trim() || undefined,
      observacao: form.observacao.trim() || undefined,
      prazo: paraPrazo(form.prazo),
    };
    try {
      if (item) {
        // Só manda feito/pago se mudaram: reenviar regravaria a data (e o autor) da conclusão a cada edição.
        await updateItem(item.id, {
          ...dados,
          ...(form.feito !== item.feito ? { feito: form.feito } : {}),
          ...(form.pago !== item.pago ? { pago: form.pago } : {}),
        });
      } else {
        await addItem({ ...dados, feito: form.feito, pago: form.pago });
      }
      if (guardar) {
        await salvarNoCatalogo({
          descricao: dados.descricao,
          unidade: dados.unidade ?? "un",
          valorUnitario: dados.valorUnitario || (dados.quantidade > 0 ? Math.round((dados.valorOrcado / dados.quantidade) * 100) / 100 : dados.valorOrcado),
          etapa: dados.etapa,
        });
      }
      if (continuar && !item) {
        setForm({ ...VAZIO, etapa: dados.etapa, ambiente: form.ambiente });
        setBuscaCat("");
        setGuardar(false);
        setLancados((n) => n + 1);
        setFeedback(`“${dados.descricao}” adicionado. Pode lançar o próximo.`);
        descricaoRef.current?.focus();
      } else {
        onFechar();
      }
    } finally {
      setSalvando(false);
    }
  }

  const campo = "input-pit";
  const rotulo = "rotulo-campo";
  const dica = "mt-1 text-xs text-ink/50";

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={item ? "Editar item" : "Novo item"}>
      <div className="space-y-4">
        {feedback && (
          <p role="status" className="rounded-xl border border-emerald-600/30 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-900">
            ✓ {feedback}
          </p>
        )}

        {!item && catalogo.length > 0 && (
          <div>
            <label className={rotulo}>Buscar no meu catálogo</label>
            <input className={campo} placeholder="Digite para preencher com um item salvo…" value={buscaCat} onChange={(e) => setBuscaCat(e.target.value)} />
            {sugestoes.length > 0 && (
              <ul className="mt-1.5 divide-y divide-linha overflow-hidden rounded-xl border border-linha">
                {sugestoes.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => usarDoCatalogo(c)} className="linha-hover block w-full px-3 py-2 text-left">
                      <span className="block text-sm text-ink">{c.descricao}</span>
                      <span className="block text-xs text-ink/55">{brl(c.valorUnitario)} / {c.unidade || "un"}{c.etapa ? ` · ${c.etapa}` : ""}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div>
          <label className={rotulo}>Etapa</label>
          <input list="etapas" className={campo} placeholder="Ex.: Pintura" value={form.etapa} onChange={(e) => setForm({ ...form, etapa: e.target.value })} />
          <datalist id="etapas">{etapas.map((c) => <option key={c} value={c} />)}</datalist>
          {etapas.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5" role="group" aria-label="Etapas do projeto">
              {etapas.slice(0, 8).map((e) => {
                const ativa = form.etapa.trim().toLowerCase() === e.toLowerCase();
                return (
                  <button
                    key={e}
                    type="button"
                    aria-pressed={ativa}
                    onClick={() => setForm({ ...form, etapa: e })}
                    className={`clicavel rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${ativa ? "border-ink bg-ink text-white" : "border-ink/20 bg-white text-ink/70 hover:border-ink/50 hover:text-ink"}`}
                  >
                    {e}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <label className={rotulo}>Descrição</label>
          <input ref={descricaoRef} className={campo} placeholder="Ex.: Tinta acrílica 18L" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        </div>

        <div className="grid grid-cols-[1fr_0.9fr_1.4fr] gap-2">
          <div>
            <label className={rotulo}>Qtd.</label>
            <input type="number" inputMode="decimal" aria-label="Quantidade" className={campo} value={form.quantidade} onChange={(e) => setQtdUnit("quantidade", e.target.value)} />
          </div>
          <div>
            <label className={rotulo}>Unid.</label>
            <input list="unidades-item" className={campo} placeholder="un" value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} />
            <datalist id="unidades-item">{["un", "m²", "m", "m³", "kg", "vb", "h", "dia", "pç"].map((u) => <option key={u} value={u} />)}</datalist>
          </div>
          <div>
            <label className={rotulo}>Valor unit.</label>
            <input type="number" inputMode="decimal" aria-label="Valor unitário" className={campo} placeholder="0,00" value={form.valorUnitario} onChange={(e) => setQtdUnit("valorUnitario", e.target.value)} />
          </div>
        </div>

        <div className="rounded-2xl bg-ink/[0.04] p-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-semibold text-ink" htmlFor="item-total">
              Total do item (R$)
            </label>
            <input
              id="item-total"
              type="number"
              inputMode="decimal"
              aria-label="Valor orçado"
              className={`${campo} max-w-[10rem] text-right font-mono font-semibold`}
              placeholder="0,00"
              value={form.valorOrcado}
              onChange={(e) => setForm({ ...form, valorOrcado: e.target.value })}
            />
          </div>
          <p className={dica}>É calculado sozinho (quantidade × valor unitário). Se o valor for fechado, como uma verba ou empreitada, digite o total direto.</p>
          {valorAtual !== null && difValor !== 0 && (
            <p role="status" className={`mt-2 rounded-lg px-3 py-2 text-sm font-medium ${difValor > 0 ? "bg-pitanga/10 text-pitanga-escuro" : "bg-emerald-50 text-emerald-800"}`}>
              {difValor > 0 ? "▲" : "▼"} {brl(Math.abs(difValor))} {difValor > 0 ? "a mais" : "a menos"} que o valor atual ({brl(valorAtual)}). Novo valor: {brl(valorNovo)}.
            </p>
          )}
        </div>

        <div>
          <button
            type="button"
            aria-expanded={mais}
            onClick={() => setMais((m) => !m)}
            className="clicavel flex w-full items-center justify-between rounded-xl border border-dashed border-ink/25 px-3 py-2.5 text-left text-sm font-medium text-ink/75 hover:border-ink/50 hover:text-ink"
          >
            <span>{mais ? "Menos detalhes" : "Mais detalhes"}<span className="font-normal text-ink/50"> · ambiente, fornecedor, prazo, valor real…</span></span>
            <span aria-hidden className="font-mono text-xs text-ink/50">{mais ? "−" : "+"}</span>
          </button>

          {mais && (
            <div className="mt-4 space-y-4">
              <div>
                <label className={rotulo}>Ambiente</label>
                <input list="ambientes" className={campo} placeholder="Ex.: Cozinha" value={form.ambiente} onChange={(e) => setForm({ ...form, ambiente: e.target.value })} />
                <datalist id="ambientes">{ambientes.map((c) => <option key={c} value={c} />)}</datalist>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className={rotulo}>Fornecedor (opcional)</label>
                  <input list="fornecedores-item" className={campo} value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} />
                  <datalist id="fornecedores-item">{fornecedores.map((f) => <option key={f.id} value={f.nome} />)}</datalist>
                </div>
                <div>
                  <label className={rotulo}>Prazo de entrega (opcional)</label>
                  <input type="date" className={campo} value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} />
                </div>
              </div>
              <p className={`${dica} -mt-2`}>Fornecedor e prazo alimentam o histórico de entregas em Fornecedores, na home.</p>

              <div>
                <label className={rotulo}>Valor real (R$)</label>
                <input type="number" inputMode="decimal" aria-label="Valor real" className={campo} placeholder="0,00" value={form.valorReal} onChange={(e) => setForm({ ...form, valorReal: e.target.value })} />
                <p className={dica}>Quanto realmente custou. Se ficar vazio, vale o valor orçado.</p>
              </div>

              <div>
                <label className={rotulo}>Observação (opcional)</label>
                <textarea className={`${campo} resize-none`} rows={2} value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  aria-pressed={form.feito}
                  title="Serviço executado"
                  onClick={() => setForm({ ...form, feito: !form.feito })}
                  className={`btn clicavel flex-1 border px-3 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider ${form.feito ? "border-ink bg-ink text-white" : "border-ink/25 bg-white text-ink/55 hover:border-ink hover:text-ink"}`}
                >
                  {form.feito ? "✓ " : ""}Feito
                </button>
                <button
                  type="button"
                  aria-pressed={form.pago}
                  title="Valor já pago"
                  onClick={() => setForm({ ...form, pago: !form.pago })}
                  className={`btn clicavel flex-1 border px-3 py-2.5 font-mono text-xs font-semibold uppercase tracking-wider ${form.pago ? "border-emerald-600 bg-emerald-600 text-white" : "border-ink/25 bg-white text-ink/55 hover:border-ink hover:text-ink"}`}
                >
                  {form.pago ? "✓ " : ""}Pago
                </button>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink/80">
                <input type="checkbox" className="h-4 w-4 accent-[#d23a1f]" checked={guardar} onChange={(e) => setGuardar(e.target.checked)} />
                Guardar no meu catálogo para usar em outros projetos
              </label>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Botao variante="primario" tamanho="grande" className="w-full" onClick={() => salvar(false)} disabled={!valido || salvando}>
            {salvando ? "Salvando..." : item ? "Salvar alterações" : lancados > 0 ? "Adicionar e fechar" : "Adicionar item"}
          </Botao>
          {!item && (
            <Botao className="w-full" onClick={() => salvar(true)} disabled={!valido || salvando}>
              Adicionar e lançar outro
            </Botao>
          )}
          {!item && lancados > 0 && <p className="text-center text-xs text-ink/50">{lancados} {lancados === 1 ? "item lançado" : "itens lançados"} nesta janela</p>}
        </div>
      </div>
    </Modal>
  );
}
