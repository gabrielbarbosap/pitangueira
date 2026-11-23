# Stripe — o que falta configurar

Fonte única dos passos restantes da integração do Stripe (assinaturas Broto, Safra e Pomar). O **código** já está pronto:
Checkout com formulário embutido (`ui_mode: "form"`, `mode: "subscription"`), portal do cliente e webhook que grava
`assinaturas/{uid}` e os recibos. Falta preencher **chaves e variáveis de ambiente** e **configurar o painel do Stripe**.

> Os produtos e preços abaixo **já foram criados na sua conta, em MODO DE TESTE**. Para produção (live), crie os mesmos
> preços em modo live e troque os IDs.

## Valores a preencher

Crie um arquivo **`.env.local`** na raiz (não vai para o git) com as variáveis abaixo. As chaves ficam no painel do
Stripe → [chaves de API](https://dashboard.stripe.com/test/apikeys).

**Arquivos que leem estas variáveis:**
- [lib/servidor/stripe.ts](lib/servidor/stripe.ts) — chave secreta, segredo do webhook, IDs de preço
- [app/components/assinatura/AssinarTela.tsx](app/components/assinatura/AssinarTela.tsx) — chave pública

| Variável | Valor atual | O que pôr |
|----------|-------------|-----------|
| `STRIPE_SECRET_KEY` | — | Sua chave secreta de teste (`sk_test_...`). **Só no servidor.** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | — | Sua chave pública de teste (`pk_test_...`). Pode ir ao navegador. |
| `STRIPE_WEBHOOK_SECRET` | — | O segredo do endpoint do webhook (`whsec_...`), gerado no passo do webhook abaixo. |
| `STRIPE_PRICE_BROTO_MENSAL` | `price_1Uf1NBHouWud37xOxNki053N` | (já criado em teste) |
| `STRIPE_PRICE_BROTO_ANUAL` | `price_1Uf1NCHouWud37xOCu1Voihe` | (já criado em teste) |
| `STRIPE_PRICE_SAFRA_MENSAL` | `price_1Uf1NDHouWud37xOA9Mh19qK` | (já criado em teste) |
| `STRIPE_PRICE_SAFRA_ANUAL` | `price_1Uf1NEHouWud37xOYkQmBKpq` | (já criado em teste) |
| `STRIPE_PRICE_POMAR_MENSAL` | `price_1Uf1NGHouWud37xOnwnRUkvY` | (já criado em teste) |
| `STRIPE_PRICE_POMAR_ANUAL` | `price_1Uf1NGHouWud37xOq8H0iqnF` | (já criado em teste) |
| `FIREBASE_SERVICE_ACCOUNT` | — | JSON da conta de serviço do Firebase, em uma linha. **O webhook precisa disto** para gravar no Firestore. (Veja o README, "Planos e limites".) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | — | Já usada pelo app; o servidor também a usa para conferir o login. |
| `NEXT_PUBLIC_APP_URL` | (opcional) | URL pública do app (ex.: `https://pitangueira.app`), usada se o cabeçalho `origin` faltar. |
| `STRIPE_AUTOMATIC_TAX` | (opcional) | Ponha `0` para **desligar** o cálculo de imposto enquanto o Stripe Tax não estiver configurado (veja abaixo). |

Modelo para colar no `.env.local` (preencha as três chaves):

```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BROTO_MENSAL=price_1Uf1NBHouWud37xOxNki053N
STRIPE_PRICE_BROTO_ANUAL=price_1Uf1NCHouWud37xOCu1Voihe
STRIPE_PRICE_SAFRA_MENSAL=price_1Uf1NDHouWud37xOA9Mh19qK
STRIPE_PRICE_SAFRA_ANUAL=price_1Uf1NEHouWud37xOYkQmBKpq
STRIPE_PRICE_POMAR_MENSAL=price_1Uf1NGHouWud37xOnwnRUkvY
STRIPE_PRICE_POMAR_ANUAL=price_1Uf1NGHouWud37xOq8H0iqnF
```

Os **valores em reais** mostrados na tela (R$ 24,99 / 49,99 / 89,99 por mês) ficam em
[lib/precos.ts](lib/precos.ts). Se mudar um preço ali, atualize também o preço correspondente no Stripe (ou crie um novo e
troque o ID acima).

## Parâmetros já configurados (Checkout Studio)

Aplicados exatamente como vieram do Checkout Studio, na criação da sessão de Checkout.

**Arquivo:** [lib/servidor/stripe.ts](lib/servidor/stripe.ts) (função `criarSessaoCheckout`)

| Parâmetro | Valor |
|-----------|-------|
| `ui_mode` | `form` |
| `mode` | `subscription` |
| `billing_address_collection` | `auto` |
| `phone_number_collection.enabled` | `false` |
| `automatic_tax.enabled` | `true` (desligável com `STRIPE_AUTOMATIC_TAX=0`) |
| `payment_method_collection` | `always` |
| `submit_type` | `auto` |
| `saved_payment_method_options.payment_method_save` | `enabled` |
| `integration_identifier` | `custom_embedded_web_0001` |
| `line_items` | o preço do plano/ciclo escolhido (1 unidade) |

API do Stripe fixada em `2026-03-25.dahlia`; o cliente carrega `https://js.stripe.com/dahlia/stripe.js`.

## Configurar o painel do Stripe

1. **Webhook** → [Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks) → "Add endpoint":
   - URL: `https://SEU-DOMINIO/api/assinatura/webhook`
   - Eventos: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`,
     `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_succeeded`, `charge.refunded`.
   - Copie o **Signing secret** (`whsec_...`) para `STRIPE_WEBHOOK_SECRET`.
   - Em desenvolvimento, use a CLI: `stripe listen --forward-to localhost:3000/api/assinatura/webhook` (o segredo que ela
     imprime vale para o ambiente local).
2. **Portal do cliente** → [Dashboard → Billing → Customer portal](https://dashboard.stripe.com/test/settings/billing/portal):
   ative e permita trocar de plano (entre os 3 produtos), atualizar cartão e cancelar.
3. **Métodos de pagamento** → [Dashboard → Payment methods](https://dashboard.stripe.com/test/settings/payment_methods):
   ative cartão (e Pix, se quiser).
4. **Stripe Tax** (por causa de `automatic_tax: true`): ative o Stripe Tax e cadastre o endereço de origem / registros, ou
   ponha `STRIPE_AUTOMATIC_TAX=0` no `.env.local` até configurar — senão o Checkout pode recusar a sessão por falta de
   dados de imposto.
5. **Regras do Firestore**: o arquiteto só **lê** `assinaturas/{uid}` e `assinaturas/{uid}/recibos`; quem grava é o
   servidor (o webhook, via conta de serviço, passa por cima das regras). Confira que as regras já liberam essa leitura
   (veja o README, "Planos e limites").

## Como funciona (resumo do fluxo)

1. Em **/planos** o arquiteto escolhe plano e ciclo e clica em **Assinar** → vai para **/assinar**.
2. **/assinar** chama `POST /api/assinatura/checkout` (com o login), que cria a sessão e devolve o `client_secret`; a tela
   monta o **formulário embutido** do Stripe.
3. Paga → o Stripe redireciona para **/assinar/retorno**.
4. O **webhook** (`/api/assinatura/webhook`) recebe os eventos e grava `assinaturas/{uid}` (plano e status) e os recibos em
   `assinaturas/{uid}/recibos`. É ele que libera o plano — não o navegador.
5. Em **Minha conta**, "Gerenciar assinatura" abre o **portal** (`/api/assinatura/portal`) para trocar/cancelar.

## Testar

- Cartão de teste: **4242 4242 4242 4242**, validade futura qualquer, CVC qualquer, CEP qualquer.
- Rode o app com as variáveis preenchidas, deixe `stripe listen` rodando e assine um plano. Veja o plano e o recibo
  aparecerem em **Minha conta**.
- Mais cartões e cenários: a skill `/stripe:test-cards`.

## Decisão em aberto (produto)

Hoje, quem **não assina** cai no plano **Broto de graça** depois do teste de 5 dias (`planoEfetivo` em
[lib/planos.ts](lib/planos.ts)). Como o Broto agora é **pago** (R$ 24,99), decida o que o não-assinante recebe: um Broto grátis
mais limitado, ou bloqueio pedindo assinatura. É uma mudança pequena em `planoEfetivo`, quando você definir.

## Ir para produção (live)

1. Troque as chaves de teste pelas de **live** (`sk_live_...`, `pk_live_...`).
2. Recrie os **produtos e preços em modo live** e troque os `STRIPE_PRICE_*` pelos IDs live.
3. Recrie o **webhook** apontando para o domínio de produção e troque o `STRIPE_WEBHOOK_SECRET`.
4. Preencha os dados da empresa nos Termos ([lib/empresa.ts](lib/empresa.ts)) e ative o Stripe Tax, se for usar.

Recursos: https://support.stripe.com · https://docs.stripe.com/mcp
