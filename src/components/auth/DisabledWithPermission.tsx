// ============================================
// COMPONENTE DISABLED WITH PERMISSION — VERSÃO CORRIGIDA
// ============================================
// CORREÇÃO: Lógica de hasAccess simplificada e sem ramificações redundantes.

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionCode } from '@/types/auth';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface DisabledWithPermissionProps {
  children: React.ReactElement;
  requiredPermissions?: PermissionCode | PermissionCode[];
  permissionMode?: 'any' | 'all';
  disabledMessage?: string;
  hideWhenDisabled?: boolean;
}

export const DisabledWithPermission: React.FC<DisabledWithPermissionProps> = ({
  children,
  requiredPermissions,
  permissionMode = 'all',
  disabledMessage = 'Você não tem permissão para esta ação',
  hideWhenDisabled = false,
}) => {
  const { isAuthenticated, isSuperAdmin, hasAnyPermission, hasAllPermissions } = useAuth();

  // ✅ CORREÇÃO: Fluxo linear sem ramificações redundantes.
  const resolveAccess = (): boolean => {
    if (!isAuthenticated) return false;
    if (isSuperAdmin) return true;

    if (!requiredPermissions) return true;

    const permissions = Array.isArray(requiredPermissions)
      ? requiredPermissions
      : [requiredPermissions];

    return permissionMode === 'any'
      ? hasAnyPermission(permissions)
      : hasAllPermissions(permissions);
  };

  const hasAccess = resolveAccess();

  if (!hasAccess && hideWhenDisabled) return null;

  if (hasAccess) return children;

  const disabledChild = React.cloneElement(children, {
    disabled: true,
    className: `${children.props.className ?? ''} opacity-50 cursor-not-allowed`,
    onClick: (e: React.MouseEvent) => e.preventDefault(),
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-block">{disabledChild}</span>
      </TooltipTrigger>
      <TooltipContent>
        <p>{disabledMessage}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default DisabledWithPermission;
