import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, H3, Ir, Lista, P, Tabela } from "../ui";

export const painel: PaginaDoc = {
  slug: "painel",
  grupo: "Projetos",
  titulo: "Painel do arquiteto",
  resumo: "A home do arquiteto: visão de todos os projetos, próximas entregas, atalhos para as suas ferramentas e o cartão de cada projeto.",
  secoes: [
    {
      id: "topo",
      titulo: "O topo laranja",
      papel: "arquiteto",
      corpo: (
        <>
          <P>No topo ficam a logo, a data do dia e a saudação “Olá, {"{seu nome}"}”, com a contagem de projetos (“3 projetos sob sua gestão · 1 arquivado”). Os botões redondos são:</P>
          <Tabela
            colunas={["Botão", "O que faz"]}
            linhas={[
              [<Btn key="a">?</Btn>, "Abre o tutorial da home (“Ver o tutorial”)."],
              ["Olhinho", "Oculta ou mostra todos os valores em dinheiro. Veja Privacidade e tutorial."],
              [<Btn key="b">Sair</Btn>, "Encerra a sessão."],
            ]}
          />
          <P>Logo abaixo ficam as pílulas de atalho para as suas ferramentas pessoais:</P>
          <Lista>
            <li><Btn>Meu catálogo</Btn>: seus itens e preços reutilizáveis (<Ir para="catalogo-e-composicoes">Catálogo e composições</Ir>).</li>
            <li><Btn>Composições</Btn>: custo de serviços montado por insumos.</li>
            <li><Btn>Fornecedores</Btn>: cadastro e histórico de quem trabalha com você (<Ir para="fornecedores">Fornecedores</Ir>).</li>
            <li><Btn>Financeiro</Btn>: honorários e parcelas do escritório (<Ir para="financeiro">Financeiro</Ir>).</li>
          </Lista>
        </>
      ),
    },
    {
      id: "visao-geral",
      titulo: "Resumo de todos os projetos",
      papel: "arquiteto",
      corpo: (
        <>
          <P>Com ao menos um projeto ativo aparecem dois cartões:</P>
          <Lista>
            <li><strong>Projetos que você toca</strong>: quantos projetos ativos há e quantos estão em andamento.</li>
            <li>
              <strong>Progresso geral</strong>: soma dos itens concluídos (feitos e pagos) dividida pela soma de todos os itens. Não é a média dos percentuais: um projeto grande pesa mais que um pequeno. Projetos arquivados ficam de fora.
            </li>
          </Lista>
          <H3>Próximas entregas</H3>
          <P>
            Uma faixa rolável com até 8 projetos que têm prazo registrado e ainda não foram concluídos, ordenados pelo término previsto atual (do mais próximo, ou mais atrasado, ao mais distante). Cada cartão mostra o nome, a data, quanto tempo falta e, se houve replanejamento, a etiqueta “Nova previsão · 2ª”.
          </P>
        </>
      ),
    },
    {
      id: "cartao",
      titulo: "O cartão de cada projeto",
      papel: "arquiteto",
      corpo: (
        <>
          <P>Cada projeto é um cartão. Tocar nele abre a <Ir para="tela-do-projeto">tela do projeto</Ir>. O cartão mostra:</P>
          <H3>Status</H3>
          <Tabela
            colunas={["Status", "Quando aparece"]}
            linhas={[
              ["Sem itens ainda", "O projeto não tem nenhum item."],
              ["Não iniciada", "Nenhum item foi marcado como feito nem pago."],
              ["Em andamento", "Algum item foi marcado como feito ou pago."],
              ["Concluída", "Todos os itens estão feitos e pagos."],
            ]}
          />
          <H3>Números</H3>
          <Lista>
            <li>O percentual “concluído” (itens feitos e pagos ÷ itens) e uma régua de 20 células (cada uma vale 5%).</li>
            <li>
              Quatro mini-cartões: <strong>Orçado</strong>, <strong>Pago</strong>, <strong>A pagar</strong> (nunca negativo) e <strong>Teto</strong> (“a definir” se não houver).
            </li>
            <li>“N/M itens concluídos · X% do valor pago”.</li>
            <li>Um mini-prazo com a situação, “Tempo %”, “Concluído %” e o término previsto; ou “Sem prazo registrado”.</li>
          </Lista>
          <Aviso tipo="nota" titulo="“Orçado” é a projeção">
            No cartão, o valor chamado “Orçado” é a projeção de custo: usa o valor real dos itens que já têm real e o orçado nos demais.
          </Aviso>
          <H3>Rodapé do cartão</H3>
          <Lista>
            <li>
              <strong>CHAVE ABC123</strong>: a chave de acesso do cliente.
            </li>
            <li>
              <Btn>Copiar link</Btn>: copia só o link do projeto (o botão vira “Copiado ✓” por instantes). A chave você envia à parte. Se o navegador bloquear a cópia, aparece uma caixa para você copiar à mão.
            </li>
            <li>
              <Btn>⋯</Btn> (“Arquivar ou excluir”): abre a janela de gerenciamento. Veja <Ir para="criar-e-gerenciar-projetos">Criar e gerenciar projetos</Ir>.
            </li>
          </Lista>
          <Aviso tipo="atencao" titulo="O cartão atualiza pela tela do projeto">
            Os números do cartão são um resumo que o app grava quando a tela do projeto está aberta. Se algo mudar sem ninguém abrir o projeto, o cartão pode ficar um pouco defasado até a próxima abertura. Em projetos antigos pode aparecer “calculando…” por um instante.
          </Aviso>
        </>
      ),
    },
    {
      id: "arquivados",
      titulo: "Arquivados",
      papel: "arquiteto",
      corpo: (
        <P>
          Projetos arquivados saem da lista principal e ficam na seção “Arquivados (N)”, que você abre com <Btn>Mostrar</Btn>. Cada linha mostra o nome (que abre o projeto), “Arquivado em dd/mm/aaaa” e o botão <Btn>Gerenciar</Btn>, para restaurar ou excluir de vez. Nada é apagado ao arquivar.
        </P>
      ),
    },
    {
      id: "novo-projeto",
      titulo: "Botão Novo projeto",
      papel: "arquiteto",
      corpo: (
        <P>
          O botão flutuante <Btn>Novo projeto</Btn> fica no canto da tela. Veja o passo a passo em <Ir para="criar-e-gerenciar-projetos">Criar e gerenciar projetos</Ir>.
        </P>
      ),
    },
  ],
};
