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
      // Meio ponto abaixo do corpo: 10 pt na escala normal, acompanha a escala configurada.
      const tamanho = ctx.fonte.corpo - 0.5;
      doc.setFontSize(tamanho);
      usarTexto(doc, NEUTROS.textoSuave);
      for (const linha of quebrarEmLinhas(doc, p.subtitulo, ctx.largura)) {
        ctx.garantirEspaco(alturaLinha(tamanho));
        doc.text(linha, centro, ctx.y + ptParaMm(tamanho), { align: 'center' });
        ctx.y += alturaLinha(tamanho);
      }
    }
    ctx.y += ESPACO.md;
    usarTexto(doc, NEUTROS.texto);
  };
