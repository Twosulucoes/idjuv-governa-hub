import type { TenantConfig } from '@/core/tenant';
import { hexParaRGB } from './core/tokens';
import type { LogoImpressao, MarcaImpressao } from './tipos';

/** "Av. X, 10, Anexo Y – Bairro – CEP 00.000-000 – Cidade/UF": junta só o que existir. */
export function enderecoDoTenant(t: TenantConfig): string {
  const e = t.endereco;
  if (!e) return '';
  const rua = [e.logradouro, e.numero].filter(Boolean).join(', ');
  const ruaComComplemento = [rua, e.complemento].filter(Boolean).join(', ');
  const cidade = [e.cidade, e.uf].filter(Boolean).join('/');
  return [ruaComComplemento, e.bairro, e.cep ? `CEP ${e.cep}` : '', cidade].filter(Boolean).join(' – ');
}

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
    enderecoRodape: enderecoDoTenant(tenant) || undefined,
  };
}
