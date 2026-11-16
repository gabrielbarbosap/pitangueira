"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { definirContexto, registrarErro, registrarEvento } from "@/lib/telemetria";

/** Liga a medição de uso e a captura de erros do navegador. Não desenha nada. */
export function Telemetria() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const papel = user ? (user.anonimo ? "cliente" : "arquiteto") : "visitante";

  // Quem está usando, e uma "sessão iniciada" por conta a cada carregamento do app.
  useEffect(() => {
    definirContexto(uid, papel);
    if (uid) registrarEvento("sessao_iniciada");
  }, [uid, papel]);

  // Erros que ninguém tratou: viram registro no painel de uso, sem atrapalhar quem usa.
  useEffect(() => {
    const aoErro = (e: ErrorEvent) => registrarErro("erro_janela", e.error ?? e.message);
    const aoRejeitar = (e: PromiseRejectionEvent) => registrarErro("promessa_rejeitada", e.reason);
    window.addEventListener("error", aoErro);
    window.addEventListener("unhandledrejection", aoRejeitar);
    return () => {
      window.removeEventListener("error", aoErro);
      window.removeEventListener("unhandledrejection", aoRejeitar);
    };
  }, []);

  return null;
}
