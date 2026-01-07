// ============================================
// COMPONENTE PERMISSION GATE
// ============================================
// Mostra/oculta elementos baseado em permissões
// Suporta fallback e modo de renderização

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole, AppPermission } from '@/types/auth';

interface PermissionGateProps {
  children: React.ReactNode;
  
  // Roles permitidos (aceita único ou array)
  allowedRoles?: AppRole | AppRole[];
  
  // Permissões requeridas
  requiredPermissions?: AppPermission | AppPermission[];
  
  // Modo de verificação: 'any' ou 'all'
  permissionMode?: 'any' | 'all';
  
  // Componente a exibir quando sem permissão
  fallback?: React.ReactNode;
  
  // Se true, inverte a lógica (mostra quando NÃO tem permissão)
  inverse?: boolean;
  
  // Requer autenticação
  requireAuth?: boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  allowedRoles,
  requiredPermissions,
  permissionMode = 'all',
  fallback = null,
  inverse = false,
  requireAuth = true
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

  // Verificar autenticação
  if (requireAuth && !isAuthenticated) {
    return inverse ? <>{children}</> : <>{fallback}</>;
  }

  let hasAccess = true;

  // Verificar roles
  if (allowedRoles && user) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    // Admin sempre tem acesso
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

  // Aplicar inversão se necessário
  if (inverse) {
    hasAccess = !hasAccess;
  }

  // ============================================
  // RENDERIZAÇÃO
  // ============================================

  return hasAccess ? <>{children}</> : <>{fallback}</>;
};

// ============================================
// COMPONENTES AUXILIARES
// ============================================

// Componente para mostrar conteúdo apenas para admins
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate allowedRoles="admin" fallback={fallback}>
    {children}
  </PermissionGate>
);

// Componente para mostrar conteúdo para gerentes e admins
export const ManagerOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate allowedRoles={['admin', 'manager']} fallback={fallback}>
    {children}
  </PermissionGate>
);

// Componente para mostrar conteúdo apenas para usuários autenticados
export const AuthenticatedOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback 
}) => (
  <PermissionGate requireAuth={true} fallback={fallback}>
    {children}
  </PermissionGate>
);

// Componente para mostrar conteúdo apenas para não autenticados
export const GuestOnly: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PermissionGate requireAuth={false} inverse={true}>
    {children}
  </PermissionGate>
);

export default PermissionGate;
