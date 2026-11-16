import { expect, test } from "@playwright/test";
import { criarProjeto, entrarComoArquiteto, reais, sair, semTutorial } from "./ajudas";

/** Montar o orçamento deve ser rápido: começar por etapa, lançar vários itens em sequência, colar de planilha. */
test("o arquiteto monta o orçamento rápido: etapas, itens em sequência e planilha", async ({ page }) => {
  test.slow();
  await semTutorial(page);
  await entrarComoArquiteto(page);
  const projeto = await criarProjeto(page, "Casa do Lago");
  await page.getByRole("tab", { name: "Itens" }).click();

  await test.step("o projeto vazio oferece três caminhos e atalhos de etapa", async () => {
    await expect(page.getByRole("button", { name: /Adicionar primeiro item/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Colar da planilha/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Usar meu catálogo/ })).toBeVisible();
    await page.getByRole("button", { name: "Pintura", exact: true }).click();
    const dialogo = page.getByRole("dialog", { name: "Novo item" });
    await expect(dialogo.getByPlaceholder("Ex.: Pintura")).toHaveValue("Pintura"); // a etapa já vem preenchida
  });

  const dialogo = page.getByRole("dialog", { name: "Novo item" });

  await test.step("o total do item é calculado e a janela fica enxuta (detalhes recolhidos)", async () => {
    await expect(dialogo.getByPlaceholder("Ex.: Cozinha")).toHaveCount(0);
    await dialogo.getByPlaceholder("Ex.: Tinta acrílica 18L").fill("Tinta acrílica 18L");
    await dialogo.getByLabel("Quantidade").fill("4");
    await dialogo.getByLabel("Valor unitário").fill("350");
    await expect(dialogo.getByLabel("Valor orçado")).toHaveValue("1400");
  });

  await test.step("adicionar e lançar outro mantém a etapa e limpa o resto", async () => {
    await dialogo.getByRole("button", { name: "Adicionar e lançar outro" }).click();
    await expect(dialogo.getByRole("status")).toContainText("“Tinta acrílica 18L” adicionado");
    await expect(dialogo.getByPlaceholder("Ex.: Pintura")).toHaveValue("Pintura");
    await expect(dialogo.getByPlaceholder("Ex.: Tinta acrílica 18L")).toHaveValue("");
    await dialogo.getByPlaceholder("Ex.: Tinta acrílica 18L").fill("Rolo de lã");
    await dialogo.getByLabel("Quantidade").fill("2");
    await dialogo.getByLabel("Valor unitário").fill("25");
    await dialogo.getByRole("button", { name: "Adicionar e lançar outro" }).click();
    await expect(dialogo.getByText("2 itens lançados nesta janela")).toBeVisible();
    await dialogo.getByRole("button", { name: "Mais detalhes" }).click();
    await expect(dialogo.getByPlaceholder("Ex.: Cozinha")).toBeVisible();
    await dialogo.getByRole("button", { name: "Cancelar" }).or(dialogo.getByRole("button", { name: "Fechar" })).first().click();
    await expect(dialogo).toBeHidden();
  });

  await test.step("o total do orçamento aparece sempre à vista", async () => {
    const barra = page.getByRole("region", { name: "Resumo do orçamento" });
    await expect(barra).toContainText(reais("1.450,00"));
    await expect(barra).toContainText("2 itens · 1 etapa");
  });

  await test.step("o + de uma etapa abre o novo item já nela", async () => {
    await page.getByRole("button", { name: "Adicionar item em Pintura" }).click();
    await expect(page.getByRole("dialog", { name: "Novo item" }).getByPlaceholder("Ex.: Pintura")).toHaveValue("Pintura");
    await page.getByRole("dialog", { name: "Novo item" }).getByRole("button", { name: "Fechar" }).click();
  });

  await test.step("colar da planilha: o app mostra como entendeu e só então importa", async () => {
    await page.getByRole("button", { name: "Colar da planilha" }).click();
    const janela = page.getByRole("dialog", { name: "Colar da planilha" });
    await expect(janela.getByRole("button", { name: "Importar" })).toBeDisabled();
    await janela.getByLabel("Cole as linhas aqui").fill(
      "Etapa;Descrição;Qtd;Unid;Valor unit.\nElétrica;Pontos de tomada;10;un;R$ 120,00\nElétrica;Quadro de luz;1;un;1.500,50\nAlvenaria;Verba de limpeza;;;",
    );
    await expect(janela.getByText("3 itens", { exact: true })).toBeVisible();
    await expect(janela.getByText("1 sem valor")).toBeVisible();
    await expect(janela.getByText("títulos reconhecidos")).toBeVisible();
    await expect(janela.getByRole("table")).toContainText("Quadro de luz");
    await janela.getByRole("button", { name: "Importar 3 itens" }).click();
    await expect(janela).toBeHidden();
  });

  await test.step("os itens importados entram, e o item sem valor é sinalizado", async () => {
    const barra = page.getByRole("region", { name: "Resumo do orçamento" });
    await expect(barra).toContainText(reais("4.150,50")); // 1.450 + 1.200 + 1.500,50
    await expect(barra).toContainText("5 itens · 3 etapas");
    await expect(barra).toContainText("1 item sem valor");
    await page.getByPlaceholder(/Buscar serviço/).fill("limpeza");
    await expect(page.getByText("Sem valor", { exact: true })).toBeVisible();
    await page.getByPlaceholder(/Buscar serviço/).fill("");
  });

  await test.step("o cliente não vê as ferramentas de montar o orçamento", async () => {
    await sair(page);
    await page.goto(projeto.url);
    await page.getByPlaceholder("ABC123").fill(projeto.chave);
    await page.getByPlaceholder("Como devemos te chamar").fill("Cliente Teste");
    await page.getByRole("button", { name: "Entrar no projeto" }).click();
    await page.getByRole("tab", { name: "Itens" }).click();
    await expect(page.getByRole("region", { name: "Resumo do orçamento" })).toContainText(reais("4.150,50")); // o total ele vê
    await expect(page.getByRole("button", { name: "Colar da planilha" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Adicionar item em/ })).toHaveCount(0);
  });
});
