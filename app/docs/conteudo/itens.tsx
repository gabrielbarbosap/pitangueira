import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, H3, Ir, Lista, P, Passo, Passos, Tabela } from "../ui";

export const itens: PaginaDoc = {
  slug: "itens",
  grupo: "Projetos",
  titulo: "Itens do orçamento",
  resumo: "Como listar, buscar, adicionar, editar e marcar como feito e pago os itens do projeto.",
  secoes: [
    {
      id: "lista",
      titulo: "A lista de itens",
      papel: "todos",
      corpo: (
        <>
          <P>A aba <Btn>Itens</Btn> mostra o título “Itens do orçamento” e, no arquiteto, o botão <Btn>+ Item</Btn> e as pílulas <Btn>Catálogo</Btn>, <Btn>Composições</Btn> e <Btn>Orçamento em PDF</Btn>. O cliente vê só <Btn>Orçamento em PDF</Btn>.</P>
          <H3>Agrupamento</H3>
          <P>Os itens aparecem em seções. Use <Btn>Agrupar por</Btn> para escolher <Btn>Etapa</Btn> ou <Btn>Ambiente</Btn>. As seções se ordenam assim: em progresso primeiro, depois concluídas, depois pendentes; dentro de cada status, da mais cara para a mais barata. Itens sem etapa ou ambiente ficam em “Sem definição”.</P>
          <P>O cabeçalho de cada seção mostra o status (Pendente, Em progresso ou Concluído), “N/M feitos”, “R$ pago de R$ previsto” e uma barra de valor pago. O botão de expandir mostra ou recolhe os itens.</P>
          <H3>Linha de item</H3>
          <Lista>
            <li>A descrição (riscada quando está feito) e o detalhe “quantidade × valor unitário · fornecedor · observação”.</li>
            <li>Os botões <Btn>Feito</Btn> e <Btn>Pago</Btn>, que alternam a marca ao tocar.</li>
            <li>O valor: o real, se houver, senão o orçado. Se o real for diferente do orçado, o orçado aparece riscado embaixo.</li>
            <li>Para o arquiteto, os botões de editar e de lixeira (“Remover item”).</li>
          </Lista>
        </>
      ),
    },
    {
      id: "busca",
      titulo: "Buscar e filtrar",
      papel: "todos",
      corpo: (
        <>
          <P>O campo “Buscar serviço, fornecedor, etapa ou valor…” procura, sem diferenciar maiúsculas nem acentos, na descrição, etapa, ambiente, fornecedor, observação, valores e quantidade. Com busca ou filtro ativo, o contador muda para “N de M itens” e todas as seções se abrem sozinhas. O botão ✕ limpa a busca.</P>
          <P>Ao tocar numa etapa do cartão <em>Em andamento</em>, a lista abre filtrada nela, com a pílula “Etapa: X ✕” para remover o filtro.</P>
        </>
      ),
    },
    {
      id: "marcar",
      titulo: "Marcar Feito e Pago",
      papel: "todos",
      corpo: (
        <>
          <Passos>
            <Passo>Na linha do item, toque em <Btn>Feito</Btn> quando o serviço for executado.</Passo>
            <Passo>Toque em <Btn>Pago</Btn> quando o valor for pago. Cada botão mostra ✓ quando está ativo.</Passo>
            <Passo>Para desfazer, toque de novo no botão.</Passo>
          </Passos>
          <Aviso tipo="nota" titulo="Data e autor ficam registrados">
            Ao marcar, o app guarda quem marcou (o nome de quem está logado) e a data e hora. Ao desmarcar, apaga esses dados. Se marcar de novo, vale a nova data. Essas datas alimentam o relatório mensal, o gráfico de ritmo de pagamento e o histórico dos fornecedores.
          </Aviso>
          <H3>Marcar a seção inteira</H3>
          <P>
            No cabeçalho de cada seção há também <Btn>Feito</Btn> e <Btn>Pago</Btn>. Ao tocar, o app pede confirmação (“Marcar todos os N itens de ‘X’ como feitos?”) e marca todos de uma vez. Se todos já estão marcados, o botão desmarca. Com uma busca ativa, vale só para os itens visíveis daquela seção.
          </P>
          <Aviso tipo="atencao" titulo="Item criado já marcado">
            Se você criar um item já com Feito ou Pago marcados no formulário, ele não recebe a data de execução ou de pagamento. Para ter a data (necessária para entrar em um mês do relatório), marque Feito e Pago na lista depois de criar o item.
          </Aviso>
        </>
      ),
    },
    {
      id: "novo-item",
      titulo: "Adicionar um item",
      papel: "arquiteto",
      corpo: (
        <>
          <Passos>
            <Passo>Toque em <Btn>+ Item</Btn> (ou em <Btn>Adicionar primeiro item</Btn>, no projeto vazio).</Passo>
            <Passo>Se tiver catálogo, comece pela busca <Btn>Buscar no meu catálogo</Btn>: ao escolher uma sugestão, o formulário já vem preenchido.</Passo>
            <Passo>Preencha pelo menos <Btn>Etapa</Btn> e <Btn>Descrição</Btn>. O botão <Btn>Adicionar item</Btn> só habilita com os dois.</Passo>
            <Passo>Informe <Btn>Qtd.</Btn>, <Btn>Unid.</Btn> e <Btn>Valor unit.</Btn>. O <Btn>Orçado</Btn> é calculado sozinho.</Passo>
            <Passo>Toque em <Btn>Adicionar item</Btn>.</Passo>
          </Passos>
          <H3>Todos os campos</H3>
          <Tabela
            colunas={["Campo", "Para que serve"]}
            linhas={[
              ["Etapa", "Fase da obra. Obrigatório. Sugere as etapas que já existem no projeto."],
              ["Ambiente", "Espaço da obra. Se ficar vazio, vira “Geral”."],
              ["Descrição", "O nome do serviço ou material. Obrigatório."],
              ["Qtd.", "Quantidade. Padrão 1."],
              ["Unid.", "Unidade (sugestões: un, m², m, m³, kg, vb, h, dia, pç)."],
              ["Valor unit.", "Preço de uma unidade."],
              ["Orçado", "Valor previsto. Calculado como quantidade × valor unitário; você pode ajustar à mão."],
              ["Valor real (R$)", "Quanto realmente custou. Se ficar vazio, vale o orçado."],
              ["Fornecedor (opcional)", "Quem executa ou vende. Alimenta o histórico em Fornecedores."],
              ["Prazo de entrega (opcional)", "Data limite. Vale até o fim do dia."],
              ["Observação (opcional)", "Qualquer nota."],
              ["Feito / Pago", "Marcas iniciais do item."],
              ["Guardar no meu catálogo…", "Salva o item no seu catálogo para usar em outros projetos."],
            ]}
          />
          <Aviso tipo="nota" titulo="Como o Orçado é calculado">
            O Orçado só é recalculado enquanto você muda a quantidade ou o valor unitário, e somente se os dois forem diferentes de zero. Depois disso você pode digitar outro valor no Orçado. Todas as somas, gráficos e PDFs usam o <strong>valor efetivo</strong>: o real, se for maior que zero, senão o orçado. Veja <Ir para="orcamento-e-valores">Orçamento e valores</Ir>.
          </Aviso>
        </>
      ),
    },
    {
      id: "editar-remover",
      titulo: "Editar e remover",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            O botão de editar abre a mesma janela, agora como “Editar item”, com o botão <Btn>Salvar alterações</Btn>. Editar um item não regrava as datas de Feito e Pago, a menos que você mude essas marcas.
          </P>
          <P>
            A lixeira (“Remover item”) pede confirmação: “Remover ‘X’? Essa ação não pode ser desfeita.” Pedidos do escopo que apontavam para o item simplesmente deixam de contá-lo.
          </P>
        </>
      ),
    },
  ],
};
