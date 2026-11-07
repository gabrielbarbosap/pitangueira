"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { collection, deleteDoc, doc, onSnapshot, setDoc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth";
import { PERFIL_VAZIO, type CatalogoItem, type PerfilArquiteto } from "./types";

type CatalogoInput = Omit<CatalogoItem, "id" | "createdAt">;

interface ArquitetoContextValue {
  catalogo: CatalogoItem[];
  perfil: PerfilArquiteto;
  carregando: boolean;
  salvarItem: (data: CatalogoInput, id?: string) => Promise<void>;
  removerItem: (id: string) => Promise<void>;
  /** Acrescenta vários de uma vez, ignorando os que já existem (mesma descrição + unidade). Devolve quantos entraram. */
  importar: (lista: CatalogoInput[]) => Promise<number>;
  salvarPerfil: (p: PerfilArquiteto) => Promise<void>;
}

const Ctx = createContext<ArquitetoContextValue | null>(null);

const lsCatalogo = (uid: string) => `reforma:catalogo:v1:${uid}`;
const lsPerfil = (uid: string) => `reforma:perfil:v1:${uid}`;
const chave = (d: string, u: string) => `${d.trim().toLowerCase()}|${u.trim().toLowerCase()}`;

function ler<T>(key: string, padrao: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : padrao;
  } catch {
    return padrao;
  }
}
function gravar(key: string, valor: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(valor));
  } catch {
    /* ignore */
  }
}

/** Catálogo de itens e marca pessoal do arquiteto. Clientes (anônimos) não têm nada disso. */
export function ArquitetoProvider({ children }: { children: ReactNode }) {
  const { user, configured } = useAuth();
  const [catalogo, setCatalogo] = useState<CatalogoItem[]>([]);
  const [perfil, setPerfil] = useState<PerfilArquiteto>(PERFIL_VAZIO);
  const [carregando, setCarregando] = useState(true);
  const uid = user && !user.anonimo ? user.uid : null;

  useEffect(() => {
    if (!uid) {
      setCatalogo([]);
      setPerfil(PERFIL_VAZIO);
      setCarregando(false);
      return;
    }
    if (!configured || !db) {
      setCatalogo(ler<CatalogoItem[]>(lsCatalogo(uid), []));
      setPerfil({ ...PERFIL_VAZIO, ...ler<Partial<PerfilArquiteto>>(lsPerfil(uid), {}) });
      setCarregando(false);
      return;
    }
    setCarregando(true);
    const unsubCat = onSnapshot(
      collection(db, "arquitetos", uid, "catalogo"),
      (snap) => {
        const lista = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CatalogoItem, "id">) }));
        lista.sort((a, b) => a.descricao.localeCompare(b.descricao, "pt-BR"));
        setCatalogo(lista);
        setCarregando(false);
      },
      () => setCarregando(false),
    );
    const unsubPerfil = onSnapshot(
      doc(db, "arquitetos", uid),
      (d) => setPerfil({ ...PERFIL_VAZIO, ...(d.exists() ? (d.data() as Partial<PerfilArquiteto>) : {}) }),
      () => {},
    );
    return () => {
      unsubCat();
      unsubPerfil();
    };
  }, [uid, configured]);

  const salvarItem = useCallback(
    async (data: CatalogoInput, id?: string) => {
      if (!uid) return;
      if (configured && db) {
        const ref = id ? doc(db, "arquitetos", uid, "catalogo", id) : doc(collection(db, "arquitetos", uid, "catalogo"));
        await setDoc(ref, { ...data, createdAt: Date.now() }, { merge: true });
        return;
      }
      const atual = ler<CatalogoItem[]>(lsCatalogo(uid), []);
      const novo = id
        ? atual.map((c) => (c.id === id ? { ...c, ...data } : c))
        : [...atual, { ...data, id: crypto.randomUUID(), createdAt: Date.now() }];
      novo.sort((a, b) => a.descricao.localeCompare(b.descricao, "pt-BR"));
      gravar(lsCatalogo(uid), novo);
      setCatalogo(novo);
    },
    [uid, configured],
  );

  const removerItem = useCallback(
    async (id: string) => {
      if (!uid) return;
      if (configured && db) {
        await deleteDoc(doc(db, "arquitetos", uid, "catalogo", id));
        return;
      }
      const novo = ler<CatalogoItem[]>(lsCatalogo(uid), []).filter((c) => c.id !== id);
      gravar(lsCatalogo(uid), novo);
      setCatalogo(novo);
    },
    [uid, configured],
  );

  const importar = useCallback(
    async (lista: CatalogoInput[]) => {
      if (!uid) return 0;
      const existentes = new Set(catalogo.map((c) => chave(c.descricao, c.unidade)));
      const novos: CatalogoInput[] = [];
      for (const it of lista) {
        const k = chave(it.descricao, it.unidade);
        if (!it.descricao.trim() || existentes.has(k)) continue;
        existentes.add(k);
        novos.push(it);
      }
      if (novos.length === 0) return 0;
      if (configured && db) {
        const banco = db;
        for (let i = 0; i < novos.length; i += 400) {
          const batch = writeBatch(banco);
          novos.slice(i, i + 400).forEach((n) =>
            batch.set(doc(collection(banco, "arquitetos", uid, "catalogo")), { ...n, createdAt: Date.now() }),
          );
          await batch.commit();
        }
      } else {
        const completo = [
          ...ler<CatalogoItem[]>(lsCatalogo(uid), []),
          ...novos.map((n) => ({ ...n, id: crypto.randomUUID(), createdAt: Date.now() })),
        ].sort((a, b) => a.descricao.localeCompare(b.descricao, "pt-BR"));
        gravar(lsCatalogo(uid), completo);
        setCatalogo(completo);
      }
      return novos.length;
    },
    [uid, configured, catalogo],
  );

  const salvarPerfil = useCallback(
    async (p: PerfilArquiteto) => {
      if (!uid) return;
      setPerfil(p);
      if (configured && db) await setDoc(doc(db, "arquitetos", uid), p);
      else gravar(lsPerfil(uid), p);
    },
    [uid, configured],
  );

  const value = useMemo(
    () => ({ catalogo, perfil, carregando, salvarItem, removerItem, importar, salvarPerfil }),
    [catalogo, perfil, carregando, salvarItem, removerItem, importar, salvarPerfil],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useArquiteto(): ArquitetoContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useArquiteto precisa estar dentro de <ArquitetoProvider>");
  return ctx;
}
