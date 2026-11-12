import { expect, test } from "@playwright/test";
import { adicionarItem, criarProjeto, entrarComoArquiteto, marcarItem, sair, semTutorial } from "./ajudas";

/** O arquiteto reúne o que foi feito no mês, escolhe o que entra e gera o relatório de andamento para o cliente. */
test("o arquiteto gera o relatório mensal de andamento", async ({ page }) => {
  test.slow();
  await semTutorial(page);
  await entrarComoArquiteto(page);
  const projeto = await criarProjeto(page, "Reforma da Sala");

  await test.step("monta o orçamento e ainda não há nada no mês", async () => {
    await adicionarItem(page, { etapa: "Pintura", descricao: "Tinta acrílica 18L", quantidade: 4, unitario: 350 });
    await adicionarItem(page, { etapa: "Pintura", descricao: "Rolo de lã", quantidade: 2, unitario: 25 });
    await adicionarItem(page, { etapa: "Elétrica", descricao: "Pontos de tomada", quantidade: 10, unitario: 120 });
    await page.getByRole("tab", { name: "Resumo" }).click();
    await expect(page.getByRole("region", { name: "Relatório mensal" })).toContainText(/Nada marcado em/);
  });

  await test.step("marca o que foi feito no mês", async () => {
    await marcarItem(page, "Tinta acrílica 18L", { feito: true, pago: true });
    await marcarItem(page, "Rolo de lã", { feito: true });
    await marcarItem(page, "Pontos de tomada", { feito: true });
    await page.getByRole("tab", { name: "Resumo" }).click();
    // O cartão do Resumo já conta o mês sozinho
    await expect(page.getByRole("region", { name: "Relatório mensal" })).toContainText("3 serviços executados · 1 pagamento");
  });

  await test.step("abre a janela: tudo do mês já vem marcado", async () => {
    await page.getByRole("button", { name: "Gerar relatório" }).click();
    const janela = page.getByRole("dialog", { name: "Relatório mensal de andamento" });
    const resumo = janela.getByLabel("Resumo do que vai no relatório");
    await expect(resumo).toContainText("3");
    await expect(janela.getByText("3 de 3 incluídos")).toBeVisible();
    await expect(janela.getByRole("checkbox", { name: /Tinta acrílica 18L/ })).toBeChecked();
    await expect(janela.getByRole("checkbox", { name: /Pontos de tomada/ })).toBeChecked();
  });

  await test.step("tira o que não vale e escreve os destaques", async () => {
    const janela = page.getByRole("dialog", { name: "Relatório mensal de andamento" });
    await janela.getByRole("checkbox", { name: /Pontos de tomada/ }).uncheck();
    await expect(janela.getByText("2 de 3 incluídos")).toBeVisible();
    await janela.getByLabel("Destaques do mês (opcional)").fill("Concluímos a pintura da sala.");
    await janela.getByLabel("Próximos passos (opcional)").fill("Instalação das luminárias.");
  });

  await test.step("gera o documento com o que foi escolhido", async () => {
    await page.getByRole("button", { name: /Gerar relatório de/ }).click();
    const documento = page.locator(".print-area");
    await expect(documento.getByRole("heading", { level: 1, name: projeto.nome })).toBeVisible();
    await expect(documento).toContainText("Relatório mensal de andamento");
    await expect(documento).toContainText("Resumo do mês");
    await expect(documento).toContainText("Tinta acrílica 18L");
    await expect(documento).toContainText("Rolo de lã");
    await expect(documento).not.toContainText("Pontos de tomada"); // foi desmarcado
    await expect(documento).toContainText("Concluímos a pintura da sala.");
    await expect(documento).toContainText("Instalação das luminárias.");
    await expect(documento).toContainText(/Pagamentos em/);
    await expect(documento).toContainText(/R\$\s*1\.400,00/); // 4 x 350, o único pago
    await expect(documento).toContainText("Gerado com Pitangueira");
  });

  await test.step("volta e ajusta sem perder a escolha, e gera sem os valores em R$", async () => {
    await page.locator(".print-area").getByRole("button", { name: /Fechar/ }).click();
    const janela = page.getByRole("dialog", { name: "Relatório mensal de andamento" });
    await expect(janela.getByText("2 de 3 incluídos")).toBeVisible(); // a seleção continua
    await janela.getByRole("checkbox", { name: /Mostrar os valores em R\$/ }).uncheck();
    await page.getByRole("button", { name: /Gerar relatório de/ }).click();
    const documento = page.locator(".print-area");
    await expect(documento).toContainText("Itens pagos no mês");
    await expect(documento).not.toContainText("R$");
    await documento.getByRole("button", { name: /Fechar/ }).click();
    await janela.getByRole("button", { name: "Cancelar" }).click();
    await expect(janela).toBeHidden();
  });

  await test.step("o cliente não vê o relatório nem o botão de gerar", async () => {
    await sair(page);
    await page.goto(projeto.url);
    await page.getByPlaceholder("ABC123").fill(projeto.chave);
    await page.getByPlaceholder("Como devemos te chamar").fill("Cliente Teste");
    await page.getByRole("button", { name: "Entrar no projeto" }).click();
    await expect(page.getByRole("heading", { level: 1, name: projeto.nome })).toBeVisible();
    await expect(page.getByRole("region", { name: "Relatório mensal" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Gerar relatório" })).toHaveCount(0);
  });
});
