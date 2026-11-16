import { expect, test } from "@playwright/test";
import { entrarComoArquiteto, semTutorial } from "./ajudas";

test("o catálogo do design system abre e mostra os componentes padrão", async ({ page }) => {
  const erros: string[] = [];
  page.on("pageerror", (e) => erros.push(e.message));
  await page.goto("/design");
  await expect(page.getByRole("heading", { level: 1, name: "Papel, tinta e pitanga" })).toBeVisible();
  for (const nome of ["Cores", "Tipografia", "Botões", "Campos", "Chips e selos", "Alertas", "Checklist de tela nova"]) {
    await expect(page.getByRole("heading", { level: 2, name: nome })).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "Criar projeto" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Editar item" })).toBeVisible(); // BotaoIcone com rótulo acessível
  await expect(page.getByRole("alert").filter({ hasText: "Não consegui registrar agora" })).toBeVisible();
  expect(erros).toEqual([]);
});

test("as classes do design system estão valendo no app (campos e topo)", async ({ page }) => {
  await semTutorial(page);
  await entrarComoArquiteto(page);
  // Topo laranja: botões redondos e pílulas de atalho
  const redondo = page.getByRole("button", { name: "Ver o tutorial" });
  expect(await redondo.evaluate((e) => getComputedStyle(e).width)).toBe("40px");
  expect(await redondo.evaluate((e) => getComputedStyle(e).borderRadius)).toMatch(/9999px|3.35544e\+07px/);
  const pilula = page.getByRole("button", { name: "Meu catálogo" });
  expect(await pilula.evaluate((e) => getComputedStyle(e).textTransform)).toBe("uppercase");

  // Campo padrão numa janela
  await page.getByRole("button", { name: "Novo projeto" }).click();
  const campo = page.getByRole("dialog", { name: "Novo projeto" }).getByLabel("Nome do projeto");
  const estilo = await campo.evaluate((e) => {
    const s = getComputedStyle(e);
    return { raio: s.borderRadius, borda: s.borderTopWidth, fundo: s.backgroundColor, pad: s.paddingTop };
  });
  expect(estilo).toEqual({ raio: "14px", borda: "1px", fundo: "rgb(255, 255, 255)", pad: "10px" });
  await campo.focus();
  await expect.poll(() => campo.evaluate((e) => getComputedStyle(e).boxShadow)).toContain("rgba(210, 58, 31, 0.15)"); // anel de foco laranja
});
