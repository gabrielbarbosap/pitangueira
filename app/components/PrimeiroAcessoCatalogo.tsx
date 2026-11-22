"use client";

import { useState } from "react";
import { useArquiteto } from "@/lib/arquiteto";
import { useAuth } from "@/lib/auth";
import { useObras } from "@/lib/obras";
import { CHAVE_PRIMEIRO_ACESSO, CatalogoProntoDialog, chavePrimeiroAcesso } from "./CatalogoProntoDialog";

/**
 * Primeiro acesso do arquiteto: oferece o catálogo pronto ou começar do zero. Só aparece para quem é novo (sem escolha
 * registrada, sem itens no catálogo e sem projetos), uma única vez, e espera o tutorial da home terminar.
 */
export function PrimeiroAcessoCatalogo({ pausado = false }: { pausado?: boolean }) {
  const { escolhaCatalogo, catalogo, carregando } = useArquiteto();
  const { obras, loading } = useObras();
  const { user } = useAuth();
  const [jaNesteAparelho] = useState(() => {
    try {
      return localStorage.getItem(CHAVE_PRIMEIRO_ACESSO) === "1" || (!!user && localStorage.getItem(chavePrimeiroAcesso(user.uid)) === "1");
    } catch {
      return false;
    }
  });
  const [fechado, setFechado] = useState(false);

  const novo = escolhaCatalogo === null && !carregando && !loading && catalogo.length === 0 && obras.length === 0;
  const aberto = novo && !jaNesteAparelho && !fechado && !pausado;
  return <CatalogoProntoDialog aberto={aberto} onFechar={() => setFechado(true)} primeiroAcesso />;
}
