"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth";
import { track } from "@/lib/analytics";
import { ORDEM_PLANOS, PLANOS, type PlanoId } from "@/lib/planos";
import { emReais, precoAnualTotal, precoPorMes, temPreco, type Ciclo } from "@/lib/precos";
import { IconeVoltar } from "../Icones";
import { Logo } from "../Logo";
import { Alerta } from "../ui/Alerta";

/** Endereço oficial do Stripe.js da versão Dahlia. Nunca empacote nem hospede uma cópia (exigência de PCI). */
const STRIPE_JS = "https://js.stripe.com/dahlia/stripe.js";

const APARENCIA = {
  theme: "stripe",
  labels: "auto",
  inputs: "spaced",
  variables: {
    borderRadius: "14px",
    colorBackground: "#ffffff",
    colorDanger: "#c0392b",
    colorPrimary: "#d23a1f",
    colorSuccess: "#1f9d55",
    colorText: "#2b2320",
    fontFamily: "inherit",
    fontSizeBase: "16px",
    spacingUnit: "4px",
  },
};

// SDK do formulário embutido (Dahlia), tipada só no que usamos.
type EventoConfirmacao = unknown;
interface FormEmbutido {
  mount(seletor: string): void;
  on(evento: "confirm", cb: (e: EventoConfirmacao) => void): void;
}
interface AcoesCheckout {
  confirm(opts: { formConfirmEvent: EventoConfirmacao }): Promise<unknown>;
}
interface CheckoutSdk {
  createForm(opts: { layout: string }): FormEmbutido;
  loadActions(): Promise<{ type: string; actions: AcoesCheckout }>;
}
interface StripeCliente {
  initCheckoutFormSdk(opts: { clientSecret: string; appearance?: unknown }): CheckoutSdk;
}
declare global {
  interface Window {
    Stripe?: (chavePublica: string) => StripeCliente;
  }
}

function carregarStripeJs(): Promise<void> {
  return new Promise((resolver, rejeitar) => {
    if (window.Stripe) return resolver();
    const existente = document.querySelector<HTMLScriptElement>(`script[src="${STRIPE_JS}"]`);
    if (existente) {
      existente.addEventListener("load", () => resolver());
      existente.addEventListener("error", () => rejeitar(new Error("falha ao carregar o Stripe.js")));
      if (window.Stripe) resolver();
      return;
    }
    const s = document.createElement("script");
    s.src = STRIPE_JS;
    s.async = true;
    s.onload = () => resolver();
    s.onerror = () => rejeitar(new Error("falha ao carregar o Stripe.js"));
    document.head.appendChild(s);
  });
}

function ehPlano(v: string | null): v is PlanoId {
  return !!v && (ORDEM_PLANOS as string[]).includes(v);
}

/** Tela de assinatura: monta o formulário embutido do Stripe para o plano e o ciclo escolhidos. Exige login. */
export function AssinarTela() {
  const params = useSearchParams();
  const { user, configured, loading } = useAuth();
  const planoParam = params.get("plano");
  const planoOk: PlanoId | null = ehPlano(planoParam) ? planoParam : null;
  const ciclo: Ciclo = params.get("ciclo") === "anual" ? "anual" : "mensal";
  const logado = !!user && !user.anonimo;

  const [erro, setErro] = useState<string | null>(null);
  const [montando, setMontando] = useState(true);
  const iniciado = useRef(false);

  const chavePublica = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  useEffect(() => {
    if (loading) return;
    if (iniciado.current) return;
    if (!planoOk || !temPreco(planoOk)) {
      setErro("Plano indisponível para assinatura.");
      setMontando(false);
      return;
    }
    if (!configured || !logado) {
      setErro("Entre na sua conta para assinar.");
      setMontando(false);
      return;
    }
    if (!chavePublica) {
      setErro("A chave pública do Stripe não está configurada (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY).");
      setMontando(false);
      return;
    }
    iniciado.current = true;

    (async () => {
      try {
        track("assinatura_iniciada", { plano: planoOk, ciclo });
        const token = await auth?.currentUser?.getIdToken();
        if (!token) throw new Error("Seu login expirou. Entre de novo.");
        const r = await fetch("/api/assinatura/checkout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ plano: planoOk, ciclo }),
        });
        const dados = (await r.json().catch(() => ({}))) as { client_secret?: string; mensagem?: string };
        if (!r.ok || !dados.client_secret) throw new Error(dados.mensagem ?? "Não consegui iniciar o pagamento agora.");

        await carregarStripeJs();
        if (!window.Stripe) throw new Error("Não consegui carregar o Stripe.");
        const stripe = window.Stripe(chavePublica);
        const checkout = stripe.initCheckoutFormSdk({ clientSecret: dados.client_secret, appearance: APARENCIA });
        const form = checkout.createForm({ layout: "expanded" });
        form.mount("#formulario-checkout");
        setMontando(false);

        const acoes = await checkout.loadActions();
        if (acoes.type === "success") {
          form.on("confirm", async (evento) => {
            try {
              await acoes.actions.confirm({ formConfirmEvent: evento });
            } catch (e) {
              console.error("Erro ao confirmar o pagamento:", e);
            }
          });
        }
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Não consegui iniciar o pagamento agora.");
        setMontando(false);
        iniciado.current = false;
      }
    })();
  }, [loading, planoOk, ciclo, configured, logado, chavePublica]);

  const def = planoOk ? PLANOS[planoOk] : null;

  return (
    <div className="grade min-h-dvh">
      <header className="rounded-b-[32px] bg-pitanga pb-8 text-white">
        <div className="mx-auto max-w-2xl px-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/planos" className="btn-topo" aria-label="Voltar aos planos" title="Voltar aos planos">
              <IconeVoltar />
            </Link>
            <Logo claro />
            <span className="h-10 w-10" aria-hidden />
          </div>
          <p className="rotulo-tec mt-6 text-white/85">Assinatura</p>
          <h1 className="mt-1 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            {def ? `Assinar o plano ${def.nome}` : "Assinar"}
          </h1>
          {planoOk && def && (
            <p className="mt-2 text-sm text-white">
              {ciclo === "anual" ? "Plano anual" : "Plano mensal"} ·{" "}
              <strong>{emReais(precoPorMes(planoOk, ciclo))}</strong>/mês
              {ciclo === "anual" && <> · {emReais(precoAnualTotal(planoOk))} por ano (2 meses grátis)</>}
            </p>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 py-8">
        {erro ? (
          <Alerta tom="perigo" titulo="Não deu para abrir o pagamento">
            <p>{erro}</p>
            <p className="mt-2">
              <Link href="/planos" className="font-semibold underline">Voltar aos planos</Link>
            </p>
          </Alerta>
        ) : (
          <>
            {montando && <p className="mb-4 text-sm text-ink/55" role="status">Carregando o pagamento seguro…</p>}
            <div className="prancha p-4 sm:p-6">
              <div id="formulario-checkout" />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-ink/55">
              Pagamento processado pelo Stripe. Você pode cancelar quando quiser pelo portal, em Minha conta.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
