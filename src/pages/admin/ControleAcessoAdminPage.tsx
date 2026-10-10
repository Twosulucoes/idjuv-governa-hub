// ============================================
// PÁGINA DE CONTROLE DE ACESSO (DENTRO DO ADMIN)
// ============================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ModuleLayout } from '@/components/layout';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionGate, AdminOnly, ManagerOnly, DisabledWithPermission } from '@/components/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader, StatusBadge } from '@/components/design-system';
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

const ControleAcessoAdminPage: React.FC = () => {
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

  // Redirect to auth if not authenticated
  if (!isAuthenticated) {
    navigate('/auth');
    return null;
  }

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

  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: 'Administração', href: '/admin' }, { rotulo: 'Controle de acesso' }]}
          titulo="Controle de acesso"
          descricao="Visualize suas permissões e nível de acesso no sistema"
        />

        {/* Card do usuário */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" aria-hidden="true" />
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
                    <Unlock className="h-6 w-6 text-success" aria-hidden="true" />
                  ) : (
                    <Lock className="h-6 w-6 text-warning" aria-hidden="true" />
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isAdmin ? 'Acesso total' : 'Acesso limitado'}
                </div>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="flex justify-center">
                  <CheckCircle className="h-6 w-6 text-success" aria-hidden="true" />
                </div>
                <div className="text-xs text-muted-foreground">Ativo</div>
              </div>
            </div>

            <Separator />

            {/* Grupos de permissões */}
            <div className="space-y-4">
              <h2 className="text-h3 text-foreground">Suas permissões por categoria</h2>
              
              <div className="grid gap-4">
                {permissionGroups.map((group) => (
                  <div key={group.title} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <group.icon className="h-5 w-5 text-primary" aria-hidden="true" />
                        <span className="font-medium">{group.title}</span>
                      </div>
                      <Badge variant={group.canManage ? 'default' : 'outline'}>
                        {group.canManage ? 'Gerenciamento completo' : 'Acesso parcial'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {group.permissions.map((permission) => (
                        <StatusBadge
                          key={permission}
                          tom={hasPermission(permission) ? 'sucesso' : 'erro'}
                          icone={false}
                        >
                          {hasPermission(permission) ? (
                            <CheckCircle className="h-3 w-3" aria-hidden="true" />
                          ) : (
                            <XCircle className="h-3 w-3" aria-hidden="true" />
                          )}
                          {PERMISSION_LABELS[permission]}
                          <span className="sr-only">
                            {hasPermission(permission) ? ' (concedida)' : ' (não concedida)'}
                          </span>
                        </StatusBadge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demonstração de PermissionGate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" aria-hidden="true" />
              Demonstração de componentes
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
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  <AlertTitle>Conteúdo exclusivo para Administradores</AlertTitle>
                  <AlertDescription>
                    Esta área contém opções avançadas de configuração do sistema.
                  </AlertDescription>
                </Alert>
              }>
                <Alert className="border-success bg-success/10">
                  <Unlock className="h-4 w-4 text-success" aria-hidden="true" />
                  <AlertTitle className="text-success">Área administrativa</AlertTitle>
                  <AlertDescription className="text-foreground">
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
                  <Lock className="h-4 w-4" aria-hidden="true" />
                  <AlertTitle>Conteúdo para Gerentes</AlertTitle>
                  <AlertDescription>
                    Esta área é destinada a gerentes e administradores.
                  </AlertDescription>
                </Alert>
              }>
                <Alert className="border-info bg-info/10">
                  <Unlock className="h-4 w-4 text-info" aria-hidden="true" />
                  <AlertTitle className="text-info">Área de gerenciamento</AlertTitle>
                  <AlertDescription className="text-foreground">
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
                    Excluir usuário
                  </Button>
                </DisabledWithPermission>

                <DisabledWithPermission 
                  requiredPermissions="settings.edit"
                  disabledMessage="Você não tem permissão para editar configurações"
                >
                  <Button variant="outline" size="sm">
                    Editar configurações
                  </Button>
                </DisabledWithPermission>

                <DisabledWithPermission 
                  requiredPermissions="processes.approve"
                  disabledMessage="Você não tem permissão para aprovar processos"
                >
                  <Button variant="default" size="sm">
                    Aprovar processo
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
                    <BarChart className="mr-2 h-4 w-4" aria-hidden="true" />
                    Exportar relatório (sem permissão)
                  </Button>
                }
              >
                <Button variant="outline">
                  <BarChart className="mr-2 h-4 w-4" aria-hidden="true" />
                  Exportar relatório
                </Button>
              </PermissionGate>
            </div>
          </CardContent>
        </Card>

        {/* Botões de ação */}
        <div className="flex flex-wrap gap-4">
          <AdminOnly>
            <Button onClick={() => navigate('/admin/usuarios')}>
              <Users className="mr-2 h-4 w-4" aria-hidden="true" />
              Gerenciar usuários
            </Button>
          </AdminOnly>
          <Button variant="destructive" onClick={() => signOut()}>
            Sair
          </Button>
        </div>
      </div>
    </ModuleLayout>
  );
};

export default ControleAcessoAdminPage;
