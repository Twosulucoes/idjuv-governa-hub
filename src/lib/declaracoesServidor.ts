import { getTenantSnapshot } from '@/core/tenant';
import { baixarDocumento, emitirDocumento, localDaSede } from '@/lib/documentos';
import type { DeclaranteServidor } from '@/lib/documentos/modelos/declaracoes/comum';

/**
 * Declarações do servidor e relação de documentos pelo motor único (`src/lib/documentos/`). Sem `servidor`, sai a
 * versão em branco para preencher à mão. Nome do órgão e sede vêm da identidade do tenant, nunca do código.
 */
export type TipoDeclaracao = 'declaracoes-acumulacao' | 'declaracoes-bens' | 'declaracoes-residencia';

export type { DeclaranteServidor };

export async function baixarDeclaracao(tipo: TipoDeclaracao, servidor?: DeclaranteServidor): Promise<void> {
  const data = servidor ? new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : undefined;
  const dados = { servidor, orgao: getTenantSnapshot().identidade.nomeOficial, local: localDaSede(), data };
  baixarDocumento(await emitirDocumento(tipo, dados));
}

export const baixarDeclaracaoAcumulacao = (servidor?: DeclaranteServidor) => baixarDeclaracao('declaracoes-acumulacao', servidor);
export const baixarDeclaracaoBens = (servidor?: DeclaranteServidor) => baixarDeclaracao('declaracoes-bens', servidor);

export async function baixarRelacaoDocumentos(): Promise<void> {
  baixarDocumento(await emitirDocumento('declaracoes-relacao-documentos', { orgao: getTenantSnapshot().identidade.nomeOficial }));
}
