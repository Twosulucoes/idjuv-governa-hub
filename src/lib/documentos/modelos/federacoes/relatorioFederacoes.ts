import { paragrafo, tabela } from '../../blocos';
import type { Celula, ColunaTabela } from '../../blocos';
import type { DocumentoModelo } from '../../tipos';

/**
 * Relatório de federações, dirigentes ou calendário (Central de relatórios de federações). Colunas e valores
 * chegam formatados como texto pela tela; o modelo só imprime.
 */
export interface DadosRelatorioFederacoes {
  titulo: string;
  subtitulo?: string;
  colunas: ColunaTabela[];
  linhas: Record<string, Celula>[];
  /** Carimbo de data do nome do arquivo (ex.: `2026-10-20-1430`). */
  carimboArquivo: string;
}

export const relatorioFederacoes: DocumentoModelo<DadosRelatorioFederacoes> = {
  tipo: 'federacoes-relatorio',
  familia: 'relatorio',
  orientacao: 'retrato',
  titulo: (d) => d.titulo || 'Relatório de Federações',
  subtitulo: (d) => d.subtitulo,
  nomeArquivo: (d) => `relatorio-federacoes-${d.carimboArquivo}.pdf`,
  blocos: (d) => [
    paragrafo({ texto: `Total de registros: ${d.linhas.length}` }),
    d.linhas.length === 0
      ? paragrafo({ texto: 'Nenhum registro encontrado para os filtros selecionados.' })
      : tabela({ colunas: d.colunas, linhas: d.linhas }),
  ],
};

/** Mesmo relatório quando a tela pede paisagem (a orientação do modelo é fixa). */
export const relatorioFederacoesPaisagem: DocumentoModelo<DadosRelatorioFederacoes> = {
  ...relatorioFederacoes,
  tipo: 'federacoes-relatorio-paisagem',
  orientacao: 'paisagem',
};
