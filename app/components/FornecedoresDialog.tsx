"use client";

import { useEffect, useMemo, useState } from "react";
import { Modal } from "./Modal";
import { useConfirm } from "./ConfirmProvider";
import { IconeBusca, IconeEditar, IconeLixo } from "./Icones";
import { useColecaoPessoal } from "@/lib/colecaoPessoal";
import { calcularDesempenho, type Desempenho } from "@/lib/fornecedores";
import { useItensDeTodosOsProjetos } from "@/lib/historico";
import { useDinheiro } from "@/lib/privacidade";
import type { Fornecedor } from "@/lib/types";

const campo = "campo-pit w-full border border-ink/25 bg-white px-3 py-2.5 text-sm text-ink outline-none";
const rotulo = "rotulo-tec mb-1 block text-ink/55";

const CATEGORIAS = ["Pedreiro", "Eletricista", "Encanador", "Pintor", "Marceneiro", "Marmoraria", "Vidraceiro", "Gesseiro", "Serralheiro", "Paisagista", "Loja de material"];

interface Form {
  id?: string;
  createdAt?: number;
  nome: string;
  categoria: string;
  telefone: string;
  email: string;
  observacao: string;
  nota: number;
}
const VAZIO: Form = { nome: "", categoria: "", telefone: "", email: "", observacao: "", nota: 0 };

function Estrelas({ nota, onMudar }: { nota: number; onMudar?: (n: number) => void }) {
  return (
    <span className="inline-flex gap-0.5" role={onMudar ? "radiogroup" : "img"} aria-label={nota > 0 ? `Nota ${nota} de 5` : "Sem nota"}>
      {[1, 2, 3, 4, 5].map((n) => {
        const cheia = n <= nota;
        const cls = `text-[15px] leading-none ${cheia ? "text-amber-500" : "text-ink/20"}`;
        return onMudar ? (
          <button key={n} type="button" role="radio" aria-checked={n === nota} aria-label={`${n} estrelas`} onClick={() => onMudar(n === nota ? 0 : n)} className={`${cls} p-0.5 hover:text-amber-500`}>
            ★
          </button>
        ) : (
          <span key={n} className={cls} aria-hidden>
            ★
          </span>
        );
      })}
    </span>
  );
}

/** Um número do histórico, com rótulo e uma linha de apoio. */
function Indicador({ rotulo: r, valor, apoio, tom }: { rotulo: string; valor: string; apoio?: string; tom?: "bom" | "atencao" | "ruim" | "neutro" }) {
  const cor = tom === "bom" ? "text-emerald-700" : tom === "atencao" ? "text-amber-700" : tom === "ruim" ? "text-pitanga" : "text-ink";
  return (
    <div className="min-w-0 rounded-xl bg-ink/[0.04] px-3 py-2">
      <p className="rotulo-tec text-ink/45">{r}</p>
      <p className={`mt-0.5 font-mono text-[15px] font-semibold leading-tight ${cor}`}>{valor}</p>
      {apoio && <p className="mt-0.5 text-[11px] leading-snug text-ink/50">{apoio}</p>}
    </div>
  );
}

function CartaoFornecedor({ d, onEditar, onRemover, onCadastrar }: { d: Desempenho; onEditar: () => void; onRemover: () => void; onCadastrar: () => void }) {
  const { brlInt } = useDinheiro();
  const c = d.cadastro;
  const pct = d.pctNoPrazo;
  const desvio = d.desvioPct;
  const fmtPct = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1).replace(".", ",")}%`;

  return (
    <li className="space-y-3 px-3 py-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[15px] font-semibold leading-snug text-ink">{d.nome}</span>
            {c?.categoria && <span className="rounded-full bg-ink/[0.07] px-2 py-0.5 text-[11px] font-medium text-ink/65">{c.categoria}</span>}
            {!c && <span className="rounded-full border border-dashed border-ink/30 px-2 py-0.5 text-[11px] text-ink/55">não cadastrado</span>}
            {c && c.nota > 0 && <Estrelas nota={c.nota} />}
          </p>
          {c && (c.telefone || c.email) && (
            <p className="mt-0.5 text-xs text-ink/55">
              {c.telefone && (
                <a href={`tel:${c.telefone.replace(/[^\d+]/g, "")}`} className="hover:text-ink hover:underline">
                  {c.telefone}
                </a>
              )}
              {c.telefone && c.email && " · "}
              {c.email && (
                <a href={`mailto:${c.email}`} className="hover:text-ink hover:underline">
                  {c.email}
                </a>
              )}
            </p>
          )}
          {c?.observacao && <p className="mt-0.5 text-xs text-ink/50">{c.observacao}</p>}
        </div>
        <div className="flex shrink-0 gap-1">
          {c ? (
            <>
              <button className="btn btn-icone h-8 w-8" onClick={onEditar} aria-label={`Editar ${d.nome}`} title="Editar"><IconeEditar /></button>
              <button className="btn btn-icone perigo h-8 w-8" onClick={onRemover} aria-label={`Remover ${d.nome}`} title="Remover do cadastro"><IconeLixo /></button>
            </>
          ) : (
            <button className="btn btn-linha px-3 py-1.5 text-xs font-semibold" onClick={onCadastrar}>Cadastrar</button>
          )}
        </div>
      </div>

      {d.itens === 0 ? (
        <p className="text-xs text-ink/45">Sem histórico ainda: aparece quando o nome dele for usado como fornecedor de um item.</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-3">
            <Indicador rotulo="Trabalhos" valor={`${d.itens} ${d.itens === 1 ? "item" : "itens"}`} apoio={`${d.projetos} ${d.projetos === 1 ? "projeto" : "projetos"} · ${brlInt(d.contratado)} orçados`} />
            <Indicador
              rotulo="Entrega no prazo"
              valor={pct === null ? "—" : `${pct}%`}
              tom={pct === null ? "neutro" : pct >= 90 ? "bom" : pct >= 70 ? "atencao" : "ruim"}
              apoio={pct === null ? "marque o prazo dos itens" : `${d.noPrazo} de ${d.entregas} no prazo${d.atrasadas > 0 ? ` · atraso médio ${d.mediaAtraso} ${d.mediaAtraso === 1 ? "dia" : "dias"}` : ""}`}
            />
            <Indicador
              rotulo="Custo × orçado"
              valor={desvio === null ? "—" : fmtPct(desvio)}
              tom={desvio === null ? "neutro" : desvio > 5 ? "ruim" : desvio > 0 ? "atencao" : "bom"}
              apoio={desvio === null ? "informe o valor real" : `${d.comReal} ${d.comReal === 1 ? "item" : "itens"} com valor real`}
            />
          </div>
          {d.vencidosAbertos > 0 && (
            <p className="rounded-xl bg-pitanga/10 px-3 py-1.5 text-xs font-medium text-pitanga">
              {d.vencidosAbertos} {d.vencidosAbertos === 1 ? "item com prazo vencido, ainda não feito" : "itens com prazo vencido, ainda não feitos"}
            </p>
          )}
        </>
      )}
    </li>
  );
}

/** Rede de fornecedores do arquiteto, com o histórico de prazo e de custo vindo dos itens de todos os projetos. */
export function FornecedoresDialog({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { itens: cadastro, salvar, remover } = useColecaoPessoal<Fornecedor>("fornecedores", (a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const { itens, carregando, erro, carregar } = useItensDeTodosOsProjetos();
  const confirmar = useConfirm();
  const [busca, setBusca] = useState("");
  const [form, setForm] = useState<Form | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [agora, setAgora] = useState(0);

  // Lê os itens de todos os projetos ao abrir (e marca "agora" para decidir o que está com prazo vencido).
  useEffect(() => {
    if (!aberto) return;
    let vivo = true;
    carregar().then(() => {
      if (vivo) setAgora(Date.now());
    });
    return () => {
      vivo = false;
    };
  }, [aberto, carregar]);

  const desempenhos = useMemo(() => calcularDesempenho(itens, cadastro, agora || 0), [itens, cadastro, agora]);
  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return q ? desempenhos.filter((d) => `${d.nome} ${d.cadastro?.categoria ?? ""}`.toLowerCase().includes(q)) : desempenhos;
  }, [desempenhos, busca]);

  const set = (patch: Partial<Form>) => setForm((f) => (f ? { ...f, ...patch } : f));

  function editar(f: Fornecedor) {
    setForm({ id: f.id, createdAt: f.createdAt, nome: f.nome, categoria: f.categoria, telefone: f.telefone, email: f.email, observacao: f.observacao, nota: f.nota });
  }

  async function gravar() {
    if (!form || !form.nome.trim() || ocupado) return;
    setOcupado(true);
    try {
      await salvar({
        ...(form.id ? { id: form.id } : {}),
        ...(form.createdAt ? { createdAt: form.createdAt } : {}),
        nome: form.nome.trim(),
        categoria: form.categoria.trim(),
        telefone: form.telefone.trim(),
        email: form.email.trim(),
        observacao: form.observacao.trim(),
        nota: form.nota,
      });
      setForm(null);
    } finally {
      setOcupado(false);
    }
  }

  async function excluir(f: Fornecedor) {
    const ok = await confirmar({
      titulo: "Remover do cadastro",
      mensagem: `Remover "${f.nome}" do cadastro? O histórico dele continua aparecendo enquanto o nome estiver nos itens dos projetos.`,
      confirmar: "Remover",
      tom: "perigo",
    });
    if (ok) await remover(f.id);
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={form ? (form.id ? "Editar fornecedor" : "Novo fornecedor") : "Fornecedores"} largo>
      {form ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className={rotulo}>Nome</label>
              <input className={campo} value={form.nome} onChange={(e) => set({ nome: e.target.value })} placeholder="Ex.: João Pedreiro" autoFocus />
              <p className="mt-1 text-xs text-ink/50">Use o mesmo nome nos itens para o histórico dele aparecer.</p>
            </div>
            <div>
              <label className={rotulo}>Especialidade</label>
              <input list="cat-forn" className={campo} value={form.categoria} onChange={(e) => set({ categoria: e.target.value })} placeholder="Ex.: Pedreiro" />
              <datalist id="cat-forn">{CATEGORIAS.map((c) => <option key={c} value={c} />)}</datalist>
            </div>
            <div>
              <label className={rotulo}>Telefone</label>
              <input type="tel" className={campo} value={form.telefone} onChange={(e) => set({ telefone: e.target.value })} placeholder="(11) 99999-0000" />
            </div>
            <div>
              <label className={rotulo}>E-mail</label>
              <input type="email" className={campo} value={form.email} onChange={(e) => set({ email: e.target.value })} />
            </div>
          </div>
          <div>
            <label className={rotulo}>Sua nota</label>
            <Estrelas nota={form.nota} onMudar={(n) => set({ nota: n })} />
          </div>
          <div>
            <label className={rotulo}>Observação</label>
            <textarea className={`${campo} resize-none`} rows={2} value={form.observacao} onChange={(e) => set({ observacao: e.target.value })} placeholder="Ex.: só faz acabamento fino; atende zona sul" />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-linha flex-1 px-4 py-3 text-sm" onClick={() => setForm(null)}>Cancelar</button>
            <button className="btn btn-primario flex-1 px-4 py-3 text-sm" disabled={!form.nome.trim() || ocupado} onClick={gravar}>
              {ocupado ? "Salvando…" : "Salvar fornecedor"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[13px] leading-snug text-ink/65">
            Sua rede de prestadores e lojas. O histórico vem sozinho dos itens dos seus projetos: informe o <strong className="font-semibold text-ink">fornecedor</strong>, o{" "}
            <strong className="font-semibold text-ink">prazo</strong> e o <strong className="font-semibold text-ink">valor real</strong> em cada item.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-primario px-4 py-2.5 text-sm" onClick={() => setForm({ ...VAZIO })}>+ Novo fornecedor</button>
            {carregando && <span className="text-xs text-ink/50">Lendo o histórico dos projetos…</span>}
          </div>

          {erro && <p role="alert" className="rounded-xl bg-pitanga/10 px-3 py-2 text-[13px] text-pitanga">Não consegui ler o histórico dos projetos agora. O cadastro continua disponível.</p>}

          {desempenhos.length > 0 && (
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink/40"><IconeBusca /></span>
              <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar fornecedor ou especialidade…" className="campo-pit w-full border border-ink/20 bg-white py-2.5 pl-11 pr-3 text-sm text-ink outline-none" />
            </div>
          )}

          {desempenhos.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-ink/30 px-4 py-8 text-center text-sm text-ink/55">
              Nenhum fornecedor ainda. Cadastre o primeiro, ou informe o fornecedor nos itens dos seus projetos e ele aparece aqui com o histórico.
            </p>
          ) : filtrados.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink/55">Nenhum fornecedor para “{busca}”.</p>
          ) : (
            <ul className="divide-y divide-linha overflow-hidden rounded-2xl border border-linha">
              {filtrados.map((d) => (
                <CartaoFornecedor
                  key={d.chave}
                  d={d}
                  onEditar={() => d.cadastro && editar(d.cadastro)}
                  onRemover={() => d.cadastro && excluir(d.cadastro)}
                  onCadastrar={() => setForm({ ...VAZIO, nome: d.nome })}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </Modal>
  );
}
