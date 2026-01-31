// ============================================
// COMPONENTE PERMISSION GATE - FASE 6
// ============================================
// Mostra/oculta elementos baseado em permissões
// NÃO usa roles hardcoded - apenas permissões do banco

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionCode } from '@/types/auth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface PermissionGateProps {
  children: React.ReactNode;
  
  /**
   * Permissões requeridas
   * Pode ser uma permissão única ou array
   */
  requiredPermissions?: PermissionCode | PermissionCode[];
  
  /**
   * Modo de verificação: 'any' ou 'all'
   * - 'any': precisa de pelo menos uma das permissões
   * - 'all': precisa de todas as permissões
   */
  permissionMode?: 'any' | 'all';
  
  /**
   * Componente a exibir quando sem permissão
   * Default: null (não mostra nada)
   */
  fallback?: React.ReactNode;
  
  /**
   * Se true, inverte a lógica (mostra quando NÃO tem permissão)
   */
  inverse?: boolean;
  
  /**
   * Requer autenticação
   */
  requireAuth?: boolean;
  
  /**
   * Se true, mostra elemento desabilitado com tooltip
   * em vez de ocultar completamente
   */
  showDisabled?: boolean;
  
  /**
   * Mensagem do tooltip quando desabilitado
   */
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
  disabledMessage = 'Você não tem permissão para esta ação'
}) => {
  const { 
    user, 
    isAuthenticated, 
    isSuperAdmin,
    hasAnyPermission, 
    hasAllPermissions 
  } = useAuth();

  // ============================================
  // VERIFICAÇÕES
  // ============================================

  // Verificar autenticação
  if (requireAuth && !isAuthenticated) {
    return inverse ? <>{children}</> : <>{fallback}</>;
  }

  let hasAccess = true;

  // Super Admin sempre tem acesso (exceto se inverse)
  if (!isSuperAdmin && requiredPermissions && user) {
    const permissions = Array.isArray(requiredPermissions) 
      ? requiredPermissions 
      : [requiredPermissions];
    
    if (permissions.length > 0) {
      if (permissionMode === 'any') {
        hasAccess = hasAnyPermission(permissions);
      } else {
        hasAccess = hasAllPermissions(permissions);
      }
    }
  }

  // Aplicar inversão se necessário
  if (inverse) {
    hasAccess = !hasAccess;
  }

  // ============================================
  // RENDERIZAÇÃO
  // ============================================

  if (hasAccess) {
    return <>{children}</>;
  }

  // Se showDisabled, renderizar children desabilitados com tooltip
  if (showDisabled && React.isValidElement(children)) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-not-allowed">
              {React.cloneElement(children as React.ReactElement<any>, {
                disabled: true,
                className: `${(children as React.ReactElement<any>).props.className || ''} opacity-50 pointer-events-none`
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

/**
 * Componente para mostrar conteúdo apenas para super admins
 */
export const SuperAdminOnly: React.FC<{ 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
  showDisabled?: boolean;
}> = ({ children, fallback, showDisabled }) => {
  const { isSuperAdmin } = useAuth();
  
  if (isSuperAdmin) {
    return <>{children}</>;
  }
  
  if (showDisabled && React.isValidElement(children)) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="cursor-not-allowed">
              {React.cloneElement(children as React.ReactElement<any>, {
                disabled: true,
                className: `${(children as React.ReactElement<any>).props.className || ''} opacity-50 pointer-events-none`
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

/**
 * Componente para mostrar conteúdo apenas para usuários autenticados
 */
export const AuthenticatedOnly: React.FC<{ 
  children: React.ReactNode; 
  fallback?: React.ReactNode 
}> = ({ children, fallback }) => (
  <PermissionGate requireAuth={true} fallback={fallback}>
    {children}
  </PermissionGate>
);

/**
 * Componente para mostrar conteúdo apenas para não autenticados
 */
export const GuestOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PermissionGate requireAuth={false} inverse={true}>
    {children}
  </PermissionGate>
);

/**
 * Gate para ação de visualização
 */
export const CanView: React.FC<{
  module: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ module, children, fallback }) => (
  <PermissionGate 
    requiredPermissions={`${module}.visualizar`} 
    fallback={fallback}
  >
    {children}
  </PermissionGate>
);

/**
 * Gate para ação de criação
 */
export const CanCreate: React.FC<{
  module: string;
  children: React.ReactNode;
  showDisabled?: boolean;
}> = ({ module, children, showDisabled }) => (
  <PermissionGate 
    requiredPermissions={`${module}.criar`} 
    showDisabled={showDisabled}
    disabledMessage="Você não tem permissão para criar"
  >
    {children}
  </PermissionGate>
);

/**
 * Gate para ação de edição
 */
export const CanEdit: React.FC<{
  module: string;
  children: React.ReactNode;
  showDisabled?: boolean;
}> = ({ module, children, showDisabled }) => (
  <PermissionGate 
    requiredPermissions={`${module}.editar`} 
    showDisabled={showDisabled}
    disabledMessage="Você não tem permissão para editar"
  >
    {children}
  </PermissionGate>
);

/**
 * Gate para ação de exclusão
 */
export const CanDelete: React.FC<{
  module: string;
  children: React.ReactNode;
  showDisabled?: boolean;
}> = ({ module, children, showDisabled }) => (
  <PermissionGate 
    requiredPermissions={`${module}.excluir`} 
    showDisabled={showDisabled}
    disabledMessage="Você não tem permissão para excluir"
  >
    {children}
  </PermissionGate>
);

// Manter compatibilidade com exports antigos
export const AdminOnly = SuperAdminOnly;
export const ManagerOnly = SuperAdminOnly;

export default PermissionGate;
