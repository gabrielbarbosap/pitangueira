// Modelo de dados do SaaS multi-tenant de obras.
// Arquiteto (dono) cria N obras; cada obra tem seus próprios itens e uma chave
// de acesso para os clientes. Isolamento: itens vivem DENTRO da obra.

/** Dados do projeto (cabeçalho dos documentos). Strings vazias em vez de undefined (Firestore). */
export interface Projeto {
  cliente: string;
  endereco: string;
  tipo: string;
  responsavel: string;
  /** Registro profissional do responsável (CAU/CREA). */
  registro: string;
}

export const PROJETO_VAZIO: Projeto = { cliente: "", endereco: "", tipo: "", responsavel: "", registro: "" };

export interface AmbientePrograma {
  id: string;
  nome: string;
  quantidade: number;
  funcao: string;
  /** m² aproximados (0 = não informado). */
  area: number;
  /** Relações de proximidade com outros ambientes (texto livre). */
  proximidade: string;
}

export type StatusRequisito = "pendente" | "previsto" | "atendido";

export interface Requisito {
  id: string;
  texto: string;
  /** Ambiente a que se refere (vazio = geral). */
  ambiente: string;
  /** Etapa do orçamento onde esse requisito é atendido (vazio = não vinculado). */
  etapa: string;
  status: StatusRequisito;
}

/** Programa de necessidades: o que o cliente precisa, antes do projeto e do orçamento. */
export interface Programa {
  ambientes: AmbientePrograma[];
  requisitos: Requisito[];
}

export const PROGRAMA_VAZIO: Programa = { ambientes: [], requisitos: [] };

export interface AprovacaoPrograma {
  nome: string;
  em: number;
}

/** Agregado da obra, gravado no próprio documento para a home não ler todos os itens. */
export interface ResumoObra {
  previsto: number;
  pago: number;
  itens: number;
  feitos: number;
  concluidos: number;
}

export interface Obra {
  id: string;
  resumo?: ResumoObra;
  /** Obra guardada fora da lista principal. Nada é apagado; pode ser restaurada. */
  arquivada?: boolean;
  arquivadaEm?: number;
  projeto?: Projeto;
  programa?: Programa;
  /** Aprovação do cliente; é apagada quando o arquiteto altera o programa. */
  programaAprovacao?: AprovacaoPrograma;
  /** UID do arquiteto dono. */
  ownerUid: string;
  ownerEmail?: string;
  /** Co-donos por e-mail (exceção: só a Casa Pitanga tem vários arquitetos). */
  ownerEmails?: string[];
  nome: string;
  /** Chave que o arquiteto passa aos clientes para acessarem esta obra. */
  accessCode: string;
  /** Orçamento total disponível (o teto). */
  orcamentoTotal: number;
  createdAt?: number;
  updatedAt?: number;
}

/** Dados que o arquiteto informa ao criar/editar uma obra. */
export type ObraInput = {
  nome: string;
  accessCode: string;
  orcamentoTotal: number;
};

export interface Item {
  id: string;
  etapaNum: number;
  etapa: string;
  ambiente: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorOrcado: number;
  valorReal: number;
  feito: boolean;
  pago: boolean;
  /** Auditoria: quem/quando marcou. */
  feitoPor?: string;
  feitoEm?: number;
  pagoPor?: string;
  pagoEm?: number;
  fornecedor?: string;
  observacao?: string;
  ordem: number;
  createdAt?: number;
  updatedAt?: number;
}

export type ItemInput = Omit<Item, "id" | "createdAt" | "updatedAt">;

export type Agrupamento = "etapa" | "ambiente";

/** Vínculo de um cliente (anônimo) com uma obra, criado ao digitar o código. */
export interface Membro {
  uid: string;
  nome: string;
  role: "cliente";
  createdAt?: number;
}

/** Config exibida no dashboard — derivada da própria obra. */
export interface Config {
  nomeObra: string;
  orcamentoTotal: number;
}

export const CONFIG_PADRAO: Config = {
  nomeObra: "Obra",
  orcamentoTotal: 0,
};
