import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, H3, Ir, Lista, P, Passo, Passos, Tabela } from "../ui";

export const escopo: PaginaDoc = {
  slug: "escopo",
  grupo: "Projetos",
  titulo: "Escopo do projeto",
  resumo: "Ambientes, pedidos do cliente, modelos, vínculo com o orçamento, status automático e dados do projeto.",
  secoes: [
    {
      id: "o-que-e",
      titulo: "Para que serve",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            A aba <Btn>Escopo</Btn> registra o que foi combinado com o cliente: os espaços da obra (ambientes) e o que ele precisa em cada um (pedidos). Cada pedido pode ser ligado a itens do orçamento, e o app mostra automaticamente o custo e o andamento de cada pedido.
          </P>
          <Aviso tipo="atencao" titulo="Só o arquiteto vê esta aba">
            O cliente não vê a aba Escopo. O cartão de aprovação (“Aprovar o escopo”) que existe no código não está acessível ao cliente na interface atual, então hoje a aprovação online não é um fluxo disponível.
          </Aviso>
          <P>
            No topo da aba há três passos: <strong>Registre</strong> (ambientes e pedidos), <strong>Ligue ao orçamento</strong> (quantos pedidos já têm itens ligados) e <strong>Cliente aprova</strong>. A faixa “Próximo” sugere o que fazer agora: começar por um modelo, registrar pedidos, ligar os pedidos sem item ou enviar o link e a chave.
          </P>
        </>
      ),
    },
    {
      id: "modelos",
      titulo: "Começar por um modelo",
      papel: "arquiteto",
      corpo: (
        <>
          <P>Com o escopo vazio, o app oferece quatro modelos. Toque em <Btn>Usar este modelo →</Btn> no que servir:</P>
          <Tabela
            colunas={["Modelo", "O que traz"]}
            linhas={[
              ["Reforma residencial completa", "11 ambientes e 16 pedidos, baseados em um projeto real."],
              ["Reforma de apartamento", "7 ambientes e 3 pedidos."],
              ["Sala comercial / escritório", "5 ambientes e 3 pedidos."],
              ["Em branco", "Nada: você monta tudo."],
            ]}
          />
          <P>
            Depois, <Btn>Trocar por outro modelo</Btn> (ao lado do botão de gerar o PDF) troca o conteúdo. Se já há conteúdo, o app confirma antes: “Substituir o escopo atual?”.
          </P>
        </>
      ),
    },
    {
      id: "ambientes",
      titulo: "Ambientes",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            A lista mostra “{"{qtd}"}× nome” com a função, a área e “próximo de”. Use <Btn>Editar</Btn> e o botão de remover em cada um.
          </P>
          <Passos>
            <Passo>Para adicionar rápido, toque num atalho (<Btn>+ Suíte</Btn>, <Btn>+ Quarto</Btn>, <Btn>+ Cozinha</Btn>, <Btn>+ Sala</Btn>, <Btn>+ Banheiro</Btn> e outros). Os que já existem somem dos atalhos.</Passo>
            <Passo>Ou escreva o nome em “Novo ambiente (ex.: Suíte) e Enter” e toque em <Btn>Adicionar</Btn>.</Passo>
          </Passos>
          <P>
            A janela “Novo ambiente” / “Editar ambiente” tem os campos <Btn>Nome do ambiente</Btn>, <Btn>Qtd.</Btn> (mínimo 1), <Btn>Função / observação</Btn>, <Btn>Área aprox. (m²)</Btn> e <Btn>Próximo de</Btn>.
          </P>
        </>
      ),
    },
    {
      id: "pedidos",
      titulo: "Pedidos do cliente",
      papel: "arquiteto",
      corpo: (
        <>
          <Passos>
            <Passo>Em “Novo pedido do cliente e Enter”, escreva o pedido (ex.: “Armário planejado na cozinha”) e aperte Enter. Ou abra a janela completa de “Novo pedido”.</Passo>
            <Passo>Na janela, escolha o <Btn>Ambiente</Btn> (ou “Geral (todo o projeto)”) e, se quiser, a <Btn>Etapa do orçamento (opcional)</Btn>, que só organiza.</Passo>
            <Passo>Em “Itens do orçamento que atendem”, busque e marque os itens que cumprem o pedido. A lista mostra até 80 itens; use a busca para achar o resto.</Passo>
            <Passo>Toque em <Btn>Salvar pedido</Btn>.</Passo>
          </Passos>
          <P>
            Cada pedido mostra o ambiente, a etapa e, havendo itens ligados, um bloco com “N itens do orçamento · R$ valor · M de N concluídos · X% pago”, com a lista dos itens e pontos coloridos (cinza, âmbar, verde). Sem itens ligados, aparece o link “Ligar a itens do orçamento”. Com 4 ou mais pedidos, abas de filtro <Btn>Todos</Btn>, <Btn>Pendente</Btn>, <Btn>No orçamento</Btn> e <Btn>Concluído</Btn> ajudam a achar.
          </P>
          <H3>A situação do pedido</H3>
          <Tabela
            colunas={["Situação", "Significado"]}
            linhas={[
              ["Pendente", "Ainda sem item no orçamento."],
              ["No orçamento", "Tem itens ligados, mas nem todos estão feitos e pagos."],
              ["Concluído", "Todos os itens ligados estão feitos e pagos."],
            ]}
          />
          <P>
            Com itens ligados, a situação é <strong>automática</strong> (a etiqueta mostra “· auto”). Sem itens ligados, você escolhe a situação à mão no seletor “Situação do pedido”.
          </P>
        </>
      ),
    },
    {
      id: "dados",
      titulo: "Dados do projeto e marca",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            O bloco recolhível “Dados do projeto” mostra cliente(s), tipo, endereço e responsável técnico. Toque em <Btn>Editar dados</Btn> para preencher:
          </P>
          <Lista>
            <li><Btn>Cliente(s)</Btn>, <Btn>WhatsApp do cliente</Btn> (opcional, com DDD; abre a conversa certa ao enviar PDFs), <Btn>Tipo de projeto</Btn> e <Btn>Endereço do projeto</Btn>.</li>
            <li><Btn>Responsável técnico</Btn> e <Btn>Registro profissional (CAU/CREA)</Btn>.</li>
            <li>O bloco <strong>Marca nos PDFs</strong>: nome do escritório, contato, cor de destaque e logo. Veja <Ir para="pdfs">PDFs e marca do escritório</Ir>.</li>
          </Lista>
        </>
      ),
    },
    {
      id: "pdf",
      titulo: "PDF do escopo",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            <Btn>Gerar PDF do escopo</Btn> (disponível quando há conteúdo) abre um documento chamado “Escopo do projeto”, com as seções “Ambientes e quantidade” e “Requisitos específicos de uso”. Cada requisito vem numerado (01, 02…), com ambiente, etapa, situação por extenso e, havendo itens ligados, a lista deles com valor e o “Custo previsto · N de M concluídos”. Usa a marca do escritório e as assinaturas.
          </P>
        </>
      ),
    },
    {
      id: "aprovacao",
      titulo: "Aprovação e o que a invalida",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            Quando existe uma aprovação, o cartão “Escopo aprovado” mostra quem aprovou e quando, e a assinatura do PDF traz “Aprovado online em dd/mm/aaaa”. Qualquer mudança de conteúdo desfaz a aprovação: editar texto ou ambiente de um pedido, adicionar ou remover ambientes e pedidos, ou trocar o modelo.
          </P>
          <P>
            Não desfazem: mudar a situação à mão e ligar ou desligar itens (ou mudar a etapa) de um pedido sem mexer no texto nem no ambiente.
          </P>
        </>
      ),
    },
  ],
};
