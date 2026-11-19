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
              ["Linha do tempo", "Tudo o que aconteceu, do mais recente ao mais antigo.", "Automática (ninguém digita nela)"],
              ["Visitas", "Visitas técnicas e reuniões, com pauta antes e ata depois.", "Arquiteto cria; cliente vê"],
              ["Ocorrências", "Problemas e imprevistos, com responsável e como foram resolvidos.", "Arquiteto cria; cliente vê"],
              ["Vistoria", "A lista do que conferir antes de entregar a obra.", "Arquiteto monta; arquiteto e cliente conferem"],
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
            Em quase tudo desta aba há um botão verde <Btn>Enviar ao cliente</Btn> (ou <Btn>Enviar convite</Btn>, <Btn>Enviar ata</Btn>, <Btn>Avisar o cliente</Btn>, <Btn>Enviar resumo da semana</Btn>). Ele <strong>não envia nada sozinho</strong>: monta a mensagem e abre o WhatsApp para você revisar e apertar enviar.
          </P>
          <Passos>
            <Passo>Toque no botão verde do item que você quer encaminhar.</Passo>
            <Passo>Na janela, leia a <Btn>Mensagem para o cliente</Btn>. Ela já vem pronta, com o link do projeto, e você pode editar o texto.</Passo>
            <Passo>Se quiser, preencha o <Btn>WhatsApp do cliente (opcional)</Btn>, com DDD. O número fica guardado no projeto e vem preenchido da próxima vez. Sem número, o WhatsApp abre para você escolher o contato.</Passo>
            <Passo>Toque em <Btn>Abrir no WhatsApp</Btn> e, no WhatsApp, aperte enviar.</Passo>
          </Passos>
          <Aviso tipo="dica">O cliente não vê esses botões. Ele recebe a mensagem como qualquer outra e, pelo link, abre o projeto direto na aba Acompanhar.</Aviso>
        </>
      ),
    },
    {
      id: "linha-do-tempo",
      titulo: "Linha do tempo",
      papel: "todos",
      corpo: (
        <>
          <P>Reúne, sozinha, tudo o que aconteceu no projeto:</P>
          <Lista>
            <li><strong>Andamento</strong>: itens marcados como feitos ou pagos. Marcações da mesma etapa, no mesmo dia e pela mesma pessoa viram uma linha só (“5 itens de Elétrica marcados como feitos”).</li>
            <li><strong>Prazo</strong>: o prazo original e cada nova previsão, com o motivo.</li>
            <li><strong>Visitas</strong>: agendadas, realizadas e canceladas.</li>
            <li><strong>Ocorrências</strong>: quando abriram e quando foram resolvidas.</li>
            <li><strong>Vistoria</strong>: pontos conferidos e pontos que pedem ajuste.</li>
          </Lista>
          <P>Cada linha mostra o tipo, quando aconteceu (“hoje 14:30”), quem fez e, se foi o cliente, a etiqueta <strong>cliente</strong>. Os botões de filtro (<Btn>Tudo</Btn>, <Btn>Andamento</Btn>, <Btn>Prazo</Btn>, <Btn>Visitas</Btn>, <Btn>Ocorrências</Btn>, <Btn>Vistoria</Btn>) mostram um tipo só, e <Btn>Ver mais</Btn> abre os mais antigos.</P>
          <H3>Resumo da semana</H3>
          <P>
            O botão <Btn>Enviar resumo da semana</Btn> (do arquiteto) monta uma mensagem com o que aconteceu nos últimos 7 dias, até 10 itens, pronta para encaminhar. Sem novidades, a mensagem diz isso. Cada fato de visita, ocorrência, prazo ou vistoria também tem o seu botão <Btn>Enviar</Btn>.
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
          <H3>Montar a lista (arquiteto)</H3>
          <Lista>
            <li>Escreva o ponto em <Btn>Ponto a conferir</Btn>, escolha o <Btn>Ambiente</Btn> e toque em <Btn>Adicionar</Btn> (Enter também adiciona).</li>
            <li>Ou toque em <Btn>Usar o modelo de vistoria (pontos comuns de obra)</Btn>: entram 12 pontos comuns (pintura, tomadas, portas, banheiros, cozinha, limpeza final, garantias…), sem repetir os que você já tem.</li>
            <li>A lixeira remove um ponto.</li>
          </Lista>
          <H3>Conferir (arquiteto e cliente)</H3>
          <P>
            Cada ponto tem os botões <Btn>OK</Btn> e <Btn>Ajustar</Btn>. Tocar de novo no botão ativo volta o ponto para pendente. Em “Ajustar” aparece um campo para escrever o que precisa ser ajustado (grava ao sair do campo). Embaixo de cada ponto conferido aparece quem conferiu e quando (“Conferido por Marina (cliente) em 20/11/2026”).
          </P>
          <P>O botão <Btn>Enviar ao cliente</Btn> manda um resumo: quantos pontos estão conferidos, quais pedem ajuste (com a observação) e quantos faltam.</P>
          <Aviso tipo="nota" titulo="O cliente também confere">
            O cliente só consegue mudar a situação (OK ou Ajustar) e a observação. Não cria nem remove pontos.
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
