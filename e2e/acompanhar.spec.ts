import { expect, test, type Page } from "@playwright/test";
import { criarProjeto, entrarComoArquiteto, sair, semTutorial } from "./ajudas";

const secao = (page: Page, nome: RegExp) => page.getByRole("tablist", { name: "Acompanhamento" }).getByRole("tab", { name: nome });
const amanha = () => new Date(Date.now() + 86_400_000).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

test("o arquiteto acompanha a obra: visitas, ocorrências, vistoria e linha do tempo, e encaminha ao cliente pelo WhatsApp", async ({ page }) => {
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
  const projeto = await criarProjeto(page, "Casa do Lago");

  await page.getByRole("tab", { name: "Acompanhar" }).click();
  await expect(page.getByRole("tablist", { name: "Acompanhamento" })).toBeVisible();

  await test.step("marca uma visita e encaminha o convite pelo WhatsApp (nada sai sozinho)", async () => {
    await secao(page, /^Visitas/).click();
    await page.getByRole("button", { name: "Nova visita" }).click();
    const d = page.getByRole("dialog", { name: "Nova visita" });
    await d.getByLabel("Título").fill("Visita técnica");
    await d.getByLabel("Data").fill(amanha());
    await d.getByLabel("Hora").fill("10:00");
    await d.getByLabel("Local (opcional)").fill("Na obra");
    await d.getByLabel("Pauta (opcional)").fill("Ver a alvenaria e definir os pontos de luz");
    await d.getByRole("button", { name: "Salvar visita" }).click();
    await expect(d).toBeHidden();
    await expect(page.getByRole("list").getByText("Visita técnica")).toBeVisible();

    await page.getByRole("button", { name: /Enviar convite: Visita técnica/ }).click();
    const e = page.getByRole("dialog", { name: "Enviar convite da visita" });
    await expect(e.getByLabel("Mensagem para o cliente")).toHaveValue(/Visita agendada: Visita técnica[\s\S]*Onde: Na obra[\s\S]*alvenaria[\s\S]*\/obra\//);
    expect(await page.evaluate(() => (window as unknown as { __abertos: string[] }).__abertos.length)).toBe(0); // ainda não abriu nada
    await e.getByLabel("WhatsApp do cliente (opcional)").fill("(11) 91111-2222");
    await e.getByRole("button", { name: "Abrir no WhatsApp" }).click();
    await expect(e).toBeHidden();
    const abertos = await page.evaluate(() => (window as unknown as { __abertos: string[] }).__abertos);
    expect(abertos).toHaveLength(1);
    expect(abertos[0]).toMatch(/^https:\/\/wa\.me\/5511911112222\?text=/);
    // o número ficou guardado no projeto para as próximas mensagens
    await page.getByRole("button", { name: /Enviar convite: Visita técnica/ }).click();
    await expect(page.getByLabel("WhatsApp do cliente (opcional)")).toHaveValue("(11) 91111-2222");
    await page.getByRole("dialog", { name: "Enviar convite da visita" }).getByRole("button", { name: "Cancelar" }).click();
  });

  await test.step("registra uma ocorrência, resolve e avisa o cliente", async () => {
    await secao(page, /^Ocorrências/).click();
    await page.getByRole("button", { name: "Nova ocorrência" }).click();
    const d = page.getByRole("dialog", { name: "Nova ocorrência" });
    await d.getByLabel("O que aconteceu").fill("Vazamento na laje do banheiro");
    await d.getByLabel("Gravidade").selectOption("alta");
    await d.getByLabel("Responsável (opcional)").fill("Encanador João");
    await d.getByRole("button", { name: "Salvar ocorrência" }).click();
    await expect(page.getByText("Gravidade alta")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Em aberto \(1\)/ })).toBeVisible();

    await page.getByRole("button", { name: "Marcar como resolvida" }).click();
    const r = page.getByRole("dialog", { name: "Editar ocorrência" });
    await r.getByLabel("Como foi resolvido").fill("Refeita a impermeabilização.");
    await r.getByRole("button", { name: "Salvar ocorrência" }).click();
    await expect(page.getByRole("heading", { name: /Resolvidas \(1\)/ })).toBeVisible();
    await page.getByRole("button", { name: /Avisar o cliente: Vazamento/ }).click();
    await expect(page.getByLabel("Mensagem para o cliente")).toHaveValue(/Ocorrência resolvida: Vazamento na laje do banheiro[\s\S]*impermeabilização/);
    await page.getByRole("dialog", { name: "Avisar o cliente" }).getByRole("button", { name: "Cancelar" }).click();
  });

  await test.step("monta a vistoria a partir do modelo e confere pontos", async () => {
    await secao(page, /^Vistoria/).click();
    await page.getByRole("button", { name: /Usar o modelo de vistoria/ }).click();
    await expect(page.getByText(/0 de 12 conferidos/)).toBeVisible();
    await page.getByRole("button", { name: /^OK: Pintura sem manchas/ }).click();
    await page.getByRole("button", { name: /^Ajustar: Rodapés e acabamentos/ }).click();
    await page.getByLabel(/Observação sobre Rodapés/).fill("Fixar o rodapé da sala");
    await page.getByLabel(/Observação sobre Rodapés/).blur();
    await expect(page.getByText(/1 de 12 conferidos/)).toBeVisible();
    await expect(page.getByText("1 ponto pede ajuste")).toBeVisible();
    await page.getByRole("button", { name: "Enviar ao cliente: vistoria" }).click();
    await expect(page.getByLabel("Mensagem para o cliente")).toHaveValue(/Vistoria final: 1 de 12[\s\S]*Rodapés e acabamentos[\s\S]*Fixar o rodapé da sala/);
    await page.getByRole("dialog", { name: "Enviar a vistoria ao cliente" }).getByRole("button", { name: "Cancelar" }).click();
  });

  await test.step("a linha do tempo reúne tudo, filtra e gera o resumo da semana", async () => {
    await secao(page, /^Linha do tempo/).click();
    const tempo = page.getByRole("region", { name: "Linha do tempo" });
    await expect(tempo).toContainText("Visita agendada: Visita técnica");
    await expect(tempo).toContainText("Ocorrência aberta: Vazamento na laje do banheiro");
    await expect(tempo).toContainText("Ocorrência resolvida: Vazamento na laje do banheiro");
    await expect(tempo).toContainText("ponto conferido na vistoria");
    await tempo.getByRole("button", { name: "Ocorrências", exact: true }).click();
    await expect(tempo).not.toContainText("Visita agendada");
    await tempo.getByRole("button", { name: "Tudo", exact: true }).click();
    await tempo.getByRole("button", { name: "Enviar resumo da semana" }).click();
    await expect(page.getByLabel("Mensagem para o cliente")).toHaveValue(/O que aconteceu nos últimos dias[\s\S]*Ocorrência resolvida/);
    await page.getByRole("dialog", { name: "Resumo da semana" }).getByRole("button", { name: "Cancelar" }).click();
  });

  await test.step("o cliente vê tudo, confere a vistoria, e não encaminha nem edita nada", async () => {
    await sair(page);
    await page.goto(projeto.url);
    await page.getByPlaceholder("ABC123").fill(projeto.chave);
    await page.getByPlaceholder("Como devemos te chamar").fill("Marina");
    await page.getByRole("button", { name: "Entrar no projeto" }).click();
    await page.getByRole("tab", { name: "Acompanhar" }).click();
    await secao(page, /^Visitas/).click();
    await expect(page.getByText("Visita técnica")).toBeVisible();
    await expect(page.getByRole("button", { name: "Nova visita" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Enviar convite/ })).toHaveCount(0);
    await secao(page, /^Ocorrências/).click();
    await expect(page.getByText("Vazamento na laje do banheiro")).toBeVisible();
    await expect(page.getByRole("button", { name: "Nova ocorrência" })).toHaveCount(0);
    await secao(page, /^Vistoria/).click();
    await expect(page.getByRole("button", { name: /Usar o modelo de vistoria/ })).toHaveCount(0);
    await page.getByRole("button", { name: /^OK: Tomadas e interruptores/ }).click();
    await expect(page.getByText(/2 de 12 conferidos/)).toBeVisible();
    await expect(page.getByText(/Conferido por Marina \(cliente\)/)).toBeVisible();
    await secao(page, /^Linha do tempo/).click();
    await expect(page.getByRole("region", { name: "Linha do tempo" })).toContainText("cliente");
    await expect(page.getByRole("button", { name: /Enviar resumo da semana/ })).toHaveCount(0);
  });
});
