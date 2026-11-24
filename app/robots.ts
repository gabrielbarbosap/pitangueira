import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

/**
 * Diz aos buscadores o que indexar. Liberamos as páginas públicas e bloqueamos as áreas privadas do app
 * (conta, financeiro, obra do cliente, admin, assinatura) e as rotas internas. O sitemap aponta o resto.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/conta", "/financeiro", "/admin", "/acao", "/assinar", "/obra/", "/design", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
