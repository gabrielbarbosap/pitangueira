"use client";

import { useMemo, type ReactNode } from "react";
import { useArquiteto } from "@/lib/arquiteto";
import { usePlano } from "@/lib/plano";
import { useColecaoPessoal } from "@/lib/colecaoPessoal";
import { resumoFinanceiro } from "@/lib/financeiro";
import { useDinheiro } from "@/lib/privacidade";
import type { Composicao, Fornecedor, Honorario } from "@/lib/types";
import { useHoje } from "./PrazoVisual";
import { Atalho, type TomAtalho } from "./ui/Atalho";

const svg = (d: ReactNode) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {d}
  </svg>
);
const ICONE = {
  catalogo: svg(<><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" /><path d="M9 8h6M9 12h6" /></>),
  composicoes: svg(<><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>),
  fornecedores: svg(<><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /><path d="M16 5.5a3 3 0 0 1 0 5.8M18 14.8c1.8.7 3 2.4 3 5.2" /></>),
  financeiro: svg(<><rect x="3" y="6" width="18" height="13" rx="2.5" /><path d="M3 10h18M16.5 15h1.5" /></>),
  docs: svg(<><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z" /><path d="M4 19a2 2 0 0 1 2-2h13" /></>),
  conta: svg(<><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" /></>),
};

const quantos = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/**
 * Os atalhos da home do arquiteto: seis cartões grandes, com ícone e o que há dentro de cada um, em vez de pílulas
 * pequenas. O Financeiro avisa quando há parcela atrasada. Fica logo abaixo do topo, sempre à vista.
 */
export function AtalhosHome({ onCatalogo, onComposicoes, onFornecedores }: { onCatalogo: () => void; onComposicoes: () => void; onFornecedores: () => void }) {
  const hoje = useHoje();
  const { brlInt } = useDinheiro();
  const { catalogo } = useArquiteto();
  const { pode } = usePlano();
  const { itens: composicoes } = useColecaoPessoal<Composicao>("composicoes", (a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const { itens: fornecedores } = useColecaoPessoal<Fornecedor>("fornecedores", (a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const { itens: honorarios } = useColecaoPessoal<Honorario>("honorarios", (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  const fin = useMemo(() => (hoje ? resumoFinanceiro(honorarios, hoje) : null), [honorarios, hoje]);

  let finDetalhe = "Honorários e parcelas";
  let finTom: TomAtalho = "neutro";
  if (!pode("financeiro")) {
    finDetalhe = "A partir do plano Safra";
  } else if (fin && honorarios.length > 0) {
    if (fin.qtdVencidas > 0) {
      finDetalhe = `${brlInt(fin.vencido)} em atraso`;
      finTom = "alerta";
    } else if (fin.aReceber > 0) {
      finDetalhe = `${brlInt(fin.aReceber)} a receber`;
    } else {
      finDetalhe = "Tudo recebido";
      finTom = "ok";
    }
  }

  return (
    <section aria-label="Atalhos" data-tour="atalhos" className="relative z-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Atalho icone={ICONE.catalogo} titulo="Meu catálogo" detalhe={catalogo.length ? quantos(catalogo.length, "item", "itens") : "Seus itens e preços"} onClick={onCatalogo} />
      <Atalho icone={ICONE.composicoes} titulo="Composições" detalhe={composicoes.length ? quantos(composicoes.length, "composição", "composições") : "Serviços com BDI e margem"} onClick={onComposicoes} />
      <Atalho icone={ICONE.fornecedores} titulo="Fornecedores" detalhe={fornecedores.length ? quantos(fornecedores.length, "cadastrado", "cadastrados") : "Prazo e custo de cada um"} onClick={onFornecedores} />
      <Atalho icone={ICONE.financeiro} titulo="Financeiro" detalhe={finDetalhe} tom={finTom} href="/financeiro" />
      <Atalho icone={ICONE.conta} titulo="Minha conta" detalhe="Plano, recibos e senha" href="/conta" />
      <Atalho icone={ICONE.docs} titulo="Documentação" detalhe="Aprenda a usar" href="/docs" externo />
    </section>
  );
}
