/**
 * LEITURA DE TEXTO POSICIONADO DE PDF (para importadores)
 *
 * Extrai os trechos de texto de cada página com a posição já no espaço da página
 * renderizada (rotação aplicada), agrupados em linhas. Importadores que leem
 * relatórios tabulares (ex.: QDD do FIPLAN) usam o `x` para descobrir a coluna,
 * porque colunas vazias somem quando se lê só o texto corrido.
 *
 * O pdf.js é carregado sob demanda (import dinâmico) para não pesar no bundle inicial.
 */

export interface TrechoPdf {
  texto: string;
  /** Borda esquerda, em pontos, já com a rotação da página aplicada */
  x: number;
  /** Borda direita */
  xFim: number;
  /** Linha de base (cresce para baixo) */
  y: number;
  pagina: number;
}

export interface LinhaPdf {
  pagina: number;
  y: number;
  trechos: TrechoPdf[];
}

/**
 * Trechos com linhas de base a até esta distância (pt) pertencem à mesma linha. No QDD do
 * FIPLAN os números ficam ~2 pt acima do texto da mesma linha; as linhas distam 12 pt.
 */
const TOLERANCIA_LINHA = 4;

async function carregarPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    // "?worker&url" faz o Vite empacotar o worker e emiti-lo como .js. Com "?url" ele sairia como
    // .mjs, que servidores sem esse tipo MIME (nginx padrão) entregam como octet-stream: o
    // navegador recusa o módulo e a leitura falha com "Setting up fake worker failed".
    const { default: workerUrl } = await import("pdfjs-dist/build/pdf.worker.min.mjs?worker&url");
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  }
  return pdfjs;
}

/** Lê o PDF e devolve as linhas de texto de todas as páginas, em ordem de leitura. */
export async function lerLinhasPdf(dados: ArrayBuffer): Promise<LinhaPdf[]> {
  const pdfjs = await carregarPdfJs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(dados), isEvalSupported: false }).promise;
  try {
    const trechos: TrechoPdf[] = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const pagina = await doc.getPage(n);
      const viewport = pagina.getViewport({ scale: 1 });
      const conteudo = await pagina.getTextContent();
      for (const item of conteudo.items) {
        if (!("str" in item)) continue;
        const texto = item.str.trim();
        if (!texto) continue;
        const [, , , , x, y] = pdfjs.Util.transform(viewport.transform, item.transform);
        trechos.push({ texto, x, xFim: x + item.width, y, pagina: n });
      }
    }
    return agruparEmLinhas(trechos);
  } finally {
    await doc.destroy();
  }
}

/** Agrupa trechos em linhas (por página e linha de base) e ordena da esquerda para a direita. */
export function agruparEmLinhas(trechos: TrechoPdf[]): LinhaPdf[] {
  const ordenados = [...trechos].sort((a, b) => a.pagina - b.pagina || a.y - b.y || a.x - b.x);
  const linhas: LinhaPdf[] = [];
  for (const t of ordenados) {
    const atual = linhas[linhas.length - 1];
    if (atual && atual.pagina === t.pagina && Math.abs(t.y - atual.y) <= TOLERANCIA_LINHA) {
      atual.trechos.push(t);
    } else {
      linhas.push({ pagina: t.pagina, y: t.y, trechos: [t] });
    }
  }
  for (const l of linhas) l.trechos.sort((a, b) => a.x - b.x);
  return linhas;
}
