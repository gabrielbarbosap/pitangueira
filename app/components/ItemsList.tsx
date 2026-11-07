"use client";

import { useState } from "react";
import { percentual } from "@/lib/format";
import { useDinheiro } from "@/lib/privacidade";
import { useData } from "@/lib/data";
import { useConfirm } from "./ConfirmProvider";
import { IconeEditar, IconeLixo, IconeSeta } from "./Icones";
import { statusGrupo, type Grupo } from "@/lib/calc";
import type { Item } from "@/lib/types";

const TEMAS = {
  pendente: { barra: "bg-ink/25", dot: "bg-ink/30", label: "Pendente" },
  progresso: { barra: "bg-amber-500", dot: "bg-amber-500", label: "Em progresso" },
  finalizado: { barra: "bg-emerald-600", dot: "bg-emerald-600", label: "Concluído" },
} as const;

/** Etiqueta marcável (Feito / Pago): cantos retos, hover e estado ativo claros. */
function Etiqueta({
  ativo,
  onClick,
  titulo,
  corAtiva,
  tamanho = "normal",
  children,
}: {
  ativo: boolean;
  onClick: () => void;
  titulo: string;
  corAtiva: string;
  tamanho?: "normal" | "pequeno";
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={titulo}
      aria-pressed={ativo}
      className={`btn clicavel gap-1 rounded-full border font-mono font-semibold uppercase tracking-wider ${
        tamanho === "pequeno" ? "h-8 px-2.5 text-[10px]" : "h-8 px-3 text-[11px]"
      } ${ativo ? corAtiva : "border-ink/25 bg-white text-ink/55 hover:border-ink hover:bg-ink/[0.05] hover:text-ink"}`}
    >
      {ativo && <span aria-hidden>✓</span>}
      {children}
    </button>
  );
}

const FEITO_ATIVO = "border-ink bg-ink text-white";
const PAGO_ATIVO = "border-emerald-600 bg-emerald-600 text-white";

function Linha({ item, onEditar }: { item: Item; onEditar: (i: Item) => void }) {
  const { updateItem, removeItem, ehCliente } = useData();
  const { brl } = useDinheiro();
  const confirmar = useConfirm();
  const detalhes = [item.quantidade > 0 && `${item.quantidade} × ${brl(item.valorUnitario)}`, item.fornecedor, item.observacao].filter(Boolean).join(" · ");

  return (
    <div className="linha-hover flex flex-col gap-2.5 border-t border-linha px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${item.feito ? "text-ink/50 line-through decoration-ink/30" : "text-ink"}`}>{item.descricao}</p>
        {detalhes && <p className="mt-0.5 text-xs text-ink/50">{detalhes}</p>}
        <div className="mt-2 flex gap-1.5">
          <Etiqueta
            ativo={item.feito}
            onClick={() => updateItem(item.id, { feito: !item.feito })}
            titulo={item.feito ? "Desmarcar como feito" : "Marcar como feito (serviço executado)"}
            corAtiva={FEITO_ATIVO}
          >
            Feito
          </Etiqueta>
          <Etiqueta
            ativo={item.pago}
            onClick={() => updateItem(item.id, { pago: !item.pago })}
            titulo={item.pago ? "Desmarcar como pago" : "Marcar como pago"}
            corAtiva={PAGO_ATIVO}
          >
            Pago
          </Etiqueta>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="text-right">
          <p className="font-mono text-sm font-semibold tabular-nums text-ink">{brl(item.valorReal > 0 ? item.valorReal : item.valorOrcado)}</p>
          {item.valorReal > 0 && item.valorReal !== item.valorOrcado && (
            <p className="font-mono text-xs tabular-nums text-ink/40 line-through">{brl(item.valorOrcado)}</p>
          )}
        </div>
        {!ehCliente && (
          <div className="flex gap-1.5">
            <button onClick={() => onEditar(item)} className="btn btn-icone h-9 w-9" aria-label="Editar item" title="Editar item">
              <IconeEditar />
            </button>
            <button
              onClick={async () => {
                const ok = await confirmar({
                  titulo: "Remover item",
                  mensagem: `Remover "${item.descricao}"? Essa ação não pode ser desfeita.`,
                  confirmar: "Remover",
                  tom: "perigo",
                });
                if (ok) removeItem(item.id);
              }}
              className="btn btn-icone perigo h-9 w-9"
              aria-label="Remover item"
              title="Remover item"
            >
              <IconeLixo />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function GrupoCard({ grupo, onEditar, forcarAberto }: { grupo: Grupo; onEditar: (i: Item) => void; forcarAberto?: boolean }) {
  const { updateMany } = useData();
  const { brl } = useDinheiro();
  const confirmar = useConfirm();
  const [aberto, setAberto] = useState(false);
  const mostrar = forcarAberto || aberto;
  const tema = TEMAS[statusGrupo(grupo)];
  const pct = percentual(grupo.pago, grupo.previsto);
  const todosPagos = grupo.itens.every((i) => i.pago);
  const todosFeitos = grupo.itens.every((i) => i.feito);

  async function marcarTodos(campo: "pago" | "feito", atual: boolean) {
    const acao = atual ? "Desmarcar" : "Marcar";
    const label = campo === "pago" ? "como pagos" : "como feitos";
    const ok = await confirmar({
      titulo: `${acao} seção inteira`,
      mensagem: `${acao} todos os ${grupo.total} itens de "${grupo.nome}" ${label}?`,
      confirmar: acao,
    });
    if (!ok) return;
    updateMany(
      grupo.itens.map((i) => i.id),
      { [campo]: !atual },
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-linha bg-white">
      <span className={`absolute inset-y-0 left-0 w-1 ${tema.barra}`} aria-hidden />
      <div className="flex items-stretch gap-2 pl-1">
        <button
          onClick={() => setAberto((v) => !v)}
          aria-expanded={mostrar}
          title={mostrar ? "Recolher itens" : "Ver itens"}
          className="linha-hover flex min-w-0 flex-1 items-center gap-3 py-3.5 pl-4 pr-1 text-left"
        >
          <span className="text-ink/45">
            <IconeSeta aberta={mostrar} />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-ink">{grupo.nome}</span>
            <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink/55">
              <span className="flex items-center gap-1.5 font-medium text-ink/75">
                <span className={`h-2 w-2 ${tema.dot}`} />
                {tema.label}
              </span>
              <span>
                {grupo.feitos}/{grupo.total} feitos
              </span>
              <span className="font-mono">
                {brl(grupo.pago)} de {brl(grupo.previsto)}
              </span>
            </span>
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-1.5 py-3 pr-3">
          <Etiqueta
            ativo={todosFeitos}
            onClick={() => marcarTodos("feito", todosFeitos)}
            titulo={todosFeitos ? "Desmarcar todos como feitos" : "Marcar todos como feitos"}
            corAtiva={FEITO_ATIVO}
            tamanho="pequeno"
          >
            Feito
          </Etiqueta>
          <Etiqueta
            ativo={todosPagos}
            onClick={() => marcarTodos("pago", todosPagos)}
            titulo={todosPagos ? "Desmarcar todos como pagos" : "Marcar todos como pagos"}
            corAtiva={PAGO_ATIVO}
            tamanho="pequeno"
          >
            Pago
          </Etiqueta>
        </div>
      </div>
      <div className="ml-1 h-1 bg-ink/[0.07]">
        <div className="h-full bg-ink transition-all duration-300" style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      {mostrar && (
        <div className="ml-1">
          {grupo.itens.map((item) => (
            <Linha key={item.id} item={item} onEditar={onEditar} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ItemsList({
  grupos,
  onEditar,
  expandir,
}: {
  grupos: Grupo[];
  onEditar: (i: Item) => void;
  expandir?: boolean;
}) {
  return (
    <section className="space-y-3" aria-label="Itens do orçamento">
      {grupos.map((g) => (
        <GrupoCard key={g.nome} grupo={g} onEditar={onEditar} forcarAberto={expandir} />
      ))}
    </section>
  );
}
