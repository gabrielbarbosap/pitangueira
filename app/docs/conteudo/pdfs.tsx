import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, H3, Ir, Lista, P, Passo, Passos, Tabela } from "../ui";

export const pdfs: PaginaDoc = {
  slug: "pdfs",
  grupo: "Projetos",
  titulo: "PDFs e marca do escritório",
  resumo: "Orçamento geral ou por parte, como salvar o PDF e como configurar a marca (logo, nome, cor) que aparece nos documentos.",
  secoes: [
    {
      id: "visao",
      titulo: "Os três documentos",
      corpo: (
        <>
          <Tabela
            colunas={["Documento", "Onde gerar", "Quem gera"]}
            linhas={[
              ["Orçamento", "Aba Itens → Orçamento em PDF", "Arquiteto e cliente"],
              ["Escopo do projeto", "Aba Escopo → Gerar PDF do escopo", "Só o arquiteto"],
              ["Relatório mensal de andamento", "Resumo → Gerar relatório", "Só o arquiteto"],
            ]}
          />
          <Aviso tipo="nota" titulo="Como o PDF é salvo">
            O app abre o documento em tela cheia e usa a impressão do navegador. Toque em <Btn>Imprimir / salvar PDF</Btn> e, na janela de impressão, escolha “Salvar como PDF”. Não existe download direto. No celular, o navegador pode acrescentar o próprio cabeçalho de impressão.
          </Aviso>
        </>
      ),
    },
    {
      id: "orcamento",
      titulo: "Gerar o orçamento em PDF",
      papel: "todos",
      corpo: (
        <>
          <Passos>
            <Passo>Na aba Itens, toque em <Btn>Orçamento em PDF</Btn>.</Passo>
            <Passo>
              Escolha o recorte: <Btn>Orçamento geral</Btn> (o projeto todo, por etapa, com resumo financeiro), <Btn>Por etapa</Btn> (só as etapas escolhidas) ou <Btn>Por ambiente</Btn> (só os ambientes escolhidos).
            </Passo>
            <Passo>Nos recortes por parte, marque as partes que entram. Cada uma mostra “N itens · R$ X”; use <Btn>Todos</Btn> e <Btn>Nenhum</Btn> para marcar rápido.</Passo>
            <Passo>
              Com mais de uma parte, escolha “Como gerar”: <Btn>Um PDF só</Btn> (cada parte em uma página) ou <Btn>Um PDF por etapa/ambiente</Btn> (você salva um arquivo de cada vez).
            </Passo>
            <Passo>
              Toque em <Btn>Gerar orçamento geral</Btn>, <Btn>Gerar PDF</Btn> ou <Btn>Gerar N PDFs</Btn>.
            </Passo>
          </Passos>
          <H3>Vários PDFs separados</H3>
          <P>
            No modo separado, a barra do topo tem as setas ‹ e › e o texto “1 de 4 · Pintura” para navegar entre as partes. <Btn>Salvar PDF desta parte</Btn> salva uma por vez, com o nome da parte no arquivo.
          </P>
          <H3>O que o documento contém</H3>
          <Lista>
            <li>Cabeçalho na cor da sua marca, com “Orçamento”, o nome do projeto, a data e o seu escritório.</li>
            <li>Quadro com Cliente(s), Projeto, Endereço e a etapa (ou o recorte).</li>
            <li>
              Resumo: no geral, custo previsto, orçamento disponível e folga (ou “Acima do disponível”); nas partes, o total da parte, o número de itens e quanto ela é do orçamento do projeto.
            </li>
            <li>Tabela por parte (Descrição, Qtd, Unitário, Total) com subtotal. Dentro de uma etapa mostra o ambiente de cada item; dentro de um ambiente mostra a etapa.</li>
            <li>Total geral, assinaturas (responsável técnico e cliente) e o selo discreto “Gerado com Pitangueira · gestão de projetos” ao final.</li>
          </Lista>
          <Aviso tipo="atencao" titulo="Privacidade e PDF">
            O olhinho esconde valores na tela, mas não nos PDFs: os documentos sempre trazem os valores reais (no relatório mensal você pode desligar os valores em R$).
          </Aviso>
        </>
      ),
    },
    {
      id: "marca",
      titulo: "Configurar a marca do escritório",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            A marca vale por projeto e é editada em <Btn>Escopo</Btn> → <Btn>Dados do projeto</Btn> → <Btn>Editar dados</Btn>, no bloco “Marca nos PDFs”.
          </P>
          <Tabela
            colunas={["Campo", "Onde aparece"]}
            linhas={[
              ["Nome do escritório", "Cabeçalho dos PDFs."],
              ["Contato", "Abaixo do nome do escritório."],
              ["Cor de destaque", "A cor do cabeçalho dos PDFs. Escolha uma das 6 cores ou “Padrão”."],
              ["Logo", "No cabeçalho. Use Enviar logo, Trocar ou Remover. A imagem é reduzida automaticamente (lado maior de 320 px)."],
              ["Responsável técnico e Registro profissional (CAU/CREA)", "Rodapé de assinatura."],
            ]}
          />
          <H3>Marca padrão</H3>
          <Lista>
            <li>Marque “Guardar como minha marca padrão (para os próximos projetos)” para guardar a marca no seu perfil.</li>
            <li>Em outro projeto, o link <Btn>Usar minha marca padrão</Btn> aplica a marca guardada. Ela não é aplicada sozinha a projetos novos.</li>
            <li>Projetos criados a partir de outro já herdam a marca do projeto de origem.</li>
          </Lista>
          <Aviso tipo="dica">Sem logo e sem nome de escritório, os PDFs usam a logo da Pitangueira no cabeçalho. Se a imagem não puder ser lida, tente um PNG ou JPG.</Aviso>
          <P>Os outros campos do bloco (cliente, tipo e endereço) são explicados em <Ir para="escopo">Escopo do projeto</Ir>.</P>
        </>
      ),
    },
  ],
};
