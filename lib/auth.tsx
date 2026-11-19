"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  EmailAuthProvider,
  applyActionCode,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  linkWithCredential,
  linkWithPopup,
  onAuthStateChanged,
  reauthenticateWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  verifyPasswordResetCode,
  type User as FirebaseUser,
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
  /** Jeitos de entrar já ligados a esta conta: "google" e/ou "senha". */
  metodos?: MetodoLogin[];
}

export type MetodoLogin = "google" | "senha";

function metodosDe(u: FirebaseUser): MetodoLogin[] {
  const m: MetodoLogin[] = [];
  if (u.providerData.some((p) => p.providerId === "google.com")) m.push("google");
  if (u.providerData.some((p) => p.providerId === "password")) m.push("senha");
  return m;
}

/** Resultado de uma ação do formulário de login: deu certo ou não, e o que dizer à pessoa. */
export interface ResultadoAuth {
  ok: boolean;
  mensagem: string;
}

export const SENHA_MINIMA = 6;
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Traduz os códigos de erro do Firebase para frases claras, sem revelar se um e-mail existe. */
function mensagemDeErro(e: unknown): string {
  const code = (e as { code?: string }).code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-login-credentials":
      return "E-mail ou senha incorretos. Se você costuma entrar com o Google, entre com ele e crie uma senha em Minha conta.";
    case "auth/credential-already-in-use":
    case "auth/provider-already-linked":
      return "Esse jeito de entrar já está ligado a outra conta.";
    case "auth/expired-action-code":
    case "auth/invalid-action-code":
      return "Este link expirou ou já foi usado. Peça um novo em “Esqueci a senha”.";
    case "auth/user-disabled":
      return "Esta conta está desativada. Fale com o administrador.";
    case "auth/requires-recent-login":
      return "Por segurança, saia, entre de novo e tente mais uma vez.";
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

const DEMO_ARQUITETO: AppUser = { uid: "demo-arq", email: "gabriel@sistemap.com.br", nome: "Gabriel (demo)", metodos: ["google"] };

// ---- Contas do modo demo (só neste navegador; a senha NÃO é protegida: é só para testar o fluxo) ----
const LS_CONTAS_DEMO = "reforma:contas-demo:v1";
interface ContaDemo {
  email: string;
  nome: string;
  senha: string;
  /** No demo, "vincular o Google" só marca a conta (não há Google de verdade). */
  google?: boolean;
}
function lerContasDemo(): ContaDemo[] {
  try {
    return JSON.parse(localStorage.getItem(LS_CONTAS_DEMO) ?? "[]") as ContaDemo[];
  } catch {
    return [];
  }
}
/** A conta de e-mail do arquiteto de exemplo é a MESMA conta do botão do Google (mesmo uid e mesmos dados). */
const usuarioDemo = (c: ContaDemo): AppUser =>
  c.email === DEMO_ARQUITETO.email
    ? { ...DEMO_ARQUITETO, metodos: ["senha", ...(c.google !== false ? (["google"] as MetodoLogin[]) : [])] }
    : { uid: `demo-${c.email}`, email: c.email, nome: c.nome, metodos: ["senha", ...(c.google ? (["google"] as MetodoLogin[]) : [])] };

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
  /** Confere o código do link do e-mail de recuperação e devolve o e-mail da conta. */
  verificarCodigoSenha: (codigo: string) => Promise<ResultadoAuth & { email: string }>;
  /** Grava a nova senha (código do link do e-mail) e já entra com ela. */
  redefinirSenha: (codigo: string, email: string, senha: string) => Promise<ResultadoAuth>;
  /** Confirma o e-mail (código do link do e-mail de verificação). */
  confirmarEmail: (codigo: string) => Promise<ResultadoAuth>;
  /** Quem entrou com o Google passa a poder entrar também com e-mail e senha (mesma conta). */
  criarSenha: (senha: string) => Promise<ResultadoAuth>;
  /** Quem entrou com e-mail e senha passa a poder entrar também com o Google (mesma conta). */
  vincularGoogle: () => Promise<ResultadoAuth>;
  /** Acesso do cliente: entra anônimo com um nome. Retorna o uid. */
  entrarComoCliente: (nome: string) => Promise<string>;
  logout: () => Promise<void>;
}

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
          metodos: metodosDe(fbUser),
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
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      if (code === "auth/account-exists-with-different-credential") {
        setErro("Este e-mail já tem uma conta com senha. Entre com e-mail e senha e, em Minha conta, vincule o Google.");
        return;
      }
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
      // E-mail verificado deixa o Google ligar à mesma conta, se a pessoa entrar por ele com este endereço depois.
      sendEmailVerification(cred.user).catch(() => undefined);
      // O Firebase avisa do login antes do nome ser gravado: acerta o nome aqui.
      setUser({ uid: cred.user.uid, email: e, nome: n, metodos: ["senha"] });
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

  // No demo não há e-mail: o código do link é "demo:<e-mail>" e vale se a conta demo existir.
  const emailDoCodigoDemo = (codigo: string) => (codigo.startsWith("demo:") ? codigo.slice(5).toLowerCase() : "");

  async function verificarCodigoSenha(codigo: string): Promise<ResultadoAuth & { email: string }> {
    if (!codigo) return { ok: false, email: "", mensagem: mensagemDeErro({ code: "auth/invalid-action-code" }) };
    if (!isFirebaseConfigured || !auth) {
      const e = emailDoCodigoDemo(codigo);
      return lerContasDemo().some((c) => c.email === e) ? { ok: true, email: e, mensagem: "" } : { ok: false, email: "", mensagem: mensagemDeErro({ code: "auth/expired-action-code" }) };
    }
    try {
      return { ok: true, email: await verifyPasswordResetCode(auth, codigo), mensagem: "" };
    } catch (err) {
      return { ok: false, email: "", mensagem: mensagemDeErro(err) };
    }
  }

  async function redefinirSenha(codigo: string, email: string, senha: string): Promise<ResultadoAuth> {
    if (senha.length < SENHA_MINIMA) return { ok: false, mensagem: `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.` };
    if (!isFirebaseConfigured || !auth) {
      const e = emailDoCodigoDemo(codigo) || email.toLowerCase();
      const contas = lerContasDemo();
      const conta = contas.find((c) => c.email === e);
      if (!conta) return { ok: false, mensagem: mensagemDeErro({ code: "auth/expired-action-code" }) };
      const nova = { ...conta, senha };
      try {
        localStorage.setItem(LS_CONTAS_DEMO, JSON.stringify(contas.map((c) => (c.email === e ? nova : c))));
      } catch {
        /* sem armazenamento */
      }
      setUser(usuarioDemo(nova));
      registrarEvento("senha_redefinida");
      return { ok: true, mensagem: "" };
    }
    try {
      await confirmPasswordReset(auth, codigo, senha);
    } catch (err) {
      return { ok: false, mensagem: mensagemDeErro(err) };
    }
    registrarEvento("senha_redefinida");
    // Já entra com a senha nova (se falhar, a pessoa entra pela tela inicial: a senha já está trocada).
    try {
      await signInWithEmailAndPassword(auth, email, senha);
    } catch {
      /* ok */
    }
    return { ok: true, mensagem: "" };
  }

  async function confirmarEmail(codigo: string): Promise<ResultadoAuth> {
    if (!isFirebaseConfigured || !auth) return codigo ? { ok: true, mensagem: "" } : { ok: false, mensagem: mensagemDeErro({ code: "auth/invalid-action-code" }) };
    try {
      await applyActionCode(auth, codigo);
      return { ok: true, mensagem: "" };
    } catch (err) {
      return { ok: false, mensagem: mensagemDeErro(err) };
    }
  }

  /** Refaz o login com o Google (quando o Firebase pede "login recente" para uma ação sensível). */
  async function reautenticar(u: FirebaseUser): Promise<boolean> {
    if (!googleProvider || !metodosDe(u).includes("google")) return false;
    try {
      await reauthenticateWithPopup(u, googleProvider);
      return true;
    } catch {
      return false;
    }
  }

  async function criarSenha(senha: string): Promise<ResultadoAuth> {
    if (senha.length < SENHA_MINIMA) return { ok: false, mensagem: `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.` };
    if (!isFirebaseConfigured || !auth) {
      if (!user || user.anonimo || !user.email) return { ok: false, mensagem: "Entre primeiro." };
      const contas = lerContasDemo().filter((c) => c.email !== user.email);
      const antiga = lerContasDemo().find((c) => c.email === user.email);
      const nova: ContaDemo = { email: user.email, nome: user.nome, senha, google: antiga?.google ?? !user.metodos?.includes("senha") };
      try {
        localStorage.setItem(LS_CONTAS_DEMO, JSON.stringify([...contas, nova]));
      } catch {
        /* sem armazenamento */
      }
      setUser({ ...user, metodos: ["google", "senha"] });
      return { ok: true, mensagem: "Senha criada. Agora você também pode entrar com e-mail e senha." };
    }
    const u = auth.currentUser;
    if (!u || u.isAnonymous || !u.email) return { ok: false, mensagem: "Entre primeiro." };
    const credencial = EmailAuthProvider.credential(u.email, senha);
    const tentar = async () => {
      await linkWithCredential(u, credencial);
      setUser((atual) => (atual ? { ...atual, metodos: metodosDe(u) } : atual));
      registrarEvento("metodo_vinculado", { metodo: "senha" });
      return { ok: true, mensagem: "Senha criada. Agora você também pode entrar com e-mail e senha." };
    };
    try {
      return await tentar();
    } catch (err) {
      if ((err as { code?: string }).code === "auth/requires-recent-login" && (await reautenticar(u))) {
        try {
          return await tentar();
        } catch (err2) {
          return { ok: false, mensagem: mensagemDeErro(err2) };
        }
      }
      return { ok: false, mensagem: mensagemDeErro(err) };
    }
  }

  async function vincularGoogle(): Promise<ResultadoAuth> {
    if (!isFirebaseConfigured || !auth || !googleProvider) {
      if (!user || user.anonimo) return { ok: false, mensagem: "Entre primeiro." };
      const contas = lerContasDemo();
      const antiga = contas.find((c) => c.email === user.email);
      if (antiga) {
        try {
          localStorage.setItem(LS_CONTAS_DEMO, JSON.stringify(contas.map((c) => (c.email === user.email ? { ...c, google: true } : c))));
        } catch {
          /* sem armazenamento */
        }
      }
      setUser({ ...user, metodos: ["senha", "google"] });
      return { ok: true, mensagem: "Google vinculado. Agora você também pode entrar com o Google." };
    }
    const u = auth.currentUser;
    if (!u || u.isAnonymous) return { ok: false, mensagem: "Entre primeiro." };
    try {
      await linkWithPopup(u, googleProvider);
      setUser((atual) => (atual ? { ...atual, metodos: metodosDe(u) } : atual));
      registrarEvento("metodo_vinculado", { metodo: "google" });
      return { ok: true, mensagem: "Google vinculado. Agora você também pode entrar com o Google." };
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return { ok: false, mensagem: "" };
      return { ok: false, mensagem: mensagemDeErro(err) };
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
    <AuthContext.Provider value={{ user, loading, configured: isFirebaseConfigured, erro, login, loginComEmail, criarConta, recuperarSenha, criarSenha, vincularGoogle, verificarCodigoSenha, redefinirSenha, confirmarEmail, entrarComoCliente, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
