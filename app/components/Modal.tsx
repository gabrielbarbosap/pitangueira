"use client";

import { useEffect, type ReactNode } from "react";

export function Modal({
  aberto,
  onFechar,
  titulo,
  largo = false,
  children,
}: {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  /** Janela mais larga, para formulários com tabela. */
  largo?: boolean;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!aberto) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/55 p-0 sm:items-center sm:p-4"
      onClick={onFechar}
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
    >
      <div
        className={`max-h-[92dvh] w-full ${largo ? "max-w-2xl" : "max-w-md"} overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-[0_24px_60px_-20px_rgba(20,17,15,0.5)] sm:rounded-[28px] sm:p-6`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-linha pb-3">
          <h2 className="text-lg font-semibold leading-tight text-ink">{titulo}</h2>
          <button onClick={onFechar} className="btn btn-icone h-8 w-8 shrink-0 rounded-full text-sm" aria-label="Fechar">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
