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

## Testes automatizados (ponta a ponta)

Os testes simulam um arquiteto novo usando o app de verdade no navegador (Playwright), em computador e em celular:

- `e2e/fluxo-completo.spec.ts`: cria o projeto, registra o prazo, monta o orçamento, gera o PDF, escreve o escopo, copia o link e o cliente entra com a chave.
- `e2e/permissoes.spec.ts`: só o arquiteto tem a aba Escopo e cria orçamento; o cliente só acompanha.
- `e2e/tutorial.spec.ts`: o tutorial da primeira visita.

```bash
npm run test:e2e          # compila, sobe o app em modo demo (porta 3412) e roda tudo
npm run test:e2e:ui       # o mesmo, com a interface do Playwright
```

Usam o Chrome instalado (`E2E_CHANNEL=msedge` troca o navegador). Sem Chrome, rode antes `npx playwright install chromium`.
O app roda em **modo demo**, com os dados no navegador de cada teste: as regras do Firestore não são exercitadas aqui.
