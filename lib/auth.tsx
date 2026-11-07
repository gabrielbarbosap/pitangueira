"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInAnonymously,
  updateProfile,
  signOut,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "./firebase";

export interface AppUser {
  uid: string;
  email: string;
  nome: string;
  foto?: string;
  /** true = cliente (acesso anônimo por código); false/undefined = arquiteto. */
  anonimo?: boolean;
}

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  configured: boolean;
  erro: string | null;
  /** Login do arquiteto (Google; no demo entra como arquiteto de exemplo). */
  login: () => Promise<void>;
  /** Acesso do cliente: entra anônimo com um nome. Retorna o uid. */
  entrarComoCliente: (nome: string) => Promise<string>;
  logout: () => Promise<void>;
}

const DEMO_ARQUITETO: AppUser = { uid: "demo-arq", email: "gabriel@sistemap.com.br", nome: "Gabriel (demo)" };

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      // Demo: começa deslogado (arquiteto entra pelo botão; cliente pelo código).
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        setUser(null);
      } else {
        setUser({
          uid: fbUser.uid,
          email: fbUser.email ?? "",
          nome: fbUser.displayName ?? (fbUser.isAnonymous ? "Cliente" : fbUser.email ?? "Usuário"),
          foto: fbUser.photoURL ?? undefined,
          anonimo: fbUser.isAnonymous,
        });
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  async function login() {
    setErro(null);
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      setUser(DEMO_ARQUITETO);
      return;
    }
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      if (code === "auth/popup-closed-by-user") return;
      setErro("Não foi possível entrar. Tente novamente.");
    }
  }

  async function entrarComoCliente(nome: string): Promise<string> {
    if (isFirebaseConfigured && auth) {
      const cred = await signInAnonymously(auth);
      try {
        await updateProfile(cred.user, { displayName: nome });
      } catch {
        /* ignore */
      }
      setUser({ uid: cred.user.uid, email: "", nome, anonimo: true });
      return cred.user.uid;
    }
    const uid = "demo-cli-" + Math.random().toString(36).slice(2, 10);
    setUser({ uid, email: "", nome, anonimo: true });
    return uid;
  }

  async function logout() {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    } else {
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, configured: isFirebaseConfigured, erro, login, entrarComoCliente, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
