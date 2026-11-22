# Pitangueira

Gestão de projetos do arquiteto ao cliente: orçamento por etapas, pagamentos, andamento e programa de necessidades,
com acesso do cliente por link e código (sem criar conta).

- **Arquiteto** entra com Google, cria quantos projetos quiser e vê só as dele.
- **Cliente** abre o link do projeto, digita o código e o nome, e acompanha. Pode marcar feito/pago, editar o orçamento
  disponível e aprovar o programa de necessidades; cada marcação registra quem fez.
- Cada projeto tem seus próprios dados (os itens vivem dentro do projeto), então um projeto nunca enxerga outro.

**Stack:** Next.js 16 (App Router) · TypeScript · Tailwind v4 · Firebase (Firestore + Auth) · Recharts

## Rodando localmente

```bash
npm install
npm run dev
```

Abra http://localhost:3000. Sem variáveis de ambiente o app entra em **modo demo**: os dados ficam no navegador e o
botão "Entrar com Google" entra como um arquiteto de exemplo.

## Variáveis de ambiente

Copie `.env.local.example` para `.env.local` e preencha com a configuração do app web do Firebase:

| Variável | Vem de |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Configuração do SDK |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Configuração do SDK |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Configuração do SDK |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Configuração do SDK |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Configuração do SDK |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Configuração do SDK |

Essas chaves de cliente do Firebase são públicas por desenho: a segurança está nas regras do Firestore e no login.
Mesmo assim, não versione o `.env.local`.

## Configurando o Firebase

1. **Firestore:** crie o banco (Build → Firestore Database).
2. **Authentication → Sign-in method:** ative **Google** (arquitetos) e **Anônimo** (clientes entram assim, com o código).
3. **Authentication → Settings → Authorized domains:** inclua `localhost` e o domínio de produção (ex.: o da Vercel).
4. **Regras:** publique [`firestore.rules`](./firestore.rules):

   ```bash
   firebase deploy --only firestore:rules --project <seu-projeto>
   ```

## Deploy (Vercel)

1. Importe o repositório na Vercel (preset Next.js, sem configuração extra).
2. Cadastre as 6 variáveis `NEXT_PUBLIC_FIREBASE_*` em Settings → Environment Variables.
3. Depois do primeiro deploy, adicione o domínio gerado em Firebase → Authentication → Authorized domains.

## Estrutura

```
app/
  page.tsx            home: login, painel do arquiteto ou home do cliente
  obra/[id]/          tela do projeto (arquiteto ou cliente, conforme o acesso)
  components/         interface (painel, itens, gráficos, programa, diálogos)
lib/
  firebase.ts         inicialização (e detecção do modo demo)
  auth.tsx            login Google (arquiteto) e anônimo (cliente)
  obras.tsx           lista, criação, arquivamento e exclusão de projetos
  data.tsx            itens, orçamento e programa de um projeto
  calc.ts             cálculos de orçado, pago e andamento
firestore.rules       regras de segurança multi-tenant
docs/                 análise de concorrência e roadmap
```

## Página inicial (landing)

A home de quem não entrou (`/` sem login) é a página de vendas: `app/components/landing/Landing.tsx`. O login (`LoginScreen` com `embutido`) fica na última seção (`#entrar`). Os prints do sistema ficam em `public/landing/` e vêm de dados fictícios. Para refazê-los depois de mudar a interface:

```
CAPTURAS=1 npx playwright test capturas --project=desktop
```

Sem preços nem planos por enquanto, e sem depoimentos ou números inventados: só afirme na página o que o sistema faz.

## Planos e limites (Broto, Safra, Pomar)

Tudo sobre planos está em **`lib/planos.ts`** (limites, recursos por plano, teste de 5 dias, textos dos bloqueios): mudar um limite é mudar um número ali. O plano de cada arquiteto vem de `assinaturas/{uid}` (e os pagamentos, de `assinaturas/{uid}/recibos`); as regras só deixam o próprio arquiteto **ler**. Quem grava é o servidor (webhook do Stripe, a fazer). **Nunca guarde o plano no documento `arquitetos/{uid}`**, que o próprio usuário escreve.

- **Sem assinatura:** 5 dias de teste com a Safra, contados da criação da conta; depois, Broto. **Quem já usava o app** recebeu `assinaturas/{uid}` com `plano: "pomar"` e `status: "cortesia"` (com aviso de que vai mudar). Para mudar, edite o documento.
- **Limites no app:** obras em andamento (não arquivadas), catálogo e fornecedores são checados na interface (`usePlano()`), com a janela de motivo (`LimiteDialog`). Recursos de plano maior mostram `PlanoBloqueado`/`CartaoBloqueado`.
- **Limite de obras no servidor (desligado por padrão):** a interface sozinha pode ser burlada. Para valer de verdade: (1) crie uma conta de serviço no Firebase e ponha o JSON, em uma linha, em `FIREBASE_SERVICE_ACCOUNT` (só no servidor); (2) ligue `PLANOS_NO_SERVIDOR=1` e `NEXT_PUBLIC_PLANOS_NO_SERVIDOR=1`; (3) rode `node scripts/regras-com-limites.mjs` e publique `firestore.rules.com-limites` no lugar de `firestore.rules`. Aí criar e restaurar projeto passam por `/api/obras/autorizar`, que confere o plano e deixa uma autorização de 2 minutos que as regras exigem. **Ordem: variáveis e deploy do app primeiro, regras por último**, ou ninguém consegue criar projeto. Os limites de catálogo e fornecedores continuam só na interface.
- **Modo demo:** em Minha conta há um simulador de planos. Os testes rodam no Pomar (veja `semTutorial`); os de plano escolhem o plano.
- **Stripe (a fazer):** produtos e preços, Checkout, portal do cliente e um webhook que grava `assinaturas/{uid}` e os recibos. Termos de uso em `/termos` (dados da empresa em `lib/empresa.ts`: preencha razão social, CNPJ, e-mail e foro).
- **Analytics:** `lib/analytics.ts` guarda os eventos só em memória (aparecem em /admin); o Google Analytics ainda não está ligado.

## Documentação do produto

A documentação para o usuário fica em **`/docs`** (pública, sem login), no estilo de documentação de linguagens: menu lateral com busca, páginas com seções, índice "Nesta página" e navegação anterior/próxima.

```
app/docs/
  paginas.ts        lista, em ordem, de todas as páginas (é o menu)
  conteudo/*.tsx    uma página por arquivo: { slug, grupo, titulo, resumo, secoes[] }
  ui.tsx            peças de texto: P, H3, Btn (nome de botão), Passos, Aviso, Tabela, Ir (link interno)
```

**Regra do projeto: tudo que for criado ou alterado no app entra na documentação na mesma entrega.** Para documentar uma funcionalidade nova: crie `app/docs/conteudo/<nome>.tsx` (ou acrescente uma seção a uma página existente), registre em `paginas.ts` e use os nomes exatos de botões e campos da tela (componente `Btn`). O teste `e2e/docs.spec.ts` abre todas as páginas.

## Integração contínua e métricas

- **CI** (`.github/workflows/ci.yml`): a cada push na `main` e em todo pull request roda `tsc`, o lint (por ora só avisa: há erros antigos de "setState em efeito") e os testes e2e completos. Se algo falhar, o relatório do Playwright fica anexado à execução.
- **Métricas de uso e erros** (`lib/telemetria.ts`, painel em `/admin`): eventos e erros vão para a coleção `telemetria` do Firestore (qualquer conta logada só cria; quem entrou como arquiteto lê (o cliente não), conforme `firestore.rules`). Sem dados pessoais. Todo arquiteto é tratado como administrador do painel. **Depois de mudar as regras, publique-as no Firebase.** Teste: `e2e/autoria-e-metricas.spec.ts`.

## Links dos e-mails do Firebase

Os e-mails de recuperação de senha e de confirmação de e-mail apontam para a página própria **`/acao`** (em vez da tela genérica do Firebase). Depois do deploy, configure no console: **Authentication → Modelos de e-mail → (Redefinição de senha e Verificação de e-mail) → Editar → Personalizar URL de ação** → `https://SEU-DOMINIO/acao`. O domínio precisa estar em Authentication → Configurações → Domínios autorizados.

## Design system

O padrão visual fica em **`/design`**: cores, tipografia, forma, botões, campos, chips, alertas, cartões, progresso, movimento, texto e acessibilidade, com os componentes reais e um checklist de tela nova.

- Tokens e classes: `app/globals.css` (`.prancha`, `.input-pit`, `.rotulo-campo`, `.btn-*`, `.btn-topo`, `.pilula-topo`, `.chip-*`, `.alerta-*`).
- Componentes React: `app/components/ui/` (`Botao`, `BotaoIcone`, `BotaoLink`, `Chip`, `Alerta`, `Campo`).
- Regra: tela nova usa o que existe; componente novo entra no catálogo na mesma entrega. Teste: `e2e/design.spec.ts`.

## Testes automatizados (ponta a ponta)

Os testes simulam um arquiteto novo usando o app de verdade no navegador (Playwright), em computador e em celular:

- `e2e/fluxo-completo.spec.ts`: cria o projeto, registra o prazo, monta o orçamento, gera o PDF, escreve o escopo, copia o link e o cliente entra com a chave.
- `e2e/permissoes.spec.ts`: só o arquiteto tem a aba Escopo e cria orçamento; o cliente só acompanha.
- `e2e/relatorio-mensal.spec.ts`: o relatório mensal de andamento (escolher o mês, o que entra, gerar o documento; o cliente não vê).
- `e2e/tutorial.spec.ts`: o tutorial da primeira visita.
- `e2e/cobranca-obra.spec.ts`: a cobrança da obra (itens do orçamento e itens novos, PDF, WhatsApp, o cliente vê, baixa).
- `e2e/valor-alterado.spec.ts`: o aviso de valor maior ou menor ao editar um item.
- `e2e/catalogo-isolado.spec.ts`: mudar o preço no catálogo não altera os projetos.
- `e2e/acompanhar.spec.ts`: a aba Acompanhar (visitas, ocorrências, vistoria, linha do tempo, envio pelo WhatsApp; o cliente só confere a vistoria).
- `e2e/acao.spec.ts`: a página /acao dos links de e-mail (nova senha, link vencido, confirmação de e-mail).
- `e2e/conta.spec.ts`: Minha conta (criar senha para quem entra com Google e vincular o Google a quem entra com senha, na mesma conta).
- `e2e/login-email.spec.ts`: login do arquiteto com e-mail e senha (criar conta, validações, senha errada, e-mail repetido, recuperar senha) e o acesso do cliente sem e-mail.
- `e2e/financeiro.spec.ts`: o financeiro (filtros, atrasos por tempo, cobrança pelo WhatsApp, recebimento com desconto, visão por cliente, planilha CSV).
- `e2e/whatsapp.spec.ts`: o envio do PDF pelo WhatsApp (PDF real de várias páginas; compartilhamento no celular; download + wa.me no computador).
- `e2e/autoria-e-metricas.spec.ts`: quem marcou Feito/Pago (inclusive o cliente), item criado já marcado com data, painel /admin e captura de erros.
- `e2e/orcamento-rapido.spec.ts`: montar o orçamento rápido (etapas, itens em sequência, colar da planilha, total à vista; o cliente não vê as ferramentas).
- `e2e/design.spec.ts`: o catálogo do design system e as classes padrão valendo no app (campos e topo).
- `e2e/docs.spec.ts`: a documentação (todas as páginas abrem, a busca filtra, os atalhos do app existem).

```bash
npm run test:e2e          # compila, sobe o app em modo demo (porta 3412) e roda tudo
npm run test:e2e:ui       # o mesmo, com a interface do Playwright
```

Usam o Chrome instalado (`E2E_CHANNEL=msedge` troca o navegador). Sem Chrome, rode antes `npx playwright install chromium`.
O app roda em **modo demo**, com os dados no navegador de cada teste: as regras do Firestore não são exercitadas aqui.
