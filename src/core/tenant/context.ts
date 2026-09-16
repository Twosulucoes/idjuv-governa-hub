/**
 * Contexto do tenant, isolado do componente.
 *
 * Fica em arquivo próprio para que `TenantProvider.tsx` exporte apenas o
 * componente — requisito do Fast Refresh (react-refresh/only-export-components).
 */

import { createContext } from 'react';
import { TENANT_ATIVO } from './resolver';
import type { TenantConfig } from './types';

export const TenantContext = createContext<TenantConfig>(TENANT_ATIVO);
