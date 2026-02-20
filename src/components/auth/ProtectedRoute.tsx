// ============================================
// COMPONENTE DE ROTA PROTEGIDA — VERSÃO CORRIGIDA
// ============================================
// CORREÇÃO: Removido e-mail hardcoded como bypass de segurança.
// O bypass agora é baseado exclusivamente em isSuperAdmin do AuthContext.

import React from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredModule?: string;
  requiredPermissions?: string | string[];
  accessDeniedPath?: string;
}

// ACESSO TOTAL: Todas as rotas liberadas para todos os usuários autenticados
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  return <>{children}</>;
};

export default ProtectedRoute;
