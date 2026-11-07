/** Régua de progresso: 20 células arredondadas, cada uma vale 5%. */
export function Regua({ pct, altura = "h-2.5" }: { pct: number; altura?: string }) {
  const cheias = Math.round(Math.min(100, Math.max(0, pct)) / 5);
  return (
    <div className="flex gap-[3px]" role="img" aria-label={`${pct}% concluído`}>
      {Array.from({ length: 20 }, (_, i) => (
        <span key={i} className={`${altura} flex-1 rounded-[3px] ${i < cheias ? "bg-ink" : "bg-ink/10"}`} />
      ))}
    </div>
  );
}
