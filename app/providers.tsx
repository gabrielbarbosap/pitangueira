"use client";

import { Suspense, type ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { ObrasProvider } from "@/lib/obras";
import { ArquitetoProvider } from "@/lib/arquiteto";
import { PlanoProvider } from "@/lib/plano";
import { PrivacidadeProvider } from "@/lib/privacidade";
import { ConfirmProvider } from "./components/ConfirmProvider";
import { MuroAssinatura } from "./components/MuroAssinatura";
import { Telemetria } from "./components/Telemetria";
import { Analytics } from "./components/Analytics";
import { Consentimento } from "./components/Consentimento";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Telemetria />
      {/* usePathname é dinâmico: o Suspense deixa o prerender seguir e o Analytics decide no cliente. */}
      <Suspense fallback={null}>
        <Analytics />
      </Suspense>
      <Consentimento />
      <ObrasProvider>
        <PlanoProvider>
          <ArquitetoProvider>
            <PrivacidadeProvider>
              <ConfirmProvider>
                {/* O muro lê a rota atual (usePathname), que é dinâmica: o Suspense deixa o prerender usar a própria
                    página como shell e o muro decide no cliente. */}
                <Suspense fallback={children}>
                  <MuroAssinatura>{children}</MuroAssinatura>
                </Suspense>
              </ConfirmProvider>
            </PrivacidadeProvider>
          </ArquitetoProvider>
        </PlanoProvider>
      </ObrasProvider>
    </AuthProvider>
  );
}
