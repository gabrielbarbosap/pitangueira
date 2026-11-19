import type { PaginaDoc } from "../tipos";
import { Aviso, H3, Lista, P, Tabela } from "../ui";

export const dados: PaginaDoc = {
  slug: "dados-e-seguranca",
  grupo: "Recursos gerais",
  titulo: "Dados, permissões e segurança",
  resumo: "Onde cada informação fica, quem pode ler e alterar o quê e como o acesso por chave funciona.",
  secoes: [
    {
      id: "onde",
      titulo: "Onde cada dado fica",
      corpo: (
        <>
          <Tabela
            colunas={["Dado", "Onde", "Quem vê"]}
            linhas={[
              ["Projeto, itens, escopo, prazos, marca", "No projeto (nuvem)", "O arquiteto dono e os clientes que entraram com a chave"],
              ["Catálogo, composições, fornecedores, honorários, marca padrão, BDI e margem padrão", "No perfil do arquiteto (nuvem)", "Só o próprio arquiteto"],
              ["Olhinho e tutoriais já vistos", "No navegador do aparelho", "Só aquele aparelho"],
              ["Lista de projetos do cliente", "No navegador do aparelho", "Só aquele aparelho"],
            ]}
          />
          <Aviso tipo="nota" titulo="Modo demo">
            Sem o Firebase configurado, tudo (inclusive os projetos) fica no navegador. O link do projeto só funciona no mesmo navegador, e recarregar a página exige entrar de novo, sem perder os dados.
          </Aviso>
        </>
      ),
    },
    {
      id: "permissoes",
      titulo: "Quem pode o quê",
      corpo: (
        <>
          <Tabela
            colunas={["Ação", "Arquiteto dono", "Cliente"]}
            linhas={[
              ["Ver o projeto", "Sim", "Sim, com a chave"],
              ["Editar nome, criar, editar e remover itens", "Sim", "Não"],
              ["Marcar Feito e Pago", "Sim", "Sim"],
              ["Alterar o orçamento disponível (teto)", "Sim", "Sim"],
              ["Registrar prazo e novas previsões", "Sim", "Não"],
              ["Arquivar e excluir o projeto", "Sim", "Não"],
              ["Ver Escopo e gerar relatório", "Sim", "Não"],
              ["Criar visitas, ocorrências e pontos da vistoria", "Sim", "Não"],
              ["Conferir pontos da vistoria (OK ou Ajustar)", "Sim", "Sim"],
            ]}
          />
          <Aviso tipo="atencao" titulo="Escopo e segurança">
            A aba Escopo fica escondida do cliente na interface, mas as informações do escopo estão dentro do projeto. Um cliente com conhecimento técnico poderia lê-las por consulta direta ao banco. Se o escopo tiver algo sigiloso, mantenha isso em mente.
          </Aviso>
        </>
      ),
    },
    {
      id: "chave",
      titulo: "Como a chave de acesso protege o projeto",
      corpo: (
        <>
          <Lista>
            <li>Para entrar como cliente é preciso o link (que tem o identificador do projeto) e a chave do projeto. Só o servidor valida a chave: se estiver errada, o acesso é recusado.</li>
            <li>Cada cliente que entra é registrado como membro do projeto, com o nome que digitou.</li>
            <li>A chave não pode ser trocada depois de criada. Se ela vazar, o caminho é arquivar ou excluir o projeto e criar outro.</li>
            <li>Um cliente só enxerga os projetos em que entrou; não consegue listar outros.</li>
          </Lista>
        </>
      ),
    },
    {
      id: "historico",
      titulo: "Quem marcou e quando",
      corpo: (
        <>
          <P>
            Ao marcar Feito ou Pago, o app guarda o nome de quem marcou e a data, e mostra os dois embaixo do item (“Pago por Marina (cliente) em 13/11 09:10”) e no cartão Atividade recente do Resumo. Marcações do cliente levam “(cliente)” no nome. As datas também alimentam o relatório mensal, o gráfico de ritmo de pagamento e o histórico dos fornecedores.
          </P>
          <H3>Prazo</H3>
          <P>
            Cada previsão de prazo registra quem a criou, quando e o motivo, e isso é visível em “Ver histórico”. As previsões não podem ser alteradas.
          </P>
        </>
      ),
    },
  ],
};
