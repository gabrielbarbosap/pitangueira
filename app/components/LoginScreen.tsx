"use client";

import { useAuth } from "@/lib/auth";
import { LogoMark } from "./Logo";

export function LoginScreen() {
  const { login, erro } = useAuth();

  return (
    <div className="grade flex min-h-dvh items-center justify-center p-5">
      <div className="prancha w-full max-w-sm p-8">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-5 flex justify-center">
            <LogoMark size={84} />
          </div>
          <p className="font-mono text-[13px] font-semibold uppercase tracking-[0.24em] text-ink">Pitangueira</p>
          <h1 className="mt-3 text-xl font-semibold leading-tight text-ink">Gestão de projetos, do arquiteto ao cliente</h1>
          <p className="mt-2 text-sm text-ink/60">Orçamento, pagamentos e andamento em um só lugar.</p>
        </div>

        <button
          onClick={login}
          className="btn btn-linha w-full gap-3 px-4 py-3.5 text-sm font-semibold"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
          </svg>
          Entrar com Google
        </button>

        {erro && (
          <p className="mt-4 rounded-xl border border-pitanga bg-pitanga/[0.07] px-3 py-2 text-center text-sm font-medium text-pitanga-escuro" role="alert">
            {erro}
          </p>
        )}
      </div>
    </div>
  );
}
