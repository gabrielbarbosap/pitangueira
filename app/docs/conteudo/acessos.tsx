import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, Ir, Lista, P, Passo, Passos, Tabela } from "../ui";

export const acessos: PaginaDoc = {
  slug: "entrar-e-acessos",
  grupo: "Começando",
  titulo: "Entrar e acessos",
  resumo: "Como o arquiteto entra com Google, como o cliente entra com o código do projeto e o que cada um vê ao abrir o app.",
  secoes: [
    {
      id: "arquiteto",
      titulo: "Entrar como arquiteto",
      papel: "arquiteto",
      corpo: (
        <>
          <P>Na tela inicial você vê a logo, o título “Gestão de projetos, do arquiteto ao cliente” e um único botão.</P>
          <Passos>
            <Passo>
              Toque em <Btn>Entrar com Google</Btn>.
            </Passo>
            <Passo>Escolha a conta Google no popup que abrir. O app sempre pergunta qual conta usar.</Passo>
            <Passo>Pronto: você cai no painel, com todos os seus projetos.</Passo>
          </Passos>
          <Lista>
            <li>Se aparecer “Não foi possível entrar. Tente novamente.”, tente de novo. Fechar o popup sem escolher conta não gera erro.</li>
            <li>Qualquer conta Google pode entrar como arquiteto. Cada conta enxerga apenas os próprios projetos e dados.</li>
            <li>
              No <strong>modo demo</strong> (sem Firebase), o mesmo botão entra como um arquiteto de exemplo, “Gabriel (demo)”.
            </li>
          </Lista>
          <P>Para sair, use o botão de sair (<Btn>Sair</Btn>) no topo laranja, na home ou na tela do projeto.</P>
        </>
      ),
    },
    {
      id: "cliente",
      titulo: "Entrar como cliente",
      papel: "cliente",
      corpo: (
        <>
          <P>O cliente não usa Google. Ele precisa do link do projeto e da chave de acesso que o arquiteto enviou.</P>
          <Passos>
            <Passo>Abrir o link do projeto. A tela mostra “Entre com o código do projeto”.</Passo>
            <Passo>
              Digitar a chave no campo <Btn>Código</Btn> (as letras viram maiúsculas sozinhas).
            </Passo>
            <Passo>
              Digitar o nome no campo <Btn>Seu nome</Btn>. Ele fica registrado nas marcações de Feito e Pago que o cliente fizer.
            </Passo>
            <Passo>
              Tocar em <Btn>Entrar no projeto</Btn> (ou apertar Enter). O botão só habilita com código e nome.
            </Passo>
          </Passos>
          <Tabela
            colunas={["Mensagem", "O que significa"]}
            linhas={[
              ["Código incorreto para este projeto.", "A chave não confere, ou o link aponta para um projeto que não existe."],
              ["O acesso anônimo não está ativado no Firebase. Avise o arquiteto.", "A instalação do app precisa habilitar o login anônimo; é um ajuste do administrador."],
              ["Não foi possível acessar. Tente de novo.", "Falha de conexão ou outro erro passageiro."],
            ]}
          />
          <Aviso tipo="nota" titulo="Voltar depois">
            No mesmo aparelho, quem já entrou volta direto, sem digitar nada. Em outro aparelho, ou depois de tocar em Sair, é preciso digitar o código de novo.
          </Aviso>
          <P>
            Rodapé da tela de código: “É o arquiteto? Entrar pelo painel” leva para a tela inicial. Veja também o <Ir para="guia-do-cliente">Guia do cliente</Ir>.
          </P>
        </>
      ),
    },
    {
      id: "home-do-cliente",
      titulo: "A home do cliente",
      papel: "cliente",
      corpo: (
        <>
          <P>Quando o cliente abre o app pela tela inicial (sem um link de projeto), ele vê “Olá, {"{nome}"}” e a lista “Seus projetos”, cada um com o botão <Btn>Abrir →</Btn>.</P>
          <Lista>
            <li>Os projetos entram na lista quando o cliente abre o projeto pela primeira vez.</li>
            <li>A lista fica guardada no aparelho. Em outro aparelho, é preciso abrir o link e digitar o código de novo.</li>
            <li>Sem projetos, aparece “Nenhum projeto por aqui ainda”, com a instrução de abrir o link do arquiteto.</li>
            <li>O botão <Btn>Sair</Btn> esquece a lista e encerra o acesso.</li>
          </Lista>
        </>
      ),
    },
    {
      id: "arquiteto-abre-link",
      titulo: "E se o arquiteto abrir o link do projeto?",
      papel: "arquiteto",
      corpo: (
        <P>
          Se você está logado como arquiteto e abre o link de um projeto seu, entra direto como dono, sem digitar chave. Sem estar logado, aparece a tela de código, como para o cliente.
        </P>
      ),
    },
  ],
};
