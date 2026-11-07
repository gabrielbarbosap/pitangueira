"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth";

/**
 * Coleção pessoal do arquiteto (`arquitetos/{uid}/{nome}`): composições, fornecedores, honorários…
 * Só quem está usando a tela assina a coleção. No demo, guarda no navegador.
 */
export function useColecaoPessoal<T extends { id: string }>(nome: string, ordem: (a: T, b: T) => number) {
  const { user, configured } = useAuth();
  const uid = user && !user.anonimo ? user.uid : null;
  const [itens, setItens] = useState<T[]>([]);
  const [carregando, setCarregando] = useState(true);
  const chaveLocal = uid ? `reforma:${nome}:v1:${uid}` : "";

  useEffect(() => {
    // Sem arquiteto logado ou no demo: lê de forma assíncrona (nada de setState direto no efeito).
    if (!uid || !configured || !db) {
      let vivo = true;
      Promise.resolve().then(() => {
        if (!vivo) return;
        let lista: T[] = [];
        if (uid) {
          try {
            lista = JSON.parse(localStorage.getItem(chaveLocal) ?? "[]") as T[];
          } catch {
            lista = [];
          }
        }
        setItens([...lista].sort(ordem));
        setCarregando(false);
      });
      return () => {
        vivo = false;
      };
    }
    return onSnapshot(
      collection(db, "arquitetos", uid, nome),
      (snap) => {
        setItens(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<T, "id">) }) as T).sort(ordem));
        setCarregando(false);
      },
      () => setCarregando(false),
    );
    // `ordem` costuma ser uma função inline estável por uso; reassinar a cada render seria um desperdício.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, configured, nome, chaveLocal]);

  /** Cria (sem `id`) ou substitui (com `id`) um documento. Devolve o id. */
  const salvar = useCallback(
    async (dados: Omit<T, "id"> & { id?: string }): Promise<string> => {
      if (!uid) throw new Error("Sem arquiteto logado");
      const { id: idInformado, ...resto } = dados as { id?: string } & Record<string, unknown>;
      // O Firestore não aceita undefined: o vai-e-volta por JSON descarta esses campos.
      const limpo = JSON.parse(JSON.stringify({ ...resto, createdAt: (resto.createdAt as number | undefined) ?? Date.now() })) as Record<string, unknown>;
      if (configured && db) {
        const ref = idInformado ? doc(db, "arquitetos", uid, nome, idInformado) : doc(collection(db, "arquitetos", uid, nome));
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
    [uid, configured, nome, chaveLocal],
  );

  const remover = useCallback(
    async (id: string) => {
      if (!uid) return;
      if (configured && db) {
        await deleteDoc(doc(db, "arquitetos", uid, nome, id));
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
      setItens(novo);
    },
    [uid, configured, nome, chaveLocal],
  );

  return { itens, carregando, salvar, remover };
}
