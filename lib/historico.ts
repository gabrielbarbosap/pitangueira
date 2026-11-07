"use client";

import { useCallback, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth";
import { useObras } from "./obras";
import { lsItensKey } from "./demo";
import type { Item } from "./types";
import type { ItemDeProjeto } from "./fornecedores";

/**
 * Itens de todos os projetos do arquiteto, lidos sob demanda (ao abrir a tela de fornecedores),
 * para não carregar centenas de itens por projeto toda vez que a home abre.
 */
export function useItensDeTodosOsProjetos() {
  const { configured } = useAuth();
  const { obras } = useObras();
  const [itens, setItens] = useState<ItemDeProjeto[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(false);
    try {
      const listas = await Promise.all(
        obras.map(async (o) => {
          let lista: Item[] = [];
          if (configured && db) {
            const snap = await getDocs(collection(db, "obras", o.id, "itens"));
            lista = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Item, "id">) }));
          } else {
            try {
              lista = JSON.parse(localStorage.getItem(lsItensKey(o.id)) ?? "[]") as Item[];
            } catch {
              lista = [];
            }
          }
          return lista.map((i) => ({ ...i, projetoId: o.id, projetoNome: o.nome }));
        }),
      );
      setItens(listas.flat());
    } catch {
      setErro(true);
    } finally {
      setCarregando(false);
    }
  }, [obras, configured]);

  return { itens, carregando, erro, carregar };
}
