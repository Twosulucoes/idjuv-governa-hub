import { getTenantSnapshot } from '@/core/tenant';

/** "Cidade/UF" da sede, do perfil da instituição; vazio se não cadastrado (o documento deixa a linha para preencher). */
export function localDaSede(): string | undefined {
  const { cidade, uf } = getTenantSnapshot().endereco ?? {};
  return [cidade, uf].filter((p) => p && p.trim()).join('/') || undefined;
}
