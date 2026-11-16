import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, H3, Lista, P, Tabela } from "../ui";

export const privacidade: PaginaDoc = {
  slug: "privacidade-e-tutorial",
  grupo: "Recursos gerais",
  titulo: "Privacidade e tutorial",
  resumo: "O olhinho que esconde os valores em dinheiro e o tutorial guiado da primeira visita.",
  secoes: [
    {
      id: "olhinho",
      titulo: "O olhinho (ocultar valores)",
      papel: "todos",
      corpo: (
        <>
          <P>
            O botão de olho no topo (“Ocultar valores” / “Mostrar valores”) funciona como nos apps de banco: com ele ligado, todo valor em dinheiro vira “R$ ••••” nos cartões, listas e gráficos. Bom para mostrar a tela a outra pessoa.
          </P>
          <Lista>
            <li>Aparece na home do arquiteto, na tela do projeto (arquiteto e cliente) e no Financeiro.</li>
            <li>A escolha vale para o app inteiro e fica guardada no aparelho, mesmo depois de fechar. Em outro aparelho, você escolhe de novo.</li>
            <li>Nos gráficos, os eixos de valor ficam vazios e as dicas ao tocar mostram a máscara.</li>
          </Lista>
          <H3>O que não é escondido</H3>
          <Tabela
            colunas={["Continua visível", "Por quê"]}
            linhas={[
              ["Percentuais e contagens", "Não são dinheiro."],
              ["Os documentos PDF (orçamento, escopo, relatório)", "São documentos para entregar; sempre trazem os valores reais (o relatório mensal tem a opção de omiti-los)."],
              ["Os campos de edição (ex.: valor no formulário de item)", "Você precisa ver o que está digitando."],
            ]}
          />
        </>
      ),
    },
    {
      id: "tutorial",
      titulo: "O tutorial guiado",
      papel: "todos",
      corpo: (
        <>
          <P>
            Na primeira visita, o app escurece a tela, destaca um elemento por vez e mostra um cartão “Tutorial · 3 de 8” com a explicação. Existem três tutoriais independentes: da <strong>home do arquiteto</strong>, da <strong>tela do projeto para o arquiteto</strong> e da <strong>tela do projeto para o cliente</strong>. A home do cliente não tem tutorial.
          </P>
          <Tabela
            colunas={["Controle", "O que faz"]}
            linhas={[
              [<Btn key="1">Próximo</Btn>, "Avança (a seta direita e o Enter também). No último passo vira Concluir."],
              [<Btn key="2">Voltar</Btn>, "Volta um passo (seta esquerda)."],
              [<Btn key="3">Pular</Btn>, "Fecha o tutorial. Some no último passo. Esc também fecha."],
              [<Btn key="4">?</Btn>, "Botão no topo da home e da tela do projeto: abre o tutorial de novo."],
            ]}
          />
          <Aviso tipo="nota">
            Pular, concluir ou fechar marca o tutorial como visto naquele aparelho, e ele não abre sozinho de novo. Passos cujo alvo não está na tela (por exemplo, um projeto sem itens) são pulados automaticamente. Os passos do projeto trocam de aba sozinhos.
          </Aviso>
          <H3>Roteiro da home do arquiteto</H3>
          <P>Bem-vindo à Pitangueira → Comece por aqui → Cada projeto é um cartão → A visão de todos os projetos → Próximas entregas → Suas ferramentas pessoais → Privacidade num toque → Pronto!</P>
          <H3>Roteiro do projeto (arquiteto)</H3>
          <P>Este é o seu projeto → Andamento geral → Quatro áreas → O que está em andamento → Prazo do projeto → Relatório do mês → Monte o orçamento → Escopo do projeto → Ajustes do projeto → Privacidade num toque → Pronto!</P>
          <H3>Roteiro do projeto (cliente)</H3>
          <P>Acompanhe o seu projeto → Andamento geral → Três áreas → O prazo da obra → Marque o que foi feito e pago → Privacidade num toque → Pronto!</P>
        </>
      ),
    },
  ],
};
