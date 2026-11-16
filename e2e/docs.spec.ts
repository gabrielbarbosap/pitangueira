import { expect, test } from "@playwright/test";
import { entrarComoArquiteto, semTutorial } from "./ajudas";

/** A documentação é pública (sem login) e precisa abrir inteira, em computador e em celular. */
test("a documentação abre, tem busca e todas as páginas carregam", async ({ page }, info) => {
  test.slow();
  const erros: string[] = [];
  page.on("pageerror", (e) => erros.push(e.message));
  page.on("console", (m) => m.type() === "error" && erros.push(m.text()));

  await page.goto("/docs");
  await expect(page.getByRole("heading", { level: 1, name: "Aprenda a usar a Pitangueira" })).toBeVisible();

  // Pega todas as páginas listadas na home da documentação
  const links = await page.locator('main a[href^="/docs/"]').evaluateAll((els) => [...new Set(els.map((e) => (e as HTMLAnchorElement).getAttribute("href")!))]);
  expect(links.length).toBeGreaterThanOrEqual(15);

  for (const href of links) {
    await page.goto(href);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("article section h2").first()).toBeVisible();
  }

  await test.step("a busca do menu filtra as páginas", async () => {
    await page.goto("/docs/introducao");
    if (info.project.name === "celular") await page.getByRole("button", { name: /Índice da documentação/ }).click();
    const menu = page.getByRole("navigation", { name: "Páginas da documentação" }).filter({ visible: true });
    await menu.getByLabel("Buscar na documentação").fill("relatorio");
    await expect(menu.getByRole("link", { name: "Relatório mensal de andamento" })).toBeVisible();
    await expect(menu.getByRole("link", { name: "Glossário" })).toHaveCount(0);
    await menu.getByLabel("Buscar na documentação").fill("zzzz");
    await expect(menu.getByText(/Nada encontrado/)).toBeVisible();
  });

  await test.step("anterior e próxima levam às páginas vizinhas", async () => {
    await page.goto("/docs/primeiros-passos");
    await page.getByRole("link", { name: /Próxima/ }).click();
    await expect(page).toHaveURL(/\/docs\/entrar-e-acessos$/);
  });

  expect(erros, erros.join("\n")).toEqual([]);
});

test("o app tem atalhos para a documentação", async ({ page }) => {
  await semTutorial(page);
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Veja a documentação" })).toHaveAttribute("href", "/docs");
  await entrarComoArquiteto(page);
  await expect(page.getByRole("link", { name: "Documentação" })).toHaveAttribute("href", "/docs");
});
