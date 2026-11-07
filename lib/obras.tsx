"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  collection,
  onSnapshot,
  deleteDoc,
  deleteField,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { useAuth } from "./auth";
import type { Item, Obra, ObraInput } from "./types";
import { SEED_ITENS } from "./seed";
import { resumoDeItens } from "./calc";
import { CASA_PITANGA_EMAILS, LS_OBRAS, lsItensKey } from "./demo";

interface ObrasContextValue {
  obras: Obra[];
  loading: boolean;
  criarObra: (data: ObraInput, seedCasaPitanga?: boolean) => Promise<string>;
  /** Cria (ou re-cria) a Casa Pitanga como obra compartilhada entre os 3 arquitetos. */
  recuperarCasaPitanga: () => Promise<string>;
  /** Arquivar guarda a obra fora da lista principal (reversível); restaurar a traz de volta. */
  arquivarObra: (id: string, arquivar: boolean) => Promise<void>;
  /** Exclui de vez: a obra, os itens e os acessos dos clientes. Não tem volta. */
  removerObra: (id: string) => Promise<void>;
}

const ObrasContext = createContext<ObrasContextValue | null>(null);

function lerObrasDemo(): Obra[] {
  try {
    return JSON.parse(localStorage.getItem(LS_OBRAS) ?? "[]") as Obra[];
  } catch {
    return [];
  }
}
function salvarObrasDemo(obras: Obra[]) {
  try {
    localStorage.setItem(LS_OBRAS, JSON.stringify(obras));
  } catch {
    /* ignore */
  }
}
function minhasObras(todas: Obra[], uid: string, email: string): Obra[] {
  const e = email.toLowerCase();
  return todas.filter(
    (o) => o.ownerUid === uid || (o.ownerEmails ?? []).map((x) => x.toLowerCase()).includes(e),
  );
}

export function ObrasProvider({ children }: { children: ReactNode }) {
  const { user, configured } = useAuth();
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cliente anônimo não gerencia obras: não consulta a lista de arquiteto.
    if (!user || user.anonimo) {
      setObras([]);
      setLoading(false);
      return;
    }
    if (!configured || !db) {
      setObras(minhasObras(lerObrasDemo(), user.uid, user.email));
      setLoading(false);
      return;
    }
    setLoading(true);
    // Duas consultas: obras que sou dono (uid) e obras onde sou co-dono (e-mail).
    let porUid: Obra[] = [];
    let porEmail: Obra[] = [];
    const curadas = new Set<string>();
    // Obras antigas não têm `resumo`: calcula uma vez a partir dos itens e grava na obra.
    const curar = (lista: Obra[]) => {
      for (const o of lista) {
        if (o.resumo || curadas.has(o.id)) continue;
        curadas.add(o.id);
        getDocs(collection(db!, "obras", o.id, "itens"))
          .then((snap) => {
            const itens = snap.docs.map((d) => d.data() as Item);
            return updateDoc(doc(db!, "obras", o.id), { resumo: resumoDeItens(itens) });
          })
          .catch(() => curadas.delete(o.id));
      }
    };
    const merge = () => {
      const mapa = new Map<string, Obra>();
      [...porUid, ...porEmail].forEach((o) => mapa.set(o.id, o));
      const lista = Array.from(mapa.values()).sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      setObras(lista);
      setLoading(false);
      curar(lista);
    };
    const unsub1 = onSnapshot(
      query(collection(db, "obras"), where("ownerUid", "==", user.uid)),
      (snap) => {
        porUid = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Obra, "id">) }));
        merge();
      },
      () => setLoading(false),
    );
    const unsub2 = onSnapshot(
      query(collection(db, "obras"), where("ownerEmails", "array-contains", user.email)),
      (snap) => {
        porEmail = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Obra, "id">) }));
        merge();
      },
      () => {},
    );
    return () => {
      unsub1();
      unsub2();
    };
  }, [configured, user]);

  async function criarObra(data: ObraInput, seedCasaPitanga = false): Promise<string> {
    return criar({ ...data }, seedCasaPitanga, undefined);
  }

  async function recuperarCasaPitanga(): Promise<string> {
    return criar(
      { nome: "Casa Pitanga", accessCode: "PITANGA", orcamentoTotal: 0 },
      true,
      CASA_PITANGA_EMAILS,
    );
  }

  async function criar(data: ObraInput, seed: boolean, ownerEmails?: string[]): Promise<string> {
    if (!user) throw new Error("Sem usuário");
    if (configured && db) {
      const ref = doc(collection(db, "obras"));
      // Cria a obra PRIMEIRO: as regras dos itens checam get(obra), que só existe após o commit.
      await setDoc(ref, {
        ownerUid: user.uid,
        ownerEmail: user.email,
        ...(ownerEmails ? { ownerEmails } : {}),
        nome: data.nome,
        accessCode: data.accessCode,
        orcamentoTotal: data.orcamentoTotal,
        resumo: resumoDeItens(seed ? SEED_ITENS : []),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      if (seed) {
        const banco = db;
        const batch = writeBatch(banco);
        SEED_ITENS.forEach((it) => {
          const { id, ...resto } = it;
          batch.set(doc(collection(banco, "obras", ref.id, "itens"), id), { ...resto, createdAt: Date.now(), updatedAt: Date.now() });
        });
        await batch.commit();
      }
      return ref.id;
    }
    // Demo
    const id = crypto.randomUUID();
    const nova: Obra = {
      id,
      ownerUid: user.uid,
      ownerEmail: user.email,
      ...(ownerEmails ? { ownerEmails } : {}),
      nome: data.nome,
      accessCode: data.accessCode,
      orcamentoTotal: data.orcamentoTotal,
      resumo: resumoDeItens(seed ? SEED_ITENS : []),
      createdAt: Date.now(),
    };
    const todas = lerObrasDemo();
    todas.push(nova);
    salvarObrasDemo(todas);
    try {
      localStorage.setItem(lsItensKey(id), JSON.stringify(seed ? SEED_ITENS : []));
    } catch {
      /* ignore */
    }
    setObras(minhasObras(todas, user.uid, user.email));
    return id;
  }

  async function arquivarObra(id: string, arquivar: boolean) {
    if (configured && db) {
      // Nada é apagado: só marca a obra. A lista atualiza sozinha pelo listener.
      await updateDoc(doc(db, "obras", id), {
        arquivada: arquivar,
        arquivadaEm: arquivar ? Date.now() : deleteField(),
        updatedAt: Date.now(),
      });
      return;
    }
    const todas = lerObrasDemo().map((o) =>
      o.id === id ? { ...o, arquivada: arquivar, arquivadaEm: arquivar ? Date.now() : undefined } : o,
    );
    salvarObrasDemo(todas);
    if (user) setObras(minhasObras(todas, user.uid, user.email));
  }

  async function removerObra(id: string) {
    if (configured && db) {
      // Apagar só o documento da obra deixaria itens e acessos órfãos no banco.
      // Por isso esvazia as subcoleções (enquanto a obra ainda existe, pois as regras dependem dela) e só então apaga a obra.
      const banco = db;
      const limpar = async (sub: string) => {
        const snap = await getDocs(collection(banco, "obras", id, sub));
        for (let i = 0; i < snap.docs.length; i += 400) {
          const batch = writeBatch(banco);
          snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }
      };
      await limpar("itens");
      await limpar("members");
      await deleteDoc(doc(banco, "obras", id));
      return;
    }
    const todas = lerObrasDemo().filter((o) => o.id !== id);
    salvarObrasDemo(todas);
    try {
      localStorage.removeItem(lsItensKey(id));
    } catch {
      /* ignore */
    }
    if (user) setObras(minhasObras(todas, user.uid, user.email));
  }

  const value = useMemo(
    () => ({ obras, loading, criarObra, recuperarCasaPitanga, arquivarObra, removerObra }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [obras, loading],
  );

  return <ObrasContext.Provider value={value}>{children}</ObrasContext.Provider>;
}

export function useObras(): ObrasContextValue {
  const ctx = useContext(ObrasContext);
  if (!ctx) throw new Error("useObras precisa estar dentro de <ObrasProvider>");
  return ctx;
}
