/**
 * Relatório de Servidores com Segundo Vínculo Funcional, pelo motor único (`rh-segundo-vinculo`).
 * Lista servidores que possuem vínculo externo com outro órgão.
 */
import { baixarDocumento, emitirDocumento } from '@/lib/documentos';
import type { RelatorioSegundoVinculoData } from '@/lib/documentos/modelos/rh/segundoVinculo';

export type { RelatorioSegundoVinculoData, ServidorSegundoVinculo } from '@/lib/documentos/modelos/rh/segundoVinculo';

export async function gerarRelatorioSegundoVinculo(data: RelatorioSegundoVinculoData): Promise<void> {
  const d = await emitirDocumento('rh-segundo-vinculo', data);
  baixarDocumento(d);
}
