import { expect, test, type Page } from "@playwright/test";
import { criarProjeto, entrarComoArquiteto, semTutorial } from "./ajudas";

/** Monta um projeto com itens de sobra (vários, para o PDF ter mais de uma página) e abre o orçamento em PDF. */
async function abrirOrcamento(page: Page) {
  await semTutorial(page);
  await entrarComoArquiteto(page);
  const projeto = await criarProjeto(page, "Casa do Lago");
  await page.getByRole("tab", { name: "Itens" }).click();
  await page.getByRole("button", { name: /Colar da planilha/ }).click();
  const linhas = Array.from({ length: 70 }, (_, i) => `Etapa ${1 + (i % 5)};Serviço de teste número ${i + 1};${i + 1};un;${100 + i}`).join("\n");
  const j = page.getByRole("dialog", { name: "Colar da planilha" });
  await j.getByLabel("Cole as linhas aqui").fill(linhas);
  await j.getByRole("button", { name: "Importar 70 itens" }).click();
  await expect(j).toBeHidden();
  await page.getByRole("button", { name: "Orçamento em PDF" }).click();
  await page.getByRole("dialog", { name: "Orçamento em PDF" }).getByRole("button", { name: "Gerar orçamento geral" }).click();
  await expect(page.locator(".print-area")).toContainText("Serviço de teste número 70");
  return projeto;
}

test("no celular, o PDF vai pela folha de compartilhamento do aparelho, com texto, link e chave", async ({ page }) => {
  test.slow();
  await page.addInitScript(() => {
    const w = window as unknown as { __enviado: unknown };
    navigator.canShare = () => true;
    navigator.share = async (d: ShareData) => {
      const f = d.files![0];
      const bytes = new Uint8Array(await f.arrayBuffer());
      const texto = new TextDecoder("latin1").decode(bytes);
      w.__enviado = { nome: f.name, tipo: f.type, tamanho: f.size, inicio: texto.slice(0, 5), paginas: (texto.match(/\/Type\s*\/Page(?!s)/g) ?? []).length, texto: d.text };
    };
  });
  const projeto = await abrirOrcamento(page);

  await page.getByRole("button", { name: "Enviar por WhatsApp" }).click();
  const janela = page.getByRole("dialog", { name: "Enviar por WhatsApp" });
  await expect(janela.getByText(/PDF pronto/)).toBeVisible({ timeout: 60_000 });

  await test.step("a mensagem já vem pronta, com o link e a chave do projeto", async () => {
    const msg = janela.getByLabel("Mensagem");
    await expect(msg).toHaveValue(/Segue o orçamento do projeto Casa do Lago/);
    await expect(msg).toHaveValue(new RegExp(`Chave de acesso:\\* ${projeto.chave}`));
    await janela.getByRole("checkbox", { name: /Incluir o link do projeto/ }).uncheck();
    await expect(msg).not.toHaveValue(/Chave de acesso/);
    await janela.getByRole("checkbox", { name: /Incluir o link do projeto/ }).check();
  });

  await test.step("enviar entrega um PDF de verdade, com várias páginas", async () => {
    await janela.getByRole("button", { name: "Enviar pelo WhatsApp" }).click();
    await expect(janela).toBeHidden();
    const enviado = await page.evaluate(() => (window as unknown as { __enviado: { nome: string; tipo: string; tamanho: number; inicio: string; paginas: number; texto: string } }).__enviado);
    expect(enviado.tipo).toBe("application/pdf");
    expect(enviado.nome).toMatch(/^Orçamento - Casa do Lago.*\.pdf$/);
    expect(enviado.inicio).toBe("%PDF-");
    expect(enviado.tamanho).toBeGreaterThan(20_000);
    expect(enviado.paginas).toBeGreaterThanOrEqual(2);
    expect(enviado.texto).toContain(`Chave de acesso:* ${projeto.chave}`);
  });
});

test("no computador sem compartilhamento: baixa o PDF e abre o WhatsApp na conversa do cliente", async ({ page }) => {
  test.slow();
  await page.addInitScript(() => {
    (navigator as unknown as { canShare?: unknown }).canShare = undefined;
    const w = window as unknown as { __aberto: string[] };
    w.__aberto = [];
    window.open = ((url?: string | URL) => {
      w.__aberto.push(String(url));
      return null;
    }) as typeof window.open;
  });
  await abrirOrcamento(page);

  await page.getByRole("button", { name: "Enviar por WhatsApp" }).click();
  const janela = page.getByRole("dialog", { name: "Enviar por WhatsApp" });
  await expect(janela.getByText(/PDF pronto/)).toBeVisible({ timeout: 60_000 });

  await janela.getByLabel("WhatsApp do cliente (opcional)").fill("123");
  await expect(janela.getByText(/Digite o DDD e o número/)).toBeVisible();
  await expect(janela.getByRole("button", { name: "Enviar pelo WhatsApp" })).toBeDisabled();
  await janela.getByLabel("WhatsApp do cliente (opcional)").fill("(11) 91234-5678");

  const [download] = await Promise.all([page.waitForEvent("download"), janela.getByRole("button", { name: "Enviar pelo WhatsApp" }).click()]);
  expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  await expect(janela.getByText("PDF baixado")).toBeVisible();
  const abertos = await page.evaluate(() => (window as unknown as { __aberto: string[] }).__aberto);
  expect(abertos[0]).toMatch(/^https:\/\/wa\.me\/5511912345678\?text=/);
  expect(decodeURIComponent(abertos[0])).toContain("Segue o orçamento do projeto Casa do Lago");
});

test("o WhatsApp do cliente salvo nos dados do projeto já vem preenchido, e o nome do cliente vai na mensagem", async ({ page }) => {
  test.setTimeout(60_000);
  await semTutorial(page);
  await entrarComoArquiteto(page);
  await criarProjeto(page, "Casa do Lago");

  await page.getByRole("tab", { name: "Escopo" }).click();
  await page.getByText("Dados do projeto", { exact: true }).click(); // o bloco é recolhível
  await page.getByRole("button", { name: "Editar dados" }).click();
  const dados = page.getByRole("dialog", { name: "Dados do projeto" });
  await dados.getByPlaceholder("Ex.: Gabriel e Mariana").fill("Marina e João");
  await dados.getByPlaceholder("Ex.: (11) 91234-5678").fill("(11) 98888-7777");
  await dados.getByRole("button", { name: "Salvar dados" }).click();
  await expect(dados).toBeHidden();

  await page.getByRole("tab", { name: "Itens" }).click();
  await page.getByRole("button", { name: /Colar da planilha/ }).click();
  const j = page.getByRole("dialog", { name: "Colar da planilha" });
  await j.getByLabel("Cole as linhas aqui").fill("Pintura;Tinta;2;un;100");
  await j.getByRole("button", { name: "Importar 1 item" }).click();
  await page.getByRole("button", { name: "Orçamento em PDF" }).click();
  await page.getByRole("dialog", { name: "Orçamento em PDF" }).getByRole("button", { name: "Gerar orçamento geral" }).click();
  await page.getByRole("button", { name: "Enviar por WhatsApp" }).click();
  const janela = page.getByRole("dialog", { name: "Enviar por WhatsApp" });
  await expect(janela.getByLabel("WhatsApp do cliente (opcional)")).toHaveValue("(11) 98888-7777");
  await expect(janela.getByLabel("Mensagem")).toHaveValue(/Olá, Marina e João! 👋[\s\S]*Segue o orçamento/);
});
