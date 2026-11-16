/**
 * Leitura de itens colados de uma planilha (Excel, Google Sheets) ou de texto separado por ; ou |.
 * Funciona com ou sem linha de títulos. Sem títulos, o que vale é a quantidade de colunas da linha:
 *   5: etapa · descrição · qtd · unid · valor unit.
 *   4: descrição · qtd · unid · valor unit.
 *   3: descrição · qtd · valor unit.
 *   2: descrição · valor unit.
 *   1: descrição
 */

export interface LinhaImportada {
  etapa: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorOrcado: number;
  /** Aviso sobre a linha (ela ainda entra): ex. "sem valor". */
  aviso?: string;
}

export interface ResultadoImportacao {
  linhas: LinhaImportada[];
  /** Linhas ignoradas por não terem descrição. */
  ignoradas: number;
  /** Se a primeira linha foi lida como títulos de colunas. */
  comTitulos: boolean;
}

type Campo = "etapa" | "descricao" | "quantidade" | "unidade" | "valorUnitario";

const POR_QUANTIDADE: Record<number, Campo[]> = {
  1: ["descricao"],
  2: ["descricao", "valorUnitario"],
  3: ["descricao", "quantidade", "valorUnitario"],
  4: ["descricao", "quantidade", "unidade", "valorUnitario"],
  5: ["etapa", "descricao", "quantidade", "unidade", "valorUnitario"],
};

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** "R$ 1.234,56" → 1234.56. Aceita vírgula ou ponto como decimal. Texto vazio vale 0; texto inválido, NaN. */
export function lerNumero(texto: string): number {
  let t = texto.replace(/R\$/gi, "").replace(/\s/g, "");
  if (!t) return 0;
  if (t.includes(",") && t.includes(".")) t = t.replace(/\./g, "").replace(",", ".");
  else if (t.includes(",")) t = t.replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, ""); // 1.234 = mil duzentos e trinta e quatro
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

function dividir(linha: string): string[] {
  const sep = linha.includes("\t") ? "\t" : linha.includes(";") ? ";" : linha.includes("|") ? "|" : null;
  return (sep ? linha.split(sep) : [linha]).map((c) => c.trim());
}

function campoDoTitulo(titulo: string): Campo | null {
  const t = semAcento(titulo);
  if (/^etapa|^fase/.test(t)) return "etapa";
  if (/^descri|^servi|^item|^material|^nome/.test(t)) return "descricao";
  if (/^qt|^quant/.test(t)) return "quantidade";
  if (/^un/.test(t)) return "unidade";
  if (/^(valor|preco|custo|vlr|unit)/.test(t)) return "valorUnitario";
  return null;
}

export function lerItensColados(texto: string, etapaPadrao = "Sem etapa"): ResultadoImportacao {
  const brutas = texto.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (brutas.length === 0) return { linhas: [], ignoradas: 0, comTitulos: false };

  // Títulos: a primeira linha só vale se reconhecermos pelo menos 2 colunas e a descrição entre elas.
  const primeira = dividir(brutas[0]);
  const mapaTitulos = primeira.map(campoDoTitulo);
  const comTitulos = mapaTitulos.filter(Boolean).length >= 2 && mapaTitulos.includes("descricao");
  const dados = comTitulos ? brutas.slice(1) : brutas;

  const linhas: LinhaImportada[] = [];
  let ignoradas = 0;
  for (const bruta of dados) {
    const colunas = dividir(bruta);
    const campos = comTitulos ? mapaTitulos : POR_QUANTIDADE[Math.min(colunas.length, 5)];
    const v: Partial<Record<Campo, string>> = {};
    campos.forEach((c, i) => {
      if (c && colunas[i] !== undefined && v[c] === undefined) v[c] = colunas[i];
    });

    const descricao = (v.descricao ?? "").trim();
    if (!descricao) {
      ignoradas += 1;
      continue;
    }
    const qtdLida = v.quantidade === undefined ? 1 : lerNumero(v.quantidade);
    const unitLido = v.valorUnitario === undefined ? 0 : lerNumero(v.valorUnitario);
    const quantidade = Number.isNaN(qtdLida) || qtdLida <= 0 ? 1 : qtdLida;
    const valorUnitario = Number.isNaN(unitLido) || unitLido < 0 ? 0 : unitLido;
    const avisos: string[] = [];
    if (Number.isNaN(qtdLida)) avisos.push("quantidade ilegível, usei 1");
    if (Number.isNaN(unitLido)) avisos.push("valor ilegível");
    else if (valorUnitario === 0) avisos.push("sem valor");

    linhas.push({
      etapa: (v.etapa ?? "").trim() || etapaPadrao.trim() || "Sem etapa",
      descricao,
      quantidade,
      unidade: (v.unidade ?? "").trim(),
      valorUnitario,
      valorOrcado: Math.round(quantidade * valorUnitario * 100) / 100,
      aviso: avisos.length ? avisos.join("; ") : undefined,
    });
  }
  return { linhas, ignoradas, comTitulos };
}
