import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, H3, Lista, P, Passo, Passos, Tabela } from "../ui";

export const financeiro: PaginaDoc = {
  slug: "financeiro",
  grupo: "Suas ferramentas",
  titulo: "Financeiro do escritório",
  resumo: "Honorários por contrato, o que há a receber e o que atrasou, cobrança pelo WhatsApp, recebimentos, visão por cliente e planilha.",
  secoes: [
    {
      id: "o-que-e",
      titulo: "O que é",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            O financeiro controla o que o <strong>seu escritório</strong> tem a receber dos clientes: cada contrato de honorários vira parcelas com vencimento, e você acompanha o que está a receber, o que atrasou, o que já entrou e quem está devendo. Abra pela pílula <Btn>Financeiro</Btn> na home (página própria).
          </P>
          <Aviso tipo="nota" titulo="Não é o pagamento da obra">
            As parcelas de honorários são um controle só seu. Não têm ligação com os itens do orçamento nem com os pagamentos da obra. Os dados são pessoais: o cliente e outros arquitetos não veem. Quem não é arquiteto vê “O financeiro é só para arquitetos.”
          </Aviso>
        </>
      ),
    },
    {
      id: "novo",
      titulo: "Criar um honorário",
      papel: "arquiteto",
      corpo: (
        <>
          <Passos>
            <Passo>Toque em <Btn>Novo honorário</Btn>.</Passo>
            <Passo>Escolha o <Btn>Projeto</Btn> da lista ou <Btn>Avulso (sem projeto na plataforma)</Btn>. No avulso, informe o <Btn>Nome do trabalho</Btn>. Escolhendo um projeto, o nome, o cliente e o WhatsApp vêm dos dados dele, se estiverem preenchidos.</Passo>
            <Passo>Informe o <Btn>Cliente</Btn>, o <Btn>WhatsApp do cliente (opcional)</Btn> (usado para cobrar) e <Btn>O que está sendo cobrado</Btn> (começa com “Honorários de projeto”).</Passo>
            <Passo>Em “Gerar parcelas”, informe o <Btn>Valor total (R$)</Btn>, o número de <Btn>Parcelas</Btn> (1 a 60), o <Btn>1º vencimento</Btn> e o <Btn>Intervalo</Btn> (todo mês, a cada 2 meses, a cada 3 meses ou a cada 15 dias). Toque em <Btn>Gerar parcelas</Btn>.</Passo>
            <Passo>Ajuste o que for preciso nas parcelas e toque em <Btn>Salvar honorário</Btn>.</Passo>
          </Passos>
          <H3>Como as parcelas são geradas</H3>
          <Lista>
            <li>O total é dividido pelo número de parcelas em centavos; os centavos que sobram vão para a última parcela.</li>
            <li>As descrições ficam “{"{descrição}"} 1/6”, “2/6” e assim por diante.</li>
            <li>Em intervalos de meses, o dia do vencimento é mantido; em mês mais curto, vai para o último dia.</li>
          </Lista>
          <H3>Editar as parcelas</H3>
          <P>
            Cada parcela tem descrição, vencimento, valor, a caixa <Btn>Recebida</Btn> e a lixeira. <Btn>+ Parcela</Btn> acrescenta uma. A linha “Soma das parcelas” avisa se faltam ou sobram reais em relação ao total. Se já existe parcela recebida, o bloco de gerar some, para não substituir o que foi recebido. Os dados de um recebimento já registrado (valor, forma, observação) são preservados ao editar o contrato.
          </P>
        </>
      ),
    },
    {
      id: "painel",
      titulo: "O painel: números, indicadores e atrasos",
      papel: "arquiteto",
      corpo: (
        <>
          <Tabela
            colunas={["Cartão", "Significado"]}
            linhas={[
              ["A receber", "Soma das parcelas ainda não recebidas."],
              ["Vencido", "Parcelas não recebidas com vencimento antes de hoje (laranja se houver)."],
              ["Próximos 30 dias", "Parcelas não recebidas que vencem de hoje até daqui a 30 dias."],
              ["Recebido no mês", "O que entrou no mês corrente, pelo valor que de fato foi recebido."],
            ]}
          />
          <H3>Indicadores</H3>
          <Tabela
            colunas={["Indicador", "Como é calculado"]}
            linhas={[
              ["Previsão 90 dias", "O que ainda vai vencer de hoje até 90 dias (sem o que já está atrasado)."],
              ["Média mensal", "O que entrou nos últimos 3 meses, dividido por 3."],
              ["Inadimplência", "Percentual de tudo o que já venceu até hoje que continua sem receber."],
            ]}
          />
          <H3>Atrasos por tempo</H3>
          <P>
            Havendo parcelas vencidas, o cartão <strong>Atrasos por tempo</strong> separa o valor atrasado por faixa: 1 a 15 dias, 16 a 30, 31 a 60 e mais de 60 dias, com o valor e a quantidade de cada uma. Quanto mais antiga a faixa, mais escura a cor. Serve para decidir a quem cobrar primeiro.
          </P>
          <P>
            O gráfico <strong>Parcelas por mês</strong> mostra, pelo mês de vencimento, o que já foi recebido (verde), o que ainda vem (cinza) e o que está atrasado (laranja).
          </P>
        </>
      ),
    },
    {
      id: "visoes",
      titulo: "As três visões",
      papel: "arquiteto",
      corpo: (
        <>
          <P>Abaixo do gráfico, três abas organizam a tela: <Btn>Parcelas</Btn>, <Btn>Por cliente</Btn> e <Btn>Contratos</Btn>.</P>
          <H3>Parcelas</H3>
          <Lista>
            <li>Uma busca por cliente, projeto ou parcela.</li>
            <li>Filtros de prazo, cada um com a contagem: <Btn>Todas</Btn>, <Btn>Atrasadas</Btn>, <Btn>Hoje</Btn>, <Btn>Próximos 7 dias</Btn> e <Btn>Próximos 30 dias</Btn>. “Atrasadas” fica destacada quando há alguma.</li>
            <li>Acima da lista: “N parcelas · R$ X”, o total do que está na tela.</li>
            <li>Mostram-se 8 parcelas por vez; <Btn>Ver todas (N)</Btn> abre o resto.</li>
            <li>Cada parcela mostra a situação (“Vencida há 20 dias”, “Vence hoje”, “Vence em 11 dias”), o valor e os botões <Btn>Cobrar</Btn> (para vencidas, de hoje e dos próximos 7 dias) e <Btn>Receber</Btn>.</li>
            <li>Abaixo, a seção <Btn>Recebidas (N)</Btn> (mostrar/ocultar) traz as 20 mais recentes, com a forma de pagamento e o desconto ou juros, se houve, e o botão <Btn>Desfazer</Btn>.</li>
          </Lista>
          <H3>Por cliente</H3>
          <P>
            “Quem me deve”: cada cliente com quantos contratos tem, quanto contratou, quanto já recebeu e quanto falta. A etiqueta mostra <strong>Atrasado R$ X</strong>, <strong>Em dia</strong> ou <strong>Quitado</strong>. Quem mais está atrasado vem primeiro. Clientes são reunidos pelo nome (maiúsculas e acentos não importam).
          </P>
          <H3>Contratos</H3>
          <P>Cada contrato com a barra de percentual recebido e os botões de editar e remover (que confirma antes de apagar o contrato e todas as suas parcelas).</P>
        </>
      ),
    },
    {
      id: "receber",
      titulo: "Registrar um recebimento",
      papel: "arquiteto",
      corpo: (
        <>
          <Passos>
            <Passo>Na parcela, toque em <Btn>Receber</Btn>. Abre a janela “Registrar recebimento”.</Passo>
            <Passo>Confira a <Btn>Data do recebimento</Btn> (começa em hoje; pode ser uma data passada, nunca futura).</Passo>
            <Passo>Confira o <Btn>Valor recebido (R$)</Btn> (começa no valor combinado). Se entrou diferente, mude: o app avisa “Entrou R$ 100,00 a menos que o combinado (desconto)” ou “a mais (juros ou multa)”.</Passo>
            <Passo>Escolha <Btn>Como foi pago</Btn> (PIX, transferência, boleto, cartão, dinheiro ou outro) e, se quiser, escreva uma <Btn>Observação (opcional)</Btn>.</Passo>
            <Passo>Toque em <Btn>Registrar recebimento</Btn>.</Passo>
          </Passos>
          <Aviso tipo="nota" titulo="O que muda nos números">
            A parcela passa a recebida, e os cartões “Recebido no mês” e “Média mensal” usam o <strong>valor que de fato entrou</strong>, não o combinado. A data vale para o mês: um recebimento registrado com data do mês passado não conta em “Recebido no mês”.
          </Aviso>
          <P>Errou? Em Recebidas, <Btn>Desfazer</Btn> volta a parcela para “a receber” e apaga a data, o valor e a forma registrados.</P>
        </>
      ),
    },
    {
      id: "cobrar",
      titulo: "Cobrar pelo WhatsApp",
      papel: "arquiteto",
      corpo: (
        <>
          <Passos>
            <Passo>Na parcela vencida (ou que vence hoje ou em até 7 dias), toque em <Btn>Cobrar</Btn>.</Passo>
            <Passo>Confira o <Btn>WhatsApp do cliente</Btn>. Vem do contrato; se mudar, o número novo fica guardado nele.</Passo>
            <Passo>Informe <Btn>Sua chave PIX</Btn>. Ela entra na mensagem e fica guardada para as próximas cobranças.</Passo>
            <Passo>Leia e, se quiser, edite a <Btn>Mensagem</Btn>. Ela já vem pronta e organizada: cumprimenta o cliente e traz o título (“💰 Pagamento em aberto” ou “Lembrete de pagamento”), as linhas com o projeto, a parcela, o valor e o vencimento (“12/10/2026 (venceu há 20 dias)”, “(vence hoje)” ou “(vence em 5 dias)”), a chave PIX e um agradecimento.</Passo>
            <Passo>Toque em <Btn>Abrir no WhatsApp</Btn>. O WhatsApp abre na conversa do cliente (se houver número) com o texto pronto; você só envia.</Passo>
          </Passos>
          <Aviso tipo="dica">Em parcelas vencidas a mensagem pede para o cliente avisar se já pagou, para você dar baixa. Em parcelas que ainda vão vencer, o tom é de lembrete.</Aviso>
        </>
      ),
    },
    {
      id: "planilha",
      titulo: "Exportar a planilha",
      papel: "arquiteto",
      corpo: (
        <P>
          Em <Btn>Exportar planilha</Btn> (na aba Parcelas) o app baixa um arquivo <strong>CSV</strong> com todas as parcelas de todos os contratos: projeto, cliente, contrato, parcela (1/6), vencimento, valor, situação, data e valor do recebimento, forma e observação. O arquivo abre direto no Excel e no Google Planilhas, com acentos corretos e valores no formato brasileiro. Vale para entregar ao contador ou guardar uma cópia.
        </P>
      ),
    },
  ],
};
