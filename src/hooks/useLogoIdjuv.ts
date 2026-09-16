import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { getMarcaAssets } from '@/core/tenant';

// Marca vem do perfil do tenant, não de '@/assets' (White Label — Fase 1).
const { logoDark, logoLight: logoOficial } = getMarcaAssets();

/**
 * Hook para retornar a logo correta do IDJUV baseada no tema atual.
 * 
 * Regras:
 * - Fundo claro (light theme) → logo do órgão para fundo claro
 * - Fundo escuro (dark theme) → logo do órgão para fundo escuro
 *
 * As imagens vêm de `tenants/<slug>/assets/` via `getMarcaAssets()`.
 * 
 * @param forceVariant - Força uma variante específica ('light' | 'dark')
 * @returns O caminho da logo apropriada
 */
export function useLogoIdjuv(forceVariant?: 'light' | 'dark'): string {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Se forçar uma variante específica, retornar imediatamente
  if (forceVariant === 'dark') return logoDark;
  if (forceVariant === 'light') return logoOficial;

  // Antes do mount, retornar versão oficial (para hidratação)
  if (!mounted) return logoOficial;

  // Baseado no tema atual
  return resolvedTheme === 'dark' ? logoDark : logoOficial;
}

/**
 * Retorna a logo oficial (para fundos claros) - uso em PDFs e componentes estáticos
 */
export const logoIdjuvOficial = logoOficial;

/**
 * Retorna a logo dark (para fundos escuros)
 */
export const logoIdjuvDark = logoDark;