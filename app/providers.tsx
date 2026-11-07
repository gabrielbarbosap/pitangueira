"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth";
import { ObrasProvider } from "@/lib/obras";
import { ConfirmProvider } from "./components/ConfirmProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ObrasProvider>
        <ConfirmProvider>{children}</ConfirmProvider>
      </ObrasProvider>
    </AuthProvider>
  );
}
