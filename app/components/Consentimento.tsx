"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useConsentimento } from "@/lib/consentimento";
import { Botao } from "./ui/Botao";

/**
 * Aviso de cookies (LGPD). Aparece uma vez, no rodapé, enquanto a pessoa não decide. "Aceitar" libera
 * Google Analytics e Pixel; "Recusar" mantém só o essencial. A escolha fica guardada no aparelho.
 * Só é montado no cliente (evita piscar o aviso para quem já decidiu).
 */
export function Consentimento() {
  const { decidido, aceitar, recusar } = useConsentimento();
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);

  if (!montado || decidido) return null;

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 max-md:pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="prancha mx-auto flex max-w-3xl flex-col gap-3 p-4 shadow-[0_18px_40px_-20px_rgba(20,17,15,0.5)] sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="text-sm leading-relaxed text-ink/75">
          Com o seu ok, usamos cookies para entender o que mais ajuda quem toca obra e deixar a Pitangueira melhor
          pra você. Os essenciais, que fazem o site funcionar, estão sempre ligados.{" "}
          <Link href="/docs/privacidade-e-tutorial" className="font-semibold text-pitanga hover:underline">
            Saiba mais
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2 max-sm:w-full">
          <Botao variante="linha" tamanho="pequeno" onClick={recusar} className="max-sm:flex-1">
            Só os essenciais
          </Botao>
          <Botao variante="primario" tamanho="pequeno" onClick={aceitar} className="max-sm:flex-1">
            Aceitar
          </Botao>
        </div>
      </div>
    </div>
  );
}
