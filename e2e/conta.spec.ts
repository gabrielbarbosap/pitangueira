import { expect, test, type Page } from "@playwright/test";
import { criarProjeto, entrarComoArquiteto, sair, semTutorial } from "./ajudas";

const linha = (page: Page, nome: string) => page.getByRole("region", { name: "Como você entra" }).getByRole("listitem").filter({ hasText: nome });

test("quem entra com Google cria uma senha e passa a entrar também com e-mail e senha, na mesma conta", async ({ page }) => {
  test.setTimeout(90_000);
  await semTutorial(page);
  await entrarComoArquiteto(page);
  await criarProjeto(page, "Casa do Lago");
  await page.goto("/"); // volta ao painel (a sessão do demo só existe na memória: entra de novo)
  await entrarComoArquiteto(page);

  await test.step("Minha conta mostra os jeitos de entrar", async () => {
    await page.getByRole("link", { name: /Minha conta/ }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Gabriel");
    await expect(linha(page, "Google")).toContainText("Ativo");
    await expect(linha(page, "E-mail e senha")).toContainText("Não ativado");
  });

  await test.step("criar a senha valida o tamanho e a confirmação", async () => {
    const f = page.getByRole("form", { name: "Criar senha" });
    await f.getByLabel("Nova senha").fill("123");
    await f.getByLabel("Repita a senha").fill("123");
    await f.getByRole("button", { name: "Criar senha" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "pelo menos 6 caracteres" })).toBeVisible();
    await f.getByLabel("Nova senha").fill("segredo123");
    await f.getByLabel("Repita a senha").fill("outra-coisa");
    await f.getByRole("button", { name: "Criar senha" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "As senhas não são iguais" })).toBeVisible();
    await f.getByLabel("Repita a senha").fill("segredo123");
    await f.getByRole("button", { name: "Criar senha" }).click();
    await expect(page.getByText(/Senha criada\. Agora você também pode entrar com e-mail e senha/)).toBeVisible();
    await expect(linha(page, "E-mail e senha")).toContainText("Ativo");
    await expect(page.getByRole("button", { name: "Enviar link para trocar a senha" })).toBeVisible();
  });

  await test.step("sai e volta com o e-mail e a senha: é a mesma conta, com o mesmo projeto", async () => {
    await page.getByRole("link", { name: "Voltar ao painel" }).click();
    await sair(page);
    await page.getByLabel("E-mail").fill("gabriel@sistemap.com.br");
    await page.getByLabel("Senha").fill("segredo123");
    await page.getByRole("form", { name: "Entrar" }).getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("heading", { name: "Olá, Gabriel." })).toBeVisible();
    await expect(page.locator("article").filter({ hasText: "Casa do Lago" })).toHaveCount(1);
  });
});

test("quem criou conta com e-mail e senha vincula o Google", async ({ page }) => {
  test.setTimeout(60_000);
  await semTutorial(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await page.getByLabel("Seu nome").fill("Marina Alves");
  await page.getByLabel("E-mail").fill("marina@teste.com");
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("form", { name: "Criar conta" }).getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByRole("heading", { name: "Olá, Marina." })).toBeVisible();

  await page.getByRole("link", { name: /Minha conta/ }).click();
  await expect(linha(page, "E-mail e senha")).toContainText("Ativo");
  await expect(linha(page, "Google")).toContainText("Não ativado");
  await page.getByRole("button", { name: "Vincular Google" }).click();
  await expect(page.getByText(/Google vinculado/)).toBeVisible();
  await expect(linha(page, "Google")).toContainText("Ativo");
  await expect(page.getByRole("button", { name: "Vincular Google" })).toHaveCount(0);
});

test("Minha conta é só para arquitetos logados", async ({ page }) => {
  await semTutorial(page);
  await page.goto("/conta");
  await expect(page.getByText("Minha conta é só para arquitetos.")).toBeVisible();
});
