/**
 * TENANT PROVIDER
 *
 * Disponibiliza o perfil da instituição para a árvore React e aplica a paleta
 * de marca. Deve envolver o app inteiro — inclusive rotas públicas, que também
 * exibem marca.
 *
 * O perfil do arquivo (`resolver.ts`) vale desde o primeiro render; em seguida
 * os dados da tabela `dados_oficiais` (tela "Configuração do cliente") são
 * aplicados por cima, sem estado de "carregando" (ver `identidadeBanco.ts`).
 */

import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { TenantContext } from './context';
import {
  assinarTenantEfetivo,
  getTenantEfetivo,
  recarregarIdentidadeDoBanco,
} from './identidadeBanco';
import { nomeDoSistema } from './produto';
import { aplicarTema } from './tema';
import type { TenantConfig } from './types';

interface TenantProviderProps {
  children: ReactNode;
  /** Sobrescreve o tenant ativo — usado em testes e no preview de marca. */
  config?: TenantConfig;
}

export function TenantProvider({ children, config }: TenantProviderProps) {
  const efetivo = useSyncExternalStore(assinarTenantEfetivo, getTenantEfetivo);
  const tenant = config ?? efetivo;

  useEffect(() => {
    if (!config) void recarregarIdentidadeDoBanco();
  }, [config]);

  useEffect(() => {
    aplicarTema(tenant.marca.paleta);
  }, [tenant.marca.paleta]);

  useEffect(() => {
    document.title = nomeDoSistema(tenant);
  }, [tenant]);

  return (
    <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>
  );
}
