# Produto e marca

## O que é

A **Pitangueira** é um SaaS de **gestão de obras** para quem projeta e constrói —
arquitetos, engenheiros, mestres de obra, designers de interiores, empreiteiros e
reformistas. Reúne num só lugar: orçamento, andamento por etapa, cobrança e a conversa
com o cliente. O **cliente final acompanha a obra por um código** (sem cadastro, sem senha).

### Diferenciais (use como argumentos)

- **Largar a planilha**: o orçamento vira o controle vivo da obra (total, saldo e avanço se atualizam sozinhos).
- **Cliente acompanha sozinho** por um código, numa linha do tempo — menos "e aí, como está?".
- **Cobrança profissional** em PDF com a marca, PIX e vencimento; honorários em parcelas.
- **Feito para o celular** (obra, visita, carro).
- **Documentos com a cara de escritório grande** (orçamento, relatório mensal, vistoria final).

## Planos e preços

| Plano  | Mensal   | Para quem                                  |
| ------ | -------- | ------------------------------------------ |
| Broto  | R$ 24,99 | Começar a organizar as obras               |
| Safra  | R$ 49,99 | O mais escolhido: tudo para tocar a obra   |
| Pomar  | R$ 89,99 | Escritórios e equipes                      |

- **Plano anual = 10 meses** (2 meses de desconto).
- **Teste grátis de 5 dias, COM cartão** (trial do Stripe): a pessoa cadastra o cartão,
  usa 5 dias e a cobrança só começa depois. Sem o pagamento, o acesso fica bloqueado (paywall).
- Fonte dos preços no código: `lib/precos.ts`. Planos e limites: `lib/planos.ts`.

## Marca

- **Símbolo**: uma maçã-prédio (fruta + construção). Arquivos em `public/logo-*.png` e `marketing/`.
- **Cor principal (pitanga)**: `#d23a1f` · escura `#b32e16`.
- **Papel/creme (fundo)**: `#f4f2ee` · **tinta (texto)**: `#14110f`.
- **Nome/handle**: Pitangueira · Instagram **@pitangueiraapp**.

### Voz e tom

Direto, prático e acolhedor com **quem toca obra** — nada de corporativês. Fala a língua
do canteiro e do escritório pequeno. Evita jargão técnico de software. Frases curtas,
exemplos reais do dia a dia (orçamento, prazo, cobrança, cliente perguntando no WhatsApp).
Promete menos tempo perdido e mais confiança passada ao cliente.

Frase-âncora: **"Largue a planilha."**
