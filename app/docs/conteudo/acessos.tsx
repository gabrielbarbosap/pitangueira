import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, H3, Ir, Lista, P, Passo, Passos, Tabela } from "../ui";

export const acessos: PaginaDoc = {
  slug: "entrar-e-acessos",
  grupo: "Começando",
  titulo: "Entrar e acessos",
  resumo: "Como o arquiteto entra (Google ou e-mail e senha), como o cliente entra com o código do projeto e o que cada um vê ao abrir o app.",
  secoes: [
    {
      id: "arquiteto",
      titulo: "Entrar como arquiteto",
      papel: "arquiteto",
      corpo: (
        <>
          <P>Na tela inicial você vê a logo, o título “Gestão de projetos, do arquiteto ao cliente” e duas formas de entrar: com o Google ou com e-mail e senha.</P>
          <H3>Com o Google</H3>
          <Passos>
            <Passo>
              Toque em <Btn>Entrar com Google</Btn>.
            </Passo>
            <Passo>Escolha a conta Google no popup que abrir. O app sempre pergunta qual conta usar.</Passo>
            <Passo>Pronto: você cai no painel, com todos os seus projetos.</Passo>
          </Passos>
          <H3>Com e-mail e senha</H3>
          <P>Abaixo do botão do Google, o formulário tem três modos, que você alterna sem sair da tela:</P>
          <Tabela
            colunas={["Modo", "Como usar"]}
            linhas={[
              [<Btn key="1">Entrar</Btn>, "Digite o e-mail e a senha e toque em Entrar. O botão Mostrar deixa ver a senha digitada."],
              [<Btn key="2">Criar conta</Btn>, "Toque em “Criar conta”, digite seu nome, e-mail e uma senha de pelo menos 6 caracteres. A conta é criada e você já entra no painel."],
              [<Btn key="3">Esqueci a senha</Btn>, "Digite o e-mail e toque em Enviar o link. Você recebe um e-mail para criar uma nova senha (olhe também o spam)."],
            ]}
          />
          <Lista>
            <li>Mensagens de erro em português: “E-mail ou senha incorretos.”, “Já existe uma conta com este e-mail.”, “A senha precisa ter pelo menos 6 caracteres.”, “Esse e-mail não parece válido.”</li>
            <li>Por segurança, na recuperação de senha o app não revela se aquele e-mail tem conta.</li>
            <li>Maiúsculas no e-mail não importam.</li>
          </Lista>
          <Aviso tipo="dica" titulo="Quer entrar dos dois jeitos?">
            É possível, na mesma conta e com os mesmos projetos: veja “Minha conta” logo abaixo. Se você já entra com o Google, crie uma senha lá; se começou com e-mail e senha, vincule o Google.
          </Aviso>
          <Lista>
            <li>Se aparecer “Não foi possível entrar. Tente novamente.” no Google, tente de novo. Fechar o popup sem escolher conta não gera erro.</li>
            <li>Qualquer pessoa pode criar conta de arquiteto. Cada conta enxerga apenas os próprios projetos e dados.</li>
            <li>
              No <strong>modo demo</strong> (sem Firebase), o botão do Google entra como um arquiteto de exemplo, “Gabriel (demo)”, e o e-mail e senha funciona com contas guardadas só neste navegador (sem e-mail de recuperação).
            </li>
          </Lista>
          <P>Para sair, use o botão de sair (<Btn>Sair</Btn>) no topo laranja, na home ou na tela do projeto.</P>
        </>
      ),
    },
    {
      id: "minha-conta",
      titulo: "Minha conta: Google e senha na mesma conta",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            Toque na bolinha com a sua inicial, no topo do painel, para abrir <Btn>Minha conta</Btn>. A seção “Como você entra” mostra os dois jeitos e se cada um está <strong>Ativo</strong> ou <strong>Não ativado</strong>. É sempre a mesma conta, com os mesmos projetos, seja qual for o jeito de entrar.
          </P>
          <Tabela
            colunas={["Você entra hoje com…", "Para entrar também de outro jeito"]}
            linhas={[
              ["Google", "Em E-mail e senha, preencha Nova senha e Repita a senha e toque em Criar senha. Depois você entra com o seu e-mail e essa senha."],
              ["E-mail e senha", "No Google, toque em Vincular Google e escolha a conta no popup. Depois pode entrar com o botão do Google."],
            ]}
          />
          <Lista>
            <li>A senha precisa ter pelo menos 6 caracteres, e as duas digitações têm de ser iguais.</li>
            <li>Com a senha ativa, o botão <Btn>Enviar link para trocar a senha</Btn> manda um e-mail para você criar outra.</li>
            <li>Por segurança, em alguns casos o app pede que você entre de novo para concluir a mudança.</li>
          </Lista>
          <Aviso tipo="nota" titulo="Se tentar entrar do jeito errado">
            Se você costuma entrar com o Google e tenta e-mail e senha antes de criar a senha, aparece “E-mail ou senha incorretos” com a dica de entrar com o Google e criar uma senha em Minha conta. No sentido contrário, se o Google avisar que o e-mail já tem conta com senha, entre com e-mail e senha e vincule o Google em Minha conta.
          </Aviso>
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
