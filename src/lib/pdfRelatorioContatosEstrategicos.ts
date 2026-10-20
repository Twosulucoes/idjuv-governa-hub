import { format } from 'date-fns';
import { baixarDocumento, emitirDocumento } from '@/lib/documentos';
import type { ServidorContato } from '@/lib/documentos/modelos/rh/contatosEstrategicos';

/**
 * Relatório de contatos estratégicos, pelo motor único (`rh-contatos-estrategicos`).
 * `_incluirLogos` ficou só pela assinatura: os logos seguem a configuração de impressão do cliente.
 */
export async function gerarRelatorioContatosEstrategicos(
  servidores: ServidorContato[],
  _incluirLogos: boolean = true,
): Promise<void> {
  const d = await emitirDocumento('rh-contatos-estrategicos', { servidores, carimboArquivo: format(new Date(), 'yyyy-MM-dd-HHmm') });
  baixarDocumento(d);
}
