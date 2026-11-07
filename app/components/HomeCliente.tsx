"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { esquecerObrasCliente, lerObrasCliente, type ObraCliente } from "@/lib/clienteObras";
import { Logo, LogoMark } from "./Logo";
import { IconeObra, IconeSair } from "./Icones";

export function HomeCliente() {
  const { user, logout } = useAuth();
  const [obras, setObras] = useState<ObraCliente[]>([]);

  useEffect(() => {
    setObras(lerObrasCliente());
  }, []);

  async function sair() {
    esquecerObrasCliente();
    await logout();
  }

  const primeiroNome = (user?.nome ?? "").split(" ")[0];

  return (
    <div className="grade min-h-dvh">
      <header className="rounded-b-[32px] bg-pitanga pb-8 text-white">
        <div className="mx-auto max-w-2xl px-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <Logo claro />
            <button
              onClick={sair}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Sair"
              title="Sair"
            >
              <IconeSair />
            </button>
          </div>
          <p className="rotulo-tec mt-7 text-white/85">Cliente</p>
          <h1 className="mt-1 text-4xl font-semibold leading-tight tracking-tight">Olá{primeiroNome ? `, ${primeiroNome}` : ""}.</h1>
          <p className="mt-1 text-sm text-white">Acompanhe aqui os projetos que você abriu com o código do arquiteto.</p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 pb-12 pt-6">
        {obras.length === 0 ? (
          <div className="prancha px-6 py-14 text-center">
            <div className="flex justify-center"><LogoMark size={68} /></div>
            <p className="mt-5 text-lg font-semibold text-ink">Nenhum projeto por aqui ainda</p>
            <p className="mx-auto mt-1 max-w-xs text-sm text-ink/60">
              Abra o link que o seu arquiteto enviou e digite o código de acesso para acompanhar o projeto.
            </p>
          </div>
        ) : (
          <section aria-label="Seus projetos">
            <div className="mb-3 flex items-center gap-3">
              <h2 className="text-xl font-semibold text-ink">Seus projetos</h2>
              <span className="h-px flex-1 bg-linha" />
            </div>
            <div className="grid gap-3">
              {obras.map((o) => (
                <Link key={o.id} href={`/obra/${o.id}`} className="prancha prancha-clicavel clicavel flex items-center gap-3 p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink/[0.07] text-ink/70">
                    <IconeObra />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-lg font-semibold text-ink">{o.nome}</span>
                  <span className="shrink-0 font-mono text-[11px] font-semibold uppercase tracking-wider text-pitanga">Abrir →</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <p className="text-xs text-ink/40">A lista fica guardada neste dispositivo. Em outro aparelho, abra o link do projeto e digite o código de novo.</p>
      </main>
    </div>
  );
}
