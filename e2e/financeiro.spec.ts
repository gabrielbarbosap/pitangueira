import { expect, test } from "@playwright/test";
import { entrarComoArquiteto, reais, semTutorial } from "./ajudas";

const diaCampo = (diasAtras: number) => new Date(Date.now() - diasAtras * 86_400_000).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

test("o arquiteto controla o que tem a receber: filtros, cobrança, recebimento, clientes e planilha", async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => {
    const w = window as unknown as { __abertos: string[] };
    w.__abertos = [];
    window.open = ((url?: string | URL) => {
      w.__abertos.push(String(url));
      return null;
    }) as typeof window.open;
  });
  await semTutorial(page);
  await entrarComoArquiteto(page);
  await page.getByRole("link", { name: "Financeiro" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Honorários" })).toBeVisible();

  await test.step("cria um contrato de 3 parcelas, com a primeira vencida há 40 dias", async () => {
    await page.getByRole("button", { name: "Novo honorário" }).click();
    const d = page.getByRole("dialog", { name: "Novo honorário" });
    await d.getByPlaceholder("Ex.: Projeto do apto da Ana").fill("Apto da Ana");
    await d.getByPlaceholder("Quem paga os honorários").fill("Ana Souza");
    await d.getByPlaceholder("(11) 91234-5678").fill("(11) 91111-2222");
    await d.locator('input[type="number"]').nth(0).fill("3000");
    await d.locator('input[type="number"]').nth(1).fill("3");
    await d.locator('input[type="date"]').first().fill(diaCampo(40));
    await d.getByRole("button", { name: "Gerar parcelas" }).click();
    await d.getByRole("button", { name: "Salvar honorário" }).click();
    await expect(d).toBeHidden();
  });

  await test.step("o resumo, os indicadores e os atrasos por tempo mostram a situação", async () => {
    const resumo = page.getByRole("region", { name: "Resumo financeiro" });
    await expect(resumo).toContainText(reais("3.000"));
    await expect(resumo).toContainText(reais("2.000")); // vencido: as 2 primeiras
    await expect(resumo).toContainText("2 parcelas atrasadas");
    const atrasos = page.getByRole("region", { name: "Atrasos por tempo" });
    await expect(atrasos).toContainText("31 a 60 dias");
    await expect(atrasos).toContainText("1 a 15 dias");
    await expect(page.getByRole("region", { name: "Indicadores" })).toContainText("100%"); // tudo o que já venceu (2 parcelas) segue sem receber
  });

  await test.step("os filtros de prazo e a busca mostram só o que importa", async () => {
    const aReceber = page.getByRole("region", { name: "Parcelas a receber" });
    await expect(aReceber.getByRole("list").first().getByRole("listitem")).toHaveCount(3);
    await aReceber.getByRole("button", { name: /^Atrasadas/ }).click();
    await expect(aReceber.getByRole("list").first().getByRole("listitem")).toHaveCount(2);
    await expect(aReceber.getByText(/2 parcelas ·/)).toBeVisible();
    await aReceber.getByRole("button", { name: /^Próximos 30 dias/ }).click();
    await expect(aReceber.getByRole("list").first().getByRole("listitem")).toHaveCount(1);
    await aReceber.getByRole("button", { name: /^Todas/ }).click();
    await page.getByLabel("Buscar parcela").fill("zzzz");
    await expect(aReceber.getByText("Nenhuma parcela neste filtro.")).toBeVisible();
    await page.getByLabel("Buscar parcela").fill("ana souza");
    await expect(aReceber.getByRole("list").first().getByRole("listitem")).toHaveCount(3);
  });

  await test.step("cobrar pelo WhatsApp: mensagem pronta, telefone do contrato e PIX guardado", async () => {
    await page.getByRole("button", { name: "Cobrar Apto da Ana pelo WhatsApp" }).first().click();
    const c = page.getByRole("dialog", { name: "Cobrar pelo WhatsApp" });
    await expect(c.getByLabel("WhatsApp do cliente")).toHaveValue("(11) 91111-2222");
    await expect(c.getByLabel("Mensagem")).toHaveValue(/Olá, Ana Souza! 👋[\s\S]*Valor:\* R\$\s1\.000,00[\s\S]*venceu há/);
    await c.getByLabel("Sua chave PIX").fill("pix@escritorio.com");
    await expect(c.getByLabel("Mensagem")).toHaveValue(/Chave PIX\*\npix@escritorio\.com/);
    await c.getByRole("button", { name: "Abrir no WhatsApp" }).click();
    await expect(c).toBeHidden();
    const abertos = await page.evaluate(() => (window as unknown as { __abertos: string[] }).__abertos);
    expect(abertos[0]).toMatch(/^https:\/\/wa\.me\/5511911112222\?text=/);
    expect(decodeURIComponent(abertos[0])).toContain("pix@escritorio.com");
    // a chave PIX ficou guardada para a próxima cobrança
    await page.getByRole("button", { name: "Cobrar Apto da Ana pelo WhatsApp" }).first().click();
    await expect(page.getByLabel("Sua chave PIX")).toHaveValue("pix@escritorio.com");
    await page.getByRole("dialog", { name: "Cobrar pelo WhatsApp" }).getByRole("button", { name: "Cancelar" }).click();
  });

  await test.step("registrar o recebimento com desconto, forma e data", async () => {
    await page.getByRole("button", { name: "Receber Apto da Ana" }).first().click();
    const r = page.getByRole("dialog", { name: "Registrar recebimento" });
    await expect(r.getByLabel("Valor recebido (R$)")).toHaveValue("1000");
    await r.getByLabel("Valor recebido (R$)").fill("900");
    await expect(r.getByText(/Entrou R\$\s100,00 a menos/)).toBeVisible();
    await r.getByLabel("Como foi pago").selectOption("Boleto");
    await r.getByRole("button", { name: "Registrar recebimento" }).click();
    await expect(r).toBeHidden();
    const resumo = page.getByRole("region", { name: "Resumo financeiro" });
    await expect(resumo).toContainText(reais("900")); // recebido no mês, pelo valor que entrou
    await expect(resumo).toContainText("1 parcela atrasada");
    await page.getByRole("button", { name: /Recebidas \(1\)/ }).click();
    const recebidas = page.getByRole("region", { name: "Parcelas recebidas" });
    await expect(recebidas).toContainText("Boleto");
    await expect(recebidas).toContainText("Desconto de");
  });

  await test.step("a visão por cliente mostra quanto falta e o que está atrasado", async () => {
    await page.getByRole("tab", { name: "Por cliente" }).click();
    const clientes = page.getByRole("region", { name: "Por cliente" });
    await expect(clientes).toContainText("Ana Souza");
    await expect(clientes).toContainText("Atrasado");
    await expect(clientes).toContainText(reais("2.000")); // falta: 1.000 vencida + 1.000 a vencer
    await page.getByRole("tab", { name: "Parcelas" }).click();
  });

  await test.step("exporta a planilha com as parcelas", async () => {
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Exportar planilha" }).click()]);
    expect(download.suggestedFilename()).toMatch(/^Financeiro - parcelas - \d{4}-\d{2}-\d{2}\.csv$/);
    const caminho = await download.path();
    const fs = await import("node:fs/promises");
    const csv = await fs.readFile(caminho, "utf8");
    expect(csv).toContain("Projeto;Cliente;Contrato;Parcela;Vencimento");
    expect(csv).toContain("Apto da Ana;Ana Souza");
    expect(csv).toContain("Boleto");
    expect(csv.split("\r\n").length).toBe(4); // títulos + 3 parcelas
  });

  await test.step("desfazer um recebimento volta a parcela para o aberto", async () => {
    await page.getByRole("region", { name: "Parcelas recebidas" }).getByRole("button", { name: "Desfazer" }).click();
    await expect(page.getByRole("region", { name: "Resumo financeiro" })).toContainText("2 parcelas atrasadas");
  });
});
