import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, H3, Ir, Lista, P, Passo, Passos, Tabela } from "../ui";

export const cobrancaObra: PaginaDoc = {
  slug: "cobranca-da-obra",
  grupo: "Projetos",
  titulo: "Cobrança da obra",
  resumo: "Gere uma cobrança com itens do orçamento e itens novos, em PDF com a sua marca, envie pelo WhatsApp e dê baixa.",
  secoes: [
    {
      id: "visao",
      titulo: "Para que serve",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            A cobrança da obra é o documento com o que o cliente precisa pagar naquele momento: uma medição do mês, os serviços que ficaram prontos, ou serviços extras que apareceram no meio do caminho. No Resumo do projeto, o cartão <Btn>Cobrança da obra</Btn> tem o mesmo destaque do relatório mensal.
          </P>
          <Tabela
            colunas={["Quem", "O que faz"]}
            linhas={[
              ["Arquiteto", "Gera a cobrança, vê o documento, envia pelo WhatsApp, dá baixa e remove."],
              ["Cliente", "Vê as cobranças em aberto (o cartão só aparece quando há alguma) e abre o documento para ver os itens e como pagar."],
            ]}
          />
        </>
      ),
    },
    {
      id: "gerar",
      titulo: "Gerar uma cobrança",
      papel: "arquiteto",
      corpo: (
        <>
          <Passos>
            <Passo>No Resumo, toque em <Btn>Gerar cobrança</Btn>. Abre a janela “Gerar cobrança da obra”.</Passo>
            <Passo><strong>1. Escolha itens do orçamento.</strong> Marque um a um, ou use os atalhos: <Btn>Só feitos e não pagos</Btn>, <Btn>Todos os não pagos</Btn>, <Btn>Marcar a etapa</Btn> e <Btn>Limpar</Btn>. A busca acha item ou etapa. Cada item mostra se está Feito e se já foi pago.</Passo>
            <Passo><strong>2. Inclua itens novos (opcional).</strong> Toque em <Btn>Item novo</Btn> e preencha a descrição, a quantidade e o valor unitário. Dá para incluir vários. A <Btn>Etapa dos itens novos</Btn> começa como “Extras”.</Passo>
            <Passo><strong>3. Dê um título e combine o pagamento.</strong> Escreva o <Btn>Título da cobrança</Btn> (obrigatório) e, se quiser, o <Btn>Vencimento</Btn>, a <Btn>Chave PIX</Btn> e as <Btn>Observações</Btn>. A chave PIX fica guardada para as próximas cobranças.</Passo>
            <Passo>Confira o resumo (quantos itens e o total) e toque em <Btn>Gerar cobrança</Btn>. O documento abre na hora.</Passo>
          </Passos>
          <Aviso tipo="atencao" titulo="Itens novos entram no orçamento">
            Os itens que você cadastra na hora da cobrança são criados de verdade: passam a fazer parte do orçamento do projeto (na etapa que você escolheu), com o total, os gráficos e o restante contando com eles. Se for um serviço extra que ainda não estava combinado, é isso mesmo que você quer; se não quiser que entre, não o inclua aqui.
          </Aviso>
          <Lista>
            <li>O botão de gerar só habilita com um título e pelo menos um item. A janela diz o que falta.</li>
            <li>Itens novos incompletos (sem descrição ou sem valor) bloqueiam o botão, com um aviso.</li>
            <li>Itens já pagos aparecem na lista, com a etiqueta “Já pago”, mas não vêm marcados nos atalhos.</li>
          </Lista>
        </>
      ),
    },
    {
      id: "documento",
      titulo: "O documento e o envio pelo WhatsApp",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            O documento “Cobrança” tem a marca do escritório e traz o total, o vencimento, a quantidade de itens, a tabela com tudo o que está sendo cobrado (os itens novos levam “item novo”), a chave PIX em “Como pagar” e as observações.
          </P>
          <H3>Enviar o PDF</H3>
          <P>
            No documento, toque em <Btn>WhatsApp</Btn> (veja <Ir para="pdfs">PDFs e marca do escritório</Ir>). A mensagem que acompanha o PDF já traz o total, o vencimento e a chave PIX.
          </P>
          <H3>Enviar só a mensagem</H3>
          <P>
            Na lista do cartão, <Btn>Enviar</Btn> monta uma mensagem de texto estruturada: “💰 <strong>Cobrança: Medição de novembro</strong>”, os itens em lista, o total, o vencimento, a chave PIX, as observações e o link do projeto. O WhatsApp abre com o texto pronto e você aperta enviar. Nada sai sozinho.
          </P>
        </>
      ),
    },
    {
      id: "baixa",
      titulo: "Dar baixa e acompanhar",
      papel: "arquiteto",
      corpo: (
        <>
          <Lista>
            <li>Cada cobrança aparece no cartão com o título, o total, a quantidade de itens, o vencimento e a etiqueta <strong>Aberta</strong> ou <strong>Paga</strong>. <Btn>Ver documento</Btn> reabre o PDF a qualquer hora.</li>
            <li>Quando o cliente pagar, toque em <Btn>Marcar como paga</Btn>. O app confirma e também marca como <strong>pagos</strong> os itens da cobrança que ainda não estavam.</li>
            <li>A lixeira remove a cobrança (os itens continuam no orçamento).</li>
            <li>A cobrança gerada e a cobrança paga aparecem na <Ir para="acompanhar">linha do tempo</Ir>, com o filtro “Cobranças”, para o arquiteto e o cliente.</li>
          </Lista>
        </>
      ),
    },
    {
      id: "cliente",
      titulo: "O que o cliente vê",
      papel: "cliente",
      corpo: (
        <P>
          Enquanto houver cobrança em aberto, o Resumo do cliente mostra o cartão <Btn>Cobranças em aberto</Btn>, com a quantidade e o valor. <Btn>Ver cobrança</Btn> abre o documento, com os itens, o total, o vencimento e a chave PIX. Depois de paga, a cobrança sai do cartão e fica registrada na linha do tempo. O cliente não gera, não altera e não dá baixa.
        </P>
      ),
    },
  ],
};
