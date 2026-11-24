import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "../components/Logo";
import { CANCELAMENTO_DIAS, EMPRESA, TERMOS_ATUALIZADOS_EM } from "@/lib/empresa";
import { PLANOS, TESTE_DIAS } from "@/lib/planos";

export const metadata: Metadata = {
  title: "Termos de uso — Pitangueira",
  description: "As regras de uso da Pitangueira: planos, pagamento, cancelamento com reembolso em 7 dias, dados e responsabilidades.",
};

function Secao({ n, titulo, children }: { n: number; titulo: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`t${n}`} className="mt-9">
      <h2 id={`t${n}`} className="text-xl font-semibold text-ink">
        {n}. {titulo}
      </h2>
      <div className="mt-2 space-y-3 text-[15px] leading-relaxed text-ink/80">{children}</div>
    </section>
  );
}

const Lista = ({ children }: { children: ReactNode }) => <ul className="list-disc space-y-1.5 pl-5 marker:text-ink/30">{children}</ul>;

export default function TermosPage() {
  const { broto, safra, pomar } = PLANOS;
  const contato = EMPRESA.email ? <a className="font-semibold text-pitanga underline" href={`mailto:${EMPRESA.email}`}>{EMPRESA.email}</a> : "os canais de atendimento indicados no próprio aplicativo";
  return (
    <div className="grade min-h-dvh">
      <header className="border-b border-linha bg-papel/85">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" aria-label="Voltar ao início">
            <Logo />
          </Link>
          <nav aria-label="Páginas" className="flex items-center gap-5 text-sm font-medium text-ink/70">
            <Link href="/planos" className="hover:text-ink">Planos</Link>
            <Link href="/docs" className="hover:text-ink">Documentação</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-20 pt-10">
        <p className="rotulo-tec text-pitanga">Termos de uso</p>
        <h1 className="mt-2 text-balance text-4xl font-semibold leading-tight tracking-tight text-ink">Termos de uso da Pitangueira</h1>
        <p className="mt-2 text-sm text-ink/55">Última atualização: {TERMOS_ATUALIZADOS_EM}</p>
        <p className="mt-5 text-[15px] leading-relaxed text-ink/80">
          Estes termos explicam como a Pitangueira funciona, o que cada plano inclui, como é o pagamento e como cancelar. Ao criar uma conta ou usar o aplicativo, você concorda com eles. Se algo não ficar claro, fale com a gente por {contato}.
        </p>

        <Secao n={1} titulo="Quem somos e o que oferecemos">
          <p>
            A {EMPRESA.nome}
            {EMPRESA.razaoSocial ? ` (${EMPRESA.razaoSocial}${EMPRESA.cnpj ? `, CNPJ ${EMPRESA.cnpj}` : EMPRESA.cpf ? `, CPF ${EMPRESA.cpf}` : ""})` : ""} oferece um aplicativo online para profissionais da construção (arquitetos, engenheiros, mestres de obra e equipes) organizarem orçamento, andamento, cobranças e a comunicação com seus clientes. Chamamos de <strong>profissional</strong> quem cria a conta e os projetos, e de <strong>cliente</strong> a pessoa que o profissional convida, por link e código, para acompanhar um projeto.
          </p>
          <p>O serviço é um software por assinatura, entregue pela internet. Não somos parte do contrato entre o profissional e o cliente dele.</p>
        </Secao>

        <Secao n={2} titulo="Conta e cadastro">
          <Lista>
            <li>Você deve ter 18 anos ou mais e informar dados verdadeiros ao criar a conta.</li>
            <li>Você é responsável pela segurança do seu acesso (Google, e-mail e senha) e por tudo o que acontece na sua conta.</li>
            <li>Cada conta é de uma pessoa. Para compartilhar um projeto com o cliente, use o código do projeto: o cliente não precisa de conta.</li>
          </Lista>
        </Secao>

        <Secao n={3} titulo="Planos, limites e teste grátis">
          <p>Há três planos, descritos na página <Link className="font-semibold text-pitanga underline" href="/planos">Planos</Link>:</p>
          <Lista>
            <li><strong>{broto.nome}</strong>: até {broto.obrasAtivas} projetos em andamento, {broto.catalogoItens} itens no catálogo e {broto.fornecedores} fornecedores.</li>
            <li><strong>{safra.nome}</strong>: até {safra.obrasAtivas} projetos em andamento e os recursos completos de acompanhamento, relatórios, composições e financeiro dos honorários.</li>
            <li><strong>{pomar.nome}</strong>: projetos em andamento sem limite, financeiro completo e os recursos para equipes, conforme forem lançados.</li>
          </Lista>
          <p>
            <strong>Projeto em andamento</strong> é o que não está arquivado. Arquivar libera a vaga, e restaurar um projeto arquivado ocupa uma vaga. O acesso do cliente aos projetos não tem limite em nenhum plano.
          </p>
          <p>
            <strong>Teste grátis:</strong> toda conta nova tem {TESTE_DIAS} dias com os recursos do plano {safra.nome}, sem cobrança e sem cartão. Terminado o teste, a conta passa a valer como plano {broto.nome} até você assinar um plano.
          </p>
          <p>
            <strong>Limites:</strong> quando um limite é atingido, o aplicativo bloqueia a ação (por exemplo, criar um novo projeto) e explica o motivo e o que fazer. Nenhum dado é apagado por causa de limite, de troca de plano ou de cancelamento.
          </p>
          <p>Podemos criar, alterar ou encerrar planos no futuro, avisando com antecedência. Quem já tem assinatura paga mantém as condições contratadas até o fim do período já pago.</p>
        </Secao>

        <Secao n={4} titulo="Planos de cortesia">
          <p>
            Quem já usava a Pitangueira antes dos planos pode ter recebido um plano <strong>de cortesia</strong> sem cobrança. Ele vale por tempo indeterminado, mas <strong>pode ser alterado ou encerrado por nós</strong>, e avisaremos com antecedência antes de qualquer mudança. O aplicativo informa quando a sua conta está em cortesia.
          </p>
        </Secao>

        <Secao n={5} titulo="Pagamento, renovação e recibos">
          <Lista>
            <li>A assinatura é <strong>recorrente</strong> (mensal ou anual, conforme a escolha) e renova automaticamente até ser cancelada.</li>
            <li>Os pagamentos são processados pela Stripe, operadora de pagamentos. Não guardamos os dados completos do seu cartão.</li>
            <li>O preço e a periodicidade aparecem na página de planos antes da contratação. Reajustes são avisados com pelo menos 30 dias de antecedência e valem a partir da renovação seguinte.</li>
            <li>Cada pagamento gera um <strong>recibo</strong>, disponível em <em>Minha conta</em>, na seção de recibos. Por enquanto <strong>não emitimos nota fiscal</strong>; avisaremos quando passarmos a emitir.</li>
            <li>Se um pagamento falhar, tentamos cobrar de novo e avisamos você. Persistindo a falha após um prazo de carência, a conta volta ao plano {broto.nome} (sem apagar nada) até o pagamento ser regularizado.</li>
          </Lista>
        </Secao>

        <Secao n={6} titulo={`Cancelamento e reembolso em ${CANCELAMENTO_DIAS} dias`}>
          <Lista>
            <li>
              <strong>Arrependimento:</strong> você pode cancelar em até <strong>{CANCELAMENTO_DIAS} dias corridos</strong> depois de contratar (ou de contratar uma troca para um plano maior) e receber o <strong>reembolso integral</strong> do valor pago por esse período, como prevê o Código de Defesa do Consumidor para contratações feitas pela internet.
            </li>
            <li>Depois desse prazo, você pode cancelar a qualquer momento. O acesso continua até o fim do período já pago e a assinatura não renova. Não há reembolso proporcional do período em curso.</li>
            <li>Para cancelar, use o gerenciamento da assinatura em <em>Minha conta</em> ou fale conosco por {contato}.</li>
            <li>O reembolso é feito pelo mesmo meio de pagamento usado na contratação. O prazo para aparecer na fatura ou na conta depende da operadora do cartão ou do banco.</li>
          </Lista>
        </Secao>

        <Secao n={7} titulo="Seus dados e a privacidade">
          <Lista>
            <li>Os projetos, orçamentos e documentos que você cria são seus. Você pode apagá-los e pedir a exclusão da conta.</li>
            <li>Os dados de seus clientes que você coloca no aplicativo são de sua responsabilidade: você deve ter o direito de usá-los e compartilhar o código do projeto só com quem deve acompanhá-lo. Em relação a esses dados, tratamos as informações em nome do profissional, conforme a LGPD.</li>
            <li>Cada projeto é isolado: quem não é dono nem foi convidado por código não vê os dados dele. O cliente enxerga apenas o projeto para o qual recebeu o código.</li>
            <li>Medimos o uso do aplicativo de forma técnica e anônima (quais recursos são usados e erros), sem nomes, e-mails, valores em dinheiro nem conteúdo de projetos. Veja o detalhe na documentação, em Privacidade.</li>
          </Lista>
        </Secao>

        <Secao n={8} titulo="Uso adequado">
          <p>Você concorda em não usar a Pitangueira para fins ilegais, para tentar acessar dados de outras pessoas, para sobrecarregar ou atacar o serviço, nem para enviar conteúdo que viole direitos de terceiros. Podemos suspender contas que descumpram estas regras, avisando sempre que possível.</p>
        </Secao>

        <Secao n={9} titulo="Responsabilidades e limites">
          <Lista>
            <li>Os valores, quantidades, prazos e documentos produzidos no aplicativo são informados e conferidos por você. A Pitangueira é uma ferramenta de organização e <strong>não substitui a responsabilidade técnica</strong> do profissional (como ART e RRT) nem a conferência dos orçamentos.</li>
            <li>Trabalhamos para manter o serviço disponível e seguro, mas ele é oferecido no estado em que está, podendo haver interrupções para manutenção ou por falhas fora do nosso controle. Faça cópias dos documentos importantes (por exemplo, salvando os PDFs).</li>
            <li>Na medida permitida em lei, nossa responsabilidade se limita aos valores pagos por você nos 12 meses anteriores ao fato, sem prejuízo dos direitos que a lei garante ao consumidor.</li>
          </Lista>
        </Secao>

        <Secao n={10} titulo="Propriedade intelectual">
          <p>A marca Pitangueira, o aplicativo e seu código pertencem a nós. Você recebe o direito de usar o serviço enquanto tiver conta ativa, sem poder copiá-lo, revendê-lo ou criar produto derivado dele. O conteúdo que você cria continua sendo seu.</p>
        </Secao>

        <Secao n={11} titulo="Mudanças nestes termos">
          <p>Podemos atualizar estes termos. Mudanças relevantes são avisadas no aplicativo ou por e-mail com antecedência, e a data de atualização no topo da página é sempre a mais recente. Continuar usando o serviço depois do aviso significa que você aceita a nova versão.</p>
        </Secao>

        <Secao n={12} titulo="Lei aplicável e foro">
          <p>
            Estes termos seguem as leis do Brasil. {EMPRESA.foro ? `Fica eleito o foro de ${EMPRESA.foro}, ` : "Fica eleito o foro indicado no contrato, "}ressalvado o direito do consumidor de propor ação no foro do seu próprio domicílio.
          </p>
        </Secao>

        <p className="mt-12 flex flex-wrap gap-x-5 gap-y-1 border-t border-linha pt-6 text-sm">
          <Link href="/planos" className="font-semibold text-pitanga hover:underline">Ver os planos</Link>
          <Link href="/docs" className="text-ink/60 hover:text-ink">Documentação</Link>
          <Link href="/" className="text-ink/60 hover:text-ink">Início</Link>
        </p>
      </main>
    </div>
  );
}
