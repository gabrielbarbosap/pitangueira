"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo } from "../Logo";
import { classeBotao } from "../ui/Botao";

/** Página de retorno do Checkout: o Stripe manda a pessoa para cá depois do pagamento. Quem libera o plano é o webhook. */
export function RetornoTela() {
  const temSessao = !!useSearchParams().get("session_id");
  return (
    <div className="grade flex min-h-dvh flex-col">
      <header className="rounded-b-[32px] bg-pitanga pb-8 pt-4 text-white">
        <div className="mx-auto max-w-2xl px-4">
          <Logo claro />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-10">
        <section className="prancha p-6 text-center">
          <h1 className="text-2xl font-semibold text-ink">{temSessao ? "Pagamento recebido!" : "Tudo certo"}</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink/70">
            {temSessao
              ? "Estamos confirmando sua assinatura com o Stripe. Seu plano e o recibo aparecem em Minha conta em instantes — se demorar, atualize a página."
              : "Se você concluiu um pagamento, seu plano aparece em Minha conta em instantes."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/conta" className={classeBotao("primario")}>Ver meu plano</Link>
            <Link href="/" className={classeBotao("linha")}>Ir para o início</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
