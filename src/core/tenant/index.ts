/**
 * NÚCLEO DE TENANT (White Label)
 *
 * Ponto de entrada único. O restante do sistema importa daqui — nunca de
 * `tenants/<slug>` direto, nunca dos submódulos internos.
 *
 * Ver docs/WHITE_LABEL.md
 */

export type {
  TenantConfig,
  TenantIdentidade,
  TenantEntidadeSuperior,
  TenantMarca,
  TenantAssets,
  TenantEndereco,
  TenantContato,
  TenantLegal,
  TenantIntegracoes,
  TenantFeatures,
  Paleta,
  PaletaModo,
  TokenHSL,
  Vertical,
} from './types';

export { TENANT_ATIVO, resolverTenant } from './resolver';
export { getTenantSnapshot, getTenantSnapshotOuNulo, definirTenant } from './snapshot';
export { aplicarTema, cssDoTema } from './tema';
export { fallbackDadosOficiais } from './dadosOficiais';
export { getMarcaAssets, logoOrgao, logoEntidadeSuperior } from './marca';
export { useLogoOrgao, useLogoEntidadeSuperior } from './useLogo';
export type { VarianteLogo } from './useLogo';
export { TenantProvider } from './TenantProvider';
export { TenantContext } from './context';
export {
  useTenant,
  useIdentidade,
  useMarca,
  useMarcaAssets,
  useModuloHabilitado,
} from './useTenant';
