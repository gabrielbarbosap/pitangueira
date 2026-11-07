"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useAuth } from "@/lib/auth";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase";
import { LS_OBRAS, lsClienteKey } from "@/lib/demo";
import { Logo } from "./Logo";

export function AcessoObra({ obraId, onAcesso }: { obraId: string; onAcesso: () => void }) {
  const { user, entrarComoCliente, logout } = useAuth();
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);
  const [verificando, setVerificando] = useState(true);

  // Cliente que já acessou antes (sessão anônima + vínculo) entra direto.
  useEffect(() => {
    let active = true;
    (async () => {
      if (user?.anonimo) {
        if (isFirebaseConfigured && db) {
          try {
            const s = await getDoc(doc(db, "obras", obraId, "members", user.uid));
            if (active && s.exists()) return onAcesso();
          } catch {
            /* segue pro formulário */
          }
        } else if (localStorage.getItem(lsClienteKey(obraId))) {
          if (active) return onAcesso();
        }
      }
      if (active) setVerificando(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function entrar() {
    if (!codigo.trim() || !nome.trim() || entrando) return;
    setEntrando(true);
    setErro(null);
    try {
      if (isFirebaseConfigured && auth && db) {
        const uid = await entrarComoCliente(nome.trim());
        try {
          await setDoc(doc(db, "obras", obraId, "members", uid), {
            nome: nome.trim(),
            code: codigo.trim().toUpperCase(),
            role: "cliente",
            createdAt: Date.now(),
          });
        } catch {
          await logout();
          setErro("Código incorreto para esta obra.");
          setEntrando(false);
          return;
        }
        onAcesso();
      } else {
        const obras = JSON.parse(localStorage.getItem(LS_OBRAS) ?? "[]") as { id: string; accessCode?: string }[];
        const o = obras.find((x) => x.id === obraId);
        if (!o || (o.accessCode ?? "").toUpperCase() !== codigo.trim().toUpperCase()) {
          setErro("Código incorreto para esta obra.");
          setEntrando(false);
          return;
        }
        localStorage.setItem(lsClienteKey(obraId), nome.trim());
        await entrarComoCliente(nome.trim());
        onAcesso();
      }
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      setErro(
        code === "auth/operation-not-allowed"
          ? "O acesso anônimo não está ativado no Firebase. Avise o arquiteto."
          : "Não foi possível acessar. Tente de novo.",
      );
      setEntrando(false);
    }
  }

  if (verificando) {
    return <div className="grade flex min-h-dvh items-center justify-center font-mono text-xs uppercase tracking-wider text-ink/40">Carregando…</div>;
  }

  const campo = "campo-pit w-full border border-ink/25 bg-white px-3 py-3 text-sm text-ink outline-none";

  return (
    <div className="grade flex min-h-dvh items-center justify-center p-5">
      <div className="prancha w-full max-w-sm p-7">
        <div className="mb-6">
          <Logo />
          <p className="rotulo-tec mt-6 text-ink/50">Acompanhar obra</p>
          <h1 className="mt-1 text-2xl font-semibold leading-tight text-ink">Entre com o código da obra</h1>
          <p className="mt-2 text-sm text-ink/60">Use o código que o arquiteto enviou junto com o link. Seu nome fica registrado nas marcações que você fizer.</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="rotulo-tec mb-1 block text-ink/55">Código</label>
            <input
              className={`${campo} text-center font-mono text-base tracking-[0.3em]`}
              placeholder="ABC123"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && entrar()}
              autoCapitalize="characters"
            />
          </div>
          <div>
            <label className="rotulo-tec mb-1 block text-ink/55">Seu nome</label>
            <input
              className={campo}
              placeholder="Como devemos te chamar"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && entrar()}
            />
          </div>
          <button onClick={entrar} disabled={entrando || !codigo.trim() || !nome.trim()} className="btn btn-primario w-full px-4 py-3.5 text-sm">
            {entrando ? "Entrando…" : "Entrar na obra"}
          </button>
          {erro && (
            <p className="border border-pitanga bg-pitanga/[0.07] px-3 py-2 text-center text-sm font-medium text-pitanga-escuro" role="alert">
              {erro}
            </p>
          )}
        </div>

        <p className="mt-6 border-t border-linha pt-4 text-center text-xs text-ink/50">
          É o arquiteto?{" "}
          <Link href="/" className="font-semibold text-ink underline decoration-ink/30 underline-offset-2 transition-colors hover:text-pitanga hover:decoration-pitanga">
            Entrar pelo painel
          </Link>
        </p>
      </div>
    </div>
  );
}
