"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { IconeCadeado } from "./Icones";
import { dataDoCampo, meiaNoite, paraCampo } from "@/lib/financeiro";
import { dataCurta, dataLonga, diasEntre, terminoPrevisto, textoDeDesvio, type UnidadePrazo } from "@/lib/prazo";
import type { Previsao } from "@/lib/types";

const campo = "campo-pit w-full border border-ink/25 bg-white px-3 py-2.5 text-sm text-ink outline-none";
const rotulo = "rotulo-tec mb-1 block text-ink/55";

const MIN_MOTIVO = 8;

/**
 * Registro de previsão de prazo. Sem nenhuma previsão, registra a ORIGINAL (início e duração);
 * com previsões, registra uma NOVA previsão (novo término e motivo obrigatório).
 * Em ambos os casos o registro não pode ser editado depois, e o diálogo deixa isso claro antes de salvar.
 * É montado de novo a cada abertura (o pai usa `key`), então começa sempre limpo.
 */
export function PrevisaoDialog({
  aberto,
  onFechar,
  previsoes,
  onRegistrar,
}: {
  aberto: boolean;
  onFechar: () => void;
  previsoes: Previsao[];
  onRegistrar: (p: { inicio: number; termino: number; motivo: string }) => Promise<void>;
}) {
  const inicial = previsoes.length === 0;
  const original = previsoes[0];
  const vigente = previsoes[previsoes.length - 1];

  const [inicio, setInicio] = useState(() => paraCampo(vigente ? vigente.inicio : meiaNoite(new Date())));
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState<UnidadePrazo>("meses");
  const [novoTermino, setNovoTermino] = useState(() => (vigente ? paraCampo(vigente.termino) : ""));
  const [motivo, setMotivo] = useState("");
  const [ciente, setCiente] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  const ini = dataDoCampo(inicio);
  const qtd = Number(quantidade.replace(",", "."));
  // Original: o término vem da duração. Nova previsão: o término é a data informada.
  const termino = inicial
    ? ini !== null && qtd > 0 && Number.isFinite(qtd)
      ? terminoPrevisto(ini, Math.round(qtd), unidade)
      : null
    : dataDoCampo(novoTermino);
  const dias = ini !== null && termino !== null ? diasEntre(ini, termino) : 0;

  const motivoOk = inicial || motivo.trim().length >= MIN_MOTIVO;
  const mudou = inicial || (vigente && termino !== null && (termino !== vigente.termino || ini !== vigente.inicio));
  const valido = ini !== null && termino !== null && dias > 0 && motivoOk && mudou && ciente;

  async function registrar() {
    if (!valido || ocupado || ini === null || termino === null) return;
    setOcupado(true);
    setErro("");
    try {
      await onRegistrar({ inicio: ini, termino, motivo });
      onFechar();
    } catch (e) {
      // O código (ex.: permission-denied) ajuda a achar o motivo quando a gravação é recusada.
      const codigo = (e as { code?: string })?.code;
      setErro(`Não consegui registrar agora. Nada foi alterado; tente de novo.${codigo ? ` (${codigo})` : ""}`);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={inicial ? "Previsão inicial do prazo" : `Nova previsão (${previsoes.length + 1}ª)`}>
      <div className="space-y-4">
        <p className="flex items-start gap-2 rounded-2xl bg-ink/[0.05] px-3.5 py-3 text-[13px] leading-snug text-ink/75">
          <span className="mt-0.5 shrink-0 text-ink/60"><IconeCadeado size={16} /></span>
          {inicial ? (
            <span>
              Este é o <strong className="font-semibold text-ink">prazo original</strong> do projeto. Depois de registrado, <strong className="font-semibold text-ink">não pode ser editado nem apagado</strong>. Se o prazo
              mudar, você registra uma nova previsão, que fica ao lado dele.
            </span>
          ) : (
            <span>
              O prazo original e as previsões anteriores <strong className="font-semibold text-ink">continuam registrados</strong>. Esta será uma <strong className="font-semibold text-ink">nova previsão</strong>, mostrada
              como tal para você e para o cliente, e também não poderá ser editada.
            </span>
          )}
        </p>

        {!inicial && original && vigente && (
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-linha bg-linha text-sm">
            <div className="bg-white px-3.5 py-2.5">
              <dt className="rotulo-tec text-ink/45">Prazo original</dt>
              <dd className="mt-0.5 font-medium text-ink">{dataCurta(original.termino)}</dd>
            </div>
            <div className="bg-white px-3.5 py-2.5">
              <dt className="rotulo-tec text-ink/45">Previsão atual ({vigente.numero}ª)</dt>
              <dd className="mt-0.5 font-medium text-ink">{dataCurta(vigente.termino)}</dd>
            </div>
          </dl>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={rotulo}>Início da obra</label>
            <input type="date" aria-label="Início da obra" className={campo} value={inicio} onChange={(e) => setInicio(e.target.value)} />
          </div>
          {inicial ? (
            <div>
              <label className={rotulo}>Duração prevista</label>
              <div className="flex gap-2">
                <input type="number" inputMode="numeric" min={1} aria-label="Duração prevista" className={`${campo} min-w-0`} value={quantidade} onChange={(e) => setQuantidade(e.target.value)} placeholder="Ex.: 6" />
                <select className={`${campo} w-auto`} value={unidade} onChange={(e) => setUnidade(e.target.value as UnidadePrazo)} aria-label="Unidade da duração">
                  <option value="dias">dias</option>
                  <option value="semanas">semanas</option>
                  <option value="meses">meses</option>
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className={rotulo}>Novo término previsto</label>
              <input type="date" aria-label="Novo término previsto" className={campo} value={novoTermino} onChange={(e) => setNovoTermino(e.target.value)} />
            </div>
          )}
        </div>

        {termino !== null && ini !== null && (
          <p className="rounded-2xl border border-linha px-3.5 py-2.5 text-sm text-ink/80">
            {dias > 0 ? (
              <>
                Término previsto em <strong className="font-semibold text-ink">{dataLonga(termino)}</strong> · {dias} {dias === 1 ? "dia" : "dias"} de obra
                {!inicial && original && <span className="mt-0.5 block text-xs text-ink/55">{textoDeDesvio(diasEntre(original.termino, termino))}</span>}
              </>
            ) : (
              <span className="text-pitanga">O término precisa ser depois do início.</span>
            )}
          </p>
        )}
        {!inicial && termino !== null && !mudou && <p className="text-xs text-pitanga">Informe um término diferente do atual para registrar uma nova previsão.</p>}

        <div>
          <label className={rotulo}>{inicial ? "Observação (opcional)" : "Motivo da nova previsão"}</label>
          <textarea
            className={`${campo} resize-none`}
            rows={3}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder={inicial ? "Ex.: considera a aprovação do condomínio e a entrega das esquadrias" : "Ex.: atraso na entrega das esquadrias e chuvas no período"}
          />
          {!inicial && motivo.trim().length < MIN_MOTIVO && <p className="mt-1 text-xs text-ink/50">Explique o que mudou, em pelo menos {MIN_MOTIVO} letras. O cliente vai ler.</p>}
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-snug text-ink/80">
          <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-[#d23a1f]" checked={ciente} onChange={(e) => setCiente(e.target.checked)} />
          {inicial
            ? "Entendo que a previsão original não poderá ser editada nem apagada."
            : "Entendo que a previsão anterior continua registrada e que esta nova previsão não poderá ser editada."}
        </label>

        {erro && (
          <p role="alert" className="rounded-xl bg-pitanga/10 px-3 py-2 text-[13px] text-pitanga">
            {erro}
          </p>
        )}

        <div className="flex gap-2">
          <button className="btn btn-linha flex-1 px-4 py-3 text-sm" onClick={onFechar}>
            Cancelar
          </button>
          <button className="btn btn-primario flex-1 px-4 py-3 text-sm" disabled={!valido || ocupado} onClick={registrar}>
            {ocupado ? "Registrando…" : inicial ? "Registrar prazo original" : "Registrar nova previsão"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
