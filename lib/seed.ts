// Dados reais da obra Casa Pitanga, extraídos das 16 planilhas do arquiteto.
// Usados no "modo demo" (localStorage) enquanto o Firebase não está configurado.
import type { Item } from "./types";
import dados from "./casa-pitanga.json";

export const SEED_CONFIG = {
  nomeObra: "Casa Pitanga",
  orcamentoTotal: 0, // defina seu teto em Ajustes
};

export const SEED_ITENS: Item[] = (dados as Omit<Item, "id">[]).map((it, i) => ({
  ...it,
  id: `cp-${i + 1}`,
  ordem: i + 1,
}));
