"use client";

import { useState } from "react";
import { mensagemCobrancaObra } from "@/lib/cobrancaObra";
import { useColecaoObra } from "@/lib/colecaoObra";
import { useData } from "@/lib/data";
import { useDinheiro } from "@/lib/privacidade";
import type { CobrancaObra, Item } from "@/lib/types";
import { useContextoMensagem, useEnvio, BotaoEnviar } from "../acompanhar/Envio";
import { useConfirm } from "../ConfirmProvider";
import { IconeLixo } from "../Icones";
import { Botao } from "../ui/Botao";
import { Chip } from "../ui/Chip";
import { CobrancaObraDialog } from "./CobrancaObraDialog";
import { CobrancaObraDocumento } from "./CobrancaObraDocumento";

const data = (ms: number) => new Date(ms).toLocaleDateString("pt-BR");

/**
 * Cartão "Cobrança da obra" no Resumo, no mesmo destaque do relatório mensal. O arquiteto gera cobranças (itens do
 * orçamento e/ou itens novos), vê o documento em PDF, encaminha pelo WhatsApp e dá baixa. O cliente vê as cobranças
 * (só aparece quando existe alguma) e abre o documento.
 */
export function CobrancaObraCard({ itens }: { itens: Item[] }) {
  const { ehCliente, updateMany } = useData();
  const { brl } = useDinheiro();
  const confirmar = useConfirm();
  const cobrancas = useColecaoObra<CobrancaObra>("cobrancas", (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  const contexto = useContextoMensagem();
  const { enviar, dialogo } = useEnvio();
  const [gerando, setGerando] = useState<number | null>(null);
  const [documento, setDocumento] = useState<CobrancaObra | null>(null);
  const [verTodas, setVerTodas] = useState(false);

  const abertas = cobrancas.itens.filter((c) => c.status === "aberta");
  const totalAberto = abertas.reduce((s, c) => s + c.total, 0);
  const lista = ehCliente ? cobrancas.itens.filter((c) => c.status === "aberta") : cobrancas.itens;
  const visiveis = verTodas ? lista : lista.slice(0, 3);

  // O cliente só vê o cartão quando há cobrança em aberto.
  if (ehCliente && abertas.length === 0) return null;
  if (cobrancas.carregando && ehCliente) return null;

  async function darBaixa(c: CobrancaObra) {
    const ids = c.itens.map((i) => i.itemId).filter((id): id is string => Boolean(id) && itens.some((x) => x.id === id && !x.pago));
    const ok = await confirmar({
      titulo: "Marcar como paga",
      mensagem: ids.length > 0 ? `Marcar "${c.titulo}" como paga? Os ${ids.length} ${ids.length === 1 ? "item dela" : "itens dela"} também serão marcados como pagos.` : `Marcar "${c.titulo}" como paga?`,
      confirmar: "Marcar como paga",
    });
    if (!ok) return;
    if (ids.length > 0) await updateMany(ids, { pago: true });
    await cobrancas.salvar({ ...c, status: "paga", pagaEm: Date.now() });
  }

  async function remover(c: CobrancaObra) {
    if (await confirmar({ titulo: "Remover cobrança", mensagem: `Remover "${c.titulo}"? Os itens continuam no orçamento. Essa ação não pode ser desfeita.`, confirmar: "Remover", tom: "perigo" })) await cobrancas.remover(c.id);
  }

  return (
    <>
      <section aria-label="Cobrança da obra" data-tour="cobranca-obra" className="prancha p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          <div className="min-w-0 flex-1">
            <p className="rotulo-tec text-ink/50">{ehCliente ? "Cobranças em aberto" : "Cobrança da obra"}</p>
            <p className="mt-1 text-[15px] font-semibold leading-snug text-ink">
              {ehCliente
                ? `${abertas.length} ${abertas.length === 1 ? "cobrança" : "cobranças"} · ${brl(totalAberto)}`
                : abertas.length === 0
                  ? "Nenhuma cobrança em aberto"
                  : `${abertas.length} ${abertas.length === 1 ? "cobrança em aberto" : "cobranças em aberto"} · ${brl(totalAberto)}`}
            </p>
            <p className="mt-0.5 text-xs text-ink/55">{ehCliente ? "Abra o documento para ver os itens e como pagar." : "Cobre itens do orçamento ou itens novos, gere o PDF e envie pelo WhatsApp."}</p>
          </div>
          {!ehCliente && (
            <Botao variante="primario" className="shrink-0" onClick={() => setGerando(Date.now())}>
              Gerar cobrança
            </Botao>
          )}
        </div>

        {lista.length > 0 && (
          <ul className="mt-3 divide-y divide-linha border-t border-linha">
            {visiveis.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                    {c.titulo}
                    <Chip tom={c.status === "paga" ? "ok" : "aviso"}>{c.status === "paga" ? "Paga" : "Aberta"}</Chip>
                  </p>
                  <p className="text-xs text-ink/55">
                    <span className="font-mono">{brl(c.total)}</span> · {c.itens.length} {c.itens.length === 1 ? "item" : "itens"}
                    {c.vencimento ? ` · vence em ${data(c.vencimento)}` : ""}
                  </p>
                </div>
                <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto sm:shrink-0">
                  <Botao tamanho="pequeno" onClick={() => setDocumento(c)} aria-label={`${ehCliente ? "Ver cobrança" : "Ver o documento"}: ${c.titulo}`}>
                    {ehCliente ? "Ver cobrança" : "Ver documento"}
                  </Botao>
                  {!ehCliente && (
                    <>
                      <BotaoEnviar rotulo="Enviar" contexto={c.titulo} onClick={() => enviar("Enviar a cobrança ao cliente", "cobranca", mensagemCobrancaObra(c, contexto))} />
                      {c.status === "aberta" && (
                        <Botao tamanho="pequeno" onClick={() => void darBaixa(c)} aria-label={`Marcar como paga: ${c.titulo}`}>
                          Marcar como paga
                        </Botao>
                      )}
                      <button className="btn btn-icone perigo h-9 w-9" aria-label={`Remover a cobrança ${c.titulo}`} title="Remover" onClick={() => void remover(c)}>
                        <IconeLixo />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {lista.length > 3 && (
          <button onClick={() => setVerTodas((v) => !v)} className="mt-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-pitanga hover:underline">
            {verTodas ? "Mostrar menos" : `Ver todas (${lista.length})`}
          </button>
        )}
      </section>

      {gerando !== null && !ehCliente && (
        <CobrancaObraDialog
          key={gerando}
          itens={itens}
          onFechar={() => setGerando(null)}
          onSalvar={async (c) => {
            const id = await cobrancas.salvar(c);
            return { ...c, id, createdAt: Date.now() };
          }}
          onGerada={setDocumento}
        />
      )}
      {documento && <CobrancaObraDocumento cobranca={documento} onFechar={() => setDocumento(null)} />}
      {dialogo}
    </>
  );
}
