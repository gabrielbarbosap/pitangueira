import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, H3, Lista, P, Passo, Passos, Tabela } from "../ui";

export const financeiro: PaginaDoc = {
  slug: "financeiro",
  grupo: "Suas ferramentas",
  titulo: "Financeiro do escritório",
  resumo: "Honorários por contrato, geração de parcelas, a receber, vencido e recebido no mês.",
  secoes: [
    {
      id: "o-que-e",
      titulo: "O que é",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            O financeiro controla o que o <strong>seu escritório</strong> tem a receber dos clientes: cada contrato de honorários vira parcelas com vencimento, e você acompanha o que está a receber, vencido e recebido. Abra pela pílula <Btn>Financeiro</Btn> na home (página própria).
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
            <Passo>Escolha o <Btn>Projeto</Btn> da lista ou <Btn>Avulso (sem projeto na plataforma)</Btn>. No avulso, informe o <Btn>Nome do trabalho</Btn>. Escolhendo um projeto, o nome vem dele e o cliente é preenchido a partir dos dados do projeto, se estiver vazio.</Passo>
            <Passo>Informe o <Btn>Cliente</Btn> e <Btn>O que está sendo cobrado</Btn> (começa com “Honorários de projeto”).</Passo>
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
            Cada parcela tem descrição, vencimento, valor, a caixa <Btn>Recebida</Btn> e a lixeira. <Btn>+ Parcela</Btn> acrescenta uma. A linha “Soma das parcelas” avisa se faltam ou sobram reais em relação ao total. Se já existe parcela recebida, o bloco de gerar some, para não substituir o que foi recebido. O botão só habilita com nome válido, ao menos uma parcela e valores e datas válidos.
          </P>
        </>
      ),
    },
    {
      id: "tela",
      titulo: "A tela do financeiro",
      papel: "arquiteto",
      corpo: (
        <>
          <Tabela
            colunas={["Cartão", "Significado"]}
            linhas={[
              ["A receber", "Soma das parcelas ainda não recebidas."],
              ["Vencido", "Parcelas não recebidas com vencimento antes de hoje (laranja se houver)."],
              ["Próximos 30 dias", "Parcelas não recebidas que vencem de hoje até daqui a 30 dias."],
              ["Recebido no mês", "Parcelas recebidas cuja data de recebimento cai no mês corrente."],
            ]}
          />
          <Lista>
            <li><strong>Parcelas por mês</strong>: gráfico empilhado por mês de vencimento, com Recebido (verde), A receber (cinza) e Vencido (laranja).</li>
            <li><strong>A receber</strong>: as 8 primeiras parcelas por vencimento; <Btn>Ver todas (N)</Btn> mostra o resto.</li>
            <li><strong>Contratos</strong>: cada um com a barra de percentual recebido, e os botões de editar e remover (que confirma antes de apagar o contrato e todas as parcelas).</li>
            <li><strong>Recebidas</strong>: as 20 mais recentes, em seção que você mostra e oculta.</li>
          </Lista>
          <H3>Receber uma parcela</H3>
          <P>
            Em cada parcela, <Btn>Receber</Btn> grava a data e hora de agora; para corrigir, <Btn>Desfazer</Btn>. A situação aparece como “Recebida em 12 nov”, “Vencida há 3 dias”, “Vence hoje” ou “Vence em 5 dias”.
          </P>
        </>
      ),
    },
  ],
};
