# Registro (diário entre sessões)

Mais recente no topo. Toda sessão acrescenta uma entrada ao concluir algo novo:
**data — sessão — o que foi feito — onde ficou** (commits, arquivos, contas).

---

## 2026-11-25 — Produto & Código
- Criada a pasta `contexto/` como fonte única de verdade e documentação entre sessões
  (README, produto-e-marca, contas-e-ferramentas, sessoes, este registro).
- Materiais de marketing salvos em `marketing/` (kit de posts, anúncios, avatar).
- Adicionada a regra "Contexto entre sessões (obrigatório)" no `AGENTS.md`.

## 2026-11-25 — Produto & Código — Google Search Console
- Propriedade `https://www.pitangueira.app` **verificada** via meta tag
  (`verification.google` em `app/layout.tsx`) e **sitemap enviado** (`/sitemap.xml`).
- Obs.: a verificação pela tag do Analytics não serve aqui, porque o GA só carrega após o consentimento.

## 2026-11-25 — Produto & Código — Rastreamento (GA4 + Pixel + LGPD)
- Banner de consentimento de cookies no rodapé (`app/components/Consentimento.tsx`, `lib/consentimento.tsx`).
- Carregador de GA4 e Pixel gated por consentimento + env (`app/components/Analytics.tsx`); eventos via `lib/analytics.ts`.
- Criados na Meta/Google e cadastrados na Vercel: **GA4 `G-K06JDX4G9X`** e **Pixel `1160050627002685`**.
- Mensagem do banner reescrita com foco no valor pra pessoa; botão "Só os essenciais".
- Verificado em produção: scripts só carregam após "Aceitar".

## 2026-11-24 — Produto & Código — Segurança
- Next.js atualizado **16.4.3 → 16.4.6** (correção de aviso de segurança). `experimental.agentUpgrade: "security"` no `next.config.ts`.

## 2026-11-24 — Produto & Código — SEO
- Metadados ricos (título, descrição, palavras-chave, Open Graph/Twitter, robots) em `app/layout.tsx`.
- `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`; imagem de compartilhamento 1200×630 e ícones.
- Dados estruturados (Organização, WebSite, SoftwareApplication, FAQ) em `lib/seo.ts`.
- Landing passou a renderizar no HTML (SSR) em `app/page.tsx`; canonical por página.

## 2026-11-24 — Redes sociais
- Instagram **@pitangueiraapp** configurado: foto de perfil (marca), bio, link e conta profissional.
  (Sem posts e sem seguir ninguém, a pedido.) Página no Facebook criada por Gabriel.

## Antes (resumo)
- Produto no ar na Vercel (Next.js). Integração de assinaturas com Stripe (Checkout, portal, webhook),
  teste grátis de 5 dias com cartão, paywall por plano. Landing, /planos, /campanha, /docs, /termos.
