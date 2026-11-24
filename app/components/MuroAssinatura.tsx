"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { track } from "@/lib/analytics";
import { usePlano } from "@/lib/plano";
import { TESTE_DIAS } from "@/lib/planos";
import { Logo } from "./Logo";
import { classeBotao } from "./ui/Botao";

/**
 * Muro de assinatura: não há plano grátis. Quando o arquiteto não tem assinatura em vigor e o teste de 5 dias já acabou
 * (`efetivo.semAcesso`), o app fica bloqueado e só estas áreas continuam abertas (para a pessoa assinar ou sair). O
 * cliente (acesso por código) e as páginas públicas nunca são bloqueados.
 */
const ABERTAS = ["/planos", "/assinar", "/conta", "/termos", "/docs", "/acao", "/design"];

export function MuroAssinatura({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { efetivo, carregando } = usePlano();
  const pathname = usePathname() ?? "/";

  const arquiteto = !!user && !user.anonimo;
  const aberta = ABERTAS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const bloquear = arquiteto && !loading && !carregando && !!efetivo.semAcesso && !aberta;

  if (!bloquear) return <>{children}</>;
  return <Paywall />;
}

function Paywall() {
  const { logout } = useAuth();
  useEffect(() => track("muro_assinatura_visto", {}), []);
  return (
    <div className="grade flex min-h-dvh flex-col">
      <header className="rounded-b-[32px] bg-pitanga pb-8 pt-4 text-white">
        <div className="mx-auto max-w-2xl px-4">
          <Logo claro />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-10">
        <section className="prancha p-6 text-center sm:p-8">
          <p className="rotulo-tec text-pitanga">Assinatura necessária</p>
          <h1 className="mt-1 text-2xl font-semibold text-ink">Assine para usar a Pitangueira</h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink/70">
            Escolha um plano para liberar o app. Você começa com <strong>{TESTE_DIAS} dias grátis</strong> — o cartão fica cadastrado e a cobrança só começa depois; cancele quando quiser. <strong>Nada é apagado</strong>: seus projetos voltam assim que você assinar.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/planos" onClick={() => track("upgrade_clicado", { origem: "muro_assinatura" })} className={classeBotao("primario")}>
              Ver os planos
            </Link>
            <Link href="/conta" className={classeBotao("linha")}>Minha conta</Link>
          </div>
          <button type="button" onClick={() => void logout()} className="mt-5 text-sm font-medium text-ink/55 underline underline-offset-2 hover:text-ink">
            Sair
          </button>
        </section>
      </main>
    </div>
  );
}
