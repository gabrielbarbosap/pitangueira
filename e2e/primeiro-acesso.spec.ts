import { expect, test, type Page } from "@playwright/test";
import { entrarComoArquiteto, sair } from "./ajudas";

/** Só o tutorial da home fica de fora: a escolha do catálogo do primeiro acesso é justamente o que se testa aqui. */
async function semSoOTutorial(page: Page) {
  await page.addInitScript(() => {
    for (const c of ["painel", "projeto", "projeto-cliente"]) localStorage.setItem(`pitangueira:tour:${c}:v1`, "1");
  });
}

const dialogo = (page: Page) => page.getByRole("dialog", { name: "Bem-vindo! Monte o seu catálogo" });

async function criarContaEEntrar(page: Page, nome: string, email: string) {
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await page.getByLabel("Seu nome").fill(nome);
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("segredo123");
  await page.getByRole("form", { name: "Criar conta" }).getByRole("button", { name: "Criar conta" }).click();
  await expect(page.getByRole("heading", { name: `Olá, ${nome}.` })).toBeVisible();
}

test("no primeiro acesso o arquiteto escolhe o catálogo pronto (cópia só dele)", async ({ page }) => {
  test.setTimeout(90_000);
  await semSoOTutorial(page);
  await entrarComoArquiteto(page);

  await expect(dialogo(page)).toBeVisible();
  await expect(dialogo(page)).toContainText("referências aproximadas");

  // Desmarca uma etapa e confere o contador do botão.
  const botao = dialogo(page).getByRole("button", { name: /^Adicionar \d+ itens ao meu catálogo$/ });
  const antes = Number((await botao.textContent())!.match(/\d+/)![0]);
  await dialogo(page).getByRole("checkbox", { name: "Etapa Pintura" }).uncheck();
  const depois = Number((await dialogo(page).getByRole("button", { name: /^Adicionar \d+ itens ao meu catálogo$/ }).textContent())!.match(/\d+/)![0]);
  expect(depois).toBe(antes - 6);

  await dialogo(page).getByRole("button", { name: /^Adicionar \d+ itens ao meu catálogo$/ }).click();
  await expect(dialogo(page)).toBeHidden();

  await page.getByRole("button", { name: /Meu catálogo/ }).click();
  const cat = page.getByRole("dialog", { name: /Meu catálogo/ });
  await expect(cat).toContainText("Assentamento de porcelanato");
  await expect(cat).not.toContainText("Pintura acrílica (2 demãos)"); // a etapa desmarcada não veio
});

test("começar do zero fecha a janela e ela não volta", async ({ page }) => {
  test.setTimeout(90_000);
  await semSoOTutorial(page);
  await entrarComoArquiteto(page);
  await dialogo(page).getByRole("button", { name: "Criar os meus itens do zero" }).click();
  await expect(dialogo(page)).toBeHidden();
  await expect(page.getByRole("button", { name: /Meu catálogo/ })).toContainText("Seus itens e preços");

  await sair(page);
  await page.getByRole("button", { name: /entrar com google/i }).click();
  await expect(page.getByText(/Modo demo/)).toBeVisible();
  await expect(dialogo(page)).toBeHidden();

  // Mais tarde dá para pegar o catálogo pronto pelo "Meu catálogo" vazio.
  await page.getByRole("button", { name: /Meu catálogo/ }).click();
  await page.getByRole("button", { name: "Ou use o catálogo pronto de reforma" }).click();
  await page.getByRole("dialog", { name: "Catálogo pronto" }).getByRole("button", { name: /^Adicionar \d+ itens ao meu catálogo$/ }).click();
  await expect(page.getByRole("dialog", { name: /Meu catálogo/ })).toContainText("Chuveiro");
});

test("cada arquiteto tem o seu catálogo: mudar um valor não aparece para o outro", async ({ page }) => {
  test.setTimeout(120_000);
  await semSoOTutorial(page);
  await page.goto("/");
  await criarContaEEntrar(page, "Ana", "ana@teste.com");
  await dialogo(page).getByRole("button", { name: /^Adicionar \d+ itens ao meu catálogo$/ }).click();

  // A Ana muda o valor do chuveiro no catálogo dela.
  await page.getByRole("button", { name: /Meu catálogo/ }).click();
  const cat = page.getByRole("dialog", { name: /Meu catálogo/ });
  await cat.getByRole("button", { name: "Editar Chuveiro" }).click();
  await cat.getByText("Valor unit. (R$)", { exact: true }).locator("..").getByRole("spinbutton").fill("999");
  await cat.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(cat).toContainText("999,00");
  await cat.getByRole("button", { name: "Fechar" }).click();
  await sair(page);

  // O Bruno entra: não vê nada da Ana, recebe a própria cópia, com o valor de referência.
  await criarContaEEntrar(page, "Bruno", "bruno@teste.com");
  await expect(dialogo(page)).toBeVisible();
  await expect(page.getByRole("button", { name: /Meu catálogo/ })).toContainText("Seus itens e preços"); // catálogo vazio
  await dialogo(page).getByRole("button", { name: /^Adicionar \d+ itens ao meu catálogo$/ }).click();
  await page.getByRole("button", { name: /Meu catálogo/ }).click();
  const catB = page.getByRole("dialog", { name: /Meu catálogo/ });
  await expect(catB).toContainText("Chuveiro");
  await expect(catB).not.toContainText("999,00");
});
