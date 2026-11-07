// Obras que o cliente (acesso anônimo) já abriu neste navegador.
// Cliente não tem conta, então a lista vive junto com a sessão anônima.
const KEY = "reforma:cliente:obras";

export interface ObraCliente {
  id: string;
  nome: string;
  visitadaEm: number;
}

export function lerObrasCliente(): ObraCliente[] {
  try {
    const lista = JSON.parse(localStorage.getItem(KEY) ?? "[]") as ObraCliente[];
    return lista.sort((a, b) => b.visitadaEm - a.visitadaEm);
  } catch {
    return [];
  }
}

export function registrarObraCliente(id: string, nome: string) {
  try {
    const lista = lerObrasCliente().filter((o) => o.id !== id);
    lista.push({ id, nome: nome || "Projeto", visitadaEm: Date.now() });
    localStorage.setItem(KEY, JSON.stringify(lista));
  } catch {
    /* ignore */
  }
}

export function esquecerObrasCliente() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
