/**
 * ACESSO ÀS IMAGENS DA INSTITUIÇÃO
 *
 * Ponto único de leitura das logos. Substitui os `import logo from
 * '@/assets/logo-idjuv-*'` espalhados pelo núcleo: o arquivo físico saiu de
 * `src/assets/` e passou a viver em `tenants/<slug>/assets/`.
 *
 * Use `getMarcaAssets()` em libs puras (geradores de PDF, serviços) e
 * `useMarcaAssets()` dentro de componentes React.
 */

import { getTenantSnapshot } from './snapshot';
import type { TenantAssets } from './types';

/** Imagens do tenant ativo, de forma síncrona. */
export function getMarcaAssets(): TenantAssets {
  return getTenantSnapshot().marca.assets;
}

/**
 * Logo do órgão para o fundo indicado.
 * `'auto'` não existe aqui de propósito: quem sabe o tema é o componente.
 */
export function logoOrgao(fundo: 'claro' | 'escuro' = 'claro'): string {
  const assets = getMarcaAssets();
  return fundo === 'escuro' ? assets.logoDark : assets.logoLight;
}

/**
 * Logo da entidade superior (co-branding) para o fundo indicado.
 * Devolve `undefined` quando a instituição não tem entidade superior — o
 * chamador decide se omite o espaço ou usa só a logo do órgão.
 */
export function logoEntidadeSuperior(
  fundo: 'claro' | 'escuro' = 'claro'
): string | undefined {
  const assets = getMarcaAssets();
  return fundo === 'escuro'
    ? assets.entidadeSuperiorDark ?? assets.entidadeSuperiorLight
    : assets.entidadeSuperiorLight;
}
