"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { SENHA_MINIMA, useAuth, type ResultadoAuth } from "@/lib/auth";
import { IconeVoltar } from "./Icones";
import { Logo } from "./Logo";
import { Alerta } from "./ui/Alerta";
import { Botao } from "./ui/Botao";
import { Chip } from "./ui/Chip";

/**
 * Minha conta: como a pessoa entra. Quem entrou com o Google pode criar uma senha; quem entrou com e-mail e senha
 * pode vincular o Google. É sempre a MESMA conta, com os mesmos projetos, qualquer que seja o jeito de entrar.
 */
export function ContaTela() {
  const { user, loading, recuperarSenha, criarSenha, vincularGoogle } = useAuth();
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [ocupado, setOcupado] = useState<null | "senha" | "google" | "link">(null);
  const [aviso, setAviso] = useState<ResultadoAuth | null>(null);

  if (loading) {
    return <div className="grade flex min-h-dvh items-center justify-center font-mono text-xs uppercase tracking-wider text-ink/40">Carregando…</div>;
  }
  if (!user || user.anonimo) {
    return (
      <div className="grade flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-lg font-semibold text-ink">Minha conta é só para arquitetos.</p>
        <Link href="/" className="btn btn-primario px-5 py-2.5 text-sm">Ir para o início</Link>
      </div>
    );
  }

  const temGoogle = user.metodos?.includes("google") ?? false;
  const temSenha = user.metodos?.includes("senha") ?? false;

  async function executar(qual: "senha" | "google" | "link", acao: () => Promise<ResultadoAuth>) {
    if (ocupado) return;
    setOcupado(qual);
    setAviso(null);
    try {
      const r = await acao();
      if (r.mensagem) setAviso(r);
      if (r.ok && qual === "senha") {
        setSenha("");
        setConfirma("");
      }
    } finally {
      setOcupado(null);
    }
  }

  function enviarSenha(e: FormEvent) {
    e.preventDefault();
    if (senha !== confirma) return setAviso({ ok: false, mensagem: "As senhas não são iguais." });
    void executar("senha", () => criarSenha(senha));
  }

  return (
    <div className="grade min-h-dvh">
      <header className="rounded-b-[32px] bg-pitanga pb-8 text-white">
        <div className="mx-auto max-w-3xl px-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="btn-topo" aria-label="Voltar ao painel" title="Voltar ao painel">
              <IconeVoltar />
            </Link>
            <Logo claro />
            <span className="h-10 w-10" aria-hidden />
          </div>
          <p className="rotulo-tec mt-6 text-white/85">Minha conta</p>
          <h1 className="mt-1 text-3xl font-semibold leading-tight tracking-tight">{user.nome}</h1>
          <p className="mt-1 text-sm text-white">{user.email}</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6 pb-16">
        <section aria-label="Como você entra" className="prancha p-4">
          <h2 className="text-lg font-semibold text-ink">Como você entra</h2>
          <p className="mt-1 text-sm leading-snug text-ink/60">É a mesma conta, com os mesmos projetos, seja qual for o jeito de entrar. Deixe os dois ativos e entre como preferir.</p>

          <ul className="mt-4 divide-y divide-linha">
            <li className="py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">Google</p>
                  <p className="text-xs text-ink/55">Entrar com um toque, sem senha.</p>
                </div>
                {temGoogle ? <Chip tom="ok">Ativo</Chip> : <Chip>Não ativado</Chip>}
              </div>
              {!temGoogle && (
                <Botao className="mt-3" onClick={() => executar("google", vincularGoogle)} disabled={ocupado !== null}>
                  {ocupado === "google" ? "Aguarde…" : "Vincular Google"}
                </Botao>
              )}
            </li>

            <li className="py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">E-mail e senha</p>
                  <p className="text-xs text-ink/55">Entrar com {user.email || "o seu e-mail"} e uma senha.</p>
                </div>
                {temSenha ? <Chip tom="ok">Ativo</Chip> : <Chip>Não ativado</Chip>}
              </div>

              {temSenha ? (
                <Botao className="mt-3" onClick={() => executar("link", () => recuperarSenha(user.email))} disabled={ocupado !== null}>
                  {ocupado === "link" ? "Aguarde…" : "Enviar link para trocar a senha"}
                </Botao>
              ) : (
                <form onSubmit={enviarSenha} noValidate aria-label="Criar senha" className="mt-3 space-y-3">
                  <div>
                    <label htmlFor="conta-senha" className="rotulo-campo">Nova senha</label>
                    <input id="conta-senha" type="password" className="input-pit" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" placeholder={`Pelo menos ${SENHA_MINIMA} caracteres`} />
                  </div>
                  <div>
                    <label htmlFor="conta-confirma" className="rotulo-campo">Repita a senha</label>
                    <input id="conta-confirma" type="password" className="input-pit" value={confirma} onChange={(e) => setConfirma(e.target.value)} autoComplete="new-password" />
                  </div>
                  <Botao type="submit" variante="solido" disabled={ocupado !== null}>
                    {ocupado === "senha" ? "Aguarde…" : "Criar senha"}
                  </Botao>
                </form>
              )}
            </li>
          </ul>

          {aviso && <div className="mt-2">{aviso.ok ? <Alerta tom="ok">{aviso.mensagem}</Alerta> : <Alerta tom="perigo">{aviso.mensagem}</Alerta>}</div>}
        </section>
      </main>
    </div>
  );
}
