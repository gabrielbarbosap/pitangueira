import { expect, test, type Page } from "@playwright/test";
import { adicionarItem, criarProjeto, entrarComoArquiteto, registrarPrazoOriginal } from "./ajudas";
import { bloqueioDeLimite, MOTIVO_RECURSO, ORDEM_PLANOS, planoEfetivo, planoMinimo, PLANOS, vagas, type PlanoId } from "../lib/planos";

const DIA = 86_400_000;
const agora = 1_800_000_000_000;

test.describe("regras dos planos (sem navegador)", () => {
  test("os limites combinados", () => {
    expect([PLANOS.broto.obrasAtivas, PLANOS.safra.obrasAtivas, PLANOS.pomar.obrasAtivas]).toEqual([2, 5, null]);
    expect([PLANOS.broto.catalogoItens, PLANOS.broto.fornecedores]).toEqual([200, 7]);
    expect(PLANOS.safra.catalogoItens).toBeNull();
    expect(ORDEM_PLANOS).toEqual(["broto", "safra", "pomar"]);
  });

  test("quais recursos cada plano tem", () => {
    const tem = (p: PlanoId) => Object.entries(PLANOS[p].recursos).filter(([, v]) => v).map(([k]) => k).sort();
    expect(tem("broto")).toEqual([]);
    expect(tem("safra")).toEqual(["acompanharCompleto", "composicoes", "escopo", "financeiro", "pdfSemSelo", "previsoesNovas", "relatorioMensal"]);
    expect(tem("pomar")).toEqual([...tem("safra"), "equipe", "exportar", "financeiroCompleto"].sort());
    expect(planoMinimo("financeiro")).toBe("safra");
    expect(planoMinimo("financeiroCompleto")).toBe("pomar");
    for (const r of Object.keys(MOTIVO_RECURSO)) expect(MOTIVO_RECURSO[r as keyof typeof MOTIVO_RECURSO].texto.length).toBeGreaterThan(20);
  });

  test("teste de 5 dias na Safra, depois Broto; assinatura, cortesia e atraso", () => {
    expect(planoEfetivo(null, agora, agora + 1000)).toMatchObject({ plano: "safra", origem: "teste", diasDeTeste: 5 });
    expect(planoEfetivo(null, agora, agora + 4 * DIA + 1000)).toMatchObject({ plano: "safra", origem: "teste", diasDeTeste: 1 });
    expect(planoEfetivo(null, agora, agora + 5 * DIA)).toMatchObject({ plano: "broto", origem: "sem-assinatura" });
    expect(planoEfetivo({ plano: "pomar", status: "cortesia" }, agora - 99 * DIA, agora)).toMatchObject({ plano: "pomar", origem: "cortesia" });
    expect(planoEfetivo({ plano: "safra", status: "ativa", ate: agora + DIA }, agora - 99 * DIA, agora)).toMatchObject({ plano: "safra", origem: "assinatura" });
    expect(planoEfetivo({ plano: "safra", status: "ativa", ate: agora - 1 }, agora - 99 * DIA, agora).plano).toBe("broto");
    expect(planoEfetivo({ plano: "pomar", status: "atrasada", carenciaAte: agora + DIA }, null, agora)).toMatchObject({ plano: "pomar", atrasada: true });
    expect(planoEfetivo({ plano: "pomar", status: "atrasada", carenciaAte: agora - 1 }, null, agora).plano).toBe("broto");
    expect(planoEfetivo({ plano: "safra", status: "cancelada", ate: agora + DIA }, null, agora).plano).toBe("safra"); // vale até o fim do que foi pago
    expect(planoEfetivo({ plano: "safra", status: "cancelada", ate: agora - DIA }, null, agora).plano).toBe("broto");
  });

  test("o bloqueio explica o motivo, o que fazer e qual plano resolve", () => {
    expect(bloqueioDeLimite(PLANOS.broto, "obrasAtivas", 1)).toBeNull();
    const b = bloqueioDeLimite(PLANOS.broto, "obrasAtivas", 2)!;
    expect(b.titulo).toBe("Limite do plano Broto atingido");
    expect(b.texto).toBe("O plano Broto permite 2 projetos em andamento, e você já tem 2. Por isso não dá para criar ou restaurar um projeto.");
    expect(b.dica).toContain("Arquive");
    expect(b.sugestao).toBe("safra");
    expect(bloqueioDeLimite(PLANOS.safra, "obrasAtivas", 5)!.sugestao).toBe("pomar");
    expect(bloqueioDeLimite(PLANOS.pomar, "obrasAtivas", 999)).toBeNull();
    expect(vagas(PLANOS.broto, "catalogoItens", 190)).toBe(10);
    expect(vagas(PLANOS.safra, "catalogoItens", 5000)).toBeNull();
  });
});

/** Entra como arquiteto de exemplo já no plano pedido (e com o tutorial e o catálogo inicial resolvidos). */
async function entrarNoPlano(page: Page, plano: PlanoId | "teste", extra?: Record<string, unknown>) {
  await page.addInitScript(
    ([p, ex]) => {
      for (const c of ["painel", "projeto", "projeto-cliente"]) localStorage.setItem(`pitangueira:tour:${c}:v1`, "1");
      localStorage.setItem("pitangueira:catalogo-inicial:v1", "1");
      if (p !== "teste") localStorage.setItem("reforma:assinatura-demo:v1:demo-arq", JSON.stringify({ plano: p, status: "ativa" }));
      for (const [k, v] of Object.entries((ex ?? {}) as Record<string, unknown>)) localStorage.setItem(k, JSON.stringify(v));
    },
    [plano, extra ?? {}] as const,
  );
  await entrarComoArquiteto(page);
}

test.describe("planos no app", () => {
  test("conta nova: teste grátis da Safra, com os dias que faltam", async ({ page }) => {
    await entrarNoPlano(page, "teste");
    await expect(page.getByRole("note", { name: "Seu plano" })).toContainText("Teste grátis do plano Safra: faltam 5 dias");
    await expect(page.getByRole("note", { name: "Seu plano" })).toContainText("Depois dele, vale o plano Broto");
  });

  test("Broto: 2 projetos em andamento; o terceiro é bloqueado com o motivo; arquivar libera; restaurar também respeita", async ({ page }) => {
    test.setTimeout(120_000);
    await entrarNoPlano(page, "broto");
    await criarProjeto(page, "Casa A");
    await page.getByRole("button", { name: "Voltar ao painel" }).click();
    await criarProjeto(page, "Casa B");
    await page.getByRole("button", { name: "Voltar ao painel" }).click();
    await expect(page.getByText("2 de 2 em andamento")).toBeVisible();

    await page.getByRole("button", { name: "Novo projeto" }).click();
    const limite = page.getByRole("dialog", { name: "Limite do plano Broto atingido" });
    await expect(limite).toContainText("O plano Broto permite 2 projetos em andamento, e você já tem 2.");
    await expect(limite).toContainText("Arquive um projeto concluído para liberar a vaga");
    await expect(limite).toContainText("O plano Safra resolve.");
    await expect(limite.getByRole("link", { name: "Ver os planos" })).toHaveAttribute("href", "/planos");
    await limite.getByRole("button", { name: "Entendi" }).click();

    // Arquivar a Casa A libera a vaga para um novo projeto…
    await page.getByRole("button", { name: "Arquivar ou excluir Casa A" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Arquivar projeto" }).click();
    await expect(page.getByText("1 de 2 em andamento")).toBeVisible();
    await criarProjeto(page, "Casa C");
    await page.getByRole("button", { name: "Voltar ao painel" }).click();
    await expect(page.getByText("2 de 2 em andamento")).toBeVisible();

    // …e restaurar a arquivada agora é bloqueado, com o motivo.
    await page.getByRole("button", { name: /Arquivados \(1\)/ }).click();
    await page.getByRole("button", { name: "Gerenciar", exact: true }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Restaurar projeto" }).last().click();
    await expect(page.getByRole("dialog").getByText("O plano Broto permite 2 projetos em andamento")).toBeVisible();
  });

  test("Broto: catálogo cheio (200) e 7 fornecedores bloqueiam novos itens, com o motivo", async ({ page }) => {
    const catalogo = Array.from({ length: 200 }, (_, i) => ({ id: `c${i}`, descricao: `Item ${i}`, unidade: "un", valorUnitario: 10, etapa: "Teste", createdAt: i }));
    const fornecedores = Array.from({ length: 7 }, (_, i) => ({ id: `f${i}`, nome: `Fornecedor ${i}`, categoria: "", telefone: "", email: "", observacao: "", nota: 0, createdAt: i }));
    await entrarNoPlano(page, "broto", { "reforma:catalogo:v1:demo-arq": catalogo, "reforma:fornecedores:v1:demo-arq": fornecedores });

    await page.getByRole("button", { name: /Meu catálogo/ }).click();
    const cat = page.getByRole("dialog", { name: /Meu catálogo/ });
    await cat.getByRole("button", { name: "+ Novo item" }).click();
    await expect(page.getByRole("dialog", { name: "Limite do plano Broto atingido" })).toContainText("permite 200 itens no catálogo, e você já tem 200");
    await page.getByRole("dialog", { name: "Limite do plano Broto atingido" }).getByRole("button", { name: "Entendi" }).click();
    await cat.getByRole("button", { name: "Fechar" }).click();

    await page.getByRole("button", { name: /Fornecedores/ }).click();
    await page.getByRole("dialog", { name: "Fornecedores" }).getByRole("button", { name: "+ Novo fornecedor" }).click();
    await expect(page.getByRole("dialog", { name: "Limite do plano Broto atingido" })).toContainText("permite 7 fornecedores, e você já tem 7");
  });

  test("Broto: recursos da Safra explicam o bloqueio (financeiro, relatório, visitas, escopo, composições, nova previsão) e o PDF leva o selo", async ({ page }) => {
    test.setTimeout(150_000);
    await entrarNoPlano(page, "broto");
    await expect(page.getByRole("button", { name: /Financeiro/ }).or(page.getByRole("link", { name: /Financeiro/ }))).toContainText("A partir do plano Safra");
    await page.getByRole("link", { name: /Financeiro/ }).click();
    await expect(page.getByRole("region", { name: /Financeiro dos honorários: indisponível no plano Broto/ })).toContainText("Disponível a partir do plano Safra");
    await page.getByRole("link", { name: "Voltar ao painel" }).click();

    await page.getByRole("button", { name: /Composições/ }).click();
    await expect(page.getByRole("dialog", { name: /Composições de custo: plano Safra/ })).toContainText("a partir do plano Safra");
    await page.getByRole("dialog").getByRole("button", { name: "Entendi" }).click();

    await criarProjeto(page, "Casa do Lago");
    await adicionarItem(page, { etapa: "Pintura", descricao: "Tinta", quantidade: 1, unitario: 100 });
    await page.getByRole("tab", { name: "Resumo" }).click();
    await expect(page.getByRole("region", { name: /Relatório mensal: plano Safra/ })).toBeVisible();
    await registrarPrazoOriginal(page); // a PRIMEIRA previsão é liberada no Broto
    await page.getByRole("button", { name: "Registrar nova previsão" }).click();
    await expect(page.getByRole("dialog", { name: /Nova previsão de prazo: plano Safra/ })).toContainText("registra só a previsão inicial");
    await page.getByRole("dialog").getByRole("button", { name: "Entendi" }).click();

    await page.getByRole("tab", { name: "Acompanhar" }).click();
    await page.getByRole("tab", { name: "Visitas" }).click();
    await expect(page.getByRole("region", { name: /Visitas, ocorrências e vistoria: indisponível no plano Broto/ })).toBeVisible();
    await page.getByRole("tab", { name: "Linha do tempo" }).click(); // a linha do tempo continua liberada
    await expect(page.getByRole("region", { name: /indisponível no plano Broto/ })).toHaveCount(0);

    await page.getByRole("tab", { name: "Escopo" }).click();
    await expect(page.getByRole("region", { name: /Escopo e programa de necessidades: indisponível no plano Broto/ })).toBeVisible();

    // Gráficos e cobrança avulsa continuam no Broto.
    await expect(page.getByRole("tab", { name: "Gráficos" })).toBeVisible();
    await page.getByRole("tab", { name: "Resumo" }).click();
    await expect(page.getByRole("button", { name: "Gerar cobrança" })).toBeVisible();
  });

  test("o selo Pitangueira no PDF: Broto leva, Safra não", async ({ page }) => {
    test.setTimeout(120_000);
    await entrarNoPlano(page, "broto");
    await criarProjeto(page, "Casa do Lago");
    await page.getByRole("tab", { name: "Itens" }).click();
    await page.getByRole("button", { name: /Adicionar primeiro item/ }).click();
    const d = page.getByRole("dialog", { name: "Novo item" });
    await d.getByPlaceholder("Ex.: Pintura").fill("Pintura");
    await d.getByPlaceholder("Ex.: Tinta acrílica 18L").fill("Tinta");
    await d.getByLabel("Quantidade").fill("2");
    await d.getByLabel("Valor unitário").fill("100");
    await d.getByRole("button", { name: "Adicionar item" }).click();
    await page.getByRole("button", { name: "Orçamento em PDF" }).click();
    await page.getByRole("dialog", { name: "Orçamento em PDF" }).getByRole("button", { name: "Gerar orçamento geral" }).click();
    await expect(page.locator("article").filter({ hasText: "Orçamento" }).first()).toContainText("Gerado com Pitangueira");
  });

  test("Safra: financeiro básico (os indicadores completos são do Pomar); Pomar vê tudo", async ({ page }) => {
    test.setTimeout(100_000);
    await entrarNoPlano(page, "safra");
    await page.getByRole("link", { name: /Financeiro/ }).click();
    await page.getByRole("button", { name: "Novo honorário" }).click();
    const d = page.getByRole("dialog", { name: "Novo honorário" });
    await d.getByPlaceholder("Ex.: Projeto do apto da Ana").fill("Apto da Ana");
    await d.locator('input[type="number"]').nth(0).fill("3000");
    await d.locator('input[type="number"]').nth(1).fill("3");
    await d.getByRole("button", { name: "Gerar parcelas" }).click();
    await d.getByRole("button", { name: "Salvar honorário" }).click();
    await expect(page.getByRole("region", { name: "Resumo financeiro" })).toBeVisible();
    await expect(page.getByRole("region", { name: /Financeiro completo: plano Pomar/ })).toBeVisible();
    await expect(page.getByRole("region", { name: "Indicadores" })).toHaveCount(0);
  });

  test("página de planos, termos, plano e recibos na conta, e eventos em memória no /admin", async ({ page }) => {
    test.setTimeout(100_000);
    await entrarNoPlano(page, "broto");
    // Força um bloqueio para gerar evento de analytics.
    await page.getByRole("link", { name: /Financeiro/ }).click();
    await expect(page.getByText("Disponível a partir do plano Safra", { exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Voltar ao painel" }).click();

    await page.getByRole("link", { name: "Minha conta", exact: true }).click();
    await expect(page.getByRole("region", { name: "Seu plano" })).toContainText("Broto");
    await expect(page.getByRole("region", { name: "Seu plano" })).toContainText("Até 200 itens");
    await expect(page.getByRole("region", { name: "Recibos de pagamento" })).toContainText("Nenhum pagamento ainda");
    await expect(page.getByRole("region", { name: "Recibos de pagamento" })).toContainText("não emitimos nota fiscal");
    // O simulador (só no demo) troca o plano.
    await page.getByRole("button", { name: "Plano Pomar" }).click();
    await expect(page.getByRole("region", { name: "Seu plano" })).toContainText("Sem limite");

    await page.getByRole("link", { name: "Ver e comparar os planos" }).click();
    await expect(page).toHaveURL(/\/planos/);
    for (const nome of ["Broto", "Safra", "Pomar"]) await expect(page.getByRole("region", { name: `Plano ${nome}` })).toBeVisible();
    await expect(page.getByRole("region", { name: "Plano Safra" })).toContainText("Mais escolhido");
    await expect(page.getByRole("region", { name: "Plano Pomar" })).toContainText("Seu plano");
    await expect(page.getByText("Cancelamento com reembolso:")).toBeVisible();
    await expect(page.getByText(/em até 7 dias depois de contratar/)).toBeVisible();

    await page.getByRole("link", { name: "Termos de uso" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Termos de uso da Pitangueira");
    await expect(page.getByRole("heading", { name: /Cancelamento e reembolso em 7 dias/ })).toBeVisible();
    await expect(page.getByText("Planos de cortesia", { exact: false }).first()).toBeVisible();
    await expect(page.locator("strong", { hasText: "não emitimos nota fiscal" })).toBeVisible();
  });

  test("a home sem login oferece Planos e Termos de uso", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /entrar com google/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Termos de uso/ }).first()).toHaveAttribute("href", "/termos");
    await page.goto("/planos");
    await expect(page.getByRole("region", { name: "Plano Broto" })).toContainText("Testar 5 dias grátis");
  });
});
