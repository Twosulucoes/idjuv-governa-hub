import type { TenantConfig } from '@/core/tenant';
import { hexParaRGB } from './core/tokens';
import type { LogoImpressao, MarcaImpressao } from './tipos';

/** Identidade impressa a partir do tenant. Pura: nome do sistema e logos já carregados vêm de fora. */
export function marcaDoTenant(
  tenant: TenantConfig,
  extras: { nomeSistema: string; logoOrgao?: LogoImpressao; logoEntidadeSuperior?: LogoImpressao },
): MarcaImpressao {
  const { identidade, entidadeSuperior } = tenant;
  return {
    nomeOrgao: identidade.nomeParaDocumentos ?? identidade.nomeOficial.toUpperCase(),
    entidadeSuperior: entidadeSuperior?.exibirEmDocumentos ? entidadeSuperior.nome.toUpperCase() : undefined,
    nomeSistema: extras.nomeSistema,
    corPrimaria: hexParaRGB(tenant.marca.corPrimariaHex),
    logoOrgao: extras.logoOrgao,
    logoEntidadeSuperior: extras.logoEntidadeSuperior,
  };
}
