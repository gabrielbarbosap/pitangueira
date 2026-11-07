// Histórico de desempenho dos fornecedores, calculado a partir dos itens de todos os projetos do arquiteto.
import type { Fornecedor, Item } from "./types";
import { valorEfetivo } from "./calc";

export interface ItemDeProjeto extends Item {
  projetoId: string;
  projetoNome: string;
}

const DIA = 86_400_000;

/** Junta nomes que só diferem em maiúsculas, acentos e espaços ("João  Pedreiro" = "joao pedreiro"). */
export function chaveFornecedor(nome: string): string {
  return (nome || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

export interface Desempenho {
  chave: string;
  nome: string;
  cadastro?: Fornecedor;
  /** Itens em que ele aparece, e em quantos projetos. */
  itens: number;
  projetos: number;
  /** Soma do orçado dos itens dele. */
  contratado: number;
  /** Itens com valor real informado: base da comparação custo × orçado. */
  comReal: number;
  orcadoDosComReal: number;
  realDosComReal: number;
  /** (real − orçado) ÷ orçado, em %. Positivo = custou mais. null = sem itens com valor real. */
  desvioPct: number | null;
  /** Entregas (itens feitos que tinham prazo): quantas foram no prazo e quantas atrasaram. */
  entregas: number;
  noPrazo: number;
  atrasadas: number;
  /** Média de dias de atraso das entregas atrasadas. */
  mediaAtraso: number;
  /** % de entregas no prazo. null = nenhuma entrega com prazo ainda. */
  pctNoPrazo: number | null;
  /** Itens com prazo vencido que ainda não foram feitos. */
  vencidosAbertos: number;
}

const vazio = (chave: string, nome: string, cadastro?: Fornecedor): Desempenho => ({
  chave,
  nome,
  cadastro,
  itens: 0,
  projetos: 0,
  contratado: 0,
  comReal: 0,
  orcadoDosComReal: 0,
  realDosComReal: 0,
  desvioPct: null,
  entregas: 0,
  noPrazo: 0,
  atrasadas: 0,
  mediaAtraso: 0,
  pctNoPrazo: null,
  vencidosAbertos: 0,
});

/**
 * Desempenho de cada fornecedor: os cadastrados (mesmo sem histórico) e os que só aparecem nos itens.
 * `agora` entra por parâmetro para o cálculo de "prazo vencido" ser previsível.
 */
export function calcularDesempenho(itens: ItemDeProjeto[], cadastro: Fornecedor[], agora: number): Desempenho[] {
  const mapa = new Map<string, Desempenho>();
  const projetosPorChave = new Map<string, Set<string>>();
  const atrasosPorChave = new Map<string, number[]>();

  for (const f of cadastro) mapa.set(chaveFornecedor(f.nome), vazio(chaveFornecedor(f.nome), f.nome, f));

  for (const i of itens) {
    const nome = (i.fornecedor ?? "").trim();
    if (!nome) continue;
    const chave = chaveFornecedor(nome);
    const d = mapa.get(chave) ?? vazio(chave, nome);
    mapa.set(chave, d);

    d.itens += 1;
    d.contratado += i.valorOrcado;
    (projetosPorChave.get(chave) ?? projetosPorChave.set(chave, new Set()).get(chave)!).add(i.projetoId);

    if (i.valorReal > 0) {
      d.comReal += 1;
      d.orcadoDosComReal += i.valorOrcado;
      d.realDosComReal += valorEfetivo(i);
    }
    if (i.prazo) {
      if (i.feito && i.feitoEm) {
        d.entregas += 1;
        if (i.feitoEm <= i.prazo) d.noPrazo += 1;
        else {
          d.atrasadas += 1;
          (atrasosPorChave.get(chave) ?? atrasosPorChave.set(chave, []).get(chave)!).push(Math.ceil((i.feitoEm - i.prazo) / DIA));
        }
      } else if (!i.feito && i.prazo < agora) {
        d.vencidosAbertos += 1;
      }
    }
  }

  for (const [chave, d] of mapa) {
    d.projetos = projetosPorChave.get(chave)?.size ?? 0;
    d.desvioPct = d.orcadoDosComReal > 0 ? ((d.realDosComReal - d.orcadoDosComReal) / d.orcadoDosComReal) * 100 : null;
    const atrasos = atrasosPorChave.get(chave) ?? [];
    d.mediaAtraso = atrasos.length > 0 ? Math.round(atrasos.reduce((s, x) => s + x, 0) / atrasos.length) : 0;
    d.pctNoPrazo = d.entregas > 0 ? Math.round((d.noPrazo / d.entregas) * 100) : null;
  }

  return [...mapa.values()].sort((a, b) => b.itens - a.itens || a.nome.localeCompare(b.nome, "pt-BR"));
}
