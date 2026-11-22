"use client";

import { useMemo, useState } from "react";
import { useArquiteto } from "@/lib/arquiteto";
import { useAuth } from "@/lib/auth";
import { CATALOGO_PRONTO } from "@/lib/catalogoInicial";
import { useDinheiro } from "@/lib/privacidade";
import { Alerta } from "./ui/Alerta";
import { Botao } from "./ui/Botao";
import { Modal } from "./Modal";

/**
 * Marca neste aparelho que ESTA conta já fez a escolha do primeiro acesso (vale mesmo se o perfil ainda não chegou).
 * A chave sem uid é um "não mostrar" geral do aparelho, usada pelos testes automáticos.
 */
export const CHAVE_PRIMEIRO_ACESSO = "pitangueira:catalogo-inicial:v1";
export const chavePrimeiroAcesso = (uid: string) => `${CHAVE_PRIMEIRO_ACESSO}:${uid}`;

/**
 * Catálogo pronto: o arquiteto marca as etapas que quer e recebe uma CÓPIA dos itens no próprio catálogo
 * (só ele vê e edita). No primeiro acesso (`primeiroAcesso`) também oferece começar do zero.
 */
export function CatalogoProntoDialog({ aberto, onFechar, primeiroAcesso = false }: { aberto: boolean; onFechar: () => void; primeiroAcesso?: boolean }) {
  const { importar, registrarEscolhaCatalogo, vagasCatalogo } = useArquiteto();
  const { brl } = useDinheiro();
  const { user } = useAuth();
  const [marcadas, setMarcadas] = useState<Set<string>>(() => new Set(CATALOGO_PRONTO.map((g) => g.etapa)));
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  const marcados = useMemo(() => CATALOGO_PRONTO.filter((g) => marcadas.has(g.etapa)).reduce((s, g) => s + g.itens.length, 0), [marcadas]);
  // O plano pode limitar o catálogo: entram só os que cabem.
  const total = vagasCatalogo === null ? marcados : Math.min(marcados, vagasCatalogo);

  function alternar(etapa: string) {
    setMarcadas((m) => {
      const n = new Set(m);
      if (n.has(etapa)) n.delete(etapa);
      else n.add(etapa);
      return n;
    });
  }

  function lembrar() {
    try {
      if (user) localStorage.setItem(chavePrimeiroAcesso(user.uid), "1");
    } catch {
      /* ignore */
    }
  }

  async function adicionar() {
    setOcupado(true);
    setErro("");
    try {
      const itens = CATALOGO_PRONTO.filter((g) => marcadas.has(g.etapa)).flatMap((g) => g.itens.map((it) => ({ ...it, etapa: g.etapa })));
      await importar(itens);
      lembrar();
      if (primeiroAcesso) await registrarEscolhaCatalogo("pronto");
      onFechar();
    } catch {
      setErro("Não consegui adicionar agora. Tente de novo em instantes.");
    } finally {
      setOcupado(false);
    }
  }

  async function doZero() {
    lembrar();
    await registrarEscolhaCatalogo("proprio").catch(() => undefined);
    onFechar();
  }

  return (
    <Modal aberto={aberto} onFechar={primeiroAcesso ? () => void doZero() : onFechar} titulo={primeiroAcesso ? "Bem-vindo! Monte o seu catálogo" : "Catálogo pronto"} largo>
      <p className="text-sm leading-relaxed text-ink/70">
        {primeiroAcesso
          ? "O catálogo é a sua lista de serviços e preços, para orçar mais rápido. Comece com um catálogo pronto de reforma ou crie os seus itens do zero. Seja qual for a escolha, os itens ficam só no seu catálogo."
          : "Escolha as etapas que quer copiar para o seu catálogo. Itens que você já tem não são repetidos."}
      </p>
      <Alerta tom="aviso" className="mt-3">
        Os valores são <strong>referências aproximadas</strong>. Variam por região e fornecedor: ajuste no <strong>Meu catálogo</strong> depois de adicionar.
      </Alerta>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="rotulo-tec text-ink/50">Etapas</p>
        <div className="flex gap-3 text-xs font-semibold text-pitanga">
          <button type="button" className="hover:underline" onClick={() => setMarcadas(new Set(CATALOGO_PRONTO.map((g) => g.etapa)))}>Marcar todas</button>
          <button type="button" className="hover:underline" onClick={() => setMarcadas(new Set())}>Limpar</button>
        </div>
      </div>

      <ul className="mt-2 divide-y divide-linha rounded-2xl border border-linha">
        {CATALOGO_PRONTO.map((g) => (
          <li key={g.etapa} className="px-3.5 py-3">
            <label className="flex cursor-pointer items-center gap-3">
              <input type="checkbox" className="h-5 w-5 shrink-0 accent-pitanga" checked={marcadas.has(g.etapa)} onChange={() => alternar(g.etapa)} aria-label={`Etapa ${g.etapa}`} />
              <span className="min-w-0 flex-1 text-[15px] font-semibold text-ink">{g.etapa}</span>
              <span className="font-mono text-xs text-ink/50">{g.itens.length} {g.itens.length === 1 ? "item" : "itens"}</span>
            </label>
            <details className="mt-1 pl-8">
              <summary className="cursor-pointer text-xs font-medium text-ink/55 hover:text-ink">Ver os itens</summary>
              <ul className="mt-1.5 space-y-1 text-xs text-ink/65">
                {g.itens.map((it) => (
                  <li key={it.descricao} className="flex justify-between gap-3">
                    <span>{it.descricao} <span className="text-ink/40">({it.unidade})</span></span>
                    <span className="shrink-0 font-mono">{brl(it.valorUnitario)}</span>
                  </li>
                ))}
              </ul>
            </details>
          </li>
        ))}
      </ul>

      {vagasCatalogo !== null && marcados > vagasCatalogo && (
        <Alerta tom="aviso" className="mt-3">
          O catálogo do seu plano só comporta mais {vagasCatalogo} {vagasCatalogo === 1 ? "item" : "itens"}. Vamos adicionar os primeiros {vagasCatalogo}; marque menos etapas para escolher quais.
        </Alerta>
      )}
      {erro && <Alerta tom="perigo" className="mt-3">{erro}</Alerta>}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        {primeiroAcesso && (
          <Botao variante="linha" onClick={() => void doZero()} disabled={ocupado}>
            Criar os meus itens do zero
          </Botao>
        )}
        <Botao variante="primario" onClick={() => void adicionar()} disabled={ocupado || total === 0}>
          {ocupado ? "Adicionando…" : total === 0 ? "Marque ao menos uma etapa" : `Adicionar ${total} ${total === 1 ? "item" : "itens"} ao meu catálogo`}
        </Botao>
      </div>
    </Modal>
  );
}
