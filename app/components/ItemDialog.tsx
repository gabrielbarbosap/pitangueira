"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import { useData } from "@/lib/data";
import { useArquiteto } from "@/lib/arquiteto";
import { useDinheiro } from "@/lib/privacidade";
import type { CatalogoItem, Item } from "@/lib/types";

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
  feito: false,
  pago: false,
};

export function ItemDialog({
  aberto,
  onFechar,
  item,
  etapas,
  ambientes,
}: {
  aberto: boolean;
  onFechar: () => void;
  item?: Item | null;
  etapas: string[];
  ambientes: string[];
}) {
  const { addItem, updateItem } = useData();
  const [form, setForm] = useState(VAZIO);
  const [salvando, setSalvando] = useState(false);
  const { catalogo, salvarItem: salvarNoCatalogo } = useArquiteto();
  const { brl } = useDinheiro();
  const [buscaCat, setBuscaCat] = useState("");
  const [guardar, setGuardar] = useState(false);

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
        feito: item.feito,
        pago: item.pago,
      });
    } else {
      setForm(VAZIO);
    }
  }, [aberto, item]);

  // Atualiza qtd/unit e recalcula o orçado automaticamente.
  function setQtdUnit(campo: "quantidade" | "valorUnitario", valor: string) {
    const novo = { ...form, [campo]: valor };
    const q = Number(campo === "quantidade" ? valor : novo.quantidade) || 0;
    const u = Number(campo === "valorUnitario" ? valor : novo.valorUnitario) || 0;
    if (q && u) novo.valorOrcado = String(q * u);
    setForm(novo);
  }

  const valido = form.etapa.trim() && form.descricao.trim();

  async function salvar() {
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
      feito: form.feito,
      pago: form.pago,
    };
    try {
      if (item) await updateItem(item.id, dados);
      else await addItem(dados);
      if (guardar) {
        await salvarNoCatalogo({
          descricao: dados.descricao,
          unidade: dados.unidade ?? "un",
          valorUnitario: dados.valorUnitario || (dados.quantidade > 0 ? Math.round((dados.valorOrcado / dados.quantidade) * 100) / 100 : dados.valorOrcado),
          etapa: dados.etapa,
        });
      }
      onFechar();
    } finally {
      setSalvando(false);
    }
  }

  const campo = "campo-pit w-full border border-ink/25 bg-white px-3 py-2.5 text-sm text-ink outline-none";
  const rotulo = "rotulo-tec mb-1 block text-ink/55";
  const dica = "mt-1 text-xs text-ink/50";

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={item ? "Editar item" : "Novo item"}>
      <div className="space-y-4">
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={rotulo}>Etapa</label>
            <input list="etapas" className={campo} placeholder="Ex.: Pintura" value={form.etapa} onChange={(e) => setForm({ ...form, etapa: e.target.value })} />
            <datalist id="etapas">{etapas.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div>
            <label className={rotulo}>Ambiente</label>
            <input list="ambientes" className={campo} placeholder="Ex.: Cozinha" value={form.ambiente} onChange={(e) => setForm({ ...form, ambiente: e.target.value })} />
            <datalist id="ambientes">{ambientes.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
        </div>

        <div>
          <label className={rotulo}>Descrição</label>
          <input className={campo} placeholder="Ex.: Tinta acrílica 18L" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        </div>

        <div className="grid grid-cols-[1fr_0.8fr_1.2fr_1.2fr] gap-2">
          <div>
            <label className={rotulo}>Qtd.</label>
            <input type="number" inputMode="decimal" className={campo} value={form.quantidade} onChange={(e) => setQtdUnit("quantidade", e.target.value)} />
          </div>
          <div>
            <label className={rotulo}>Unid.</label>
            <input list="unidades-item" className={campo} placeholder="un" value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} />
            <datalist id="unidades-item">{["un", "m²", "m", "m³", "kg", "vb", "h", "dia", "pç"].map((u) => <option key={u} value={u} />)}</datalist>
          </div>
          <div>
            <label className={rotulo}>Valor unit.</label>
            <input type="number" inputMode="decimal" className={campo} placeholder="0,00" value={form.valorUnitario} onChange={(e) => setQtdUnit("valorUnitario", e.target.value)} />
          </div>
          <div>
            <label className={rotulo}>Orçado</label>
            <input type="number" inputMode="decimal" className={campo} placeholder="0,00" value={form.valorOrcado} onChange={(e) => setForm({ ...form, valorOrcado: e.target.value })} />
          </div>
        </div>
        <p className={`${dica} -mt-2`}>O valor orçado é calculado (quantidade × unitário), mas você pode ajustar.</p>

        <div>
          <label className={rotulo}>Valor real (R$)</label>
          <input type="number" inputMode="decimal" className={campo} placeholder="0,00" value={form.valorReal} onChange={(e) => setForm({ ...form, valorReal: e.target.value })} />
          <p className={dica}>Quanto realmente custou. Se ficar vazio, vale o valor orçado.</p>
        </div>

        <div>
          <label className={rotulo}>Fornecedor (opcional)</label>
          <input className={campo} value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} />
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
          Guardar no meu catálogo para usar em outras obras
        </label>

        <button onClick={salvar} disabled={!valido || salvando} className="btn btn-primario w-full px-4 py-3 text-sm">
          {salvando ? "Salvando..." : item ? "Salvar alterações" : "Adicionar item"}
        </button>
      </div>
    </Modal>
  );
}
