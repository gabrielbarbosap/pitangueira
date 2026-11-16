import type { RegistroTelemetria } from "./telemetria";

const DIA = 86_400_000;
const chaveDia = (ms: number) => new Date(ms).toLocaleDateString("sv-SE"); // AAAA-MM-DD, no fuso local

export interface ResumoUso {
  /** Contas diferentes que usaram o app no período. */
  usuarios: number;
  arquitetos: number;
  clientes: number;
  /** Clientes que abriram o projeto em 2 dias diferentes ou mais: a métrica que diz se o link é útil. */
  clientesRecorrentes: number;
  itensAdicionados: number;
  itensMarcados: number;
  documentos: number;
  whatsapp: number;
  erros: number;
  /** Eventos por dia (do mais antigo ao mais recente), para o gráfico de barras. */
  porDia: { dia: string; eventos: number; usuarios: number }[];
  /** Quantas vezes cada evento aconteceu. */
  porEvento: [string, number][];
}

export function resumirUso(registros: RegistroTelemetria[], dias: number, agora: number): ResumoUso {
  const desde = agora - dias * DIA;
  const lista = registros.filter((r) => r.em >= desde);
  const eventos = lista.filter((r) => r.tipo === "evento");
  const conta = (nome: string) => eventos.filter((e) => e.nome === nome).length;

  const contas = (papel?: string) => new Set(eventos.filter((e) => e.uid !== "anonimo" && (!papel || e.papel === papel)).map((e) => e.uid));

  const diasPorCliente = new Map<string, Set<string>>();
  for (const e of eventos) {
    if (e.nome !== "sessao_iniciada" || e.papel !== "cliente") continue;
    (diasPorCliente.get(e.uid) ?? diasPorCliente.set(e.uid, new Set()).get(e.uid)!).add(chaveDia(e.em));
  }

  const porDia: ResumoUso["porDia"] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const k = chaveDia(agora - i * DIA);
    const doDia = eventos.filter((e) => chaveDia(e.em) === k);
    porDia.push({ dia: k, eventos: doDia.length, usuarios: new Set(doDia.filter((e) => e.uid !== "anonimo").map((e) => e.uid)).size });
  }

  const mapa = new Map<string, number>();
  for (const e of eventos) mapa.set(e.nome, (mapa.get(e.nome) ?? 0) + 1);

  return {
    usuarios: contas().size,
    arquitetos: contas("arquiteto").size,
    clientes: contas("cliente").size,
    clientesRecorrentes: [...diasPorCliente.values()].filter((d) => d.size >= 2).length,
    itensAdicionados: conta("item_adicionado"),
    itensMarcados: conta("item_marcado"),
    documentos: conta("documento_aberto"),
    whatsapp: conta("pdf_whatsapp"),
    erros: lista.filter((r) => r.tipo === "erro").length,
    porDia,
    porEvento: [...mapa.entries()].sort((a, b) => b[1] - a[1]),
  };
}
