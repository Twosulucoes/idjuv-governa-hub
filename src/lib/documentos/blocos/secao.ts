import { usarTexto, usarTraco } from '../core/pintura';
import { quebrarEmLinhas } from '../core/texto';
import { ESPACO, NEUTROS, alturaLinha, corLegivel, ptParaMm } from '../core/tokens';
import type { Bloco } from '../tipos';

/** Título de seção com régua. Reserva espaço para a primeira linha do que vem depois (evita título órfão). */
export const secao =
  (p: { texto: string }): Bloco =>
  (ctx) => {
    const { doc } = ctx;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(ctx.fonte.secao);
    const linhas = quebrarEmLinhas(doc, p.texto, ctx.largura);
    // Reserva para o que vem logo abaixo (cabeçalho de tabela + 1 linha ≈ 14 mm): título de seção nunca fica sozinho no pé da página.
    ctx.garantirEspaco(ESPACO.sm + linhas.length * alturaLinha(ctx.fonte.secao) + ESPACO.sm + 16);
    ctx.y += ESPACO.sm;
    usarTexto(doc, corLegivel(ctx.marca.corPrimaria));
    for (const linha of linhas) {
      doc.text(linha, ctx.esquerda, ctx.y + ptParaMm(ctx.fonte.secao));
      ctx.y += alturaLinha(ctx.fonte.secao);
    }
    usarTraco(doc, NEUTROS.linha);
    doc.setLineWidth(0.3);
    doc.line(ctx.esquerda, ctx.y, ctx.esquerda + ctx.largura, ctx.y);
    ctx.y += ESPACO.sm;
    usarTexto(doc, NEUTROS.texto);
  };
