import { expect, test } from "@playwright/test";
import { entrarComoArquiteto, sair } from "./ajudas";

/** O arquiteto novo é recebido por um tutorial na home, que só abre sozinho na primeira vez. */
test("o tutorial abre na primeira visita, pode ser pulado e volta pelo botão ?", async ({ page }) => {
  await entrarComoArquiteto(page);

  const tutorial = page.getByRole("dialog", { name: "Bem-vindo à Pitangueira" });
  await expect(tutorial).toBeVisible();
  await expect(tutorial).toContainText("Tutorial · 1 de");

  await tutorial.getByRole("button", { name: "Próximo" }).click();
  await expect(page.getByRole("dialog", { name: "Comece por aqui" })).toBeVisible();

  await page.getByRole("dialog", { name: "Comece por aqui" }).getByRole("button", { name: "Pular" }).click();
  await expect(page.getByRole("dialog", { name: "Comece por aqui" })).toBeHidden();

  // Já visto: ao entrar de novo, não abre sozinho
  await sair(page);
  await page.getByRole("button", { name: /entrar com google/i }).click();
  await expect(page.getByText(/Modo demo/)).toBeVisible();
  await expect(page.locator("#tour-titulo")).toHaveCount(0);

  // Mas dá para rever quando quiser
  await page.getByRole("button", { name: "Ver o tutorial" }).click();
  await expect(page.getByRole("dialog", { name: "Bem-vindo à Pitangueira" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#tour-titulo")).toHaveCount(0);
});
