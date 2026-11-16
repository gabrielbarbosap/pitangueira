import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, H3, Ir, Lista, P, Tabela } from "../ui";

export const orcamento: PaginaDoc = {
  slug: "orcamento-e-valores",
  grupo: "Projetos",
  titulo: "Orçamento e valores",
  resumo: "Como o app calcula orçado, real, previsto, pago e saldo, e onde cada número aparece.",
  secoes: [
    {
      id: "tipos-de-valor",
      titulo: "Orçado, real e efetivo",
      corpo: (
        <>
          <Tabela
            colunas={["Valor", "O que é", "Onde é usado"]}
            linhas={[
              ["Orçado", "O que foi previsto para o item (quantidade × valor unitário, ajustável).", "Barra “Orçado (planilha)”, rosca “Composição do orçamento”, Top 10 itens, comparação “Real × orçado”."],
              ["Real", "Quanto o item realmente custou. Opcional.", "Entra no valor efetivo."],
              ["Efetivo", "O real, se for maior que zero; senão o orçado.", "Tudo o mais: pago, previsto, projeção, gráficos, PDFs, cartões da home."],
            ]}
          />
          <Aviso tipo="dica">Informe o valor real quando a conta chegar. Real zero ou vazio faz o item voltar a valer o orçado.</Aviso>
        </>
      ),
    },
    {
      id: "totais",
      titulo: "Como os totais são calculados",
      corpo: (
        <Tabela
          colunas={["Número", "Cálculo"]}
          linhas={[
            ["Previsto / Projeção de custo", "Soma do valor efetivo de todos os itens."],
            ["Já pago", "Soma do valor efetivo dos itens marcados como Pago."],
            ["Falta pagar", "Soma do valor efetivo dos itens ainda não pagos."],
            ["Saldo em caixa", "Orçamento disponível (teto) menos o já pago."],
            ["Folga no teto", "Teto menos a projeção de custo. Negativo significa estouro."],
            ["Concluído (%)", "Itens feitos e pagos ÷ total de itens."],
          ]}
        />
      ),
    },
    {
      id: "teto",
      titulo: "O teto (orçamento disponível)",
      papel: "todos",
      corpo: (
        <>
          <P>
            É o quanto há para gastar no total. Defina ao criar o projeto ou depois em <Btn>Ajustes do projeto</Btn> (engrenagem). Sem teto, os cartões mostram “—” e os avisos de estouro ficam desligados.
          </P>
          <Lista>
            <li>Alimenta o Saldo em caixa e a frase “Projeção acima do teto / Folga de R$ X no teto”.</li>
            <li>Aparece no gráfico “Orçamento em foco” como uma linha tracejada e no cartão “Projeção × teto” dos Gráficos.</li>
            <li>Entra no resumo do PDF do orçamento (“Orçamento disponível” e “Folga” ou “Acima do disponível”).</li>
          </Lista>
        </>
      ),
    },
    {
      id: "ferramentas",
      titulo: "Ferramentas para montar o orçamento",
      papel: "arquiteto",
      corpo: (
        <>
          <H3>Do seu jeito</H3>
          <Lista>
            <li>Digitar item por item (<Ir para="itens">Itens do orçamento</Ir>).</li>
            <li>Reaproveitar do seu catálogo e das suas composições (<Ir para="catalogo-e-composicoes">Catálogo e composições</Ir>).</li>
            <li>Começar a partir de outro projeto seu (<Ir para="criar-e-gerenciar-projetos">Criar e gerenciar projetos</Ir>).</li>
          </Lista>
          <H3>Para entregar</H3>
          <Lista>
            <li>Orçamento em PDF, geral ou por etapa/ambiente (<Ir para="pdfs">PDFs e marca do escritório</Ir>).</li>
          </Lista>
        </>
      ),
    },
  ],
};
