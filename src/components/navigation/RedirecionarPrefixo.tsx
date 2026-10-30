import { Navigate, useLocation } from "react-router-dom";

/**
 * Endereço que mudou de lugar: troca o começo do caminho e mantém o resto, a busca e o âncora.
 * Ex.: /contratos/passagens/123?aba=x → /gabinete/passagens/123?aba=x (links salvos e do localizador SEI).
 */
export function RedirecionarPrefixo({ de, para }: { de: string; para: string }) {
  const { pathname, search, hash } = useLocation();
  const resto = pathname.toLowerCase().startsWith(de.toLowerCase()) ? pathname.slice(de.length) : "";
  return <Navigate to={`${para}${resto}${search}${hash}`} replace />;
}
