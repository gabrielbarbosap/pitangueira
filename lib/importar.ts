/**
 * Importação de itens a partir de planilha: texto colado (Excel, Google Planilhas) ou arquivo .xlsx/.csv/.txt.
 * A leitura em si está em `planilha.ts`; aqui ficam a entrada por arquivo e as mensagens de erro para a pessoa.
 */
import {
  ErroPlanilha,
  ITENS_MAXIMO,
  TAMANHO_MAXIMO,
  decodificar,
  detectar,
  gradeDeTexto,
  lerXlsx,
  montarLinhas,
  type Deteccao,
  type Grade,
  type Planilha,
  type ResultadoImportacao,
} from "./planilha";

export { lerNumero, type CampoImp, type LinhaImportada, type ResultadoImportacao } from "./planilha";

/** Texto colado → linhas do orçamento, com a detecção automática de colunas. */
export function lerItensColados(texto: string, etapaPadrao = "Sem etapa"): ResultadoImportacao {
  const grade = gradeDeTexto(texto);
  const det = detectar(grade);
  return montarLinhas(grade, { ...det, etapaPadrao });
}

const PEDIR_OUTRO_FORMATO = "Abra a planilha no Excel ou no Google Planilhas e use Salvar como › .xlsx (ou CSV). Depois escolha o arquivo novo.";

/** Lê um arquivo escolhido ou arrastado. Todo problema vira um `ErroPlanilha` com explicação e o que fazer. */
export async function lerArquivo(arquivo: File): Promise<Planilha[]> {
  const nome = arquivo.name.toLowerCase();
  const ext = nome.includes(".") ? nome.slice(nome.lastIndexOf(".") + 1) : "";
  if (arquivo.size === 0) {
    throw new ErroPlanilha("O arquivo está vazio", "Não há nada dentro de “" + arquivo.name + "”.", "Confira se escolheu o arquivo certo. Se ele abre com dados no Excel, salve de novo e tente outra vez.");
  }
  if (arquivo.size > TAMANHO_MAXIMO) {
    throw new ErroPlanilha(
      "O arquivo é grande demais",
      `“${arquivo.name}” tem ${(arquivo.size / 1048576).toFixed(1).replace(".", ",")} MB e o limite é ${TAMANHO_MAXIMO / 1048576} MB.`,
      "Apague as abas, colunas e imagens que não precisa e salve de novo, ou envie a planilha em partes.",
    );
  }
  let planilhas: Planilha[];
  try {
    if (ext === "xlsx" || ext === "xlsm") planilhas = await lerXlsx(await arquivo.arrayBuffer());
    else if (ext === "csv" || ext === "tsv" || ext === "txt") {
      const grade = gradeDeTexto(decodificar(new Uint8Array(await arquivo.arrayBuffer())), { csv: ext !== "txt" });
      planilhas = [{ nome: arquivo.name, grade }];
    } else if (ext === "xls") {
      throw new ErroPlanilha("Formato antigo do Excel (.xls)", "Esse formato antigo não pode ser lido pelo app.", PEDIR_OUTRO_FORMATO);
    } else if (ext === "ods" || ext === "numbers") {
      throw new ErroPlanilha(`Arquivo ${ext === "ods" ? "do LibreOffice" : "do Numbers"} não é aceito`, "O app lê arquivos .xlsx, .csv e .txt.", PEDIR_OUTRO_FORMATO);
    } else {
      throw new ErroPlanilha(
        "Esse tipo de arquivo não funciona aqui",
        ext ? `Arquivos .${ext} não são planilhas que o app consiga ler.` : "O arquivo não tem uma extensão conhecida.",
        "Use um arquivo .xlsx, .csv ou .txt. Se o orçamento está num PDF ou foto, copie os dados para uma planilha e cole na caixa de texto.",
      );
    }
  } catch (e) {
    throw explicarErro(e);
  }
  const comDados = planilhas.filter((p) => p.grade.length > 0);
  if (comDados.length === 0) {
    throw new ErroPlanilha("A planilha está vazia", "Não encontrei nenhuma célula preenchida no arquivo.", "Confira se os dados estão na primeira aba e se o arquivo salvo é o certo. Também dá para copiar as células e colar na caixa de texto.");
  }
  return comDados;
}

/** Qualquer erro vira uma mensagem que a pessoa entende, com o próximo passo. */
export function explicarErro(e: unknown): ErroPlanilha {
  if (e instanceof ErroPlanilha) return e;
  return new ErroPlanilha(
    "Não consegui ler este arquivo",
    "Algo inesperado aconteceu ao abrir a planilha.",
    "Salve o arquivo de novo como .xlsx ou CSV e tente outra vez. Se continuar, copie as células e cole na caixa de texto: funciona do mesmo jeito.",
  );
}

/**
 * Problemas que impedem de importar o que foi lido. Devolve nulo quando está tudo certo.
 * (Avisos de linhas individuais, como "sem valor", não impedem e aparecem na própria tabela.)
 */
export function diagnosticar(grade: Grade, det: Deteccao, r: ResultadoImportacao): ErroPlanilha | null {
  if (grade.length === 0) return null;
  if (!det.mapa.includes("descricao")) {
    return new ErroPlanilha(
      "Não sei qual coluna é a descrição do item",
      "Nenhuma coluna está marcada como Descrição, e é ela que dá nome a cada item.",
      "Em “Colunas”, escolha Descrição na coluna que traz o nome do serviço ou material.",
    );
  }
  if (r.linhas.length === 0) {
    return new ErroPlanilha(
      "Não encontrei nenhum item",
      det.linhaTitulo >= 0 && grade.length <= det.linhaTitulo + 1 ? "A planilha só tem a linha de títulos, sem itens abaixo dela." : "Nenhuma linha tem texto na coluna de Descrição (ou todas parecem totais).",
      "Confira se a coluna marcada como Descrição é a certa (em “Colunas”) e se a linha de títulos está certa. Linhas de total e subtotal são ignoradas de propósito.",
    );
  }
  if (r.linhas.length > ITENS_MAXIMO) {
    return new ErroPlanilha(
      "Itens demais de uma vez",
      `A planilha tem ${r.linhas.length} itens e o limite por importação é ${ITENS_MAXIMO}.`,
      "Divida a planilha em partes (por etapa, por exemplo) e importe uma de cada vez.",
    );
  }
  return null;
}

/** A gravação no banco falhou: explica e diz como proceder sem duplicar itens. */
export function erroDeGravacao(): ErroPlanilha {
  return new ErroPlanilha(
    "Não consegui salvar os itens",
    "A leitura da planilha deu certo, mas a gravação falhou, quase sempre por conexão instável.",
    "Confira a internet e olhe a lista de itens do projeto: se alguns já entraram, tire-os da planilha (ou marque “Pular os itens que já estão no orçamento”) antes de importar de novo, para não duplicar.",
  );
}
