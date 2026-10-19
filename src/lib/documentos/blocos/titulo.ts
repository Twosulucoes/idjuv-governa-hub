import { usarTexto } from '../core/pintura';
import { quebrarEmLinhas } from '../core/texto';
import { ESPACO, NEUTROS, alturaLinha, ptParaMm } from '../core/tokens';
import type { Bloco } from '../tipos';

/** Título centralizado em caixa alta e subtítulo opcional. A moldura (cabeçalho) fica por conta de `aplicarMoldura`. */
export const titulo =
  (p: { texto: string; subtitulo?: string }): Bloco =>
  (ctx) => {
    const { doc } = ctx;
    const centro = ctx.esquerda + ctx.largura / 2;

    doc.setFont(ctx.fonteCorpo, 'bold');
    doc.setFontSize(ctx.fonte.titulo);
    usarTexto(doc, NEUTROS.texto);
    for (const linha of quebrarEmLinhas(doc, p.texto.toUpperCase(), ctx.largura)) {
      ctx.garantirEspaco(alturaLinha(ctx.fonte.titulo));
      doc.text(linha, centro, ctx.y + ptParaMm(ctx.fonte.titulo), { align: 'center' });
      ctx.y += alturaLinha(ctx.fonte.titulo);
    }
    if (p.subtitulo) {
      doc.setFont(ctx.fonteCorpo, 'normal');
      doc.setFontSize(10);
      usarTexto(doc, NEUTROS.textoSuave);
      for (const linha of quebrarEmLinhas(doc, p.subtitulo, ctx.largura)) {
        ctx.garantirEspaco(alturaLinha(10));
        doc.text(linha, centro, ctx.y + ptParaMm(10), { align: 'center' });
        ctx.y += alturaLinha(10);
      }
    }
    ctx.y += ESPACO.md;
    usarTexto(doc, NEUTROS.texto);
  };
