# Contas e ferramentas

> IDs públicos ficam aqui (aparecem no HTML do site, não são segredo). **Chaves secretas
> nunca entram neste arquivo** — ficam nas variáveis de ambiente da Vercel. Dados legais
> (CPF, e-mail de suporte, foro) ficam em `lib/empresa.ts`.

## Site e ambientes

- **Produção**: https://www.pitangueira.app (também responde em `pitangueira-ten.vercel.app`).
- **Rotas públicas**: `/` (landing), `/planos`, `/campanha` (landing de tráfego pago),
  `/docs` (documentação do usuário), `/termos`.
- **Deploy**: Vercel, projeto **pitangueira** (`gabrielbarbosaps-projects`). **Push na `main` → deploy de produção automático.** Variáveis de ambiente novas exigem redeploy.
- **Repositório**: GitHub `gabrielbarbosap/pitangueira` (trabalha direto na `main`).

## Redes sociais

- **Instagram**: @pitangueiraapp — perfil profissional, foto e bio prontos. Link na bio: www.pitangueira.app.
- **Facebook**: página criada (URL a confirmar e anotar aqui). Vale vincular ao Instagram no Meta Business Suite.

## Rastreamento e análise

- **Google Analytics 4 (GA4)** — ID da métrica: `G-K06JDX4G9X` (env `NEXT_PUBLIC_GA_ID`).
  Propriedade "Pitangueira" (Brasil/Recife, BRL) na conta de Gabriel.
- **Pixel da Meta** — ID: `1160050627002685` (env `NEXT_PUBLIC_META_PIXEL_ID`). Gerenciador de Eventos da Meta.
- **Consentimento (LGPD)**: GA4 e Pixel **só carregam depois do "Aceitar"** no banner de cookies.
  Sem consentimento ou sem os IDs, nada de terceiros é baixado. Código: `app/components/Analytics.tsx`,
  `app/components/Consentimento.tsx`, `lib/consentimento.tsx` e `lib/analytics.ts`.
- **Google Search Console**: propriedade `https://www.pitangueira.app` **verificada** (meta tag
  `verification.google` no `app/layout.tsx`). **Sitemap enviado** (`/sitemap.xml`, 30 URLs).

## Pagamentos

- **Stripe** em modo **produção (live)**. Chaves e price IDs nas env da Vercel
  (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`…).
  Integração dep-free em `lib/servidor/stripe.ts`; rotas em `app/api/assinatura/*`.
- Dados legais do responsável (pessoa física, CPF): `lib/empresa.ts` (aparecem nos Termos, que são públicos).

## Stack técnica (resumo)

Next.js 16.4.6 (App Router, `cacheComponents`), React 19, TypeScript, Tailwind v4,
Firebase (auth + Firestore via camada REST admin dep-free) e Stripe (dep-free).
Detalhes e convenções: `AGENTS.md` e `README.md`. Antes de escrever código, leia os guias
do Next em `node_modules/next/dist/docs/`.

## Regras de segurança/privacidade

- Nunca comitar segredos (`.env.local`, chaves, tokens). Variáveis públicas usam prefixo `NEXT_PUBLIC_`.
- Login, 2FA e aceite de termos de terceiros (Meta, Google, Vercel) são **sempre do dono**, nunca do agente.
- Nada é publicado em rede social nem gasto em anúncio sem o "ok" explícito de Gabriel.
