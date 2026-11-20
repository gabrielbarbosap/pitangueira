import { expect, test } from "@playwright/test";
import { adicionarItem, criarProjeto, entrarComoArquiteto, marcarItem, reais, sair, semTutorial } from "./ajudas";

const emDias = (n: number) => new Date(Date.now() + n * 86_400_000).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

test("o arquiteto gera a cobrança da obra com itens do orçamento e itens novos, envia e dá baixa", async ({ page }) => {
  test.setTimeout(150_000);
  await page.addInitScript(() => {
    (navigator as unknown as { canShare?: unknown }).canShare = undefined;
    window.open = (() => null) as typeof window.open;
  });
  await semTutorial(page);
  await entrarComoArquiteto(page);
  const projeto = await criarProjeto(page, "Casa do Lago");
  await adicionarItem(page, { etapa: "Pintura", descricao: "Tinta acrílica 18L", quantidade: 4, unitario: 350 });
  await adicionarItem(page, { etapa: "Pintura", descricao: "Rolo de lã", quantidade: 2, unitario: 25 });
  await adicionarItem(page, { etapa: "Elétrica", descricao: "Pontos de tomada", quantidade: 10, unitario: 120 });
  await marcarItem(page, "Tinta acrílica 18L", { feito: true });
  await marcarItem(page, "Rolo de lã", { feito: true, pago: true });

  await page.getByRole("tab", { name: "Resumo" }).click();
  const cartao = page.getByRole("region", { name: "Cobrança da obra" });
  await expect(cartao).toContainText("Nenhuma cobrança em aberto");

  await test.step("abre a janela e escolhe itens do orçamento", async () => {
    await cartao.getByRole("button", { name: "Gerar cobrança" }).click();
    const d = page.getByRole("dialog", { name: "Gerar cobrança da obra" });
    await d.getByRole("button", { name: "Só feitos e não pagos" }).click();
    await expect(d.getByText("1 de 3 marcados")).toBeVisible(); // só a tinta: feita e ainda não paga
    await expect(d.getByRole("checkbox", { name: /Tinta acrílica 18L/ })).toBeChecked();
    await expect(d.getByRole("checkbox", { name: /Rolo de lã/ })).not.toBeChecked(); // já pago
    await d.getByRole("checkbox", { name: /Pontos de tomada/ }).check();
    await expect(d.getByText("2 de 3 marcados")).toBeVisible();

    await test.step("inclui um item novo, cadastrado na hora", async () => {
      await d.getByRole("button", { name: "Item novo" }).click();
      await d.getByLabel("Descrição do item novo").fill("Ponto de tomada extra");
      await d.getByLabel("Quantidade do item novo").fill("3");
      await d.getByLabel("Valor unitário do item novo").fill("80");
      await expect(d.getByText(/Total do item: R\$\s240,00/)).toBeVisible();
    });

    await test.step("o botão só habilita com um título, e o total fecha", async () => {
      const gerar = d.getByRole("button", { name: "Gerar cobrança" });
      await expect(gerar).toBeDisabled();
      await expect(d.getByText("Dê um título à cobrança.")).toBeVisible();
      await d.getByLabel("Título da cobrança").fill("Medição de novembro");
      await d.getByLabel("Vencimento (opcional)").fill(emDias(5));
      await d.getByLabel("Chave PIX (opcional)").fill("pix@escritorio.com");
      await d.getByLabel("Observações (opcional)").fill("Pagamento em até 5 dias úteis");
      const resumo = d.getByLabel("Resumo da cobrança");
      await expect(resumo).toContainText("3"); // 1.400 + 1.200 + 240
      await expect(resumo).toContainText(reais("2.840,00"));
      await gerar.click();
    });
  });

  await test.step("o documento da cobrança abre com a marca, os itens, o total e o PIX", async () => {
    const doc = page.locator(".print-area");
    await expect(doc.getByRole("heading", { level: 1, name: "Casa do Lago" })).toBeVisible();
    await expect(doc).toContainText("Cobrança");
    await expect(doc).toContainText("Medição de novembro");
    await expect(doc).toContainText("Tinta acrílica 18L");
    await expect(doc).toContainText("Pontos de tomada");
    await expect(doc).toContainText("Ponto de tomada extra");
    await expect(doc).toContainText("item novo");
    await expect(doc).toContainText(reais("2.840,00"));
    await expect(doc).toContainText("pix@escritorio.com");
    await expect(doc).toContainText("Pagamento em até 5 dias úteis");

    // A mensagem do WhatsApp que acompanha o PDF traz o total, o vencimento e o PIX
    await doc.getByRole("button", { name: "Enviar por WhatsApp" }).click();
    const w = page.getByRole("dialog", { name: "Enviar por WhatsApp" });
    await expect(w.getByLabel("Mensagem")).toHaveValue(/Segue a cobrança do projeto Casa do Lago[\s\S]*Total:\* R\$\s2\.840,00[\s\S]*Vencimento:\*[\s\S]*Chave PIX\*\npix@escritorio\.com/);
    await w.getByRole("button", { name: "Cancelar" }).click();
    await doc.getByRole("button", { name: /Fechar/ }).click();
  });

  await test.step("a cobrança fica no cartão, e o item novo entrou no orçamento", async () => {
    await expect(cartao).toContainText("1 cobrança em aberto");
    await expect(cartao).toContainText(reais("2.840,00"));
    await expect(cartao).toContainText("Medição de novembro");
    await page.getByRole("tab", { name: "Itens" }).click();
    await page.getByPlaceholder(/Buscar serviço/).fill("tomada extra");
    await expect(page.locator(".linha-hover").filter({ hasText: "Ponto de tomada extra" })).toBeVisible();
    await expect(page.getByText("Extras", { exact: true }).first()).toBeVisible(); // a etapa dos itens novos
    await page.getByPlaceholder(/Buscar serviço/).fill("");
    await page.getByRole("tab", { name: "Resumo" }).click();
  });

  await test.step("encaminha a cobrança pelo WhatsApp com uma mensagem estruturada", async () => {
    await cartao.getByRole("button", { name: /Enviar: Medição de novembro/ }).click();
    const e = page.getByRole("dialog", { name: "Enviar a cobrança ao cliente" });
    const msg = e.getByLabel("Mensagem para o cliente");
    await expect(msg).toHaveValue(/Cobrança: Medição de novembro\*/);
    await expect(msg).toHaveValue(/• Tinta acrílica 18L — R\$\s1\.400,00/);
    await expect(msg).toHaveValue(/• Ponto de tomada extra — R\$\s240,00/);
    await expect(msg).toHaveValue(/Total:\* R\$\s2\.840,00/);
    await expect(msg).toHaveValue(/Chave PIX\*\npix@escritorio\.com/);
    await e.getByRole("button", { name: "Cancelar" }).click();
  });

  await test.step("a cobrança aparece na linha do tempo", async () => {
    await page.getByRole("tab", { name: "Acompanhar" }).click();
    await expect(page.getByRole("region", { name: "Linha do tempo" })).toContainText("Cobrança gerada: Medição de novembro");
    await page.getByRole("tab", { name: "Resumo" }).click();
  });

  await test.step("o cliente vê a cobrança em aberto e abre o documento, sem gerar nada", async () => {
    await sair(page);
    await page.goto(projeto.url);
    await page.getByPlaceholder("ABC123").fill(projeto.chave);
    await page.getByPlaceholder("Como devemos te chamar").fill("Marina");
    await page.getByRole("button", { name: "Entrar no projeto" }).click();
    const c = page.getByRole("region", { name: "Cobrança da obra" });
    await expect(c).toContainText("Cobranças em aberto");
    await expect(c).toContainText(reais("2.840,00"));
    await expect(c.getByRole("button", { name: "Gerar cobrança" })).toHaveCount(0);
    await expect(c.getByRole("button", { name: /Marcar como paga/ })).toHaveCount(0);
    await c.getByRole("button", { name: /Ver cobrança: Medição de novembro/ }).click();
    await expect(page.locator(".print-area")).toContainText("pix@escritorio.com");
    await page.locator(".print-area").getByRole("button", { name: /Fechar/ }).click();
  });

  await test.step("o arquiteto dá baixa: a cobrança fica paga e os itens também", async () => {
    await sair(page);
    await page.goto("/");
    await page.getByRole("button", { name: /entrar com google/i }).click();
    await page.locator('article a[href^="/obra/"]').first().click();
    const c = page.getByRole("region", { name: "Cobrança da obra" });
    await c.getByRole("button", { name: /Marcar como paga: Medição de novembro/ }).click();
    await page.getByRole("button", { name: "Marcar como paga", exact: true }).click();
    await expect(c).toContainText("Nenhuma cobrança em aberto");
    await expect(c.getByText("Paga", { exact: true })).toBeVisible();
    await page.getByRole("tab", { name: "Itens" }).click();
    await page.getByPlaceholder(/Buscar serviço/).fill("Pontos de tomada");
    await expect(page.getByTestId("autoria")).toContainText("Pago por");
  });
});
