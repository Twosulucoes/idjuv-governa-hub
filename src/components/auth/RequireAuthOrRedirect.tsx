import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

/**
 * Componente que protege rotas internas.
 * Se o usuário não estiver autenticado, redireciona para /curriculo.
 * Se estiver autenticado, renderiza a rota normalmente.
 */
const RequireAuthOrRedirect = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Redireciona para /curriculo se não autenticado
    return <Navigate to="/curriculo" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequireAuthOrRedirect;
