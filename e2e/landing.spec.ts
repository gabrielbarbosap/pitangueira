import { expect, test } from "@playwright/test";

test("a home de quem não entrou vende o produto e leva ao login", async ({ page }) => {
  const erros: string[] = [];
  page.on("pageerror", (e) => erros.push(e.message));
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Largue a planilha");
  for (const id of ["recursos", "para-quem", "como-funciona", "perguntas", "entrar"]) await expect(page.locator("#" + id)).toBeAttached();
  // Menu do topo com a documentação (no celular, dentro do menu).
  if (!(await page.getByRole("button", { name: "Abrir o menu" }).isVisible())) await expect(page.getByRole("navigation", { name: "Seções" }).getByRole("link", { name: "Documentação" })).toHaveAttribute("href", "/docs");
  await expect(page.getByRole("heading", { name: /Planilha e papel/ })).toBeVisible(); // a virada, logo depois do herói
  await expect(page.getByRole("heading", { name: /não precisa criar conta/ })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Uma obra ou dez/ })).toBeVisible(); // várias obras
  await expect(page.getByRole("heading", { name: /a Pitangueira é para você/ })).toBeVisible();
  for (const perfil of ["Arquitetos", "Engenheiros", "Mestres de obra"]) await expect(page.getByRole("list", { name: "Quem usa" })).toContainText(perfil);

  // Os prints do sistema carregam (nenhuma imagem quebrada).
  await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 700) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } });
  const quebradas = await page.$$eval("figure img", (imgs) => imgs.filter((i) => !(i as HTMLImageElement).complete || (i as HTMLImageElement).naturalWidth === 0).length);
  expect(quebradas).toBe(0);

  // "Começar agora" leva ao login, que continua na página.
  await page.getByRole("link", { name: "Começar agora" }).first().click();
  await expect(page.getByRole("button", { name: /entrar com google/i })).toBeInViewport();
  await expect(page.getByRole("button", { name: "Criar conta" })).toBeVisible();

  // Sem rolagem horizontal (nem no celular).
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(erros).toEqual([]);
});

test("o login pela landing leva ao painel (modo demo)", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /entrar com google/i }).click();
  await expect(page.getByText(/Modo demo/)).toBeVisible();
  await expect(page.getByRole("region", { name: "Atalhos" })).toBeVisible();
});

test("no celular: menu do topo e barra fixa de “Começar agora”", async ({ page }, info) => {
  test.skip(info.project.name !== "celular", "só no celular");
  await page.goto("/");
  await page.getByRole("button", { name: /entrar com google/i }).waitFor();
  const barra = page.locator("div.fixed", { hasText: "Começar agora" });

  // No topo a barra não aparece; depois de rolar, aparece.
  await expect.poll(async () => (await barra.boundingBox())!.y - (await page.evaluate(() => window.innerHeight))).toBeGreaterThan(-5);
  await page.evaluate(() => window.scrollTo(0, 1500));
  await expect.poll(async () => (await barra.boundingBox())!.y - (await page.evaluate(() => window.innerHeight))).toBeLessThan(-40);

  // Menu: abre, leva à seção e fecha.
  await page.getByRole("button", { name: "Abrir o menu" }).click();
  await expect(page.getByRole("navigation", { name: "Seções" }).getByRole("link", { name: "Documentação" })).toHaveAttribute("href", "/docs");
  await page.getByRole("navigation", { name: "Seções" }).getByRole("link", { name: "Dúvidas" }).click();
  await expect(page.getByRole("navigation", { name: "Seções" })).toBeHidden();
  await expect(page.getByRole("heading", { name: "Perguntas frequentes" })).toBeInViewport();

  // A barra leva ao login (e some quando o login está na tela).
  await page.locator("div.fixed").getByRole("link", { name: "Começar agora" }).click();
  await expect(page.getByRole("button", { name: /entrar com google/i })).toBeInViewport();
});
