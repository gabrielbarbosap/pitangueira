"use client";

import { useMemo, useState } from "react";
import { Modal } from "./Modal";
import { IconeLixo } from "./Icones";
import { useObras } from "@/lib/obras";
import { useDinheiro } from "@/lib/privacidade";
import { dataDoCampo, gerarParcelas, meiaNoite, paraCampo, ROTULO_PERIODICIDADE, type Periodicidade } from "@/lib/financeiro";
import type { Honorario, Parcela } from "@/lib/types";

const campo = "campo-pit w-full border border-ink/25 bg-white px-3 py-2.5 text-sm text-ink outline-none";
const campoPeq = "campo-pit w-full border border-ink/25 bg-white px-2.5 py-2 text-sm text-ink outline-none";
const rotulo = "rotulo-tec mb-1 block text-ink/55";

const num = (s: string) => Number(String(s).replace(",", ".")) || 0;

type Dados = Omit<Honorario, "id"> & { id?: string };

interface Linha {
  id: string;
  descricao: string;
  valor: string;
  vencimento: string;
  recebida: boolean;
  recebidoEm: number | null;
}

const daParcela = (p: Parcela): Linha => ({ id: p.id, descricao: p.descricao, valor: String(p.valor), vencimento: paraCampo(p.vencimento), recebida: p.recebidoEm !== null, recebidoEm: p.recebidoEm });

/**
 * Contrato de honorários: a quem se refere, o valor e as parcelas a receber. O editor gera as parcelas
 * (total ÷ quantidade, na periodicidade escolhida) e deixa ajustar cada uma antes de salvar.
 * É montado de novo a cada abertura (o pai usa `key`), então começa sempre limpo.
 */
export function HonorarioDialog({
  aberto,
  onFechar,
  honorario,
  onSalvar,
}: {
  aberto: boolean;
  onFechar: () => void;
  honorario: Honorario | null;
  onSalvar: (dados: Dados) => Promise<void>;
}) {
  const { obras } = useObras();
  const { brl } = useDinheiro();
  const editando = honorario !== null;

  const [projetoId, setProjetoId] = useState(honorario?.projetoId ?? "");
  const [projetoNome, setProjetoNome] = useState(honorario?.projetoNome ?? "");
  const [cliente, setCliente] = useState(honorario?.cliente ?? "");
  const [descricao, setDescricao] = useState(honorario?.descricao ?? "Honorários de projeto");
  const [total, setTotal] = useState(honorario ? String(honorario.parcelas.reduce((s, p) => s + p.valor, 0)) : "");
  const [qtd, setQtd] = useState(honorario ? String(honorario.parcelas.length) : "6");
  const [primeiro, setPrimeiro] = useState(() => paraCampo(meiaNoite(new Date())));
  const [periodicidade, setPeriodicidade] = useState<Periodicidade>("mensal");
  const [linhas, setLinhas] = useState<Linha[]>(() => (honorario ? [...honorario.parcelas].sort((a, b) => a.vencimento - b.vencimento).map(daParcela) : []));
  const [ocupado, setOcupado] = useState(false);

  const jaRecebeu = linhas.some((l) => l.recebida);
  const somaLinhas = useMemo(() => linhas.reduce((s, l) => s + num(l.valor), 0), [linhas]);
  const diferenca = Math.round((num(total) - somaLinhas) * 100) / 100;
  const nomeValido = projetoId ? true : projetoNome.trim().length > 0;
  const valido = nomeValido && linhas.length > 0 && linhas.every((l) => num(l.valor) > 0 && dataDoCampo(l.vencimento) !== null);

  function escolherProjeto(id: string) {
    setProjetoId(id);
    const o = obras.find((x) => x.id === id);
    if (o) {
      setProjetoNome(o.nome);
      if (!cliente.trim() && o.projeto?.cliente) setCliente(o.projeto.cliente);
    }
  }

  function gerar() {
    const inicio = dataDoCampo(primeiro);
    if (inicio === null || num(total) <= 0) return;
    setLinhas(gerarParcelas(num(total), num(qtd), inicio, periodicidade, descricao.trim() || "Parcela").map(daParcela));
  }

  const setLinha = (id: string, patch: Partial<Linha>) => setLinhas((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  async function salvar() {
    if (!valido || ocupado) return;
    setOcupado(true);
    try {
      await onSalvar({
        ...(honorario ? { id: honorario.id, createdAt: honorario.createdAt } : {}),
        projetoId,
        projetoNome: projetoNome.trim(),
        cliente: cliente.trim(),
        descricao: descricao.trim() || "Honorários",
        parcelas: linhas.map((l) => ({
          id: l.id,
          descricao: l.descricao.trim() || "Parcela",
          valor: num(l.valor),
          vencimento: dataDoCampo(l.vencimento) as number,
          // Marcada agora como recebida: usa hoje; já estava recebida: mantém a data original.
          recebidoEm: l.recebida ? (l.recebidoEm ?? Date.now()) : null,
        })),
      });
      onFechar();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={editando ? "Editar honorário" : "Novo honorário"} largo>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={rotulo}>Projeto</label>
            <select className={campo} value={projetoId} onChange={(e) => escolherProjeto(e.target.value)}>
              <option value="">Avulso (sem projeto na plataforma)</option>
              {obras.map((o) => (
                <option key={o.id} value={o.id}>{o.nome}{o.arquivada ? " (arquivado)" : ""}</option>
              ))}
            </select>
          </div>
          {!projetoId && (
            <div>
              <label className={rotulo}>Nome do trabalho</label>
              <input className={campo} value={projetoNome} onChange={(e) => setProjetoNome(e.target.value)} placeholder="Ex.: Projeto do apto da Ana" />
            </div>
          )}
          <div>
            <label className={rotulo}>Cliente</label>
            <input className={campo} value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Quem paga os honorários" />
          </div>
          <div>
            <label className={rotulo}>O que está sendo cobrado</label>
            <input className={campo} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Ex.: Honorários de projeto e acompanhamento" />
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-linha bg-papel/60 p-3">
          <p className="rotulo-tec text-ink">{jaRecebeu ? "Parcelas" : "Gerar parcelas"}</p>
          {!jaRecebeu && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <label className={rotulo}>Valor total (R$)</label>
                  <input type="number" inputMode="decimal" className={campoPeq} value={total} onChange={(e) => setTotal(e.target.value)} placeholder="0,00" />
                </div>
                <div>
                  <label className={rotulo}>Parcelas</label>
                  <input type="number" inputMode="numeric" min={1} max={60} className={campoPeq} value={qtd} onChange={(e) => setQtd(e.target.value)} />
                </div>
                <div>
                  <label className={rotulo}>1º vencimento</label>
                  <input type="date" className={campoPeq} value={primeiro} onChange={(e) => setPrimeiro(e.target.value)} />
                </div>
                <div>
                  <label className={rotulo}>Intervalo</label>
                  <select className={campoPeq} value={periodicidade} onChange={(e) => setPeriodicidade(e.target.value as Periodicidade)}>
                    {(Object.keys(ROTULO_PERIODICIDADE) as Periodicidade[]).map((p) => (
                      <option key={p} value={p}>{ROTULO_PERIODICIDADE[p]}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="button" className="btn btn-linha px-4 py-2 text-xs font-semibold" disabled={num(total) <= 0 || dataDoCampo(primeiro) === null} onClick={gerar}>
                {linhas.length > 0 ? "Gerar de novo (substitui as parcelas abaixo)" : "Gerar parcelas"}
              </button>
            </>
          )}

          {linhas.length === 0 ? (
            <p className="text-xs text-ink/50">Preencha o valor e toque em Gerar parcelas. Depois você ajusta cada uma.</p>
          ) : (
            <ul className="space-y-2">
              {linhas.map((l) => (
                <li key={l.id} className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-xl bg-white p-2 sm:grid-cols-[1.4fr_1fr_1fr_auto_auto]">
                  <input className={`${campoPeq} col-span-2 sm:col-span-1`} value={l.descricao} onChange={(e) => setLinha(l.id, { descricao: e.target.value })} aria-label="Descrição da parcela" />
                  <input type="date" className={campoPeq} value={l.vencimento} onChange={(e) => setLinha(l.id, { vencimento: e.target.value })} aria-label="Vencimento" />
                  <input type="number" inputMode="decimal" className={campoPeq} value={l.valor} onChange={(e) => setLinha(l.id, { valor: e.target.value })} aria-label="Valor da parcela" />
                  <label className="flex cursor-pointer items-center gap-1.5 text-xs text-ink/65">
                    <input type="checkbox" className="h-4 w-4 accent-[#059669]" checked={l.recebida} onChange={(e) => setLinha(l.id, { recebida: e.target.checked })} />
                    Recebida
                  </label>
                  <button type="button" className="btn btn-icone perigo h-8 w-8 justify-self-end" onClick={() => setLinhas((ls) => ls.filter((x) => x.id !== l.id))} aria-label="Remover parcela" title="Remover parcela">
                    <IconeLixo />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {linhas.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <button
                type="button"
                className="font-semibold text-pitanga hover:underline"
                onClick={() =>
                  setLinhas((ls) => [
                    ...ls,
                    { id: crypto.randomUUID(), descricao: "Parcela", valor: "", vencimento: paraCampo(meiaNoite(new Date())), recebida: false, recebidoEm: null },
                  ])
                }
              >
                + Parcela
              </button>
              <span className="font-mono text-ink/60">
                Soma das parcelas: {brl(somaLinhas)}
                {num(total) > 0 && Math.abs(diferenca) >= 0.01 && <span className="ml-2 text-pitanga">({diferenca > 0 ? "faltam" : "sobram"} {brl(Math.abs(diferenca))} do total)</span>}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button className="btn btn-linha flex-1 px-4 py-3 text-sm" onClick={onFechar}>Cancelar</button>
          <button className="btn btn-primario flex-1 px-4 py-3 text-sm" disabled={!valido || ocupado} onClick={salvar}>
            {ocupado ? "Salvando…" : "Salvar honorário"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
