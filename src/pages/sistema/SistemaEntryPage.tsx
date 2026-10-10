/**
 * SISTEMA ENTRY PAGE
 * 
 * Página de entrada que decide para onde redirecionar o usuário.
 * - 0 módulos: Acesso negado
 * - 1 módulo: Redirect automático
 * - 2+ módulos: HUB com cards
 * 
 * @version 1.0.0
 */

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useModuleRouter } from "@/hooks/useModuleRouter";
import { Loader2 } from "lucide-react";
import ModuleHubPage from "./ModuleHubPage";

export default function SistemaEntryPage() {
  const navigate = useNavigate();
  const { 
    isLoading, 
    shouldRedirect, 
    redirectPath,
    isMultiModule 
  } = useModuleRouter();

  // Redirect automático
  useEffect(() => {
    if (!isLoading && shouldRedirect && redirectPath) {
      navigate(redirectPath, { replace: true });
    }
  }, [isLoading, shouldRedirect, redirectPath, navigate]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4" role="status" aria-live="polite">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" aria-hidden="true" />
          <div>
            <p className="text-h3 text-foreground">Carregando seu ambiente...</p>
            <p className="text-body text-muted-foreground">Verificando permissões</p>
          </div>
        </div>
      </div>
    );
  }

  // Se precisa redirecionar, mostrar loading enquanto navega
  if (shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4" role="status" aria-live="polite">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" aria-hidden="true" />
          <p className="text-h3 text-foreground">Redirecionando...</p>
        </div>
      </div>
    );
  }

  // Multi-módulo: mostra HUB
  if (isMultiModule) {
    return <ModuleHubPage />;
  }

  // Fallback (não deve acontecer)
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-body text-muted-foreground" role="status">
        Carregando...
      </p>
    </div>
  );
}
