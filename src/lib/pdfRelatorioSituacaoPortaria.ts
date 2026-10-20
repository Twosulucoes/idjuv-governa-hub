/**
 * Relatório de Servidores - Situação de Portaria de Nomeação, pelo motor único (`rh-situacao-portaria`).
 * Agrupa servidores em: COM PORTARIA e SEM PORTARIA.
 */
import { baixarDocumento, emitirDocumento } from '@/lib/documentos';
import type { RelatorioSituacaoPortariaData } from '@/lib/documentos/modelos/rh/situacaoPortaria';

export type { RelatorioSituacaoPortariaData, ServidorPortariaItem } from '@/lib/documentos/modelos/rh/situacaoPortaria';

export const generateRelatorioSituacaoPortaria = async (data: RelatorioSituacaoPortariaData): Promise<void> => {
  const d = await emitirDocumento('rh-situacao-portaria', data);
  baixarDocumento(d);
};
