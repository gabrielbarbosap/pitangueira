import { expect, test, type Page } from "@playwright/test";
import { criarProjeto, entrarComoArquiteto, sair, semTutorial } from "./ajudas";

const secao = (page: Page, nome: RegExp) => page.getByRole("tablist", { name: "Acompanhamento" }).getByRole("tab", { name: nome });
const emDias = (n: number) => new Date(Date.now() + n * 86_400_000).toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
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
  let linkDoPedido = ""; // o link que o cliente manda ao arquiteto no WhatsApp

  await page.getByRole("tab", { name: "Acompanhar" }).click();
  await expect(page.getByRole("tablist", { name: "Acompanhamento" })).toBeVisible();

  await test.step("o feed começa vazio e o arquiteto publica um aviso, que ele pode encaminhar", async () => {
    const feed = page.getByRole("region", { name: "Linha do tempo" });
    await expect(feed).toContainText("O feed ainda está vazio");
    await expect(feed.getByRole("button", { name: "Publicar" })).toBeDisabled();
    await feed.getByLabel("Escreva um aviso para o feed do projeto").fill("A alvenaria da sala ficou pronta hoje!");
    await feed.getByRole("button", { name: "Publicar" }).click();
    await expect(feed.getByRole("heading", { name: "Hoje" })).toBeVisible();
    await expect(feed).toContainText("A alvenaria da sala ficou pronta hoje!");
    await expect(feed).toContainText("Gabriel (demo)");
    await feed.getByRole("button", { name: /^Enviar: A alvenaria/ }).click();
    await expect(page.getByLabel("Mensagem para o cliente")).toHaveValue(/A alvenaria da sala ficou pronta hoje![\s\S]*\/obra\//);
    await page.getByRole("dialog", { name: "Enviar ao cliente" }).getByRole("button", { name: "Cancelar" }).click();
  });

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
    await expect(e.getByLabel("Mensagem para o cliente")).toHaveValue(/Visita agendada\*\nVisita técnica[\s\S]*Onde:\* Na obra[\s\S]*Pauta\*\n[\s\S]*alvenaria[\s\S]*\/obra\//);
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
    await expect(page.getByLabel("Mensagem para o cliente")).toHaveValue(/Ocorrência resolvida\*\nVazamento na laje do banheiro[\s\S]*Como foi resolvido\*\nRefeita a impermeabilização/);
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
    await expect(page.getByLabel("Mensagem para o cliente")).toHaveValue(/Vistoria final\*[\s\S]*Conferidos:\* 1 de 12 pontos[\s\S]*Pedem ajuste \(1\)\*\n• Rodapés e acabamentos[\s\S]*Fixar o rodapé da sala[\s\S]*Faltam conferir \(10\)/);
    await page.getByRole("dialog", { name: "Enviar a vistoria ao cliente" }).getByRole("button", { name: "Cancelar" }).click();
  });

  await test.step("a linha do tempo reúne tudo, filtra e gera o resumo da semana", async () => {
    await secao(page, /^Linha do tempo/).click();
    const tempo = page.getByRole("region", { name: "Linha do tempo" });
    const resumo = tempo.getByRole("region", { name: "Resumo do acompanhamento" });
    await expect(resumo).toContainText("Visita técnica"); // a próxima visita
    await expect(resumo).toContainText("Nenhuma em aberto"); // a ocorrência foi resolvida
    await expect(resumo).toContainText("1 de 12 conferidos");
    await expect(tempo.getByRole("heading", { name: "Agendado" })).toBeVisible(); // a visita de amanhã fica no topo
    await expect(tempo).toContainText("Visita agendada: Visita técnica");
    await expect(tempo).toContainText("Ocorrência aberta: Vazamento na laje do banheiro");
    await expect(tempo).toContainText("Ocorrência resolvida: Vazamento na laje do banheiro");
    await expect(tempo).toContainText("ponto conferido na vistoria");
    await tempo.getByRole("button", { name: "Ocorrências", exact: true }).click();
    await expect(tempo).not.toContainText("Visita agendada");
    await tempo.getByRole("button", { name: "Tudo", exact: true }).click();
    await tempo.getByRole("button", { name: "Enviar resumo da semana" }).click();
    await expect(page.getByLabel("Mensagem para o cliente")).toHaveValue(/Resumo da semana\*[\s\S]*Ocorrência resolvida: Vazamento/);
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
    await test.step("o cliente também cria pontos na vistoria", async () => {
      await page.getByLabel("Ponto a conferir").fill("Verificar o rejunte do banheiro");
      await page.getByLabel("Ambiente", { exact: true }).fill("Banheiros");
      await page.getByRole("button", { name: "Adicionar", exact: true }).click();
      await expect(page.getByText("Verificar o rejunte do banheiro")).toBeVisible();
      await expect(page.getByText("Adicionado por Marina (cliente)")).toBeVisible();
      await expect(page.getByText(/2 de 13 conferidos/)).toBeVisible();
      // só dá para remover o que ele mesmo criou
      await expect(page.getByRole("button", { name: /^Remover ponto:/ })).toHaveCount(1);
      await expect(page.getByRole("button", { name: "Remover ponto: Verificar o rejunte do banheiro" })).toBeVisible();
    });
    await test.step("e encaminha a vistoria ao arquiteto pelo WhatsApp", async () => {
      await page.getByRole("button", { name: "Enviar ao arquiteto: vistoria" }).click();
      const e = page.getByRole("dialog", { name: "Enviar a vistoria ao arquiteto" });
      await expect(e.getByLabel("Mensagem para o arquiteto")).toHaveValue(/Olá! 👋\nAqui é Marina[\s\S]*Vistoria final\*[\s\S]*Conferidos:\* 2 de 13 pontos \(15%\), por mim/);
      await e.getByLabel("WhatsApp do arquiteto (opcional)").fill("(21) 98888-7777");
      await e.getByRole("button", { name: "Abrir no WhatsApp" }).click();
      await expect(e).toBeHidden();
      const abertos = await page.evaluate(() => (window as unknown as { __abertos: string[] }).__abertos);
      expect(abertos.at(-1)).toMatch(/^https:\/\/wa\.me\/5521988887777\?text=/);
      await page.getByRole("button", { name: "Enviar ao arquiteto: vistoria" }).click();
      await expect(page.getByLabel("WhatsApp do arquiteto (opcional)")).toHaveValue("(21) 98888-7777"); // guardado neste aparelho
      await page.getByRole("dialog", { name: "Enviar a vistoria ao arquiteto" }).getByRole("button", { name: "Cancelar" }).click();
    });
    await secao(page, /^Linha do tempo/).click();
    await expect(page.getByRole("region", { name: "Linha do tempo" })).toContainText("cliente");
    await expect(page.getByRole("region", { name: "Linha do tempo" })).toContainText("A alvenaria da sala ficou pronta hoje!");
    await test.step("o cliente também publica no feed, encaminha o próprio recado e só remove o que é dele", async () => {
      const feed = page.getByRole("region", { name: "Linha do tempo" });
      await feed.getByLabel("Escreva uma mensagem para o feed do projeto").fill("Posso trocar a cor do rodapé da sala?");
      await feed.getByRole("button", { name: "Publicar" }).click();
      await expect(feed).toContainText("Posso trocar a cor do rodapé da sala?");
      await expect(feed.getByText("Marina", { exact: true }).first()).toBeVisible();
      // só o recado dele tem lixeira; o aviso do arquiteto não
      await expect(feed.getByRole("button", { name: /^Remover aviso:/ })).toHaveCount(1);
      await expect(feed.getByRole("button", { name: /^Remover aviso: Posso trocar/ })).toBeVisible();
      // e só o recado dele tem o botão de encaminhar (para o arquiteto)
      await expect(feed.getByRole("button", { name: /^Enviar:/ })).toHaveCount(1);
      await feed.getByRole("button", { name: /^Enviar: Posso trocar/ }).click();
      const e = page.getByRole("dialog", { name: "Enviar ao arquiteto" });
      await expect(e.getByLabel("Mensagem para o arquiteto")).toHaveValue(/Aqui é Marina[\s\S]*Recado\*\nPosso trocar a cor do rodapé da sala\?/);
      await e.getByRole("button", { name: "Cancelar" }).click();
    });
    await expect(page.getByRole("button", { name: /Enviar resumo da semana/ })).toHaveCount(0);
  });

  await test.step("o cliente pede visitas e manda o link para o arquiteto aprovar", async () => {
    await secao(page, /^Visitas/).click();
    await expect(page.getByRole("button", { name: "Nova visita" })).toHaveCount(0);
    for (const [titulo, dias] of [["Ver o forro da cozinha", 3], ["Conversar sobre o piso", 4]] as const) {
      await page.getByRole("button", { name: "Pedir uma visita" }).click();
      const d = page.getByRole("dialog", { name: "Pedir uma visita" });
      await d.getByLabel("Para quê?").fill(titulo);
      await d.getByLabel("Data").fill(emDias(dias));
      await d.getByLabel("Hora").fill("15:00");
      await d.getByLabel("Local (opcional)").fill("Na obra");
      await d.getByRole("button", { name: "Pedir visita" }).click();
      // a janela do WhatsApp já abre sozinha, com o pedido e o link para o arquiteto aprovar
      const e = page.getByRole("dialog", { name: "Enviar o pedido ao arquiteto" });
      const msg = await e.getByLabel("Mensagem para o arquiteto").inputValue();
      expect(msg).toContain("Pedido de visita*\n" + titulo);
      expect(msg).toMatch(/Quando:\* /);
      expect(msg).toMatch(/Pode aprovar, ou sugerir outro horário, por este link\?/);
      if (!linkDoPedido) linkDoPedido = msg.match(/https?:\/\/\S+\?visita=[\w-]+/)![0];
      await e.getByRole("button", { name: "Abrir no WhatsApp" }).click();
      await expect(e).toBeHidden();
    }
    await expect(page.getByRole("heading", { name: /Seus pedidos aguardando \(2\)/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Aprovar a visita/ })).toHaveCount(0); // quem decide é o arquiteto
    await expect(page.getByRole("button", { name: /^Cancelar o pedido:/ })).toHaveCount(2);
    await secao(page, /^Linha do tempo/).click();
    await expect(page.getByRole("region", { name: "Linha do tempo" })).toContainText("Visita solicitada: Ver o forro da cozinha");
  });

  await test.step("o arquiteto aprova um pedido e recusa o outro, avisando o cliente", async () => {
    await sair(page);
    await page.goto("/");
    await page.getByRole("button", { name: /entrar com google/i }).click();
    await page.locator('article a[href^="/obra/"]').first().click();
    await page.getByRole("tab", { name: "Acompanhar" }).click();
    await secao(page, /^Visitas/).click();
    await expect(page.getByRole("heading", { name: /Aguardando a sua aprovação \(2\)/ })).toBeVisible();

    await page.getByRole("button", { name: "Aprovar a visita: Ver o forro da cozinha" }).click();
    const aprovada = page.getByRole("dialog", { name: "Avisar o cliente da confirmação" });
    await expect(aprovada.getByLabel("Mensagem para o cliente")).toHaveValue(/Visita confirmada\*\nVer o forro da cozinha[\s\S]*Combinado! Até lá\./);
    await aprovada.getByRole("button", { name: "Cancelar" }).click();
    await expect(page.getByRole("heading", { name: /Aguardando a sua aprovação \(1\)/ })).toBeVisible();

    await page.getByRole("button", { name: "Recusar a visita: Conversar sobre o piso" }).click();
    const recusa = page.getByRole("dialog", { name: "Recusar o pedido de visita" });
    await recusa.getByLabel("Resposta ao cliente (opcional)").fill("Nesse dia não consigo, que tal quinta, às 15h?");
    await recusa.getByRole("button", { name: "Recusar o pedido" }).click();
    const aviso = page.getByRole("dialog", { name: "Avisar o cliente da resposta" });
    await expect(aviso.getByLabel("Mensagem para o cliente")).toHaveValue(/Sobre o seu pedido de visita\*\nConversar sobre o piso[\s\S]*Resposta\*\nNesse dia não consigo/);
    await aviso.getByRole("button", { name: "Cancelar" }).click();

    await expect(page.getByRole("heading", { name: "Próximas" })).toBeVisible();
    await expect(page.getByText("Recusada", { exact: true })).toBeVisible();
    await expect(page.getByText("Resposta do arquiteto")).toBeVisible();
  });

  await test.step("o link do pedido abre o projeto direto na visita", async () => {
    await sair(page);
    await page.goto(linkDoPedido);
    await page.getByPlaceholder("ABC123").fill(projeto.chave);
    await page.getByPlaceholder("Como devemos te chamar").fill("Marina");
    await page.getByRole("button", { name: "Entrar no projeto" }).click();
    await expect(secao(page, /^Visitas/)).toHaveAttribute("aria-selected", "true");
    const id = new URL(linkDoPedido).searchParams.get("visita")!;
    await expect(page.locator("#visita-" + id)).toHaveClass(/ring-pitanga/);
    await expect(page.locator("#visita-" + id)).toContainText("Ver o forro da cozinha");
    await expect(page.locator("#visita-" + id)).toContainText("Agendada"); // já aprovada
  });
});
