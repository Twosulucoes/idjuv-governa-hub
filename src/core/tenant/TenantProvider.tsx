/**
 * TENANT PROVIDER
 *
 * Disponibiliza o perfil da instituição para a árvore React e aplica a paleta
 * de marca. Deve envolver o app inteiro — inclusive rotas públicas, que também
 * exibem marca.
 *
 * O perfil já foi resolvido no carregamento do módulo (`resolver.ts`), então
 * não há estado de "carregando": o provider só publica o que já existe.
 */

import { useEffect, type ReactNode } from 'react';
import { TenantContext } from './context';
import { TENANT_ATIVO } from './resolver';
import { aplicarTema } from './tema';
import type { TenantConfig } from './types';

interface TenantProviderProps {
  children: ReactNode;
  /** Sobrescreve o tenant ativo — usado em testes e no preview de marca. */
  config?: TenantConfig;
}

export function TenantProvider({ children, config }: TenantProviderProps) {
  const tenant = config ?? TENANT_ATIVO;

  useEffect(() => {
    aplicarTema(tenant.marca.paleta);
  }, [tenant]);

  return (
    <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>
  );
}
