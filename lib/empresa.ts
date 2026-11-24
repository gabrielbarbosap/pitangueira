/**
 * Dados da empresa que aparecem nos Termos de uso. Preencha quando tiver: o que estiver vazio não aparece na página
 * (e o texto remete aos canais de atendimento do app). Não invente: estes dados valem como identificação legal.
 */
export const EMPRESA = {
  nome: "Pitangueira",
  /** Nome do responsável (pessoa física) ou razão social (pessoa jurídica). */
  razaoSocial: "Gabriel Barbosa Pereira",
  /** Pessoa jurídica: preencha o CNPJ. Pessoa física: deixe vazio e use `cpf`. */
  cnpj: "",
  /** Pessoa física: CPF do responsável. Aparece nos Termos, que são públicos. */
  cpf: "701.983.354-31",
  /** E-mail de suporte e de pedidos de cancelamento/reembolso. */
  email: "gabriel@sistemap.com.br",
  /** Cidade/UF do foro (consumidor sempre pode usar o foro do próprio domicílio). */
  foro: "Recife/PE",
};

export const TERMOS_ATUALIZADOS_EM = "24 de novembro de 2026";
export const CANCELAMENTO_DIAS = 7;
