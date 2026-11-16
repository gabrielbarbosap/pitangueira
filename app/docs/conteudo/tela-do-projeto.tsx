import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, H3, Ir, Lista, P, Tabela } from "../ui";

export const telaDoProjeto: PaginaDoc = {
  slug: "tela-do-projeto",
  grupo: "Projetos",
  titulo: "Tela do projeto e Resumo",
  resumo: "O topo, a navegação por abas, o botão voltar e cada bloco da aba Resumo.",
  secoes: [
    {
      id: "topo",
      titulo: "O topo do projeto",
      papel: "todos",
      corpo: (
        <>
          <P>O topo laranja mostra o nome do projeto, quem está logado (e “· cliente”, se for o caso), o percentual concluído e uma barra de progresso. O percentual do topo conta os itens que estão <strong>feitos e pagos</strong> ao mesmo tempo.</P>
          <Tabela
            colunas={["Botão", "O que faz"]}
            linhas={[
              ["Seta de voltar", "Em qualquer aba que não seja o Resumo, volta ao Resumo (“Voltar ao início do projeto”). Já no Resumo, volta à home (“Voltar ao painel”)."],
              [<Btn key="a">?</Btn>, "Abre o tutorial do projeto."],
              ["Olhinho", "Oculta ou mostra os valores em dinheiro."],
              ["Engrenagem", "Ajustes do projeto (nome e teto)."],
              [<Btn key="b">Sair</Btn>, "Encerra a sessão."],
            ]}
          />
          <Aviso tipo="dica">O botão voltar sempre leva primeiro ao início do projeto. Só quando você já está nele é que ele leva à sua home.</Aviso>
        </>
      ),
    },
    {
      id: "abas",
      titulo: "As abas",
      papel: "todos",
      corpo: (
        <>
          <P>O menu em pílula fica fixo na parte de baixo da tela. O arquiteto vê quatro abas e o cliente vê três:</P>
          <Tabela
            colunas={["Aba", "Para que serve", "Quem vê"]}
            linhas={[
              ["Resumo", "Visão geral: em andamento, prazo, relatório, valores e gráficos principais.", "Arquiteto e cliente"],
              ["Itens", "O orçamento: lista de itens, marcar Feito e Pago, catálogo, composições e PDF.", "Arquiteto e cliente"],
              ["Gráficos", "Oito painéis visuais sobre dinheiro e andamento.", "Arquiteto e cliente"],
              ["Escopo", "Ambientes e pedidos do cliente, ligados ao orçamento.", "Só o arquiteto"],
            ]}
          />
          <P>Em um projeto sem itens, o Resumo mostra o cartão de prazo e o convite “Nenhum item neste projeto ainda”, com três caminhos (<Btn>Adicionar primeiro item</Btn>, <Btn>Colar da planilha</Btn> e <Btn>Usar meu catálogo</Btn>) e atalhos de etapa. O cliente vê “O arquiteto ainda não cadastrou o orçamento.”</P>
        </>
      ),
    },
    {
      id: "em-andamento",
      titulo: "Cartão Em andamento",
      papel: "todos",
      corpo: (
        <>
          <P>É o primeiro bloco do Resumo. Mostra as <strong>etapas em progresso</strong>: aquelas em que algum item foi feito ou pago, mas nem todos estão concluídos.</P>
          <Lista>
            <li>Aparecem até 4 etapas, as mais próximas do fim primeiro. Com mais de 4, surge <Btn>Ver todas (N)</Btn>.</li>
            <li>Cada etapa tem um anel de percentual, “N de M itens concluídos”, as barras <strong>Executado</strong> (itens feitos) e <strong>Pago</strong> (valor pago) e até 3 itens “no meio do caminho”.</li>
            <li>“Feito · falta pagar” indica um item executado mas não pago. “Pago · falta executar” indica o contrário.</li>
            <li>Tocar numa etapa abre a aba Itens já filtrada nela.</li>
            <li>O subtítulo resume: “2 etapas · 5 itens em andamento” ou “Nada em execução agora.”</li>
          </Lista>
        </>
      ),
    },
    {
      id: "atividade",
      titulo: "Atividade recente",
      papel: "todos",
      corpo: (
        <>
          <P>
            Logo abaixo do prazo, o cartão <strong>Atividade recente</strong> lista as últimas marcações de Feito e Pago: quem marcou, qual item, em que etapa e quando (“hoje 14:30”, “ontem 09:10” ou “12/11 14:30”).
          </P>
          <Lista>
            <li>Quando quem marcou é o cliente, o nome ganha a etiqueta <strong>cliente</strong>, para o arquiteto ver de relance o que foi mexido por ele.</li>
            <li>Aparecem as 6 marcações mais recentes. Itens marcados antes de o app guardar datas não entram aqui.</li>
            <li>Arquiteto e cliente veem o mesmo cartão.</li>
          </Lista>
        </>
      ),
    },
    {
      id: "cartoes",
      titulo: "Prazo e relatório",
      corpo: (
        <Lista>
          <li>
            <strong>Prazo do projeto</strong>: previsão, situação e linha do tempo. Veja <Ir para="prazo">Prazo do projeto</Ir>.
          </li>
          <li>
            <strong>Relatório mensal de andamento</strong> (só arquiteto): resumo do mês e botão <Btn>Gerar relatório</Btn>. Veja <Ir para="relatorio-mensal">Relatório mensal</Ir>.
          </li>
        </Lista>
      ),
    },
    {
      id: "valores",
      titulo: "Valores e barras",
      papel: "todos",
      corpo: (
        <>
          <H3>Cartões de dinheiro</H3>
          <Lista>
            <li><strong>Já pago</strong>: soma dos itens pagos, com o percentual do previsto.</li>
            <li><strong>Falta pagar</strong>: soma dos itens ainda não pagos.</li>
            <li><strong>Orçamento disponível</strong>: o teto do projeto (ou “—”, com o convite a defini-lo nos ajustes).</li>
            <li><strong>Saldo em caixa</strong>: teto menos o já pago. Fica laranja se for negativo.</li>
          </Lista>
          <H3>Barras</H3>
          <Tabela
            colunas={["Barra", "O que mede"]}
            linhas={[
              ["Execução financeira (pago)", "Valor pago ÷ valor previsto."],
              ["Serviços concluídos", "Percentual de itens feitos (aqui conta só o Feito, sem exigir o Pago)."],
              ["Orçado (planilha)", "Soma do valor orçado de todos os itens."],
              ["Projeção de custo", "Soma do valor efetivo: real quando houver, senão orçado."],
            ]}
          />
          <P>Havendo teto, uma frase avisa “Projeção acima do teto em R$ X” (laranja) ou “Folga de R$ X no teto” (verde).</P>
          <Aviso tipo="nota" titulo="Por que os percentuais são diferentes?">
            O topo do projeto conta itens <em>feitos e pagos</em>. A barra “Serviços concluídos” conta só <em>feitos</em>. A “Execução financeira” conta <em>valor pago</em>. São medidas diferentes de propósito.
          </Aviso>
          <H3>Composição do orçamento</H3>
          <P>Um gráfico de rosca com o “Total orçado”, dividido por etapa ou por ambiente (o seletor “Agrupar por” da aba Itens decide). Usa o valor orçado, e fatias menores que 3% ficam sem rótulo.</P>
        </>
      ),
    },
  ],
};
