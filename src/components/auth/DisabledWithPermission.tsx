// ============================================
// COMPONENTE DISABLED WITH PERMISSION
// ============================================
// Desabilita elementos baseado em permissões
// Adiciona tooltip explicativo

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole, AppPermission } from '@/types/auth';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DisabledWithPermissionProps {
  children: React.ReactElement;
  
  // Roles permitidos
  allowedRoles?: AppRole | AppRole[];
  
  // Permissões requeridas
  requiredPermissions?: AppPermission | AppPermission[];
  
  // Modo de verificação
  permissionMode?: 'any' | 'all';
  
  // Mensagem do tooltip quando desabilitado
  disabledMessage?: string;
  
  // Se true, esconde o elemento ao invés de desabilitar
  hideWhenDisabled?: boolean;
}

export const DisabledWithPermission: React.FC<DisabledWithPermissionProps> = ({
  children,
  allowedRoles,
  requiredPermissions,
  permissionMode = 'all',
  disabledMessage = 'Você não tem permissão para esta ação',
  hideWhenDisabled = false
}) => {
  const { 
    user, 
    isAuthenticated, 
    hasAnyRole, 
    hasAnyPermission, 
    hasAllPermissions 
  } = useAuth();

  // ============================================
  // VERIFICAÇÕES
  // ============================================

  let hasAccess = isAuthenticated;

  // Verificar roles
  if (hasAccess && allowedRoles && user) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    hasAccess = user.role === 'admin' || hasAnyRole(roles);
  }

  // Verificar permissões
  if (hasAccess && requiredPermissions && user) {
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    
    if (permissionMode === 'any') {
      hasAccess = hasAnyPermission(permissions);
    } else {
      hasAccess = hasAllPermissions(permissions);
    }
  }

  // ============================================
  // RENDERIZAÇÃO
  // ============================================

  // Se não tem acesso e deve esconder
  if (!hasAccess && hideWhenDisabled) {
    return null;
  }

  // Se tem acesso, renderiza normalmente
  if (hasAccess) {
    return children;
  }

  // Sem acesso: desabilitar e adicionar tooltip
  const disabledChild = React.cloneElement(children, {
    disabled: true,
    className: `${children.props.className || ''} opacity-50 cursor-not-allowed`,
    onClick: (e: React.MouseEvent) => e.preventDefault()
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-block">
          {disabledChild}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{disabledMessage}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default DisabledWithPermission;
