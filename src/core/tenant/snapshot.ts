/**
 * SNAPSHOT SÍNCRONO DO TENANT
 *
 * Existe porque boa parte do núcleo NÃO é React: os ~38 geradores de PDF em
 * `src/lib/`, os geradores Word/CNAB/eSocial e os formatters são funções puras
 * e não podem chamar hooks. Elas leem a identidade por aqui.
 *
 * O snapshot é resolvido no carregamento do módulo (ver `resolver.ts`), antes
 * de qualquer render, então nunca há leitura de valor indefinido.
 */

import type { TenantConfig } from './types';

let snapshot: TenantConfig | null = null;

/** Define o tenant ativo. Chamado uma vez no bootstrap. */
export function definirTenant(config: TenantConfig): void {
  snapshot = config;
}

/**
 * Tenant ativo, de forma síncrona.
 * @throws se chamado antes do bootstrap — falha alto e cedo em vez de
 *         devolver um documento sem identidade.
 */
export function getTenantSnapshot(): TenantConfig {
  if (!snapshot) {
    throw new Error(
      '[tenant] Snapshot não inicializado. Importe "@/core/tenant" antes de usar getTenantSnapshot().'
    );
  }
  return snapshot;
}

/** Igual a getTenantSnapshot, mas devolve null em vez de lançar. */
export function getTenantSnapshotOuNulo(): TenantConfig | null {
  return snapshot;
}
