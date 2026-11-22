import { expect, test } from "@playwright/test";
import { criarProjeto, entrarComoArquiteto, semTutorial } from "./ajudas";
import { decodificar, detectar, gradeDeTexto, lerXlsx, montarLinhas, normalizarUnidade } from "../lib/planilha";
import { criarXlsx } from "./xlsx";

const ler = (texto: string, etapaPadrao = "") => {
  const grade = gradeDeTexto(texto);
  return montarLinhas(grade, { ...detectar(grade), etapaPadrao });
};

test.describe("leitura de planilhas (sem navegador)", () => {
  test("acha a linha de títulos depois do nome da obra e ignora a numeração do item", () => {
    const r = ler("ORÇAMENTO RESIDÊNCIA ALVES;;;;\n;;;;\nItem;Descrição;Un;Qtd;Preço unitário\n1.1;Ponto de tomada;un;10;120,00\n1.2;Quadro;un;1;1.500,50");
    expect(r.comTitulos).toBe(true);
    expect(r.linhas.map((l) => [l.descricao, l.quantidade, l.valorUnitario])).toEqual([
      ["Ponto de tomada", 10, 120],
      ["Quadro", 1, 1500.5],
    ]);
  });

  test("linhas de título de etapa, totais e subtotais", () => {
    const r = ler("Descrição;Qtd;Unid;Valor unit.\n1 - DEMOLIÇÃO;;;\nDemolição de piso;45;m2;38\nSubtotal;;;1710\nFUNDAÇÃO;;;\nSapata;3;und;900\nTOTAL GERAL;;;4410");
    expect(r.etapasEncontradas).toEqual(["Demolição", "Fundação"]);
    expect(r.linhas.map((l) => [l.etapa, l.descricao, l.unidade])).toEqual([
      ["Demolição", "Demolição de piso", "m²"],
      ["Fundação", "Sapata", "un"],
    ]);
    expect(r.ignoradas).toBe(2);
  });

  test("título de etapa escrito na coluna da numeração (a da esquerda)", () => {
    const r = ler(["ORÇAMENTO;;;;", "Item;Descrição;Un;Qtd;Preço unitário", "1 - DEMOLIÇÃO;;;;", "1.1;Demolição de piso;m2;45;38", "INSTALAÇÕES;;;;", "2.1;Ponto de tomada;un;12;150", "Total;;;;5310"].join("\n"));
    expect(r.etapasEncontradas).toEqual(["Demolição", "Instalações"]);
    expect(r.linhas.map((l) => [l.etapa, l.descricao])).toEqual([["Demolição", "Demolição de piso"], ["Instalações", "Ponto de tomada"]]);
    expect(r.ignoradas).toBe(1);
  });

  test("só o valor total: o unitário sai da divisão; se os dois não batem, avisa", () => {
    const r = ler("Descrição;Qtd;Valor total\nPintura;50;900");
    expect(r.linhas[0].valorUnitario).toBe(18);
    const b = ler("Descrição;Qtd;Valor unit.;Valor total\nPintura;50;18;1000");
    expect(b.linhas[0].aviso).toContain("não bate");
  });

  test("item sem valor numa planilha com valores NÃO vira etapa (só título em maiúsculas ou numerado)", () => {
    const r = ler("Descrição;Qtd;Valor unit.\nPintura;2;50\nVerba de limpeza;;");
    expect(r.linhas.map((l) => l.descricao)).toEqual(["Pintura", "Verba de limpeza"]);
    expect(r.linhas[1].aviso).toBe("sem valor");
  });

  test("sem títulos vale a posição das colunas; texto com aspas e vírgula só em .csv", () => {
    expect(ler("Elétrica;Tomada;10;un;120").linhas[0]).toMatchObject({ etapa: "Elétrica", descricao: "Tomada", valorUnitario: 120 });
    const csv = gradeDeTexto('Descrição,Qtd,Valor unit.\n"Tinta, 18L",2,"1.200,50"', { csv: true });
    expect(csv[1]).toEqual(["Tinta, 18L", "2", "1.200,50"]);
    expect(gradeDeTexto("Reboco, 12")).toEqual([["Reboco, 12"]]); // colado: vírgula não separa
  });

  test("CSV do Excel brasileiro em Windows-1252 e com BOM", () => {
    const bytes = Uint8Array.from([...Buffer.from("Descri", "latin1"), 0xe7, 0xe3, 0x6f, 0x3b, 0x56, 0x61, 0x6c]); // "Descrição;Val"
    expect(decodificar(bytes)).toBe("Descrição;Val");
    expect(decodificar(Uint8Array.from([0xef, 0xbb, 0xbf, 0x41]))).toBe("A");
  });

  test("unidades padronizadas", () => {
    expect(["m2", "UND", "ml", "Verba", "m³", "xyz"].map(normalizarUnidade)).toEqual(["m²", "un", "m", "vb", "m³", "xyz"]);
  });

  test("lê um .xlsx de verdade (abas, números e texto com & e acentos)", async () => {
    const xlsx = criarXlsx([
      { nome: "Orçamento", linhas: [["Etapa", "Descrição", "Qtd", "Unid", "Valor unit."], ["Pintura", "Tinta & selador", 4, "m2", 12.5], ["Elétrica", "Ponto", 10, "un", 120]] },
      { nome: "Outra", linhas: [["a", "b"]] },
    ]);
    const abas = await lerXlsx(xlsx.buffer.slice(xlsx.byteOffset, xlsx.byteOffset + xlsx.byteLength) as ArrayBuffer);
    expect(abas.map((a) => a.nome)).toEqual(["Orçamento", "Outra"]);
    const grade = abas[0].grade;
    const r = montarLinhas(grade, detectar(grade));
    expect(r.linhas.map((l) => [l.etapa, l.descricao, l.quantidade, l.unidade, l.valorUnitario])).toEqual([
      ["Pintura", "Tinta & selador", 4, "m²", 12.5],
      ["Elétrica", "Ponto", 10, "un", 120],
    ]);
  });
});

test.describe("importar planilha pela janela", () => {
  async function abrir(page: import("@playwright/test").Page) {
    await semTutorial(page);
    await entrarComoArquiteto(page);
    await criarProjeto(page, "Casa do Lago");
    await page.getByRole("tab", { name: "Itens" }).click();
    await page.getByRole("button", { name: /Importar planilha/ }).click();
    return page.getByRole("dialog", { name: "Importar planilha" });
  }

  test("escolher um arquivo .xlsx, conferir e importar; depois, pular o que já existe", async ({ page }) => {
    test.setTimeout(100_000);
    const j = await abrir(page);
    const xlsx = criarXlsx([{ nome: "Orçamento", linhas: [["1 - DEMOLIÇÃO", "", "", "", ""], ["Descrição", "Qtd", "Unid", "Valor total", "Fornecedor"], ["Demolição de piso", 45, "m2", 1710, "Zé Obras"], ["Total", "", "", 1710, ""]] }]);
    await j.locator("#imp-arquivo").setInputFiles({ name: "orcamento.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer: xlsx });
    await expect(j.getByText("orcamento.xlsx")).toBeVisible();
    await expect(j.getByText("1 item", { exact: true })).toBeVisible();
    await expect(j.getByText("títulos reconhecidos")).toBeVisible();
    await expect(j.getByRole("table")).toContainText("Demolição de piso");
    await j.getByRole("button", { name: "Importar 1 item" }).click();
    await expect(j).toBeHidden();
    await expect(page.getByRole("region", { name: "Resumo do orçamento" })).toContainText(/1 item · 1 etapa/);

    // De novo o mesmo arquivo: o item já existe, é pulado por padrão.
    await page.getByRole("button", { name: /Importar planilha/ }).first().click();
    const j2 = page.getByRole("dialog", { name: "Importar planilha" });
    await j2.getByLabel("Ou cole as linhas aqui").fill("Descrição;Qtd;Unid;Valor unit.\nDemolição de piso;45;m²;38\nPintura;10;m²;20");
    await expect(j2.getByText("1 já está no orçamento")).toBeVisible();
    await expect(j2.getByRole("button", { name: "Importar 1 item" })).toBeVisible();
    await j2.getByLabel("Pular os itens que já estão no orçamento").uncheck();
    await expect(j2.getByRole("button", { name: "Importar 2 itens" })).toBeVisible();
  });

  test("corrigir as colunas à mão atualiza a tabela", async ({ page }) => {
    const j = await abrir(page);
    await j.getByLabel("Ou cole as linhas aqui").fill("Serviço;Preço;Qtd\nPintura;20;3");
    await expect(j.getByRole("table")).toContainText("R$ 20,00");
    await j.getByText("confira o que é cada coluna").click();
    await j.getByLabel(/Coluna B/).selectOption("quantidade");
    await j.getByLabel(/Coluna C/).selectOption("valorUnitario");
    await expect(j.getByRole("table")).toContainText("R$ 3,00"); // o valor unitário agora é o 3 (e a quantidade, 20)
  });

  test("erros: o app explica o que houve e como resolver", async ({ page }) => {
    const j = await abrir(page);
    const arquivo = (name: string, buffer: Buffer) => j.locator("#imp-arquivo").setInputFiles({ name, mimeType: "application/octet-stream", buffer });

    await arquivo("antiga.xls", Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 1, 2, 3]));
    await expect(j.getByRole("alert")).toContainText("Formato antigo do Excel (.xls)");
    await expect(j.getByRole("alert")).toContainText("Como resolver:");
    await expect(j.getByRole("alert")).toContainText("Salvar como");

    await arquivo("orcamento.pdf", Buffer.from("%PDF-1.4"));
    await expect(j.getByRole("alert")).toContainText("Esse tipo de arquivo não funciona aqui");

    await arquivo("quebrada.xlsx", Buffer.from("isto não é um zip de verdade, só texto"));
    await expect(j.getByRole("alert")).toContainText("não parece uma planilha .xlsx");

    await arquivo("vazia.csv", Buffer.from("   \n  \n"));
    await expect(j.getByRole("alert")).toContainText("A planilha está vazia");

    await arquivo("vazio.xlsx", Buffer.alloc(0));
    await expect(j.getByRole("alert")).toContainText("O arquivo está vazio");

    await arquivo("grande.csv", Buffer.alloc(5 * 1024 * 1024 + 10, "a"));
    await expect(j.getByRole("alert")).toContainText("grande demais");

    // Texto colado sem coluna de descrição reconhecível, e só a linha de títulos.
    await j.getByLabel("Ou cole as linhas aqui").fill("Qtd;Valor unit.\n");
    await expect(j.getByRole("alert")).toContainText("Não sei qual coluna é a descrição");
    await expect(j.getByRole("button", { name: "Importar", exact: true })).toBeDisabled();
  });
});
