/**
 * Wrapper que verifica o status da página pública antes de renderizar
 * ACESSO TOTAL: Sem consulta ao banco - todas as páginas sempre acessíveis
 */

import { ReactNode } from "react";

interface Props {
  rota: string;
  children: ReactNode;
  fallbackRota?: string;
}

export function PublicPageGuard({ children }: Props) {
  return <>{children}</>;
}
