import type { PaginaDoc } from "../tipos";
import { Tabela } from "../ui";

export const glossario: PaginaDoc = {
  slug: "glossario",
  grupo: "Referência",
  titulo: "Glossário",
  resumo: "As palavras usadas no app, em ordem alfabética.",
  secoes: [
    {
      id: "termos",
      titulo: "Termos",
      corpo: (
        <Tabela
          colunas={["Termo", "Significado"]}
          linhas={[
            ["A pagar", "Valor dos itens ainda não pagos."],
            ["Ambiente", "O espaço da obra a que o item pertence (Cozinha, Suíte). Vazio vira “Geral”."],
            ["Arquivar", "Tirar o projeto da lista principal sem apagar nada. Reversível."],
            ["BDI", "Benefícios e despesas indiretas: percentual somado ao custo direto de uma composição, para cobrir despesas indiretas, impostos e administração."],
            ["Catálogo", "Sua lista pessoal de itens e preços, reutilizável em todos os projetos."],
            ["Chave de acesso", "Código de 6 caracteres que o cliente usa, com o link, para entrar no projeto."],
            ["Composição", "Preço de um serviço montado a partir de insumos, com BDI e margem."],
            ["Concluído", "Item feito e pago ao mesmo tempo."],
            ["Custo direto", "Soma dos insumos de uma composição, antes de BDI e margem."],
            ["Efetivo (valor)", "O valor real do item, se maior que zero; senão o orçado."],
            ["Escopo", "Ambientes e pedidos do cliente, combinados com ele."],
            ["Etapa", "Fase da obra (Alvenaria, Elétrica, Pintura)."],
            ["Feito", "Marca de que o serviço foi executado."],
            ["Honorário", "O que o escritório cobra do cliente; no Financeiro, vira parcelas."],
            ["Insumo", "Material, mão de obra ou equipamento dentro de uma composição."],
            ["Item", "Uma linha do orçamento."],
            ["Margem", "Percentual de lucro aplicado sobre o custo já com BDI."],
            ["Nova previsão", "Novo prazo registrado ao lado da previsão original, com motivo. As anteriores continuam."],
            ["Orçado", "Valor previsto para o item."],
            ["Pago", "Marca de que o valor do item foi pago."],
            ["Pedido", "Algo que o cliente precisa em um ambiente, registrado no escopo."],
            ["Previsão original", "O primeiro prazo registrado. Nunca pode ser editado."],
            ["Projeção de custo", "Soma dos valores efetivos de todos os itens."],
            ["Real (valor)", "Quanto o item realmente custou."],
            ["Saldo em caixa", "Teto menos o já pago."],
            ["Teto", "Orçamento disponível: quanto há para gastar no total."],
          ]}
        />
      ),
    },
  ],
};
