import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "../components/Logo";
import { Regua } from "../components/Regua";
import { Alerta } from "../components/ui/Alerta";
import { Botao, BotaoIcone } from "../components/ui/Botao";
import { Campo } from "../components/ui/Campo";
import { Chip } from "../components/ui/Chip";
import { Atalho } from "../components/ui/Atalho";
import { CartaoBloqueado } from "../components/plano/Bloqueio";

export const metadata: Metadata = {
  title: "Design system — Pitangueira",
  description: "Cores, tipografia, componentes e regras visuais da Pitangueira.",
};

const secoes = [
  ["principios", "Princípios"],
  ["cores", "Cores"],
  ["tipografia", "Tipografia"],
  ["forma", "Forma e espaço"],
  ["botoes", "Botões"],
  ["campos", "Campos"],
  ["chips", "Chips e selos"],
  ["alertas", "Alertas"],
  ["cartoes", "Cartões e listas"],
  ["progresso", "Progresso"],
  ["movimento", "Movimento"],
  ["texto", "Texto e voz"],
  ["acessibilidade", "Acessibilidade"],
  ["checklist", "Checklist de tela nova"],
] as const;

function Secao({ id, titulo, children }: { id: string; titulo: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-linha pt-10">
      <h2 className="text-2xl font-semibold tracking-tight text-ink">{titulo}</h2>
      {children}
    </section>
  );
}

const P = ({ children }: { children: ReactNode }) => <p className="mt-3 max-w-[680px] text-[15px] leading-relaxed text-ink/80">{children}</p>;
const Cod = ({ children }: { children: ReactNode }) => <code className="rounded bg-ink/[0.07] px-1 py-0.5 font-mono text-[12.5px] text-ink">{children}</code>;
const Sub = ({ children }: { children: ReactNode }) => <h3 className="rotulo-tec mb-3 mt-8 text-ink/50">{children}</h3>;

/** Uma amostra com o nome do uso e o código para copiar. */
function Exemplo({ legenda, codigo, children }: { legenda: string; codigo: string; children: ReactNode }) {
  return (
    <div className="prancha overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 p-5">{children}</div>
      <div className="border-t border-linha bg-ink/[0.03] px-4 py-2.5">
        <p className="text-[12.5px] font-medium text-ink">{legenda}</p>
        <p className="mt-0.5 break-all font-mono text-[11.5px] text-ink/55">{codigo}</p>
      </div>
    </div>
  );
}

function Cor({ nome, hex, fundo, uso, claro = false }: { nome: string; hex: string; fundo: string; uso: string; claro?: boolean }) {
  return (
    <div className="prancha overflow-hidden">
      <div className={`flex h-20 items-end p-3 ${claro ? "text-ink" : "text-white"}`} style={{ background: fundo }}>
        <span className="font-mono text-[11px] font-semibold">{hex}</span>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-ink">{nome}</p>
        <p className="mt-0.5 text-[12.5px] leading-snug text-ink/60">{uso}</p>
      </div>
    </div>
  );
}

export default function DesignSystem() {
  return (
    <div className="min-h-dvh bg-papel">
      <header className="sticky top-0 z-20 border-b border-linha bg-papel/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/design" className="flex items-center gap-3" aria-label="Design system da Pitangueira">
            <Logo />
            <span className="hidden rounded-full bg-ink px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white sm:inline">Design system</span>
          </Link>
          <div className="flex gap-2">
            <Link href="/docs" className="btn btn-linha px-4 py-2 text-sm">
              Documentação
            </Link>
            <Link href="/" className="btn btn-solido px-4 py-2 text-sm">
              Abrir o app
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1240px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 lg:py-12">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav aria-label="Seções do design system">
            <p className="rotulo-tec mb-2 text-ink/45">Neste guia</p>
            <ul className="flex flex-wrap gap-1.5 lg:block lg:space-y-0.5">
              {secoes.map(([id, nome]) => (
                <li key={id}>
                  <a href={`#${id}`} className="block rounded-lg px-3 py-1.5 text-[14px] text-ink/70 hover:bg-ink/[0.06] hover:text-ink">
                    {nome}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <main className="min-w-0 max-w-[900px] space-y-14">
          <div>
            <p className="rotulo-tec text-pitanga">Design system</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-5xl">Papel, tinta e pitanga</h1>
            <p className="mt-4 max-w-[640px] text-[17px] leading-relaxed text-ink/70">
              O padrão visual da Pitangueira. Tudo o que aparece aqui é o componente de verdade, o mesmo que o app usa. Antes de criar uma tela, use o que já existe; precisando de algo novo, acrescente aqui primeiro.
            </p>
          </div>

          <Secao id="principios" titulo="Princípios">
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["Papel e tinta", "Fundo creme, texto quase preto, cartões brancos com borda fina. A interface lembra uma prancha de arquitetura."],
                ["O laranja é raro", "A pitanga marca a ação principal da tela e os alertas. Se tudo é laranja, nada chama atenção."],
                ["Mono para o que é técnico", "Rótulos, números pequenos, datas e etiquetas usam a fonte mono em caixa alta. O texto corrido usa a sans."],
                ["Claro e em português", "Verbos diretos, o nome do botão diz o que acontece, “projeto” e nunca “obra”. Sem jargão."],
                ["Celular primeiro", "Tudo funciona com o polegar: alvos de 40px, uma coluna, rolagem vertical, sem rolagem horizontal da página."],
                ["Sem surpresa", "Mesma coisa, mesmo jeito. Um botão de remover é sempre uma lixeira que pede confirmação."],
              ].map(([t, d]) => (
                <li key={t} className="prancha p-4">
                  <p className="font-semibold text-ink">{t}</p>
                  <p className="mt-1 text-[13.5px] leading-snug text-ink/65">{d}</p>
                </li>
              ))}
            </ul>
          </Secao>

          <Secao id="cores" titulo="Cores">
            <P>
              Os tokens ficam em <Cod>app/globals.css</Cod>. Use o nome do token no código (<Cod>text-ink</Cod>, <Cod>bg-pitanga</Cod>), nunca o hexadecimal.
            </P>
            <Sub>Base</Sub>
            <div className="grid gap-3 sm:grid-cols-3">
              <Cor nome="papel" hex="#f4f2ee" fundo="#f4f2ee" claro uso="Fundo de todas as telas. bg-papel" />
              <Cor nome="ink" hex="#14110f" fundo="#14110f" uso="Texto, ícones e o botão sólido. text-ink, bg-ink" />
              <Cor nome="linha" hex="14110f · 12%" fundo="rgba(20,17,15,0.12)" claro uso="Bordas finas de cartões e divisórias. border-linha" />
            </div>
            <Sub>Destaque e alerta</Sub>
            <div className="grid gap-3 sm:grid-cols-2">
              <Cor nome="pitanga" hex="#d23a1f" fundo="#d23a1f" uso="Ação principal, foco, valores acima do limite, erro. bg-pitanga, text-pitanga" />
              <Cor nome="pitanga-escuro" hex="#b32e16" fundo="#b32e16" uso="Hover do botão principal e texto de erro sobre fundo claro. bg-pitanga-escuro" />
            </div>
            <Sub>Status (sempre em par: fundo suave + texto escuro)</Sub>
            <div className="grid gap-3 sm:grid-cols-3">
              <Cor nome="ok · verde" hex="#059669 / #d1fae5" fundo="linear-gradient(90deg,#059669 55%,#d1fae5 55%)" uso="Concluído, pago, no prazo. Texto #065f46. Tailwind emerald." />
              <Cor nome="aviso · âmbar" hex="#f59e0b / #fef3c7" fundo="linear-gradient(90deg,#f59e0b 55%,#fef3c7 55%)" uso="Atenção, falta algo, ritmo no limite. Texto #78350f. Tailwind amber." />
              <Cor nome="info · azul" hex="#0ea5e9 / #e0f2fe" fundo="linear-gradient(90deg,#0ea5e9 55%,#e0f2fe 55%)" uso="Informação do cliente, neutro positivo. Texto #0c4a6e. Tailwind sky." />
            </div>
            <Sub>Opacidades da tinta</Sub>
            <div className="prancha flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-[13px]">
              {[
                ["text-ink", "100% · títulos e valores"],
                ["text-ink/85", "85% · texto corrido"],
                ["text-ink/60", "60% · apoio e descrição"],
                ["text-ink/45", "45% · rótulos e dicas"],
              ].map(([c, d]) => (
                <span key={c} className={c}>
                  {d}
                </span>
              ))}
            </div>
            <Alerta tom="aviso" className="mt-4" titulo="Nunca só pela cor">
              Todo status também tem texto ou ícone (“Atrasado”, “Pago ✓”). Quem não distingue cores precisa entender igual.
            </Alerta>
          </Secao>

          <Secao id="tipografia" titulo="Tipografia">
            <P>
              Duas famílias: <strong>Geist</strong> (sans) para leitura e <strong>Geist Mono</strong> para rótulos, números técnicos e etiquetas.
            </P>
            <div className="prancha mt-4 divide-y divide-linha">
              {[
                ["Título de página", "text-3xl sm:text-5xl font-semibold tracking-tight", "text-3xl font-semibold tracking-tight text-ink", "Aprenda a usar"],
                ["Título de seção", "text-xl / text-2xl font-semibold tracking-tight", "text-xl font-semibold tracking-tight text-ink", "Itens do orçamento"],
                ["Título de cartão", "text-[15px] / text-base font-semibold", "text-[15px] font-semibold text-ink", "Casa Pitanga"],
                ["Texto corrido", "text-[15px] leading-relaxed text-ink/85", "text-[15px] leading-relaxed text-ink/85", "O cliente acompanha tudo em tempo real."],
                ["Texto de apoio", "text-[13px] leading-snug text-ink/60", "text-[13px] leading-snug text-ink/60", "Pode ser definido depois, em Ajustes."],
              ].map(([nome, uso, cls, amostra]) => (
                <div key={nome} className="grid gap-1 p-4 sm:grid-cols-[170px_1fr] sm:items-baseline sm:gap-4">
                  <div>
                    <p className="text-[12.5px] font-medium text-ink">{nome}</p>
                    <p className="font-mono text-[10.5px] text-ink/45">{uso}</p>
                  </div>
                  <p className={cls}>{amostra}</p>
                </div>
              ))}
              <div className="grid gap-1 p-4 sm:grid-cols-[170px_1fr] sm:items-baseline sm:gap-4">
                <div>
                  <p className="text-[12.5px] font-medium text-ink">Rótulo técnico</p>
                  <p className="font-mono text-[10.5px] text-ink/45">.rotulo-tec</p>
                </div>
                <p className="rotulo-tec text-ink/55">Orçamento disponível</p>
              </div>
              <div className="grid gap-1 p-4 sm:grid-cols-[170px_1fr] sm:items-baseline sm:gap-4">
                <div>
                  <p className="text-[12.5px] font-medium text-ink">Número em destaque</p>
                  <p className="font-mono text-[10.5px] text-ink/45">font-mono text-xl font-semibold</p>
                </div>
                <p className="font-mono text-xl font-semibold text-ink">R$ 12.450,00</p>
              </div>
            </div>
            <P>Tamanhos pequenos usados no app: 10px (rótulos e chips), 11px (selos e apoio), 13px (texto de lista), 15px (corpo).</P>
          </Secao>

          <Secao id="forma" titulo="Forma e espaço">
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ["Cartão · 20px", "var(--radius-cartao)", "rounded-[20px]", ".prancha"],
                ["Controle · 14px", "var(--radius-controle)", "rounded-[14px]", "botão e campo"],
                ["Ícone · 12px", "var(--radius-icone)", "rounded-xl", ".btn-icone"],
              ].map(([n, v, , uso]) => (
                <div key={n} className="prancha p-4">
                  <div className="h-16 border-2 border-ink/70" style={{ borderRadius: v }} />
                  <p className="mt-3 text-sm font-semibold text-ink">{n}</p>
                  <p className="font-mono text-[11px] text-ink/50">{uso}</p>
                </div>
              ))}
            </div>
            <ul className="mt-5 max-w-[680px] list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink/80 marker:text-ink/30">
              <li>Chips, pílulas e botões redondos usam <Cod>rounded-full</Cod>.</li>
              <li>Cartões: fundo branco, <Cod>border-linha</Cod>, sem sombra. A sombra só aparece ao passar o mouse em cartões clicáveis.</li>
              <li>Espaço entre blocos de uma tela: <Cod>space-y-6</Cod> (24px). Dentro de cartão: <Cod>p-4</Cod> ou <Cod>p-5</Cod>.</li>
              <li>Fundo de telas inteiras usa <Cod>.grade</Cod>: uma grade de prancha quase invisível a cada 28px.</li>
              <li>O topo laranja (<Cod>bg-pitanga</Cod>) tem cantos inferiores de 32px e leva os botões redondos <Cod>.btn-topo</Cod> e as pílulas <Cod>.pilula-topo</Cod>.</li>
            </ul>
          </Secao>

          <Secao id="botoes" titulo="Botões">
            <P>
              Componente <Cod>Botao</Cod> em <Cod>app/components/ui/Botao.tsx</Cod>. Uma tela tem no máximo <strong>um</strong> botão primário.
            </P>
            <div className="mt-4 grid gap-4">
              <Exemplo legenda="Primário: a ação principal da tela" codigo={'<Botao variante="primario">Criar projeto</Botao>'}>
                <Botao variante="primario">Criar projeto</Botao>
                <Botao variante="primario" disabled>
                  Desabilitado
                </Botao>
              </Exemplo>
              <Exemplo legenda="Sólido: ação normal" codigo={'<Botao variante="solido">Salvar ajustes</Botao>'}>
                <Botao variante="solido">Salvar ajustes</Botao>
                <Botao variante="solido" disabled>
                  Desabilitado
                </Botao>
              </Exemplo>
              <Exemplo legenda="Linha: ação secundária (Cancelar, Voltar, Gerar)" codigo={'<Botao variante="linha">Cancelar</Botao>'}>
                <Botao variante="linha">Cancelar</Botao>
                <Botao variante="linha" disabled>
                  Desabilitado
                </Botao>
              </Exemplo>
              <Exemplo legenda="Tamanhos: pequeno, médio (padrão) e grande" codigo={'<Botao tamanho="pequeno" | "medio" | "grande">'}>
                <Botao variante="solido" tamanho="pequeno">
                  Pequeno
                </Botao>
                <Botao variante="solido">Médio</Botao>
                <Botao variante="solido" tamanho="grande">
                  Grande
                </Botao>
              </Exemplo>
              <Exemplo legenda="Ícone: editar e remover. Sempre com rótulo (vira o nome acessível). perigo = apaga" codigo={'<BotaoIcone rotulo="Editar item">…</BotaoIcone>'}>
                <BotaoIcone rotulo="Editar item">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M4 20h4L19 9l-4-4L4 16v4Z" />
                  </svg>
                </BotaoIcone>
                <BotaoIcone rotulo="Remover item" perigo>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                  </svg>
                </BotaoIcone>
              </Exemplo>
              <div className="prancha overflow-hidden">
                <div className="flex flex-wrap items-center gap-3 bg-pitanga p-5">
                  <span className="btn-topo" aria-hidden>
                    ?
                  </span>
                  <span className="btn-topo" aria-hidden>
                    ✕
                  </span>
                  <span className="pilula-topo">Meu catálogo</span>
                  <span className="pilula-topo">Financeiro</span>
                </div>
                <div className="border-t border-linha bg-ink/[0.03] px-4 py-2.5">
                  <p className="text-[12.5px] font-medium text-ink">Topo laranja: botão redondo e pílula de atalho</p>
                  <p className="font-mono text-[11.5px] text-ink/55">className=&quot;btn-topo&quot; · className=&quot;pilula-topo&quot;</p>
                </div>
              </div>
            </div>
            <ul className="mt-5 max-w-[680px] list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink/80 marker:text-ink/30">
              <li>Rótulo com verbo: “Criar projeto”, “Salvar ajustes”, “Gerar relatório”. Nunca “OK” ou “Enviar”.</li>
              <li>Ação que apaga usa confirmação e o botão fica laranja só na janela de confirmação.</li>
              <li>Botão desabilitado explica o motivo perto dele (ex.: “Inclua pelo menos um item…”).</li>
              <li>Link com cara de botão: <Cod>BotaoLink</Cod>.</li>
            </ul>
          </Secao>

          <Secao id="campos" titulo="Campos">
            <P>
              Classe <Cod>.input-pit</Cod> para input, select e textarea; <Cod>.rotulo-campo</Cod> para o rótulo. O componente <Cod>Campo</Cod> liga rótulo, dica e erro ao input.
            </P>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="prancha space-y-4 p-5">
                <Campo rotulo="Nome do projeto" placeholder="Ex.: Casa Pitanga" />
                <Campo rotulo="Orçamento disponível (R$)" dica="Pode ser definido depois, em Ajustes." inputMode="decimal" />
                <Campo rotulo="Código" defaultValue="AB" erro="Código incorreto para este projeto." />
                <Campo rotulo="Desabilitado" disabled defaultValue="Não editável" />
              </div>
              <div className="prancha p-5">
                <p className="text-[12.5px] font-medium text-ink">Código</p>
                <pre className="mt-2 overflow-x-auto rounded-xl bg-ink/[0.05] p-3 font-mono text-[11.5px] leading-relaxed text-ink/75">{`<label className="rotulo-campo"
  htmlFor="nome">Nome</label>
<input id="nome" className="input-pit" />

// menor, para linhas de tabela
<input className="input-pit input-pit-peq" />

// busca, com espaço para a lupa
<input className="input-pit input-pit-busca" />`}</pre>
              </div>
            </div>
            <ul className="mt-5 max-w-[680px] list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink/80 marker:text-ink/30">
              <li>O foco é um anel laranja de 3px. Nunca remova o foco visível.</li>
              <li>Todo campo tem rótulo (<Cod>label</Cod>), nem que seja só para leitor de tela (<Cod>sr-only</Cod>).</li>
              <li>Erro aparece embaixo do campo, em laranja escuro, com <Cod>aria-invalid</Cod>.</li>
              <li>Campos de dinheiro e de código usam <Cod>inputMode</Cod> para abrir o teclado certo no celular.</li>
            </ul>
          </Secao>

          <Secao id="atalhos" titulo="Atalhos">
            <P>
              Componente <Cod>Atalho</Cod>. Cartão grande de acesso rápido (mais de 64px de altura) com ícone, nome e uma linha do que há dentro. Com <Cod>href</Cod> vira link; com <Cod>onClick</Cod>, botão. O tom <Cod>alerta</Cod> acende um ponto laranja para o que pede atenção.
            </P>
            <div className="mt-4">
              <Exemplo legenda="Tons: neutro, alerta e ok" codigo={'<Atalho icone={...} titulo="Financeiro" detalhe="R$ 2.000 em atraso" tom="alerta" href="/financeiro" />'}>
                <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-3">
                  <Atalho icone={<span>▤</span>} titulo="Catálogo" detalhe="12 itens" href="#atalhos" />
                  <Atalho icone={<span>$</span>} titulo="Financeiro" detalhe="R$ 2.000 em atraso" tom="alerta" href="#atalhos" />
                  <Atalho icone={<span>✓</span>} titulo="Cobranças" detalhe="Tudo recebido" tom="ok" href="#atalhos" />
                </div>
              </Exemplo>
            </div>
          </Secao>

          <Secao id="plano" titulo="Bloqueio por plano">
            <P>
              Recurso que o plano não tem nunca some em silêncio: aparece bloqueado, com o motivo e o caminho. Componentes em <Cod>components/plano/Bloqueio.tsx</Cod>: <Cod>PlanoBloqueado</Cod> (no lugar de uma tela), <Cod>CartaoBloqueado</Cod> (no lugar de um bloco), <Cod>RecursoDialog</Cod> e <Cod>LimiteDialog</Cod> (janelas para botões e limites) e <Cod>FaixaPlano</Cod> (teste, cortesia, sem assinatura). Os textos vêm de <Cod>lib/planos.ts</Cod>.
            </P>
            <div className="mt-4">
              <Exemplo legenda="CartaoBloqueado: bloco de um recurso de plano maior" codigo={'<CartaoBloqueado recurso="relatorioMensal" />'}>
                <div className="w-full max-w-xl">
                  <CartaoBloqueado recurso="relatorioMensal" />
                </div>
              </Exemplo>
            </div>
          </Secao>

          <Secao id="chips" titulo="Chips e selos">
            <P>
              Componente <Cod>Chip</Cod>. Para status e etiquetas curtas, sempre com texto.
            </P>
            <div className="mt-4">
              <Exemplo legenda="Tons: neutro, ink, ok, aviso, perigo e info" codigo={'<Chip tom="ok">Pago 12/11</Chip>'}>
                <Chip>Pendente</Chip>
                <Chip tom="ink">Feito 12/11</Chip>
                <Chip tom="ok">Pago 12/11</Chip>
                <Chip tom="aviso">Atenção ao ritmo</Chip>
                <Chip tom="perigo">Atrasado</Chip>
                <Chip tom="info">Nova previsão · 2ª</Chip>
              </Exemplo>
            </div>
            <ul className="mt-5 max-w-[680px] list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink/80 marker:text-ink/30">
              <li><strong>ok</strong>: concluído, pago, no prazo. <strong>aviso</strong>: falta algo ou o ritmo preocupa. <strong>perigo</strong>: atrasado ou com erro. <strong>ink</strong>: destaque neutro (executado). <strong>info</strong>: informação.</li>
            </ul>
          </Secao>

          <Secao id="alertas" titulo="Alertas">
            <P>
              Componente <Cod>Alerta</Cod>. Quatro tons. O <Cod>perigo</Cod> usa <Cod>role=&quot;alert&quot;</Cod> para que leitores de tela anunciem na hora.
            </P>
            <div className="mt-4 grid gap-3">
              <Alerta titulo="Bom saber">A previsão original do prazo não pode ser editada.</Alerta>
              <Alerta tom="ok" titulo="Tudo certo">Os dados do projeto foram salvos.</Alerta>
              <Alerta tom="aviso" titulo="Atenção">2 itens marcados ainda não estão como feito nem pago.</Alerta>
              <Alerta tom="perigo" titulo="Não deu certo">Não consegui registrar agora. Nada foi alterado; tente de novo.</Alerta>
            </div>
            <P>Mensagens de erro dizem o que aconteceu e o que fazer em seguida, e quando for verdade, que nada foi perdido.</P>
          </Secao>

          <Secao id="cartoes" titulo="Cartões e listas">
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="prancha p-4">
                <p className="rotulo-tec text-ink/50">.prancha</p>
                <p className="mt-1 text-[15px] font-semibold text-ink">Cartão padrão</p>
                <p className="mt-1 text-[13px] text-ink/60">Branco, borda fina, cantos de 20px. Agrupa um assunto.</p>
              </div>
              <div className="prancha prancha-clicavel p-4">
                <p className="rotulo-tec text-ink/50">.prancha .prancha-clicavel</p>
                <p className="mt-1 text-[15px] font-semibold text-ink">Cartão clicável</p>
                <p className="mt-1 text-[13px] text-ink/60">Passe o mouse: sobe e ganha sombra. Use em cartões que abrem algo.</p>
              </div>
            </div>
            <div className="prancha mt-4 divide-y divide-linha">
              {["Tinta acrílica 18L", "Pontos de tomada", "Rolo de lã"].map((t) => (
                <div key={t} className="linha-hover flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm text-ink">{t}</span>
                  <Chip tom="ok">Pago</Chip>
                </div>
              ))}
            </div>
            <P>
              Listas dentro de cartão usam <Cod>divide-y divide-linha</Cod> e <Cod>.linha-hover</Cod> nas linhas. Cada linha tem um assunto, o valor à direita e as ações no fim.
            </P>
          </Secao>

          <Secao id="progresso" titulo="Progresso">
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="prancha space-y-3 p-4">
                <p className="text-[12.5px] font-medium text-ink">Régua · 20 células de 5%</p>
                <Regua pct={65} />
                <p className="font-mono text-[11.5px] text-ink/55">{"<Regua pct={65} />"}</p>
              </div>
              <div className="prancha space-y-3 p-4">
                <p className="text-[12.5px] font-medium text-ink">Barra contínua (valor)</p>
                <div className="h-2 overflow-hidden rounded-full bg-ink/10" role="img" aria-label="60% pago">
                  <div className="h-full w-[60%] rounded-full bg-emerald-600" />
                </div>
                <p className="font-mono text-[11.5px] text-ink/55">bg-ink/10 + bg-emerald-600</p>
              </div>
            </div>
            <ul className="mt-5 max-w-[680px] list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink/80 marker:text-ink/30">
              <li>Régua para andamento (itens concluídos). Barra contínua para dinheiro e tempo.</li>
              <li>Verde = pago/concluído. Tinta = executado. Cinza = falta. Laranja = passou do limite.</li>
              <li>Toda barra tem <Cod>role=&quot;img&quot;</Cod> e <Cod>aria-label</Cod> com o valor em texto.</li>
            </ul>
          </Secao>

          <Secao id="movimento" titulo="Movimento">
            <ul className="mt-4 max-w-[680px] list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink/80 marker:text-ink/30">
              <li>Transições curtas, de 120ms a 180ms: cor, borda, sombra e um leve “levanta” de 1 a 2px.</li>
              <li>Clique: o botão encolhe a 98%. Cartões clicáveis sobem 2px no hover.</li>
              <li>Entrada de blocos: classe <Cod>.entra</Cod> (sobe 8px e aparece em 450ms).</li>
              <li>Quem pede menos movimento (<Cod>prefers-reduced-motion</Cod>) não vê animação de entrada.</li>
            </ul>
          </Secao>

          <Secao id="texto" titulo="Texto e voz">
            <div className="prancha mt-4 overflow-x-auto">
              <table className="w-full min-w-[460px] text-left text-[14px]">
                <thead>
                  <tr className="border-b border-linha bg-ink/[0.03] font-mono text-[10px] uppercase tracking-[0.12em] text-ink/55">
                    <th className="px-4 py-2">Faça</th>
                    <th className="px-4 py-2">Evite</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-linha text-ink/85">
                  {[
                    ["Criar projeto", "Submeter / OK"],
                    ["Projeto", "Obra (o termo antigo)"],
                    ["Não consegui salvar. Nada foi alterado; tente de novo.", "Erro 500"],
                    ["Faltam 47 dias", "Prazo restante: 47d"],
                    ["Feito · falta pagar", "Status parcial"],
                    ["Você", "O usuário"],
                  ].map(([a, b]) => (
                    <tr key={a}>
                      <td className="px-4 py-2.5">{a}</td>
                      <td className="px-4 py-2.5 text-ink/55">{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="mt-5 max-w-[680px] list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink/80 marker:text-ink/30">
              <li>Dinheiro em reais, sempre pela função <Cod>brl</Cod> (ou <Cod>useDinheiro()</Cod>, que respeita o olhinho de ocultar valores). Datas em dd/mm ou dd/mm/aa.</li>
              <li>Frases curtas. Primeiro o que aconteceu, depois o que fazer.</li>
              <li>Estado vazio sempre explica o próximo passo (“Nenhum item neste projeto ainda” + botão).</li>
              <li>Os nomes dos botões na tela e na <Link href="/docs" className="font-medium text-pitanga underline underline-offset-2">documentação</Link> são exatamente os mesmos.</li>
            </ul>
          </Secao>

          <Secao id="acessibilidade" titulo="Acessibilidade">
            <ul className="mt-4 max-w-[680px] list-disc space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink/80 marker:text-ink/30">
              <li>Foco visível em tudo que se clica ou digita (anel laranja; no topo laranja, anel branco).</li>
              <li>Alvo de toque de pelo menos 40×40px (<Cod>h-10 w-10</Cod>).</li>
              <li>Botão só com ícone tem <Cod>aria-label</Cod> (use <Cod>BotaoIcone</Cod>). Ícones decorativos levam <Cod>aria-hidden</Cod>.</li>
              <li>Contraste: texto principal e apoio (<Cod>ink/60</Cod> ou mais) sobre branco ou papel. Não use <Cod>ink/40</Cod> para texto que precisa ser lido.</li>
              <li>Janelas (<Cod>Modal</Cod>) fecham com Esc, no X ou clicando fora, e têm título.</li>
              <li>Status nunca depende só de cor. Gráficos têm legenda e texto alternativo.</li>
              <li>Funciona em 375px de largura, sem rolagem horizontal da página.</li>
            </ul>
          </Secao>

          <Secao id="checklist" titulo="Checklist de tela nova">
            <ol className="mt-4 max-w-[680px] list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-ink/80 marker:font-mono marker:text-ink/40">
              <li>Fundo <Cod>bg-papel</Cod> (ou <Cod>.grade</Cod>); blocos em <Cod>.prancha</Cod>.</li>
              <li>Um único botão primário. Os demais são sólido ou linha.</li>
              <li>Campos com <Cod>.input-pit</Cod> e rótulo <Cod>.rotulo-campo</Cod>.</li>
              <li>Status com <Cod>Chip</Cod>; avisos com <Cod>Alerta</Cod>; sem cores soltas.</li>
              <li>Valores em dinheiro pelo <Cod>useDinheiro()</Cod> (olhinho).</li>
              <li>Estado vazio, carregando e erro tratados, com texto em português.</li>
              <li>Testada em 375px e em desktop; foco por teclado funciona.</li>
              <li>Documentada em <Cod>/docs</Cod> e, se criou componente novo, mostrada aqui.</li>
            </ol>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/docs" className="btn btn-solido px-4 py-2.5 text-sm">
                Ver a documentação
              </Link>
            </div>
          </Secao>
        </main>
      </div>
    </div>
  );
}
