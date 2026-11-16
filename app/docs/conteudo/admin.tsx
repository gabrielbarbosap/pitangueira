import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, H3, Lista, P, Tabela } from "../ui";

export const admin: PaginaDoc = {
  slug: "uso-e-erros",
  grupo: "Recursos gerais",
  titulo: "Métricas de uso e erros",
  resumo: "O painel do administrador: quem usa o app, o que faz e que erros apareceram, sem serviço de terceiros.",
  secoes: [
    {
      id: "o-que-e",
      titulo: "Para que serve",
      corpo: (
        <>
          <P>
            Em <Btn>/admin</Btn> o administrador do app vê, em números, se o produto está sendo usado: quantas contas ativas, quantos clientes voltaram ao projeto, quantos itens foram lançados, quantos PDFs foram abertos e que erros aconteceram. Só o e-mail de administrador entra; qualquer outra conta vê “Acesso restrito”.
          </P>
          <Aviso tipo="nota" titulo="Privacidade">
            Só medimos o uso: o nome do evento, o papel (arquiteto ou cliente), um identificador anônimo da conta e a rota (sem o identificador do projeto). Não guardamos nomes, e-mails, valores em dinheiro nem o conteúdo dos projetos.
          </Aviso>
        </>
      ),
    },
    {
      id: "numeros",
      titulo: "Os números do painel",
      corpo: (
        <>
          <P>Você escolhe o período (últimos 7 ou 30 dias). Os cartões de resumo são:</P>
          <Tabela
            colunas={["Cartão", "O que mede"]}
            linhas={[
              ["Contas ativas", "Contas diferentes que usaram o app, com a divisão entre arquitetos e clientes."],
              ["Clientes recorrentes", "Clientes que abriram o projeto em 2 dias diferentes ou mais. É a métrica que diz se o link está sendo útil."],
              ["Itens adicionados", "Itens criados (à mão, em sequência, por planilha, catálogo ou composição), e quantas marcações de Feito/Pago houve."],
              ["Erros", "Erros que o app capturou (em laranja se houver)."],
              ["Documentos abertos", "Orçamentos, escopos e relatórios abertos para PDF."],
              ["Enviados pelo WhatsApp", "Documentos enviados pelo botão WhatsApp (compartilhados ou baixados para anexar)."],
            ]}
          />
          <P>
            Abaixo ficam o gráfico de eventos por dia, a lista do que as pessoas fizeram (projetos criados, itens adicionados, planilhas importadas, previsões de prazo etc.) e os erros recentes, com a tela onde aconteceram, o papel de quem estava usando e o começo do erro.
          </P>
        </>
      ),
    },
    {
      id: "erros",
      titulo: "Erros e a tela de erro",
      corpo: (
        <>
          <Lista>
            <li>Se uma tela quebra, quem está usando vê “Não consegui abrir esta tela”, com os botões <Btn>Tentar de novo</Btn> e <Btn>Voltar ao início</Btn>, e uma garantia de que os dados estão salvos.</li>
            <li>O erro é registrado para o administrador, no máximo 10 por visita e sem repetir a mesma mensagem.</li>
            <li>Erros que ninguém trata (de janela ou de promessa) também são registrados, sem interromper o uso.</li>
          </Lista>
          <H3>Modo demo</H3>
          <P>Sem o Firebase, o registro fica no navegador e o painel mostra o que foi feito ali.</P>
        </>
      ),
    },
  ],
};
