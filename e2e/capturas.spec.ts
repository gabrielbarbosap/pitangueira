import { test } from "@playwright/test";
import { semTutorial } from "./ajudas";

/**
 * Gera os prints do sistema usados na página inicial (public/landing). Só roda com CAPTURAS=1, em modo demo,
 * com dados fictícios (nada de cliente real). Para refazer:  CAPTURAS=1 npx playwright test capturas --project=desktop
 */
test.skip(!process.env.CAPTURAS, "só com CAPTURAS=1");

const DIA = 86_400_000;
const agora = Date.now();

type Linha = [etapa: string, descricao: string, un: string, qtd: number, unit: number, feito: boolean, pago: boolean];
const LINHAS: Linha[] = [
  ["Demolição e preparo", "Demolição de revestimentos", "m²", 64, 38, true, true],
  ["Demolição e preparo", "Retirada de entulho (caçamba)", "un", 4, 420, true, true],
  ["Demolição e preparo", "Proteção de áreas e pisos", "vb", 1, 1800, true, true],
  ["Instalações", "Ponto elétrico novo", "un", 42, 165, true, true],
  ["Instalações", "Quadro de distribuição", "un", 1, 2900, true, false],
  ["Instalações", "Tubulação hidráulica (água fria)", "m", 85, 52, true, false],
  ["Instalações", "Ponto de ar-condicionado", "un", 4, 780, false, false],
  ["Alvenaria e gesso", "Alvenaria de vedação", "m²", 38, 96, true, true],
  ["Alvenaria e gesso", "Forro de gesso acartonado", "m²", 72, 118, true, false],
  ["Alvenaria e gesso", "Sanca iluminada", "m", 46, 135, false, false],
  ["Revestimentos", "Porcelanato 90x90 (assentamento)", "m²", 88, 145, true, false],
  ["Revestimentos", "Revestimento de banheiros", "m²", 52, 160, false, false],
  ["Revestimentos", "Rodapé em poliestireno", "m", 96, 28, false, false],
  ["Marcenaria", "Cozinha planejada", "vb", 1, 32500, false, false],
  ["Marcenaria", "Closet do casal", "vb", 1, 18400, false, false],
  ["Marcenaria", "Painel de TV ripado", "vb", 1, 5200, false, false],
  ["Pintura", "Massa corrida e selador", "m²", 310, 22, false, false],
  ["Pintura", "Pintura acrílica (2 demãos)", "m²", 310, 19, false, false],
  ["Louças e metais", "Bancadas em quartzo", "vb", 1, 9800, false, false],
  ["Louças e metais", "Louças e metais dos banheiros", "vb", 1, 7600, false, false],
];

const itens = LINHAS.map(([etapa, descricao, unidade, quantidade, valorUnitario, feito, pago], i) => {
  const valor = quantidade * valorUnitario;
  const etapaNum = [...new Set(LINHAS.map((l) => l[0]))].indexOf(etapa) + 1;
  return {
    id: `s${i + 1}`, etapaNum, etapa, ambiente: "", descricao, unidade, quantidade, valorUnitario,
    valorOrcado: valor, valorReal: 0, feito, pago, ordem: i + 1,
    ...(feito ? { feitoPor: "Helena Duarte", feitoEm: agora - (20 - i) * DIA } : {}),
    ...(pago ? { pagoPor: "Helena Duarte", pagoEm: agora - (18 - i) * DIA } : {}),
  };
});

const resumo = (its: typeof itens) => ({
  previsto: its.reduce((s, i) => s + i.valorOrcado, 0),
  pago: its.filter((i) => i.pago).reduce((s, i) => s + i.valorOrcado, 0),
  itens: its.length,
  feitos: its.filter((i) => i.feito).length,
  concluidos: its.filter((i) => i.feito && i.pago).length,
});

const projeto = (cliente: string, tipo: string) => ({
  cliente, telefone: "", endereco: "", tipo, responsavel: "Helena Duarte", registro: "CAU A00000-0",
  escritorio: "Studio Verde Arquitetura", contato: "contato@studioverde.com.br", cor: "", logo: "",
});

const obras = [
  { id: "o1", nome: "Residência Alves", accessCode: "ALV482", orcamentoTotal: 210000, resumo: resumo(itens), projeto: projeto("Marina Alves", "Reforma completa"),
    previsoes: [{ id: "p1", numero: 1, inicio: agora - 40 * DIA, termino: agora + 80 * DIA, dias: 120, registradaEm: agora - 40 * DIA, registradaPor: "Helena Duarte" }] },
  { id: "o2", nome: "Apartamento Moema", accessCode: "MOE915", orcamentoTotal: 96000,
    resumo: { previsto: 88400, pago: 61200, itens: 18, feitos: 14, concluidos: 12 }, projeto: projeto("Rafael Nunes", "Apartamento 78 m²") },
  { id: "o3", nome: "Loja Centro", accessCode: "LOJ377", orcamentoTotal: 58000,
    resumo: { previsto: 51800, pago: 9700, itens: 11, feitos: 3, concluidos: 2 }, projeto: projeto("Café Brasa", "Comercial") },
].map((o) => ({ ...o, ownerUid: "demo-arq", ownerEmail: "gabriel@sistemap.com.br", createdAt: agora - 50 * DIA, updatedAt: agora }));

const publicacoes = [
  { id: "pb1", autor: "Helena Duarte", createdAt: agora - 2 * 3_600_000, texto: "Porcelanato da sala e do corredor assentado. Amanhã começa o rejunte e a limpeza fina." },
  { id: "pb2", autor: "Marina Alves (cliente)", createdAt: agora - 26 * 3_600_000, texto: "Adorei o tom do piso! Podemos conversar sobre a iluminação da sala na visita de sexta?" },
  { id: "pb3", autor: "Helena Duarte", createdAt: agora - 3 * DIA, texto: "Forro de gesso e sanca concluídos. Elétrica passou na vistoria do eletricista responsável." },
];

const parcela = (id: string, d: string, v: number, venc: number, rec: number | null) => ({ id, descricao: d, valor: v, vencimento: venc, recebidoEm: rec });
const honorarios = [
  { id: "h1", projetoId: "o1", projetoNome: "Residência Alves", cliente: "Marina Alves", descricao: "Projeto e acompanhamento", createdAt: agora - 60 * DIA,
    parcelas: [parcela("a", "Entrada", 6000, agora - 55 * DIA, agora - 54 * DIA), parcela("b", "Parcela 2/4", 6000, agora - 25 * DIA, agora - 24 * DIA), parcela("c", "Parcela 3/4", 6000, agora + 5 * DIA, null), parcela("d", "Parcela 4/4", 6000, agora + 35 * DIA, null)] },
  { id: "h2", projetoId: "o2", projetoNome: "Apartamento Moema", cliente: "Rafael Nunes", descricao: "Projeto executivo", createdAt: agora - 45 * DIA,
    parcelas: [parcela("a", "Entrada", 4500, agora - 40 * DIA, agora - 40 * DIA), parcela("b", "Parcela 2/3", 4500, agora - 10 * DIA, null), parcela("c", "Parcela 3/3", 4500, agora + 20 * DIA, null)] },
];

test("prints do sistema para a página inicial", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1200, height: 780 });
  await semTutorial(page);
  await page.addInitScript(
    ([o, its, pubs, hon]) => {
      if (localStorage.getItem("capturas:semeado")) return;
      localStorage.setItem("capturas:semeado", "1");
      localStorage.setItem("reforma:obras:v2", o);
      localStorage.setItem("reforma:itens:v4:o1", its);
      localStorage.setItem("reforma:publicacoes:v1:o1", pubs);
      localStorage.setItem("reforma:honorarios:v1:demo-arq", hon);
    },
    [JSON.stringify(obras), JSON.stringify(itens), JSON.stringify(publicacoes), JSON.stringify(honorarios)],
  );
  // Troca o nome do arquiteto de exemplo e esconde o aviso de modo demo só na hora da foto.
  const limpar = () =>
    page.evaluate(() => {
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = w.nextNode(); n; n = w.nextNode()) n.textContent = (n.textContent ?? "").replace("Gabriel (demo)", "Helena Duarte").replace("Gabriel", "Helena");
      document.querySelectorAll(".pilula-topo").forEach((e) => ((e as HTMLElement).style.display = "none"));
    });
  const foto = async (nome: string) => {
    await limpar();
    await page.screenshot({ path: `public/landing/${nome}.jpg`, type: "jpeg", quality: 90 });
  };

  await page.goto("/");
  await page.getByRole("button", { name: /entrar com google/i }).click();
  await page.getByText(/Modo demo/).waitFor();
  await page.mouse.move(5, 5);
  await page.waitForTimeout(600);
  await limpar();
  await page.screenshot({ path: "public/landing/painel.jpg", type: "jpeg", quality: 90, clip: { x: 0, y: 0, width: 1200, height: 700 } });

  await page.locator('article a[href^="/obra/o1"]').first().click();
  await page.getByRole("tab", { name: "Resumo" }).click();
  await page.waitForTimeout(800);
  await foto("resumo");

  await page.getByRole("tab", { name: "Itens" }).click();
  await page.waitForTimeout(600);
  await foto("itens");

  await page.getByRole("tab", { name: "Acompanhar" }).click();
  await page.waitForTimeout(800);
  await foto("acompanhar");

  await page.goBack();
  await page.waitForTimeout(500);
  await page.getByRole("link", { name: /Financeiro/ }).click();
  await page.waitForTimeout(900);
  await page.mouse.move(5, 5);
  await foto("financeiro");
});
