/**
 * Gera um arquivo PDF a partir de um documento da tela (orçamento, escopo, relatório).
 *
 * O documento é desenhado numa imagem e cortado em páginas A4. Os cortes caem entre blocos (linhas de tabela,
 * parágrafos, títulos), nunca no meio de uma linha de texto. As bibliotecas são carregadas só quando alguém
 * pede o PDF, para não pesar no resto do app.
 */

const MODERNAS = /(oklch|oklab|lab|lch|color-mix|color)\(/;
const PROPS_COR = ["color", "backgroundColor", "borderTopColor", "borderRightColor", "borderBottomColor", "borderLeftColor", "outlineColor", "textDecorationColor", "caretColor"] as const;

/** Converte qualquer cor CSS (inclusive oklch e color-mix, que o html2canvas não entende) em rgb()/rgba(). */
function paraRgb(ctx: CanvasRenderingContext2D, cor: string): string {
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = "#000";
  ctx.fillStyle = cor;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
}

function simplificarCores(doc: Document, raiz: HTMLElement) {
  const canvas = doc.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const janela = doc.defaultView;
  if (!ctx || !janela) return;
  for (const el of [raiz, ...Array.from(raiz.querySelectorAll<HTMLElement>("*"))]) {
    const estilo = janela.getComputedStyle(el);
    for (const p of PROPS_COR) {
      const v = estilo[p];
      if (v && MODERNAS.test(v)) el.style.setProperty(p.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()), paraRgb(ctx, v), "important");
    }
    if (MODERNAS.test(estilo.boxShadow)) el.style.setProperty("box-shadow", "none", "important");
    if (MODERNAS.test(estilo.backgroundImage)) el.style.setProperty("background-image", "none", "important");
  }
}

/** Posições (em px, a partir do topo do documento) onde é seguro quebrar a página. */
function pontosDeCorte(raiz: HTMLElement): number[] {
  const topo = raiz.getBoundingClientRect().top;
  const pontos = new Set<number>();
  raiz.querySelectorAll("tr, p, li, h1, h2, h3, dt, dd, header, footer, section, dl > div, article > div").forEach((el) => {
    pontos.add(Math.round(el.getBoundingClientRect().bottom - topo));
  });
  return [...pontos].sort((a, b) => a - b);
}

export async function gerarPdf(elemento: HTMLElement): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);

  let cortes: number[] = [];
  const LARGURA_CSS = 800; // largura do documento no PDF, igual à da folha na tela (o layout de computador, mesmo no celular)
  const ESCALA = 2;
  const canvas = await html2canvas(elemento, {
    scale: ESCALA,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    windowWidth: 1000,
    width: LARGURA_CSS,
    onclone: (doc, clone) => {
      clone.style.width = `${LARGURA_CSS}px`;
      clone.style.maxWidth = `${LARGURA_CSS}px`;
      clone.style.margin = "0";
      clone.style.boxShadow = "none";
      simplificarCores(doc, clone);
      cortes = pontosDeCorte(clone);
    },
  });

  const pdf = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const MARGEM = 28;
  const larguraPt = pdf.internal.pageSize.getWidth() - MARGEM * 2;
  const alturaPaginaPt = pdf.internal.pageSize.getHeight() - MARGEM * 2;
  const ptPorPx = larguraPt / LARGURA_CSS;
  const alturaPaginaPx = alturaPaginaPt / ptPorPx;
  const totalPx = canvas.height / ESCALA;

  let inicio = 0;
  let primeira = true;
  while (inicio < totalPx - 1) {
    const limite = inicio + alturaPaginaPx;
    let fim = limite;
    if (limite < totalPx) {
      const seguro = cortes.filter((c) => c > inicio + alturaPaginaPx * 0.45 && c <= limite);
      if (seguro.length) fim = seguro[seguro.length - 1];
    } else {
      fim = totalPx;
    }
    const alturaPx = Math.max(1, fim - inicio);
    const pagina = document.createElement("canvas");
    pagina.width = canvas.width;
    pagina.height = Math.round(alturaPx * ESCALA);
    const ctx = pagina.getContext("2d");
    if (!ctx) throw new Error("Não foi possível montar a página do PDF");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, pagina.width, pagina.height);
    ctx.drawImage(canvas, 0, Math.round(inicio * ESCALA), canvas.width, pagina.height, 0, 0, pagina.width, pagina.height);
    if (!primeira) pdf.addPage();
    primeira = false;
    pdf.addImage(pagina.toDataURL("image/jpeg", 0.92), "JPEG", MARGEM, MARGEM, larguraPt, alturaPx * ptPorPx);
    inicio = fim;
  }
  return pdf.output("blob");
}
