import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, H3, Ir, Lista, P, Tabela } from "../ui";

export const introducao: PaginaDoc = {
  slug: "introducao",
  grupo: "Começando",
  titulo: "Visão geral",
  resumo: "O que é a Pitangueira, para quem ela serve e as ideias que você precisa conhecer antes de começar.",
  secoes: [
    {
      id: "o-que-e",
      titulo: "O que é a Pitangueira",
      corpo: (
        <>
          <P>
            A Pitangueira é um sistema de gestão de projetos e obras feito para o arquiteto acompanhar o orçamento, os pagamentos, o prazo e o andamento de cada projeto, e para o cliente enxergar tudo isso em tempo real, sem planilha e sem mensagem solta.
          </P>
          <P>Com ela você consegue:</P>
          <Lista>
            <li>montar o orçamento de um projeto, item por item, com etapa, ambiente, quantidade e valor;</li>
            <li>marcar o que já foi executado (<Btn>Feito</Btn>) e o que já foi pago (<Btn>Pago</Btn>) e ver o andamento atualizar sozinho;</li>
            <li>registrar o prazo previsto da obra e acompanhar se o projeto está no prazo, sem poder “maquiar” a previsão original;</li>
            <li>gerar PDFs com a sua marca: orçamento, escopo do projeto e relatório mensal de andamento;</li>
            <li>manter um catálogo próprio, composições de custo e uma rede de fornecedores com histórico;</li>
            <li>controlar os honorários do seu escritório, parcela por parcela;</li>
            <li>dar ao cliente um link e uma chave para ele acompanhar tudo.</li>
          </Lista>
        </>
      ),
    },
    {
      id: "quem-usa",
      titulo: "Arquiteto e cliente",
      corpo: (
        <>
          <P>Existem dois tipos de acesso, com permissões diferentes. O arquiteto é o dono do projeto. O cliente só acompanha e ajuda a marcar o que foi feito e pago.</P>
          <Tabela
            colunas={["", "Arquiteto", "Cliente"]}
            linhas={[
              ["Como entra", "Com a conta Google", "Com o link do projeto + a chave de acesso + o nome"],
              ["Cria e arquiva projetos", "Sim", "Não"],
              ["Cria, edita e remove itens", "Sim", "Não"],
              ["Marca Feito e Pago", "Sim", "Sim"],
              ["Vê Resumo, Itens, Acompanhar e Gráficos", "Sim", "Sim"],
              ["Publica avisos no feed, cria visitas e ocorrências", "Sim", "Não"],
              ["Adiciona e confere pontos da vistoria (OK ou Ajustar)", "Sim", "Sim"],
              ["Encaminha atualizações pelo WhatsApp", "Tudo", "Só a vistoria, ao arquiteto"],
              ["Vê a aba Escopo", "Sim", "Não"],
              ["Gera orçamento em PDF", "Sim", "Sim"],
              ["Gera o relatório mensal", "Sim", "Não"],
              ["Registra o prazo previsto", "Sim", "Não"],
              ["Usa catálogo, composições, fornecedores e financeiro", "Sim (são só dele)", "Não"],
            ]}
          />
          <Aviso tipo="atencao" titulo="O cliente também muda dados">
            O cliente pode marcar qualquer item como Feito ou Pago e pode alterar o Orçamento disponível (o teto) nos ajustes do projeto. Isso é proposital, para ele participar do acompanhamento. Ele não consegue criar nem apagar itens.
          </Aviso>
        </>
      ),
    },
    {
      id: "conceitos",
      titulo: "Os conceitos principais",
      corpo: (
        <>
          <H3>Projeto</H3>
          <P>É a unidade de trabalho: uma obra, reforma ou serviço de um cliente. Cada projeto tem nome, uma chave de acesso, um orçamento, um escopo e um prazo. (No começo o app usava a palavra “obra”; hoje tudo é “projeto”.)</P>
          <H3>Item</H3>
          <P>Cada linha do orçamento é um item: um serviço ou material, como “Tinta acrílica 18L” ou “Pontos de tomada”. Um item tem etapa, ambiente, quantidade, unidade e valores, e duas marcas: Feito e Pago.</P>
          <H3>Etapa e ambiente</H3>
          <P>
            A <strong>etapa</strong> é a fase da obra (Alvenaria, Elétrica, Pintura). O <strong>ambiente</strong> é o espaço (Cozinha, Suíte). Os dois são texto livre: escreva “Elétrica” sempre do mesmo jeito, porque “Elétrica” e “Eletrica” viram grupos diferentes. Itens sem etapa ou ambiente ficam em “Sem definição”; se o ambiente ficar vazio, vira “Geral”.
          </P>
          <H3>Feito e Pago</H3>
          <P>
            <Btn>Feito</Btn> quer dizer que o serviço foi executado. <Btn>Pago</Btn> quer dizer que o valor foi pago. Um item só é considerado <strong>concluído</strong> quando está feito <em>e</em> pago. Ao marcar, o app guarda quem marcou e a data.
          </P>
          <H3>Orçado, real e valor efetivo</H3>
          <Lista>
            <li><strong>Orçado</strong>: o que você previu para o item (por padrão, quantidade × valor unitário).</li>
            <li><strong>Real</strong>: quanto o item realmente custou. É opcional.</li>
            <li><strong>Valor efetivo</strong>: o valor que conta nas somas. É o real, se for maior que zero; senão, o orçado.</li>
          </Lista>
          <H3>Teto (orçamento disponível)</H3>
          <P>É o quanto o cliente tem para gastar no total. Com ele o app calcula o saldo em caixa e avisa se a projeção de custo passar do limite.</P>
          <H3>Prazo e previsões</H3>
          <P>O prazo é registrado como uma previsão inicial que nunca pode ser editada. Se o prazo mudar, você registra uma nova previsão, com motivo, e as anteriores continuam visíveis. Veja a página <Ir para="prazo">Prazo do projeto</Ir>.</P>
          <H3>Escopo</H3>
          <P>É o que foi combinado com o cliente: os ambientes e os pedidos dele em cada espaço. Cada pedido pode ser ligado a itens do orçamento.</P>
        </>
      ),
    },
    {
      id: "onde-ficam-dados",
      titulo: "Onde os dados ficam",
      corpo: (
        <>
          <P>O app funciona de dois jeitos, conforme a instalação:</P>
          <Lista>
            <li>
              <strong>Na nuvem (Firebase)</strong>: o arquiteto entra com Google e tudo é salvo online. O cliente abre o projeto de qualquer aparelho com o link e a chave. As mudanças aparecem ao vivo para os dois lados.
            </li>
            <li>
              <strong>Modo demo</strong>: sem o Firebase configurado, o app roda só no navegador, com os dados guardados nele. Aparece a etiqueta “Modo demo · dados só neste navegador”. Serve para testar; o link do projeto só funciona no mesmo navegador.
            </li>
          </Lista>
          <Aviso tipo="dica">Se você está testando no modo demo, ao recarregar a página você precisa entrar de novo, mas os projetos e itens continuam lá.</Aviso>
        </>
      ),
    },
  ],
};
