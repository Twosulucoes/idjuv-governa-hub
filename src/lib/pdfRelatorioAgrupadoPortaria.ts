/**
 * Relatório de Servidores Agrupado por Portaria de Nomeação, pelo motor único (`rh-agrupado-portaria`).
 * Lista servidores organizados por número de portaria.
 */
import { baixarDocumento, emitirDocumento } from '@/lib/documentos';
import type { RelatorioAgrupadoPortariaData } from '@/lib/documentos/modelos/rh/agrupadoPortaria';

export type {
  GrupoPortaria,
  RelatorioAgrupadoPortariaData,
  ServidorParaPortaria,
} from '@/lib/documentos/modelos/rh/agrupadoPortaria';

export const generateRelatorioAgrupadoPortaria = async (data: RelatorioAgrupadoPortariaData): Promise<void> => {
  const d = await emitirDocumento('rh-agrupado-portaria', data);
  baixarDocumento(d);
};
