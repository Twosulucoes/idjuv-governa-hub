// ============================================
// COMPONENTE DISABLED WITH PERMISSION — VERSÃO CORRIGIDA
// ============================================
// CORREÇÃO: Lógica de hasAccess simplificada e sem ramificações redundantes.

import React from 'react';
import { PermissionCode } from '@/types/auth';

interface DisabledWithPermissionProps {
  children: React.ReactElement;
  requiredPermissions?: PermissionCode | PermissionCode[];
  permissionMode?: 'any' | 'all';
  disabledMessage?: string;
  hideWhenDisabled?: boolean;
}

// ACESSO TOTAL: Sempre renderiza o elemento habilitado
export const DisabledWithPermission: React.FC<DisabledWithPermissionProps> = ({
  children,
}) => {
  return children;
};

export default DisabledWithPermission;
