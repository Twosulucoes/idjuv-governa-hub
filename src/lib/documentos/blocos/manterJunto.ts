import { medirAltura } from '../core/medir';
import { ALTURA_CABECALHO, PAGINA } from '../core/tokens';
import type { Bloco } from '../tipos';

/**
 * Mantém os blocos juntos na mesma página: se o grupo cabe numa página mas não no que resta
 * da atual, vai inteiro para a seguinte (ex.: último artigo + local/data + assinatura).
 * Grupo maior que uma página flui normalmente.
 */
export const manterJunto =
  (...blocos: Bloco[]): Bloco =>
  (ctx) => {
    const { altura } = medirAltura(ctx, blocos);
    const capacidade = ctx.limiteInferior - (PAGINA.margemTopo + ALTURA_CABECALHO.demais);
    if (altura <= capacidade) ctx.garantirEspaco(altura);
    for (const bloco of blocos) bloco(ctx);
  };
