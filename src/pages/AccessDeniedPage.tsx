// ============================================
// PÁGINA DE ACESSO NEGADO
// ============================================

import React from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX, ArrowLeft, Home, LogIn, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  
  const attemptedPath = (location.state as any)?.from?.pathname || 'desconhecida';
  const reason = searchParams.get('reason');
  
  const isNoModules = reason === 'no-modules';
  const isBlocked = reason === 'blocked';

  const iconColor = isNoModules ? 'text-amber-500' : 'text-destructive';
  const bgColor = isNoModules ? 'bg-amber-500/10' : 'bg-destructive/10';
  
  const title = isBlocked 
    ? 'Conta Bloqueada' 
    : isNoModules 
    ? 'Nenhum Módulo Atribuído' 
    : 'Acesso Negado';

  const description = isBlocked
    ? 'Sua conta foi desativada por um administrador. Entre em contato com o suporte.'
    : isNoModules 
    ? 'Seu usuário ainda não possui módulos de acesso atribuídos'
    : 'Você não tem permissão para acessar esta página';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className={`p-4 rounded-full ${bgColor}`}>
              {isNoModules ? (
                <Package className={`h-12 w-12 ${iconColor}`} />
              ) : (
                <ShieldX className={`h-12 w-12 ${iconColor}`} />
              )}
            </div>
          </div>
          <CardTitle className={`text-2xl ${iconColor}`}>
            {title}
          </CardTitle>
          <CardDescription className="text-base">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {isBlocked && isAuthenticated && user && (
            <div className="bg-destructive/10 rounded-lg p-4 space-y-2 border border-destructive/20">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Usuário:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Entre em contato com o administrador do sistema para reativar sua conta.
              </p>
            </div>
          )}

          {!isNoModules && !isBlocked && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Página solicitada:</span>
                <span className="font-medium text-foreground">{attemptedPath}</span>
              </div>
              {isAuthenticated && user && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Usuário:</span>
                    <span className="font-medium text-foreground">{user.email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Nível de acesso:</span>
                    <span className="font-medium text-foreground">{user.isSuperAdmin ? 'Admin' : 'Usuário'}</span>
                  </div>
                </>
              )}
            </div>
          )}

          {isNoModules && isAuthenticated && user && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Usuário:</span>
                <span className="font-medium text-foreground">{user.email}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                Aguarde a atribuição de módulos pelo administrador do sistema para acessar as funcionalidades.
              </p>
            </div>
          )}

          <p className="text-sm text-muted-foreground text-center">
            {isBlocked
              ? 'Conta temporariamente desativada. Contate o administrador.'
              : isNoModules 
              ? 'Entre em contato com o administrador para solicitar acesso aos módulos necessários.'
              : 'Se você acredita que deveria ter acesso, entre em contato com o administrador do sistema.'
            }
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          {!isNoModules && !isBlocked && (
            <Button 
              className="w-full" 
              variant="default"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          )}
          
          <div className="flex gap-2 w-full">
            <Button 
              className="flex-1" 
              variant="outline"
              onClick={() => navigate('/')}
            >
              <Home className="mr-2 h-4 w-4" />
              Início
            </Button>
            
            {!isAuthenticated && (
              <Button 
                className="flex-1" 
                variant="outline"
                onClick={() => navigate('/auth')}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Entrar
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AccessDeniedPage;
