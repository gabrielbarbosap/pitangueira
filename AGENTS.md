<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Documentação do produto (obrigatório)

O app tem uma documentação para o usuário em `/docs` (código em `app/docs/`, estilo documentação de linguagem de programação). **Toda funcionalidade nova, e toda mudança de comportamento, deve ser documentada na mesma entrega**: crie ou edite a página em `app/docs/conteudo/` e registre-a em `app/docs/paginas.ts`. Use os nomes exatos dos botões e campos da tela. Detalhes na seção "Documentação" do README.

## Contexto entre sessões (obrigatório)

O trabalho é dividido em sessões por área (código, conteúdo, anúncios, SEO, dados, suporte). A pasta **`contexto/`** é a fonte única de verdade compartilhada entre elas — **não confundir com `app/docs/`**, que é a documentação do produto para o usuário. **Toda sessão lê `contexto/README.md` antes de começar** e, ao concluir algo novo ou mudar algo importante, **documenta na mesma entrega**: atualiza o arquivo de contexto certo (`produto-e-marca.md`, `contas-e-ferramentas.md`, `sessoes.md`) e acrescenta uma linha em `contexto/registro.md` (data, sessão, o que foi feito, onde ficou). Materiais de marketing prontos ficam em `marketing/`.

## Design system (obrigatório)

O padrão visual está em **`/design`** (código em `app/design/page.tsx`), com tokens e classes em `app/globals.css` e componentes em `app/components/ui/` (`Botao`, `BotaoIcone`, `BotaoLink`, `Chip`, `Alerta`, `Campo`). Antes de criar uma tela, use o que já existe: `.prancha` (cartão), `.input-pit` + `.rotulo-campo` (campos), `.btn-primario/.btn-solido/.btn-linha` (um único primário por tela), `.btn-topo`/`.pilula-topo` (topo laranja), `.chip-*` e `.alerta-*` (status). Não repita sequências de utilitários Tailwind que já são classes, e não use cores soltas. Precisando de algo novo, crie-o e mostre em `/design` na mesma entrega.
