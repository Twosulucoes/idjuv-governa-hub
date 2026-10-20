import { format } from 'date-fns';
import { baixarDocumento, emitirDocumento, type Celula } from '@/lib/documentos';

/**
 * Relatório de cadastro de árbitros, pelo motor único (`arbitros-relatorio-cadastro`).
 * A tela monta as linhas indexadas pelo rótulo do campo; aqui elas passam a ser indexadas pela chave.
 */
export interface ArbitroExportData {
  [key: string]: unknown;
}

interface ConfigRelatorioArbitros {
  titulo?: string;
  subtitulo?: string;
  campos: { key: string; label: string }[];
  /** Não impresso (o relatório antigo também não imprimia); fica pela assinatura da tela. */
  resumo?: { total: number; pendentes: number; aprovados: number; rejeitados: number };
  /** Dados agrupados por modalidade. Se presente, imprime uma seção por modalidade. */
  grupos?: { modalidade: string; dados: ArbitroExportData[] }[];
}

const celula = (v: unknown): Celula => (v === null || v === undefined ? null : typeof v === 'number' ? v : String(v));

export async function gerarRelatorioArbitrosPDF(
  dados: ArbitroExportData[],
  config: ConfigRelatorioArbitros
): Promise<void> {
  const porChave = (row: ArbitroExportData): Record<string, Celula> =>
    Object.fromEntries(config.campos.map((c) => [c.key, celula(row[c.label])]));

  const d = await emitirDocumento('arbitros-relatorio-cadastro', {
    titulo: config.titulo,
    subtitulo: config.subtitulo,
    campos: config.campos.map((c) => ({ chave: c.key, rotulo: c.label })),
    linhas: dados.map(porChave),
    grupos: config.grupos?.map((g) => ({ modalidade: g.modalidade, linhas: g.dados.map(porChave) })),
    carimboArquivo: format(new Date(), 'yyyy-MM-dd-HHmm'),
  });
  baixarDocumento(d);
}
