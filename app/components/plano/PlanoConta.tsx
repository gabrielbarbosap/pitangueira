"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { CANCELAMENTO_DIAS } from "@/lib/empresa";
import { usePlano } from "@/lib/plano";
import { ORDEM_PLANOS, PLANOS, TESTE_DIAS, type PlanoId, type Recibo } from "@/lib/planos";
import { Chip } from "../ui/Chip";
import { classeBotao } from "../ui/Botao";

const ROTULO_ORIGEM = { assinatura: "Assinatura", cortesia: "Cortesia", teste: "Teste grátis", "sem-assinatura": "Sem assinatura" } as const;
const dinheiro = (centavos: number) => (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Em Minha conta: o plano, o que ele permite, o uso atual, o simulador (só no demo) e os recibos de pagamento. */
export function PlanoConta() {
  const { user, configured } = useAuth();
  const { def, efetivo, obrasAtivas, definirAssinaturaDemo } = usePlano();
  const uid = user?.uid ?? "";
  const [nuvem, setNuvem] = useState<{ uid: string; lista: Recibo[] } | null>(null);

  useEffect(() => {
    if (!uid || !configured || !db) return;
    return onSnapshot(
      collection(db, "assinaturas", uid, "recibos"),
      (snap) => setNuvem({ uid, lista: snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Recibo, "id">) })) }),
      () => setNuvem({ uid, lista: [] }),
    );
  }, [uid, configured]);

  const recibos = useMemo(() => [...(nuvem?.uid === uid ? nuvem.lista : [])].sort((a, b) => b.em - a.em), [nuvem, uid]);
  const carregandoRecibos = !!db && configured && nuvem?.uid !== uid;

  const [abrindoPortal, setAbrindoPortal] = useState(false);
  const [erroPortal, setErroPortal] = useState<string | null>(null);
  async function abrirPortal() {
    setAbrindoPortal(true);
    setErroPortal(null);
    try {
      const token = await auth?.currentUser?.getIdToken();
      if (!token) throw new Error("Seu login expirou. Entre de novo.");
      const r = await fetch("/api/assinatura/portal", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const d = (await r.json().catch(() => ({}))) as { url?: string; mensagem?: string };
      if (!r.ok || !d.url) throw new Error(d.mensagem ?? "Não consegui abrir o portal agora.");
      window.location.href = d.url;
    } catch (e) {
      setErroPortal(e instanceof Error ? e.message : "Não consegui abrir o portal agora.");
      setAbrindoPortal(false);
    }
  }

  return (
    <>
      <section aria-label="Seu plano" className="prancha p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-ink">Seu plano</h2>
          <Chip tom={efetivo.origem === "sem-assinatura" ? "aviso" : "ok"}>
            {def.nome} · {ROTULO_ORIGEM[efetivo.origem]}
          </Chip>
        </div>
        <p className="mt-1 text-sm leading-snug text-ink/60">{def.frase}.</p>
        {efetivo.origem === "teste" && (
          <p className="mt-2 text-sm text-ink/75">
            Teste grátis do plano Safra: <strong>{efetivo.diasDeTeste === 1 ? "falta 1 dia" : `faltam ${efetivo.diasDeTeste} dias`}</strong> (são {TESTE_DIAS} no total). Depois dele, vale o plano Broto até você assinar.
          </p>
        )}
        {efetivo.origem === "cortesia" && (
          <p className="mt-2 rounded-xl bg-papel p-3 text-sm leading-relaxed text-ink/75">
            <strong>Plano de cortesia:</strong> {efetivo.aviso ?? "você tem acesso sem limites por enquanto. Vamos mudar os planos de quem já usava a Pitangueira e avisaremos antes de qualquer mudança."}
          </p>
        )}
        {efetivo.origem === "sem-assinatura" && <p className="mt-2 text-sm text-ink/75">O seu teste terminou. Nada foi apagado: o plano Broto vale até você assinar.</p>}

        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-papel p-3">
            <dt className="rotulo-tec text-ink/50">Projetos em andamento</dt>
            <dd className="mt-1 text-lg font-semibold text-ink">{obrasAtivas}{def.obrasAtivas !== null ? ` de ${def.obrasAtivas}` : ""}</dd>
          </div>
          <div className="rounded-xl bg-papel p-3">
            <dt className="rotulo-tec text-ink/50">Catálogo</dt>
            <dd className="mt-1 text-lg font-semibold text-ink">{def.catalogoItens === null ? "Sem limite" : `Até ${def.catalogoItens} itens`}</dd>
          </div>
          <div className="rounded-xl bg-papel p-3">
            <dt className="rotulo-tec text-ink/50">Fornecedores</dt>
            <dd className="mt-1 text-lg font-semibold text-ink">{def.fornecedores === null ? "Sem limite" : `Até ${def.fornecedores}`}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/planos" className={classeBotao("linha")}>
            Ver e comparar os planos
          </Link>
          {efetivo.origem === "assinatura" && (
            <button type="button" onClick={abrirPortal} disabled={abrindoPortal} className={classeBotao("solido")}>
              {abrindoPortal ? "Abrindo…" : "Gerenciar assinatura"}
            </button>
          )}
        </div>
        {erroPortal && <p className="mt-2 text-sm font-medium text-pitanga">{erroPortal}</p>}
        <p className="mt-3 text-xs text-ink/50">
          Cancelamento em até {CANCELAMENTO_DIAS} dias com reembolso. <Link href="/termos" className="font-semibold text-pitanga hover:underline">Termos de uso</Link>
        </p>
      </section>

      <section aria-label="Recibos de pagamento" className="prancha p-4">
        <h2 className="text-lg font-semibold text-ink">Recibos de pagamento</h2>
        <p className="mt-1 text-sm leading-snug text-ink/60">Cada pagamento da assinatura aparece aqui, com o recibo para abrir. Por enquanto não emitimos nota fiscal.</p>
        {carregandoRecibos ? (
          <p className="mt-4 text-sm text-ink/50">Carregando…</p>
        ) : recibos.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-ink/25 px-4 py-6 text-center text-sm text-ink/55">Nenhum pagamento ainda. Quando você assinar um plano, os recibos aparecem aqui.</p>
        ) : (
          <ul className="mt-3 divide-y divide-linha">
            {recibos.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-ink">{r.descricao}</p>
                  <p className="text-xs text-ink/55">{new Date(r.em).toLocaleDateString("pt-BR")}{r.plano ? ` · plano ${PLANOS[r.plano].nome}` : ""}</p>
                </div>
                <span className="font-mono text-sm font-semibold">{dinheiro(r.valor)}</span>
                <Chip tom={r.status === "paga" ? "ok" : "neutro"}>{r.status === "paga" ? "Paga" : "Reembolsada"}</Chip>
                {r.url && (
                  <a href={r.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-pitanga hover:underline">
                    Abrir recibo
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {definirAssinaturaDemo && <SimuladorDemo definir={definirAssinaturaDemo} />}
    </>
  );
}

/** Só no modo demo: troca de plano para ver como cada limite se comporta, sem Stripe. */
function SimuladorDemo({ definir }: { definir: (a: Parameters<NonNullable<ReturnType<typeof usePlano>["definirAssinaturaDemo"]>>[0]) => void }) {
  const tocar = (plano: PlanoId) => definir({ plano, status: "ativa" });
  return (
    <section aria-label="Simulador de planos" className="prancha border-dashed p-4">
      <h2 className="text-lg font-semibold text-ink">Simulador de planos <span className="font-normal text-ink/50">· só no modo demo</span></h2>
      <p className="mt-1 text-sm leading-snug text-ink/60">Troque de plano para ver os limites e os bloqueios. Isto não existe na versão com Firebase: lá o plano vem da assinatura.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {ORDEM_PLANOS.map((p) => (
          <button key={p} type="button" className="btn btn-linha px-3.5 py-2 text-sm" onClick={() => tocar(p)}>
            Plano {PLANOS[p].nome}
          </button>
        ))}
        <button type="button" className="btn btn-linha px-3.5 py-2 text-sm" onClick={() => definir({ plano: "pomar", status: "cortesia" })}>
          Cortesia (Pomar)
        </button>
        <button type="button" className="btn btn-linha px-3.5 py-2 text-sm" onClick={() => definir(null)}>
          Teste grátis de {TESTE_DIAS} dias
        </button>
        <button type="button" className="btn btn-linha px-3.5 py-2 text-sm" onClick={() => definir({ plano: "broto", status: "cancelada", ate: 1 })}>
          Fim do teste (sem assinatura)
        </button>
      </div>
    </section>
  );
}
