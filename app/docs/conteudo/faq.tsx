import type { PaginaDoc } from "../tipos";
import { Btn, H3, Ir, P } from "../ui";

export const faq: PaginaDoc = {
  slug: "perguntas-frequentes",
  grupo: "Referência",
  titulo: "Perguntas frequentes",
  resumo: "Dúvidas comuns e armadilhas, com a resposta direta.",
  secoes: [
    {
      id: "acesso",
      titulo: "Acesso",
      corpo: (
        <>
          <H3>O cliente diz que o código está incorreto.</H3>
          <P>Confira se o link é do projeto certo e se a chave foi digitada igual à do rodapé do cartão do projeto. As letras viram maiúsculas sozinhas.</P>
          <H3>Posso trocar a chave de acesso?</H3>
          <P>Não. Ela é definida na criação. Para trocar, crie um novo projeto (a partir do atual, se quiser) e arquive o antigo.</P>
          <H3>O cliente precisa digitar a chave toda vez?</H3>
          <P>Não no mesmo aparelho. Em outro aparelho, ou depois de tocar em Sair, sim.</P>
          <H3>Recarreguei a página e fui deslogado.</H3>
          <P>No modo demo isso é normal. Entre de novo; os dados continuam.</P>
        </>
      ),
    },
    {
      id: "itens",
      titulo: "Itens, valores e andamento",
      corpo: (
        <>
          <H3>Por que o percentual do topo é diferente da barra “Serviços concluídos”?</H3>
          <P>O topo conta itens feitos <em>e</em> pagos; a barra conta só feitos. Veja <Ir para="tela-do-projeto">Tela do projeto e Resumo</Ir>.</P>
          <H3>Por que o “Orçado” do cartão na home mostra um valor diferente do orçado?</H3>
          <P>O cartão mostra a projeção: usa o valor real quando o item tem, e o orçado nos demais.</P>
          <H3>Mudei o valor real e o orçado não mudou.</H3>
          <P>O orçado só se recalcula ao mexer em quantidade ou valor unitário. O real não altera o orçado; ele passa a valer como valor efetivo.</P>
          <H3>Criei um item já marcado como feito, mas ele não aparece no relatório mensal.</H3>
          <P>Itens criados já marcados não ganham a data de execução. Desmarque e marque Feito (e Pago) de novo na lista de itens.</P>
          <H3>“Elétrica” e “Eletrica” aparecem como etapas diferentes.</H3>
          <P>Etapas e ambientes são texto livre; a grafia precisa ser igual. Edite os itens para uniformizar.</P>
        </>
      ),
    },
    {
      id: "prazo",
      titulo: "Prazo",
      corpo: (
        <>
          <H3>Registrei o prazo errado. Como corrijo?</H3>
          <P>A previsão original não pode ser editada nem apagada. Registre uma nova previsão com o motivo; a anterior continua visível. Veja <Ir para="prazo">Prazo do projeto</Ir>.</P>
          <H3>Por que o botão de nova previsão não habilita?</H3>
          <P>O término precisa ser depois do início, precisa mudar em relação à previsão atual e o motivo precisa ter pelo menos 8 caracteres.</P>
        </>
      ),
    },
    {
      id: "pdf",
      titulo: "PDFs e relatório",
      corpo: (
        <>
          <H3>Não encontro o botão de baixar o PDF.</H3>
          <P>Não há download direto. Abra o documento e toque em <Btn>Imprimir / salvar PDF</Btn>; na janela de impressão, escolha “Salvar como PDF”.</P>
          <H3>O olhinho não escondeu os valores do PDF.</H3>
          <P>Os documentos sempre trazem os valores reais. No relatório mensal, desmarque “Mostrar os valores em R$ no relatório”.</P>
          <H3>O botão de gerar o relatório está apagado.</H3>
          <P>Há um item marcado para entrar que não está feito nem pago, ou nada foi incluído e não há destaques. Veja <Ir para="relatorio-mensal">Relatório mensal</Ir>.</P>
          <H3>Onde está a marca d’água?</H3>
          <P>Não há marca d’água. Todo PDF termina com o selo discreto “Gerado com Pitangueira · gestão de projetos”.</P>
        </>
      ),
    },
    {
      id: "projetos",
      titulo: "Projetos",
      corpo: (
        <>
          <H3>Arquivei o projeto. O cliente perdeu o acesso?</H3>
          <P>Não. Arquivar só tira da sua lista principal; o cliente continua entrando com link e chave.</P>
          <H3>Excluí um projeto. Perdi o catálogo e os honorários?</H3>
          <P>Não. Catálogo, composições, fornecedores e honorários são pessoais e continuam.</P>
        </>
      ),
    },
  ],
};
