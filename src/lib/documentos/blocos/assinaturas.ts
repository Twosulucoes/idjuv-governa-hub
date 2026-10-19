import { usarTexto, usarTraco } from '../core/pintura';
import { quebrarEmLinhas } from '../core/texto';
import { ESPACO, NEUTROS, alturaLinha, ptParaMm } from '../core/tokens';
import type { Bloco } from '../tipos';

export interface Assinante {
  nome: string;
  cargo?: string;
  documento?: string;
}

const ESPACO_PARA_ASSINAR = 14;
const FOLGA = 12;
const LARGURA_MAX = 80;

/** Linhas de assinatura, no máximo 2 por fileira, centralizadas. Cada fileira é indivisível. */
export const assinaturas =
  (p: { assinantes: Assinante[] }): Bloco =>
  (ctx) => {
    const { doc } = ctx;
    const porFileira = p.assinantes.length === 1 ? 1 : 2;
    const w = Math.min(LARGURA_MAX, (ctx.largura - FOLGA * (porFileira - 1)) / porFileira);
    const h = alturaLinha(ctx.fonte.corpo);

    for (let i = 0; i < p.assinantes.length; i += porFileira) {
      const fileira = p.assinantes.slice(i, i + porFileira);
      doc.setFontSize(ctx.fonte.corpo);
      doc.setFont(ctx.fonteCorpo, 'bold');
      const nomes = fileira.map((a) => quebrarEmLinhas(doc, a.nome, w));
      doc.setFont(ctx.fonteCorpo, 'normal');
      const detalhes = fileira.map((a) => [a.cargo, a.documento].filter(Boolean).flatMap((t) => quebrarEmLinhas(doc, String(t), w)));
      const linhasMax = Math.max(...nomes.map((n, k) => n.length + detalhes[k].length));
      const altura = ESPACO_PARA_ASSINAR + linhasMax * h + ESPACO.sm;
      ctx.garantirEspaco(altura);

      const total = fileira.length * w + (fileira.length - 1) * FOLGA;
      const x0 = ctx.esquerda + (ctx.largura - total) / 2;
      fileira.forEach((_, k) => {
        const x = x0 + k * (w + FOLGA);
        const centro = x + w / 2;
        usarTraco(doc, NEUTROS.texto);
        doc.setLineWidth(0.3);
        doc.line(x, ctx.y + ESPACO_PARA_ASSINAR, x + w, ctx.y + ESPACO_PARA_ASSINAR);
        usarTexto(doc, NEUTROS.texto);
        let y = ctx.y + ESPACO_PARA_ASSINAR + 1;
        doc.setFont(ctx.fonteCorpo, 'bold');
        for (const l of nomes[k]) { doc.text(l, centro, y + ptParaMm(ctx.fonte.corpo), { align: 'center' }); y += h; }
        doc.setFont(ctx.fonteCorpo, 'normal');
        for (const l of detalhes[k]) { doc.text(l, centro, y + ptParaMm(ctx.fonte.corpo), { align: 'center' }); y += h; }
      });
      ctx.y += altura;
    }
  };
