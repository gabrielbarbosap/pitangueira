import { expect, test } from "@playwright/test";
import { adicionarItem, criarProjeto, entrarComoArquiteto, sair, semTutorial } from "./ajudas";

test("o app mostra quem marcou Feito e Pago, e o cliente aparece como cliente", async ({ page }) => {
  test.slow();
  await semTutorial(page);
  await entrarComoArquiteto(page);
  const projeto = await criarProjeto(page, "Casa do Lago");

  await test.step("item criado já como feito e pago também guarda data e autor", async () => {
    await page.getByRole("tab", { name: "Itens" }).click();
    await page.getByRole("button", { name: /Adicionar primeiro item/ }).click();
    const d = page.getByRole("dialog", { name: "Novo item" });
    await d.getByPlaceholder("Ex.: Pintura").fill("Pintura");
    await d.getByPlaceholder("Ex.: Tinta acrílica 18L").fill("Tinta acrílica 18L");
    await d.getByLabel("Valor unitário").fill("350");
    await d.getByRole("button", { name: "Mais detalhes" }).click();
    await d.getByRole("button", { name: /Feito/ }).click();
    await d.getByRole("button", { name: /Pago/ }).click();
    await d.getByRole("button", { name: "Adicionar item", exact: true }).click();
    await expect(d).toBeHidden();
    await page.getByPlaceholder(/Buscar serviço/).fill("Tinta");
    await expect(page.getByTestId("autoria")).toContainText(/Feito por Gabriel \(demo\) em \d{2}\/\d{2} \d{2}:\d{2} · Pago por Gabriel \(demo\)/);
    await page.getByPlaceholder(/Buscar serviço/).fill("");
  });

  await test.step("o item criado já marcado entra no relatório do mês", async () => {
    await page.getByRole("tab", { name: "Resumo" }).click();
    await page.getByRole("button", { name: "Gerar relatório" }).click();
    const janela = page.getByRole("dialog", { name: "Relatório mensal de andamento" });
    await expect(janela.getByRole("checkbox", { name: /Tinta acrílica 18L/ })).toBeChecked();
    await janela.getByRole("button", { name: "Cancelar" }).click();
  });

  await adicionarItem(page, { etapa: "Elétrica", descricao: "Pontos de tomada", quantidade: 10, unitario: 120 });

  await test.step("o cliente marca um item e o arquiteto vê que foi o cliente", async () => {
    await sair(page);
    await page.goto(projeto.url);
    await page.getByPlaceholder("ABC123").fill(projeto.chave);
    await page.getByPlaceholder("Como devemos te chamar").fill("Marina");
    await page.getByRole("button", { name: "Entrar no projeto" }).click();
    await page.getByRole("tab", { name: "Itens" }).click();
    await page.getByPlaceholder(/Buscar serviço/).fill("tomada");
    await page.locator(".linha-hover").filter({ hasText: "Pontos de tomada" }).getByRole("button", { name: "Pago" }).click();
    await expect(page.getByTestId("autoria")).toContainText("Pago por Marina (cliente)");
    await page.getByRole("tab", { name: "Resumo" }).click();
    const atividade = page.getByRole("region", { name: "Atividade recente" });
    await expect(atividade).toContainText("Marina");
    await expect(atividade).toContainText("marcou “Pontos de tomada” como pago");
    await expect(atividade).toContainText("cliente");
  });
});

test("o arquiteto vê as métricas de uso e os erros; sem entrar, a página fica restrita", async ({ page }) => {
  test.slow();
  await semTutorial(page);
  await entrarComoArquiteto(page);
  await criarProjeto(page, "Casa do Lago");
  await adicionarItem(page, { etapa: "Pintura", descricao: "Tinta acrílica 18L", quantidade: 4, unitario: 350 });

  // Um erro que ninguém tratou vira registro (sem derrubar o app)
  await page.evaluate(() => setTimeout(() => { throw new Error("erro-de-teste-telemetria"); }, 0));
  await page.waitForTimeout(300);

  await page.goto("/admin");
  await expect(page.getByText("Esta página é só para arquitetos.")).toBeVisible();
  await page.getByRole("button", { name: "Entrar com Google" }).click();

  const resumo = page.getByRole("region", { name: "Resumo" });
  await expect(resumo).toContainText("Contas ativas");
  await expect(resumo.getByText("Itens adicionados").locator("..")).toContainText("1");
  await expect(page.getByRole("region", { name: "Eventos" })).toContainText("Projetos criados");
  await expect(page.getByRole("region", { name: "Erros recentes" })).toContainText("erro-de-teste-telemetria");
  await expect(page.getByText(/Não guardamos nomes, e-mails, valores em dinheiro/)).toBeVisible();
});
