// ============================================
// COMPONENTE DE ROTA PROTEGIDA — RBAC ATIVO
// ============================================
// Regras de acesso (nesta ordem):
//   1. Enquanto carrega a sessão, exibe um loader.
//   2. Sem autenticação → redireciona para /auth (guardando a origem).
//   3. Troca de senha obrigatória → força /trocar-senha-obrigatoria.
//   4. Super admin → bypass total.
//   5. requiredModule / requiredPermissions → checa via AuthContext.
//      As permissões são hierárquicas (ter o módulo "rh" concede "rh.*").
//   6. Sem acesso → redireciona para a página de acesso negado.

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredModule?: string;
  requiredPermissions?: string | string[];
  accessDeniedPath?: string;
}

const ROTA_TROCA_SENHA = '/trocar-senha-obrigatoria';

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredModule,
  requiredPermissions,
  accessDeniedPath = '/acesso-negado',
}) => {
  const {
    user,
    isAuthenticated,
    isLoading,
    isSuperAdmin,
    hasPermission,
    hasAnyPermission,
  } = useAuth();
  const location = useLocation();

  // 1. Aguardando resolução da sessão
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 2. Não autenticado
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // 3. Troca de senha obrigatória (evita loop na própria rota de troca)
  if (user?.requiresPasswordChange && location.pathname !== ROTA_TROCA_SENHA) {
    return <Navigate to={ROTA_TROCA_SENHA} replace />;
  }

  // 4. Super admin acessa tudo
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // 5. Verificação por módulo
  if (requiredModule && !hasPermission(requiredModule)) {
    return <Navigate to={accessDeniedPath} replace />;
  }

  // 5. Verificação por permissões (basta ter uma das declaradas)
  if (requiredPermissions) {
    const perms = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];
    if (perms.length > 0 && !hasAnyPermission(perms)) {
      return <Navigate to={accessDeniedPath} replace />;
    }
  }

  // 6. Autorizado
  return <>{children}</>;
};

export default ProtectedRoute;
