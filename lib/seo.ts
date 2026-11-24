/**
 * Dados estruturados (JSON-LD / schema.org) e constantes de SEO do site.
 *
 * Só dados — nada de segredo, roda no servidor (layout e páginas). O endereço público do site fica em
 * NEXT_PUBLIC_SITE_URL (produção: https://www.pitangueira.app); sem a variável, cai no domínio de produção.
 * As perguntas do FAQPage vêm do MESMO arquivo que a landing mostra (app/components/landing/perguntas.ts),
 * para o que o Google lê bater com o que o visitante vê.
 */
import { ORDEM_PLANOS, PLANOS, TESTE_DIAS } from "./planos";
import { PRECO_MENSAL } from "./precos";
import { PERGUNTAS } from "../app/components/landing/perguntas";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.pitangueira.app").replace(/\/$/, "");
export const SITE_NOME = "Pitangueira";
export const SITE_DESCRICAO =
  "Software de gestão de obras para arquitetos, engenheiros e mestres de obra: orçamento, andamento, cobrança e o cliente acompanhando a obra por um código — tudo num só lugar.";

/** Perfis oficiais da marca (ajudam o Google a ligar o site às redes). */
export const REDES = ["https://www.instagram.com/pitangueiraapp/"];

const reais = (centavos: number) => (centavos / 100).toFixed(2);

/** Organização + site + produto: válidos no site inteiro. */
export function siteJsonLd(): object[] {
  const organizacao = {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organizacao`,
    name: SITE_NOME,
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    description: SITE_DESCRICAO,
    sameAs: REDES,
  };

  const site = {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#site`,
    url: SITE_URL,
    name: SITE_NOME,
    inLanguage: "pt-BR",
    publisher: { "@id": `${SITE_URL}/#organizacao` },
  };

  const produto = {
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/#app`,
    name: SITE_NOME,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, iOS, Android",
    inLanguage: "pt-BR",
    url: SITE_URL,
    description: SITE_DESCRICAO,
    publisher: { "@id": `${SITE_URL}/#organizacao` },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "BRL",
      lowPrice: reais(Math.min(...ORDEM_PLANOS.map((id) => PRECO_MENSAL[id]))),
      highPrice: reais(Math.max(...ORDEM_PLANOS.map((id) => PRECO_MENSAL[id]))),
      offerCount: ORDEM_PLANOS.length,
      offers: ORDEM_PLANOS.map((id) => ({
        "@type": "Offer",
        name: `Plano ${PLANOS[id].nome}`,
        price: reais(PRECO_MENSAL[id]),
        priceCurrency: "BRL",
        url: `${SITE_URL}/planos`,
      })),
    },
  };

  return [organizacao, site, produto];
}

/** FAQPage: só para a página que mostra as perguntas (a home). */
export function faqJsonLd(): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PERGUNTAS.map((q) => ({
      "@type": "Question",
      name: q.p,
      acceptedAnswer: { "@type": "Answer", text: q.r },
    })),
  };
}

/** Embrulha um ou mais nós schema.org num grafo único com @context. */
export function grafoJsonLd(nos: object[]): string {
  return JSON.stringify({ "@context": "https://schema.org", "@graph": nos });
}

export { TESTE_DIAS };
