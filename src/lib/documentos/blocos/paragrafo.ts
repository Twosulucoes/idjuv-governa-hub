import type jsPDF from 'jspdf';
import { usarTexto } from '../core/pintura';
import { paraWinAnsi, quebrarEmLinhas } from '../core/texto';
import { ESPACO, FONTE, NEUTROS, alturaLinha, ptParaMm } from '../core/tokens';
import type { Bloco } from '../tipos';

export interface PropsParagrafo {
  texto: string;
  alinhamento?: 'esquerda' | 'justificado';
  /** Recuo (mm) só da primeira linha. */
  recuoPrimeiraLinha?: number;
  negrito?: boolean;
}

/** Desenha a linha esticando só os espaços entre as palavras até `largura` (mm). */
function linhaJustificada(doc: jsPDF, linha: string, x: number, y: number, largura: number): void {
  const palavras = linha.split(' ').filter(Boolean);
  if (palavras.length < 2) return void doc.text(linha, x, y);
  const sobra = largura - palavras.reduce((s, p) => s + doc.getTextWidth(p), 0);
  const espaco = sobra / (palavras.length - 1);
  let cursor = x;
  for (const p of palavras) {
    doc.text(p, cursor, y);
    cursor += doc.getTextWidth(p) + espaco;
  }
}

/** Linhas do parágrafo: a 1ª com `recuo` a menos de largura, as demais com a largura toda. */
function linhasDoParagrafo(doc: jsPDF, texto: string, largura: number, recuo: number): { linha: string; recuada: boolean }[] {
  if (recuo <= 0) return quebrarEmLinhas(doc, texto, largura).map((linha) => ({ linha, recuada: false }));
  const [primeira] = quebrarEmLinhas(doc, texto, largura - recuo);
  const resto = texto.slice(primeira.length).trimStart();
  const demais = resto ? quebrarEmLinhas(doc, resto, largura) : [];
  return [{ linha: primeira, recuada: true }, ...demais.map((linha) => ({ linha, recuada: false }))];
}

export const paragrafo =
  (p: PropsParagrafo): Bloco =>
  (ctx) => {
    const { doc } = ctx;
    const h = alturaLinha(FONTE.corpo);
    doc.setFont(ctx.fonteCorpo, p.negrito ? 'bold' : 'normal');
    doc.setFontSize(FONTE.corpo);
    usarTexto(doc, NEUTROS.texto);

    // Normaliza antes de separar: "\r\n" (textarea no Windows) é uma quebra só, não duas.
    // Cada trecho separado por \n é um parágrafo próprio; o recuo vale para a 1ª linha de cada.
    for (const original of paraWinAnsi(p.texto).split('\n')) {
      const recuo = p.recuoPrimeiraLinha ?? 0;
      const linhas = linhasDoParagrafo(doc, original, ctx.largura, recuo);
      linhas.forEach(({ linha, recuada }, i) => {
        ctx.garantirEspaco(h);
        const x = ctx.esquerda + (recuada ? recuo : 0);
        const y = ctx.y + ptParaMm(FONTE.corpo);
        const ultima = i === linhas.length - 1;
        if (p.alinhamento === 'justificado' && !ultima) linhaJustificada(doc, linha, x, y, ctx.largura - (recuada ? recuo : 0));
        else doc.text(linha, x, y);
        ctx.y += h;
      });
    }
    ctx.y += ESPACO.sm;
  };
