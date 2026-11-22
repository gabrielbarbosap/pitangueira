import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, H3, Lista, P, Tabela } from "../ui";

export const planos: PaginaDoc = {
  slug: "planos-e-assinatura",
  grupo: "Recursos gerais",
  titulo: "Planos e assinatura",
  resumo: "Broto, Safra e Pomar: o que cada plano inclui, o teste grátis de 5 dias, os limites, os recibos e o cancelamento.",
  secoes: [
    {
      id: "planos",
      titulo: "Os três planos",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            A Pitangueira tem três planos. Compare tudo na página <Btn>Planos</Btn> (menu da home, ou <Btn>Minha conta</Btn> › <Btn>Ver e comparar os planos</Btn>). O acesso do cliente por código é <strong>ilimitado em todos os planos</strong>.
          </P>
          <Tabela
            colunas={["", "Broto", "Safra", "Pomar"]}
            linhas={[
              ["Projetos em andamento", "até 2", "até 5", "sem limite"],
              ["Catálogo", "até 200 itens", "sem limite", "sem limite"],
              ["Fornecedores", "até 7", "sem limite", "sem limite"],
              ["Orçamento, importação de planilha, gráficos, linha do tempo, WhatsApp, cobrança avulsa e a previsão inicial do prazo", "✓", "✓", "✓"],
              ["PDF", "com marca do escritório + selo Pitangueira", "só a marca do escritório", "só a marca do escritório"],
              ["Relatório mensal, visitas, ocorrências, vistoria, composições, escopo, novas previsões de prazo e financeiro dos honorários", "—", "✓", "✓"],
              ["Financeiro completo (previsão de 90 dias, inadimplência e atrasos)", "—", "—", "✓"],
              ["Equipe e exportação para Excel/CSV (em breve)", "—", "—", "✓"],
            ]}
          />
        </>
      ),
    },
    {
      id: "teste",
      titulo: "Teste grátis de 5 dias",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            Toda conta nova tem <strong>5 dias com os recursos da Safra</strong>, sem cobrança e sem cartão. Uma faixa na home mostra quantos dias faltam. Quando o teste acaba, a conta passa a valer como plano <strong>Broto</strong> até você assinar. <strong>Nada é apagado</strong>.
          </P>
        </>
      ),
    },
    {
      id: "limites",
      titulo: "Quando passa do limite",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            <strong>Projeto em andamento é o que não está arquivado.</strong> Arquivar libera a vaga (o projeto continua guardado); restaurar ocupa uma vaga. A home mostra “2 de 2 em andamento”.
          </P>
          <P>
            Quando um limite é atingido (projetos, itens do catálogo ou fornecedores), o app <strong>bloqueia a ação e explica o motivo</strong>: o que o plano permite, quantos você já tem, o que fazer e qual plano resolve. Os recursos de plano maior aparecem com o aviso “Disponível a partir do plano Safra” e um botão <Btn>Ver os planos</Btn>.
          </P>
          <Aviso tipo="nota" titulo="Nada some">
            Trocar de plano, passar do limite ou cancelar nunca apaga projetos, itens ou documentos. Só impede criar mais enquanto estiver acima do limite.
          </Aviso>
        </>
      ),
    },
    {
      id: "cortesia",
      titulo: "Plano de cortesia (quem já usava)",
      papel: "arquiteto",
      corpo: (
        <P>
          Quem já usava a Pitangueira antes dos planos está no <strong>Pomar de cortesia</strong>, sem limites e sem cobrança, <strong>por enquanto</strong>. Isso vai mudar: os planos dessas contas serão ajustados e o aviso vem antes. Uma faixa na home e a seção <Btn>Seu plano</Btn> em <Btn>Minha conta</Btn> lembram disso.
        </P>
      ),
    },
    {
      id: "recibos",
      titulo: "Pagamento, recibos e cancelamento",
      papel: "arquiteto",
      corpo: (
        <>
          <Lista>
            <li>A assinatura é recorrente (mensal ou anual) e processada pela Stripe. A assinatura online abre em breve.</li>
            <li><strong>Recibos:</strong> em <Btn>Minha conta</Btn> › <Btn>Recibos de pagamento</Btn> aparece cada pagamento, com o botão <Btn>Abrir recibo</Btn>. Por enquanto <strong>não emitimos nota fiscal</strong>.</li>
            <li><strong>Cancelamento em até 7 dias com reembolso integral</strong> depois de contratar. Passado esse prazo, o acesso segue até o fim do período pago.</li>
            <li>Se um pagamento falhar, há um prazo de carência; depois a conta volta ao Broto, sem apagar nada.</li>
          </Lista>
          <H3>Termos de uso</H3>
          <P>As regras completas estão nos <a className="font-semibold text-pitanga underline" href="/termos">Termos de uso</a>, que aparecem também na tela de entrada.</P>
        </>
      ),
    },
    {
      id: "demo",
      titulo: "Testar os planos (modo demo)",
      papel: "arquiteto",
      corpo: (
        <P>
          No modo demo (sem Firebase), <Btn>Minha conta</Btn> tem o <strong>Simulador de planos</strong>: troque entre Broto, Safra, Pomar, cortesia, teste e fim do teste para ver cada limite e cada bloqueio. Com o Firebase, o plano vem da assinatura e esse simulador não existe.
        </P>
      ),
    },
  ],
};
