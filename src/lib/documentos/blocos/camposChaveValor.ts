import { usarTexto } from '../core/pintura';
import { ouTraco, quebrarEmLinhas } from '../core/texto';
import { ALTURA_CABECALHO, ESPACO, NEUTROS, PAGINA, alturaLinha, ptParaMm } from '../core/tokens';
import type { Bloco } from '../tipos';

export interface Campo {
  rotulo: string;
  valor?: string | number | null;
}

const FOLGA_ENTRE_COLUNAS = 6;

/** Grade de "rótulo pequeno + valor". Valor vazio sai como "—" (documento impresso não deixa lacuna muda). */
export const camposChaveValor =
  (p: { campos: Campo[]; colunas?: 1 | 2 | 3 }): Bloco =>
  (ctx) => {
    const { doc } = ctx;
    const colunas = p.colunas ?? 2;
    const w = (ctx.largura - FOLGA_ENTRE_COLUNAS * (colunas - 1)) / colunas;
    const hRotulo = alturaLinha(ctx.fonte.rotulo);
    const hValor = alturaLinha(ctx.fonte.corpo);
    const capacidadePagina = ctx.limiteInferior - (PAGINA.margemTopo + ALTURA_CABECALHO.demais);

    for (let i = 0; i < p.campos.length; i += colunas) {
      const linha = p.campos.slice(i, i + colunas);
      doc.setFont(ctx.fonteCorpo, 'normal');
      doc.setFontSize(ctx.fonte.corpo);
      const valores = linha.map((c) => quebrarEmLinhas(doc, ouTraco(c.valor), w));
      const altura = hRotulo + Math.max(...valores.map((v) => v.length)) * hValor + ESPACO.sm / 2;
      if (altura > capacidadePagina) {
        // Campo maior que uma página (ex.: observação enorme): empilha os campos e deixa as linhas fluírem entre páginas.
        linha.forEach((c) => {
          ctx.garantirEspaco(hRotulo + hValor);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(ctx.fonte.rotulo);
          usarTexto(doc, NEUTROS.textoSuave);
          doc.text(quebrarEmLinhas(doc, c.rotulo, ctx.largura)[0], ctx.esquerda, ctx.y + ptParaMm(ctx.fonte.rotulo));
          ctx.y += hRotulo;
          doc.setFont(ctx.fonteCorpo, 'normal');
          doc.setFontSize(ctx.fonte.corpo);
          usarTexto(doc, NEUTROS.texto);
          for (const v of quebrarEmLinhas(doc, ouTraco(c.valor), ctx.largura)) {
            ctx.garantirEspaco(hValor);
            doc.text(v, ctx.esquerda, ctx.y + ptParaMm(ctx.fonte.corpo));
            ctx.y += hValor;
          }
        });
        ctx.y += ESPACO.sm / 2;
        continue;
      }
      ctx.garantirEspaco(altura);

      linha.forEach((c, k) => {
        const x = ctx.esquerda + k * (w + FOLGA_ENTRE_COLUNAS);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(ctx.fonte.rotulo);
        usarTexto(doc, NEUTROS.textoSuave);
        doc.text(quebrarEmLinhas(doc, c.rotulo, w)[0], x, ctx.y + ptParaMm(ctx.fonte.rotulo));

        doc.setFont(ctx.fonteCorpo, 'normal');
        doc.setFontSize(ctx.fonte.corpo);
        usarTexto(doc, NEUTROS.texto);
        valores[k].forEach((v, j) => doc.text(v, x, ctx.y + hRotulo + ptParaMm(ctx.fonte.corpo) + j * hValor));
      });
      ctx.y += altura;
    }
    ctx.y += ESPACO.sm / 2;
  };
