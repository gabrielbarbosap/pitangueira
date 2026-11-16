"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/data";
import { lerItensColados } from "@/lib/importar";
import { useDinheiro } from "@/lib/privacidade";
import { Modal } from "./Modal";
import { Alerta } from "./ui/Alerta";
import { Botao } from "./ui/Botao";
import { Chip } from "./ui/Chip";

const EXEMPLO = `Etapa;Descrição;Qtd;Unid;Valor unit.
Pintura;Tinta acrílica 18L;4;un;350,00
Pintura;Mão de obra pintor;60;m²;18
Elétrica;Pontos de tomada;10;un;120`;

/**
 * Importa itens colados de uma planilha. O arquiteto cola, vê como o app entendeu cada linha e só então importa.
 * A janela é montada de novo a cada abertura (o pai usa `key`), então começa sempre limpa.
 */
export function ImportarDialog({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { addItem } = useData();
  const { brl } = useDinheiro();
  const [texto, setTexto] = useState("");
  const [etapaPadrao, setEtapaPadrao] = useState("");
  const [importando, setImportando] = useState(false);
  const [erro, setErro] = useState("");

  const leitura = useMemo(() => lerItensColados(texto, etapaPadrao || "Sem etapa"), [texto, etapaPadrao]);
  const { linhas } = leitura;
  const total = linhas.reduce((s, l) => s + l.valorOrcado, 0);
  const semValor = linhas.filter((l) => l.valorUnitario === 0).length;

  async function importar() {
    if (linhas.length === 0 || importando) return;
    setImportando(true);
    setErro("");
    try {
      for (const l of linhas) {
        await addItem({
          etapaNum: 0,
          etapa: l.etapa,
          ambiente: "Geral",
          descricao: l.descricao,
          unidade: l.unidade || undefined,
          quantidade: l.quantidade,
          valorUnitario: l.valorUnitario,
          valorOrcado: l.valorOrcado,
          valorReal: 0,
          feito: false,
          pago: false,
        });
      }
      onFechar();
    } catch {
      setErro("Não consegui importar tudo agora. O que já entrou ficou no orçamento; confira a lista e tente de novo com o que faltou.");
    } finally {
      setImportando(false);
    }
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Colar da planilha" largo>
      <div className="space-y-5">
        <p className="text-sm leading-snug text-ink/70">
          Já tem o orçamento no Excel ou no Google Planilhas? Copie as linhas e cole aqui. Você confere como o app entendeu antes de importar.
        </p>

        <div>
          <label htmlFor="imp-texto" className="rotulo-campo">
            Cole as linhas aqui
          </label>
          <textarea
            id="imp-texto"
            className="input-pit font-mono text-[13px]"
            rows={7}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={EXEMPLO}
            spellCheck={false}
          />
          <p className="mt-1.5 text-xs leading-snug text-ink/55">
            Ordem das colunas: <strong>Etapa · Descrição · Qtd · Unid · Valor unit.</strong> Com uma linha de títulos, a ordem pode ser outra. Sem títulos, o app lê pela quantidade de colunas (4: sem etapa; 3: sem etapa e unidade; 2: descrição e valor).
          </p>
          <button type="button" className="mt-1 text-xs font-semibold text-pitanga hover:underline" onClick={() => setTexto(EXEMPLO)}>
            Usar um exemplo
          </button>
        </div>

        <div>
          <label htmlFor="imp-etapa" className="rotulo-campo">
            Etapa para as linhas sem etapa
          </label>
          <input id="imp-etapa" className="input-pit" value={etapaPadrao} onChange={(e) => setEtapaPadrao(e.target.value)} placeholder="Sem etapa" />
        </div>

        {texto.trim() !== "" && (
          <section aria-label="Como o app entendeu">
            {linhas.length === 0 ? (
              <Alerta tom="aviso">Não encontrei nenhum item nessas linhas. Cada linha precisa ter pelo menos a descrição.</Alerta>
            ) : (
              <>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Chip tom="ok">{linhas.length} {linhas.length === 1 ? "item" : "itens"}</Chip>
                  <Chip tom="ink">Total {brl(total)}</Chip>
                  {semValor > 0 && <Chip tom="aviso">{semValor} sem valor</Chip>}
                  {leitura.ignoradas > 0 && <Chip>{leitura.ignoradas} {leitura.ignoradas === 1 ? "linha ignorada" : "linhas ignoradas"}</Chip>}
                  {leitura.comTitulos && <Chip>títulos reconhecidos</Chip>}
                </div>
                <div className="max-h-64 overflow-auto rounded-2xl border border-linha bg-white">
                  <table className="w-full min-w-[520px] text-left text-[13px]">
                    <thead className="sticky top-0 bg-ink/[0.04] font-mono text-[10px] uppercase tracking-[0.12em] text-ink/55">
                      <tr>
                        <th className="px-3 py-2">Etapa</th>
                        <th className="px-3 py-2">Descrição</th>
                        <th className="px-3 py-2 text-right">Qtd</th>
                        <th className="px-3 py-2">Unid</th>
                        <th className="px-3 py-2 text-right">Valor unit.</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-linha">
                      {linhas.map((l, i) => (
                        <tr key={i} className="align-top">
                          <td className="px-3 py-2 text-ink/70">{l.etapa}</td>
                          <td className="px-3 py-2 text-ink">
                            {l.descricao}
                            {l.aviso && <span className="block text-[11px] font-medium text-amber-800">{l.aviso}</span>}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">{l.quantidade}</td>
                          <td className="px-3 py-2 text-ink/70">{l.unidade || "—"}</td>
                          <td className="px-3 py-2 text-right font-mono">{brl(l.valorUnitario)}</td>
                          <td className="px-3 py-2 text-right font-mono font-semibold">{brl(l.valorOrcado)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}

        {erro && <Alerta tom="perigo">{erro}</Alerta>}

        <div className="flex gap-2">
          <Botao className="flex-1" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao variante="primario" className="flex-1" disabled={linhas.length === 0 || importando} onClick={importar}>
            {importando ? "Importando…" : linhas.length > 0 ? `Importar ${linhas.length} ${linhas.length === 1 ? "item" : "itens"}` : "Importar"}
          </Botao>
        </div>
      </div>
    </Modal>
  );
}
