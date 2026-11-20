import { expect, test } from "@playwright/test";
import { criarProjeto, entrarComoArquiteto, reais, semTutorial } from "./ajudas";

/** O catálogo é uma lista de preços de consulta: mudar um valor nele não mexe em nenhum item que já está num projeto. */
test("mudar o valor de um item do catálogo da home não altera os projetos", async ({ page }) => {
  test.setTimeout(100_000);
  await semTutorial(page);
  await entrarComoArquiteto(page);
  await criarProjeto(page, "Casa do Lago");

  await test.step("o item do catálogo vai para o orçamento do projeto (uma cópia, com o valor do momento)", async () => {
    await page.getByRole("tab", { name: "Itens" }).click();
    await page.getByRole("button", { name: /Usar meu catálogo/ }).click();
    const cat = page.getByRole("dialog", { name: /Meu catálogo/ });
    await cat.getByRole("button", { name: "+ Novo item" }).click();
    await cat.getByText("Descrição", { exact: true }).locator("..").getByRole("textbox").fill("Tinta do catálogo");
    await cat.getByText("Valor unit. (R$)", { exact: true }).locator("..").getByRole("spinbutton").fill("100");
    await cat.getByRole("button", { name: "Salvar no catálogo" }).click();
    await cat.getByLabel("Quantidade de Tinta do catálogo").fill("2");
    await cat.getByRole("button", { name: "Adicionar ao orçamento" }).click();
    await cat.getByRole("button", { name: "Fechar" }).click();
    await expect(page.getByRole("region", { name: "Resumo do orçamento" })).toContainText(reais("200,00"));
  });

  await test.step("na home, o valor do item no catálogo muda", async () => {
    await page.getByRole("tab", { name: "Resumo" }).click();
    await page.getByRole("button", { name: "Voltar ao painel" }).click();
    await page.getByRole("button", { name: "Meu catálogo" }).click();
    const cat = page.getByRole("dialog", { name: /Meu catálogo/ });
    await cat.getByRole("button", { name: "Editar Tinta do catálogo" }).click();
    await cat.getByText("Valor unit. (R$)", { exact: true }).locator("..").getByRole("spinbutton").fill("150");
    await cat.getByRole("button", { name: "Salvar alterações" }).click();
    await expect(cat).toContainText(reais("150,00")); // no catálogo, o valor novo
    await cat.getByRole("button", { name: "Fechar" }).click();
  });

  await test.step("o item que já estava no projeto continua com o valor de antes, sem aviso de mudança", async () => {
    await page.locator('article a[href^="/obra/"]').first().click();
    await page.getByRole("tab", { name: "Itens" }).click();
    await expect(page.getByRole("region", { name: "Resumo do orçamento" })).toContainText(reais("200,00")); // 2 × R$ 100, não 2 × R$ 150
    await page.getByPlaceholder(/Buscar serviço/).fill("Tinta do catálogo");
    const linha = page.locator(".linha-hover").filter({ hasText: "Tinta do catálogo" });
    await expect(linha).toContainText(reais("200,00"));
    await expect(page.getByTestId("mudanca-valor")).toHaveCount(0);
  });

  await test.step("um item novo tirado do catálogo depois já traz o valor novo", async () => {
    await page.getByPlaceholder(/Buscar serviço/).fill("");
    await page.getByRole("button", { name: "Catálogo" }).click();
    const cat = page.getByRole("dialog", { name: /Meu catálogo/ });
    await cat.getByLabel("Quantidade de Tinta do catálogo").fill("1");
    await cat.getByRole("button", { name: "Adicionar ao orçamento" }).click();
    await cat.getByRole("button", { name: "Fechar" }).click();
    await expect(page.getByRole("region", { name: "Resumo do orçamento" })).toContainText(reais("350,00")); // 200 + 150
  });
});
