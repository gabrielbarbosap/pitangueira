import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, H3, Ir, Lista, P, Passo, Passos, Tabela } from "../ui";

export const criarProjeto: PaginaDoc = {
  slug: "criar-e-gerenciar-projetos",
  grupo: "Projetos",
  titulo: "Criar e gerenciar projetos",
  resumo: "Criar um projeto do zero ou a partir de outro seu, ajustar nome e teto, arquivar, restaurar e excluir.",
  secoes: [
    {
      id: "criar",
      titulo: "Criar um projeto",
      papel: "arquiteto",
      corpo: (
        <>
          <Passos>
            <Passo>
              Na home, toque em <Btn>Novo projeto</Btn>.
            </Passo>
            <Passo>
              Preencha o <Btn>Nome do projeto</Btn> (obrigatório), por exemplo “Casa Pitanga”.
            </Passo>
            <Passo>
              Confira a <Btn>Chave de acesso (para os clientes)</Btn>. Ela já vem preenchida com 6 caracteres. Você pode editá-la ou tocar em <Btn>Gerar</Btn> para sortear outra.
            </Passo>
            <Passo>
              Se quiser, preencha o <Btn>Orçamento disponível (R$)</Btn>. É opcional e pode ser definido depois nos ajustes.
            </Passo>
            <Passo>
              Em <Btn>Como começar</Btn>, escolha <Btn>Do zero</Btn> ou um dos seus projetos.
            </Passo>
            <Passo>
              Toque em <Btn>Criar projeto</Btn>. Você vai direto para a tela do projeto.
            </Passo>
          </Passos>
          <H3>Sobre a chave de acesso</H3>
          <Lista>
            <li>Tem 6 caracteres, sempre em maiúsculas. As letras I e O e os números 0 e 1 não são sorteados, para não confundir.</li>
            <li>Depois de criada, a chave não pode ser trocada.</li>
            <li>O app não impede duas chaves iguais em projetos diferentes. Isso não é problema: a chave só vale junto com o link do projeto.</li>
          </Lista>
        </>
      ),
    },
    {
      id: "a-partir-de",
      titulo: "Começar a partir de um projeto seu",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            Em <Btn>Como começar</Btn> aparecem todos os projetos que você já tem (inclusive os arquivados, marcados com “· arquivado”), com a quantidade de itens. Escolher um deles cria o novo projeto já com o orçamento e o escopo do escolhido, sem os dados do cliente.
          </P>
          <Tabela
            colunas={["O que leva", "O que NÃO leva"]}
            linhas={[
              [
                "Os itens (etapa, ambiente, descrição, unidade, quantidade, valor unitário, valor orçado e ordem); os ambientes e pedidos do escopo, voltando a Pendente; os dados e a marca do projeto (tipo, responsável, registro, logo).",
                "Valor real, marcas de Feito e Pago e as datas; fornecedor, observação e prazo de cada item; as previsões de prazo; a aprovação do escopo; o teto (vale o que você digitar); o cliente e o endereço (ficam em branco).",
              ],
            ]}
          />
          <Aviso tipo="dica">Excelente para quem faz projetos parecidos: monte um projeto-modelo uma vez e comece os próximos a partir dele.</Aviso>
        </>
      ),
    },
    {
      id: "ajustes",
      titulo: "Ajustes do projeto",
      corpo: (
        <>
          <P>
            Dentro do projeto, o botão de engrenagem (“Ajustes do projeto”) abre uma janela com:
          </P>
          <Lista>
            <li>
              <Btn>Nome do projeto</Btn> (só o arquiteto altera; vazio vira “Projeto”).
            </li>
            <li>
              <Btn>Orçamento total disponível (R$)</Btn>: o teto. É usado para calcular o saldo em caixa e avisar se a projeção de custo estourar. O cliente também pode alterar este campo.
            </li>
            <li>
              Para o arquiteto dono: o bloco “Encerrar este projeto”, com o botão <Btn>Arquivar ou excluir…</Btn>.
            </li>
          </Lista>
          <P>Toque em <Btn>Salvar ajustes</Btn> para guardar.</P>
        </>
      ),
    },
    {
      id: "arquivar",
      titulo: "Arquivar e restaurar",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            Para abrir a janela “Gerenciar projeto”: toque no <Btn>⋯</Btn> do cartão na home, ou em <Btn>Gerenciar</Btn> na lista de arquivados, ou, dentro do projeto, nos ajustes em <Btn>Arquivar ou excluir…</Btn>.
          </P>
          <Lista>
            <li>
              <Btn>Arquivar projeto</Btn> (etiqueta “Reversível”) tira o projeto da lista principal e o guarda em “Arquivados”. Itens, escopo e aprovações ficam intactos e <strong>o cliente continua acessando</strong> com link e código.
            </li>
            <li>
              Se o projeto já está arquivado, o botão vira <Btn>Restaurar projeto</Btn>.
            </li>
            <li>Dentro do projeto, arquivar leva você de volta para a home.</li>
          </Lista>
        </>
      ),
    },
    {
      id: "excluir",
      titulo: "Excluir de vez",
      papel: "arquiteto",
      corpo: (
        <>
          <Aviso tipo="atencao" titulo="Sem volta">
            Excluir apaga o projeto, os itens, o escopo, as aprovações e o acesso dos clientes. Não há como desfazer.
          </Aviso>
          <Passos>
            <Passo>
              Na janela “Gerenciar projeto”, vá ao bloco “Excluir definitivamente”.
            </Passo>
            <Passo>
              Digite o nome do projeto em “Digite o nome do projeto para confirmar” (maiúsculas e espaços extras não importam).
            </Passo>
            <Passo>
              Toque em <Btn>Excluir projeto para sempre</Btn>. O botão só habilita quando o nome confere.
            </Passo>
          </Passos>
          <P>
            Excluir um projeto <strong>não</strong> apaga o que é pessoal seu: catálogo, composições, fornecedores e honorários continuam. Um contrato de honorários ligado ao projeto fica sem o projeto na lista, mas as parcelas permanecem. Na dúvida, prefira arquivar.
          </P>
          <P>Veja também: <Ir para="painel">Painel do arquiteto</Ir>.</P>
        </>
      ),
    },
  ],
};
