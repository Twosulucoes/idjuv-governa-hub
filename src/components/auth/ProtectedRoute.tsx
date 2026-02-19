// ============================================
// COMPONENTE DE ROTA PROTEGIDA — VERSÃO CORRIGIDA
// ============================================
// CORREÇÃO: Removido e-mail hardcoded como bypass de segurança.
// O bypass agora é baseado exclusivamente em isSuperAdmin do AuthContext.

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
  const { isLoading, isAuthenticated, isSuperAdmin, hasAnyPermission } = useAuth();
  const { loading: moduleLoading, temAcessoModulo } = useModulosUsuario();
  const location = useLocation();

  // 1. CARREGAMENTO
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

  // 2. AUTENTICAÇÃO
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 3. BYPASS PARA SUPER ADMIN
  // ✅ CORREÇÃO: Sem e-mail hardcoded. Apenas a flag do banco de dados decide.
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // 4. VERIFICAÇÃO DE MÓDULO
  if (requiredModule && !temAcessoModulo(requiredModule as any)) {
    console.warn(`[Acesso Negado] Usuário sem acesso ao módulo: ${requiredModule}`);
    return <Navigate to={accessDeniedPath} state={{ from: location }} replace />;
  }

  // 5. VERIFICAÇÃO DE PERMISSÕES
  if (requiredPermissions) {
    const permissions = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];
    if (!hasAnyPermission(permissions)) {
      return <Navigate to={accessDeniedPath} state={{ from: location }} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
