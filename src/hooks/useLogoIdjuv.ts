import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

// Importar ambas as versões das logos
import logoOficial from "@/assets/logo-idjuv-oficial.png";
import logoDark from "@/assets/logo-idjuv-dark4.png";

/**
 * Hook para retornar a logo correta do IDJUV baseada no tema atual.
 * 
 * Regras:
 * - Fundo claro (light theme) → logo-idjuv-oficial.png
 * - Fundo escuro (dark theme) → logo-idjuv-dark4.png
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