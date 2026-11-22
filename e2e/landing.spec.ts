import { expect, test } from "@playwright/test";

test("a home de quem não entrou vende o produto e leva ao login", async ({ page }) => {
  const erros: string[] = [];
  page.on("pageerror", (e) => erros.push(e.message));
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Largue a planilha");
  for (const id of ["recursos", "para-quem", "como-funciona", "perguntas", "entrar"]) await expect(page.locator("#" + id)).toBeAttached();
  await expect(page.getByRole("heading", { name: /Planilha e papel/ })).toBeVisible(); // a virada, logo depois do herói
  await expect(page.getByRole("heading", { name: /não precisa criar conta/ })).toBeVisible();
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
