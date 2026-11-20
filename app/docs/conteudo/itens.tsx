import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, Cod, H3, Ir, Lista, P, Passo, Passos, Tabela } from "../ui";

export const itens: PaginaDoc = {
  slug: "itens",
  grupo: "Projetos",
  titulo: "Itens do orçamento",
  resumo: "Como montar o orçamento rápido (itens em sequência, etapas, planilha), listar, buscar, editar e marcar como feito e pago.",
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
          <Aviso tipo="nota" titulo="Data e autor ficam registrados, e aparecem">
            Ao marcar, o app guarda quem marcou e a data e hora, e mostra isso embaixo do item: “Feito por Gabriel em 12/11 14:30 · Pago por Marina (cliente) em 13/11 09:10”. Quando quem marcou é o cliente, o nome vem com “(cliente)”. Ao desmarcar, os dados são apagados; se marcar de novo, vale a nova data e o novo autor. As datas alimentam o relatório mensal, o gráfico de ritmo de pagamento e o histórico dos fornecedores. Os itens mais recentes também aparecem em <Ir para="tela-do-projeto">Atividade recente</Ir>, no Resumo.
          </Aviso>
          <H3>Marcar a seção inteira</H3>
          <P>
            No cabeçalho de cada seção há também <Btn>Feito</Btn> e <Btn>Pago</Btn>. Ao tocar, o app pede confirmação (“Marcar todos os N itens de ‘X’ como feitos?”) e marca todos de uma vez. Se todos já estão marcados, o botão desmarca. Com uma busca ativa, vale só para os itens visíveis daquela seção.
          </P>
          <Aviso tipo="dica" titulo="Item criado já marcado">
            Se você criar um item já com Feito ou Pago marcados no formulário, ele também recebe a data e o autor, como se tivesse sido marcado na lista. Itens marcados há muito tempo, antes de o app guardar datas, ficam sem data e não entram em nenhum mês do relatório.
          </Aviso>
        </>
      ),
    },
    {
      id: "montar-rapido",
      titulo: "Montar o orçamento rápido",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            Um orçamento tem dezenas de itens, então a Pitangueira tem caminhos para cada jeito de trabalhar. No projeto vazio aparecem três cartões e atalhos de etapa:
          </P>
          <Tabela
            colunas={["Caminho", "Quando usar"]}
            linhas={[
              [<Btn key="1">Adicionar primeiro item</Btn>, "Você vai digitando. Na janela, “Adicionar e lançar outro” guarda o item e deixa tudo pronto para o próximo."],
              [<Btn key="2">Colar da planilha</Btn>, "Você já tem o orçamento no Excel ou no Google Planilhas. Veja a seção abaixo."],
              [<Btn key="3">Usar meu catálogo</Btn>, "Você reaproveita itens e preços salvos de outros projetos."],
              ["Atalhos de etapa (Demolição, Alvenaria, Elétrica…)", "Abrem o novo item já com a etapa preenchida."],
            ]}
          />
          <H3>Lançar vários itens em sequência</H3>
          <Passos>
            <Passo>Abra <Btn>+ Item</Btn> (ou o <Btn>+</Btn> de uma etapa na lista, que já traz a etapa preenchida).</Passo>
            <Passo>Preencha descrição, quantidade e valor unitário. O total do item aparece sozinho.</Passo>
            <Passo>Toque em <Btn>Adicionar e lançar outro</Btn>. Uma faixa verde confirma, a etapa continua e o resto é limpo.</Passo>
            <Passo>Repita. No último, toque em <Btn>Adicionar e fechar</Btn> (ou feche a janela).</Passo>
          </Passos>
          <Aviso tipo="dica">Quando o projeto já tem etapas, elas aparecem como botões abaixo do campo Etapa. Tocar em um evita erro de digitação (“Elétrica” e “Eletrica” viram etapas diferentes).</Aviso>
          <H3>O + de cada etapa</H3>
          <P>
            Cada etapa (ou ambiente, se você agrupar por ambiente) tem um botão <Btn>+</Btn> no cabeçalho, ao lado de Feito e Pago. Ele abre o novo item já nela. Em “Sem definição” o botão abre o item em branco.
          </P>
        </>
      ),
    },
    {
      id: "total",
      titulo: "O total à vista",
      papel: "todos",
      corpo: (
        <>
          <P>
            No topo da aba Itens, o cartão <strong>Total do orçamento</strong> mostra o valor somado, quantos itens e etapas há e, se o projeto tem teto, a folga (“Folga de R$ X”) ou o estouro (“Passou R$ X do teto”). Sem teto, ele convida a defini-lo em Ajustes.
          </P>
          <P>
            Se algum item está sem valor, o cartão avisa (“2 itens sem valor”) e a linha desse item mostra a etiqueta <strong>Sem valor</strong>. O cliente também vê o total.
          </P>
        </>
      ),
    },
    {
      id: "planilha",
      titulo: "Colar da planilha",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            Em <Btn>Colar da planilha</Btn> (na aba Itens, ou no projeto vazio) você copia as linhas no Excel ou no Google Planilhas e cola em uma caixa. Antes de importar, o app mostra uma tabela de como entendeu cada linha, com o total e os avisos. Só então você toca em <Btn>Importar N itens</Btn>.
          </P>
          <Passos>
            <Passo>No Excel ou Planilhas, selecione as linhas e copie.</Passo>
            <Passo>Na Pitangueira, abra <Btn>Colar da planilha</Btn> e cole em <Btn>Cole as linhas aqui</Btn>.</Passo>
            <Passo>Confira a tabela. Linhas sem etapa usam a <Btn>Etapa para as linhas sem etapa</Btn> (padrão “Sem etapa”).</Passo>
            <Passo>Toque em <Btn>Importar N itens</Btn>.</Passo>
          </Passos>
          <H3>Ordem das colunas</H3>
          <P>A ordem padrão é <strong>Etapa · Descrição · Qtd · Unid · Valor unit.</strong> Se a primeira linha tiver títulos (como “Etapa”, “Descrição”, “Qtd”, “Unid”, “Valor”), o app reconhece e a ordem pode ser qualquer uma. Sem títulos, vale a quantidade de colunas da linha:</P>
          <Tabela
            colunas={["Colunas", "O app entende como"]}
            linhas={[
              ["5", "Etapa, Descrição, Qtd, Unid, Valor unit."],
              ["4", "Descrição, Qtd, Unid, Valor unit. (sem etapa)"],
              ["3", "Descrição, Qtd, Valor unit."],
              ["2", "Descrição, Valor unit."],
              ["1", "Só a descrição"],
            ]}
          />
          <H3>Regras de leitura</H3>
          <Lista>
            <li>Separadores aceitos: tabulação (o que vem do Excel), ponto e vírgula <Cod>;</Cod> e barra vertical <Cod>|</Cod>.</li>
            <li>Valores aceitam “R$ 1.234,56”, “1234,56” e “1234.56”. “1.234” vale mil duzentos e trinta e quatro.</li>
            <li>Quantidade vazia ou inválida vira 1. O total de cada linha é a quantidade × o valor unitário.</li>
            <li>Linha sem valor entra mesmo assim, marcada “sem valor”, para você preencher depois.</li>
            <li>Linha sem descrição é ignorada, e o app diz quantas ignorou.</li>
            <li>Todos os itens importados entram com ambiente “Geral”.</li>
          </Lista>
        </>
      ),
    },
    {
      id: "novo-item",
      titulo: "A janela do item",
      papel: "arquiteto",
      corpo: (
        <>
          <Passos>
            <Passo>Toque em <Btn>+ Item</Btn> (ou em <Btn>Adicionar primeiro item</Btn>, no projeto vazio).</Passo>
            <Passo>Se tiver catálogo, comece pela busca <Btn>Buscar no meu catálogo</Btn>: ao escolher uma sugestão, o formulário já vem preenchido.</Passo>
            <Passo>Preencha pelo menos <Btn>Etapa</Btn> e <Btn>Descrição</Btn>. Os botões de adicionar só habilitam com os dois.</Passo>
            <Passo>Informe <Btn>Qtd.</Btn>, <Btn>Unid.</Btn> e <Btn>Valor unit.</Btn>. O <Btn>Total do item (R$)</Btn> é calculado sozinho.</Passo>
            <Passo>Toque em <Btn>Adicionar item</Btn> (guarda e fecha) ou em <Btn>Adicionar e lançar outro</Btn> (guarda e continua).</Passo>
          </Passos>
          <P>
            A janela mostra só o essencial: etapa, descrição, quantidade, unidade, valor unitário e o total. O restante fica em <Btn>Mais detalhes</Btn>, que abre ao tocar (e já vem aberto ao editar um item que tem esses dados).
          </P>
          <H3>Todos os campos</H3>
          <Tabela
            colunas={["Campo", "Para que serve"]}
            linhas={[
              ["Etapa", "Fase da obra. Obrigatório. Botões com as etapas que já existem no projeto evitam erro de digitação."],
              ["Ambiente (em Mais detalhes)", "Espaço da obra. Se ficar vazio, vira “Geral”."],
              ["Descrição", "O nome do serviço ou material. Obrigatório."],
              ["Qtd.", "Quantidade. Padrão 1."],
              ["Unid.", "Unidade (sugestões: un, m², m, m³, kg, vb, h, dia, pç)."],
              ["Valor unit.", "Preço de uma unidade."],
              ["Total do item (R$)", "O valor orçado do item. Calculado como quantidade × valor unitário; se o valor for fechado (verba, empreitada), digite o total direto."],
              ["Valor real (R$) (em Mais detalhes)", "Quanto realmente custou. Se ficar vazio, vale o orçado."],
              ["Fornecedor (opcional) (em Mais detalhes)", "Quem executa ou vende. Alimenta o histórico em Fornecedores."],
              ["Prazo de entrega (opcional) (em Mais detalhes)", "Data limite. Vale até o fim do dia."],
              ["Observação (opcional) (em Mais detalhes)", "Qualquer nota."],
              ["Feito / Pago (em Mais detalhes)", "Marcas iniciais do item."],
              ["Guardar no meu catálogo… (em Mais detalhes)", "Salva o item no seu catálogo para usar em outros projetos."],
            ]}
          />
          <Aviso tipo="nota" titulo="Como o Orçado é calculado">
            O Total do item só é recalculado enquanto você muda a quantidade ou o valor unitário, e somente se os dois forem diferentes de zero. Depois disso você pode digitar outro valor no Total. Todas as somas, gráficos e PDFs usam o <strong>valor efetivo</strong>: o real, se for maior que zero, senão o orçado. Veja <Ir para="orcamento-e-valores">Orçamento e valores</Ir>.
          </Aviso>
        </>
      ),
    },
    {
      id: "valor-alterado",
      titulo: "Quando o valor de um item muda",
      papel: "todos",
      corpo: (
        <>
          <P>
            Sempre que o valor de um item muda (o <Btn>Total do item</Btn> ou o <Btn>Valor real</Btn>), o app deixa claro se o novo valor é <strong>maior</strong> ou <strong>menor</strong> que o anterior.
          </P>
          <Lista>
            <li><strong>Ao editar</strong>, abaixo do total aparece um aviso antes de salvar: “▲ R$ 200,00 a mais que o valor atual (R$ 1.000,00). Novo valor: R$ 1.200,00.” (laranja, quando sobe) ou “▼ R$ 300,00 a menos…” (verde, quando desce).</li>
            <li><strong>No item</strong>, depois de salvo, aparece embaixo do valor: “▲ R$ 200,00 a mais (era R$ 1.000,00)”. O cliente também vê.</li>
            <li><strong>Na linha do tempo</strong>, cada mudança vira um cartão “Valor alterado: …”, com “R$ 1.000,00 → R$ 1.200,00” e a etiqueta “mais caro” ou “mais barato”. O filtro <Btn>Valores</Btn> mostra só elas.</li>
          </Lista>
          <P>O que conta é o valor efetivo (o real, se informado; senão o orçado). O app guarda as últimas 20 mudanças de cada item, com quem mudou e quando.</P>
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
