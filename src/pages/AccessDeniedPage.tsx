// ============================================
// PÁGINA DE ACESSO NEGADO
// ============================================

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX, ArrowLeft, Home, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS } from '@/types/auth';

const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  
  const attemptedPath = (location.state as any)?.from?.pathname || 'desconhecida';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-destructive/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-destructive/10 rounded-full">
              <ShieldX className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl text-destructive">Acesso Negado</CardTitle>
          <CardDescription className="text-base">
            Você não tem permissão para acessar esta página
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
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
                  <span className="font-medium text-foreground">{ROLE_LABELS[user.role]}</span>
                </div>
              </>
            )}
          </div>

          <p className="text-sm text-muted-foreground text-center">
            Se você acredita que deveria ter acesso, entre em contato com o administrador do sistema.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button 
            className="w-full" 
            variant="default"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
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
