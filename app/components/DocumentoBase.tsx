"use client";

import type { CSSProperties, ReactNode } from "react";
import { useData } from "@/lib/data";
import type { AprovacaoPrograma } from "@/lib/types";
import { LogoMark } from "./Logo";

/** Cor de destaque do documento: a do escritório, se for um hex válido. */
export function corMarca(cor: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(cor) ? cor : "#14110f";
}

/**
 * Moldura comum dos documentos em PDF: barra de ações (não imprime), cabeçalho com a marca do
 * escritório (logo, nome, contato, cor), dados da obra, conteúdo e bloco de assinaturas.
 */
export function DocumentoBase({
  onFechar,
  titulo,
  etapaRotulo,
  aprovacao,
  nomeArquivo,
  barra,
  rotuloImprimir = "Imprimir / salvar PDF",
  children,
}: {
  onFechar: () => void;
  /** Ex.: "Programa de necessidades" / "Orçamento". */
  titulo: string;
  etapaRotulo: string;
  aprovacao?: AprovacaoPrograma | null;
  /** Nome sugerido ao salvar o PDF (o navegador usa o título da página). */
  nomeArquivo?: string;
  /** Controles extras na barra de ações (ex.: navegar entre PDFs). */
  barra?: ReactNode;
  rotuloImprimir?: string;
  children: ReactNode;
}) {
  const { config, projeto } = useData();

  function imprimir() {
    if (nomeArquivo) {
      const antigo = document.title;
      document.title = nomeArquivo;
      window.addEventListener("afterprint", () => (document.title = antigo), { once: true });
    }
    window.print();
  }
  const cor = corMarca(projeto.cor);
  const data = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const estilo = { "--marca": cor } as CSSProperties;

  const meta: [string, string][] = [
    ["Cliente(s)", projeto.cliente],
    ["Projeto", projeto.tipo || config.nomeObra],
    ["Endereço", projeto.endereco],
    ["Etapa", etapaRotulo],
  ];

  return (
    <div className="print-area fixed inset-0 z-[70] overflow-auto bg-neutral-200 print:static print:overflow-visible print:bg-white" style={estilo}>
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-linha bg-papel px-4 py-3">
        <button onClick={onFechar} className="font-mono text-xs font-semibold uppercase tracking-wider text-ink/70 hover:text-ink">
          ← Fechar
        </button>
        {barra && <div className="flex min-w-0 flex-1 items-center justify-center">{barra}</div>}
        <button onClick={imprimir} className="shrink-0 bg-pitanga px-4 py-2 text-sm font-semibold text-white active:bg-pitanga-escuro">
          {rotuloImprimir}
        </button>
      </div>

      <article className="mx-auto my-6 max-w-[800px] bg-white p-8 text-ink shadow-sm print:my-0 print:max-w-none print:p-0 print:shadow-none sm:p-12">
        <header className="flex items-start justify-between gap-4 border-b-2 pb-4" style={{ borderColor: cor }}>
          <div className="min-w-0">
            <p className="rotulo-tec" style={{ color: cor }}>{titulo}</p>
            <h1 className="mt-1 text-2xl font-semibold leading-tight">{config.nomeObra}</h1>
            <p className="mt-1 text-sm text-ink/60">{data}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 text-right">
            {projeto.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={projeto.logo} alt={projeto.escritorio || "Logo do escritório"} className="max-h-14 max-w-[160px] object-contain" />
            ) : projeto.escritorio ? null : (
              <LogoMark size={36} />
            )}
            {projeto.escritorio && <p className="text-sm font-semibold leading-tight">{projeto.escritorio}</p>}
            {projeto.contato && <p className="whitespace-pre-line text-xs leading-snug text-ink/60">{projeto.contato}</p>}
          </div>
        </header>

        <dl className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {meta.map(([k, v]) => (
            <div key={k} className="border-b border-linha pb-2">
              <dt className="rotulo-tec text-ink/50">{k}</dt>
              <dd className="mt-0.5 text-sm">{v || "—"}</dd>
            </div>
          ))}
        </dl>

        {children}

        <footer className="mt-12 grid gap-8 break-inside-avoid sm:grid-cols-2">
          <div>
            <div className="h-10 border-b border-ink" />
            <p className="mt-1.5 text-sm font-medium">{projeto.responsavel || "Arquiteto responsável"}</p>
            <p className="text-xs text-ink/60">{projeto.registro || "Registro profissional"}</p>
          </div>
          <div>
            {aprovacao ? (
              <div className="flex h-10 items-end border-b border-ink pb-1 text-sm font-semibold">{aprovacao.nome}</div>
            ) : (
              <div className="h-10 border-b border-ink" />
            )}
            <p className="mt-1.5 text-sm font-medium">{projeto.cliente || "Cliente"}</p>
            <p className="text-xs text-ink/60">
              {aprovacao ? `Aprovado online em ${new Date(aprovacao.em).toLocaleDateString("pt-BR")}` : "Cliente"}
            </p>
          </div>
        </footer>
      </article>
    </div>
  );
}

/** Título de seção dos documentos, na cor da marca. */
export function TituloSecao({ children }: { children: ReactNode }) {
  return (
    <h2 className="rotulo-tec border-b pb-1.5 text-ink" style={{ borderColor: "var(--marca)" }}>
      {children}
    </h2>
  );
}
