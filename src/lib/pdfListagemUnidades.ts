/**
 * Listagem geral de unidades locais (e relatório de conformidade), pelo motor único (`unidades-listagem`).
 */
import { baixarDocumento, emitirDocumento } from '@/lib/documentos';
import type { ListagemUnidadesConfig, UnidadeResumo } from '@/lib/documentos/modelos/unidades/listagemUnidades';

export type { ListagemUnidadesConfig, UnidadeResumo } from '@/lib/documentos/modelos/unidades/listagemUnidades';

/** Gera e baixa o PDF da listagem de unidades locais. */
export async function generateListagemUnidades(
  unidades: UnidadeResumo[],
  config: ListagemUnidadesConfig = {}
): Promise<void> {
  baixarDocumento(await emitirDocumento('unidades-listagem', { ...config, unidades }));
}
