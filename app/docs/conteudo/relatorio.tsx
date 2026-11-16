import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, H3, Ir, Lista, P, Passo, Passos, Tabela } from "../ui";

export const relatorio: PaginaDoc = {
  slug: "relatorio-mensal",
  grupo: "Projetos",
  titulo: "Relatório mensal de andamento",
  resumo: "Escolha o mês, o que entra e gere um PDF de andamento para mandar ao cliente.",
  secoes: [
    {
      id: "para-que",
      titulo: "Para que serve",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            O relatório mensal reúne o que foi executado e pago em um mês, o avanço do projeto e o prazo em um PDF com a sua marca, pronto para o cliente. O cliente não vê o cartão nem o botão de gerar.
          </P>
          <P>
            No Resumo do projeto, o cartão “Relatório mensal de andamento” já conta o mês atual (“3 serviços executados · 1 pagamento em novembro de 2026”) e traz o botão <Btn>Gerar relatório</Btn>.
          </P>
        </>
      ),
    },
    {
      id: "passo-a-passo",
      titulo: "Passo a passo",
      papel: "arquiteto",
      corpo: (
        <>
          <Passos>
            <Passo>No Resumo, toque em <Btn>Gerar relatório</Btn>. Abre a janela “Relatório mensal de andamento”.</Passo>
            <Passo><strong>1. Escolha o mês.</strong> As abas mostram os meses em que houve algo feito ou pago, e sempre o mês atual. Cada uma diz “N itens” ou “sem movimento”.</Passo>
            <Passo><strong>2. Escolha o que entra.</strong> O que aconteceu no mês já vem marcado. Desmarque o que não vale ou marque outros itens.</Passo>
            <Passo><strong>3. Conte o que importa.</strong> Escreva os destaques do mês e os próximos passos (opcionais) e decida se mostra os valores em R$.</Passo>
            <Passo>Toque em <Btn>Gerar relatório de {"{mês}"}</Btn>. O documento abre por cima; use a impressão do navegador para salvar o PDF.</Passo>
          </Passos>
          <P>Ao fechar o documento, a janela continua como você deixou, para ajustar e gerar de novo.</P>
        </>
      ),
    },
    {
      id: "o-que-entra",
      titulo: "Escolher o que entra",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            A janela mostra um resumo do que vai no relatório (executados, pagos e a execução do projeto, de X% para Y%) e o contador “N de M incluídos”, com os atalhos <Btn>Todos do mês</Btn> e <Btn>Nenhum</Btn>.
          </P>
          <H3>Do mês</H3>
          <P>
            Itens com data de execução ou de pagamento dentro do mês, agrupados por etapa e já marcados. <Btn>Marcar todos</Btn> e <Btn>Desmarcar todos</Btn> agem no bloco todo.
          </P>
          <H3>Itens ainda não feitos nem pagos</H3>
          <P>
            Logo abaixo ficam os itens que ainda não foram feitos nem pagos, em seções recolhíveis por etapa, com uma busca (“Buscar pelo nome, etapa ou ambiente…”). Itens já feitos ou pagos em outros meses não aparecem aqui.
          </P>
          <H3>Marcar Feito e Pago na própria janela</H3>
          <P>
            Cada linha tem os botões <Btn>Feito</Btn> e <Btn>Pago</Btn>. Ao tocar, o item muda de verdade, inclusive na aba Itens, com a data de hoje, e já entra no relatório. Tocar de novo tira a marca.
          </P>
          <Aviso tipo="nota" titulo="Mês passado">
            Se você escolher um mês passado e marcar um item como feito, ele ganha a data de hoje (não a do mês escolhido). Ele entra no relatório mesmo assim, mas com essa data.
          </Aviso>
        </>
      ),
    },
    {
      id: "bloqueio",
      titulo: "Quando o botão de gerar fica bloqueado",
      papel: "arquiteto",
      corpo: (
        <>
          <P>O botão <Btn>Gerar relatório de {"{mês}"}</Btn> aparece apagado nestes casos:</P>
          <Tabela
            colunas={["Situação", "O que a tela mostra"]}
            linhas={[
              ["Há um item marcado para entrar que não está feito nem pago.", "Um alerta lista os itens e diz: marque Feito ou Pago neles, ou tire a marca de incluir. Tocar no botão bloqueado destaca o alerta."],
              ["Nada foi incluído e não há destaques escritos.", "A frase “Inclua pelo menos um item ou escreva os destaques para gerar.”"],
            ]}
          />
          <P>É possível gerar só com os destaques escritos, sem nenhum item.</P>
        </>
      ),
    },
    {
      id: "documento",
      titulo: "O que tem no PDF",
      papel: "arquiteto",
      corpo: (
        <>
          <Lista>
            <li>O cabeçalho com a marca do escritório, o quadro Cliente, Projeto e Endereço e o mês por extenso.</li>
            <li><strong>Resumo do mês</strong>: serviços executados, execução do projeto (X% → Y%, “+N pontos no mês”) e pagamentos no mês em R$ (ou a quantidade de itens pagos, sem valores).</li>
            <li><strong>Prazo</strong> (se houver previsão): término previsto, quanto tempo falta hoje, a nota de nova previsão e as novas previsões registradas no mês, com o motivo.</li>
            <li><strong>Destaques do mês</strong> e <strong>Próximos passos</strong>, se escritos.</li>
            <li><strong>Serviços executados</strong>, por etapa, com a data. Datas de outro mês aparecem com o ano.</li>
            <li><strong>Pagamentos</strong>, com data e valor, e o “Total pago no mês”. A caixa “Mostrar os valores em R$ no relatório” liga e desliga os valores.</li>
            <li>As assinaturas e o selo “Gerado com Pitangueira”.</li>
          </Lista>
          <P>O arquivo sugerido é “Relatório de andamento - {"{projeto}"} - AAAA-MM”.</P>
        </>
      ),
    },
    {
      id: "como-conta",
      titulo: "Como o mês é contado",
      papel: "arquiteto",
      corpo: (
        <>
          <Lista>
            <li>Um item conta como executado no mês se a data em que foi marcado como feito cai no mês, e como pago se a data de pagamento cai no mês.</li>
            <li>O progresso (X% → Y%) compara os itens feitos no começo e no fim do mês.</li>
            <li>Itens marcados antes de o app guardar datas não pertencem a nenhum mês: contam como “já feitos antes” no progresso.</li>
          </Lista>
          <P>Veja também <Ir para="pdfs">PDFs e marca do escritório</Ir> para configurar a marca que aparece no relatório.</P>
        </>
      ),
    },
  ],
};
