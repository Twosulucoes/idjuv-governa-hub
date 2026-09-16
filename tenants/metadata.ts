/**
 * REGISTRO DE METADADOS DE BUILD
 *
 * Lido pelo `vite.config.ts`. Mantém a mesma regra do `tenants/index.ts`:
 * slug ausente ou desconhecido cai no template neutro, nunca em um cliente.
 *
 * Mantenha este registro em sincronia com `tenants/index.ts` — os dois listam
 * os mesmos slugs, um para o build e outro para o runtime.
 */

import type { TenantMetadata } from './metadata.types';
import { idjuvMetadata } from './idjuv/metadata';
import { templateMetadata } from './_template/metadata';

export const TENANTS_METADATA: Record<string, TenantMetadata> = {
  idjuv: idjuvMetadata,
  _template: templateMetadata,
};

export const TENANT_METADATA_PADRAO = '_template';

/**
 * Resolve os metadados de build a partir do slug.
 *
 * Avisa alto quando o slug é desconhecido: um deploy com a marca errada é pior
 * do que um deploy sem marca, e no build ainda dá tempo de corrigir.
 */
export function resolverMetadata(slug?: string): TenantMetadata {
  const alvo = (slug ?? '').trim();

  if (!alvo) {
    return TENANTS_METADATA[TENANT_METADATA_PADRAO];
  }

  const metadata = TENANTS_METADATA[alvo];
  if (!metadata) {
    console.warn(
      `[tenant] VITE_TENANT_SLUG="${alvo}" não está registrado em tenants/metadata.ts. ` +
        `Build usando o perfil neutro "${TENANT_METADATA_PADRAO}". ` +
        `Slugs disponíveis: ${Object.keys(TENANTS_METADATA).join(', ')}.`
    );
    return TENANTS_METADATA[TENANT_METADATA_PADRAO];
  }

  return metadata;
}

export type { TenantMetadata, TenantIcones } from './metadata.types';
