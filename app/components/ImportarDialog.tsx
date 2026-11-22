"use client";

import { useMemo, useRef, useState, type DragEvent } from "react";
import { useData } from "@/lib/data";
import { diagnosticar, erroDeGravacao, explicarErro, lerArquivo } from "@/lib/importar";
import { CAMPOS, ErroPlanilha, ROTULO_CAMPO, detectar, gradeDeTexto, larguraDa, mapaPorPosicao, montarLinhas, type CampoImp, type Grade, type Planilha } from "@/lib/planilha";
import { registrarErro, registrarEvento } from "@/lib/telemetria";
import { useDinheiro } from "@/lib/privacidade";
import { Modal } from "./Modal";
import { Alerta } from "./ui/Alerta";
import { Botao } from "./ui/Botao";
import { Chip } from "./ui/Chip";

const EXEMPLO = `Etapa;Descrição;Qtd;Unid;Valor unit.
Pintura;Tinta acrílica 18L;4;un;350,00
Pintura;Mão de obra pintor;60;m²;18
Elétrica;Pontos de tomada;10;un;120`;

const MODELO_CSV = `Etapa;Descrição;Quantidade;Unidade;Valor unitário;Fornecedor;Observação
Demolição;Demolição de revestimento;45;m²;38,00;;
Elétrica;Ponto de tomada;12;un;150,00;Eletro Silva;Inclui fiação
Pintura;Pintura acrílica (2 demãos);180;m²;19,00;;
`;

const LIMITE_TABELA = 300;
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
const letra = (i: number) => (i < 26 ? String.fromCharCode(65 + i) : String.fromCharCode(64 + Math.floor(i / 26)) + String.fromCharCode(65 + (i % 26)));
const resumoLinha = (cels: string[]) => cels.filter(Boolean).slice(0, 4).join(" · ").slice(0, 60);

function AvisoErro({ erro }: { erro: ErroPlanilha }) {
  return (
    <Alerta tom="perigo" titulo={erro.titulo}>
      <p>{erro.message}</p>
      <p className="mt-1.5">
        <strong>Como resolver:</strong> {erro.solucao}
      </p>
    </Alerta>
  );
}

/**
 * Importa itens de uma planilha: arquivo (.xlsx, .csv) ou texto colado. O app descobre as colunas pelos títulos (o
 * arquiteto pode corrigir), mostra como entendeu cada linha, avisa dos que já estão no orçamento e só então importa.
 * Qualquer erro aparece com o que houve e o que fazer. A janela é montada de novo a cada abertura (o pai usa `key`).
 */
export function ImportarDialog({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { addItens, itens: itensDoProjeto } = useData();
  const { brl } = useDinheiro();
  const inputArquivo = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState("");
  const [arquivo, setArquivo] = useState<{ nome: string; planilhas: Planilha[] } | null>(null);
  const [aba, setAba] = useState(0);
  const [lendo, setLendo] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const [erroArquivo, setErroArquivo] = useState<ErroPlanilha | null>(null);
  const [etapaPadrao, setEtapaPadrao] = useState("");
  const [tituloEditado, setTituloEditado] = useState<number | null>(null);
  const [mapaEditado, setMapaEditado] = useState<CampoImp[] | null>(null);
  const [fora, setFora] = useState<Set<number>>(() => new Set());
  const [pularExistentes, setPularExistentes] = useState(true);
  const [importando, setImportando] = useState(false);
  const [erroGravacao, setErroGravacao] = useState<ErroPlanilha | null>(null);

  // A grade vem do arquivo (aba escolhida) ou do texto colado.
  const grade: Grade = useMemo(() => (arquivo ? (arquivo.planilhas[aba]?.grade ?? []) : gradeDeTexto(texto)), [arquivo, aba, texto]);
  const largura = Math.min(larguraDa(grade), 16);
  const automatica = useMemo(() => detectar(grade), [grade]);
  const linhaTitulo = tituloEditado ?? automatica.linhaTitulo;
  const mapa = useMemo(() => {
    const base = mapaEditado ?? (tituloEditado !== null && tituloEditado !== automatica.linhaTitulo ? (tituloEditado < 0 ? mapaPorPosicao(larguraDa(grade)) : detectarNaLinha(grade, tituloEditado)) : automatica.mapa);
    return base;
  }, [mapaEditado, tituloEditado, automatica, grade]);

  const leitura = useMemo(() => montarLinhas(grade, { linhaTitulo, mapa, etapaPadrao }), [grade, linhaTitulo, mapa, etapaPadrao]);
  const problema = useMemo(() => diagnosticar(grade, { linhaTitulo, mapa }, leitura), [grade, linhaTitulo, mapa, leitura]);

  const existentes = useMemo(() => new Set(itensDoProjeto.map((i) => `${norm(i.descricao)}|${norm(i.etapa)}`)), [itensDoProjeto]);
  const jaExiste = (l: { descricao: string; etapa: string }) => existentes.has(`${norm(l.descricao)}|${norm(l.etapa)}`);
  const duplicados = leitura.linhas.filter(jaExiste).length;
  const aImportar = problema ? [] : leitura.linhas.filter((l) => !fora.has(l.origem) && !(pularExistentes && jaExiste(l)));
  const total = aImportar.reduce((s, l) => s + l.valorOrcado, 0);
  const semValor = aImportar.filter((l) => l.valorUnitario === 0).length;
  const comAviso = aImportar.filter((l) => l.aviso && l.valorUnitario !== 0).length;
  const etapasNovas = new Set(aImportar.map((l) => l.etapa)).size;

  function recomecar() {
    setTituloEditado(null);
    setMapaEditado(null);
    setFora(new Set());
    setErroGravacao(null);
  }

  async function escolher(arq: File | undefined) {
    if (!arq) return;
    setErroArquivo(null);
    setLendo(true);
    try {
      const planilhas = await lerArquivo(arq);
      setArquivo({ nome: arq.name, planilhas });
      setAba(0);
      setTexto("");
      recomecar();
      registrarEvento("planilha_arquivo_lido", { tipo: arq.name.split(".").pop()?.toLowerCase() ?? "" });
    } catch (e) {
      const erro = explicarErro(e);
      setErroArquivo(erro);
      registrarErro("planilha_arquivo_falhou", e);
    } finally {
      setLendo(false);
      if (inputArquivo.current) inputArquivo.current.value = "";
    }
  }

  function soltar(e: DragEvent) {
    e.preventDefault();
    setArrastando(false);
    void escolher(e.dataTransfer.files[0]);
  }

  function baixarModelo() {
    const url = URL.createObjectURL(new Blob(["﻿" + MODELO_CSV], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-orcamento-pitangueira.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importar() {
    if (aImportar.length === 0 || importando) return;
    setImportando(true);
    setErroGravacao(null);
    try {
      await addItens(
        aImportar.map((l) => ({
          etapaNum: 0,
          etapa: l.etapa,
          ambiente: l.ambiente,
          descricao: l.descricao,
          unidade: l.unidade || undefined,
          quantidade: l.quantidade,
          valorUnitario: l.valorUnitario,
          valorOrcado: l.valorOrcado,
          valorReal: 0,
          feito: false,
          pago: false,
          ...(l.fornecedor ? { fornecedor: l.fornecedor } : {}),
          ...(l.observacao ? { observacao: l.observacao } : {}),
        })),
      );
      registrarEvento("planilha_importada", { linhas: aImportar.length, origem: arquivo ? "arquivo" : "colado" });
      onFechar();
    } catch (e) {
      registrarErro("importar_falhou", e);
      setErroGravacao(erroDeGravacao());
    } finally {
      setImportando(false);
    }
  }

  const temGrade = grade.length > 0;
  const mostradas = leitura.linhas.slice(0, LIMITE_TABELA);

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Importar planilha" largo>
      <div className="space-y-5">
        <p className="text-sm leading-snug text-ink/70">
          Já tem o orçamento no Excel ou no Google Planilhas? Escolha o arquivo ou cole as linhas. Você confere como o app entendeu antes de importar.
        </p>

        {!arquivo ? (
          <>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setArrastando(true);
              }}
              onDragLeave={() => setArrastando(false)}
              onDrop={soltar}
              className={`rounded-2xl border-2 border-dashed p-5 text-center transition ${arrastando ? "border-pitanga bg-pitanga/5" : "border-ink/25"}`}
            >
              <input ref={inputArquivo} id="imp-arquivo" type="file" className="sr-only" accept=".xlsx,.xlsm,.xls,.csv,.tsv,.txt,.ods,.numbers" onChange={(e) => void escolher(e.target.files?.[0])} />
              <Botao variante="solido" disabled={lendo} onClick={() => inputArquivo.current?.click()}>
                {lendo ? "Lendo o arquivo…" : "Escolher arquivo (.xlsx ou .csv)"}
              </Botao>
              <p className="mt-2 text-xs text-ink/55">ou arraste o arquivo para cá</p>
              <button type="button" className="mt-2 text-xs font-semibold text-pitanga hover:underline" onClick={baixarModelo}>
                Baixar uma planilha modelo
              </button>
            </div>

            {erroArquivo && <AvisoErro erro={erroArquivo} />}

            <div>
              <label htmlFor="imp-texto" className="rotulo-campo">
                Ou cole as linhas aqui
              </label>
              <textarea
                id="imp-texto"
                className="input-pit font-mono text-[13px]"
                rows={6}
                value={texto}
                onChange={(e) => {
                  setTexto(e.target.value);
                  setErroArquivo(null);
                  recomecar();
                }}
                placeholder={EXEMPLO}
                spellCheck={false}
              />
              <p className="mt-1.5 text-xs leading-snug text-ink/55">
                O app procura a linha de títulos (Descrição, Qtd, Valor…) e entende a ordem das colunas. Sem títulos, lê nesta ordem: <strong>Etapa · Descrição · Qtd · Unid · Valor unit.</strong>
              </p>
              <button
                type="button"
                className="mt-1 text-xs font-semibold text-pitanga hover:underline"
                onClick={() => {
                  setTexto(EXEMPLO);
                  recomecar();
                }}
              >
                Usar um exemplo
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-linha bg-papel px-3.5 py-2.5">
            <span className="min-w-0 flex-1 truncate text-sm font-semibold" title={arquivo.nome}>📄 {arquivo.nome}</span>
            {arquivo.planilhas.length > 1 && (
              <select
                aria-label="Aba da planilha"
                className="input-pit w-auto py-1.5 text-sm"
                value={aba}
                onChange={(e) => {
                  setAba(Number(e.target.value));
                  recomecar();
                }}
              >
                {arquivo.planilhas.map((p, i) => (
                  <option key={p.nome + i} value={i}>
                    Aba: {p.nome}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              className="text-xs font-semibold text-pitanga hover:underline"
              onClick={() => {
                setArquivo(null);
                recomecar();
              }}
            >
              Trocar arquivo
            </button>
          </div>
        )}

        {temGrade && (
          <details className="rounded-2xl border border-linha" open={!!problema && !problema.titulo.startsWith("Itens demais")}>
            <summary className="cursor-pointer px-3.5 py-3 text-sm font-semibold">
              Colunas <span className="font-normal text-ink/55">· confira o que é cada coluna</span>
            </summary>
            <div className="space-y-3 border-t border-linha p-3.5">
              <div>
                <label htmlFor="imp-titulo" className="rotulo-campo">
                  Linha dos títulos
                </label>
                <select
                  id="imp-titulo"
                  className="input-pit"
                  value={linhaTitulo}
                  onChange={(e) => {
                    setTituloEditado(Number(e.target.value));
                    setMapaEditado(null);
                  }}
                >
                  <option value={-1}>Não tem linha de títulos</option>
                  {grade.slice(0, 12).map((cels, i) => (
                    <option key={i} value={i}>
                      Linha {i + 1}: {resumoLinha(cels)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {Array.from({ length: largura }, (_, i) => {
                  const exemplo = grade[linhaTitulo + 1]?.[i] ?? grade[0]?.[i] ?? "";
                  return (
                    <div key={i} className="rounded-xl bg-papel p-2.5">
                      <label htmlFor={`imp-col-${i}`} className="rotulo-tec text-ink/50">
                        Coluna {letra(i)}
                        {linhaTitulo >= 0 && grade[linhaTitulo]?.[i] ? ` · ${grade[linhaTitulo][i]}` : ""}
                      </label>
                      <select
                        id={`imp-col-${i}`}
                        className="input-pit mt-1 py-1.5 text-sm"
                        value={mapa[i] ?? "ignorar"}
                        onChange={(e) => {
                          const novo = [...mapa];
                          while (novo.length < largura) novo.push("ignorar");
                          const campo = e.target.value as CampoImp;
                          if (campo !== "ignorar") for (let k = 0; k < novo.length; k++) if (k !== i && novo[k] === campo) novo[k] = "ignorar"; // cada campo vale numa coluna só
                          novo[i] = campo;
                          setMapaEditado(novo);
                        }}
                      >
                        {CAMPOS.map((c) => (
                          <option key={c} value={c}>
                            {ROTULO_CAMPO[c]}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 truncate text-[11px] text-ink/50" title={exemplo}>
                        ex.: {exemplo || "vazio"}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div>
                <label htmlFor="imp-etapa" className="rotulo-campo">
                  Etapa para as linhas sem etapa
                </label>
                <input id="imp-etapa" className="input-pit" value={etapaPadrao} onChange={(e) => setEtapaPadrao(e.target.value)} placeholder="Sem etapa" />
              </div>
            </div>
          </details>
        )}

        {temGrade && problema && <AvisoErro erro={problema} />}

        {temGrade && !problema && (
          <section aria-label="Como o app entendeu">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Chip tom="ok">{aImportar.length} {aImportar.length === 1 ? "item" : "itens"}</Chip>
              <Chip tom="ink">Total {brl(total)}</Chip>
              {etapasNovas > 0 && <Chip>{etapasNovas} {etapasNovas === 1 ? "etapa" : "etapas"}</Chip>}
              {semValor > 0 && <Chip tom="aviso">{semValor} sem valor</Chip>}
              {comAviso > 0 && <Chip tom="aviso">{comAviso} {comAviso === 1 ? "com aviso" : "com avisos"}</Chip>}
              {duplicados > 0 && <Chip tom="info">{duplicados} já {duplicados === 1 ? "está" : "estão"} no orçamento</Chip>}
              {leitura.ignoradas > 0 && <Chip>{leitura.ignoradas} {leitura.ignoradas === 1 ? "linha ignorada" : "linhas ignoradas"}</Chip>}
              {leitura.comTitulos && <Chip>títulos reconhecidos</Chip>}
            </div>
            {leitura.etapasEncontradas.length > 0 && (
              <p className="mb-2 text-xs text-ink/60">Etapas lidas das linhas de título: {leitura.etapasEncontradas.join(", ")}.</p>
            )}
            {duplicados > 0 && (
              <label className="mb-2 flex items-start gap-2 text-sm text-ink/80">
                <input type="checkbox" className="mt-0.5 h-4 w-4 accent-pitanga" checked={pularExistentes} onChange={(e) => setPularExistentes(e.target.checked)} />
                Pular os itens que já estão no orçamento (mesma descrição e etapa)
              </label>
            )}
            <div className="max-h-72 overflow-auto rounded-2xl border border-linha bg-white">
              <table className="w-full min-w-[620px] text-left text-[13px]">
                <thead className="sticky top-0 bg-ink/[0.04] font-mono text-[10px] uppercase tracking-[0.12em] text-ink/55">
                  <tr>
                    <th className="w-8 px-3 py-2"><span className="sr-only">Importar</span></th>
                    <th className="px-3 py-2">Etapa</th>
                    <th className="px-3 py-2">Descrição</th>
                    <th className="px-3 py-2 text-right">Qtd</th>
                    <th className="px-3 py-2">Unid</th>
                    <th className="px-3 py-2 text-right">Valor unit.</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-linha">
                  {mostradas.map((l) => {
                    const dup = jaExiste(l);
                    const desligada = fora.has(l.origem) || (pularExistentes && dup);
                    return (
                      <tr key={l.origem} className={`align-top ${desligada ? "opacity-45" : ""}`}>
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-pitanga"
                            aria-label={`Importar ${l.descricao}`}
                            checked={!desligada}
                            disabled={pularExistentes && dup}
                            onChange={(e) =>
                              setFora((s) => {
                                const n = new Set(s);
                                if (e.target.checked) n.delete(l.origem);
                                else n.add(l.origem);
                                return n;
                              })
                            }
                          />
                        </td>
                        <td className="px-3 py-2 text-ink/70">{l.etapa}</td>
                        <td className="px-3 py-2 text-ink">
                          {l.descricao}
                          {dup && <span className="block text-[11px] font-medium text-sky-800">já está no orçamento</span>}
                          {l.aviso && <span className="block text-[11px] font-medium text-amber-800">{l.aviso}</span>}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{l.quantidade}</td>
                        <td className="px-3 py-2 text-ink/70">{l.unidade || "—"}</td>
                        <td className="px-3 py-2 text-right font-mono">{brl(l.valorUnitario)}</td>
                        <td className="px-3 py-2 text-right font-mono font-semibold">{brl(l.valorOrcado)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {leitura.linhas.length > LIMITE_TABELA && (
              <p className="mt-1.5 text-xs text-ink/55">Mostrando as primeiras {LIMITE_TABELA} linhas. Todas as {leitura.linhas.length} entram na importação (as desmarcadas, não).</p>
            )}
          </section>
        )}

        {erroGravacao && <AvisoErro erro={erroGravacao} />}

        <div className="flex gap-2">
          <Botao className="flex-1" onClick={onFechar}>
            Cancelar
          </Botao>
          <Botao variante="primario" className="flex-1" disabled={aImportar.length === 0 || importando} onClick={importar}>
            {importando ? "Importando…" : aImportar.length > 0 ? `Importar ${aImportar.length} ${aImportar.length === 1 ? "item" : "itens"}` : "Importar"}
          </Botao>
        </div>
      </div>
    </Modal>
  );
}

/** Mapa das colunas lendo os títulos de uma linha escolhida à mão. */
function detectarNaLinha(grade: Grade, linha: number): CampoImp[] {
  const so = detectar([grade[linha] ?? [], ...grade.slice(linha + 1)]);
  const largura = larguraDa(grade);
  return so.linhaTitulo === 0 ? Array.from({ length: largura }, (_, i) => so.mapa[i] ?? "ignorar") : mapaPorPosicao(largura);
}
