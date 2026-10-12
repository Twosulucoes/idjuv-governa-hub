import { usarTexto } from '../core/pintura';
import { quebrarEmLinhas } from '../core/texto';
import { ESPACO, FONTE, NEUTROS, alturaLinha, ptParaMm } from '../core/tokens';
import type { Bloco } from '../tipos';

export interface PropsParagrafo {
  texto: string;
  alinhamento?: 'esquerda' | 'justificado';
  /** Recuo (mm) só da primeira linha. */
  recuoPrimeiraLinha?: number;
  negrito?: boolean;
}

export const paragrafo =
  (p: PropsParagrafo): Bloco =>
  (ctx) => {
    const { doc } = ctx;
    const h = alturaLinha(FONTE.corpo);
    doc.setFont(ctx.fonteCorpo, p.negrito ? 'bold' : 'normal');
    doc.setFontSize(FONTE.corpo);
    usarTexto(doc, NEUTROS.texto);

    // Cada linha de texto original (separada por \n) é um parágrafo próprio; o recuo vale para a 1ª de cada.
    for (const original of String(p.texto ?? '').split('\n')) {
      const recuo = p.recuoPrimeiraLinha ?? 0;
      const linhas = quebrarEmLinhas(doc, original, ctx.largura - recuo);
      linhas.forEach((linha, i) => {
        ctx.garantirEspaco(h);
        const x = ctx.esquerda + (i === 0 ? recuo : 0);
        const ultima = i === linhas.length - 1;
        if (p.alinhamento === 'justificado' && !ultima && linha.includes(' ')) {
          doc.text(linha, x, ctx.y + ptParaMm(FONTE.corpo), { align: 'justify', maxWidth: ctx.largura - (i === 0 ? recuo : 0) });
        } else {
          doc.text(linha, x, ctx.y + ptParaMm(FONTE.corpo));
        }
        ctx.y += h;
      });
    }
    ctx.y += ESPACO.sm;
  };
