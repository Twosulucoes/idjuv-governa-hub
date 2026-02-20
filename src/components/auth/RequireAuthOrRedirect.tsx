import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

/**
 * Componente que protege rotas internas.
 * Se o usuário não estiver autenticado, redireciona para /auth.
 * Se estiver autenticado, renderiza a rota normalmente.
 */
const RequireAuthOrRedirect = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Usa isAuthenticated (baseado em session) para não bloquear enquanto user carrega
  // Se não há sessão, redireciona para login
  if (!isAuthenticated && !user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Se há sessão mas user ainda carregando, mostra spinner
  if (isAuthenticated && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <Outlet />;
};

export default RequireAuthOrRedirect;
