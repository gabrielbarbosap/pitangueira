"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/** Um passo do tutorial: destaca um elemento da tela (marcado com `data-tour="alvo"`) e explica. */
export interface PassoTour {
  /** Valor do `data-tour` do elemento a destacar. Sem alvo, o passo aparece centralizado na tela. */
  alvo?: string;
  titulo: string;
  texto: string;
  /** Prepara a tela antes do passo aparecer (ex.: trocar de aba). */
  aoEntrar?: () => void;
  /** Se o alvo não estiver na tela (ex.: projeto ainda sem itens), o passo é pulado. */
  opcional?: boolean;
}

const EVENTO = "pitangueira:tour";
const chaveLS = (c: string) => `pitangueira:tour:${c}:v1`;

function lerVisto(chave: string): boolean {
  try {
    return localStorage.getItem(chaveLS(chave)) === "1";
  } catch {
    return false;
  }
}

function assinar(aviso: () => void) {
  window.addEventListener(EVENTO, aviso);
  window.addEventListener("storage", aviso);
  return () => {
    window.removeEventListener(EVENTO, aviso);
    window.removeEventListener("storage", aviso);
  };
}

/**
 * Estado de um tutorial. Abre sozinho na primeira vez (quando `auto` e `pronto`) e lembra, neste aparelho,
 * que já foi visto. `iniciar` reabre quando a pessoa quiser rever.
 */
export function useTour(chave: string, { auto, pronto }: { auto: boolean; pronto: boolean }) {
  // No servidor (e na hidratação) conta como "visto": o tutorial nunca aparece antes da tela existir.
  const visto = useSyncExternalStore(assinar, () => lerVisto(chave), () => true);
  const [manual, setManual] = useState(false);
  const [dispensado, setDispensado] = useState(false);
  const aberto = manual || (auto && pronto && !visto && !dispensado);

  const iniciar = useCallback(() => setManual(true), []);
  const fechar = useCallback(() => {
    try {
      localStorage.setItem(chaveLS(chave), "1");
    } catch {
      /* sem armazenamento: o `dispensado` evita reabrir nesta visita */
    }
    window.dispatchEvent(new Event(EVENTO));
    setManual(false);
    setDispensado(true);
  }, [chave]);

  return { aberto, iniciar, fechar };
}

interface Medida {
  /** Índice do passo a que esta medida pertence (evita mostrar o cartão no lugar do passo anterior). */
  passo: number;
  rect: { top: number; left: number; width: number; height: number } | null;
  w: number;
  h: number;
}

const FOLGA = 8;
const ALTURA_CARTAO = 240;

function acharAlvo(alvo: string): HTMLElement | undefined {
  // O Next mantém a tela anterior montada (escondida): vale só o elemento que está visível.
  return ([...document.querySelectorAll(`[data-tour="${alvo}"]`)] as HTMLElement[]).find((el) => el.getClientRects().length > 0);
}

/** Tutorial guiado: escurece a tela, destaca um elemento por vez e explica o que ele faz. */
export function Tour({ passos, aberto, onFechar }: { passos: PassoTour[]; aberto: boolean; onFechar: () => void }) {
  if (!aberto) return null;
  return <TourAtivo passos={passos} onFechar={onFechar} />;
}

function TourAtivo({ passos, onFechar }: { passos: PassoTour[]; onFechar: () => void }) {
  const [i, setI] = useState(0);
  const [medida, setMedida] = useState<Medida | null>(null);
  // Fixa a lista ao abrir: passos opcionais cujo alvo já não está na tela (e que não trocam de aba) saem,
  // para a contagem "2 de 5" e os pontinhos refletirem só o que a pessoa vai ver.
  const [lista] = useState(() => passos.filter((p) => !(p.opcional && p.alvo && !p.aoEntrar && !acharAlvo(p.alvo))));
  const direcao = useRef(1);
  const botaoRef = useRef<HTMLButtonElement>(null);

  // A cada passo: prepara a tela, leva o alvo para o meio, mede e acompanha rolagem/redimensionamento.
  useEffect(() => {
    const passo = lista[i];
    if (!passo) return;
    let vivo = true;

    passo.aoEntrar?.();

    const medir = () => {
      if (!vivo) return;
      const el = passo.alvo ? acharAlvo(passo.alvo) : undefined;
      const r = el?.getBoundingClientRect();
      setMedida({
        passo: i,
        rect: r ? { top: r.top, left: r.left, width: r.width, height: r.height } : null,
        w: window.innerWidth,
        h: window.innerHeight,
      });
    };

    const t1 = setTimeout(() => {
      if (!vivo) return;
      const el = passo.alvo ? acharAlvo(passo.alvo) : undefined;
      if (passo.alvo && !el && passo.opcional) {
        // Alvo ausente: pula o passo, na direção em que a pessoa estava indo.
        const proximo = i + direcao.current;
        if (proximo < 0 || proximo >= lista.length) onFechar();
        else setI(proximo);
        return;
      }
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      // Espera a rolagem suave terminar para medir a posição final.
      setTimeout(medir, el ? 450 : 0);
    }, 280);

    window.addEventListener("resize", medir);
    window.addEventListener("scroll", medir, true);
    return () => {
      vivo = false;
      clearTimeout(t1);
      window.removeEventListener("resize", medir);
      window.removeEventListener("scroll", medir, true);
    };
  }, [i, lista, onFechar]);

  const total = lista.length;
  const passo = lista[i];
  const pronto = medida?.passo === i;
  const ultimo = i === total - 1;

  const avancar = useCallback(() => {
    if (i >= total - 1) {
      onFechar();
      return;
    }
    direcao.current = 1;
    setI(i + 1);
  }, [i, total, onFechar]);

  const voltar = useCallback(() => {
    if (i <= 0) return;
    direcao.current = -1;
    setI(i - 1);
  }, [i]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
      else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        avancar();
      } else if (e.key === "ArrowLeft") voltar();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [avancar, voltar, onFechar]);

  // O foco vai para o botão principal a cada passo (teclado e leitor de tela seguem o tutorial).
  useEffect(() => {
    if (pronto) botaoRef.current?.focus({ preventScroll: true });
  }, [pronto, i]);

  if (!passo) return null;

  const rect = pronto ? medida.rect : null;
  const largura = medida ? Math.min(medida.w - 32, 360) : 340;

  // Posição do cartão: abaixo do alvo, ou acima, ou fixo embaixo quando não cabe em nenhum lado.
  let estiloCartao: React.CSSProperties = { width: largura, left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
  if (rect && medida) {
    const esquerda = Math.min(Math.max(rect.left + rect.width / 2 - largura / 2, 16), medida.w - largura - 16);
    const abaixo = medida.h - (rect.top + rect.height + FOLGA);
    const acima = rect.top - FOLGA;
    if (abaixo >= ALTURA_CARTAO) estiloCartao = { width: largura, left: esquerda, top: rect.top + rect.height + FOLGA + 12 };
    else if (acima >= ALTURA_CARTAO) estiloCartao = { width: largura, left: esquerda, bottom: medida.h - rect.top + FOLGA + 12 };
    else estiloCartao = { width: largura, left: esquerda, bottom: 16 };
  }

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-labelledby="tour-titulo">
      {/* Bloqueia cliques na tela por baixo e escurece; sem alvo, o escuro é de tela cheia */}
      <div className={`absolute inset-0 ${rect ? "" : "bg-ink/65"}`} onClick={(e) => e.stopPropagation()} />

      {rect && (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-2xl transition-all duration-300 ease-out"
          style={{
            top: rect.top - FOLGA,
            left: rect.left - FOLGA,
            width: rect.width + FOLGA * 2,
            height: rect.height + FOLGA * 2,
            boxShadow: "0 0 0 100vmax rgba(20,17,15,0.65), 0 0 0 3px rgba(255,255,255,0.9)",
          }}
        />
      )}

      <div
        className={`absolute rounded-3xl bg-white p-5 shadow-[0_24px_60px_-20px_rgba(20,17,15,0.6)] transition-opacity duration-200 ${pronto ? "opacity-100" : "opacity-0"}`}
        style={estiloCartao}
        aria-live="polite"
      >
        <p className="rotulo-tec text-ink/50">
          Tutorial · {i + 1} de {total}
        </p>
        <h2 id="tour-titulo" className="mt-1.5 text-lg font-semibold leading-snug text-ink">
          {passo.titulo}
        </h2>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink/75">{passo.texto}</p>

        <div className="mt-4 flex items-center gap-1.5" aria-hidden>
          {lista.map((_, k) => (
            <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-pitanga" : "w-1.5 bg-ink/20"}`} />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          {!ultimo && (
            <button onClick={onFechar} className="mr-auto px-1 py-2 text-xs font-semibold text-ink/50 hover:text-ink hover:underline">
              Pular
            </button>
          )}
          {ultimo && <span className="mr-auto" />}
          {i > 0 && (
            <button onClick={voltar} className="btn btn-linha px-4 py-2.5 text-sm">
              Voltar
            </button>
          )}
          <button ref={botaoRef} onClick={avancar} className="btn btn-primario px-5 py-2.5 text-sm">
            {ultimo ? "Concluir" : "Próximo"}
          </button>
        </div>
      </div>
    </div>
  );
}
