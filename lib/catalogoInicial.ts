// Catálogo pronto oferecido no primeiro acesso do arquiteto. Fica no código, não no banco: cada arquiteto recebe uma
// CÓPIA para o próprio catálogo (arquitetos/{uid}/catalogo), que só ele lê e edita. Mudar o valor lá nunca mexe aqui
// nem no catálogo de outra pessoa.
//
// Os valores são REFERÊNCIAS aproximadas (mão de obra e material médios, em reais) só para ninguém começar do zero;
// variam muito por região e por fornecedor, e o arquiteto ajusta no "Meu catálogo".

export interface ItemModelo {
  descricao: string;
  unidade: string;
  valorUnitario: number;
}

export interface GrupoModelo {
  etapa: string;
  itens: ItemModelo[];
}

const i = (descricao: string, unidade: string, valorUnitario: number): ItemModelo => ({ descricao, unidade, valorUnitario });

export const CATALOGO_PRONTO: GrupoModelo[] = [
  {
    etapa: "Demolição e preparo",
    itens: [
      i("Demolição de revestimento cerâmico", "m²", 45),
      i("Demolição de alvenaria", "m²", 70),
      i("Retirada de entulho (caçamba de 4 m³)", "un", 450),
      i("Proteção de pisos e áreas", "vb", 800),
      i("Limpeza pós-obra", "m²", 18),
    ],
  },
  {
    etapa: "Instalações elétricas",
    itens: [
      i("Ponto de tomada ou iluminação", "un", 150),
      i("Quadro de distribuição", "un", 2800),
      i("Infraestrutura para ar-condicionado", "un", 750),
      i("Troca de fiação", "m", 22),
      i("Instalação de luminária", "un", 90),
    ],
  },
  {
    etapa: "Instalações hidráulicas",
    itens: [
      i("Ponto de água fria", "un", 220),
      i("Ponto de esgoto", "un", 260),
      i("Tubulação de água fria", "m", 48),
      i("Instalação de louças e metais", "un", 160),
      i("Registro ou válvula", "un", 140),
    ],
  },
  {
    etapa: "Alvenaria e gesso",
    itens: [
      i("Alvenaria de vedação", "m²", 95),
      i("Chapisco e reboco", "m²", 55),
      i("Parede de drywall", "m²", 150),
      i("Forro de gesso acartonado", "m²", 115),
      i("Sanca de gesso", "m", 130),
    ],
  },
  {
    etapa: "Impermeabilização",
    itens: [
      i("Impermeabilização de banheiro", "m²", 85),
      i("Impermeabilização de laje", "m²", 70),
      i("Impermeabilização de jardineira", "m²", 80),
    ],
  },
  {
    etapa: "Pisos e revestimentos",
    itens: [
      i("Contrapiso nivelado", "m²", 55),
      i("Assentamento de porcelanato", "m²", 85),
      i("Assentamento de revestimento de parede", "m²", 90),
      i("Rejuntamento", "m²", 15),
      i("Piso laminado ou vinílico instalado", "m²", 70),
      i("Rodapé", "m", 25),
    ],
  },
  {
    etapa: "Pintura",
    itens: [
      i("Massa corrida e lixamento", "m²", 20),
      i("Selador", "m²", 6),
      i("Pintura acrílica (2 demãos)", "m²", 18),
      i("Pintura de teto", "m²", 20),
      i("Textura", "m²", 28),
      i("Pintura de esquadrias", "m²", 45),
    ],
  },
  {
    etapa: "Marcenaria e esquadrias",
    itens: [
      i("Cozinha planejada", "vb", 28000),
      i("Armário planejado", "m²", 2200),
      i("Painel de TV", "vb", 4500),
      i("Porta de madeira com batente", "un", 1200),
      i("Janela de alumínio", "m²", 900),
      i("Box de vidro", "un", 1800),
    ],
  },
  {
    etapa: "Louças, metais e bancadas",
    itens: [
      i("Bancada em quartzo ou granito", "m", 1200),
      i("Cuba e torneira (kit)", "un", 650),
      i("Bacia sanitária", "un", 520),
      i("Chuveiro", "un", 280),
      i("Espelho", "un", 320),
    ],
  },
  {
    etapa: "Projeto e gestão",
    itens: [
      i("Projeto de interiores", "m²", 120),
      i("Projeto executivo", "m²", 90),
      i("Acompanhamento de obra (mensal)", "vb", 3000),
      i("RRT ou ART", "un", 120),
    ],
  },
];

export const totalCatalogoPronto = CATALOGO_PRONTO.reduce((s, g) => s + g.itens.length, 0);
