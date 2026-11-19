import { expect, test } from "@playwright/test";
import { sair, semTutorial } from "./ajudas";

/** No modo demo o link do e-mail é /acao?mode=resetPassword&oobCode=demo:<e-mail> (não há e-mail de verdade). */
test("o link de recuperação abre a página da Pitangueira e troca a senha", async ({ page }) => {
  test.setTimeout(90_000);
  await semTutorial(page);

  await test.step("uma conta de e-mail e senha existe", async () => {
    await page.goto("/");
    await page.getByRole("button", { name: "Criar conta", exact: true }).click();
    await page.getByLabel("Seu nome").fill("Marina Alves");
    await page.getByLabel("E-mail").fill("marina@teste.com");
    await page.getByLabel("Senha").fill("senha-antiga");
    await page.getByRole("form", { name: "Criar conta" }).getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByRole("heading", { name: "Olá, Marina." })).toBeVisible();
  });
  await sair(page);

  await test.step("o link mostra para qual conta é e valida a nova senha", async () => {
    await page.goto("/acao?mode=resetPassword&oobCode=demo:marina@teste.com");
    const f = page.getByRole("form", { name: "Criar nova senha" });
    await expect(f).toBeVisible();
    await expect(page.getByText("marina@teste.com")).toBeVisible();
    await f.getByLabel("Nova senha").fill("123");
    await f.getByLabel("Repita a senha").fill("123");
    await f.getByRole("button", { name: "Salvar nova senha" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "pelo menos 6 caracteres" })).toBeVisible();
    await f.getByLabel("Nova senha").fill("senha-nova-123");
    await f.getByLabel("Repita a senha").fill("outra-coisa");
    await f.getByRole("button", { name: "Salvar nova senha" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "As senhas não são iguais" })).toBeVisible();
    await f.getByLabel("Repita a senha").fill("senha-nova-123");
    await f.getByRole("button", { name: "Salvar nova senha" }).click();
  });

  await test.step("a senha é trocada e a pessoa já entra no painel", async () => {
    await expect(page.getByRole("heading", { name: "Senha alterada" })).toBeVisible();
    await page.getByRole("link", { name: "Ir para o painel" }).click();
    await expect(page.getByRole("heading", { name: "Olá, Marina." })).toBeVisible();
  });
  await sair(page);

  await test.step("a senha antiga não vale mais; a nova vale", async () => {
    await page.getByLabel("E-mail").fill("marina@teste.com");
    await page.getByLabel("Senha").fill("senha-antiga");
    await page.getByRole("form", { name: "Entrar" }).getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "E-mail ou senha incorretos" })).toBeVisible();
    await page.getByLabel("Senha").fill("senha-nova-123");
    await page.getByRole("form", { name: "Entrar" }).getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("heading", { name: "Olá, Marina." })).toBeVisible();
  });
});

test("links vencidos, sem código ou desconhecidos mostram uma mensagem clara", async ({ page }) => {
  await semTutorial(page);
  for (const url of ["/acao?mode=resetPassword&oobCode=demo:ninguem@teste.com", "/acao?mode=resetPassword"]) {
    await page.goto(url);
    await expect(page.getByRole("alert").filter({ hasText: "expirou ou já foi usado" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Voltar ao início" })).toBeVisible();
  }
  await page.goto("/acao");
  await expect(page.getByRole("alert").filter({ hasText: "Este link não é válido" })).toBeVisible();
});

test("o link de confirmação de e-mail mostra que deu certo", async ({ page }) => {
  await semTutorial(page);
  await page.goto("/acao?mode=verifyEmail&oobCode=qualquer");
  await expect(page.getByRole("heading", { name: "E-mail confirmado" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ir para o painel" })).toBeVisible();
});
