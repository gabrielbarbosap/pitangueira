# Pitangueira — roadmap de funcionalidades para o arquiteto

Ponto de partida: o PDF "Programa de necessidades" do Jadir (reforma da casa Pitanga) e a planilha de orçamento por etapas.
Ideia central: **um fio condutor** — o que o cliente pediu vira orçamento, que vira obra, e o cliente enxerga isso inteiro.

## O que o PDF ensina

Estrutura do documento:
- Cabeçalho: cliente(s), projeto, endereço, etapa, data, arquiteto + registro (CAU).
- **Ambientes e quantidade** (garagem, suíte, quarto, escritório, banheiro, sala, cozinha, área de serviço, hall/terraço…).
- **Requisitos específicos de uso** — texto livre que na verdade são *itens de obra disfarçados*: carregador de carro
  elétrico, pré-instalação de câmeras e wi-fi, reforço de telhado para painéis solares, caixa d'água de amianto →
  polietileno, pontos de piscina e área gourmet, relocação do medidor, infra de split.
- O próprio texto diz que o programa inclui também função, área aproximada e relação de proximidade entre ambientes.

Dois achados:
1. **Cada requisito tem destino no orçamento** (ex.: caixa d'água → planilha 16, reservatórios). Hoje essa ligação não existe
   em lugar nenhum; é o diferencial mais forte que dá para construir.
2. Os "ambientes" da planilha de orçamento são uma mistura de cômodos e disciplinas (Cozinha, Mão de obra, Material).
   O programa de necessidades dá a **lista limpa de ambientes** que falta para o filtro "por ambiente" fazer sentido.

## Funcionalidades por fase do trabalho do arquiteto

| Fase | Funcionalidade | Valor |
|---|---|---|
| 0. Dados da obra | Cliente(s), endereço, tipo de obra, responsável técnico (CAU/CREA), datas | Base para todos os documentos |
| 1. Briefing | **Programa de necessidades**: ambientes (qtd, função, área, proximidades) + requisitos, com status (pendente / previsto / atendido) | O documento que o Jadir já faz à mão |
| 1. Briefing | Exportar PDF com a marca do arquiteto; cliente **aprova online** (nome + data) | Substitui PDF + WhatsApp |
| 2. Orçamento | **Catálogo do arquiteto**: itens com unidade, valor de referência, etapa | Montar orçamento sem redigitar |
| 2. Orçamento | **Modelos por tipo de obra** (reforma residencial, construção, comercial, interiores) | Resolve o "genérico" |
| 2. Orçamento | Montar por ambiente (qtd × unitário), duplicar obra, **revisões** (REV01, REV02) | O arquiteto já versiona assim |
| 2. Orçamento | Importar planilha (xlsx/csv) | Entrada do cliente existente |
| 3. Execução | Vincular requisito ↔ itens do orçamento (rastreabilidade) | "Pedi X, custou Y, está Z%" |
| 3. Execução | **Diário de obra com fotos** | Lacuna vs concorrentes; cliente espera ver foto |
| 3. Execução | Cronograma por etapa e **fluxo de pagamentos** (parcelas por data) | Quando sai dinheiro |
| 3. Execução | Fornecedores/prestadores e valor contratado | Hoje é só um campo de texto |
| 3. Execução | **Aditivos / pedidos de alteração** com aprovação do cliente | Evita o "não combinamos isso" |
| 4. Entrega | Documentos da obra (projetos, ART/RRT, contratos) | Tudo num lugar |

## Como ser genérico sem virar monstro

Não construir um "motor configurável". Quatro blocos servem a qualquer obra: **Ambiente**, **Requisito**, **Etapa**, **Item**.
O que muda de um tipo de obra para outro é só o *modelo* (lista inicial de etapas, ambientes e itens sugeridos), que é dado,
não código. A Casa Pitanga vira o primeiro modelo ("Reforma residencial completa").

## Fora do escopo (por enquanto)

Proposta comercial/contrato/honorários e gestão do escritório. É outro produto (e outro mercado cheio); ficar fora até
os arquitetos pedirem.

## Riscos

- Tentar fazer tudo antes de validar com um arquiteto de verdade. Só temos **um** (Jadir). Validar o que ele usa toda semana.
- Base de preços (SINAPI) parece óbvia, mas é regional, mensal e muda; começar com o catálogo próprio do arquiteto.
