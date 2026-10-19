import { format } from 'date-fns';
import { baixarDocumento, emitirDocumento } from '@/lib/documentos';
import type { UnidadeComServidores } from '@/lib/documentos/modelos/rh/diretoriaHierarquia';

export type { ServidorDiretoria, UnidadeComServidores } from '@/lib/documentos/modelos/rh/diretoriaHierarquia';

/**
 * Relatório de servidores da diretoria e subordinadas, pelo motor único (`rh-diretoria-hierarquia`).
 * `_incluirLogos` ficou só pela assinatura: os logos seguem a configuração de impressão do cliente.
 */
export async function gerarRelatorioServidoresDiretoria(
  diretoria: UnidadeComServidores,
  _incluirLogos: boolean = true,
): Promise<void> {
  const d = await emitirDocumento('rh-diretoria-hierarquia', { diretoria, carimboArquivo: format(new Date(), 'yyyy-MM-dd-HHmm') });
  baixarDocumento(d);
}
