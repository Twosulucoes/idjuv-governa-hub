import { usarTexto, usarTraco } from '../core/pintura';
import { quebrarEmLinhas } from '../core/texto';
import { ESPACO, NEUTROS, alturaLinha, ptParaMm } from '../core/tokens';
import type { Bloco } from '../tipos';

const TAMANHO = 8.5;
const PAD = 3;

/** Caixa com texto de autenticidade/observação (comprovantes). Indivisível. */
export const carimbo =
  (p: { linhas: string[] }): Bloco =>
  (ctx) => {
    const { doc } = ctx;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(TAMANHO);
    const linhas = p.linhas.flatMap((l) => quebrarEmLinhas(doc, l, ctx.largura - 2 * PAD));
    const h = linhas.length * alturaLinha(TAMANHO) + 2 * PAD;
    ctx.garantirEspaco(h + ESPACO.sm);
    usarTraco(doc, NEUTROS.linha);
    doc.setLineWidth(0.3);
    doc.rect(ctx.esquerda, ctx.y, ctx.largura, h);
    usarTexto(doc, NEUTROS.texto);
    linhas.forEach((l, i) => doc.text(l, ctx.esquerda + PAD, ctx.y + PAD + ptParaMm(TAMANHO) + i * alturaLinha(TAMANHO)));
    ctx.y += h + ESPACO.sm;
  };
