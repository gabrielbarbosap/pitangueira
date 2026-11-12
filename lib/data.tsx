"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { resumoDeItens } from "./calc";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  writeBatch,
  deleteField,
  arrayUnion,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import { useAuth } from "./auth";
import type { AprovacaoPrograma, Config, Item, ItemInput, Previsao, Programa, Projeto } from "./types";
import { CONFIG_PADRAO, PROGRAMA_VAZIO, PROJETO_VAZIO } from "./types";
import { LS_OBRAS, avisarObrasMudaram, lsItensKey } from "./demo";

// O Firestore não aceita `undefined`. Em criação removemos; em edição viram deleteField().
function semUndefined(obj: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}
function paraUpdate(obj: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === undefined ? deleteField() : v]));
}

interface DataContextValue {
  obraId: string;
  itens: Item[];
  config: Config;
  loading: boolean;
  /** Nome de quem está logado (para a auditoria de quem marcou). */
  ator: string;
  /** true = cliente (permissões limitadas: marca feito/pago e edita orçamento). */
  ehCliente: boolean;
  addItem: (data: Omit<ItemInput, "ordem">) => Promise<void>;
  updateItem: (id: string, patch: Partial<ItemInput>) => Promise<void>;
  updateMany: (ids: string[], patch: Partial<ItemInput>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  saveConfig: (patch: Partial<Config>) => Promise<void>;
  projeto: Projeto;
  programa: Programa;
  aprovacao: AprovacaoPrograma | null;
  /** Arquiteto: grava os dados do projeto. */
  saveProjeto: (p: Projeto) => Promise<void>;
  /** Arquiteto: grava o programa e invalida a aprovação anterior. */
  savePrograma: (p: Programa, opts?: { manterAprovacao?: boolean }) => Promise<void>;
  /** Cliente: aprova o programa atual. */
  aprovarPrograma: (nome: string) => Promise<void>;
  /** Previsões de prazo do projeto: a original e as novas, da mais antiga à mais recente. */
  previsoes: Previsao[];
  /**
   * Arquiteto: acrescenta uma previsão (a 1ª é a original; as seguintes são "novas previsões").
   * Só acrescenta: não existe edição nem remoção, e as regras do banco também impedem.
   */
  registrarPrevisao: (p: { inicio: number; termino: number; motivo: string }) => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ obraId, children }: { obraId: string; children: ReactNode }) {
  const { user, configured } = useAuth();
  const [itens, setItens] = useState<Item[]>([]);
  const [config, setConfig] = useState<Config>(CONFIG_PADRAO);
  const [loading, setLoading] = useState(true);
  const [projeto, setProjeto] = useState<Projeto>(PROJETO_VAZIO);
  const [programa, setPrograma] = useState<Programa>(PROGRAMA_VAZIO);
  const [aprovacao, setAprovacao] = useState<AprovacaoPrograma | null>(null);
  const [previsoes, setPrevisoes] = useState<Previsao[]>([]);
  const ator = user?.nome ?? "—";
  const ehCliente = user?.anonimo === true;
  // Resumo gravado na obra (null = ainda não chegou o snapshot da obra).
  const resumoSalvo = useRef<string | null>(null);

  // ---------- Carregamento ----------
  useEffect(() => {
    if (!configured || !db) {
      try {
        const rawItens = localStorage.getItem(lsItensKey(obraId));
        setItens(rawItens ? (JSON.parse(rawItens) as Item[]) : []);
        const obras = JSON.parse(localStorage.getItem(LS_OBRAS) ?? "[]") as {
          id: string;
          nome: string;
          orcamentoTotal: number;
          projeto?: Projeto;
          programa?: Programa;
          programaAprovacao?: AprovacaoPrograma;
          previsoes?: Previsao[];
        }[];
        const o = obras.find((x) => x.id === obraId);
        setConfig(o ? { nomeObra: o.nome, orcamentoTotal: o.orcamentoTotal } : CONFIG_PADRAO);
        setProjeto({ ...PROJETO_VAZIO, ...(o?.projeto ?? {}) });
        setPrograma(o?.programa ?? PROGRAMA_VAZIO);
        setAprovacao(o?.programaAprovacao ?? null);
        setPrevisoes(o?.previsoes ?? []);
      } catch {
        setItens([]);
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubItens = onSnapshot(
      query(collection(db, "obras", obraId, "itens"), orderBy("ordem")),
      (snap) => {
        setItens(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Item, "id">) })));
        setLoading(false);
      },
      () => setLoading(false),
    );
    const unsubObra = onSnapshot(doc(db, "obras", obraId), (d) => {
      if (d.exists()) {
        const o = d.data();
        setConfig({ nomeObra: o.nome ?? "Projeto", orcamentoTotal: o.orcamentoTotal ?? 0 });
        resumoSalvo.current = JSON.stringify(o.resumo ?? null);
        setProjeto({ ...PROJETO_VAZIO, ...(o.projeto ?? {}) });
        setPrograma(o.programa ?? PROGRAMA_VAZIO);
        setAprovacao(o.programaAprovacao ?? null);
        setPrevisoes((o.previsoes as Previsao[] | undefined) ?? []);
      }
    });
    return () => {
      unsubItens();
      unsubObra();
    };
  }, [configured, obraId, user]);

  // Persiste itens no modo demo.
  useEffect(() => {
    if (configured || loading) return;
    try {
      localStorage.setItem(lsItensKey(obraId), JSON.stringify(itens));
    } catch {
      /* ignore */
    }
  }, [itens, configured, loading, obraId]);

  // Mantém o agregado da obra em dia (a home do arquiteto lê isto, não os itens).
  useEffect(() => {
    if (loading) return;
    const resumo = resumoDeItens(itens);
    const novo = JSON.stringify(resumo);
    if (configured && db) {
      if (resumoSalvo.current === null || resumoSalvo.current === novo) return;
      resumoSalvo.current = novo;
      updateDoc(doc(db, "obras", obraId), { resumo }).catch(() => {});
    } else {
      try {
        const obras = JSON.parse(localStorage.getItem(LS_OBRAS) ?? "[]") as { id: string; resumo?: unknown }[];
        const atual = obras.find((o) => o.id === obraId);
        if (!atual || JSON.stringify(atual.resumo ?? null) === novo) return;
        localStorage.setItem(LS_OBRAS, JSON.stringify(obras.map((o) => (o.id === obraId ? { ...o, resumo } : o))));
        avisarObrasMudaram();
      } catch {
        /* ignore */
      }
    }
  }, [itens, loading, configured, obraId]);

  const proximaOrdem = () => itens.reduce((max, i) => Math.max(max, i.ordem), 0) + 1;

  /** Acrescenta auditoria (quem/quando) quando feito/pago mudam. */
  function comAuditoria(patch: Partial<ItemInput>): Record<string, unknown> {
    const dados: Record<string, unknown> = { ...patch };
    if (patch.feito !== undefined) {
      dados.feitoPor = patch.feito ? ator : undefined;
      dados.feitoEm = patch.feito ? Date.now() : undefined;
    }
    if (patch.pago !== undefined) {
      dados.pagoPor = patch.pago ? ator : undefined;
      dados.pagoEm = patch.pago ? Date.now() : undefined;
    }
    return dados;
  }

  // ---------- Mutações ----------
  async function addItem(data: Omit<ItemInput, "ordem">) {
    const base = { ...data, ordem: proximaOrdem() };
    if (configured && db) {
      await addDoc(collection(db, "obras", obraId, "itens"), semUndefined({ ...base, createdAt: Date.now(), updatedAt: Date.now() }));
    } else {
      setItens((prev) => [...prev, { ...base, id: crypto.randomUUID(), createdAt: Date.now(), updatedAt: Date.now() }]);
    }
  }

  async function updateItem(id: string, patch: Partial<ItemInput>) {
    const dados = comAuditoria(patch);
    if (configured && db) {
      await updateDoc(doc(db, "obras", obraId, "itens", id), paraUpdate({ ...dados, updatedAt: Date.now() }));
    } else {
      setItens((prev) => prev.map((i) => (i.id === id ? ({ ...i, ...dados, updatedAt: Date.now() } as Item) : i)));
    }
  }

  async function updateMany(ids: string[], patch: Partial<ItemInput>) {
    if (ids.length === 0) return;
    const dados = comAuditoria(patch);
    if (configured && db) {
      const banco = db;
      const batch = writeBatch(banco);
      ids.forEach((id) => batch.update(doc(banco, "obras", obraId, "itens", id), paraUpdate({ ...dados, updatedAt: Date.now() })));
      await batch.commit();
    } else {
      const set = new Set(ids);
      setItens((prev) => prev.map((i) => (set.has(i.id) ? ({ ...i, ...dados, updatedAt: Date.now() } as Item) : i)));
    }
  }

  async function removeItem(id: string) {
    if (configured && db) {
      await deleteDoc(doc(db, "obras", obraId, "itens", id));
    } else {
      setItens((prev) => prev.filter((i) => i.id !== id));
    }
  }

  async function saveConfig(patch: Partial<Config>) {
    setConfig((c) => ({ ...c, ...patch }));
    if (configured && db) {
      const upd: Record<string, unknown> = { updatedAt: Date.now() };
      if (patch.nomeObra !== undefined) upd.nome = patch.nomeObra;
      if (patch.orcamentoTotal !== undefined) upd.orcamentoTotal = patch.orcamentoTotal;
      await updateDoc(doc(db, "obras", obraId), upd);
    } else {
      try {
        const obras = JSON.parse(localStorage.getItem(LS_OBRAS) ?? "[]") as { id: string; nome: string; orcamentoTotal: number }[];
        const novas = obras.map((o) =>
          o.id === obraId
            ? { ...o, nome: patch.nomeObra ?? o.nome, orcamentoTotal: patch.orcamentoTotal ?? o.orcamentoTotal }
            : o,
        );
        localStorage.setItem(LS_OBRAS, JSON.stringify(novas));
        avisarObrasMudaram();
      } catch {
        /* ignore */
      }
    }
  }

  /** Aplica um patch no registro da obra guardado no demo (localStorage). */
  function patchObraDemo(patch: Record<string, unknown>) {
    try {
      const obras = JSON.parse(localStorage.getItem(LS_OBRAS) ?? "[]") as { id: string }[];
      localStorage.setItem(LS_OBRAS, JSON.stringify(obras.map((o) => (o.id === obraId ? { ...o, ...patch } : o))));
      avisarObrasMudaram();
    } catch {
      /* ignore */
    }
  }

  async function saveProjeto(p: Projeto) {
    setProjeto(p);
    if (configured && db) await updateDoc(doc(db, "obras", obraId), { projeto: p, updatedAt: Date.now() });
    else patchObraDemo({ projeto: p });
  }

  async function savePrograma(p: Programa, opts?: { manterAprovacao?: boolean }) {
    setPrograma(p);
    const manter = opts?.manterAprovacao === true;
    if (!manter) setAprovacao(null);
    if (configured && db) {
      await updateDoc(doc(db, "obras", obraId), {
        programa: p,
        ...(manter ? {} : { programaAprovacao: deleteField() }),
        updatedAt: Date.now(),
      });
    } else {
      patchObraDemo(manter ? { programa: p } : { programa: p, programaAprovacao: undefined });
    }
  }

  async function aprovarPrograma(nome: string) {
    const ap: AprovacaoPrograma = { nome, em: Date.now() };
    setAprovacao(ap);
    if (configured && db) await updateDoc(doc(db, "obras", obraId), { programaAprovacao: ap, updatedAt: Date.now() });
    else patchObraDemo({ programaAprovacao: ap });
  }

  async function registrarPrevisao(p: { inicio: number; termino: number; motivo: string }) {
    if (ehCliente) throw new Error("Só o arquiteto registra previsões");
    const nova: Previsao = {
      id: crypto.randomUUID(),
      numero: previsoes.length + 1,
      inicio: p.inicio,
      termino: p.termino,
      dias: Math.round((p.termino - p.inicio) / 86_400_000),
      registradaEm: Date.now(),
      registradaPor: ator,
      motivo: p.motivo.trim(),
    };
    const antes = previsoes;
    setPrevisoes([...antes, nova]);
    try {
      // arrayUnion só acrescenta ao fim; as regras do banco recusam qualquer outra mudança na lista.
      if (configured && db) await updateDoc(doc(db, "obras", obraId), { previsoes: arrayUnion(nova), updatedAt: Date.now() });
      else patchObraDemo({ previsoes: [...antes, nova] });
    } catch (e) {
      setPrevisoes(antes);
      throw e;
    }
  }

  const value = useMemo(
    () => ({
      obraId, itens, config, loading, ator, ehCliente, addItem, updateItem, updateMany, removeItem, saveConfig,
      projeto, programa, aprovacao, saveProjeto, savePrograma, aprovarPrograma, previsoes, registrarPrevisao,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [itens, config, loading, ator, ehCliente, projeto, programa, aprovacao, previsoes],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData precisa estar dentro de <DataProvider>");
  return ctx;
}
