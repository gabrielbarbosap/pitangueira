import { expect, test } from "@playwright/test";
import { entrarComoArquiteto, semTutorial } from "./ajudas";

test("os atalhos da home são cartões grandes e abrem o que prometem", async ({ page }) => {
  test.setTimeout(60_000);
  await semTutorial(page);
  await entrarComoArquiteto(page);
  const atalhos = page.getByRole("region", { name: "Atalhos" });
  await expect(atalhos).toBeVisible();

  for (const nome of [/Meu catálogo/, /Composições/, /Fornecedores/, /Financeiro/, /Minha conta/, /Documentação/]) {
    const el = atalhos.getByRole(nome.source.startsWith("Meu") || nome.source.startsWith("Compos") || nome.source.startsWith("Fornec") ? "button" : "link", { name: nome });
    await expect(el).toBeVisible();
    expect((await el.boundingBox())!.height).toBeGreaterThanOrEqual(64);
  }
  await expect(atalhos.getByRole("link", { name: /Documentação/ })).toHaveAttribute("href", "/docs");

  await atalhos.getByRole("button", { name: /Fornecedores/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");

  await atalhos.getByRole("link", { name: /Financeiro/ }).click();
  await expect(page).toHaveURL(/\/financeiro/);
});
