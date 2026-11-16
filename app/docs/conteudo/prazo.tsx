import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, H3, Ir, Lista, P, Passo, Passos, Tabela } from "../ui";

export const prazo: PaginaDoc = {
  slug: "prazo",
  grupo: "Projetos",
  titulo: "Prazo do projeto",
  resumo: "Previsão inicial imutável, novas previsões com motivo, linha do tempo e como a situação do prazo é calculada.",
  secoes: [
    {
      id: "ideia",
      titulo: "A ideia",
      corpo: (
        <>
          <P>
            O prazo da obra é registrado uma única vez, como <strong>previsão original</strong>, e não pode ser editado nem apagado, nem pelo arquiteto. Se a obra atrasar ou o prazo mudar, o arquiteto registra uma <strong>nova previsão</strong>, com data e motivo, e o app deixa claro que existe outra, mostrando as duas lado a lado.
          </P>
          <P>Assim o cliente sempre sabe o que foi combinado no começo e o que mudou depois. As previsões ficam em uma lista que só cresce.</P>
          <Aviso tipo="atencao" titulo="É imutável de verdade">
            Além da tela, as regras do banco de dados recusam qualquer alteração que não seja acrescentar exatamente uma previsão ao final. Para corrigir um erro, registre uma nova previsão.
          </Aviso>
        </>
      ),
    },
    {
      id: "registrar",
      titulo: "Registrar a previsão inicial",
      papel: "arquiteto",
      corpo: (
        <>
          <P>Enquanto não há previsão, o cartão do Resumo mostra “Prazo do projeto / Defina quanto tempo a obra deve levar”. O cliente vê “O arquiteto ainda não registrou o prazo previsto deste projeto.”</P>
          <Passos>
            <Passo>Toque em <Btn>Registrar previsão inicial</Btn>.</Passo>
            <Passo>Informe o <Btn>Início da obra</Btn> (começa com a data de hoje).</Passo>
            <Passo>Informe a <Btn>Duração prevista</Btn> (um número) e escolha dias, semanas ou meses (o padrão é meses).</Passo>
            <Passo>Se quiser, escreva uma <Btn>Observação</Btn>. A tela mostra na hora o “Término previsto em {"{data}"} · N dias de obra”.</Passo>
            <Passo>Marque a caixa “Entendo que a previsão original não poderá ser editada nem apagada.”</Passo>
            <Passo>Toque em <Btn>Registrar prazo original</Btn>.</Passo>
          </Passos>
          <Lista>
            <li>Semanas valem 7 dias. Meses são meses de calendário: o dia do mês é mantido, e em mês mais curto vai para o último dia.</li>
            <li>Se o registro falhar, a tela diz “Não consegui registrar agora. Nada foi alterado; tente de novo.” e mostra o código do erro.</li>
          </Lista>
        </>
      ),
    },
    {
      id: "nova-previsao",
      titulo: "Registrar uma nova previsão",
      papel: "arquiteto",
      corpo: (
        <>
          <Passos>
            <Passo>No cartão de prazo, toque em <Btn>Registrar nova previsão</Btn>. A janela mostra o prazo original e a previsão atual.</Passo>
            <Passo>Ajuste o <Btn>Início da obra</Btn> (começa com o da previsão atual) e informe o <Btn>Novo término previsto</Btn>.</Passo>
            <Passo>Explique em <Btn>Motivo da nova previsão</Btn> o que mudou. São exigidos pelo menos 8 caracteres, porque o cliente vai ler.</Passo>
            <Passo>Confira a diferença exibida (“+21 dias do original”, “−10 dias do original” ou “mesmo prazo do original”).</Passo>
            <Passo>Marque “Entendo que a previsão anterior continua registrada e que esta nova previsão não poderá ser editada.”</Passo>
            <Passo>Toque em <Btn>Registrar nova previsão</Btn>.</Passo>
          </Passos>
          <P>O botão só habilita se o término for depois do início e se mudou o término ou o início em relação à previsão atual. Os avisos “O término precisa ser depois do início.” e “Informe um término diferente do atual…” explicam quando algo falta.</P>
        </>
      ),
    },
    {
      id: "cartao",
      titulo: "O que o cartão mostra",
      papel: "todos",
      corpo: (
        <>
          <Lista>
            <li>Quanto tempo falta: “Faltam 47 dias”, “Termina hoje”, “Atrasado há 5 dias”, “Começa em 3 dias” ou “Projeto concluído”.</li>
            <li>O “Término previsto” por extenso e uma etiqueta de situação (tabela abaixo).</li>
            <li>Se houve replanejamento, uma faixa “Nova previsão · 2ª” com “Prazo original: {"{data}"}” e a diferença.</li>
            <li>A <strong>linha do tempo</strong>: uma barra por previsão na mesma escala. A original aparece esmaecida com um cadeado (“Previsão original”); as novas aparecem como “Nova previsão · 2ª”, e a atual fica cheia, em laranja, com a etiqueta “atual”. Uma linha vertical marca “Hoje”.</li>
            <li>As barras “Tempo decorrido” e “Projeto concluído” e a frase que compara as duas.</li>
            <li><Btn>Ver histórico (N)</Btn>: lista todas as previsões, da mais nova para a mais antiga, com período, dias, quem registrou, quando e o motivo.</li>
          </Lista>
          <H3>As situações</H3>
          <Tabela
            colunas={["Situação", "Quando aparece"]}
            linhas={[
              ["Concluído", "Todos os itens estão feitos e pagos."],
              ["Ainda não começou", "Hoje é antes do início previsto."],
              ["No prazo", "O tempo decorrido passa do concluído em até 10 pontos percentuais."],
              ["Atenção ao ritmo", "A folga entre tempo decorrido e concluído é de 10 a 25 pontos."],
              ["Atrasado", "A folga passa de 25 pontos, ou já passou o término sem concluir."],
            ]}
          />
          <P>
            O cálculo usa sempre a previsão <strong>vigente</strong> (a mais recente): % de tempo = (hoje − início) ÷ (término − início), limitado entre 0 e 100; % concluído = itens feitos e pagos ÷ itens. Folga = % de tempo − % concluído.
          </P>
        </>
      ),
    },
    {
      id: "na-home",
      titulo: "O prazo na home do arquiteto",
      papel: "arquiteto",
      corpo: (
        <P>
          Cada cartão de projeto mostra um mini-prazo (situação, “Tempo %”, “Concluído %” e término) e a faixa “Próximas entregas” ordena os projetos pelo término previsto atual. Veja <Ir para="painel">Painel do arquiteto</Ir>.
        </P>
      ),
    },
  ],
};
