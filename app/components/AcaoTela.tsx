"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { SENHA_MINIMA, useAuth } from "@/lib/auth";
import { LogoMark } from "./Logo";
import { Alerta } from "./ui/Alerta";
import { Botao } from "./ui/Botao";

type Estado =
  | { fase: "verificando" }
  | { fase: "formulario"; email: string }
  | { fase: "pronto"; titulo: string; texto: string }
  | { fase: "erro"; mensagem: string };

/**
 * Página que recebe os links dos e-mails do Firebase (o endereço fica configurado no console, em
 * Authentication → Modelos de e-mail → Personalizar URL de ação). Mostra tudo com a cara da Pitangueira, em português:
 * criar a nova senha (mode=resetPassword) e confirmar o e-mail (mode=verifyEmail).
 */
export function AcaoTela() {
  const params = useSearchParams();
  const modo = params.get("mode") ?? "";
  const codigo = params.get("oobCode") ?? "";
  const { verificarCodigoSenha, redefinirSenha, confirmarEmail } = useAuth();

  const [estado, setEstado] = useState<Estado>({ fase: "verificando" });
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [verSenha, setVerSenha] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  // Confere o código assim que a página abre: link vencido ou já usado aparece antes de a pessoa digitar qualquer coisa.
  useEffect(() => {
    let vivo = true;
    (async () => {
      if (modo === "resetPassword") {
        const r = await verificarCodigoSenha(codigo);
        if (vivo) setEstado(r.ok ? { fase: "formulario", email: r.email } : { fase: "erro", mensagem: r.mensagem });
      } else if (modo === "verifyEmail") {
        const r = await confirmarEmail(codigo);
        if (vivo) setEstado(r.ok ? { fase: "pronto", titulo: "E-mail confirmado", texto: "Pronto: o seu e-mail foi confirmado." } : { fase: "erro", mensagem: r.mensagem });
      } else if (vivo) {
        setEstado({ fase: "erro", mensagem: "Este link não é válido. Peça um novo pelo app." });
      }
    })();
    return () => {
      vivo = false;
    };
    // As funções do contexto mudam a cada render; o que importa é o link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo, codigo]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (estado.fase !== "formulario" || ocupado) return;
    setErro("");
    if (senha.length < SENHA_MINIMA) return setErro(`A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`);
    if (senha !== confirma) return setErro("As senhas não são iguais.");
    setOcupado(true);
    try {
      const r = await redefinirSenha(codigo, estado.email, senha);
      if (r.ok) setEstado({ fase: "pronto", titulo: "Senha alterada", texto: "Sua nova senha já está valendo e você já está dentro da sua conta." });
      else setErro(r.mensagem);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="grade flex min-h-dvh items-center justify-center p-5">
      <div className="prancha w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <LogoMark size={64} />
          </div>
          <p className="font-mono text-[13px] font-semibold uppercase tracking-[0.24em] text-ink">Pitangueira</p>
        </div>

        {estado.fase === "verificando" && (
          <p role="status" className="text-center font-mono text-xs uppercase tracking-wider text-ink/45">
            Conferindo o link…
          </p>
        )}

        {estado.fase === "formulario" && (
          <form onSubmit={enviar} noValidate aria-label="Criar nova senha" className="space-y-3.5">
            <div>
              <h1 className="text-xl font-semibold leading-tight text-ink">Criar nova senha</h1>
              <p className="mt-1 text-sm text-ink/60">
                Para a conta <strong className="font-semibold text-ink">{estado.email}</strong>.
              </p>
            </div>
            <div>
              <div className="flex items-end justify-between">
                <label htmlFor="acao-senha" className="rotulo-campo">Nova senha</label>
                <button type="button" onClick={() => setVerSenha((v) => !v)} aria-pressed={verSenha} className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink/50 hover:text-ink">
                  {verSenha ? "Ocultar" : "Mostrar"}
                </button>
              </div>
              <input
                id="acao-senha"
                type={verSenha ? "text" : "password"}
                className="input-pit"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="new-password"
                placeholder={`Pelo menos ${SENHA_MINIMA} caracteres`}
              />
            </div>
            <div>
              <label htmlFor="acao-confirma" className="rotulo-campo">Repita a senha</label>
              <input id="acao-confirma" type={verSenha ? "text" : "password"} className="input-pit" value={confirma} onChange={(e) => setConfirma(e.target.value)} autoComplete="new-password" />
            </div>
            {erro && <Alerta tom="perigo">{erro}</Alerta>}
            <Botao type="submit" variante="primario" tamanho="grande" className="w-full" disabled={ocupado}>
              {ocupado ? "Salvando…" : "Salvar nova senha"}
            </Botao>
          </form>
        )}

        {estado.fase === "pronto" && (
          <div className="space-y-4 text-center">
            <h1 className="text-xl font-semibold text-ink">{estado.titulo}</h1>
            <p className="text-sm leading-snug text-ink/65">{estado.texto}</p>
            <Link href="/" className="btn btn-primario w-full px-4 py-3.5 text-sm">
              Ir para o painel
            </Link>
          </div>
        )}

        {estado.fase === "erro" && (
          <div className="space-y-4">
            <h1 className="text-center text-xl font-semibold text-ink">Não deu certo</h1>
            <Alerta tom="perigo">{estado.mensagem}</Alerta>
            <Link href="/" className="btn btn-linha w-full px-4 py-3 text-sm">
              Voltar ao início
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
