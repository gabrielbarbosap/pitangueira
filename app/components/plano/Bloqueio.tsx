"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { track } from "@/lib/analytics";
import { usePlano } from "@/lib/plano";
import { MOTIVO_RECURSO, PLANOS, planoMinimo, type Bloqueio, type Recurso } from "@/lib/planos";
import { Modal } from "../Modal";
import { Botao, classeBotao } from "../ui/Botao";

const Cadeado = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

/** Painel no lugar de um recurso que o plano atual não tem: diz o que é, por que está bloqueado e onde conseguir. */
export function PlanoBloqueado({ recurso, className = "" }: { recurso: Recurso; className?: string }) {
  const { def } = usePlano();
  const minimo = PLANOS[planoMinimo(recurso)];
  const motivo = MOTIVO_RECURSO[recurso];
  useEffect(() => track("plano_bloqueio_visto", { recurso, plano: def.id }), [recurso, def.id]);
  return (
    <section aria-label={`${motivo.titulo}: indisponível no plano ${def.nome}`} className={`prancha mx-auto max-w-xl p-6 text-center ${className}`}>
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-pitanga/10 text-pitanga-escuro">
        <Cadeado />
      </span>
      <p className="rotulo-tec mt-4 text-pitanga">Disponível a partir do plano {minimo.nome}</p>
      <h2 className="mt-1 text-xl font-semibold text-ink">{motivo.titulo}</h2>
      <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-ink/70">{motivo.texto}</p>
      <p className="mt-2 text-xs text-ink/50">Seu plano agora: {def.nome}.</p>
      <Link href="/planos" onClick={() => track("upgrade_clicado", { origem: "bloqueio_recurso", recurso })} className={classeBotao("primario", "medio", "mt-4")}>
        Ver os planos
      </Link>
    </section>
  );
}

/** Janela que explica um limite atingido (projetos, catálogo, fornecedores) e o que fazer. */
export function LimiteDialog({ aberto, onFechar, bloqueio, tipo }: { aberto: boolean; onFechar: () => void; bloqueio: Bloqueio | null; tipo: string }) {
  const { def } = usePlano();
  useEffect(() => {
    if (aberto && bloqueio) track("plano_limite_visto", { limite: tipo, plano: def.id });
  }, [aberto, bloqueio, tipo, def.id]);
  if (!bloqueio) return null;
  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={bloqueio.titulo}>
      <div className="space-y-4">
        <p className="text-[15px] leading-relaxed text-ink/80">{bloqueio.texto}</p>
        <p className="rounded-2xl bg-papel p-3.5 text-sm leading-relaxed text-ink/70">
          <strong className="text-ink">O que fazer:</strong> {bloqueio.dica}
          {bloqueio.sugestao && ` O plano ${PLANOS[bloqueio.sugestao].nome} resolve.`}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Botao onClick={onFechar}>Entendi</Botao>
          <Link href="/planos" onClick={() => track("upgrade_clicado", { origem: "limite", limite: tipo })} className={classeBotao("primario")}>
            Ver os planos
          </Link>
        </div>
      </div>
    </Modal>
  );
}

/** Faixa informativa sobre o plano (teste, cortesia, sem assinatura, pagamento atrasado). Some quando nada precisa ser dito. */
export function FaixaPlano() {
  const { efetivo, def, carregando } = usePlano();
  if (carregando) return null;
  let texto: ReactNode = null;
  let tom = "";
  if (efetivo.origem === "teste") {
    texto = (
      <>
        <strong>Teste grátis do plano {def.nome}: {efetivo.diasDeTeste === 1 ? "falta 1 dia" : `faltam ${efetivo.diasDeTeste} dias`}.</strong> Depois disso, a cobrança começa automaticamente no cartão cadastrado — cancele antes, em Minha conta, se não quiser continuar.
      </>
    );
  } else if (efetivo.origem === "cortesia") {
    texto = (
      <>
        <strong>Você está no plano {def.nome} de cortesia{def.obrasAtivas === null ? ", sem limites" : ""}.</strong>{" "}
        {efetivo.aviso ?? "Isso vale por enquanto: vamos mudar os planos de quem já usava a Pitangueira e avisaremos antes de qualquer mudança."}
      </>
    );
  } else if (efetivo.origem === "sem-assinatura") {
    tom = "alerta-aviso";
    texto = (
      <>
        <strong>Seu teste grátis terminou.</strong> Assine um plano para voltar a usar — nada foi apagado.
      </>
    );
  } else if (efetivo.atrasada) {
    tom = "alerta-aviso";
    texto = (
      <>
        <strong>O pagamento do seu plano não foi aprovado.</strong> Atualize a forma de pagamento para não perder o acesso.
      </>
    );
  }
  if (!texto) return null;
  return (
    <div className={`alerta ${tom} flex flex-wrap items-center justify-between gap-x-4 gap-y-2`} role="note" aria-label="Seu plano">
      <p className="min-w-0 flex-1 text-sm leading-snug">{texto}</p>
      <Link href="/planos" onClick={() => track("upgrade_clicado", { origem: "faixa", situacao: efetivo.origem })} className="shrink-0 text-sm font-semibold underline underline-offset-2">
        Ver os planos
      </Link>
    </div>
  );
}

export { Cadeado };

/** Janelinha que explica que um recurso não está no plano atual (para botões que abririam algo bloqueado). */
export function RecursoDialog({ aberto, onFechar, recurso }: { aberto: boolean; onFechar: () => void; recurso: Recurso }) {
  const { def } = usePlano();
  const minimo = PLANOS[planoMinimo(recurso)];
  const motivo = MOTIVO_RECURSO[recurso];
  useEffect(() => {
    if (aberto) track("plano_bloqueio_visto", { recurso, plano: def.id });
  }, [aberto, recurso, def.id]);
  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={`${motivo.titulo}: plano ${minimo.nome}`}>
      <div className="space-y-4">
        <p className="text-[15px] leading-relaxed text-ink/80">{motivo.texto}</p>
        <p className="text-xs text-ink/50">Seu plano agora: {def.nome}.</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Botao onClick={onFechar}>Entendi</Botao>
          <Link href="/planos" onClick={() => track("upgrade_clicado", { origem: "bloqueio_botao", recurso })} className={classeBotao("primario")}>
            Ver os planos
          </Link>
        </div>
      </div>
    </Modal>
  );
}

/** Cartão pequeno no lugar de um bloco que o plano atual não inclui (relatório mensal, indicadores do financeiro…). */
export function CartaoBloqueado({ recurso }: { recurso: Recurso }) {
  const { def } = usePlano();
  const minimo = PLANOS[planoMinimo(recurso)];
  const motivo = MOTIVO_RECURSO[recurso];
  useEffect(() => track("plano_bloqueio_visto", { recurso, plano: def.id }), [recurso, def.id]);
  return (
    <section aria-label={`${motivo.titulo}: plano ${minimo.nome}`} className="prancha flex flex-wrap items-center gap-x-4 gap-y-3 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-pitanga/10 text-pitanga-escuro">
        <Cadeado className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="rotulo-tec text-ink/50">Plano {minimo.nome}</p>
        <p className="text-[15px] font-semibold text-ink">{motivo.titulo}</p>
        <p className="mt-0.5 text-xs leading-snug text-ink/60">{motivo.texto}</p>
      </div>
      <Link href="/planos" onClick={() => track("upgrade_clicado", { origem: "cartao_bloqueado", recurso })} className={classeBotao("linha", "pequeno", "shrink-0")}>
        Ver os planos
      </Link>
    </section>
  );
}
