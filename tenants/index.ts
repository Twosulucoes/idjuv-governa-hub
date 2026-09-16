/**
 * REGISTRO DE TENANTS
 *
 * Único lugar do repositório autorizado a importar `tenants/<slug>/...`.
 * O núcleo consome pelo resolver em `src/core/tenant` — nunca daqui direto.
 *
 * Para adicionar um cliente: copie `_template`, preencha, e registre o slug
 * abaixo. Ver docs/WHITE_LABEL.md §4.
 */

import type { TenantConfig } from '@/core/tenant/types';
import { idjuvConfig } from './idjuv/tenant.config';
import { templateConfig } from './_template/tenant.config';

export const TENANTS: Record<string, TenantConfig> = {
  idjuv: idjuvConfig,
  _template: templateConfig,
};

/** Usado quando VITE_TENANT_SLUG não está definido. */
export const TENANT_PADRAO = '_template';

export { idjuvConfig, templateConfig };
