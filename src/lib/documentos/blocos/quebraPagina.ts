import { ALTURA_CABECALHO, PAGINA } from '../core/tokens';
import type { Bloco } from '../tipos';

/**
 * Começa a próxima parte em página nova (ex.: um servidor por página num lote de comprovantes).
 * Use entre as partes, não antes da primeira. Se a página atual (2ª em diante) ainda está vazia,
 * não faz nada, para não deixar página em branco.
 */
export const quebraPagina =
  (): Bloco =>
  (ctx) => {
    const paginaVazia = ctx.doc.getNumberOfPages() > 1 && ctx.y <= PAGINA.margemTopo + ALTURA_CABECALHO.demais;
    if (!paginaVazia) ctx.novaPagina();
  };
