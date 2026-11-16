import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, H3, Lista, P, Passo, Passos, Tabela } from "../ui";

export const catalogo: PaginaDoc = {
  slug: "catalogo-e-composicoes",
  grupo: "Suas ferramentas",
  titulo: "Catálogo e composições",
  resumo: "Seu catálogo pessoal de itens e preços e as composições de custo com BDI e margem.",
  secoes: [
    {
      id: "catalogo",
      titulo: "Meu catálogo",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            O catálogo é a sua lista pessoal de itens com unidade e preço. Ele é só seu: não aparece para clientes nem para outros arquitetos, e vale para todos os seus projetos.
          </P>
          <P>
            Abra pela pílula <Btn>Meu catálogo</Btn> na home (para gerenciar) ou pela pílula <Btn>Catálogo</Btn> na aba Itens de um projeto (para adicionar ao orçamento).
          </P>
          <H3>Cadastrar um item</H3>
          <Passos>
            <Passo>Toque em <Btn>+ Novo item</Btn>.</Passo>
            <Passo>Preencha <Btn>Descrição</Btn> (obrigatório), <Btn>Unidade</Btn> (padrão “un”), <Btn>Valor unit. (R$)</Btn> e <Btn>Etapa</Btn>.</Passo>
            <Passo>Toque em <Btn>Salvar no catálogo</Btn>.</Passo>
          </Passos>
          <H3>Importar de um projeto</H3>
          <P>
            Dentro de um projeto, <Btn>Importar deste projeto</Btn> copia todos os itens dele para o catálogo, ignorando os que já existem (mesma descrição e unidade). O app avisa quantos itens novos entraram. O valor unitário vem do item ou do orçado dividido pela quantidade.
          </P>
          <H3>Usar no orçamento</H3>
          <Passos>
            <Passo>Dentro do projeto, abra <Btn>Catálogo</Btn> e busque o item em “Buscar no catálogo…”.</Passo>
            <Passo>Informe a quantidade na linha do item.</Passo>
            <Passo>Toque em <Btn>Adicionar ao orçamento</Btn>.</Passo>
          </Passos>
          <Aviso tipo="nota" titulo="É uma cópia">
            O item entra no orçamento com os valores do momento (etapa do catálogo ou “Sem etapa”, ambiente “Geral”). Se você mudar o preço no catálogo depois, os itens já criados não mudam.
          </Aviso>
          <P>Há também a busca no catálogo dentro da janela de novo item e a opção “Guardar no meu catálogo para usar em outros projetos”. Remover do catálogo não altera orçamentos já feitos.</P>
        </>
      ),
    },
    {
      id: "composicoes",
      titulo: "Composições de custo",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            Uma composição monta o preço de um serviço a partir dos insumos (material, mão de obra, equipamento), somando BDI e margem. Abra pela pílula <Btn>Composições</Btn> na home ou na aba Itens.
          </P>
          <H3>Criar uma composição</H3>
          <Passos>
            <Passo>Toque em <Btn>+ Nova composição</Btn>.</Passo>
            <Passo>Informe o <Btn>Serviço</Btn> (ex.: “Pintura de parede”), a unidade em <Btn>Por</Btn> (ex.: m²) e, se quiser, a <Btn>Etapa do orçamento</Btn>.</Passo>
            <Passo>Em “Insumos para 1 m²”, toque em <Btn>+ Insumo</Btn> e preencha descrição, tipo (Material, Mão de obra ou Equipamento), quantidade por unidade, unidade e valor unitário.</Passo>
            <Passo>Defina o <Btn>BDI (%)</Btn> e a <Btn>Margem de lucro (%)</Btn>.</Passo>
            <Passo>Confira o resumo e toque em <Btn>Salvar composição</Btn>.</Passo>
          </Passos>
          <H3>Como o preço é calculado</H3>
          <Tabela
            colunas={["Linha", "Cálculo"]}
            linhas={[
              ["Custo direto", "Soma de (quantidade × valor) de todos os insumos, com subtotais por tipo."],
              ["BDI", "Custo direto × BDI%. BDI cobre despesas indiretas, impostos e administração."],
              ["Margem", "(Custo direto + BDI) × margem%. É aplicada sobre o custo já com BDI."],
              ["Preço por unidade", "Custo direto + BDI + margem."],
            ]}
          />
          <H3>Insumo ligado ao catálogo</H3>
          <P>
            Em “Buscar insumo no meu catálogo (o preço acompanha o catálogo)…”, ao escolher um item o valor fica travado e acompanha o catálogo: se você mudar o preço lá, a composição muda. Se o item do catálogo for apagado, volta a valer o valor que estava digitado.
          </P>
          <H3>BDI e margem padrão</H3>
          <P>
            Marque “Usar este BDI e esta margem como padrão das próximas composições” para salvá-los. A lista mostra “Padrão: BDI X% · margem Y%”.
          </P>
          <H3>Usar no orçamento</H3>
          <P>
            Dentro do projeto, informe a quantidade e toque em <Btn>Adicionar ao orçamento</Btn>. O item é criado com o nome da composição, a unidade e o preço calculado, e o orçado igual à quantidade × preço. Como no catálogo, é uma cópia: depois não há vínculo com a composição.
          </P>
          <Lista>
            <li>Insumos sem descrição são descartados ao salvar.</li>
            <li>Remover uma composição não altera os orçamentos já criados.</li>
          </Lista>
        </>
      ),
    },
  ],
};
