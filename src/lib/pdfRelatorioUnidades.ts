/**
 * Relatório de unidades locais (lista, detalhado e resumo), pelo motor único
 * (`unidades-relatorio-unidades-locais`).
 */
import { baixarDocumento, emitirDocumento } from '@/lib/documentos';
import type {
  ConfiguracaoRelatorio,
  UnidadeRelatorioData,
} from '@/lib/documentos/modelos/unidades/relatorioUnidadesLocais';

export type {
  CamposRelatorio,
  ConfiguracaoRelatorio,
  UnidadeRelatorioData,
} from '@/lib/documentos/modelos/unidades/relatorioUnidadesLocais';

/** Gera e baixa o PDF do relatório de unidades locais. */
export const downloadRelatorioUnidadesPDF = async (
  unidades: UnidadeRelatorioData[],
  config: ConfiguracaoRelatorio
): Promise<void> => {
  baixarDocumento(await emitirDocumento('unidades-relatorio-unidades-locais', { unidades, config }));
};
