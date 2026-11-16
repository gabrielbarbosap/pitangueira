import { useId, type InputHTMLAttributes, type ReactNode } from "react";

/**
 * Campo de formulário com rótulo, dica e erro ligados ao input (acessibilidade).
 * O rótulo fica em cima, em mono e caixa alta.
 */
export function Campo({ rotulo, dica, erro, className = "", ...resto }: { rotulo: string; dica?: ReactNode; erro?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const idDica = `${id}-dica`;
  return (
    <div>
      <label htmlFor={id} className="rotulo-campo">
        {rotulo}
      </label>
      <input id={id} className={`input-pit ${className}`.trim()} aria-invalid={erro ? true : undefined} aria-describedby={erro || dica ? idDica : undefined} {...resto} />
      {(erro || dica) && (
        <p id={idDica} className={`mt-1 text-xs ${erro ? "font-medium text-pitanga-escuro" : "text-ink/50"}`}>
          {erro ?? dica}
        </p>
      )}
    </div>
  );
}
