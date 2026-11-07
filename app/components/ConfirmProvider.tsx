"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

interface ConfirmOptions {
  titulo: string;
  mensagem?: string;
  /** Texto do botão de confirmação. */
  confirmar?: string;
  cancelar?: string;
  /** "perigo" usa o laranja de alerta (ex.: remover). */
  tom?: "padrao" | "perigo";
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((o) => {
    setOpts(o);
    return new Promise<boolean>((res) => {
      resolver.current = res;
    });
  }, []);

  const fechar = useCallback((valor: boolean) => {
    resolver.current?.(valor);
    resolver.current = null;
    setOpts(null);
  }, []);

  useEffect(() => {
    if (!opts) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar(false);
      if (e.key === "Enter") fechar(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [opts, fechar]);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {opts && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/55 p-0 sm:items-center sm:p-4"
          onClick={() => fechar(false)}
          role="alertdialog"
          aria-modal="true"
          aria-label={opts.titulo}
        >
          <div
            className="w-full max-w-sm rounded-t-[28px] bg-white p-5 shadow-[0_24px_60px_-20px_rgba(20,17,15,0.5)] sm:rounded-[28px] sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="rotulo-tec text-ink/50">{opts.tom === "perigo" ? "Atenção" : "Confirmar"}</p>
            <h2 className="mt-1 text-lg font-semibold leading-tight text-ink">{opts.titulo}</h2>
            {opts.mensagem && <p className="mt-2 text-sm leading-relaxed text-ink/65">{opts.mensagem}</p>}
            <div className="mt-6 flex gap-2">
              <button onClick={() => fechar(false)} className="btn btn-linha flex-1 px-4 py-2.5 text-sm font-medium">
                {opts.cancelar ?? "Cancelar"}
              </button>
              <button
                onClick={() => fechar(true)}
                className={`btn flex-1 px-4 py-2.5 text-sm ${opts.tom === "perigo" ? "btn-primario" : "btn-solido"}`}
              >
                {opts.confirmar ?? "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm precisa estar dentro de <ConfirmProvider>");
  return ctx;
}
