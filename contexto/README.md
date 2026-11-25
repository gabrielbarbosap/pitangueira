# Contexto compartilhado — Pitangueira

Esta pasta é a **fonte única de verdade** entre todas as sessões de trabalho (código,
conteúdo, anúncios, SEO, dados, suporte…). Qualquer sessão deve **ler isto primeiro** para
partir dos mesmos dados, e **registrar aqui o que fizer de novo** para as outras aproveitarem.

> Não confundir com `app/docs/`, que é a **documentação do produto para o usuário final**.
> Esta pasta (`contexto/`) é a **documentação interna entre sessões/equipe**.

## A regra de ouro (vale para toda sessão)

Sempre que concluir algo novo ou mudar algo importante:
1. **Atualize o arquivo de contexto certo** (produto, contas, etc.) se um dado mudou.
2. **Acrescente uma linha em [`registro.md`](./registro.md)** (diário, mais recente no topo):
   data, qual sessão, o que foi feito e onde ficou.

Assim nenhuma sessão precisa adivinhar o que a outra fez.

## Índice

- [`produto-e-marca.md`](./produto-e-marca.md) — o que é a Pitangueira, planos, preços, marca e voz.
- [`contas-e-ferramentas.md`](./contas-e-ferramentas.md) — site, redes, IDs (GA4/Pixel), Search Console, Vercel, Stripe, deploy.
- [`sessoes.md`](./sessoes.md) — as áreas de responsabilidade (sessões) e o prompt inicial de cada uma.
- [`registro.md`](./registro.md) — diário do que cada sessão foi fazendo.
- [`../marketing/`](../marketing/) — materiais prontos (kit de posts, anúncios, avatar).
- [`../AGENTS.md`](../AGENTS.md) e `../README.md` — convenções e detalhes técnicos do código.

## Resumo de uma linha

A **Pitangueira** (https://www.pitangueira.app) é um SaaS de **gestão de obras** para
arquitetos, engenheiros e mestres de obra: orçamento, andamento, cobrança e o cliente
acompanhando a obra por um código — tudo num só lugar.

## Estado do lançamento (atualize conforme avançar)

- ✅ Produto no ar em produção (Next.js 16 na Vercel).
- ✅ Instagram **@pitangueiraapp** e página no Facebook criados.
- ✅ SEO: metadados, sitemap, robots, dados estruturados, imagem de compartilhamento, landing no HTML.
- ✅ Next.js atualizado para 16.4.6 (correção de segurança).
- ✅ Rastreamento: GA4 + Pixel da Meta com consentimento de cookies (LGPD).
- ✅ Google Search Console verificado + sitemap enviado.
- ⏳ Próximos: primeiros posts, campanha de anúncios, blog/SEO de conteúdo, onboarding.
