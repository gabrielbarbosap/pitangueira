/**
 * Planos da Pitangueira: o que cada um permite. É a ÚNICA fonte dos limites e dos recursos: a interface, o servidor e a
 * página de planos leem daqui. Mudar um limite é mudar um número neste arquivo.
 *
 * Regras combinadas:
 *  - "Obra em andamento" é a que NÃO está arquivada. Arquivar libera a vaga; restaurar ocupa uma.
 *  - Quem passa do limite é BLOQUEADO (de criar, restaurar ou adicionar mais) e vê o motivo. Nada é apagado.
 *  - O cliente (acesso por código) é ilimitado em todos os planos.
 *  - Teste grátis de 5 dias com os recursos da Safra, a partir da criação da conta.
 */

export type PlanoId = "broto" | "safra" | "pomar";

/** Recursos que dependem do plano (os demais valem para todos). */
export type Recurso =
  | "relatorioMensal"
  | "acompanharCompleto" // visitas, ocorrências e vistoria (a linha do tempo é de todos)
  | "composicoes"
  | "escopo" // programa de necessidades e aprovação do cliente
  | "previsoesNovas" // registrar nova previsão de prazo (a primeira é de todos)
  | "financeiro" // honorários e parcelas do escritório
  | "financeiroCompleto" // previsão de 90 dias, inadimplência e atrasos
  | "pdfSemSelo"
  | "equipe" // vários usuários no mesmo projeto (em breve)
  | "exportar"; // Excel e CSV (em breve)

export interface DefPlano {
  id: PlanoId;
  nome: string;
  frase: string;
  /** Projetos em andamento (não arquivados). null = ilimitado. */
  obrasAtivas: number | null;
  /** Itens no catálogo pessoal. null = ilimitado. */
  catalogoItens: number | null;
  /** Fornecedores cadastrados. null = ilimitado. */
  fornecedores: number | null;
  recursos: Record<Recurso, boolean>;
  /** O que vale mostrar na página de planos. */
  inclui: string[];
  destaque?: boolean;
}

const SO_SAFRA: Recurso[] = ["relatorioMensal", "acompanharCompleto", "composicoes", "escopo", "previsoesNovas", "financeiro", "pdfSemSelo"];
const SO_POMAR: Recurso[] = ["financeiroCompleto", "equipe", "exportar"];
const recursos = (ligados: Recurso[]) => Object.fromEntries([...SO_SAFRA, ...SO_POMAR].map((r) => [r, ligados.includes(r)])) as Record<Recurso, boolean>;

export const PLANOS: Record<PlanoId, DefPlano> = {
  broto: {
    id: "broto",
    nome: "Broto",
    frase: "Para começar a organizar as obras",
    obrasAtivas: 2,
    catalogoItens: 200,
    fornecedores: 7,
    recursos: recursos([]),
    inclui: [
      "Até 2 projetos em andamento",
      "Orçamento completo, com importação de planilha",
      "Acesso do cliente por código, sem limite",
      "Linha do tempo e mensagens de WhatsApp",
      "Gráficos e a previsão inicial do prazo",
      "Cobrança avulsa em PDF",
      "Catálogo de até 200 itens e 7 fornecedores",
      "PDF com a marca do escritório e o selo Pitangueira",
    ],
  },
  safra: {
    id: "safra",
    nome: "Safra",
    frase: "O mais escolhido: tudo para tocar a obra",
    obrasAtivas: 5,
    catalogoItens: null,
    fornecedores: null,
    recursos: recursos(SO_SAFRA),
    destaque: true,
    inclui: [
      "Tudo do Broto",
      "Até 5 projetos em andamento",
      "Relatório mensal da obra",
      "Visitas com aprovação, ocorrências e vistoria final",
      "Composições com BDI e margem",
      "Escopo e programa de necessidades",
      "Novas previsões de prazo, com histórico",
      "Financeiro dos honorários",
      "Catálogo e fornecedores sem limite",
      "PDF sem o selo Pitangueira",
    ],
  },
  pomar: {
    id: "pomar",
    nome: "Pomar",
    frase: "Para escritórios e equipes",
    obrasAtivas: null,
    catalogoItens: null,
    fornecedores: null,
    recursos: recursos([...SO_SAFRA, ...SO_POMAR]),
    inclui: [
      "Tudo da Safra",
      "Projetos em andamento sem limite",
      "Financeiro completo: previsão de 90 dias e inadimplência",
      "Equipe: vários usuários (em breve)",
      "Exportação para Excel e CSV (em breve)",
      "Suporte prioritário",
    ],
  },
};

export const ORDEM_PLANOS: PlanoId[] = ["broto", "safra", "pomar"];
export const TESTE_DIAS = 5;
export const PLANO_DO_TESTE: PlanoId = "safra";
const DIA = 86_400_000;

/** O registro da assinatura de um arquiteto (`assinaturas/{uid}`). Só o servidor grava. */
export interface Assinatura {
  plano: PlanoId;
  /**
   * ativa: assinatura paga em dia · cortesia: acesso dado sem cobrança, até mudarmos · atrasada: pagamento falhou
   * (vale até `carenciaAte`) · cancelada: vale até o fim do período já pago (`ate`).
   */
  status: "ativa" | "cortesia" | "atrasada" | "cancelada";
  /** Fim do período (ms). Vazio = sem data de fim. */
  ate?: number;
  carenciaAte?: number;
  /** Texto mostrado ao usuário (ex.: aviso de que o plano de cortesia vai mudar). */
  aviso?: string;
  atualizadoEm?: number;
}

export type OrigemPlano = "assinatura" | "cortesia" | "teste" | "sem-assinatura";

export interface PlanoEfetivo {
  plano: PlanoId;
  origem: OrigemPlano;
  /** Teste grátis: quando acaba (ms) e quantos dias faltam. */
  testeAte?: number;
  diasDeTeste?: number;
  /** Pagamento atrasado, ainda no período de carência. */
  atrasada?: boolean;
  aviso?: string;
}

/**
 * Qual plano vale agora. Com assinatura em vigor, o da assinatura. Sem assinatura, os primeiros 5 dias são o teste da
 * Safra; depois disso, vale o Broto (com os limites dele) até a pessoa assinar. `criadoEm` é quando a conta nasceu.
 */
export function planoEfetivo(assinatura: Assinatura | null, criadoEm: number | null, agora: number): PlanoEfetivo {
  if (assinatura) {
    const emVigor = assinatura.ate === undefined || assinatura.ate > agora;
    if (assinatura.status === "cortesia" && emVigor) return { plano: assinatura.plano, origem: "cortesia", aviso: assinatura.aviso };
    if (assinatura.status === "ativa" && emVigor) return { plano: assinatura.plano, origem: "assinatura", aviso: assinatura.aviso };
    if (assinatura.status === "atrasada" && (assinatura.carenciaAte ?? 0) > agora) return { plano: assinatura.plano, origem: "assinatura", atrasada: true, aviso: assinatura.aviso };
    if (assinatura.status === "cancelada" && emVigor && assinatura.ate !== undefined) return { plano: assinatura.plano, origem: "assinatura", aviso: assinatura.aviso };
    return { plano: "broto", origem: "sem-assinatura" };
  }
  if (criadoEm !== null) {
    const fim = criadoEm + TESTE_DIAS * DIA;
    if (agora < fim) return { plano: PLANO_DO_TESTE, origem: "teste", testeAte: fim, diasDeTeste: Math.max(1, Math.ceil((fim - agora) / DIA)) };
  }
  return { plano: "broto", origem: "sem-assinatura" };
}

/** O menor plano que tem o recurso (para dizer "disponível na Safra"). */
export function planoMinimo(recurso: Recurso): PlanoId {
  return ORDEM_PLANOS.find((p) => PLANOS[p].recursos[recurso]) ?? "pomar";
}

/** Por que um recurso está bloqueado, em português, para mostrar à pessoa. */
export const MOTIVO_RECURSO: Record<Recurso, { titulo: string; texto: string }> = {
  relatorioMensal: { titulo: "Relatório mensal", texto: "O relatório mensal da obra, com o que foi feito e pago no mês, está disponível a partir do plano Safra." },
  acompanharCompleto: { titulo: "Visitas, ocorrências e vistoria", texto: "Marcar visitas com aprovação do cliente, registrar ocorrências e fazer a vistoria final estão disponíveis a partir do plano Safra. A linha do tempo continua liberada." },
  composicoes: { titulo: "Composições de custo", texto: "Montar serviços com insumos, BDI e margem está disponível a partir do plano Safra." },
  escopo: { titulo: "Escopo e programa de necessidades", texto: "O programa de necessidades, com a aprovação do cliente, está disponível a partir do plano Safra." },
  previsoesNovas: { titulo: "Nova previsão de prazo", texto: "O plano Broto registra só a previsão inicial do prazo. Registrar novas previsões, com o histórico de cada atraso, está disponível a partir do plano Safra." },
  financeiro: { titulo: "Financeiro dos honorários", texto: "Cadastrar honorários em parcelas e acompanhar o que há a receber está disponível a partir do plano Safra." },
  financeiroCompleto: { titulo: "Financeiro completo", texto: "A previsão de 90 dias, a média mensal e a inadimplência estão disponíveis no plano Pomar." },
  pdfSemSelo: { titulo: "PDF sem o selo", texto: "Os PDFs do plano Broto levam o selo Pitangueira. A partir do plano Safra eles saem só com a marca do seu escritório." },
  equipe: { titulo: "Equipe", texto: "Vários usuários no mesmo projeto estarão disponíveis no plano Pomar." },
  exportar: { titulo: "Exportação", texto: "Exportar os dados para Excel e CSV estará disponível no plano Pomar." },
};

export type LimiteDe = "obrasAtivas" | "catalogoItens" | "fornecedores";

const NOME_LIMITE: Record<LimiteDe, { um: string; varios: string; acao: string; dica: string }> = {
  obrasAtivas: {
    um: "projeto em andamento",
    varios: "projetos em andamento",
    acao: "criar ou restaurar um projeto",
    dica: "Arquive um projeto concluído para liberar a vaga (nada é apagado), ou conheça um plano com mais projetos.",
  },
  catalogoItens: { um: "item no catálogo", varios: "itens no catálogo", acao: "adicionar mais itens ao catálogo", dica: "Remova itens que não usa mais, ou conheça um plano sem esse limite." },
  fornecedores: { um: "fornecedor", varios: "fornecedores", acao: "cadastrar mais fornecedores", dica: "Remova fornecedores que não usa mais, ou conheça um plano sem esse limite." },
};

export interface Bloqueio {
  titulo: string;
  texto: string;
  dica: string;
  /** O menor plano que resolve. */
  sugestao: PlanoId | null;
}

/** Quantos cabem ainda. null = sem limite. */
export function vagas(def: DefPlano, tipo: LimiteDe, usados: number): number | null {
  const limite = def[tipo];
  return limite === null ? null : Math.max(0, limite - usados);
}

/** Se o limite foi atingido, devolve o motivo e o que fazer; senão nulo. */
export function bloqueioDeLimite(def: DefPlano, tipo: LimiteDe, usados: number): Bloqueio | null {
  const limite = def[tipo];
  if (limite === null || usados < limite) return null;
  const n = NOME_LIMITE[tipo];
  const sugestao = ORDEM_PLANOS.find((p) => { const l = PLANOS[p][tipo]; return l === null || l > limite; }) ?? null;
  return {
    titulo: `Limite do plano ${def.nome} atingido`,
    texto: `O plano ${def.nome} permite ${limite} ${limite === 1 ? n.um : n.varios}, e você já tem ${usados}. Por isso não dá para ${n.acao}.`,
    dica: n.dica,
    sugestao,
  };
}

export const LIMITE_FRASE = (def: DefPlano, tipo: LimiteDe) => {
  const l = def[tipo];
  return l === null ? "sem limite" : `até ${l}`;
};

/** Erro lançado quando uma ação passa do limite do plano: leva o motivo pronto para mostrar. */
export class ErroDePlano extends Error {
  constructor(public bloqueio: Bloqueio) {
    super(bloqueio.texto);
    this.name = "ErroDePlano";
  }
}

/** Um pagamento da assinatura (`assinaturas/{uid}/recibos/{id}`, gravado pelo servidor a partir do Stripe). */
export interface Recibo {
  id: string;
  /** Quando foi pago (ms). */
  em: number;
  /** Valor em centavos de real. */
  valor: number;
  descricao: string;
  plano?: PlanoId;
  status: "paga" | "reembolsada";
  /** Endereço do recibo hospedado pelo Stripe. */
  url?: string;
}
