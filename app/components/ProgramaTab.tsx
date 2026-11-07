"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useData } from "@/lib/data";
import { brlInt } from "@/lib/format";
import { MODELOS_PROGRAMA, type ModeloPrograma } from "@/lib/modelosPrograma";
import type { Grupo } from "@/lib/calc";
import type { AmbientePrograma, Projeto, Requisito, StatusRequisito } from "@/lib/types";
import { Modal } from "./Modal";
import { useConfirm } from "./ConfirmProvider";
import { ProgramaDocumento } from "./ProgramaDocumento";
import { IconeEditar, IconeLixo } from "./Icones";

const campo = "campo-pit w-full border border-ink/25 bg-white px-3 py-2.5 text-sm text-ink outline-none";
const rotulo = "rotulo-tec mb-1 block text-ink/55";

const PROXIMO: Record<StatusRequisito, StatusRequisito> = { pendente: "previsto", previsto: "atendido", atendido: "pendente" };
const STATUS: Record<StatusRequisito, { rotulo: string; dica: string; classe: string; ponto: string }> = {
  pendente: {
    rotulo: "Pendente",
    dica: "Ainda não tratado no projeto ou no orçamento",
    classe: "border-ink/30 bg-white text-ink/65",
    ponto: "bg-ink/30",
  },
  previsto: {
    rotulo: "Previsto",
    dica: "Já está contemplado no orçamento",
    classe: "border-amber-400 bg-amber-50 text-amber-900",
    ponto: "bg-amber-500",
  },
  atendido: {
    rotulo: "Atendido",
    dica: "Executado na obra",
    classe: "border-emerald-500 bg-emerald-50 text-emerald-900",
    ponto: "bg-emerald-600",
  },
};

/** Botões de ação de uma linha: ícone + rótulo (rótulo some só em telas muito estreitas). */
function Acoes({ onEditar, onRemover, nome }: { onEditar: () => void; onRemover: () => void; nome: string }) {
  return (
    <div className="flex shrink-0 gap-1.5">
      <button
        onClick={onEditar}
        title={`Editar ${nome}`}
        aria-label={`Editar ${nome}`}
        className="btn btn-icone h-9 gap-1.5 px-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider"
      >
        <IconeEditar />
        <span className="hidden min-[420px]:inline">Editar</span>
      </button>
      <button
        onClick={onRemover}
        title={`Remover ${nome}`}
        aria-label={`Remover ${nome}`}
        className="btn btn-icone perigo h-9 w-9"
      >
        <IconeLixo />
      </button>
    </div>
  );
}

function Secao({ titulo, descricao, contagem, acao }: { titulo: string; descricao?: string; contagem?: number; acao?: ReactNode }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-3">
        <h2 className="rotulo-tec text-ink">
          {titulo}
          {contagem !== undefined && <span className="ml-2 text-ink/40">{contagem}</span>}
        </h2>
        <span className="h-px flex-1 bg-linha" />
        {acao}
      </div>
      {descricao && <p className="mt-1.5 text-[13px] leading-snug text-ink/60">{descricao}</p>}
    </div>
  );
}

function Campo({ nome, dica, children }: { nome: string; dica?: string; children: ReactNode }) {
  return (
    <div>
      <label className={rotulo}>{nome}</label>
      {children}
      {dica && <p className="mt-1 text-xs text-ink/50">{dica}</p>}
    </div>
  );
}

export function ProgramaTab({ gruposEtapa }: { gruposEtapa: Grupo[] }) {
  const { user } = useAuth();
  const { ehCliente, projeto, programa, aprovacao, saveProjeto, savePrograma, aprovarPrograma } = useData();
  const confirmar = useConfirm();

  const [documento, setDocumento] = useState(false);
  const [dlgProjeto, setDlgProjeto] = useState(false);
  const [amb, setAmb] = useState<AmbientePrograma | "novo" | null>(null);
  const [req, setReq] = useState<Requisito | "novo" | null>(null);
  const [nomeAprov, setNomeAprov] = useState(user?.nome ?? "");

  const vazio = programa.ambientes.length === 0 && programa.requisitos.length === 0;
  const etapaInfo = (nome: string) => gruposEtapa.find((g) => g.nome === nome);
  const dadosOk = Boolean(projeto.cliente.trim() || projeto.endereco.trim());

  async function usarModelo(m: ModeloPrograma) {
    if (!vazio) {
      const ok = await confirmar({
        titulo: "Substituir programa atual?",
        mensagem: `Os ambientes e requisitos atuais serão trocados pelo modelo "${m.nome}". A aprovação do cliente também será desfeita.`,
        confirmar: "Substituir",
        tom: "perigo",
      });
      if (!ok) return;
    }
    await savePrograma(m.gerar());
  }

  async function removerAmbiente(a: AmbientePrograma) {
    const ok = await confirmar({ titulo: "Remover ambiente", mensagem: `Remover "${a.nome}" do programa?`, confirmar: "Remover", tom: "perigo" });
    if (ok) await savePrograma({ ...programa, ambientes: programa.ambientes.filter((x) => x.id !== a.id) });
  }

  async function removerRequisito(r: Requisito) {
    const ok = await confirmar({ titulo: "Remover requisito", mensagem: "Remover este requisito do programa?", confirmar: "Remover", tom: "perigo" });
    if (ok) await savePrograma({ ...programa, requisitos: programa.requisitos.filter((x) => x.id !== r.id) });
  }

  // Mudar o status acompanha a execução; não é mudança de conteúdo, então mantém a aprovação.
  async function ciclarStatus(r: Requisito) {
    await savePrograma(
      { ...programa, requisitos: programa.requisitos.map((x) => (x.id === r.id ? { ...x, status: PROXIMO[x.status] } : x)) },
      { manterAprovacao: true },
    );
  }

  const passos: { titulo: string; estado: string; ok: boolean }[] = [
    { titulo: "Dados do projeto", estado: dadosOk ? "Preenchido" : "Falta preencher", ok: dadosOk },
    { titulo: "Ambientes", estado: programa.ambientes.length > 0 ? `${programa.ambientes.length} cadastrados` : "Nenhum ainda", ok: programa.ambientes.length > 0 },
    { titulo: "Requisitos", estado: programa.requisitos.length > 0 ? `${programa.requisitos.length} cadastrados` : "Nenhum ainda", ok: programa.requisitos.length > 0 },
    { titulo: "Aprovação", estado: aprovacao ? "Aprovado" : "Aguardando cliente", ok: Boolean(aprovacao) },
  ];

  return (
    <div className="space-y-8">
      {/* Passo a passo: deixa claro o que é o programa e em que ponto está */}
      <section aria-label="Passo a passo">
        <p className="mb-3 text-[13px] leading-snug text-ink/65">
          O <strong className="font-semibold text-ink">programa de necessidades</strong> reúne o que o cliente precisa (espaços e requisitos) antes do projeto e do
          orçamento. Preencha, envie o link da obra e o cliente aprova online.
        </p>
        <ol className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-linha bg-linha sm:grid-cols-4">
          {passos.map((p, i) => (
            <li key={p.titulo} className="flex items-start gap-2.5 bg-white p-3">
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-semibold ${
                  p.ok ? "border-emerald-600 bg-emerald-600 text-white" : "border-ink/30 text-ink/45"
                }`}
              >
                {p.ok ? "✓" : i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold leading-tight text-ink">{p.titulo}</p>
                <p className={`mt-0.5 text-xs ${p.ok ? "text-emerald-700" : "text-ink/50"}`}>{p.estado}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Aprovação do cliente */}
      {aprovacao ? (
        <div className="rounded-2xl border border-emerald-600 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <span className="rotulo-tec block text-emerald-800">Programa aprovado</span>
          <strong>{aprovacao.nome}</strong> aprovou em {new Date(aprovacao.em).toLocaleDateString("pt-BR")}.
        </div>
      ) : !vazio && ehCliente ? (
        <div className="prancha space-y-3 p-4">
          <p className="rotulo-tec text-ink/55">Sua aprovação</p>
          <p className="text-sm text-ink/80">Confira os ambientes e requisitos abaixo. Ao aprovar, seu nome e a data ficam registrados.</p>
          <input className={campo} value={nomeAprov} onChange={(e) => setNomeAprov(e.target.value)} placeholder="Seu nome" />
          <button className="btn btn-primario w-full px-4 py-3 text-sm" disabled={!nomeAprov.trim()} onClick={() => aprovarPrograma(nomeAprov.trim())}>
            Aprovar programa de necessidades
          </button>
        </div>
      ) : !vazio ? (
        <p className="rounded-2xl border border-dashed border-ink/30 bg-white/70 px-3 py-2.5 text-[13px] leading-snug text-ink/70">
          <strong className="font-semibold text-ink">Aguardando o cliente.</strong> Ele aprova pela aba Programa, usando o link e o código da obra. Qualquer
          alteração nos ambientes ou requisitos pede nova aprovação.
        </p>
      ) : null}

      {/* Dados do projeto */}
      <section>
        <Secao
          titulo="Dados do projeto"
          descricao={ehCliente ? undefined : "Identificam o projeto no cabeçalho do documento em PDF."}
          acao={!ehCliente ? <button className="btn btn-linha rounded-full px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider" onClick={() => setDlgProjeto(true)}>Editar</button> : undefined}
        />
        <dl className="prancha grid gap-px overflow-hidden bg-linha sm:grid-cols-2">
          {([
            ["Cliente(s)", projeto.cliente],
            ["Tipo de projeto", projeto.tipo],
            ["Endereço", projeto.endereco],
            ["Responsável técnico", [projeto.responsavel, projeto.registro].filter(Boolean).join(" · ")],
          ] as [string, string][]).map(([k, v]) => (
            <div key={k} className="bg-white px-4 py-3">
              <dt className="rotulo-tec text-ink/45">{k}</dt>
              <dd className="mt-1 text-sm text-ink">{v || <span className="text-ink/35">{ehCliente ? "—" : "não informado"}</span>}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Vazio: escolher modelo */}
      {vazio && (
        <section>
          <Secao titulo="Começar" descricao={ehCliente ? undefined : "Escolha um modelo para já vir com ambientes e requisitos sugeridos. Tudo pode ser editado depois."} />
          {ehCliente ? (
            <p className="prancha px-4 py-10 text-center text-sm text-ink/60">O arquiteto ainda não preencheu o programa de necessidades.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {MODELOS_PROGRAMA.map((m) => (
                <button key={m.chave} onClick={() => usarModelo(m)} className="prancha prancha-clicavel clicavel p-4 text-left">
                  <p className="font-semibold text-ink">{m.nome}</p>
                  <p className="mt-1 text-sm text-ink/60">{m.descricao}</p>
                  <p className="mt-3 font-mono text-[11px] font-semibold uppercase tracking-wider text-pitanga">Usar este modelo →</p>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Ambientes */}
      {(!vazio || programa.ambientes.length > 0) && (
        <section>
          <Secao
            titulo="Ambientes"
            descricao="Os espaços da obra e quantos de cada um. A área e a proximidade entre eles são opcionais."
            contagem={programa.ambientes.length}
            acao={!ehCliente ? <button className="btn btn-linha rounded-full px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider" onClick={() => setAmb("novo")}>+ Ambiente</button> : undefined}
          />
          {programa.ambientes.length === 0 ? (
            <p className="prancha px-4 py-8 text-center text-sm text-ink/50">Nenhum ambiente ainda. Use “+ Ambiente” para começar.</p>
          ) : (
            <ul className="prancha divide-y divide-linha overflow-hidden">
              {programa.ambientes.map((a) => (
                <li key={a.id} className="linha-hover flex items-start gap-3 px-4 py-3">
                  <span className="mt-0.5 w-9 shrink-0 font-mono text-sm font-semibold text-pitanga" title="Quantidade">{a.quantidade}×</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{a.nome}</p>
                    {(a.funcao || a.area > 0 || a.proximidade) && (
                      <p className="mt-0.5 text-xs text-ink/55">
                        {[a.funcao, a.area > 0 && `${a.area} m²`, a.proximidade && `próximo de ${a.proximidade}`].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  {!ehCliente && <Acoes nome={a.nome} onEditar={() => setAmb(a)} onRemover={() => removerAmbiente(a)} />}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* Requisitos */}
      {(!vazio || programa.requisitos.length > 0) && (
        <section>
          <Secao
            titulo="Requisitos específicos"
            descricao="Necessidades de uso que viram itens de obra (ex.: carregador de carro elétrico, infraestrutura de wi-fi). Ligue cada uma à etapa do orçamento onde ela é atendida."
            contagem={programa.requisitos.length}
            acao={!ehCliente ? <button className="btn btn-linha rounded-full px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-wider" onClick={() => setReq("novo")}>+ Requisito</button> : undefined}
          />

          {/* Legenda dos status */}
          <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink/60">
            {(Object.keys(STATUS) as StatusRequisito[]).map((k) => (
              <li key={k} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 ${STATUS[k].ponto}`} />
                <strong className="font-semibold text-ink/80">{STATUS[k].rotulo}:</strong> {STATUS[k].dica}
              </li>
            ))}
          </ul>
          {!ehCliente && programa.requisitos.length > 0 && (
            <p className="mb-3 text-xs text-ink/50">Dica: toque na etiqueta de status de um requisito para avançar (Pendente → Previsto → Atendido).</p>
          )}

          {programa.requisitos.length === 0 ? (
            <p className="prancha px-4 py-8 text-center text-sm text-ink/50">Nenhum requisito ainda. Use “+ Requisito” para começar.</p>
          ) : (
            <ul className="prancha divide-y divide-linha overflow-hidden">
              {programa.requisitos.map((r) => {
                const e = r.etapa ? etapaInfo(r.etapa) : undefined;
                const st = STATUS[r.status];
                const etiqueta = (
                  <>
                    <span className={`h-2 w-2 shrink-0 ${st.ponto}`} />
                    {st.rotulo}
                  </>
                );
                return (
                  <li key={r.id} className="linha-hover flex flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-start sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-ink">{r.texto}</p>
                      {(r.ambiente || r.etapa) && (
                        <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink/55">
                          {r.ambiente && <span>Ambiente: <strong className="font-medium text-ink/75">{r.ambiente}</strong></span>}
                          {r.etapa && (
                            <span>
                              Etapa: <strong className="font-medium text-ink/75">{r.etapa}</strong>
                              {e && <span className="ml-1 font-mono">· {brlInt(e.previsto)} ({Math.round(e.previsto > 0 ? (e.pago / e.previsto) * 100 : 0)}% pago)</span>}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                      {ehCliente ? (
                        <span title={st.dica} className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider ${st.classe}`}>
                          {etiqueta}
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => ciclarStatus(r)}
                            title={`${st.dica}. Toque para avançar o status.`}
                            className={`btn clicavel h-9 shrink-0 gap-1.5 rounded-full border px-3 font-mono text-[10px] font-semibold uppercase tracking-wider hover:shadow-[0_6px_14px_-8px_rgba(20,17,15,0.5)] ${st.classe}`}
                          >
                            {etiqueta}
                            <span aria-hidden className="text-ink/40">↻</span>
                          </button>
                          <Acoes nome="requisito" onEditar={() => setReq(r)} onRemover={() => removerRequisito(r)} />
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* Documento */}
      {!vazio && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <button className="btn btn-primario px-4 py-3 text-sm sm:flex-1" onClick={() => setDocumento(true)}>
            Ver documento / gerar PDF
          </button>
          {!ehCliente && (
            <details className="relative sm:flex-1">
              <summary className="btn btn-linha w-full cursor-pointer list-none px-4 py-3 font-mono text-[11px] font-semibold uppercase tracking-wider">
                Trocar por outro modelo
              </summary>
              <div className="prancha absolute inset-x-0 z-10 mt-1 grid">
                {MODELOS_PROGRAMA.map((m) => (
                  <button key={m.chave} onClick={() => usarModelo(m)} className="linha-hover border-b border-linha px-4 py-3 text-left last:border-b-0">
                    <p className="text-sm font-semibold text-ink">{m.nome}</p>
                    <p className="text-xs text-ink/55">{m.descricao}</p>
                  </button>
                ))}
              </div>
            </details>
          )}
        </div>
      )}

      {documento && <ProgramaDocumento onFechar={() => setDocumento(false)} />}

      <ProjetoDialog aberto={dlgProjeto} onFechar={() => setDlgProjeto(false)} projeto={projeto} onSalvar={saveProjeto} />
      <AmbienteDialog
        aberto={amb !== null}
        onFechar={() => setAmb(null)}
        ambiente={amb && amb !== "novo" ? amb : null}
        onSalvar={async (a) => {
          const existe = programa.ambientes.some((x) => x.id === a.id);
          await savePrograma({
            ...programa,
            ambientes: existe ? programa.ambientes.map((x) => (x.id === a.id ? a : x)) : [...programa.ambientes, a],
          });
        }}
      />
      <RequisitoDialog
        aberto={req !== null}
        onFechar={() => setReq(null)}
        requisito={req && req !== "novo" ? req : null}
        ambientes={programa.ambientes.map((a) => a.nome)}
        etapas={gruposEtapa.map((g) => g.nome)}
        onSalvar={async (r) => {
          const existe = programa.requisitos.some((x) => x.id === r.id);
          await savePrograma({
            ...programa,
            requisitos: existe ? programa.requisitos.map((x) => (x.id === r.id ? r : x)) : [...programa.requisitos, r],
          });
        }}
      />
    </div>
  );
}

const btnSalvar = "btn btn-primario w-full px-4 py-3 text-sm";

function ProjetoDialog({ aberto, onFechar, projeto, onSalvar }: { aberto: boolean; onFechar: () => void; projeto: Projeto; onSalvar: (p: Projeto) => Promise<void> }) {
  const [f, setF] = useState<Projeto>(projeto);
  useEffect(() => {
    if (aberto) setF(projeto);
  }, [aberto, projeto]);
  const set = (k: keyof Projeto) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Dados do projeto">
      <div className="space-y-4">
        <Campo nome="Cliente(s)" dica="Quem contrata o projeto."><input className={campo} value={f.cliente} onChange={set("cliente")} placeholder="Ex.: Gabriel e Mariana" /></Campo>
        <Campo nome="Tipo de projeto"><input className={campo} value={f.tipo} onChange={set("tipo")} placeholder="Ex.: Reforma residencial" /></Campo>
        <Campo nome="Endereço da obra"><input className={campo} value={f.endereco} onChange={set("endereco")} placeholder="Rua, número, bairro, cidade" /></Campo>
        <Campo nome="Responsável técnico"><input className={campo} value={f.responsavel} onChange={set("responsavel")} placeholder="Nome do arquiteto" /></Campo>
        <Campo nome="Registro profissional" dica="CAU ou CREA, aparece abaixo da assinatura no PDF."><input className={campo} value={f.registro} onChange={set("registro")} placeholder="Ex.: CAU/BR A000000-0" /></Campo>
        <button className={btnSalvar} onClick={async () => { await onSalvar(f); onFechar(); }}>Salvar dados</button>
      </div>
    </Modal>
  );
}

function AmbienteDialog({ aberto, onFechar, ambiente, onSalvar }: { aberto: boolean; onFechar: () => void; ambiente: AmbientePrograma | null; onSalvar: (a: AmbientePrograma) => Promise<void> }) {
  const [nome, setNome] = useState("");
  const [qtd, setQtd] = useState("1");
  const [funcao, setFuncao] = useState("");
  const [area, setArea] = useState("");
  const [prox, setProx] = useState("");

  useEffect(() => {
    if (!aberto) return;
    setNome(ambiente?.nome ?? "");
    setQtd(String(ambiente?.quantidade ?? 1));
    setFuncao(ambiente?.funcao ?? "");
    setArea(ambiente && ambiente.area > 0 ? String(ambiente.area) : "");
    setProx(ambiente?.proximidade ?? "");
  }, [aberto, ambiente]);

  async function salvar() {
    await onSalvar({
      id: ambiente?.id ?? crypto.randomUUID(),
      nome: nome.trim(),
      quantidade: Math.max(1, Number(qtd) || 1),
      funcao: funcao.trim(),
      area: Number(area) || 0,
      proximidade: prox.trim(),
    });
    onFechar();
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={ambiente ? "Editar ambiente" : "Novo ambiente"}>
      <div className="space-y-4">
        <div className="grid grid-cols-[1fr_88px] gap-3">
          <Campo nome="Nome do ambiente"><input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Suíte" /></Campo>
          <Campo nome="Qtd."><input className={campo} type="number" inputMode="numeric" value={qtd} onChange={(e) => setQtd(e.target.value)} /></Campo>
        </div>
        <Campo nome="Função / observação" dica="Para que o espaço será usado. Opcional."><input className={campo} value={funcao} onChange={(e) => setFuncao(e.target.value)} placeholder="Ex.: Games ou academia" /></Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo nome="Área aprox. (m²)"><input className={campo} type="number" inputMode="decimal" value={area} onChange={(e) => setArea(e.target.value)} placeholder="Opcional" /></Campo>
          <Campo nome="Próximo de"><input className={campo} value={prox} onChange={(e) => setProx(e.target.value)} placeholder="Ex.: Cozinha" /></Campo>
        </div>
        <button className={btnSalvar} disabled={!nome.trim()} onClick={salvar}>Salvar ambiente</button>
      </div>
    </Modal>
  );
}

function RequisitoDialog({ aberto, onFechar, requisito, ambientes, etapas, onSalvar }: { aberto: boolean; onFechar: () => void; requisito: Requisito | null; ambientes: string[]; etapas: string[]; onSalvar: (r: Requisito) => Promise<void> }) {
  const [texto, setTexto] = useState("");
  const [ambiente, setAmbiente] = useState("");
  const [etapa, setEtapa] = useState("");

  useEffect(() => {
    if (!aberto) return;
    setTexto(requisito?.texto ?? "");
    setAmbiente(requisito?.ambiente ?? "");
    setEtapa(requisito?.etapa ?? "");
  }, [aberto, requisito]);

  async function salvar() {
    await onSalvar({
      id: requisito?.id ?? crypto.randomUUID(),
      texto: texto.trim(),
      ambiente,
      etapa,
      status: requisito?.status ?? "pendente",
    });
    onFechar();
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={requisito ? "Editar requisito" : "Novo requisito"}>
      <div className="space-y-4">
        <Campo nome="Requisito" dica="Descreva a necessidade em uma frase.">
          <textarea className={`${campo} resize-none`} rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ex.: Pré-instalação de cabeamento de rede wi-fi" />
        </Campo>
        <Campo nome="Ambiente" dica="Escolha “Geral” se vale para a obra toda.">
          <select className={campo} value={ambiente} onChange={(e) => setAmbiente(e.target.value)}>
            <option value="">Geral (toda a obra)</option>
            {ambientes.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </Campo>
        <Campo nome="Etapa do orçamento onde é atendido" dica="Liga o pedido do cliente ao custo e ao andamento daquela etapa.">
          <select className={campo} value={etapa} onChange={(e) => setEtapa(e.target.value)} disabled={etapas.length === 0}>
            <option value="">{etapas.length === 0 ? "Cadastre o orçamento para vincular" : "Não vinculado"}</option>
            {etapas.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </Campo>
        <button className={btnSalvar} disabled={!texto.trim()} onClick={salvar}>Salvar requisito</button>
      </div>
    </Modal>
  );
}
