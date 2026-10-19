/**
 * Ficha Cadastral de Unidade Local, pelo motor único (`unidades-ficha-unidade-local`).
 * Documento completo com todos os dados de uma unidade.
 */
import { getTenantSnapshot } from '@/core/tenant';
import { baixarDocumento, emitirDocumento } from '@/lib/documentos';
import type { FichaUnidadeLocalData } from '@/lib/documentos/modelos/unidades/fichaUnidadeLocal';

export type { FichaUnidadeLocalData } from '@/lib/documentos/modelos/unidades/fichaUnidadeLocal';

/** Gera e baixa o PDF da ficha. A UF do município, se não vier nos dados, é a da sede do órgão. */
export async function generateFichaUnidadeLocal(data: FichaUnidadeLocalData): Promise<void> {
  const uf = data.localizacao.uf ?? getTenantSnapshot().endereco?.uf;
  const d = await emitirDocumento('unidades-ficha-unidade-local', {
    ...data,
    localizacao: { ...data.localizacao, uf },
  });
  baixarDocumento(d);
}
