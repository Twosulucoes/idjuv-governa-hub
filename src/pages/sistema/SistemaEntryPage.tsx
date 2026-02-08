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
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <div>
            <p className="text-lg font-medium">Carregando seu ambiente...</p>
            <p className="text-sm text-muted-foreground">Verificando permissões</p>
          </div>
        </div>
      </div>
    );
  }

  // Se precisa redirecionar, mostrar loading enquanto navega
  if (shouldRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-lg font-medium">Redirecionando...</p>
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
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  );
}
