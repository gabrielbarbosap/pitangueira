// Modelos de programa de necessidades. Genérico = dado, não código: cada tipo de obra é só uma lista inicial.
import type { Programa } from "./types";

let seq = 0;
const id = () => `m${Date.now().toString(36)}${(seq++).toString(36)}`;

type A = [nome: string, qtd: number, funcao?: string];

function montar(ambientes: A[], requisitos: [texto: string, ambiente?: string][]): Programa {
  return {
    ambientes: ambientes.map(([nome, quantidade, funcao]) => ({
      id: id(),
      nome,
      quantidade,
      funcao: funcao ?? "",
      area: 0,
      proximidade: "",
    })),
    requisitos: requisitos.map(([texto, ambiente]) => ({
      id: id(),
      texto,
      ambiente: ambiente ?? "",
      etapa: "",
      status: "pendente" as const,
    })),
  };
}

export interface ModeloPrograma {
  chave: string;
  nome: string;
  descricao: string;
  gerar: () => Programa;
}

export const MODELOS_PROGRAMA: ModeloPrograma[] = [
  {
    chave: "casa-pitanga",
    nome: "Reforma residencial completa",
    descricao: "Baseado no programa de necessidades real da Casa Pitanga (Jadir Alves).",
    gerar: () =>
      montar(
        [
          ["Vaga de garagem coberta", 1, "Carro e/ou moto"],
          ["Suíte sem closet", 1],
          ["Quarto de filho(s)", 1],
          ["Escritório", 1],
          ["Banheiro social", 1],
          ["Sala de estar e jantar integradas", 1],
          ["Quarto multifunção", 1, "Games ou academia"],
          ["Cozinha tradicional", 1, "Sem integração com a sala"],
          ["Área de serviço", 1],
          ["Hall de entrada com terraço", 1],
          ["Área gourmet", 1, "Apoio à futura piscina, integração de áreas"],
        ],
        [
          ["Instalação de carregador de carro elétrico", "Vaga de garagem coberta"],
          ["Preparação elétrica para chuveiros blindados nos banheiros"],
          ["Nova rede hidrossanitária e de esgoto com caixa de gordura"],
          ["Pontos de torneira para manutenção da jardinagem externa"],
          ["Substituição da caixa d'água de amianto por polietileno (abastecimento)"],
          ["Pré-cabeamento do sistema de câmeras"],
          ["Reforço estrutural do telhado para futuros painéis solares"],
          ["Pré-instalação de cabeamento de rede wi-fi"],
          ["Pontos hidráulicos e elétricos para máquina de lavar louça", "Cozinha tradicional"],
          ["Prever local da piscina e pré-instalação de hidráulica e elétrica"],
          ["Pontos elétricos e hidráulicos na área gourmet", "Área gourmet"],
          ["Possibilidade de terraço aos fundos"],
          ["Relocação do medidor de energia (possivelmente novo poste)"],
          ["Área externa permeável (grama) na frente e nos fundos"],
          ["Infraestrutura para ar-condicionado split na suíte e nos quartos"],
          ["Puxadores para redes/balanço"],
        ],
      ),
  },
  {
    chave: "apartamento",
    nome: "Reforma de apartamento",
    descricao: "Ambientes típicos de apartamento, para ajustar com o cliente.",
    gerar: () =>
      montar(
        [
          ["Sala de estar e jantar", 1],
          ["Cozinha", 1],
          ["Área de serviço", 1],
          ["Suíte", 1],
          ["Quarto", 2],
          ["Banheiro social", 1],
          ["Varanda", 1],
        ],
        [
          ["Verificar regras do condomínio para obra (horários, ART/RRT)"],
          ["Pontos para ar-condicionado split"],
          ["Revisão de instalações elétricas e hidráulicas"],
        ],
      ),
  },
  {
    chave: "comercial",
    nome: "Sala comercial / escritório",
    descricao: "Ponto de partida para espaços de trabalho e lojas pequenas.",
    gerar: () =>
      montar(
        [
          ["Recepção", 1],
          ["Sala de reunião", 1],
          ["Estações de trabalho", 1, "Quantidade de postos a definir"],
          ["Copa", 1],
          ["Banheiros", 2],
        ],
        [
          ["Infraestrutura de rede e telefonia"],
          ["Ar-condicionado e ventilação"],
          ["Acessibilidade e saídas de emergência"],
        ],
      ),
  },
  {
    chave: "branco",
    nome: "Em branco",
    descricao: "Começar do zero.",
    gerar: () => montar([], []),
  },
];
