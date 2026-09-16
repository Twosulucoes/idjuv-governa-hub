/**
 * SELEÇÃO DE LOGO POR TEMA
 *
 * Resolve qual variante da logo usar conforme o fundo. A regra é do produto
 * (fundo claro → logo clara, fundo escuro → logo escura); a imagem é do tenant.
 *
 * Fora do React, use `logoOrgao()` / `logoEntidadeSuperior()` de `./marca`.
 */

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useMarcaAssets } from './useTenant';

/** Variante explícita de fundo; `'auto'` segue o tema ativo. */
export type VarianteLogo = 'auto' | 'light' | 'dark';

/**
 * Indica se o tema já foi resolvido no cliente.
 *
 * `next-themes` só conhece o tema após a montagem. Renderizar antes disso
 * causaria troca visível de logo; até lá assumimos fundo claro.
 */
function useTemaMontado(): boolean {
  const [montado, setMontado] = useState(false);
  useEffect(() => setMontado(true), []);
  return montado;
}

/** `true` quando o fundo efetivo é escuro, considerando a variante forçada. */
function useFundoEscuro(variante: VarianteLogo): boolean {
  const { resolvedTheme } = useTheme();
  const montado = useTemaMontado();

  if (variante === 'dark') return true;
  if (variante === 'light') return false;
  return montado && resolvedTheme === 'dark';
}

/** Logo do órgão apropriada ao fundo. */
export function useLogoOrgao(variante: VarianteLogo = 'auto'): string {
  const { logoLight, logoDark } = useMarcaAssets();
  return useFundoEscuro(variante) ? logoDark : logoLight;
}

/**
 * Logo da entidade superior (co-branding) apropriada ao fundo.
 * `undefined` quando a instituição não tem entidade superior — o chamador
 * decide entre omitir o espaço ou exibir só a logo do órgão.
 */
export function useLogoEntidadeSuperior(
  variante: VarianteLogo = 'auto'
): string | undefined {
  const { entidadeSuperiorLight, entidadeSuperiorDark } = useMarcaAssets();
  const escuro = useFundoEscuro(variante);
  return escuro
    ? entidadeSuperiorDark ?? entidadeSuperiorLight
    : entidadeSuperiorLight;
}
