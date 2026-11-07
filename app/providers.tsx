"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { ObrasProvider } from "@/lib/obras";
import { ArquitetoProvider } from "@/lib/arquiteto";
import { ConfirmProvider } from "./components/ConfirmProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ObrasProvider>
        <ArquitetoProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ArquitetoProvider>
      </ObrasProvider>
    </AuthProvider>
  );
}
