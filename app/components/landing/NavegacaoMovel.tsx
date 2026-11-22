"use client";

import { useEffect, useState } from "react";

const LINKS = [
  ["#recursos", "Recursos"],
  ["#para-quem", "Para quem"],
  ["#como-funciona", "Como funciona"],
  ["#perguntas", "Dúvidas"],
  ["/docs", "Documentação"],
  ["#entrar", "Já tenho conta"],
] as const;

/** Menu do topo no celular: botão de hambúrguer que abre a lista de seções. Fecha ao tocar num link ou em Esc. */
export function MenuMovel() {
  const [aberto, setAberto] = useState(false);
  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberto(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [aberto]);
  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-expanded={aberto}
        aria-controls="menu-movel"
        aria-label={aberto ? "Fechar o menu" : "Abrir o menu"}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-linha bg-white text-ink"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          {aberto ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>
      {aberto && (
        <nav id="menu-movel" aria-label="Seções" className="absolute inset-x-0 top-full border-b border-linha bg-papel px-4 pb-4 pt-2 shadow-lg">
          <ul className="divide-y divide-linha">
            {LINKS.map(([href, rotulo]) => (
              <li key={href}>
                <a href={href} onClick={() => setAberto(false)} className="flex min-h-12 items-center text-[17px] font-medium text-ink">
                  {rotulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

/**
 * Barra fixa "Começar agora" no rodapé do celular. Aparece depois do topo e some quando o login está na tela
 * (ou o menu aberto, para não atrapalhar).
 */
export function BarraComecar() {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    function atualizar() {
      const entrar = document.getElementById("entrar");
      const noLogin = entrar ? entrar.getBoundingClientRect().top < window.innerHeight - 40 : false;
      setVisivel(window.scrollY > 560 && !noLogin);
    }
    atualizar();
    window.addEventListener("scroll", atualizar, { passive: true });
    window.addEventListener("resize", atualizar);
    return () => {
      window.removeEventListener("scroll", atualizar);
      window.removeEventListener("resize", atualizar);
    };
  }, []);
  return (
    <div
      aria-hidden={!visivel}
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-linha bg-papel/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur transition duration-200 md:hidden ${visivel ? "translate-y-0" : "pointer-events-none translate-y-full"}`}
    >
      <a href="#entrar" tabIndex={visivel ? 0 : -1} className="btn btn-primario w-full px-5 py-3.5 text-[15px]">
        Começar agora
      </a>
    </div>
  );
}
