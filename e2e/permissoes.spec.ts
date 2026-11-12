import { expect, test, type Page } from "@playwright/test";
import { adicionarItem, criarProjeto, entrarComoArquiteto, registrarPrazoOriginal, sair, semTutorial, type ProjetoCriado } from "./ajudas";

/** Quem pode o quê. O arquiteto cria o orçamento e vê o escopo; o cliente só acompanha o orçamento. */

async function projetoPronto(page: Page): Promise<ProjetoCriado> {
  await semTutorial(page);
  await entrarComoArquiteto(page);
  const projeto = await criarProjeto(page, "Casa de Praia");
  await registrarPrazoOriginal(page, 4);
  await adicionarItem(page, { etapa: "Alvenaria", descricao: "Tijolo cerâmico", quantidade: 500, unitario: 2 });
  return projeto;
}

async function entrarComoCliente(page: Page, projeto: ProjetoCriado) {
  await sair(page);
  await page.goto(projeto.url);
  await page.getByPlaceholder("ABC123").fill(projeto.chave);
  await page.getByPlaceholder("Como devemos te chamar").fill("Cliente Teste");
  await page.getByRole("button", { name: "Entrar no projeto" }).click();
  await expect(page.getByRole("heading", { level: 1, name: projeto.nome })).toBeVisible();
}

test.describe("permissões", () => {
  test("o arquiteto tem a aba Escopo e os botões de criar orçamento", async ({ page }) => {
    await projetoPronto(page);

    const abas = page.getByRole("navigation", { name: "Seções do projeto" }).getByRole("tab");
    await expect(abas).toHaveText(["Resumo", "Itens", "Gráficos", "Escopo"]);

    await page.getByRole("tab", { name: "Itens" }).click();
    await expect(page.getByRole("button", { name: "Item", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Catálogo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Composições" })).toBeVisible();

    await page.getByRole("tab", { name: "Escopo" }).click();
    await expect(page.getByRole("heading", { name: "Escopo do projeto" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pedidos do cliente" })).toBeVisible();
  });

  test("o cliente não vê a aba Escopo nem consegue criar orçamento", async ({ page }) => {
    const projeto = await projetoPronto(page);
    await entrarComoCliente(page, projeto);

    // Sem aba Escopo, e nada do conteúdo dela aparece em lugar nenhum
    const abas = page.getByRole("navigation", { name: "Seções do projeto" }).getByRole("tab");
    await expect(abas).toHaveText(["Resumo", "Itens", "Gráficos"]);
    await expect(page.getByRole("tab", { name: "Escopo" })).toHaveCount(0);
    await expect(page.getByText("Pedidos do cliente")).toHaveCount(0);
    await expect(page.getByText("Escopo do projeto")).toHaveCount(0);

    // Itens: vê o orçamento, mas não tem como criar nada
    await page.getByRole("tab", { name: "Itens" }).click();
    await expect(page.getByRole("button", { name: "Item", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Catálogo" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Composições" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Adicionar primeiro item/ })).toHaveCount(0);

    // E também não aparecem os atalhos pessoais do arquiteto
    await expect(page.getByRole("button", { name: "Meu catálogo" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Financeiro" })).toHaveCount(0);
  });

  test("o tutorial do cliente não fala de escopo", async ({ page }) => {
    const projeto = await projetoPronto(page);
    await sair(page);
    // Para ver o tutorial do cliente, não marca como visto
    await page.addInitScript(() => localStorage.removeItem("pitangueira:tour:projeto-cliente:v1"));
    await page.goto(projeto.url);
    await page.getByPlaceholder("ABC123").fill(projeto.chave);
    await page.getByPlaceholder("Como devemos te chamar").fill("Cliente Teste");
    await page.getByRole("button", { name: "Entrar no projeto" }).click();

    const tutorial = page.getByRole("dialog", { name: "Acompanhe o seu projeto" });
    await expect(tutorial).toBeVisible();
    await expect(tutorial).not.toContainText(/escopo/i);

    // Anda por todos os passos e confere que nenhum menciona escopo
    for (let i = 0; i < 12; i++) {
      const ativo = page.getByRole("dialog").filter({ has: page.locator("#tour-titulo") });
      if (!(await ativo.isVisible())) break;
      await expect(ativo).not.toContainText(/escopo/i);
      const proximo = ativo.getByRole("button", { name: /Próximo|Concluir/ });
      const ultimo = (await proximo.textContent())?.includes("Concluir");
      await proximo.click();
      if (ultimo) break;
    }
  });
});
