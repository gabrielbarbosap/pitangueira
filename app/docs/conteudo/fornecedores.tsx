import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, H3, Ir, Lista, P, Passo, Passos, Tabela } from "../ui";

export const fornecedores: PaginaDoc = {
  slug: "fornecedores",
  grupo: "Suas ferramentas",
  titulo: "Fornecedores",
  resumo: "Cadastro de fornecedores com histórico de entrega e de custo, calculado a partir dos seus projetos.",
  secoes: [
    {
      id: "como-funciona",
      titulo: "Como funciona",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            Abra pela pílula <Btn>Fornecedores</Btn> na home. O histórico de cada fornecedor se forma sozinho: o app lê os itens de <strong>todos</strong> os seus projetos (inclusive arquivados) e agrupa pelo texto do campo <Btn>Fornecedor</Btn> de cada item.
          </P>
          <Aviso tipo="atencao" titulo="Use sempre o mesmo nome">
            O histórico só junta itens quando o nome é o mesmo. Maiúsculas, acentos e espaços extras não importam (“Pedreiro João” e “pedreiro joao” são o mesmo), mas “João” e “João Silva” são diferentes.
          </Aviso>
        </>
      ),
    },
    {
      id: "cadastro",
      titulo: "Cadastrar um fornecedor",
      papel: "arquiteto",
      corpo: (
        <>
          <Passos>
            <Passo>Toque em <Btn>+ Novo fornecedor</Btn>.</Passo>
            <Passo>Preencha o <Btn>Nome</Btn> (o único obrigatório). Use o mesmo nome dos itens.</Passo>
            <Passo>Opcionalmente informe <Btn>Especialidade</Btn> (há sugestões como Pedreiro, Eletricista e Pintor), <Btn>Telefone</Btn>, <Btn>E-mail</Btn>, <Btn>Sua nota</Btn> (1 a 5 estrelas; tocar na estrela atual zera) e <Btn>Observação</Btn>.</Passo>
            <Passo>Toque em <Btn>Salvar fornecedor</Btn>.</Passo>
          </Passos>
          <P>
            Fornecedores que aparecem nos itens mas não estão cadastrados ganham a etiqueta “não cadastrado” e o botão <Btn>Cadastrar</Btn>. Remover do cadastro mantém o histórico enquanto o nome continuar nos itens. Há uma busca por nome ou especialidade.
          </P>
        </>
      ),
    },
    {
      id: "historico",
      titulo: "O que o cartão mostra",
      papel: "arquiteto",
      corpo: (
        <>
          <Tabela
            colunas={["Indicador", "Como é calculado", "Cores"]}
            linhas={[
              ["Trabalhos", "Quantidade de itens, de projetos e o valor orçado total.", "—"],
              ["Entrega no prazo", "Entre os itens com prazo definido e marcados como Feito, quantos foram feitos até o prazo. Mostra “N de M no prazo · atraso médio X dias”.", "90% ou mais verde; 70% ou mais âmbar; abaixo disso laranja."],
              ["Custo × orçado", "(real − orçado) ÷ orçado, só nos itens com valor real. Positivo significa que custou mais.", "Mais de +5% laranja; acima de 0 âmbar; 0 ou menos verde."],
            ]}
          />
          <Lista>
            <li>Sem prazo nos itens, “Entrega no prazo” mostra “—” e pede para marcar o prazo dos itens. Sem valor real, “Custo × orçado” pede para informar o valor real.</li>
            <li>Um alerta mostra “N itens com prazo vencido, ainda não feitos”.</li>
            <li>Os fornecedores são ordenados pelos que têm mais itens, depois em ordem alfabética.</li>
          </Lista>
          <H3>Para o histórico ficar rico</H3>
          <P>
            Em cada item, preencha <Btn>Fornecedor</Btn> e <Btn>Prazo de entrega</Btn>, marque Feito quando executar e informe o <Btn>Valor real</Btn>. Veja <Ir para="itens">Itens do orçamento</Ir>.
          </P>
        </>
      ),
    },
  ],
};
