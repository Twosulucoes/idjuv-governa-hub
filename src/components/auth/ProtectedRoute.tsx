import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC<any> = ({ children }) => {
  const { user, isLoading, isAuthenticated, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 1. Se não autenticado, login
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 2. BYPASS TOTAL PARA O SEU E-MAIL
  // Se for você, ele entra em qualquer lugar, ignorando erros de RPC ou módulo
  if (user?.email === 'handfabiano@gmail.com' || isSuperAdmin) {
    return <>{children}</>;
  }

  // 3. Se for usuário comum e cair aqui, redireciona para acesso negado
  return <Navigate to="/acesso-negado" replace />;
};

export default ProtectedRoute;
