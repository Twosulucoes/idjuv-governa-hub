// ============================================
// COMPONENTE DE ROTA PROTEGIDA — RBAC ATIVO
// ============================================
// Regras de acesso (nesta ordem):
//   1. Enquanto carrega a sessão, exibe um loader.
//   2. Sem autenticação → redireciona para /auth (guardando a origem).
//   3. Troca de senha obrigatória → força /trocar-senha-obrigatoria.
//   4. Módulo não contratado pela instituição → 404 (antes do bypass de super
//      admin: se a instituição não contratou, nem o super admin deve ver).
//   5. Super admin → bypass total.
//   6. requiredModule / requiredPermissions → checa via AuthContext.
//      requiredModule checa o módulo (user_modules); requiredPermissions exige
//      o código granular, que vem de role_permissions, user_permissions ou
//      user_modules.permissions. Ter o módulo "rh" NÃO concede "rh.*".
//   7. Sem acesso → redireciona para a página de acesso negado.

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { moduloHabilitado } from '@/shared/config/modules.config';
import NotFound from '@/pages/NotFound';

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

  // 4. Módulo não contratado pela instituição
  //
  // Vem ANTES do bypass de super admin de propósito: "não contratado" não é
  // falta de permissão, é funcionalidade que não existe nesta instância. E
  // devolve 404, não /acesso-negado, para não revelar o catálogo do produto a
  // quem não o contratou.
  if (requiredModule && !moduloHabilitado(requiredModule)) {
    return <NotFound />;
  }

  // 5. Super admin acessa tudo
  if (isSuperAdmin) {
    return <>{children}</>;
  }

  // 6. Verificação por módulo
  if (requiredModule && !hasPermission(requiredModule)) {
    return <Navigate to={accessDeniedPath} replace />;
  }

  // 7. Verificação por permissões (basta ter uma das declaradas)
  if (requiredPermissions) {
    const perms = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];
    if (perms.length > 0 && !hasAnyPermission(perms)) {
      return <Navigate to={accessDeniedPath} replace />;
    }
  }

  // 8. Autorizado
  return <>{children}</>;
};

export default ProtectedRoute;
