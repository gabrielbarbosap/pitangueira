import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, Ir, P, Passo, Passos } from "../ui";

export const primeirosPassos: PaginaDoc = {
  slug: "primeiros-passos",
  grupo: "Começando",
  titulo: "Primeiros passos",
  resumo: "Do primeiro acesso ao projeto compartilhado com o cliente, em sete passos.",
  secoes: [
    {
      id: "roteiro",
      titulo: "O roteiro completo",
      papel: "arquiteto",
      corpo: (
        <>
          <P>Se esta é a sua primeira vez, siga este roteiro. Cada passo tem uma página própria nesta documentação, com todos os detalhes.</P>
          <Passos>
            <Passo>
              <strong>Entre.</strong> Na tela inicial, toque em <Btn>Entrar com Google</Btn>. Na primeira visita um tutorial guiado mostra a tela.
            </Passo>
            <Passo>
              <strong>Crie o projeto.</strong> Toque no botão <Btn>Novo projeto</Btn>, escreva o nome e, se quiser, o orçamento disponível. A chave de acesso já vem pronta. Escolha começar do zero ou a partir de um projeto seu e toque em <Btn>Criar projeto</Btn>.
            </Passo>
            <Passo>
              <strong>Registre o prazo.</strong> No Resumo, toque em <Btn>Registrar previsão inicial</Btn>, informe o início e a duração, confirme e registre. Essa previsão não poderá ser editada depois.
            </Passo>
            <Passo>
              <strong>Monte o orçamento.</strong> Na aba <Btn>Itens</Btn>, toque em <Btn>Adicionar primeiro item</Btn> (ou <Btn>Usar meu catálogo</Btn>). Preencha etapa, descrição, quantidade e valor unitário.
            </Passo>
            <Passo>
              <strong>Escreva o escopo.</strong> Na aba <Btn>Escopo</Btn>, comece por um modelo ou adicione os ambientes e os pedidos do cliente. Ligue cada pedido aos itens do orçamento.
            </Passo>
            <Passo>
              <strong>Gere o orçamento em PDF.</strong> Na aba Itens, toque em <Btn>Orçamento em PDF</Btn>, escolha o orçamento geral ou por etapa/ambiente e salve o PDF.
            </Passo>
            <Passo>
              <strong>Compartilhe com o cliente.</strong> Na home, toque em <Btn>Copiar link</Btn> no cartão do projeto e envie o link. A chave de acesso (no rodapé do cartão) você envia à parte.
            </Passo>
          </Passos>
          <Aviso tipo="nota">
            Depois disso, o dia a dia é marcar o que foi feito e o que foi pago, registrar novas previsões de prazo quando precisar e, todo mês, gerar o relatório de andamento para o cliente.
          </Aviso>
        </>
      ),
    },
    {
      id: "enviar-ao-cliente",
      titulo: "O que mandar para o cliente",
      papel: "arquiteto",
      corpo: (
        <>
          <P>O cliente precisa de duas coisas, que o app separa de propósito:</P>
          <Passos>
            <Passo>
              O <strong>link do projeto</strong>, que você copia com <Btn>Copiar link</Btn> (termina em <Btn>/obra/…</Btn>). O botão copia só o link, nunca a chave.
            </Passo>
            <Passo>
              A <strong>chave de acesso</strong>, de 6 caracteres, que aparece no rodapé do cartão do projeto (“CHAVE ABC123”).
            </Passo>
          </Passos>
          <P>O cliente abre o link, digita a chave e o nome dele e entra. Veja o passo a passo dele em <Ir para="guia-do-cliente">Guia do cliente</Ir>.</P>
          <Aviso tipo="dica">Mandar o link e a chave em mensagens separadas é mais seguro: quem tiver só o link não consegue entrar.</Aviso>
        </>
      ),
    },
    {
      id: "tutorial",
      titulo: "Rever o tutorial",
      corpo: (
        <P>
          Na primeira visita o app abre um tutorial guiado sozinho. Para ver de novo, toque no botão <Btn>?</Btn> (“Ver o tutorial”) no topo da home do arquiteto ou da tela do projeto. Mais detalhes em <Ir para="privacidade-e-tutorial">Privacidade e tutorial</Ir>.
        </P>
      ),
    },
  ],
};
