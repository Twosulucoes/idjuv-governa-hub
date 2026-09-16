/**
 * HOOKS DE CONSUMO DO TENANT
 *
 * Fora do React (geradores de PDF, formatters, serviços), use
 * `getTenantSnapshot()` — estas funções dependem do contexto.
 */

import { useContext } from 'react';
import { TenantContext } from './context';
import type {
  TenantConfig,
  TenantIdentidade,
  TenantMarca,
  TenantAssets,
} from './types';

/** Perfil completo da instituição ativa. */
export function useTenant(): TenantConfig {
  return useContext(TenantContext);
}

/** Atalho para a identificação jurídica do órgão. */
export function useIdentidade(): TenantIdentidade {
  return useContext(TenantContext).identidade;
}

/** Atalho para marca (paleta, cor canônica, proporções de logo). */
export function useMarca(): TenantMarca {
  return useContext(TenantContext).marca;
}

/** Atalho para as imagens da instituição (logos, ícones). */
export function useMarcaAssets(): TenantAssets {
  return useContext(TenantContext).marca.assets;
}

/** Verifica se um módulo está contratado por esta instituição. */
export function useModuloHabilitado(codigo: string): boolean {
  const { modulos } = useContext(TenantContext);
  return (modulos as string[]).includes(codigo);
}
