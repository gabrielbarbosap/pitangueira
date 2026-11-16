import type { PaginaDoc } from "./tipos";
import { Papel } from "./ui";

/** Uma página da documentação: título, resumo, seções e o índice "Nesta página". */
export function Pagina({ pagina }: { pagina: PaginaDoc }) {
  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_200px] xl:gap-10">
      <article className="min-w-0 max-w-[760px]">
        <p className="rotulo-tec text-pitanga">{pagina.grupo}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{pagina.titulo}</h1>
        <p className="mt-3 text-[17px] leading-relaxed text-ink/70">{pagina.resumo}</p>
        {pagina.secoes.map((s) => (
          <section key={s.id} id={s.id} className="mt-12 scroll-mt-24">
            <h2 className="border-b border-linha pb-2 text-xl font-semibold tracking-tight text-ink">
              {s.titulo}
              {s.papel && <Papel quem={s.papel} />}
            </h2>
            {s.corpo}
          </section>
        ))}
      </article>
      <aside className="hidden xl:block">
        <nav aria-label="Nesta página" className="sticky top-24">
          <p className="rotulo-tec mb-2 text-ink/45">Nesta página</p>
          <ul className="space-y-1.5 border-l border-linha">
            {pagina.secoes.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="-ml-px block border-l border-transparent pl-3 text-[13px] leading-snug text-ink/60 hover:border-ink hover:text-ink">
                  {s.titulo}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  );
}
