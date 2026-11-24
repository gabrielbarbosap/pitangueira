import type { MetadataRoute } from "next";
import { SITE_NOME, SITE_DESCRICAO } from "@/lib/seo";

/**
 * Manifesto do app (PWA): nome, cores e ícones para quando a pessoa adiciona o site à tela inicial.
 * Também é um sinal para os buscadores de que é um app instalável.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NOME} — gestão de obras`,
    short_name: SITE_NOME,
    description: SITE_DESCRICAO,
    start_url: "/",
    display: "standalone",
    background_color: "#f4f2ee",
    theme_color: "#f4f2ee",
    lang: "pt-BR",
    categories: ["business", "productivity", "utilities"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
