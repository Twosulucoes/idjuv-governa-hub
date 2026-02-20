/**
 * Wrapper que verifica o status da página pública antes de renderizar
 * Lógica fail-open: em caso de erro, timeout ou indisponibilidade, renderiza normalmente
 */

import { ReactNode, useEffect, useState } from "react";
import { useStatusPagina } from "@/hooks/useConfigPaginasPublicas";
import { PaginaManutencao } from "./PaginaManutencao";
import { PaginaDesativada } from "./PaginaDesativada";

interface Props {
  rota: string;
  children: ReactNode;
  fallbackRota?: string;
}

export function PublicPageGuard({ rota, children, fallbackRota }: Props) {
  const { data: status, isLoading, isError } = useStatusPagina(rota);
  const { data: statusFallback } = useStatusPagina(fallbackRota || "");
  const [timedOut, setTimedOut] = useState(false);

  // Timeout de segurança: se não resolver em 3s, renderiza os filhos (fail-open)
  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => setTimedOut(true), 3000);
    return () => clearTimeout(t);
  }, [isLoading]);

  // Fail-open: erro, timeout ou sem dados → renderiza filhos normalmente
  if (isError || timedOut) return <>{children}</>;
  if (isLoading) return <>{children}</>;

  const statusAtivo = status || statusFallback;

  if (!statusAtivo) return <>{children}</>;
  if (!statusAtivo.ativo) return <PaginaDesativada />;
  if (statusAtivo.em_manutencao) {
    return (
      <PaginaManutencao
        titulo={statusAtivo.titulo_manutencao || undefined}
        mensagem={statusAtivo.mensagem_manutencao || undefined}
        previsaoRetorno={statusAtivo.previsao_retorno}
      />
    );
  }

  return <>{children}</>;
}
