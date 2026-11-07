"use client";

import { use, useState } from "react";
import { useAuth } from "@/lib/auth";
import { DataProvider } from "@/lib/data";
import { Dashboard } from "@/app/components/Dashboard";
import { AcessoObra } from "@/app/components/AcessoObra";

export function ObraClient({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading } = useAuth();
  const [liberado, setLiberado] = useState(false);

  if (loading) {
    return <div className="grade flex min-h-dvh items-center justify-center font-mono text-xs uppercase tracking-wider text-ink/40">Carregando…</div>;
  }

  // Arquiteto logado (Google) → acesso de dono.
  if (user && !user.anonimo) {
    return (
      <DataProvider obraId={id}>
        <Dashboard />
      </DataProvider>
    );
  }

  // Cliente que já passou pelo código → dashboard limitado.
  if (liberado) {
    return (
      <DataProvider obraId={id}>
        <Dashboard />
      </DataProvider>
    );
  }

  // Cliente novo → tela de código + nome.
  return <AcessoObra obraId={id} onAcesso={() => setLiberado(true)} />;
}
