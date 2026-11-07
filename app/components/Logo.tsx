import Image from "next/image";

// Proporção da logo oficial (403 x 512).
const PROPORCAO = 403 / 512;

/** A logo oficial da Pitangueira. `claro` usa a versão branca (para fundo laranja); `size` é a altura em px. */
export function LogoMark({ size = 32, claro = false }: { size?: number; claro?: boolean }) {
  return (
    <Image
      src={claro ? "/logo-branco.png" : "/logo-pitanga.png"}
      alt=""
      width={Math.round(size * PROPORCAO)}
      height={size}
      style={{ height: size, width: "auto" }}
      unoptimized
      priority
      aria-hidden
    />
  );
}

/** Logo + nome. */
export function Logo({ claro = false }: { claro?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <LogoMark claro={claro} />
      <span className={`font-mono text-[12px] font-semibold uppercase tracking-[0.18em] ${claro ? "text-white" : "text-ink"}`}>Pitangueira</span>
    </span>
  );
}
