"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth";
import { useData } from "./data";

/**
 * Subcoleção de um projeto (`obras/{id}/{nome}`): visitas, ocorrências, vistoria…
 * Arquiteto e cliente leem ao vivo; quem pode escrever é decidido pelas regras do banco.
 * No demo, guarda no navegador.
 */
export function useColecaoObra<T extends { id: string }>(nome: string, ordem: (a: T, b: T) => number) {
  const { configured } = useAuth();
  const { obraId } = useData();
  const [itens, setItens] = useState<T[]>([]);
  const [carregando, setCarregando] = useState(true);
  const chaveLocal = `reforma:${nome}:v1:${obraId}`;

  useEffect(() => {
    if (!configured || !db) {
      let vivo = true;
      Promise.resolve().then(() => {
        if (!vivo) return;
        let lista: T[] = [];
        try {
          lista = JSON.parse(localStorage.getItem(chaveLocal) ?? "[]") as T[];
        } catch {
          lista = [];
        }
        setItens([...lista].sort(ordem));
        setCarregando(false);
      });
      return () => {
        vivo = false;
      };
    }
    return onSnapshot(
      collection(db, "obras", obraId, nome),
      (snap) => {
        setItens(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<T, "id">) }) as T).sort(ordem));
        setCarregando(false);
      },
      () => setCarregando(false),
    );
    // `ordem` costuma ser uma função inline estável por uso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configured, obraId, nome, chaveLocal]);

  /** Cria (sem `id`) ou substitui (com `id`). Devolve o id. */
  const salvar = useCallback(
    async (dados: Omit<T, "id"> & { id?: string }): Promise<string> => {
      const { id: idInformado, ...resto } = dados as { id?: string } & Record<string, unknown>;
      // O Firestore não aceita undefined: o vai-e-volta por JSON descarta esses campos.
      const limpo = JSON.parse(JSON.stringify({ ...resto, createdAt: (resto.createdAt as number | undefined) ?? Date.now() })) as Record<string, unknown>;
      if (configured && db) {
        const ref = idInformado ? doc(db, "obras", obraId, nome, idInformado) : doc(collection(db, "obras", obraId, nome));
        await setDoc(ref, limpo);
        return ref.id;
      }
      const id = idInformado ?? crypto.randomUUID();
      let atual: T[] = [];
      try {
        atual = JSON.parse(localStorage.getItem(chaveLocal) ?? "[]") as T[];
      } catch {
        atual = [];
      }
      const novo = [...atual.filter((x) => x.id !== id), { ...limpo, id } as unknown as T].sort(ordem);
      try {
        localStorage.setItem(chaveLocal, JSON.stringify(novo));
      } catch {
        /* sem armazenamento */
      }
      setItens(novo);
      return id;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configured, obraId, nome, chaveLocal],
  );

  const remover = useCallback(
    async (id: string) => {
      if (configured && db) {
        await deleteDoc(doc(db, "obras", obraId, nome, id));
        return;
      }
      let atual: T[] = [];
      try {
        atual = JSON.parse(localStorage.getItem(chaveLocal) ?? "[]") as T[];
      } catch {
        atual = [];
      }
      const novo = atual.filter((x) => x.id !== id);
      try {
        localStorage.setItem(chaveLocal, JSON.stringify(novo));
      } catch {
        /* sem armazenamento */
      }
      setItens(novo.sort(ordem));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [configured, obraId, nome, chaveLocal],
  );

  return { itens, carregando, salvar, remover };
}
