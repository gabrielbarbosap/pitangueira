import type { PaginaDoc } from "../tipos";
import { Aviso, Btn, H3, Ir, Lista, P, Passo, Passos, Tabela } from "../ui";

export const acompanhar: PaginaDoc = {
  slug: "acompanhar",
  grupo: "Projetos",
  titulo: "Acompanhar a obra",
  resumo: "Linha do tempo, visitas e reuniões, ocorrências e vistoria final, com envio ao cliente pelo WhatsApp.",
  secoes: [
    {
      id: "visao",
      titulo: "Para que serve",
      papel: "todos",
      corpo: (
        <>
          <P>
            A aba <Btn>Acompanhar</Btn> mostra o que acontece no projeto além dos números: um registro de tudo, as visitas e reuniões, os problemas e a conferência final antes da entrega. Quatro seções, que você alterna no topo da aba:
          </P>
          <Tabela
            colunas={["Seção", "O que é", "Quem mexe"]}
            linhas={[
              ["Linha do tempo", "O feed do projeto: tudo o que aconteceu, dia a dia, com os avisos do arquiteto.", "Arquiteto publica avisos; o resto entra sozinho"],
              ["Visitas", "Visitas técnicas e reuniões, com pauta antes e ata depois.", "Arquiteto cria; cliente vê"],
              ["Ocorrências", "Problemas e imprevistos, com responsável e como foram resolvidos.", "Arquiteto cria; cliente vê"],
              ["Vistoria", "A lista do que conferir antes de entregar a obra.", "Arquiteto e cliente adicionam pontos e conferem"],
            ]}
          />
          <Aviso tipo="nota" titulo="Números ao lado de cada seção">
            O número pequeno nas seções mostra o que precisa de atenção: visitas agendadas, ocorrências em aberto e pontos da vistoria ainda sem conferir.
          </Aviso>
        </>
      ),
    },
    {
      id: "whatsapp",
      titulo: "Enviar ao cliente pelo WhatsApp",
      papel: "arquiteto",
      corpo: (
        <>
          <P>
            Em quase tudo desta aba há um botão verde <Btn>Enviar</Btn>, <Btn>Enviar ao cliente</Btn> (ou <Btn>Enviar convite</Btn>, <Btn>Enviar ata</Btn>, <Btn>Avisar o cliente</Btn>, <Btn>Enviar resumo da semana</Btn>). Ele <strong>não envia nada sozinho</strong>: monta a mensagem e abre o WhatsApp para você revisar e apertar enviar.
          </P>
          <Passos>
            <Passo>Toque no botão verde do item que você quer encaminhar.</Passo>
            <Passo>Na janela, leia a <Btn>Mensagem para o cliente</Btn>. Ela já vem pronta, com o link do projeto, e você pode editar o texto.</Passo>
            <Passo>Se quiser, preencha o <Btn>WhatsApp do cliente (opcional)</Btn>, com DDD. O número fica guardado no projeto e vem preenchido da próxima vez. Sem número, o WhatsApp abre para você escolher o contato.</Passo>
            <Passo>Toque em <Btn>Abrir no WhatsApp</Btn> e, no WhatsApp, aperte enviar.</Passo>
          </Passos>
          <Aviso tipo="dica">Quem manda é sempre uma pessoa: o app só prepara a mensagem. O cliente recebe como qualquer outra mensagem e, pelo link, abre o projeto. O cliente tem o próprio botão na vistoria, para mandar ao arquiteto (veja abaixo).</Aviso>
        </>
      ),
    },
    {
      id: "linha-do-tempo",
      titulo: "A linha do tempo: o feed do projeto",
      papel: "todos",
      corpo: (
        <>
          <P>
            A tela inicial do Acompanhar é um <strong>feed</strong>, como numa rede social: tudo o que acontece no projeto, dia a dia, do mais novo ao mais antigo. Cada novidade vira um cartão com quem fez, há quanto tempo (“agora”, “há 2 h”, “ontem 14:30”), o texto e uma etiqueta do tipo. Os dias têm título (“Hoje”, “Ontem”, “quarta, 12 de novembro”), e o que está marcado para o futuro, como uma visita agendada, fica no topo em “Agendado”.
          </P>
          <H3>Os números do topo</H3>
          <Tabela
            colunas={["Cartão", "O que mostra"]}
            linhas={[
              ["Prazo", "Quanto falta para o término previsto, ou quanto atrasou (só aparece se o prazo foi registrado)."],
              ["Próxima visita", "A data, a hora e o título da próxima visita agendada. Toque para abrir as visitas."],
              ["Ocorrências", "Quantas estão em aberto. Toque para abrir as ocorrências."],
              ["Vistoria", "Quantos pontos já foram conferidos e quantos pedem ajuste. Toque para abrir a vistoria."],
            ]}
          />
          <H3>Publicar um aviso (arquiteto)</H3>
          <Passos>
            <Passo>No campo “Compartilhe uma novidade da obra…”, escreva o aviso (por exemplo, “A alvenaria da sala ficou pronta hoje!”).</Passo>
            <Passo>Toque em <Btn>Publicar</Btn>. O aviso entra no feed com o seu nome, e o cliente o vê.</Passo>
            <Passo>Se quiser, toque em <Btn>Enviar</Btn> no cartão para encaminhar o aviso pelo WhatsApp. A lixeira remove o aviso.</Passo>
          </Passos>
          <H3>O que aparece no feed</H3>
          <Tabela
            colunas={["Tipo", "Quando entra"]}
            linhas={[
              ["Avisos", "Quando o arquiteto publica."],
              ["Andamento", "Itens marcados como feitos ou pagos. Marcações da mesma etapa, no mesmo dia e pela mesma pessoa viram um cartão só (“5 itens de Elétrica marcados como feitos”), com os nomes em etiquetas."],
              ["Prazo", "O prazo original e cada nova previsão, com o motivo."],
              ["Visitas", "Agendadas, realizadas e canceladas."],
              ["Ocorrências", "Quando abriram e quando foram resolvidas."],
              ["Vistoria", "Pontos conferidos e pontos que pedem ajuste."],
            ]}
          />
          <P>
            Quando quem fez foi o cliente, o cartão leva a etiqueta <strong>cliente</strong> e as iniciais em azul. Os botões de filtro (<Btn>Tudo</Btn>, <Btn>Avisos</Btn>, <Btn>Andamento</Btn>, <Btn>Prazo</Btn>, <Btn>Visitas</Btn>, <Btn>Ocorrências</Btn>, <Btn>Vistoria</Btn>) mostram um tipo só, e <Btn>Ver mais</Btn> abre os mais antigos.
          </P>
          <H3>Resumo da semana</H3>
          <P>
            O botão <Btn>Enviar resumo da semana</Btn> (do arquiteto) monta uma mensagem com o que aconteceu nos últimos 7 dias, até 10 itens, pronta para encaminhar. Sem novidades, a mensagem diz isso.
          </P>
        </>
      ),
    },
    {
      id: "visitas",
      titulo: "Visitas e reuniões",
      papel: "todos",
      corpo: (
        <>
          <Passos>
            <Passo>Em <Btn>Visitas</Btn>, toque em <Btn>Nova visita</Btn> (só o arquiteto).</Passo>
            <Passo>Preencha o <Btn>Título</Btn>, a <Btn>Data</Btn> e a <Btn>Hora</Btn> (obrigatórios) e, se quiser, <Btn>Local</Btn>, <Btn>Quem participa</Btn> e <Btn>Pauta</Btn>.</Passo>
            <Passo>Toque em <Btn>Salvar visita</Btn>. Ela aparece em “Próximas”.</Passo>
            <Passo>Toque em <Btn>Enviar convite</Btn> para avisar o cliente pelo WhatsApp, com data, local e pauta.</Passo>
            <Passo>Depois da visita, edite-a (lápis), mude a <Btn>Situação</Btn> para Realizada e escreva a <Btn>Ata: o que ficou combinado</Btn>. Toque em <Btn>Enviar ata</Btn> para mandar o combinado ao cliente.</Passo>
          </Passos>
          <Lista>
            <li>As próximas ficam em ordem de data; as realizadas e canceladas vão para “Anteriores”.</li>
            <li>A lixeira remove a visita, com confirmação.</li>
          </Lista>
        </>
      ),
    },
    {
      id: "ocorrencias",
      titulo: "Ocorrências",
      papel: "todos",
      corpo: (
        <>
          <Passos>
            <Passo>Em <Btn>Ocorrências</Btn>, toque em <Btn>Nova ocorrência</Btn> (só o arquiteto).</Passo>
            <Passo>Escreva <Btn>O que aconteceu</Btn>, escolha a <Btn>Gravidade</Btn> (baixa, média ou alta), a <Btn>Situação</Btn> (aberta, em andamento ou resolvida) e, se quiser, os detalhes e o <Btn>Responsável</Btn>.</Passo>
            <Passo>Toque em <Btn>Avisar o cliente</Btn> para mandar o aviso pelo WhatsApp.</Passo>
            <Passo>Quando resolver, toque em <Btn>Marcar como resolvida</Btn>, escreva <Btn>Como foi resolvido</Btn> e salve. A data da resolução fica registrada.</Passo>
          </Passos>
          <P>As abertas ficam em cima, as de gravidade alta primeiro; as resolvidas ficam abaixo, em “Resolvidas”, com a explicação em destaque verde. Reabrir uma ocorrência (mudar a situação para aberta) apaga a data e a explicação da resolução.</P>
        </>
      ),
    },
    {
      id: "vistoria",
      titulo: "Vistoria final",
      papel: "todos",
      corpo: (
        <>
          <P>É a lista de pontos para conferir antes de entregar a obra (“Porta da suíte fechando bem”, “Torneiras sem vazamento”). No topo aparece “N de M conferidos”, a barra de avanço e, se houver, quantos pontos pedem ajuste.</P>
          <H3>Montar a lista (arquiteto e cliente)</H3>
          <Lista>
            <li>Escreva o ponto em <Btn>Ponto a conferir</Btn>, escolha o <Btn>Ambiente</Btn> e toque em <Btn>Adicionar</Btn> (Enter também adiciona). O cliente também faz isso: os pontos que ele cria aparecem com “Adicionado por … (cliente)”.</li>
            <li>Só o arquiteto tem o botão <Btn>Usar o modelo de vistoria (pontos comuns de obra)</Btn>: entram 12 pontos comuns (pintura, tomadas, portas, banheiros, cozinha, limpeza final, garantias…), sem repetir os que já existem.</li>
            <li>A lixeira remove um ponto. O arquiteto remove qualquer um; o cliente só remove os que ele mesmo criou.</li>
          </Lista>
          <H3>Conferir (arquiteto e cliente)</H3>
          <P>
            Cada ponto tem os botões <Btn>OK</Btn> e <Btn>Ajustar</Btn>. Tocar de novo no botão ativo volta o ponto para pendente. Em “Ajustar” aparece um campo para escrever o que precisa ser ajustado (grava ao sair do campo). Embaixo de cada ponto conferido aparece quem conferiu e quando (“Conferido por Marina (cliente) em 20/11/2026”).
          </P>
          <H3>Enviar a vistoria por WhatsApp</H3>
          <P>
            O arquiteto toca em <Btn>Enviar ao cliente</Btn>; o cliente toca em <Btn>Enviar ao arquiteto</Btn>. Em qualquer dos dois a mensagem traz quantos pontos estão conferidos, quais pedem ajuste (com a observação) e quantos faltam. Na janela, quem envia pode editar o texto e informar o WhatsApp de quem recebe: o do cliente fica guardado no projeto, e o do arquiteto fica guardado no aparelho do cliente.
          </P>
          <Aviso tipo="nota" titulo="O que o cliente pode e não pode">
            O cliente adiciona pontos, remove os que criou, marca OK ou Ajustar em qualquer ponto e escreve observações. Não edita o texto dos pontos que o arquiteto criou nem remove os dele.
          </Aviso>
        </>
      ),
    },
    {
      id: "onde-ficam",
      titulo: "Onde ficam os dados",
      papel: "todos",
      corpo: (
        <P>
          Visitas, ocorrências e pontos da vistoria ficam dentro do projeto, e arquiteto e cliente veem as mudanças ao vivo. No modo demo ficam no navegador. A linha do tempo não guarda nada à parte: ela é montada na hora a partir do que já existe. Veja também <Ir para="relatorio-mensal">Relatório mensal</Ir>, que resume o mês em PDF.
        </P>
      ),
    },
  ],
};
