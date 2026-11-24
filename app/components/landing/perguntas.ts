/**
 * Perguntas frequentes da landing. Ficam aqui (e não dentro do componente) para serem
 * reaproveitadas no FAQPage (dados estruturados / JSON-LD) em lib/seo.ts, sem duplicar o texto.
 * O que o visitante lê na tela e o que o Google indexa saem da mesma fonte.
 */
export const PERGUNTAS: { p: string; r: string }[] = [
  { p: "Preciso saber usar programa complicado?", r: "Não. Se você usa planilha, aprende em uma tarde. Dá para colar a planilha que já tem e começar a partir dela." },
  { p: "Meu cliente precisa criar conta?", r: "Não. Ele entra só com o código do projeto e o próprio nome. Tudo o que ele fizer fica identificado na linha do tempo, com nome e horário." },
  { p: "As mensagens saem sozinhas pelo WhatsApp?", r: "Nunca. O sistema monta a mensagem e abre o WhatsApp com o texto pronto. Você revisa e aperta enviar." },
  { p: "Funciona no celular?", r: "Sim. O sistema foi pensado para tela pequena, para usar na obra, na visita e no carro." },
  { p: "Meus dados e os do meu cliente ficam seguros?", r: "Cada projeto é isolado. Só você e as pessoas que você autoriza acessam os dados dele, e o cliente enxerga apenas o projeto dele." },
  { p: "Serve para obra pequena?", r: "Foi feito justamente para quem toca reformas e obras de pequeno e médio porte, sem ter de contratar um sistema pesado de construtora." },
];
