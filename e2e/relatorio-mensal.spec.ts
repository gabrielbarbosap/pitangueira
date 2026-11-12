import { expect, test } from "@playwright/test";
import { adicionarItem, criarProjeto, entrarComoArquiteto, marcarItem, sair, semTutorial } from "./ajudas";

/** A janela lista todos os itens do projeto. O que não é do mês fica logo abaixo, e marcar um item ali também o atualiza na aba Itens. */
test("o arquiteto inclui itens de outro mês e marca pendentes na própria janela do relatório", async ({ page }) => {
  test.slow();
  await semTutorial(page);
  await entrarComoArquiteto(page);
  const projeto = await criarProjeto(page, "Casa do Lago");

  await adicionarItem(page, { etapa: "Pintura", descricao: "Tinta acrílica 18L", quantidade: 4, unitario: 350 });
  await adicionarItem(page, { etapa: "Pintura", descricao: "Rolo de lã", quantidade: 2, unitario: 25 });
  await adicionarItem(page, { etapa: "Alvenaria", descricao: "Tijolo cerâmico", quantidade: 500, unitario: 2 }); // nunca marcado
  await marcarItem(page, "Tinta acrílica 18L", { feito: true, pago: true });
  await marcarItem(page, "Rolo de lã", { feito: true });

  await test.step("a tinta passa a ser de 40 dias atrás (outro mês), e o arquiteto volta ao projeto", async () => {
    const id = projeto.url.split("/").pop() as string;
    await page.evaluate((idProjeto) => {
      const chave = `reforma:itens:v4:${idProjeto}`;
      const itens = JSON.parse(localStorage.getItem(chave) ?? "[]");
      const antigo = Date.now() - 40 * 86_400_000;
      for (const i of itens) if (i.descricao === "Tinta acrílica 18L") Object.assign(i, { feitoEm: antigo, pagoEm: antigo });
      localStorage.setItem(chave, JSON.stringify(itens));
    }, id);
    await entrarComoArquiteto(page); // recarrega a página e entra de novo, já com as datas novas
    await page.locator('article a[href^="/obra/"]').first().click();
    await expect(page.getByRole("heading", { level: 1, name: projeto.nome })).toBeVisible();
    await page.getByRole("button", { name: "Gerar relatório" }).click();
  });

  const janela = page.getByRole("dialog", { name: "Relatório mensal de andamento" });

  await test.step("o rolo, do mês, já vem marcado; os outros itens do projeto aparecem, sem marca", async () => {
    await expect(janela.getByRole("checkbox", { name: /Rolo de lã/ })).toBeChecked();
    await expect(janela.getByText("1 de 3 incluídos")).toBeVisible();
    await janela.getByLabel("Buscar outro item").fill("Tijolo"); // nunca foi feito nem pago, e mesmo assim aparece
    await expect(janela.getByRole("checkbox", { name: /Tijolo cerâmico/ })).not.toBeChecked();
    await janela.getByLabel("Buscar outro item").fill("Tinta");
    await expect(janela.getByRole("checkbox", { name: /Tinta acrílica 18L/ })).not.toBeChecked();
    await expect(janela.getByRole("button", { name: /Desmarcar Tinta acrílica 18L como feito/ })).toContainText(/Feito \d{2}\/\d{2}\/\d{2}/); // com o ano: não é deste mês
  });

  await test.step("marcar a tinta a inclui no relatório", async () => {
    await janela.getByRole("checkbox", { name: /Tinta acrílica 18L/ }).check();
    await expect(janela.getByText("2 de 3 incluídos")).toBeVisible();
  });

  await test.step("marcar o tijolo como feito na janela o inclui e o atualiza no projeto", async () => {
    await janela.getByLabel("Buscar outro item").fill("Tijolo");
    await janela.getByRole("button", { name: /Marcar Tijolo cerâmico como feito/ }).click();
    await expect(janela.getByText("3 de 3 incluídos")).toBeVisible();
    await expect(janela.getByRole("checkbox", { name: /Tijolo cerâmico/ })).toBeChecked();
  });

  await test.step("o documento traz os três, o item de outro mês com a data completa", async () => {
    await janela.getByLabel("Destaques do mês (opcional)").fill("Pintura concluída.");
    await page.getByRole("button", { name: /Gerar relatório de/ }).click();
    const documento = page.locator(".print-area");
    await expect(documento).toContainText("Tinta acrílica 18L");
    await expect(documento).toContainText("Rolo de lã");
    await expect(documento).toContainText("Tijolo cerâmico");
    await expect(documento).toContainText(/\d{2}\/\d{2}\/\d{2}/); // a data da tinta, com ano
    await expect(documento).toContainText(/R\$\s*1\.400,00/); // a tinta paga entra nos pagamentos
    await documento.getByRole("button", { name: /Fechar/ }).click();
  });

  await test.step("a aba Itens já mostra o tijolo como feito", async () => {
    await janela.getByRole("button", { name: "Cancelar" }).click();
    await page.getByRole("tab", { name: "Itens" }).click();
    await page.getByPlaceholder(/Buscar serviço/).fill("Tijolo");
    const linha = page.locator(".linha-hover").filter({ hasText: "Tijolo cerâmico" });
    await expect(linha.getByRole("button", { name: "Feito" })).toHaveAttribute("aria-pressed", "true");
  });
});

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
