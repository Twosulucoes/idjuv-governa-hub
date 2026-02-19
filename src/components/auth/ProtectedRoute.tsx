// ============================================
// COMPONENTE DE ROTA PROTEGIDA - VERSÃO BLINDADA
// ============================================
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useModulosUsuario } from '@/hooks/useModulosUsuario';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredModule?: string;
  requiredPermissions?: string | string[];
  accessDeniedPath?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredModule,
  requiredPermissions,
  accessDeniedPath = '/acesso-negado',
}) => {
  const { user, isLoading, isAuthenticated, isSuperAdmin, hasAnyPermission } = useAuth();
  const { loading: moduleLoading, temAcessoModulo } = useModulosUsuario();
  const location = useLocation();

  // 1. ESTADO DE CARREGAMENTO
  if (isLoading || moduleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm font-medium">Validando credenciais...</p>
        </div>
      </div>
    );
  }

  // 2. VERIFICAÇÃO DE AUTENTICAÇÃO
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 3. BYPASS TOTAL (O FABIANO ENTRA EM QUALQUER LUGAR)
  // Se for o seu e-mail, ele ignora qualquer erro de RPC, módulo ou permissão
  if (user?.email === 'handfabiano@gmail.com' || isSuperAdmin) {
    return <>{children}</>;
  }

  // 4. VERIFICAÇÃO DE MÓDULO (Para usuários comuns)
  if (requiredModule && !temAcessoModulo(requiredModule as any)) {
    console.warn(`[Acesso Negado] Usuário sem acesso ao módulo: ${requiredModule}`);
    return <Navigate to={accessDeniedPath} state={{ from: location }} replace />;
  }

  // 5. VERIFICAÇÃO DE PERMISSÕES (Para usuários comuns)
  if (requiredPermissions) {
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    if (!hasAnyPermission(permissions)) {
      return <Navigate to={accessDeniedPath} state={{ from: location }} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
