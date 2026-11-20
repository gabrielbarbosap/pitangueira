"use client";

import { useMemo, useState, type ReactNode } from "react";
import { valorEfetivo } from "@/lib/calc";
import { totalDosItens } from "@/lib/cobrancaObra";
import { useColecaoPessoal } from "@/lib/colecaoPessoal";
import { useData } from "@/lib/data";
import { dataDoCampo } from "@/lib/financeiro";
import { brl } from "@/lib/format";
import { registrarEvento } from "@/lib/telemetria";
import type { CobrancaObra, ConfigCobranca, Item, ItemCobrado } from "@/lib/types";
import { IconeBusca, IconeLixo, IconeMais } from "../Icones";
import { Modal } from "../Modal";
import { Alerta } from "../ui/Alerta";
import { Botao } from "../ui/Botao";
import { Chip } from "../ui/Chip";

const num = (s: string) => Number(String(s).replace(",", ".")) || 0;

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

interface Novo {
  id: string;
  descricao: string;
  quantidade: string;
  valorUnitario: string;
}

/**
 * Gerar a cobrança da obra, em três passos: 1) escolher itens do orçamento, 2) incluir itens novos, cadastrados na hora
 * (eles também entram no orçamento do projeto), 3) dar título, vencimento e chave PIX. Gera o documento em PDF, que se
 * envia pelo WhatsApp. É montada de novo a cada abertura (o pai usa `key`).
 */
export function CobrancaObraDialog({
  itens,
  onFechar,
  onSalvar,
  onGerada,
}: {
  itens: Item[];
  onFechar: () => void;
  onSalvar: (c: Omit<CobrancaObra, "id">) => Promise<CobrancaObra>;
  onGerada: (c: CobrancaObra) => void;
}) {
  const { addItens, ator } = useData();
  const { itens: configs, salvar: salvarConfig } = useColecaoPessoal<ConfigCobranca>("configuracoes", (a, b) => a.id.localeCompare(b.id));
  const pixSalvo = configs.find((c) => c.id === "cobranca")?.pix ?? "";

  const [marcados, setMarcados] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState("");
  const [novos, setNovos] = useState<Novo[]>([]);
  const [etapaNova, setEtapaNova] = useState("Extras");
  const [tituloC, setTituloC] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [pix, setPix] = useState<string | null>(null); // null = ainda usa o PIX guardado
  const [obs, setObs] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  const pixAtual = pix ?? pixSalvo;
  const q = busca.trim().toLowerCase();
  const grupos = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const i of itens) {
      if (q && !`${i.descricao} ${i.etapa}`.toLowerCase().includes(q)) continue;
      const k = i.etapa?.trim() || "Sem etapa";
      (m.get(k) ?? m.set(k, []).get(k)!).push(i);
    }
    return [...m.entries()];
  }, [itens, q]);

  const escolhidos = itens.filter((i) => marcados.has(i.id));
  const novosValidos = novos.filter((n) => n.descricao.trim() && num(n.valorUnitario) > 0);
  const novosIncompletos = novos.length - novosValidos.length;
  const valorNovo = (n: Novo) => Math.round(Math.max(num(n.quantidade) || 1, 0) * num(n.valorUnitario) * 100) / 100;
  const total = Math.round((escolhidos.reduce((s, i) => s + valorEfetivo(i), 0) + novosValidos.reduce((s, n) => s + valorNovo(n), 0)) * 100) / 100;
  const qtd = escolhidos.length + novosValidos.length;
  const valido = tituloC.trim() !== "" && qtd > 0 && novosIncompletos === 0;

  const alternar = (id: string) =>
    setMarcados((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const escolherTodos = (lista: Item[]) => setMarcados(new Set(lista.map((i) => i.id)));
  const setNovo = (id: string, p: Partial<Novo>) => setNovos((l) => l.map((n) => (n.id === id ? { ...n, ...p } : n)));

  async function gerar() {
    if (!valido || ocupado) return;
    setOcupado(true);
    setErro("");
    try {
      // Itens novos primeiro: entram no orçamento do projeto, e a cobrança guarda o id de cada um.
      const ids = await addItens(
        novosValidos.map((n) => ({
          etapaNum: 0,
          etapa: etapaNova.trim() || "Extras",
          ambiente: "Geral",
          descricao: n.descricao.trim(),
          quantidade: num(n.quantidade) || 1,
          valorUnitario: num(n.valorUnitario),
          valorOrcado: valorNovo(n),
          valorReal: 0,
          feito: false,
          pago: false,
        })),
      );
      const cobrados: ItemCobrado[] = [
        ...escolhidos.map((i) => ({ itemId: i.id, descricao: i.descricao, etapa: i.etapa || "Sem etapa", quantidade: i.quantidade, unidade: i.unidade, valor: valorEfetivo(i) })),
        ...novosValidos.map((n, k) => ({ itemId: ids[k], descricao: n.descricao.trim(), etapa: etapaNova.trim() || "Extras", quantidade: num(n.quantidade) || 1, valor: valorNovo(n), novo: true })),
      ];
      const salva = await onSalvar({
        titulo: tituloC.trim(),
        itens: cobrados,
        total: totalDosItens(cobrados),
        vencimento: dataDoCampo(vencimento),
        pix: pixAtual.trim(),
        obs: obs.trim(),
        status: "aberta",
        criadoPor: ator,
      });
      if (pixAtual.trim() !== pixSalvo) await salvarConfig({ id: "cobranca", pix: pixAtual.trim() });
      registrarEvento("cobranca_obra_gerada", { itens: cobrados.length, novos: novosValidos.length });
      onGerada(salva);
      onFechar();
    } catch {
      setErro("Não consegui gerar a cobrança agora. Confira a lista de itens: se os itens novos entraram, não os cadastre de novo.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Modal aberto onFechar={onFechar} titulo="Gerar cobrança da obra" largo>
      <div className="space-y-6">
        <p className="text-[13px] leading-snug text-ink/65">
          Monte a cobrança com itens que já estão no orçamento e, se precisar, itens novos. Você gera um PDF com a sua marca e envia pelo WhatsApp.
        </p>

        {/* 1. Itens do orçamento */}
        <section>
          <Numero n={1}>Escolha itens do orçamento</Numero>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <button type="button" className="rounded-full border border-ink/20 bg-white px-3 py-1 text-xs font-medium text-ink/75 hover:border-ink/50" onClick={() => escolherTodos(itens.filter((i) => i.feito && !i.pago))}>
              Só feitos e não pagos
            </button>
            <button type="button" className="rounded-full border border-ink/20 bg-white px-3 py-1 text-xs font-medium text-ink/75 hover:border-ink/50" onClick={() => escolherTodos(itens.filter((i) => !i.pago))}>
              Todos os não pagos
            </button>
            <button type="button" className="rounded-full border border-ink/20 bg-white px-3 py-1 text-xs font-medium text-ink/75 hover:border-ink/50" onClick={() => setMarcados(new Set())}>
              Limpar
            </button>
            <span className="ml-auto text-xs text-ink/50">
              {escolhidos.length} de {itens.length} marcados
            </span>
          </div>
          <div className="relative mb-2">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40">
              <IconeBusca />
            </span>
            <label htmlFor="cob-busca" className="sr-only">Buscar item</label>
            <input id="cob-busca" className="input-pit input-pit-busca" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar item ou etapa…" autoComplete="off" />
          </div>
          {itens.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-ink/30 px-4 py-6 text-center text-sm text-ink/55">O orçamento ainda não tem itens. Cadastre itens novos no passo 2.</p>
          ) : (
            <div className="max-h-72 space-y-3 overflow-y-auto pr-1">
              {grupos.map(([etapa, lista]) => (
                <div key={etapa} className="overflow-hidden rounded-2xl border border-linha">
                  <div className="flex items-center justify-between gap-3 bg-ink/[0.04] px-3.5 py-2">
                    <p className="truncate text-[13px] font-semibold text-ink">
                      {etapa} <span className="font-normal text-ink/45">· {lista.length}</span>
                    </p>
                    <button type="button" className="shrink-0 text-xs font-semibold text-pitanga hover:underline" onClick={() => setMarcados((s) => new Set([...s, ...lista.map((i) => i.id)]))}>
                      Marcar a etapa
                    </button>
                  </div>
                  <ul className="divide-y divide-linha">
                    {lista.map((i) => (
                      <li key={i.id}>
                        <label className="linha-hover flex cursor-pointer items-start gap-3 px-3.5 py-2.5">
                          <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[#d23a1f]" checked={marcados.has(i.id)} onChange={() => alternar(i.id)} />
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm leading-snug text-ink">{i.descricao}</span>
                            <span className="mt-0.5 flex flex-wrap gap-1">
                              {i.feito && <Chip tom="ink">Feito</Chip>}
                              {i.pago && <Chip tom="ok">Já pago</Chip>}
                            </span>
                          </span>
                          <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-ink">{brl(valorEfetivo(i))}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              {grupos.length === 0 && <p className="px-2 py-4 text-center text-sm text-ink/50">Nenhum item encontrado para “{busca}”.</p>}
            </div>
          )}
        </section>

        {/* 2. Itens novos */}
        <section>
          <Numero n={2}>Inclua itens novos (opcional)</Numero>
          <p className="mb-2 text-xs leading-snug text-ink/55">Serviços ou materiais que não estão no orçamento. Eles são cadastrados agora e passam a fazer parte do orçamento do projeto.</p>
          {novos.length > 0 && (
            <>
              <div className="mb-2">
                <label htmlFor="cob-etapa-nova" className="rotulo-campo">Etapa dos itens novos</label>
                <input id="cob-etapa-nova" className="input-pit" value={etapaNova} onChange={(e) => setEtapaNova(e.target.value)} placeholder="Extras" />
              </div>
              <ul className="space-y-2">
                {novos.map((n) => (
                  <li key={n.id} className="grid grid-cols-[1fr_5rem_6.5rem_auto] items-end gap-2 rounded-2xl bg-ink/[0.04] p-2.5">
                    <div className="col-span-4 sm:col-span-1">
                      <label className="sr-only" htmlFor={`n-d-${n.id}`}>Descrição do item novo</label>
                      <input id={`n-d-${n.id}`} className="input-pit input-pit-peq" value={n.descricao} onChange={(e) => setNovo(n.id, { descricao: e.target.value })} placeholder="Descrição do item novo" />
                    </div>
                    <div>
                      <label className="sr-only" htmlFor={`n-q-${n.id}`}>Quantidade do item novo</label>
                      <input id={`n-q-${n.id}`} type="number" inputMode="decimal" className="input-pit input-pit-peq" value={n.quantidade} onChange={(e) => setNovo(n.id, { quantidade: e.target.value })} placeholder="Qtd" />
                    </div>
                    <div>
                      <label className="sr-only" htmlFor={`n-v-${n.id}`}>Valor unitário do item novo</label>
                      <input id={`n-v-${n.id}`} type="number" inputMode="decimal" className="input-pit input-pit-peq" value={n.valorUnitario} onChange={(e) => setNovo(n.id, { valorUnitario: e.target.value })} placeholder="Valor unit." />
                    </div>
                    <button type="button" className="btn btn-icone perigo h-9 w-9" aria-label="Remover item novo" title="Remover" onClick={() => setNovos((l) => l.filter((x) => x.id !== n.id))}>
                      <IconeLixo />
                    </button>
                    {valorNovo(n) > 0 && <p className="col-span-4 text-right font-mono text-xs text-ink/55">Total do item: {brl(valorNovo(n))}</p>}
                  </li>
                ))}
              </ul>
            </>
          )}
          <Botao className="mt-2" tamanho="pequeno" onClick={() => setNovos((l) => [...l, { id: crypto.randomUUID(), descricao: "", quantidade: "1", valorUnitario: "" }])}>
            <IconeMais size={14} /> Item novo
          </Botao>
          {novosIncompletos > 0 && <p className="mt-2 text-xs font-medium text-pitanga-escuro">Preencha a descrição e o valor de cada item novo (ou remova o que não for usar).</p>}
        </section>

        {/* 3. Detalhes */}
        <section className="space-y-3">
          <Numero n={3}>Dê um título e combine o pagamento</Numero>
          <div>
            <label htmlFor="cob-titulo" className="rotulo-campo">Título da cobrança</label>
            <input id="cob-titulo" className="input-pit" value={tituloC} onChange={(e) => setTituloC(e.target.value)} placeholder="Ex.: Medição de novembro, Serviços extras da cozinha" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="cob-venc" className="rotulo-campo">Vencimento (opcional)</label>
              <input id="cob-venc" type="date" className="input-pit" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
            </div>
            <div>
              <label htmlFor="cob-pix" className="rotulo-campo">Chave PIX (opcional)</label>
              <input id="cob-pix" className="input-pit" value={pixAtual} onChange={(e) => setPix(e.target.value)} placeholder="CPF, CNPJ, e-mail, celular ou chave aleatória" />
            </div>
          </div>
          <div>
            <label htmlFor="cob-obs" className="rotulo-campo">Observações (opcional)</label>
            <textarea id="cob-obs" className="input-pit resize-none" rows={2} value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex.: Pagamento em até 5 dias úteis" />
          </div>
        </section>

        <dl className="grid grid-cols-2 gap-2 text-center" aria-label="Resumo da cobrança">
          <div className="rounded-2xl bg-ink/[0.05] px-2 py-3">
            <dd className="font-mono text-xl font-semibold text-ink">{qtd}</dd>
            <dt className="mt-0.5 text-[11px] text-ink/55">{qtd === 1 ? "item" : "itens"}</dt>
          </div>
          <div className="rounded-2xl bg-ink/[0.05] px-2 py-3">
            <dd className="font-mono text-xl font-semibold text-ink">{brl(total)}</dd>
            <dt className="mt-0.5 text-[11px] text-ink/55">total da cobrança</dt>
          </div>
        </dl>

        {erro && <Alerta tom="perigo">{erro}</Alerta>}

        <div className="flex gap-2">
          <Botao className="flex-1" onClick={onFechar}>Cancelar</Botao>
          <Botao variante="primario" className="flex-1" disabled={!valido || ocupado} onClick={gerar} aria-disabled={!valido}>
            {ocupado ? "Gerando…" : "Gerar cobrança"}
          </Botao>
        </div>
        {!valido && !ocupado && <p className="-mt-3 text-center text-xs text-ink/45">{tituloC.trim() === "" ? "Dê um título à cobrança." : qtd === 0 ? "Escolha pelo menos um item." : "Preencha os itens novos."}</p>}
      </div>
    </Modal>
  );
}
