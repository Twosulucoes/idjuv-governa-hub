import type { Bloco, ContextoDocumento } from '../tipos';
import { criarContexto } from './pagina';
import { ALTURA_CABECALHO, PAGINA } from './tokens';

/**
 * Mede quanto um grupo de blocos ocupa se desenhado do topo de uma página de conteúdo,
 * num documento descartável (mesma marca, orientação e família). Não altera `ctx`.
 */
export function medirAltura(ctx: ContextoDocumento, blocos: Bloco[]): { altura: number; paginas: number } {
  const e = criarContexto({ marca: ctx.marca, orientacao: ctx.orientacao, familia: ctx.familia });
  const topo = PAGINA.margemTopo + ALTURA_CABECALHO.demais;
  e.y = topo;
  for (const bloco of blocos) bloco(e);
  const paginas = e.doc.getNumberOfPages();
  return { altura: (paginas - 1) * (e.limiteInferior - topo) + (e.y - topo), paginas };
}
