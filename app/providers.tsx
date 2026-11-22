"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { ObrasProvider } from "@/lib/obras";
import { ArquitetoProvider } from "@/lib/arquiteto";
import { PlanoProvider } from "@/lib/plano";
import { PrivacidadeProvider } from "@/lib/privacidade";
import { ConfirmProvider } from "./components/ConfirmProvider";
import { Telemetria } from "./components/Telemetria";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Telemetria />
      <ObrasProvider>
        <PlanoProvider>
          <ArquitetoProvider>
            <PrivacidadeProvider>
              <ConfirmProvider>{children}</ConfirmProvider>
            </PrivacidadeProvider>
          </ArquitetoProvider>
        </PlanoProvider>
      </ObrasProvider>
    </AuthProvider>
  );
}
