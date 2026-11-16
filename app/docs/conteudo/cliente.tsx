import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, Ir, Lista, P, Passo, Passos } from "../ui";

export const cliente: PaginaDoc = {
  slug: "guia-do-cliente",
  grupo: "Para o cliente",
  titulo: "Guia do cliente",
  resumo: "Para quem recebeu o link de um projeto: como entrar, o que olhar e como ajudar a marcar o que foi feito e pago.",
  secoes: [
    {
      id: "entrar",
      titulo: "Entrar no projeto",
      papel: "cliente",
      corpo: (
        <>
          <Passos>
            <Passo>Abra o link que o arquiteto enviou.</Passo>
            <Passo>Digite o <Btn>Código</Btn> (a chave de acesso) que ele enviou à parte.</Passo>
            <Passo>Digite o seu nome em <Btn>Seu nome</Btn>.</Passo>
            <Passo>Toque em <Btn>Entrar no projeto</Btn>.</Passo>
          </Passos>
          <P>No mesmo aparelho você volta direto da próxima vez. Em outro aparelho, abra o link e digite o código de novo. Detalhes e mensagens de erro em <Ir para="entrar-e-acessos">Entrar e acessos</Ir>.</P>
        </>
      ),
    },
    {
      id: "o-que-ver",
      titulo: "O que você encontra",
      papel: "cliente",
      corpo: (
        <>
          <Lista>
            <li><strong>Resumo</strong>: o que está em andamento, o prazo previsto (com a previsão original e eventuais novas previsões), quanto já foi pago, quanto falta e o saldo.</li>
            <li><strong>Itens</strong>: todos os itens do orçamento, com valor e situação, e a busca por serviço, fornecedor ou etapa.</li>
            <li><strong>Gráficos</strong>: oito painéis sobre dinheiro e andamento.</li>
          </Lista>
          <P>Você pode gerar o orçamento em PDF pela aba Itens, em <Btn>Orçamento em PDF</Btn>.</P>
          <P>O prazo merece atenção: a previsão original fica sempre registrada, e se o arquiteto registrar uma nova previsão você vê a data, a diferença e o motivo escrito por ele. Veja <Ir para="prazo">Prazo do projeto</Ir>.</P>
        </>
      ),
    },
    {
      id: "marcar",
      titulo: "Marcar o que foi feito e pago",
      papel: "cliente",
      corpo: (
        <>
          <P>
            Você pode ajudar no acompanhamento: na aba Itens, toque em <Btn>Feito</Btn> quando um serviço for concluído e em <Btn>Pago</Btn> quando o valor for pago. O seu nome (com a indicação “cliente”) e a data ficam registrados em cada marcação e aparecem embaixo do item e na Atividade recente, para o arquiteto ver. Para desfazer, toque de novo.
          </P>
          <Aviso tipo="atencao">
            Marcar muda o andamento para o arquiteto e para todos. Marque só o que realmente aconteceu. Você também pode alterar o orçamento disponível (o teto) nos ajustes (engrenagem), mas não pode criar nem apagar itens.
          </Aviso>
        </>
      ),
    },
    {
      id: "privacidade",
      titulo: "Mostrar a tela a outra pessoa",
      papel: "cliente",
      corpo: (
        <P>
          O botão de olhinho no topo esconde todos os valores em dinheiro (“R$ ••••”), como nos apps de banco. Toque de novo para mostrar. Veja <Ir para="privacidade-e-tutorial">Privacidade e tutorial</Ir>.
        </P>
      ),
    },
  ],
};
