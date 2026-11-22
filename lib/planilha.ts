/**
 * Leitura de planilhas para importar itens do orçamento: texto colado (Excel, Google Planilhas), arquivos .csv/.txt e
 * .xlsx (lido aqui mesmo, sem biblioteca). Tudo vira uma "grade" de texto; depois o app descobre quais colunas são
 * quais (pelos títulos, ou pela posição) e monta as linhas do orçamento. Sem dependências, para rodar no navegador.
 */

export type Grade = string[][];

/**
 * Erro da importação já escrito para a pessoa: o que aconteceu (`titulo`), por quê em palavras simples (`mensagem`)
 * e o que fazer para resolver (`solucao`). A janela mostra os três.
 */
export class ErroPlanilha extends Error {
  constructor(
    public titulo: string,
    mensagem: string,
    public solucao: string,
  ) {
    super(mensagem);
    this.name = "ErroPlanilha";
  }
}

/** Tamanho máximo de arquivo aceito (o navegador lê tudo na memória). */
export const TAMANHO_MAXIMO = 5 * 1024 * 1024;
/** Itens por importação: acima disso o app trava ou a gravação falha. */
export const ITENS_MAXIMO = 2000;

// ───────────────────────── texto → grade ─────────────────────────

/** Lê os bytes de um arquivo de texto: UTF-8, ou Windows-1252 (o CSV do Excel brasileiro). Tira o BOM. */
export function decodificar(bytes: Uint8Array): string {
  const b = bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf ? bytes.subarray(3) : bytes;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(b);
  } catch {
    return new TextDecoder("windows-1252").decode(b);
  }
}

/** Escolhe o separador: tabulação (colado do Excel), ; ou |. A vírgula só vale em arquivo .csv (nos números ela é decimal). */
function separador(texto: string, csv: boolean): string | null {
  const amostra = texto.slice(0, 6000);
  if (amostra.includes("\t")) return "\t";
  if (amostra.includes(";")) return ";";
  if (amostra.includes("|")) return "|";
  if (csv && amostra.includes(",")) return ",";
  return null;
}

/**
 * Divide o texto em linhas e colunas. Entende aspas (campo com separador ou quebra de linha dentro) e descarta linhas vazias.
 * Sem nenhum separador, cada linha é uma coluna só (lista de descrições).
 */
export function gradeDeTexto(texto: string, opcoes: { csv?: boolean } = {}): Grade {
  const sep = separador(texto, !!opcoes.csv);
  const linhas: Grade = [];
  if (sep === null) {
    for (const l of texto.split(/\r?\n/)) if (l.trim()) linhas.push([l.trim()]);
    return linhas;
  }
  let campo = "";
  let linha: string[] = [];
  let aspas = false;
  const fechaCampo = () => {
    linha.push(campo.trim());
    campo = "";
  };
  const fechaLinha = () => {
    fechaCampo();
    if (linha.some((c) => c !== "")) linhas.push(linha);
    linha = [];
  };
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (aspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else aspas = false;
      } else campo += c;
    } else if (c === '"' && campo === "") aspas = true; // aspas só abrem no começo do campo (5" no meio do texto é polegada)
    else if (c === sep) fechaCampo();
    else if (c === "\n") fechaLinha();
    else if (c !== "\r") campo += c;
  }
  if (campo !== "" || linha.length > 0) fechaLinha();
  return linhas;
}

export const larguraDa = (grade: Grade) => grade.reduce((m, l) => Math.max(m, l.length), 0);

// ───────────────────────── .xlsx (zip + xml, sem biblioteca) ─────────────────────────

const u16 = (d: DataView, o: number) => d.getUint16(o, true);
const u32 = (d: DataView, o: number) => d.getUint32(o, true);

async function inflar(dados: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new ErroPlanilha("Seu navegador não consegue abrir .xlsx", "Este navegador é antigo e não sabe descompactar o arquivo.", "Atualize o navegador, ou salve a planilha como CSV (no Excel: Arquivo › Salvar como › CSV) e escolha o arquivo de novo. Também dá para copiar as células e colar na caixa de texto.");
  }
  const fluxo = new Blob([dados as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(fluxo).arrayBuffer());
}

/** Lê os arquivos de dentro de um .xlsx (que é um zip). Só entende zip comum (stored e deflate). */
async function lerZip(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const bytes = new Uint8Array(buffer);
  if (bytes.length >= 4 && bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) {
    throw new ErroPlanilha(
      "Não consegui abrir este arquivo",
      "Ele está no formato antigo do Excel (.xls) ou protegido por senha.",
      "Abra o arquivo no Excel (ou Google Planilhas), tire a senha se houver e use Salvar como › .xlsx (ou CSV). Depois escolha o arquivo novo.",
    );
  }
  const d = new DataView(buffer);
  let fim = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 22 - 65535); i--) {
    if (u32(d, i) === 0x06054b50) {
      fim = i;
      break;
    }
  }
  if (fim < 0) {
    throw new ErroPlanilha("Este arquivo não parece uma planilha .xlsx", "O arquivo está corrompido, incompleto ou não é uma planilha do Excel.", "Abra-o no Excel ou no Google Planilhas e salve de novo como .xlsx (ou CSV). Se não abrir nem lá, peça o arquivo outra vez a quem enviou.");
  }
  const total = u16(d, fim + 10);
  let p = u32(d, fim + 16);
  const arquivos = new Map<string, Uint8Array>();
  for (let n = 0; n < total; n++) {
    if (u32(d, p) !== 0x02014b50) break;
    const metodo = u16(d, p + 10);
    const tamComp = u32(d, p + 20);
    const nomeLen = u16(d, p + 28);
    const extraLen = u16(d, p + 30);
    const comentLen = u16(d, p + 32);
    const local = u32(d, p + 42);
    const nome = new TextDecoder().decode(bytes.subarray(p + 46, p + 46 + nomeLen));
    p += 46 + nomeLen + extraLen + comentLen;
    if (!/^xl\/(workbook\.xml|_rels\/workbook\.xml\.rels|sharedStrings\.xml|worksheets\/[^/]+\.xml)$/.test(nome)) continue;
    const ini = local + 30 + u16(d, local + 26) + u16(d, local + 28);
    const comprimido = bytes.subarray(ini, ini + tamComp);
    arquivos.set(nome, metodo === 0 ? comprimido : metodo === 8 ? await inflar(comprimido) : new Uint8Array());
  }
  return arquivos;
}

const entidades = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

const textoDe = (xml: string) => entidades([...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join(""));
const colunaDe = (ref: string) => {
  let n = 0;
  for (const ch of ref.replace(/[^A-Za-z]/g, "").toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};
const dec = (b: Uint8Array | undefined) => (b ? new TextDecoder().decode(b) : "");

export interface Planilha {
  nome: string;
  grade: Grade;
}

/** Lê as abas de um arquivo .xlsx. Números viram texto com vírgula decimal; fórmulas valem pelo resultado guardado. */
export async function lerXlsx(buffer: ArrayBuffer): Promise<Planilha[]> {
  const arq = await lerZip(buffer);
  const compartilhadas = [...dec(arq.get("xl/sharedStrings.xml")).matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map((m) => textoDe(m[1]));
  const rels = new Map([...dec(arq.get("xl/_rels/workbook.xml.rels")).matchAll(/<Relationship\b[^>]*>/g)].map((m) => [/\bId="([^"]*)"/.exec(m[0])?.[1] ?? "", /\bTarget="([^"]*)"/.exec(m[0])?.[1] ?? ""]));
  const abas = [...dec(arq.get("xl/workbook.xml")).matchAll(/<sheet\b[^>]*>/g)].map((m) => ({
    nome: entidades(/\bname="([^"]*)"/.exec(m[0])?.[1] ?? "Planilha"),
    alvo: rels.get(/\br:id="([^"]*)"/.exec(m[0])?.[1] ?? "") ?? "",
  }));
  const saida: Planilha[] = [];
  if (abas.length === 0) {
    throw new ErroPlanilha("Não encontrei nenhuma aba nesta planilha", "O arquivo é um .xlsx, mas não tem planilhas dentro.", "Abra no Excel, confira se há dados e salve de novo. Ou copie as células e cole na caixa de texto.");
  }
  for (const aba of abas) {
    const caminho = aba.alvo.startsWith("/") ? aba.alvo.slice(1) : `xl/${aba.alvo}`;
    const xml = dec(arq.get(caminho));
    if (!xml) continue;
    const grade: Grade = [];
    for (const lin of xml.matchAll(/<row\b[^>]*?(?:\/>|>([\s\S]*?)<\/row>)/g)) {
      const celulas: string[] = [];
      for (const c of (lin[1] ?? "").matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const col = colunaDe(/\br="([^"]*)"/.exec(c[1])?.[1] ?? "A");
        const tipo = /\bt="([^"]*)"/.exec(c[1])?.[1];
        const corpo = c[2] ?? "";
        const v = /<v>([\s\S]*?)<\/v>/.exec(corpo)?.[1] ?? "";
        let valor = "";
        if (tipo === "s") valor = compartilhadas[Number(v)] ?? "";
        else if (tipo === "inlineStr") valor = textoDe(corpo);
        else if (tipo === "str" || tipo === "e") valor = entidades(v);
        else if (tipo === "b") valor = v === "1" ? "sim" : "não";
        else valor = v.replace(".", ","); // número: vírgula decimal, que é o que lerNumero espera
        while (celulas.length < col) celulas.push("");
        celulas[col] = valor.trim();
      }
      if (celulas.some((c) => c !== "")) grade.push(celulas);
    }
    saida.push({ nome: aba.nome, grade });
  }
  return saida;
}

// ───────────────────────── colunas ─────────────────────────

export type CampoImp = "etapa" | "ambiente" | "descricao" | "quantidade" | "unidade" | "valorUnitario" | "valorTotal" | "fornecedor" | "observacao" | "ignorar";

export const ROTULO_CAMPO: Record<CampoImp, string> = {
  etapa: "Etapa",
  ambiente: "Ambiente",
  descricao: "Descrição",
  quantidade: "Quantidade",
  unidade: "Unidade",
  valorUnitario: "Valor unitário",
  valorTotal: "Valor total",
  fornecedor: "Fornecedor",
  observacao: "Observação",
  ignorar: "Ignorar esta coluna",
};

export const CAMPOS: CampoImp[] = ["descricao", "etapa", "quantidade", "unidade", "valorUnitario", "valorTotal", "ambiente", "fornecedor", "observacao", "ignorar"];

const semAcento = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** O que o título de uma coluna indica. "codigo" é a numeração do item (1.1, 2.3…), que não entra. */
export function campoDoTitulo(titulo: string): CampoImp | "codigo" | null {
  const t = semAcento(titulo).replace(/[.:]+$/, "");
  if (!t || t.length > 30 || /[0-9]/.test(t)) return null; // título é curto e sem número: "Etapa 1" é dado, não título
  if (/total/.test(t)) return "valorTotal";
  if (/^(valor|vlr|preco|custo|unit|p\.? ?unit|r\$)|unit/.test(t)) return "valorUnitario";
  if (/^(etapa|fase|grupo|categoria|capitulo)/.test(t)) return "etapa";
  if (/^(ambiente|local|comodo|setor)/.test(t)) return "ambiente";
  if (/^(descri|servi|material|nome|especifica|atividade|produto)/.test(t)) return "descricao";
  if (/^(qt|quant)/.test(t)) return "quantidade";
  if (/^(un|und|unid|medida)/.test(t)) return "unidade";
  if (/^(fornec|empreit|prestador|marca|loja)/.test(t)) return "fornecedor";
  if (/^(obs|nota|coment|detalhe)/.test(t)) return "observacao";
  if (/^(item|cod|n[ºo°]?$|num|ref|#)/.test(t)) return "codigo";
  return null;
}

const POR_QUANTIDADE: Record<number, CampoImp[]> = {
  1: ["descricao"],
  2: ["descricao", "valorUnitario"],
  3: ["descricao", "quantidade", "valorUnitario"],
  4: ["descricao", "quantidade", "unidade", "valorUnitario"],
  5: ["etapa", "descricao", "quantidade", "unidade", "valorUnitario"],
};

export interface Deteccao {
  /** Linha (na grade) dos títulos das colunas; -1 = a planilha não tem títulos. */
  linhaTitulo: number;
  /** O campo de cada coluna, na ordem das colunas. */
  mapa: CampoImp[];
}

/** O mapa por posição, quando não há títulos: 5 colunas = etapa · descrição · qtd · unid · valor; 4 = sem etapa; e assim por diante. */
export function mapaPorPosicao(largura: number): CampoImp[] {
  const base = POR_QUANTIDADE[Math.min(Math.max(largura, 1), 5)];
  return Array.from({ length: Math.max(largura, 1) }, (_, i) => base[i] ?? "ignorar");
}

/** Procura a linha de títulos nas primeiras linhas (pode haver o nome da obra antes). Sem títulos, mapeia pela posição. */
export function detectar(grade: Grade): Deteccao {
  const largura = larguraDa(grade);
  for (let r = 0; r < Math.min(12, grade.length); r++) {
    const campos = grade[r].map(campoDoTitulo);
    const reconhecidos = campos.filter(Boolean).length;
    const temDescricao = campos.includes("descricao");
    // "Item" sozinho como única coluna de texto vale como descrição (planilhas que chamam o serviço de "item").
    const itemComoDescricao = !temDescricao && grade[r].some((c) => semAcento(c).replace(/[.:]+$/, "") === "item") && campos.filter((c) => c && c !== "codigo").length >= 1;
    // Linha em que TODAS as células são títulos conhecidos também vale (mesmo sem Descrição): o app avisa que falta a coluna.
    const soTitulos = grade[r].filter((c) => c.trim() !== "").every((c) => campoDoTitulo(c));
    if (reconhecidos >= 2 && (temDescricao || itemComoDescricao || soTitulos)) {
      const usados = new Set<CampoImp>();
      const mapa: CampoImp[] = Array.from({ length: Math.max(largura, grade[r].length) }, (_, i) => {
        let c: CampoImp | "codigo" | null = campos[i] ?? null;
        if (c === "codigo" && itemComoDescricao && semAcento(grade[r][i]).replace(/[.:]+$/, "") === "item" && !usados.has("descricao")) c = "descricao";
        if (!c || c === "codigo" || usados.has(c)) return "ignorar";
        usados.add(c);
        return c;
      });
      return { linhaTitulo: r, mapa };
    }
  }
  return { linhaTitulo: -1, mapa: mapaPorPosicao(largura) };
}

// ───────────────────────── números e unidades ─────────────────────────

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

const UNIDADES: Record<string, string> = {
  m2: "m²", "m^2": "m²", "m²": "m²", metro2: "m²", m3: "m³", "m^3": "m³", "m³": "m³",
  un: "un", "un.": "un", und: "un", "und.": "un", unid: "un", "unid.": "un", unidade: "un", unidades: "un",
  ml: "m", "m.l.": "m", metro: "m", metros: "m", mt: "m",
  vb: "vb", verba: "vb", pc: "pç", "pç": "pç", peca: "pç", pecas: "pç", "peça": "pç",
  h: "h", hr: "h", hora: "h", horas: "h", kg: "kg", kilo: "kg", dia: "dia", dias: "dia", diaria: "dia", "diária": "dia",
  mes: "mês", "mês": "mês", cj: "cj", conjunto: "cj", gl: "gl", global: "gl", sc: "sc", saco: "sc", lt: "l", litro: "l", l: "l",
};

/** Padroniza a unidade: m2 → m², und → un, ml → m… O que não for conhecido fica como veio. */
export function normalizarUnidade(u: string): string {
  const t = u.trim();
  return UNIDADES[t.toLowerCase()] ?? UNIDADES[semAcento(t)] ?? t;
}

// ───────────────────────── grade → linhas do orçamento ─────────────────────────

export interface LinhaImportada {
  /** Posição na grade (para o aviso "linha 12"). */
  origem: number;
  etapa: string;
  ambiente: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorOrcado: number;
  fornecedor: string;
  observacao: string;
  /** Aviso sobre a linha (ela ainda entra): ex. "sem valor". */
  aviso?: string;
}

export interface ResultadoImportacao {
  linhas: LinhaImportada[];
  /** Linhas ignoradas: sem descrição, ou de total e subtotal. */
  ignoradas: number;
  /** Etapas que vieram como linhas de título no meio da planilha ("1. DEMOLIÇÃO"). */
  etapasEncontradas: string[];
  /** Se a planilha tem uma linha de títulos de colunas. */
  comTitulos: boolean;
}

export interface OpcoesMontagem {
  linhaTitulo: number;
  mapa: CampoImp[];
  etapaPadrao?: string;
}

const EH_TOTAL = /^(sub\s*-?\s*)?total\b|^soma\b|^valor total\b/i;
const CAIXA_ALTA = (s: string) => s === s.toUpperCase() && /[A-ZÀ-Ú]{3}/.test(s);

/** Uma linha só com texto vale como título de etapa se parecer um: "ETAPA 2", "1 - Demolição", "FUNDAÇÃO" (tudo em maiúsculas). */
function pareceTituloDeEtapa(t: string): boolean {
  return /^(etapa|fase|grupo|capitulo|capítulo)\b/i.test(t) || /^\d{1,2}[\s.)\-–:]+[^\d\s]/.test(t) || CAIXA_ALTA(t);
}

function limparTitulo(t: string): string {
  let s = t.replace(/^\d+([.,]\d+)*[\s.)\-–:]+/, "").replace(/^(etapa|fase|grupo)\s*\d*\s*[-–:.]?\s*/i, "").replace(/[:\s]+$/, "").trim();
  if (!s) s = t.trim();
  if (CAIXA_ALTA(s) && s.length > 3) s = s.charAt(0) + s.slice(1).toLowerCase();
  return s;
}

const arredondar = (n: number) => Math.round(n * 100) / 100;
const reais = (n: number) => `R$ ${n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** Monta as linhas do orçamento a partir da grade e do mapa de colunas. */
export function montarLinhas(grade: Grade, { linhaTitulo, mapa, etapaPadrao = "" }: OpcoesMontagem): ResultadoImportacao {
  const col = (campo: CampoImp) => mapa.indexOf(campo);
  const iDesc = col("descricao");
  const iEtapa = col("etapa");
  const iQtd = col("quantidade");
  const iUn = col("unidade");
  const iUnit = col("valorUnitario");
  const iTotal = col("valorTotal");
  const iAmb = col("ambiente");
  const iForn = col("fornecedor");
  const iObs = col("observacao");
  const temNumeros = iQtd >= 0 || iUnit >= 0 || iTotal >= 0;
  const get = (cels: string[], i: number) => (i >= 0 ? (cels[i] ?? "").trim() : "");

  const linhas: LinhaImportada[] = [];
  const etapasEncontradas: string[] = [];
  let ignoradas = 0;
  let etapaAtual = "";

  for (let r = linhaTitulo + 1; r < grade.length; r++) {
    const cels = grade[r];
    if (!cels.some((c) => c.trim() !== "")) continue;
    const primeira = cels.find((c) => c.trim() !== "") ?? "";
    const descricao = get(cels, iDesc);
    if (EH_TOTAL.test(descricao) || EH_TOTAL.test(primeira.trim())) {
      ignoradas += 1;
      continue;
    }
    // Linha de título de etapa no meio da planilha: só o texto, sem quantidade nem valor, e com cara de título.
    // O texto pode estar na coluna da descrição ou, se for a única célula preenchida, em qualquer outra (a da numeração, por exemplo).
    const preenchidas = cels.filter((c) => c.trim() !== "");
    const textoTitulo = descricao || (preenchidas.length === 1 ? preenchidas[0].trim() : "");
    const outros = [iEtapa, iQtd, iUn, iUnit, iTotal, iAmb, iForn, iObs].some((i) => get(cels, i) !== "");
    if (textoTitulo && temNumeros && !outros && pareceTituloDeEtapa(textoTitulo)) {
      etapaAtual = limparTitulo(textoTitulo);
      if (!etapasEncontradas.includes(etapaAtual)) etapasEncontradas.push(etapaAtual);
      continue;
    }
    if (!descricao) {
      ignoradas += 1;
      continue;
    }

    const textoQtd = get(cels, iQtd);
    const qtdLida = textoQtd === "" ? 1 : lerNumero(textoQtd);
    const quantidade = Number.isNaN(qtdLida) || qtdLida <= 0 ? 1 : qtdLida;
    const textoUnit = get(cels, iUnit);
    const textoTotal = get(cels, iTotal);
    const unitLido = textoUnit === "" ? NaN : lerNumero(textoUnit);
    const totalLido = textoTotal === "" ? NaN : lerNumero(textoTotal);
    const avisos: string[] = [];
    if (Number.isNaN(qtdLida)) avisos.push("quantidade ilegível, usei 1");

    let valorUnitario = 0;
    if (textoUnit !== "") {
      if (Number.isNaN(unitLido) || unitLido < 0) avisos.push("valor ilegível");
      else valorUnitario = unitLido;
    } else if (textoTotal !== "") {
      if (Number.isNaN(totalLido) || totalLido < 0) avisos.push("valor ilegível");
      else valorUnitario = arredondar(totalLido / quantidade); // só o total: o unitário sai da divisão
    }
    const valorOrcado = arredondar(quantidade * valorUnitario);
    if (textoUnit !== "" && textoTotal !== "" && !Number.isNaN(totalLido) && Math.abs(valorOrcado - totalLido) > Math.max(0.05, totalLido * 0.001)) {
      avisos.push(`o total da planilha (${reais(totalLido)}) não bate com qtd × valor`);
    }
    if (avisos.every((a) => !a.startsWith("valor ilegível")) && valorUnitario === 0) avisos.push("sem valor");

    linhas.push({
      origem: r,
      etapa: get(cels, iEtapa) || etapaAtual || etapaPadrao.trim() || "Sem etapa",
      ambiente: get(cels, iAmb) || "Geral",
      descricao,
      quantidade,
      unidade: normalizarUnidade(get(cels, iUn)),
      valorUnitario,
      valorOrcado,
      fornecedor: get(cels, iForn),
      observacao: get(cels, iObs),
      aviso: avisos.length ? avisos.join("; ") : undefined,
    });
  }
  return { linhas, ignoradas, etapasEncontradas, comTitulos: linhaTitulo >= 0 };
}
