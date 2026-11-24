"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { track } from "@/lib/analytics";
import { CANCELAMENTO_DIAS } from "@/lib/empresa";
import { usePlano } from "@/lib/plano";
import { emReais, precoAnualTotal, precoPorMes, temPreco, type Ciclo } from "@/lib/precos";
import { LIMITE_FRASE, ORDEM_PLANOS, PLANOS, TESTE_DIAS } from "@/lib/planos";
import { IconeVoltar } from "../Icones";
import { Logo } from "../Logo";
import { Chip } from "../ui/Chip";
import { classeBotao } from "../ui/Botao";

const Marca = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
);

/** A página de planos: o que cada um inclui, o plano atual e como assinar. Pública (serve de vitrine). */
export function PlanosTela() {
  const { user } = useAuth();
  const logado = !!user && !user.anonimo;
  return (
    <div className="grade min-h-dvh">
      <header className="rounded-b-[32px] bg-pitanga pb-10 text-white">
        <div className="mx-auto max-w-5xl px-4 pt-4">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="btn-topo" aria-label="Voltar ao início" title="Voltar ao início">
              <IconeVoltar />
            </Link>
            <Logo claro />
            <span className="h-10 w-10" aria-hidden />
          </div>
          <p className="rotulo-tec mt-6 text-white/85">Planos</p>
          <h1 className="mt-1 max-w-2xl text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Escolha o plano do tamanho da sua operação</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white">
            Todo plano tem o orçamento completo e o acesso do cliente por código, sem limite de clientes. Comece com {TESTE_DIAS} dias grátis no plano que escolher — a cobrança só começa depois e você cancela quando quiser.
          </p>
        </div>
      </header>
      {logado ? <ComPlano /> : <Cartoes atual={null} logado={false} />}
      <Rodape />
    </div>
  );
}

function ComPlano() {
  const { def, efetivo } = usePlano();
  return <Cartoes atual={def.id} origem={efetivo.origem} diasDeTeste={efetivo.diasDeTeste} logado />;
}

function Cartoes({ atual, origem, diasDeTeste, logado }: { atual: keyof typeof PLANOS | null; origem?: string; diasDeTeste?: number; logado: boolean }) {
  const [ciclo, setCiclo] = useState<Ciclo>("mensal");
  useEffect(() => track("planos_visualizados", { logado, plano: atual ?? "nenhum" }), [logado, atual]);
  const algumComPreco = ORDEM_PLANOS.some((id) => temPreco(id));
  return (
    <main className="mx-auto max-w-5xl px-4 py-8 pb-12">
      {logado && atual && (
        <p className="mb-5 text-sm text-ink/70" role="status">
          Seu plano agora: <strong className="text-ink">{PLANOS[atual].nome}</strong>
          {origem === "teste" && ` (teste grátis: ${diasDeTeste === 1 ? "falta 1 dia" : `faltam ${diasDeTeste} dias`})`}
          {origem === "cortesia" && " (cortesia, por enquanto)"}
          {origem === "sem-assinatura" && " (sem assinatura)"}.
        </p>
      )}
      {algumComPreco && (
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2" role="group" aria-label="Ciclo de cobrança">
          <button type="button" onClick={() => setCiclo("mensal")} aria-pressed={ciclo === "mensal"} className={classeBotao(ciclo === "mensal" ? "solido" : "linha", "pequeno")}>
            Mensal
          </button>
          <button type="button" onClick={() => setCiclo("anual")} aria-pressed={ciclo === "anual"} className={classeBotao(ciclo === "anual" ? "solido" : "linha", "pequeno")}>
            Anual · 2 meses grátis
          </button>
        </div>
      )}
      <div className="grid gap-4 lg:grid-cols-3">
        {ORDEM_PLANOS.map((id) => {
          const p = PLANOS[id];
          const eAtual = atual === id;
          return (
            <section key={id} aria-label={`Plano ${p.nome}`} className={`prancha relative flex flex-col p-6 ${p.destaque ? "border-2 border-pitanga shadow-[0_24px_50px_-30px_rgba(210,58,31,0.6)]" : ""}`}>
              {p.destaque && <span className="absolute -top-3 left-6 rounded-full bg-pitanga px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-white">Mais escolhido</span>}
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-2xl font-semibold text-ink">{p.nome}</h2>
                {eAtual && <Chip tom="ok">Seu plano</Chip>}
              </div>
              <p className="mt-1 text-sm text-ink/60">{p.frase}</p>
              {temPreco(id) ? (
                <div className="mt-4">
                  <p className="text-3xl font-semibold text-ink">
                    {emReais(precoPorMes(id, ciclo))}
                    <span className="text-base font-normal text-ink/55">/mês</span>
                  </p>
                  <p className="mt-0.5 text-xs text-ink/55">{ciclo === "anual" ? `${emReais(precoAnualTotal(id))} por ano · 2 meses grátis` : "cobrança mensal"}</p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-ink/50">Valor em breve</p>
              )}
              <p className="mt-4 font-mono text-xs uppercase tracking-wider text-ink/50">Projetos em andamento</p>
              <p className="text-xl font-semibold text-ink">{p.obrasAtivas === null ? "Ilimitados" : p.obrasAtivas}</p>
              <p className="mt-1 text-xs text-ink/50">
                Catálogo {LIMITE_FRASE(p, "catalogoItens")} itens · fornecedores {LIMITE_FRASE(p, "fornecedores")}
              </p>
              <ul className="mt-4 flex-1 space-y-2 border-t border-linha pt-4">
                {p.inclui.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-sm text-ink/80">
                    <Marca className="mt-0.5 h-4 w-4 shrink-0 text-pitanga" />
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                {eAtual && origemFixa(origem) ? (
                  <p className="text-center text-sm font-medium text-ink/60">Este é o seu plano</p>
                ) : logado && temPreco(id) ? (
                  <Link href={`/assinar?plano=${id}&ciclo=${ciclo}`} onClick={() => track("upgrade_clicado", { origem: "planos", plano: id, ciclo })} className={`${classeBotao(p.destaque ? "primario" : "linha")} w-full`}>
                    Assinar
                  </Link>
                ) : logado ? (
                  <button type="button" disabled className={`${classeBotao(p.destaque ? "primario" : "linha")} w-full`} aria-label={`Assinar o plano ${p.nome} (em breve)`}>
                    Assinar (em breve)
                  </button>
                ) : (
                  <Link href="/#entrar" onClick={() => track("upgrade_clicado", { origem: "planos_publico", plano: id })} className={`${classeBotao(p.destaque ? "primario" : "linha")} w-full`}>
                    Testar {TESTE_DIAS} dias grátis
                  </Link>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <p className="mt-6 text-sm leading-relaxed text-ink/60">
        A assinatura é online, com pagamento seguro pelo Stripe, e você cancela quando quiser. Nenhum projeto é apagado ao trocar de plano: se passar do limite, só não dá para criar ou restaurar projetos até liberar uma vaga ou assinar um plano maior.
      </p>
    </main>
  );
}

const origemFixa = (o?: string) => o === "assinatura" || o === "cortesia";

function Rodape() {
  return (
    <footer className="border-t border-linha bg-papel">
      <div className="mx-auto max-w-5xl space-y-2 px-4 py-8 text-sm text-ink/60">
        <p>
          <strong className="text-ink">Cancelamento com reembolso:</strong> você pode cancelar em até {CANCELAMENTO_DIAS} dias depois de contratar e recebe o valor de volta. Os recibos ficam em <em>Minha conta</em>.
        </p>
        <p className="flex flex-wrap gap-x-5 gap-y-1">
          <Link href="/termos" className="font-semibold text-pitanga hover:underline">Termos de uso</Link>
          <Link href="/docs" className="hover:text-ink">Documentação</Link>
          <Link href="/" className="hover:text-ink">Início</Link>
        </p>
      </div>
    </footer>
  );
}
