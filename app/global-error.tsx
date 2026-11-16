"use client";

/** Último recurso: quando até o layout quebra. Sem componentes do app, para não depender do que quebrou. */
export default function ErroGlobal({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="pt-BR">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#f4f2ee", color: "#14110f", margin: 0 }}>
        <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ maxWidth: 360, textAlign: "center" }}>
            <h1 style={{ fontSize: 20 }}>Não consegui abrir o app</h1>
            <p style={{ fontSize: 14, color: "rgba(20,17,15,.65)" }}>Seus dados estão salvos. Tente de novo.</p>
            <button onClick={reset} style={{ marginTop: 12, padding: "10px 18px", borderRadius: 14, border: 0, background: "#d23a1f", color: "#fff", fontWeight: 600, cursor: "pointer" }}>
              Tentar de novo
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
