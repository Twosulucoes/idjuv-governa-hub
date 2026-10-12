import { usarTexto } from '../core/pintura';
import { ouTraco, quebrarEmLinhas } from '../core/texto';
import { ESPACO, FONTE, NEUTROS, alturaLinha, ptParaMm } from '../core/tokens';
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
    const hRotulo = alturaLinha(FONTE.rotulo);
    const hValor = alturaLinha(FONTE.corpo);

    for (let i = 0; i < p.campos.length; i += colunas) {
      const linha = p.campos.slice(i, i + colunas);
      doc.setFont(ctx.fonteCorpo, 'normal');
      doc.setFontSize(FONTE.corpo);
      const valores = linha.map((c) => quebrarEmLinhas(doc, ouTraco(c.valor), w));
      const altura = hRotulo + Math.max(...valores.map((v) => v.length)) * hValor + ESPACO.sm / 2;
      ctx.garantirEspaco(altura);

      linha.forEach((c, k) => {
        const x = ctx.esquerda + k * (w + FOLGA_ENTRE_COLUNAS);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(FONTE.rotulo);
        usarTexto(doc, NEUTROS.textoSuave);
        doc.text(quebrarEmLinhas(doc, c.rotulo, w)[0], x, ctx.y + ptParaMm(FONTE.rotulo));

        doc.setFont(ctx.fonteCorpo, 'normal');
        doc.setFontSize(FONTE.corpo);
        usarTexto(doc, NEUTROS.texto);
        valores[k].forEach((v, j) => doc.text(v, x, ctx.y + hRotulo + ptParaMm(FONTE.corpo) + j * hValor));
      });
      ctx.y += altura;
    }
    ctx.y += ESPACO.sm / 2;
  };
