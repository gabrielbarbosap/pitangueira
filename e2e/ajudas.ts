import { expect, type Page } from "@playwright/test";

/** Os tutoriais abrem sozinhos na primeira visita. Os fluxos de negócio os marcam como vistos para não atrapalhar. */
const TUTORIAIS = ["painel", "projeto", "projeto-cliente"];

export async function semTutorial(page: Page) {
  await page.addInitScript((chaves) => {
    for (const c of chaves) localStorage.setItem(`pitangueira:tour:${c}:v1`, "1");
  }, TUTORIAIS);
}

/** Entra no modo demo como arquiteto (no demo o botão do Google entra direto). */
export async function entrarComoArquiteto(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /entrar com google/i }).click();
  await expect(page.getByText(/Modo demo/)).toBeVisible();
}

/**
 * Sai da conta. Na home, volta ao login; dentro de um projeto, volta à tela de código do projeto
 * (o login só existe na home). Os dois contam como "saiu".
 */
export async function sair(page: Page) {
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(
    page.getByRole("button", { name: /entrar com google/i }).or(page.getByRole("heading", { name: "Entre com o código do projeto" })),
  ).toBeVisible();
}

export interface ProjetoCriado {
  nome: string;
  chave: string;
  /** Endereço da tela do projeto (é o que o arquiteto manda ao cliente). */
  url: string;
}

/** "Novo projeto" do zero. Devolve o endereço e a chave gerada, que o arquiteto passa ao cliente. */
export async function criarProjeto(page: Page, nome: string, teto?: number): Promise<ProjetoCriado> {
  await page.getByRole("button", { name: "Novo projeto" }).click();
  const dialogo = page.getByRole("dialog", { name: "Novo projeto" });
  await dialogo.getByLabel("Nome do projeto").fill(nome);
  if (teto) await dialogo.getByLabel("Orçamento disponível").fill(String(teto));
  const chave = await dialogo.getByLabel("Chave de acesso").inputValue();
  expect(chave).toMatch(/^[A-Z0-9]{6}$/);
  await dialogo.getByRole("button", { name: "Criar projeto" }).click();
  await page.waitForURL(/\/obra\//);
  await expect(page.getByRole("heading", { level: 1, name: nome })).toBeVisible();
  return { nome, chave, url: page.url() };
}

/** Registra o prazo original (6 meses a partir de hoje) pelo cartão de prazo do Resumo. */
export async function registrarPrazoOriginal(page: Page, meses = 6) {
  await page.getByRole("tab", { name: "Resumo" }).click();
  await page.getByRole("button", { name: "Registrar previsão inicial" }).click();
  const dialogo = page.getByRole("dialog", { name: "Previsão inicial do prazo" });
  await dialogo.getByLabel("Duração prevista").fill(String(meses));
  await dialogo.getByRole("checkbox").check();
  await dialogo.getByRole("button", { name: "Registrar prazo original" }).click();
  await expect(dialogo).toBeHidden();
}

export interface NovoItem {
  etapa: string;
  descricao: string;
  quantidade: number;
  unitario: number;
}

/** Adiciona um item ao orçamento pela aba Itens (o primeiro item usa o botão do estado vazio). */
export async function adicionarItem(page: Page, item: NovoItem) {
  await page.getByRole("tab", { name: "Itens" }).click();
  const primeiro = page.getByRole("button", { name: /Adicionar primeiro item/ });
  if (await primeiro.isVisible()) await primeiro.click();
  else await page.getByRole("button", { name: "Item", exact: true }).click();

  const dialogo = page.getByRole("dialog", { name: "Novo item" });
  await dialogo.getByPlaceholder("Ex.: Pintura").fill(item.etapa);
  await dialogo.getByPlaceholder("Ex.: Tinta acrílica 18L").fill(item.descricao);
  await dialogo.getByLabel("Quantidade").fill(String(item.quantidade));
  await dialogo.getByLabel("Valor unitário").fill(String(item.unitario));
  await dialogo.getByRole("button", { name: "Adicionar item" }).click();
  await expect(dialogo).toBeHidden();
}

/** Marca um item como feito e/ou pago pela aba Itens (a busca abre a etapa dele). A data fica registrada no momento. */
export async function marcarItem(page: Page, descricao: string, marcas: { feito?: boolean; pago?: boolean }) {
  await page.getByRole("tab", { name: "Itens" }).click();
  const busca = page.getByPlaceholder(/Buscar serviço/);
  await busca.fill(descricao);
  const linha = page.locator(".linha-hover").filter({ hasText: descricao });
  if (marcas.feito) await linha.getByRole("button", { name: "Feito" }).click();
  if (marcas.pago) await linha.getByRole("button", { name: "Pago" }).click();
  await busca.fill("");
}

/** "R$ 2.600,00" com o espaço que o navegador usa (não quebrável): aceita qualquer espaço. */
export const reais = (valor: string) => new RegExp(`R\\$\\s*${valor.replace(/\./g, "\\.")}`);
