"use client";

import { useAuth } from "@/lib/auth";
import { LoginScreen } from "./components/LoginScreen";
import { Painel } from "./components/Painel";
import { HomeCliente } from "./components/HomeCliente";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="grade flex min-h-dvh items-center justify-center font-mono text-xs uppercase tracking-wider text-ink/40">Carregando…</div>;
  }
  if (!user) return <LoginScreen />;
  // Duas homes: cliente (acesso anônimo por código) x arquiteto (Google).
  return user.anonimo ? <HomeCliente /> : <Painel />;
}
