// Constantes do modo demo (sem Firebase).
export const DEMO_OBRA_ID = "demo-casa-pitanga";
export const LS_OBRAS = "reforma:obras:v2";
/** E-mails dos arquitetos que co-gerenciam a Casa Pitanga (exceção multi-dono). */
export const CASA_PITANGA_EMAILS = [
  "gabriel@sistemap.com.br",
  "mariananoggueira@gmail.com",
  "jadir.arq@gmail.com",
];
export const lsItensKey = (obraId: string) => `reforma:itens:v4:${obraId}`;
/** Marca (no demo) que o cliente já entrou nesta obra com um nome. */
export const lsClienteKey = (obraId: string) => `reforma:cliente:${obraId}`;
