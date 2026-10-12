import type jsPDF from 'jspdf';

export interface ItemTexto {
  str: string;
  x: number;
  y: number;
  largura: number;
}
export interface PaginaLida {
  texto: string;
  itens: ItemTexto[];
  largura: number;
  altura: number;
}

export const mmParaPt = (mm: number): number => (mm * 72) / 25.4;

/** Lê o PDF gerado e devolve, por página, o texto e a posição de cada trecho (em pt). */
export async function lerPdf(doc: jsPDF): Promise<PaginaLida[]> {
  const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(doc.output('arraybuffer') as ArrayBuffer);
  const pdf = await pdfjs.getDocument({
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
    verbosity: 0,
  }).promise;

  const paginas: PaginaLida[] = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const pagina = await pdf.getPage(n);
    const vp = pagina.getViewport({ scale: 1 });
    const conteudo = await pagina.getTextContent();
    const itens: ItemTexto[] = conteudo.items
      .filter((i: any) => typeof i.str === 'string' && i.str.trim() !== '')
      .map((i: any) => ({ str: i.str, x: i.transform[4], y: i.transform[5], largura: i.width }));
    paginas.push({ texto: itens.map((i) => i.str).join(' '), itens, largura: vp.width, altura: vp.height });
  }
  return paginas;
}
