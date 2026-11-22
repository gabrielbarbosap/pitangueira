"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { useAgora } from "@/app/components/acompanhar/useAgora";
import { auth, db } from "./firebase";
import { useAuth } from "./auth";
import { useObras } from "./obras";
import { bloqueioDeLimite, planoEfetivo, PLANOS, type Assinatura, type Bloqueio, type DefPlano, type LimiteDe, type PlanoEfetivo, type Recurso } from "./planos";

interface PlanoContextValue {
  /** O plano que vale agora (teste, assinatura, cortesia ou sem assinatura). */
  efetivo: PlanoEfetivo;
  def: DefPlano;
  assinatura: Assinatura | null;
  carregando: boolean;
  /** Projetos em andamento (não arquivados). */
  obrasAtivas: number;
  /** O recurso está liberado? (Cliente e carregamento: sempre sim, para a tela não piscar bloqueada.) */
  pode: (r: Recurso) => boolean;
  /** Se o limite foi atingido, o motivo; senão nulo. */
  bloqueio: (tipo: LimiteDe, usados: number) => Bloqueio | null;
  /** Atalho: o limite de projetos em andamento. */
  bloqueioObras: Bloqueio | null;
  /** Só no modo demo: troca o plano de teste (para ver os limites sem Stripe). */
  definirAssinaturaDemo: ((a: Assinatura | null) => void) | null;
}

const Ctx = createContext<PlanoContextValue | null>(null);

const lsAssinatura = (uid: string) => `reforma:assinatura-demo:v1:${uid}`;
const lsCriado = (uid: string) => `reforma:conta-criada-demo:v1:${uid}`;

function lerJson<T>(chave: string): T | null {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : null;
  } catch {
    return null;
  }
}

/** No demo não há conta de verdade: o "nascimento" é o primeiro acesso neste navegador, guardado para os próximos. */
function primeiraVisitaDemo(uid: string): number {
  const guardado = Number(localStorage.getItem(lsCriado(uid)));
  if (guardado > 0) return guardado;
  const agoraMs = Date.now();
  try {
    localStorage.setItem(lsCriado(uid), String(agoraMs));
  } catch {
    /* ignore */
  }
  return agoraMs;
}

/**
 * Qual plano o arquiteto tem e o que ele permite. A assinatura vem de `assinaturas/{uid}` (só o servidor grava; aqui só
 * se lê). Sem ela, vale o teste grátis de 5 dias e depois o Broto. Clientes (acesso por código) não têm plano: o que
 * limita é o plano do arquiteto, que cria os projetos.
 */
export function PlanoProvider({ children }: { children: ReactNode }) {
  const { user, configured } = useAuth();
  const { obras } = useObras();
  const agora = useAgora();
  const uid = user && !user.anonimo ? user.uid : null;
  const [versaoDemo, setVersaoDemo] = useState(0);
  const [daNuvem, setDaNuvem] = useState<{ uid: string; assinatura: Assinatura | null } | null>(null);

  useEffect(() => {
    if (!uid || !configured || !db) return;
    return onSnapshot(
      doc(db, "assinaturas", uid),
      (d) => setDaNuvem({ uid, assinatura: d.exists() ? (d.data() as Assinatura) : null }),
      () => setDaNuvem({ uid, assinatura: null }),
    );
  }, [uid, configured]);

  const nuvem = !!uid && configured && !!db;
  const carregando = nuvem && daNuvem?.uid !== uid;
  const assinatura = useMemo<Assinatura | null>(() => {
    if (!uid) return null;
    if (nuvem) return daNuvem?.uid === uid ? daNuvem.assinatura : null;
    void versaoDemo; // recalcula quando o simulador troca o plano
    return lerJson<Assinatura>(lsAssinatura(uid));
  }, [uid, nuvem, daNuvem, versaoDemo]);

  // Quando a conta nasceu: no Firebase vem da própria conta; no demo, do primeiro acesso neste navegador.
  const criadoEm = useMemo<number | null>(() => {
    if (!uid) return null;
    if (nuvem) {
      const t = Date.parse(auth?.currentUser?.metadata.creationTime ?? "");
      return Number.isFinite(t) ? t : null;
    }
    return primeiraVisitaDemo(uid);
  }, [uid, nuvem]);

  // `agora` é arredondado ao minuto e pode ficar uns segundos ANTES de uma conta recém-criada: nunca conta menos que isso.
  const efetivo = useMemo(() => planoEfetivo(assinatura, criadoEm, Math.max(agora, criadoEm ?? 0)), [assinatura, criadoEm, agora]);
  const def = PLANOS[efetivo.plano];
  const obrasAtivas = useMemo(() => obras.filter((o) => !o.arquivada).length, [obras]);
  const liberado = !uid || carregando; // cliente e carregamento: nada bloqueado

  const pode = useCallback((r: Recurso) => liberado || def.recursos[r], [liberado, def]);
  const bloqueio = useCallback((tipo: LimiteDe, usados: number) => (liberado ? null : bloqueioDeLimite(def, tipo, usados)), [liberado, def]);
  const definirAssinaturaDemo = useCallback(
    (a: Assinatura | null) => {
      if (!uid) return;
      try {
        if (a) localStorage.setItem(lsAssinatura(uid), JSON.stringify(a));
        else localStorage.removeItem(lsAssinatura(uid));
      } catch {
        /* ignore */
      }
      setVersaoDemo((v) => v + 1);
    },
    [uid],
  );

  const value = useMemo<PlanoContextValue>(
    () => ({
      efetivo,
      def,
      assinatura,
      carregando,
      obrasAtivas,
      pode,
      bloqueio,
      bloqueioObras: bloqueio("obrasAtivas", obrasAtivas),
      definirAssinaturaDemo: nuvem ? null : definirAssinaturaDemo,
    }),
    [efetivo, def, assinatura, carregando, obrasAtivas, pode, bloqueio, nuvem, definirAssinaturaDemo],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlano(): PlanoContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlano precisa estar dentro de <PlanoProvider>");
  return ctx;
}
