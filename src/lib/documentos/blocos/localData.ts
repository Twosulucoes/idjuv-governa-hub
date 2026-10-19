import { usarTexto } from '../core/pintura';
import { quebrarEmLinhas } from '../core/texto';
import { ESPACO, NEUTROS, alturaLinha, ptParaMm } from '../core/tokens';
import type { Bloco } from '../tipos';

export const localData =
  (p: { local: string; data: string }): Bloco =>
  (ctx) => {
    const { doc } = ctx;
    doc.setFont(ctx.fonteCorpo, 'normal');
    doc.setFontSize(ctx.fonte.corpo);
    usarTexto(doc, NEUTROS.texto);
    const linhas = quebrarEmLinhas(doc, `${p.local}, ${p.data}.`, ctx.largura);
    ctx.garantirEspaco(ESPACO.md + linhas.length * alturaLinha(ctx.fonte.corpo));
    ctx.y += ESPACO.md;
    for (const linha of linhas) {
      doc.text(linha, ctx.esquerda, ctx.y + ptParaMm(ctx.fonte.corpo));
      ctx.y += alturaLinha(ctx.fonte.corpo);
    }
    ctx.y += ESPACO.sm;
  };
