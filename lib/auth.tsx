"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "./firebase";
import { registrarEvento } from "./telemetria";

export interface AppUser {
  uid: string;
  email: string;
  nome: string;
  foto?: string;
  /** true = cliente (acesso anônimo por código); false/undefined = arquiteto. */
  anonimo?: boolean;
}

/** Resultado de uma ação do formulário de login: deu certo ou não, e o que dizer à pessoa. */
export interface ResultadoAuth {
  ok: boolean;
  mensagem: string;
}

export const SENHA_MINIMA = 6;
const EMAIL_VALIDO = /^[^s@]+@[^s@]+.[^s@]{2,}$/;

/** Traduz os códigos de erro do Firebase para frases claras, sem revelar se um e-mail existe. */
function mensagemDeErro(e: unknown): string {
  const code = (e as { code?: string }).code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-login-credentials":
      return "E-mail ou senha incorretos.";
    case "auth/email-already-in-use":
      return "Já existe uma conta com este e-mail. Entre, ou use “Esqueci a senha”.";
    case "auth/weak-password":
      return `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`;
    case "auth/invalid-email":
      return "Esse e-mail não parece válido.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Espere alguns minutos e tente de novo.";
    case "auth/network-request-failed":
      return "Sem conexão. Confira a internet e tente de novo.";
    case "auth/operation-not-allowed":
      return "Entrar com e-mail e senha ainda não está ativado neste app. Use o Google ou avise o administrador.";
    default:
      return "Não foi possível concluir. Tente novamente.";
  }
}

// ---- Contas do modo demo (só neste navegador; a senha NÃO é protegida: é só para testar o fluxo) ----
const LS_CONTAS_DEMO = "reforma:contas-demo:v1";
interface ContaDemo {
  email: string;
  nome: string;
  senha: string;
}
function lerContasDemo(): ContaDemo[] {
  try {
    return JSON.parse(localStorage.getItem(LS_CONTAS_DEMO) ?? "[]") as ContaDemo[];
  } catch {
    return [];
  }
}
const usuarioDemo = (c: ContaDemo): AppUser => ({ uid: `demo-${c.email}`, email: c.email, nome: c.nome });

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  configured: boolean;
  erro: string | null;
  /** Login do arquiteto (Google; no demo entra como arquiteto de exemplo). */
  login: () => Promise<void>;
  /** Login do arquiteto com e-mail e senha. */
  loginComEmail: (email: string, senha: string) => Promise<ResultadoAuth>;
  /** Cria a conta de arquiteto com nome, e-mail e senha (e já entra). */
  criarConta: (nome: string, email: string, senha: string) => Promise<ResultadoAuth>;
  /** Envia o link para criar uma nova senha. */
  recuperarSenha: (email: string) => Promise<ResultadoAuth>;
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

  async function loginComEmail(email: string, senha: string): Promise<ResultadoAuth> {
    const e = email.trim().toLowerCase();
    if (!EMAIL_VALIDO.test(e)) return { ok: false, mensagem: "Esse e-mail não parece válido." };
    if (!senha) return { ok: false, mensagem: "Digite a senha." };
    if (!isFirebaseConfigured || !auth) {
      const conta = lerContasDemo().find((c) => c.email === e && c.senha === senha);
      if (!conta) return { ok: false, mensagem: "E-mail ou senha incorretos." };
      setUser(usuarioDemo(conta));
      return { ok: true, mensagem: "" };
    }
    try {
      await signInWithEmailAndPassword(auth, e, senha);
      return { ok: true, mensagem: "" };
    } catch (err) {
      return { ok: false, mensagem: mensagemDeErro(err) };
    }
  }

  async function criarConta(nome: string, email: string, senha: string): Promise<ResultadoAuth> {
    const n = nome.trim();
    const e = email.trim().toLowerCase();
    if (!n) return { ok: false, mensagem: "Diga como devemos te chamar." };
    if (!EMAIL_VALIDO.test(e)) return { ok: false, mensagem: "Esse e-mail não parece válido." };
    if (senha.length < SENHA_MINIMA) return { ok: false, mensagem: `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.` };
    if (!isFirebaseConfigured || !auth) {
      const contas = lerContasDemo();
      if (contas.some((c) => c.email === e)) return { ok: false, mensagem: "Já existe uma conta com este e-mail. Entre, ou use “Esqueci a senha”." };
      const conta = { email: e, nome: n, senha };
      try {
        localStorage.setItem(LS_CONTAS_DEMO, JSON.stringify([...contas, conta]));
      } catch {
        /* sem armazenamento: a conta vale só nesta visita */
      }
      setUser(usuarioDemo(conta));
      registrarEvento("conta_criada", { metodo: "email" });
      return { ok: true, mensagem: "" };
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, e, senha);
      try {
        await updateProfile(cred.user, { displayName: n });
      } catch {
        /* o nome é um detalhe: a conta já existe */
      }
      // O Firebase avisa do login antes do nome ser gravado: acerta o nome aqui.
      setUser({ uid: cred.user.uid, email: e, nome: n });
      registrarEvento("conta_criada", { metodo: "email" });
      return { ok: true, mensagem: "" };
    } catch (err) {
      return { ok: false, mensagem: mensagemDeErro(err) };
    }
  }

  async function recuperarSenha(email: string): Promise<ResultadoAuth> {
    const e = email.trim().toLowerCase();
    if (!EMAIL_VALIDO.test(e)) return { ok: false, mensagem: "Digite o e-mail da sua conta." };
    if (!isFirebaseConfigured || !auth) {
      return { ok: true, mensagem: "No modo demo não enviamos e-mails. Em produção você receberia o link para criar uma nova senha." };
    }
    try {
      await sendPasswordResetEmail(auth, e);
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      // Não revelamos se o e-mail tem conta: só falhas de rede ou de formato aparecem.
      if (code !== "auth/user-not-found") return { ok: false, mensagem: mensagemDeErro(err) };
    }
    return { ok: true, mensagem: "Se existir uma conta com esse e-mail, enviamos o link para criar uma nova senha. Confira também a caixa de spam." };
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
    <AuthContext.Provider value={{ user, loading, configured: isFirebaseConfigured, erro, login, loginComEmail, criarConta, recuperarSenha, entrarComoCliente, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
