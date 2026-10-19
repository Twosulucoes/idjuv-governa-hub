import type { TenantConfig } from '@/core/tenant';
import { ESTILO_PADRAO, hexParaRGB } from './core/tokens';
import type { EstiloImpressao, LogoImpressao, MarcaImpressao } from './tipos';

/**
 * Identidade impressa a partir do tenant. Pura: nome do sistema e logos já carregados vêm de fora.
 * A configuração de impressão (`tenant.impressao`) troca a cor e pode esconder cada logo.
 */
export function marcaDoTenant(
  tenant: TenantConfig,
  extras: { nomeSistema: string; logoOrgao?: LogoImpressao; logoEntidadeSuperior?: LogoImpressao },
): MarcaImpressao {
  const { identidade, entidadeSuperior, impressao } = tenant;
  return {
    nomeOrgao: identidade.nomeParaDocumentos ?? identidade.nomeOficial.toUpperCase(),
    entidadeSuperior: entidadeSuperior?.exibirEmDocumentos ? entidadeSuperior.nome.toUpperCase() : undefined,
    nomeSistema: extras.nomeSistema,
    corPrimaria: hexParaRGB(impressao?.corDestaqueHex ?? tenant.marca.corPrimariaHex),
    logoOrgao: impressao?.mostrarLogoOrgao === false ? undefined : extras.logoOrgao,
    logoEntidadeSuperior: impressao?.mostrarLogoEntidadeSuperior === false ? undefined : extras.logoEntidadeSuperior,
  };
}

/** Padronização configurada na tela (Configuração do cliente → Impressão de documentos). Pura. */
export function estiloDoTenant(tenant: TenantConfig): EstiloImpressao {
  const i = tenant.impressao ?? {};
  return {
    escala: i.tamanhoLetra ?? ESTILO_PADRAO.escala,
    zebra: i.tabelaListrada ?? ESTILO_PADRAO.zebra,
    mostrarEmissor: i.mostrarEmissor ?? ESTILO_PADRAO.mostrarEmissor,
    orientacao: i.orientacao ?? ESTILO_PADRAO.orientacao,
    linhaCabecalho: i.linhaCabecalho?.trim() || undefined,
    textoRodape: i.textoRodape?.trim() || undefined,
  };
}
