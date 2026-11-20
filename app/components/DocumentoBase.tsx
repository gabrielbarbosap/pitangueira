"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { registrarEvento } from "@/lib/telemetria";
import { useData } from "@/lib/data";
import type { AprovacaoPrograma } from "@/lib/types";
import { LogoMark } from "./Logo";
import { EnviarWhatsapp } from "./EnviarWhatsapp";

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
  mensagemExtra,
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
  /** Bloco a mais na mensagem do WhatsApp que acompanha o PDF (ex.: total, vencimento e PIX da cobrança). */
  mensagemExtra?: string;
  children: ReactNode;
}) {
  const { config, projeto } = useData();
  const folha = useRef<HTMLElement>(null);
  const [whatsapp, setWhatsapp] = useState(false);

  // Um documento foi aberto (medimos só o tipo: orçamento, escopo, relatório).
  useEffect(() => {
    registrarEvento("documento_aberto", { tipo: titulo });
  }, [titulo]);

  function imprimir() {
    registrarEvento("pdf_impresso", { tipo: titulo });
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
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setWhatsapp(true)}
            aria-label="Enviar por WhatsApp"
            title="Enviar por WhatsApp"
            className="flex items-center gap-1.5 rounded-sm border border-emerald-700 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M20.5 3.5A11.8 11.8 0 0 0 12 0 12 12 0 0 0 1.6 17.9L0 24l6.3-1.6A12 12 0 0 0 24 12c0-3.2-1.2-6.2-3.5-8.5ZM12 22a10 10 0 0 1-5.1-1.4l-.4-.2-3.7 1 1-3.6-.2-.4A10 10 0 1 1 12 22Zm5.5-7.5c-.3-.1-1.8-.9-2-1s-.5-.1-.7.1-.8 1-1 1.2-.4.2-.7.1a8.2 8.2 0 0 1-4-3.5c-.3-.5.3-.5.9-1.6.1-.2 0-.4 0-.5l-.9-2.1c-.2-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.9.4 3.8 3.8 0 0 0-1.2 2.8c0 1.7 1.2 3.3 1.4 3.5s2.4 3.7 5.8 5.1c2.1.9 2.9.9 4 .8a3.4 3.4 0 0 0 2.2-1.6 2.7 2.7 0 0 0 .2-1.6c-.1-.1-.3-.2-.6-.3Z" />
            </svg>
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
          <button onClick={imprimir} className="bg-pitanga px-4 py-2 text-sm font-semibold text-white active:bg-pitanga-escuro">
            {rotuloImprimir}
          </button>
        </div>
      </div>

      {whatsapp && <EnviarWhatsapp alvo={folha} tipo={titulo} rotulo={etapaRotulo} nomeArquivo={nomeArquivo ?? titulo} extra={mensagemExtra} onFechar={() => setWhatsapp(false)} />}

      <article ref={folha} className="mx-auto my-6 max-w-[800px] bg-white p-8 text-ink shadow-sm print:my-0 print:max-w-none print:p-0 print:shadow-none sm:p-12">
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

        {/* Selo do produto: discreto, depois das assinaturas, em todo PDF. */}
        <div className="mt-10 flex break-inside-avoid items-center justify-center gap-2.5 border-t border-linha pt-4 text-ink/45">
          <LogoMark size={20} />
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em]">
            Gerado com <span className="text-ink/70">Pitangueira</span> · gestão de projetos
          </p>
        </div>
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
