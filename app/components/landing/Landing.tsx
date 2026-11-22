import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { classeBotao } from "../ui/Botao";
import { Logo, LogoMark } from "../Logo";
import { LoginScreen } from "../LoginScreen";

/* ───────────── pequenos blocos ───────────── */

const Rotulo = ({ children, claro = false }: { children: ReactNode; claro?: boolean }) => (
  <p className={`rotulo-tec ${claro ? "text-white/70" : "text-pitanga"}`}>{children}</p>
);

const Titulo = ({ children, claro = false }: { children: ReactNode; claro?: boolean }) => (
  <h2 className={`mt-3 text-balance text-3xl font-semibold leading-[1.1] tracking-tight sm:text-4xl ${claro ? "text-white" : "text-ink"}`}>{children}</h2>
);

/** Print do sistema numa moldura de navegador. */
function Tela({ src, alt, largura = 1200, altura = 780, className = "" }: { src: string; alt: string; largura?: number; altura?: number; className?: string }) {
  return (
    <figure className={`overflow-hidden rounded-[20px] border border-linha bg-white shadow-[0_30px_60px_-30px_rgba(20,17,15,0.45)] ${className}`}>
      <div className="flex items-center gap-1.5 border-b border-linha bg-papel px-4 py-3" aria-hidden>
        <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
        <span className="h-2.5 w-2.5 rounded-full bg-ink/15" />
      </div>
      <Image src={src} alt={alt} width={largura} height={altura} unoptimized loading="lazy" className="block h-auto w-full" />
    </figure>
  );
}

const IC = {
  planilha: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 4v16" /></>,
  zap: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  wpp: <path d="M4 20l1.4-4.2A8 8 0 1 1 8.4 18.7L4 20Z" />,
  pdf: <><path d="M6 3h8l5 5v13H6V3Z" /><path d="M14 3v5h5M9 14h6M9 17h4" /></>,
  grana: <><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5C9.5 8.4 10.6 8 12 8s2.5.6 2.5 1.7c0 2.6-5 1.4-5 4 0 1.1 1.1 1.8 2.5 1.8s2.5-.5 2.5-1.6" /></>,
  camada: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 13 9 5 9-5" /></>,
  gente: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /><path d="M16 5.5a3 3 0 0 1 0 5.8M18 14.8c1.8.7 3 2.4 3 5.2" /></>,
  check: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="m8.5 12.5 2.5 2.5 4.5-5" /></>,
  cal: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  alerta: <><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4M12 17h.01" /></>,
  olho: <><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  fone: <><rect x="7" y="2" width="10" height="20" rx="2.5" /><path d="M11 18h2" /></>,
  grafico: <><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" /></>,
  chave: <><circle cx="8" cy="15" r="4" /><path d="m11 12 9-9M16 7l3 3" /></>,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  ok: <path d="m5 12.5 4.5 4.5L19 7" />,
};

const Icone = ({ nome, className = "h-5 w-5" }: { nome: keyof typeof IC; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    {IC[nome]}
  </svg>
);

const Selo = ({ nome }: { nome: keyof typeof IC }) => (
  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-pitanga/10 text-pitanga-escuro">
    <Icone nome={nome} />
  </span>
);

const IR_PARA_ENTRAR = "#entrar";

/* ───────────── conteúdo ───────────── */

const DORES: { icone: keyof typeof IC; titulo: string; texto: string }[] = [
  { icone: "planilha", titulo: "Planilha que ninguém atualiza", texto: "Uma versão no notebook, outra no celular, outra no e-mail. Na hora de fechar o mês, ninguém sabe qual é a certa." },
  { icone: "wpp", titulo: "Obra espalhada no WhatsApp", texto: "Foto num grupo, valor em outro, aprovação perdida lá em cima na conversa. Achar depois é garimpo." },
  { icone: "grana", titulo: "“Quanto já gastei?” sem resposta", texto: "O cliente pergunta e você abre três arquivos para responder. Cobrar e provar o que foi feito vira desgaste." },
];

const VITRINES: { rotulo: string; titulo: string; texto: string; pontos: string[]; src: string; alt: string; altura?: number }[] = [
  {
    rotulo: "Orçamento vivo",
    titulo: "O orçamento deixa de ser um arquivo e vira o controle da obra",
    texto: "Cada serviço tem quantidade, valor, fornecedor e prazo. Marque o que foi feito e o que foi pago, e o total, o saldo e o avanço de cada etapa se atualizam sozinhos.",
    pontos: ["Teto de orçamento com a folga sempre à vista", "Cole a planilha que você já tem e comece em minutos", "Aviso claro quando um valor sobe ou desce"],
    src: "/landing/itens.jpg",
    alt: "Tela de itens do orçamento, com total, teto e etapas da obra",
  },
  {
    rotulo: "Andamento por etapa",
    titulo: "Veja a obra inteira em uma tela, sem montar relatório",
    texto: "O resumo mostra o que está em andamento, o que já foi executado e o que já foi pago, etapa por etapa. Em segundos você sabe onde agir.",
    pontos: ["Executado × pago, lado a lado", "Itens “feito, falta pagar” destacados", "Prazo do projeto com previsão e histórico"],
    src: "/landing/resumo.jpg",
    alt: "Resumo do projeto com o progresso de cada etapa",
  },
  {
    rotulo: "Linha do tempo",
    titulo: "Um feed da obra que o cliente acompanha como se fosse uma rede social",
    texto: "Publique uma novidade, marque uma visita, registre uma ocorrência, faça a vistoria final. Tudo vira uma linha do tempo, e o cliente também pode participar.",
    pontos: ["Visitas que o cliente pede e você aprova por link", "Ocorrências com status e histórico", "Mensagem estruturada, pronta para encaminhar no WhatsApp"],
    src: "/landing/acompanhar.jpg",
    alt: "Linha do tempo do projeto com publicações da arquiteta e do cliente",
  },
  {
    rotulo: "Financeiro do escritório",
    titulo: "Saiba o que entra, o que atrasou e o que vem pela frente",
    texto: "Cadastre seus honorários em parcelas e acompanhe o que há a receber, o que venceu e a previsão dos próximos meses. Cobrar o cliente fica a um toque.",
    pontos: ["Parcelas, vencimentos e baixa em um lugar", "Previsão de 90 dias e média mensal", "Cobrança por WhatsApp com a chave PIX"],
    src: "/landing/financeiro.jpg",
    alt: "Painel financeiro com valores a receber, vencidos e previsão",
  },
];

const RECURSOS: { icone: keyof typeof IC; titulo: string; texto: string }[] = [
  { icone: "pdf", titulo: "PDF com a sua marca", texto: "Orçamento, cobrança e relatório com logo, cores e registro profissional. Cara de escritório grande." },
  { icone: "wpp", titulo: "WhatsApp do jeito certo", texto: "Mensagens bem estruturadas, com o PDF anexo. Você revisa e envia. Nada sai sozinho." },
  { icone: "grana", titulo: "Cobrança da obra", texto: "Gere a cobrança com itens do orçamento e itens novos, envie e dê baixa quando o cliente pagar." },
  { icone: "cal", titulo: "Relatório mensal", texto: "O mês da obra resumido: o que foi feito, o que foi pago e o que vem a seguir." },
  { icone: "camada", titulo: "Catálogo e composições", texto: "Seus preços e serviços reutilizáveis, com BDI e margem. Orçar o próximo projeto fica muito mais rápido." },
  { icone: "gente", titulo: "Fornecedores", texto: "Prazo combinado × prazo cumprido e custo de cada um. Você escolhe com dado, não com palpite." },
  { icone: "check", titulo: "Vistoria final", texto: "Checklist de entrega que entra na linha do tempo e fecha a obra sem discussão." },
  { icone: "alerta", titulo: "Valores que mudam, com clareza", texto: "Quando um item sobe ou desce, o sistema mostra quanto e quando. Sem surpresa na hora de pagar." },
  { icone: "olho", titulo: "Modo discreto", texto: "O olhinho esconde todos os valores quando você mostra a tela para alguém." },
  { icone: "chave", titulo: "Acesso do cliente por código", texto: "Seu cliente entra com um código e um nome. Sem cadastro, sem senha, sem fricção." },
  { icone: "fone", titulo: "Pensado para o celular", texto: "Na obra, no carro, na visita. Tudo cabe na palma da mão e funciona bem em tela pequena." },
  { icone: "grafico", titulo: "Gráficos que explicam", texto: "Onde está o dinheiro, o que já foi executado e como o custo se distribui entre as etapas." },
];

const PUBLICO: { icone: keyof typeof IC; titulo: string; texto: string; itens: string[] }[] = [
  {
    icone: "camada",
    titulo: "Arquitetos",
    texto: "Da proposta à entrega, com o cliente acompanhando e você no controle do orçamento e do honorário.",
    itens: ["Orçamento com marca do escritório", "Visitas aprovadas por link", "Financeiro dos honorários"],
  },
  {
    icone: "grafico",
    titulo: "Engenheiros",
    texto: "Custo, prazo e execução num só lugar, com histórico de cada valor e de cada entrega de fornecedor.",
    itens: ["Executado × pago por etapa", "Composições com BDI e margem", "Previsões de prazo registradas"],
  },
  {
    icone: "check",
    titulo: "Mestres de obra",
    texto: "Marque o que ficou pronto direto do celular e mostre ao dono da obra, com data e nome de quem marcou.",
    itens: ["Marcar feito e pago em um toque", "Registro de ocorrências e visitas", "Cobrança clara do que foi feito"],
  },
];

const PASSOS = [
  { n: "1", titulo: "Crie o projeto", texto: "Dê um nome, defina o teto de orçamento e cole a planilha que você já usa, ou comece pelo seu catálogo." },
  { n: "2", titulo: "Toque a obra", texto: "Marque o que foi feito e pago, publique novidades e registre visitas e ocorrências ao longo do caminho." },
  { n: "3", titulo: "Compartilhe com o cliente", texto: "Mande o link e o código. Ele acompanha tudo, aprova o que precisa e recebe as cobranças em PDF." },
];

const COMPARA: { tema: string; antes: string; agora: string }[] = [
  { tema: "Orçamento", antes: "Arquivo solto, várias versões", agora: "Uma só versão, sempre atualizada" },
  { tema: "Andamento", antes: "Cada um conta de um jeito", agora: "Etapas com executado e pago, em tempo real" },
  { tema: "Cliente", antes: "Pergunta no WhatsApp o tempo todo", agora: "Acompanha sozinho pela linha do tempo" },
  { tema: "Cobrança", antes: "Mensagem improvisada", agora: "PDF profissional com PIX e itens" },
  { tema: "Histórico", antes: "Perdido no papel e nas conversas", agora: "Tudo registrado, com data e autor" },
];

const PERGUNTAS: { p: string; r: string }[] = [
  { p: "Preciso saber usar programa complicado?", r: "Não. Se você usa planilha, aprende em uma tarde. Dá para colar a planilha que já tem e começar a partir dela." },
  { p: "Meu cliente precisa criar conta?", r: "Não. Ele entra com o código do projeto e o próprio nome. As ações dele ficam identificadas na linha do tempo." },
  { p: "As mensagens saem sozinhas pelo WhatsApp?", r: "Nunca. O sistema monta a mensagem e abre o WhatsApp com o texto pronto. Você revisa e aperta enviar." },
  { p: "Funciona no celular?", r: "Sim. O sistema foi pensado para tela pequena, para usar na obra, na visita e no carro." },
  { p: "Meus dados e os do meu cliente ficam seguros?", r: "Cada projeto é isolado. Só você e as pessoas que você autoriza acessam os dados dele, e o cliente enxerga apenas o projeto dele." },
  { p: "Serve para obra pequena?", r: "Foi feito justamente para quem toca reformas e obras de pequeno e médio porte, sem ter de contratar um sistema pesado de construtora." },
];

/* ───────────── página ───────────── */

/**
 * A página inicial de quem ainda não entrou: o que é a Pitangueira, para quem serve e por que vale a pena.
 * O login fica no final (e o botão "Começar agora" leva até ele).
 */
export function Landing() {
  return (
    <div className="grade scroll-smooth text-ink">
      {/* Topo */}
      <header className="sticky top-0 z-30 border-b border-linha bg-papel/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Logo />
          <nav aria-label="Seções" className="hidden items-center gap-6 text-sm font-medium text-ink/70 md:flex">
            <a href="#recursos" className="hover:text-ink">Recursos</a>
            <a href="#para-quem" className="hover:text-ink">Para quem</a>
            <a href="#como-funciona" className="hover:text-ink">Como funciona</a>
            <a href="#perguntas" className="hover:text-ink">Dúvidas</a>
          </nav>
          <div className="flex items-center gap-2">
            <a href={IR_PARA_ENTRAR} className="hidden px-3 py-2 text-sm font-semibold text-ink/80 hover:text-ink sm:block">Já tenho conta</a>
            <a href={IR_PARA_ENTRAR} className={classeBotao("primario", "pequeno")}>Começar agora</a>
          </div>
        </div>
      </header>

      <main>
        {/* Herói */}
        <section className="relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-12 lg:grid-cols-[1.05fr_1fr] lg:pb-24 lg:pt-20">
            <div>
              <Rotulo>Gestão de obras para quem constrói e projeta</Rotulo>
              <h1 className="mt-4 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-[56px]">
                Largue a planilha e o papel. Tenha um escritório de obras <span className="text-pitanga">profissional</span>.
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-ink/70">
                Orçamento, andamento, cobranças e conversa com o cliente num só lugar. Feito para arquitetos, engenheiros e mestres de obra que querem passar mais confiança e perder menos tempo.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a href={IR_PARA_ENTRAR} className={classeBotao("primario", "grande")}>Começar agora</a>
                <a href="#recursos" className={classeBotao("linha", "grande")}>Ver o que tem dentro</a>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ink/65">
                <li className="flex items-center gap-2"><Icone nome="ok" className="h-4 w-4 text-pitanga" /> Preço que cabe no pequeno escritório</li>
                <li className="flex items-center gap-2"><Icone nome="ok" className="h-4 w-4 text-pitanga" /> Cliente entra só com um código</li>
                <li className="flex items-center gap-2"><Icone nome="ok" className="h-4 w-4 text-pitanga" /> Funciona no celular</li>
              </ul>
            </div>
            <div className="relative">
              <Tela src="/landing/painel.jpg" alt="Painel do arquiteto com atalhos, projetos em andamento e progresso geral" altura={700} className="lg:rotate-[1.2deg]" />
              <div className="absolute -bottom-5 left-4 hidden rounded-2xl border border-linha bg-white px-4 py-3 shadow-lg sm:block">
                <p className="rotulo-tec text-ink/50">Residência Alves</p>
                <p className="mt-0.5 text-sm font-semibold">Faltam 80 dias · no prazo</p>
              </div>
            </div>
          </div>
        </section>

        {/* Dor */}
        <section className="border-y border-linha bg-white/70">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
            <div className="max-w-2xl">
              <Rotulo>O problema</Rotulo>
              <Titulo>A obra é séria. O controle não precisa ser improvisado.</Titulo>
              <p className="mt-4 text-lg leading-relaxed text-ink/70">Planilhas, cadernos e grupos de WhatsApp funcionam até o dia em que a obra cresce. Aí começam os retrabalhos, as dúvidas e as cobranças difíceis.</p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {DORES.map((d) => (
                <article key={d.titulo} className="prancha p-6">
                  <Selo nome={d.icone} />
                  <h3 className="mt-4 text-lg font-semibold leading-snug">{d.titulo}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink/65">{d.texto}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Vitrines */}
        <section aria-label="O sistema por dentro" className="mx-auto max-w-6xl space-y-20 px-4 py-16 sm:space-y-28 sm:py-24">
          <div className="max-w-2xl">
            <Rotulo>A solução</Rotulo>
            <Titulo>Tudo o que a obra precisa, com a cara de um sistema grande</Titulo>
          </div>
          {VITRINES.map((v, i) => (
            <div key={v.titulo} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <Rotulo>{v.rotulo}</Rotulo>
                <h3 className="mt-3 text-balance text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{v.titulo}</h3>
                <p className="mt-4 text-[17px] leading-relaxed text-ink/70">{v.texto}</p>
                <ul className="mt-5 space-y-2.5">
                  {v.pontos.map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-[15px] text-ink/80">
                      <Icone nome="ok" className="mt-0.5 h-4 w-4 shrink-0 text-pitanga" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <Tela src={v.src} alt={v.alt} altura={v.altura} className={i % 2 === 1 ? "lg:order-1" : ""} />
            </div>
          ))}
        </section>

        {/* Recursos */}
        <section id="recursos" className="scroll-mt-20 bg-ink text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
            <div className="max-w-2xl">
              <Rotulo claro>Recursos</Rotulo>
              <Titulo claro>Um espaço de trabalho completo, do orçamento à entrega</Titulo>
              <p className="mt-4 text-lg leading-relaxed text-white/65">Não é um monte de ferramentas soltas. Cada parte conversa com as outras: o que você marca na obra aparece no orçamento, na cobrança e na linha do tempo.</p>
            </div>
            <div className="mt-12 grid gap-px overflow-hidden rounded-[20px] border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
              {RECURSOS.map((r) => (
                <article key={r.titulo} className="bg-ink p-6">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
                    <Icone nome={r.icone} />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">{r.titulo}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/60">{r.texto}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Para quem */}
        <section id="para-quem" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:py-24">
          <div className="max-w-2xl">
            <Rotulo>Para quem</Rotulo>
            <Titulo>Feito para quem toca obra de verdade</Titulo>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PUBLICO.map((p) => (
              <article key={p.titulo} className="prancha flex flex-col p-6">
                <Selo nome={p.icone} />
                <h3 className="mt-4 text-xl font-semibold">{p.titulo}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink/65">{p.texto}</p>
                <ul className="mt-4 space-y-2 border-t border-linha pt-4">
                  {p.itens.map((i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink/80">
                      <Icone nome="ok" className="mt-0.5 h-4 w-4 shrink-0 text-pitanga" />
                      {i}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        {/* Antes × agora */}
        <section className="border-y border-linha bg-white/70">
          <div className="mx-auto max-w-4xl px-4 py-16 sm:py-24">
            <div className="text-center">
              <Rotulo>A virada</Rotulo>
              <Titulo>Planilha e papel × Pitangueira</Titulo>
            </div>
            <div className="prancha mt-10 overflow-hidden">
              <div className="hidden grid-cols-[0.8fr_1fr_1fr] border-b border-linha bg-papel px-5 py-3 sm:grid">
                <span />
                <span className="rotulo-tec text-ink/50">Hoje, na planilha</span>
                <span className="rotulo-tec text-pitanga">Com a Pitangueira</span>
              </div>
              <ul className="divide-y divide-linha">
                {COMPARA.map((c) => (
                  <li key={c.tema} className="grid gap-1.5 px-5 py-4 sm:grid-cols-[0.8fr_1fr_1fr] sm:items-center sm:gap-3">
                    <span className="font-semibold">{c.tema}</span>
                    <span className="flex items-start gap-2 text-[15px] text-ink/55">
                      <Icone nome="x" className="mt-0.5 h-4 w-4 shrink-0 text-ink/35" /> {c.antes}
                    </span>
                    <span className="flex items-start gap-2 text-[15px] font-medium text-ink">
                      <Icone nome="ok" className="mt-0.5 h-4 w-4 shrink-0 text-pitanga" /> {c.agora}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Como funciona */}
        <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:py-24">
          <div className="max-w-2xl">
            <Rotulo>Como funciona</Rotulo>
            <Titulo>Em três passos você está rodando</Titulo>
          </div>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {PASSOS.map((p) => (
              <li key={p.n} className="prancha p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pitanga font-mono text-sm font-semibold text-white">{p.n}</span>
                <h3 className="mt-4 text-lg font-semibold">{p.titulo}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink/65">{p.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Perguntas */}
        <section id="perguntas" className="scroll-mt-20 border-t border-linha bg-white/70">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:py-24">
            <div className="text-center">
              <Rotulo>Dúvidas</Rotulo>
              <Titulo>Perguntas frequentes</Titulo>
            </div>
            <div className="mt-10 space-y-3">
              {PERGUNTAS.map((q) => (
                <details key={q.p} className="prancha group p-5 open:shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold marker:hidden [&::-webkit-details-marker]:hidden">
                    {q.p}
                    <span className="text-xl font-light text-pitanga transition group-open:rotate-45" aria-hidden>+</span>
                  </summary>
                  <p className="mt-3 text-[15px] leading-relaxed text-ink/70">{q.r}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Chamada final com o login */}
        <section id="entrar" className="scroll-mt-16 bg-pitanga text-white">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:py-24 lg:grid-cols-[1fr_auto]">
            <div className="max-w-xl">
              <LogoMark claro size={56} />
              <h2 className="mt-6 text-balance text-3xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">Dê à sua obra o controle que ela merece.</h2>
              <p className="mt-4 text-lg leading-relaxed text-white/85">Crie sua conta, monte o primeiro projeto e mostre ao seu cliente um jeito mais profissional de acompanhar a obra.</p>
              <p className="mt-6 text-sm text-white/75">
                É cliente e recebeu um código? Abra o link do projeto que seu arquiteto enviou.{" "}
                <Link href="/docs" className="font-semibold underline underline-offset-2">Veja como funciona</Link>
              </p>
            </div>
            <LoginScreen embutido />
          </div>
        </section>
      </main>

      <footer className="border-t border-linha bg-papel">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-ink/60">
          <Logo />
          <nav aria-label="Rodapé" className="flex flex-wrap items-center gap-5">
            <Link href="/docs" className="hover:text-ink">Documentação</Link>
            <a href="#recursos" className="hover:text-ink">Recursos</a>
            <a href="#perguntas" className="hover:text-ink">Dúvidas</a>
          </nav>
          <p>Pitangueira · gestão de projetos e obras</p>
        </div>
      </footer>
    </div>
  );
}
