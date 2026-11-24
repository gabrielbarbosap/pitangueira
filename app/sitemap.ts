import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";
import { paginas } from "./docs/paginas";

/**
 * Mapa do site para os buscadores. Só páginas públicas (as privadas do app ficam de fora e no robots.txt).
 * Data fixa e determinística (bom para o cache de componentes); atualize ao publicar mudanças grandes.
 */
const ATUALIZADO = new Date("2026-11-24");

export default function sitemap(): MetadataRoute.Sitemap {
  const publicas: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: ATUALIZADO, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/planos`, lastModified: ATUALIZADO, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE_URL}/campanha`, lastModified: ATUALIZADO, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/docs`, lastModified: ATUALIZADO, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/termos`, lastModified: ATUALIZADO, changeFrequency: "yearly", priority: 0.3 },
  ];

  const docs: MetadataRoute.Sitemap = paginas.map((p) => ({
    url: `${SITE_URL}/docs/${p.slug}`,
    lastModified: ATUALIZADO,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...publicas, ...docs];
}
