// ============================================
// PÁGINA DE CONTROLE DE ACESSO (DEMO)
// ============================================
// Demonstra o uso do sistema de permissões

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGate, AdminOnly, ManagerOnly, DisabledWithPermission } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Users, 
  FileText, 
  Settings, 
  BarChart, 
  CheckCircle, 
  XCircle,
  Lock,
  Unlock,
  Info
} from 'lucide-react';
import { PERMISSION_LABELS, AppPermission } from '@/types/auth';

const ControleAcessoPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut } = useAuth();
  const { 
    hasPermission, 
    getUserRoleLabel,
    isAdmin,
    isManager,
    canManageUsers,
    canManageContent,
    canManageReports,
    canManageSettings,
    canManageProcesses
  } = usePermissions();

  // ============================================
  // RENDERIZAÇÃO PARA NÃO AUTENTICADOS
  // ============================================

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
              </div>
              <CardTitle>Acesso Restrito</CardTitle>
              <CardDescription>
                Faça login para visualizar suas permissões e acessar o sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => navigate('/auth')}>
                Fazer Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // ============================================
  // DADOS DO USUÁRIO
  // ============================================

  const permissionGroups = [
    { 
      title: 'Usuários', 
      icon: Users, 
      permissions: ['users.read', 'users.create', 'users.update', 'users.delete'] as AppPermission[],
      canManage: canManageUsers
    },
    { 
      title: 'Conteúdo', 
      icon: FileText, 
      permissions: ['content.read', 'content.create', 'content.update', 'content.delete'] as AppPermission[],
      canManage: canManageContent
    },
    { 
      title: 'Relatórios', 
      icon: BarChart, 
      permissions: ['reports.view', 'reports.export'] as AppPermission[],
      canManage: canManageReports
    },
    { 
      title: 'Configurações', 
      icon: Settings, 
      permissions: ['settings.view', 'settings.edit'] as AppPermission[],
      canManage: canManageSettings
    },
    { 
      title: 'Processos', 
      icon: Shield, 
      permissions: ['processes.read', 'processes.create', 'processes.update', 'processes.delete', 'processes.approve'] as AppPermission[],
      canManage: canManageProcesses
    }
  ];

  // ============================================
  // RENDERIZAÇÃO PRINCIPAL
  // ============================================

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Controle de Acesso</h1>
          <p className="text-muted-foreground">
            Visualize suas permissões e nível de acesso no sistema
          </p>
        </div>

        {/* Card do usuário */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {user?.fullName || 'Usuário'}
                </CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </div>
              <Badge 
                variant={isAdmin ? 'destructive' : isManager ? 'default' : 'secondary'}
                className="text-sm px-3 py-1"
              >
                {getUserRoleLabel()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Resumo de acesso */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{user?.permissions.length || 0}</div>
                <div className="text-xs text-muted-foreground">Permissões</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-primary">{getUserRoleLabel()}</div>
                <div className="text-xs text-muted-foreground">Nível</div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-center">
                  {isAdmin ? (
                    <Unlock className="h-6 w-6 text-green-500" />
                  ) : (
                    <Lock className="h-6 w-6 text-yellow-500" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isAdmin ? 'Acesso Total' : 'Acesso Limitado'}
                </div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-center">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div className="text-xs text-muted-foreground">Ativo</div>
              </div>
            </div>

            <Separator />

            {/* Grupos de permissões */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Suas Permissões por Categoria</h3>
              
              <div className="grid gap-4">
                {permissionGroups.map((group) => (
                  <div key={group.title} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <group.icon className="h-5 w-5 text-primary" />
                        <span className="font-medium">{group.title}</span>
                      </div>
                      <Badge variant={group.canManage ? 'default' : 'outline'}>
                        {group.canManage ? 'Gerenciamento Completo' : 'Acesso Parcial'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.permissions.map((permission) => (
                        <div
                          key={permission}
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                            hasPermission(permission)
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {hasPermission(permission) ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : (
                            <XCircle className="h-3 w-3" />
                          )}
                          {PERMISSION_LABELS[permission]}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demonstração de PermissionGate */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" />
              Demonstração de Componentes
            </CardTitle>
            <CardDescription>
              Exemplos práticos do sistema de controle de acesso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* AdminOnly */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">AdminOnly - Visível apenas para Admins:</h4>
              <AdminOnly fallback={
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertTitle>Conteúdo exclusivo para Administradores</AlertTitle>
                  <AlertDescription>
                    Esta área contém opções avançadas de configuração do sistema.
                  </AlertDescription>
                </Alert>
              }>
                <Alert className="border-green-500 bg-green-50 dark:bg-green-900/20">
                  <Unlock className="h-4 w-4 text-green-500" />
                  <AlertTitle className="text-green-700 dark:text-green-400">Área Administrativa</AlertTitle>
                  <AlertDescription className="text-green-600 dark:text-green-300">
                    Você tem acesso total ao sistema. Aqui você pode gerenciar usuários, configurações e mais.
                  </AlertDescription>
                </Alert>
              </AdminOnly>
            </div>

            <Separator />

            {/* ManagerOnly */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">ManagerOnly - Visível para Gerentes e Admins:</h4>
              <ManagerOnly fallback={
                <Alert>
                  <Lock className="h-4 w-4" />
                  <AlertTitle>Conteúdo para Gerentes</AlertTitle>
                  <AlertDescription>
                    Esta área é destinada a gerentes e administradores.
                  </AlertDescription>
                </Alert>
              }>
                <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                  <Unlock className="h-4 w-4 text-blue-500" />
                  <AlertTitle className="text-blue-700 dark:text-blue-400">Área de Gerenciamento</AlertTitle>
                  <AlertDescription className="text-blue-600 dark:text-blue-300">
                    Você pode aprovar processos e gerenciar equipes nesta área.
                  </AlertDescription>
                </Alert>
              </ManagerOnly>
            </div>

            <Separator />

            {/* DisabledWithPermission */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">DisabledWithPermission - Botões desabilitados por permissão:</h4>
              <div className="flex flex-wrap gap-2">
                <DisabledWithPermission 
                  requiredPermissions="users.delete"
                  disabledMessage="Você não tem permissão para excluir usuários"
                >
                  <Button variant="destructive" size="sm">
                    Excluir Usuário
                  </Button>
                </DisabledWithPermission>

                <DisabledWithPermission 
                  requiredPermissions="settings.edit"
                  disabledMessage="Você não tem permissão para editar configurações"
                >
                  <Button variant="outline" size="sm">
                    Editar Configurações
                  </Button>
                </DisabledWithPermission>

                <DisabledWithPermission 
                  requiredPermissions="processes.approve"
                  disabledMessage="Você não tem permissão para aprovar processos"
                >
                  <Button variant="default" size="sm">
                    Aprovar Processo
                  </Button>
                </DisabledWithPermission>
              </div>
            </div>

            <Separator />

            {/* PermissionGate com permissão específica */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">PermissionGate - Baseado em permissão específica:</h4>
              <PermissionGate 
                requiredPermissions="reports.export"
                fallback={
                  <Button variant="outline" disabled className="opacity-50">
                    <BarChart className="mr-2 h-4 w-4" />
                    Exportar Relatório (sem permissão)
                  </Button>
                }
              >
                <Button variant="outline">
                  <BarChart className="mr-2 h-4 w-4" />
                  Exportar Relatório
                </Button>
              </PermissionGate>
            </div>
          </CardContent>
        </Card>

        {/* Botões de ação */}
        <div className="flex flex-wrap justify-center gap-4">
          <AdminOnly>
            <Button onClick={() => navigate('/admin/usuarios')}>
              <Users className="mr-2 h-4 w-4" />
              Gerenciar Usuários
            </Button>
          </AdminOnly>
          <Button variant="outline" onClick={() => navigate('/sistema')}>
            Ir para o Sistema
          </Button>
          <Button variant="destructive" onClick={() => signOut()}>
            Sair
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default ControleAcessoPage;
