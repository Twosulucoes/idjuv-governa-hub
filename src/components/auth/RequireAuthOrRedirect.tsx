import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useModulosUsuario } from "@/hooks/useModulosUsuario";

/**
 * Middleware de autenticação e controle de acesso.
 * - Não autenticado → /auth
 * - Conta bloqueada (is_active=false) → /acesso-negado?reason=blocked
 * - Autenticado e ativo → renderiza a rota
 */
const RequireAuthOrRedirect = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const { isActive, loading: modulosLoading } = useModulosUsuario();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Sem sessão → login
  if (!isAuthenticated && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Sessão existe mas user ainda carregando
  if (isAuthenticated && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Aguardar verificação de módulos/status
  if (modulosLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Admin nunca é bloqueado pela UI (proteção extra no banco)
  if (!user?.isSuperAdmin && !isActive) {
    return <Navigate to="/acesso-negado?reason=blocked" replace />;
  }

  return <Outlet />;
};

export default RequireAuthOrRedirect;

