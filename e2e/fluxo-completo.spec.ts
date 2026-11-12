import { expect, test } from "@playwright/test";
import { adicionarItem, criarProjeto, entrarComoArquiteto, reais, registrarPrazoOriginal, sair, semTutorial } from "./ajudas";

/**
 * Um arquiteto NOVO (navegador limpo) faz o fluxo inteiro: cria o projeto, registra o prazo, monta o orçamento,
 * gera o PDF, escreve o escopo, e entrega ao cliente, que entra com o link e a chave.
 * Tudo em um teste só porque cada etapa depende do que a anterior deixou salvo.
 */
test("do projeto novo ao orçamento na mão do cliente", async ({ page, context, baseURL }) => {
  test.slow(); // o fluxo é longo
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await semTutorial(page);

  const nome = "Apartamento da Ana";
  let chave = "";
  let url = "";

  await test.step("arquiteto novo entra e vê a home vazia", async () => {
    await entrarComoArquiteto(page);
    await expect(page.getByRole("heading", { name: /Olá,/ })).toBeVisible();
    await expect(page.getByText("Nenhum projeto ainda")).toBeVisible();
  });

  await test.step("cria o projeto do zero", async () => {
    ({ chave, url } = await criarProjeto(page, nome, 50000));
    // Projeto novo: nada de orçamento, prazo ainda por registrar
    await expect(page.getByText("Nenhum item neste projeto ainda")).toBeVisible();
    await expect(page.getByRole("button", { name: "Registrar previsão inicial" })).toBeVisible();
  });

  await test.step("registra o prazo original, que fica travado", async () => {
    await registrarPrazoOriginal(page, 6);
    const prazo = page.getByRole("region", { name: "Prazo do projeto" });
    await expect(prazo).toContainText(/Faltam \d+ dias/);
    await expect(prazo).toContainText("Previsão original");
    await expect(prazo).toContainText("não pode ser editada");
    // Só se pode acrescentar uma nova previsão; não existe editar nem apagar a original
    await expect(prazo.getByRole("button", { name: "Registrar nova previsão" })).toBeVisible();
    await expect(prazo.getByRole("button", { name: /editar|apagar|excluir|remover/i })).toHaveCount(0);
  });

  await test.step("monta o orçamento com dois itens", async () => {
    await adicionarItem(page, { etapa: "Pintura", descricao: "Tinta acrílica 18L", quantidade: 4, unitario: 350 });
    await adicionarItem(page, { etapa: "Elétrica", descricao: "Pontos de tomada", quantidade: 10, unitario: 120 });
    await expect(page.getByText(/0 de 2 itens/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Itens do orçamento" })).toBeVisible();

    // No Resumo, o valor previsto (1.400 + 1.200) aparece como "falta pagar"
    await page.getByRole("tab", { name: "Resumo" }).click();
    await expect(page.getByText(reais("2.600")).first()).toBeVisible();
  });

  await test.step("gera o orçamento em PDF", async () => {
    await page.getByRole("tab", { name: "Itens" }).click();
    await page.getByRole("button", { name: "Orçamento em PDF" }).click();
    await page.getByRole("dialog", { name: "Orçamento em PDF" }).getByRole("button", { name: "Gerar orçamento geral" }).click();
    const documento = page.locator(".print-area");
    await expect(documento.getByRole("heading", { level: 1, name: nome })).toBeVisible();
    await expect(documento).toContainText("Tinta acrílica 18L");
    await expect(documento).toContainText("Pontos de tomada");
    await expect(documento).toContainText(reais("2.600,00"));
    await expect(documento).toContainText("Gerado com Pitangueira");
    await documento.getByRole("button", { name: /Fechar/ }).click();
    await expect(documento).toBeHidden();
  });

  await test.step("escreve o escopo e liga um pedido ao orçamento", async () => {
    // Só o arquiteto tem a aba Escopo
    await page.getByRole("tab", { name: "Escopo" }).click();
    await expect(page.getByRole("heading", { name: "Escopo do projeto" })).toBeVisible();

    await page.getByRole("button", { name: "+ Suíte" }).click();
    await expect(page.getByText("Suíte", { exact: true })).toBeVisible();

    await page.getByPlaceholder("Novo pedido do cliente e Enter").fill("Pintura de todo o apartamento");
    await page.getByPlaceholder("Novo pedido do cliente e Enter").press("Enter");
    const pedido = page.getByRole("listitem").filter({ hasText: "Pintura de todo o apartamento" });
    await expect(pedido).toBeVisible();
    await expect(pedido).toContainText("Pendente"); // ainda sem itens ligados

    await pedido.getByRole("button", { name: "Ligar a itens do orçamento" }).click();
    const dialogo = page.getByRole("dialog", { name: "Editar pedido" });
    await dialogo.getByRole("checkbox", { name: /Tinta acrílica 18L/ }).check();
    await dialogo.getByRole("button", { name: "Salvar pedido" }).click();
    await expect(dialogo).toBeHidden();

    // Com item ligado, a situação sai sozinha
    await expect(pedido).toContainText("No orçamento");
    await expect(pedido).toContainText("auto");
  });

  await test.step("volta à home: o projeto aparece com chave e prazo", async () => {
    await page.getByRole("tab", { name: "Resumo" }).click();
    await page.getByRole("button", { name: "Voltar ao painel" }).click();
    const cartao = page.getByRole("article").filter({ hasText: nome });
    await expect(cartao).toBeVisible();
    await expect(cartao).toContainText(`Chave ${chave}`);
    await expect(cartao).toContainText("No prazo");
    await expect(page.getByRole("region", { name: "Próximas entregas" })).toContainText(nome);
  });

  await test.step("copia o link para mandar ao cliente: só o endereço, sem a chave", async () => {
    const cartao = page.getByRole("article").filter({ hasText: nome });
    await cartao.getByRole("button", { name: "Copiar link" }).click();
    await expect(cartao.getByRole("button", { name: /Copiado/ })).toBeVisible();
    const copiado = await page.evaluate(() => navigator.clipboard.readText());
    expect(copiado).toBe(url);
    expect(copiado).not.toContain(chave);
    expect(copiado).not.toMatch(/c[óo]digo/i);
  });

  await test.step("o arquiteto sai e o cliente abre o link", async () => {
    await sair(page);
    await page.goto(url);
    await expect(page.getByRole("heading", { name: "Entre com o código do projeto" })).toBeVisible();
  });

  await test.step("chave errada não entra", async () => {
    await page.getByPlaceholder("ABC123").fill("ERRADO");
    await page.getByPlaceholder("Como devemos te chamar").fill("Ana");
    await page.getByRole("button", { name: "Entrar no projeto" }).click();
    await expect(page.getByText("Código incorreto para este projeto.")).toBeVisible();
  });

  await test.step("chave certa entra, e o cliente vê o orçamento mas não o escopo", async () => {
    await page.getByPlaceholder("ABC123").fill(chave);
    await page.getByRole("button", { name: "Entrar no projeto" }).click();
    await expect(page.getByRole("heading", { level: 1, name: nome })).toBeVisible();
    await expect(page.getByText(/cliente/i).first()).toBeVisible();

    const abas = page.getByRole("navigation", { name: "Seções do projeto" }).getByRole("tab");
    await expect(abas).toHaveText(["Resumo", "Itens", "Gráficos"]);
    await expect(page.getByRole("tab", { name: "Escopo" })).toHaveCount(0);

    // O prazo aparece, só para leitura
    const prazo = page.getByRole("region", { name: "Prazo do projeto" });
    await expect(prazo).toContainText(/Faltam \d+ dias/);
    await expect(prazo.getByRole("button", { name: /Registrar/ })).toHaveCount(0);

    // O orçamento aparece, sem nenhum botão de criar
    await page.getByRole("tab", { name: "Itens" }).click();
    await expect(page.getByRole("heading", { name: "Itens do orçamento" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Item", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Catálogo" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Composições" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Orçamento em PDF" })).toBeVisible();

    await page.getByPlaceholder(/Buscar serviço/).fill("Tinta");
    await expect(page.getByText("Tinta acrílica 18L")).toBeVisible();
  });

  await test.step("o cliente acompanha: marca o item como feito e pago", async () => {
    const linha = page.locator(".linha-hover").filter({ hasText: "Tinta acrílica 18L" });
    await linha.getByRole("button", { name: "Feito" }).click();
    await linha.getByRole("button", { name: "Pago" }).click();
    await expect(linha.getByRole("button", { name: "Feito" })).toHaveAttribute("aria-pressed", "true");
    await expect(linha.getByRole("button", { name: "Pago" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText(/50% concluído · 1 de 2 itens/)).toBeVisible();
  });

  expect(baseURL).toBeTruthy();
});
