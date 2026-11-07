"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "./Modal";
import { useObras } from "@/lib/obras";

function geraCodigo() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function ObraDialog({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { criarObra } = useObras();
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");
  const [teto, setTeto] = useState("");
  const [exemplo, setExemplo] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (aberto) {
      setNome("");
      setCodigo(geraCodigo());
      setTeto("");
      setExemplo(false);
    }
  }, [aberto]);

  const valido = nome.trim() && codigo.trim();

  async function salvar() {
    if (!valido || salvando) return;
    setSalvando(true);
    try {
      const id = await criarObra(
        { nome: nome.trim(), accessCode: codigo.trim().toUpperCase(), orcamentoTotal: Number(teto) || 0 },
        exemplo,
      );
      onFechar();
      router.push(`/obra/${id}`);
    } finally {
      setSalvando(false);
    }
  }

  const campo = "campo-pit w-full border border-ink/25 bg-white px-3 py-2.5 text-sm text-ink outline-none";
  const rotulo = "rotulo-tec mb-1 block text-ink/55";

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Nova obra">
      <div className="space-y-4">
        <div>
          <label className={rotulo}>Nome da obra</label>
          <input className={campo} placeholder="Ex.: Casa Pitanga" value={nome} onChange={(e) => setNome(e.target.value)} />
        </div>

        <div>
          <label className={rotulo}>Chave de acesso (para os clientes)</label>
          <div className="flex gap-2">
            <input className={`${campo} font-mono tracking-widest`} value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} />
            <button type="button" onClick={() => setCodigo(geraCodigo())} className="btn btn-linha shrink-0 px-3 font-mono text-[11px] font-semibold uppercase tracking-wider" title="Gerar uma chave nova">
              Gerar
            </button>
          </div>
          <p className="mt-1 text-xs text-ink/50">O cliente usa essa chave, junto com o link da obra, para acompanhar tudo.</p>
        </div>

        <div>
          <label className={rotulo}>Orçamento disponível (R$) — opcional</label>
          <input type="number" inputMode="decimal" className={campo} placeholder="0,00" value={teto} onChange={(e) => setTeto(e.target.value)} />
          <p className="mt-1 text-xs text-ink/50">O teto da obra. Pode ser definido depois, em Ajustes.</p>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 border border-linha p-3 text-sm text-ink/75 transition-colors hover:border-ink">
          <input type="checkbox" checked={exemplo} onChange={(e) => setExemplo(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#d23a1f]" />
          <span>
            Começar com a planilha de exemplo
            <span className="block text-xs text-ink/50">Casa Pitanga, 306 itens. Bom para conhecer o sistema.</span>
          </span>
        </label>

        <button onClick={salvar} disabled={!valido || salvando} className="btn btn-primario w-full px-4 py-3 text-sm">
          {salvando ? "Criando…" : "Criar obra"}
        </button>
      </div>
    </Modal>
  );
}
