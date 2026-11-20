import { expect, test } from "@playwright/test";
import { adicionarItem, criarProjeto, entrarComoArquiteto, reais, sair, semTutorial } from "./ajudas";

test("quando o valor de um item muda, o app mostra se subiu ou desceu, no item, na janela e na linha do tempo", async ({ page }) => {
  test.setTimeout(100_000);
  await semTutorial(page);
  await entrarComoArquiteto(page);
  const projeto = await criarProjeto(page, "Casa do Lago");
  await adicionarItem(page, { etapa: "Elétrica", descricao: "Pontos de tomada", quantidade: 2, unitario: 500 }); // R$ 1.000,00

  const abrirEdicao = async () => {
    await page.getByRole("tab", { name: "Itens" }).click();
    await page.getByPlaceholder(/Buscar serviço/).fill("Pontos de tomada");
    await page.locator(".linha-hover").filter({ hasText: "Pontos de tomada" }).getByRole("button", { name: "Editar item" }).click();
    return page.getByRole("dialog", { name: "Editar item" });
  };

  await test.step("um item sem mudança de valor não mostra aviso", async () => {
    await page.getByRole("tab", { name: "Itens" }).click();
    await page.getByPlaceholder(/Buscar serviço/).fill("Pontos de tomada");
    await expect(page.getByTestId("mudanca-valor")).toHaveCount(0);
  });

  await test.step("a janela avisa, antes de salvar, que o novo valor é maior", async () => {
    const d = await abrirEdicao();
    await expect(d.getByRole("status")).toHaveCount(0); // ainda igual ao atual
    await d.getByLabel("Valor orçado").fill("1200");
    await expect(d.getByRole("status")).toContainText("▲");
    await expect(d.getByRole("status")).toContainText(/R\$\s200,00 a mais que o valor atual \(R\$\s1\.000,00\)/);
    await expect(d.getByRole("status")).toContainText(/Novo valor: R\$\s1\.200,00/);
    await d.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(d).toBeHidden();
  });

  await test.step("o item mostra quanto subiu e qual era o valor", async () => {
    const m = page.getByTestId("mudanca-valor");
    await expect(m).toContainText("▲");
    await expect(m).toContainText(/R\$\s200,00 a mais/);
    await expect(m).toContainText(/era R\$\s1\.000,00/);
  });

  await test.step("uma nova edição, para menos, mostra que desceu", async () => {
    const d = await abrirEdicao();
    await d.getByLabel("Valor orçado").fill("900");
    await expect(d.getByRole("status")).toContainText("▼");
    await expect(d.getByRole("status")).toContainText(/R\$\s300,00 a menos que o valor atual \(R\$\s1\.200,00\)/);
    await d.getByRole("button", { name: "Salvar alterações" }).click();
    const m = page.getByTestId("mudanca-valor");
    await expect(m).toContainText("▼");
    await expect(m).toContainText(/R\$\s300,00 a menos/);
    await expect(m).toContainText(/era R\$\s1\.200,00/);
  });

  await test.step("o valor real também conta: o que vale é o valor efetivo", async () => {
    const d = await abrirEdicao();
    await d.getByRole("button", { name: "Mais detalhes" }).click();
    await d.getByLabel("Valor real").fill("1500");
    await expect(d.getByRole("status")).toContainText(/R\$\s600,00 a mais que o valor atual \(R\$\s900,00\)/);
    await d.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(page.getByTestId("mudanca-valor")).toContainText(/R\$\s600,00 a mais/);
  });

  await test.step("a linha do tempo registra cada mudança, com o filtro Valores", async () => {
    await page.getByRole("tab", { name: "Acompanhar" }).click();
    const feed = page.getByRole("region", { name: "Linha do tempo" });
    await expect(feed.getByText("Valor alterado: Pontos de tomada")).toHaveCount(3);
    await expect(feed).toContainText("mais caro");
    await expect(feed).toContainText("mais barato");
    await feed.getByRole("button", { name: "Valores", exact: true }).click();
    await expect(feed.getByText("Valor alterado: Pontos de tomada")).toHaveCount(3);
    await expect(feed.getByText(/R\$\s1\.000,00 → R\$\s1\.200,00/)).toBeVisible();
    await expect(feed.getByText(/R\$\s1\.200,00 → R\$\s900,00/)).toBeVisible();
    await expect(feed.getByText(/R\$\s900,00 → R\$\s1\.500,00/)).toBeVisible();
  });

  await test.step("o cliente também vê a mudança de valor no item", async () => {
    await sair(page);
    await page.goto(projeto.url);
    await page.getByPlaceholder("ABC123").fill(projeto.chave);
    await page.getByPlaceholder("Como devemos te chamar").fill("Marina");
    await page.getByRole("button", { name: "Entrar no projeto" }).click();
    await page.getByRole("tab", { name: "Itens" }).click();
    await page.getByPlaceholder(/Buscar serviço/).fill("Pontos de tomada");
    await expect(page.getByTestId("mudanca-valor")).toContainText(/R\$\s600,00 a mais/);
    await expect(page.getByRole("region", { name: "Resumo do orçamento" })).toContainText(reais("1.500,00"));
  });
});
