import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "../components/Logo";
import { classeBotao } from "../components/ui/Botao";
import { ORDEM_PLANOS, PLANOS, TESTE_DIAS } from "@/lib/planos";
import { emReais, PRECO_MENSAL, precoAnualPorMes, temPreco } from "@/lib/precos";

export const metadata: Metadata = {
  title: "Largue a planilha da obra — Pitangueira",
  description: "Orçamento, andamento e cobrança num só lugar — e o cliente acompanha a obra por um código. Teste grátis por 5 dias.",
};

/** Landing enxuta para tráfego pago: uma promessa, prova rápida, preços e um único caminho — começar o teste. */
const PROVAS: { titulo: string; texto: string }[] = [
  { titulo: "Orçamento vivo", texto: "Cada serviço com valor, fornecedor e prazo. Marque o que foi feito e pago; total, saldo e avanço se atualizam sozinhos." },
  { titulo: "O cliente acompanha sozinho", texto: "Ele entra com um código, sem cadastro, e vê a obra numa linha do tempo. Menos “e aí, como está?”." },
  { titulo: "Cobrança e dinheiro em dia", texto: "Cobrança em PDF com a sua marca, PIX e vencimento. Honorários em parcelas, com o que há a receber." },
];

const PASSOS: { n: string; titulo: string; texto: string }[] = [
  { n: "1", titulo: "Crie o projeto", texto: "Defina o teto e cole a planilha que você já usa, ou comece pelo catálogo." },
  { n: "2", titulo: "Toque a obra", texto: "Marque feito e pago, publique novidades e registre visitas e ocorrências." },
  { n: "3", titulo: "Compartilhe", texto: "Mande o link e o código. O cliente acompanha e recebe as cobranças em PDF." },
];

const Marca = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="m5 12.5 4.5 4.5L19 7" />
  </svg>
);

export default function CampanhaPage() {
  return (
    <div className="grade min-h-dvh text-ink">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Logo />
        <Link href="/planos" className={classeBotao("primario", "pequeno")}>Testar grátis</Link>
      </header>

      <section className="bg-pitanga text-white">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 pb-14 pt-10 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p className="rotulo-tec text-white/80">Gestão de obras</p>
            <h1 className="mt-3 text-balance text-[34px] font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              Largue a planilha. Tenha um escritório de obras profissional.
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-white/90">
              Orçamento, andamento, cobranças e a conversa com o cliente num só lugar. E o seu cliente acompanha a obra por um código, sem cadastro.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/planos" className={classeBotao("solido", "grande", "w-full bg-white text-pitanga hover:bg-white sm:w-auto")}>
                Começar grátis — {TESTE_DIAS} dias
              </Link>
              <span className="text-sm text-white/80">Cancele quando quiser · sem compromisso</span>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-white/85">
              <li className="flex items-center gap-2"><Marca /> Feito para arquitetos, engenheiros e mestres de obra</li>
              <li className="flex items-center gap-2"><Marca /> Funciona no celular</li>
            </ul>
          </div>
          <figure className="overflow-hidden rounded-[20px] border border-white/20 bg-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.5)]">
            <img src="/landing/painel.jpg" alt="Painel do arquiteto com os projetos em andamento e o progresso geral" width={1200} height={780} className="block h-auto w-full" />
          </figure>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {PROVAS.map((p) => (
            <article key={p.titulo} className="prancha p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pitanga/10 text-pitanga-escuro">
                <Marca className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-lg font-semibold">{p.titulo}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-ink/70">{p.texto}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-linha bg-white/70">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <p className="rotulo-tec text-pitanga">Como funciona</p>
          <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">Em três passos você está rodando</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-3">
            {PASSOS.map((p) => (
              <li key={p.n} className="prancha p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pitanga font-mono text-sm font-semibold text-white">{p.n}</span>
                <h3 className="mt-4 text-lg font-semibold">{p.titulo}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ink/65">{p.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div className="max-w-2xl">
          <p className="rotulo-tec text-pitanga">Planos</p>
          <h2 className="mt-2 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">Comece com {TESTE_DIAS} dias grátis</h2>
          <p className="mt-3 text-ink/70">A cobrança só começa depois do teste e você cancela quando quiser.</p>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {ORDEM_PLANOS.map((id) => {
            const p = PLANOS[id];
            return (
              <article key={id} className={`prancha flex flex-col p-6 ${p.destaque ? "border-2 border-pitanga" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xl font-semibold">{p.nome}</h3>
                  {p.destaque && <span className="rounded-full bg-pitanga px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-white">Mais escolhido</span>}
                </div>
                <p className="mt-1 text-sm text-ink/60">{p.frase}</p>
                {temPreco(id) ? (
                  <p className="mt-4 text-3xl font-semibold">
                    {emReais(PRECO_MENSAL[id])}<span className="text-base font-normal text-ink/55">/mês</span>
                  </p>
                ) : (
                  <p className="mt-4 text-sm text-ink/50">Valor em breve</p>
                )}
                {temPreco(id) && <p className="mt-0.5 text-xs text-ink/50">ou {emReais(precoAnualPorMes(id))}/mês no plano anual</p>}
                <Link href="/planos" className={classeBotao(p.destaque ? "primario" : "linha", "medio", "mt-5 w-full")}>
                  Testar grátis
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:py-20">
          <h2 className="mx-auto max-w-2xl text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
            Dê à sua obra o controle que ela merece.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">Monte o primeiro projeto hoje e mostre ao seu cliente um jeito mais profissional de acompanhar a obra.</p>
          <Link href="/planos" className={classeBotao("primario", "grande", "mt-7 inline-flex")}>Começar grátis — {TESTE_DIAS} dias</Link>
        </div>
      </section>

      <footer className="border-t border-linha bg-papel">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-ink/60">
          <Logo />
          <nav aria-label="Rodapé" className="flex flex-wrap items-center gap-5">
            <Link href="/planos" className="hover:text-ink">Planos</Link>
            <Link href="/docs" className="hover:text-ink">Documentação</Link>
            <Link href="/termos" className="hover:text-ink">Termos de uso</Link>
          </nav>
          <p>Pitangueira · gestão de projetos e obras</p>
        </div>
      </footer>
    </div>
  );
}
