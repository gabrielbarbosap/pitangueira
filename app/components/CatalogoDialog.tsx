"use client";

import { useMemo, useState } from "react";
import { Modal } from "./Modal";
import { useConfirm } from "./ConfirmProvider";
import { IconeBusca, IconeEditar, IconeLixo } from "./Icones";
import { useArquiteto } from "@/lib/arquiteto";
import { brl } from "@/lib/format";
import type { CatalogoItem, Item } from "@/lib/types";

const campo = "campo-pit w-full border border-ink/25 bg-white px-3 py-2.5 text-sm text-ink outline-none";
const rotulo = "rotulo-tec mb-1 block text-ink/55";

const UNIDADES = ["un", "m²", "m", "m³", "kg", "vb", "h", "dia", "pç"];

interface Form {
  descricao: string;
  unidade: string;
  valorUnitario: string;
  etapa: string;
}
const FORM_VAZIO: Form = { descricao: "", unidade: "un", valorUnitario: "", etapa: "" };

/**
 * Catálogo pessoal do arquiteto. Com `onAdicionar` (dentro de uma obra) cada linha ganha
 * quantidade + "Adicionar" ao orçamento; sem ele (home) serve só para gerenciar.
 */
export function CatalogoDialog({
  aberto,
  onFechar,
  etapas = [],
  itensObra,
  onAdicionar,
}: {
  aberto: boolean;
  onFechar: () => void;
  etapas?: string[];
  /** Itens da obra aberta: habilita "importar desta obra". */
  itensObra?: Item[];
  onAdicionar?: (c: CatalogoItem, quantidade: number) => Promise<void>;
}) {
  const { catalogo, salvarItem, removerItem, importar } = useArquiteto();
  const confirmar = useConfirm();
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<CatalogoItem | "novo" | null>(null);
  const [form, setForm] = useState<Form>(FORM_VAZIO);
  const [qtds, setQtds] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return catalogo;
    return catalogo.filter((c) => `${c.descricao} ${c.etapa} ${c.unidade}`.toLowerCase().includes(q));
  }, [catalogo, busca]);

  function abrirForm(c: CatalogoItem | "novo") {
    setEditando(c);
    setForm(c === "novo" ? FORM_VAZIO : { descricao: c.descricao, unidade: c.unidade, valorUnitario: c.valorUnitario ? String(c.valorUnitario) : "", etapa: c.etapa });
  }

  async function salvar() {
    if (!form.descricao.trim() || ocupado) return;
    setOcupado(true);
    try {
      await salvarItem(
        { descricao: form.descricao.trim(), unidade: form.unidade.trim() || "un", valorUnitario: Number(form.valorUnitario) || 0, etapa: form.etapa.trim() },
        editando && editando !== "novo" ? editando.id : undefined,
      );
      setEditando(null);
    } finally {
      setOcupado(false);
    }
  }

  async function remover(c: CatalogoItem) {
    const ok = await confirmar({
      titulo: "Remover do catálogo",
      mensagem: `Remover "${c.descricao}" do seu catálogo? Os orçamentos das obras não mudam.`,
      confirmar: "Remover",
      tom: "perigo",
    });
    if (ok) await removerItem(c.id);
  }

  async function importarDaObra() {
    if (!itensObra || ocupado) return;
    setOcupado(true);
    try {
      const lista = itensObra.map((i) => ({
        descricao: i.descricao,
        unidade: i.unidade || "un",
        valorUnitario: i.valorUnitario || (i.quantidade > 0 ? Math.round((i.valorOrcado / i.quantidade) * 100) / 100 : i.valorOrcado),
        etapa: i.etapa,
      }));
      const n = await importar(lista);
      setAviso(n > 0 ? `${n} ${n === 1 ? "item novo entrou" : "itens novos entraram"} no catálogo.` : "Nada novo para importar: tudo isso já está no catálogo.");
    } finally {
      setOcupado(false);
    }
  }

  async function adicionar(c: CatalogoItem) {
    if (!onAdicionar) return;
    const q = Number(qtds[c.id] ?? "1") || 0;
    if (q <= 0) return;
    setOcupado(true);
    try {
      await onAdicionar(c, q);
      setAviso(`“${c.descricao}” adicionado ao orçamento.`);
      setQtds((s) => ({ ...s, [c.id]: "1" }));
    } finally {
      setOcupado(false);
    }
  }

  const titulo = onAdicionar ? "Meu catálogo" : "Meu catálogo de itens";

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={titulo}>
      <div className="space-y-4">
        <p className="text-[13px] leading-snug text-ink/65">
          {onAdicionar
            ? "Seus itens com unidade e valor de referência. Informe a quantidade e toque em Adicionar para montar o orçamento sem redigitar."
            : "Itens com unidade e valor de referência, só seus. Dentro de cada obra você os adiciona ao orçamento com a quantidade."}
        </p>

        {editando ? (
          <div className="space-y-3 rounded-2xl border border-linha bg-papel/60 p-3">
            <div>
              <label className={rotulo}>Descrição</label>
              <input className={campo} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Ex.: Pintura acrílica em parede" autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={rotulo}>Unidade</label>
                <input list="unidades-cat" className={campo} value={form.unidade} onChange={(e) => setForm({ ...form, unidade: e.target.value })} />
                <datalist id="unidades-cat">{UNIDADES.map((u) => <option key={u} value={u} />)}</datalist>
              </div>
              <div>
                <label className={rotulo}>Valor unit. (R$)</label>
                <input type="number" inputMode="decimal" className={campo} value={form.valorUnitario} onChange={(e) => setForm({ ...form, valorUnitario: e.target.value })} placeholder="0,00" />
              </div>
            </div>
            <div>
              <label className={rotulo}>Etapa</label>
              <input list="etapas-cat" className={campo} value={form.etapa} onChange={(e) => setForm({ ...form, etapa: e.target.value })} placeholder="Ex.: Pintura" />
              <datalist id="etapas-cat">{etapas.map((e) => <option key={e} value={e} />)}</datalist>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-linha flex-1 px-4 py-2.5 text-sm" onClick={() => setEditando(null)}>Cancelar</button>
              <button className="btn btn-primario flex-1 px-4 py-2.5 text-sm" disabled={!form.descricao.trim() || ocupado} onClick={salvar}>
                {editando === "novo" ? "Salvar no catálogo" : "Salvar alterações"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primario px-4 py-2.5 text-sm" onClick={() => abrirForm("novo")}>+ Novo item</button>
            {itensObra && itensObra.length > 0 && (
              <button className="btn btn-linha px-4 py-2.5 text-sm" disabled={ocupado} onClick={importarDaObra} title="Copia os itens desta obra para o seu catálogo (sem repetir)">
                Importar desta obra
              </button>
            )}
          </div>
        )}

        {aviso && (
          <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-[13px] text-emerald-900">{aviso}</p>
        )}

        {catalogo.length > 0 && (
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40"><IconeBusca /></span>
            <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar no catálogo…" className="campo-pit w-full border border-ink/20 bg-white py-2.5 pl-11 pr-3 text-sm text-ink outline-none" />
          </div>
        )}

        {catalogo.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-ink/30 px-4 py-8 text-center text-sm text-ink/55">
            Seu catálogo está vazio. Crie itens ou {itensObra && itensObra.length > 0 ? "importe os desta obra" : "salve itens ao cadastrá-los em uma obra"} para reaproveitar depois.
          </p>
        ) : filtrados.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink/55">Nenhum item para “{busca}”.</p>
        ) : (
          <ul className="divide-y divide-linha overflow-hidden rounded-2xl border border-linha">
            {filtrados.map((c) => (
              <li key={c.id} className="space-y-2 px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-ink">{c.descricao}</p>
                    <p className="mt-0.5 text-xs text-ink/55">
                      <span className="font-mono">{brl(c.valorUnitario)}</span> / {c.unidade || "un"}
                      {c.etapa ? ` · ${c.etapa}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button className="btn btn-icone h-8 w-8" onClick={() => abrirForm(c)} aria-label={`Editar ${c.descricao}`} title="Editar"><IconeEditar /></button>
                    <button className="btn btn-icone perigo h-8 w-8" onClick={() => remover(c)} aria-label={`Remover ${c.descricao}`} title="Remover"><IconeLixo /></button>
                  </div>
                </div>
                {onAdicionar && (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      aria-label={`Quantidade de ${c.descricao}`}
                      className="campo-pit w-24 border border-ink/25 bg-white px-3 py-2 text-sm text-ink outline-none"
                      value={qtds[c.id] ?? "1"}
                      onChange={(e) => setQtds((s) => ({ ...s, [c.id]: e.target.value }))}
                    />
                    <span className="text-xs text-ink/55">{c.unidade || "un"}</span>
                    <button className="btn btn-linha ml-auto px-3 py-2 text-xs font-semibold" disabled={ocupado} onClick={() => adicionar(c)}>
                      Adicionar ao orçamento
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
