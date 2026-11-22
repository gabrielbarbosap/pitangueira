"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { SENHA_MINIMA, useAuth } from "@/lib/auth";
import { LogoMark } from "./Logo";
import { Alerta } from "./ui/Alerta";
import { Botao } from "./ui/Botao";

type Modo = "entrar" | "criar" | "esqueci";

const TITULO: Record<Modo, string> = { entrar: "Entrar", criar: "Criar conta", esqueci: "Recuperar a senha" };
const ENVIAR: Record<Modo, string> = { entrar: "Entrar", criar: "Criar conta", esqueci: "Enviar o link" };

/** Entrada do arquiteto: Google, ou e-mail e senha (entrar, criar conta e recuperar a senha). */
export function LoginScreen({ embutido = false }: { embutido?: boolean } = {}) {
  const { login, loginComEmail, criarConta, recuperarSenha, erro } = useAuth();
  const [modo, setModo] = useState<Modo>("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);

  function trocar(m: Modo) {
    setModo(m);
    setAviso(null);
    setSenha("");
  }

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (ocupado) return;
    setOcupado(true);
    setAviso(null);
    try {
      const r = modo === "entrar" ? await loginComEmail(email, senha) : modo === "criar" ? await criarConta(nome, email, senha) : await recuperarSenha(email);
      // Ao entrar ou criar a conta, a tela some sozinha (o app passa a mostrar o painel).
      if (!r.ok || modo === "esqueci") setAviso({ ok: r.ok, texto: r.mensagem });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className={embutido ? "w-full" : "grade flex min-h-dvh items-center justify-center p-5"}>
      <div className="prancha mx-auto w-full max-w-sm p-8 text-ink">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-5 flex justify-center">
            <LogoMark size={84} />
          </div>
          <p className="font-mono text-[13px] font-semibold uppercase tracking-[0.24em] text-ink">Pitangueira</p>
          {embutido ? <h2 className="mt-3 text-xl font-semibold leading-tight text-ink">Entre ou crie sua conta</h2> : <h1 className="mt-3 text-xl font-semibold leading-tight text-ink">Gestão de projetos, do arquiteto ao cliente</h1>}
          <p className="mt-2 text-sm text-ink/60">Orçamento, pagamentos e andamento em um só lugar.</p>
        </div>

        <button onClick={login} className="btn btn-linha w-full gap-3 px-4 py-3.5 text-sm font-semibold">
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
            <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
          </svg>
          Entrar com Google
        </button>

        {erro && (
          <p className="mt-4 rounded-xl border border-pitanga bg-pitanga/[0.07] px-3 py-2 text-center text-sm font-medium text-pitanga-escuro" role="alert">
            {erro}
          </p>
        )}

        <div className="my-5 flex items-center gap-3" aria-hidden>
          <span className="h-px flex-1 bg-linha" />
          <span className="rotulo-tec text-ink/40">ou com e-mail</span>
          <span className="h-px flex-1 bg-linha" />
        </div>

        <form onSubmit={enviar} noValidate aria-label={TITULO[modo]} className="space-y-3.5">
          <h2 className="text-base font-semibold text-ink">{TITULO[modo]}</h2>

          {modo === "criar" && (
            <div>
              <label htmlFor="login-nome" className="rotulo-campo">Seu nome</label>
              <input id="login-nome" className="input-pit" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" placeholder="Como devemos te chamar" />
            </div>
          )}

          <div>
            <label htmlFor="login-email" className="rotulo-campo">E-mail</label>
            <input id="login-email" type="email" inputMode="email" className="input-pit" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="voce@escritorio.com.br" />
          </div>

          {modo !== "esqueci" && (
            <div>
              <div className="flex items-end justify-between">
                <label htmlFor="login-senha" className="rotulo-campo">Senha</label>
                <button type="button" onClick={() => setVerSenha((v) => !v)} className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink/50 hover:text-ink" aria-pressed={verSenha}>
                  {verSenha ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <input
                id="login-senha"
                type={verSenha ? "text" : "password"}
                className="input-pit"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete={modo === "criar" ? "new-password" : "current-password"}
                placeholder={modo === "criar" ? `Pelo menos ${SENHA_MINIMA} caracteres` : "Sua senha"}
              />
              {modo === "entrar" && (
                <button type="button" onClick={() => trocar("esqueci")} className="mt-1.5 text-xs font-medium text-pitanga hover:underline">
                  Esqueci a senha
                </button>
              )}
            </div>
          )}

          {modo === "esqueci" && <p className="text-xs leading-snug text-ink/60">Digite o e-mail da sua conta. Enviamos um link para você criar uma nova senha.</p>}

          {aviso && (aviso.ok ? <Alerta tom="ok">{aviso.texto}</Alerta> : <Alerta tom="perigo">{aviso.texto}</Alerta>)}

          <Botao type="submit" variante="primario" tamanho="grande" className="w-full" disabled={ocupado}>
            {ocupado ? "Aguarde…" : ENVIAR[modo]}
          </Botao>
        </form>

        <p className="mt-4 text-center text-sm text-ink/65">
          {modo === "entrar" ? (
            <>
              Ainda não tem conta?{" "}
              <button type="button" onClick={() => trocar("criar")} className="font-semibold text-pitanga hover:underline">
                Criar conta
              </button>
            </>
          ) : (
            <>
              {modo === "criar" ? "Já tem conta? " : "Lembrou a senha? "}
              <button type="button" onClick={() => trocar("entrar")} className="font-semibold text-pitanga hover:underline">
                Entrar
              </button>
            </>
          )}
        </p>

        <p className="mt-5 text-center text-sm text-ink/60">
          Quer entender como funciona?{" "}
          <Link href="/docs" className="font-medium text-pitanga underline underline-offset-2">
            Veja a documentação
          </Link>
        </p>
      </div>
    </div>
  );
}
