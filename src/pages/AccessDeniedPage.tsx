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
  
  // Verifica se é caso de "sem módulos"
  const isNoModules = reason === 'no-modules';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className={`p-4 rounded-full ${isNoModules ? 'bg-warning/10' : 'bg-destructive/10'}`}>
              {isNoModules ? (
                <Package className="h-12 w-12 text-warning" />
              ) : (
                <ShieldX className="h-12 w-12 text-destructive" />
              )}
            </div>
          </div>
          <CardTitle className={`text-2xl ${isNoModules ? 'text-warning' : 'text-destructive'}`}>
            {isNoModules ? 'Nenhum Módulo Atribuído' : 'Acesso Negado'}
          </CardTitle>
          <CardDescription className="text-base">
            {isNoModules 
              ? 'Seu usuário ainda não possui módulos de acesso atribuídos'
              : 'Você não tem permissão para acessar esta página'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {!isNoModules && (
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
                    <span className="font-medium text-foreground">{user.isSuperAdmin ? 'Super Administrador' : 'Usuário'}</span>
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
            {isNoModules 
              ? 'Entre em contato com o administrador para solicitar acesso aos módulos necessários.'
              : 'Se você acredita que deveria ter acesso, entre em contato com o administrador do sistema.'
            }
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          {!isNoModules && (
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
