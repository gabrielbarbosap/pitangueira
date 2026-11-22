import type { PaginaDoc } from "./tipos";
import { introducao } from "./conteudo/introducao";
import { primeirosPassos } from "./conteudo/primeiros-passos";
import { acessos } from "./conteudo/acessos";
import { painel } from "./conteudo/painel";
import { criarProjeto } from "./conteudo/criar-projeto";
import { telaDoProjeto } from "./conteudo/tela-do-projeto";
import { itens } from "./conteudo/itens";
import { orcamento } from "./conteudo/orcamento";
import { prazo } from "./conteudo/prazo";
import { acompanhar } from "./conteudo/acompanhar";
import { cobrancaObra } from "./conteudo/cobranca-obra";
import { escopo } from "./conteudo/escopo";
import { graficos } from "./conteudo/graficos";
import { relatorio } from "./conteudo/relatorio";
import { pdfs } from "./conteudo/pdfs";
import { catalogo } from "./conteudo/catalogo";
import { fornecedores } from "./conteudo/fornecedores";
import { financeiro } from "./conteudo/financeiro";
import { cliente } from "./conteudo/cliente";
import { privacidade } from "./conteudo/privacidade";
import { planos } from "./conteudo/planos";
import { dados } from "./conteudo/dados";
import { admin } from "./conteudo/admin";
import { glossario } from "./conteudo/glossario";
import { faq } from "./conteudo/faq";

/**
 * Todas as páginas da documentação, na ordem em que aparecem no menu.
 * Funcionalidade nova no app = página nova (ou seção nova) aqui. Veja a seção "Documentação" do README.
 */
export const paginas: PaginaDoc[] = [
  introducao,
  primeirosPassos,
  acessos,
  painel,
  criarProjeto,
  telaDoProjeto,
  itens,
  orcamento,
  prazo,
  acompanhar,
  cobrancaObra,
  escopo,
  graficos,
  relatorio,
  pdfs,
  catalogo,
  fornecedores,
  financeiro,
  cliente,
  privacidade,
  planos,
  dados,
  admin,
  glossario,
  faq,
];
