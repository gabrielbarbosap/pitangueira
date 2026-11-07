"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/data";
import { brl } from "@/lib/format";
import { agruparPor, valorEfetivo, type Grupo } from "@/lib/calc";
import { DocumentoBase, TituloSecao } from "./DocumentoBase";

export type EscopoOrcamento = "geral" | "etapa" | "ambiente";
export type SaidaOrcamento = "junto" | "separado";

export interface ConfigOrcamentoPdf {
  escopo: EscopoOrcamento;
  /** Nomes das etapas/ambientes escolhidos (ignorado no orçamento geral). */
  partes: string[];
  /** Vários PDFs: um só com uma parte por página, ou um PDF por parte. */
  saida: SaidaOrcamento;
}

/** Tabela de itens de uma parte (etapa ou ambiente), com subtotal. */
function TabelaParte({ grupo, escopo }: { grupo: Grupo; escopo: EscopoOrcamento }) {
  // Dentro de uma etapa mostra o ambiente de cada item; dentro de um ambiente, a etapa.
  const itens = escopo === "ambiente" ? [...grupo.itens].sort((a, b) => a.etapaNum - b.etapaNum || a.etapa.localeCompare(b.etapa)) : grupo.itens;
  return (
    <table className="mt-1 w-full text-sm">
      <thead>
        <tr className="text-left text-ink/50">
          <th className="py-2 font-normal">Descrição</th>
          <th className="w-20 py-2 text-right font-normal">Qtd</th>
          <th className="w-24 py-2 text-right font-normal">Unitário</th>
          <th className="w-28 py-2 text-right font-normal">Total</th>
        </tr>
      </thead>
      <tbody>
        {itens.map((i) => {
          const sub = escopo === "ambiente" ? i.etapa : i.ambiente && i.ambiente !== "Geral" ? i.ambiente : "";
          return (
            <tr key={i.id} className="break-inside-avoid border-t border-linha align-top">
              <td className="py-1.5 pr-2">
                {i.descricao}
                {sub && <span className="block text-xs text-ink/50">{sub}</span>}
              </td>
              <td className="py-1.5 text-right font-mono text-ink/70">{i.quantidade ? `${i.quantidade}${i.unidade ? ` ${i.unidade}` : ""}` : "—"}</td>
              <td className="py-1.5 text-right font-mono text-ink/70">{i.valorUnitario ? brl(i.valorUnitario) : "—"}</td>
              <td className="py-1.5 text-right font-mono">{brl(valorEfetivo(i))}</td>
            </tr>
          );
        })}
        <tr className="border-t border-ink">
          <td colSpan={3} className="py-1.5 text-right text-xs font-semibold uppercase tracking-wider text-ink/60">Subtotal</td>
          <td className="py-1.5 text-right font-mono font-semibold">{brl(grupo.previsto)}</td>
        </tr>
      </tbody>
    </table>
  );
}

/**
 * Orçamento em PDF, com a marca do escritório. Pode ser o geral (tudo, por etapa) ou recortado por
 * etapa/ambiente, num PDF só (uma parte por página) ou em um PDF por parte.
 */
export function OrcamentoDocumento({ onFechar, cfg }: { onFechar: () => void; cfg: ConfigOrcamentoPdf }) {
  const { itens, config } = useData();
  const [indice, setIndice] = useState(0);

  const todos = useMemo(() => agruparPor(itens, cfg.escopo === "ambiente" ? "ambiente" : "etapa"), [itens, cfg.escopo]);
  const partes = useMemo(
    () => (cfg.escopo === "geral" ? todos : todos.filter((g) => cfg.partes.includes(g.nome))),
    [todos, cfg.escopo, cfg.partes],
  );
  const totalObra = useMemo(() => itens.reduce((s, i) => s + valorEfetivo(i), 0), [itens]);
  const totalSel = partes.reduce((s, g) => s + g.previsto, 0);
  const sobra = config.orcamentoTotal - totalObra;
  const geral = cfg.escopo === "geral";
  const separado = !geral && cfg.saida === "separado" && partes.length > 1;
  const i = Math.min(indice, Math.max(0, partes.length - 1));
  const visiveis = separado ? partes.slice(i, i + 1) : partes;
  const nomeParte = (g: Grupo) => (cfg.escopo === "ambiente" ? `Ambiente: ${g.nome}` : `Etapa: ${g.nome}`);

  const rotuloEtapa = geral
    ? "Orçamento por etapa"
    : separado
      ? nomeParte(partes[i])
      : partes.length === 1
        ? nomeParte(partes[0])
        : `${partes.length} ${cfg.escopo === "ambiente" ? "ambientes" : "etapas"} selecionados`;

  const nomeArquivo = `Orçamento - ${config.nomeObra}${geral ? "" : separado ? ` - ${partes[i].nome}` : partes.length === 1 ? ` - ${partes[0].nome}` : ` - ${partes.length} ${cfg.escopo === "ambiente" ? "ambientes" : "etapas"}`}`;

  const barra = separado ? (
    <div className="flex min-w-0 items-center gap-2">
      <button onClick={() => setIndice(Math.max(0, i - 1))} disabled={i === 0} className="btn btn-icone h-8 w-8 shrink-0 rounded-full disabled:opacity-30" aria-label="PDF anterior">
        ‹
      </button>
      <span className="min-w-0 truncate font-mono text-[11px] font-semibold uppercase tracking-wider text-ink/70">
        {i + 1} de {partes.length} · {partes[i].nome}
      </span>
      <button onClick={() => setIndice(Math.min(partes.length - 1, i + 1))} disabled={i === partes.length - 1} className="btn btn-icone h-8 w-8 shrink-0 rounded-full disabled:opacity-30" aria-label="Próximo PDF">
        ›
      </button>
    </div>
  ) : undefined;

  return (
    <DocumentoBase
      onFechar={onFechar}
      titulo={separado ? `Orçamento · ${partes[i].nome}` : "Orçamento"}
      etapaRotulo={rotuloEtapa}
      nomeArquivo={nomeArquivo}
      barra={barra}
      rotuloImprimir={separado ? "Salvar PDF desta parte" : "Imprimir / salvar PDF"}
    >
      <section className="mt-8">
        <TituloSecao>Resumo</TituloSecao>
        <dl className="mt-3 grid gap-3 sm:grid-cols-3">
          {geral ? (
            <>
              <div>
                <dt className="rotulo-tec text-ink/50">Custo previsto</dt>
                <dd className="mt-0.5 font-mono text-lg font-semibold">{brl(totalObra)}</dd>
              </div>
              <div>
                <dt className="rotulo-tec text-ink/50">Orçamento disponível</dt>
                <dd className="mt-0.5 font-mono text-lg">{config.orcamentoTotal > 0 ? brl(config.orcamentoTotal) : "—"}</dd>
              </div>
              <div>
                <dt className="rotulo-tec text-ink/50">{sobra >= 0 ? "Folga" : "Acima do disponível"}</dt>
                <dd className="mt-0.5 font-mono text-lg">{config.orcamentoTotal > 0 ? brl(Math.abs(sobra)) : "—"}</dd>
              </div>
            </>
          ) : (
            <>
              <div>
                <dt className="rotulo-tec text-ink/50">{separado || partes.length === 1 ? "Total desta parte" : "Total das partes"}</dt>
                <dd className="mt-0.5 font-mono text-lg font-semibold">{brl(separado ? partes[i].previsto : totalSel)}</dd>
              </div>
              <div>
                <dt className="rotulo-tec text-ink/50">Itens</dt>
                <dd className="mt-0.5 font-mono text-lg">{(separado ? [partes[i]] : partes).reduce((s, g) => s + g.total, 0)}</dd>
              </div>
              <div>
                <dt className="rotulo-tec text-ink/50">Do orçamento do projeto</dt>
                <dd className="mt-0.5 font-mono text-lg">
                  {totalObra > 0 ? `${Math.round(((separado ? partes[i].previsto : totalSel) / totalObra) * 100)}%` : "—"}
                </dd>
              </div>
            </>
          )}
        </dl>
      </section>

      {visiveis.length === 0 ? (
        <p className="mt-8 py-3 text-sm text-ink/50">Nenhum item para mostrar.</p>
      ) : (
        visiveis.map((g, idx) => (
          <section key={g.nome} className={`mt-8 ${!geral && !separado && idx > 0 ? "break-before-page" : ""}`}>
            <TituloSecao>{g.nome}</TituloSecao>
            <TabelaParte grupo={g} escopo={cfg.escopo} />
          </section>
        ))
      )}

      {!separado && (
        <p className="mt-8 border-t-2 pt-3 text-right" style={{ borderColor: "var(--marca)" }}>
          <span className="rotulo-tec mr-3 text-ink/60">{geral ? "Total" : "Total geral"}</span>
          <span className="font-mono text-xl font-semibold">{brl(geral ? totalObra : totalSel)}</span>
        </p>
      )}
    </DocumentoBase>
  );
}
