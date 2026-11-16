"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { resumirUso } from "@/lib/metricas";
import { lerTelemetria, type RegistroTelemetria } from "@/lib/telemetria";
import { Logo } from "../components/Logo";
import { Alerta } from "../components/ui/Alerta";
import { Botao } from "../components/ui/Botao";
import { Chip } from "../components/ui/Chip";

const NOMES: Record<string, string> = {
  sessao_iniciada: "Sessões iniciadas",
  projeto_criado: "Projetos criados",
  item_adicionado: "Itens adicionados",
  item_marcado: "Itens marcados (feito/pago)",
  planilha_importada: "Planilhas importadas",
  previsao_registrada: "Previsões de prazo",
  documento_aberto: "Documentos abertos (PDF)",
  pdf_impresso: "PDFs salvos/impressos",
  pdf_whatsapp: "PDFs enviados pelo WhatsApp",
};

const quando = (ms: number) =>
  new Date(ms).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

function Numero({ rotulo, valor, apoio, destaque = false }: { rotulo: string; valor: number; apoio?: string; destaque?: boolean }) {
  return (
    <div className="prancha p-4">
      <p className="rotulo-tec text-ink/50">{rotulo}</p>
      <p className={`mt-1 font-mono text-3xl font-semibold tabular-nums ${destaque && valor > 0 ? "text-pitanga" : "text-ink"}`}>{valor}</p>
      {apoio && <p className="mt-0.5 text-xs leading-snug text-ink/55">{apoio}</p>}
    </div>
  );
}

/** Painel de uso: quem usa o app, o que faz e que erros apareceram. Aberto a todo arquiteto; fechado ao cliente. */
export default function Admin() {
  const { user, loading, login } = useAuth();
  const [dias, setDias] = useState(7);
  const [registros, setRegistros] = useState<RegistroTelemetria[] | null>(null);
  const [agora, setAgora] = useState(0);
  const [falhou, setFalhou] = useState(false);

  // Todo arquiteto (quem entrou com Google) vê as métricas; o cliente (acesso anônimo) não.
  const admin = Boolean(user && !user.anonimo);

  useEffect(() => {
    if (!admin) return;
    let vivo = true;
    lerTelemetria(30)
      .then((r) => {
        if (!vivo) return;
        setRegistros(r);
        setAgora(Date.now());
      })
      .catch(() => vivo && setFalhou(true));
    return () => {
      vivo = false;
    };
  }, [admin]);

  const uso = useMemo(() => (registros ? resumirUso(registros, dias, agora) : null), [registros, dias, agora]);
  const erros = useMemo(() => (registros ?? []).filter((r) => r.tipo === "erro" && r.em >= agora - dias * 86_400_000).slice(0, 15), [registros, dias, agora]);
  const maxDia = Math.max(1, ...(uso?.porDia.map((d) => d.eventos) ?? [1]));

  return (
    <div className="grade min-h-dvh">
      <header className="border-b border-linha bg-papel/90">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="flex items-center gap-3" aria-label="Voltar ao app">
            <Logo />
            <Chip tom="ink">Admin</Chip>
          </Link>
          <Link href="/" className="btn btn-linha px-4 py-2 text-sm">
            Abrir o app
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <div>
          <p className="rotulo-tec text-pitanga">Uso do app</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Quem usa e o que acontece</h1>
        </div>

        {loading ? (
          <p className="font-mono text-xs uppercase tracking-wider text-ink/40">Carregando…</p>
        ) : !admin ? (
          <Alerta tom="aviso" titulo="Acesso restrito">
            Esta página é só para arquitetos.{" "}
            {user ? "O acesso de cliente não vê as métricas." : "Entre com sua conta Google para ver as métricas."}
            {!user && (
              <span className="mt-3 block">
                <Botao variante="solido" tamanho="pequeno" onClick={login}>
                  Entrar com Google
                </Botao>
              </span>
            )}
          </Alerta>
        ) : falhou ? (
          <Alerta tom="perigo" titulo="Não consegui ler as métricas">
            Confira se as regras do banco foram publicadas (a coleção “telemetria” precisa permitir leitura a quem entrou como arquiteto).
          </Alerta>
        ) : !uso ? (
          <p className="font-mono text-xs uppercase tracking-wider text-ink/40">Lendo as métricas…</p>
        ) : (
          <>
            <div className="inline-flex rounded-full bg-ink/[0.07] p-1" role="tablist" aria-label="Período">
              {[7, 30].map((d) => (
                <button
                  key={d}
                  role="tab"
                  aria-selected={dias === d}
                  onClick={() => setDias(d)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${dias === d ? "bg-ink text-white" : "text-ink/60 hover:text-ink"}`}
                >
                  Últimos {d} dias
                </button>
              ))}
            </div>

            <section aria-label="Resumo" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Numero rotulo="Contas ativas" valor={uso.usuarios} apoio={`${uso.arquitetos} arquitetos · ${uso.clientes} clientes`} />
              <Numero rotulo="Clientes recorrentes" valor={uso.clientesRecorrentes} apoio="abriram o projeto em 2 dias ou mais" />
              <Numero rotulo="Itens adicionados" valor={uso.itensAdicionados} apoio={`${uso.itensMarcados} marcações de feito/pago`} />
              <Numero rotulo="Erros" valor={uso.erros} destaque apoio={uso.erros === 0 ? "nenhum no período" : "veja a lista abaixo"} />
              <Numero rotulo="Documentos abertos" valor={uso.documentos} />
              <Numero rotulo="Enviados pelo WhatsApp" valor={uso.whatsapp} />
            </section>

            <section aria-label="Atividade por dia" className="prancha p-4">
              <p className="rotulo-tec text-ink/50">Eventos por dia</p>
              <div className="mt-3 flex h-28 items-end gap-1" role="img" aria-label={`Eventos por dia nos últimos ${dias} dias`}>
                {uso.porDia.map((d) => (
                  <div key={d.dia} className="group flex h-full flex-1 flex-col justify-end" title={`${d.dia}: ${d.eventos} eventos, ${d.usuarios} contas`}>
                    <div className="rounded-t bg-ink/80 transition-colors group-hover:bg-pitanga" style={{ height: `${Math.max(2, (d.eventos / maxDia) * 100)}%` }} />
                  </div>
                ))}
              </div>
              <div className="mt-1 flex justify-between font-mono text-[10px] text-ink/40">
                <span>{uso.porDia[0]?.dia.slice(5)}</span>
                <span>{uso.porDia[uso.porDia.length - 1]?.dia.slice(5)}</span>
              </div>
            </section>

            <section aria-label="Eventos" className="prancha overflow-hidden">
              <p className="rotulo-tec border-b border-linha p-4 pb-3 text-ink/50">O que as pessoas fizeram</p>
              {uso.porEvento.length === 0 ? (
                <p className="p-4 text-sm text-ink/55">Nada registrado neste período ainda.</p>
              ) : (
                <ul className="divide-y divide-linha">
                  {uso.porEvento.map(([nome, n]) => (
                    <li key={nome} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span className="text-ink">{NOMES[nome] ?? nome}</span>
                      <span className="font-mono font-semibold tabular-nums text-ink">{n}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-label="Erros recentes" className="prancha overflow-hidden">
              <p className="rotulo-tec border-b border-linha p-4 pb-3 text-ink/50">Erros recentes</p>
              {erros.length === 0 ? (
                <p className="p-4 text-sm text-ink/55">Nenhum erro neste período.</p>
              ) : (
                <ul className="divide-y divide-linha">
                  {erros.map((e, i) => (
                    <li key={i} className="px-4 py-3">
                      <p className="flex flex-wrap items-center gap-2 text-sm">
                        <Chip tom="perigo">{e.nome}</Chip>
                        <span className="font-mono text-xs text-ink/50">{e.rota} · {e.papel} · {quando(e.em)}</span>
                      </p>
                      <pre className="mt-1.5 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11.5px] leading-snug text-ink/70">{e.msg}</pre>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <p className="max-w-2xl text-xs leading-relaxed text-ink/50">
              Só medimos o uso: nome do evento, papel, um identificador anônimo da conta e a rota. Não guardamos nomes, e-mails, valores em dinheiro nem o conteúdo dos projetos.
            </p>
            <Botao tamanho="pequeno" onClick={() => location.reload()}>
              Atualizar
            </Botao>
          </>
        )}
      </main>
    </div>
  );
}
