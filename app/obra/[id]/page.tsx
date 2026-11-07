import { Suspense } from "react";
import { ObraClient } from "./ObraClient";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="grade flex min-h-dvh items-center justify-center font-mono text-xs uppercase tracking-wider text-ink/40">Carregando…</div>}>
      <ObraClient params={params} />
    </Suspense>
  );
}
