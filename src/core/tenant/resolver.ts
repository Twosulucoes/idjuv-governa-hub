/**
 * RESOLUÇÃO DO TENANT ATIVO
 *
 * Precedência (docs/WHITE_LABEL.md §3):
 *   Banco (Fase 3) → perfil do tenant → .env → fallback genérico do core
 *
 * Na Fase 0 só as duas camadas de baixo existem: o slug vem do ambiente e o
 * perfil vem de `tenants/`. A sobreposição pelo banco entra na Fase 3, neste
 * mesmo ponto, sem mudar quem consome.
 */

import { TENANTS, TENANT_PADRAO } from '@tenants/index';
import { definirTenant } from './snapshot';
import type { TenantConfig } from './types';

function slugDoAmbiente(): string {
  const bruto = import.meta.env?.VITE_TENANT_SLUG;
  return typeof bruto === 'string' && bruto.trim() ? bruto.trim() : '';
}

/**
 * Resolve o perfil do tenant a partir do ambiente.
 *
 * Um slug desconhecido NÃO cai em outro cliente — cai no template neutro e
 * avisa. Cair no IDJUV seria pior: o deploy subiria com a marca errada e
 * ninguém perceberia.
 */
export function resolverTenant(): TenantConfig {
  const slug = slugDoAmbiente();

  if (!slug) {
    return TENANTS[TENANT_PADRAO];
  }

  const config = TENANTS[slug];
  if (!config) {
    console.warn(
      `[tenant] VITE_TENANT_SLUG="${slug}" não está registrado em tenants/index.ts. ` +
        `Usando o perfil neutro "${TENANT_PADRAO}". Slugs disponíveis: ${Object.keys(TENANTS).join(', ')}.`
    );
    return TENANTS[TENANT_PADRAO];
  }

  return config;
}

/**
 * Tenant ativo desta build. Resolvido uma única vez, no carregamento do módulo,
 * para que `getTenantSnapshot()` já esteja disponível às libs puras (geradores
 * de PDF etc.) antes do primeiro render.
 */
export const TENANT_ATIVO: TenantConfig = resolverTenant();

definirTenant(TENANT_ATIVO);
