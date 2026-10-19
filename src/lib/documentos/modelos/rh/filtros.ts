import { formatarDataISO, type FiltrosImpressao } from '@/lib/relatoriosRHRegras';
import { camposChaveValor, secao, type Campo } from '../../blocos';
import type { Bloco } from '../../tipos';

/** "Filtros aplicados" dos relatórios de afastamento: período, unidade, status/ônus quando houver e a contagem. */
export function blocosFiltros(f: FiltrosImpressao, contagem: string): Bloco[] {
  const campos: Campo[] = [
    { rotulo: 'Período', valor: `${formatarDataISO(f.inicio)} a ${formatarDataISO(f.fim)}` },
    { rotulo: 'Unidade', valor: f.unidadeNome ?? 'Todas' },
  ];
  if (f.statusLabel) campos.push({ rotulo: 'Status', valor: f.statusLabel });
  if (f.onusLabel) campos.push({ rotulo: 'Ônus', valor: f.onusLabel });
  campos.push({ rotulo: 'Total', valor: contagem });
  return [secao({ texto: 'Filtros aplicados' }), camposChaveValor({ colunas: 3, campos })];
}
