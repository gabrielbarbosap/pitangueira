// Ícones de traço arredondado usados na navegação e nas ações.
type P = { size?: number };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
});

export function IconeEditar({ size = 16 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M4 20h4L19 9l-4-4L4 16v4z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}

export function IconeLixo({ size = 16 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 001 1h8a1 1 0 001-1l1-12M9 7V4h6v3" />
    </svg>
  );
}

export function IconeSeta({ aberta }: { aberta: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`shrink-0 transition-transform duration-150 ${aberta ? "rotate-90" : ""}`}
    >
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

export function IconeVoltar({ size = 20 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}

export function IconeAjustes({ size = 20 }: P) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3h0a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5h0a1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8v0a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
    </svg>
  );
}

export function IconeSair({ size = 20 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M9 4H6a2 2 0 00-2 2v12a2 2 0 002 2h3M16 8l4 4-4 4M20 12H9" />
    </svg>
  );
}

export function IconeResumo({ size = 22 }: P) {
  return (
    <svg {...base(size)}>
      <rect x="4" y="4" width="7" height="7" rx="2" />
      <rect x="13" y="4" width="7" height="5" rx="2" />
      <rect x="13" y="12" width="7" height="8" rx="2" />
      <rect x="4" y="14" width="7" height="6" rx="2" />
    </svg>
  );
}

export function IconeItens({ size = 22 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M9 6h11M9 12h11M9 18h11" />
      <circle cx="4.5" cy="6" r="1" />
      <circle cx="4.5" cy="12" r="1" />
      <circle cx="4.5" cy="18" r="1" />
    </svg>
  );
}

export function IconeGraficos({ size = 22 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M12 3v9h9a9 9 0 11-9-9z" />
      <path d="M15.5 3.6A9 9 0 0120.4 8.5H15.5z" />
    </svg>
  );
}

export function IconePrograma({ size = 22 }: P) {
  return (
    <svg {...base(size)}>
      <rect x="5" y="4" width="14" height="17" rx="3" />
      <path d="M9 4V3h6v1M9 11h6M9 15h4" />
    </svg>
  );
}

export function IconeMais({ size = 18 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconeObra({ size = 22 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v9a1 1 0 001 1h10a1 1 0 001-1v-9" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

export function IconeOpcoes({ size = 18 }: P) {
  return (
    <svg {...base(size)}>
      <circle cx="5.5" cy="12" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="18.5" cy="12" r="1.2" />
    </svg>
  );
}

export function IconeArquivo({ size = 20 }: P) {
  return (
    <svg {...base(size)}>
      <rect x="3.5" y="4" width="17" height="4.5" rx="1.5" />
      <path d="M5 8.5V18a2 2 0 002 2h10a2 2 0 002-2V8.5M10 12.5h4" />
    </svg>
  );
}

export function IconeBusca({ size = 18 }: P) {
  return (
    <svg {...base(size)}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}

/** Olho aberto: valores visíveis. */
export function IconeOlho({ size = 20 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Olho riscado: valores escondidos. */
export function IconeOlhoRisco({ size = 20 }: P) {
  return (
    <svg {...base(size)}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.1A9.7 9.7 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4.2M6.6 6.6A17 17 0 002 12s3.5 7 10 7a9.6 9.6 0 004.3-1" />
      <path d="M9.9 9.9a3 3 0 004.2 4.2" />
    </svg>
  );
}

/** Ponto de interrogação num círculo: reabre o tutorial. */
export function IconeAjuda({ size = 20 }: P) {
  return (
    <svg {...base(size)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.6 9.5a2.5 2.5 0 114 2c-.9.6-1.6 1.1-1.6 2.2" />
      <path d="M12 17.2h.01" />
    </svg>
  );
}

/** Cadeado: o que está registrado e não pode ser editado. */
export function IconeCadeado({ size = 16 }: P) {
  return (
    <svg {...base(size)}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 118 0v3" />
    </svg>
  );
}
