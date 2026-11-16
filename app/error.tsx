"use client";

import { useEffect } from "react";
import Link from "next/link";
import { registrarErro } from "@/lib/telemetria";
import { Botao } from "./components/ui/Botao";

/** Quando uma tela quebra: mensagem clara em português, sem perder o usuário, e o erro vai para o administrador. */
export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    registrarErro("tela_quebrou", error);
  }, [error]);

  return (
    <div className="grade flex min-h-dvh items-center justify-center p-5">
      <div className="prancha w-full max-w-sm p-8 text-center">
        <p className="rotulo-tec text-pitanga">Algo deu errado</p>
        <h1 className="mt-2 text-xl font-semibold text-ink">Não consegui abrir esta tela</h1>
        <p className="mt-2 text-sm leading-snug text-ink/65">Seus dados estão salvos. Já avisamos o time. Tente de novo; se continuar, volte ao início.</p>
        <div className="mt-5 flex flex-col gap-2">
          <Botao variante="primario" onClick={reset}>
            Tentar de novo
          </Botao>
          <Link href="/" className="btn btn-linha px-4 py-2.5 text-sm">
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
