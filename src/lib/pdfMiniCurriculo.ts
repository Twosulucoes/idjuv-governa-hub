import { getTenantSnapshot } from '@/core/tenant';
import type { PreCadastro } from '@/types/preCadastro';

/**
 * Formulário de pré-cadastro (mini-currículo), pelo motor único (`curriculo-mini-curriculo`).
 * Também roda no site institucional (/curriculo, sem usuário logado). A página inteira já é carregada sob
 * demanda no site; o import dinâmico só separa o registro de modelos do chunk da página.
 */
export async function gerarPdfMiniCurriculo(dados: Partial<PreCadastro>): Promise<void> {
  const { emitirDocumento, baixarDocumento } = await import('@/lib/documentos');
  const endereco = getTenantSnapshot().endereco;
  const local = [endereco?.cidade, endereco?.uf].filter((p) => p && p.trim()).join('/');
  const data = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const d = await emitirDocumento('curriculo-mini-curriculo', { candidato: dados, local, data });
  baixarDocumento(d);
}
