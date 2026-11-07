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
import { PROJETO_VAZIO, type Item, type Obra, type ObraInput, type Programa, type Projeto } from "./types";
import { SEED_ITENS } from "./seed";
import { resumoDeItens } from "./calc";
import { CASA_PITANGA_EMAILS, LS_OBRAS, lsItensKey } from "./demo";

interface ObrasContextValue {
  obras: Obra[];
  loading: boolean;
  /** Cria do zero ou, com `origemId`, a partir de outro projeto do próprio arquiteto. */
  criarObra: (data: ObraInput, origemId?: string) => Promise<string>;
  /** Cria (ou re-cria) a Casa Pitanga como obra compartilhada entre os 3 arquitetos. */
  recuperarCasaPitanga: () => Promise<string>;
  /** Arquivar guarda a obra fora da lista principal (reversível); restaurar a traz de volta. */
  arquivarObra: (id: string, arquivar: boolean) => Promise<void>;
  /** Exclui de vez: a obra, os itens e os acessos dos clientes. Não tem volta. */
  removerObra: (id: string) => Promise<void>;
}

const ObrasContext = createContext<ObrasContextValue | null>(null);

/** O que se leva de um projeto para o novo: estrutura pronta, sem andamento e sem dados do cliente. */
interface Clone {
  itens: Item[];
  programa?: Programa;
  projeto?: Projeto;
}

/**
 * Copia a estrutura de um projeto: itens (sem feito/pago/valor real/fornecedor/observação), programa de
 * necessidades (requisitos de volta a "pendente", vínculos refeitos para os itens novos) e a marca do arquiteto.
 * Não leva cliente, endereço, aprovação do cliente nem pagamentos.
 */
function clonarProjeto(origem: Obra, itensOrigem: Item[]): Clone {
  const novoId = new Map<string, string>();
  const itens: Item[] = [...itensOrigem]
    .sort((a, b) => a.ordem - b.ordem)
    .map((i) => {
      const id = crypto.randomUUID();
      novoId.set(i.id, id);
      return {
        id,
        etapaNum: i.etapaNum,
        etapa: i.etapa,
        ambiente: i.ambiente,
        descricao: i.descricao,
        ...(i.unidade ? { unidade: i.unidade } : {}),
        quantidade: i.quantidade,
        valorUnitario: i.valorUnitario,
        valorOrcado: i.valorOrcado,
        valorReal: 0,
        feito: false,
        pago: false,
        ordem: i.ordem,
      };
    });
  const programa: Programa | undefined = origem.programa
    ? {
        ambientes: origem.programa.ambientes.map((a) => ({ ...a, id: crypto.randomUUID() })),
        requisitos: origem.programa.requisitos.map((r) => ({
          ...r,
          id: crypto.randomUUID(),
          status: "pendente" as const,
          itensIds: (r.itensIds ?? []).map((x) => novoId.get(x)).filter((x): x is string => Boolean(x)),
        })),
      }
    : undefined;
  const projeto: Projeto | undefined = origem.projeto ? { ...PROJETO_VAZIO, ...origem.projeto, cliente: "", endereco: "" } : undefined;
  return { itens, programa, projeto };
}

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

  /** Cria um projeto do zero, ou a partir de um projeto do próprio arquiteto (`origemId`). */
  async function criarObra(data: ObraInput, origemId?: string): Promise<string> {
    let clone: Clone | undefined;
    if (origemId) {
      const origem = obras.find((o) => o.id === origemId);
      if (!origem) throw new Error("Projeto de origem não encontrado");
      clone = clonarProjeto(origem, await lerItens(origemId));
    }
    return criar({ ...data }, false, undefined, clone);
  }

  /** Itens de um projeto (nuvem ou demo). */
  async function lerItens(id: string): Promise<Item[]> {
    if (configured && db) {
      const snap = await getDocs(collection(db, "obras", id, "itens"));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Item, "id">) }));
    }
    try {
      return JSON.parse(localStorage.getItem(lsItensKey(id)) ?? "[]") as Item[];
    } catch {
      return [];
    }
  }

  async function recuperarCasaPitanga(): Promise<string> {
    return criar(
      { nome: "Casa Pitanga", accessCode: "PITANGA", orcamentoTotal: 0 },
      true,
      CASA_PITANGA_EMAILS,
    );
  }

  async function criar(data: ObraInput, seed: boolean, ownerEmails?: string[], clone?: Clone): Promise<string> {
    if (!user) throw new Error("Sem usuário");
    // Itens com que o projeto já nasce: os copiados de outro projeto, os de exemplo (só a Casa Pitanga) ou nenhum.
    const iniciais: Item[] = clone ? clone.itens : seed ? SEED_ITENS : [];
    if (configured && db) {
      const banco = db;
      const ref = doc(collection(banco, "obras"));
      // Cria o projeto PRIMEIRO: as regras dos itens checam get(obra), que só existe após o commit.
      await setDoc(ref, {
        ownerUid: user.uid,
        ownerEmail: user.email,
        ...(ownerEmails ? { ownerEmails } : {}),
        nome: data.nome,
        accessCode: data.accessCode,
        orcamentoTotal: data.orcamentoTotal,
        resumo: resumoDeItens(iniciais),
        ...(clone?.programa ? { programa: clone.programa } : {}),
        ...(clone?.projeto ? { projeto: clone.projeto } : {}),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      for (let i = 0; i < iniciais.length; i += 400) {
        const batch = writeBatch(banco);
        iniciais.slice(i, i + 400).forEach((it) => {
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
      resumo: resumoDeItens(iniciais),
      ...(clone?.programa ? { programa: clone.programa } : {}),
      ...(clone?.projeto ? { projeto: clone.projeto } : {}),
      createdAt: Date.now(),
    };
    const todas = lerObrasDemo();
    todas.push(nova);
    salvarObrasDemo(todas);
    try {
      localStorage.setItem(lsItensKey(id), JSON.stringify(iniciais));
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
