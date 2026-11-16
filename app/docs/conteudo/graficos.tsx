import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, H3, Lista, P } from "../ui";

export const graficos: PaginaDoc = {
  slug: "graficos",
  grupo: "Projetos",
  titulo: "Gráficos",
  resumo: "Os oito painéis da aba Gráficos e como ler cada um.",
  secoes: [
    {
      id: "geral",
      titulo: "Visão geral",
      papel: "todos",
      corpo: (
        <>
          <P>
            A aba <Btn>Gráficos</Btn> reúne oito painéis, na ordem abaixo. Arquiteto e cliente veem os mesmos. Com o olhinho ligado, os eixos e rótulos de valor ficam vazios e as dicas ao tocar mostram a máscara (“R$ ••••”).
          </P>
        </>
      ),
    },
    {
      id: "leitura-rapida",
      titulo: "1. Leitura rápida",
      corpo: (
        <>
          <P>Cartões com os pontos que mais merecem atenção agora:</P>
          <Lista>
            <li><strong>Maior fatia</strong>: a etapa mais cara e quanto do orçamento ela concentra.</li>
            <li><strong>Feito, falta pagar</strong>: o valor dos itens executados e ainda não pagos (ou “Em dia”).</li>
            <li><strong>Projeção × teto</strong>: a folga, ou quanto passou do teto (ou “Teto não definido”).</li>
            <li><strong>Real × orçado</strong>: a diferença total entre o previsto e o orçado, em R$ e em %.</li>
            <li><strong>Mais adiantada</strong>: a etapa não concluída com maior percentual de itens concluídos.</li>
          </Lista>
        </>
      ),
    },
    {
      id: "orcamento-em-foco",
      titulo: "2. Orçamento em foco",
      corpo: (
        <P>
          Duas barras na mesma escala: <strong>Projeção de custo</strong> e <strong>Já pago</strong>, com uma linha tracejada no valor do teto. A barra da projeção fica laranja se passar da linha. Uma legenda diz se a projeção cabe no teto ou o orienta a defini-lo.
        </P>
      ),
    },
    {
      id: "onde-esta-o-dinheiro",
      titulo: "3. Onde está o dinheiro",
      corpo: (
        <>
          <P>Uma barra dividida em quatro fases, por valor, com o percentual e a quantidade de itens de cada uma:</P>
          <Lista>
            <li><strong>Concluído</strong>: feito e pago.</li>
            <li><strong>Feito, falta pagar</strong>.</li>
            <li><strong>Pago, falta executar</strong>.</li>
            <li><strong>Não iniciado</strong>: nem feito nem pago.</li>
          </Lista>
        </>
      ),
    },
    {
      id: "para-onde-vai",
      titulo: "4. Para onde vai o dinheiro",
      corpo: (
        <P>
          Um mapa em blocos (treemap). Use os botões <Btn>etapa</Btn> e <Btn>ambiente</Btn> para escolher o agrupamento. O tamanho de cada bloco é a fatia do orçamento; ao tocar, a dica mostra o valor e o percentual.
        </P>
      ),
    },
    {
      id: "ritmo",
      titulo: "5. Ritmo de pagamento",
      corpo: (
        <>
          <P>
            “Pago por mês e acumulado”: barras com o valor pago em cada mês e uma linha com o acumulado. Usa a data em que o item foi marcado como pago.
          </P>
          <Aviso tipo="nota" titulo="Pagamentos sem data">
            Itens marcados como pagos antes de o app guardar datas, ou criados já marcados no formulário, ficam fora do gráfico, e um aviso diz quantos. Para incluí-los, desmarque e marque Pago de novo.
          </Aviso>
        </>
      ),
    },
    {
      id: "estouros",
      titulo: "6. Estouros e economias",
      corpo: (
        <P>
          “Real × orçado por etapa”: barras laranja para etapas que custaram mais que o orçado e verdes para as que custaram menos, até 12 etapas, com a diferença em R$. Só aparecem diferenças, que dependem de você informar o valor real dos itens. Sem diferenças, o painel diz que tudo está no orçado.
        </P>
      ),
    },
    {
      id: "andamento",
      titulo: "7. Andamento",
      corpo: (
        <P>
          Duas listas de barras horizontais, “Por etapa” e “Por ambiente”, com o valor <strong>Pago</strong> (verde) e <strong>A pagar</strong> (cinza) e o total ao final.
        </P>
      ),
    },
    {
      id: "maiores-itens",
      titulo: "8. Maiores itens",
      corpo: (
        <>
          <P>O “Top 10 itens mais caros”, pelo valor orçado.</P>
          <H3>Qual valor cada painel usa?</H3>
          <P>
            A rosca “Composição do orçamento” e o Top 10 usam o valor <strong>orçado</strong>. Os demais painéis usam o valor <strong>efetivo</strong> (real, quando houver; senão orçado).
          </P>
        </>
      ),
    },
  ],
};
