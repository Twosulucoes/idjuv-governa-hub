// ============================================
// COMPONENTE PERMISSION GATE — VERSÃO CORRIGIDA
// ============================================
// CORREÇÃO: GuestOnly reimplementado com lógica explícita para evitar
// bug do inverse + requireAuth combinados.

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionCode } from '@/types/auth';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface PermissionGateProps {
  children: React.ReactNode;
  requiredPermissions?: PermissionCode | PermissionCode[];
  permissionMode?: 'any' | 'all';
  fallback?: React.ReactNode;
  inverse?: boolean;
  requireAuth?: boolean;
  showDisabled?: boolean;
  disabledMessage?: string;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  requiredPermissions,
  permissionMode = 'all',
  fallback = null,
  inverse = false,
  requireAuth = true,
  showDisabled = false,
  disabledMessage = 'Você não tem permissão para esta ação',
}) => {
  const { user, isAuthenticated, isSuperAdmin, hasAnyPermission, hasAllPermissions } = useAuth();

  // Verificação de autenticação
  if (requireAuth && !isAuthenticated) {
    return inverse ? <>{children}</> : <>{fallback}</>;
  }

  let hasAccess = true;

  // Super Admin tem acesso total (exceto se inverse for usado intencionalmente)
  if (!isSuperAdmin && requiredPermissions && user) {
    const permissions = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    if (permissions.length > 0) {
      hasAccess = permissionMode === 'any'
        ? hasAnyPermission(permissions)
        : hasAllPermissions(permissions);
    }
  }

  if (inverse) hasAccess = !hasAccess;

  if (hasAccess) return <>{children}</>;

  // Renderiza desabilitado com tooltip
  if (showDisabled && React.isValidElement(children)) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-not-allowed">
              {React.cloneElement(children as React.ReactElement<any>, {
                disabled: true,
                className: `${(children as React.ReactElement<any>).props.className ?? ''} opacity-50 pointer-events-none`,
              })}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{disabledMessage}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <>{fallback}</>;
};

// ============================================
// COMPONENTES AUXILIARES
// ============================================

export const SuperAdminOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showDisabled?: boolean;
}> = ({ children, fallback = null, showDisabled }) => {
  const { isSuperAdmin } = useAuth();

  if (isSuperAdmin) return <>{children}</>;

  if (showDisabled && React.isValidElement(children)) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-not-allowed">
              {React.cloneElement(children as React.ReactElement<any>, {
                disabled: true,
                className: `${(children as React.ReactElement<any>).props.className ?? ''} opacity-50 pointer-events-none`,
              })}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Apenas Super Administradores</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <>{fallback}</>;
};

export const AuthenticatedOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <PermissionGate requireAuth={true} fallback={fallback}>
    {children}
  </PermissionGate>
);

// ✅ CORREÇÃO: GuestOnly com lógica explícita, sem depender do inverse+requireAuth.
export const GuestOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? null : <>{children}</>;
};

export const CanView: React.FC<{
  module: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ module, children, fallback }) => (
  <PermissionGate requiredPermissions={`${module}.visualizar` as PermissionCode} fallback={fallback}>
    {children}
  </PermissionGate>
);

export const CanCreate: React.FC<{
  module: string;
  children: React.ReactNode;
  showDisabled?: boolean;
}> = ({ module, children, showDisabled }) => (
  <PermissionGate
    requiredPermissions={`${module}.criar` as PermissionCode}
    showDisabled={showDisabled}
    disabledMessage="Você não tem permissão para criar"
  >
    {children}
  </PermissionGate>
);

export const CanEdit: React.FC<{
  module: string;
  children: React.ReactNode;
  showDisabled?: boolean;
}> = ({ module, children, showDisabled }) => (
  <PermissionGate
    requiredPermissions={`${module}.editar` as PermissionCode}
    showDisabled={showDisabled}
    disabledMessage="Você não tem permissão para editar"
  >
    {children}
  </PermissionGate>
);

export const CanDelete: React.FC<{
  module: string;
  children: React.ReactNode;
  showDisabled?: boolean;
}> = ({ module, children, showDisabled }) => (
  <PermissionGate
    requiredPermissions={`${module}.excluir` as PermissionCode}
    showDisabled={showDisabled}
    disabledMessage="Você não tem permissão para excluir"
  >
    {children}
  </PermissionGate>
);

// Compatibilidade retroativa
export const AdminOnly = SuperAdminOnly;
export const ManagerOnly = SuperAdminOnly;

export default PermissionGate;
