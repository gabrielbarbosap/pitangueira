import { expect, test, type Page } from "@playwright/test";
import { sair, semTutorial } from "./ajudas";

const form = (page: Page, nome: string) => page.getByRole("form", { name: nome });

test("o arquiteto cria conta, sai e volta com e-mail e senha (e o Google continua lá)", async ({ page }) => {
  test.setTimeout(90_000);
  await semTutorial(page);
  await page.goto("/");
  await expect(page.getByRole("button", { name: /entrar com google/i })).toBeVisible();

  await test.step("a tela oferece entrar com e-mail, criar conta e recuperar a senha", async () => {
    await expect(form(page, "Entrar")).toBeVisible();
    await page.getByRole("button", { name: "Criar conta", exact: true }).click();
    await expect(form(page, "Criar conta")).toBeVisible();
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await page.getByRole("button", { name: "Esqueci a senha" }).click();
    await expect(form(page, "Recuperar a senha")).toBeVisible();
    await page.getByLabel("E-mail").fill("marina@teste.com");
    await form(page, "Recuperar a senha").getByRole("button", { name: "Enviar o link" }).click();
    await expect(page.getByText(/No modo demo não enviamos e-mails/)).toBeVisible();
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
  });

  await test.step("criar conta valida nome, e-mail e senha", async () => {
    await page.getByRole("button", { name: "Criar conta", exact: true }).click();
    const f = form(page, "Criar conta");
    await f.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Diga como devemos te chamar" })).toBeVisible();
    await page.getByLabel("Seu nome").fill("Marina Alves");
    await page.getByLabel("E-mail").fill("isso-nao-e-email");
    await f.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "não parece válido" })).toBeVisible();
    await page.getByLabel("E-mail").fill("marina@teste.com");
    await page.getByLabel("Senha").fill("123");
    await f.getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "pelo menos 6 caracteres" })).toBeVisible();
  });

  await test.step("com os dados certos a conta é criada e a pessoa já entra no painel", async () => {
    await page.getByLabel("Senha").fill("segredo123");
    await form(page, "Criar conta").getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByText("Olá, Marina.")).toBeVisible();
  });

  await sair(page);

  await test.step("senha errada não entra; a certa entra", async () => {
    await page.getByLabel("E-mail").fill("marina@teste.com");
    await page.getByLabel("Senha").fill("senha-errada");
    await form(page, "Entrar").getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "E-mail ou senha incorretos" })).toBeVisible();
    await page.getByRole("button", { name: "Mostrar" }).click(); // ver a senha digitada
    await expect(page.getByLabel("Senha")).toHaveAttribute("type", "text");
    await page.getByLabel("Senha").fill("segredo123");
    await form(page, "Entrar").getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("Olá, Marina.")).toBeVisible();
  });

  await sair(page);

  await test.step("e-mail repetido não cria outra conta", async () => {
    await page.getByRole("button", { name: "Criar conta", exact: true }).click();
    await page.getByLabel("Seu nome").fill("Outra Pessoa");
    await page.getByLabel("E-mail").fill("MARINA@teste.com"); // maiúsculas não importam
    await page.getByLabel("Senha").fill("outrasenha1");
    await form(page, "Criar conta").getByRole("button", { name: "Criar conta" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Já existe uma conta com este e-mail" })).toBeVisible();
  });
});

test("o acesso do cliente continua pelo link e código, sem e-mail", async ({ page }) => {
  await semTutorial(page);
  await page.goto("/");
  // A tela inicial é do arquiteto; o cliente entra pelo link do projeto (a tela de código não pede e-mail nem senha).
  await expect(page.getByLabel("Senha")).toBeVisible();
  await page.goto("/obra/qualquer-id");
  await expect(page.getByRole("heading", { name: "Entre com o código do projeto" })).toBeVisible();
  await expect(page.getByLabel("Senha")).toHaveCount(0);
});
