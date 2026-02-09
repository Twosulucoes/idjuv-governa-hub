/**
 * Wrapper que verifica o status da página pública antes de renderizar
 * Se a página estiver em manutenção ou desativada, exibe a tela apropriada
 */

import { ReactNode } from "react";
import { useStatusPagina } from "@/hooks/useConfigPaginasPublicas";
import { PaginaManutencao } from "./PaginaManutencao";
import { PaginaDesativada } from "./PaginaDesativada";
import { Loader2 } from "lucide-react";

interface Props {
  rota: string;
  children: ReactNode;
  fallbackRota?: string; // Rota alternativa para verificar (ex: rota pai)
}

export function PublicPageGuard({ rota, children, fallbackRota }: Props) {
  const { data: status, isLoading } = useStatusPagina(rota);
  const { data: statusFallback } = useStatusPagina(fallbackRota || "");

  // Enquanto carrega, mostrar loading simples
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Usar status da rota específica ou fallback
  const statusAtivo = status || statusFallback;

  // Se não há configuração, permitir acesso (página não controlada)
  if (!statusAtivo) {
    return <>{children}</>;
  }

  // Se página desativada
  if (!statusAtivo.ativo) {
    return <PaginaDesativada />;
  }

  // Se página em manutenção
  if (statusAtivo.em_manutencao) {
    return (
      <PaginaManutencao
        titulo={statusAtivo.titulo_manutencao || undefined}
        mensagem={statusAtivo.mensagem_manutencao || undefined}
        previsaoRetorno={statusAtivo.previsao_retorno}
      />
    );
  }

  // Página ok, renderizar conteúdo
  return <>{children}</>;
}
