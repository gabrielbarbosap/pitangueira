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
  /** Marca do escritório nos documentos em PDF. */
  escritorio: string;
  contato: string;
  /** Cor de destaque (hex) dos documentos. Vazio = cor padrão. */
  cor: string;
  /** Logo reduzida, como data URL (guardada no próprio documento da obra). */
  logo: string;
}

export const PROJETO_VAZIO: Projeto = {
  cliente: "",
  endereco: "",
  tipo: "",
  responsavel: "",
  registro: "",
  escritorio: "",
  contato: "",
  cor: "",
  logo: "",
};

/** Item do catálogo pessoal do arquiteto (serve a todas as obras dele). */
export interface CatalogoItem {
  id: string;
  descricao: string;
  unidade: string;
  valorUnitario: number;
  etapa: string;
  createdAt?: number;
}

/** Marca e dados padrão do arquiteto, reaproveitados nas obras novas. */
export type PerfilArquiteto = Pick<Projeto, "escritorio" | "contato" | "cor" | "logo" | "responsavel" | "registro">;

export const PERFIL_VAZIO: PerfilArquiteto = { escritorio: "", contato: "", cor: "", logo: "", responsavel: "", registro: "" };

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
  /** Itens do orçamento que atendem este requisito (rastreabilidade pedido → custo → andamento). */
  itensIds?: string[];
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
  /** Previsões de prazo, da mais antiga (a original) à mais recente. Só cresce: ver `Previsao`. */
  previsoes?: Previsao[];
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
  /** Unidade de medida (m², un, vb…). */
  unidade?: string;
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
  /** Prazo combinado para o serviço ficar pronto (ms). Base do histórico de entregas do fornecedor. */
  prazo?: number;
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
  nomeObra: "Projeto",
  orcamentoTotal: 0,
};

// ---------- Composições de custo (pessoais do arquiteto) ----------

export type TipoInsumo = "material" | "mao_de_obra" | "equipamento";

export const ROTULO_INSUMO: Record<TipoInsumo, string> = {
  material: "Material",
  mao_de_obra: "Mão de obra",
  equipamento: "Equipamento",
};

/** Um insumo de uma composição: quanto dele entra em 1 unidade do serviço (ex.: 0,3 L de tinta por m²). */
export interface InsumoComposicao {
  id: string;
  descricao: string;
  unidade: string;
  /** Quantidade consumida por 1 unidade da composição. */
  quantidade: number;
  valorUnitario: number;
  tipo: TipoInsumo;
  /** Quando vem do catálogo, o preço acompanha o catálogo (se o preço de lá mudar, a composição muda). */
  catalogoId?: string;
}

/** Serviço composto: custo direto dos insumos + BDI + margem = preço de 1 unidade. */
export interface Composicao {
  id: string;
  nome: string;
  /** Unidade do serviço (m², m, un…). */
  unidade: string;
  etapa: string;
  insumos: InsumoComposicao[];
  /** BDI (benefícios e despesas indiretas), em %. */
  bdi: number;
  /** Margem de lucro, em %. */
  margem: number;
  createdAt?: number;
}

// ---------- Fornecedores (pessoais do arquiteto) ----------

export interface Fornecedor {
  id: string;
  nome: string;
  /** Especialidade: pedreiro, eletricista, marmoraria… */
  categoria: string;
  telefone: string;
  email: string;
  observacao: string;
  /** Nota própria de 1 a 5 (0 = sem nota). */
  nota: number;
  createdAt?: number;
}

// ---------- Financeiro do escritório (pessoal do arquiteto) ----------

export interface Parcela {
  id: string;
  descricao: string;
  valor: number;
  /** Vencimento (meia-noite local, em ms). */
  vencimento: number;
  /** Quando foi recebida; null = a receber. */
  recebidoEm: number | null;
}

/** Contrato de honorários de um projeto, com as parcelas a receber. */
export interface Honorario {
  id: string;
  projetoId: string;
  projetoNome: string;
  cliente: string;
  descricao: string;
  parcelas: Parcela[];
  createdAt?: number;
}

// ---------- Prazo do projeto (previsões que só crescem) ----------

/**
 * Uma previsão de prazo do projeto. A lista `previsoes` da obra só cresce: a nº 1 é o prazo original e
 * nunca muda; cada nova previsão (2, 3…) é acrescentada ao lado, com data, autor e motivo. Nada se edita nem se apaga.
 */
export interface Previsao {
  id: string;
  /** 1 = previsão original; 2 em diante = novas previsões. */
  numero: number;
  /** Início e término previstos (meia-noite local, em ms). */
  inicio: number;
  termino: number;
  /** Duração em dias corridos (término − início). */
  dias: number;
  registradaEm: number;
  registradaPor: string;
  /** Por que o prazo mudou. Obrigatório nas novas previsões; a original traz uma observação opcional. */
  motivo: string;
}
